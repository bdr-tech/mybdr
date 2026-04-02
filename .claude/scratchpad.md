# 작업 스크래치패드

## 현재 작업
- **요청**: '선호 설정' → '맞춤 설정' 용어 통일 + 카테고리 분리 + 맞춤설정 기능 대폭 강화
- **상태**: 맞춤 설정 필터 미동작 5건 수정 완료 + 전수 검증 통과
- **현재 담당**: tester (검증 완료 → PM)

### 구현 기록 (developer)

구현한 기능: 맞춤 설정 5개 항목 필터링 미동작 수정 (지역/실력/요일/시간대/성별)

| 파일 경로 | 변경 내용 | 신규/수정 |
|----------|----------|----------|
| prisma/schema.prisma | User 모델에 preferred_gender Json 필드 추가 | 수정 |
| src/app/api/web/preferences/route.ts | GET/PATCH에 preferred_gender 추가 (Zod + select + updateData) | 수정 |
| src/components/shared/preference-form.tsx | 성별 선택 UI 섹션 추가 (남성부/여성부/혼성부 pill 버튼) + state/toggle/save 연결 | 수정 |
| src/app/api/web/games/route.ts | preferred_regions/skill_levels/days/time_slots 전부 읽어서 필터 적용. 지역은 preferred_regions 우선(user.city fallback). 실력은 서비스로 전달. 요일/시간대는 JS 후처리 필터 | 수정 |
| src/lib/services/game.ts | GameListFilters에 skillLevels 파라미터 추가 + where 조건에 skill_level IN 필터 추가 | 수정 |
| src/app/api/web/tournaments/route.ts | preferred_regions/preferred_gender 읽어서 필터 적용. 지역은 preferred_regions 우선 | 수정 |
| src/lib/services/tournament.ts | TournamentListFilters에 gender 파라미터 추가 + where 조건에 gender IN 필터 추가 | 수정 |

tester 참고:
- 테스트 방법: /profile/preferences에서 각 항목 선택 후 저장 → 맞춤 필터 ON 상태에서 /games, /tournaments 페이지 확인
- 지역(preferred_regions): 맞춤 설정에서 "서울" 선택 → 경기/대회 목록에 서울 지역만 표시
- 실력(preferred_skill_levels): 맞춤 설정에서 "중" 선택 → 경기 목록에 skill_level="mid"인 경기만 표시
- 요일(preferred_days): "토","일" 선택 → 경기 목록에 토/일에 열리는 경기만 표시
- 시간대(preferred_time_slots): "저녁" 선택 → 18~22시 경기만 표시
- 성별(preferred_gender): "남성부" 선택 → 대회 목록에 gender="male" 대회만 표시
- 아무것도 선택 안 하면(빈 배열) 해당 필터 미적용 (전체 표시)
- 주의: preferred_gender DB 컬럼이 새로 추가되므로 npx prisma db push 필요

reviewer 참고:
- 요일/시간대는 Prisma에서 DOW/HOUR 추출이 어려워 JS 후처리(.filter)로 구현
- 심야(night) 시간대는 22~6시로 자정을 넘기므로 start > end 특수 처리
- 지역 우선순위: preferred_regions > user.city (fallback)

#### 수정 이력
| 회차 | 날짜 | 수정 내용 | 수정 파일 | 사유 |
|------|------|----------|----------|------|
| 1차 | 2026-04-02 | 커뮤니티 탭 필터링: 맞춤 필터 ON + preferredCategories 있을 때 해당 카테고리 탭만 표시 | community-content.tsx | 사용자 피드백: 자유게시판만 선택했는데 모든 탭 보임 |
| 1차 | 2026-04-02 | 모든 필터 섹션에 미선택 시 "전체로 설정됩니다" 안내 메시지 추가 (7개 섹션) | preference-form.tsx | 사용자 피드백: 미선택 시 전체라는 걸 모름 |
| 1차 | 2026-04-02 | 성별 섹션: 제목 "대회 성별"→"성별", 설명 수정, 혼성부 옵션 삭제 | preference-form.tsx | 사용자 피드백: 혼성부 불필요, 설명 개선 |
| 2차 | 2026-04-02 | 성별/종별 단일선택 탭 → 복수선택 토글 버튼으로 변경. 디비전 목록은 선택된 조합의 합집합 표시 (미선택 시 전체) | preference-form.tsx | PM 요청: 복수 선택 지원 |
| 3차 | 2026-04-02 | (1) 독립 성별 섹션 완전 삭제 (GENDER_OPTIONS/selectedGenders/toggleGender/preferred_gender 전송) (2) 종별/성별 복수선택→단일탭 복구 (activeGender/activeCategory) (3) 모든 "미선택 시 전체" 문구 삭제 (4) 7개 섹션에 전체선택/전체해제 버튼 추가 | preference-form.tsx | PM 요청: UI 4건 수정 |
| 4차 | 2026-04-02 | 대회 목록 필터 버그 3건 수정: (1) divisions→division_tiers 기준 필터 변경 (2) city null 대회 포함 OR 조건 (3) gender null 대회 포함 OR 조건. 경기 목록도 city null 포함 OR 조건 추가 | tournament.ts, game.ts | PM 요청: 필터 적용 시 0건 반환 버그 |
| 5차 | 2026-04-02 | 지역 필터 4곳을 exact match(in)에서 부분 매칭(contains)으로 변경. "서울"→"서울특별시" 매칭 가능. city null도 포함 | game.ts, tournament.ts, home.ts, recommended-games/route.ts | PM 요청: 지역명 부분매칭 필요 |

