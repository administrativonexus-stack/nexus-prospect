-- Make settings per-user: each user has their own API keys, OAuth tokens, SDR config, etc.
-- Existing settings are assigned to the oldest profile (the owner). If no profiles exist,
-- orphaned rows are deleted (they will be reconfigured per user after login).

ALTER TABLE settings ADD COLUMN user_id UUID REFERENCES profiles(id) ON DELETE CASCADE;

-- Backfill: assign all existing settings to the first-created user
UPDATE settings
SET user_id = (SELECT id FROM profiles ORDER BY created_at ASC LIMIT 1)
WHERE user_id IS NULL;

-- Drop rows that couldn't be assigned (no profiles exist yet — fresh install)
DELETE FROM settings WHERE user_id IS NULL;

-- Now enforce NOT NULL
ALTER TABLE settings ALTER COLUMN user_id SET NOT NULL;

-- Replace single-key PK with composite (user_id, key)
ALTER TABLE settings DROP CONSTRAINT settings_pkey;
ALTER TABLE settings ADD PRIMARY KEY (user_id, key);

-- Update RLS: each user sees only their own settings
DROP POLICY IF EXISTS "settings_all" ON settings;

CREATE POLICY "settings_all" ON settings
  FOR ALL USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
