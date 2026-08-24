-- Seed the RWB administrator.
-- Password: ChangeMe!2026
-- Hash generated with BCrypt (cost 12) and verified at build time against
-- Spring Security's BCryptPasswordEncoder:
--   $2a$12$4oc.AVy2RHhg..p09lS81eWuFWUeOAKkdHRNubOmuTy7LpzY/sAxe
-- (Spring accepts $2a$, $2b$ and $2y$ prefixes interchangeably.)
--
-- Written with WHERE NOT EXISTS guards so the same script runs on both
-- PostgreSQL 16 and H2 (PostgreSQL compatibility mode) for local smoke tests.

INSERT INTO organizations (name)
SELECT 'RWB Administration'
WHERE NOT EXISTS (SELECT 1 FROM organizations WHERE name = 'RWB Administration');

INSERT INTO users (email, password_hash, full_name, role, account_status, organization_id)
SELECT 'admin@rwb.example',
       '$2a$12$4oc.AVy2RHhg..p09lS81eWuFWUeOAKkdHRNubOmuTy7LpzY/sAxe',
       'RWB System Administrator',
       'ADMIN',
       'ACTIVE',
       id
FROM organizations
WHERE name = 'RWB Administration'
  AND NOT EXISTS (SELECT 1 FROM users WHERE email = 'admin@rwb.example');

-- A seeded reviewer so the reviewer dashboard and assignment workflow can be
-- demonstrated out of the box. Same password as the admin.
INSERT INTO users (email, password_hash, full_name, role, account_status, organization_id)
SELECT 'alice@rwb.example',
       '$2a$12$4oc.AVy2RHhg..p09lS81eWuFWUeOAKkdHRNubOmuTy7LpzY/sAxe',
       'Dr. Alice Chen',
       'REVIEWER',
       'ACTIVE',
       id
FROM organizations
WHERE name = 'RWB Administration'
  AND NOT EXISTS (SELECT 1 FROM users WHERE email = 'alice@rwb.example');
