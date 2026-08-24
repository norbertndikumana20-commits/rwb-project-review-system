-- SRS five-role RBAC model:
--   1. Rename MANAGER -> EXTERNAL_USER and widen the role check constraint.
--   2. Allow reviewer recommendation decisions (REQUEST_INFO) on the reviews table.
--   3. Seed the internal Division Manager and Super Reviewer accounts
--      (same dev password as the admin: ChangeMe!2026).

ALTER TABLE users DROP CONSTRAINT chk_users_role;
UPDATE users SET role = 'EXTERNAL_USER' WHERE role = 'MANAGER';
ALTER TABLE users ADD CONSTRAINT chk_users_role CHECK (role IN (
    'ADMIN',
    'EXTERNAL_USER',
    'REVIEWER',
    'DIVISION_MANAGER',
    'SUPER_REVIEWER'
));

ALTER TABLE reviews DROP CONSTRAINT chk_reviews_decision;
ALTER TABLE reviews ADD CONSTRAINT chk_reviews_decision CHECK (decision IN (
    'APPROVED',
    'REJECTED',
    'NOTES',
    'REQUEST_INFO',
    'RECOMMENDED_APPROVED',
    'RECOMMENDED_REJECTED'
));

INSERT INTO users (email, password_hash, full_name, role, account_status, organization_id)
SELECT 'dm@rwb.example',
       '$2a$12$4oc.AVy2RHhg..p09lS81eWuFWUeOAKkdHRNubOmuTy7LpzY/sAxe',
       'Division Manager',
       'DIVISION_MANAGER',
       'ACTIVE',
       id
FROM organizations
WHERE name = 'RWB Administration'
  AND NOT EXISTS (SELECT 1 FROM users WHERE email = 'dm@rwb.example');

INSERT INTO users (email, password_hash, full_name, role, account_status, organization_id)
SELECT 'oversight@rwb.example',
       '$2a$12$4oc.AVy2RHhg..p09lS81eWuFWUeOAKkdHRNubOmuTy7LpzY/sAxe',
       'Super Reviewer',
       'SUPER_REVIEWER',
       'ACTIVE',
       id
FROM organizations
WHERE name = 'RWB Administration'
  AND NOT EXISTS (SELECT 1 FROM users WHERE email = 'oversight@rwb.example');
