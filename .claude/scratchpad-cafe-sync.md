# 다음카페 동기화 세션 스크래치패드

> 🚨 **이 파일은 다음카페 sync 전용 세션만 사용**
> 사용자가 **"다음카페 작업 시작하자"** 하면 PM은 이 파일을 **먼저 읽는다**.
> UX/기능 작업 세션(`scratchpad.md`)과 **명확히 분리**. 서로 건드리지 않는다.

---

## 🎯 세션 범위 (건드려도 되는 파일)

| 디렉토리 / 파일 | 역할 |
|-----------------|------|
| `scripts/sync-cafe.ts` | 메인 동기화 실행기 (목록+본문+upsert) |
| `scripts/cafe-login.ts` | Playwright 쿠키 생성 |
| `scripts/_tmp-*.ts` | 일회성 검증/삭제 스크립트 |
| `scripts/inspect-games-cafe-meta.ts` | DB 조사 |
| `scripts/backfill-*cafe*.ts` | 카페 관련 백필 |
| `src/lib/cafe-sync/*` | fetcher / article-fetcher / upsert / extract-fallbacks / board-map |
| `src/lib/security/mask-personal-info.ts` | 카페 본문 마스킹 |
| `src/lib/parsers/cafe-game-parser.ts` | **수정 금지** (vitest 59/59 보호) |
| `Dev/cafe-sync-plan-*.md` | 카페 기획 문서 |
| (Phase 3) `.github/workflows/cafe-sync.yml` | GH Actions 워크플로우 |
| (Phase 3) `src/app/(web)/admin/cafe-sync/**` | admin UI |

## 🚫 이 세션에서 금지 파일 (UX 세션 영역)

- `src/app/(web)/` 일반 페이지 (admin/cafe-sync 제외)
- `src/app/api/web/` 일반 API
- `src/components/` 공용 컴포넌트
- 프로필/대회/팀/경기(일반 사용자) 관련 모든 UX

## 📂 연관 지식 파일

- `.claude/knowledge/decisions.md` — 크롤링 정책 9가드 (04-19)
- `.claude/knowledge/errors.md` — 403 쿠키 이슈, apiSuccess snake_case 교훈
- `.claude/knowledge/conventions.md` — 운영 DB 가드 패턴
- `Dev/cafe-sync-plan-2026-04-19.md` — 상세 계획서 (628줄)

---

## 📊 현재 상태 (2026-04-20 기준)

### DB
- `games`: **174건** (일반 159건 + 카페 출처 15건)
- `cafe_posts`: **15건** (IVHA 5 / Dilr 5 / MptT 5)
- 모든 카페 레코드 `cafe_created` 저장 완료
- 모든 카페 레코드 `games.created_at = 카페 게시 시각` (정렬 기준)

### 원격 subin HEAD
- **`ddad719`** (push 완료, 2026-04-20)

### 개발 DB
- Supabase 개발 프로젝트 (`bwoorsgoijvlgutkrcvs`)
- 운영 DB 가드 2중 적용 (`upsert.ts` + `sync-cafe.ts`)

### 쿠키
- `.auth/cafe-state.json` (04-19 19:35 생성, **만료 확인 필요**)

---

## 🏁 Phase 진행 상황

| Phase | 단계 | 상태 | 핵심 커밋 |
|-------|------|------|-----------|
| 1 | 3게시판 목록 POC (30건 수집) | ✅ 완료 | PR #39 |
| 2a | 본문 fetch + 마스킹 (dry-run) | ✅ 완료 | `2890224` / `55d78c3` |
| 2b Step 1 | upsert.ts + `--execute` 통합 | ✅ 완료 | `546a5c3` |
| 2b Step 4 | extract-fallbacks (6필드 재추출) | ✅ 완료 | `6d2dac5` |
| 2b 품질 보강 | 마스킹 3중 + script 제거 + venue/시간 | ✅ 완료 | `2af6719` |
| 2b 지속동기화 기반 | postedAt fallback + created_at 덮어쓰기 + MptT 강제 + DISTRICT_TO_CITY | ✅ 완료 | `4826018` |
| 3 | GH Actions 자동화 | ⏳ **대기** | — |

