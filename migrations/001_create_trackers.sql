CREATE TABLE IF NOT EXISTS trackers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  keyword TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- index untuk pencarian exact / prefix (nanti kepake search)
CREATE INDEX IF NOT EXISTS idx_trackers_keyword
  ON trackers (keyword);

-- index untuk filtering status (worker & landing)
CREATE INDEX IF NOT EXISTS idx_trackers_status
  ON trackers (status);
