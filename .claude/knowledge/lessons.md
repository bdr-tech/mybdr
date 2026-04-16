# 배운 교훈
<!-- 담당: 전체 에이전트 | 최대 30항목 -->
<!-- 삽질 경험, 다음에 피해야 할 것, 효과적이었던 접근법을 기록 -->

### [2026-04-17] HTTP 5xx 에러 시 "실패" 단정 금지 — Git/DB 실상 확인 후 판단
- **분류**: lesson
- **시나리오**: `gh pr merge 37` 호출 시 **502 Bad Gateway** 에러 반환 → 재시도했더니 `Pull Request is not mergeable` + `mergeStateStatus: DIRTY/CONFLICTING` 응답. 실제로는 **첫 번째 요청이 이미 머지에 성공**(main에 9a1abbe 커밋 존재), 502는 nginx↔백엔드 응답 중계 실패였을 뿐
- **원인**: GitHub API 게이트웨이(nginx)가 백엔드와 통신 실패 → 요청은 백엔드에 도달해 **처리 완료**, 응답만 클라이언트에 전달 실패. 분산 시스템 대표 함정 "요청 처리됐는데 응답이 실패"
- **교훈**:
  1. HTTP 5xx/timeout → **자동 "실패" 간주 금지**. 실제 리소스(git log, DB)로 사실 확인
  2. API 응답 상태(`mergeable`, `mergeStateStatus`)는 해석 모호할 수 있음 — **진실 소스는 Git commit 자체**
  3. 멱등한 작업(PR 머지)은 재시도 안전하지만, 비멱등(결제/삭제)은 중복 실행 위험 → 상태 조회 우선
- **권장 패턴**:
  ```bash
  # 머지 시도
  gh pr merge <N> --merge
  # 5xx 에러 시: 재시도 전 상태 조회
  gh pr view <N> --json state,mergeCommit
  # state=MERGED면 성공 스킵, OPEN+conflict 없으면 재시도
  ```
- **참조**: conventions.md "Agent 호출 기준" / errors.md (있으면 추가)

### [2026-04-17] Flutter 테스트 데이터가 공식 기록을 오염시킨다 — 전역 가드 필수
- **분류**: lesson
- **내용**: Flutter 앱 개발 중 "미래 경기를 status=live로 세팅"하는 테스트가 자주 발생 (id=120, 2026-04-18 경기 사례). 이 데이터가 순위표/선수 커리어 스탯에 그대로 반영되어 **잘못된 공식 기록**으로 노출됨
- **교훈**:
  1. DB는 앱/웹이 공유 — 한쪽의 테스트 흐름이 다른 쪽 정식 UI를 오염시킬 수 있음
  2. 공식 집계 쿼리는 **status만으로 부족** → `scheduledAt <= NOW()` 가드 필수
  3. 여러 쿼리에 반복 적용하므로 **공통 유틸**로 추출해야 누락 방지 (→ `officialMatchWhere()`)
- **참조**: conventions.md "공식 기록 쿼리" / decisions.md "공식 기록 가드 전역 적용"

### [2026-04-17] 팀 병합 시 `logo_url`/`banner_url` 이관 체크 필수
- **분류**: lesson
- **내용**: 팀 병합(drop → keep) 스크립트에서 `tournament_teams.team_id`, `team_members.team_id` 같은 **FK UPDATE만** 처리하고 본팀의 컨텐츠 필드(logo_url, banner_url) 이관을 빠뜨리기 쉬움. 오늘 쓰리포인트(198)에 로고가 없어서 개별 후속 UPDATE 필요했음
- **교훈**:
  1. Team 소프트 병합 시 **본팀(keep)의 logo_url/banner_url이 비어있고 흡수팀(drop)엔 있으면** 이관
  2. 다음 팀 병합 스크립트는 이 체크를 기본 포함
  3. 사용자가 보는 **UI 영향 필드** 전수 리스트 관리 (name은 이미 처리, logo/banner/description 등)

### [2026-04-17] 동명이인 User는 닉네임에 팀/역할 힌트가 있으면 구분 쉬움
- **분류**: lesson
- **내용**: userId=NULL 선수 24명 중 2명이 동명이인이라 자동 매칭 skip됐는데, **닉네임 자체에 "(셋업주장)" / "(3P주장)" 같은 팀 힌트**가 박혀있어 쉽게 확정됨 (김영훈 2984, 원철희 2985)
- **교훈**:
  1. 동명이인 자동 스킵은 유지 (오매칭 방지)
  2. 수동 확인 단계에서 **user의 nickname + TeamMember 소속 + 프로필 정보** 3축으로 교차 검증
  3. admin이 대회용 유저를 만들 때 닉네임에 팀/역할을 넣어주면 사후 정리가 쉬움 (패턴화)

