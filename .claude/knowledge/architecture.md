# 프로젝트 구조 지식
<!-- 담당: planner-architect, developer | 최대 30항목 -->
<!-- 프로젝트의 폴더 구조, 파일 역할, 핵심 패턴을 기록 -->

### [2026-04-21] L2 본 설계 — 공용 컴포넌트 3종 + `/users/[id]` 본인 분기 + 티어 제거
- **분류**: architecture
- **발견자**: planner-architect
- **내용**: L2 본 설계(audit 후속). (1) **공용 컴포넌트 3종 위치**: `src/components/profile/profile-hero.tsx`(공용, viewMode "owner"|"visitor" prop + ownerAction/visitorAction slot) + `mini-stat.tsx`(추출) + `recent-games.tsx`(variant "list"|"table" prop, 본인=list+chevron / 타인=table+스탯). 기존 `/profile/_components/profile-hero.tsx`는 re-export wrapper로 축소하여 import 경로 호환. `/profile/_components/recent-games-section.tsx`도 동일. (2) **`/users/[id]` 본인 분기**: `isOwner = BigInt(session?.sub) === user.id` → ActionButtons 숨김 + OwnerEditButton 렌더(→ `/profile/edit`) + 비공개 필드(email/phone/birth_date/weight/bank_name/account_number) select 추가. (3) **티어 제거 + 레벨 통합**: `getTierBadge()` (users/[id]/page.tsx L50-56) 제거 → 본인·타인 모두 Lv.N 배지(BDR Red round) 동일 컴포넌트. (4) **편집 경로 = B. 기존 `/profile/edit` 재활용** (신규 `/users/[me]/edit` 도입 시 네비 중복 + 308 ≥4건 필요). (5) **gamification 공개 API**: `GET /api/web/users/[id]/gamification`(비인증, xp select 후 getLevelInfo → {level,title,emoji}). 단 `/users/[id]` 서버 컴포넌트는 API 대신 getLevelInfo 함수 직접 호출로 snake_case 재발 리스크 0. (6) **Teams 섹션**: 타인 프로필에 신규 `<UserTeamsGrid>` 추가 (Hero 아래, 레이더 위). 필터 `team.is_public !== false && team.status === "active"`. 기존 `current-team-card.tsx`는 본인 전용이라 재활용 불가. (7) **`/profile` 대시보드 재정의**: BasicInfoCard/RefundAccountCard 제거 → `/profile/edit` 상단 읽기전용 요약 블록으로 이관. 유지: Hero + 다음 경기 + 활동 요약(M4) + 빠른메뉴 + 로그아웃. Client 유지(useSWR 패턴). 네비 라벨 "내 정보" 유지(변경 불필요). (8) **레거시 삭제**: `profile-header.tsx`(207L, import 0건). (9) **Prisma 마이그레이션 0** (User.is_public 도입 X, select-level 유지). 총 공수 ~8h (병렬 반영).
- **참조횟수**: 0

### [2026-04-20] L2 진입 전 audit — `/users/[id]` ↔ `/profile` 공통/차이
- **분류**: architecture
- **발견자**: planner-architect
- **내용**: L2 착수 전 현행 분석. (1) **`/users/[id]`** = Server 컴포넌트 + prisma 직접 7쿼리(Promise.all), `/api/web/users/[id]` 루트 route 없음. Hero+티어배지+MVP카드+레이더+시즌스탯+최근5경기. (2) **`/profile`** = `"use client"` + useSWR 3개(`/api/web/profile` + `/gamification` + `/stats`), ProfileShell 래퍼로 좌220px 네비 7항목 + 4카드 그리드(BasicInfo/Teams·Tournaments/Refund/Danger). (3) **공통 섹션**: Hero(아바타·이름·포지션/지역/신장), 팔로워/팔로잉 카운트, 승률(`getPlayerStats` 재사용), 경기수. (4) **본인 전용**: email/phone/birth_date/환불계좌/레벨·칭호/next_game/편집·설정·구독·결제·주간리포트. (5) **타인 전용**: 티어배지(경기수 기반)/MVP카드(더미)/레이더/시즌스탯/최근경기. (6) **컴포넌트 분산 맵**: radar-chart는 `profile/_components/`에서 `users/[id]/_components/user-radar-section.tsx`가 이미 import 재사용 ✅. Hero/MiniStat/RecentGames/StatsDetail은 전부 2벌 중복. `profile/_components/profile-header.tsx`(207L)는 어디에서도 import 0건 = 레거시. (7) **스키마**: User 모델(schema.prisma L11-168)에 `is_public`/`privacy`/`visibility` **전무** — 공개/비공개 정책은 `page.tsx`의 select 필드 whitelist로만 강제. (8) **간극 10건** / **선행 정책 질문 7건**(경로 전략 A vs B / 비공개 기본 범위 / User.is_public 도입 여부 / 티어 vs 레벨 통합 / `/profile` 정체성 / MVP 카드 처리 / Teams 섹션 공개 여부). (9) **공수 재추정 11~13h**(기획 15h 대비 −20% — 공용 컴포넌트 일부 선행 존재 + API 변경 불필요 확인).
- **참조횟수**: 0

