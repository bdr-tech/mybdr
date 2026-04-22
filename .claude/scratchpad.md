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

### 🥇 1순위 — W4+L3+L2 통합 스모크 (수빈 수동, ~1.5h)
- **체크리스트 문서**: `Dev/smoke-test-2026-04-22.md` (W4 7항목 / L3 3항목 / L2 4항목 / 오늘 커밋 검증)
- **조합**: PC × 모바일 × 다크 × 라이트 4조합
- **시드 상태**: ✅ 충족 (Org 1 / Series 1 bdr-series / Tournament 12 edition 혼재 / 공개 팀 14)
- **결과는 수정 요청 테이블에 기록**

### 🥈 2순위 — 원영 협의 (30분~1h)
- `Dev/ops-db-sync-plan.md` (6개 선결 조건 5/6 반영, Flutter API URL 1건 대기)
- `Dev/advancement-roadmap-2026-04-20.md` 10-2 아젠다
- 옵션 A 추천 (Supabase 두 번째 프로젝트)

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
| subin HEAD | `6a7569b` (스타일 5차 완결) + 로컬 any 정비 대기 |
| origin/subin | `6a7569b` ✅ 동기화 (7커밋 푸시 완료) |
| dev / main | `8de9be4` (PR #53 squash, PR #54 원영 승인 대기) |
| 미푸시 | **0~1건** (any 정비 대기) |
| 오늘 커밋 (04-22) | `bb488ce`+`0f41e99`+`1958b9d`+`672dc9a`+`dfa5b9a`+`42c5066`+`6a7569b` 7건 푸시 / any 대기 |
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

## 구현 기록 (developer)
### [2026-04-22] 하드코딩 색상 3파일 CSS 변수화 (2차 묶음)
- **변경 파일**: 3개 / 7건 치환
- **파일별 변경**:
  - `site-templates/classic.tsx`: 4건 (L273/L277/L394/L398 — 1위/3위 순위 → warning)
  - `home/hero-bento.tsx`: 2건 (L258 LIVE NOW → error / L274 HOT → warning)
  - `(admin)/admin/users/admin-users-table.tsx`: 1건 (L176 관리자 라벨 → warning)
- **유지 예외**: classic statusColors (시맨틱 고정) / hero-bento 오버레이 bg-black·bg-white / admin-users-table 그라디언트 위
- **tsc**: PASS

### [2026-04-22] 하드코딩 색상 3파일 CSS 변수화 (3차 묶음)
- **변경 파일**: 3개 / 7건 치환
- **파일별 변경**:
  - `tm-matches/page.tsx`: L134(text) / L248(삭제 버튼 hover color-mix) / L341(에러 박스)
  - `tm-site/page.tsx`: L253 / L355 / L631 (에러 박스 3건)
  - `tm-bracket/page.tsx`: L177 (에러 박스)
- **hover 처리**: #2 matches L248 Tailwind arbitrary `color-mix` 10%→20% (의도 유지)
- **tsc / build**: tsc PASS / `next build` PASS (Tailwind arbitrary parse 성공, 3개 라우트 정상 빌드)

### [2026-04-22] 하드코딩 색상 3파일 CSS 변수화 (4차 — tm 영역 완결)
- **변경 파일**: 3개 / 4건 치환
- **tournament-admin 영역 전체 완료** (matches/site/bracket 3차 + admins/wizard×2 4차)
- **파일별 변경**:
  - `tm/[id]/admins/page.tsx`: L94(error) / L95(success) — 시맨틱 메시지 페어
  - `tm/[id]/wizard/page.tsx`: L462 (에러 박스)
  - `tm/new/wizard/page.tsx`: L414 (에러 박스)
- **tsc**: PASS

### [2026-04-22] any 4건 명시 타입화 (SWR fallback 3 + Prisma WhereInput 1)
- **변경 파일**: 2개 / 4건
- **파일별 변경**:
  - `components/home/home-sidebar.tsx` L26/L27/L28: SWR fallback props 3건 명시 타입화 (자식 컴포넌트 TeamData/PostData 재사용)
  - `api/web/admin/associations/members/route.ts` L42: Prisma.RefereeWhereInput 적용
- **부수 변경**: `right-sidebar-logged-in.tsx` TeamData/PostData `export` 추가 (home-sidebar에서 import하여 중복 정의 방지)
- **예외 유지 13건**: kakao SDK 9(kakao-map 6 + courts 2 + heatmap 1) / Next.js HOF 3(web-session) / SW 1(sw.ts) — 근거 주석·eslint-disable 이미 존재
- **tsc**: PASS

### [2026-04-22] 하드코딩 색상 5차 — 잔존 정비 (7건) + 예외 2건 명시
- **변경 파일**: 5개 / 7건 치환
- **파일별 변경**:
  - `(referee-public)/referee/signup/page.tsx` L110 (에러 박스)
  - `(referee-public)/referee/login/page.tsx` L137 (Dev 에러 텍스트, red-400→error) / L179 (로그인 에러 박스)
  - `(web)/verify/page.tsx` L159 (개발 모드 인증 코드 박스, amber → warning)
  - `(web)/teams/[id]/manage/page.tsx` L840 (해산 버튼 solid + hover color-mix 85% black)
  - `(web)/teams/new/new-team-form.tsx` L45 (에러 박스) / L94 (영문명 유효성 에러 텍스트)
- **유지 예외 신규 2건**:
  - `live/page.tsx` L89 orange-500 스피너 — 기존 주석의 "accent 변수 추가 시 치환" TODO 존중
  - `tournament-admin/organizations/new/page.tsx` L79 dark: 페어 6건 — 디자인 시스템 단일 토큰 검증 전, 명시적 라이트/다크 분리 유지
- **실질 완결**: 7건 정비 완료. 이후 남은 하드코딩 패턴은 모두 의도 예외 또는 false positive
- **tsc**: PASS

---

## 작업 로그 (최근 10건)
| 날짜 | 담당 | 작업 | 결과 |
|------|------|------|------|
| 04-22 | developer | **any 4건 명시 타입화** — home-sidebar(SWR fallback 3건 → TeamData/PostData 재사용) + members/route.ts(Prisma.RefereeWhereInput). 예외 13건(kakao/HOF/SW) 유지. right-sidebar-logged-in 타입 `export` 추가 | ✅ (커밋 대기) |
| 04-22 | developer | **하드코딩 색상 5차 — 잔존 정비 (5파일 7건) + 예외 2건 명시** — referee/signup(에러) + referee/login(2건) + verify(warning) + teams/[id]/manage(해산 버튼 hover solid+tone-down) + teams/new(2건). 예외: live orange 스피너(accent TODO) / tm-org-new dark:페어(단일 토큰 검증 전). **하드코딩 색상 audit 실질 완결** | ✅ `6a7569b` |
| 04-22 | developer+pm | **하드코딩 색상 3파일 CSS 변수화 (4차, 4건) + conventions.md 승격** — tm-admins(error+success 페어) + tm/[id]/wizard + tm/new/wizard. **tournament-admin 영역 전체 완결** (3차+4차 = 6파일 11건). color-mix Tailwind arbitrary 언더스코어 문법을 conventions.md 승격 | ✅ `42c5066` |
| 04-22 | developer | **하드코딩 색상 3파일 CSS 변수화 (3차, 7건)** — tm-matches(에러 text+삭제 버튼 hover color-mix+에러 박스 3건) + tm-site(에러 박스 3건) + tm-bracket(에러 박스 1건). Tailwind v4 arbitrary `color-mix` 언더스코어 문법 next build PASS 검증 | ✅ `dfa5b9a` |
| 04-22 | developer | **하드코딩 색상 3파일 CSS 변수화 (2차, 7건)** — classic(1위/3위 순위 4건 → warning) + hero-bento(LIVE→error / HOT→warning) + admin-users-table(★라벨→warning). classic statusColors 시맨틱 고정은 유지. tsc PASS | ✅ `672dc9a` |
| 04-22 | pm | **통합 스모크 체크리스트 + B-1 시드 상태 확인** — `Dev/smoke-test-2026-04-22.md` 신규 / B-1 이미 충족 | ✅ `1958b9d` |
| 04-22 | developer | **하드코딩 색상 3파일 CSS 변수화 (4건)** — community/edit + push-permission + image-uploader, `--color-error` 토큰화 | ✅ `0f41e99` |
| 04-22 | developer | **카페 community HTML entity decode (5파일)** — 렌더 시점 `decodeHtmlEntities` 적용 (리스트/사이드바/상세/댓글/사이드바) | ✅ `bb488ce` |
| 04-22 | pm | **3~4순위 점진 정비 전체 (11파일 44건 + reviewer 2건)** — live/teams/games/games-new 색상 42건 + any 3건 + L3 쿼리 합치기 + is_public 가드 | ✅ 6커밋 tsc PASS |
| 04-22 | pm | **ops-db-sync-plan 선결 조건 5/6 반영** (원영 대기 1건) | ✅ docs |
