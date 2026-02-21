-- Create the messages table for Wiki CUSAT
CREATE TABLE IF NOT EXISTS public.wiki_cusat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now(),
    room_id TEXT NOT NULL,
    parent_id UUID REFERENCES public.wiki_cusat_messages(id) ON DELETE CASCADE,
    sender_name TEXT NOT NULL,
    content TEXT NOT NULL,
    media_url TEXT,
    media_type TEXT, -- e.g., 'image'
    is_anonymous BOOLEAN DEFAULT false,
    likes INTEGER DEFAULT 0,
    dislikes INTEGER DEFAULT 0
);

-- Table for tracking individual user votes (Like/Dislike)
CREATE TABLE IF NOT EXISTS public.wiki_cusat_votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID REFERENCES public.wiki_cusat_messages(id) ON DELETE CASCADE,
    user_name TEXT NOT NULL,
    vote_type TEXT NOT NULL, -- 'like' or 'dislike'
    UNIQUE(message_id, user_name)
);

-- Enable RLS (Row Level Security) if using Supabase
ALTER TABLE public.wiki_cusat_messages ENABLE ROW LEVEL SECURITY;

-- Allow public read access (for the hackathon)
CREATE POLICY "Allow public read access" ON public.wiki_cusat_messages
    FOR SELECT USING (true);

-- Allow public insert access
CREATE POLICY "Allow public insert access" ON public.wiki_cusat_messages
    FOR INSERT WITH CHECK (true);

-- Index for room-based fetching
CREATE INDEX idx_wiki_cusat_messages_room_id ON public.wiki_cusat_messages(room_id);

-- Enable Realtime for this table
ALTER PUBLICATION supabase_realtime ADD TABLE public.wiki_cusat_messages;
