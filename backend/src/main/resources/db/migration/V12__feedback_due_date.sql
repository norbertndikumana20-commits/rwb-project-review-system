-- V12: feedback due date requested by the submitting company.
-- When this date is reached while the docket is still open, the deadline
-- notifier (scheduled task) raises notifications. deadline_notified guards
-- against duplicate alerts on subsequent runs.

ALTER TABLE projects ADD COLUMN feedback_due_date DATE;

ALTER TABLE projects ADD COLUMN deadline_notified BOOLEAN NOT NULL DEFAULT FALSE;
