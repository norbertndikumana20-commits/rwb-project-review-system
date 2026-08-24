-- Tighten the reviews decision constraint to only the values the code writes
-- (final decisions APPROVED/REJECTED, reviewer recommendations REQUEST_INFO,
-- and the legacy NOTES placeholder). The RECOMMENDED_* values added in V3
-- were never used.

ALTER TABLE reviews DROP CONSTRAINT chk_reviews_decision;
ALTER TABLE reviews ADD CONSTRAINT chk_reviews_decision CHECK (decision IN (
    'APPROVED',
    'REJECTED',
    'NOTES',
    'REQUEST_INFO'
));
