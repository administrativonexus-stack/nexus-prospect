-- Enable Row Level Security on all tables
ALTER TABLE profiles      ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads          ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations  ENABLE ROW LEVEL SECURITY;
ALTER TABLE meetings       ENABLE ROW LEVEL SECURITY;
ALTER TABLE audits         ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings       ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_history   ENABLE ROW LEVEL SECURITY;

-- V1: no role differentiation — all authenticated users have full access

CREATE POLICY "profiles_select" ON profiles
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "profiles_insert" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "leads_all" ON leads
  FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "conversations_all" ON conversations
  FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "meetings_all" ON meetings
  FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "audits_all" ON audits
  FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "settings_all" ON settings
  FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "lead_history_all" ON lead_history
  FOR ALL USING (auth.uid() IS NOT NULL);
