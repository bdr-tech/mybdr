# 작업 스크래치패드

## ⚠️ 세션 분리 원칙 (필수, 2026-04-20 합의)
- **본 세션** = `(web)`/`(api/web)`/`(referee)` 등 일반 UX/기능 작업
- **다른 세션 (병행)** = 다음카페 sync 작업 — 항상 별도 터미널에서 동시 진행
- **본 세션 PM 금지 파일**: `scripts/sync-cafe.ts`, `scripts/cafe-login.ts`, `scripts/_tmp-*`, `scripts/backfill-*cafe*.ts`, `src/lib/cafe-sync/*`, `Dev/cafe-sync-plan-*.md`
- **푸시 전 `git fetch` 권장** (양 세션 push 충돌 방지)

## 📍 다음 세션 진입점 (2026-04-21~ "이어서 하자" 시 이 순서대로)

### 🥇 1순위 — W4 + L3 통합 스모크 테스트 (수빈 수동, 1h)
- **W4**: `/profile/activity` 3탭 / `/help/glossary` / 팀 상세 가입 UI / M6 알림 6카테고리 / M3 코트 지도 / M5 온보딩 / 카페 Phase 3 자동화
- **[신규] L3**: Organization 2단 / Series(under org) 3단 / Tournament 소속 시리즈 카드 + EditionSwitcher (1회차/중간/최종/null 혼재)
- **조합**: PC × 모바일 × 다크 × 라이트 4조합
- **결과는 scratchpad 수정 요청 테이블에 기록**
- **개발 DB 시드 follow-up**: Organization 1 + Series 1 + Tournament 3~4개(edition_number 1,2,3,null 혼재) — 추후 회귀 테스트용

### 🥈 2순위 — 원영 협의 (30분~1h)
- **문서**: `Dev/ops-db-sync-plan.md` (6개 선결 조건 체크박스)
- **옵션 A** 추천 (Supabase 두 번째 프로젝트)
- 협의 완료 시 → 2026-04-18 lessons "개발 DB라 믿은 .env" 사건의 장기 해결 시작

### 🥉 3순위 — 점진 정비 (보이스카우트)
- 하드코딩 색상 잔존 30 파일 (lessons.md 2026-04-20 audit 목록)
- `any` 타입 9회 / 8 파일
- **원칙**: 해당 파일을 다른 이유로 건드릴 때 함께 정비

### 4순위 — L3 reviewer 권장 후속 (nice-to-have)
- tournaments/[id] 쿼리 합치기 (series.findUnique → tournament include에 merge)
- `series.is_public` 체크 — 비공개 시리즈 노출 정책 명확화
- `<img>` → `next/image` 전환 (organizations 페이지 + series-card.tsx) — 별도 작업
- EditionSwitcher flex-wrap (≤320px 대응)

## 현재 상태 스냅샷 (2026-04-21 L3 완료 직후)

| 항목 | 값 |
|------|-----|
| 브랜치 | subin |
| subin HEAD | **`a6b329f`** (L3 다음 단위) |
| origin/subin | `c94e32f` (뒤 1건) |
| main / dev | `9836e88` (완전 동기화) |
| 미푸시 | **1건** (a6b329f L3) |
| 백업 브랜치 | `subin-backup-2026-04-20` (f1779ff, 옵션 F 직전) |
| 오늘 PR merge | #47 #48 #49 #50 #51 #52 (3사이클) |
| L3 상태 | Organization/Series(under org) Breadcrumb + EditionSwitcher + SeriesCard **로컬 구현 완료**, 미푸시 |
| 카페 Phase 3 상태 | GH Actions + 쿠키 갱신 + Slack + Pagination **운영 반영** ✅ |

## W1~W4 + L3 완료 요약 (2026-04-19 ~ 04-21)
| 주차/항목 | 내용 | 계획 | 실제 |
|------|------|------|------|
| W1 | Q1~Q12 (라우트/네비/배지/발견성/폴리시) | 20h | ~12h |
| W2 | M1 좌측 네비 + M2 대회 sticky | 10h | ~6h |
| W3 | M3/M5/M6 | 20h | ~7h |
| W4 | M4/M7/L1 + Day 20 회고 + 후속 정비 | 17h | ~3h |
| L3 | Organization brc + EditionSwitcher + SeriesCard | 3h | ~1.5h |
| **합계** | **4주 + L3** | **~70h** | **~29.5h** (2.4배 절감) |

## 수정 요청
| 요청자 | 대상 파일 | 문제 설명 | 상태 |
|--------|----------|----------|------|

## 테스트 결과 (tester) — L2 (2026-04-21)

| # | 항목 | 결과 | 상세 |
|---|------|------|------|
| T1 | `npx tsc --noEmit` 에러 0 | ✅ | EXIT=0 (백그라운드 bcggs705h) |
| T2 | 하드코딩 색상 0 (신규 3 + 수정 2) | ✅ | 3건 매치 전부 `var(--color-*, #hex)` fallback 패턴 (profile-hero L161, users/[id]/page L301, profile/page L219). convention 준수 |
| T3 | `any` 타입 0 (신규/수정 6파일) | ✅ | 전 파일 0건 |
| T4 | lucide import 0 | ✅ | 신규 3 + 수정 2 + gamification.ts 전부 0건 |
| T5 | Material Symbols 사용 확인 | ✅ | profile-hero 3 / recent-games 1 / users[id] 1 / profile 4 회 사용 (≥1 만족) |
| T6 | `getTierBadge` 잔존 0 | ✅ | src 전체 0건 |
| T7 | 삭제된 6파일 import 잔존 0 | ✅ | 5건 매치 전부 순수 주석(`right-sidebar-logged-in.tsx`·`user.ts`·`route.ts`의 가입일 주석 + `recent-games.tsx` 자기 설명 주석). 실제 import 0건 |
| T8 | dev server `/users/[id]` 공개 200 | ✅ | /users/1 /users/2 /users/999999 전부 HTTP 200 (not-found도 200 반환 — Next 서버 컴포넌트 normal) |
| T9 | `/profile` 307 | ✅ | HTTP 307 (로그인 필요) |
| T10 | `/profile/edit` 307 | ✅ | HTTP 307 — 편집 경로 재활용 확정 (설계 B) |
| T11 | 공용 컴포넌트 import 경로 검증 | ✅ | `@/components/profile/profile-hero` → users[id]·profile 양쪽 import / `recent-games` → users[id] import / MiniStat은 profile-hero 내부 참조 |
| T12 | `/profile` BasicInfo / Refund 카드 미렌더 | ✅ | profile/page.tsx 내 `basic-info-card\|refund-account-card` import 0건. 파일 자체도 삭제됨 |
| T13 | Teams 섹션 `is_public` 가드 | ✅ | users/[id]/page.tsx L107(select)·L217~224(이중 필터: `status==="active" && is_public !== false`) 확인 |
| T14 | 레벨 배지 헬퍼 사용 | ✅ | `getProfileLevelInfo` — lib/profile/gamification.ts 정의 + users/[id]/page L205 호출 / `getLevelInfo` — weekly-report·api/profile/gamification·courts/rankings 기존 사용처 유지 |

