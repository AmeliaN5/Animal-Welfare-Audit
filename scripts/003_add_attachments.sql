-- Add attachments column to shared_notes table
ALTER TABLE shared_notes 
ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]';
