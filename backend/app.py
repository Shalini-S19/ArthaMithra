"""ArthaMitra backend: Flask API + serves the frontend folder (no CORS needed)."""
import json
import os
import re
from datetime import date, timedelta

from flask import Flask, jsonify, request, session
from werkzeug.security import check_password_hash, generate_password_hash

import db
import matcher
import scoring
from messages import CATEGORY_LABELS, INCOME_NOTE, MESSAGES, TIPS, localize

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
FRONTEND_DIR = os.path.join(BASE_DIR, "..", "frontend")

app = Flask(__name__, static_folder=FRONTEND_DIR, static_url_path="")
# Set SECRET_KEY in the environment on the server. The fallback is for local dev only.
app.secret_key = os.environ.get("SECRET_KEY", "dev-only-change-me")
app.json.ensure_ascii = False
app.config.update(SESSION_COOKIE_HTTPONLY=True, SESSION_COOKIE_SAMESITE="Lax")
app.teardown_appcontext(db.close_db)

SCHEMES = matcher.load_schemes()
with open(os.path.join(BASE_DIR, "lessons.json"), encoding="utf-8") as _f:
    LESSONS = json.load(_f)["lessons"]
SCHEME_IDS = {s["id"] for s in SCHEMES}


# ---------- helpers ----------
def get_lang():
    """Language for this request: ?lang=kn|en, else the logged-in user's language, else English."""
    lang = request.args.get("lang")
    if lang in ("en", "kn"):
        return lang
    return session.get("lang", "en")


def err(code, status=400):
    """Error reply in both languages. `error` is in the request language; error_en / error_kn are always there."""
    en, kn = MESSAGES[code]
    return jsonify({"error": kn if get_lang() == "kn" else en,
                    "error_en": en, "error_kn": kn, "code": code}), status


def reply(data):
    """JSON reply. With ?lang=kn or ?lang=en, every English/Kannada pair becomes one string."""
    lang = request.args.get("lang")
    if lang in ("en", "kn"):
        data = localize(data, lang)
    return jsonify(data)


def present_scheme(s, **extra):
    d = dict(s, **extra)
    d["category_label"] = CATEGORY_LABELS.get(s.get("category"), {"en": s.get("category", ""), "kn": s.get("category", "")})
    return d


def current_user():
    uid = session.get("user_id")
    if not uid:
        return None
    return db.get_db().execute("SELECT * FROM users WHERE id = ?", (uid,)).fetchone()


def login_required(fn):
    from functools import wraps

    @wraps(fn)
    def wrapper(*a, **k):
        if not current_user():
            return err("login_required", 401)
        return fn(*a, **k)
    return wrapper


def to_int(v):
    try:
        return int(v)
    except (TypeError, ValueError):
        return None


def public_user(u):
    d = dict(u)
    d.pop("pin_hash", None)
    return d


# ---------- pages ----------
@app.route("/")
def index():
    return app.send_static_file("index.html")


# ---------- auth ----------
@app.post("/api/register")
def register():
    d = request.get_json(silent=True) or {}
    name = (d.get("name") or "").strip()
    phone = re.sub(r"\D", "", str(d.get("phone") or ""))[-10:]
    pin = str(d.get("pin") or "")
    if not name:
        return err("name_required")
    if len(phone) != 10:
        return err("phone_invalid")
    if not re.fullmatch(r"\d{4}", pin):
        return err("pin_invalid")
    lang = d.get("language", "en")
    if lang not in ("en", "kn"):
        return err("lang_invalid")
    age = to_int(d.get("age"))
    if age is not None and not (0 < age < 120):
        return err("age_invalid")
    gender = d.get("gender")
    if gender not in (None, "female", "male", "other"):
        return err("gender_invalid")

    conn = db.get_db()
    if conn.execute("SELECT 1 FROM users WHERE phone = ?", (phone,)).fetchone():
        return err("phone_taken", 409)
    cur = conn.execute(
        """INSERT INTO users (name, phone, pin_hash, language, age, gender, occupation,
                              family_size, has_bank_account, has_insurance, household_code)
           VALUES (?,?,?,?,?,?,?,?,?,?,?)""",
        (name, phone, generate_password_hash(pin), lang, age, gender,
         d.get("occupation"), to_int(d.get("family_size")),
         1 if d.get("has_bank_account") else 0,
         1 if d.get("has_insurance") else 0,
         d.get("household_code")),
    )
    conn.commit()
    session["user_id"] = cur.lastrowid
    session["lang"] = lang
    return jsonify({"ok": True, "user": public_user(current_user())}), 201