### [2026-04-20] L3 다음 단위 — Organization 브레드크럼 + SeriesCard + EditionSwitcher
- **분류**: architecture
- **발견자**: planner-architect
- **내용**: L3 초입(eb9c910, 대회·시리즈 브레드크럼 4단) 후속. 영향 5파일(신규 2 + 수정 3). (1) 신규: `src/components/shared/edition-switcher.tsx`(이전/다음/전체 3버튼, Material Symbols chevron_left/apps/chevron_right, disabled 시 span 폴백, CSS 변수 색상) + `src/app/(web)/tournaments/[id]/_components/series-card.tsx`(로고+시리즈명+"M회차/전체 N회차"+"시리즈 전체 보기"+EditionSwitcher 내장, series_id 있을 때만 렌더). (2) 수정: `/organizations/[slug]/page.tsx`(shared/Breadcrumb 2단 삽입, 기존 시리즈 카드 목록 유지) + `/organizations/[slug]/series/[seriesSlug]/page.tsx`(인라인 nav 15줄을 shared/Breadcrumb 3단으로 교체) + `/tournaments/[id]/page.tsx`(series include에 tournaments select 추가하여 prev/next 계산 + Hero 직후 SeriesCard 삽입). (3) **신규 API 0** — 기존 `/api/web/series/slug/[slug]`가 이미 editions 배열 포함 완전 반환. `/api/web/series/[id]/editions`는 POST(회차 추가)로 이름 충돌 주의. (4) Prisma 변경 0 — `tournament.series_id BigInt?` + `edition_number Int?` 기존 필드 재활용. (5) 공식 기록 가드 해당 없음(메타만 조회). (6) **Organization 페이지 이미 존재** — 신규 라우트 아님. 브레드크럼만 누락된 상태였음.
- **참조횟수**: 0

### [2026-04-15] 팀명 2필드 구조 (Team.name_en + name_primary) + Referee 시스템 통합
- **분류**: architecture
- **발견자**: developer
- **내용**: Team 모델 2개 필드 추가 — name(한글 필수) + name_en(영문 선택) + name_primary("ko"|"en", 기본 "ko"). 대회/경기/랭킹 전역에서 name_primary에 따라 한글/영문 우선 표시. 동시에 subin-referee 브랜치의 Referee 시스템 14개 모델(associations, association_admins, referees, referee_documents, referee_matches, referee_payouts, referee_reviews 등)을 현재 schema에 통합하여 브랜치 간 schema 분기 해소.
- **참조횟수**: 0

### [2026-04-14] 대회 상세 페이지 전면 개편 (탭 4개 + 히어로 통합 + 1열)
- **분류**: architecture
- **발견자**: planner-architect
- **내용**: `/tournaments/[id]` 상세 페이지 구조 개편. (1) 탭 4개: 대회정보 / 대진표 / 일정 / 참가팀 (기존 "순위" 탭 제거 → 대진표에 리그 순위표 통합). (2) 히어로 통합: PREMIUM 뱃지 + 날짜/장소/참가비/팀수 요약 + 참가 신청 버튼 + 캘린더 추가 + 문의 버튼(settings.contact_phone 기반). (3) 레이아웃: 사이드바 완전 제거 → 1열 전체 너비. (4) 참가 현황 프로그레스바로 "N/max팀" 시각화. (5) 영향 파일: tournaments/[id]/page.tsx, tournament-hero.tsx(신규), tournament-tabs.tsx.
- **참조횟수**: 0