---

## 🧭 Phase 3 체크리스트 (다음 세션에서 할 일)

| # | 작업 | 예상 | 비고 |
|---|------|------|------|
| 1 | `.github/workflows/cafe-sync.yml` 작성 | 30분 | 30분 cron + Playwright + secrets |
| 2 | GitHub Secrets 등록 | 15분 | `DAUM_CAFE_STORAGE_STATE_B64` / `DATABASE_URL_DEV` / `SLACK_WEBHOOK` |
| 3 | 쿠키 자동 갱신 스크립트 (`scripts/refresh-cookie.ts`) | 30분 | 로컬 재로그인 → base64 encode → `gh secret set` |
| 4 | Slack/Discord 실패 알림 | 15분 | `if: failure()` + webhook |
| 5 | `/admin/cafe-sync` 페이지 | 90분 | 수동 트리거(gh api) + 수집 통계 + 쿠키 만료 경고 |
| 6 | **Pagination** (20건 상한 극복) | 45분 | Daum 카페 모바일 목록 URL 분석 + `?page=N` 또는 커서 |
| 7 | **시분 정확도** (목록+상세 결합) | 45분 | BoardItem.postedAt 날짜 + `.num_subject` 시분 결합 |
| 8 | **city 추출률** 개선 | 30분 | DISTRICT_TO_CITY 확장 + 광역 표기 변형 |
| 9 | 전체 수집 테스트 | 실행 시간만 | 각 게시판 100건+ |
| **합계** | — | **~5~6시간** | 집중 2~3세션 권장 |

---

## 🚀 세션 시작 시 체크리스트 ("다음카페 작업 시작하자" 트리거)

```
1. git fetch origin --prune + 원격 subin 동기화
2. .auth/cafe-state.json 존재 + 만료 여부 확인
3. 만료 시: npx tsx scripts/cafe-login.ts 재실행
4. Phase 2a 재검증 스모크:
   npx tsx --env-file=.env --env-file=.env.local scripts/sync-cafe.ts \
     --board=IVHA --limit=3 --with-body --article-limit=2
   → 본문 200 OK × 2/2 + upsert 예정 미리보기 확인
5. DB 상태 확인:
   npx tsx --env-file=.env --env-file=.env.local scripts/inspect-games-cafe-meta.ts
6. 이 파일의 Phase 진행 상황 확인 → 다음 작업 선택
7. 본 세션의 scratchpad.md 는 건드리지 않음 (UX 세션 전용)
```

---

## 🎛️ 주요 결정 이력

### D1 — 신규 INSERT metadata 키 포맷 (2026-04-19)
**B 선택**: `cafe_dataid` / `cafe_board` / `source_url` 분리 키 + `cafe_source_id` 구 호환 병기.

### D2 — cafe_source_id 누락 9건 처리 (2026-04-19)
**A 선택**: 스킵 → **이후 카페 출처 전부 DELETE로 자연 해소**.

### D3 — 역방향 백필 매칭 (2026-04-19)
**A 선택**: 정규식 매칭 → **이후 DELETE로 미실행**.

### 카페 출처 DB 초기화 (2026-04-20)
**카페 출처 118건 DELETE + cafe_posts 15건 DELETE**. 일반 159건 보존. 사용자 승인.
근거: 외부 크롤러 데이터와 Phase 2b 데이터 혼재 해소 + 깨끗한 재시작.

### PRACTICE 게시판 board 강제 (2026-04-20)
**MptT는 `board.gameType` 값 고정**. parser가 "게스트 모집" 키워드로 GUEST 오분류 방어.
IVHA/Dilr는 혼재 글 많으므로 parser 재분류 유지.

### /games 정렬 정책 (2026-04-20)
**`games.created_at = 카페 게시 시각(postedAt)` 저장** → `orderBy: created_at desc` 자연스러운 카페 최신 순.
일반 게임은 이 코드 경로 안 타므로 영향 없음.