📊 종합: **14/14 통과 / 0 실패**

### 블록커
없음.

### 권장 수정 (nice-to-have)
- **T8 주의**: /users/999999(존재하지 않는 id)도 HTTP 200을 반환. Next.js notFound() 트리거 여부는 페이지 내 렌더 결과를 봐야 확실. 빠른 런타임 수동 확인 1건 권장(수빈 1h 스모크에서 병합 가능)
- **런타임 시각 검증 미수행** (tester 권한 밖): 비로그인 브라우저로 /users/<본인id> 접근 시 Hero actionSlot 상태(편집 버튼이 뜨지 않음 — 세션 없음) 확인 필요. 정상 동작이지만 UX 관점 확인 권장
- **주석 내 과거 파일명 잔존**: `right-sidebar-logged-in.tsx`·`user.ts`·`api/web/profile/route.ts`의 "profile-header" 주석은 무해하나, 보이스카우트 시 "프로필 Hero" 등으로 표현 업데이트 권장(선택)

### 커밋 가능 여부
**✅ 가능** — 블록커 0건, 정적 검증 14/14 통과. 개발 DB organizations/series 이슈와 무관한 파일군이고, `/users/[id]` 200 / `/profile` 307 / `/profile/edit` 307 로 라우팅 정상.

## 기획설계 (planner-architect) — L2 선행 audit (2026-04-20)

**🎯 목표**: `/users/[id]`(타인) ↔ `/profile`(본인 대시보드) 통합 설계 전, 현행 구조·간극 파악

### 1) 페이지 현황 매트릭스
| 페이지 | 파일 (절대경로 생략, `src/app/(web)/` 기준) | 렌더링 | 주요 API/쿼리 | 구조 |
|--------|--------|--------|---------|------|
| `/users/[id]` | `users/[id]/page.tsx` (L1–409) | **Server** + Promise.all 7쿼리 | prisma 직접 (User / matchPlayerStat agg / 최근 경기 5건 / follows×2 / getPlayerStats) — **API route 없음** | Hero(아바타+티어+승률 4칸+MVP카드) → 레이더+시즌스탯 → 최근경기 테이블 |
| `/profile` | `profile/page.tsx` (L1–224, `"use client"`) | **Client** useSWR 3개 | `/api/web/profile` + `/profile/gamification` + `/profile/stats` | ProfileHero → 4카드 그리드(기본정보/팀·대회/환불계좌/위험영역) → 로그아웃 |
| `/profile/*` 서브 | activity/basketball/billing/edit/growth/settings/weekly-report/payments/preferences/subscription/notification-settings/complete | Client 위주 | `/api/web/me/activity` 등 | `ProfileShell` → 좌 220px nav + 우 main |

### 2) 공통·차이 요약
**공통(둘 다 렌더)**: Hero(아바타+이름+포지션/지역/신장) · 팔로워·팔로잉 카운트 · 승률(`getPlayerStats` 재사용 ✅) · 경기수
**본인 전용(`/profile`만)**: email · phone · birth_date · 환불계좌(bank_name/account_number) · 편집 버튼 · 레벨/칭호(gamification) · 다음 경기(next_game) · 맞춤설정 / 구독 / 결제내역 / 주간리포트 / 알림설정 / 위험영역
**타인 전용(`/users/[id]`만)**: 티어 배지(경기수 기반) · MVP 하이라이트 카드 · 레이더 차트 5축 · 시즌 스탯 상세 · 최근 경기 테이블 · 팔로우/메시지 버튼

### 3) 컴포넌트 분산 맵 (Hero / Stat / Roster / Recent / Radar)
| 섹션 | `/profile` 구현 위치 | `/users/[id]` 구현 위치 | 공용도 |
|------|---------|---------|--------|
| **Hero** | `profile/_components/profile-hero.tsx` L1-274 | `users/[id]/page.tsx` L194-377 **인라인** | ❌ 분리 필요 |
| **StatBar/MiniStat** | `profile-hero.tsx` 내부 `MiniStat` (L241-274) | `page.tsx` L294-334 **인라인** | ❌ 중복 구현 |
| **Radar** | `profile/_components/radar-chart.tsx` | `users/[id]/_components/user-radar-section.tsx` → **이미 radar-chart import 재사용** ✅ | ✅ 1곳 |
| **Recent Games** | `profile/_components/recent-games-section.tsx` (L111) | `users/[id]/_components/user-recent-games.tsx` (L120) | ❌ 별도 구현 |
| **Stats Detail** | `profile/_components/stat-bars.tsx` (L143) · `ability-section.tsx` | `user-stats-section.tsx` (L122) | ❌ 별도 구현 |
| **Teams/Roster** | `teams-section.tsx` + `current-team-card.tsx` | 없음 (teamMembers 쿼리는 있으나 미렌더) | ❌ `/users` 쪽 누락 |

**레거시 의심**: `profile/_components/profile-header.tsx` (L207) — `/profile/page.tsx`에서 미import, 다른 모든 src에서도 import 0건 → **삭제 후보**.