## 수정 요청 (debugger)

| # | 버그 | 원인 | 수정 대상 파일 | 수정 방안 | 우선순위 |
|---|------|------|--------------|----------|---------|
| 1 | 커뮤니티 게시판이 맞춤 설정 무시하고 모든 게시판 표시 | header.tsx와 layout.tsx에서 setLoggedIn 이중 호출 경쟁 조건. header.tsx가 preferEnabled 없이 호출하여 preferDefault를 false로 덮어씀 | `src/components/shared/header.tsx` (60행) | header.tsx의 setLoggedIn 호출 제거 (layout.tsx에서 이미 처리) 또는 preferEnabled 전달 추가 | 해결됨 |
| 2 | (부차적) header.tsx와 layout.tsx에서 /api/web/me 중복 fetch | 두 컴포넌트가 동시에 동일 API를 호출하여 불필요한 네트워크 요청 발생 | `src/components/shared/header.tsx`, `src/app/(web)/layout.tsx` | user 상태를 context/props로 공유하여 fetch 1회로 통합 | 중간 |
| 3 | 전체 페이지 무한 로딩 (커뮤니티 포함 모든 페이지) | 개발서버 프로세스(PID 106908)가 메모리 1.67GB 사용하며 hung 상태. 모든 HTTP 요청에 응답 불가. 코드 에러가 아닌 개발서버 자체의 문제 | 개발서버 프로세스 | 개발서버 재시작: (1) `netstat -ano \| findstr :3001`로 PID 확인 (2) `taskkill //f //pid <PID>` (3) `npm run dev` 재시작 | 긴급 |

## 기획설계 (planner-architect) - 맞춤 설정 강화

### 현재 상태 분석

**관련 파일 전체 목록:**

| 파일 경로 | 역할 | 비고 |
|----------|------|------|
| `src/app/(web)/profile/preferences/page.tsx` | 맞춤 설정 페이지 (settings 모드) | UI 텍스트는 이미 "맞춤 설정" |
| `src/app/(web)/profile/complete/preferences/page.tsx` | 온보딩 맞춤 설정 (onboarding 모드) | UI 텍스트는 이미 "맞춤 설정" |
| `src/components/shared/preference-form.tsx` | 핵심 폼 컴포넌트 (4섹션: 종별/경기유형+실력/일정/게시판) | 파일명은 preference |
| `src/app/api/web/preferences/route.ts` | GET/PATCH API (Zod 검증) | 라우트가 /preferences |
| `src/contexts/prefer-filter-context.tsx` | 전역 맞춤 필터 토글 상태 관리 | 주석에 "선호" 다수 |
| `src/components/shared/profile-dropdown.tsx` | 헤더 프로필 드롭다운 (4카테고리) | subtitle에 "선호 설정" 텍스트 |
| `src/components/shared/profile-accordion.tsx` | 모바일 슬라이드 메뉴 아코디언 | "선호 설정" 링크 + /profile/preferences 경로 |
| `src/components/shared/header.tsx` | 헤더 (맞춤 필터 토글 아이콘) | "맞춤 보기" 텍스트는 OK, 주석에 "선호" |
| `src/app/(web)/layout.tsx` | 웹 레이아웃 (맞춤 필터 토글 버튼) | "맞춤 필터" 텍스트는 OK, 주석에 "선호" |
| `src/lib/constants/game-status.ts` | SKILL_BADGE 정의 (4단계: 초급/중급/중상/상급) | 7단계로 변경 필요 |
| `src/lib/services/game.ts` | 경기 목록 필터 (선호 지역/유형 적용) | 주석에 "선호" |
| `src/lib/services/tournament.ts` | 대회 목록 필터 (선호 지역/종별 적용) | 주석에 "선호" |
| `src/lib/services/home.ts` | 홈 추천 경기 스코어링 (실력 매칭) | 주석에 "선호" |
| `prisma/schema.prisma` | User 모델: preferred_* 7개 필드 + prefer_filter_enabled | DB 컬럼명은 유지 |
| `src/app/(web)/games/_components/pickup-game-card.tsx` | 픽업 경기 카드 (SKILL_LABEL 4단계) | 7단계로 변경 필요 |
| `src/app/(web)/games/_components/guest-game-card.tsx` | 게스트 경기 카드 (SKILL_LABEL 4단계) | 7단계로 변경 필요 |
| `src/app/(web)/games/_components/games-content.tsx` | 경기 목록 (SKILL_BADGE 참조) | 변경 자동 반영 |
| `src/app/(web)/games/_components/game-card-compact.tsx` | 컴팩트 경기 카드 (SKILL_BADGE 참조) | 변경 자동 반영 |
| `src/app/(web)/games/[id]/_sections/pickup-detail.tsx` | 픽업 경기 상세 (SKILL_LABEL 4단계) | 7단계로 변경 필요 |
| `src/app/(web)/games/[id]/_sections/guest-detail.tsx` | 게스트 경기 상세 (SKILL_LABEL 4단계) | 7단계로 변경 필요 |
| `src/app/(web)/games/new/_components/game-wizard.tsx` | 경기 생성 위자드 (skillLevel 필드) | 실력 선택 UI 확인 필요 |
| `src/app/api/web/games/[id]/route.ts` | 경기 상세/수정 API (skill_level 필드) | 값 변경 없음 |
| `src/app/api/web/games/route.ts` | 경기 목록 API (skillLevel 매핑) | 값 변경 없음 |
| `src/app/actions/games.ts` | 경기 생성 Server Action (skill_level) | 값 변경 없음 |
| `src/app/api/web/me/route.ts` | 현재 유저 정보 (prefer_filter_enabled) | 주석에 "맞춤 보기" |

