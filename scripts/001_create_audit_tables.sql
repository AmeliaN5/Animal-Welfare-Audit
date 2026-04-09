-- 체크리스트 상태 테이블
CREATE TABLE IF NOT EXISTS checklist_items (
  id TEXT PRIMARY KEY,
  category_id TEXT NOT NULL,
  is_checked BOOLEAN DEFAULT FALSE,
  checked_by TEXT,
  checked_at TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in-progress', 'completed', 'issue')),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 공용 메모 테이블
CREATE TABLE IF NOT EXISTS shared_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id TEXT NOT NULL,
  category_id TEXT NOT NULL,
  content TEXT NOT NULL,
  author_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 활동 기록 테이블
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id TEXT,
  category_id TEXT NOT NULL,
  action_type TEXT NOT NULL CHECK (action_type IN ('check', 'uncheck', 'note_added', 'note_updated', 'status_changed')),
  action_by TEXT NOT NULL,
  action_details TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 카테고리 진행률 테이블
CREATE TABLE IF NOT EXISTS category_progress (
  category_id TEXT PRIMARY KEY,
  total_items INTEGER DEFAULT 0,
  completed_items INTEGER DEFAULT 0,
  in_progress_items INTEGER DEFAULT 0,
  issue_items INTEGER DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS 비활성화 (공용 협업 앱이므로 인증 없이 접근 가능)
ALTER TABLE checklist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE shared_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE category_progress ENABLE ROW LEVEL SECURITY;

-- 모든 사용자에게 읽기/쓰기 권한 부여 (공용 협업)
CREATE POLICY "Allow all access to checklist_items" ON checklist_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to shared_notes" ON shared_notes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to activity_logs" ON activity_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to category_progress" ON category_progress FOR ALL USING (true) WITH CHECK (true);

-- Realtime 활성화
ALTER PUBLICATION supabase_realtime ADD TABLE checklist_items;
ALTER PUBLICATION supabase_realtime ADD TABLE shared_notes;
ALTER PUBLICATION supabase_realtime ADD TABLE activity_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE category_progress;

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_checklist_category ON checklist_items(category_id);
CREATE INDEX IF NOT EXISTS idx_notes_item ON shared_notes(item_id);
CREATE INDEX IF NOT EXISTS idx_notes_category ON shared_notes(category_id);
CREATE INDEX IF NOT EXISTS idx_logs_category ON activity_logs(category_id);
CREATE INDEX IF NOT EXISTS idx_logs_created ON activity_logs(created_at DESC);
