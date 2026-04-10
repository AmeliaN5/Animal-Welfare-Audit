# v0-activity-log-duplication

This is a [Next.js](https://nextjs.org) project bootstrapped with [v0](https://v0.app).

## Built with v0

This repository is linked to a [v0](https://v0.app) project. You can continue developing by visiting the link below -- start new chats to make changes, and v0 will push commits directly to this repo. Every merge to `main` will automatically deploy.

[Continue working on v0 →](https://v0.app/chat/projects/prj_Ghi2WEvFvKtFdlYbHMsTG8ZI9scS)

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

## 사이트로 배포하기 (Vercel + 전체 기능)

GitHub 저장소를 포크하거나 ����한 ��� Vercel에서 **Import**하면 공개 URL로 서비스할 수 있습니다. **��이터를 서로 ��이지 않게 하려면** 배�다(���는 ���별� Supabase 프로��트**를 만들고, 그 프로��트의 URL·��만 해당 Vercel 프로��트에 ��으세요. 하나의 Supabase를 여러 공개 사이트가 공유하면 모든 방문�은 ��크리스트·메모**를 보게 ��니다.

### 1) Supabase (�����우드 저장·실시간·다른 기기 동기화)

1. [Supabase](https://supabase.com)에서 프로��트 생성.
2. **Project Settings → API**에서 `Project URL`, `�사.
3. **SQL Editor**에서 **아래 순서대로** 실행합니다. (`scripts/001_create_audit_tables.sql`은 예전 스키마이��로 **실행하지 마세요.**)
   - `scripts/001_create_tables.sql`
   - `scripts/002_fix_columns.sql`
   - `scripts/003_add_attachments.sql`
   - insert/update가 거부되면 `scripts/004_rls_policies.sql` 추가 실행.
4. (선택) **Database → Replication**에서 `checklist_items`, `category_progress`, `shared_notes`, `activity_logs`가 Realtime에 포함�� 있는지 확인합니다. 스크립트의 `ALTER PUBLICATION`이 한 번 실패했다면, 테이블만 있으면 기본 동작합니다.

### 2) Vercel 배포

1. [Vercel](https://vercel.com) → **Add New → Project** → 저장소 선택 → **Deploy** (Framework: Next.js).
2. **Settings → Environment Variables**에 ��고 **Redeploy**.

| 변수 | ��도 |
|------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | 필수 — Supabase 프로��트 URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 필수 — anon� |
| `BLOB_READ_WRITE_TOKEN` | 메모 **��부파일** — Vercel 대시보드에서 Blob 스토�트에 연결하면 자동으로 들어가는 경우가 많음 |
| `GOOGLE_TRANSLATE_API_KEY` | 보고서 한→영 번역 — 없으면 ����� 대체 경로를 시도(속도·한도 제한) |

3. **��부파�려면**: Vercel 프로��트 **Storage → Blob**에서 스토어를 만들고 연결합니다. 로�� 개발 시에는 Vercel에서 **Read-write token**을 ��사해 `.env.local`의 `BLOB_READ_WRITE_TOKEN`에 ��을 수 있습니다.

### 로�� 개발

`.env.example`을 참고해 `.env.local`을 만든 ��� `npm run dev` → [http://localhost:3000](http://localhost:3000).

대시보드 상단에 **�����우드 저장 중**이 보이면 Supabase에 저장 중입니다. 변수가 없으면 **브라�만** 사용합니다.

### 기능 요약

- **Supabase 없음**: UI·체크·메�라우저에만 저장.
- **Supabase 있음**: 동기화·실����우드 ��업(다른 기기 동기화) 등 관련 기능 사용 가능.
- **Vercel Blob**: 메모 사진·파일 ��부(프로��션에서 ����� 필요).
- **번역**: Google ��� 없이도 동작하지만, 안�려면 `GOOGLE_TRANSLATE��장.

## Learn More

To learn more, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.
- [v0 Documentation](https://v0.app/docs) - learn about v0 and how to use it.

<a href="https://v0.app/chat/api/kiro/clone/AmeliaN5/v0-activity-log-duplication" alt="Open in Kiro"><img src="https://pdgvvgmkdvyeydso.public.blob.vercel-storage.com/open%20in%20kiro.svg?sanitize=true" /></a>
