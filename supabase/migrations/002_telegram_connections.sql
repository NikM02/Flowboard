CREATE TABLE telegram_connections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  chat_id TEXT NOT NULL,
  bot_token_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE telegram_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own telegram connection"
  ON telegram_connections FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own telegram connection"
  ON telegram_connections FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own telegram connection"
  ON telegram_connections FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own telegram connection"
  ON telegram_connections FOR DELETE
  USING (auth.uid() = user_id);
