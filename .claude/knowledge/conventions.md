# 코딩 규칙 및 스타일
<!-- 담당: developer, reviewer | 최대 30항목 -->

### [2026-04-17] 에이전트 호출 최소화 기준 (토큰 절약)
- **분류**: convention
- **내용**: 불필요한 Agent 호출 방지. 각 Agent는 자체 컨텍스트 로드로 토큰 소비가 크므로 PM 직접 처리 가능한 건 직접.
- **호출 기준**:

| 담당 | 조건 |
|------|------|
| **PM 직접** | 파일 1~2개 단순 수정, grep/read 1~2회, DB 조회 1회성, 스크립트 1개 작성+실행 |
| **Explore** | 파일 3개 이상 검색, 키워드 애매, 여러 경로에서 교차 확인 필요 |
| **planner-architect** | 구조적 결정, 다수 영향 분석, 새 기능 설계, decisions.md 등재 필요 |
| **developer** | 2파일 이상 연계 수정, 비즈니스 로직, 복잡한 타입 리팩토링 |
| **debugger** | 30분+ 삽질 예상, 에러 패턴 errors.md 등재 필요, 재발 위험 |
| **tester+reviewer** | 파일 3개+ 수정 시 병렬. 소규모는 tester만 or 생략(tsc 통과만으로) |

- **잘못된 예**: "grep 한 번이면 끝나는데 Explore 호출", "한 줄 수정에 developer 호출"
- **권장 패턴**: 먼저 PM이 파일 확인 → 복잡하면 Agent. 무조건 Agent부터 X

### [2026-04-17] 일회성 DB 스크립트 템플릿 재사용
- **분류**: convention
- **내용**: `scripts/_templates/` 폴더의 3가지 템플릿 활용 — `verify-tournament`, `backfill-players`, `merge-teams`
- **패턴**: 템플릿 복사 → 파라미터(TOURNAMENT_ID 등) 교체 → dry-run → `--execute` → 완료 후 삭제
- **원칙**: DELETE 금지, UPDATE only, 트랜잭션 + 사전/사후 카운트

### [2026-04-17] 공식 기록 쿼리 — `officialMatchWhere` 유틸 필수 사용
- **분류**: convention
- **내용**: "이미 치러진 공식 경기만 집계해야 하는" 쿼리는 `src/lib/tournaments/official-match.ts`의 3함수 중 맥락에 맞는 것 사용
  1. **`officialMatchWhere(extra?)`** — 표준 (대부분 이거). status `[completed, live]` + `scheduledAt <= NOW()` + `scheduledAt IS NOT NULL`
  2. **`officialMatchNestedFilter()`** — MatchPlayerStat → tournamentMatch 조인용 (getPlayerStats 패턴)
  3. **`pastOrOngoingSchedule()`** — status가 특수할 때 (기존에 `in_progress` 포함 등). scheduledAt 가드만 반환
  4. **`OFFICIAL_MATCH_SQL_CONDITION`** — raw SQL용 상수 (tm alias 기준)
- **적용 대상**: 순위표, 선수 커리어/승률, 팀 승패 집계, 팀 최근경기, 서브도메인 결과
- **적용 제외**: 대진표/일정 뷰(예정 경기 필요), admin 편집/생성/CRUD, 기록원/심판 API, seeding/builder
- **이유**: Flutter 테스트 데이터(미래 scheduledAt + status=live)가 공식 집계 오염 방어. 3조건 중 1개라도 누락 시 `id=120` 같은 버그 재발
- **참조**: decisions.md "공식 기록 가드 전역 적용"

### [2026-04-16] sticky 테이블 셀 규칙 — 불투명 배경 + z-10 쌍
- **분류**: convention
- **내용**: `<td className="sticky left-0 ...">` 같은 sticky 셀은 **반드시 두 가지 같이 적용**:
  1. **불투명 배경** — `bg-inherit` 사용 시 부모 `<tr>` 배경도 불투명이어야 함. zebra stripe는 `color-mix(in srgb, var(--color-card), #7f7f7f 6%)`로 불투명화
  2. **명시적 z-index** — `z-10` 클래스 (기본 auto는 스크롤 중인 셀 아래 깔림)
