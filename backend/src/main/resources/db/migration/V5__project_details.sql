-- External submissions carry a project location and an optional validated
-- external project link (SRS: either a ZIP upload or a validated link).

ALTER TABLE projects ADD COLUMN location VARCHAR(255);
ALTER TABLE projects ADD COLUMN link VARCHAR(2048);
