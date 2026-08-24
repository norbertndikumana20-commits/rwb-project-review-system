-- Global application settings key-value store
CREATE TABLE IF NOT EXISTS app_settings (
    id         BIGSERIAL PRIMARY KEY,
    key        VARCHAR(100)  NOT NULL UNIQUE,
    value      VARCHAR(2000) NOT NULL,
    updated_at TIMESTAMP     NOT NULL DEFAULT now()
);

-- Seed sensible defaults
INSERT INTO app_settings (key, value) VALUES
    ('app.name',            'RWB Project Review System'),
    ('app.version',         '1.0'),
    ('app.maintenance_mode','false'),
    ('app.registration_enabled', 'true'),
    ('app.theme.primary',   '#1F3A5F'),
    ('app.theme.background','#F7F6F3'),
    ('app.theme.accent',    '#4A7C59'),
    ('app.theme.sidebar',   '#1A2332'),
    ('app.password_policy.min_length',  '12'),
    ('app.password_policy.require_uppercase', 'true'),
    ('app.password_policy.require_number',    'true'),
    ('app.password_policy.require_special',   'true'),
    ('app.session.timeout_minutes', '480'),
    ('app.session.max_attempts',    '5'),
    ('app.mail.smtp_host',          'smtp.gmail.com'),
    ('app.mail.smtp_port',          '587'),
    ('app.mail.sender',             'adminrvrwb@gmail.com'),
    ('app.mail.display_name',       'RWB Project Review System'),
    ('app.support.phone_1',         '+250 788 100 200'),
    ('app.support.phone_2',         '+250 788 100 201'),
    ('app.support.phone_3',         '+250 788 100 202'),
    ('app.support.phone_4',         '+250 788 100 203'),
    ('app.support.email',           'support@rwb.gov.rw')
ON CONFLICT (key) DO NOTHING;
