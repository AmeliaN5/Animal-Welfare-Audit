-- Fix shared_notes table: rename author to author_name
ALTER TABLE shared_notes RENAME COLUMN author TO author_name;

-- Fix category_progress table: add missing progress_percentage column
ALTER TABLE category_progress ADD COLUMN IF NOT EXISTS progress_percentage integer DEFAULT 0;