- **예**: `<td className="sticky left-0 z-10 bg-inherit ...">`
- **배경 불투명화 상수 패턴**:
  ```tsx
  const ROW_EVEN_BG = "var(--color-card)";
  const ZEBRA_BG = "color-mix(in srgb, var(--color-card), #7f7f7f 6%)";
  ```
- **참조**: errors.md "sticky 셀 가로 스크롤 겹침"

### [2026-04-16] 프린트 CSS 규칙 — 표준 @page 키워드 + table-layout: fixed
- **분류**: convention
- **내용**: `@media print` 블록 규칙:
  1. `@page { size: A4 landscape; margin: 8mm; }` **표준 키워드만 사용** (297mm 치수 강제 ✗)
  2. `html, body { width: ... !important }` 같은 프린트 레이아웃 강제 **금지** (Chrome PDF 메타데이터 충돌)
  3. 프린트 테이블은 `table-layout: fixed` + **th/td 모두 text-align 명시** (기본값 불일치 방지) + **th:nth-child(n)과 td:nth-child(n) 폭 둘 다 제어**
  4. 가상 프린터(Hancom PDF 등) 한계는 코드로 해결 불가 → **UI 안내 배너**로 대체
- **참조**: errors.md "프린트 th vs td 정렬 깨짐", lessons.md "브라우저 프린트 API 한계"

### [2026-04-16] 모바일/데스크톱 듀얼 렌더 패턴 (`sm:hidden` + `hidden sm:flex`)
- **분류**: convention
- **내용**: 가로폭 제약이 심한 레이아웃(예: 5단 가로 스코어카드)은 **모바일/데스크톱 별도 렌더**
  ```tsx
  <div className="sm:hidden">{/* 모바일 2행 */}</div>
  <div className="hidden sm:flex">{/* 데스크톱 5단 */}</div>
  ```
- **중복 최소화**: 공통 요소(TeamBlock/ScoreDisplay/CenterInfoBlock)를 **서브 컴포넌트 추출**
- **언제 쓰나**: Tailwind flex-wrap/responsive gap으로 해결 안 되는 구조적 차이(행 수가 다름)일 때
- **참조**: lessons.md "모바일 UI는 데스크톱 확대에 희생되면 안 됨"

### [2026-04-16] 플레이스홀더 기호는 짧은 hyphen `-` 통일 (em-dash `—` 금지)
- **분류**: convention
- **내용**: 테이블에서 값이 없을 때 `-` (hyphen, U+002D) 하나만 사용. `—` (em-dash, U+2014) 금지
- **이유**: DNP 행과 기타 빈 스탯 행이 **동일한 시각 패턴**으로 보여야 혼동 없음
- **적용 범위**: 화면 UI + 프린트 영역 + 쿼터 필터 showPlaceholder 모두

### [2026-04-14] 경기결과 실시간 집계 패턴 (Team.wins 필드 무시)
- **분류**: convention
- **발견자**: developer
- **내용**: Team.wins/losses/draws 필드는 자동 갱신되지 않으므로 **절대 사용 금지**. 대신 매 쿼리마다 tournament_matches 테이블에서 집계한다. (1) 집계 대상 status: "completed" + "live" 둘 다 포함 (진행 중 경기도 현재 스코어 반영). (2) 적용 위치: public-standings, hotTeam, 팀 상세 페이지, 랭킹 모두 동일 패턴. (3) 무승부는 농구에 없으므로 제외.  **패턴**:
  ```ts
  const matches = await prisma.tournamentMatch.findMany({
    where: { tournamentId, status: { in: ["completed", "live"] } },
    select: { homeTeamId, awayTeamId, homeScore, awayScore },
  });
  // 팀별로 wins/losses 집계
  ```
- **참조횟수**: 0

### [2026-04-14] API 응답 snake_case → camelCase 자동 변환 (fetcher 래퍼)
- **분류**: convention
- **발견자**: developer
- **내용**: `apiSuccess()`는 응답을 snake_case로 자동 변환해 반환한다(래핑 없이 바로). 클라이언트에서 camelCase로 접근하려면 **fetcher 레벨에서 convertKeysToCamelCase() 적용**. 각 컴포넌트마다 `data.career_averages` vs `data.careerAverages` 고민할 필요 없음. **패턴**:
  ```ts
  // src/lib/utils/fetcher.ts
  export async function fetcher<T>(url: string): Promise<T> {
    const res = await fetch(url);
    const json = await res.json();
    return convertKeysToCamelCase(json) as T;
  }
  ```
