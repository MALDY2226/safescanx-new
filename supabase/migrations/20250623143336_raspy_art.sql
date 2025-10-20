/*
  # SafeScanX Threat Intelligence Database

  1. New Tables
    - `file_hashes`
      - Stores file SHA-256 hashes and basic metadata
      - `id` (uuid, primary key)
      - `sha256_hash` (text, unique, indexed)
      - `file_name` (text)
      - `file_size` (bigint)
      - `file_extension` (text)
      - `first_seen` (timestamp)
      - `last_seen` (timestamp)
      - `scan_count` (integer, default 0)

    - `scan_results`
      - Stores detailed scan results for each file
      - `id` (uuid, primary key)
      - `file_hash_id` (uuid, foreign key)
      - `overall_verdict` (text: safe, suspicious, malicious, critical)
      - `threat_score` (integer, 0-100)
      - `hash_check_result` (jsonb)
      - `heuristic_result` (jsonb)
      - `static_analysis_result` (jsonb)
      - `behavioral_analysis_result` (jsonb)
      - `external_sources` (jsonb)
      - `scan_timestamp` (timestamp)

    - `threat_signatures`
      - Static analysis signatures for pattern matching
      - `id` (uuid, primary key)
      - `signature_name` (text)
      - `pattern` (text)
      - `threat_type` (text)
      - `severity` (text)
      - `description` (text)

  2. Security
    - Enable RLS on all tables
    - Public read access for scan results and file hashes
    - No update/delete permissions for regular users
*/

-- File hashes table
CREATE TABLE IF NOT EXISTS file_hashes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sha256_hash text UNIQUE NOT NULL,
  file_name text NOT NULL,
  file_size bigint NOT NULL,
  file_extension text,
  first_seen timestamptz DEFAULT now(),
  last_seen timestamptz DEFAULT now(),
  scan_count integer DEFAULT 0
);

-- Scan results table
CREATE TABLE IF NOT EXISTS scan_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  file_hash_id uuid REFERENCES file_hashes(id) ON DELETE CASCADE,
  overall_verdict text NOT NULL CHECK (overall_verdict IN ('safe', 'suspicious', 'malicious', 'critical')),
  threat_score integer NOT NULL CHECK (threat_score >= 0 AND threat_score <= 100),
  hash_check_result jsonb DEFAULT '{}',
  heuristic_result jsonb DEFAULT '{}',
  static_analysis_result jsonb DEFAULT '{}',
  behavioral_analysis_result jsonb DEFAULT '{}',
  external_sources jsonb DEFAULT '{}',
  scan_timestamp timestamptz DEFAULT now()
);

-- Threat signatures table
CREATE TABLE IF NOT EXISTS threat_signatures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  signature_name text NOT NULL,
  pattern text NOT NULL,
  threat_type text NOT NULL,
  severity text NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  description text,
  created_at timestamptz DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_file_hashes_sha256 ON file_hashes(sha256_hash);
CREATE INDEX IF NOT EXISTS idx_file_hashes_last_seen ON file_hashes(last_seen DESC);
CREATE INDEX IF NOT EXISTS idx_scan_results_file_hash_id ON scan_results(file_hash_id);
CREATE INDEX IF NOT EXISTS idx_scan_results_verdict ON scan_results(overall_verdict);
CREATE INDEX IF NOT EXISTS idx_scan_results_timestamp ON scan_results(scan_timestamp DESC);

-- Enable Row Level Security
ALTER TABLE file_hashes ENABLE ROW LEVEL SECURITY;
ALTER TABLE scan_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE threat_signatures ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Allow public read access
CREATE POLICY "Public read access for file_hashes"
  ON file_hashes
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Public read access for scan_results"
  ON scan_results
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Public read access for threat_signatures"
  ON threat_signatures
  FOR SELECT
  TO public
  USING (true);

-- Insert some default threat signatures
INSERT INTO threat_signatures (signature_name, pattern, threat_type, severity, description) VALUES
('Executable Extension', '\.(exe|bat|cmd|scr|pif|com)$', 'heuristic', 'medium', 'Executable file extension detected'),
('Script Extension', '\.(js|vbs|ps1|sh|py|pl)$', 'heuristic', 'low', 'Script file extension detected'),
('Archive Extension', '\.(zip|rar|7z|tar|gz)$', 'heuristic', 'low', 'Archive file extension detected'),
('Suspicious Filename', '(temp|tmp|test|crack|keygen|patch)', 'heuristic', 'medium', 'Suspicious filename pattern'),
('Malicious String Pattern', '(eval\(|base64_decode|shell_exec|system\()', 'static', 'high', 'Potentially malicious code pattern'),
('PowerShell Obfuscation', '(-enc|-encodedcommand|iex|invoke-expression)', 'static', 'high', 'PowerShell obfuscation detected');