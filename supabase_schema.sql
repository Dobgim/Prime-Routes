-- Supabase Schema for Prime Routes Logistics

-- 1. Create Shipments Table
CREATE TABLE IF NOT EXISTS shipments (
    id TEXT PRIMARY KEY,
    type TEXT,
    "senderName" TEXT,
    "receiverName" TEXT,
    "senderEmail" TEXT,
    "receiverEmail" TEXT,
    "senderPhone" TEXT,
    "receiverPhone" TEXT,
    origin TEXT,
    destination TEXT,
    weight TEXT,
    status TEXT,
    "shipDate" TEXT,
    "expectedDate" TEXT,
    "expectedTime" TEXT,
    "pieceType" TEXT,
    details TEXT,
    waypoints JSONB DEFAULT '[]'::JSONB,
    timeline JSONB DEFAULT '[]'::JSONB,
    sender TEXT,
    receiver TEXT,
    eta TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create Contacts/Messages Table
CREATE TABLE IF NOT EXISTS contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT,
    email TEXT,
    message TEXT,
    date TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Setup Row Level Security (RLS)
-- If you want to enable public access for anon keys (since this is a simple tracking app without auth):
ALTER TABLE shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access on shipments"
ON shipments FOR SELECT
USING (true);

CREATE POLICY "Allow public insert on shipments"
ON shipments FOR INSERT
WITH CHECK (true);

CREATE POLICY "Allow public update on shipments"
ON shipments FOR UPDATE
USING (true);

CREATE POLICY "Allow public delete on shipments"
ON shipments FOR DELETE
USING (true);

CREATE POLICY "Allow public read access on contacts"
ON contacts FOR SELECT
USING (true);

CREATE POLICY "Allow public insert on contacts"
ON contacts FOR INSERT
WITH CHECK (true);

CREATE POLICY "Allow public delete on contacts"
ON contacts FOR DELETE
USING (true);
