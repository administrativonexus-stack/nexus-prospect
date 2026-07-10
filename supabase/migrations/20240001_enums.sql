-- Lead pipeline stages
CREATE TYPE lead_status AS ENUM (
  'lead_found',
  'message_sent',
  'replied',
  'meeting_scheduled',
  'proposal',
  'closed',
  'lost'
);

-- WhatsApp message sender
CREATE TYPE message_sender AS ENUM (
  'lead',   -- incoming from WhatsApp
  'agent',  -- sent by human operator
  'ai'      -- sent by AI SDR
);

-- Meeting lifecycle
CREATE TYPE meeting_status AS ENUM (
  'scheduled',
  'completed',
  'cancelled',
  'no_show'
);
