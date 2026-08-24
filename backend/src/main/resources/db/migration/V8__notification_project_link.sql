-- Notifications now carry an optional link to the docket they are about,
-- so a bell alert can click through to the related project (V8).
-- Message alerts keep project_id NULL.

ALTER TABLE notifications ADD COLUMN project_id BIGINT REFERENCES projects (id);

CREATE INDEX idx_notifications_project ON notifications (project_id);