@app.post("/api/login")
def login():
    d = request.get_json(silent=True) or {}
    phone = re.sub(r"\D", "", str(d.get("phone") or ""))[-10:]
    pin = str(d.get("pin") or "")
    u = db.get_db().execute("SELECT * FROM users WHERE phone = ?", (phone,)).fetchone()
    if not u or not check_password_hash(u["pin_hash"], pin):
        return err("login_failed", 401)
    session["user_id"] = u["id"]
    session["lang"] = u["language"]
    return jsonify({"ok": True, "user": public_user(u)})


@app.post("/api/logout")
def logout():
    session.clear()
    return jsonify({"ok": True})


@app.get("/api/me")
@login_required
def me():
    return jsonify(public_user(current_user()))


@app.patch("/api/me")
@login_required
def update_me():
    """Update profile fields that affect scheme matching."""
    d = request.get_json(silent=True) or {}
    u = current_user()
    fields = {}
    if "language" in d and d["language"] in ("en", "kn"):
        fields["language"] = d["language"]
    if "age" in d:
        a = to_int(d["age"])
        if a is None or not (0 < a < 120):
            return err("age_invalid")
        fields["age"] = a
    if "gender" in d and d["gender"] in ("female", "male", "other"):
        fields["gender"] = d["gender"]
    for flag in ("has_bank_account", "has_insurance"):
        if flag in d:
            fields[flag] = 1 if d[flag] else 0
    for k in ("occupation", "household_code"):
        if k in d:
            fields[k] = d[k]
    if "family_size" in d:
        fields["family_size"] = to_int(d["family_size"])
    if not fields:
        return err("nothing_to_update")
    sets = ", ".join(f"{k} = ?" for k in fields)  # keys come from the whitelist above
    conn = db.get_db()
    conn.execute(f"UPDATE users SET {sets} WHERE id = ?", (*fields.values(), u["id"]))
    conn.commit()
    if "language" in fields:
        session["lang"] = fields["language"]
    return jsonify({"ok": True, "user": public_user(current_user())})


# ---------- earnings and expenses ----------
@app.post("/api/entries")
@login_required
def add_entry():
    d = request.get_json(silent=True) or {}
    etype = d.get("type")
    if etype not in ("income", "expense"):
        return err("entry_type_invalid")
    try:
        amount = float(d.get("amount"))
    except (TypeError, ValueError):
        return err("amount_not_number")
    if amount <= 0 or amount > 10_000_000:
        return err("amount_positive")
    day = d.get("date") or date.today().isoformat()
    try:
        date.fromisoformat(day)
    except ValueError:
        return err("date_invalid")
    conn = db.get_db()
    cur = conn.execute(
        "INSERT INTO entries (user_id, type, amount, category, note, date) VALUES (?,?,?,?,?,?)",
        (session["user_id"], etype, amount, d.get("category"), d.get("note"), day),
    )
    conn.commit()
    return jsonify({"ok": True, "id": cur.lastrowid}), 201


@app.get("/api/entries")
@login_required
def list_entries():
    days = to_int(request.args.get("days")) or 7
    since = (date.today() - timedelta(days=days - 1)).isoformat()
    rows = db.get_db().execute(
        "SELECT id, type, amount, category, note, date FROM entries "
        "WHERE user_id = ? AND date >= ? ORDER BY date DESC, id DESC",
        (session["user_id"], since),
    ).fetchall()
    return jsonify([dict(r) for r in rows])


def _totals(uid, start, end):
    rows = db.get_db().execute(
        "SELECT type, COALESCE(SUM(amount),0) AS total FROM entries "
        "WHERE user_id = ? AND date BETWEEN ? AND ? GROUP BY type",
        (uid, start.isoformat(), end.isoformat()),
    ).fetchall()
    t = {r["type"]: r["total"] for r in rows}
    earned, spent = t.get("income", 0), t.get("expense", 0)
    return {"earned": earned, "spent": spent, "saved": earned - spent,
            "from": start.isoformat(), "to": end.isoformat()}


