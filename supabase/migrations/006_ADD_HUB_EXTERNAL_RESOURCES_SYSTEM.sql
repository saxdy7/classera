-- Migration to support the Student Learning Hub with persistent scraped data
-- Stores external courses and hackathons from Tavily

CREATE TABLE IF NOT EXISTS hub_external_resources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type TEXT NOT NULL CHECK (type IN ('course', 'hackathon')),
    title TEXT NOT NULL,
    description TEXT, -- Short description/snippet
    content TEXT,     -- Detailed content if available from scrapers
    url TEXT UNIQUE NOT NULL,
    image_url TEXT,
    source TEXT,
    location TEXT,    -- For hackathons (Global/City/Online)
    deadline TIMESTAMP WITH TIME ZONE, -- Closing date/time
    difficulty TEXT,  -- For courses (Beginner/Intermediate/Advanced)
    duration TEXT,    -- For courses (e.g. 4 weeks, 20 hours)
    metadata JSONB DEFAULT '{}'::jsonb, -- Store raw extra info
    last_updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE hub_external_resources ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read external resources
CREATE POLICY "Anyone can view hub resources"
    ON hub_external_resources FOR SELECT
    USING (true);

-- Allow admins/service/AI system to insert/update (keeping it simple for now)
-- The scraper runs as a system process via API
CREATE POLICY "System can manage hub resources"
    ON hub_external_resources FOR ALL
    USING (true)
    WITH CHECK (true);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_hub_resources_type ON hub_external_resources(type);
CREATE INDEX IF NOT EXISTS idx_hub_resources_updated ON hub_external_resources(last_updated_at);
