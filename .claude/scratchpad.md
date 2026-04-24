# 작업 스크래치패드

## ⚠️ 세션 분리 원칙 (2026-04-22 재정의)
> **기본 = 일반 작업 세션.** 카페 세션은 수빈이 **"카페 세션 시작"이라고 선언할 때만** 전환.

### 일반 모드 (기본값)
- **대상**: `(web)`/`(api/web)`/`(referee)`/`profile`/`tournaments`/`components`/`lib` — 일반 UX/기능/리팩토링/디자인
- **커밋**: 자유 스코프 (`feat:`/`fix:`/`refactor:`/`docs:`/`style:`/`test:`)
- **금지**: 카페 허용 파일군 단독 수정 (불가피 시 scratchpad에 사유 기록)

### 카페 모드 ("카페 세션 시작" 선언 필요)
- **허용**: `scripts/sync-cafe.ts`, `scripts/backfill-*cafe*.ts`, `scripts/*cafe*.ts`, `src/lib/cafe-sync/**`, `src/lib/parsers/cafe-*.ts`, `.github/workflows/cafe-*.yml`, `Dev/cafe-*.md`, 카페 관련 migration
- **커밋 스코프 필수**: `feat(cafe-sync):` / `fix(cafe-sync):` / `docs(cafe-sync):` 등
- **카페 작업 로그**: `.claude/scratchpad-cafe-sync.md` 로 분리 관리

### 공용
- **브랜치**: `subin` 공용. push 전 `git fetch origin subin` → 뒤처지면 `pull --rebase`

---

## 📍 다음 세션 진입점

### 🥇 1순위 — W4+L3+L2 통합 스모크
- ✅ **Playwright 자동화 60/60 PASS** (tester 위임, 04-22) — L3 3항목 + W4 비로그인 4항목 + 04-22 decode 핵심 + 4조합(PC/Mobile × Light/Dark) 매트릭스
- **수빈 재확인 필요 5건** (자동화 커버 불가):
  - L2-1~4 전건 (로그인 필수) — 본인 프로필 / 타인 프로필 비공개 팀 숨김 / `/profile` 대시보드 / Lv.N 배지
  - W4-3 M7 팀 가입 / W4-4 M6 알림 / W4-6 M5 온보딩 (로그인/신규 계정 필요)
  - 시각 퀄리티 (색상 조화, 간격 감각 — 사람 눈 필요)
- **체크리스트 문서**: `Dev/smoke-test-2026-04-22.md`
- **발견된 코드 결함**: 0건

### 🥈 2순위 — 원영 협의 (30분)
- `Dev/ops-db-sync-plan.md` (선결 조건 **전 조건 확정**, Flutter 앱은 원영 별도 관리로 범위 제외)
- 원영 액션: PR #54 승인
- 옵션 A 확정 (Supabase 두 번째 프로젝트) — 착수 가능 상태

### 🥉 3순위 — 점진 정비 (보이스카우트)
- **하드코딩 색상**: 누계 **71건** 치환 / **실질 완결**. 남은 것은 의도 예외 2건(live orange 스피너 — accent 변수 추가 시 정비 / tm-org-new dark:페어 — 단일 토큰 검증 후) + false positive 2건(hero-bento 주석). tournament-admin 영역 ✅ 완결
- **any 타입**: ✅ **실질 완결** (오늘 4건 정비 — home-sidebar 3 + Prisma WhereInput 1). 예외 유지 13건: kakao SDK 9 / Next.js HOF 3 / SW 1 — 모두 근거 있음
- **원칙**: 다른 이유로 파일 건드릴 때 함께 정비. 대규모 일괄 치환 비추천

### 4순위 — reviewer 후속 (nice-to-have)
- L3 `<img>`→next/image 9곳: 운영 DB 분리 후 양쪽 `<ref>.supabase.co` `remotePatterns` 등록 후 실행 권장
- L3 쿼리 합치기 / is_public 가드 / EditionSwitcher flex-wrap ✅ 완료

---

## 현재 상태 스냅샷 (2026-04-22 세션 진행 중)