### 4) API 매트릭스
| 경로 | 메소드 | 공개 | 본인 대상 | 용도 |
|------|--------|------|-----|------|
| `/api/web/profile` | GET/PATCH | 로그인 필수 | O (세션.userId) | 프로필 기본 + teams + tournaments + followers/followingCount + nextGame |
| `/api/web/profile/gamification` | GET | 필수 | O | level/title/emoji |
| `/api/web/profile/stats` | GET | 필수 | O | winRate |
| `/api/web/profile/{payments,subscription,weekly-report,notification-settings,generate-bio}` | 각 | 필수 | O | 본인 전용 서브 |
| `/api/web/me` | GET | 필수 | O | 세션 + 권한(referee/admin_info) + prefer_filter |
| `/api/web/me/activity` | GET | 필수 | O | 3탭(tournaments/games/teams) 통합 |
| `/api/web/users/[id]/followers` | GET | 공개 | X | 팔로워 목록 |
| `/api/web/users/[id]/following` | GET | 공개 | X | 팔로잉 목록 |
| **`/api/web/users/[id]` 루트** | — | — | — | **존재하지 않음** (page.tsx가 prisma 직접) |

### 5) 스키마 현황 (User 모델, schema.prisma L11-168)
- **`is_public` / `privacy` / `visibility` 필드 전무** — User 모델에는 `status`(active/suspended)만 존재. grep 결과 `is_public`은 tournaments / game_templates / memory_cards / tournament_series / organizations / system_settings / comments 7개 모델에만 존재, **User 0건**.
- 현재 `/users/[id]` 페이지에서 select하는 필드: `name, nickname, position, height, city, district, bio, profile_image_url, total_games_participated, createdAt, teamMembers` — email/phone/birth_date/weight/account_*는 애초에 select 대상 제외 = **select 레벨의 암묵적 공개 필터**가 유일한 정책
- 따라서 "비공개 필드 정책"은 **코드(Select)로만 강제**, 스키마 레벨 0.

### 6) 간극 리스트 (Gap — 우선순위↑)
1. **`/users/[id]` 본인 접근 분기 0건** — 본인이 자기 id를 보면 팔로우 버튼이 자기 자신에 노출됨, 편집 진입 경로 없음
2. **Hero 컴포넌트 중복** — `profile-hero.tsx`(274L) + `users/[id]/page.tsx` 내부 JSX(~140L) 기능 9할 동일, 미분리
3. **MiniStat 중복** — `profile-hero.tsx` 내부 L241 / `users/[id]/page.tsx` L294 2벌, 동일 디자인 다른 구현
4. **Recent Games 중복** — 각 105L+120L 별도 구현, 컬럼도 거의 동일
5. **Stats Detail 중복** — `stat-bars.tsx` (본인 4축) vs `user-stats-section.tsx` (타인 시즌 평균)
6. **타인 프로필에 Teams 섹션 누락** — teamMembers는 쿼리되지만 렌더하지 않음 (L84-93에서 select만)
7. **공개/비공개 정책이 hardcoded select** — 새 필드 추가 시 매번 개발자가 수동 판단
8. **티어 배지 로직 중복 위험** — `getTierBadge`는 `/users/[id]` L50에 인라인, 본인에겐 레벨/칭호(gamification)만 노출 → 통합 시 우선순위 결정 필요
9. **MVP 카드는 장식용 더미** (`/users/[id]` L351) — 실제 MVP 필드 없음, L2에서 유지/제거 결정 필요
10. **`profile-header.tsx` 레거시 파일** — 0회 import, 삭제 가능

### 7) 설계 전 선행 정책 질문
- **Q1 (경로 전략)**: 기획서 추천 "결정 A(단일 `/users/[id]`)" 확정? 아니면 "B(공용 컴포넌트 분리 + 경로 유지)"? → 이후 작업 구조가 크게 달라짐
- **Q2 (비공개 필드 정책)**: 본인만 vs 친구(팔로우)만 vs 전부 공개 — 기본값은? (현재는 select에서 email/phone/birth_date/account 전면 차단, 중간 단계 없음)
- **Q3 (`User.is_public` 필드 도입)**: 스키마 마이그레이션 필요? 아니면 계속 select-level만? (L2 기획에는 "공개 범위 필드 명시" 언급, 그러나 구현 상세 미정)
- **Q4 (티어 vs 레벨)**: 본인도 타인도 보는 배지 하나로 통합(레벨 Lv.N)? 아니면 타인 = 티어(브론즈~플래티넘) / 본인 = 레벨 분리 유지?
- **Q5 (`/profile` 정체성)**: "대시보드"로 재정의하면 현재의 프로필 정보 카드(기본정보/환불계좌 등)는 유지 or `/users/[me.id]`로 이관?
- **Q6 (MVP 하이라이트 카드)**: 제거 / 실데이터 연동(대회 MVP 수상 내역) / 존치?
- **Q7 (Teams 섹션)**: `/users/[id]`에도 소속 팀 공개 카드 추가? (public team 판단 근거 필요)

### 8) 공수 재평가 (기획서 ~15h 대비)
| 단계 | 기획서 | 재추정 | 이유 |
|------|--------|--------|------|
| 1. audit | 2h | **완료 (약 0.5h)** | 이미 분산 파악됨 |
| 2. Hero/StatBar/Roster 공용 분리 | 3h | **2~2.5h** | radar-chart가 이미 공용. Hero/MiniStat만 이동 + props 정리 |
| 3. `/users/[id]` 본인 분기 + 편집 + 비공개 | 3h | **2.5~3h** | 정책 결정(Q2/Q3)이 빠르면 유지 |
| 4. `/profile` 대시보드 재정의 | 3h | **3~4h** | profile-header 삭제 + 카드 재배치. Q5에 따라 +1h |
| 5. 헤더 드롭다운/내비 정합 | 1h | **1h** | profile-dropdown.tsx 1파일만 수정 예상 |
| 6. 다크/라이트·PC/모바일 시각검증 | 2h | **1.5h** | 변경 범위 국소 |
| 7. conventions.md 공개 범위 규칙 기록 | 1h | **0.5h** | 단순 |
| **합계** | **15h** | **11~13h** (기획 대비 −20%) | 공용 컴포넌트가 이미 일부 존재 · API 변경 없음이 확인됨 |

### 9) 결론
- **코드 변경 0** (audit만). 본 섹션은 L2 착수 시까지 유지
- 간극 10건 / 선행 정책 질문 7건
- L2 진입 가능 — 단, Q1·Q2·Q3 세 개는 개발 시작 전 확정 필요
- L3가 이미 완료되어 "L3 먼저" 리스크 해소됨

