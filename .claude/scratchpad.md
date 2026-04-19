# 작업 스크래치패드

## 현재 작업
- **요청**: `/games` 페이지 상단에 경기 유형 탭 (전체/픽업/게스트/연습경기) — PR #45에 추가 커밋
- **상태**: 🏗️ developer 구현 중
- **현재 담당**: developer
- **결정사항**:
  - 건수 뱃지 없이 시작 (1차)
  - 플로팅 패널 "유형" 필터 제거 (탭과 중복 방지)
  - PRACTICE 탭 포함 (Phase 2b로 데이터 늘어날 예정)
- **근거**: 현재 60건이 모두 GUEST로 보임 → 유형 구분 UI 노출 필요. API/상수/카드 분기 이미 완비, UI만 추가.

## 구현 기록 (developer)

📝 구현: `/games` 페이지 상단 경기 유형 탭 (전체/픽업게임/게스트/연습경기)

| 파일 | 변경 내용 | 신규/수정 |
|------|----------|----------|
| `src/app/(web)/games/_components/game-type-tabs.tsx` | 신규 클라이언트 컴포넌트. URL `?type` 조작, 활성 탭 배경은 `TYPE_BADGE[X].bg` 재사용. "전체"는 type delete. 모바일 가로 스크롤(`overflow-x-auto no-scrollbar` + `flex-shrink-0`/`whitespace-nowrap`) | 신규 |
| `src/app/(web)/games/_components/games-content.tsx` | `GameTypeTabs` import + `{loading ? ... : ...}` 분기 **바깥**에 탭 배치 (로딩 중에도 탭 유지) | 수정 |
| `src/app/(web)/games/games-filter.tsx` | `GAME_TYPES` 상수 제거, `filterConfigs`에서 type 항목 제거, `currentType`/activeCount에서 type 제외 (탭 전담) | 수정 |

🔧 tsc: PASS (에러 0)

💡 tester 참고:
- **테스트 방법**: `/games` 접속 → 상단 탭 4개 클릭하며 URL/목록 변화 확인
- **정상 동작**:
  - "전체" 클릭 시 `?type=` 삭제 → 전체 목록
  - "픽업게임" 클릭 시 `?type=0` 추가 → 픽업만 표시, 탭 배경 파랑(badge-blue)
  - "게스트" 클릭 시 `?type=1` → 초록(badge-green)
  - "연습경기" 클릭 시 `?type=2` → 황갈(badge-amber)
  - 검색어 입력 후 탭 전환 시 `?q=...`가 유지되어야 함
  - 플로팅 필터 패널 열어 "유형" 옵션이 사라졌는지 확인 (탭과 중복 방지)
  - 로딩 중(새로고침 직후 ~1초)에도 탭이 노출되어야 함
- **주의할 입력**: `?type=abc` 같이 유효하지 않은 값 → "전체" 탭 활성으로 fallback
- **모바일**: 좁은 화면에서 가로 스크롤 동작 확인, 탭 줄바꿈 없이 한 줄 유지

⚠️ reviewer 참고:
- 비활성 탭 hover 효과는 inline style로는 구현이 까다로워 일단 생략. 필요 시 globals.css에 `.game-type-tab-inactive:hover` 클래스 추가 고려
- 활성 "전체" 탭 배경은 `TYPE_BADGE`에 매핑이 없어 `var(--color-text-primary)` + `var(--color-card)`로 대비 확보 (다크/라이트 양쪽 자동)


### 🚀 다음 세션 — "오늘 작업 시작하자" 하면 PM이 할 일

**Step 1: 오늘 시작 체크리스트** (CLAUDE.md 루틴)
1. `git remote -v` — github.com/bdr-tech/mybdr 확인
2. `git fetch origin --prune` + main/dev/subin 차이
3. 현재 브랜치가 subin인지 확인 + `git pull origin subin`
4. `.env` 개발 DB + `.env.local` localhost:3001 확인
5. `.auth/cafe-state.json` 존재 + 유효 여부 (쿠키 만료 시 `npx tsx scripts/cafe-login.ts` 재실행)
6. Phase 2a 재검증: `npx tsx --env-file=.env.local scripts/sync-cafe.ts --board=IVHA --limit=3 --with-body --article-limit=2` — 본문 200 OK 확인

**Step 2: Phase 2b 착수 (경고 프로토콜 발동)**

