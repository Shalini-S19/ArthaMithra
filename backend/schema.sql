-- ArthaMitra database. Never store Aadhaar numbers or other ID numbers.
CREATE TABLE IF NOT EXISTS users (
    id               INTEGER PRIMARY KEY AUTOINCREMENT,
    name             TEXT    NOT NULL,
    phone            TEXT    NOT NULL UNIQUE,
    pin_hash         TEXT    NOT NULL,
    language         TEXT    NOT NULL DEFAULT 'en',      -- 'en' or 'kn'
    age              INTEGER,
    gender           TEXT,                               -- 'female', 'male', 'other'
    occupation       TEXT,
    family_size      INTEGER,
    has_bank_account INTEGER NOT NULL DEFAULT 0,         -- 0/1
    has_insurance    INTEGER NOT NULL DEFAULT 0,          -- 0/1
    household_code   TEXT,                               -- optional: members sharing one phone use the same code
    created_at       TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS entries (
    id       INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id  INTEGER NOT NULL REFERENCES users(id),
    type     TEXT    NOT NULL CHECK (type IN ('income','expense')),
    amount   REAL    NOT NULL CHECK (amount > 0),
    category TEXT,
    note     TEXT,
    date     TEXT    NOT NULL                            -- YYYY-MM-DD
);
CREATE INDEX IF NOT EXISTS idx_entries_user_date ON entries(user_id, date);

CREATE TABLE IF NOT EXISTS goals (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id   INTEGER NOT NULL REFERENCES users(id),
    title     TEXT    NOT NULL,
    target    REAL    NOT NULL CHECK (target > 0),
    saved     REAL    NOT NULL DEFAULT 0,
    deadline  TEXT
);

-- Step 6: schemes the user has marked as "applied" (used by the health score)
CREATE TABLE IF NOT EXISTS scheme_applications (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id    INTEGER NOT NULL REFERENCES users(id),
    scheme_id  TEXT    NOT NULL,
    applied_at TEXT    NOT NULL DEFAULT (datetime('now')),
    UNIQUE (user_id, scheme_id)
);