## 기획설계 (planner-architect) — L2 본 설계 (2026-04-21)

🎯 **확정 정책**: Q1=A(단일 `/users/[id]`) / Q2=①본인만 / Q3=②select-level / Q4=①레벨 통합 / Q5=①대시보드 재정의 / Q6=③장식 존치 / Q7=①Teams 섹션 추가

### 1) 영향 파일 매트릭스
| # | 파일 | 변경 요지 | 신규/수정/삭제 | 예상 라인 |
|---|------|----------|----------|-----|
| 1 | `src/components/profile/profile-hero.tsx` | 공용 Hero (본인/타인 분기 props) | **신규** | ~180 |
| 2 | `src/components/profile/mini-stat.tsx` | MiniStat 공용 추출 | **신규** | ~40 |
| 3 | `src/components/profile/recent-games.tsx` | 경기 테이블 공용 (본인=간단 목록 / 타인=스탯 테이블 variant prop) | **신규** | ~140 |
| 4 | `src/app/(web)/users/[id]/page.tsx` | isOwner 분기 + 비공개 필드 select 확장 + Teams 섹션 렌더 + `getTierBadge` 제거 + 레벨 배지 주입 + 공용 Hero/RecentGames 사용 | 수정 | -170 / +120 |
| 5 | `src/app/api/web/users/[id]/gamification/route.ts` | 공개 레벨 API (level/title/emoji만) | **신규** | ~50 |
| 6 | `src/app/(web)/profile/_components/profile-hero.tsx` | 공용 import로 축소 (wrapper만 유지하거나 제거) | 수정/삭제 | -274 |
| 7 | `src/app/(web)/profile/_components/recent-games-section.tsx` | 공용 import로 교체 | 수정/삭제 | -110 |
| 8 | `src/app/(web)/profile/page.tsx` | 대시보드 재정의 — BasicInfo/Refund 제거, 다음경기/활동요약/빠른메뉴로 대체 | 수정 | -30 / +60 |
| 9 | `src/app/(web)/profile/_components/profile-header.tsx` | 레거시 삭제 (import 0건 확인) | **삭제** | -207 |
| 10 | `src/app/(web)/users/[id]/_components/user-recent-games.tsx` | 공용 import로 교체 또는 삭제 | 수정/삭제 | -120 |
| 11 | `src/components/profile/profile-side-nav.tsx` | "기본정보/환불계좌" 항목 네비 조정(edit 아래로 묶기) | 수정 | ~20 |
| 12 | `src/app/(web)/users/[id]/_components/owner-edit-button.tsx` | 본인 편집 CTA (ActionButtons 대체용) | **신규** | ~30 |

**편집 경로 결정 = B. 기존 `/profile/edit` 재활용** — `/users/[id]`에서 isOwner일 때 "프로필 편집" 버튼 → `/profile/edit`. 이유: 이미 6개 서브 라우트(edit/basketball/preferences 등)와 ProfileShell 네비 구조가 `/profile/*` 기준이라 신규 `/users/[me]/edit` 도입 시 네비 중복 + 308 리다이렉트 ≥4건 필요. URL 의미 손실보다 구조 유지 이득이 큼.

### 2) 공용 컴포넌트 3종
**`components/profile/profile-hero.tsx`** props:
```ts
interface Props {
  user: { nickname, name?, position, height, city, district, bio, profile_image_url, total_games_participated };
  stats: { winRate: number|null } | null;
  gamification: { level, title, emoji } | null;  // 본인·타인 동일 주입
  followersCount: number; followingCount: number;
  viewMode: "owner" | "visitor";                    // 분기 플래그
  ownerAction?: React.ReactNode;                    // viewMode=owner일 때 "프로필 편집" 버튼 슬롯
  visitorAction?: React.ReactNode;                  // viewMode=visitor일 때 ActionButtons 슬롯
}
```
- 서버/클라이언트 겸용: `"use client"` 유지 (기존 profile-hero와 동일, ActionButtons가 client).
- `getTierBadge` 로직은 이동하지 **않음** (Q4 제거).
- MiniStat는 별도 파일로 추출 import.

**`components/profile/mini-stat.tsx`**: 현 profile-hero L241-274 그대로 이전. `label/value/highlight?` 3 prop.

**`components/profile/recent-games.tsx`** props:
```ts
interface Props {
  games: Array<{ id?, gameTitle, scheduledAt, points?, assists?, rebounds?, steals? }>;
  variant: "list" | "table";   // list=본인 간단 목록(chevron) / table=타인 스탯 테이블
  showMoreHref?: string;       // "전체보기" 링크 (있을 때만 표시)
}
```
- 본인(`/profile`)은 `variant="list"` + `showMoreHref="/games/my-games"` (기존 recent-games-section 렌더).
- 타인(`/users/[id]`)은 `variant="table"` + stats 컬럼.

### 3) `/users/[id]` 본인 분기 로직
```ts
const session = await getWebSession();
const isOwner = !!session && BigInt(session.sub) === user.id;
```
- isOwner=true → ActionButtons 숨김 + `<OwnerEditButton />` 렌더 (→ `/profile/edit`)
- isOwner=true → 비공개 필드 select 추가: `email`, `phone`, `birth_date`, `weight`, `bank_name`, `account_number`(마스킹) — 단, **화면에 노출은 Hero 하단 "내 정보" 접이식 섹션**에만 제한(타인에겐 아예 렌더 안 함)
- 비로그인 상태에서 본인 id 볼 일 없음 → isOwner=false로 fallthrough 안전

### 4) gamification 공개 API 확장 (Q4)
- 신규: `GET /api/web/users/[id]/gamification`
  - 인증 **불필요** (공개)
  - select: `xp` 만 → `getLevelInfo(xp)` 로 `{ level, title, emoji }` 반환
  - 연속출석/뱃지/도장은 본인 전용이므로 **미포함** (이 공개 API는 Hero 배지용 최소 필드만)
  - 응답: `apiSuccess({ level, title, emoji })` → snake_case 자동 변환 없음(이미 snake_case free 필드명)
  - `/users/[id]/page.tsx` 서버 컴포넌트에서 fetch 대신 **`getLevelInfo` 함수 직접 import 호출** (내부에 prisma 1쿼리만 추가) → 공개 API는 향후 외부 사용 대비용으로만 만들어두고 서버 컴포넌트는 함수 직접 사용이 더 단순 + snake_case 재발 위험 0
