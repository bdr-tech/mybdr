# 운영 DB 동기화 계획 (초안)

> 작성: 2026-04-20 (W4 마감 + audit 후)
> 상태: **초안 — 원영 협의 필요**
> 관련 lesson: `.claude/knowledge/lessons.md` 2026-04-18 ".env가 사실 운영 DB였다"

---

## 1. 현황 (문제 정의)

### 1-1. 개발/운영 DB 미분리 상태
- `CLAUDE.md` 서술: **"개발 DB: Supabase 개발 전용 (운영 분리)"**
- 실제 `.env` `DATABASE_URL`: `aws-1-ap-northeast-2.pooler.supabase.com` (프로젝트 ref **bwoorsgoijvlgutkrcvs**) — 이 ref가 **운영 DB**
- `.env.local` 에 `DATABASE_URL` 오버라이드 **없음** → 로컬 `npm run dev`도 운영 DB 직접 사용 중
- 스크립트 가드(`DEV_DB_HOST`)가 "개발 DB 식별자"라 믿었지만 실제로는 운영 DB ref를 가리킴 — **가드 무력화**
- 결과: 2026-04-17 backfill 147건 + game_type 재분류 66건이 운영 DB에 실행됨 (비파괴 UPDATE라 사고는 아님, lessons.md 2026-04-18 참조)

### 1-2. 위험
- **파괴적 스크립트 실행 리스크**: `scripts/_templates/` DELETE 금지·UPDATE only 원칙은 있지만 실수 여지 존재
- **개발 중 실데이터 오염**: Playwright 테스트, `prisma db push`, 마이그레이션 시도 등이 모두 운영에 영향
- **Flutter 앱 테스트 데이터 오염**: 이미 errors.md에서 관측됨 (미래 live 경기)
- **개발자 간 충돌**: 여러 개발자가 같은 운영 DB에서 스키마 변경 시도 → 최악의 경우 prisma db push로 타 브랜치 테이블 drop (2026-04-15 사고)

---

## 2. 목표 상태

1. **개발 DB가 별도 Supabase 프로젝트**로 분리. 고유 ref 확인 가능
2. `.env.local` 에 **localhost + 개발 DB URL** 오버라이드 기본 (`.env`는 Vercel 배포용 운영 DB 유지)
3. 모든 스크립트 가드가 **실제 개발 DB ref를 기준**으로 검증 통과
4. 운영 DB 스냅샷을 개발 DB에 **주기적 동기화** (익명화 후)
5. `prisma db push` / 마이그레이션은 **개발 DB에서만** 허용. 운영은 수동 검토 후 migrate deploy

---

## 3. 옵션 3종

### 옵션 A — Supabase "두 번째 프로젝트" 신설 (추천)
- 새 Supabase 프로젝트 생성 (무료 tier 가능 여부 확인 필요. 운영 DB 크기 기준)
- 운영 스키마를 `prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma` 로 개발 DB에 적용
- 초기 데이터: 운영에서 pg_dump → **PII 익명화 후** 개발 복원
  - 익명화 대상: users.phone, users.name (nickname 유지), email, 결제 정보, 토스페이먼츠 tx_id
- 이후 **주 1회** 또는 **월 1회** 동기화 cron (GH Actions)

### 옵션 B — Branch DB (Supabase Preview Branching)
- Supabase Pro 플랜 필요 (유료)
- PR별 preview DB 자동 생성 → 머지 시 자동 폐기
- 장점: Vercel preview + 각각 독립 DB
- 단점: 요금. 또 브랜치별 seed 전략 별도 필요

### 옵션 C — Docker 로컬 PostgreSQL
- 개발자 각자 로컬 Docker `postgres:16`
- 장점: 네트워크 없이도 개발, 완전 격리
- 단점: 초기 seed 전략 복잡. Supabase RLS / Auth / Storage 쓰지 않는다면 가능. 현 구조는 Supabase Auth 의존 낮아 가능성 있음

### 추천 = **A (두 번째 Supabase 프로젝트)**
- 현 구조 영향 최소. Flutter 앱·Vercel 배포·인증 그대로
- 원영/수빈 둘 다 접근 가능한 단일 개발 DB

---

## 4. 선결 조건 (원영 확인 필요)

> 2026-04-22 협의 진행 — **6건 중 5건 확정**, Flutter 1건 대기

- [x] **Supabase 청구 플랜 확인** — ✅ 계정당 **프로젝트 2개 생성 가능** (원영, 2026-04-22). 옵션 A 실현 가능
- [x] **운영 DB 크기** — ✅ 현재 무료 tier 500MB지만 **원영이 증설 예정** (2026-04-22). 용량 제약 해제
- [x] **익명화 스크립트 작성 합의** — ✅ PII 치환 범위 확정 (수빈 승인, 2026-04-22):
  - `email` → `user-{id}@dev.local` (unique 제약 충족)
  - `passwordDigest` → 고정 bcrypt (공용 개발 비번)
  - `name` → null 또는 `"테스터{id}"`
  - `phone` / `bank_name` / `bank_code` / `account_number` / `account_holder` / `toss_id` / `oauth_token` / `oauth_expires_at` / `birth_date` / `provider` / `uid` → null
  - 유지: `nickname` / `height` / `weight` / `city` / `district` (비-PII)
  - 추가 대상: `payments.*` 결제 정보 / `community_posts.content` / `comments.content` freetext 휴리스틱 치환
