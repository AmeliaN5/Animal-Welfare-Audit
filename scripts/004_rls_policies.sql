-- Supabase 기본값으로 RLS가 켜져 있으면 anon(브라우저)에서 저장이 막힐 수 있습니다.
-- 001~003 실행 후 insert/update 가 실패하면 이 스크립트를 한 번 실행하세요.

ALTER TABLE checklist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE category_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE shared_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all checklist_items" ON checklist_items;
DROP POLICY IF EXISTS "Allow all category_progress" ON category_progress;
DROP POLICY IF EXISTS "Allow all shared_notes" ON shared_notes;
DROP POLICY IF EXISTS "Allow all activity_logs" ON activity_logs;

CREATE POLICY "Allow all checklist_items" ON checklist_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all category_progress" ON category_progress FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all shared_notes" ON shared_notes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all activity_logs" ON activity_logs FOR ALL USING (true) WITH CHECK (true);
