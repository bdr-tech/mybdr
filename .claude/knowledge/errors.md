# 에러 및 함정 모음
<!-- 담당: debugger, tester | 최대 30항목 -->
<!-- 이 프로젝트에서 반복되는 에러 패턴, 함정, 주의사항을 기록 -->

### [2026-03-23] YouTube Search API order=viewCount 정렬 부정확
- **분류**: error
- **발견자**: pm (디버깅 과정에서)
- **내용**: YouTube Search API에 `order=viewCount`를 지정해도 실제 조회수 순서와 다른 결과를 반환함. 실제 10,092뷰 영상이 1,518뷰 영상보다 낮은 순위로 나옴.
- **해결**: Search API 대신 playlistItems API로 최대 150개(3페이지)를 가져와서 Videos API로 실제 조회수를 조회한 뒤 서버에서 정렬.
- **쿼터 비교**: Search API 200쿼터/호출 vs playlistItems+Videos 6쿼터/호출
- **참조**: decisions.md "YouTube 인기 영상" / lessons.md "YouTube API"
- **참조횟수**: 1

### [2026-03-23] 라이트모드 CSS 변수 미적용 (html.light 클래스 누락)
- **분류**: error
- **발견자**: developer
- **내용**: globals.css에 `html.light { }` 블록으로 라이트모드 변수를 정의했는데, ThemeToggle 컴포넌트가 `dark` 클래스만 제거하고 `light` 클래스를 추가하지 않아서 라이트모드 변수가 적용되지 않았음. 또한 layout.tsx/slide-menu.tsx에 하드코딩된 다크 색상(#131313, #111111 등)이 30곳 이상 있어서 테마 전환 시 색상이 안 바뀌는 문제도 있었음.
- **해결**: (1) ThemeToggle에서 dark/light 클래스 동시 토글. (2) layout.tsx, slide-menu.tsx의 하드코딩 색상을 CSS 변수로 교체.
- **예방**: 새 컴포넌트 작성 시 하드코딩 색상 대신 반드시 CSS 변수(var(--color-*)) 사용.
- **참조**: lessons.md "라이트/다크 테마 전환"
- **참조횟수**: 1

### [2026-03-23] admin 페이지 레이아웃 이중 적용 (로드 안 됨)
- **분류**: error
- **발견자**: debugger
- **내용**: admin이 `(web)` 라우트 그룹 안에 있어서 `(web)/layout.tsx` 사이드바+헤더+하단네비가 admin에도 적용됨. admin/layout.tsx의 AdminSidebar와 겹쳐서 콘텐츠가 밀리고 로드 안 되는 것처럼 보임.
- **해결**: `src/app/(web)/admin/` → `src/app/(admin)/admin/`으로 라우트 그룹 분리.
- **예방**: 독립 레이아웃이 필요한 섹션(admin, auth 등)은 별도 라우트 그룹으로 분리.
- **참조횟수**: 0

### [2026-03-25] apiSuccess 응답에 .data로 접근하는 버그 (존재하지 않는 래핑)
- **분류**: error
- **발견자**: debugger
- **내용**: `apiSuccess()`는 전달받은 객체를 snake_case 변환 후 **직접** JSON 응답으로 반환한다. `{ data: ... }` 래핑이 없다. 그런데 클라이언트에서 `response.value.data.teams` 같이 `.data`를 한 단계 더 거쳐 접근하면 항상 `undefined`가 되어 fallback만 표시된다.
- **해결**: `.value.data.X` -> `.value.X`로 수정. 또한 apiSuccess가 snake_case 변환을 하므로 camelCase 키(`careerAverages`)가 아닌 snake_case 키(`career_averages`)로 접근해야 한다.
- **예방**: API 응답 접근 시 항상 (1) apiSuccess에 data 래핑이 없음을 기억하고, (2) 응답 키가 snake_case로 자동 변환됨을 고려할 것.
- **영향 파일**: right-sidebar-guest.tsx, right-sidebar-logged-in.tsx (총 6곳)
- **참조횟수**: 0

### [2026-03-28] categories JSON이 boolean/array 혼용 — Array.isArray 체크 필수
- **분류**: error
- **발견자**: debugger
- **내용**: 디비전 마이그레이션 후 Tournament.categories가 `{"general": true}` (boolean) 형태로 저장됨. 기존 코드는 `{"general": ["D6","D7"]}` (array) 형태를 기대하고 `.map()`/`.join()` 호출 → `true.map is not a function` 에러.
- **해결**: `Array.isArray(divs)` 체크 후 분기. boolean이면 카테고리명으로 대체.
- **예방**: JSON 필드 접근 시 항상 타입 체크. 마이그레이션으로 형식이 바뀔 수 있음.
- **영향 파일**: tournaments/[id]/page.tsx, tournament-about.tsx
- **참조횟수**: 0
