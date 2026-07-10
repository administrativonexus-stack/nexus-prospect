-- WhatsApp Campaign Module (Meta Cloud API) — tags, campaigns, recipients, events

-- Enums
CREATE TYPE campaign_status AS ENUM ('draft', 'scheduled', 'sending', 'completed', 'paused', 'cancelled');
CREATE TYPE recipient_status AS ENUM ('pending', 'sending', 'sent', 'delivered', 'read', 'replied', 'failed', 'skipped');
CREATE TYPE campaign_event_type AS ENUM ('sent', 'delivered', 'read', 'replied', 'failed', 'meeting_booked');

-- Tags (prerequisite for tag-based segmentation)
CREATE TABLE tags (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL UNIQUE,
  color      TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE lead_tags (
  lead_id    UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  tag_id     UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (lead_id, tag_id)
);

-- Campaigns
CREATE TABLE campaigns (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                 TEXT NOT NULL,
  status               campaign_status NOT NULL DEFAULT 'draft',
  template_name        TEXT NOT NULL,
  template_language    TEXT NOT NULL DEFAULT 'pt_BR',
  template_components  JSONB,
  segment_filters      JSONB NOT NULL DEFAULT '{}',
  scheduled_at         TIMESTAMPTZ,
  started_at           TIMESTAMPTZ,
  completed_at         TIMESTAMPTZ,
  total_recipients     INTEGER NOT NULL DEFAULT 0,
  created_by           UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE campaign_recipients (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id          UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  lead_id              UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  status               recipient_status NOT NULL DEFAULT 'pending',
  whatsapp_message_id  TEXT,
  error_message        TEXT,
  sent_at              TIMESTAMPTZ,
  delivered_at         TIMESTAMPTZ,
  read_at              TIMESTAMPTZ,
  replied_at           TIMESTAMPTZ,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (campaign_id, lead_id)
);

CREATE TABLE campaign_events (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id   UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  recipient_id  UUID NOT NULL REFERENCES campaign_recipients(id) ON DELETE CASCADE,
  event_type    campaign_event_type NOT NULL,
  raw_payload   JSONB,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_lead_tags_tag_id ON lead_tags(tag_id);
CREATE INDEX idx_tags_name ON tags(name);

CREATE INDEX idx_campaigns_status ON campaigns(status);
CREATE INDEX idx_campaigns_scheduled_at ON campaigns(scheduled_at) WHERE status = 'scheduled';

CREATE INDEX idx_campaign_recipients_campaign_id ON campaign_recipients(campaign_id);
CREATE INDEX idx_campaign_recipients_lead_id ON campaign_recipients(lead_id);
CREATE INDEX idx_campaign_recipients_status ON campaign_recipients(campaign_id, status);
CREATE UNIQUE INDEX idx_campaign_recipients_wamid ON campaign_recipients(whatsapp_message_id) WHERE whatsapp_message_id IS NOT NULL;

CREATE INDEX idx_campaign_events_campaign_id ON campaign_events(campaign_id);
CREATE INDEX idx_campaign_events_recipient_id ON campaign_events(recipient_id);

-- updated_at trigger (reuses trigger_set_updated_at() from 20240005_functions.sql)
CREATE TRIGGER set_campaigns_updated_at
  BEFORE UPDATE ON campaigns
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- RLS — same permissive single-policy pattern as the rest of the schema
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tags_all" ON tags FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "lead_tags_all" ON lead_tags FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "campaigns_all" ON campaigns FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "campaign_recipients_all" ON campaign_recipients FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "campaign_events_all" ON campaign_events FOR ALL USING (auth.uid() IS NOT NULL);

-- Per-campaign funnel metrics (mirrors get_dashboard_metrics()'s single-query json_build_object style)
CREATE OR REPLACE FUNCTION get_campaign_metrics(p_campaign_id UUID)
RETURNS JSON AS $$
DECLARE
  v_started_at TIMESTAMPTZ;
BEGIN
  SELECT started_at INTO v_started_at FROM campaigns WHERE id = p_campaign_id;

  RETURN json_build_object(
    'sent',
      (SELECT COUNT(*) FROM campaign_recipients WHERE campaign_id = p_campaign_id AND status IN ('sent', 'delivered', 'read', 'replied')),
    'delivered',
      (SELECT COUNT(*) FROM campaign_recipients WHERE campaign_id = p_campaign_id AND status IN ('delivered', 'read', 'replied')),
    'read',
      (SELECT COUNT(*) FROM campaign_recipients WHERE campaign_id = p_campaign_id AND status IN ('read', 'replied')),
    'replied',
      (SELECT COUNT(*) FROM campaign_recipients WHERE campaign_id = p_campaign_id AND status = 'replied'),
    'failed',
      (SELECT COUNT(*) FROM campaign_recipients WHERE campaign_id = p_campaign_id AND status = 'failed'),
    'meetings_booked',
      (SELECT COUNT(*) FROM meetings m
        JOIN campaign_recipients cr ON cr.lead_id = m.lead_id
        WHERE cr.campaign_id = p_campaign_id
          AND v_started_at IS NOT NULL
          AND m.created_at >= v_started_at)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Global overview metrics (for the dashboard card)
CREATE OR REPLACE FUNCTION get_campaigns_overview_metrics()
RETURNS JSON AS $$
BEGIN
  RETURN json_build_object(
    'active_campaigns',
      (SELECT COUNT(*) FROM campaigns WHERE status IN ('scheduled', 'sending')),
    'sent_total',
      (SELECT COUNT(*) FROM campaign_recipients WHERE status IN ('sent', 'delivered', 'read', 'replied')),
    'delivered_total',
      (SELECT COUNT(*) FROM campaign_recipients WHERE status IN ('delivered', 'read', 'replied')),
    'read_total',
      (SELECT COUNT(*) FROM campaign_recipients WHERE status IN ('read', 'replied')),
    'replied_total',
      (SELECT COUNT(*) FROM campaign_recipients WHERE status = 'replied')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Realtime — UI subscribes to the denormalized status tables, not the high-volume event log
ALTER PUBLICATION supabase_realtime ADD TABLE campaigns;
ALTER PUBLICATION supabase_realtime ADD TABLE campaign_recipients;
