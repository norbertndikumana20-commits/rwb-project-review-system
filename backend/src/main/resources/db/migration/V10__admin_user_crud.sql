-- Admin user management: administrators can suspend an account without
-- deleting it, so the status constraint must accept DISABLED.
ALTER TABLE users DROP CONSTRAINT chk_users_status;
ALTER TABLE users ADD CONSTRAINT chk_users_status CHECK (account_status IN (
    'PENDING_EMAIL_VERIFICATION',
    'PENDING_ADMIN_REVIEW',
    'ACTIVE_FIRST_PROJECT_REQUIRED',
    'ACTIVE',
    'REJECTED',
    'DISABLED'
));