@app.get("/api/summary")
@login_required
def summary():
    """Weekly (Mon-Sun) totals, not monthly: income is irregular."""
    today = date.today()
    this_start = today - timedelta(days=today.weekday())
    last_start = this_start - timedelta(days=7)
    uid = session["user_id"]
    return jsonify({
        "this_week": _totals(uid, this_start, today),
        "last_week": _totals(uid, last_start, this_start - timedelta(days=1)),
    })


# ---------- schemes ----------
def monthly_income(uid):
    """Income logged in the last 30 days, or None if nothing logged yet."""
    since = (date.today() - timedelta(days=29)).isoformat()
    r = db.get_db().execute(
        "SELECT SUM(amount) AS s, COUNT(*) AS n FROM entries "
        "WHERE user_id = ? AND type = 'income' AND date >= ?", (uid, since)
    ).fetchone()
    return r["s"] if r["n"] else None


@app.get("/api/schemes")
def all_schemes():
    return reply([present_scheme(x) for x in SCHEMES])


def applied_ids(uid):
    rows = db.get_db().execute(
        "SELECT scheme_id FROM scheme_applications WHERE user_id = ?", (uid,)).fetchall()
    return {r["scheme_id"] for r in rows}


def matched_for(u):
    """Return (monthly_income, matched schemes) for a user row."""
    profile = dict(u)
    profile["monthly_income"] = monthly_income(u["id"])
    return profile["monthly_income"], matcher.match_all(profile, SCHEMES)


@app.get("/api/schemes/matches")
@login_required
def scheme_matches():
    u = current_user()
    income, found = matched_for(u)
    done = applied_ids(u["id"])
    out = [present_scheme(s, applied=(s["id"] in done)) for s in found]
    return reply({
        "monthly_income": income,
        "income_note": None if income is not None else INCOME_NOTE,
        "matches": out,
    })


@app.post("/api/schemes/<scheme_id>/applied")
@login_required
def mark_applied(scheme_id):
    if scheme_id not in SCHEME_IDS:
        return err("unknown_scheme", 404)
    conn = db.get_db()
    conn.execute("INSERT OR IGNORE INTO scheme_applications (user_id, scheme_id) VALUES (?,?)",
                 (session["user_id"], scheme_id))
    conn.commit()
    return jsonify({"ok": True, "scheme_id": scheme_id, "applied": True})


@app.delete("/api/schemes/<scheme_id>/applied")
@login_required
def unmark_applied(scheme_id):
    conn = db.get_db()
    conn.execute("DELETE FROM scheme_applications WHERE user_id = ? AND scheme_id = ?",
                 (session["user_id"], scheme_id))
    conn.commit()
    return jsonify({"ok": True, "scheme_id": scheme_id, "applied": False})


# ---------- savings goals ----------
def goal_view(row):
    g = dict(row)
    g["percent"] = min(100, round(100 * g["saved"] / g["target"])) if g["target"] else 0
    g["days_left"] = None
    status = "on_track"
    if g["saved"] >= g["target"]:
        status = "completed"
    elif g["deadline"]:
        try:
            g["days_left"] = (date.fromisoformat(g["deadline"]) - date.today()).days
            if g["days_left"] < 0:
                status = "overdue"
            elif g["days_left"] <= 7:
                status = "due_soon"
        except ValueError:
            pass
    g["status"] = status      # completed | overdue | due_soon | on_track
    return g


def get_goal(goal_id):
    return db.get_db().execute(
        "SELECT * FROM goals WHERE id = ? AND user_id = ?", (goal_id, session["user_id"])).fetchone()


@app.post("/api/goals")
@login_required
def create_goal():
    d = request.get_json(silent=True) or {}
    title = (d.get("title") or "").strip()
    if not title:
        return err("goal_title_required")
    try:
        target = float(d.get("target"))
    except (TypeError, ValueError):
        return err("target_not_number")
    if target <= 0 or target > 10_000_000:
        return err("target_positive")
    deadline = d.get("deadline") or None
    if deadline:
        try:
            date.fromisoformat(deadline)
        except ValueError:
            return err("deadline_invalid")
    conn = db.get_db()
    cur = conn.execute("INSERT INTO goals (user_id, title, target, deadline) VALUES (?,?,?,?)",
                       (session["user_id"], title, target, deadline))
    conn.commit()
    return jsonify(goal_view(get_goal(cur.lastrowid))), 201


