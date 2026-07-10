-- Drop the old non-unique phone index added in 20240003_indexes.sql
DROP INDEX IF EXISTS idx_leads_phone;

-- Partial unique index: only enforces uniqueness for non-null phone values.
-- NULL phones (companies without a phone) are excluded and can be imported freely.
CREATE UNIQUE INDEX idx_leads_phone_unique
  ON leads(phone)
  WHERE phone IS NOT NULL;