- **금지**: 응답을 `.data.X`로 접근 (apiSuccess에 data 래핑 없음). errors.md "apiSuccess 응답에 .data로 접근" 참조.
- **참조횟수**: 0

### [2026-04-14] 팀 카드 공통 컴포넌트 (TeamCard) 재사용
- **분류**: convention
- **발견자**: developer
- **내용**: 팀 목록 페이지 + 대회 상세 "참가팀" 탭에서 같은 TeamCard 컴포넌트 사용. (1) 로고 이미지 없으면 primaryColor 배경 + city 텍스트로 대체. (2) 반응형 그리드: 모바일 2열 / 태블릿(md) 3열 / PC(lg) 4열. (3) 카드 전체가 `<Link href="/teams/{id}">`이므로 내부에 다시 Link 중첩 금지.
- **참조횟수**: 0

### [2026-04-12] 테마 반응형 배경 위 텍스트는 `--color-on-*` 변수 사용 (text-white 금지)
- **분류**: convention
- **발견자**: pm
- **내용**: CSS 변수가 라이트/다크 테마마다 값이 바뀌는 배경색(`var(--color-accent)`, `var(--color-primary)` 등) 위에 올라가는 텍스트는 **절대 `text-white` / `color: '#fff'` 같은 고정 색상을 쓰지 않는다**. 반드시 대응하는 `--color-on-*` 변수를 사용해 테마 전환 시 자동으로 대비가 유지되도록 한다. 이미 정의된 변수: `--color-on-primary` (primary 배경용), `--color-on-accent` (accent 배경용 — 2026-04-12 추가). 새로운 테마 반응형 배경 변수를 추가할 때는 동시에 `--color-on-*` 쌍 변수를 globals.css의 `:root`(라이트)와 `html.dark`(다크) 양쪽에 정의한다. **금지 패턴**: `bg-[var(--color-accent)] text-white`, `{ backgroundColor: 'var(--color-accent)', color: '#fff' }`. **올바른 패턴**: `bg-[var(--color-accent)]` + `style={{ color: 'var(--color-on-accent)' }}`. 이 규칙을 어기면 다크모드에서 "흰 배경 + 흰 글씨"가 되어 버튼이 안 보이게 된다 (실제 발생한 버그).
- **참조횟수**: 0

### [2026-03-22] 디자인 시스템 색상 체계
- **분류**: convention
- **발견자**: planner-architect
- **내용**: Primary #E31B23, Navy #1B3C87, Info #0079B9. 다크모드 기본. 모든 neutral은 쿨 그레이(R=G=B). 핑크/살몬/코랄 절대 금지.
- **참조횟수**: 5

### [2026-03-22] 아이콘 라이브러리
- **분류**: convention
- **발견자**: developer
- **내용**: Material Symbols Outlined 사용. lucide-react 완전 제거됨. 활성 아이콘 FILL 1.
- **참조횟수**: 3

### [2026-03-22] 폰트 체계
- **분류**: convention
- **발견자**: developer
- **내용**: 한글 본문 Pretendard, 영문 제목 Space Grotesk. CDN 로드.
- **참조횟수**: 2

### [2026-03-22] 버튼/컴포넌트 스타일
- **분류**: convention
- **발견자**: developer
- **내용**: 버튼 border-radius 4px (pill 9999px 금지). 카드 bg-card border-border rounded-lg. 호버 active:scale-95.
- **참조횟수**: 2

### [2026-03-22] 레이아웃 브레이크포인트
- **분류**: convention
- **발견자**: developer
- **내용**: lg(1024px) 기준. 데스크탑 사이드바 w-64 + sidebar-scaled(0.96). 모바일 헤더 h-16 + 하단네비 h-16.
- **참조횟수**: 2

### [2026-03-23] 페이지 리디자인 공통 패턴
- **분류**: convention
- **발견자**: pm
- **내용**: 모든 리디자인 시 "API 유지, UI만 변경" 원칙. 2열 레이아웃(lg:grid-cols-12, 좌 col-span-8 + 우 col-span-4). 섹션 헤더에 빨간/파란 세로 막대(w-1.5 h-6). 모바일은 1열(사이드바 하단). 히어로 배너에 그라디언트 배경. 클라이언트 사이드 페이지네이션(서버 API 변경 회피).
- **참조횟수**: 6

