# 작업 스크래치패드

## ⚠️ 세션 분리 원칙 (필수, 2026-04-21 재정의)
> 2026-04-21부로 **본 세션 역할 뒤집음** — 이전 합의(본=일반)는 폐기

- **본 세션 (Claude Code, 이 터미널)** = **다음카페 sync 전용**
  - 허용 파일: `scripts/sync-cafe.ts`, `scripts/cafe-login.ts`, `scripts/_tmp-cafe-*`, `scripts/backfill-*cafe*.ts`, `src/lib/cafe-sync/**`, `src/lib/parsers/cafe-*.ts`, `Dev/cafe-*.md`, `Dev/prompt-cafe-*.md`, 프리즈마 cafe 관련 migration
  - 커밋 스코프 **필수**: `feat(cafe-sync):` / `fix(cafe-sync):` / `docs(cafe-sync):` / `chore(cafe-sync):` / `refactor(cafe-sync):`
- **다른 세션 (병행)** = 일반 UX/기능 작업 — `(web)`/`(api/web)`/`(referee)`/`profile`/`tournaments` 등
- **본 세션 PM 금지 파일**: 위 허용 목록 외 전부. 특히 `src/app/(web)/**`, `src/app/api/web/**`, `src/components/profile/**`, `src/app/(site)/**`, `src/app/api/v1/**`(카페 관련 제외)
- **브랜치**: 양 세션 모두 `subin` 공용 (분리 안 함). 충돌 발생 시 `subin-cafe` 분리 재검토
- **push 전 `git fetch origin subin` 필수** → 뒤처지면 `git pull --rebase`
- **scratchpad**: 공용 유지. 카페 작업은 "카페 작업 로그" 섹션에 별도 기록 (담당 = `pm-cafe`)
- **PR**: 본 세션은 카페 전용 신규 PR로. PR #55(혼재)는 그대로 머지 예정

## 📍 다음 세션 진입점 (2026-04-21~ "이어서 하자" 시 이 순서대로)

### 🥇 1순위 — W4 + L3 + L2 통합 스모크 테스트 (수빈 수동, 1.5h)
- **W4**: `/profile/activity` / `/help/glossary` / 팀 상세 가입 UI / M6 알림 / M3 코트 지도 / M5 온보딩 / 카페 Phase 3 자동화
- **L3**: Organization 2단 / Series(under org) 3단 / Tournament 소속 시리즈 카드 + EditionSwitcher (1회차/중간/최종/null 혼재)
- **[신규] L2**: `/users/[id]` 본인/타인 분기 + 레벨 배지(Lv.N) 통합 + Teams 섹션(공개만) / `/profile` 대시보드 재정의 + 편집 경로 `/profile/edit` 확인
- **조합**: PC × 모바일 × 다크 × 라이트 4조합
- **결과는 scratchpad 수정 요청 테이블에 기록**
- **개발 DB 시드 follow-up**: Organization 1 + Series 1 + Tournament 3~4개(edition_number 혼재) + 공개 팀 1~2개 — 회귀 테스트용

### 🥈 2순위 — 원영 협의 (30분~1h)
- **문서**: `Dev/ops-db-sync-plan.md` (6개 선결 조건 체크박스) + `Dev/advancement-roadmap-2026-04-20.md` 10-2 아젠다
- **옵션 A** 추천 (Supabase 두 번째 프로젝트)
- 협의 완료 시 → 2026-04-18 lessons "개발 DB라 믿은 .env" 사건의 장기 해결 시작 + PR #54 원영 승인

### 🥉 3순위 — 점진 정비 (보이스카우트)
- 하드코딩 색상 잔존 ~30 파일 (lessons.md 2026-04-20 audit 목록)
- `any` 타입 9회 / 8 파일
- **원칙**: 해당 파일을 다른 이유로 건드릴 때 함께 정비

### 4순위 — L3 + L2 reviewer 권장 후속 (nice-to-have)
- **L3**: tournaments/[id] 쿼리 합치기 / series.is_public 체크 / `<img>` → next/image / EditionSwitcher flex-wrap
- **L2**: OwnerEditButton 공용 추출(2곳 중복) / action-buttons.tsx `text-white` (conventions 위배) / Teams `<h3>` heading 계층 / 긴 팀명 title 툴팁

## 현재 상태 스냅샷 (2026-04-21 세션 마감)