| 작업 | 위험도 | 영향 |
|------|--------|------|
| `cafe_posts` 테이블 INSERT (3게시판 × 10~20건 = 30~60건) | 🔴 20건+ 경고 | 운영 DB 신규 레코드 (현재 0건 → 30~60건) |
| `games` 신규 INSERT (중복 없는 글) | 🔴 20건+ 경고 | 운영 DB 신규 레코드 |
| `games.metadata` 키 추가 (cafe_dataid/cafe_board/source_url) | 🟢 NULL→값만, 파괴적 X | 기존 112건 대상 UPDATE |
| 역방향 백필 (기존 112건 → cafe_posts 연결) | 🔴 UPDATE 112건 | Phase 2b 후반, 별도 승인 |

**Step 3: Phase 2b 구현 단계** (Coworker 계획 P2.3~P2.5 기반)
1. `src/lib/cafe-sync/upsert.ts` 신규 — cafe_posts + games upsert (트랜잭션)
2. `scripts/sync-cafe.ts`의 `--execute` 차단 해제 (현재 exit(1)) + 실제 DB 쓰기
3. IVHA 5건 **dry-run → 표본 승인 → --execute** (점진 확장)
4. 3게시판 통합 (30~60건)
5. 역방향 백필 (112건) — 별도 승인 단계

**Step 4: 저성공 필드 보강 (선택)**
- `parseCafeGame` 수정 금지 (vitest 59/59)
- `upsert.ts`에 fallback 정규식 추가 — 자유 양식 본문에서 scheduledAt/fee/city/district 추출
- 현재 실측: gameType 100% / guestCount 100% / venue 50% / 나머지 0%

### Phase 2a 완료 요약 (2026-04-19)
| 항목 | 결과 |
|------|------|
| storageState 쿠키 로드 | 43개 (HttpOnly `LSID`/`PROF`/`AUID` + 카카오 OAuth 포함) |
| 본문 HTTP | ✅ 200 × 2/2 (이전 403 × 4회 → 완전 해결) |
| parseCafeGame | 2/2 성공 |
| 마스킹 | ✅ `010-****-****` 동작 |
| DB 쓰기 | 0 (Phase 2a는 dry-run 전용) |