- [x] **동기화 주기** — ✅ **매주 일요일 새벽 3시 자동 + `/admin` 수동 실행 버튼** (수빈 결정, 2026-04-22). GH Actions cron + `workflow_dispatch`, 카페 sync 구조 재활용. 긴급 시 수동 1클릭
- [ ] **Flutter 앱의 개발용 DATABASE_URL** — ⏳ **원영 추가 확인 중** (2026-04-22). 질문 재정의: 앱이 서버 API BASE_URL(예: `mybdr.kr` vs `mybdr-git-dev-mybdr.vercel.app`)을 빌드별로 분기 가능한지. 불가 시 앱 테스트가 운영 DB를 계속 호출 → 분리 효과 반감
- [x] **super_admin 계정** — ✅ 개발 DB에 **공용 `admin@dev.local` 1개** 생성 (수빈 승인, 2026-04-22). `admin_role="super_admin"` + `isAdmin=true`. `scripts/seed-dev-admin.ts` 신규 예정

### 담당 분업 (2026-04-22 확정)
- 스크립트 작성 (익명화 dump + seed-dev-admin + 동기화 cron) → **수빈**
- 리뷰 + Flutter 앱 영향 범위 확인 → **원영**

---

## 5. 예상 공수 (옵션 A 기준)

| 단계 | 작업 | 공수 |
|------|------|------|
| 1 | Supabase 프로젝트 생성 + 리전·네이밍 결정 | 10분 |
| 2 | prisma migrate diff 로 초기 스키마 적용 | 1h |
| 3 | 익명화 dump 스크립트 (`scripts/anonymize-dump.sh` 신규) — PII 치환 | 2~3h |
| 4 | 개발 DB seed 복원 + 연결 테스트 (dev 서버 + tsc + 주요 API smoke) | 1h |
| 5 | `.env.local` 템플릿 업데이트 + CLAUDE.md 규칙 재작성 (실태 반영) | 30분 |
| 6 | 스크립트 가드 DEV_DB_HOST 교체 + 회귀 | 30분 |
| 7 | 동기화 cron 스크립트 (GH Actions or Vercel Cron) | 1~2h |
| 8 | 팀 공지 + 동기화 첫 실행 검증 | 30분 |
| **합계** | | **~7~9h** |

---

## 6. 작업 순서 제안

1. **원영 협의 (30분)** — 옵션 A 수용 여부 + 선결 조건 답변 + 예산 OK
2. **Supabase 프로젝트 생성 + 스키마 적용** (1~2h) — 수빈 or 원영
3. **익명화 dump 스크립트** (2~3h) — 누가 작업할지 분담
4. **첫 동기화 실행 + 팀 전환** (1h) — 모두가 `.env.local` 갱신
5. **CLAUDE.md 실태 반영 + 가드 재설정** (30분) — 수빈 (PM)
6. **동기화 cron** (별도 이터레이션) — Phase 3 카페 동기화 자동화와 유사 구조 재활용 가능

---

## 7. 리스크 · 주의

- **Flutter 앱 환경 분리**: 앱 쪽에서 개발 DB용 JWT/URL 환경이 없으면 앱 테스트는 계속 운영 DB 사용 → 별도 이슈
- **운영 DB 용량 증가 시 재동기화 비용**: 주기가 잦을수록 트래픽·시간 부담
- **익명화 누락**: 휴대폰/실명/이메일 외에 freetext(게임 제목, 커뮤니티 게시글 등)에 PII가 들어있을 수 있음 — 휴리스틱 검증 필요
- **개발 DB에서 재현 안 되는 운영 버그**: 동기화 빈도가 낮으면 운영만의 상태 버그가 개발에 없을 수 있음 → 보조로 **운영 읽기 전용 replica 계정** 고려

---

## 8. 개발자 온보딩 체크리스트 (옵션 A 완료 후)

```markdown
1. 운영 `.env` 는 Vercel에만 저장. 로컬 `.env` 파일은 **개발 DB URL**로 설정
2. `.env.local` 에는 localhost:3001 auth/CORS 오버라이드만 (기존 그대로)
3. 개발 시 `prisma db push`/마이그레이션은 **개발 DB에서만 실행**
4. 운영 반영은 `prisma migrate deploy` + 원영/수빈 둘 다 확인 후
5. 스크립트 실행 전 `echo $DATABASE_URL | grep <dev-db-ref>` 로 가드
```