- **curl 체크리스트** (개발 시): `curl http://localhost:3001/api/web/users/1/gamification | jq` → `{"success":true,"data":{"level":N,"title":"...","emoji":"..."}}` 형태 확인. 재발 6회 패턴 방지 (errors.md)

### 5) `/profile` 대시보드 재정의
**유지**: ProfileShell/좌측 네비 7항목 / Hero(공용) / 로그아웃 / 다음 경기 / 활동 요약 배지(M4 `/api/web/me/activity`) / 빠른 메뉴(편집·기본정보·환불계좌·설정 허브 링크 4칸)
**제거·이관**: `BasicInfoCard` / `RefundAccountCard` → `/profile/edit`에 이미 편집폼 존재 → **카드 자체는 edit 페이지 상단에 읽기전용 요약 블록으로 추가**(신규 ~30줄)
**Client 유지**: 기존 `"use client"` + useSWR 패턴 유지 (변경 시 로그인 상태 표시 문제 발생). 구조 안정 우선.
**좌측 네비 조정**: `ProfileSideNav`는 라벨 그대로. "내 정보" → "대시보드" 변경은 **불필요**(기획서 §2 L37 추천이나 링크 대상 동일하므로 라벨만으로는 사용자 혼란 유발 → 보류)

### 6) Teams 섹션 추가 (타인 프로필)
- `teamMembers` include에 `team.is_public`, `team.logoUrl`, `team.status` 추가
- 필터: `team.status === "active" && team.is_public !== false` (Boolean? default true → null/true만 통과)
- 렌더: `components/profile/` 아래 **기존 `current-team-card.tsx`는 본인 전용 UI(관리 링크 포함)** → 재활용 **불가**. 신규 경량 `<UserTeamsGrid>` 2~3열 그리드(로고+팀명+도시, Link to `/teams/[id]`)
- 위치: Hero 아래, 레이더 섹션 위 (방문자 관점에서 "누구와 뛰는지"가 "어떤 스탯인지"보다 우선)

### 7) 레벨 배지 통합 (Q4)
- `getTierBadge()` **제거** (`users/[id]/page.tsx` L50-56)
- 공용 Hero 내부에 현재 `/profile/profile-hero.tsx` L136-155의 BDR Red 라운드 배지 레이아웃 그대로 사용
- 본인·타인 모두 `gamification={level,title,emoji}` 주입 → 동일 스타일 배지 렌더
- 기존 tier 색상 CSS 변수(`--color-tier-gold` 등)는 다른 곳 사용 없으면 정리 대상(별도 audit 불필요)

### 8) 실행 계획 (병렬 가능 명시)
| 순서 | 작업 | 담당 | 선행 | 예상 |
|------|------|------|------|------|
| 1a (병렬) | 공용 3종 분리 (Hero/MiniStat/RecentGames) + `/profile` wrapper 교체 | developer | — | 2h |
| 1b (병렬) | `profile-header.tsx` 삭제 (import 0 확인됨) | developer | — | 5m |
| 1c (병렬) | gamification 공개 API route + 서버용 헬퍼(`getPublicLevelInfo(userId)`) | developer | — | 30m |
| 2 | `/users/[id]` isOwner 분기 + OwnerEditButton + 비공개 select + Teams 섹션 + 레벨 배지 주입 + 공용 Hero/RecentGames 사용 | developer | 1a+1c | 2.5h |
| 3 | `/profile` 대시보드 재정의 + `/profile/edit` 상단 요약 블록 | developer | 1a | 2h |
| 4 | tester + reviewer (병렬) | — | 2+3 | 1h |
| 5 | conventions.md "프로필 공개 범위" 규칙 기록 | pm | 4 | 15m |

**총 공수(병렬 반영)**: 1단계 max(2h, 0.5h) + 2단계 2.5h + 3단계 2h + 4단계 1h + 5단계 0.25h ≈ **~8h** (audit 별도 0.5h 완료)

### 9) 리스크 매트릭스
| ID | 리스크 | 대응 |
|----|--------|------|
| R1 | `/profile`에서 BasicInfo/Refund 제거 시 정보 도달성 저하 | `/profile/edit` 상단 읽기전용 요약 블록 추가 + 빠른메뉴 "기본정보" 링크 유지 |
| R2 | gamification 공개 API snake_case 재발 | 서버 컴포넌트는 API 대신 `getLevelInfo(user.xp)` 함수 직접 호출 + API는 curl 1회 검증 |
| R3 | Hero 공용 분리로 `/profile/_components/profile-hero.tsx` import 경로 깨짐 | 기존 경로는 re-export wrapper로 유지(`export { ProfileHero } from "@/components/profile/profile-hero"`) → 점진 전환 |
| R4 | Teams 섹션 비공개 팀 노출 | `team.is_public !== false && team.status === "active"` 이중 체크 |
| R5 | `getTierBadge` 제거 시 BRONZE/GOLD 텍스트 의존 SEO/메타 회귀 | tier 배지는 description에만 있던 게 아니라 시각 요소 → 메타 영향 0 |
| R6 | `/profile/edit` 상단 요약 블록 추가로 기존 편집 폼 레이아웃 회귀 | 상단 읽기전용 블록만 추가, 기존 폼 DOM 건드리지 않음 |
| R7 | 공용 Hero의 `viewMode` 분기 잘못으로 본인에게 팔로우 버튼 노출 | 통합 테스트 시 본인 자기 id로 `/users/[me]` 접근 케이스 필수 |

### 10) developer 착수 가능 여부
**Y (분기점 0)** — 정책 7건 전부 확정, 파일 매트릭스/props/실행 순서 명세 완료. 편집 경로는 B(`/profile/edit` 재활용)로 본 설계에서 확정.

## 구현 기록 (developer) — L2 본인·타인 통합 (2026-04-21)

📝 **구현한 기능**: `/users/[id]` 단일 라우트에 본인/타인 통합 + 티어→레벨 배지 일원화 + Teams 섹션 공개 + `/profile`을 대시보드로 재정의 + 공용 컴포넌트 3종 추출