### Phase 3 아키텍처 — GitHub Actions 주력 + Coworker 보조 (2026-04-20)
- **GH Actions (30분 cron)**: Playwright + Secrets + 자동 로그/알림. 비용 0.
- **Claude Coworker (옵션)**: 실패율 임계치 시 정규식 보강/디버깅. 비용 절약.
- **비추천**: Coworker 주력 (결정적 로직이라 AI 판단 불필요, 매 30분 토큰 낭비)

---

## 💡 운영 팁 (카페 sync 전용)

- **tsx 실행**: `--env-file=.env --env-file=.env.local` (둘 다 지정 필수. DATABASE_URL은 `.env`만 있음)
- **쿠키 갱신**: `npx tsx scripts/cafe-login.ts` (브라우저 headed → 로그인 → Enter)
- **storageState 경로 override**: 환경변수 `DAUM_CAFE_STORAGE_STATE=/path/to.json`
- **한 페이지 상한**: **20건** (Daum 카페 HTML articles.push 블록 수)
- **운영 DB 가드**: `DATABASE_URL`에 `bwoorsgoijvlgutkrcvs` 포함 여부 검사 (upsert.ts + sync-cafe.ts 2중)
- **개발 서버 재시작**: `netstat -ano | findstr :3001` → `taskkill //f //pid <PID>` (node.exe 통째 금지)
- **임시 스크립트 네이밍**: `scripts/_tmp-*.ts` (검증/삭제 후 즉시 삭제)

---

## ⚠️ 알려진 한계 (Phase 3에서 해결)

| # | 한계 | 현재 실측 | 목표 |
|---|------|-----------|------|
| 1 | **Pagination 없음** | 각 게시판 최근 20건만 접근 | 전체 수집 (카페 페이지 전 순회) |
| 2 | **시분 정확도** | 당일 글만 시분 정확, 과거 글은 날짜만(시분 0:00) | 전체 시분 정확 |
| 3 | **city 추출률** | 13% (역매핑 적용 후) | 80%+ |
| 4 | **venue 추출** | 73% (주소성 거부 후) | 85%+ |
| 5 | **parseCafeGame 정확도** | IVHA 낮고 Dilr/MptT 높음 (본문 양식 차이) | 유지 (parser 수정 금지) |

---

## 📜 작업 로그 (카페 sync 전용, 최근 10건)

| 날짜 | 작업 | 커밋 |
|------|------|------|
| 04-20 | **Phase 2b 지속동기화 기반** — postedAt fallback / created_at=카페게시순 / MptT PRACTICE 강제 / DISTRICT_TO_CITY 역매핑. 카페 출처 118건 초기화 + 3게시판 각 5건 재수집 | `4826018` |
| 04-20 | **Phase 2b 품질 종합 보강** — 마스킹 3중 방어 + script 제거 + venue 20자 제한 + 시간 정규식 확장 | `2af6719` |
| 04-19 | **Phase 2b Step 4 (extract-fallbacks)** — 본문 재추출 (scheduledAt/fee/venue/city/district/skillLevel) | `6d2dac5` |
| 04-19 | **Phase 2b Step 1** — upsert.ts 신규 + sync-cafe `--execute` 통합 + 운영 DB 2중 가드 | `546a5c3` |
| 04-19 | **Phase 2a 완료** — Playwright `cafe-login.ts` + storageState 쿠키 로드 → 본문 200 × 2/2 | `55d78c3` |
| 04-19 | **Phase 2a 코드** — mask-personal-info + article-fetcher + sync-cafe `--with-body` | `2890224` |
| 04-19 | **cafe-sync 계획 문서** (`Dev/cafe-sync-plan-2026-04-19.md`, 628줄) | `3cd61c4` |
| 04-19 | **Phase 1 POC** — 3게시판 30건 실제 수집 (articles.push 정규식) | PR #39 |
| 04-19 | 다음카페 크롤링 법적/기술 리스크 리서치 (9가드 decisions 승격) | — |

---

## 🔗 관련 PR

- **PR #39** (머지됨, 2026-04-19) — Phase 1 POC 포함
- **PR #45** (머지됨, 2026-04-19) — Phase 1 + 2a + Step 1 통합
- **PR #46** (OPEN, 작업 중) — UX 세션 주도, 카페 커밋들이 fast-forward로 자연 합류
