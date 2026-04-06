# 프로젝트 구조 지식
<!-- 담당: planner-architect, developer | 최대 30항목 -->
<!-- 프로젝트의 폴더 구조, 파일 역할, 핵심 패턴을 기록 -->

### [2026-04-05] 홈 페이지 NBA 2K 스타일 적용 현황 분석
- **분류**: architecture
- **발견자**: planner-architect
- **내용**: 홈 페이지 19개 컴포넌트 전수 분석. (1) 활성 사용 중: page.tsx + home-hero/profile-widget/quick-actions/news-feed/recommended-games/recommended-tournaments/notable-teams/recent-activity/recommended-videos/home-community 10개 + right-sidebar.tsx(PC 사이드바). (2) 레거시(미사용): home-sidebar/hero-section/quick-menu/hero-bento/home-greeting/my-summary-hero/personal-hero/right-sidebar-guest/right-sidebar-logged-in 9개. (3) 2K 스타일 적용 완료: home-hero/profile-widget/quick-actions/news-feed/recommended-games/recommended-tournaments/notable-teams + toss-section-header/toss-list-item/right-sidebar. (4) 2K 미적용: recommended-videos(토스 스타일 카드), home-community/recent-activity(한글 헤더만 2K 미통일). (5) 2K CSS 유틸리티: globals.css에 shadow-glow-primary/accent, clip-slant/reverse/sm, watermark-text 정의됨. 폰트: SUIT(본문)+GmarketSans(제목).
- **참조횟수**: 0

### [2026-04-02] 맞춤 설정(Preferences) 시스템 구조 분석
- **분류**: architecture
- **발견자**: planner-architect
- **내용**: 맞춤 설정 시스템 전체 구조 파악. (1) 데이터 흐름: preference-form.tsx(클라이언트) → /api/web/preferences(GET/PATCH) → User 모델 preferred_* 7필드 + prefer_filter_enabled. (2) 필터 적용: prefer-filter-context.tsx가 전역 상태 관리, header.tsx와 layout.tsx에 토글 버튼, game.ts/tournament.ts/community-content.tsx에서 필터 적용. (3) 온보딩 연결: /profile/complete/preferences에서 onboarding 모드로 PreferenceForm 사용, 온보딩 step 2로 진행. (4) 실력 관련: SKILL_BADGE(game-status.ts)가 공통 상수이나, SKILL_LABEL이 pickup-game-card/guest-game-card/pickup-detail/guest-detail 4파일에 인라인 중복 정의. (5) 메뉴 구조: profile-dropdown.tsx(헤더 드롭다운 4카테고리), profile-accordion.tsx(모바일 슬라이드 메뉴 4카테고리). 맞춤 설정은 "내 정보" 카테고리 하위에 위치.
- **참조횟수**: 0

