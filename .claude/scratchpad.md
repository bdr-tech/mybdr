# 작업 스크래치패드

## 현재 작업
- **요청**: '선호 설정' → '맞춤 설정' 용어 통일 + 카테고리 분리 + 맞춤설정 기능 대폭 강화
- **상태**: 1~3단계 + 커뮤니티 버그 수정 완료 ✅ → 4~5단계 대기
- **현재 담당**: pm

### 구현 기록

구현한 기능: 4~5단계 — 메뉴 토글 기능 (보고 싶은 메뉴 켜기/끄기) + 추가 설정 통합 (테마/텍스트 크기)

| 파일 경로 | 변경 내용 | 신규/수정 |
|----------|----------|----------|
| prisma/schema.prisma | User 모델에 hidden_menus Json 필드 추가 (@default("[]") @map("hidden_menus")) | 수정 |
| src/app/api/web/preferences/route.ts | GET/PATCH에 hidden_menus 필드 추가 (Zod 스키마 + select + updateData) | 수정 |
| src/app/api/web/me/route.ts | hidden_menus 필드를 select/응답에 추가 (layout에서 메뉴 필터링에 사용) | 수정 |
| src/components/shared/preference-form.tsx | 메뉴 토글 섹션 + ThemeSelector + TextSizeSelector 3개 섹션 추가 | 수정 |
| src/app/(web)/layout.tsx | 사이드네비에서 hidden_menus 필터링 + SlideMenu에 hiddenMenus props 전달 | 수정 |
| src/components/shared/slide-menu.tsx | hiddenMenus props 추가 + menuItems 필터링 | 수정 |

tester 참고:
- 맞춤 설정 페이지(/profile/preferences)에서 "메뉴 설정" 섹션 확인: 8개 메뉴 토글 표시, 홈/경기찾기는 "필수" 뱃지 + 비활성 토글
- 메뉴 숨기기 테스트: 랭킹/단체 등을 끄고 저장 → PC 사이드네비 + 모바일 슬라이드 메뉴에서 해당 메뉴 사라지는지 확인
- 테마 설정: 다크/라이트/시스템 3가지 선택 → 즉시 반영되는지 확인
- 텍스트 크기: 기본/큰 글씨 2가지 선택 → 즉시 반영되는지 확인
- 주의: prisma generate가 필요 (개발서버가 엔진 파일을 잠그고 있어 실행 실패 — 개발서버 재시작 후 npx prisma generate 실행 필요)
- 주의: hidden_menus DB 컬럼이 아직 없으므로 npx prisma db push도 필요

주의사항 (reviewer용):
- 보호 메뉴(홈, 경기찾기)는 protected: true로 토글 비활성화 + opacity-50 처리
- 테마/텍스트 크기는 localStorage만 사용 (DB 저장 불필요)

#### 수정 이력
| 회차 | 날짜 | 수정 내용 | 수정 파일 | 사유 |
|------|------|----------|----------|------|
| 1차 | 2026-04-02 | handleSave에서 mode="settings"일 때 저장 성공 후 window.location.reload() 추가 | preference-form.tsx | PM 요청: 메뉴 설정 저장 후 사이드바에 즉시 반영 안 되는 문제 해결
- hidden_menus는 DB에 JSON 배열로 저장, slug(href) 기반 (예: ["/rankings", "/organizations"])

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