**실력 단계 현재 vs 목표:**
| 현재 (4단계) | 목표 (7단계) |
|-------------|-------------|
| beginner (초급) | lowest (최하) |
| intermediate (중급) | low (하) |
| intermediate_advanced (중상) | mid_low (중하) |
| advanced (상급) | mid (중) |
| - | mid_high (중상) |
| - | high (상) |
| - | highest (최상) |

**DB 스키마 변경 필요 여부:**
- User.preferred_skill_levels (Json): 변경 불필요 (문자열 배열이라 새 코드값 저장 가능)
- games.skill_level (VarChar): 변경 불필요 (새 코드값 저장 가능)
- pickup_games.skill_level (VarChar(20)): 변경 불필요
- DB 마이그레이션: 불필요. 기존 데이터의 이전 코드값(beginner 등)은 "알 수 없음"으로 표시하거나 매핑 테이블로 변환
- 신규 컬럼: User.hidden_menus (Json, 기본 "[]") - 숨기고 싶은 메뉴 slug 배열 저장

**프로필 메뉴 카테고리 현재 구조:**
```
1. 내 농구 (sports_basketball) → /profile/basketball
2. 내 성장 (trending_up) → /profile/growth
3. 내 정보 (person) → /profile/edit  ← 여기에 "선호 설정" 포함
4. 계정 (settings) → /profile/subscription
```
목표: "내 정보" 바로 아래에 "맞춤 설정"을 단독 카테고리로 분리

**추가 설정 항목 제안 (앱 분석 기반):**
1. **언어 설정**: 한국어/영어 전환 (현재 UI에 영어 섞임)
2. **테마 설정**: 다크/라이트/시스템 (현재 토글만 있고 설정 페이지 없음)
3. **텍스트 크기**: 기존 TextSizeToggle이 슬라이드 메뉴에 있음 → 맞춤 설정으로 통합
4. **푸시 알림 세부 설정**: 현재 /profile/notification-settings에 있지만 맞춤 설정에서 바로가기 제공
5. **홈 화면 커스텀**: 홈 섹션 순서 변경/숨기기 (추후)

---

### 실행 계획

