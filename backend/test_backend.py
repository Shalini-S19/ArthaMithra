"""Run: python test_backend.py   (uses a temporary database)"""
import os, tempfile
os.environ["ARTHAMITRA_DB"] = os.path.join(tempfile.mkdtemp(), "test.db")

import app as appmod
import matcher
import scoring

c = appmod.app.test_client()

def ok(cond, msg):
    print(("PASS  " if cond else "FAIL  ") + msg)
    assert cond, msg

# matcher unit tests
s = {"eligibility": {"min_age": 18, "max_age": 50, "profile_flags": {"has_insurance": False}}}
ok(matcher.matches({"age": 30, "has_insurance": 0}, s), "uninsured adult matches")
ok(not matcher.matches({"age": 30, "has_insurance": 1}, s), "insured user does not match")
ok(not matcher.matches({"age": 60, "has_insurance": 0}, s), "too old does not match")
inc = {"eligibility": {"max_monthly_income": 10000}}
ok(not matcher.matches({"age": 30, "monthly_income": 20000}, inc), "high income excluded")
ok(matcher.matches({"age": 30, "monthly_income": None}, inc), "unknown income not excluded")

# API tests
r = c.post("/api/register", json={"name": "Test", "phone": "9876543210", "pin": "1234",
                                  "age": 30, "gender": "female", "has_bank_account": True})
ok(r.status_code == 201, "register works")
ok(c.post("/api/register", json={"name": "T", "phone": "9876543210", "pin": "1234"}).status_code == 409, "duplicate phone rejected")
ok(c.post("/api/register", json={"name": "T", "phone": "123", "pin": "1234"}).status_code == 400, "short phone rejected")
c.post("/api/logout")
ok(c.get("/api/entries").status_code == 401, "entries need login")
ok(c.post("/api/login", json={"phone": "9876543210", "pin": "0000"}).status_code == 401, "wrong PIN rejected")
ok(c.post("/api/login", json={"phone": "9876543210", "pin": "1234"}).status_code == 200, "login works")

ok(c.post("/api/entries", json={"type": "income", "amount": -5}).status_code == 400, "negative amount rejected")
ok(c.post("/api/entries", json={"type": "income", "amount": "abc"}).status_code == 400, "non-number rejected")
ok(c.post("/api/entries", json={"type": "income", "amount": 600}).status_code == 201, "add income")
ok(c.post("/api/entries", json={"type": "expense", "amount": 200}).status_code == 201, "add expense")
w = c.get("/api/summary").get_json()["this_week"]
ok(w["earned"] == 600 and w["spent"] == 200 and w["saved"] == 400, "weekly total updates")

m = c.get("/api/schemes/matches").get_json()
ids = [x["id"] for x in m["matches"]]
ok("pmjjby" in ids, "uninsured user with bank account sees insurance scheme")
ok(len(m["matches"][0]["documents"]) > 0, "matched scheme includes documents")
c.patch("/api/me", json={"has_insurance": True})
ids = [x["id"] for x in c.get("/api/schemes/matches").get_json()["matches"]]
ok("pmjjby" not in ids, "insurance scheme disappears once user has insurance")


# ---------- Step 6: scoring ----------
r = scoring.compute_score(0, 0, 0, 0, 3)
ok(r["score"] == 0 and r["tip"] in ("save_more", "log_more_days", "apply_schemes"), "empty user scores 0")
r = scoring.compute_score(1000, 800, 7, 3, 3)       # saves exactly 20%, logs 7 days, applied to all
ok(r["score"] == 100 and r["tip"] == "great", "full marks case scores 100")
r = scoring.compute_score(1000, 1200, 7, 1, 1)      # overspending gives 0 savings points
ok(r["parts"]["savings"] == 0, "overspending gives zero savings points")
ok(scoring.compute_score(500, 0, 0, 0, 0)["parts"]["schemes"] == 30, "no matched schemes gives full scheme points")

# ---------- Step 6: goals ----------
r = c.post("/api/goals", json={"title": "Emergency", "target": 1000, "deadline": "2099-01-01"})
ok(r.status_code == 201 and r.get_json()["percent"] == 0, "create goal")
gid = r.get_json()["id"]
ok(c.post("/api/goals", json={"title": "", "target": 100}).status_code == 400, "empty goal title rejected")
ok(c.post("/api/goals", json={"title": "x", "target": -5}).status_code == 400, "negative target rejected")
ok(c.post("/api/goals", json={"title": "x", "target": 5, "deadline": "tomorrow"}).status_code == 400, "bad deadline rejected")
ok(c.post(f"/api/goals/{gid}/contribute", json={"amount": 250}).get_json()["percent"] == 25, "contribute updates percent")
ok(c.post(f"/api/goals/{gid}/contribute", json={"amount": -1}).status_code == 400, "negative contribution rejected")
g = c.post(f"/api/goals/{gid}/contribute", json={"amount": 800}).get_json()
ok(g["status"] == "completed" and g["percent"] == 100, "goal completes and percent is capped at 100")
c.post("/api/goals", json={"title": "Late", "target": 100, "deadline": "2000-01-01"})
ok(any(x["status"] == "overdue" for x in c.get("/api/goals").get_json()), "past deadline shows overdue")

# goals are private per user
c2 = appmod.app.test_client()
c2.post("/api/register", json={"name": "Other", "phone": "9123456780", "pin": "4321"})
ok(c2.post(f"/api/goals/{gid}/contribute", json={"amount": 10}).status_code == 404, "cannot touch another user's goal")
ok(c2.get("/api/goals").get_json() == [], "other user sees none of my goals")
ok(c.delete(f"/api/goals/{gid}").status_code == 200, "delete goal")

# ---------- Step 6: applied schemes + score endpoint + lessons ----------
c.patch("/api/me", json={"has_insurance": False})
ok(c.post("/api/schemes/not-a-scheme/applied").status_code == 404, "unknown scheme rejected")
before = c.get("/api/score").get_json()
ok(c.post("/api/schemes/pmjjby/applied").status_code == 200, "mark scheme applied")
m = c.get("/api/schemes/matches").get_json()["matches"]
ok(any(x["id"] == "pmjjby" and x["applied"] for x in m), "matches show applied flag")
after = c.get("/api/score").get_json()
ok(after["parts"]["schemes"] > before["parts"]["schemes"], "applying to a scheme raises the score")
ok(0 <= after["score"] <= 100, "score stays within 0-100")
ok(c.delete("/api/schemes/pmjjby/applied").status_code == 200, "unmark applied")
ok(c2.get("/api/score").status_code == 200, "score works for a user with no data")
L = c.get("/api/lessons").get_json()
ok(len(L) == 5 and "en" in L[0]["title"] and "kn" in L[0]["title"], "5 lessons with English and Kannada")

print("\nAll tests passed.")