| 항목 | 값 |
|------|-----|
| 브랜치 | subin |
| subin HEAD | **`b5f5e5a`** (any 3건 명시 타입화) |
| origin/subin | `b5f5e5a` ✅ (동기화 완료) |
| main / dev | `8de9be4` (PR #53 squash, PR #54 대기) |
| 미푸시 | **0건** ✅ |
| 백업 브랜치 | `subin-backup-2026-04-20` (f1779ff, 옵션 F 직전) — 1주일 후 삭제 권장 |
| 오늘 PR merge | #47~#53 (6건) |
| 열린 PR | **#54** (dev→main, 원영 승인 대기) / **#55** (subin→dev, 통합 리뷰 대기) |
| L2 상태 | 공용 3종 + gamification 헬퍼 + /users/[id] 본인 분기 + Teams + /profile 대시보드 재정의 (PR #55 대기) |
| L3 상태 | Organization brc + EditionSwitcher + SeriesCard ✅ dev 머지 완료 (PR #53) |
| 보이스카우트 | reviewer 5건 + 색상 7파일 + any 3건 정비 (PR #55 통합) |
| 카페 Phase 3 | GH Actions + 쿠키 갱신 + Slack + Pagination + 품질 검증봇 + game_type 분류 수정 **운영 반영** ✅ |

## W1~W4 + L3 + L2 완료 요약 (2026-04-19 ~ 04-21)
| 주차/항목 | 내용 | 계획 | 실제 |
|------|------|------|------|
| W1 | Q1~Q12 (라우트/네비/배지/발견성/폴리시) | 20h | ~12h |
| W2 | M1 좌측 네비 + M2 대회 sticky | 10h | ~6h |
| W3 | M3/M5/M6 | 20h | ~7h |
| W4 | M4/M7/L1 + Day 20 회고 + 후속 정비 | 17h | ~3h |
| L3 | Organization brc + EditionSwitcher + SeriesCard | 3h | ~1.5h |
| L2 | 본인·타인 프로필 통합 + 공용 3종 + 대시보드 재정의 + 티어→레벨 | 15h | ~2h |
| **합계** | **4주 + L2·L3** | **~85h** | **~31.5h** (2.7배 절감) |

## 🗂 카페 작업 로그 (본 세션 전용 — 2026-04-21~)
| 날짜 | 담당 | 작업 | 결과 |
|------|------|------|------|
| 04-22 | pm-cafe | **"중" 범위 정책 완료 — bWL 200 + N54V 400** (offset 분할). bWL 1차 50new+49dup+1empty, 2차 99new+1empty (누적 199). N54V 1차 95new+5empty, 2차 94+6empty, 3차 100, 4차 97+3empty (누적 386). **최종 community_posts 1073건** (E7hL 396 + N54V 386 + bWL 199 + IVd2 92). postId 272~1344. 4게시판 파이프라인 전량/상한 스냅샷 이전 완료 | ✅ docs |
| 04-21 | pm-cafe | **E7hL 실질 전량 이전 완료** — `--offset` 옵션으로 4회 분할 (`--max-pages=20 --article-limit=100 --execute` × 4, offset 0/100/200/300). 1차 47신규+50dup+3empty, 2차 99+1empty, 3차 100, 4차 100. 목록 400건 중 396건 created. 누적 538건 (시점). 시간 범위 **2021-11-28 ~ 2026-04-21 (4.5년치)**. postId 272~809 | ✅ fce8805(offset) + 5a5104a |
| 04-21 | pm-cafe | **backfill 스크립트 `--offset` 옵션 추가** — `items.slice(0, N)` → `items.slice(offset, offset+N)`. 대규모 게시판 100건씩 분할 처리 가능. 기본 0(호환), 상한 400(max-pages=20 × 20건). tsc OK | ✅ fce8805 |
| 04-21 | pm-cafe | **IVd2 전량 이전 완료** — `--article-limit=95 --execute` 1회. listed=95 / body=92 / created=92 / failed=0 / skipped(dup)=0. 3건 차이는 본문 비어있는 글(삭제/보호) 자연 스킵. postId 369~463. 누적 192건 (시점 기록) | ✅ 98f26f6 |
| 04-21 | pm-cafe | **backfill 스크립트 `--article-limit` 상한 50→100** — IVd2 등 100건 이내 소규모 게시판 1회 전량 처리 가능. 기타 가드 유지. tsc OK | ✅ 0febceb |
| 04-21 | pm-cafe | **N54V + IVd2 dry-run** — 각 5건 본문 fetch. N54V category=general (원본 닉네임 유지, dataid 63923 활발 게시판), IVd2 category=anonymous + **author="익명" 강제 오버라이드 Q3 결정 실전 검증 완료** (전체 ~95건 신설 게시판). **7게시판 파이프라인 전량 검증 완료** (IVHA/Dilr/MptT 운영 + E7hL/bWL 실전 + N54V/IVd2 dry-run) | ✅ a84d191 |
| 04-21 | pm-cafe | **Stage B-1 확대 — E7hL/bWL 각 50건 이전** (`--article-limit=50 --execute` × 2). E7hL postId 272~326 / bWL postId 277~281 + 327~371. 각 `created=45 / skipped(dup)=5 / failed=0`. 규모 검증: category recruit:50/review:50, 시간범위 2025-07-09 ~ 2026-04-21. E7hL 9개월치(연 ~70건 추정, 전량 부담↓) / bWL 최근 며칠~주 (연 수천~수만, **전량 이전 전 범위 정책 논의 필요**) | ✅ a5d62a6 |
| 04-21 | pm-cafe | **Stage B-1 실전 INSERT 10건** — E7hL 5건(postId 272~276, category=review) + bWL 5건(postId 277~281, category=recruit). 모두 user_id=3004(봇) 통합 + author_nickname 원본 유지 + images JSON cafe_source_id 정상. title HTML entity는 설계상 DB 원본 보존(렌더 시점 디코드). 렌더 측 community 경로 `decodeHtmlEntities` 누락은 수정 요청 테이블에 인계 | ✅ (DB only, 커밋 없음) |
| 04-21 | pm-cafe | **Stage B 선결 ③** — E7hL/bWL dry-run 각 5건 본문 fetch 성공(쿠키 재발급 효과 확인). 매핑/중복/포맷 모두 정상 | ✅ (DB only) |
| 04-21 | pm-cafe | **Stage B 선결 ②** — 개발 DB 카페 봇 유저 seed (`seed-cafe-bot-user.ts --execute`). `cafe-bot@mybdr.local` / id=3004 생성. 멱등 확보 | ✅ (DB only, 커밋 없음) |
| 04-21 | pm-cafe | **game_type 오분류 설계안 + 실행 프롬프트 문서 커밋** (Dev/cafe-classification-fix-2026-04-21.md / Dev/prompt-cafe-classification-fix.md, 400줄). 대응 코드는 이미 머지됨(4fd75e4) | ✅ 8c0223a |
| 04-21 | pm-cafe | **세션 재정의 — 본 세션 = 카페 전용** (scratchpad 원칙 뒤집음 + decisions.md 78항목 기록 + index.md 갱신) | ✅ aef2dcd |

## 수정 요청
| 요청자 | 대상 파일 | 문제 설명 | 상태 |
|--------|----------|----------|------|
| 수빈(스모크 L3-2) | `src/app/(web)/organizations/[slug]/series/[seriesSlug]/page.tsx` | `/organizations/org-ny6os/series/bdr-series` 접근 시 500 + Turbopack "Jest worker ... retry limit" crash. Next 16.1.6 (stale) | ✅ 해결 — 코드 무결 / 워커 캐시 손상. PID 42564 종료 + `.next` 삭제 + 재기동 → **200 / 0.28s**. errors.md [2026-04-12] 재발 참조횟수 1 |
| pm-cafe (Stage B-1) | `src/app/(web)/community/**` 렌더 컴포넌트 (리스트/상세) | **Stage A 확장 후속 누락** — 카페 sync가 `community_posts`로 확장(Stage A `47c2c97`)됐으나 렌더 측 `decodeHtmlEntities` 적용은 games 경로만 있고 community 경로 누락. postId 277 title `[시흥] 일요일팀 &#39;지역방어&#39;` 등. 저장은 설계상 원본 보존이라 정상, **렌더 시점** 디코드만 추가 필요. 유틸 기존: `@/lib/utils/decode-html#decodeHtmlEntities`. 참고 구현: `src/app/(web)/games/_components/games-content.tsx` | ⏳ 일반 세션 대기 |

## 운영 팁
- **gh 인증 풀림**: `GH_TOKEN=$(printf "protocol=https\nhost=github.com\n\n" | git credential fill 2>/dev/null | grep ^password= | cut -d= -f2) gh ...`
- **tsx 환경변수**: `npx tsx --env-file=.env.local scripts/xxx.ts` (Node 22)
- **포트 죽이기**: `netstat -ano | findstr :<포트>` → `taskkill //f //pid <PID>` (node.exe 통째 금지)
- **신규 API 필드**: 추가 전 curl 1회로 raw 응답 확인 (snake_case 6회 재발)
- **공식 기록 쿼리**: `officialMatchWhere()` 유틸 필수
- **BreadcrumbItem**: `@/components/shared/breadcrumb` 재활용
- **EditionSwitcher**: `@/components/shared/edition-switcher` (시리즈 회차 네비)
- **[신규] 공용 프로필 컴포넌트**: `@/components/profile/{profile-hero, mini-stat, recent-games}`
- **[신규] 레벨 배지 헬퍼**: `@/lib/profile/gamification` `getProfileLevelInfo(xp)` — 서버 컴포넌트 직접 호출 (API 경유 X, snake_case 재발 차단)

## 작업 로그 (최근 10건)
| 날짜 | 담당 | 작업 | 결과 |
|------|------|------|------|
| 04-22 | pm | **ops-db-sync-plan 선결 조건 5/6 반영** — Supabase 2개 가능(원영) / 운영 DB 증설 예정(원영) / PII 치환 범위(수빈) / 동기화 주 1회 + `/admin` 수동 버튼(수빈) / super_admin 공용 `admin@dev.local`(수빈) 확정. Flutter API URL 분기 1건 원영 대기 | ✅ docs |
| 04-22 | pm | **박찬웅 계정 연결 (운영 DB)** — placeholder `user_id=2884`(박찬웅_194@placeholder...) → 실계정 `3000`(pcwman1004@naver.com) 로 TTP 2492(열혈농구단 SEASON2 전국 최강전) + TeamMember 2236(라이징이글스 상시팀) 각 1건 UPDATE. 원자 트랜잭션, after 카운트 일치. placeholder 2884 유지(히스토리) | ✅ (DB only) |
| 04-21 | pm | **L3 IA 스모크 완료** — BDR 시리즈 시드(12대회 편입, edition 혼재) + L3-2 500 운영 복구(Turbopack 워커 재발, PID + `.next` 재기동, errors.md [2026-04-12] 참조횟수 1) + 수빈 4조합 대표 통과 | ✅ 14b1934 (미푸시) + docs |
| 04-21 | pm | **점진 정비 — any 3건 명시 타입화** (community CommunityPost + bulk-verify/bulk-register ExcelRow 공용 interface) | ✅ b5f5e5a |
| 04-21 | pm | **점진 정비 — 하드코딩 색상 7파일 CSS 변수화** (login/pricing/venues/community/registration/teams overview+games, 13개 색상) | ✅ 9a1c924 |
| 04-21 | pm | **reviewer 권장 5건 정비** — OwnerEditButton 공용 + color/heading/wrap 보강. 9파일 | ✅ be6d7e1 |
| 04-21 | pm | **L2 본인·타인 프로필 통합** — 공용 3종(Hero/MiniStat/RecentGames) + gamification 서버 헬퍼 + /users/[id] 본인 분기 + Teams(공개만) + 티어→레벨 통합 + /profile 대시보드 재정의 + 레거시 6파일 삭제. tester 14/14 / reviewer 통과(블록커 0, 권장 4). 15파일 +1347/-1286 | ✅ a04fad8 (미푸시) |
| 04-21 | pm | **L3 다음 단위 5파일 완성** — EditionSwitcher+SeriesCard 신규 + Organization/Series(under org) Breadcrumb + Tournament series include. tester 10/10 / reviewer 통과 | ✅ a6b329f → PR #53 MERGED |
| 04-20 | pm | **옵션 F — main 흡수 + 카페 분리 2회 + PR #51 머지 → PR #52 카페 Phase 3 합류 통합 머지** | ✅ 9836e88 (main/dev/subin 동기화) |
| 04-20 | pm | **#7 위생 — index.md 중복 섹션 해소** (하단 아카이브 재명명) | ✅ 1ffedb5 |