| 순서 | 작업 | 담당 | 선행 조건 | 예상 시간 |
|------|------|------|----------|----------|
| 1 | 실력 7단계 상수 통일 작업: game-status.ts의 SKILL_BADGE를 7단계로 변경 + preference-form.tsx의 SKILL_LEVELS 변경 + 경기 카드 4파일의 인라인 SKILL_LABEL 변경 + 경기 상세 2파일 변경 | developer | 없음 | 10분 |
| 2 | 프로필 메뉴 카테고리 분리: profile-dropdown.tsx에 "맞춤 설정" 단독 항목 추가 + profile-accordion.tsx에서 "내 정보" 하위의 "선호 설정"을 단독 카테고리로 승격 | developer | 없음 | 5분 |
| 3 | 용어 통일: 코드 주석/UI 텍스트에서 "선호 설정" → "맞춤 설정" 변경 (약 10개 파일의 주석+텍스트) | developer | 없음 | 10분 |
| 4 | 메뉴 토글 기능: (a) User 모델에 hidden_menus Json 필드 추가 (Prisma 스키마) (b) preferences API에 hidden_menus 필드 추가 (c) preference-form.tsx에 "보고 싶은 메뉴" 토글 섹션 추가 (d) slide-menu.tsx와 layout.tsx 사이드네비에서 hidden_menus 반영 | developer | 1~3 완료 | 20분 |
| 5 | 추가 설정 통합: 테마 선택(다크/라이트/시스템) + 텍스트 크기를 맞춤 설정 폼에 섹션 추가 | developer | 4 완료 | 10분 |
| 6 | tester + reviewer (병렬): 타입 체크 + 실력 7단계 표시 검증 + 메뉴 토글 동작 확인 + 용어 통일 누락 검사 | tester + reviewer | 5 완료 | 10분 |

**1~3 단계는 병렬 실행 가능 (독립적)**

### 영향받는 파일 총 목록 (변경 예정)

**실력 7단계 변경 (8파일):**
- `src/lib/constants/game-status.ts` (SKILL_BADGE 수정)
- `src/components/shared/preference-form.tsx` (SKILL_LEVELS 수정)
- `src/app/(web)/games/_components/pickup-game-card.tsx` (SKILL_LABEL 수정)
- `src/app/(web)/games/_components/guest-game-card.tsx` (SKILL_LABEL 수정)
- `src/app/(web)/games/[id]/_sections/pickup-detail.tsx` (SKILL_LABEL 수정)
- `src/app/(web)/games/[id]/_sections/guest-detail.tsx` (SKILL_LABEL 수정)
- `src/app/(web)/games/new/_components/game-wizard.tsx` (실력 선택 옵션 수정 - 확인 필요)
- `src/lib/services/home.ts` (추천 점수 매칭 로직 확인)

**카테고리 분리 (2파일):**
- `src/components/shared/profile-dropdown.tsx` (menuItems 수정)
- `src/components/shared/profile-accordion.tsx` (categories 수정)

**용어 통일 (주석/텍스트, 약 10파일):**
- 위 파일들 + context + services + API 주석

**메뉴 토글 (5파일):**
- `prisma/schema.prisma` (hidden_menus 추가)
- `src/app/api/web/preferences/route.ts` (hidden_menus 필드 추가)
- `src/components/shared/preference-form.tsx` (메뉴 토글 섹션 추가)
- `src/components/shared/slide-menu.tsx` (hidden_menus 반영)
- `src/app/(web)/layout.tsx` (사이드네비 hidden_menus 반영)

**추가 설정 통합 (1~2파일):**
- `src/components/shared/preference-form.tsx` (테마+텍스트크기 섹션)

### developer 주의사항

1. **실력 코드 하위 호환**: 기존 DB에 저장된 "beginner", "intermediate" 등 값이 있을 수 있음. SKILL_BADGE/SKILL_LABEL에 이전 코드도 fallback으로 유지하거나, 표시 시 `?? game.skill_level`로 원본 표시
2. **SKILL_LABEL 중복 제거**: pickup-game-card, guest-game-card, pickup-detail, guest-detail에 각각 인라인으로 SKILL_LABEL이 정의되어 있음. game-status.ts의 SKILL_BADGE를 공통으로 import하도록 통합 권장
3. **메뉴 토글**: hidden_menus는 slug 배열 (예: ["rankings", "organizations"]). slide-menu.tsx의 menuItems를 필터링할 때 사용. 홈/경기찾기는 숨길 수 없도록 보호
4. **파일명/라우트 변경 안함**: /profile/preferences 라우트와 preference-form.tsx 파일명은 그대로 유지 (URL 변경은 기존 북마크/딥링크 깨짐 위험)
5. **DB 마이그레이션**: hidden_menus 추가만 필요. `npx prisma db push` 또는 마이그레이션 파일 생성

---

## 테스트 결과 (tester) - 2026-04-02 (4~5단계: 메뉴 토글 + 테마/텍스트크기)

### tsc 타입 체크
- 신규 에러 없음 (기존 lucide-react 에러 1건만 존재 -- 무시 대상)

### 검증 항목별 결과