### [2026-03-23] DB 미지원 기능 처리 규칙
- **분류**: convention
- **발견자**: pm
- **내용**: DB에 없는 기능(좋아요/팔로우/티어 등)은 UI만 배치하고 동작 미구현. placeholder("-", "0") 사용. DB 스키마 변경은 별도 작업으로 분리. 이미지 없으면 CSS 그라디언트 또는 이니셜로 대체.
- **참조횟수**: 5

### [2026-03-28] BDR 디비전 체계 (3단계 계층)
- **분류**: convention
- **발견자**: developer
- **내용**: 1단계 성별(남성부/여성부) → 2단계 종별(일반부/유청소년/대학부/시니어) → 3단계 디비전(D3~D8/하모니~i4/U1~U3/S1~S3). 여성부는 코드 뒤에 W 추가. 공통 상수: src/lib/constants/divisions.ts. 자연어→표준코드 매핑은 scripts/migrate-divisions.ts 참조.
- **참조횟수**: 0

### [2026-03-23] 가로 스크롤 + 그리드 반응형 패턴
- **분류**: convention
- **발견자**: developer
- **내용**: 모바일에서 가로 스크롤(flex overflow-x-auto no-scrollbar), 데스크탑에서 N열 그리드(md:grid md:grid-cols-N md:overflow-visible). 카드 min-w-[Npx] md:min-w-0으로 스크롤/그리드 전환.
- **참조횟수**: 4

### [2026-03-28] 대회 상태 4종 통일 규칙
- **분류**: convention
- **발견자**: pm (사용자 지시)
- **내용**: 프로젝트 전체에서 대회 상태를 4종으로만 표시: **준비중**(draft/upcoming), **접수중**(registration/active/open 등), **진행중**(in_progress/live/ongoing 등), **종료**(completed/ended/cancelled 등). 공통 상수: src/lib/constants/tournament-status.ts
- **참조횟수**: 0

### [2026-03-28] admin UI 공통 패턴 (서버page + 클라이언트content)
- **분류**: convention
- **발견자**: developer
- **내용**: admin 페이지는 page.tsx(서버 컴포넌트, Prisma 쿼리+직렬화) + admin-{name}-content.tsx(클라이언트, AdminStatusTabs+테이블+AdminDetailModal) 패턴으로 통일. 테이블 3~4칸, 행 클릭 시 중앙 플로팅 모달, 상태별 탭 필터링. 공통 컴포넌트: AdminPageHeader, AdminDetailModal, AdminStatusTabs.
- **참조횟수**: 0

### [2026-03-28] 카드 컴팩트화 패턴
- **분류**: convention
- **발견자**: developer
- **내용**: 경기/대회/팀 카드 공통 구조 — 이미지 영역(h-20 lg:h-28, 유형별 그라디언트/Places 사진) + 정보 영역(p-3, 2줄: 제목+현황 / 금액+버튼). 이미지 좌상단 유형뱃지, 우하단 장소+시간 뱃지(bg-black/50 backdrop-blur). 텍스트 최소 text-xs(12px).
- **참조횟수**: 0

### [2026-04-02] NBA 2K UI 개편 6대 준수 원칙
- **분류**: convention
- **발견자**: pm (사용자 지시)
- **내용**: 
  1. 기존의 프로젝트 기능은 모두 100% 보존할 것.
  2. UX 흐름도 역시 기존과 동일하게 유지할 것.
  3. UI 외적인 로직이나 흐름 변경이 필요한 부분은 반드시 동의 후 작업 진행.
  4. 모바일 퍼스트 반응형 웹 원칙: 화면 여백을 많이 남기지 않고 공간을 밀도 있게 활용.
  5. 라이트모드/다크모드를 모두 지원하며 쉽게 전환할 수 있도록 설계.
  6. 레이아웃: PC(lg 이상) 화면은 NBA 2K 콘솔 메뉴처럼 다중 열 그리드로 설계하되, 모바일은 기존의 1열 스크롤 구조가 적합하므로 이를 유지.
- **참조횟수**: 0

