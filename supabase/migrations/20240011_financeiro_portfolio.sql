-- ============================================================
-- Financeiro + Portfolio modules
-- ============================================================

-- Enums
DO $$ BEGIN
  CREATE TYPE transaction_type AS ENUM ('income', 'expense');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE transaction_status AS ENUM ('paid', 'pending', 'overdue');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE payment_method_type AS ENUM ('pix', 'card', 'cash', 'transfer', 'boleto');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE recurrence_type AS ENUM ('monthly', 'quarterly', 'semiannual', 'annual');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE fin_client_status AS ENUM ('active', 'paused', 'cancelled');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE project_category AS ENUM ('landing_page', 'site', 'system', 'app', 'ecommerce');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE project_status AS ENUM ('active', 'inactive', 'development');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Financial transactions
CREATE TABLE IF NOT EXISTS financial_transactions (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type             transaction_type NOT NULL,
  amount           NUMERIC(12,2) NOT NULL,
  description      TEXT NOT NULL,
  category         TEXT NOT NULL,
  client_name      TEXT,
  payment_method   payment_method_type,
  status           transaction_status NOT NULL DEFAULT 'pending',
  due_date         DATE,
  paid_date        DATE,
  is_recurring     BOOLEAN NOT NULL DEFAULT FALSE,
  recurrence       recurrence_type,
  notes            TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Recurring financial clients
CREATE TABLE IF NOT EXISTS financial_clients (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name           TEXT NOT NULL,
  company        TEXT,
  plan           TEXT,
  monthly_value  NUMERIC(12,2) NOT NULL DEFAULT 0,
  due_day        SMALLINT NOT NULL DEFAULT 1 CHECK (due_day BETWEEN 1 AND 31),
  status         fin_client_status NOT NULL DEFAULT 'active',
  services       TEXT[] DEFAULT '{}',
  start_date     DATE,
  notes          TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Monthly revenue goals
CREATE TABLE IF NOT EXISTS financial_goals (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  month          TEXT NOT NULL,  -- YYYY-MM
  target_amount  NUMERIC(12,2) NOT NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, month)
);

-- Portfolio projects
CREATE TABLE IF NOT EXISTS portfolio_projects (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name           TEXT NOT NULL,
  client         TEXT,
  category       project_category NOT NULL DEFAULT 'site',
  description    TEXT,
  url            TEXT,
  repo_url       TEXT,
  technologies   TEXT[] DEFAULT '{}',
  thumbnail_url  TEXT,
  date           DATE,
  status         project_status NOT NULL DEFAULT 'active',
  is_favorite    BOOLEAN NOT NULL DEFAULT FALSE,
  notes          TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_fin_transactions_user_date ON financial_transactions(user_id, due_date DESC);
CREATE INDEX IF NOT EXISTS idx_fin_transactions_type ON financial_transactions(user_id, type);
CREATE INDEX IF NOT EXISTS idx_fin_clients_user ON financial_clients(user_id, status);
CREATE INDEX IF NOT EXISTS idx_portfolio_user ON portfolio_projects(user_id, created_at DESC);

-- RLS
ALTER TABLE financial_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "fin_tx_owner" ON financial_transactions
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "fin_clients_owner" ON financial_clients
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "fin_goals_owner" ON financial_goals
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "portfolio_owner" ON portfolio_projects
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