| # | 테스트 항목 | 결과 | 비고 |
|---|-----------|------|------|
| 1 | tsc --noEmit 신규 에러 없음 | 통과 | lucide-react 기존 에러 1건만 |
| 2 | Prisma User 모델 hidden_menus 필드 정상 | 통과 | Json @default("[]") @map("hidden_menus") |
| 3 | preferences API GET에 hidden_menus select | 통과 | route.ts 36행 |
| 4 | preferences API PATCH Zod 스키마에 hidden_menus | 통과 | z.array(z.string()).optional() 19~20행 |
| 5 | preferences API PATCH updateData에 hidden_menus 저장 | 통과 | route.ts 85행 |
| 6 | preference-form MENU_ITEMS 정의 (8개 메뉴) | 통과 | 홈/경기찾기(protected) + 대회/단체/팀/코트/랭킹/커뮤니티 |
| 7 | preference-form 보호 메뉴 비활성 토글+필수 뱃지 | 통과 | protected=true 시 disabled+opacity-50+"필수" |
| 8 | preference-form hiddenMenus state + toggleMenuVisibility | 통과 | 255~348행 |
| 9 | preference-form handleSave에 hidden_menus 전송 | 통과 | 369행 |
| 10 | preference-form loadPreferences에서 hidden_menus 로드 | 통과 | 282행 |
| 11 | preference-form "메뉴 설정" 섹션 UI 렌더링 | 통과 | 650~714행, 토글 스위치+아이콘+라벨 |
| 12 | ThemeSelector 컴포넌트 (다크/라이트/시스템 3선택) | 통과 | 130~183행, localStorage 저장+즉시 반영 |
| 13 | TextSizeSelector 컴포넌트 (기본/큰글씨 2선택) | 통과 | 190~238행, localStorage 저장+즉시 반영 |
| 14 | me API hidden_menus 응답 포함 | 통과 | select+apiSuccess에 hidden_menus 포함 |
| 15 | layout.tsx user state에 hidden_menus 타입 정의 | 통과 | 355행 hidden_menus?: string[] |
| 16 | layout.tsx 사이드네비 hidden_menus 필터링 | 통과 | 424행 .filter(item => !hidden_menus.includes(item.href)) |
| 17 | layout.tsx SlideMenu에 hiddenMenus props 전달 | 통과 | 609행 hiddenMenus={user?.hidden_menus} |
| 18 | slide-menu.tsx hiddenMenus props 타입 정의 | 통과 | 39행 hiddenMenus?: string[] |
| 19 | slide-menu.tsx menuItems hidden_menus 필터링 | 통과 | 129행 .filter(item => !hiddenMenus.includes(item.href)) |
| 20 | 데이터 흐름 일관성 (snake_case 키 매칭) | 통과 | me API(hidden_menus) -> layout user state(hidden_menus) -> 필터링 |

종합: 20개 중 20개 통과 / 0개 실패

---

## 테스트 결과 (tester) - 2026-04-02 맞춤 필터 미동작 5건 수정 후 검증

### tsc 타입 체크
- 신규 에러 없음 (기존 lucide-react 에러 1건만 존재 -- 무시 대상)

### 검증 항목별 결과