### 변경 파일 (12개)
| # | 파일 | 종류 | 핵심 변경 |
|---|------|------|----------|
| 1 | `src/components/profile/profile-hero.tsx` | 신규 | 공용 Hero — actionSlot으로 본인/타인 분기, levelInfo 주입 |
| 2 | `src/components/profile/mini-stat.tsx` | 신규 | Hero 통계 1칸 공용 추출 |
| 3 | `src/components/profile/recent-games.tsx` | 신규 | variant="list"/"table" 공용 |
| 4 | `src/lib/profile/gamification.ts` | 신규 | `getProfileLevelInfo(xp)` 서버 헬퍼 — 기존 getLevelInfo re-export (API 경유 배제) |
| 5 | `src/app/(web)/users/[id]/page.tsx` | 수정 | isOwner 분기 + 공용 Hero + OwnerEditButton + Teams 섹션 + getTierBadge 제거 + 레벨 배지 + xp select 추가 |
| 6 | `src/app/(web)/profile/page.tsx` | 수정 | 대시보드 재정의: BasicInfo/Refund 카드 제거 + QuickMenuCard 신설 + 공용 Hero |
| 7 | `src/app/(web)/profile/_components/profile-hero.tsx` | 삭제 | 공용으로 이관 |
| 8 | `src/app/(web)/profile/_components/recent-games-section.tsx` | 삭제 | 공용으로 이관 |
| 9 | `src/app/(web)/profile/_components/profile-header.tsx` | 삭제 | 레거시 (import 0건) |
| 10 | `src/app/(web)/profile/_components/basic-info-card.tsx` | 삭제 | /profile/edit로 이관 예정 (본 작업 범위 밖) |
| 11 | `src/app/(web)/profile/_components/refund-account-card.tsx` | 삭제 | /profile/edit로 이관 예정 (본 작업 범위 밖) |
| 12 | `src/app/(web)/users/[id]/_components/user-recent-games.tsx` | 삭제 | 공용으로 이관 |

### 단계별 구현 결과

#### Phase 1 (공용 컴포넌트 + 헬퍼 + 레거시 정리)
- **1a 공용 3종**: ProfileHero / MiniStat / RecentGames 모두 components/profile/에 신규. Hero는 `actionSlot: ReactNode`로 본인/타인 액션 영역 슬롯 주입.
- **1b 레거시 삭제**: profile-header.tsx (import 0건 확인 후 삭제).
- **1c gamification 헬퍼**: `getProfileLevelInfo(xp)` — 기존 `getLevelInfo` 순수 함수를 프로필 배지용 `{level,title,emoji}` 최소 세트로 래핑. 서버 컴포넌트에서 직접 호출해 snake_case 6회 재발 패턴 원천 차단.

#### Phase 2 (/users/[id] 통합 + /profile 재정의)
- **2 /users/[id]**:
  - `isOwner = BigInt(session.sub) === userIdBigInt` 분기
  - User select에 `xp` 추가 + teamMembers include에 `logoUrl/city/district/is_public/status/primaryColor` 추가
  - actionSlot: isOwner → OwnerEditButton (→ /profile/edit), 비본인 → 기존 ActionButtons
  - getTierBadge 함수 완전 제거 (tier 배지 렌더 JSX 제거)
  - Teams 섹션: `status==="active" && is_public!==false` 필터 후 1~3열 그리드. 로고 있으면 next/image, 없으면 primaryColor 기반 이니셜 원.
  - RecentGames(variant="table") 공용 사용
- **3 /profile 대시보드**:
  - 공용 Hero + actionSlot="프로필 편집" 링크
  - 2열 그리드: TeamsTournamentsCard + QuickMenuCard(신설, 2x2 메뉴 타일)
  - BasicInfoCard/RefundAccountCard 제거 (편집은 /profile/edit로 유도)
  - DangerZoneCard + 로그아웃 유지

### 검증 결과
| 항목 | 결과 |
|------|------|
| `npx tsc --noEmit` | **✅ EXIT=0** (에러 0) |
| 하드코딩 색상 (신규 3 컴포넌트 + page.tsx 2) | **✅ 0건** (남은 3건은 `var(--color-*, #hex)` fallback 패턴 — convention 준수) |
| `any` (신규/수정 파일) | **✅ 0건** |
| lucide import (신규/수정 파일) | **✅ 0건** — Material Symbols 고정 |
| `getTierBadge` 잔존 | **✅ 0건** |
| profile-header.tsx 존재 | **✅ 삭제됨** |
| BasicInfo/Refund 카드 /profile에 렌더 | **✅ 미렌더** (삭제) |

### 💡 tester 참고
- **테스트 URL**
  - `/users/<비본인 id>` — Hero에 팔로우/메시지 버튼 + 티어 대신 Lv.N 배지 + Teams 섹션(공개 팀 있을 때) + RecentGames 테이블 형태
  - `/users/<본인 id>` — Hero에 "프로필 편집" 버튼 (팔로우 버튼 **노출되면 안 됨**) + /profile/edit로 이동
  - `/profile` — 공용 Hero + Lv.N 배지 + TeamsTournamentsCard + QuickMenuCard + DangerZone + 로그아웃
- **정상 동작 기준**
  - 공용 Hero의 레벨 배지(Lv.N {title}): 본인/타인 동일 스타일
  - Teams 섹션: `is_public===false`인 팀은 노출되지 않음
  - 비로그인 상태에서 `/users/[id]` 접근 시 Hero의 actionSlot에 팔로우 버튼은 있으나 클릭 시 "로그인 필요" 안내 (기존 동작)
  - `/profile` 비로그인 → `person_off` 아이콘 + 로그인 유도 화면 (기존 동작 유지)
- **주의할 케이스**
  - xp=0인 유저 → Lv.1 "루키" 배지 표시돼야 함
  - teamMembers가 0건 또는 전부 비공개 → Teams 섹션 자체가 렌더되지 않아야 함 (`publicTeams.length > 0` 가드)
  - 포지션 null / height null / city 모두 null → 메타 영역이 비어도 레이아웃 안 깨지는지