### [2026-04-14] 대진표 시스템 4단계 구현 (리그+토너먼트 자동 흐름)
- **분류**: architecture
- **발견자**: planner-architect
- **내용**: format별 대진표 시스템 단계적 구현. (1) Phase 1 — 풀리그 순위표: LeagueStandings 컴포넌트, 경기결과 실시간 집계(public-standings 패턴). (2) Phase 2A — 리그 완료 시 토너먼트 자동 팀 할당: assignTeamsToKnockout() 유틸, 순위 기반 TournamentTeam.seedNumber + homeTeamId 설정. (3) Phase 2B — 토너먼트 시드 뱃지 표시(TournamentTeam.seedNumber). (4) Phase 2C — 토너먼트 뼈대 미리 생성 + 슬롯 플레이스홀더(settings.homeSlotLabel="A조 1위" 등). (5) Phase 3 — admin wizard 포맷 세부설정(BracketSettingsForm, knockoutSize/thirdPlaceMatch/seedingMethod). (6) Phase 4a — 풀리그 경기 자동 생성(league-generator.ts, N*(N-1)/2 조합). 신규 파일: src/lib/tournaments/league-generator.ts, assign-knockout.ts.
- **참조횟수**: 0

### [2026-04-14] 토너먼트 트리 NBA.com 스타일 (BracketView 개편)
- **분류**: architecture
- **발견자**: developer
- **내용**: 기존 절대위치 데스크톱 + 탭형 모바일 이원화 구조를 SVG 기반 단일 트리로 통일. (1) BracketView SVG 트리로 모바일/PC 동일 렌더링 + 가로 스크롤 + 좌/우 네비 버튼. (2) 카드 분리형: home/away 개별 카드 + gap-0.5로 붙여서 표시. (3) 좌측 세로 띠: 팀 유니폼 색 반영, 미확정 팀은 BDR Red(홈)/Navy(원정). (4) 슬롯 플레이스홀더 텍스트 표시("A조 1위" 등). 영향 파일: bracket-view.tsx, match-card.tsx.
- **참조횟수**: 0

### [2026-04-14] 대회 선수 userId 자동 연결 시스템 (link-player-user.ts)
- **분류**: architecture
- **발견자**: developer
- **내용**: TournamentTeamPlayer.userId NULL 문제 해결 — 이름 매칭 기반 자동 연결 로직. (1) 핵심 유틸: src/lib/tournaments/link-player-user.ts(팀 멤버 이름 매칭으로 userId 설정, 정확 일치만 허용). (2) 현장 등록(v1 players API) 시 create 직후 자동 매칭. (3) admin 배치 API: /api/web/admin/tournaments/link-players (기존 NULL 데이터 일괄 정리). (4) 매칭 후보 2명 이상이면 skip(안전). (5) 프로필/랭킹의 userId 기반 집계 쿼리가 정상 작동하도록 복구.
- **참조횟수**: 0

### [2026-04-14] 사이트 전역 팀명/선수명 Link 전환
- **분류**: architecture
- **발견자**: developer
- **내용**: 모든 팀명 텍스트 → `<Link href="/teams/{teamId}">`, 모든 선수명 텍스트 → `<Link href="/users/{userId}">`로 전환. 대회 경기 카드, 랭킹, 프로필 등 전역 적용. 예외: 일정 카드 내부 팀명 — 카드 전체가 이미 Link라 중첩 불가 → 내부 팀명은 Link 생략. 영향 파일: 10+ 카드 컴포넌트.
- **참조횟수**: 0