| # | 테스트 항목 | 결과 | 비고 |
|---|-----------|------|------|
| 1 | tsc --noEmit 신규 에러 없음 | 통과 | lucide-react 기존 에러 1건만 |
| 2 | 지역 필터 - games API에서 preferred_regions select | 통과 | route.ts 55행 preferred_regions select 확인 |
| 3 | 지역 필터 - preferred_regions 우선, user.city fallback | 통과 | route.ts 66~74행: regions 배열이면 우선 사용, 없으면 city.split(",") |
| 4 | 지역 필터 - tournaments API에서 preferred_regions select | 통과 | route.ts 46행 preferred_regions select 확인 |
| 5 | 지역 필터 - tournaments API에서도 동일 우선순위 적용 | 통과 | route.ts 52~59행: regions 우선, city fallback |
| 6 | 실력 필터 - games API에서 preferred_skill_levels select | 통과 | route.ts 58행 select 확인 |
| 7 | 실력 필터 - listGames에 skillLevels 파라미터 전달 | 통과 | route.ts 134행 skillLevels: preferredSkillLevels 전달 |
| 8 | 실력 필터 - game.ts에 skillLevels where 조건 | 통과 | game.ts 59~61행: skill_level IN 조건 |
| 9 | 요일 필터 - games API에서 preferred_days select | 통과 | route.ts 59행 select 확인 |
| 10 | 요일 필터 - DAY_CODE_MAP 정의 (sun:0~sat:6) | 통과 | route.ts 145~147행 |
| 11 | 요일 필터 - JS 후처리 .filter()로 요일 체크 | 통과 | route.ts 159~167행: getDay()로 요일 추출 후 allowedDows와 비교 |
| 12 | 요일 필터 - scheduled_at 없으면 통과 (필터 안 함) | 통과 | route.ts 163행: !g.scheduled_at → return true |
| 13 | 시간대 필터 - games API에서 preferred_time_slots select | 통과 | route.ts 61행 select 확인 |
| 14 | 시간대 필터 - TIME_SLOT_RANGES 정의 (오전6~12/오후12~18/저녁18~22/심야22~6) | 통과 | route.ts 149~154행 |
| 15 | 시간대 필터 - JS 후처리 .filter()로 시간대 체크 | 통과 | route.ts 170~184행: getHours()로 시간 추출 후 범위 비교 |
| 16 | 시간대 필터 - 심야(night) 자정 넘김 특수 처리 | 통과 | route.ts 180행: start > end이면 hour >= start OR hour < end |
| 17 | 성별 필터 - Prisma User 모델에 preferred_gender 필드 | 통과 | schema.prisma: Json @default("[]") @map("preferred_gender") |
| 18 | 성별 필터 - preferences API GET에 preferred_gender select | 통과 | route.ts 38행 |
| 19 | 성별 필터 - preferences API PATCH Zod 스키마에 preferred_gender | 통과 | z.array(z.string()).optional() 18행 |
| 20 | 성별 필터 - preferences API PATCH updateData에 preferred_gender 저장 | 통과 | route.ts 87행 |
| 21 | 성별 필터 - preference-form GENDER_OPTIONS 정의 | 통과 | 남성부/여성부/혼성부 (male/female/mixed) |
| 22 | 성별 필터 - preference-form 성별 선택 UI + toggleGender + save | 통과 | state(selectedGenders) + toggle + handleSave에 preferred_gender 포함 |
| 23 | 성별 필터 - tournaments API에서 preferred_gender select | 통과 | route.ts 48행 |
| 24 | 성별 필터 - tournaments API에서 listTournaments에 gender 전달 | 통과 | route.ts 83행: gender: preferredGender |
| 25 | 성별 필터 - tournament.ts에 gender where 조건 | 통과 | tournament.ts 247~249행: gender IN 조건 + mode insensitive |
| 26 | 데이터 흐름 - 모든 5개 필터의 UI→API→DB→읽기→적용 연결 | 통과 | preference-form → PATCH → DB → 각 API GET에서 select → 필터 적용 |
| 27 | prefer=true일 때만 필터 동작 | 통과 | games: 46행 if(prefer && !city), tournaments: 36행 if(prefer) |
| 28 | prefer=false이면 필터 무시 | 통과 | prefer 조건 블록 밖이므로 모든 preferred* 변수가 undefined → 필터 미적용 |
| 29 | 빈 배열이면 해당 필터 미적용 | 통과 | 모든 필터에 Array.isArray + .length > 0 체크 후 적용 |
| 30 | 명시적 city 파라미터 우선 (games) | 통과 | route.ts 46행: prefer && !city 조건으로 명시적 city 있으면 맞춤 지역 무시 |

종합: 30개 중 30개 통과 / 0개 실패

---

## 테스트 결과 (tester) - 2026-04-02 맞춤 설정 시스템 전수조사

### 데이터 흐름 추적 결과

각 설정 항목에 대해 다음 흐름을 추적:
```
preference-form.tsx (UI) → /api/web/preferences PATCH (DB 저장) → DB User 필드 → 각 API에서 읽기 → 필터링 적용
```

| # | 설정 항목 | 필드명 | UI 저장 | DB 저장 | 적용 페이지 | 동작 여부 | 비고 |
|---|---------|-------|--------|--------|-----------|---------|------|
| 1 | 종별/디비전 | preferred_divisions | 통과 (361행) | 통과 (74행) | 대회 목록 | 통과 | tournaments API가 preferred_divisions 읽어서 divisions 필터로 전달 |
| 2 | 경기 유형 | preferred_game_types | 통과 (363행) | 통과 (76행) | 경기 목록 | 통과 | games API가 preferred_game_types 읽어서 gameTypes 필터로 전달 |
| 3 | 실력 수준 | preferred_skill_levels | 통과 (367행) | 통과 (81행) | 경기 목록 | **실패** | games API에서 preferred_skill_levels를 전혀 읽지 않음. 저장만 되고 필터에 미사용 |
| 4 | 요일 | preferred_days | 통과 (365행) | 통과 (79행) | 경기/대회 목록 | **실패** | games/tournaments API에서 preferred_days를 전혀 읽지 않음. dashboard에서 표시만 |
| 5 | 시간대 | preferred_time_slots | 통과 (366행) | 통과 (80행) | 경기 목록 | **실패** | games API에서 preferred_time_slots를 전혀 읽지 않음. 저장만 됨 |
| 6 | 게시판 카테고리 | preferred_board_categories | 통과 (362행) | 통과 (75행) | 커뮤니티 | 통과 | community API가 preferred_board_categories 읽어서 category IN 필터 적용 |
| 7 | 지역 | preferred_regions | 통과 (364행) | 통과 (78행) | 경기/대회 목록 | **실패** | games API는 user.city(프로필 도시)만 읽음, preferred_regions를 무시. tournaments API도 동일 |
| 8 | 성별 | preferred_gender | N/A | N/A | N/A | **미구현** | DB 필드 자체가 없음. Prisma 스키마에 preferred_gender 컬럼 없음. UI에도 성별 선택 섹션 없음 |
| 9 | 메뉴 토글 | hidden_menus | 통과 (369행) | 통과 (85행) | 사이드바/슬라이드메뉴 | 통과 | layout.tsx + slide-menu.tsx에서 필터링 적용 |
| 10 | 맞춤 필터 ON/OFF | prefer_filter_enabled | 통과 (371행) | 통과 (83행) | 전체 | 통과 | me API 응답 -> layout.tsx -> setLoggedIn -> preferFilter context -> 각 페이지에서 prefer=true 전달 |

