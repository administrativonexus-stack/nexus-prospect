-- Isolate data per user: each user sees only their own leads and related records.
-- Child tables (conversations, meetings, audits, lead_history) are scoped via their lead's imported_by.
-- Settings remains shared (system-wide API keys, OAuth tokens, feature flags).

-- ── leads ──────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "leads_all" ON leads;

CREATE POLICY "leads_select" ON leads
  FOR SELECT USING (imported_by = auth.uid());

CREATE POLICY "leads_insert" ON leads
  FOR INSERT WITH CHECK (imported_by = auth.uid());

CREATE POLICY "leads_update" ON leads
  FOR UPDATE USING (imported_by = auth.uid());

CREATE POLICY "leads_delete" ON leads
  FOR DELETE USING (imported_by = auth.uid());

-- ── conversations ───────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "conversations_all" ON conversations;

CREATE POLICY "conversations_all" ON conversations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM leads l
      WHERE l.id = conversations.lead_id
        AND l.imported_by = auth.uid()
    )
  );

-- ── meetings ────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "meetings_all" ON meetings;

CREATE POLICY "meetings_all" ON meetings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM leads l
      WHERE l.id = meetings.lead_id
        AND l.imported_by = auth.uid()
    )
  );

-- ── audits ──────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "audits_all" ON audits;

CREATE POLICY "audits_all" ON audits
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM leads l
      WHERE l.id = audits.lead_id
        AND l.imported_by = auth.uid()
    )
  );

-- ── lead_history ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "lead_history_all" ON lead_history;

CREATE POLICY "lead_history_all" ON lead_history
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM leads l
      WHERE l.id = lead_history.lead_id
        AND l.imported_by = auth.uid()
    )
  );
