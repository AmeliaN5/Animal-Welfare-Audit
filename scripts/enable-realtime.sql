-- Enable Realtime for all audit tables
-- This allows real-time synchronization between team members

-- Enable realtime publication for checklist_items table
ALTER PUBLICATION supabase_realtime ADD TABLE checklist_items;

-- Enable realtime publication for shared_notes table
ALTER PUBLICATION supabase_realtime ADD TABLE shared_notes;

-- Enable realtime publication for activity_logs table
ALTER PUBLICATION supabase_realtime ADD TABLE activity_logs;

-- Enable realtime publication for category_progress table
ALTER PUBLICATION supabase_realtime ADD TABLE category_progress;