### 상세 분석: 동작하는 항목 (6개)

**1. preferred_divisions (종별/디비전)**
- UI: preference-form.tsx 361행에서 PATCH body에 포함
- DB: preferences API 74행에서 updateData에 저장
- 적용: tournaments API 40~55행에서 user.preferred_divisions 조회 -> listTournaments에 divisions 파라미터로 전달
- 서비스: tournament.ts 232~241행에서 OR 조건으로 divisions 필터링
- 흐름: 완전 연결됨

**2. preferred_game_types (경기 유형)**
- UI: preference-form.tsx 363행에서 PATCH body에 포함
- DB: preferences API 76행에서 updateData에 저장
- 적용: games API 56~61행에서 user.preferred_game_types 조회 -> listGames에 gameTypes 파라미터로 전달
- 서비스: game.ts 44~46행에서 game_type IN 조건으로 필터링
- 흐름: 완전 연결됨

**6. preferred_board_categories (게시판 카테고리)**
- UI: preference-form.tsx 362행에서 PATCH body에 포함
- DB: preferences API 75행에서 updateData에 저장
- 적용: community API 42~49행에서 user.preferred_board_categories 조회 -> category IN 필터 적용
- 흐름: 완전 연결됨

**9. hidden_menus (메뉴 토글)**
- 이전 테스트에서 검증 완료. 완전 연결됨.

**10. prefer_filter_enabled (맞춤 필터 ON/OFF)**
- me API에서 prefer_filter_enabled 반환 -> layout.tsx에서 setLoggedIn(true, preferEnabled)로 context 설정
- 각 페이지(games-content, tournaments-content, community-content)에서 preferFilter가 true일 때만 prefer=true 쿼리 전달
- OFF 시 prefer 파라미터가 없으므로 모든 필터 무시됨
- 흐름: 완전 연결됨

### 상세 분석: 미동작 항목 (4개)

**3. preferred_skill_levels (실력 수준) -- 저장만 되고 필터 미적용**
- 저장: preferences API에서 DB에 정상 저장됨
- 끊기는 곳: `/api/web/games/route.ts`에서 user 조회 시 `preferred_skill_levels`를 select하지 않음 (46~47행: city와 preferred_game_types만 select)
- game.ts 서비스에도 skillLevels 필터 파라미터가 없음
- home.ts의 추천 경기에서는 과거 신청 이력의 skill_level을 사용하지만, 맞춤 설정의 preferred_skill_levels는 사용하지 않음
- 수정 방안: games API에서 preferred_skill_levels도 select -> listGames에 skillLevels 파라미터 추가 -> game.ts에서 skill_level IN 조건 추가

**4. preferred_days (요일) -- 저장만 되고 필터 미적용**
- 저장: preferences API에서 DB에 정상 저장됨
- 끊기는 곳: games/tournaments API 모두 preferred_days를 읽지 않음
- dashboard API에서 읽어서 응답에 포함하지만, 표시 용도일 뿐 필터링에 미사용
- 수정 방안: games API에서 preferred_days 조회 -> scheduled_at의 요일 추출 -> DOW 조건 필터 추가 (구현 복잡도 높음: Prisma에서 요일 추출 쿼리 필요)

**5. preferred_time_slots (시간대) -- 저장만 되고 필터 미적용**
- 저장: preferences API에서 DB에 정상 저장됨
- 끊기는 곳: games API에서 preferred_time_slots를 전혀 읽지 않음
- 수정 방안: games API에서 preferred_time_slots 조회 -> scheduled_at의 시간 추출 -> 시간대별 범위 조건 추가 (구현 복잡도 높음)

