CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    email TEXT UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TYPE habit_type AS ENUM ('binary', 'counter');
CREATE TYPE target_type AS ENUM ('complete', 'at_least', 'at_most', 'exact');
CREATE TYPE habit_log_status AS ENUM ('logged', 'skipped');

CREATE TABLE habits (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type habit_type NOT NULL,
    unit TEXT,
    target_type target_type NOT NULL,
    target_value INTEGER,
    display_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    archived_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT habits_target_value_required_for_counter
        CHECK (
            type <> 'counter' OR target_value IS NOT NULL
        )
);

CREATE TABLE day_entries (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    entry_date DATE NOT NULL,
    note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT day_entries_user_date_unique UNIQUE (user_id, entry_date)
);

CREATE TABLE habit_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    habit_id BIGINT NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
    day_entry_id BIGINT NOT NULL REFERENCES day_entries(id) ON DELETE CASCADE,
    entry_date DATE NOT NULL,
    value INTEGER NOT NULL DEFAULT 0,
    status habit_log_status NOT NULL DEFAULT 'logged',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT habit_logs_habit_day_unique UNIQUE (habit_id, entry_date),
    CONSTRAINT habit_logs_value_non_negative CHECK (value >= 0)
);

CREATE INDEX habits_user_active_idx
    ON habits (user_id, is_active, display_order);

CREATE INDEX habit_logs_user_date_idx
    ON habit_logs (user_id, entry_date);
