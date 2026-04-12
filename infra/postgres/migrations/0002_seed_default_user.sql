INSERT INTO users (id, email)
VALUES (1, 'local@habit-tracking.dev')
ON CONFLICT (id) DO NOTHING;

SELECT setval(
    pg_get_serial_sequence('users', 'id'),
    GREATEST((SELECT COALESCE(MAX(id), 1) FROM users), 1),
    true
);
