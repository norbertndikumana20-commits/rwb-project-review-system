-- Switch the seeded accounts to their real Gmail addresses with a shared
-- dev password (changeMe2026), and seed the external company account.
--
-- Password hash for 'changeMe2026' (BCrypt, cost 10), generated and verified
-- locally with Spring Security's BCryptPasswordEncoder:
--   $2a$10$50CKDYkq0TRmqcNssYaDFuNy4cOBADzT/PNDKSzRhn298VNnfLFEa
-- (Spring accepts $2a$, $2b$ and $2y$ prefixes interchangeably.)

UPDATE users SET email = 'adminrvrwb@gmail.com',
       password_hash = '$2a$10$50CKDYkq0TRmqcNssYaDFuNy4cOBADzT/PNDKSzRhn298VNnfLFEa'
WHERE email = 'admin@rwb.example';

UPDATE users SET email = 'dmrwboard@gmail.com',
       password_hash = '$2a$10$50CKDYkq0TRmqcNssYaDFuNy4cOBADzT/PNDKSzRhn298VNnfLFEa'
WHERE email = 'dm@rwb.example';

UPDATE users SET email = 'ndajebob12@gmail.com',
       password_hash = '$2a$10$50CKDYkq0TRmqcNssYaDFuNy4cOBADzT/PNDKSzRhn298VNnfLFEa'
WHERE email = 'alice@rwb.example';

-- The Super Reviewer keeps its address but shares the same password.
UPDATE users SET password_hash = '$2a$10$50CKDYkq0TRmqcNssYaDFuNy4cOBADzT/PNDKSzRhn298VNnfLFEa'
WHERE email = 'oversight@rwb.example';

-- External company account (seeded ACTIVE so it can submit projects directly).
INSERT INTO organizations (name)
SELECT 'Nyungwe Hydro Ltd'
WHERE NOT EXISTS (SELECT 1 FROM organizations WHERE name = 'Nyungwe Hydro Ltd');

INSERT INTO users (email, password_hash, full_name, role, account_status, organization_id)
SELECT 'norbertndikumana20@gmail.com',
       '$2a$10$50CKDYkq0TRmqcNssYaDFuNy4cOBADzT/PNDKSzRhn298VNnfLFEa',
       'Norbert Ndikumana',
       'EXTERNAL_USER',
       'ACTIVE',
       id
FROM organizations
WHERE name = 'Nyungwe Hydro Ltd'
  AND NOT EXISTS (SELECT 1 FROM users WHERE email = 'norbertndikumana20@gmail.com');
