-- TurboBuilder Database Setup
-- Run this in Supabase SQL Editor

-- Profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  is_authorized BOOLEAN DEFAULT FALSE,
  is_admin BOOLEAN DEFAULT FALSE,
  generation_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Authorized emails (pre-authorize before signup)
CREATE TABLE IF NOT EXISTS authorized_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  added_by UUID REFERENCES profiles(id),
  added_at TIMESTAMPTZ DEFAULT NOW()
);

-- Generations table
CREATE TABLE IF NOT EXISTS generations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  system_type TEXT NOT NULL CHECK (system_type IN ('builder', 'modeling', 'project')),
  prompt TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'researching', 'generating', 'complete', 'failed')),
  progress INTEGER DEFAULT 0,
  spec_items JSONB DEFAULT '[]',
  output_url TEXT,
  output_metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Function to increment generation count
CREATE OR REPLACE FUNCTION increment_generation_count(user_id UUID)
RETURNS VOID AS $$
  UPDATE profiles SET generation_count = generation_count + 1 WHERE id = user_id;
$$ LANGUAGE SQL;

-- RLS Policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE authorized_emails ENABLE ROW LEVEL SECURITY;

-- Profiles: users can read/update own profile
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Service role full access profiles" ON profiles FOR ALL USING (auth.role() = 'service_role');

-- Generations: users can CRUD own generations
CREATE POLICY "Users can view own generations" ON generations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own generations" ON generations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Service role full access generations" ON generations FOR ALL USING (auth.role() = 'service_role');

-- Authorized emails: only service role
CREATE POLICY "Service role full access auth emails" ON authorized_emails FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Admins can view auth emails" ON authorized_emails FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE)
);

-- Storage bucket for generation outputs
INSERT INTO storage.buckets (id, name, public) VALUES ('generations', 'generations', true) ON CONFLICT DO NOTHING;

CREATE POLICY "Public can read generations" ON storage.objects FOR SELECT USING (bucket_id = 'generations');
CREATE POLICY "Service role can upload generations" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'generations' AND auth.role() = 'service_role');

-- Pre-authorize owner email
INSERT INTO authorized_emails (email, added_by) 
VALUES ('zack@myerscough.info', NULL) 
ON CONFLICT (email) DO NOTHING;

SELECT 'Setup complete!' as result;

-- ── Script Library ─────────────────────────────────────────────────────────
-- Self-learning script storage: TurboBuilder generates new scripts on demand
-- and stores them here for future use

CREATE TABLE IF NOT EXISTS script_library (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name          TEXT NOT NULL,
  description   TEXT NOT NULL,
  keywords      TEXT[] NOT NULL DEFAULT '{}',
  luau_code     TEXT NOT NULL,
  quality_score INTEGER NOT NULL DEFAULT 80,
  usage_count   INTEGER NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Full text search index for fast keyword lookups
CREATE INDEX IF NOT EXISTS script_library_name_idx ON script_library USING GIN (to_tsvector('english', name));
CREATE INDEX IF NOT EXISTS script_library_desc_idx ON script_library USING GIN (to_tsvector('english', description));
CREATE INDEX IF NOT EXISTS script_library_keywords_idx ON script_library USING GIN (keywords);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_script_library_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER script_library_updated_at
  BEFORE UPDATE ON script_library
  FOR EACH ROW EXECUTE FUNCTION update_script_library_updated_at();

-- Increment usage count safely
CREATE OR REPLACE FUNCTION increment_script_usage(script_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE script_library SET usage_count = usage_count + 1 WHERE id = script_id;
END;
$$ LANGUAGE plpgsql;

-- RLS: Only service role can write, anyone authenticated can read
ALTER TABLE script_library ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read scripts"
  ON script_library FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Service role can insert scripts"
  ON script_library FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Service role can update scripts"
  ON script_library FOR UPDATE
  TO service_role
  USING (true);

-- ── Prompt History ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS prompt_history (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  prompt        TEXT NOT NULL,
  system_type   TEXT NOT NULL,
  quality_score INTEGER,
  style         TEXT,
  scale         TEXT,
  rating        INTEGER CHECK (rating >= 1 AND rating <= 5),
  created_at    TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS prompt_history_user_idx ON prompt_history(user_id);
ALTER TABLE prompt_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own their prompt history" ON prompt_history FOR ALL TO authenticated USING (auth.uid() = user_id);

-- ── Failed Generations ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS failed_generations (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  prompt        TEXT NOT NULL,
  system_type   TEXT NOT NULL,
  quality_score INTEGER,
  notes         TEXT,
  reviewed      BOOLEAN DEFAULT FALSE,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE failed_generations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can read failed gens" ON failed_generations FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE));

-- ── Rating column on generations ────────────────────────────────────────────
ALTER TABLE generations ADD COLUMN IF NOT EXISTS rating INTEGER CHECK (rating >= 1 AND rating <= 5);

-- ── Script versions ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS script_versions (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  script_id     UUID REFERENCES script_library(id) ON DELETE CASCADE,
  version       INTEGER NOT NULL,
  luau_code     TEXT NOT NULL,
  quality_score INTEGER,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE script_versions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read script versions" ON script_versions FOR SELECT TO authenticated USING (true);

-- Auto-save version when script is updated
CREATE OR REPLACE FUNCTION save_script_version()
RETURNS TRIGGER AS $$
DECLARE v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count FROM script_versions WHERE script_id = OLD.id;
  INSERT INTO script_versions (script_id, version, luau_code, quality_score)
  VALUES (OLD.id, v_count + 1, OLD.luau_code, OLD.quality_score);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER script_version_on_update
  BEFORE UPDATE OF luau_code ON script_library
  FOR EACH ROW EXECUTE FUNCTION save_script_version();