@app.get("/api/goals")
@login_required
def list_goals():
    rows = db.get_db().execute(
        "SELECT * FROM goals WHERE user_id = ? ORDER BY id DESC", (session["user_id"],)).fetchall()
    return jsonify([goal_view(r) for r in rows])


@app.post("/api/goals/<int:goal_id>/contribute")
@login_required
def contribute(goal_id):
    if not get_goal(goal_id):
        return err("goal_not_found", 404)
    d = request.get_json(silent=True) or {}
    try:
        amount = float(d.get("amount"))
    except (TypeError, ValueError):
        return err("amount_not_number")
    if amount <= 0 or amount > 10_000_000:
        return err("amount_positive")
    conn = db.get_db()
    conn.execute("UPDATE goals SET saved = saved + ? WHERE id = ? AND user_id = ?",
                 (amount, goal_id, session["user_id"]))
    conn.commit()
    return jsonify(goal_view(get_goal(goal_id)))


@app.delete("/api/goals/<int:goal_id>")
@login_required
def delete_goal(goal_id):
    if not get_goal(goal_id):
        return err("goal_not_found", 404)
    conn = db.get_db()
    conn.execute("DELETE FROM goals WHERE id = ? AND user_id = ?", (goal_id, session["user_id"]))
    conn.commit()
    return jsonify({"ok": True})


# ---------- health score ----------
@app.get("/api/score")
@login_required
def health_score():
    u = current_user()
    uid = u["id"]
    since = (date.today() - timedelta(days=6)).isoformat()
    conn = db.get_db()
    rows = conn.execute(
        "SELECT type, COALESCE(SUM(amount),0) AS total FROM entries "
        "WHERE user_id = ? AND date >= ? GROUP BY type", (uid, since)).fetchall()
    t = {r["type"]: r["total"] for r in rows}
    days = conn.execute(
        "SELECT COUNT(DISTINCT date) AS n FROM entries WHERE user_id = ? AND date >= ?",
        (uid, since)).fetchone()["n"]
    _, found = matched_for(u)
    matched_ids = {s["id"] for s in found}
    applied = len(matched_ids & applied_ids(uid))
    result = scoring.compute_score(t.get("income", 0), t.get("expense", 0),
                                   days, applied, len(matched_ids))
    result["tip_text"] = TIPS[result["tip"]]
    return reply(result)


# ---------- lessons ----------
@app.get("/api/lessons")
def lessons():
    return reply(LESSONS)


# ---------- demo data (Render free tier loses files) ----------
def seed_demo():
    """Create a demo user + a week of entries. Enabled with DEMO_SEED=1."""
    conn = db.get_db()
    if conn.execute("SELECT 1 FROM users WHERE phone = '9999999999'").fetchone():
        return
    cur = conn.execute(
        """INSERT INTO users (name, phone, pin_hash, language, age, gender, occupation,
                              family_size, has_bank_account, has_insurance)
           VALUES ('Demo User','9999999999',?,'en',32,'female','Daily wage worker',4,1,0)""",
        (generate_password_hash("1234"),),
    )
    uid = cur.lastrowid
    today = date.today()
    sample = [(0, "income", 600), (1, "income", 450), (2, "income", 0), (3, "income", 700),
              (4, "income", 500), (0, "expense", 250), (1, "expense", 300), (3, "expense", 200)]
    for back, typ, amt in sample:
        if amt:
            conn.execute("INSERT INTO entries (user_id,type,amount,category,date) VALUES (?,?,?,?,?)",
                         (uid, typ, amt, "demo", (today - timedelta(days=back)).isoformat()))
    conn.commit()


db.init_db()
if os.environ.get("DEMO_SEED") == "1":
    with app.app_context():
        seed_demo()

if __name__ == "__main__":
    app.run(debug=True, port=5000)