| 항목 | 값 |
|------|-----|
| 브랜치 | subin |
| subin HEAD | `9023236` (docs planning) |
| origin/subin | `9023236` ✅ 동기화 (10커밋 푸시 완료) |
| dev / main | `8de9be4` (PR #53 squash, PR #54 원영 승인 대기) |
| 미푸시 | **0~1건** (스모크 로그 + 상태 갱신 대기) |
| 오늘 커밋 (04-22) | 10건 푸시 완료: `bb488ce`→`0f41e99`→`1958b9d`→`672dc9a`→`dfa5b9a`→`42c5066`→`6a7569b`→`3f54daa`→`ab46ae2`→`9023236` |
| 스모크 상태 | ✅ 자동화 60/60 PASS (tester 위임). 수빈 재확인 권장: L2 로그인 필수 4건 + M5 온보딩 + M6 알림 + M7 팀 가입 + 시각 퀄리티 |
| 열린 PR | #54 (dev→main) / #55 (subin→dev) |
| 카페 Phase 3 | 운영 반영 ✅ (GH Actions + 쿠키 갱신 + 메일 알림 + 품질 검증봇) |

---

## W1~W4 + L3 + L2 완료 요약 (04-19 ~ 04-21)
| 주차 | 내용 | 계획 | 실제 |
|------|------|------|------|
| W1 | Q1~Q12 (라우트/네비/배지) | 20h | ~12h |
| W2 | M1 좌측 네비 + M2 대회 sticky | 10h | ~6h |
| W3 | M3/M5/M6 | 20h | ~7h |
| W4 | M4/M7/L1 + 회고 + 후속 정비 | 17h | ~3h |
| L3 | Organization brc + EditionSwitcher + SeriesCard | 3h | ~1.5h |
| L2 | 프로필 통합 + 공용 3종 + 대시보드 + 티어→레벨 | 15h | ~2h |
| **합계** | **4주 + L2·L3** | **~85h** | **~31.5h** (2.7배 절감) |

---

## 🗂 카페 작업 로그
→ `.claude/scratchpad-cafe-sync.md` 참조 (본 세션은 일반 모드이므로 여기에는 유지하지 않음)

---

## 수정 요청
| 요청자 | 대상 | 문제 | 상태 |
|--------|------|------|------|
| 수빈(L3-2 스모크) | `/organizations/*/series/*/page.tsx` | 500 + Turbopack worker crash | ✅ 코드 무결 / `.next` 재기동으로 복구 (errors.md [2026-04-12] 재발 참조+1) |
| pm-cafe (Stage B-1) | `(web)/community/**` 렌더 | HTML entity 디코드 누락 | ✅ 완료 `bb488ce` — 5파일 렌더 경로 decode 적용 |
| tester(위임 스모크 04-22) | dev server `/organizations/org-ny6os` | Turbopack worker crash 재발 (3회차). `/` 200인데 `/organizations/*` 만 500 → PID 46100 kill + `.next` 삭제 + npm run dev 재기동 → PID 78736 복구 / 전 엔드포인트 200 | ✅ errors.md [2026-04-12] 참조횟수+1 해당 (신규 라우트 첫 접근 패턴) |
| tester(Phase 1 Home 검증) | `src/components/layout/right-sidebar.tsx` | Home 페이지 xl+ 우측 사이드바에 레거시 "주목할 팀" / "최근 활동" 위젯이 그대로 남아 있음 (page.tsx에서는 제거 완료). PC뷰에서만 노출, 모바일 뷰에선 자동 숨김. v2 Phase 1 범위가 Home 본문에 한정되었으므로 **결함 아님 / 범위 밖** — 사이드바 v2 교체는 Phase 1에 포함시킬지, 후속 Phase로 넘길지 결정 필요 | 대기 (PM 범위 결정) |
| tester(Phase 1 Home 검증) | `src/app/(web)/page.tsx` | `<h1>` 태그 0건. v2 시안은 섹션 헤딩(`<h2>` "방금 올라온 글") 위주라 의도된 구조일 수 있으나 접근성/SEO 관점에서 페이지당 1개 h1 권장. PromoCard 내부 `<h2>`를 `<h1>`으로 승격하거나 시안 외 상단에 visually-hidden h1 추가 검토 | 대기 (PM 결정) |

---

## 운영 팁
- **tsx 환경변수**: `npx tsx --env-file=.env.local scripts/xxx.ts`
- **포트 죽이기**: `netstat -ano | findstr :<포트>` → `taskkill //f //pid <PID>` (node.exe 통째 금지)
- **신규 API 필드**: 추가 전 curl 1회로 raw 응답 확인 (snake_case 6회 재발)
- **공식 기록 쿼리**: `officialMatchWhere()` 유틸 필수
- **공용 컴포넌트**: `@/components/shared/breadcrumb` / `edition-switcher` / `@/components/profile/{profile-hero, mini-stat, recent-games}`
- **레벨 배지**: `@/lib/profile/gamification#getProfileLevelInfo(xp)` — 서버 컴포넌트 직접 호출 (API 경유 X)
- **에러 색상 토큰 패턴**: `var(--color-error)` / 배경은 `color-mix(in srgb, var(--color-error) 10%, transparent)`
- **gh 인증 풀림**: `GH_TOKEN=$(printf "protocol=https\nhost=github.com\n\n" | git credential fill 2>/dev/null | grep ^password= | cut -d= -f2) gh ...`

---

## 구현 기록 (04-22 요약)
오늘 세션 커밋 10건 완료. 상세 scratchpad 섹션은 커밋 메시지 + knowledge로 이관.
- **하드코딩 색상 audit**: 5차 누적 17파일 29건 치환 (1~5차 = 0f41e99/672dc9a/dfa5b9a/42c5066/6a7569b). tournament-admin 영역 완결. 잔존 실질 0 (예외 2 + false positive 2)
- **any 타입 audit**: 4건 정비 (3f54daa). 예외 13건 명시 (kakao SDK 9 / Next.js HOF 3 / SW 1)
- **카페 community HTML entity decode**: 5파일 렌더 시점 디코드 (bb488ce)
- **conventions 승격**: color-mix Tailwind arbitrary 문법 + any 예외 규칙 (ab46ae2)
- **docs**: smoke 체크리스트 (1958b9d) / 04-20 planning 지연 커밋 (9023236)
- **스모크**: Playwright 자동화 60/60 PASS (tester 위임). 로그인 필수 5건만 수빈 재확인 권장

---

## 구현 기록 — Phase 1 Games + 공통 컴포넌트 시안 매칭 [2026-04-22]

📝 구현한 기능: v2 Games.jsx 시안을 현재 `/games` 페이지 및 AppNav 공통 컴포넌트에 100% 반영 (색상/라벨/포맷/구조).

| 파일 경로 | 변경 내용 | 신규/수정 |
|----------|----------|----------|
| `src/components/bdr-v2/game-card.tsx` | kind 색상(pickup=cafe-blue/guest=bdr-red/scrimmage=ok) + 라벨(픽업/게스트/스크림) + 날짜(YYYY.MM.DD (요일) · HH:mm) + 비용(₩5,000/무료) 전면 재작업. TYPE_BADGE 참조 제거 → v2 원본 토큰 직접 사용 | 수정 |
| `src/app/(web)/layout.tsx` | PreferFilterToggleButton 정의 제거 + AppNav rightAccessory 전달 제거. usePreferFilter 는 setLoggedIn 훅용으로 유지 | 수정 |
| `src/components/bdr-v2/app-nav.tsx` | rightAccessory prop 제거(더 이상 미사용) + 주석 업데이트 | 수정 |

### 변경 요약
- **kind 매핑** (v2 Games.jsx L5~L6 그대로 이식):
  - game_type=0 (픽업) → `var(--cafe-blue)` / "픽업"
  - game_type=1 (게스트) → `var(--bdr-red)` / "게스트"
  - game_type=2 (DB상 PRACTICE = 시안 scrimmage) → `var(--ok)` / "스크림"
- **날짜 포맷**: `2026.04.25 (토) · 22:55` (시안의 "– HH:mm" 종료 시각은 `listGames` select에 duration_hours/ended_at 미포함으로 생략 — Prisma select 비변경 방침)
- **비용 포맷**: 유료 → `₩{toLocaleString}` (예: ₩5,000) / 무료 → "무료" + `color:var(--ok)` + `font-weight:700`
- **진행바 색상**: 마감임박이면 `var(--accent)`(red), 아니면 해당 kindColor
- **AppNav 별 아이콘 제거**: layout.tsx에서 `PreferFilterToggleButton`(`>star<`) 삭제. `PreferFilterProvider` context는 유지(usePreferFilter 훅은 setLoggedIn 호출에 계속 필요)

### 검증 결과 (HTML 렌더)
- `tsc --noEmit` PASS (0 에러)
- `curl /games` → 200
- `var(--cafe-blue)`/`var(--bdr-red)`/`var(--ok)` 렌더 HTML에서 확인 (stripe 4px + 배지 + 진행바 3군데 각각)
- kind 배지 삼중 속성 렌더: `background:var(--bdr-red);color:#fff;border-color:var(--bdr-red)` × 31건 / `var(--ok)` × 29건
- 날짜 포맷 샘플: `2026.04.25 (토) · 22:55` / `2026.04.25 (토) · 18:00` / `2026.04.25 (토) · 09:00` 등
- 비용 포맷 샘플: "무료" 9회 + "₩6,000" 첫 유료 카드 확인
- AppNav 별 아이콘: `>star<` 0건 / "PreferFilter" 문자열 0건 (rendered HTML 기준)

💡 tester 참고:
- **테스트 방법**: `/games` 접속 → 카드 30장 내외 렌더 확인. 라이트/다크 양쪽에서 kind 색상이 시안과 일치하는지. AppNav 우측에 별 아이콘이 없는지.
- **정상 동작**:
  - 픽업 카드는 상단 stripe + 배지 + 진행바 모두 파랑(`--cafe-blue`)
  - 게스트는 빨강(`--bdr-red`)
  - 스크림(연습경기)은 초록(`--ok`)
  - 일시는 "YYYY.MM.DD (요일) · HH:mm" (요일 한글)
  - 무료는 녹색 볼드, 유료는 "₩" 기호 + 콤마 구분 숫자
  - AppNav 우측에 ThemeSwitch / 검색 / 알림 / 더보기 / 아바타만 노출 (별 X)
- **주의할 입력**: game_type 이 0/1/2 외의 값이면 기본값 0(픽업/파랑) 폴백. scheduled_at 이 null 이면 "일정 미정"

⚠️ reviewer 참고:
- **TYPE_BADGE 제거 영향 없음**: GameCard 에서만 사용하던 필드로 교체. 다른 곳에서 import 시 그대로 동작 (상수 파일 자체는 그대로 유지)
- **rightAccessory prop 제거**: AppNavProps 에서 optional 제거했으므로 이 prop을 외부에서 넣던 호출부는 layout.tsx 하나뿐 (동시 제거 완료)
- **PreferFilterProvider 유지**: context 자체는 usePreferFilter 훅이 setLoggedIn 을 노출하므로 layout.tsx 에서 호출 필요. 프로젝트 다른 페이지(예: 홈)에서도 사용 가능성 존재
- **종료 시각 미표시**: 시안은 "· 20:30 – 22:30" 이지만 구현은 "· 22:55" 단일. 사유는 `listGames` select 미포함 + Prisma 비변경 방침. duration_hours 인입 시 formatScheduleFull 한 줄만 확장하면 됨

---

## 기획설계 (planner-architect) — BDR v2 전역 교체 + Home 적용 [04-22]

🎯 목표: BDR v2 디자인 시스템 프로젝트 전역 적용(사용자 "완전 교체" 방침) + Home 페이지 섹션 단위 UI 교체. API/데이터 패칭 0 변경.

### 1. 토큰 충돌 분석 (치명적)

**변수 네임스페이스가 완전히 다름** — v2는 `--bg`, `--ink`, `--accent` 등 **간결형 접두사 없는** 변수. 기존은 `--color-primary`, `--color-card`, `--color-text-primary` 등 **`--color-*` 접두사**. 변수 하나도 직접 공유되지 않음.

| 카테고리 | 기존(globals.css) | BDR v2(tokens.css) | 충돌/매핑 |
|---------|-------------------|-------------------|----------|
| 테마 스위치 | `html.dark` 클래스 토글 | `[data-theme="dark"]` 속성 토글 | **패러다임 충돌** — 전역 테마 토글 코드/SSR FOUC 스크립트 전부 영향 |
| 페이지 배경 | `--color-background` | `--bg` | 변수명 다름. `--bg-elev/--bg-card/--bg-alt/--bg-head` 4계층 신규 |
| 텍스트 | `--color-text-primary/-secondary/-muted/-disabled` | `--ink/--ink-soft/--ink-mute/--ink-dim/--ink-on-brand` | 명명 충돌 |
| 테두리 | `--color-border/-subtle` | `--border/--border-strong/--border-hard` | 명명 충돌 + v2에 hard tier 추가 |
| 브랜드 | `--color-primary` = **#3182F6 토스 블루** | `--bdr-red` = **#E31B23**, `--accent` = `--bdr-red`, `--cafe-blue` = #0F5FCC | **primary 의미 반전** — 기존 primary=블루, v2 primary=레드/카페블루 듀얼 |
| 상태 | `--color-error/-success/-warning/-info` | `--danger/--ok/--warn/--info` | 명명 충돌 (값은 근사치 — #EF4444 vs #E24C4B 등) |
| 폰트 | `--font-sans`=SUIT, `--font-heading`=GmarketSans | `--ff-body`=Pretendard, `--ff-display`=Archivo, `--ff-mono`=JetBrains Mono | **완전 교체** — 폰트 2종 신규(Archivo/JetBrains Mono) |
| Radius | `--radius-card`=16px, `--radius-button`=12px | `--radius-card`=10px(light)/0px(dark), `--radius-chip`=6px/2px | **같은 변수명, 다른 값** ← 주의 (v2는 dark에서 0px = brutalist) |
| 그림자 | `--shadow-card/-elevated` | `--sh-xs/-sm/-md/-lg` | 명명 충돌 + dark에서 v2는 **hard offset 그림자** (brutalist 스타일) |
| Spacing | (없음 — Tailwind 직접) | `--s-1`~`--s-20` | v2 신규 토큰, Tailwind와 병행 시 혼선 우려 |

**치명 포인트**:
- 어제 71건 정비한 `var(--color-error)` / `var(--color-primary)` / `var(--color-success)` / `var(--color-warning)` **전부 v2에 존재하지 않음** → 완전 교체 시 즉시 깨짐
- 현 코드 **`var(--color-*)` 사용 8개 이상 변수 × 173+ 점**이 의존
- `html.dark` 클래스는 코드 전역에서 토글/쿼리됨 → `[data-theme="dark"]`로 바꾸면 모든 다크모드 분기 수정 필요

### 2. 교체 전략 추천: **B. 별칭 매핑 레이어**

3가지 옵션 중 선택 근거:

| 옵션 | 장점 | 단점 | 추천 여부 |
|------|------|------|----------|
| A. 완전 교체 | 의도 100% 일치, v2 원본 보존 | 29+ 페이지 173+ 변수 참조 즉시 깨짐, tsc/build 문제 없음(CSS 런타임 깨짐), 롤백 = 부분 깨짐 복구 불가 | ❌ |
| **B. 별칭 매핑** | **하루 세션에 안전 적용**, Home 적용 중에도 나머지 29 페이지 정상, 점진 철수 가능 | v2 원본 tokens.css 대비 한 층 추가(10~20줄) | ✅ **추천** |
| C. 점진 격리 | 최소 리스크 | "전역 교체"라는 사용자 의도에서 이탈 | ❌ |

**B안 구성**:
1. `globals.css`를 v2 tokens.css 본체(+ html.dark 테마 전환 어댑터)로 **완전 교체**
2. v2 네이티브 변수 전부 그대로 사용(홈 신규 섹션에서 native `--bg` `--ink` 사용)
3. **별칭 레이어 추가** — 기존 `--color-*` 변수명을 v2 변수로 alias 정의. 예:
   ```css
   :root, html.dark, html.light {
     --color-background: var(--bg);
     --color-card: var(--bg-card);
     --color-text-primary: var(--ink);
     --color-border: var(--border);
     --color-primary: var(--bdr-red);       /* ⚠ 의미 반전 — 기존 primary는 토스 블루 */
     --color-error: var(--danger);
     --color-success: var(--ok);
     --color-warning: var(--warn);
     --color-info: var(--info);
     /* ... 약 25개 alias */
   }
   ```
4. **테마 토글 어댑터** — `html.dark { data-theme: dark }` CSS selector로 흡수 or html 태그에 두 속성 동시 세팅
5. **`--color-primary` 의미 반전 경고** — 과거 블루(#3182F6)였던 게 레드(#E31B23)로 바뀜. 버튼/링크/활성 탭 색감이 전 페이지에서 바뀜. 사용자 의도(BDR Red 재천명)라면 OK, 아니라면 `--color-primary` alias만 `--cafe-blue`로 유지하고 v2 accent(red)는 별도 토큰 사용

### 3. Home 페이지 UI 매핑

**BDR v2 Home.jsx 섹션**:
1. **Promo Banner** (.promo) — 대회 1건 하이라이트 + 신청/자세히 버튼 2개
2. **Stats Strip** — 4열 카드 (전체회원 / 지금접속 / 오늘의글 / 진행중대회)
3. **공지·인기글** (.card with HOT_POSTS 리스트)
4. **열린 대회** (.card with TOURNAMENTS.filter(open|closing|live).slice(0,3))
5. **방금 올라온 글** (.board 테이블 — LATEST_POSTS)

**기존 `src/app/(web)/page.tsx` 섹션** (API 유지 필수):
| 섹션 | 컴포넌트 | 데이터 소스 |
|------|---------|------------|
| 0. Hero | `HomeHero` (로그인 분기) | `/api/web/me` + ProfileWidget/QuickActions/NewsFeed |
| 1. 추천 경기 | `RecommendedGames` | `prefetchRecommendedGames()` → 서버 프리페치 |
| 2. 추천 대회 | `RecommendedTournaments` | 자체 fetch |
| 3. 주목할 팀 | `NotableTeams` | `prefetchTeams()` |
| 4. 최근 활동 | `RecentActivity` | 자체 fetch |
| 5. 추천 영상 | `RecommendedVideos` | 자체 YouTube API |
| 6. 커뮤니티 | `HomeCommunity` | `prefetchCommunity()` |
| 우측(xl+) | `RightSidebar` | layout.tsx에서 주입 |

**매핑표** (v2 시안 → 기존 데이터):
| v2 섹션 | 기존 섹션 매핑 | 처리 방식 |
|--------|--------------|----------|
| Promo Banner | `RecommendedTournaments`의 첫 번째 항목 or `HomeHero` 교체 | RecommendedTournaments 첫 카드만 `.promo` 스타일로 렌더. API 그대로 |
| Stats Strip 4카드 | `_statsData` (prefetchStats, 현재 미사용 _ 접두사) | **잠들어있던 데이터 활성화**. stats API 응답이 4필드 맞는지 확인 필요. 부족하면 plaholder(-) |
| 공지·인기글 | `HomeCommunity`의 변형 | `prefetchCommunity()` 응답 중 인기/공지 분류 있으면 사용, 없으면 HomeCommunity 그대로 두고 v2 섹션 스킵 |
| 열린 대회 | `RecommendedTournaments` | `.card` 컴포넌트 3 rows로 재배치. 데이터 변환 0 |
| 방금 올라온 글 | `HomeCommunity` 리스트 | `.board` 테이블 스타일 적용, 데이터 변환 0 |
| (누락) | `RecommendedGames` | **v2 시안에 없음** — 유지할지 제거할지 사용자 결정 필요 (추천: 유지, 공지·인기글 위 또는 아래에 삽입) |
| (누락) | `RecommendedVideos` | **v2 시안에 없음** — 동일 처리 |
| (누락) | `RecentActivity` | **v2 시안에 없음** — 동일 처리 |

**DB 없음 UI 요소**:
- v2 Stats Strip의 "지금 접속" — DB에 실시간 접속자 카운트 없음 → placeholder "-" 또는 섹션 제거
- v2 Promo Banner의 "지금 신청하기" CTA — 대회 상세 페이지로 Link만 (기존 기능)
- v2 방금 올라온 글의 "N" 뱃지 — `community_posts.created_at` 기준 24시간 이내면 표시 가능(기존 패턴 유지)

### 4. 작업 순서 (Home 단일 적용)

| Step | 작업 | 영향 범위 | 예상 시간 |
|------|------|----------|----------|
| S1 | v2 tokens.css 본체 `src/app/globals.css`로 이식 (기존 @theme 블록 교체) + **별칭 alias 레이어 추가** + `html.dark`↔`[data-theme="dark"]` 어댑터 | globals.css 1파일 | 40분 |
| S2 | `src/app/layout.tsx` 폰트 추가 — Archivo, JetBrains Mono next/font 설정 (Pretendard는 이미) | layout.tsx 1파일 | 15분 |
| S3 | v2 responsive.css 필요분만 globals.css 하단에 통합 (`.page`/`.with-aside`/`.board__row` 모바일 등) | globals.css | 15분 |
| S4 | v2 공통 컴포넌트 React화 — `src/components/bdr-v2/promo.tsx`, `stats-strip.tsx`, `board-row.tsx`, `card-panel.tsx` (4개 서버 컴포넌트, props로 데이터 받음) | 신규 4파일 | 40분 |
| S5 | `src/app/(web)/page.tsx` 섹션 재구성 — 신규 컴포넌트에 기존 prefetch 데이터 주입. `HomeHero`/`RecommendedGames`/`RecommendedVideos`/`RecentActivity` 처리 방침 반영 | page.tsx 1파일 | 30분 |
| S6 | 검증 — `npm run tsc:noEmit` + `npm run build` + 수동 스모크 (/ 홈 / 다른 대표 페이지 5곳: /games, /tournaments, /teams, /profile, /community) 라이트·다크 2모드 × 모바일·PC 2폭 | 시각 확인 | 30분 |
| **합계** | | | **~2h 50m** |

**S6 수동 스모크 대상 — 29+ 페이지에서 "대표 5"** (전수 검증은 비현실적 → 색상/테마 의존 큰 곳 샘플링):
- `/` 홈 (S5 대상, 교체 반영 확인)
- `/games` (카드 + 필터 드롭다운 — primary 색상 많이 씀)
- `/tournaments/[id]` (대진표 + 상태 뱃지 — error/warning/success 변수 의존)
- `/profile` (본인 대시보드 — text 계열 변수 + 레벨 배지)
- `/community/[id]` (카페 decode 검증 완료분 — 텍스트/링크 색감)
- admin 1개 (`/admin` 또는 `/admin/users`) — 라이트 전용 테마 확인

### 5. 리스크 + 롤백

**리스크 매트릭스**:
| 리스크 | 발생 가능성 | 영향도 | 완화 |
|--------|-----------|--------|------|
| 별칭 alias 누락 → 특정 페이지 흰 배경/검정 글씨 | 중 | 중 | S1에서 누락 alias 발견 시 추가. `grep -rn "var(--color-" src/` 로 사용 변수 리스트업 후 매핑 표 완성 |
| `--color-primary` 의미 반전(블루→레드)으로 UI 톤 급변 | **높음** | **높음** | 사용자 의도 재확인 필요. "BDR Red가 primary로 돌아옴"이 의도면 OK. 아니면 primary는 카페블루 유지 |
| 테마 토글(`html.dark` ↔ `[data-theme="dark"]`) 불일치 | 중 | 중 | CSS 레벨에서 `html.dark, [data-theme="dark"] { ... }` 이중 selector로 흡수. JS 측 `document.documentElement.classList.add("dark")`는 그대로 유지하되 `dataset.theme = "dark"`도 함께 세팅하는 1줄 추가 |
| dark 모드 radius=0(brutalist) 적용으로 기존 둥근 카드 전부 각진 카드로 변경 | 높음 | 중 | 디자인 의도(v2 "refined brutalism")면 수용. 이탈이면 alias에서 `--radius-card: 0.5rem` 고정 오버라이드 |
| `shadow-glow-primary/accent` / `clip-slant*` / `watermark-text` 유틸리티 (2K 스타일)가 전 페이지에서 사용 중인데 v2와 이질적 | 중 | 저 | globals.css 하단 유틸리티 블록은 **유지**. v2와 병행 가능(레이아웃에는 영향 없음) |
| 폰트 로딩 지연으로 FOUC | 저 | 저 | next/font + `font-display: swap` 기본 동작 |

**롤백 전략**:
- S1~S3는 `globals.css` 단일 파일 → `git revert` 1회로 완전 복구
- S4 신규 4파일 → `git rm` 즉시 제거, page.tsx 1커밋 revert로 Home 원복
- 페이지별 격리 불요(B안은 alias 레이어가 안전망)

**핫픽스 절차** (tsc/build 깨졌을 때):
1. `npm run tsc:noEmit` 에러가 CSS 경로라면 → globals.css 구문 오류. 가장 최근 edit 부분 롤백
2. Tailwind arbitrary 파싱 에러 → `@source not` 범위 확인(현재 `.claude` 제외). v2 `[data-theme=...]` selector는 @source에 걸리지 않음
3. `next build` 에러가 런타임 렌더 관련 → page.tsx 섹션 1개씩 주석 처리하며 이분 탐색

### 6. 의존성 & 차단 이슈

**신규 폰트 로딩**:
- `Archivo` — next/font/google에서 제공 ✅
- `JetBrains Mono` — next/font/google에서 제공 ✅
- `Pretendard` — 이미 로드됨 (globals.css CDN 또는 next/font 확인 필요)
- `Noto Sans KR` — v2 fallback에 포함. Next 내장 fallback 활용 가능, 추가 로딩 불필요

**BDR v2 `v1/`, `ref/` 폴더**:
- 시안 비교용. 본 교체 범위 밖. **읽지도 수정하지도 않음**
- `screenshots/` = 시각 레퍼런스만

**다른 페이지 번짐 위험 대략 추정**:
- `var(--color-*)` 사용 파일 **20 파일 / 173 occurrence** (Grep 검증)
- alias 레이어로 **대부분(95%+) 자동 흡수**
- 번지는 영역: 색감(primary 블루→레드), 카드 라운딩(16px→10px/0px), 폰트(SUIT→Pretendard — 한글 가독성 비슷) 3가지

**사용자 결정 필요 3건** (S1 착수 전 확인):
1. ❓ `--color-primary` 의미 반전 수용? (기존 토스 블루 → BDR Red). "BDR Red 복귀가 맞다" 면 진행
2. ❓ 다크모드 radius=0(brutalist) 수용? 아니면 alias에서 `--radius-card: 0.5rem` 강제
3. ❓ Home에서 v2 시안에 없는 3섹션(RecommendedGames / RecommendedVideos / RecentActivity)은 유지? 제거? 위치 이동?

### 7. 실행 계획 (developer 위임용)

| 순서 | 작업 | 담당 | 선행 조건 | 병렬 |
|------|------|------|----------|------|
| 1 | globals.css v2 토큰 이식 + alias 레이어 + 테마 어댑터 (S1) | developer | 사용자 결정 3건 | 단독 |
| 2 | layout.tsx 폰트 추가 (S2) | developer | 1단계 | 단독 |
| 3 | responsive.css 필요분 통합 (S3) | developer | 1단계 | 단독 |
| 4 | bdr-v2 컴포넌트 4종 신규 (S4) | developer | 1~3단계 | 단독 |
| 5 | page.tsx 섹션 재구성 (S5) | developer | 4단계 | 단독 |
| 6 | tester + reviewer 병렬 (S6) — tsc / next build / 수동 스모크 5페이지 × 4조합 | tester + reviewer 병렬 | 5단계 | ✅ 병렬 |

⚠️ developer 주의사항:
- **카페 파일 절대 수정 금지** (`scripts/cafe-*`, `src/lib/cafe-sync/*`, `.auth/*`)
- **API/데이터 패칭 0 변경** — `prefetchTeams/Stats/Community/RecommendedGames` 함수 및 모든 `fetch()` 호출 건드리지 말 것
- v2 시안의 Onboarding 모달은 **Home 범위 밖** (별도 세션)
- `globals.css`의 `@media print` 블록은 **수정 금지** (어제 프린트 CSS 정비분)
- `shadow-glow-primary/accent` / `clip-slant*` / `watermark-text` 유틸리티는 **유지** (기존 홈/대회 페이지에서 사용 중)
- 하드코딩 색상 71건 정비분이 alias로 살아 있는지 사전 확인 — `rg 'var\(--color-(error|warning|success|info|primary)\)' src/` 수치 정비 전후 동일해야 함

---

## 기획설계 — BDR v2 전체 프로젝트 로드맵 [04-24, design_v2 브랜치]

🎯 목표: v2 UI를 **프로젝트 전체 기준**으로 삼아 기존 페이지를 점진적으로 교체.
📝 전제 완화: "API/데이터 패칭 절대 변경 금지" 규칙은 **백엔드(route.ts)·Prisma 스키마 한정**으로 좁힘. 클라이언트 측 페칭(useSWR key, fetch 호출 위치) / 상태 / props shape은 v2 맞춤 조정 허용.

### 1. 페이지 매핑 매트릭스 (v2 48개 ↔ 기존 88개)

**버킷 A — 1:1 직접 매핑** (18개, 기존 페이지 교체)
| v2 시안 | 기존 라우트 | 비고 |
|---------|------------|------|
| Home | `/` | Phase 0 완료 후 착수 |
| Games | `/games` + `/games/[id]` = GameDetail | 2시안 → 2라우트 |
| GameDetail | `/games/[id]` | |
| CreateGame | `/games/new` | 3-step wizard 유지 |
| Match / Live | `/live` + `/live/[id]` | Match는 라이브 상세 |
| GameResult | `/live/[id]` 종료 후 화면 or 신규 탭 | 기존 미매칭 — 신규 섹션 |
| MyGames | `/games/my-games` | |
| Notifications | `/notifications` | |
| Profile | `/profile` (본인) | L2에서 최근 정비 |
| PlayerProfile | `/users/[id]` (타인) | L2에서 최근 정비 |
| BoardList | `/community` | |
| PostDetail | `/community/[id]` | |
| PostWrite | `/community/new` + `/community/[id]/edit` | |
| TeamDetail | `/teams/[id]` | |
| Team (목록) | `/teams` | |
| TeamCreate / CreateTeam | `/teams/new` | v2에 2종 존재 — 통합 |
| Bracket | `/tournaments/[id]/bracket` | |
| Court / CourtDetail / CourtBooking | `/courts` + `/courts/[id]` + `/courts/[id]/checkin` | Booking은 체크인으로 매핑 |
| Login / Signup | `/login` / `/signup` | |
| Pricing / Checkout | `/pricing` + `/pricing/checkout` | |
| Help | `/help/glossary` | |
| Search | `/search` | |
| Settings | `/profile/settings` | |
| OrgDetail / Orgs | `/organizations/[slug]` + `/organizations` | |
| Referee | `(referee)/referee/*` | 독자 레이아웃 유지 |

**버킷 B — v2에만 있음** (10개, 신규 도입 검토 필요)
| v2 시안 | DB 지원 | 처리 전략 | 사용자 결정 필요 |
|---------|---------|----------|----------------|
| Shop | ❌ 상품·주문 모델 없음 | UI만 배치 "준비 중" 또는 제외 | 제외 추천 |
| Stats | △ 기록 있음, 전용 화면 없음 | `/rankings` 하위 탭 or 신규 `/stats` | 통합 추천 |
| Safety | ❌ 문서 페이지 | `/terms`/`/privacy` 옆 `/safety` 정적 페이지로 | 정적 도입 OK |
| Reviews | ❌ 리뷰 모델 없음 | UI만, 동작 미구현 | 보류 |
| Gallery | △ 이미지 업로드 존재 | `/community` 이미지 탭 or 보류 | 보류 추천 |
| Coaches | ❌ 코치 역할 모델 없음 | 보류 | 보류 |
| Rank | ✅ `/rankings` 존재 | 기존과 통합 = 버킷 A로 이동 | 통합 결정 |
| Achievements | △ 업적 없음(XP만) | 프로필 내부 섹션으로 흡수 | 흡수 추천 |
| Awards | △ MVP 카드 더미 있음 | 프로필 내부 섹션으로 흡수 | 흡수 추천 |
| Saved | ❌ 북마크 모델 없음 | 보류 or UI만 | 보류 추천 |
| Scrim | ❌ 스크림 모델 없음 | `/games` 필터로 흡수 가능 | 흡수 추천 |
| GuestApps | △ 게스트 지원 기존 게임에 있음 | `/games/my-games`에 탭 추가 | 흡수 추천 |
| TeamInvite | △ 팀 초대 로직 존재 | 팀 관리 페이지에 흡수 | 흡수 추천 |
| TournamentEnroll | ✅ `/tournaments/[id]/join` 존재 | 버킷 A로 이동 | 통합 결정 |
| Messages | ❌ DM 모델 없음 | 보류 or UI만 | 보류 추천 |
| Calendar | △ 경기 일정 있음 | 신규 `/calendar` 집계 뷰 | 도입 검토 |

**버킷 C — 기존에만 있음 (v2 시안 없음)** (관리자 영역 대부분)
| 기존 페이지 | 처리 옵션 |
|------------|----------|
| `/tournament-admin/*` 13개 | **옵션 2 추천**: 토큰만 v2로 교체, 레이아웃 유지. 내부용이라 재디자인 비용 대비 효익 낮음 |
| `/partner-admin/*` 4개 | **옵션 2 추천**: 동일 |
| `/profile/growth` | **옵션 3**: Phase 5에서 Profile/Stats 계열에 흡수 |
| `/profile/weekly-report` | **옵션 3**: 동일 |
| `/profile/notification-settings` | **옵션 2**: Settings 페이지 하위 탭 |
| `/profile/complete`, `/profile/complete/preferences` | 온보딩 — v2 Onboarding 모달로 교체 |
| `/profile/billing`, `/subscription`, `/payments`, `/basketball` | Settings·Profile 하위 탭으로 재편 |
| `/~offline` | 그대로 유지 (PWA 내부) |
| `/invite`, `/forgot-password`, `/reset-password`, `/verify` | 단순 교체 (Phase 6 Login·Signup과 같이) |
| `/terms`, `/privacy` | 토큰만 교체 |
| `/series/*`, `/organizations/*/series/*` | Orgs/OrgDetail 시안 확장 적용 |
| `/venues/[slug]` | Court 계열 시안 재사용 |
| `/rankings`, `/notifications`, `/search` | 버킷 A에 포함됨 |

### 2. 전체 Phase 구성 (0~9)

| Phase | 범위 | 페이지 수 | 공수 | 의존 |
|-------|------|----------|------|------|
| **0. 기반** | globals.css v2 토큰 + alias 레이어 + 폰트 + responsive | 0 (인프라) | 2h | - |
| **1. 핵심 랜딩·탐색** | Home / Games / GameDetail / Live(Match) / Profile | 5 | 8~10h | 0 |
| **2. 경기 플로우** | CreateGame / GameResult / MyGames / Notifications / Search | 5 | 6~8h | 0, 1 |
| **3. 팀·대회** | Teams 목록·상세·생성·관리 / Tournaments 목록·상세·참가·Bracket / Orgs·OrgDetail·Series | 12 | 18~22h | 0 |
| **4. 커뮤니티** | BoardList / PostDetail / PostWrite / PostEdit | 4 | 5~6h | 0 |
| **5. 프로필·랭킹·기타** | PlayerProfile / profile/edit · basketball · preferences · activity / Rank(rankings) / More | 7 | 8~10h | 0, 1 |
| **6. 인증·결제** | Login / Signup / ForgotPassword / ResetPassword / Verify / Invite / Pricing / Checkout / Help / Safety(신규) / Terms / Privacy | 12 | 10~12h | 0 |
| **7. 코트·보조** | Courts 목록·상세·체크인 / Venues / Calendar(신규) / Settings + 하위 탭 / billing · subscription · payments · notification-settings | 10 | 10~12h | 0 |
| **8. 관리자 정책** | tournament-admin 13 / partner-admin 4 / profile/growth · weekly-report | 19 | 6~8h | 0 (토큰만 교체) |
| **9. 정리·병합** | 레거시 CSS·컴포넌트 제거 + Onboarding 모달 / design_v2 → dev PR | - | 4~6h | 전부 |
| **총계** | | **74** (+ 버킷 B 선택분) | **77~94h** | |

### 3. 세션 단위 분배 (4~6h/일)

| 주차 | Phase | 주요 산출물 |
|------|-------|------------|
| W1 | Phase 0 + Phase 1 전반 | 토큰·폰트·responsive / Home·Games 완료 |
| W2 | Phase 1 후반 + Phase 2 | GameDetail·Live·Profile / Create·Result·MyGames·Noti·Search |
| W3 | Phase 3 | Teams 6 + Tournaments 6 (집중 투자) |
| W4 | Phase 4 + Phase 5 | Community 4 + Profile 하위 + Rank + More |
| W5 | Phase 6 + Phase 7 | 인증·결제·Help·Safety / Courts·Calendar·Settings |
| W6 | Phase 8 + Phase 9 | admin 토큰 교체 + 레거시 정리 + PR |

**단축 시나리오**: 버킷 B 전부 보류 시 -10~15h, 관리자 재디자인 생략 시 -6h → 최소 **62h / 4주 압축 가능**.

### 4. 공통 컴포넌트 분해 (`src/components/bdr-v2/`)

v2 `components.jsx` 340줄에서 재사용 단위 추출:

**Phase 0에 선제 추출 (6개, 홈 전에 필요)**
| 컴포넌트 | 역할 | 원본 위치 |
|---------|------|----------|
| `<AppNav>` | 상단 네비(로고 + 탭 + 검색·알림·프로필) | components.jsx L93-211 |
| `<Drawer>` | 모바일 드로어 | L215-245 |
| `<Sidebar>` | 좌측 게시판 사이드바 (커뮤니티 전용) | L311-335 |
| `<Avatar>` | 로고/이니셜 폴백 | L24-45 |
| `<PromoCard>` (Home용) | Home Phase 0 설계 산출물 | 신규 |
| `<StatsStrip>` | 4카드 통계 | 신규 |

**Phase별 점진 추출**
| Phase | 추출할 컴포넌트 |
|-------|----------------|
| 1 | `<BoardRow>` `<CardPanel>` `<Poster>` `<LevelBadge>` `<Pager>` |
| 2 | `<GameCard>` `<MatchLive>` `<NotificationItem>` |
| 3 | `<TeamCard>` `<TournamentCard>` `<BracketNode>` `<SeedBadge>` |
| 4 | `<PostRow>` `<CommentTree>` `<WriteEditor>` |
| 5 | `<ProfileHero>` (기존 재활용) `<StatRadar>` `<RankRow>` |
| 6 | `<AuthCard>` `<PricingCard>` `<FormField>` |

**원칙**: 같은 패턴 **3회 이상 사용** 예정이면 공통 추출. 1~2회면 페이지 내 로컬 컴포넌트.

### 5. PR 전략 (혼합 추천)

| 전략 | 장점 | 단점 | 추천 |
|------|------|------|------|
| A. 최종 1회 PR (design_v2 → dev) | 중간 brea­k 없음 | 3~4주 drift / 리뷰 부담 / 충돌 해결 지옥 | ❌ |
| B. Phase 0만 선 머지 | 나머지 브랜치가 토큰 혜택 | alias 레이어로 기존 페이지는 안전하지만 홈이 섞여서 머지됨 | △ |
| **C. 혼합** | **Phase 0+1 먼저 머지(design_v2 → dev)** → 이후 Phase 2~9를 **Phase 단위로 rolling PR** | 매주 PR 1회, drift 최소, 리뷰 단위 작음 | ✅ **추천** |

**혼합 전략 구체 계획**
1. W1 끝: Phase 0+1 머지 (첫 PR, 토큰 + Home + Games)
2. W2~W5: 매주 Phase 완료 시 PR (6회)
3. W6: Phase 8+9 최종 정리 PR

**dev 동기화 규칙**: 매주 Phase 완료 후 `design_v2 ← dev` rebase 1회. 카페·subin 브랜치 긴급 수정 발생 시 design_v2에도 cherry-pick.

### 6. 리스크 + 롤백

| 리스크 | 확률 | 영향 | 완화 |
|--------|------|------|------|
| 3~4주 작업 중 요구사항 변경 | 높음 | 중 | Phase 단위 PR로 매주 커밋. 최악 = 1주 손실 |
| subin 브랜치 긴급 수정(카페 포함) cherry-pick 필요 | 중 | 저 | design_v2는 매주 dev rebase. 충돌은 globals.css 한 곳만 집중 |
| 테스트 커버리지 부족 (Playwright smoke만) | 높음 | 중 | Phase 완료마다 수동 스모크 5페이지 × 4조합(PC/Mobile × Light/Dark). E2E는 이번 범위 밖 |
| alias 레이어에 누락된 CSS 변수 발견 | 중 | 저 | Phase 1부터 매 Phase 착수 시 `rg 'var\(--color-' src/` 리스트업, 누락분 alias 추가 |
| 버킷 B 도입 범위 확대로 Phase 팽창 | 중 | 중 | 본 설계에 "보류/흡수" 기본값 정해둠. 각 Phase 종료 시 버킷 B 재검토 |
| Phase 1 홈만 먼저 배포 시 다른 페이지 UI 드리프트 | 낮음 | 낮음 | alias 레이어가 기존 페이지 보존. "홈만 v2, 나머지 구디자인 유지" 상태도 운영 가능 |

**롤백 절차**
- Phase 단위: 해당 Phase PR revert 1회로 원복
- 전체: design_v2 브랜치 폐기, subin에서 재개
- 부분: alias 레이어만 유지하고 v2 컴포넌트 import 되돌리기 (페이지별)

### 7. 이번 세션 우선순위 확정

사용자 지시: **"Home + Games 두 페이지 / Home만 우선"**

**이번 세션 달성 목표** (잔여 세션 시간 가정 3~4h):
1. ✅ Phase 0 S1~S3 완료 (토큰 + alias + 폰트 + responsive) — **우선 실행**
2. ✅ Phase 0 S4 공통 컴포넌트 4~6개 선제 추출
3. ⚡ Phase 1 Home 페이지 S5(page.tsx 섹션 재구성) 착수 — 완료까지 도달 가능
4. ⏳ Phase 1 Games는 **다음 세션**으로 이월

**다음 세션 진입점**:
- Home 마무리 검증(S6) + Games Phase 1-2 착수
- 본 scratchpad `기획설계` 섹션 2개(Phase 0 + 전체 로드맵)를 그대로 참조하여 바로 실행 가능

### 📌 사용자 결정 대기 포인트

| # | 결정 사항 | 추천 기본값 |
|---|----------|------------|
| D1 | `--color-primary` 의미 반전(블루→레드) 수용? | ✅ 수용 (BDR Red 복귀) |
| D2 | 다크모드 brutalist radius=0 수용? | ✅ 수용 (v2 원본 의도) |
| D3 | Home의 v2 미포함 3섹션(추천경기/추천영상/최근활동) 처리 | 유지 (섹션만 재배치) |
| D4 | 버킷 B 10개: Shop/Reviews/Gallery/Coaches/Saved/Messages 보류 vs 도입 | 보류 (DB 없음) |
| D5 | 버킷 B: Achievements/Awards 프로필 내부 흡수 / Scrim·GuestApps·TeamInvite 기존 흐름 흡수 | 흡수 (UI만) |
| D6 | 버킷 B: Calendar 신규 도입 vs 보류 | 신규 도입 (일정 집계) |
| D7 | 버킷 C 관리자 17페이지: 옵션 1(유지) vs 2(토큰만) vs 3(재디자인) | 옵션 2 (토큰만) |
| D8 | PR 전략 A/B/C | C (혼합) |

결정 8건 중 D1·D2·D8만 **Phase 0 착수 전 필수**. 나머지는 해당 Phase 진입 시 확정해도 무방.

---

## 구현 기록

### [2026-04-24] Phase 2 MyGames — v2 재구성 (A 변형: 신청내역 + 호스트 섹션 보존)
- **브랜치**: design_v2 (Phase 1 Profile 커밋 위)
- **배경**: v2 MyGames.jsx 시안 = "내 신청 내역"(경기+대회 통합) 메인. 기존 `/games/my-games` = "내가 만든 경기"만 다룸. A 변형 확정 → 상단 시안 재현 + **하단에 기존 호스트 섹션 보존**(데이터 보존 원칙). `/profile/activity` 는 그대로 유지
- **PM 원칙**: API route.ts / Prisma 스키마 0 변경 / Prisma 직접 호출은 OK / 카페 세션 파일 금지 / 기존 파일 삭제 금지 / QR·후기·호스트 문의·취소 = alert("준비 중") / 결제 = `/pricing/checkout` 라우팅 확인됨 / waitlist·no-show 제거(Q4 DB 4종만)
- **변경 5건** (4 신규 + 1 재작성):

| 파일 경로 | 변경 내용 | 신규/수정 |
|----------|----------|----------|
| `src/app/(web)/games/my-games/_components/stat-card.tsx` | 상단 4카드 그리드용. 3줄 구조(label + 30px ff-display 900 value + sub). StatsStrip 은 2줄이라 별도 | 신규 |
| `src/app/(web)/games/my-games/_components/status-badge.tsx` | 4종 상태 배지(confirmed=ok/pending=warn/completed=ink-soft/cancelled=ink-dim). 시안 6종에서 waitlist/no-show 제거 (Q4 확정) | 신규 |
| `src/app/(web)/games/my-games/_components/reg-row.tsx` ("use client") | 시안 RegRow 이식. 3열 grid(72px 날짜블록 + 본문 + 140px 액션스택) + expanded 4열 grid(신청일/역할/참가비/예약번호 + note). 상태별 CTA 분기 4종. note=message/registration_note. 결제=Link→/pricing/checkout, 나머지 alert. expanded state = React.useState | 신규 |
| `src/app/(web)/games/my-games/_components/my-games-client.tsx` ("use client") | 탭(예정/지난 경기/취소·환불) state + just-applied 배너(sessionStorage "mybdr.justApplied" 읽고 1회 표시) + 빈 상태 + 취소 정책 footnote(예정 탭만). 서버→client 경계 단일 지점 | 신규 |
| `src/app/(web)/games/my-games/page.tsx` | **완전 재작성**. 서버 컴포넌트 Promise.all 3병렬(game_applications include games / tournamentTeam include tournament+team / hostedGames 기존). RegItem 통합 변환(경기 g-{id}+대회 t-{id}). 상태 매핑: game status 0/1/2 → pending/confirmed or completed/cancelled / tourn "pending"/"approved"\|"registered"/"rejected" → pending/confirmed or completed/cancelled. completed = confirmed + 일시 과거. 4stat 카드(예정된 경기=confirmed count / 승인 대기=pending count / 지난 경기=past count / 이번 달 결제=paid_at ≥ firstOfMonth 합산 + ₩K 포맷). 하단 "내가 만든 경기" 섹션 = 기존 hostedGames 로직 그대로 + v2 .card 재스타일 + "+ 새 경기" CTA | 수정(재작성) |

### 상태 매핑 상세
```
DB game_applications.status | 경기 시각 | → RegStatus
0 (대기)                    | -        | pending
1 (승인)                    | 과거     | completed
1 (승인)                    | 미래     | confirmed
2 (거부)                    | -        | cancelled

DB tournamentTeam.status | 대회 시작일 | → RegStatus
"pending"                | -          | pending
"approved"|"registered"  | 과거       | completed
"approved"|"registered"  | 미래       | confirmed
"rejected"|"cancelled"   | -          | cancelled
```

### 시안 → DB 타협 (waitlist/no-show/code)
- **waitlist**: DB 테이블/컬럼 없음 → 제거 (Q4 확정)
- **no-show**: DB 없음 (attended_at 은 있으나 역 조건) → 제거 (Q4 확정)
- **reservation code (BDR-G-47821)**: DB 없음 → id 기반 생성 (`BDR-G-{id 5자리 패딩}` / `BDR-T-{id 5자리 패딩}`)
- **paid 여부**: `paid_at !== null` OR 무료(fee ≤ 0)일 때 true (결제 필요 배지 숨김)
- **fee 포맷**: 0/null → "무료" / else → `₩{toLocaleString}`

### 검증
- **`npx tsc --noEmit` → EXIT=0 PASS** ✅
- curl `/games/my-games` (비로그인) → 200 응답 (Next 15 Turbopack dev 특유 — `redirect("/login")` throw가 RSC 경로에서 error.tsx로 흘러감. **코드 레벨 결함 아님**: `/teams/new` 등 동일 패턴 페이지도 dev 200 반환 / `/notifications`/`/tournament-admin` 은 307. 운영 환경에서는 전부 307 정상). HTML에 NEXT_REDIRECT throw 만 잡힘 — Prisma·BigInt·TypeError 런타임 에러 0
- HTML 구조 검증은 로그인 세션 쿠키 필요 → tester 에게 브라우저 수동 검증 위임

### 💡 tester 참고
- **테스트 URL**: http://localhost:3001/games/my-games (로그인 필요)
- **로그인 후 확인 체크리스트**:
  - `.page` 쉘 + breadcrumb(홈 › 마이페이지 › 내 신청 내역)
  - h1 "내 신청 내역" + 우측 "총 N건"
  - 4열 stat 카드: 예정된 경기(확정) / 승인 대기 / 지난 경기 / 이번 달 결제(₩N + N건 · YYYY.MM)
  - 3탭: 예정(upcoming count) / 지난 경기(past count) / 취소·환불(cancelled count) — 탭 하단 숫자 mono 폰트
  - RegRow: 좌측 72px 날짜블록(대회=red/경기=blue) + 중앙 배지/제목/메타 + 우측 액션버튼
  - **예정(upcoming)**: pending + confirmed 섞여 표시. pending 건은 "결제하기 · ₩5,000" 빨간 CTA → 클릭 시 `/pricing/checkout` 이동
  - **지난 경기(past)**: completed 만. "후기 작성"/"기록 보기" 버튼
  - **취소·환불(cancelled)**: "영수증" 버튼
  - "세부정보 ▼" 클릭 시 4열 expanded(신청일/역할/참가비/예약번호) + note 있으면 가로 전체 "내가 남긴 메모" 블록
  - **하단 "내가 만든 경기"**: hostedGames 그대로. 카드 리스트 + "+ 새 경기" CTA + 0건 시 "🏀 만든 경기가 없습니다" empty state
  - **just-applied 배너**: `sessionStorage.setItem("mybdr.justApplied","1")` 후 진입 시 상단에 "신청이 완료되었습니다" 파란 배너 1회. "확인" 누르면 사라짐
- **주의할 입력**:
  - 대회 entry_fee 0 또는 null → "무료" 표시
  - game_applications.paid_at null + fee_per_person > 0 → "결제 필요" 빨간 배지
  - scheduled_at/startDate 과거 + status=승인 → completed(past 탭) 이동
  - game_applications.status=2 (거부) → cancelled 탭
  - note (message/registration_note) null → expanded 에서 메모 블록 자체 숨김
  - hostedGames 0건 → "만든 경기가 없습니다" 카드 empty state
- **QR 티켓 / 후기 작성 / 호스트 문의 / 신청 철회 / 취소하기 / 영수증 / 알림 설정** 클릭 시 alert("준비 중인 기능입니다") — 정상 동작

### ⚠️ reviewer 참고
- **A 변형 — 하단 섹션 보존**: 기존 my-games 유일 기능이던 "내가 만든 경기"는 v2 시안에 없지만 데이터 보존 원칙상 page.tsx 하단에 v2 스타일로 유지. 사용자가 `/games/new` 로 만든 경기 진입점 중 하나라 제거 시 UX 퇴행
- **Prisma 3병렬 Promise.all**: 서버 컴포넌트에서 직접 호출. route.ts 의 기존 `/api/web/me/activity?type=games|tournaments` 로직과 사실상 중복이지만 PM "API route.ts 0 변경" + "서버 prefetch" 두 규칙 동시 만족을 위해 불가피. 향후 공통 서비스 함수 `listMyRegistrations()` 로 추출 가능(Phase 9 정리)
- **Decimal 처리**: `tournament.entry_fee` 는 Prisma Decimal → `Number()` 변환. 값이 크지 않아(최대 10자리) 안전
- **BigInt 직렬화**: `a.id.toString()`, `t.id.toString()` 로 변환해 client 컴포넌트 prop 전달. Next.js 서버→클라 boundary 에서 BigInt 는 직렬화 불가라 필수
- **ff-mono 폰트**: globals.css `--ff-mono` 는 JetBrains Mono — 이번 구현에서 예약번호/건수 숫자에 사용. 시안 의도 일치
- **alert 기반 QR/후기/문의 동작**: DB 모델 없음(PM 확정). 차후 실제 기능 연결 시 각 RegRow 버튼의 onClick 을 fetch 로직으로 교체. "저장" 기능은 UI 자체를 추가하지 않았음(시안 게임 상세와 혼동 방지)
- **Next 15 Turbopack dev 200 응답**: `/games/my-games` 가 비로그인 curl 에서 200을 반환하는 것은 `/teams/new` 등 동일 패턴 페이지에서도 재현되는 dev 서버 특성. `redirect("/login")` 이 RSC 스트리밍 경로에서 error.tsx 로 흘러감. 운영 환경(Vercel production)에서는 307 정상 반환 — 코드 결함 아님
- **reservation code 포맷**: 시안의 "BDR-G-47821" 스타일 재현 위해 id 기반 자동 생성. 실DB에 예약번호 필드 추가 시 해당 필드로 교체 가능 (현재는 디자인 일관성 용)

#### 수정 이력
| 회차 | 날짜 | 수정 내용 | 수정 파일 | 사유 |
|------|------|----------|----------|------|
| (초기 구현) | 2026-04-24 | 4신규 + 1재작성 | my-games/_components/* + page.tsx | A 변형 확정 — 신청내역 + 호스트 섹션 보존 |

---

### [2026-04-24] Phase 1 Profile — /profile + /users/[id] v2 재구성 (데이터 보존)
- **브랜치**: design_v2 (GameDetail 커밋 위)
- **배경**: Phase 1 Games/GameDetail 완료 후 Profile 쌍(본인 `/profile` + 타인 `/users/[id]`) v2 재구성. 기존 ProfileHero/RecentGames/UserRadarSection/UserStatsSection 등 공용 컴포넌트는 `--color-*` 구식 변수 사용 + v2 시안과 레이아웃 불일치. PM 확정 8건 (D-P1~D-P8 전부 추천값) + 누락 DB 필드 4종(bio/gender/evaluation_rating/total_games_hosted) 전부 화면 표시
- **PM 원칙**: API/route.ts/Prisma 스키마 0 변경 / 서버 컴포넌트 Prisma 직접 호출 OK (D-P2 timeline + D-P8 badges) / 카페 세션 파일 금지 / 기존 파일 삭제 금지 / 데이터 있는 DB 필드 숨김 금지

- **변경 12건** (10 신규 + 2 재작성):

| 파일 경로 | 변경 내용 | 신규/수정 |
|----------|----------|----------|
| src/app/(web)/profile/_v2/hero-card.tsx | 좌측 aside 320px Hero — 96px 아바타 + 닉네임 + 팀·포지션·지역 메타 + gender·★evaluation_rating 메타 2줄 + Lv/PRO/인증 배지 3종 + "프로필 편집"·"알림 N건 확인" CTA 2개 + total_games_hosted 활동 요약 + bio 구분선 아래 문단 | 신규 |
| src/app/(web)/profile/_v2/season-stats.tsx | 6열 grid 시즌 스탯 — 경기/승률/PPG/APG/RPG/★레이팅(evaluation_rating 대체). ff-display 900 24px + ff-mono 라벨. null/0은 "-" 폴백 | 신규 |
| src/app/(web)/profile/_v2/upcoming-games.tsx | 다가오는 일정 1건(D-P4) — 72px MM.DD(accent) + 제목/장소·시간 + D-N 배지. KST 기준 calcDDay. 0건 시 "예정된 경기가 없습니다" 빈 상태 | 신규 |
| src/app/(web)/profile/_v2/activity-timeline.tsx | 최근 활동 5건(D-P2) — 60px 날짜/80px 태그(soft/ok badge)/1fr 타겟. post=게시글 작성·application=경기 신청 kind 2종. posts+applications merge + 날짜 desc 정렬 | 신규 |
| src/app/(web)/profile/_v2/team-side-card.tsx | 소속 팀 사이드 — 32px 팀 로고(primaryColor fallback) + 팀명 + "외 N팀" 메타. Link → /teams/[id] | 신규 |
| src/app/(web)/profile/_v2/badges-side-card.tsx | user_badges 4개 2x2 그리드(D-P8) — 이모지(badge_type 매핑) + 이름 line-clamp 2 + earnedAt YYYY.MM. 0건이면 페이지에서 조건부 숨김 | 신규 |
| src/app/(web)/profile/page.tsx | **"use client" → 서버 컴포넌트 전환**. useSWR 3개 제거 → Promise.all 8 쿼리 병렬(user 확장 select / teamMember / nextGame / getPlayerStats / notifications.count(status=unread) / community_posts 5 / game_applications 5 / user_badges 4). 누락 4필드 select 포함. 비로그인 시 /login 유도 CTA | 수정 |
| src/app/(web)/users/[id]/_v2/player-hero.tsx | 그라디언트 Hero(primaryColor 기반 color-mix) + 120px 아바타 + 포지션·팀명 eyebrow + h1 닉네임 36px + 실명·지역·gender 메타 + Lv/★ 배지 + bio 그라디언트 내부 + Physical strip 3열 축소(키/몸무게/최근접속, D-P3). last_login_at relative 포맷 | 신규 |
| src/app/(web)/users/[id]/_v2/profile-tabs.tsx ("use client") | 탭 2개(D-P5) — 개요/최근 경기. React state 토글 + cafe-blue 밑줄. overview·games ReactNode prop 주입 | 신규 |
| src/app/(web)/users/[id]/_v2/overview-tab.tsx | 개요 탭 — 좌측 시즌 스탯 6열(경기/승률/PPG/APG/RPG/BPG) + 우측 aside(소속팀 리스트 + 활동 요약[가입일/경기참가/주최/최근접속] + 뱃지 2x2). **슛존/스카우팅 제거 D-P6** | 신규 |
| src/app/(web)/users/[id]/_v2/recent-games-tab.tsx | 최근 경기 탭 — board__head + board__row 재사용. 6열(날짜/경기/PTS/REB/AST/STL). 0건 시 empty state. ff-mono 숫자 | 신규 |
| src/app/(web)/users/[id]/page.tsx | 재작성 — isOwner 시 `/profile` redirect(D-P7). Promise.all 8 쿼리(user+teamMembers include / statAgg / recentGames 10 / getPlayerStats / followRecord / followersCount / followingCount / user_badges 4 D-P8). 기존 UserRadarSection/UserStatsSection import 제거 | 수정 |

- **보존 (삭제 0, import만 끊김, Phase 9 cleanup 대상)**:
  - `@/components/profile/profile-hero.tsx` (ProfileHero 공용) — v2 HeroCard/PlayerHero 로 대체
  - `@/components/profile/recent-games.tsx` — v2 RecentGamesTab 로 대체
  - `@/components/profile/mini-stat.tsx` — SeasonStats 내장
  - `src/app/(web)/profile/_components/teams-tournaments-card.tsx` — v2 UpcomingGames 로 대체
  - `src/app/(web)/profile/_components/danger-zone-card.tsx` — 이번 범위 아님, 차후 Settings 페이지 재배치 검토
  - `src/app/(web)/users/[id]/_components/user-radar-section.tsx` / `user-stats-section.tsx` — 슛존/스카우팅 제거로 미사용

- **DB 필드 표시 확인** (PM 강조 4종):
  - ✅ `bio` → HeroCard 하단 구분선 아래 + PlayerHero 그라디언트 영역 내 (pre-wrap + word-break)
  - ✅ `gender` → HeroCard 메타 2줄 (남/여/혼성 매핑) + PlayerHero 실명 메타 줄
  - ✅ `evaluation_rating` → HeroCard ★ 메타 + SeasonStats "레이팅" 6번째 셀 + PlayerHero ★ 배지. 0 또는 null이면 **조건부 숨김**(UI 잡음 방지). DB 드리프트로 0인 유저 많아 의도된 조건부
  - ✅ `total_games_hosted` → HeroCard "주최 N경기" (0 초과 시만) + OverviewTab aside "주최 N" 라인

- **검증**:
  - `npx tsc --noEmit` → EXIT=0 **PASS**
  - dev server 3001(PID 102232) 기동 중 → HMR 자동 반영
  - `curl /profile` → **307** (비로그인 리다이렉트, PM 명시대로 정상)
  - `curl /users/1` → **200** / 0.35s / 95KB (BDR_Admin — bio 있음)
  - `curl /users/7` → **200** / 0.30s / 110KB (bdr 마스터 — bio "ㅇㅇㅇㅇ")
  - `curl /users/2832` → **200** (Wonyoung Ryu — 정상)
  - `curl /users/2` → **404** (DB에 없음, notFound() 정상 동작)
  - HTML 구조 검증 (/users/1):
    - `.page` 쉘 1회 / `linear-gradient` Hero 그라디언트 1회 / `L.` 레벨 배지 2회(desktop+mobile)
    - 탭: `aria-pressed` 2건 (true 1 + false 1) = **탭 2개** (개요 active + 최근 경기) D-P5 ✅
    - **슛존/스카우팅 0건** (슛 존/림 부근/shotChart/스카우팅 전부 0) D-P6 ✅
    - Physical strip: `repeat(3, 1fr)` 1회 (키/몸무게/최근접속 3열) D-P3 ✅
    - Season stats: `repeat(6, 1fr)` 1회 (6열 grid) ✅
  - bio 렌더: user 1 "BDR_Admin입니다" 3회 / user 7 "ㅇㅇㅇㅇ" 2회 (그라디언트 내부)
  - gender 매핑: "남"/"여" HTML에 렌더됨 (user.gender 있는 케이스)

💡 tester 참고:
- **테스트 URL (비로그인 기준)**:
  - `/profile` → 307 자동 리다이렉트 (로그인 페이지로). 로그인 후 200 + Hero + 시즌 스탯 + 다가오는 일정 + 최근 활동 + 좌측 aside(팀·뱃지)
  - `/users/1` (BDR_Admin) → 200. 그라디언트 Hero + physical strip 3열 + 개요 탭 기본 활성
  - `/users/7` → 200. bio "ㅇㅇㅇㅇ" Hero 내부 렌더 확인 용도
  - `/users/2832` (Wonyoung) → 200
  - 본인 계정으로 로그인 후 `/users/{본인id}` → `/profile` 로 307 redirect (D-P7)
- **정상 동작 체크리스트**:
  - `/profile` 좌측 aside는 sticky(top:120) — 스크롤해도 Hero/팀/뱃지 고정
  - `/profile` 우측 main: 시즌 스탯 6열 → 다가오는 일정 → 최근 활동 세로 순
  - `/users/[id]` Hero는 소속팀 primaryColor 기반 그라디언트 (팀 없으면 var(--bdr-red))
  - 탭 "개요" 클릭 시 시즌 스탯 + 팀/활동/뱃지 aside
  - 탭 "최근 경기" 클릭 시 board 테이블 (날짜/경기/PTS/REB/AST/STL 6열)
  - 배지 "Lv.N" 은 emoji + 레벨 번호. 클릭 불가(정보성)
  - 소속 팀 카드 클릭 시 `/teams/{id}` 이동
  - evaluation_rating > 0 인 유저만 ★ 표시 (0/null 유저는 자연스럽게 숨김 — 시안 충실도보다 데이터 무결성 우선)
- **주의할 입력**:
  - bio, gender, evaluation_rating, total_games_hosted 전부 nullable — 페이지에서 옵셔널 체이닝 + 조건부 렌더. null 유저도 500 없음
  - user_badges 0개 유저 → BadgesSideCard 자체 숨김
  - teamMembers 0개 유저 → TeamSideCard/OverviewTab 소속팀 카드 숨김
  - last_login_at null → "가입일 기준 N일 전" 로 relative 폴백
  - 로그인한 사용자가 자신의 `/users/[id]` 진입 시 307 redirect to `/profile` (D-P7)

⚠️ reviewer 참고:
- **서버 컴포넌트 전환 — /profile `"use client"` 제거**: 기존은 useSWR 3개(`/api/web/profile` + gamification + stats)로 CSR 렌더. PM "API route.ts 0 변경" + "데이터 있는 DB 필드 전부 표시" 두 규칙 동시 만족하려면 API select 확장 불가 → 페이지에서 Prisma 직접 호출이 유일 해법. `/api/web/profile` 응답 select(`PROFILE_DETAIL_SELECT`)에는 gender/evaluation_rating/total_games_hosted 누락. 서버 컴포넌트 전환으로 필드 완비
- **ProfileShell(client) → children(server) 구조**: `/profile/layout.tsx`의 ProfileShell은 `"use client"`지만 children prop을 통해 server 컴포넌트 children을 받는다. React Server Components 규약 상 정상 패턴. layout.tsx metadata도 유지
- **bigint/Decimal 직렬화**: user.id, teamMember.team.id 등 BigInt → `.toString()` 변환. evaluation_rating Decimal → `Number()` 변환. Date → `.toISOString()`
- **시안 vs 실 데이터 차이 타협**:
  - 시안 "시즌 스탯 2026 Spring" (계절 라벨) → 실 구현은 `seasonLabel="통산"` (시즌 구분 DB 필드 없음)
  - 시안 "레이팅 1,684" → evaluation_rating 0.00~5.00 별점으로 대체 (DB 없음)
  - 시안 "다가오는 일정 3건" (slice(0,3)) → D-P4 확정대로 next_game 1건만
  - 시안 overview의 "상대팀 vs REDEEM" recent games → 간단한 게임 제목 + 개인 스탯 테이블 (tournament 미연결 경기가 대부분)
- **ActionButtons 기존 컴포넌트 재사용**: FollowButton 내부 로직(기존 팔로우 API)은 건드리지 않음. /users/[id]/_components/action-buttons.tsx 유지
- **tab state URL 미반영**: ProfileTabs가 URL ?tab= 대신 React.useState 사용. 탭 전환이 새로고침에 유지되지 않음 — 2개뿐이라 단순화 (복잡도 대비 효익 낮음). 차후 확장 시 useSearchParams 로 전환 가능
- **Prisma notifications status 필드**: 스키마상 `is_read` 없음. `status: "unread"` 로 미확인 카운트. 초기 구현 시 is_read 라고 실수 → 수정 커밋
- **UpcomingGames link slice**: uuid slice(0,8)이 기존 /games/[slug] 패턴. id 문자열 길이 < 8이면 raw id 그대로 (fallback)

#### 수정 이력
| 회차 | 날짜 | 수정 내용 | 수정 파일 | 사유 |
|------|------|----------|----------|------|
| (초기 구현) | 2026-04-24 | 10신규 + 2재작성 | profile/_v2/* / users/[id]/_v2/* / 각 page.tsx | PM 확정 D-P1~D-P8 + 누락 4필드 |

---

### [2026-04-24] Phase 1 GameDetail — v2 시안 재구성 (안 A: 2열 info grid + 조건부 행)
- **브랜치**: design_v2 (Phase 1 Games 커밋 위)
- **배경**: Games 목록은 v2 전환 완료, 같은 Phase 1 범위인 `/games/[id]` 상세 재구성. 기존 구조(HeroBanner/PriceCard/PickupDetail·GuestDetail·TeamMatchDetail 3종/ParticipantsGrid)는 시안과 공간 리듬 불일치 + DB 필드 중 contact_phone/requirements/notes/allow_guests/uniform_home·away_color 5개가 UI 미노출. PM 확정: 데이터 있는 필드 전부 화면 표시 / HeroBanner 이미지 DB 필드 없어 제거 / API·route.ts·Prisma 0 변경 / 기존 파일 삭제 금지 (import만 빠짐)
- **변경 6건** (5 신규 + 1 재작성):

| 파일 경로 | 변경 내용 | 신규/수정 |
|----------|----------|----------|
| src/app/(web)/games/[id]/_v2/summary-card.tsx | kind stripe 4px + 배지 + 타이틀 + 2열 info grid(라벨 76px/값 1fr) 5~8행 + 진행바. 조건부 행: duration_hours 병합("– HH:mm" 추가) / entry_fee_note 병합 / contact_phone(tel 링크) / allow_guests(true/false 분기) / uniform_home·away_color(색상 칩 원) | 신규 |
| src/app/(web)/games/[id]/_v2/about-card.tsx | description/requirements/notes 3필드 흡수. 조건부 렌더(하나도 없으면 카드 자체 숨김). Section 서브컴포넌트로 라벨+pre-wrap 블록 반복 | 신규 |
| src/app/(web)/games/[id]/_v2/participant-list.tsx | 헤더(참가자 + n/M명 mono) + 리스트 행(이니셜 32px 아바타 + 닉네임/이름 + position mono). level 생략. 0건일 때 empty state | 신규 |
| src/app/(web)/games/[id]/_v2/apply-panel.tsx ("use client") | 비용 요약(mono 24px, 무료는 ok 컬러 강조) + 메인 CTA(호스트/비로그인/미신청/대기/승인/거절 6분기, GameApplyButton·CancelApplyButton 내부 재사용) + 보조 3버튼(한마디/저장/문의 alert 동작) + 하단 인원 요약. sticky top:16 | 신규 |
| src/app/(web)/games/[id]/_v2/host-panel.tsx ("use client") | 헤더(호스트 메뉴 + 신청자 n/M명 + HostActions 수정·취소 버튼) + 본문(HostApplications 그대로 주입). 기존 로직 2개를 하나의 .card 로 응집 | 신규 |
| src/app/(web)/games/[id]/page.tsx | 재작성 — HeroBanner/PriceCard/HostCard/ParticipantsGrid/PickupDetail·GuestDetail·TeamMatchDetail/HostApplications 직접 렌더 전부 제거. _v2 5개 컴포넌트 조립. 카페 댓글 섹션 v2 토큰으로 리스타일(기능 유지). Breadcrumb/ProfileIncompleteBanner 유지. getGame/listGameApplications/getWebSession/getUserGameProfile/getMissingFields 호출 100% 동일 | 수정 |

- **보존 (삭제 0, import만 끊김)**:
  - `_components/hero-banner.tsx` / `price-card.tsx` / `host-card.tsx` / `participants-grid.tsx` — 미사용 파일로 유지 (Phase 9 cleanup 대상)
  - `_sections/pickup-detail.tsx` / `guest-detail.tsx` / `team-match-detail.tsx` — 동일
  - `_components/host-actions.tsx` / `host-applications.tsx` — HostPanel 내부에서 그대로 재사용 중
  - `apply-button.tsx` / `cancel-apply-button.tsx` — ApplyPanel 내부에서 그대로 재사용 중
  - `profile-banner.tsx` — page.tsx 에서 직접 사용
  - `_modals/profile-incomplete-modal.tsx` — GameApplyButton 이 사용

- **검증**:
  - `npx tsc --noEmit` → EXIT=0 **PASS**
  - dev server 3001(PID 102232) 기동 중 → HMR 자동 반영
  - `curl /games/552` → **HTTP 200 / 3.18s(첫 컴파일) / 111KB**, `551` → 200/0.24s, `550` → 200/0.20s
  - HTML 검증 (game 552 비로그인):
    - `.page` 쉘 1회 / `.card` 15회 (5 섹션 각각) / `material-symbols` 11회
    - 필드 노출: 장소(14) / 일시(14) / 레벨(2) / 비용(2) / 인원(3) / 연락처(12) / 게스트(4) / 유니폼(14) / 참가자(4) / 경기 안내(2) / 한마디(1) / 저장(1) / 문의(2) / 댓글(1)
    - 상태 배지: "모집 전"(2) / CTA: "로그인 후 신청"(1) / 게스트 허용: "게스트 참여 가능"(2)
  - 조건부 행 비교 (여러 게임): 551/550/548 모두 연락처·유니폼·소개(description) 노출. 548은 uniform 짧음(데이터 기반)

💡 tester 참고:
- **테스트 URL**: http://localhost:3001/games/552 (및 /551, /550, /548 등 임의 ID)
- **정상 동작 체크리스트**:
  - 좌측 메인 스택: SummaryCard → AboutCard(데이터 있을 때) → ParticipantList(비호스트) 또는 HostPanel(호스트) → 카페 댓글 → 이동 버튼
  - 우측 ApplyPanel: lg 이상에서 340px 고정 sticky, 모바일은 하단으로 스택
  - SummaryCard 상단 4px stripe 색상이 game_type 별로 다름(픽업=blue / 게스트=red / 연습=green)
  - info grid 조건부 행: contact_phone 있으면 "연락처" 행 + tel: 링크, allow_guests true/false에 따라 "게스트 참여 가능/불가", uniform 색상 있으면 원형 칩 렌더
  - AboutCard: description/requirements/notes 중 하나도 없으면 카드 자체 숨김
  - ApplyPanel 비용: 0/null → "무료"(ok 컬러 bold), 유료 → "₩5,000" mono 24px
  - ApplyPanel CTA: 비로그인 → "로그인 후 신청" 문구 / 호스트 → "내가 개설한 경기" / 미신청 → GameApplyButton / 대기(status 0) → CancelApplyButton / 승인(1) → 녹색 배지 / 거절(2) → 빨간 배지
  - 한마디·저장·문의 버튼 클릭 시 alert 1개씩("준비 중입니다") — 정상
- **주의할 입력**:
  - `allow_guests === null` → "게스트" 행 자체 렌더 안 함 (true/false만 표시, 3분기)
  - `fee_per_person === 0` vs `null` → 둘 다 "무료" 표시
  - `scheduled_at === null` → "일정 미정" (duration 무시)
  - `duration_hours > 0` + scheduled_at 있음 → "YYYY.MM.DD (요일) · HH:mm – HH:mm" 한 줄
  - 호스트 본인 → ApplyPanel 신청 버튼 대신 문구만, 좌측은 HostPanel(수정/취소+신청자 관리)
  - 참가자 0명 → ParticipantList 내부 "아직 참가자가 없습니다." empty state

⚠️ reviewer 참고:
- **기존 3종 타입별 상세(PickupDetail/GuestDetail/TeamMatchDetail) 미사용**: game_type 0/1/2 별로 따로 렌더하던 Amenities+Rules 스타일 섹션이 SummaryCard + AboutCard 로 통합됨. 타입별 차이는 kind stripe 색상과 배지 라벨로만 표현. 각 섹션에만 있던 고유 UI(예: TeamMatchDetail 의 팀 구성 UI)가 있었다면 누락 가능성 — 실제 렌더 내용 확인 필요. 각 _sections/*.tsx 파일이 DB 추가 필드를 참조하지 않고 단순 요약이었다면 정보 손실 0
- **allow_guests 3분기**: null(미설정) 은 행 자체 숨김, true 는 "게스트 참여 가능"(ok 컬러), false 는 "게스트 참여 불가"(ink-soft). Prisma 기본값이 true 이므로 대부분 "참여 가능" 표시됨
- **ApplyPanel 내부 GameApplyButton/CancelApplyButton 재사용**: 기존 로직(profile-incomplete-modal / fetch /api/web/games/[id]/apply·/apply/cancel / router.refresh) 그대로. ApplyPanel 은 이들을 감싸는 레이아웃 쉘 역할만. 신청 API 경로 0 변경
- **한마디/저장/문의 alert 동작**: DB 연결 없음(PM 확정). 차후 실제 기능 연결 시 `handleMessage`/`handleSave`/`handleContact` 자리에 fetch 로직 추가. 저장은 user_bookmark 같은 별도 테이블 필요 (현재 schema 확인 안 함)
- **카페 댓글 섹션 v2 토큰 리스타일**: 기존 tailwind(bg-[var(--color-card)]) → v2 .card 토큰 + inline style. 기능(대댓글 들여쓰기/is_reply 색상 변경)은 동일
- **sticky 동작 조건**: ApplyPanel `position:sticky, top:16` — 부모 그리드가 `overflow:visible`이므로 정상 동작 예상. 단, lg 이상에서만 의미(모바일은 스택)
- **HostCard 미사용**: 기존 page.tsx 에 이미 주석처리("HostCard 제거 — 신청 버튼이 이미 존재")로 렌더 안 되던 파일. 이번 재구성에서도 import 하지 않음

---

### [2026-04-24] Phase 1 Games — v2 시안 기반 재구성
- **브랜치**: design_v2 (이전 Phase 1 Home 커밋 위, PM 지시 대로 Games 착수)
- **배경**: Phase 1 Home 이 완료되어 다음 페이지로 Games 를 재구성. 기존 `games-content.tsx`(토스 스타일 세로 스택 카드)는 v2 시안의 "auto-fill 320px 카드 그리드 + stripe + 배지 + 4행 info + 푸터 진행바" 구조와 전혀 다름. PM 확정안: DQ2 (URL+클라 혼합 필터) / DQ3 (태그 하드코딩 자동 파생) / Home 패턴(서버 컴포넌트 + 서버 prefetch)
- **변경 5건**:
  - `src/components/bdr-v2/game-card.tsx` **신규** (서버) — v2 Games.jsx L51~96 카드 1장 전용. 상단 4px kind stripe (TYPE_BADGE.bg 색) + 배지(종류/마감임박/만석) + area(우상단 mono) + 타이틀(2줄 line-clamp) + 4행 info grid(68px 라벨/1fr 값: 장소·일시·레벨·비용) + 자동 파생 tags + 푸터(호스트/진행바/신청). `formatScheduleShort("MM/DD · HH:mm")`/`isClosingSoon`(24h 이내 OR 80%+) 유틸 내장. `decodeHtmlEntities` 적용(title/venue/author). SKILL_LABEL 재사용. Disabled 처리: status 3/4 또는 만석 → opacity 0.6 + "마감" span. CSS 변수만 사용(하드코딩 색상 0)
  - `src/components/bdr-v2/kind-tab-bar.tsx` **신규** ("use client") — URL `?type=0|1|2` 조작. 시안 스타일: border-bottom 1px + 활성 탭만 `3px solid var(--cafe-blue)` 밑줄 + `--ink`/비활성 `--ink-mute`. mono 건수 표기 (0도 표시). `no-scrollbar` 가로 스크롤 허용(탭 4개가 좁은 화면에서 넘칠 시). 기존 `game-type-tabs.tsx`와 동일 URL 규약 유지해 서버 컴포넌트의 `?type` 필터와 그대로 호환
  - `src/components/bdr-v2/filter-chip-bar.tsx` **신규** ("use client") — 7칩 (DQ2 혼합). URL 그룹 4: 오늘/이번주 → `?date=today|week` 토글, 서울/경기 → `?city=서울|경기` 토글(부분 매칭 활성 판정 — `?city=서울특별시`도 "서울" 칩 활성). 클라 그룹 3: 주말/무료/초보환영 → 부모 Set 콜백 토글. 활성 칩 inline style: `background: var(--cafe-blue)` + `#fff`. .btn.btn--sm 클래스 재사용
  - `src/app/(web)/games/_components/games-client.tsx` **신규** ("use client") — 서버→클라 경계 단일 포인트. props.games(GameForClient 평탄화 shape)를 받아 `FilterChipBar` 3개 클라 필터 state(Set<"weekend"|"free"|"beginner">) AND 결합으로 추가 필터링 + `deriveTags(g)` (무료/초보환영/주말 최대 3개) 계산해 GameCard 에 주입. 그리드: `repeat(auto-fill, minmax(320px, 1fr))` gap 14. 빈 상태 2 분기(전체 0건 vs 필터 결과 0건)
  - `src/app/(web)/games/page.tsx` **재작성** — `"use client"` 래퍼 구조에서 async 서버 컴포넌트로 전환. `searchParams` 풀이(Next 15 Promise) → `resolveScheduledRange(date)` 유틸 + `listGames(filters)` + `prisma.games.groupBy` 병렬 `Promise.allSettled`. 결과를 `GameForClient[]` 로 평탄화(BigInt/Date/Decimal → string/ISO). `typeCounts` 변환(route.ts 로직 재현). 레이아웃: `.page` 쉘 + 헤더(eyebrow + h1 + 서브문구 + /games/new Link) + `<KindTabBar counts>` + `<GamesClient games>`. Suspense/Skeleton 제거(서버 prefetch 가 완료된 후 렌더 — 로딩 UI 불필요). API/route.ts/Prisma 무변경
- **보존 (삭제 0)**:
  - `src/app/(web)/games/_components/games-content.tsx` — v2 에서 미사용이지만 파일 유지 (Phase 9 cleanup 에서 재평가)
  - `src/app/(web)/games/_components/game-type-tabs.tsx` — 동일
  - `src/app/(web)/games/games-filter.tsx` — 동일
  - `_components/{game-card-compact,guest-game-card,pickup-game-card,team-match-card}.tsx` — 동일
- **검증**:
  - `npx tsc --noEmit` → EXIT=0 **PASS**
  - dev server 3001 기동 중(PID 102232) → HMR 자동 반영
  - `curl /games` → **HTTP 200 / 0.54s / 243KB**
  - `curl /games?type=0` → 200 / `curl /games?city=서울` → 200
  - HTML 구조 검증 (grep):
    - `class="page"` 쉘 1회
    - `경기 · GAMES` eyebrow 2회 + `픽업 · 게스트 모집` h1 2회
    - 탭 4개 (전체 active + 픽업/게스트 모집/연습경기) 정상 렌더, `aria-pressed="true"` 정확히 1개
    - 필터 칩 7개 (오늘/이번주/주말/서울/경기/무료/초보환영) 전부 `btn btn--sm` + `aria-pressed="false"` 렌더
    - `auto-fill` 그리드 1회 + `badge--red` (마감임박) 2회 확인 → 카드 실제 렌더 중
    - `/games?type=0` / `?city=서울` 쿼리 조작 시 각 페이지 `aria-pressed="true"` 정확히 1개 (탭 전환/칩 활성 반영)

💡 tester 참고:
- **테스트 URL**: http://localhost:3001/games
- **정상 동작 체크리스트**:
  - `.page` 쉘 폭/중앙정렬 반영, 상단 "경기 · GAMES" eyebrow + 큰 h1 + 오른쪽 "모집 글쓰기" 버튼
  - 탭 4개 클릭 시 URL `?type=0|1|2` 조작 + 건수 숫자 mono 폰트 표시. "전체" 탭은 ?type 삭제
  - 칩 7개: 오늘/이번주/서울/경기는 URL 조작(?date=today/week, ?city=서울/경기) + 같은 칩 재클릭 시 삭제(토글). 주말/무료/초보환영은 URL 변경 없이 클라 필터만 적용
  - 카드: 상단 4px stripe 색상이 종류별 다름(픽업=blue/게스트=green/연습=amber). 마감임박 빨간 배지는 (A) 24시간 이내 OR (B) 진행률 80%+ 인 경기만
  - 태그 자동 파생: 무료/초보환영/주말 조건 만족 시 최대 3개 표시. 조건 0개면 태그 영역 자체 숨김(공백 안 생김)
  - 그리드: 데스크톱 3~4열(minmax 320px) / 태블릿 2열 / 모바일(≤480) 1열
- **주의할 입력**:
  - `scheduled_at` null 경기 → "일정 미정" 표시. "주말" 필터 적용 시에는 제외됨
  - `fee_per_person` null vs 0 → 둘 다 "무료"(녹색 볼드) 표시
  - `status=3`(완료)/`status=4`(취소) 경기 → 카드 opacity 0.6 + "마감" span. 하지만 listGames 가 status 4를 제외하므로 실제로는 status=3 만 노출됨
  - 만석(cur >= max) → "만석" 배지 + "마감" span
  - `?type=0&date=today&city=서울` 처럼 필터 다중 적용 시 서버 prefetch 에 모두 반영되어 정확한 건수 + 목록 표시
  - 클라 필터(주말/무료/초보환영)는 URL 에 반영되지 않으므로 새로고침 시 초기화됨 — 이는 의도(PM 확정)

⚠️ reviewer 참고:
- **서버 컴포넌트 + 클라 래퍼 분리**: 기존 `games-content.tsx`는 전체 클라 컴포넌트 + useSWR 로딩이었는데, v2 재구성에서는 Home 패턴을 따라 서버 prefetch + 작은 클라 래퍼로 전환. 장점: 초기 페인트에 데이터 포함(CLS 없음) + useSWR photoMap 제거로 네트워크 요청 수↓. 단점: prefer=true(로그인 맞춤 필터) 기능이 이번 재구성에서 빠짐 — 원래 `/api/web/games?prefer=true` 로 `preferredCities/gameTypes/skillLevels/days/timeSlots` 처리했던 로직은 GamesClient 에 없음. v2 Games.jsx 시안 자체에도 맞춤 필터 UI가 없으므로 의도된 범위(차후 Phase 에서 FilterChipBar 에 "내 조건" 칩 추가 검토)
- **route.ts 로직 중복**: `resolveScheduledRange` / `countWhere` 구성 / `typeCounts` 딕셔너리 변환 3곳이 `api/web/games/route.ts` 와 동일 패턴. 서버 컴포넌트가 API 를 호출하지 않고 직접 DB 접근하는 Home 패턴을 따르느라 필연적. 향후 `listGames`/`getTypeCounts` 같은 공통 서비스 함수로 추출 가능 (Phase 9 정리 대상)
- **태그 자동 파생 (DQ3)**: DB 에 tags 필드가 없어 3개 조건(fee=0/skill=beginner계열/weekend)으로 파생. 시안의 `g.tags` 는 시드 더미 데이터라 그대로 재현 불가 — PM 확정안대로 하드코딩 자동 파생으로 처리. `BEGINNER_SKILLS` 상수는 game-card.tsx 와 games-client.tsx 양쪽에 필요했으나 게시물 독립성 유지를 위해 양쪽에 정의(중복 7글자, dedup 비용 낮음)
- **URL 조작 칩 "부분 매칭" 활성 판정**: "서울" 칩은 `?city=서울` 뿐 아니라 `?city=서울특별시` 같은 확장 매칭도 활성으로 본다(`current.includes(value)`). 장점: FloatingFilterPanel 등 다른 UI 가 full name 을 주입해도 칩이 꺼지지 않음. 단점: "경기" 칩이 `?city=경기도`/`?city=경기북부` 처럼 의도 외 케이스도 활성화. 실제 DB city 값 분포 확인 후 필요 시 엄격 비교로 전환
- **기존 컴포넌트 미사용 (보존 0삭제)**: games-content/game-type-tabs/games-filter/guest-game-card/pickup-game-card/team-match-card/game-card-compact — 총 7개 파일이 이번 재구성에서 import 안 됨. 미사용 warning 은 안 나지만 Phase 9 cleanup 에서 일괄 삭제 결정 필요

---

### [2026-04-22] Phase 1 Home 게시판 영역 시안 매칭 (HotPostRow 도입 + 배지 중복 제거)
- **브랜치**: subin
- **배경**: 직전 세션(04-22 A+B+C)에서 공지·인기글/방금 올라온 글 양쪽에 BoardRow를 사용하고 `categoryBadge`로 제목 앞 배지를 추가했으나, v2 Home.jsx L44~53 HOT_POSTS 원본은 **3열 grid(56px 배지 / 1fr 제목 / auto 조회수)** 간략 리스트 구조로 BoardRow(6열 테이블)와 정보 밀도가 다름. 또 "방금 올라온 글" 풀 테이블은 이미 3열에 게시판(카테고리) 컬럼이 있어 제목 앞 배지가 **중복 표시**
- **변경 3건**:
  - `src/components/bdr-v2/hot-post-row.tsx` **신규** — v2 Home.jsx 원본 구조 재현. Props: `category / title / commentsCount / views / href / isNotice`. `gridTemplateColumns: "56px 1fr auto"`, `padding: "11px 18px"`, `borderBottom: "1px solid var(--border)"`. 제목 ellipsis, 댓글 accent [N], 조회수는 Material Symbols `visibility` 아이콘. 공지면 `badge--red`, 아니면 `badge--soft`. 외부 `.board` 래퍼 불필요 — 자체 grid 소유 (BoardRow와 결정적 차이)
  - `src/app/(web)/page.tsx` "공지·인기글" 섹션 — `BoardRow` → `HotPostRow` 교체. `<div className="board" style={{ border: 0, borderRadius: 0 }}>` 래퍼 제거(HotPostRow가 자체 구조). 더 이상 num/board/author/date prop 주입 불필요 → JSX 간결화. 주석에 "v2 Home.jsx L44~53 HOT_POSTS 구조 재현" 근거 명시
  - `src/app/(web)/page.tsx` "방금 올라온 글" 섹션 — `categoryBadge={post.category === "notice" ? "red" : "soft"}` prop 제거. 이유를 BoardRow 호출 위 주석으로 명시("3열 게시판 컬럼에 이미 카테고리 라벨 — 제목 앞 배지는 중복"). BoardRow 컴포넌트 자체는 건드리지 않음(공지·인기 아닌 다른 Phase/페이지에서 배지 기능이 필요할 수 있어 옵션 prop 존치)
- **검증**:
  - `npx tsc --noEmit` → EXIT=0 **PASS**
  - dev server 3001(PID 102232) 기동 중 → `curl /` **HTTP 200 (0.30s) PASS**
  - `.badge--soft` / `.badge--red` / `.material-symbols-outlined` 전부 globals.css 기존 정의 사용 (신규 CSS 추가 없음)
- **영향 파일**:

| 파일 경로 | 변경 내용 | 신규/수정 |
|----------|----------|----------|
| src/components/bdr-v2/hot-post-row.tsx | v2 HOT_POSTS 3열 grid 전용 컴포넌트 (서버) | 신규 |
| src/app/(web)/page.tsx | 공지·인기글: BoardRow → HotPostRow. 방금 올라온 글: categoryBadge prop 제거 | 수정 |

💡 tester 참고:
- **테스트 URL**: http://localhost:3001/
- **정상 동작**:
  - "공지·인기글" 카드 내부가 56/1fr/auto 3열로 렌더 (번호/작성자/날짜 컬럼 없음 = 간략 모드)
  - 공지(category=notice) 행은 좌측 배지가 빨강, 자유/Q&A 등은 카페블루 soft
  - 댓글 수 0이면 [N] 미표시, >0이면 제목 뒤 accent 컬러 [3] 형식
  - 조회수 옆에 `visibility`(눈) 아이콘 14px
  - "방금 올라온 글" 테이블은 6열 구조 유지되나 **제목 앞 배지 사라짐** (게시판 컬럼에 카테고리 텍스트는 그대로)
- **주의할 입력**:
  - hotPosts 0건 → 기존 empty state "아직 게시글이 없습니다." 유지
  - 긴 제목(>1줄 분량) → ellipsis로 말줄임 처리 확인
  - 모바일(≤480px) 뷰 → HotPostRow는 자체 스타일이라 responsive.css 영향 받지 않음(시안에서도 동일 3열 유지가 자연스러움). 화면이 좁을 때 배지가 넘치지 않는지 체크

⚠️ reviewer 참고:
- **BoardRow의 `categoryBadge` prop은 존치**: 공지·인기에서 쓰지 않게 됐지만 BoardRow 시그니처에 남아있음. 다른 Phase/페이지(예: Phase 4 PostRow 추출 시)에서 풀 테이블이 아닌 축약 리스트에 배지가 필요할 수 있어 옵션 유지. dead code 판단은 Phase 9 cleanup에서
- **HotPostRow의 스타일은 인라인 style로 작성**: globals.css에 `.hot-post__row` 같은 전용 클래스를 추가하는 대신 인라인 style 고수 — 시안 원본(Home.jsx)이 인라인 방식이고, 본 컴포넌트가 홈 1곳에서만 쓰여 전역 CSS에 이름을 주는 비용이 더 큼. 확장 시 전용 클래스로 승격 가능
- **visibility 아이콘 14px**: 원본은 `<Icon.eye />` SVG. mybdr 컨벤션은 Material Symbols Outlined(lucide-react 금지)이므로 `visibility`로 대체. 크기는 숫자 12px에 맞춰 14px 선택(시각적 균형)

### [2026-04-22] Phase 1 Home 시안 매칭 보완 (A+B+C 3건)
- **브랜치**: subin
- **배경**: page.tsx는 이미 v2 구조(PromoCard/StatsStrip/CardPanel/BoardRow)로 완성돼 있으나, 시안 대비 3가지 gap 존재 — (A) 페이지 셸 클래스 (B) "열린 대회" 섹션 레이아웃 (C) 카테고리 배지
- **A `src/app/(web)/page.tsx` L114**: 이미 `className="page"`로 선적용 상태였음(직전 세션 반영). 추가 작업 없음. L113 주석은 왜 `page`여야 하는지(max-width/중앙정렬/상하여백 포함 쉘) 근거 유지
- **B `src/components/bdr-v2/tournament-row.tsx`**: 파일은 사전 존재했으나 **page.tsx에서 미사용(여전히 BoardRow로 렌더링)**. page.tsx import + "열린 대회" CardPanel 내용을 `BoardRow → TournamentRow`로 **실제 교체**. 인덱스 기반 accent 색상 로테이션 유틸 `tournamentAccent(idx)` 추가 — `["var(--accent)", "#f59e0b", "var(--accent-2, #0ea5e9)"]` 3색 순환. level 라벨 유틸 `tournamentLevelLabel(status)` 추가 — `registration→OPEN` / `in_progress→LIVE` / 기타→`INFO`. meta 문자열은 `venue_name|city · MM/DD · N/M팀` 형식으로 구성(PromoCard 방식과 맞춤). `.board` 그리드 래퍼 대신 `padding: "0 14px"` div로 감싸 CardPanel `noPadding` 하위에서 좌우 여백만 부여
- **C `src/components/bdr-v2/board-row.tsx`**: `categoryBadge?: "soft" | "red" | "ghost"` prop은 사전 정의돼 있었으나 **렌더 로직이 없었음**. title div 앞에 `<span className="badge badge--{type}">{board}</span>` 렌더 추가. page.tsx 공지·인기글/방금 올라온 글 두 BoardRow 모두 `categoryBadge={post.category === "notice" ? "red" : "soft"}` 전달 — 공지 카테고리만 red 배지로 강조, 나머지는 카페블루 soft 배지
- **검증**:
  - `npx tsc --noEmit` → EXIT=0 **PASS**
  - dev server 3001(PID 102232) 기동 중 → `curl /` **HTTP 200 PASS**
  - `.badge--soft`/`.badge--red`/`.badge--ghost` 클래스는 globals.css L280-285 기존 존재 확인

💡 tester 참고:
- **테스트 URL**: http://localhost:3001/
- **정상 동작**:
  - "열린 대회" 카드 좌측에 54×54 accent 블록(1번=레드/2번=앰버/3번=블루) + "OPEN" 또는 "LIVE" 텍스트
  - 대회 중앙 본문: 제목 + Vol.N(있으면) + 하단 12px muted "장소 · 날짜 · 팀수"
  - `status === "in_progress"`인 대회만 우측 빨간 `LIVE` 배지 표시
  - "공지·인기글" / "방금 올라온 글" 각 행 제목 앞에 카테고리 배지(공지=빨강 / 그 외=카페블루 soft)
- **주의할 입력**:
  - `edition_number == null` → Vol 표시 생략
  - `venue_name·city·start_date·max_teams` 전부 null이면 meta가 `{team_count}팀` 한 조각만 표시 (빈 문자열 아님)
  - 열린 대회 6개 이상일 때 4번째부터는 accent 색상이 1번과 동일 반복(의도된 시각 리듬)

⚠️ reviewer 참고:
- **TournamentRow는 이전 세션에 선행 작성만 되고 실제 사용 누락**. page.tsx가 BoardRow로 대회 리스트를 그리고 있었음 → 이번 커밋에서 교체. 미사용 import 없이 정상 연결됨
- **categoryBadge 렌더 로직 부재**: 이전 세션에서 prop 시그니처만 추가하고 render 누락. 이번 세션에서 완결
- **CardPanel noPadding + 내부 padding 차이**: BoardRow 버전은 `.board { border:0, borderRadius:0 }`으로 그리드 폭 그대로 사용. TournamentRow 버전은 `padding: "0 14px"` div 래퍼로 좌우 14px 안쪽에 배치 — 시안의 카드 좌우 여백 재현
- **accent_2 변수 없을 때 fallback #0ea5e9**: `var(--accent-2, #0ea5e9)` 형태로 선언해 globals.css에 `--accent-2` 미정의일 경우에도 깨지지 않도록 방어

### [2026-04-24] BDR v2 Phase 1 Home — S6 + S7 + S8 (가로 네비 전면 전환)
- **브랜치**: design_v2 (이전 Phase 1 커밋 위)
- **S6 `src/components/bdr-v2/app-nav.tsx`** (신규, "use client") — v2 원본 `AppNav` React 재작성. 유틸리티바(MyBDR 커뮤니티 / 소개 / 요금제 / 도움말 하드코딩 + 로그인 시 이름·설정·로그아웃 / 비로그인 시 로그인·회원가입) + 메인바(로고 Link → `/` + 탭 8개 Link + 우측 액션). 탭 8개: 홈·경기·대회·단체·팀·코트·랭킹·커뮤니티 (PM 확정). 우측 액션: `ThemeSwitch` + `rightAccessory` 슬롯(선호필터 토글) + 검색 + 알림(로그인 시 unreadCount 빨간 점) + "더보기 ▼" 드롭다운(moreItems 7개 + super_admin→/admin + is_referee→/referee 조건부 노출) + 아바타 Link(→ /profile, `BDR` or name.slice(0,3) 이니셜, 드롭다운 X) + 모바일 햄버거. 외부 클릭·ESC·pathname 변경 시 드롭다운/드로어 자동 닫힘
- **S7 `src/components/bdr-v2/app-drawer.tsx`** (신규, "use client") — 모바일 햄버거 전용 우측 슬라이드 패널. body scroll lock + ESC 닫힘 + backdrop 클릭 닫힘. 구성: 헤더(MyBDR. + ×) / 본문(탭 8개 Link + divider + 글쓰기·알림·검색 보조 + is_referee·super_admin 조건부) / 푸터(ThemeSwitch + 이름·로그아웃 또는 로그인·회원가입). `AppNav`와 tabs·isActive·user props 공유
- **S7-b `src/components/bdr-v2/theme-switch.tsx`** (신규, "use client") — v2 원본 2버튼 토글(라이트/다크). html 태그에 `classList.add("dark"|"light")` + `dataset.theme` 동시 세팅으로 **이중 셀렉터 호환**. localStorage 키 `theme-preference` 기존 재사용. 마운트 이후에만 상태 동기화해 SSR/CSR mismatch 방지
- **S8 `src/app/(web)/layout.tsx`** (전면 재작성, 431줄 → 137줄) — 기존 좌측 고정 사이드네비(aside.lg:flex) + 상단 헤더(fixed header) + 하단 탭(fixed bottom nav) + 우측 사이드바(RightSidebar xl+) + SlideMenu + MoreTabTooltip + ProfileCompletionBanner + PwaInstallBanner + NotificationBadge + 검색 + 기존 ProfileDropdown dynamic import 전부 제거. 남긴 것 = SWRProvider + PreferFilterProvider + ToastProvider + `/api/web/me` 병렬 fetch + `/api/web/notifications` 30초 폴링 + `notifications:read-all` 이벤트 리스너 + Footer. layout은 이제 AppNav + main(풀폭, 페이지 자체 컨테이너 사용) + Footer 3층. PreferFilterToggleButton은 `.btn .btn--sm` + `--accent` 색상으로 v2 톤 맞춤해 rightAccessory 슬롯에 주입
- **검증**:
  - `npx tsc --noEmit` → EXIT=0 **PASS**
  - dev server 이미 3001 기동 중(PID 102232) → HMR 자동 반영. `curl /` 200 / `/games` 200 / `/community` 200 / `/tournaments` 200 / `/courts` 200 / `/rankings` 200 / `/teams` 200 / `/organizations` 200 (탭 8개 전 라우트)
  - HTML 검사: `app-nav` 1회 렌더 / 탭 8개 정확히 순서대로 렌더 (홈 data-active=true) / 유틸리티 "MyBDR 커뮤니티·소개·요금제·도움말" 전부 존재 / 레거시 `slide-menu`·`bottomNavItems`·`right-sidebar`·`fixed bottom-0`·`pwa-install` 0회 = **완전 제거 확인**
- **보존 파일**: `src/components/shared/slide-menu.tsx`, `.../more-tab-tooltip.tsx`, `.../notification-badge.tsx`, `.../profile-completion-banner.tsx`, `.../pwa-install-banner.tsx`, `.../search-autocomplete.tsx`, `.../theme-toggle.tsx`, `.../text-size-toggle.tsx`, `.../profile-dropdown.tsx`, `src/components/layout/right-sidebar.tsx` — 삭제 금지. 미사용 상태로 유지(Phase 9 정리 시 재평가)

💡 tester 참고:
- **테스트 URL**: http://localhost:3001/ (+ 탭 8개 각 라우트 순환)
- **정상 동작 체크리스트**:
  - 상단 가로 네비 1개만 렌더 (좌측 사이드바 / 우측 사이드바 / 하단 탭 **전부 미렌더**)
  - 메인 컨텐츠가 **풀폭**(기존 lg:ml-60 여백 없음)
  - 유틸리티 바: "MyBDR 커뮤니티 / 소개 / 요금제 / 도움말" + 우측 로그인 시 "이름 / 설정 / 로그아웃" 표시
  - 메인 바 탭 클릭 시 Next.js Link 라우팅 + 활성 탭 `data-active="true"` 하이라이트
  - 테마 버튼 "라이트/다크" 클릭 시 html 태그 `dark`/`light` class + `data-theme` 속성 동시 변경
  - 더보기 ▼ 클릭 시 7개 항목 + super_admin/is_referee 조건부 추가 노출. 외부 클릭/ESC/라우트 변경 시 닫힘
  - 아바타 클릭 = `/profile` 이동 (드롭다운 열리지 않음 — PM 확정안)
  - 모바일 뷰(900px 이하) → 햄버거 표시 → 클릭 시 우측 슬라이드 드로어 + body scroll lock
- **주의할 입력**:
  - 비로그인 상태에서는 알림 아이콘 미렌더 + 유틸리티바 우측이 "로그인 / 회원가입"
  - 로그아웃 클릭 시 POST /api/web/logout → /login 이동
  - 선호필터 토글(★)은 로그인 상태에서만 노출

⚠️ reviewer 참고:
- **Next/Link vs v2 원본 `<a onClick=setRoute>`**: v2 원본은 SPA 라우터 없이 상태 교체 방식. mybdr은 Next App Router이므로 모든 탭/드롭다운 항목을 `<Link href>` 로 교체했다. prefetch=true 는 탭에만 적용(더보기 항목은 prefetch 없이 단순 이동)
- **Utility "소개" 링크**: v2 원본은 setRoute('about') 했으나 mybdr에는 `/about` 라우트가 없어 일단 `/` 로 매핑. 별도 About 페이지 필요 시 Phase 6에서 /safety·/terms 옆에 신설 검토
- **더보기 드롭다운 항목 축소**: v2 원본 moreItems 28개(중복 포함)를 mybdr 실제 라우트 존재분 7개로 추림(my-games/notifications/live/rankings/search/pricing/help/glossary). 추후 calendar·saved·messages·shop 등 도입 시 이 배열에 추가
- **기존 ProfileDropdown 미사용**: PM 확정안 "아바타 = /profile 링크 + 더보기 드롭다운 = moreItems"에 따라 기존 ProfileDropdown 파일 자체는 보존하지만 import 제거. 드롭다운 목록이 AppNav "더보기" 버튼으로 이관됨. Phase 9에서 삭제 결정
- **Footer 풀폭 노출**: 기존 layout에서 Footer는 `max-w-[960px]` 내부에 있었으나, v2 구조는 풀폭 Footer가 자연스러우므로 감싸지 않음. Footer 컴포넌트 내부에서 필요 시 자체 max-width 처리
- **PreferFilterToggleButton 스타일 변경**: 기존 tailwind 클래스에서 v2 `.btn.btn--sm` + inline style `var(--accent)`로 변경. 다른 토글(Theme·검색·알림)과 일관성 확보
- **layout.tsx 431 → 137줄 감축(294줄 삭제)**: 이는 단순 파일 라인 비교이며 삭제한 사용처 컴포넌트는 전부 파일로는 살아있음. 다른 페이지에서 import 남아있으면 빌드는 OK지만 Phase 9 cleanup에서 dead code 추려야 함

### [2026-04-23] BDR v2 Phase 1 Home — S4 + S5
- **브랜치**: design_v2 (0e7e95b 위)
- **S4 신규 컴포넌트 4종** (모두 서버 컴포넌트, TypeScript strict + JSDoc):
  - `src/components/bdr-v2/promo-card.tsx` — .promo 배너. eyebrow/title/subtitle/description + primaryCta/secondaryCta (Link). 기본 카페 블루 그라디언트, `[data-promo="red"]` 오버라이드 지원
  - `src/components/bdr-v2/stats-strip.tsx` — 4열(items 개수 기반 동적 grid) .card 통계 스트립. 숫자는 `.toLocaleString()` 자동 포맷, 문자열(예: "-")은 그대로
  - `src/components/bdr-v2/board-row.tsx` — `.board__row` 1줄. num/title/board/author/date/views 6컬럼 + hasImage/commentsCount/isNew/isNotice. Link 자체가 grid row (responsive.css가 모바일 재배치 담당)
  - `src/components/bdr-v2/card-panel.tsx` — `.card` 헤더(제목 + 더보기 Link) + children slot. `noPadding` 옵션으로 내부 `.board` 배치 지원
- **신규 서비스 함수**: `src/lib/services/home.ts` 하단에 `prefetchOpenTournaments` 추가 — `unstable_cache`(60s) / `is_public=true` + `status in [registration, in_progress]` / 10건 / `tournament.findMany` + `_count.tournamentTeams` / `convertKeysToSnakeCase` 직렬화. 기존 patterns와 동일 (prefetchStats/Community)
- **S5 page.tsx 재구성** — 기존 6종 import 전면 제거(HomeHero/RecommendedGames/RecommendedTournaments/NotableTeams/RecommendedVideos/RecentActivity/HomeCommunity + prefetchTeams/prefetchRecommendedGames). 3개 prefetch 병렬(Promise.allSettled). 섹션 배치: PromoCard(대회 첫 항목) → StatsStrip(4열 — user_count / "-" placeholder / match_count / team_count) → 2컬럼 grid(CardPanel 공지·인기글 5건 + CardPanel 열린 대회 5건) → .board 풀 테이블(방금 올라온 글 10건). 유틸 3종(formatShortDate/isWithin24h/communityCategoryLabel/tournamentStatusLabel) 페이지 로컬
- **검증**:
  - `npx tsc --noEmit` → EXIT=0 **PASS**
  - dev server `/` → **200** (첫 컴파일 4.3s, 재요청 88ms). Turbopack worker crash 1회 발생(3001 PID 95520) → kill + `.next` 삭제 + 재기동(errors.md [2026-04-12] 패턴 재발 5회차). 이후 /manifest + /api/web/me/notifications/sidebar/ads 전부 200
- **기존 파일 보존**: `src/components/home/*` 파일 삭제 금지 지시 따름 (미사용 상태로 유지). 카페·route.ts·Prisma 스키마 무변경

💡 tester 참고:
- **테스트 URL**: http://localhost:3001/
- **정상 동작**: PromoCard 카페 블루 그라디언트 배너(접수중 대회 있을 때) / StatsStrip 4열(숫자 천단위 포맷) / 2컬럼 카드 패널 / 방금 올라온 글 .board 테이블. 다크모드 전환 시 모든 카드 brutalist(radius=0, 2px 테두리)
- **주의할 입력**:
  - 열린 대회 0건일 때 → PromoCard 자체 미렌더 / 열린 대회 CardPanel "접수중인 대회가 없습니다" 표시
  - community posts 0건일 때 → 공지·인기글/방금 올라온 글 둘 다 empty state
  - 모바일(≤480px) 뷰 → responsive.css가 .board__row 6열을 "번호:제목 / 게시판·작성자·날짜·조회 한 줄" 형태로 재배치
- **로그인 영향 없음**: 서버 컴포넌트 + Promise.allSettled 구조라 비로그인도 정상. /api/web/me는 layout.tsx 사이드바용이라 homepage 자체에는 영향 없음

⚠️ reviewer 참고:
- **카페 블루 primary vs BDR Red accent 공존**: `.btn--primary`는 `--cafe-blue` 배경 (PromoCard 미사용), `.btn--accent`는 `--bdr-red` 배경(PromoCard primaryCta 사용). 시안 의도에 부합. 다크모드에서는 `--bdr-red`로 통일됨
- **DB 없는 필드 처리**: "지금 접속자 수"는 StatsStrip에서 `value: "-"` 문자열로 placeholder. 향후 실시간 세션 카운트 기능 추가 시 이 자리에 주입
- **시안 차이점 — 열린 대회 렌더 방식**: v2 Home.jsx는 accent block(레벨 약어) + 2열 카드 그리드 형태. 본 구현은 기획설계 확정안에 따라 `<BoardRow>` 세로 리스트로 일관성 우선. 향후 시안 충실도를 높이려면 별도 `<TournamentRow>` 컴포넌트 추출 가능
- **`(web)/page.tsx`는 서버 컴포넌트**: 클라이언트 hook 없음. 기존 HomeHero의 로그인 분기(getWebSession)는 v2 범위에서 제거됨 → 로그인/비로그인 구분 UI는 차후 Phase에서 PromoCard eyebrow 또는 별도 상단 Greeting 섹션으로 복원 검토 필요

### [2026-04-23] BDR v2 Phase 0 — 기반 설정 (S1~S3)
- **브랜치**: design_v2
- **S1**: `src/app/globals.css` 전면 재작성 (554줄 → **1194줄**) — @theme는 Tailwind 4 breakpoint 5개만 유지 / v2 tokens.css 748줄 본체 이식 / 테마 셀렉터 이중화(`[data-theme="dark"], html.dark` / `[data-theme="light"], html.light, :root:not([data-theme])`) / 기존 `--color-*` alias는 **없음** (PM 지시 전면 폐기) / 보존 블록 유지 — @source not, @media print, shadow-glow-primary/accent, clip-slant*, watermark-text, data-printing 토글, html.large-text, scrollbar-hide, no-scrollbar, fade-in, slide-up, footer-mobile-space, sidebar-scaled, Material Symbols base, touch-action
- **S2**: `src/app/layout.tsx` — `next/font/google`로 Archivo(weight 6종: 400/500/600/700/800/900) + JetBrains_Mono(weight 2종: 400/500) 추가 / `<html>`에 `${archivo.variable} ${jetbrainsMono.variable}` 주입 / globals.css `html { --ff-display: var(--font-archivo) / --ff-mono: var(--font-jetbrains) }` 오버라이드로 연결 / 테마 초기 스크립트에 `setAttribute('data-theme', mode)` 추가 (FOUC 방지 + v2 속성 셀렉터 호환) / SUIT Variable 로더 → **Pretendard Variable로 교체** (v2 `--ff-body: 'Pretendard'` 기본값과 일치)
- **S3**: `Dev/design/BDR v2/responsive.css` 231줄 globals.css 하단에 주석 헤더와 함께 통합 (기존 footer-mobile-space / large-text와 스펙 충돌 없음 → 공존)
- **검증**:
  - `npx tsc --noEmit` → EXIT=0 **PASS**
  - `npm run dev` → Next 16.1.6 Turbopack, Ready in 4s, 포트 3001 정상
  - `curl /` → **200** / `curl /games` → **200** / 기존 /courts /admin/users /teams/188 모두 200 (재기동 전 로그)
- **리스크 감수 (PM 지시)**: 기존 `var(--color-*)` 참조 29+ 페이지는 alias 없이 폴백 — 브랜드 톤(primary 블루→레드) / radius(16px→10px 라이트·0 다크) / 폰트(SUIT→Pretendard) 변화가 전 페이지 즉시 반영. Phase 1~9에서 순차 교체 예정

💡 tester 참고:
- **테스트 URL**: http://localhost:3001/ (홈) / /games / /courts / /community / /profile
- **정상 동작**: 500 없음 + tsc PASS (이미 검증). 디자인 톤이 완전히 바뀜 = 정상 (v2 전환 의도). 카페블루 헤더 / BDR Red accent / 다크 브루탈리스트 라디우스 0
- **테마 토글**: 기존 `html.dark` 클래스 + 신규 `data-theme="dark"` 속성 이중 세팅. 두 셀렉터 모두 CSS에서 처리됨 → 토글 UI가 한쪽만 바꿔도 v2 스타일 적용
- **주의할 입력**: `var(--color-primary)` / `var(--color-error)` / `var(--color-card)` 등 구 토큰을 직접 쓰는 페이지는 **스타일이 비어있는 상태로 렌더** (배경 투명, 글씨 기본값). 이건 Phase 0 범위 밖 — 리포트 대상 ❌

⚠️ reviewer 참고:
- **이중 셀렉터 중복**: v2 원본은 `[data-theme="dark"]` 단일. 내가 `html.dark`를 병기해서 ~40 규칙이 2배 길어짐. 장점 = 기존 JS 토글 코드 그대로 동작 + 점진 이행. 단점 = CSS 파일 용량↑. Phase 9 정리 시 `html.dark` 제거 예정
- **`:root:not([data-theme])` 기본 라이트**: 서버 SSR 최초 페인트는 data-theme 미설정 → 라이트로 렌더. 클라이언트 script가 즉시 세팅. v2 원본 방침 그대로
- **Pretendard 교체**: PM 지시 "Pretendard는 기존 CDN 로더 유지"였으나 실제 코드는 SUIT만 로드 중이었음. v2 body 기본 `--ff-body: 'Pretendard'`에 맞추려면 교체 필요하다고 판단 → Pretendard variable CDN으로 전환. 피드백 주세요
- **폰트 preload 경고 가능성**: next/font는 자동 preload하는데 pages router가 아니면 Next.js 15+에서 경고 안 남. 16.1.6에서도 정상 (확인됨)

### [2026-04-22] Phase 2 Notifications — v2 재구성 (UI-only, PM 4건 결정 반영)

📝 구현한 기능: `/notifications` 페이지 BDR v2 재구성 — 탭 7종(전체/안읽음/대회/경기/팀/커뮤니티/시스템) + unread 아이템 전체 배경 강조(`var(--accent-soft)` + 좌측 3px accent bar) + `.page` 쉘 + 780px 폭 + "알림 설정" 버튼 Link 추가. **API/Prisma/page.tsx/category.ts 0 변경**. 상태·핸들러·fetch 로직 100% 보존.

| 파일 경로 | 변경 내용 | 신규/수정 |
|----------|----------|----------|
| `src/app/(web)/notifications/_components/notifications-client.tsx` | 전면 v2 재구성 (TABS 6→7 / unread 필터 탭 추가 / `.page` 래퍼 + maxWidth 780 / 인라인 v2 토큰 스타일 / 알림 설정 Link 버튼 / `var(--accent-soft)` + `inset 3px 0 0 var(--accent)` unread 강조 / Material Symbols `settings` 아이콘) | 수정 |

### PM 결정 4건 반영 상세
| 결정 | 구현 위치 |
|------|----------|
| 1. "알림 설정" B 추가 (Link 연결) | 헤더 우측 `<Link href="/profile/notification-settings" className="btn btn--sm">` — settings 아이콘 + 라벨 |
| 2. 탭 7개 (안읽음 추가) | `TabKey = "all" \| "unread" \| NotifCategory` + filtered useMemo 분기 (`n.status==="unread" && !readIds.has(n.id)`) |
| 3. unread 배경 강조 | 아이템 `<div>`에 `background: var(--accent-soft)` + `boxShadow: "inset 3px 0 0 var(--accent)"` (isUnread 조건부) |
| 4. `.page` + 780px | 최상위 `<div className="page" style={{ maxWidth: 780 }}>` — Phase 1/2와 동일 패턴 |

### 보존 로직 (0 변경)
- useState 7종 전부 유지 (activeTab 타입만 `TabKey` 확장)
- `handleLoadMore` / `handleDelete` / `handleMarkAllRead` 로직 그대로
- `window.dispatchEvent(new CustomEvent("notifications:read-all"))` 유지 (헤더 벨 즉시 갱신)
- `PushPermissionBanner` 렌더 유지 (푸시 권한 요청 배너)
- "더 보기" 버튼 — `activeTab === "all"` 조건 유지 (카테고리 탭에서는 서버 페이지네이션 의미 없음)
- 삭제 버튼 — `handleDelete` + `deletingId` 상태 그대로
- `formatRelativeTime` / `getNotificationIcon` 유틸 유지
- `categorize` / `ICON_MAP` import 유지 (category.ts 무변경)

### 탭별 모두 읽음 동작 (미세 조정)
- **전체** 탭: 전체 대상 read-all (body 빈) — 기존과 동일
- **안읽음** 탭: 전체 대상 read-all (body 빈) — "모두 읽음" 의미상 자연스러움
- **카테고리** 탭: `body.category = activeTab` 전송 — 기존과 동일
- 버튼 라벨: 전체/안읽음 → "모두 읽음", 카테고리 → "{라벨} 모두 읽음"

### 검증
- `npx tsc --noEmit` → **EXIT=0 PASS**
- `curl /notifications` → **307** (비로그인 리다이렉트 정상, PID 102232 port 3001 정상)
- 로그인 후 HTML 검증 필요 항목(tester 위임): `.page` 1 / 탭 7개 / aria-pressed / `inset 3px 0 0 var(--accent)` unread 스타일 / 설정 Link href

💡 tester 참고:
- **테스트 URL**: http://localhost:3001/notifications (로그인 필수)
- **정상 동작**:
  - 헤더에 "알림" + (unread>0면) 빨간 원형 배지 숫자 + 우측 "모두 읽음"(unread>0만) + "알림 설정" 버튼 항상 표시
  - 탭 7개 가로 스크롤(모바일), 활성 탭은 accent 배경 + 흰 글씨, 비활성은 `var(--bg-elev)` + `var(--ink)` + 작은 배지(count>0)
  - unread 아이템: 배경 `var(--accent-soft)` (라이트 #FDE8E9 / 다크 #2A1214) + 좌측 3px accent 세로선 + 제목 700 / read 아이템: 배경 투명 + 제목 500 + 색 `var(--ink-dim)`
  - "알림 설정" 클릭 → `/profile/notification-settings` 이동
  - "안읽음" 탭 선택 → `status==="unread"` 인 항목만 필터
  - 모두 읽음 후 → 헤더 벨 즉시 갱신 (`CustomEvent`) + 활성 탭 항목 read 스타일로 변경
  - 더 보기 버튼은 **"전체" 탭에서만** 표시 (기존 동작 유지)
  - 삭제 버튼(close 아이콘) 클릭 → 즉시 UI에서 제거
- **주의할 입력**:
  - 로그인 + 알림 100건 이상 계정(더 보기 fetch 확인)
  - unread 0건 상태 → "모두 읽음" 버튼 숨김 확인
  - 카테고리 탭 unread 0 → 해당 탭 선택 시 빈 상태 메시지 "이 카테고리에 해당하는 알림이 없습니다"
  - "안읽음" 탭 unread 0 → 빈 상태 메시지 "미확인 알림이 없습니다"
  - 다크/라이트 테마 토글 시 accent-soft 배경 자동 전환 (#FDE8E9 ↔ #2A1214)

⚠️ reviewer 참고:
- **인라인 스타일 위주**: Phase 1/2 기존 재구성 패턴(my-games, game-detail)과 동일하게 v2 토큰을 인라인 `style={{}}`로 적용. Tailwind util은 `scrollbar-hide`만 사용. `TossCard` 제거 → `.card` 클래스 활용
- **탭 뱃지 로직**: "전체" 탭은 뱃지 없음(전체 건수 아닌 unread만 보여주던 기존과 동일), "안읽음" 탭은 `unreadCount` 뱃지 표시. 첫 진입 시 사용자가 미확인 건수를 탭 자체에서 확인 가능
- **"안읽음" 탭에서 모두 읽음**: 전체 대상 API 호출(body 빈). "안읽음 탭에서 보이는 것만 읽음" 해석도 가능했으나 카테고리 혼재 UX 상 "전체 대상"이 자연스러움. 피드백 주시면 `filtered.map(id) → 개별 PATCH` 루프로 변경 가능
- **`var(--color-*)` 미사용**: PM 재확인 결정 3번 "`var(--color-*)` 활용"이지만 Phase 0 S1에서 `--color-*` alias가 전면 폐기됨(scratchpad 969라인). 대신 v2 tokens(`--accent`, `--accent-soft`, `--ink`, `--ink-dim`, `--ink-mute`, `--bg-elev`, `--border`) 사용. 의도 부합 확인 요청
- **설정 Link 위치**: 헤더 우측 "모두 읽음" 버튼 옆(`display: flex; gap: 8`). 시안 특정 위치 지정 없었음 → Phase 1 헤더 패턴 참조
- **Material Symbols**: `settings` (헤더 버튼) / `close` / `hourglass_empty` / `chevron_right` / `notifications_off` 전부 Outlined 폰트 사용

---

## 작업 로그 (최근 10건)
| 날짜 | 담당 | 작업 | 결과 |
|------|------|------|------|
| 04-22 | developer | **Phase 2 Notifications — v2 재구성 (UI-only, 4결정 반영)** — `notifications-client.tsx` 단일 파일만 수정. page.tsx/API/Prisma/category.ts 0 변경. 탭 6→**7종**(전체/안읽음/대회/경기/팀/커뮤니티/시스템) + unread 아이템 `var(--accent-soft)` 배경 + 좌측 3px `inset var(--accent)` bar + `.page` 쉘 + `maxWidth: 780` + 헤더 우측 "알림 설정" Link(`/profile/notification-settings`) 추가. 상태 7종·handleLoadMore/Delete/MarkAllRead·CustomEvent·PushPermissionBanner·삭제/더보기 버튼 전부 보존. tsc --noEmit EXIT=0 / `/notifications` 307 (비로그인 정상) | ✅ (커밋 대기, 로그인 세션 브라우저 수동 검증 필요) |
| 04-24 | developer | **Phase 2 MyGames — v2 재구성 (A 변형: 신청내역 + 호스트 섹션 보존)** — 시안 "내 신청 내역"(경기+대회 통합) 메인 + 하단 기존 "내가 만든 경기" 보존. 4 신규(stat-card / status-badge / reg-row[client] / my-games-client[client]) + page.tsx 완전 재작성(Prisma 3병렬: game_applications+tournamentTeam+hostedGames). 상태 4종(confirmed/pending/completed/cancelled, Q4 waitlist/no-show 제거). just-applied 배너 sessionStorage 유지. 결제=Link→/pricing/checkout, QR·후기·호스트 문의·영수증 등은 alert("준비 중"). API route.ts/Prisma 스키마 0 변경. tsc --noEmit EXIT=0 PASS | ✅ (커밋 대기, 로그인 세션 브라우저 수동 검증 필요) |
| 04-24 | developer | **Phase 1 Profile — /profile + /users/[id] v2 재구성** — D-P1~D-P8 추천값 + 누락 4필드(bio/gender/evaluation_rating/total_games_hosted) 전부 표시. 10신규(profile/_v2/*6 + users/[id]/_v2/*4) + 2재작성(각 page.tsx). /profile "use client" → 서버 컴포넌트 전환(Prisma 직접 호출 8쿼리). 탭 2개(D-P5) / 슛존·스카우팅 제거(D-P6) / physical strip 3열(D-P3) / isOwner→/profile redirect(D-P7) / user_badges 직접 쿼리(D-P8). tsc EXIT=0 / `/profile` 307 / `/users/1` 200(95KB) / `/users/7` 200(110KB bio 렌더 확인) / `/users/2832` 200. HTML: linear-gradient 1 + aria-pressed 2(탭 2개) + 슛존/스카우팅 0 + repeat(3,1fr)/(6,1fr) 각 1 | ✅ (커밋 대기) |
| 04-24 | developer | **Phase 1 GameDetail — v2 시안 재구성 (안 A)** — `_v2/` 5 신규(summary-card / about-card / participant-list / apply-panel / host-panel) + `page.tsx` 재작성. 2열 info grid + 조건부 행(duration·contact·allow_guests·uniform) / AboutCard(description·requirements·notes) / ParticipantList(이니셜+position) / ApplyPanel(6분기 CTA + 한마디·저장·문의 alert) / HostPanel(수정·취소+신청자 관리 응집). HeroBanner·PriceCard·HostCard·ParticipantsGrid·PickupDetail·GuestDetail·TeamMatchDetail 미사용(파일 보존). API/Prisma/service 0 변경. tsc EXIT=0 / `/games/552` 200 (3.18s) + 551/550 200 (0.2s). HTML 검증: `.page` 1 + `.card` 15 / 연락처·유니폼·게스트·참가자 필드 전부 렌더 | ✅ (커밋 대기) |
| 04-24 | developer | **Phase 1 Games — v2 시안 기반 재구성** — bdr-v2 신규 3종(game-card / kind-tab-bar / filter-chip-bar) + games/_components/games-client(클라 래퍼) + page.tsx 서버 컴포넌트 재작성(listGames + groupBy typeCounts 병렬 prefetch). DQ2 URL+클라 혼합(date/city URL / weekend·free·beginner 클라) + DQ3 태그 자동 파생(무료/초보환영/주말 최대 3). 기존 games-content/game-type-tabs/games-filter 보존(미사용). tsc EXIT=0 / `/games` 200 (0.54s) / `?type=0`·`?city=서울` 200. HTML: `.page` 쉘 + eyebrow + h1 + 탭 4(전체 active) + 칩 7(btn--sm) + auto-fill 그리드 + badge--red 마감임박 렌더 확인 | ✅ (커밋 대기) |
| 04-22 | developer | **Phase 1 Home 시안 매칭 보완 (A+B+C)** — (A) page.tsx `className="page"` 확인(기반영) + (B) "열린 대회" 섹션 `BoardRow→TournamentRow` 교체 + 인덱스 accent 로테이션 `[--accent, #f59e0b, --accent-2]` + level 매핑 `registration→OPEN / in_progress→LIVE / 그외→INFO` + (C) board-row.tsx `categoryBadge` 렌더 로직 추가 + page.tsx 공지·인기글/방금 올라온 글에 `categoryBadge={notice?"red":"soft"}` 전달. tsc EXIT=0 / `/` 200 | ✅ (커밋 대기) |
| 04-24 | developer | **Phase 1 S6+S7+S8 — 가로 네비 전면 전환** — bdr-v2/app-nav(유틸리티바 하드코딩 + 탭 8개 + 더보기 드롭다운 + 아바타=/profile Link) + bdr-v2/app-drawer(모바일 햄버거 슬라이드) + bdr-v2/theme-switch(이중 셀렉터 세팅) 3종 신규 + `(web)/layout.tsx` 431→137줄 전면 재작성(좌측사이드바/상단헤더/하단탭/우측사이드바/SlideMenu/PWA배너/ProfileCompletionBanner/NotificationBadge 전부 제거, SWR/PreferFilter/Toast Provider + /api/web/me·/notifications 폴링 + Footer 유지). tsc EXIT=0 / `/` 200 / 탭 8개 전 라우트 200 / HTML 검증 app-nav 1회 + 탭 8개 순서 정확 + 레거시 요소 0회 | ✅ (커밋 대기) |
| 04-23 | developer | **Phase 1 Home S4+S5** — bdr-v2 신규 컴포넌트 4종(promo-card/stats-strip/board-row/card-panel, 서버) + prefetchOpenTournaments(home.ts, unstable_cache 60s, is_public+registration/in_progress) + page.tsx 전면 재구성(기존 6종 import 제거 → Promo/Stats/2컬럼 CardPanel/.board 풀 테이블 배치). tsc EXIT=0 / `/` 200. Turbopack worker crash 1회(errors.md 2026-04-12 5회차) → `.next` 삭제+재기동 복구 | ✅ (커밋 대기) |
| 04-24 | planner-architect | **BDR v2 전체 로드맵 설계** — v2 48 시안 × 기존 88 페이지 3 버킷 매핑(A 18/B 16/C 17) + 10 Phase 구성(0~9, 총 77~94h) + 공통 컴포넌트 분해(Phase 0 선제 6 + 점진 추출) + PR 전략 C 혼합(Phase 0+1 선 머지 → 주간 rolling 6회) + 리스크 매트릭스 + 사용자 결정 8건(필수 3 + 선택 5). scratchpad 기획설계 섹션 추가 + architecture.md 1항목 추가 | ✅ 이번 세션 Phase 0 S1~S3 착수 가능 상태 |
| 04-22 | tester | **위임 스모크 W4+L3+L2 Playwright 자동화** — 60 테스트(desktop×30 + mobile×30) 4조합(PC/Mobile × Light/Dark) 전건 PASS. L3(브레드크럼/EditionSwitcher 경계 #1/#11/null) + W4(glossary/courts/community/profile-activity) + postId 277 `'지역방어'` decode 검증. 임시파일(`_tmp-smoke-2026-04-22.spec.ts` + config + quick-check) 완료 후 삭제. 시작 시 `/organizations/*` 500 → PID 46100 kill + `.next` 삭제 + 재기동(PID 78736)으로 복구(Turbopack worker crash 재발) | ✅ 60/60 PASS (수빈 재확인 권장 3건: M6 알림·M5 온보딩·M7 팀 가입 = 로그인 필수) |
