-- Extends Supabase auth.users with app-level profile data
CREATE TABLE profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  email       TEXT NOT NULL UNIQUE,
  avatar_url  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Core lead entity
CREATE TABLE leads (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name  TEXT NOT NULL,
  phone         TEXT,
  city          TEXT,
  website       TEXT,
  address       TEXT,
  rating        NUMERIC(2,1),
  review_count  INTEGER DEFAULT 0,
  score         INTEGER DEFAULT 0 CHECK (score BETWEEN 0 AND 100),
  status        lead_status NOT NULL DEFAULT 'lead_found',
  notes         TEXT,
  niche         TEXT,
  imported_by   UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- WhatsApp message log
CREATE TABLE conversations (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id              UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  message              TEXT NOT NULL,
  sender               message_sender NOT NULL,
  whatsapp_message_id  TEXT UNIQUE,  -- Evolution API dedup
  read                 BOOLEAN NOT NULL DEFAULT FALSE,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Scheduled meetings
CREATE TABLE meetings (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id          UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  meeting_date     TIMESTAMPTZ NOT NULL,
  meeting_link     TEXT,
  google_event_id  TEXT,
  status           meeting_status NOT NULL DEFAULT 'scheduled',
  notes            TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- AI website audits
CREATE TABLE audits (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id           UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  score             INTEGER NOT NULL CHECK (score BETWEEN 0 AND 100),
  has_website       BOOLEAN NOT NULL DEFAULT FALSE,
  is_responsive     BOOLEAN NOT NULL DEFAULT FALSE,
  has_form          BOOLEAN NOT NULL DEFAULT FALSE,
  has_cta           BOOLEAN NOT NULL DEFAULT FALSE,
  has_chatbot       BOOLEAN NOT NULL DEFAULT FALSE,
  has_lead_capture  BOOLEAN NOT NULL DEFAULT FALSE,
  problems          JSONB NOT NULL DEFAULT '[]',
  opportunities     JSONB NOT NULL DEFAULT '[]',
  sales_arguments   JSONB NOT NULL DEFAULT '[]',
  raw_response      JSONB,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Runtime config: API keys, OAuth tokens, feature flags
CREATE TABLE settings (
  key        TEXT PRIMARY KEY,
  value      TEXT,  -- sensitive values encrypted at app layer (AES-256-GCM)
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Immutable activity log per lead
CREATE TABLE lead_history (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id      UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  action       TEXT NOT NULL,
  description  TEXT NOT NULL,
  metadata     JSONB,
  performed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
