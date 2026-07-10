-- Auto-set updated_at on every UPDATE
CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_leads_updated_at
  BEFORE UPDATE ON leads
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER set_meetings_updated_at
  BEFORE UPDATE ON meetings
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- Auto-create profile when a new user signs up
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Single-query dashboard metrics (called via RPC from the API)
CREATE OR REPLACE FUNCTION get_dashboard_metrics()
RETURNS JSON AS $$
BEGIN
  RETURN json_build_object(
    'leads_today',
      (SELECT COUNT(*) FROM leads WHERE created_at >= CURRENT_DATE),
    'leads_month',
      (SELECT COUNT(*) FROM leads WHERE date_trunc('month', created_at) = date_trunc('month', NOW())),
    'messages_sent',
      (SELECT COUNT(*) FROM conversations WHERE sender IN ('agent', 'ai')),
    'replies_received',
      (SELECT COUNT(*) FROM conversations WHERE sender = 'lead'),
    'meetings_scheduled',
      (SELECT COUNT(*) FROM meetings WHERE status = 'scheduled'),
    'deals_closed',
      (SELECT COUNT(*) FROM leads WHERE status = 'closed'),
    'funnel', json_build_object(
      'leads',    (SELECT COUNT(*) FROM leads),
      'messages', (SELECT COUNT(DISTINCT lead_id) FROM conversations WHERE sender IN ('agent', 'ai')),
      'replies',  (SELECT COUNT(DISTINCT lead_id) FROM conversations WHERE sender = 'lead'),
      'meetings', (SELECT COUNT(*) FROM meetings),
      'sales',    (SELECT COUNT(*) FROM leads WHERE status = 'closed')
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