### [2026-04-13] 대회 선수 등록 및 userId 연결 흐름 분석
- **분류**: architecture
- **발견자**: planner-architect
- **내용**: TournamentTeamPlayer.userId 연결 경로 전수 분석. (1) 웹 참가신청(POST /api/web/tournaments/[id]/join): TeamMember에서 userId를 받아 TournamentTeamPlayer에 설정 -- userId 항상 존재. (2) Flutter 현장등록(POST /api/v1/tournaments/[id]/teams/[teamId]/players): player_name+jersey_number만 입력, userId=null 고정, auto_registered=true -- NULL 원인. (3) admin 팀등록(POST /api/web/tournaments/[id]/teams): TournamentTeam만 생성, 선수 미등록 -- 이후 Flutter에서 등록하면 경로(2)와 동일. (4) 프로필/랭킹에서 대회 기록 조회는 모두 userId 기준(findMany/aggregate/groupBy). userId NULL이면 기록 미표시. (5) merge-temp-member.ts가 유사 패턴(이름매칭+병합)이나 TeamMember 전용이라 TournamentTeamPlayer와 무관. (6) unique 제약: @@unique([tournamentTeamId, userId])와 @@unique([tournamentTeamId, jerseyNumber]) 2개 존재.
- **참조횟수**: 0

### [2026-04-13] 대회 형식 프리셋 시스템 구조 설계
- **분류**: architecture
- **발견자**: planner-architect
- **내용**: 대회 조별리그+토너먼트 자동 구성 시스템 설계. (1) 신규 유틸 3파일: src/lib/tournaments/preset.ts(12개 프리셋 정의 + 팀수 기반 추천), group-draw.ts(스네이크 드래프트 조편성 + 조별리그 풀리그 경기 생성), knockout-seeding.ts(교차 시딩 + BYE 배정 + 3/4위전). (2) 신규 API: /api/web/tournaments/[id]/group-draw(POST 자동조편성, GET 조편성조회). (3) 수정: bracket/route.ts에 format 분기 추가(group_stage_knockout 시 조별+토너먼트 연속 생성). (4) 데이터 저장: Tournament.settings Json에 preset{totalTeams,groupCount,teamsPerGroup,advancingPerGroup,wildcards,knockoutSize,thirdPlaceMatch}와 groupDraw{method,groups,drawnAt} 저장. DB 스키마 변경 없음. (5) 기존 single_elimination 로직 유지, format별 분기로 새 로직 추가. (6) 조별리그 경기는 TournamentMatch.group_name만 설정, round_number/bracket_position은 null. 토너먼트 경기는 기존과 동일. (7) wizard UI에 프리셋 선택 + 조편성 확인/수정 단계 추가 예정.
- **참조횟수**: 0

### [2026-04-13] 경기 기록 입력 시스템 전체 구조 분석
- **분류**: architecture
- **발견자**: planner-architect
- **내용**: Flutter 앱(bdr_stat) 기록 입력 기능의 서버측 구조 전수 분석. (1) 2가지 기록 방식: 이벤트 기반(match_events 테이블, 실시간 득점/파울/리바운드 등 개별 이벤트 기록) + 최종 스탯 동기화(MatchPlayerStat 테이블, 경기 종료 후 전체 스탯 upsert). (2) API 구조: /api/v1/matches/[id]/events(이벤트 CRUD), /api/v1/matches/[id]/events/batch(배치 이벤트), /api/v1/matches/[id]/events/[eventId]/undo(이벤트 취소), /api/v1/matches/[id]/stats(스탯 CRUD), /api/v1/matches/[id]/roster(선수 명단), /api/v1/matches/[id]/status(경기 상태 전환), /api/v1/matches/[id]/live-token(실시간 채널), /api/v1/recorder/matches(기록원 경기 목록), /api/v1/duo/pair+join(2인 모드), /api/v1/tournaments/[id]/matches/sync(경기 데이터 동기화). (3) 인증: requireRecorder 미들웨어 — JWT 우선 + 대회 apiToken 폴백. super_admin/주최자/tournament_recorders 등록자만 접근 가능. (4) 실시간: Supabase Realtime Broadcast — Flutter가 채널(duo_{pin}_{matchId})에 score_update/timer_tick/quarter_change/pbp_event/team_foul/score_snapshot 6종 이벤트 broadcast, 웹 scoreboard 페이지가 구독하여 표시. (5) 점수 갱신: score-updater.ts가 득점 이벤트(2pt/3pt/1pt/score) 시 atomic increment로 homeScore/awayScore 갱신. (6) 상태 전환: scheduled→in_progress→completed/cancelled. 기록원은 scheduled→in_progress, in_progress→completed/cancelled만 가능. (7) 기존 웹 페이지: /scoreboard/[matchId](Supabase Realtime 구독, 실시간 스코어보드), /live(폴링 기반 라이브 경기 목록), /live/[id](폴링 기반 박스스코어+PBP 로그), /tournament-admin/.../recorders(기록원 관리).
- **참조횟수**: 0

