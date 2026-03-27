# 배운 교훈
<!-- 담당: 전체 에이전트 | 최대 30항목 -->
<!-- 삽질 경험, 다음에 피해야 할 것, 효과적이었던 접근법을 기록 -->

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
