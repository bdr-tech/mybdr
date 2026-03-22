# 프로젝트 구조 지식
<!-- 담당: planner-architect, developer | 최대 30항목 -->
<!-- 프로젝트의 폴더 구조, 파일 역할, 핵심 패턴을 기록 -->

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

### [2026-03-22] 전체 페이지 구조 분석
- **분류**: architecture
- **발견자**: planner-architect
- **내용**: src/app/ 전체 90개 페이지 분석. (web) 64개 + _site 6개 + live 2개 + layout 5개 + loading 13개. 라우트 그룹: (web)=일반 웹(NextAuth), _site=서브도메인 토너먼트 사이트, live=독립 다크테마 라이브. 레이아웃 계층: root > (web)(사이드바+미니헤더+모바일네비) > admin(AdminSidebar+super_admin전용) / tournament-admin(상단 탭 네비). _site는 독립 레이아웃(서브도메인 검증+발행 게이트). 공통 UI: card/button/badge/skeleton. 홈은 4섹션 구성(히어로/퀵메뉴/추천경기/추천영상).
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