### ⚠️ reviewer 참고
- **액션 슬롯 패턴**: ProfileHero는 `viewMode` 분기 대신 `actionSlot: ReactNode`로 완전 주입. 장점 = 컴포넌트 내부 조건 분기 0, 확장 용이. 단점 = 호출자가 본인/타인 버튼을 직접 렌더해야 함 (양쪽 page.tsx에 중복 유사 JSX).
- **레벨 배지 데이터 경로 2가지**
  - `/users/[id]`: `getProfileLevelInfo(user.xp)` 서버 헬퍼 직접 호출 (prisma 쿼리에 `xp` select 추가)
  - `/profile`: 기존 `/api/web/profile/gamification` useSWR 유지 (이미 level/title/emoji 반환)
  - → **API 경유는 본인 대시보드 1곳뿐**. 공개 gamification route는 설계서에 명세된 신규 API도 만들지 않음(서버 함수로 충분).
- **QuickMenuCard** — 4개 타일: profile/edit, profile/activity, profile/weekly-report, profile/settings. 필요시 추가/조정 여지 있음.
- **삭제된 카드 (BasicInfo/Refund)**: 본 구현 범위는 "카드 제거"까지. /profile/edit 상단에 읽기전용 요약 블록 추가(설계 §5) 는 **미포함** — 별도 후속 작업으로 분리 권장 (R1 리스크 영향).
- **공용 Hero import 경로**: `@/components/profile/profile-hero` (루트 components에서 import). 기존 `./profile/_components/profile-hero`는 완전 삭제되어 wrapper 미제공 → 혹시 외부에서 참조하던 곳이 있다면 깨짐 (grep 확인: 이번 수정 이전 import는 profile/page.tsx 1곳뿐, 이미 변경됨).

## 리뷰 결과 (reviewer) — L2 (2026-04-21)

📊 **종합 판정: 통과** (블록커 0건 / 권장 4건)

### 리뷰 항목 매트릭스
| # | 항목 | 판정 | 상세 |
|---|------|------|------|
| R1 | 컨벤션 준수 (CSS 변수/Material Symbols/kebab-case/Prisma) | ✅ 통과 | 신규/수정 5파일 모두 `var(--color-*)` 사용, Material Symbols Outlined 고정, lucide import 0, kebab-case 파일명, Prisma 타입 정확히 사용 |
| R2 | 설계 부합도 (Q1~Q7, 편집 경로 B, 공용 3종, gamification 서버 헬퍼) | ✅ 통과 | Q1(단일 `/users/[id]`+isOwner) / Q2(본인만 select whitelist) / Q3(select-level, 스키마 0) / Q4(getTierBadge 제거, 레벨 통합) / Q5(/profile 대시보드) / Q6(MVP 장식 존치: UserRadar/UserStats 그대로) / Q7(Teams 공개 필터). 편집 경로 B(/profile/edit 재활용) 준수. gamification 서버 헬퍼 직접 호출 — 공개 API 신설 0 |
| R3 | 타입 안전 (`any` 0 / `as` 단언 최소) | ✅ 통과 | 신규 3컴포넌트 + page 2개 전수 grep 결과 `any` 0건, `as [A-Z]` 단언 0건. Prisma select 결과 타입으로 충분 |
| R4 | 접근성 | 🟡 개선 여지 | OwnerEditButton/ActionButtons는 텍스트 병기 + 아이콘이라 기본 접근성 확보. Hero의 아바타 `<Image alt={displayName}>` 적용 ✅. 단 `action-buttons.tsx`의 메시지 버튼에 `aria-label` 없음(본 L2 범위 외 기존 파일) |
| R5 | 데이터 페칭 효율 | ✅ 통과 | `/users/[id]` Promise.all 7쿼리 유지(추가 없음). teamMembers include 확장에서 status/is_public/logoUrl/city/primaryColor만 select — 필드 최소화. 서버 컴포넌트 내 filter+map이라 N+1 없음 |
| R6 | 비공개 필드 정책 (Q2 ①) | ✅ 통과 | `/users/[id]` select에 `email/phone/birth_date/weight/bank_name/account_number` 전부 포함 안 됨 — 추가된 건 `xp`만(레벨 배지용, 공개 가능). select-level whitelist 유지 |
| R7 | Teams 섹션 이중 가드 | ✅ 통과 | L219-227 `t.status !== "active"` + `t.is_public === false` 명시 체크. Boolean? null/true 통과, false만 제외 — 주석도 근거 명시(L218). 공개 팀 0건이면 섹션 자체 미렌더(L264 `publicTeams.length > 0` 가드) |
| R8 | 레벨 배지 통합 | ✅ 통과 | `getTierBadge` 실제 코드 잔존 0건(src 전체 grep 결과 docs만 언급). Hero 내부에 `levelInfo` prop 하나로 본인·타인 동일 렌더(L156-169). BDR Red 라운드 배지 일관 스타일 |
| R9 | /profile 대시보드 재정의 | ✅ 통과 | BasicInfo/Refund 카드 제거 확인(_components 폴더 파일 미존재). 유지 요소: Hero / TeamsTournamentsCard(다음 경기 포함) / QuickMenuCard(신설) / DangerZoneCard / 로그아웃 — 설계 일치 |
| R10 | 삭제 6파일 기능 이관 | ✅ 통과 | (a) basic-info/refund-account 편집 기능 → `/profile/edit` L14-173에 bank_name/account_number/birth_date/phone 전부 살아있음. (b) profile-header 레거시(import 0건) 안전 삭제. (c) profile-hero/recent-games-section/user-recent-games는 공용 3종으로 이관. 기능 유실 없음 |
| R11 | snake_case 재발 방지 | ✅ 통과 | 신규 API route 0 — 설계대로 서버 헬퍼 `getProfileLevelInfo` 직접 호출. `/profile` 대시보드는 기존 `/api/web/profile/gamification` useSWR 재사용(이미 snake_case free 필드). curl 검증 불필요 |
| R12 | 보안 (IDOR) | ✅ 통과 | `BigInt(session.sub) === userIdBigInt` — 동일 타입 비교(bigint == bigint). session.sub 문자열을 미리 BigInt 변환 후 비교로 타입 혼용 방지. `!!session &&` 단락 평가로 비로그인 시 isOwner=false 자연 fallthrough |

### 블록커
없음.

