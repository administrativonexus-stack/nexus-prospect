-- Enable Supabase Realtime for the conversations table so that
-- new messages are pushed to subscribed clients via postgres_changes.
ALTER PUBLICATION supabase_realtime ADD TABLE conversations;