## 전체 프로젝트 현황
| 항목 | 값 |
|------|-----|
| 현재 브랜치 | subin (origin/subin = 2fc8369, 유형 탭 추가 완료) |
| dev 상태 | 75b653b (PR #39 머지됨, 04-19) |
| 미푸시 커밋 | 0 |
| 진행 중 PR | **#45 OPEN — MERGEABLE ✅** (W1 12/12 + M1 1차 + Phase 1~2a + 플래닝 문서) |
| `.auth/cafe-state.json` | 존재 (04-19 19:35 생성, gitignored) |

## 남은 과제
- **다음카페 Phase 2b** — upsert + --execute 활성화 + 3게시판 통합 + 역방향 백필 (decisions.md 2026-04-19 참조)
- **다음카페 Phase 3** — Vercel Cron + GH Actions(Playwright) + admin UI + 알림
- **운영 DB 동기화** — 백필/병합/endDate/권한/파서 147건+66건 운영 반영 (원영 협의)
- **원영 영역 공식 기록 가드** — public-bracket API, _site/*.tsx

## 운영 팁
- **gh 인증 풀림**: `GH_TOKEN=$(printf "protocol=https\nhost=github.com\n\n" | git credential fill 2>/dev/null | grep ^password= | cut -d= -f2) gh ...`
- **gh pr edit 스코프 부족 시**: `gh api -X PATCH repos/OWNER/REPO/pulls/N -f title=...`
- **tsx 환경변수**: `npx tsx --env-file=.env.local scripts/xxx.ts` (Node 22)
- **쿠키 세션 갱신**: `npx tsx scripts/cafe-login.ts` (브라우저 headed → 로그인 → Enter)
- **storageState 경로 override**: `DAUM_CAFE_STORAGE_STATE=/path/to.json`
- **포트 죽이기**: `netstat -ano | findstr :<포트>` → `taskkill //f //pid <PID>` (node.exe 통째 금지)
- **커밋 전 파일 diff 확인**: Coworker 공유 파일은 **내 변경만** 들어갔는지 점검 (c884ae0 NotificationBadge 누락 사고 교훈)
- **공식 기록 쿼리**: `officialMatchWhere()` 유틸 필수

## 작업 로그 (최근 10건)
| 날짜 | 담당 | 작업 | 결과 |
|------|------|------|------|
| 04-19 | pm+developer | `/games` 경기 유형 탭 추가 (전체/픽업/게스트/연습경기, URL `?type` 기반, TYPE_BADGE 재사용) + 플로팅 패널 type 필터 제거 | ✅ 2fc8369 push, PR #45 포함 |
| 04-19 | pm | UX 세션: Dev/ 플래닝 3개 커밋 + Q12 조사(수정 불필요, W1 **12/12**) + dev merge-back 7충돌 해결 → PR #45 **MERGEABLE** | ✅ 610dcf2 push |
| 04-19 | pm | 오늘 세션 시작: 환경 체크 + Phase 2a 재검증(IVHA 본문 200×2/2) + 로컬 변경 커밋·푸시 | ✅ 3cd61c4 push |
| 04-19 | pm+developer | Phase 2a 완료: Playwright `cafe-login.ts` + storageState 쿠키 로드 → 본문 200 × 2/2 + parseCafeGame 2/2 + 마스킹 OK | ✅ 55d78c3 push |
| 04-19 | developer | Phase 2a 코드: mask-personal-info + article-fetcher + sync-cafe --with-body (vitest 19/19, 쿠키 미수 403) | ✅ 2890224 push |
| 04-19 | pm | PR #39 **dev 머지 완료** (squash, 75b653b) + 제목/본문 갱신 | ✅ merged |
| 04-19 | pm | Coworker 4파일 수습 + Vercel 빌드 복구 (c884ae0 NotificationBadge 누락 → ae8e452) | ✅ CI CLEAN |
| 04-19 | tester | MoreTabTooltip Playwright E2E 6/6 PASS | ✅ |
| 04-19 | pm+developer | 다음카페 Phase 1 POC — 3게시판 30건 실제 수집 (articles.push 정규식) | ✅ |
| 04-19 | pm | 크롤링 정책 리서치(9가드) + decisions.md 승격 | ✅ 조건부 진행 |
| 04-19 | general-purpose | 다음카페 크롤링 법적/기술 리스크 리서치 | ✅ 낮음~중간 |

## 구현 기록 — M1 Day 7 (developer)

📝 구현: /profile 허브를 4카드 허브에서 통합 대시보드(히어로 + 4그룹 카드)로 재구성

| 파일 | 변경 내용 | 신규/수정 |
|------|----------|----------|
| `src/lib/services/user.ts` | `getProfile()` 에 `followersCount`/`followingCount`/`nextGameApp` 3개 쿼리 Promise.all 병렬 추가 (`follows.count` × 2 + 다음 경기 `findFirst`) | 수정 |
| `src/app/api/web/profile/route.ts` | GET 응답에 `followersCount`/`followingCount`/`nextGame` 필드 추가 (backward compatible, 기존 필드 불변) | 수정 |
| `src/app/(web)/profile/_components/profile-hero.tsx` | 히어로 컴포넌트 (아바타 108/144 + Lv 배지 + 포지션/지역/신장 + "프로필 편집" 버튼 + 미니 통계 4칸 경기수/팔로워/승률/팔로잉 + bio) | 신규 |
| `src/app/(web)/profile/_components/basic-info-card.tsx` | 기본 정보 카드 (닉네임/이메일/전화·마스킹/생년월일 + 우상단 "수정" 링크) | 신규 |
| `src/app/(web)/profile/_components/teams-tournaments-card.tsx` | 팀/대회 요약 카드 (소속팀 N개 / 참가 대회 N회 / 다음 경기 D-N, KST 기준 D-Day 계산) | 신규 |
| `src/app/(web)/profile/_components/refund-account-card.tsx` | 환불 계좌 카드 (은행+마스킹 번호+예금주 or "등록된 계좌 없음") | 신규 |
| `src/app/(web)/profile/_components/danger-zone-card.tsx` | 위험 영역 카드 (error tint border + /profile/edit#danger 링크) | 신규 |
| `src/app/(web)/profile/page.tsx` | 기존 4카드 허브 완전 제거 → 히어로 + 4카드 2열 그리드 + 로그아웃. useSWR 3개(`/api/web/profile`+`/profile/gamification`+`/profile/stats`) 유지 | 수정 |
| `src/components/profile/profile-side-nav.tsx` | "내 정보" href `/profile/edit` → `/profile`, matchPaths=["/profile","/profile/edit"], `exactOnly: true` 플래그 추가로 하위 경로 오매칭 방지 | 수정 |

🔧 tsc: **PASS (에러 0)**

💡 tester 참고:
- **테스트 방법**: `/profile` 접속 → 히어로(아바타·Lv배지·미니통계4·편집버튼) + 4카드(기본정보·팀대회·환불계좌·위험영역) + 로그아웃 확인
- **사이드 네비 활성 검증**:
  - `/profile` 상태 → "내 정보" 활성
  - `/profile/edit` 상태 → "내 정보" 활성 (수정 페이지도 같은 메뉴 그룹)
  - `/profile/basketball` 상태 → "내 농구"만 활성 (내 정보 비활성이어야 정상) ← exactOnly 플래그가 제대로 작동하는지 핵심 확인
  - `/profile/preferences` → "설정"만 활성
- **정상 동작**:
  - 팔로워/팔로잉 숫자가 0 이상으로 노출
  - 다음 경기 있으면 "D-N · 경기제목", 없으면 "예정된 경기 없음"
  - 전화번호가 010-XXXX-XXXX 패턴이면 "010-****-****" 마스킹
  - 계좌 없으면 "등록된 계좌가 없어요", 있으면 은행명+마스킹번호+예금주
  - /profile/edit 이동 후 브라우저 뒤로 → /profile 대시보드 복귀 정상
  - "회원 탈퇴" 클릭 → /profile/edit#danger (기존 탈퇴 모달 위치로 앵커 이동)
- **주의할 입력**:
  - 비로그인 상태 접근 → "로그인이 필요합니다" 안내 (기존 분기 유지)
  - 데이터 없는 신규 가입자(teams=0, tournaments=0, nextGame=null, followers=0): 0/"예정된 경기 없음" 표시되어야지 렌더 크래시 X
  - 프로필 이미지 없는 유저: 이니셜 fallback 표시

⚠️ reviewer 참고:
- **네비 `exactOnly` 플래그 신규 도입**: 기존에는 startsWith 로 하위 경로까지 광역 매칭했는데, `/profile` 이 matchPaths 에 들어가면 /profile/basketball 같은 하위 전부가 동시 활성되는 버그가 생겨서 플래그로 제어. "내 정보" 만 exactOnly=true, 나머지는 기존 동작 유지.
- **히어로 아바타 사이즈**: 지시는 "모바일 108 / PC 144" 이나 Tailwind responsive breakpoint 로 부드럽게 처리하기 위해 outer div 는 108px 고정 + inner md: w-36 h-36 -m-1 으로 확장. 이미지 `width={144}` 고정 + `object-cover` 라 시각 결과는 스펙과 동일.
- **API backward compatible**: 기존 `user/teams/recentGames/tournaments` 4개 응답은 그대로. 신규 3개(`followersCount`/`followingCount`/`nextGame`) 만 추가 → 다른 화면(`profile-header` 등)이 이 API 를 공유해도 영향 0.
- **Prisma 스키마 0변경**: `follows.count` + `game_applications.findFirst` 만 추가 사용. 운영 DB 안전.
- **웹 세션 유지**: `/api/web/profile` 는 `withWebAuth` 라 비로그인 401, 로그인 정상 — 프론트 분기 그대로.

### 수정 이력 (1회차) — tester 블록 1건 + 권장 2건 + 경미 1건

| 파일 | 수정 내용 |
|------|----------|
| `src/app/(web)/profile/page.tsx` | ProfileData 인터페이스 + 접근자 snake_case 통일: `followersCount→followers_count`, `followingCount→following_count`, `nextGame→next_game`. 상단 주석 동반 수정. 로그인 버튼 `text-white → text-[var(--color-on-primary)]` |
| `src/app/(web)/profile/edit/page.tsx` | 회원 탈퇴 `<div>` 에 `id="danger"` 추가 (DangerZoneCard `#danger` 앵커 대상) |
| `src/app/(web)/profile/_components/profile-hero.tsx` | 배경 장식 `rgba(227, 27, 35, 0.05)` → `color-mix(in srgb, var(--color-primary) 5%, transparent)` |
| `src/components/profile/profile-side-nav.tsx` | 모바일 활성 chip `text-white → text-[var(--color-on-primary)]` |

🔧 tsc: **PASS** (exit 0, 에러 0)
🔧 grep 재검증: `followersCount|followingCount|nextGame` camelCase 접근 **0건** (JSX prop 이름은 컴포넌트 계약상 유지 OK, 우변 profile.* 는 모두 snake_case)
🔧 `rgba(227` hero 파일 **0건** (radar-chart / profile-header 는 이번 범위 밖)
🔧 `text-white` page.tsx / profile-side-nav.tsx 실제 className **0건** (주석으로만 남음)
🔧 `id="danger"` edit/page.tsx:518 **추가 확인**

💡 tester 재검증 요청: 
- 블록 이슈 해소 확인 — `/profile` Network 탭 응답 `followers_count/following_count/next_game` 키가 히어로·카드에 실제 렌더링되는지
- `/profile/edit#danger` 앵커 스크롤이 탈퇴 섹션으로 정확히 이동하는지
- 라이트모드에서 모바일 chip / 로그인 버튼의 글자 가시성 정상인지

⚠️ 이번 라운드 범위 외 (후속 과제):
- reviewer 5번 (Card 공통 껍데기 추출)
- reviewer 6번 (`/users/[id]` 히어로 공통화)
- reviewer 7, 8, 9번 (인덱스·DST 보강·error fallback 제거)

## 리뷰 결과 — M1 Day 7 (reviewer)

### 종합 평가
🟡 **경미한 개선점** — 블록 이슈 없음. 머지 가능. 컨벤션 준수·API 설계·네비 로직 모두 견고. `text-white` 고정 색상 2곳 + 성능 미세 보강(useSWR 3회 → 1회 통합 가능) 정도만 권장 수준으로 남김.

### 카테고리별
| 카테고리 | 등급 | 비고 |
|----------|------|------|
| 컨벤션 준수 | 🟢 | `var(--color-*)` 일관 사용, Material Symbols만, 4px radius, camelCase/kebab-case/PascalCase 모두 OK. 단 `text-white` 2건(아래 권장) |
| 재사용성 | 🟡 | 카드 공통 껍데기가 `BasicInfoCard` 내부 `Card` 로만 존재 → 3개 카드에서 반복. `/users/[id]` 히어로와 아바타 블록 중복 (이번 범위 밖이라 TODO만 권장) |
| API 안전성 | 🟢 | Promise.all 7병렬, follows/nextGame `.catch(()=>폴백)`, 기존 응답 불변(backward compatible), try/catch로 500 보호 |
| 네비 로직 | 🟢 | `exactOnly` 플래그 신설은 깔끔하고 주석도 충실. 기존 5항목 동작 변화 없음(회귀 리스크 낮음) |
| 접근성 | 🟡 | `alt={displayName}` 있음, `aria-label="프로필 메뉴"` 있음. 단 히어로 배경 장식 div에 `aria-hidden` 없음(사소), 카드에 `<section>` 사용 OK |
| 성능 | 🟡 | useSWR 3개 병렬이라 체감 OK. 다만 `/api/web/profile` 한 번으로 통합 가능한 구조라 장기 최적화 여지. nextGame `findFirst` 는 `game_applications.user_id` + `games.scheduled_at` 인덱스가 있어 쿼리 적절 |
| 디자인 일관성 | 🟢 | `/users/[id]` 히어로 톤과 동일한 BDR Red 블러·아바타 테두리·미니통계 카드 스타일 |

### 개선 권장 (block 아님)

1. **`src/components/profile/profile-side-nav.tsx:167`** — 모바일 활성 chip `text-white` 고정.
   - 왜: conventions.md "테마 반응형 배경 위 텍스트는 `--color-on-*` 변수 사용, text-white 금지". 현재 primary 배경(라이트/다크 동일 red이라 다행히 가시성 문제 없지만) 원칙상 `text-[var(--color-on-primary)]` 권장.
   - 수정 전: `"bg-[var(--color-primary)] text-white"`
   - 수정 후: `"bg-[var(--color-primary)] text-[var(--color-on-primary)]"`

2. **`src/app/(web)/profile/page.tsx:145`** — 로그인 버튼 `text-white` 고정.
   - 왜: 위와 동일. 본 PR에서 신규 작성한 블록이므로 같은 수정 권장.

3. **`src/app/(web)/profile/_components/basic-info-card.tsx:73-111`** — `Card` 컴포넌트가 BasicInfoCard 내부 private. RefundAccountCard/TeamsTournamentsCard도 동일 `<section>+헤더(제목+수정링크)+본문` 패턴 반복 → 공통 컴포넌트 `_components/profile-card.tsx`로 추출하면 3파일 각각 ~15줄씩 감소. 이번 스코프 밖이어도 TODO 주석 권장.

4. **`src/app/(web)/profile/_components/profile-hero.tsx:88-91`** — 배경 장식 div에 `aria-hidden="true"` 누락. 스크린리더가 빈 div를 의미 없이 읽지 않도록 권장.

5. **`src/app/(web)/profile/_components/profile-hero.tsx:90`** — `rgba(227, 27, 35, 0.05)` 하드코딩 (BDR Red). `/users/[id]` 히어로가 같은 값을 쓰므로 이미 일관성은 유지되지만, 가능하면 `color-mix(in srgb, var(--color-primary) 5%, transparent)` 로 치환해 브랜드 리프레시 시 한 곳만 고치면 되는 구조가 이상적.

6. **`src/app/(web)/profile/_components/profile-hero.tsx` vs `/users/[id]/page.tsx`** — 히어로 블록(아바타 + 이름 + 메타 + 바이오)이 시각적으로 거의 동일. 중복 65% 수준. 본인/타인에서 각각 다른 점(편집 vs 팔로우/티어 배지)을 props로 분기하는 공통 `UserHero` 컴포넌트를 향후 뽑아도 좋음. 지금은 파일 맨 위 주석에 "TODO: /users/[id] 히어로와 공통 추출 고려" 정도 남기기만 해도 충분.

7. **`src/lib/services/user.ts:129-148`** — `nextGameApp` 쿼리가 활성 유저(신청 이력 수백 건)에서 index scan + 정렬이 살짝 커질 여지. 현재도 OK지만, `@@index([user_id, game_id])` 같은 복합 인덱스가 향후 필요해질 수 있음(지금은 운영 DB 스키마 변경 금지이므로 기록만).

8. **`src/app/(web)/profile/_components/teams-tournaments-card.tsx:40-55`** — KST 변환이 수동. `Intl.DateTimeFormat('ko-KR', { timeZone: 'Asia/Seoul' })` 기반으로 바꾸면 DST/timezone 엣지 케이스 보호. 현재 로직도 틀리진 않음.

9. **`src/app/(web)/profile/_components/danger-zone-card.tsx:23, 31, 37, 55, 56`** — `var(--color-error, #EF4444)` fallback을 5번 반복. 하드코딩 금지 원칙상 fallback 자체는 OK이지만 globals.css에 `--color-error` 정의 여부 확인 후 fallback 제거 가능.

### 수정 요청 (block)
**수정 요청 없음.** 블록 이슈 0건. 위 9개는 모두 머지 후 리팩토링/후속 개선 사항.

### 칭찬할 점
- **backward compatible API 설계**: 기존 4개 응답 필드 불변 + 신규 3개만 추가 → `profile-header` 등 다른 소비자 영향 0. 배포 안전성 ★
- **exactOnly 플래그의 정확한 문제 인식**: `/profile` 을 matchPaths에 넣으면 startsWith 때문에 하위 전체가 동시 활성되는 걸 미리 발견하고, 기존 5항목 동작은 건드리지 않게 플래그로 격리. 주석에 "왜" 설명 충실.
- **풍부한 주석**: 각 파일 상단 "왜/어떻게" 블록 주석, 복잡 로직(마스킹/D-day/exactOnly)에 인라인 주석. 바이브 코더가 3개월 뒤 돌아와도 의도 파악 쉬움.
- **폴백 전략**: `follows.count().catch(()=>0)` + `findFirst().catch(()=>null)` + `stats?.winRate != null ? "X%" : "-%"` + 이니셜 fallback. 부분 실패해도 허브가 무너지지 않는 구조.
- **Prisma 스키마 0변경**: 운영 DB 접근 안전 규칙 완벽 준수. 추가 테이블/컬럼 없이 기존 인프라만 사용.
- **컨벤션 섹션 활용**: Lv 배지에서 `--color-on-primary` 변수 사용(conventions.md 2026-04-12 규칙 준수), 플레이스홀더 `-` hyphen 사용, 4px radius, Material Symbols만, kebab-case 파일명 — 체크리스트 전반 통과.

### 작업 로그 제안 (PM이 기록)
| 날짜 | 담당 | 작업 | 결과 |
|------|------|------|------|
| 04-19 | reviewer | M1 Day 7 정적 리뷰 (9파일) — 블록 0건, 권장 9건(text-white 2건/Card 추출/TODO) | 🟢 통과 |

## 테스트 결과 — M1 Day 7 (tester)

| 검증 항목 | 결과 |
|-----------|------|
| tsc --noEmit | ✅ PASS (exit 0, 에러 0) |
| API 신규 필드 3개 반환 코드 존재 | ✅ OK (`route.ts:65-67` + `user.ts:75-149`) |
| Promise.all 7병렬 + `.catch()` 폴백 | ✅ OK |
| `nextGame` 미래 필터 `scheduled_at > now` | ✅ OK (`user.ts:132`) |
| API backward compat (기존 필드 유지) | ✅ OK (user/teams/recentGames/tournaments 불변) |
| D-N KST 계산 | ✅ OK (UTC+9 shift → Date.UTC 자정 기준 round diff) |
| #danger 앵커 존재 | 🚨 **누락** (`edit/page.tsx:518` 탈퇴 div에 `id="danger"` 없음) |
| exactOnly 네비 로직 | ✅ OK (`profile-side-nav.tsx:91-96`) |
| `/profile/basketball`에서 "내 정보" 비활성 | ✅ OK (로직 추적 검증) |
| `/profile/edit`에서 "내 정보" 활성 | ✅ OK |
| `/profile`에서 "내 정보" 활성 | ✅ OK |
| 하드코딩 색상 (신규 5파일) | ⚠️ 1건 (profile-hero.tsx:90 BDR Red rgba — 경미) |
| Material Symbols 아이콘 | ✅ OK |
| 4px border-radius | ✅ OK (4카드 전부) |
| 페이지 useSWR 3개 유지 | ✅ OK |
| 로그아웃 버튼 유지 | ✅ OK |
| **신규 3필드 실제 전달** | 🚨 **블록** (아래 이슈 1 — apiSuccess snake_case 변환 vs 프론트 camelCase 접근) |

📊 종합: 17개 중 14개 통과, 2개 실패, 1개 경미

### 🚨 발견된 이슈

#### 1. [블록 🔴] API 응답 snake_case 변환 vs 프론트 camelCase 접근 — 신규 3필드가 런타임에 **전부 undefined**
- **파일**: `src/app/(web)/profile/page.tsx:174-189`
- **증상**: 히어로의 팔로워/팔로잉 숫자 항상 **0**, TeamsTournamentsCard의 "다음 경기" 항상 **"예정된 경기 없음"** (서버에 실제 데이터가 있어도)
- **원인**:
  1. `apiSuccess()` (`src/lib/api/response.ts:5`)가 응답을 `convertKeysToSnakeCase()`로 자동 변환 → 서버 `{ followersCount, followingCount, nextGame }` → 클라이언트 `{ followers_count, following_count, next_game }`
  2. 글로벌 SWR fetcher (`src/components/providers/swr-provider.tsx:7`)는 **역변환 미적용** (`(url) => fetch(url).then(r=>r.json())` 만)
  3. `profile.followersCount` → undefined → `?? 0` 폴백 → 항상 0
- **교차 검증**: 같은 응답의 `profile.user.birth_date`, `profile.user.has_account` 등 기존 필드는 page.tsx에서 **snake_case로 접근** 중이라 정상 작동 → 신규 3필드만 camelCase로 쓴 것이 원인
- **심각도**: 🔴 기능 무효 (허브 대시보드 신규 기능 3개 전부 가짜 값 표시)
- **재현**: `/profile` 접속 → DevTools Network `/api/web/profile` 응답 body → `followers_count` 있고 `followersCount` 없음
- **errors.md 이력**: 2026-04-17 "apiSuccess 미들웨어 놓치고 컴포넌트 인터페이스 거꾸로 변환" — **재발 5회차**
- **권장 수정** (최소): `page.tsx` 에서 3곳 접근을 snake_case로:
  ```
  followersCount={profile.followers_count ?? 0}
  followingCount={profile.following_count ?? 0}
  nextGame={profile.next_game ?? null}
  ```
  + `ProfileData` 인터페이스의 `followersCount?`, `followingCount?`, `nextGame?` 키도 snake_case로 (기존 필드와 통일)

#### 2. [권장 🟠] `/profile/edit` 페이지에 `id="danger"` 앵커 누락
- **파일**: `src/app/(web)/profile/edit/page.tsx:518` (회원 탈퇴 영역 div)
- **증상**: DangerZoneCard "회원 탈퇴" 클릭 → `/profile/edit#danger` 이동하지만 해당 id 앵커가 없어 스크롤이 맨 위에 멈춤 → 사용자가 수동으로 탈퇴 섹션을 찾아야 함
- **검증**: `grep "danger"` 결과 edit/page.tsx에 0건 (탈퇴 관련 텍스트만 있고 id/name 없음)
- **심각도**: 🟠 UX 저하 (기능 동작하지만 네비 의도 미달)
- **권장 수정**: `edit/page.tsx:518` `<div className="mt-8 ..."` 에 `id="danger"` 1줄 추가

#### 3. [경미 🟡] ProfileHero 배경 장식 BDR Red 하드코딩
- **파일**: `src/app/(web)/profile/_components/profile-hero.tsx:90`
- **내용**: `rgba(227, 27, 35, 0.05)` — BDR Red `#E31B23` 하드코딩 (CLAUDE.md 금지 규칙)
- **참고**: 기존 profile-header.tsx:69 도 동일 패턴 → 관행상 허용 가능하나 엄격히는 위반
- **권장 수정** (선택): `color-mix(in srgb, var(--color-primary) 5%, transparent)`

### 수정 요청

| 대상 파일 | 문제 | 권장 수정 | 우선순위 |
|----------|------|----------|----------|
| `src/app/(web)/profile/page.tsx` | 신규 3필드 camelCase 접근으로 런타임 undefined (팔로워/팔로잉 0, 다음경기 null) | 3곳 `.followersCount/.followingCount/.nextGame` → `.followers_count/.following_count/.next_game` + 인터페이스 동일 적용 | 🔴 블록 |
| `src/app/(web)/profile/edit/page.tsx` | 회원 탈퇴 div에 `id="danger"` 누락 | line 518 div에 `id="danger"` 추가 | 🟠 권장 |
| `src/app/(web)/profile/_components/profile-hero.tsx` | BDR Red rgba 하드코딩 (line 90) | `color-mix(in srgb, var(--color-primary) 5%, transparent)` 교체 | 🟡 선택 |

### 회귀 검증 스팟 (수정 후)
- `/profile` Network 탭 응답에 `followers_count/following_count/next_game` 키 존재 → 히어로에서 실제 숫자·TeamsTournamentsCard 다음 경기 D-N 노출
- "회원 탈퇴" 클릭 → edit 페이지의 탈퇴 섹션으로 스크롤 이동
- `/profile/basketball` → 좌측 "내 정보" 비활성 확인 (reviewer도 로직 OK 평가)
- `/profile/edit` → "내 정보" 활성
- 비로그인 → "로그인이 필요합니다" fallback 유지

## 테스트 결과 — M1 Day 7 재검증 (tester, 1회차 후)

| 검증 항목 | 이전 결과 | 수정 후 결과 |
|----------|-----------|-------------|
| tsc --noEmit | ✅ PASS | ✅ PASS (exit 0, 에러 0) |
| snake_case 이슈 재발 5회차 | 🔴 블록 | ✅ **해소** (profile.followersCount/nextGame 접근 0건, snake_case 3건 확인) |
| #danger 앵커 | 🟠 누락 | ✅ **존재** (edit/page.tsx:518 탈퇴 div에 `id="danger"` 추가 확인) |
| rgba 하드코딩 (profile-hero) | 🟡 1건 | ✅ **0건** (line 93 `color-mix(in srgb, var(--color-primary) 5%, transparent)` 적용) |
| text-white 하드코딩 (page.tsx) | 🟡 1건 | ✅ **0건** (line 149 `text-[var(--color-on-primary)]`) |
| text-white 하드코딩 (profile-side-nav) | 🟡 1건 | ✅ **0건** (line 168 `text-[var(--color-on-primary)]`) |
| ProfileData 인터페이스 snake_case | 🔴 불일치 | ✅ **일치** (`followers_count` / `following_count` / `next_game` 정의) |
| NextGameSummary 내부 필드 | - | ✅ OK (`scheduled_at`, `title`, `venue_name` 모두 snake_case) |
| teams-tournaments-card 내부 접근 | - | ✅ OK (`nextGame.scheduled_at`, `nextGame.title` — prop명은 계약 유지, 내부 키는 snake) |
| 서버-클라이언트 스키마 일관성 | - | ✅ OK (route.ts: camelCase 반환 → apiSuccess snake 변환 → page.tsx: snake 접근) |
| 이전 OK 항목 회귀 (Promise.all 7병렬/폴백/KST D-N/exactOnly) | ✅ | ✅ **회귀 없음** (user.ts/route.ts/profile-side-nav 로직 파트 불변) |

📊 종합: 11개 중 11개 통과, 0개 실패

### 종합 평가
🟢 **PASS — 머지 가능**

블록 1건(snake_case 5회차 재발) + 권장 1건(#danger 앵커) + 경미 2건(text-white 2건, rgba 1건) **전부 해소됨.** developer가 4파일을 최소 범위로 정확히 수정. 서버는 불변(backward compatible 유지), 프론트만 `apiSuccess` 스내이크 변환에 맞춰 접근자 3곳 + 인터페이스 3필드 통일.

### 발견된 새 이슈
- **없음.** 이번 수정에서 새로 유입된 회귀 없음. 이전 "OK"였던 항목(Promise.all 7병렬, `.catch()` 폴백, KST D-N 계산, exactOnly 네비, backward compat API)도 모두 그대로.

### 수정 요청
- **없음.** reviewer 9개 중 후속 처리 대상 5~9번(Card 공통화, `/users/[id]` 히어로 공통화, 인덱스 보강, DST 보강, error fallback 제거)은 이번 스코프 밖 — 별도 이슈로.

### 커밋 준비도 평가
- **커밋 가능 여부**: ✅ **예**
- **CI 예상**: ✅ **통과** (tsc PASS, lint 규약 위반 0건, 운영 DB 스키마 변경 0)
- **커밋 권장 메시지 예시**: `fix(profile): M1 Day 7 snake_case 접근 + #danger 앵커 + 테마 색상 변수 통일`
- **수정 파일 4종**:
  1. `src/app/(web)/profile/page.tsx` — ProfileData 인터페이스 3필드 snake_case + 접근자 3곳 + 로그인 버튼 `text-[var(--color-on-primary)]`
  2. `src/app/(web)/profile/edit/page.tsx` — 탈퇴 div에 `id="danger"` 추가
  3. `src/app/(web)/profile/_components/profile-hero.tsx` — rgba → color-mix
  4. `src/components/profile/profile-side-nav.tsx` — 모바일 chip `text-[var(--color-on-primary)]`
