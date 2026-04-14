# 배운 교훈
<!-- 담당: 전체 에이전트 | 최대 30항목 -->
<!-- 삽질 경험, 다음에 피해야 할 것, 효과적이었던 접근법을 기록 -->

### [2026-04-15] DB 마이그레이션 `--accept-data-loss`는 타 브랜치 데이터를 파괴할 수 있다
- **분류**: lesson
- **발견자**: pm
- **내용**: `prisma db push --accept-data-loss`는 현재 schema.prisma에 없는 테이블을 drop한다. 브랜치마다 schema가 다르게 진화 중일 때(예: subin-referee 브랜치에 Referee 시스템 테이블 신설, 다른 브랜치엔 없음) 다른 브랜치 데이터가 통째로 날아간다. 1시간 이상 복구 작업 발생. 개발 DB라도 다른 브랜치 데이터는 소중한 작업물.
- **교훈**: 
  1. db push 전에 `prisma migrate diff` 또는 `db pull`로 현재 DB 상태와 schema 차이를 먼저 확인
  2. `--accept-data-loss`는 "삭제를 전부 허용" 플래그 — 쓰는 순간 안전장치 없음
  3. 컬럼 추가 수준이면 `migrate dev --create-only`로 SQL 먼저 보고 실행
  4. 운영 DB는 CLAUDE.md에 명시된 대로 db push 절대 금지
- **참조**: errors.md "prisma db push --accept-data-loss로 타 브랜치 테이블 drop 사고"
- **참조횟수**: 0

### [2026-04-14] snake_case/camelCase 변환 버그는 fetcher 래퍼로 근본 해결
- **분류**: lesson
- **발견자**: developer
- **내용**: apiSuccess가 응답을 snake_case로 자동 변환하는 걸 모르고 컴포넌트에서 camelCase(`data.careerAverages`)로 접근 → undefined → fallback만 표시 → "데이터 안 보인다" 버그. errors.md "apiSuccess 응답에 .data로 접근"과 같은 유형이 3번째 재발.
- **교훈**:
  1. 컴포넌트마다 snake/camel 매핑하지 말고 **fetcher에서 convertKeysToCamelCase() 한 번만** 적용
  2. 서버는 snake_case(Flutter 호환), 클라이언트는 camelCase(JS 관례) — 경계는 fetcher
  3. 같은 버그가 3번 이상 재발하면 개별 수정 대신 구조적 해결(공통 래퍼)로 전환
- **참조**: errors.md "apiSuccess 응답에 .data로 접근", conventions.md "API 응답 snake_case → camelCase 자동 변환"
- **참조횟수**: 0

### [2026-03-23] YouTube API: Search API보다 playlistItems 페이지네이션이 정확하고 저렴
- **분류**: lesson
- **발견자**: pm
- **내용**: YouTube Search API의 `order=viewCount`는 내부 알고리즘으로 정렬하여 실제 조회수와 다를 수 있음. playlistItems(최대 3페이지=150개) + Videos API로 실제 viewCount를 조회한 뒤 서버에서 정렬하는 방식이 정확하고 API 쿼터도 97% 절약 (200→6쿼터/호출). 단, playlistItems는 최근 업로드 순이므로 채널이 쇼츠를 많이 올리면 인기 긴 영상이 밀릴 수 있어 페이지네이션 필수.
- **적용**: src/app/api/web/youtube/recommend/route.ts
- **참조**: errors.md "YouTube Search API" / decisions.md "YouTube 인기 영상"
- **참조횟수**: 1

### [2026-03-23] 라이트/다크 테마 전환: CSS 변수와 HTML 클래스를 동시에 관리해야 함
- **분류**: lesson
- **발견자**: developer
- **내용**: 다크모드를 기본으로 구현한 뒤 라이트모드를 추가할 때 3가지를 동시에 처리해야 함: (1) globals.css에 html.light 변수 블록 정의, (2) ThemeToggle에서 dark/light 클래스 동시 토글, (3) 컴포넌트의 하드코딩 색상을 CSS 변수로 교체. 하나라도 빠지면 라이트모드가 부분적으로만 작동함.
- **예방**: 새 컴포넌트 작성 시 하드코딩 색상(#131313 등) 절대 금지. 반드시 var(--color-*) 사용.
- **참조**: errors.md "라이트모드 CSS 변수 미적용"
- **참조횟수**: 1

### [2026-03-28] ISR 캐시 무효화: getWebSession()의 cookies()가 원인
- **분류**: lesson
- **발견자**: planner-architect
- **내용**: Next.js App Router에서 `revalidate = 60`을 설정해도, 서버 컴포넌트에서 `getWebSession()` → `cookies()`를 호출하면 Next.js가 "동적 페이지"로 판단하여 ISR을 완전히 무효화함. 매 요청마다 서버 렌더링이 실행되어 성능 병목 발생. 해결: 홈페이지에서 getWebSession()을 제거하고, 비로그인 공통 데이터만 서버 프리페치. 로그인 개인화는 클라이언트 SWR로 처리.
- **적용**: src/app/(web)/page.tsx — ISR 활성화 (ƒ Dynamic → ○ Static)
- **참조횟수**: 0

### [2026-03-28] DB 리전이 성능 병목: Supabase 인도 뭄바이 → 한국 리전 이전
- **분류**: lesson
- **발견자**: planner-architect
- **내용**: Supabase DB가 ap-south-1(인도 뭄바이)에 있으면, 한국에서 쿼리 1개당 150~300ms 네트워크 지연 발생. 홈페이지에서 6~8개 쿼리 실행 시 이것만으로 1.2~1.8초 낭비. 코드 최적화보다 DB 리전 변경이 근본 해결. 한국 리전으로 이전 후 쿼리당 ~20ms로 개선.
- **참조횟수**: 0