### [2026-04-13] 심판 알림 시스템 + 공고 마감 자동화 설계
- **분류**: architecture
- **발견자**: planner-architect
- **내용**: 신규 모델 0개, 기존 인프라 전면 재활용. (1) **기존 `notifications` 모델(prisma/schema.prisma L1344, Rails 호환)** 그대로 사용 — user_id/notification_type/title/content/action_url/status(unread/read)/read_at. Referee.user_id로 심판에게 배달. (2) **기존 `src/lib/notifications/create.ts` + `NOTIFICATION_TYPES` 헬퍼**에 referee.* 5종(pool.selected/pool.chief_assigned/assignment.created/settlement.paid/announcement.new) 추가만. (3) **공고 마감 2중 방어**: lazy close(GET /announcements 진입 시 `updateMany({status:open, deadline:lt(now)} → closed)`) + 향후 Vercel Cron 매시간(/api/cron/referee-announcement-close). (4) **알림 생성 포인트 4곳**: pools POST(선정) / pools/[id]/chief PATCH / assignments POST / settlements/[id]/status PATCH. 각 API에 try/catch로 감싼 notify* 헬퍼 호출 — 알림 실패 시 메인 트랜잭션 유지. (5) **API 3개 신규**: GET /api/web/notifications(페이지네이션+unread_count) + PATCH /[id]/read + POST /read-all. (6) **UI**: referee-shell 헤더에 Material Symbols "notifications" 벨 + 우상단 빨간 뱃지(9+) + 드롭다운 최근 10개 + 전체 목록 /referee/notifications 페이지. (7) **구현 3차 분류**: 1차=types+헬퍼+lazy close+4 hook / 2차=API 3개+UI / 3차=Cron+이메일(선택). (8) **Vercel Cron 인프라 기존**: vercel.json에 3건 이미 등록(tournament-reminders/youtube/weekly-report), CRON_SECRET 검증 패턴 `src/app/api/cron/tournament-reminders/route.ts` L10-13 참고.
- **참조횟수**: 0

### [2026-04-13] 심판 경기 배정 워크플로우 v3: 공고→신청→선정→책임자→현장배정 6단계
- **분류**: architecture
- **발견자**: planner-architect
- **내용**: 기존 원스텝 배정 CRUD(RefereeAssignment 1모델)를 **다단계 워크플로우**로 확장. (1) 신규 Prisma 4모델 + 기존 1모델 수정: AssignmentAnnouncement(공고, dates DateTime[] 배열 + required_count JSON), AssignmentApplication(공고별 신청, unique(announcement_id, referee_id)), AssignmentApplicationDate(신청 일자 N:M 분리), DailyAssignmentPool(일자별 선정 풀 + is_chief 플래그로 책임자 포함, unique(tournament_id, date, referee_id, role_type)), 기존 RefereeAssignment에 pool_id nullable FK 1개만 추가(기존 데이터 0변경). (2) 신규 API 10개: 관리자 3(announcements CRUD) + 본인 2(공고 열람/신청) + 관리자 선정 5(applications 조회/선정/선정취소/책임자 토글/풀 조회), 기존 assignments API는 pool_id 검증 추가만. (3) 신규 페이지 3개: `/referee/admin/announcements`(+상세, 공고 관리 + 신청자 선정 + 책임자 지정), `/referee/applications`(본인 신청), `/referee/admin/pools`(일자별 풀 대시보드), 기존 `/referee/admin/assignments`는 3차에서 풀 기반으로 리팩토링(검색창 기반 referee-picker 컴포넌트). (4) 권한: 기존 `assignment_manage`(sga/referee_chief/game_chief) 그대로 재사용, admin-guard.ts 무수정. (5) 구현 3차 분류: 1차=공고+신청(뼈대), 2차=선정+책임자, 3차=현장배정 리팩토링. (6) 마이그레이션: pool_id nullable 유지 → 기존 배정 호환, 과도기 운영 가능.
- **참조횟수**: 0

