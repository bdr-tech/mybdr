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

## 작업 로그 (최근 10건)
| 날짜 | 담당 | 작업 | 결과 |
|------|------|------|------|
| 04-22 | tester | **위임 스모크 W4+L3+L2 Playwright 자동화** — 60 테스트(desktop×30 + mobile×30) 4조합(PC/Mobile × Light/Dark) 전건 PASS. L3(브레드크럼/EditionSwitcher 경계 #1/#11/null) + W4(glossary/courts/community/profile-activity) + postId 277 `'지역방어'` decode 검증. 임시파일(`_tmp-smoke-2026-04-22.spec.ts` + config + quick-check) 완료 후 삭제. 시작 시 `/organizations/*` 500 → PID 46100 kill + `.next` 삭제 + 재기동(PID 78736)으로 복구(Turbopack worker crash 재발) | ✅ 60/60 PASS (수빈 재확인 권장 3건: M6 알림·M5 온보딩·M7 팀 가입 = 로그인 필수) |
| 04-22 | developer | **any 4건 명시 타입화** — home-sidebar(SWR fallback 3건 → TeamData/PostData 재사용) + members/route.ts(Prisma.RefereeWhereInput). 예외 13건(kakao/HOF/SW) 유지. right-sidebar-logged-in 타입 `export` 추가 | ✅ `3f54daa` |
| 04-22 | pm | **knowledge 3파일 갱신 + docs planning 지연 커밋** — conventions +2(any 예외 + color-mix 문법) / lessons +1(영역 단위 정비 교훈) / index 갱신 + Dev/advancement-roadmap/weekly-status 04-20 커밋 | ✅ `ab46ae2` + `9023236` |
| 04-22 | developer | **하드코딩 색상 5차 — 잔존 정비 (5파일 7건) + 예외 2건 명시** — referee/signup(에러) + referee/login(2건) + verify(warning) + teams/[id]/manage(해산 버튼 hover solid+tone-down) + teams/new(2건). 예외: live orange 스피너(accent TODO) / tm-org-new dark:페어(단일 토큰 검증 전). **하드코딩 색상 audit 실질 완결** | ✅ `6a7569b` |
| 04-22 | developer+pm | **하드코딩 색상 3파일 CSS 변수화 (4차, 4건) + conventions.md 승격** — tm-admins(error+success 페어) + tm/[id]/wizard + tm/new/wizard. **tournament-admin 영역 전체 완결** (3차+4차 = 6파일 11건). color-mix Tailwind arbitrary 언더스코어 문법을 conventions.md 승격 | ✅ `42c5066` |
| 04-22 | developer | **하드코딩 색상 3파일 CSS 변수화 (3차, 7건)** — tm-matches(에러 text+삭제 버튼 hover color-mix+에러 박스 3건) + tm-site(에러 박스 3건) + tm-bracket(에러 박스 1건). Tailwind v4 arbitrary `color-mix` 언더스코어 문법 next build PASS 검증 | ✅ `dfa5b9a` |
| 04-22 | developer | **하드코딩 색상 3파일 CSS 변수화 (2차, 7건)** — classic(1위/3위 순위 4건 → warning) + hero-bento(LIVE→error / HOT→warning) + admin-users-table(★라벨→warning). classic statusColors 시맨틱 고정은 유지. tsc PASS | ✅ `672dc9a` |
| 04-22 | pm | **통합 스모크 체크리스트 + B-1 시드 상태 확인** — `Dev/smoke-test-2026-04-22.md` 신규 / B-1 이미 충족 | ✅ `1958b9d` |
| 04-22 | developer | **하드코딩 색상 3파일 CSS 변수화 (4건)** — community/edit + push-permission + image-uploader, `--color-error` 토큰화 | ✅ `0f41e99` |
| 04-22 | developer | **카페 community HTML entity decode (5파일)** — 렌더 시점 `decodeHtmlEntities` 적용 (리스트/사이드바/상세/댓글/사이드바) | ✅ `bb488ce` |
