-- Leads: common query patterns
CREATE INDEX idx_leads_status       ON leads(status);
CREATE INDEX idx_leads_created_at   ON leads(created_at DESC);
CREATE INDEX idx_leads_phone        ON leads(phone);
CREATE INDEX idx_leads_fts          ON leads USING gin(to_tsvector('portuguese', company_name));

-- Conversations
CREATE INDEX idx_conv_lead_id   ON conversations(lead_id);
CREATE INDEX idx_conv_created   ON conversations(created_at DESC);
CREATE INDEX idx_conv_unread    ON conversations(read) WHERE read = FALSE;

-- Meetings
CREATE INDEX idx_meetings_lead_id ON meetings(lead_id);
CREATE INDEX idx_meetings_date    ON meetings(meeting_date);
CREATE INDEX idx_meetings_status  ON meetings(status);

-- Audits
CREATE INDEX idx_audits_lead_id ON audits(lead_id);

-- Lead history
CREATE INDEX idx_history_lead_id ON lead_history(lead_id);
CREATE INDEX idx_history_created ON lead_history(created_at DESC);
