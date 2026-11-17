# ArthaMitra

Financial literacy, budgeting and government-scheme access for urban slum households.
Stack: HTML/CSS/JS, Flask, SQLite, schemes.json.

## Run locally
    cd backend
    python -m venv venv
    venv\Scripts\activate        # Windows   (Mac/Linux: source venv/bin/activate)
    pip install -r requirements.txt
    python app.py                # open http://127.0.0.1:5000

Run tests: `python test_backend.py`

Demo data (for Render free tier): set `DEMO_SEED=1`. Demo login: phone 9999999999, PIN 1234.
Set `SECRET_KEY` to a long random value on the server. Start command: `gunicorn app:app`.

## API (agree this in week 1)
| Method | Route | Body / notes |
|---|---|---|
| POST | /api/register | name, phone, pin, language, age, gender, has_bank_account, has_insurance |
| POST | /api/login | phone, pin |
| POST | /api/logout | |
| GET / PATCH | /api/me | PATCH: language, age, gender, has_bank_account, has_insurance ... |
| POST | /api/entries | type (income/expense), amount, category, note, date |
| GET | /api/entries?days=7 | recent entries |
| GET | /api/summary | this_week and last_week: earned, spent, saved |
| GET | /api/schemes | all schemes |
| GET | /api/schemes/matches | matched schemes + monthly_income + income_note |
| POST / DELETE | /api/schemes/<id>/applied | mark / unmark a scheme as applied (matches include `applied`) |
| POST | /api/goals | title, target, deadline (optional YYYY-MM-DD) |
| GET | /api/goals | each goal has percent, days_left, status (on_track, due_soon, overdue, completed) |
| POST | /api/goals/<id>/contribute | amount |
| DELETE | /api/goals/<id> | |
| GET | /api/score | score 0-100, parts, tip (save_more, log_more_days, apply_schemes, great) |
| GET | /api/lessons | 5 lessons, English and Kannada |

## Kannada from the backend
- **Errors** always carry both languages: `{"error": "...", "error_en": "...", "error_kn": "...", "code": "login_failed"}`. `error` is in the request language: `?lang=kn`, else the logged-in user's language, else English.
- **Add `?lang=kn` (or `?lang=en`)** to `/api/schemes`, `/api/schemes/matches`, `/api/lessons` and `/api/score`. Every English/Kannada pair then comes back as one plain string. Without `?lang`, the pairs `{"en": ..., "kn": ...}` stay as they are.
- Schemes include `category_label` (insurance, pension, health, welfare) in both languages.
- `/api/score` includes `tip_text`. `income_note` in `/api/schemes/matches` is now a pair (or a string with `?lang`).
- All backend text lives in `backend/messages.py`. Kannada there is a draft: have a Kannada speaker check it.
