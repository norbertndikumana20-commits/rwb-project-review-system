-- Attachments now carry a kind: 'ZIP' for the zipped project package and
-- 'DOCUMENT' for supporting letters / spreadsheets / other documents.
-- Existing rows are all documents (the pre-existing single picker allowed both,
-- but no upload carried a label), so the default is safe for backfill.
ALTER TABLE attachments ADD COLUMN kind VARCHAR(16) NOT NULL DEFAULT 'DOCUMENT';
CREATE INDEX idx_attachments_kind ON attachments (kind);