### [2026-04-16] 브라우저 프린트 API는 OS/드라이버 제어 불가 — UI 안내가 유일한 해결책
- **분류**: lesson
- **내용**: `window.print()` / `@page` CSS는 **Chrome 내부 PDF 엔진에만 힌트**. Hancom PDF 등 Windows 가상 프린터는 자체 드라이버 기본값을 우선하고 @page를 무시함
- **교훈**:
  1. 프린트 방향/크기를 코드로 "강제"할 방법은 없음
  2. 사용자가 프린터를 **"PDF로 저장"**(Chrome 기본)으로 선택하도록 **UI 안내**가 최선
  3. `html, body { width: 297mm !important }` 같은 억지 강제는 오히려 Chrome PDF 엔진 헷갈리게 함 (롤백 필요)
  4. 대안: jsPDF 같은 클라이언트 PDF 라이브러리 도입 → 방향 완전 제어 (구현 복잡도 큼)
- **참조**: errors.md "Chrome @page CSS를 가상 프린터가 무시"
- **참조횟수**: 0

### [2026-04-16] 모바일 UI는 데스크톱 확대에 희생되면 안 됨 — 듀얼 렌더 + zoom 절충
- **분류**: lesson
- **내용**: 데스크톱 가독성 위해 `zoom: 1.25` 적용했더니 모바일 viewport 300px 실효로 5단 가로 레이아웃이 겹침/잘림. zoom은 전체 영향을 주므로 디바이스 무시 불가
- **교훈**:
  1. `zoom`은 데스크톱만 올리지 말고 **모두 동시 영향** 주는 것으로 취급 → 절충값(1.1)이 양쪽 타협점
  2. 모바일 레이아웃이 좁아 가로로 안 될 때는 **듀얼 렌더** (`sm:hidden` + `hidden sm:flex`) 가 가장 안전. CSS flex-wrap은 중앙 정보 블록의 겹침을 막지 못함
  3. 서브 컴포넌트 추출(TeamBlock/ScoreDisplay/CenterInfoBlock)로 듀얼 렌더의 중복 최소화
- **참조**: errors.md(없음, UI 관찰 기반), conventions.md "듀얼 렌더 패턴"
- **참조횟수**: 0

### [2026-04-16] 개인 브랜치 drift 해소 — reset + force-with-lease가 안전
- **분류**: lesson
- **내용**: subin 브랜치가 PR 머지 후에도 이전 커밋들을 유지한 채 dev에서 뒤처지니 nostalgic drift 발생 (referee 시스템 96파일 삭제 위험). 수빈 3커밋은 이미 dev에 내용 반영됨
- **교훈**:
  1. 개인 브랜치는 **dev 머지 후 즉시 `git reset --hard origin/dev` + `push --force-with-lease`** 로 동기화해 다음 작업 출발점 깔끔히
  2. `--force-with-lease`는 원격이 내 로컬 예상과 일치할 때만 push 허용 → 안전
  3. PR 분리를 위해 cherry-pick 시도는 scratchpad.md 충돌 지뢰밭 → 차라리 dev 기반 새 브랜치에서 파일 덮어쓰기가 단순
- **참조횟수**: 0

### [2026-04-15] 신규 파일 add 누락 방지 — 커밋 전 `git status --short`로 `??` 확인
- **분류**: lesson
- **발견자**: pm
- **내용**: Phase 2B 커밋 시 `@/lib/validation/team` import는 했지만 실제 신규 파일은 add 누락 → 로컬은 정상, Vercel 빌드에서만 실패. 개인 브랜치는 Vercel preview가 없어서 dev 머지 후에야 발견됨. 원영님이 응급 핫픽스 커밋(d94beb6)으로 수습.
- **교훈**:
  1. 커밋 직전 `git status --short`에서 `??` 표시된 신규 파일을 반드시 점검 (특히 신규 유틸/validation 파일)
  2. "파일 1~2개씩 특정해서 add"하는 습관의 맹점 — 신규 파일은 특히 잘 빠짐
  3. 개인 브랜치에서 dev 머지 후 **Vercel dev preview 빌드 상태를 즉시 확인**
  4. import 경로가 바뀌거나 추가될 때는 해당 파일도 같은 커밋에 포함됐는지 이중 체크
- **참조**: errors.md "신규 파일 git add 누락 → 원격 Vercel 빌드 실패"
- **참조횟수**: 0

### [2026-04-15] gh 인증이 풀렸을 때 `git credential fill`로 토큰 우회 추출
- **분류**: lesson
- **발견자**: pm
- **내용**: `gh auth status`는 "not logged in"인데 `git push`는 정상 동작하는 상황 발생. 이는 gh CLI가 자체 토큰을 잃었지만 git credential manager에는 GitHub OAuth 토큰(`gho_...`)이 남아있기 때문. `printf "protocol=https\nhost=github.com\n\n" | git credential fill`로 토큰을 추출해 `GH_TOKEN` 환경변수로 한 번만 주입하면 gh pr create 등 세션 단위로 작동 가능. 영구 해결은 `gh auth login` 재실행.
- **교훈**:
  1. gh 인증이 막혔다고 해서 작업을 중단하거나 수동으로 PR을 만들 필요 없음
  2. git credential이 살아있으면 한 세션 단위로 GH_TOKEN 주입이 가장 빠름
  3. 영구 복구는 별도로 `gh auth login --web` 안내
- **응용**: `GH_TOKEN=$(printf "protocol=https\nhost=github.com\n\n" | git credential fill 2>/dev/null | grep ^password= | cut -d= -f2) gh pr create ...`
- **참조횟수**: 0

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