### 권장 개선 (nice-to-have)
1. **OwnerEditButton 중복 정의** — `/users/[id]/page.tsx` L370-385와 `/profile/page.tsx` L176-189 두 곳에 동일 JSX 존재(편집 링크 카피). 공용 `<ProfileEditButton />`로 추출하면 ~15줄 절감 + 스타일 변경 시 1곳만 수정. 설계서 §12에 `OwnerEditButton` 신규 항목이 있었는데 `/users/[id]` 내부 함수로 inline됐음. (기능 영향 0)
2. **`action-buttons.tsx` text-white 하드코딩** — L25 `text-white`는 conventions.md 2026-04-12 "primary 배경 위 텍스트는 `--color-on-primary` 필수" 규칙 위배. 본 L2 작업 범위 밖 기존 파일이라 보이스카우트 규칙(스크래치패드 "3순위 점진 정비")에 추가 적합. 블록커 아님
3. **Teams 섹션 heading 의미론** — page.tsx L276 `<h3>`인데 Hero의 이름이 `<h1>`이라 h2를 건너뛰고 h3로 점프. `<h2>`로 승격하면 스크린리더 목차 깔끔. (SEO 영향 미미)
4. **Teams 카드 툴팁** — `team.name`에 `truncate`(L318) 적용 있으나 긴 이름이면 잘림. `title={team.name}` 속성으로 호버 tooltip 추가 검토

### 칭찬 포인트
1. **주석 품질 탁월** — 신규 5파일 모두 상단 JSDoc에 "왜(배경)" → "어떻게(구현 방식)" 순서 + L2 Q번호 명시 + errors.md 재발 패턴 참조까지 포함. `profile-hero.tsx` L4-20 / `gamification.ts` L1-16 특히 모범적. 향후 유지보수자가 맥락 100% 복원 가능
2. **actionSlot 패턴의 단순함** — `viewMode: "owner"|"visitor"` enum 분기 대신 `actionSlot: ReactNode` 슬롯 주입 선택. 컴포넌트 내부 조건분기 0 + 호출자 자유도 극대화 + "비로그인 시 버튼 없음"도 `undefined` 패싱으로 자연 처리. 방어적 설계의 모범
3. **snake_case 재발 6회 패턴 원천 차단** — 공개 gamification API route 신설을 과감히 생략하고 서버 헬퍼 직접 호출로 전환. `/profile`만 기존 useSWR 유지하되 이미 snake_case 안전 필드(level/title/emoji)라 리스크 0. 설계자가 errors.md 패턴을 숙지하고 아키텍처로 예방
4. **Q7 Teams 공개 필터 이중 가드** — `is_public !== false`로 **Boolean? null 허용** 케이스 정확히 처리(`=== true`나 `!!` 썼으면 null이 false 취급되어 기본값 공개 팀이 숨겨짐). 주석 L218에 근거 명시

### 커밋 가능 여부
✅ **커밋 가능** — 블록커 0건, 권장 개선 4건은 후속 작업으로 분리. tester 결과와 통합 시 이상 없으면 바로 커밋 진행.

## 운영 팁
- **gh 인증 풀림**: `GH_TOKEN=$(printf "protocol=https\nhost=github.com\n\n" | git credential fill 2>/dev/null | grep ^password= | cut -d= -f2) gh ...`
- **tsx 환경변수**: `npx tsx --env-file=.env.local scripts/xxx.ts` (Node 22)
- **포트 죽이기**: `netstat -ano | findstr :<포트>` → `taskkill //f //pid <PID>` (node.exe 통째 금지)
- **신규 API 필드**: 추가 전 curl 1회로 raw 응답 확인 (snake_case 6회 재발)
- **공식 기록 쿼리**: `officialMatchWhere()` 유틸 필수
- **BreadcrumbItem 타입**: `@/components/shared/breadcrumb` 재활용
- **EditionSwitcher**: `@/components/shared/edition-switcher` 에서 export (시리즈 회차 네비 재활용)

## 작업 로그 (최근 10건)
| 날짜 | 담당 | 작업 | 결과 |
|------|------|------|------|
| 04-21 | developer | **L2 본인·타인 프로필 통합 구현** — 공용 Hero/MiniStat/RecentGames 3종 신규 + `/users/[id]` isOwner 분기 + Teams 섹션 + 티어→레벨 배지 + `/profile` 대시보드 재정의(BasicInfo/Refund 제거, QuickMenuCard 신설) + 레거시 6파일 삭제. tsc OK / 색상·any·lucide 0 | ⏸ 미커밋 (tester 대기) |
| 04-20 | pm | **L3 다음 단위 5파일 완성** — EditionSwitcher+SeriesCard 신규 + Organization/Series(under org) Breadcrumb + Tournament series include. tester 10/10 / reviewer 통과 (블록커 0, 권장 4) | ✅ a6b329f (미푸시) |
| 04-20 | pm | **옵션 F — main 흡수 + 카페 분리 2회 + PR #51 머지 → PR #52 카페 Phase 3 합류 통합 머지** | ✅ 9836e88 (main/dev/subin 동기화) |
| 04-20 | pm | **#7 위생 — index.md 중복 섹션 해소** (하단 아카이브 재명명) | ✅ 1ffedb5 |
| 04-20 | pm | **운영 DB 동기화 초안 + scratchpad 정비** (Dev/ops-db-sync-plan.md 옵션 A/B/C) | ✅ d30264f |
| 04-20 | pm | **manage 하드코딩 색상 5곳 CSS 변수화 + lessons audit** (31파일/9any 숙제 기록) | ✅ 8dfbafe |
| 04-20 | pm | **/profile/activity 탭 카운트 배지** (3탭 병렬 캐시) | ✅ e6a9169 |
| 04-20 | pm | **L3 초입 — 대회·시리즈 브레드크럼 4단** (`shared/breadcrumb.tsx` 재활용) | ✅ eb9c910 |
| 04-20 | pm | **M7 후속 — 거부 사유 저장/노출** (PATCH+prompt+알림 content) | ✅ 71b817c |
| 04-20 | pm | **오후 push PR #49/#50 MERGED** (충돌 5개 --ours) | ✅ main 반영 |
| 04-20 | pm | **W4 Day 20 회고** (L2/L3 기획서 + W1~W4 요약 + my-games 중복 제거) | ✅ 642a8be + 1119991 |