### [2026-04-12] 심판 플랫폼 재설계 v2: Association 계층 + 배정/정산 조회 포함
- **분류**: architecture
- **발견자**: planner-architect
- **내용**: MVP 1차 범위 확장. (1) Prisma 신규 모델 6개: Association(계층형 self-relation, 20개 시드=KBA 1 + 시도 17 + KBL/WKBL 2), AssociationAdmin(매핑 테이블, user_id unique), Referee, RefereeCertificate(file_url 제거 + cert_number 추가 + verified_by_admin_id), RefereeAssignment(tournament_match_id/game_id FK 2개, 관계 선언 없이 컬럼만 → 기존 games/TournamentMatch 0수정), RefereeSettlement(assignment_id unique). (2) ALTER TABLE 0건 — users 0수정(옵션 B: AssociationAdmin 매핑 테이블 채택), CREATE TABLE 6건만. (3) 라우트: (referee)/referee/{layout, page, profile, certificates, assignments, settlements, admin/{layout, page, members, bulk-verify}}. 심판 공개 목록 제거(registry 삭제). admin layout에서 admin_role=association_admin + AssociationAdmin 행 존재 이중 가드. (4) API 17개: 본인 Referee CRUD 4 + 본인 Certificate CRUD 4 + Association 공개 목록 1 + 본인 배정/정산 조회 2 + Admin 6(소속 심판 목록/상세/개별검증토글/Excel preview/Excel confirm/대시보드). (5) Excel 업로드 2단계 UX: preview(파싱+매칭, DB미변경) → confirm(트랜잭션 일괄 verified=true). 컬럼 표준 9열(협회코드/실명/생년월일/전화/종류/등급/번호/발급일/갱신일). xlsx 패키지 기존 존재. (6) 경기 엔티티는 3종(games 소문자 BigInt, TournamentMatch BigInt, pickup_games) — 배정 대상은 tournament_match_id/game_id 2개 FK로 분리. (7) Association 시드는 prisma/seed.ts + package.json prisma.seed 스크립트, REGIONS(src/lib/constants/regions.ts) 키 17개 재사용. (8) 이전 v1(단일 Referee+Certificate 2모델, 공개 목록, 파일업로드)에서 6모델/조회전용배정정산/Excel검증/공개제거로 확장.
- **참조횟수**: 0

### [2026-04-12] 심판 플랫폼 라우트 그룹 (referee) 설계
- **분류**: architecture
- **발견자**: planner-architect
- **내용**: 심판/경기원 플랫폼 MVP 1차를 `src/app/(referee)/` 신규 라우트 그룹으로 분리. (1) 라우트 트리: `(referee)/referee/layout.tsx`(독자 셸: 상단 BDR 로고+"심판 플랫폼" 타이틀+테마토글, 좌측 사이드네비[대시보드/목록/자격증], 모바일 하단탭) + `page.tsx`(대시보드, 서버, getWebSession) + `registry/[page|new|[id]/[page|edit]]` + `certificates/[page|[id]]`. (2) 각 페이지 유형: 목록=Client(SWR fetch), 상세=Server(prisma 직접), 폼=Client. (3) (web) layout.tsx는 거대한 "use client" 파일이라 재사용 불가 — referee는 globals.css/CSS 변수/테마토글/Material Symbols만 공유하고 셸은 자체 구현. (4) 신규 컴포넌트 6종(referee-shell/referee-card/referee-form/certificate-card/certificate-form/empty-state)은 (referee)/referee/_components/ 하위에 격리. (5) API: `src/app/api/web/referees/*`(GET/POST + [id] GET/PUT/DELETE) + `src/app/api/web/referee-certificates/*`(동일). 모두 withWebAuth + zod + prisma 직접 패턴. (6) 기존 (web)/(admin)/(site) 코드는 건드리지 않음 (읽기만).
- **참조횟수**: 0

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