**7. preferred_regions (지역) -- 저장만 되고 필터 미적용**
- 저장: preferences API에서 DB에 정상 저장됨
- 끊기는 곳: games API 44~53행에서 `user.city` (프로필의 도시)만 읽고, `preferred_regions`는 select하지 않음. tournaments API도 동일하게 `user.city`만 사용
- 현재 동작: prefer=true 시 user.city("서울,경기" 같은 프로필 도시)로 필터링
- 문제: 맞춤 설정에서 별도로 지역(17개 광역시/도)을 선택해도 무시됨. 프로필의 도시만 사용됨
- 수정 방안: games/tournaments API에서 preferred_regions를 추가 select -> user.city 대신 preferred_regions 우선 사용

**8. preferred_gender (성별) -- 완전 미구현**
- DB 필드: Prisma 스키마에 preferred_gender 컬럼 없음
- UI: preference-form.tsx에 성별 선택 섹션 없음 (activeGender state가 있지만 종별 탭 전환용으로만 사용)
- API: preferences API에 gender 관련 Zod 스키마/로직 없음
- 수정 방안: (1) Prisma 스키마에 preferred_gender Json 필드 추가 (2) preferences API에 Zod 스키마 추가 (3) preference-form에 성별 선택 UI 추가 (4) games/tournaments API에서 gender 필터 적용

### 종합

| 구분 | 개수 | 항목 |
|------|------|------|
| 정상 동작 | 5개 | 종별, 경기유형, 게시판, 메뉴토글, ON/OFF토글 |
| 저장만 됨 (필터 미적용) | 4개 | 실력수준, 요일, 시간대, 지역 |
| 완전 미구현 | 1개 | 성별 |

10개 중 5개 동작 / 4개 저장만 / 1개 미구현

### 수정 요청

| 요청자 | 파일명 | 문제 설명 | 상태 |
|--------|-------|----------|------|
| tester | src/app/api/web/games/route.ts | preferred_regions를 읽지 않음. user.city 대신 preferred_regions 우선 사용하도록 수정 필요 | 대기 |
| tester | src/app/api/web/games/route.ts + src/lib/services/game.ts | preferred_skill_levels를 읽지 않음. select에 추가 + 서비스에 skillLevels 필터 파라미터 추가 필요 | 대기 |
| tester | src/app/api/web/games/route.ts | preferred_days를 읽지 않음. 요일 기반 필터 구현 필요 (구현 복잡도 높음) | 대기 |
| tester | src/app/api/web/games/route.ts | preferred_time_slots를 읽지 않음. 시간대 기반 필터 구현 필요 (구현 복잡도 높음) | 대기 |
| tester | src/app/api/web/tournaments/route.ts | preferred_regions를 읽지 않음. user.city 대신 preferred_regions 우선 사용하도록 수정 필요 | 대기 |
| tester | 전체 (스키마+API+UI) | preferred_gender 완전 미구현. DB 필드부터 UI까지 전체 구현 필요 | 대기 |

---

## 전체 프로젝트 현황 대시보드 (2026-04-01)

### 규모 요약
| 항목 | 수치 |
|------|------|
| 웹 페이지 (web) | 84개 (+6: partner-admin 5P + venues 1P + invite 1P) |
| 관리자 페이지 (admin) | 16개 |
| Prisma 모델 | 73개 |
| Web API | 111개 라우트 (+1: tournaments/calendar) |

---

## 작업 로그 (최근 10건)
| 날짜 | 담당 | 작업 | 결과 |
|------|------|------|------|
| 04-01 | developer | #7 파트너셀프서비스+#8 대관+#9 카페이전 (API7+페이지7, 14파일) | 완료 |
| 04-01 | developer | #1~#6 역할체계+단체승인제 (타입에러1건 수정) | 완료 |
| 04-01 | developer | 네이티브 광고 시스템 MVP (스키마4모델+API4+Admin2P+광고컴포넌트+삽입3곳, 13파일) | 완료 |
| 04-01 | developer | Organization 3단계 계층 (스키마+API7개+관리4P+공개3P+기존연결, 15파일) | 완료 |
| 03-31 | developer | #8 검색코트 + #9 알림설정 + #10 PWA배너 (7파일) | 완료 |
| 03-31 | developer | 비밀번호 재설정 + 회원 탈퇴 (8파일) | 완료 |
| 03-31 | pm | main 머지 + 푸시 (Phase 5 성능 + 소셜) | 완료 |
| 03-31 | developer | #16관리자+#17검색+#18알림 (차트/발송/유저검색/최근검색/삭제) | 완료 |
| 03-31 | developer | 경기 수정/취소 + 팀 수정/해산 API+UI (5파일) | 완료 |
| 03-31 | developer | #21소셜+#22이미지/댓글좋아요+#23시즌+#24admin보강 (8파일) | 완료 |