### [2026-03-28] 프론트-백엔드 연결 전수 조사 + admin 관리 갭 분석
- **분류**: architecture
- **발견자**: planner-architect
- **내용**: (web) 59개 페이지 + 89개 API route + 9개 Server Action 전수 조사. 프론트 60개 기능 중 59개 완전 연결(OK), 1개 부분 연결(tournament-admin/templates). 데이터 패칭 패턴: (1) 목록 페이지는 클라이언트 컴포넌트에서 /api/web/* fetch 또는 useSWR, (2) 상세 페이지는 서버 컴포넌트에서 prisma 직접 쿼리, (3) 생성/수정/삭제는 Server Action 또는 fetch POST/PATCH/DELETE. admin 관리 갭 4영역: 경기(games) 관리 없음, 커뮤니티(community_posts+comments) 관리 없음, 팀(teams) 관리 없음, 코트(court_infos) 관리 없음. admin이 완전 관리하는 것: users(CRUD), tournaments(상태변경), plans(CRUD), payments(읽기), suggestions(상태변경), settings(점검/캐시), logs/analytics(읽기). 가장 시급한 누락: 경기+커뮤니티 관리 (부적절 콘텐츠 모더레이션 대응 불가).
- **참조횟수**: 0

### [2026-03-26] 외부 BDR 랭킹 연동 구조 설계
- **분류**: architecture
- **발견자**: planner-architect
- **내용**: 외부 BDR 랭킹 사이트(bdrranking-d.netlify.app) 분석 후 연동 설계. 외부 데이터 소스는 GitHub 저장소(cobby8/BDR-ranking-d, cobby8/BDR-ranking-u)의 xlsx 파일. 일반부(division_rank.xlsx, 29KB)와 대학부(divisionU_rank.xlsx, 14KB). 필드: rank/team/city/score/move/scoreChange. 연동 방식: 서버사이드 API proxy -- /api/web/rankings/bdr/route.ts에서 GitHub raw URL fetch + xlsx 라이브러리로 파싱 + 인메모리 캐시(10분). 기존 /api/web/rankings API는 수정 없음(독립 경로). UI: rankings-content.tsx의 탭을 2개에서 3개로 확장(BDR 랭킹/플랫폼 팀/플랫폼 개인). BDR 랭킹 탭에 일반부/대학부 서브탭 + 지역 필터 + 검색. 신규 파일: API route.ts 1개 + bdr-ranking-table.tsx 1개. 수정 파일: rankings-content.tsx 1개 + package.json 1개.
- **참조횟수**: 0

### [2026-03-25] 랭킹 페이지 구조 설계 (신규 페이지 + API)
- **분류**: architecture
- **발견자**: planner-architect
- **내용**: /rankings 신규 페이지 설계. (1) 팀 랭킹: Team 모델의 wins/losses/draws 필드를 직접 정렬(DB 스키마 변경 없음). (2) 개인 랭킹: TournamentTeamPlayer의 total_points/total_rebounds/total_assists/games_played를 userId 기준 groupBy 합산 후 정렬. 같은 유저가 여러 대회에 참가하면 여러 TournamentTeamPlayer 레코드가 존재하므로 합산 필수. (3) API: /api/web/rankings?type=team|player, 공개 API, 50건 고정. (4) 페이지: Suspense 래퍼 + 클라이언트 컴포넌트(탭 전환+테이블+클라이언트 페이지네이션) - teams 패턴 동일. (5) slide-menu.tsx href="#" -> "/rankings" 연결. 파일 5개: API route.ts, page.tsx, loading.tsx, rankings-content.tsx, slide-menu.tsx(수정).
- **참조횟수**: 0

### [2026-03-25] 하드코딩/미연동 심층 재분석 (03-23 완료분 제외)
- **분류**: architecture
- **발견자**: planner-architect
- **내용**: 03-23 완료 5건 제외 후 재분석. 하드코딩 8건(H1~H8), 미연동 UI 8건(U1~U8), 미구현 API 4건(A1~A4), DB 스키마 변경 7건(D1~D7) 발견. 핵심 발견: (1) 플랫폼 통계 API(/api/web/stats)가 여전히 미구현 - guest 사이드바에 "4,200개 팀" 등 하드코딩. (2) 팔로우/좋아요 시스템은 DB 테이블(follows, likes)부터 필요. (3) 슬라이드 메뉴 "랭킹" 항목이 href="#"으로 랭킹 페이지 미구현. (4) 타인 프로필 승률은 matchPlayerStat에서 계산 가능하나 미구현. (5) 커뮤니티 이벤트 배너 2곳은 하드코딩 텍스트. (6) fallback 데이터(API 실패 시 더미)는 graceful degradation으로 허용 가능. 정상 연동 확인: 홈 6개 섹션 전부, 경기/팀/대회/커뮤니티/프로필/코트/알림/요금제 전부 DB 연동 완료. 우선 추천: 통계 API(15분) -> 랭킹 페이지(40분) -> 타인 승률(15분) -> 좋아요(1시간) -> 팔로우(1시간).
- **참조횟수**: 0

### [2026-03-23] 하드코딩 데이터 vs DB/API 연결 전체 분석
- **분류**: architecture
- **발견자**: planner-architect
- **내용**: 리디자인 완료된 7개 영역(30+ 파일) 분석. (1) 높음 우선순위 5건: recommended-games.tsx가 가장 큰 문제 - API(/api/web/recommended-games) fetch는 하지만 응답 데이터를 카드에 미사용, 4개 하드코딩 카드만 표시. notable-teams.tsx는 TEAMS 상수 배열 4개(더미). right-sidebar 양쪽에 랭킹/통계 하드코딩. (2) 중간 우선순위 5건: 커뮤니티 사이드바 API 연결, 플랫폼 통계 신규 API, 프로필 Win Rate/createdAt 확장. (3) 낮음 5건: DB 스키마 변경 필요(레벨/랭크 시스템, 이미지 필드, 관중 수 등). (4) 완벽 연결됨: 경기 목록/상세, 팀 목록/상세, 프로필 스탯, 대회 전체, 커뮤니티 전체. 실행 계획: 6단계(recommended-games -> notable-teams -> sidebar 연결 -> profile 확장 -> 통계 API -> tester 검증).
- **참조횟수**: 0

### [2026-03-23] 커뮤니티 페이지 구조 분석 (목록/상세 2종, 6파일)
- **분류**: architecture
- **발견자**: planner-architect
- **내용**: 커뮤니티 관련 파일 6개 분석. (1) 목록: community/page.tsx(래퍼, Suspense) + _components/community-content.tsx(클라이언트, /api/web/community fetch, categoryMap 인라인 정의) + loading.tsx. (2) 상세: [id]/page.tsx(서버 컴포넌트, prisma 직접 쿼리 community_posts+comments, revalidate:30) + comment-form.tsx(클라이언트, createCommentAction Server Action). (3) 글쓰기: new/page.tsx(클라이언트, createPostAction Server Action). API: /api/web/community(GET 목록, take:30, category/q/prefer 필터). Server Actions: src/app/actions/community.ts(createPostAction, createCommentAction). DB: community_posts(id/user_id/title/content/category/view_count/comments_count/public_id/team_id/location/price 등) + comments(polymorphic: commentable_type="CommunityPost"). 목록은 클라이언트 컴포넌트(fetch), 상세는 서버 컴포넌트(prisma). 좋아요 기능 미구현(community_posts에 likes_count 필드 없음, comments에는 있음).
- **참조횟수**: 0

### [2026-03-23] 대회 페이지 구조 분석 (목록/상세/대진표 3종, 17파일)
- **분류**: architecture
- **발견자**: planner-architect
- **내용**: 대회 관련 파일 17개 분석. (1) 목록: tournaments/page.tsx(래퍼, Suspense) + _components/tournaments-content.tsx(클라이언트, /api/web/tournaments fetch, TournamentCard 인라인) + tournaments-filter.tsx(상태 탭 4개) + loading.tsx. (2) 상세: [id]/page.tsx(서버 컴포넌트, prisma 직접 쿼리, parseDescription 파서 내장, MatchesAndStandings Suspense 분리) + loading.tsx. 서브탭 4개: schedule/standings/bracket/teams (각각 독립 page.tsx). (3) 대진표: bracket/page.tsx(서버, prisma + buildRoundGroups) + _components/bracket-view.tsx(클라이언트, 데스크톱 절대위치+모바일 탭) + match-card.tsx(MatchCard+MobileMatchCard) + bracket-empty.tsx + bracket-connector.tsx(미사용) + round-column.tsx(미사용). (4) 참가신청: join/page.tsx(클라이언트, 4스텝 위자드). API: /api/web/tournaments(GET 목록, POST 생성) + /api/web/tournaments/[id](GET/PUT/DELETE) + bracket/join/teams/matches 등 하위 API. 유틸: src/lib/tournaments/bracket-builder.ts(buildRoundGroups, computeMatchPositions, computeConnectorPaths). 목록은 클라이언트 컴포넌트(fetch), 상세는 서버 컴포넌트(prisma), 대진표는 서버(데이터)+클라이언트(뷰) 혼합.
- **참조횟수**: 0

### [2026-03-23] 프로필 페이지 구조 분석 (내 프로필 + 타인 프로필, 9+1파일)
- **분류**: architecture
- **발견자**: planner-architect
- **내용**: 프로필 관련 파일 분석. (1) 내 프로필: profile/page.tsx(클라이언트, useSWR /api/web/profile + /api/web/profile/stats) + _components 7개(profile-header/activity-ring/stat-bars/recent-games-section/teams-section/tournaments-section/player-info-section/section-wrapper). (2) 타인 프로필: users/[id]/page.tsx(서버 컴포넌트, prisma 직접 쿼리). (3) 프로필 수정: profile/edit/page.tsx. API: /api/web/profile(GET/PATCH) + /api/web/profile/stats(GET) + /api/web/profile/generate-bio(POST). 서비스: src/lib/services/user.ts(getProfile/getPlayerStats/getMonthlyGames). 내 프로필은 클라이언트 컴포넌트(useSWR), 타인 프로필은 서버 컴포넌트(prisma). 스탯 데이터는 matchPlayerStat 테이블에서 aggregate로 집계.
- **참조횟수**: 0

### [2026-03-22] CSS 하드코딩 색상 전환 대상 분류
- **분류**: architecture
- **발견자**: planner-architect
- **내용**: src/ 전체에서 하드코딩 색상 ~929건/107파일 확인. 전환 제외 대상은 (1) 데이터 기본값(teams.ts, games.ts 등의 fallback), (2) 유니폼/팀 동적 색상, (3) 브랜드 고정색(카카오/네이버/구글/YouTube), (4) manifest.ts PWA 색상, (5) 사이트 템플릿 커스텀 테마, (6) activity-ring 티어 고유색. admin 페이지는 라이트 테마 전용으로 #F5F7FA, #EEF2FF 등 밝은 색 위주.
- **참조횟수**: 0

### [2026-03-23] admin 라우트 그룹 분리 ((web) -> (admin))
- **분류**: architecture
- **발견자**: developer
- **내용**: admin 폴더를 src/app/(web)/admin/ -> src/app/(admin)/admin/으로 이동. 이유: (web)/layout.tsx의 사이드바/헤더/하단네비가 admin에도 적용되어 이중 레이아웃 문제 발생. (admin) 라우트 그룹으로 분리하면 (web)/layout.tsx가 적용되지 않고, admin/layout.tsx의 AdminSidebar만 적용됨. URL은 /admin/... 그대로 유지. (admin)/layout.tsx는 불필요 - 루트 layout.tsx가 HTML/폰트를 처리하고 admin/layout.tsx가 AdminSidebar+권한체크를 처리.
- **참조횟수**: 0

### [2026-03-22] 전체 페이지 구조 분석
- **분류**: architecture
- **발견자**: planner-architect
- **내용**: src/app/ 전체 90개 페이지 분석. (web) 64개 + _site 6개 + live 2개 + layout 5개 + loading 13개. 라우트 그룹: (web)=일반 웹(NextAuth), _site=서브도메인 토너먼트 사이트, live=독립 다크테마 라이브. 레이아웃 계층: root > (web)(사이드바+미니헤더+모바일네비) > (admin)/admin(AdminSidebar+super_admin전용) / tournament-admin(상단 탭 네비). _site는 독립 레이아웃(서브도메인 검증+발행 게이트). 공통 UI: card/button/badge/skeleton. 홈은 4섹션 구성(히어로/퀵메뉴/추천경기/추천영상).
- **참조횟수**: 0

### [2026-03-22] 홈페이지 리디자인 구조 설계
- **분류**: architecture
- **발견자**: planner-architect
- **내용**: 홈페이지를 1열 세로 스택에서 3열 그리드(메인 lg:col-span-2 + 우측 사이드바 lg:col-span-1)로 전환. 기존 4개 컴포넌트(hero-section, quick-menu, recommended-games, recommended-videos)를 6개로 재구성(hero-bento, recommended-games, notable-teams, recommended-videos, right-sidebar-logged-in, right-sidebar-guest). quick-menu와 personal-hero는 기능이 다른 컴포넌트로 분산되어 사용 중지. 디자인 시안은 Dev/design/1. 홈/에 라이트/다크 4개 버전 존재. 반응형 패턴: 모바일 가로 스크롤 -> 데스크탑 N열 그리드. 섹션 헤더에 색상 막대(w-1.5 h-6) 사용.
- **참조횟수**: 0

### [2026-03-23] 팀 페이지 구조 분석 (목록/상세 2종, 14파일)
- **분류**: architecture
- **발견자**: planner-architect
- **내용**: 팀 관련 파일 14개 분석. (1) 목록: teams/page.tsx(래퍼, Suspense) + teams-content.tsx(클라이언트, /api/web/teams fetch, TeamCardFromApi 인라인 정의) + team-card.tsx(미사용 레거시 카드) + teams-filter.tsx(검색+도시 select) + loading.tsx. (2) 상세: [id]/page.tsx(서버 컴포넌트, prisma 직접 쿼리) + join-button.tsx(POST /api/web/teams/[id]/join) + _tabs 4개(overview/roster/games/tournaments). (3) 관리: [id]/manage/page.tsx(가입신청 처리). (4) 생성: new/page.tsx(권한체크) + new-team-form.tsx(createTeamAction). API: /api/web/teams(GET 목록) + /api/web/teams/[id]/join(POST) + /api/web/teams/[id]/members(GET/PATCH). 디자인 시안 Dev/design/3. 팀/ 4개: bdr_1(상세-다크), bdr_2(상세-라이트), bdr_3(목록-다크), bdr_4(목록-라이트). teams-content.tsx에 TeamCardFromApi가 인라인으로 정의되어 있어 team-card.tsx와 중복 존재함.
- **참조횟수**: 0

### [2026-03-22] 경기 페이지 구조 분석 (목록/상세/생성 3종)
- **분류**: architecture
- **발견자**: planner-architect
- **내용**: 경기 관련 파일 29개 분석. (1) 목록: games/page.tsx(래퍼) + games-content.tsx(클라이언트, /api/web/games fetch) + games-filter.tsx(플로팅 드롭다운). (2) 상세: [id]/page.tsx(서버 컴포넌트, getGame+listGameApplications+getUserGameProfile 병렬). _sections/pickup-detail+guest-detail+team-match-detail(테이블 형식). apply-button/cancel-apply-button. (3) 생성: game-wizard.tsx(3스텝 fixed 오버레이). step-type -> step-when-where(통합폼) -> step-confirm. Kakao Postcode 주소검색, createGameAction Server Action. 디자인 시안 Dev/design/2. 경기/ 6개(라이트3+다크3): bdr_1(목록-라이트), bdr_2(상세-라이트), bdr_3(생성-라이트), bdr_4(생성-다크), bdr_5(목록-다크), bdr_6(상세-다크).
- **참조횟수**: 0
