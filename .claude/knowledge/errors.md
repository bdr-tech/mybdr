# 에러 및 함정 모음
<!-- 담당: debugger, tester | 최대 30항목 -->
<!-- 이 프로젝트에서 반복되는 에러 패턴, 함정, 주의사항을 기록 -->

### [2026-04-17] Next.js 16 next/image 외부 호스트 미허용 (카카오 CDN 2종 누락)
- **분류**: error
- **발견자**: debugger
- **증상**: `Invalid src prop (http://img1.kakaocdn.net/thumb/R640x640.q70/?fname=http://t1.kakaocdn.net/account_images/default_profile.jpeg) on next/image, hostname "img1.kakaocdn.net" is not configured under images in your next.config.js` — userId 2862 카카오 가입자 프로필 렌더링 중 발생
- **원인**: `next.config.ts`의 `images.remotePatterns`에 `k.kakaocdn.net`, `p.kakaocdn.net`만 있고 **썸네일 프록시(`img1.kakaocdn.net`)**와 **기본 프로필 원본(`t1.kakaocdn.net`)**이 빠져 있었음. 카카오 OAuth 기본 프로필은 `img1.kakaocdn.net/thumb/R640x640.q70/?fname=http://t1.kakaocdn.net/account_images/default_profile.jpeg` 구조로, 실제로 2개 호스트를 동시에 타므로 둘 다 허용 필요. 추가로 에러 URL이 http였음 — OAuth 제공자가 http/https 섞어 내려주는 경우 있음.
- **해결**: `remotePatterns`에 4개 엔트리 추가 — `img1.kakaocdn.net`(http/https × pathname=/thumb/**) + `t1.kakaocdn.net`(http/https × pathname=/account_images/**). `pathname` 제한으로 임의 경로 오남용 차단.
- **재발 방지**:
  1. OAuth 제공자(카카오/네이버/구글) 추가 시 **CDN 도메인 패턴을 함께 등록** — 로그인 CDN만이 아니라 프로필 썸네일 프록시까지
  2. `remotePatterns`는 가능하면 `pathname: "/특정경로/**"`로 범위 제한 (보안 + 오남용 방지)
  3. `next.config.ts` 수정 후 dev 서버 **재시작 필수** (HMR 미반영)
- **참조**: conventions.md "next/image 외부 호스트 등록 패턴"(승격 후보)
- **참조횟수**: 0

### [2026-04-16] sticky 셀 가로 스크롤 겹침 — 배경 투명 + z-index 누락 이중 원인
- **분류**: error (UI)
- **발견자**: pm
- **증상**: 박스스코어 모바일 가로 스크롤 시 sticky 번호/이름 컬럼 뒤로 다른 스탯 숫자가 비쳐 겹쳐 보임
- **원인 2개 동시 발생**:
  1. `<tr>` 배경이 `transparent` → sticky 셀 `bg-inherit`도 투명 → 뒤 콘텐츠 비침
  2. sticky 셀에 `z-index` 없음(기본 auto) → 스크롤되는 셀이 앞 레이어에 그려짐
- **해결**: (a) 모든 tr 배경 불투명화(`var(--color-card)` + `color-mix`로 zebra), (b) sticky 셀에 `z-10` 명시
- **재발 방지**: sticky 셀 규칙 — **불투명 배경 + 명시적 z-index** 쌍은 항상 같이
- **참조**: conventions.md "sticky 셀 규칙"
- **참조횟수**: 0

### [2026-04-16] Chrome @page CSS를 가상 프린터(Hancom PDF)가 무시
- **분류**: error (platform limit)
- **발견자**: pm (사용자 제보)
- **증상**: `@page { size: A4 landscape }` 지정해도 **Hancom PDF 프린터**로 저장하면 세로 방향 PDF 생성
- **원인**: Chrome "PDF로 저장"은 @page를 존중하지만, Hancom PDF 같은 Windows 가상 프린터는 OS 드라이버를 경유해 @page를 무시하고 드라이버 기본값 사용
- **해결**: 웹에서 강제 불가 (브라우저/OS 레벨). 사용자에게 "프린터를 Chrome 'PDF로 저장'으로 변경" 안내 배너 + "인쇄 방향: 가로" 수동 선택 가이드
- **잘못된 시도**: `html, body { width: 297mm !important }` 강제 → Chrome PDF 메타데이터 더 깨짐 (롤백)
- **재발 방지**: 프린트 기능 추가 시 **표준 @page 키워드**(A4 landscape)만 쓰고 불가능한 OS 제어는 UI 안내로 대체
- **참조**: lessons.md "브라우저 프린트 API 한계"
- **참조횟수**: 0

### [2026-04-16] 프린트 `<th>` center vs `<td>` left 기본값 불일치 — 정렬 깨짐
- **분류**: error (UI)
- **발견자**: pm (사용자 제보)
- **증상**: 프린트된 박스스코어에서 헤더와 데이터 행의 숫자 컬럼이 살짝 어긋남
- **원인**: HTML 기본 정렬이 `<th>` center, `<td>` left. 숫자 컬럼(MIN/PTS/FG)이 서로 다른 축으로 정렬됨. 추가로 `td:nth-child(2) { max-width }`만 적용하고 `th`엔 미적용이라 이름 폭 차이로 뒤 컬럼 밀림
- **해결**: 프린트 영역 th/td 모두 `text-align: center` + `table-layout: fixed` + `th:nth-child(n)`와 `td:nth-child(n)` 폭 둘 다 제어
- **재발 방지**: 프린트 테이블은 **table-layout: fixed + 명시적 정렬/폭** 쌍으로
- **참조횟수**: 0

### [2026-04-15] 신규 파일 git add 누락 → 로컬은 OK인데 원격 Vercel 빌드 실패
- **분류**: error
- **발견자**: pm (원영 핫픽스 `d94beb6`로 문제 파악)
- **증상**: Phase 2B 커밋(c53fb71)에서 `@/lib/validation/team` import는 했지만 **실제 파일은 로컬에만 있고 원격엔 없음**. 로컬 tsc/dev 서버 모두 정상 → 커밋/푸시/dev 머지까지 문제 없어 보임 → Vercel 빌드에서 `Module not found: Can't resolve '@/lib/validation/team'`로 실패.
- **원인**: `git status`에 `??` (Untracked)로 표시된 신규 파일을 add하지 않고 커밋함. `git add -A`/`git add .`를 안 쓰고 특정 파일만 add하는 워크플로의 단점.
- **해결**: 원영님이 dev/main에 응급으로 `validation/team.ts` 최소 버전 직접 추가 (d94beb6, 9d64342). 이후 수빈이 Phase 2C에서 완전판으로 확장.
- **재발 방지**:
  1. 커밋 전 `git status --short` 실행 → `??` 표시된 신규 파일이 커밋 대상에 포함되는지 **매번** 확인
  2. 신규 파일이 import되는 시점(같은 커밋)에 함께 add
  3. Vercel preview 빌드가 꺼져있는 개인 브랜치(subin)는 머지 전까지 문제가 숨겨질 수 있음 — dev 머지 후 즉시 Vercel dev preview 체크
- **참조**: lessons.md "신규 파일 add 누락 방지"
- **참조횟수**: 0

### [2026-04-15] 🚨 prisma db push --accept-data-loss로 타 브랜치 테이블 drop 사고 (최우선)
- **분류**: error (중대한 운영 사고 위험)
- **발견자**: pm
- **증상**: Team 모델에 컬럼 추가 목적으로 `npx prisma db push --accept-data-loss` 실행. 그런데 schema.prisma에 정의 안 된 테이블 4개가 drop됨 — associations(20rows), association_admins(1row), referees(1row), referee_documents(1row). subin-referee 브랜치에서 작업 중이던 Referee 시스템 테이블이 전부 사라짐.
- **원인**: `db push`는 "schema ↔ DB 완전 동기화" 명령. 현재 브랜치 schema에 없는 테이블은 "불필요한 잔재"로 판단해 삭제 시도. `--accept-data-loss` 플래그가 이를 허용. 브랜치마다 schema가 다르게 진화 중인 상황에서 위험.
- **해결**: subin-referee 브랜치의 schema.prisma에서 Referee 시스템 14개 모델을 현재 schema에 통합 복사 → 재 `db push`로 테이블 구조 복원. 데이터는 손실 (개발 DB라 허용, 운영 DB였으면 대참사).
- **재발 방지**:
  1. 브랜치별로 독립 schema 작업 중일 때는 `db push --accept-data-loss` **절대 금지**
  2. 대신 `prisma migrate dev --create-only`로 마이그레이션 파일만 생성 후 수동 검토
  3. schema 차이가 큰 경우 `db pull`로 현재 DB 상태를 schema에 먼저 가져온 뒤 수정
  4. 운영 DB에는 절대 db push 실행 금지 (CLAUDE.md 최상단 규칙 재확인)
- **참조횟수**: 0

### [2026-04-12] Turbopack dev: "Jest worker encountered N child process exceptions"
- **분류**: error
- **발견자**: pm (사용자 제보)
- **증상**: 로컬 `npm run dev`(Next.js 16.1.6 Turbopack) 중 `Jest worker encountered 2 child process exceptions, exceeding retry limit` 런타임 에러. Vercel 배포/운영(mybdr.kr)에선 정상, 로컬에서만 발생.
- **원인**: Turbopack dev 서버는 HMR을 위해 Worker Pool을 메모리에 유지하는데, 짧은 시간에 여러 파일이 연속 수정되면 워커가 recompile을 겹쳐 받아 상태가 꼬이고 child process가 예외를 2회 이상 던지면 retry 한도를 넘어 에러. 코드 문법 이슈 아님 (빌드/운영은 멀쩡).
- **해결**: (1) 포트 기반 dev 서버 재시작 — `netstat -ano | findstr :3001` → 해당 PID만 `taskkill //f //pid <PID>` → `npm run dev`. (2) 안 되면 `.next` 삭제 후 재시작. **절대 `taskkill //f //im node.exe` 쓰지 말 것** (다른 프로젝트 dev 서버/Claude Code까지 죽음).
- **재발 방지**: 대량 파일 수정 시 중간에 dev 서버 한 번 재시작. 같은 PC에서 dev 서버 여러 개(worktree별) 동시 실행 시 메모리 압박 큼 — 하나씩만 돌리기.
### [2026-04-12] Prisma schema drift — users.gender 컬럼 누락 (db push 시 파괴적 DROP 예고)
- **분류**: error / trap
- **발견자**: developer (Commit 1 dry-run 중)
- **내용**: `prisma/schema.prisma`의 User 모델에 `gender` 필드가 없는데, 실제 DB(`users` 테이블)에는 `gender character varying nullable` 컬럼이 존재하는 drift 상태. 이 상태에서 `prisma db push`를 실행하면 Prisma가 "schema가 진리"라고 판단해 `ALTER TABLE "users" DROP COLUMN "gender"`를 자동 생성 → 운영/개발 DB에서 컬럼과 데이터가 파괴됨.
- **원인 추정**: Rails → Next.js 마이그레이션 당시 `prisma db pull`이 누락했거나 이후 수동 삭제된 필드. schema는 쓰지 않지만 DB에는 legacy 컬럼이 남아 있음.
- **해결 방법 (이번 적용)**:
  1. 신규 모델 추가 후 **반드시 `prisma migrate diff --from-schema-datasource ... --to-schema-datamodel ... --script`로 전체 SQL 미리보기**
  2. 기존 테이블에 대한 `ALTER TABLE`/`DROP`이 발견되면 **즉시 중단**
  3. `information_schema.columns`에서 해당 컬럼의 정확한 타입/nullable/default 조회
  4. Prisma 타입으로 역매핑하여 schema에 해당 필드 1줄 복원 (예: `gender String? @db.VarChar`)
  5. 재 dry-run으로 기존 테이블 변경 0건 확인 후 push
- **예방**: 신규 테이블만 추가하는 작업에서도 **항상 dry-run 전체를 눈으로 검토**. `CREATE TABLE`만 있을 것이라는 가정 금지. 브랜치 격리 DB 전략 하에서는 특히 중요 (다른 worktree/원본과 DB 공유).
- **참조**: decisions.md "심판 v2 최종확정 - TournamentMatch 단독 FK" 직전 항목들
- **참조횟수**: 0

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
- **영향 파일**: right-sidebar-guest.tsx, right-sidebar-logged-in.tsx (총 6곳), tournament-tabs.tsx (4개 탭 전부)
- **재발 (2026-04-13)**: tournament-tabs.tsx에서 동일 패턴 재발. fetcher에 convertKeysToCamelCase() 적용하여 snake_case→camelCase 자동 변환으로 해결.
- **참조횟수**: 1

### [2026-03-28] categories JSON이 boolean/array 혼용 — Array.isArray 체크 필수
- **분류**: error
- **발견자**: debugger
- **내용**: 디비전 마이그레이션 후 Tournament.categories가 `{"general": true}` (boolean) 형태로 저장됨. 기존 코드는 `{"general": ["D6","D7"]}` (array) 형태를 기대하고 `.map()`/`.join()` 호출 → `true.map is not a function` 에러.
- **해결**: `Array.isArray(divs)` 체크 후 분기. boolean이면 카테고리명으로 대체.
- **예방**: JSON 필드 접근 시 항상 타입 체크. 마이그레이션으로 형식이 바뀔 수 있음.
- **영향 파일**: tournaments/[id]/page.tsx, tournament-about.tsx
- **참조횟수**: 0

### [2026-04-02] 커뮤니티 맞춤 필터 미적용 — setLoggedIn 이중 호출 경쟁 조건
- **분류**: error
- **발견자**: debugger
- **내용**: `header.tsx`와 `layout.tsx`가 각각 독립적으로 `/api/web/me`를 fetch한 후 `setLoggedIn`을 호출함. `layout.tsx`는 `setLoggedIn(true, preferEnabled)`로 올바르게 호출하지만, `header.tsx`는 `setLoggedIn(true)`로 preferEnabled 없이 호출. preferEnabled가 undefined이면 `preferDefault = false`로 설정되므로, header.tsx 호출이 나중에 실행되면 맞춤 필터가 꺼짐. 결과적으로 커뮤니티 API에 `prefer=true`가 전달되지 않아 모든 게시판이 표시됨.
- **해결**: header.tsx의 `setLoggedIn(!!userData)` 호출 제거 (layout.tsx에서 이미 처리) 또는 preferEnabled 전달 추가.
- **예방**: 전역 상태를 설정하는 함수는 **한 곳에서만** 호출할 것. 여러 컴포넌트가 동일 상태를 독립적으로 초기화하면 경쟁 조건(race condition) 발생.
- **영향 파일**: header.tsx (60행), layout.tsx (372행), prefer-filter-context.tsx
- **참조횟수**: 0

### [2026-03-29] SWR GET 응답과 POST 409 응답의 정보 불일치로 UI 분기 누락
- **분류**: error
- **발견자**: debugger
- **내용**: 코트 체크인 UI에서 조건 분기가 3단계로 나뉘어 있었음. (1) isCheckedInElsewhere (SWR GET) → 메시지만, 버튼 없음. (2) checkedInCourtId (POST 409) → 버튼 있음. 페이지 진입 시 GET만 호출되므로 (1)에 걸려서 "체크인 중인 농구장 보기"와 "체크아웃" 버튼이 표시되지 않았음.
- **해결**: GET API에서 다른 코트 체크인 시 court_name도 반환하도록 수정. UI에서 SWR 데이터 변경 시 useEffect로 checkedInCourtId/Name state를 설정하여 버튼이 있는 분기로 통합.
- **예방**: API 응답 설계 시 GET과 POST 에러 응답의 정보를 일관되게 유지할 것. UI 조건 분기에서 같은 상태를 다른 경로로 도달할 수 있는지 확인할 것.
- **영향 파일**: api/web/courts/[id]/checkin/route.ts, court-checkin.tsx
- **참조횟수**: 0

### [2026-04-02] Next.js 개발서버 무한 로딩 (hung 상태, 메모리 1.67GB)
- **분류**: error
- **발견자**: debugger
- **내용**: 개발서버(PID 106908)가 메모리 1.67GB를 사용하며 모든 HTTP 요청에 응답하지 않는 hung 상태. 커뮤니티뿐 아니라 홈(/), 로그인(/login), API(/api/web/me) 등 모든 엔드포인트가 타임아웃. curl --max-time 5로 테스트 시 HTTP 응답 코드 000 (연결은 되지만 응답 없음). 코드 자체에는 tsc 에러 없고, DB 쿼리(Prisma)도 별도 프로세스에서는 정상 동작. hidden_menus 컬럼도 DB에 이미 존재 확인됨. 개발서버 프로세스 자체가 과부하로 멈춘 상태.
- **해결**: 개발서버 재시작 필요. (1) `netstat -ano | findstr :3001`로 PID 확인 (2) `taskkill //f //pid <PID>`로 해당 프로세스만 종료 (3) `npm run dev`로 재시작. 주의: `taskkill //f //im node.exe`는 다른 node 프로세스도 죽이므로 절대 사용 금지.
- **예방**: 개발서버가 장시간 실행되며 메모리 누수/과부하가 쌓일 수 있음. 응답이 멈추면 코드 에러 의심 전에 먼저 개발서버 메모리와 프로세스 상태를 확인할 것. Turbopack 대신 webpack 모드 사용 검토.
- **참조횟수**: 0
