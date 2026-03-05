-- Run this in your Supabase SQL editor

CREATE TABLE IF NOT EXISTS familyfeud_games (
  code TEXT PRIMARY KEY,
  state JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (allow all for now, since code is the access control)
ALTER TABLE familyfeud_games ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all" ON familyfeud_games FOR ALL USING (true) WITH CHECK (true);

-- Enable Realtime on the familyfeud_games table
-- Go to Supabase Dashboard → Database → Replication → add 'familyfeud_games' table
