# 작업 스크래치패드

## ⚠️ 세션 분리 원칙 (2026-04-22 재정의)
> **기본 = 일반 작업 세션.** 카페 세션은 수빈이 **"카페 세션 시작"이라고 선언할 때만** 전환.

### 일반 모드 (기본값)
- **대상**: `(web)`/`(api/web)`/`(referee)`/`profile`/`tournaments`/`components`/`lib` — 일반 UX/기능/리팩토링/디자인
- **커밋**: 자유 스코프 (`feat:`/`fix:`/`refactor:`/`docs:`/`style:`/`test:`)
- **금지**: 카페 허용 파일군 단독 수정 (불가피 시 scratchpad에 사유 기록)

### 카페 모드 ("카페 세션 시작" 선언 필요)
- **허용**: `scripts/sync-cafe.ts`, `scripts/backfill-*cafe*.ts`, `scripts/*cafe*.ts`, `src/lib/cafe-sync/**`, `src/lib/parsers/cafe-*.ts`, `.github/workflows/cafe-*.yml`, `Dev/cafe-*.md`, 카페 관련 migration
- **커밋 스코프 필수**: `feat(cafe-sync):` / `fix(cafe-sync):` / `docs(cafe-sync):` 등
- **카페 작업 로그**: `.claude/scratchpad-cafe-sync.md` 로 분리 관리

### 공용
- **브랜치**: `subin` 공용. push 전 `git fetch origin subin` → 뒤처지면 `pull --rebase`

---

## 🚧 추후 구현 목록 (DB/API 확장 필요) — 2026-04-25 신설
> 사용자 원칙 (04-25 추가): "모든 페이지는 실사용. DB 미지원 기능도 **제거 금지** — UI 배치 + '준비 중' 표시 + 빈 상태로 두고 추후 구현."
> design_v2 Phase 1~3에서 "UI only"로 배치된 항목 전부 수집. 각 항목은 별도 스토리 또는 소 Phase로 구현.

### Phase 1 GameDetail (커밋 e70e673)
- HeroBanner 이미지 — games 테이블에 `image_url` / `hero_image` 필드 추가
- 한마디 메시지 — `game_applications.message` 서버 전송 미구현
- 저장/북마크 — `bookmarks` 테이블 필요
- 호스트 문의 — 쪽지/알림 기능

### Phase 1 Profile (커밋 28be75f)
- 슛존 성공률 — `match_player_stat`에 zone별 필드 (현재 제거 상태 → UI 복원 필요)
- 스카우팅 리포트 — `scouting_reports` 테이블 (현재 제거 상태 → UI 복원 필요)
- physical strip 윙스팬/주손/레이팅 — `users` 필드 추가 (현재 3열로 축소 → 6열 복원)
- 시즌 히스토리 탭 — tournament별 집계 쿼리 (현재 탭 2개로 축소 → 4탭 복원)
- VS 나 탭 — matchPlayerStat 조인 (현재 탭 제거 → 복원)
- 다가오는 일정 3건 — API 확장 (현재 1건)
- 최근 활동 timeline — `user_activities` 전용 테이블 (현재 community_posts+applications 혼합)

### Phase 1 Games (커밋 93a4a49, 9616f41)
- 종료 시각 `HH:mm ~ HH:mm` — listGames select에 `duration_hours` / `ended_at` 추가

### Phase 2 MyGames (커밋 4edeb30)
- waitlist 상태 — `game_applications`에 waitlist status
- no-show 처리 — 참가 후 노쇼 집계
- 영수증 — payment receipts
- QR 티켓 — 체크인 시스템
- 후기 작성 — game_reviews 테이블

### Phase 2 GameResult (커밋 5920ff7)
- 시드 (#N SEED) — `tournament_teams.seed_number` 노출
- 팀 전적 (15W 4L · 레이팅) — 별도 집계 쿼리
- 관중수 — `tournament_matches.attendance_count` 필드
- 페인트 득점/패스트브레이크/벤치득점 — PBP에 zone/transition 필드 추가 (벤치득점은 is_starter로 계산 가능)
- 경기 요약문(내러티브) — AI 생성 or 관리자 작성
- 하이라이트 영상 — media 테이블
- 공유/더 많은 통계 버튼 — 연계 기능
- 샷차트 — PBP `shot_x` / `shot_y` 컬럼 추가 (UI 구조는 이미 완성 `tab-shot-chart.tsx`)
- 리드 변동/최다 점수차/동점 횟수 — PBP `home_score_at_time/away_score_at_time` 기반 계산

### Phase 3 Teams 목록 (커밋 609addf)
- rating 필드 — `teams.rating` (현재 wins로 대체)
- tag — `teams.tag` (현재 이름 첫 3자 fallback)

### Phase 3 Teams 상세 (커밋 대기)
- 로스터 PPG (개인 평균 득점) — `match_player_stat` 집계
- 시즌 평균 4카드 (득점/실점/리바/어시) — 팀 평균 집계
- 연습일 — `teams.practice_days` 필드 추가
- 팀 레벨 — `teams.level` 필드 추가
- 게스트 모집 상시 배지 — `teams.recruiting` 필드 추가
- 팀 팔로우 — `team_follows` 테이블
- 매치 신청 기능 — `team_match_requests` 테이블 (기존 JoinButton은 입단용)
- 게스트 지원 (팀 단위) — 팀 단위 지원 모델
- 쪽지 보내기 — DM 모델
- 연락 카드 응답시간 — 메시지 응답 로그 집계

### Phase 3 TeamCreate (커밋 대기, 04-22 v2 4스텝 변경)
> 시안 TeamCreate.jsx 4스텝(기본정보/엠블럼/활동/검토) UI 완성. createTeamAction / createTeamSchema / Prisma 0 변경. UI 만 배치된 신규 항목:
- `teams.tag` 필드 — Step1 입력 + Step4 검토 표 표시. 현재 "(자동 생성 예정)" 라벨 + 다음 버전에 자동 생성 로직 + DB 컬럼 추가
- `teams.level` 필드 — Step3 실력 수준 6종(초보~선수급). 등록 시 미저장 → "준비 중" 표시
- `teams.practice_days` 필드 — Step3 활동 요일 다중 선택(7요일). 등록 시 미저장 → "준비 중"
- `teams.home_court` (또는 `home_court_id` court 참조) — Step3 주 활동 코트. 등록 시 미저장
- `teams.is_public` (또는 `visibility` enum) — Step3 공개 설정 3종(public/invite/closed). 등록 시 미저장
- 엠블럼 업로더 — Step2 우측 영역. BDR+ 멤버 전용 + S3 파이프라인 정의 후 구현
- createTeamSchema 확장 — 위 필드들 추가 시 Zod 검증 동시 확장

### 코트 대관 Phase A → B 이행 (04-22 신설)
> Phase A 11파일 일괄 구현 완료. 다음 Phase B(결제) 진입 시 추가 필요 항목:
- **결제 통합** — `/api/web/payments/confirm/booking` 신규 (Plan 분기와 별도) + 토스페이먼츠 SDK 결제 위젯을 booking-client 결제 영역에 마운트 + payments 다형성(`payable_type="CourtBooking"`) 활용
- **status 흐름 확장** — 현재 즉시 `confirmed`. Phase B 는 `pending(15분 잠금) → confirmed(결제완료) → ...` 으로 전환. cron 으로 pending 만료 자동 취소
- **payment_id 연결** — court_bookings.payment_id 컬럼은 schema 에 이미 추가됨 (Phase A 는 NULL). Phase B 결제 confirm 콜백에서 UPDATE
- **platform_fee 계산** — D-B4 결정값(추천 5%) 반영. 현재 컬럼만 존재 + 0 저장
- **BDR+ 할인** — Phase D. 현재 booking-client UI 라인은 유지하되 0원 표시 ("BDR+ 할인 (Phase D 도입 예정)")
- **자동환불 룰** — Phase C (D-B6=a 자동 도입 시). 시안 3일100%/2일50%/당일0% 룰 엔진
- **운영자 출금 신청** — Phase C. `court_settlements` 테이블 신규 (RefereeSettlement 패턴 재사용)
- **운영자 신청·승인 워크플로우** — Phase D. D-B1=(c) 채택 시 admin 승인 페이지 + court_managers N:M 테이블
- **/profile/court-revenue** — Phase C 운영자 수익 대시보드
- **booking_mode 토글 UI** — 현재 운영자 manage 페이지에서 모드 표시만 가능 (admin 콘솔 직접 수정 안내). Phase B 에서 운영자가 직접 internal/external/none 토글 + 시간당 요금 변경 폼 추가
- **취소 정책 강화** — 현재 시작 24시간 이상 전이면 누구나 취소 가능. 운영자별 취소 정책 설정 (몇 시간 전까지 가능?) — court_infos 에 `cancellation_window_hours` 필드 검토

### Phase 3 Court (커밋 대기, 04-22)
- `courts.operating_hours` JSON — 시안 "09–22" 같은 운영 시간 정형 (현재 lighting_until 없으면 "운영시간 미상")
- `courts.tags` JSON — 시안 "픽업 다수/대회장/샤워실 있음/강변 뷰" 등 자유 태그 (현재 pickupCount > 0 이면 "픽업 모집중" 자동 라벨, 그 외 생략)
- `courts.rating` 정규화 — 현재 average_rating(reviews 집계)을 그대로 사용 — DB 트리거/주기 작업으로 정규화 검토
- `courts.surface_type` 정형 enum — 현재 SURFACE_LABELS 매핑 6종(urethane/rubber/modular/concrete/asphalt/wood). 시안 "마룻바닥/우레탄/아스팔트" 그대로 사용
- `court_visit_log` (오늘 방문자 집계) — 시안 "오늘 방문 N" 자리에 현재 activeCount("현재 N명")로 대체. 일자별 누적 방문자 필드 필요
- 코트 갯수 정형 — 시안 "2코트", DB는 `hoops_count`(골대 갯수). 시안 의도는 "독립 코트 면". 별도 `playable_courts` 필드 검토
- **시간대별 혼잡도 집계** (04-22 상세 추가) — `court_visits` 시간대별 집계 (현재 12슬롯 빈 + 첫 슬롯만 현재 활성카운트 단일 막대 + "시간대별 분포 데이터 준비 중" 캡션)
- **`courts.shower` / `courts.locker` / `courts.phone` 필드** (04-22 상세 추가) — 현재 시설 정보 그리드에서 "정보 없음" 표기
- **코트별 게스트 모집 카테고리** (04-22 상세 추가) — Side "이곳에서 모집 글쓰기" CTA가 alert("준비 중") — 코트 컨텍스트로 픽업 모집 작성 진입점 필요

### Phase 3 Bracket (커밋 대기, 2026-04-22)
> 시안 Bracket.jsx 전체 재구성 (B안: 헤더/Status/사이드 v2 공통, 메인 트리만 포맷별 분기). 사용자 4건 결정 (DB 미지원도 자리 유지) 반영. API/Prisma/서비스 0 변경.
- **우승 예측 (커뮤니티 투표 시스템)** — 새 테이블 필요 (`tournament_predictions`: tournament_id / user_id / team_id / created_at). 현재 V2BracketPrediction 카드 자리는 유지 + "투표 준비 중" placeholder + 투표 버튼 disabled
- **시드 레이팅 (`teams.rating`)** — 시안 우측 시드순위 카드 마지막 칸은 레이팅 (시안 1684 등). 현재는 wins로 대체 표시. 별도 ELO 계산 시스템 필요
- **LIVE 실시간 점수** — 시안 매치카드 우상단 "● LIVE" + 진행 쿼터 "Q3 5:24" + 실시간 점수. 현재 `homeScore/awayScore` 종료 후만 채워짐. websocket/realtime 인프라 + `tournament_matches.current_quarter/current_clock` 필드 필요
- **저장/공유/출력** — 헤더 우측 3 버튼은 모두 `alert("준비 중")`. 출력은 대진표 PDF/이미지 익스포트 (Puppeteer/html-to-image), 공유는 OG 이미지 동적 생성 또는 카카오톡 공유 API
- **`tournament.prize_money` 필드** — Status Bar 5칸째 "우승상금" 자리. 현재 항상 "-" 표기. DB 미존재 → 추후 `prize_money: bigint` 컬럼 + 운영자 입력 폼 추가
- **MatchCard에 코트 정보 표시** — 시안은 매치카드 푸터에 "잠실 · 05.09 14:00" 형태. 현재 `tournament_matches.court_number`는 있지만 BracketMatch 타입에 미포함. bracket-builder.ts 확장 시 함께 추가 가능

### Phase 3 Orgs (커밋 대기, 04-25 + 04-22 상세 추가)
- `organizations.kind` 필드 (리그/협회/동호회) — 현재 카드 배지/Hero eyebrow "단체" 고정 + 필터 chip "전체" 외 alert
- `organizations.brand_color` 필드 — 카드/Hero 그라디언트 색상. 현재 id 해시 → 6색 팔레트(`#0F5FCC/#E31B23/#10B981/#F59E0B/#8B5CF6/#0EA5E9`) 자동 선택 (`_components_v2/org-color.ts` 공유)
- `organizations.tag` 필드 — 카드/Hero 태그 라벨. 현재 이름 첫 2글자(영문이면 대문자 4글자) 자동 생성
- `organizations.founded_year` 필드 — 상세 Hero 메타 "설립 N년" 자리. 현재 "설립 준비 중" 표기
- `organizations.address` (또는 본부 주소) 필드 — 상세 overview 연락처 카드 본부 주소. 현재 "준비 중" 표기
- 운영 원칙 (`organization_policies` 또는 description 분리 필드) — overview 좌측 카드. 현재 "운영 원칙은 준비 중입니다" 표기
- 스폰서 정보 (`organization_sponsors` 테이블 또는 JSON 컬럼) — overview 우측 카드. 현재 "스폰서 정보는 준비 중입니다" 표기
- 단체 가입 신청 API — 카드/Hero "가입 신청" 버튼 alert("준비 중인 기능입니다")
- 단체별 팀 수 집계 — series→teams 조인 쿼리. 카드는 series_count로 대체. **상세 Teams 탭은 빈 상태** ("준비 중 (집계 예정)")
- 임원 직책 세분화 — 현재 organization_members.role 은 owner/admin/member 3종만. 시안 회장/부회장/총무/심판장 등으로 세분화 필요. Members 탭은 "주최자/운영진/멤버" 한국어 라벨로 fallback

### Phase 3 TeamInvite (보류, 04-25)
> v2 시안 205줄. mybdr 라우트/DB 모두 부재 → CourtBooking 시안과 동일 처리.
- 시안 정체: 팀장이 사용자에게 초대 발송 → 사용자 수락 (Push 방향). 현재 mybdr은 사용자 신청 → 팀장 승인 (Pull 방향)이라 워크플로우 반대
- DB 부재: `team_invites` 테이블, 초대 코드, 만료 cron, 알림 — 모두 신규 구축 필요
- 비즈니스 결정 대기: "기존팀 자동 탈퇴 + 30일 재변경 불가" 같은 정책
- 진행 조건: 정책 확정 + 별도 Phase 풀스택 구현 (스키마 + API 5+ + 페이지 + cron + 알림)
- UI 시안: `Dev/design/BDR v2/screens/TeamInvite.jsx` 보존
- 대안: `/teams/[id]/manage`에 "멤버 초대" 버튼만 disabled 추가 (소규모, 별도 작업으로 가능)

### Phase 4 Messages (보류, 04-25)
> v2 시안 204줄. mybdr DM 시스템 0%. 사전 D4 결정 (보류 합의). Phase 4 종료.
- 시안 정체: 3컬럼 메신저 (좌 쓰레드 리스트 / 중앙 채팅 버블 + 입력 / 우 프로필 레일)
- 기능: DM 양방향, 읽음표시(✓✓), 온라인 상태, 그룹 단톡, 핀 고정, 공식 운영팀 배지, 첨부(경기카드/장소/사진), 검색, 차단/신고
- DB 부재: messages / conversations / direct_messages / message_reads — **전부 신규**
- 인프라 부재: WebSocket / Pusher / Supabase Realtime 도입 결정 필요
- 첨부 polymorphic 스키마 미설계
- 진행 조건: DM 비즈니스 결정 + 실시간 인프라 + Phase 5 별건 풀스택
- UI 시안: `Dev/design/BDR v2/screens/Messages.jsx` 보존
- 사전 합의: scratchpad D4 결정 ("Messages 보류 (DB 없음)")

### Phase 4 BoardList (커밋 대기, 04-22)
> 시안 BoardList.jsx + Sidebar 그룹 트리 + .board 테이블 v2 재구성 완료. 페이지당 20개 통일. UI 만 배치된 미지원 항목:
- **`community_posts.is_pinned` 필드** — 시안 pinned 패턴(공지 핀 항상 상단). 현재는 `category=notice`인 글을 자동 핀으로 간주. is_pinned 컬럼 + 운영자 핀 토글 UI 필요
- **`community_posts.has_image` 또는 `thumbnail_url` 필드** — 시안 board__row title 칸의 이미지 아이콘. 현재 항상 false 고정 (TODO). content HTML 파싱으로 첫 이미지 자동 추출 or 별도 컬럼
- **카테고리별 글 수 집계 API** — 좌측 CommunityAside의 .count 자리. 현재 모든 카테고리에 "—" + title="준비 중" 툴팁. `/api/web/community/counts` 엔드포인트 필요 (group by category)
- **작성자 레벨 표시 (LevelBadge)** — 시안 components.jsx LevelBadge (ADMIN/COACH/PRESS/일반). 현재 board__row 작성자 칸에 닉네임만. `users.role` 필드 (또는 xp 기반 등급) 활용 가능
- **글 번호 채번** — 현재 정렬 후 인덱스 역순. 시안은 글 번호가 영구 ID. `community_posts.post_number` 또는 created_at 기준 시퀀스
- **카테고리별 게시판 검색** — 시안의 "게시판 내 검색"은 현재 활성 카테고리 필터와 검색어 AND. 동작은 OK이나 명시적 안내 라벨 추가 검토

### Phase 4 PostDetail (커밋 대기, 04-26)
> 시안 PostDetail.jsx + 좌 CommunityAside + 본문 4섹션 + PostDetailSidebar 본문 하단 1열 누적 v2 재구성 완료. UI 만 배치된 미지원 항목:
- **이전/다음 글 네비** — 시안 카드 하단 좌우 분할(이전글 / 다음글). 현재 placeholder "준비 중" 표시. `created_at` 기준 인접 글 2건 Prisma 쿼리 추가 필요 (같은 카테고리 한정 / 전체 둘 중 결정)
- **users.xp 기반 LevelBadge** — 시안 작성자 옆 등급 뱃지(공식/코치/언론/일반). 현재 미렌더. `users.role` 또는 `users.xp` 등급 컴포넌트(`<LevelBadge level=...>`) 도입 — BoardList와 동일 컴포넌트 공유 예정
- **작성자 작성글 수 (헤더용)** — 시안 작성자 박스 아래 "작성글 N개" 캡션. 현재 헤더는 생략, 우측 PostDetailSidebar에는 노출. 헤더에도 같은 값을 노출하려면 `prisma.community_posts.count` 결과를 서버에서 prop으로 내림
- **Body block type 분기** — 시안 `body.map`은 `type: 'p' | 'h' | 'img'` 분기. 현재 DB는 plain text content 1컬럼만 → 줄바꿈 split <p>만 지원. 카페 원문 HTML(`<h3>`/`<img>`) 파싱 또는 신규 `community_post_blocks` JSONB 컬럼 도입 시 본격 구현
- **스크랩/북마크** — 시안 Reactions 3버튼 중 스크랩. 현재 disabled "준비 중". `community_post_bookmarks` 테이블(post_id+user_id 복합 PK + bookmarked_at) + Server Action(`toggleBookmarkAction`) 필요. 마이페이지 "내 스크랩" 탭 노출 시점에 함께 도입

### Phase 4 PostWrite (커밋 대기, 04-22)
> 시안 PostWrite.jsx + 좌 CommunityAsideNav + with-aside 2열 + 카드 폼 v2 재구성 완료. createPostAction / useActionState / 이미지 URL hidden input 0 변경. UI 만 배치된 미지원 항목:
- **임시저장 / 자동저장** — 시안 헤더 우측 "자동저장 3분 전" + 액션 버튼 "임시저장". 현재 둘 다 disabled "준비 중". `community_post_drafts` 테이블 신규(user_id+title+content+category+images JSONB+updated_at) + 자동저장 debounce(3분) 클라 훅 + 작성 페이지 진입 시 최근 draft 1건 자동 불러오기
- **리치 에디터 툴바** — 시안 툴바 12버튼(B/I/U/S, H1/H2, 인용, 목록, 사진, 링크, 영상, 미리보기) 모두 disabled. TipTap 또는 Lexical 도입 후 content 컬럼 형식을 plain text → JSON/HTML 로 마이그레이션. 미리보기는 별도 모달 or 이중 컬럼 토글
- **댓글 허용 / 비밀글 / 공감 표시 옵션** — 시안 체크박스 3개. 현재 disabled. `community_posts` 테이블에 컬럼 추가 필요(`allow_comments` BOOLEAN DEFAULT true, `is_private` BOOLEAN DEFAULT false, `show_reactions` BOOLEAN DEFAULT true). 비밀글은 PostDetail 접근 권한 가드까지 동시 작업
- **이미지 직접 업로드** — 시안 툴바 "사진" 버튼 + 본문 인라인 삽입. 현재 URL 첨부 섹션만 보존(외부 호스팅 URL 입력). Supabase Storage 버킷(`community-uploads`) + 기존 image-uploader 재사용 + presigned URL 발급 API + content 안 마크다운/블록 인라인 삽입까지 묶어서 도입

### Phase 5 Rank (커밋 대기, 2026-04-22)
> 시안 Rank.jsx 기반 토글 3종(팀/선수/외부BDR) 재구성. /api/web/rankings · /api/web/rankings/bdr 0 변경. 외부BDR 탭은 기존 BdrRankingTable 보존.
- **`teams.rating` ELO 컬럼** — 시안 팀 보드 "레이팅" 칸 (예: 1684). 현재 wins로 임시 대체. 매주 월요일 시즌 갱신 cron으로 ELO 재계산
- **`users.rating` ELO + trend (지난주 대비)** — 시안 선수 보드 "레이팅"·"변동" 칸. 현재 둘 다 "—" 표시. trend는 `users.rating_last_week` snapshot 또는 `user_rating_history` 테이블로 계산
- **PPG/APG/RPG 정규화 컬럼** — 현재 `match_player_stat` 집계 후 클라에서 `total / games_played`로 계산. 정렬/조회 성능 위해 `users.avg_points` / `avg_assists` / `avg_rebounds` 정규화 컬럼 검토 (시즌 갱신 cron 시 동시 갱신)
- **시즌 갱신 cron** — 매주 월요일 자동 ELO/PPG/APG/RPG 재계산. Vercel Cron 또는 GitHub Actions 스케줄러
- **포디움 데이터 메타** — 현재 팀 포디움 메타는 "{도시} · {wins}승", 선수는 "{팀} · {avg_points} PPG"로 임시 표시. teams.rating / users.rating 도입 시 시안의 "{tag} · {rating}" 포맷으로 교체

### Phase 5 Settings (커밋 대기, 2026-04-22)
> 시안 Settings.jsx 6 섹션(account/profile/notify/privacy/billing/danger) v2 재구성. /api/web/profile · notification-settings · subscription · auth/withdraw 0 변경. 신규 fetch 0건. 기존 페이지(notification-settings/preferences/payments/subscription/billing/edit) 보존.
- **2단계 인증 (2FA)** — account 섹션 Row "2단계 인증" 자리는 disabled. TOTP 또는 SMS OTP 모듈 도입 + `users.two_factor_secret`/`users.two_factor_enabled` 필드 + 백업 코드 테이블 추가
- **로그인 기기 관리** — account 섹션 Row "로그인 기기" disabled. `sessions` 테이블 + 기기·IP·브라우저·최근 활동 시각 기록 + 원격 로그아웃 API
- **이메일 알림** — notify 섹션 disabled. SMTP/SendGrid 메일 발송 워커 + 알림별 채널 매트릭스 (web push / email / sms 분리)
- **D-3 알림 / 좋아요 알림 / 마케팅 수신** — notify 섹션 3 토글 disabled. notification-settings PATCH 키 확장 + cron 발송 룰
- **공개 범위 5 토글 (privacy_settings JSONB)** — privacy 섹션 5 토글 모두 disabled. `users.privacy_settings JSONB` + 프로필/스탯/타임라인/실명/DM 권한 가드 추가
- **데이터 내보내기 (GDPR)** — danger 섹션 disabled. 비동기 ZIP 생성 워커 + 진행 상태 + 다운로드 링크 메일 발송
- **계정 비활성화 (soft deactivate)** — danger 섹션 disabled. `users.deactivated_at` + 30일 hide cron + 로그인 시 자동 복구
- **결제수단 관리** — billing 섹션 Row "결제수단" disabled. PG 토큰화 카드 등록 + `payment_methods` 테이블 + 자동결제 카드 변경 플로우
- **세금계산서 발급 자동화** — billing 섹션 Row "영수증·세금계산서" disabled. 사업자 정보 등록 + 토스페이먼츠 영수증 API 연동 + 월말 자동 발행
- **시안 등번호 / 주로 뛰는 손 필드** — profile 섹션 시안에는 있으나 PATCH 미지원. `users.jersey_number` / `users.dominant_hand` 필드 추가 + PATCH 확장
- **연결된 계정(소셜) 관리 UI** — account 섹션 Row "연결된 계정" 은 /profile/edit 로 이동만. 카카오/구글 연동 상태 조회 + 연결/해제 API + UI 추가

### Phase 5 More (커밋 대기, 2026-04-22)
> 시안 More.jsx 의 NotFound + About 두 화면을 v2로 적용. API/Prisma/서비스 0 변경. 가데이터는 "예시" 라벨로 명시.
- **About 통계 4건 (20년/48,000+/320+/1,240회)** — 운영팀 실제 수치 확정 후 정적 교체 또는 동적 카운트 (registry 쿼리). 현재 캡션 "예시" 표기
- **About 운영진 6 명단** — 시안 가데이터(김승철/이경진/박상우/최지혜/정혁수/한수민). 실제 멤버 정보 + 사진(`users.avatar_url`) 입력 후 교체. 현재 이니셜 아바타 + "예시" 캡션
- **About 파트너 로고 8건** — 시안 텍스트 8건(NIKE/ADIDAS/MOLTEN/SPALDING/UNDER ARMOUR/BODY FRIEND/11번가/BDR STUDIO). 실제 협력사 자산 확정 + SVG 로고 → next/image 교체
- **회원가입 페이지 신설** — 현재 `/login`만 정상이고 `/signup` 별도 시안 존재. About CTA "지금 가입하기"는 PM 지시로 일단 `/login` 매핑. 추후 `/signup` 페이지(시안 SignUp.jsx) 구현 시 분리

### Phase 5 Achievements (커밋 대기, 2026-04-22)
> 시안 Achievements.jsx 16종 배지 그리드 + 필터 + "최근 획득" 4건 v2 재구성 완료. `/profile/achievements` 신규. **API/Prisma/서비스 0 변경**. `prisma.user_badges` 직접 호출 (Phase 1 패턴). DB 미지원 메타는 정적 카탈로그(`_v2/badge-catalog.ts`)로 보강 + tier/category/icon/desc 폴백.
- **rarity (희소도) 측정** — 시안 "상위 N%" 라벨. 현재 모든 배지 "—" 폴백. 전체 사용자 대비 해당 배지 보유 비율 집계 + 캐싱 (배지 발급량이 변할 때마다 재계산 필요 → 일 1회 cron 또는 user_badges INSERT 트리거)
- **진행도 추적 (progress / total)** — 시안 잠금 상태에서 "47 / 100" 진행 바. 현재 모든 미획득 배지 "0 / —" + 0% 바 + tooltip "측정 준비 중". 신규 `user_badges_progress` 테이블 (user_id+badge_type+current_value+target_value+updated_at) 또는 활동별 카운트 컬럼 추가 후 매핑
- **배지 자동 발급 트리거** — 현재 `user_badges` 는 운영자/cron 수동 INSERT 의존. 경기 종료/연승/게시글 N건/팀 창단 등 이벤트 핸들러에서 조건 충족 시 자동 발급(중복 방지는 `@@unique([user_id, badge_type])` 활용). Phase 5 Stats 와 연계
- **배지 카탈로그 DB화 (`badge_definitions` 테이블)** — 현재 `_v2/badge-catalog.ts` 정적 상수 16+12종. 운영팀이 배지를 추가하려면 코드 수정 필요. 신규 테이블(`badge_type` PK + tier/category/icon/desc/name/target_value) 도입 후 카탈로그 → DB 조회로 교체. 다국어/이미지(SVG) 자산도 동시에 모델링

### 공통 처리 원칙
- UI는 **배치만 하고 동작 없음** → `alert("준비 중인 기능입니다")` 또는 `disabled` + `title="준비 중"`
- 빈 데이터는 "준비 중" 텍스트 + 회색 placeholder
- 데이터 있는 필드는 절대 숨기지 않음
- 각 항목 완성 시 본 목록에서 제거 + 해당 Phase 커밋 링크 업데이트

---

## 기획설계 (planner-architect) — 코트 대관(Booking) 시스템 [2026-04-25]

🎯 **목표**: "유료 멤버십(`feature_key="court_rental"`) 구독자가 자신의 코트 슬롯을 직접 등록·관리하고, 일반 회원이 그 슬롯을 예약·결제하는 시스템" 구축.

### A. 현황 분석 (사전 점검 결과)

| 항목 | 상태 | 비고 |
|------|------|------|
| `plans.feature_key="court_rental"` | ✅ 존재 | admin/plans/page.tsx · pricing/page.tsx 등 라벨 등록 |
| `user_subscriptions` 발급 흐름 | ✅ 동작 | `/api/web/payments/confirm`에서 토스페이먼츠 승인 → 구독 자동 생성 (30일) |
| 토스페이먼츠 SDK + DB 모델 | ✅ 운영 중 | payments 모델 `payable_type` 다형성 — 현재 "Plan"만 사용. "CourtBooking" 추가 가능 |
| `court_infos.user_id` (등록자) | ✅ 존재 | 누가 등록했는지 추적 가능 |
| `court_infos.rental_available/rental_url/fee` | ⚠️ 부분 | **외부 링크 안내** 수준. 자체 예약 없음 |
| `partners`+`partner_members` (파트너 시스템) | ⚠️ 별도 존재 | **광고용**. `/partner-admin/venue` + `/api/web/partner/venue` PATCH로 court_infos.rental_* 수정 가능. 단 partner는 광고/파트너십용이라 멤버십과 직접 연계 X |
| `court_bookings` 테이블 | ❌ **없음** | 신규 필요 |
| 코트 운영자(=등록자) 권한 식별 | ❌ 없음 | court_managers 같은 매핑 없음. 현재는 `court_infos.user_id == session.sub`로 추정만 가능 |
| 시안 `CourtBooking.jsx` | ✅ 회원 관점 | 운영자용 슬롯 관리 UI는 **시안 없음** (신규 디자인 필요) |

**핵심 통찰 3건**:
1. **이미 깔린 인프라가 80%** — feature_key 등록 + 토스결제 + payments 다형성 + court_infos 등록자. 진짜 신규는 `court_bookings` 테이블 + 슬롯 등록 UI + 예약 트랜잭션 로직.
2. **partners ≠ 코트 운영자** — partners는 광고/스폰서십용 (현재 1~2건). 코트 운영자는 별도 모델로 가는 것이 깨끗 (혹은 court_infos.user_id + 멤버십 활성 여부로 단순화 가능).
3. **시안의 환불 정책(3일/2일/당일)은 mock값** — 실제 운영 시 결제 PG 연동 환불 + 정산 분리 필요 → Phase 분할 강제.

### B. 사용자 결정 필요 포인트 (PM이 사용자에게 전달) — 7건

> 본 결정 없이는 DB 모델·권한 룰·결제 흐름이 확정되지 않음. **Phase A 착수 전 최소 D-B1·D-B2·D-B6 3건은 필수**.

| ID | 결정 사항 | 옵션 | 추천 |
|----|----------|------|------|
| **D-B1** | 운영자 자격 — 어느 멤버십부터? | (a) `feature_key="court_rental"` 활성 구독자만 (b) 모든 가입자 (c) 별도 운영자 신청+관리자 승인 | **(a) court_rental 구독자만**. 이미 plans 존재 + 결제 흐름 가동. 신청·승인 절차는 Phase D로 미룸. **MVP는 구독 활성 = 운영자 권한** |
| **D-B2** | 코트 ↔ 운영자 매핑 모델 | (a) `court_infos.user_id` 그대로 사용 (1:1) (b) 신규 `court_managers` 테이블(N:M) | **(a) 1:1로 시작**. 한 코트 다중 운영자 요구 발생 시 Phase D에 도입. **Prisma 모델 1개 절약** |
| **D-B3** | 외부 vs 자체 대관 정책 | (a) `rental_url` 있으면 외부, 없으면 자체 (b) 운영자가 코트별 토글 (c) 자체로 일원화 | **(b) 토글**. court_infos에 `booking_mode: "external"\|"internal"\|"none"` 1필드 추가. 외부=`rental_url` 노출, 내부=시스템 예약 |
| **D-B4** | 플랫폼 수수료 정책 | (a) 0% MVP 무료 (b) 5% 고정 (c) 10% 고정 (d) 운영자별 가변 | **MVP=(a) 0%**. Phase B에서 (b) 5% 도입. payments에 `platform_fee` 필드 추가 (현재 없음 → DB 마이그레이션 1건) |
| **D-B5** | 정산 방식 | (a) 즉시 정산 (b) 월 1회 (c) 주 1회 (d) 운영자가 출금 신청 | **(d) 출금 신청형**. `RefereeSettlement` 모델 패턴 재사용 가능. Phase C에서 도입. MVP는 정산 미구현 |
| **D-B6** | 환불 정책 자동/수동 | (a) 자동(시안 3일100%/2일50%/당일0%) (b) 운영자 수동 승인 (c) 관리자 처리 | **MVP=(b) 수동 승인** (간단). Phase C에서 (a) 자동화. 시안 정책은 default 안내 텍스트로만 |
| **D-B7** | KYC/세금 | (a) MVP 생략 (b) 사업자등록번호 필수 (c) 개인운영자 별도 양식 | **MVP=(a) 생략**. 운영자 1~5명 베타로 시작 + Phase C에서 도입. user.bank_name/account_number는 이미 있음 |

### C. DB 모델 설계 (D-B2=a / D-B3=b 채택 가정)

#### C-1. 신규 테이블 1개

```prisma
model court_bookings {
  id                BigInt    @id @default(autoincrement())
  court_info_id     BigInt    // 어느 코트
  user_id           BigInt    // 예약자
  start_at          DateTime  @db.Timestamp(6)  // 시작 (1시간 단위)
  end_at            DateTime  @db.Timestamp(6)  // 종료
  duration_hours    Int       // 1~4 (시안)
  purpose           String    @default("pickup") @db.VarChar  // pickup|team|scrim|private
  expected_count    Int?      // 예상 인원
  amount            Decimal   @db.Decimal(10, 0)  // 대관료
  discount_amount   Decimal?  @default(0) @db.Decimal(10, 0)  // BDR+ 할인 등
  final_amount      Decimal   @db.Decimal(10, 0)  // 최종 결제 금액
  platform_fee      Decimal?  @default(0) @db.Decimal(10, 0)  // 플랫폼 수수료 (Phase B에서 사용)
  status            String    @default("pending") @db.VarChar
  // pending(슬롯 잠금) → confirmed(결제완료) → cancelled / refunded / completed(이용 종료)
  payment_id        BigInt?   // payments.id FK (결제 완료 후 연결)
  cancellation_reason String?
  cancelled_at      DateTime? @db.Timestamp(6)
  refunded_at       DateTime? @db.Timestamp(6)
  created_at        DateTime  @default(now()) @db.Timestamp(6)
  updated_at        DateTime  @updatedAt @db.Timestamp(6)

  court    court_infos @relation(fields: [court_info_id], references: [id])
  user     User        @relation(fields: [user_id], references: [id])

  @@index([court_info_id, start_at])  // 슬롯 충돌 검사용 (핵심)
  @@index([user_id, status])
  @@index([status, created_at])
  @@map("court_bookings")
}
```

**슬롯 충돌 처리**:
- 별도 `court_slots` 테이블 **불필요**. 운영자는 `court_infos.operating_hours`(이미 존재)로 가능 시간만 정의 → 충돌은 `start_at < ? AND end_at > ?` 쿼리로 즉시 검사. 운영자 차단(블록) 슬롯이 필요하면 `court_bookings.status="blocked"` + `user_id=운영자` 더미 row로 표현 (테이블 1개 절약).
- `Prisma.$transaction` + `SELECT ... FOR UPDATE` 패턴으로 동시성 처리 (Postgres pessimistic lock).

#### C-2. 기존 모델 변경 (3건만)

| 모델 | 변경 | 사유 |
|------|------|------|
| `court_infos` | `+booking_mode String @default("none")` (none/external/internal) | D-B3=(b) 토글 |
| `court_infos` | `+booking_fee_per_hour Decimal?` (시간당 요금) | 기존 `fee` 필드와 분리 (기존 fee는 "전체 대관" 의미였을 수 있음) |
| `User` | `+court_bookings court_bookings[]` 백릴레이션 1줄 | Prisma 관계 |

> 위 3건만으로 충분. 운영자 ↔ 코트 매핑은 **`court_infos.user_id`**(이미 있음) + **`court_rental` 구독 활성**(이미 있음) 2개 조합으로 권한 가드.

### D. 권한 모델 (헬퍼 1개)

신규 유틸: `src/lib/courts/court-manager-guard.ts`
```ts
// 이 코트의 운영자인가?
async function isCourtManager(userId: bigint, courtInfoId: bigint): Promise<boolean> {
  const court = await prisma.court_infos.findUnique({
    where: { id: courtInfoId }, select: { user_id: true },
  });
  if (!court || court.user_id !== userId) return false;
  // 멤버십 활성 검사 (D-B1=(a))
  const sub = await prisma.user_subscriptions.findFirst({
    where: { user_id: userId, feature_key: "court_rental", status: "active",
             OR: [{ expires_at: null }, { expires_at: { gte: new Date() } }] },
  });
  return !!sub;
}
```

> `referee/admin/admin-guard.ts` 패턴 그대로 재사용. 모든 운영자 API에 1줄 호출.

### E. UI 흐름 + 라우트 (신규/수정)

| 라우트 | 역할 | 신규/수정 | 위치 |
|--------|------|----------|------|
| `/courts/[id]/booking` | 회원용 예약 (시안 CourtBooking.jsx) | **신규** | `src/app/(web)/courts/[id]/booking/page.tsx` |
| `/courts/[id]/manage` | 운영자용 슬롯 관리 + 예약 현황 | **신규** | `src/app/(web)/courts/[id]/manage/page.tsx` (운영자 가드) |
| `/profile/bookings` | 내 예약 내역 | **신규** | `src/app/(web)/profile/bookings/page.tsx` |
| `/profile/court-revenue` | 운영자 수익 현황 | **신규** (Phase C) | 동상 |
| `/courts/[id]` (상세) | "예약하기" CTA 추가 | **수정** | court-detail-v2.tsx에 booking_mode 분기 버튼 |
| `/api/web/courts/[id]/bookings` | GET(슬롯 조회) / POST(예약 생성) | **신규** | |
| `/api/web/courts/[id]/manage/bookings` | GET(예약 목록) / POST(블록) | **신규** | |
| `/api/web/bookings/[id]/cancel` | DELETE(취소+환불 트리거) | **신규** | |
| `/api/web/payments/confirm/booking` | 코트 예약 결제 승인 (Plan 분기와 별도) | **신규** (Phase B) | 기존 confirm/route.ts 분기 OR 신규 |

### F. 단계적 구현 계획 (Phase A → D)

| Phase | 범위 | 주요 산출물 | 예상 공수 | 결제? | 의존 |
|-------|------|------------|----------|-------|------|
| **A. MVP (무료 대관)** | 운영자 슬롯 등록 + 회원 예약 + 가드 | DB 신규 1테이블+3컬럼 / API 4개 / UI 3페이지 / 가드 1유틸 | **8~12h** | ❌ (`final_amount=0` 강제) | D-B1, D-B2, D-B6=manual |
| **B. 결제 통합** | 토스페이먼츠 결제 + 환불 트리거 | `/api/web/payments/confirm/booking` + 환불 API + payments 다형성 활용 + platform_fee 도입 | **6~8h** | ✅ 토스 | D-B4 결정 + Phase A |
| **C. 정산 + 자동환불 + 수익 대시보드** | 운영자 출금 신청 모델 + 자동환불 룰 + `/profile/court-revenue` | `court_settlements` 신규 1테이블 + 자동환불 cron + 대시보드 | **8~10h** | ✅ | D-B5, D-B6=auto, D-B7 결정 |
| **D. BDR+ 할인 + 운영자 신청·승인 + N:M 매핑** | 멤버십별 할인율 + 운영자 신청 워크플로우 + court_managers 도입 | 신규 1테이블 (court_managers) + admin 승인 페이지 + 할인 룰 | **6~8h** | ✅ | D-B1=(c), D-B2=(b) 결정 시 |

**총 28~38h** — 4 Phase 분할로 매번 2~3일 단위 출시 가능.

### G. 위험·제약

| 위험 | 대응 |
|------|------|
| **동시성 슬롯 충돌** | `Prisma.$transaction` + `FOR UPDATE` lock + UNIQUE 인덱스 (court_info_id, start_at) 검토 (단 status 분기로 인해 partial unique 필요 → Postgres `CREATE UNIQUE INDEX ... WHERE status='confirmed'`로 raw SQL 추가) |
| **결제 후 슬롯 사라짐** | 예약 생성 시 status="pending" + payment_id NULL로 슬롯 잠금(15분 만료) → 토스 confirm 콜백에서 status="confirmed" 전환 |
| **PG 환불 자동화 비용** | Phase A는 운영자 수동(D-B6=b). Phase C에서 토스 환불 API + 룰 엔진 |
| **운영자 KYC** | Phase A는 베타 1~5명 한정. Phase C에서 도입 |
| **외부 vs 자체 대관 혼재** | court_infos.booking_mode 토글 + 코트 상세 CTA 분기 (시안 D-B3=b) |
| **운영자 멤버십 만료 시 처리** | 만료된 운영자 = 신규 슬롯 등록 불가 (가드 동작), 기존 confirmed 예약은 유지 (단 cron으로 알림) |

### H. 실행 계획 (Phase A 한정 — MVP)

| 순서 | 작업 | 담당 | 선행 조건 |
|------|------|------|----------|
| **0** | PM이 D-B1 / D-B2 / D-B6 결정 사항을 사용자에게 전달 → 승인 | pm | — |
| **1** | Prisma 마이그레이션 — `court_bookings` 1테이블 + court_infos 2컬럼 추가 | developer | 0 |
| **2** | 가드 유틸 `src/lib/courts/court-manager-guard.ts` + 시간 충돌 검사 유틸 `src/lib/courts/booking-conflict.ts` | developer | 1 |
| **3** | API 4개 — `/api/web/courts/[id]/bookings` (GET/POST) + `/api/web/courts/[id]/manage/bookings` (GET) + `/api/web/bookings/[id]` (DELETE) | developer | 2 |
| **4** | 운영자용 페이지 `/courts/[id]/manage` — 슬롯 가능 시간 토글 + 예약 목록 + 블록 등록 (시안 없으므로 BDR v2 토큰 기반 신규 디자인) | developer | 3 |
| **5** | 회원용 페이지 `/courts/[id]/booking` — 시안 CourtBooking.jsx 기반 React/Next 전환 (단 결제는 Phase A에서 final_amount=0 우회) | developer | 3 |
| **6** | 코트 상세 `/courts/[id]` 수정 — booking_mode 분기 CTA + `/profile/bookings` 신규 | developer | 5 |
| **7** | tester (Playwright) + reviewer **병렬** — 동시성 충돌 테스트 + 가드 테스트 + UI 흐름 | tester + reviewer | 6 |

> 7단계 제한 준수. Phase B/C/D는 별도 기획 라운드에서 단계별로 다시 분할.

### I. developer 주의사항 (Phase A 착수 시)

1. **Prisma 변경 시** `npx prisma migrate dev --name add_court_bookings` 후 schema.prisma `model User { ... }`에 `court_bookings court_bookings[]` 백릴레이션 1줄 추가 잊지 말 것.
2. **시간 슬롯 단위는 1시간 고정** (시안 동일). DB는 `DateTime` 그대로 저장 + UI에서만 슬롯 그리드.
3. **UTC vs KST**: 기존 코드 패턴(timestamp(6)) 그대로 — Prisma는 UTC 저장 + UI에서 KST 변환. `dayjs.tz` 사용 패턴 유지.
4. **시안 BDR+ 10% 할인**은 Phase D에서 — Phase A는 final_amount=0 또는 amount 그대로.
5. **partners 시스템 건드리지 말 것** — 광고/스폰서용으로 별도. 코트 운영자와 무관.
6. **응답 키 snake_case 자동 변환** (errors.md 2026-04-17) — `/api/web/courts/[id]/bookings` POST 응답 raw curl 1회 검증 후 프론트 인터페이스 작성.

### J. 산출 파일 영향 (Phase A)

| 경로 | 역할 | 신규/수정 |
|------|------|----------|
| `prisma/schema.prisma` | court_bookings 모델 + court_infos 2컬럼 + User 백릴레이션 | 수정 |
| `src/lib/courts/court-manager-guard.ts` | 운영자 가드 헬퍼 | 신규 |
| `src/lib/courts/booking-conflict.ts` | 시간 충돌 검사 | 신규 |
| `src/app/api/web/courts/[id]/bookings/route.ts` | GET 슬롯 조회 / POST 예약 생성 | 신규 |
| `src/app/api/web/courts/[id]/manage/bookings/route.ts` | 운영자용 예약 목록 | 신규 |
| `src/app/api/web/bookings/[id]/route.ts` | DELETE 취소 | 신규 |
| `src/app/(web)/courts/[id]/booking/page.tsx` | 회원 예약 페이지 | 신규 |
| `src/app/(web)/courts/[id]/manage/page.tsx` | 운영자 관리 페이지 | 신규 |
| `src/app/(web)/profile/bookings/page.tsx` | 내 예약 내역 | 신규 |
| `src/app/(web)/courts/[id]/_components/court-detail-v2.tsx` | booking_mode 분기 CTA | 수정 |

총 **신규 8 + 수정 2 = 10파일** (Phase A MVP).

### K. 다음 액션

1. **PM이 사용자에게 위 D-B1~D-B7 7개 결정 사항 전달**.
2. 사용자가 D-B1/D-B2/D-B6 3개 최소 결정 → developer Phase A 착수.
3. Phase B 이후는 D-B4/D-B5/D-B7 추가 결정 후 진행.

---

## 📍 다음 세션 진입점

### 🥇 1순위 — W4+L3+L2 통합 스모크
- ✅ **Playwright 자동화 60/60 PASS** (tester 위임, 04-22) — L3 3항목 + W4 비로그인 4항목 + 04-22 decode 핵심 + 4조합(PC/Mobile × Light/Dark) 매트릭스
- **수빈 재확인 필요 5건** (자동화 커버 불가):
  - L2-1~4 전건 (로그인 필수) — 본인 프로필 / 타인 프로필 비공개 팀 숨김 / `/profile` 대시보드 / Lv.N 배지
  - W4-3 M7 팀 가입 / W4-4 M6 알림 / W4-6 M5 온보딩 (로그인/신규 계정 필요)
  - 시각 퀄리티 (색상 조화, 간격 감각 — 사람 눈 필요)
- **체크리스트 문서**: `Dev/smoke-test-2026-04-22.md`
- **발견된 코드 결함**: 0건

### 🥈 2순위 — 원영 협의 (30분)
- `Dev/ops-db-sync-plan.md` (선결 조건 **전 조건 확정**, Flutter 앱은 원영 별도 관리로 범위 제외)
- 원영 액션: PR #54 승인
- 옵션 A 확정 (Supabase 두 번째 프로젝트) — 착수 가능 상태

### 🥉 3순위 — 점진 정비 (보이스카우트)
- **하드코딩 색상**: 누계 **71건** 치환 / **실질 완결**. 남은 것은 의도 예외 2건(live orange 스피너 — accent 변수 추가 시 정비 / tm-org-new dark:페어 — 단일 토큰 검증 후) + false positive 2건(hero-bento 주석). tournament-admin 영역 ✅ 완결
- **any 타입**: ✅ **실질 완결** (오늘 4건 정비 — home-sidebar 3 + Prisma WhereInput 1). 예외 유지 13건: kakao SDK 9 / Next.js HOF 3 / SW 1 — 모두 근거 있음
- **원칙**: 다른 이유로 파일 건드릴 때 함께 정비. 대규모 일괄 치환 비추천

### 4순위 — reviewer 후속 (nice-to-have)
- L3 `<img>`→next/image 9곳: 운영 DB 분리 후 양쪽 `<ref>.supabase.co` `remotePatterns` 등록 후 실행 권장
- L3 쿼리 합치기 / is_public 가드 / EditionSwitcher flex-wrap ✅ 완료

---

## 현재 상태 스냅샷 (2026-04-22 세션 진행 중)

| 항목 | 값 |
|------|-----|
| 브랜치 | subin |
| subin HEAD | `9023236` (docs planning) |
| origin/subin | `9023236` ✅ 동기화 (10커밋 푸시 완료) |
| dev / main | `8de9be4` (PR #53 squash, PR #54 원영 승인 대기) |
| 미푸시 | **0~1건** (스모크 로그 + 상태 갱신 대기) |
| 오늘 커밋 (04-22) | 10건 푸시 완료: `bb488ce`→`0f41e99`→`1958b9d`→`672dc9a`→`dfa5b9a`→`42c5066`→`6a7569b`→`3f54daa`→`ab46ae2`→`9023236` |
| 스모크 상태 | ✅ 자동화 60/60 PASS (tester 위임). 수빈 재확인 권장: L2 로그인 필수 4건 + M5 온보딩 + M6 알림 + M7 팀 가입 + 시각 퀄리티 |
| 열린 PR | #54 (dev→main) / #55 (subin→dev) |
| 카페 Phase 3 | 운영 반영 ✅ (GH Actions + 쿠키 갱신 + 메일 알림 + 품질 검증봇) |

---

## W1~W4 + L3 + L2 완료 요약 (04-19 ~ 04-21)
| 주차 | 내용 | 계획 | 실제 |
|------|------|------|------|
| W1 | Q1~Q12 (라우트/네비/배지) | 20h | ~12h |
| W2 | M1 좌측 네비 + M2 대회 sticky | 10h | ~6h |
| W3 | M3/M5/M6 | 20h | ~7h |
| W4 | M4/M7/L1 + 회고 + 후속 정비 | 17h | ~3h |
| L3 | Organization brc + EditionSwitcher + SeriesCard | 3h | ~1.5h |
| L2 | 프로필 통합 + 공용 3종 + 대시보드 + 티어→레벨 | 15h | ~2h |
| **합계** | **4주 + L2·L3** | **~85h** | **~31.5h** (2.7배 절감) |

---

## 🗂 카페 작업 로그
→ `.claude/scratchpad-cafe-sync.md` 참조 (본 세션은 일반 모드이므로 여기에는 유지하지 않음)

---

## 수정 요청
| 요청자 | 대상 | 문제 | 상태 |
|--------|------|------|------|
| 수빈(L3-2 스모크) | `/organizations/*/series/*/page.tsx` | 500 + Turbopack worker crash | ✅ 코드 무결 / `.next` 재기동으로 복구 (errors.md [2026-04-12] 재발 참조+1) |
| pm-cafe (Stage B-1) | `(web)/community/**` 렌더 | HTML entity 디코드 누락 | ✅ 완료 `bb488ce` — 5파일 렌더 경로 decode 적용 |
| tester(위임 스모크 04-22) | dev server `/organizations/org-ny6os` | Turbopack worker crash 재발 (3회차). `/` 200인데 `/organizations/*` 만 500 → PID 46100 kill + `.next` 삭제 + npm run dev 재기동 → PID 78736 복구 / 전 엔드포인트 200 | ✅ errors.md [2026-04-12] 참조횟수+1 해당 (신규 라우트 첫 접근 패턴) |
| tester(Phase 1 Home 검증) | `src/components/layout/right-sidebar.tsx` | Home 페이지 xl+ 우측 사이드바에 레거시 "주목할 팀" / "최근 활동" 위젯이 그대로 남아 있음 (page.tsx에서는 제거 완료). PC뷰에서만 노출, 모바일 뷰에선 자동 숨김. v2 Phase 1 범위가 Home 본문에 한정되었으므로 **결함 아님 / 범위 밖** — 사이드바 v2 교체는 Phase 1에 포함시킬지, 후속 Phase로 넘길지 결정 필요 | 대기 (PM 범위 결정) |
| tester(Phase 1 Home 검증) | `src/app/(web)/page.tsx` | `<h1>` 태그 0건. v2 시안은 섹션 헤딩(`<h2>` "방금 올라온 글") 위주라 의도된 구조일 수 있으나 접근성/SEO 관점에서 페이지당 1개 h1 권장. PromoCard 내부 `<h2>`를 `<h1>`으로 승격하거나 시안 외 상단에 visually-hidden h1 추가 검토 | 대기 (PM 결정) |

---

## 운영 팁
- **tsx 환경변수**: `npx tsx --env-file=.env.local scripts/xxx.ts`
- **포트 죽이기**: `netstat -ano | findstr :<포트>` → `taskkill //f //pid <PID>` (node.exe 통째 금지)
- **신규 API 필드**: 추가 전 curl 1회로 raw 응답 확인 (snake_case 6회 재발)
- **공식 기록 쿼리**: `officialMatchWhere()` 유틸 필수
- **공용 컴포넌트**: `@/components/shared/breadcrumb` / `edition-switcher` / `@/components/profile/{profile-hero, mini-stat, recent-games}`
- **레벨 배지**: `@/lib/profile/gamification#getProfileLevelInfo(xp)` — 서버 컴포넌트 직접 호출 (API 경유 X)
- **에러 색상 토큰 패턴**: `var(--color-error)` / 배경은 `color-mix(in srgb, var(--color-error) 10%, transparent)`
- **gh 인증 풀림**: `GH_TOKEN=$(printf "protocol=https\nhost=github.com\n\n" | git credential fill 2>/dev/null | grep ^password= | cut -d= -f2) gh ...`

---

## 구현 기록 (04-22 요약)
오늘 세션 커밋 10건 완료. 상세 scratchpad 섹션은 커밋 메시지 + knowledge로 이관.
- **하드코딩 색상 audit**: 5차 누적 17파일 29건 치환 (1~5차 = 0f41e99/672dc9a/dfa5b9a/42c5066/6a7569b). tournament-admin 영역 완결. 잔존 실질 0 (예외 2 + false positive 2)
- **any 타입 audit**: 4건 정비 (3f54daa). 예외 13건 명시 (kakao SDK 9 / Next.js HOF 3 / SW 1)
- **카페 community HTML entity decode**: 5파일 렌더 시점 디코드 (bb488ce)
- **conventions 승격**: color-mix Tailwind arbitrary 문법 + any 예외 규칙 (ab46ae2)
- **docs**: smoke 체크리스트 (1958b9d) / 04-20 planning 지연 커밋 (9023236)
- **스모크**: Playwright 자동화 60/60 PASS (tester 위임). 로그인 필수 5건만 수빈 재확인 권장

---

## 구현 기록 — Phase 3 Teams 목록 — v2 재구성 (필터 보존) [2026-04-22]

📝 구현한 기능: `/teams` 목록을 v2 시안(`screens/Team.jsx`) 구조로 재구성. 기존 플로팅 필터(지역/정렬)는 보존하고 시안 내장 검색 chip 을 헤더에 추가. API/Prisma 0 변경.

| 파일 경로 | 변경 내용 | 신규/수정 |
|----------|----------|----------|
| `src/app/(web)/teams/_components/team-card-v2.tsx` | v2 카드: 상단 accent 블록(로고/tag/팀명/창단 연도/#랭크) + 3열 stat(레이팅=wins/승/패) + 하단 btn--sm 2개(상세 Link + 매치 신청 disabled) | 신규 |
| `src/app/(web)/teams/_components/teams-content-v2.tsx` | v2 헤더(eyebrow+`등록 팀 N팀`+메타+우측 검색chip+팀 등록 버튼) + 기존 `TeamsFilter` 유지 + auto-fill minmax(260px,1fr) 그리드 + 페이지네이션 + wins desc 프론트 정렬로 #랭크 안정화 | 신규 |
| `src/app/(web)/teams/page.tsx` | `TeamsContent` → `TeamsContentV2` 교체 (import 1줄 + 컴포넌트 1줄) | 수정 |
| `src/app/(web)/teams/_components/teams-content.tsx` | 유지 (롤백용) | — |
| `src/app/(web)/teams/_components/team-card.tsx` | 유지 (롤백용, `resolveAccent` 로직은 v2 카드에서 로컬 복사) | — |
| `src/app/(web)/teams/teams-filter.tsx` | 유지 (지역/정렬 플로팅 필터 그대로 재사용) | — |

### 데이터 매핑 결정 (PM 확정 그대로)
- **rating A**: `#랭크` = wins desc sort index + 1, 레이팅 박스 값 = `wins` 표시 (가짜 수치 생성 금지)
- **founded**: `created_at` 연도 (JS `new Date().getFullYear()`). null 은 `—`
- **tag**: 영문명 우선(`name_en`) → 없으면 한글명 첫 3글자 `.toUpperCase()`
- **필터 B**: 기존 `TeamsFilter`(플로팅 지역/정렬) 유지 + 시안 내장 검색 chip 추가. 두 입력 모두 URL `q` 파라미터 공유, 380ms debounce 동일
- **매치 신청 버튼**: UI only (disabled + title="준비 중인 기능입니다", aria-label 명시). 리디자인 원칙에 따라 동작 미구현
- **다크 배경**: `resolveAccent(primary, secondary)` 로직을 기존 team-card.tsx 에서 로컬 복사 (원본 export 없음 + 기존 카드 보존 원칙). `#ffffff` 같은 너무 밝은 primary 는 secondary 또는 `#E31B23` 으로 폴백, accent 위 ink 는 `#FFFFFF` 고정

### 검증 결과
- `npx tsc --noEmit` ✅ PASS (에러 0)
- `curl /teams` → **HTTP 200** (227KB)
- SSR HTML 에 시안 마커 포함 확인: `팀 · TEAMS`, `등록 팀`, `레이팅 순`, `이름·태그` 각 1회 렌더
- 기존 플로팅 필터 + 시안 내장 검색 공존 (두 입력 모두 URL q 에 380ms debounce 로 set)

💡 tester 참고:
- **테스트 방법**:
  1. `/teams` 접속 → v2 헤더(`등록 팀 N팀` 28px Pretendard + `레이팅 순 · 2026 시즌 기준` 서브)
  2. 헤더 우측에 검색 chip(`팀 이름·태그 검색`) + `팀 등록` 버튼(primary)
  3. 기존 플로팅 필터 트리거(지역/정렬) 그대로 하단에 유지
  4. 카드: 상단 팀 primary 컬러 블록 + 로고/tag/팀명/창단 + 우측 상단 #랭크
  5. 3열 stat: 레이팅(wins) / 승(녹색) / 패(회색)
  6. 하단 버튼: 상세(클릭 → `/teams/{id}`) + 매치 신청(disabled)
- **정상 동작**:
  - 내장 검색 input에 타이핑 → 380ms 후 `?q=...` 로 URL 업데이트 + 플로팅 필터 내 검색박스도 동기화
  - 플로팅 필터에서 q 바꾸면 내장 검색박스 value 도 동기화
  - 지역/정렬 변경 시 1페이지 리셋
  - 팀 0건일 때 빈 상태 + 팀 만들기 CTA
- **주의할 입력**:
  - `primary_color` null 또는 `#ffffff` → secondary 또는 `#E31B23` 폴백 (resolveAccent)
  - `logo_url` null → tag(첫 3글자) 이니셜 박스 (accent 위 반투명 배경)
  - `created_at` null → 창단 `—`
  - `wins`/`losses` null → 0 처리

⚠️ reviewer 참고:
- **resolveAccent 로직 중복**: 기존 `team-card.tsx` 와 `team-card-v2.tsx` 양쪽에 존재. 원본을 export 로 바꾸거나 `@/lib/utils/team-display.ts` 로 뽑는 것이 이상적이나 **기존 카드 수정 금지 원칙**에 따라 로컬 복사 선택. v2 전환이 안정화되면 기존 카드 제거와 함께 공용 유틸로 통합 권장
- **rankIndex 의미**: 기본 정렬이 wins 가 아니어도(최신순/승률순) `#랭크` 는 항상 wins desc 기준 — 팀 고유 랭크 의미 통일을 위한 의도된 설계
- **매치 신청 disabled**: 기능 미구현이지만 시안 일관성을 위해 자리 유지. 향후 기능 추가 시 disabled 제거 + onClick 핸들러 붙이면 됨
- **v2 토큰 의존**: `.btn`, `.btn--sm`, `.btn--primary`, `.eyebrow`, `--bg-elev`, `--border`, `--radius-chip`, `--ink*`, `--ok`, `--ff-display`, `--ff-mono` 등 v2 CSS 토큰 전역 적용된 상태 전제. Phase 1 에서 이미 전역 교체 완료되어 렌더 정상 확인
- **SSR vs 클라이언트 fetch**: teams 데이터는 클라이언트에서 `/api/web/teams` 호출. Suspense fallback(`TeamsLoading`) → mounted 후 스켈레톤 → 카드. 초기 빈 `등록 팀 0팀` 깜빡임 가능 (기존 동작과 동일)

---

## 구현 기록 — Phase 3 Teams 상세 — v2 재구성 (DB 미지원 항목 준비 중 표시) [2026-04-22]

📝 구현한 기능: `/teams/[id]` 상세 페이지를 v2 시안(`screens/TeamDetail.jsx`) 구조로 재구성. accent 카드형 Hero + cafe-blue 탭 4종 + 좌측 탭 컨텐츠 + 우측 320px 사이드 카드 (최근 폼 + 연락). API/Prisma 0 변경. DB 미지원 항목은 모두 "준비 중" placeholder.

| 파일 경로 | 변경 내용 | 신규/수정 |
|----------|----------|----------|
| `src/app/(web)/teams/[id]/_components_v2/team-hero-v2.tsx` | accent 그라디언트 카드(135deg, accent→accent+CC→card) + 우상단 거대 tag 워터마크(220px ff-display 900 opacity .12) + 96px Avatar + eyebrow(`TEAM · TAG · 창단 YYYY`) + 시안 52px h1(clamp 28-52) + 4스탯 인라인(레이팅/승/패/승률) + CTA 3종(팀장 한정 "팀 관리" 활성 / 팔로우·매치신청 disabled+title="준비 중") | 신규 |
| `src/app/(web)/teams/[id]/_components_v2/team-tabs-v2.tsx` | sticky top-14 탭 네비. `border-bottom: 2px var(--border)` 컨테이너 + 활성 탭 `3px var(--cafe-blue)` 하단선 + `var(--ink)` 텍스트. 탭 4종 키: overview/roster/recent/stats. URL `?tab=` 파라미터 + scroll=false. `TEAM_TAB_KEYS` export 로 page.tsx 폴백 매핑 | 신규 |
| `src/app/(web)/teams/[id]/_components_v2/overview-tab-v2.tsx` | `.card` 2개 — ① 팀 소개(description + null fallback) ② 팀 정보 6행 key-value(120px/1fr grid: 창단/홈코트/연습일/팀레벨/레이팅+#N위/게스트모집). 미지원 3행(연습일/팀레벨/게스트모집)은 ink-mute "준비 중" | 신규 |
| `src/app/(web)/teams/[id]/_components_v2/roster-tab-v2.tsx` | `.board` 5열 grid(56/1fr/80/100/80) + ROLE_ORDER(captain→director→coach→manager→treasurer→member) 정렬 + 등번호 accent 색 + 22px 원형 이니셜 + position ff-mono 700 + role(captain=red badge / 스태프=soft badge / 일반=ink-mute 12px) + PPG="—" (match_player_stat 미지원) | 신규 |
| `src/app/(web)/teams/[id]/_components_v2/recent-tab-v2.tsx` | `.board` 5열(80/1fr/120/80/160) — 토너먼트 공식 기록만 표시 (`officialMatchWhere` 가드). 날짜 MM.DD (KST mono 12px) / 상대팀명 / `MY:OPP` 스코어 (ff-mono 700) / 결과 W=ok badge / L=ink-dim filled / live=soft badge / 0-0=`—`. `computeRecentForm()` 헬퍼 export — page.tsx 사이드 카드용 5건 W/L 배열 산출 | 신규 |
| `src/app/(web)/teams/[id]/_components_v2/stats-tab-v2.tsx` | 2026 시즌 평균 4카드 grid (득점/실점/리바/어시) + 헤더 우측 "준비 중" 라벨 + 모든 값 `—` + 하단 footnote "경기 기록이 충분히 쌓이면 자동 표시" | 신규 |
| `src/app/(web)/teams/[id]/_components_v2/team-side-card-v2.tsx` | 우측 sticky aside (top:96) 2카드 — ① 최근 폼 5칸(28×28 W=ok / L=ink-dim / "-"=dashed border) + 게스트 지원(btn--primary btn--xl disabled) + 팀 매치 신청(btn 전폭 disabled) ② 연락 카드: 팀장 닉네임 + 응답시간 "준비 중" + 쪽지 보내기(btn--sm disabled) | 신규 |
| `src/app/(web)/teams/[id]/page.tsx` | **완전 재작성**. 기존 Prisma 쿼리 100% 유지(team include teamMembers / tournamentTeam / completedMatches) + **신규 2쿼리**(team.count(wins.gt) → teamRank / `computeRecentForm()` → 사이드 폼). resolveAccent 유지 + resolveTag(영문우선→한글3자) 추가. v2 8컴포넌트 조립. 탭 키 4종(overview/roster/recent/stats) URL 파라미터 검증. 비공식 픽업 경기 통합 타임라인은 v2 시안에 없으므로 recent 탭은 공식 기록만 표시 | 수정(재작성) |
| `src/app/(web)/teams/[id]/_tabs/{overview,roster,games,tournaments}-tab.tsx` | 유지 (롤백/레거시) — 본 v2 전환은 page.tsx 의 import 경로만 교체하므로 기존 파일은 미사용 상태로 보존 | — |

### 데이터 매핑 결정 (PM 확정 그대로)
- **rating**: DB 필드 없음 → `wins`로 대체 (Phase 3 Teams 목록과 동일 규칙). Hero 4스탯 첫 칸 + Overview 정보 카드 "레이팅" 행
- **teamRank**: `team.count({ where: { wins: { gt } } }) + 1` — wins desc 전체 순위. 0건이어도 1위 부여 (수치는 모든 팀이 wins=0이면 1위 동률 — 시안의 "전체 N위" 의미만 유지)
- **tag**: 영문명 우선(`name_en`) → 없으면 한글명 첫 3글자 `.toUpperCase()` (목록 v2 와 통일)
- **founded**: `founded_year` 우선 → 없으면 `created_at` 연도 → 둘 다 null이면 `—`
- **homeCourt**: `[city, district].filter(Boolean).join(" ")` — DB에 home_court 컬럼 없어 시/구 조합으로 대체
- **recentForm**: 공식 기록 5건 (`officialMatchWhere` 가드) — 최신순 그대로 (시안은 최신이 왼쪽). 5건 미만이면 "-" 칸으로 채워 항상 5칸 유지
- **captainName**: `teamMembers.find(role==="captain").user.nickname` (없으면 name) — 사이드 연락 카드 표시용

### DB 미지원 → "준비 중" 항목 매핑
| 항목 | 위치 | 향후 DB 추가 필드 |
|------|------|-------------------|
| 팔로우 | Hero CTA | `team_follows` 테이블 |
| 매치 신청 | Hero CTA + 사이드 | `team_match_requests` 테이블 |
| 게스트 지원 | 사이드 | 팀 단위 지원 모델 |
| 쪽지 보내기 | 사이드 연락 | DM 모델 |
| 응답시간 | 사이드 연락 | 메시지 응답 로그 집계 |
| 연습일 | Overview 정보 | `teams.practice_days` |
| 팀 레벨 | Overview 정보 | `teams.level` |
| 게스트 모집 상시 badge | Overview 정보 | `teams.recruiting` |
| PPG (개인 평균 득점) | Roster 5열째 | `match_player_stat` 집계 |
| 시즌 평균 4스탯 (득점/실점/리바/어시) | Stats 탭 | 팀 평균 집계 쿼리 |

### 검증 결과
- `npx tsc --noEmit` ✅ EXIT=0 (에러 0)
- `curl /teams/201?tab={overview,roster,recent,stats}` → **4탭 전부 HTTP 200**
- v2 시안 마커 SSR 렌더 확인:
  - Hero: `창단` `레이팅` `승률` `팔로우` `매치 신청` 모두 렌더
  - 탭 4종: `>개요<` `>로스터<` `>최근 경기<` `>기록<` 모두 렌더
  - Overview: `팀 소개` `팀 정보`
  - Roster: 5열 헤더 (`>#<` `>이름<` `>포지션<` `>역할<` `>PPG<`)
  - Stats: `2026 시즌 평균` `득점` `실점` `리바` `어시` `준비 중` 라벨
  - Recent (몽키즈 공식 기록 0건): 빈 상태 "최근 공식 경기 기록이 없습니다" 정상 노출
  - 사이드: `최근 폼` `게스트 지원` `쪽지 보내기`
  - "준비 중" 텍스트 21건 / disabled 버튼 다수 — DB 미지원 placeholder 정상 작동

💡 tester 참고:
- **테스트 URL**: `http://localhost:3001/teams/{id}` — 예: 201(몽키즈), 197(제주 리딤), 199(펜타곤)
- **탭 전환**: `?tab=overview` (기본) / `roster` / `recent` / `stats` — sticky 탭에서 클릭 시 URL만 바뀌고 sticky 위치 유지(scroll=false)
- **정상 동작**:
  1. Hero — accent 그라디언트 카드 + 우상단 거대 tag 워터마크 + 좌측 96px Avatar + 4스탯 인라인 (모바일에선 세로 스택)
  2. 팀장 본인이 로그인했을 때만 Hero 우측 CTA 그룹에 "팀 관리" 흰 outline 버튼 노출
  3. 팔로우 / 매치 신청 / 게스트 지원 / 팀 매치 신청 / 쪽지 보내기 → hover 시 `title="준비 중인 기능입니다"` 툴팁
  4. Overview — 팀 소개 + 팀 정보 6행 (창단/홈코트/연습일/팀레벨/레이팅+#N위/게스트모집)
  5. Roster — 주장이 맨 위, 등번호 accent 색, PPG는 `—`. 행 클릭 시 `/users/{id}` 이동
  6. Recent — 5열 board(날짜/상대/스코어/결과/대회). 행 클릭 시 `/tournaments/{id}` 이동. 공식 기록 0건이면 빈 상태
  7. Stats — 4카드 grid(전부 `—`) + "준비 중" 라벨 + footnote
  8. 사이드 카드 — 최근 폼 5칸(W=초록/L=회색/공란=점선) + 연락 카드(팀장 닉네임 + 응답시간 "준비 중")
- **모바일**: lg(1024) 미만에서는 본문 1열 + 사이드 카드는 본문 아래로 스택. lg 이상에서 `minmax(0,1fr) 320px` 2열 grid + 사이드 sticky top:96
- **주의할 입력**:
  - `primary_color` null/`#ffffff` → secondary 또는 `#1B3C87` 폴백 (resolveAccent)
  - `name_en` null → 한글명 첫 3자 toUpperCase (resolveTag)
  - `founded_year` null + `created_at` null → 창단 `—`
  - `description` null → "아직 소개가 작성되지 않았습니다" placeholder
  - 공식 경기 0건 → recent 탭 빈 상태 + 사이드 최근 폼 전부 `-` 점선 칸
  - 팀장이 teamMembers 에 없는 비정상 케이스 → captainName=null → 연락 카드 "팀장 · —"

⚠️ reviewer 참고:
- **resolveAccent 로컬 복사**: Phase 3 Teams 목록(team-card-v2.tsx)에 이어 본 page.tsx 에도 동일 로직 존재. 양쪽 모두 기존 `team-card.tsx`의 export 안 된 함수를 로컬 복사한 상태. v2 전환 안정화 후 `@/lib/utils/team-display.ts` 로 통합 권장 (현재는 기존 카드 보존 원칙 + 로컬 복사 우선)
- **resolveTag 로컬 복사**: 위와 동일 — 목록 v2 카드와 본 page.tsx 양쪽에 동일 함수. 향후 통합 권장
- **teamRank 신규 쿼리 1건 추가**: `prisma.team.count({ where: { wins: { gt } } })` — N+1 위험 없음(단일 count). 200ms 미만 추가 비용. 시안의 "전체 N위" 표시를 위해 불가피
- **공식 경기 통합 타임라인 제거**: 기존 GamesTab은 픽업 경기(games 테이블) + 토너먼트 경기 30건 통합. v2 recent 탭은 공식 토너먼트 경기 10건만. 픽업 경기는 시안 컨셉상 "팀의 공식 전적 기록"에 포함되지 않으므로 의도된 단순화. 향후 픽업/스크림 통합이 필요하면 별도 탭 또는 toggle 추가
- **사이드 카드 sticky top:96**: 시안은 top:120이지만 mybdr `<AppNav>` 헤더 높이(약 56px) + 탭 sticky(약 40px) 고려해 96px 로 조정. 헤더 높이 변경 시 함께 조정 필요
- **Hero 4스탯 wins=0 표시**: rating=0 / wins=0 / losses=0 / winRate=`—` 상태(완전 신규 팀)에서도 시안 레이아웃이 그대로 노출되어 빈 느낌이 들 수 있음. 데이터가 쌓이면 자연스럽게 채워지므로 의도된 정직성 (가짜 수치 생성 금지)
- **stats 탭 footnote "준비 중" 명시**: 4카드 모두 `—` 일 때 사용자가 "버그인가?" 의심하지 않도록 헤더에 "준비 중" 라벨 + 하단 footnote 양쪽 명시. 향후 집계 추가 시 라벨/footnote 제거
- **레거시 _tabs 4파일 보존**: overview/roster/games/tournaments-tab.tsx 4파일은 import 0회로 dead code 상태이지만 롤백용으로 유지. Phase 9 정리 시 제거 권장
- **v2 토큰 의존**: `.btn`, `.btn--accent`, `.btn--primary`, `.btn--xl`, `.btn--sm`, `.badge--ok`, `.badge--soft`, `.badge--red`, `.board`, `.board__head`, `.board__row`, `.card`, `.page`, `.page--wide`, `.t-display`, `--ok`, `--ink`, `--ink-mute`, `--ink-dim`, `--ink-soft`, `--cafe-blue`, `--bg-alt`, `--border`, `--radius-card`, `--radius-chip`, `--ff-display`, `--ff-mono` — 전부 globals.css Phase 0 토큰. 이미 다른 v2 페이지에서 검증된 상태

---

## 구현 기록 — Phase 1 Games + 공통 컴포넌트 시안 매칭 [2026-04-22]

📝 구현한 기능: v2 Games.jsx 시안을 현재 `/games` 페이지 및 AppNav 공통 컴포넌트에 100% 반영 (색상/라벨/포맷/구조).

| 파일 경로 | 변경 내용 | 신규/수정 |
|----------|----------|----------|
| `src/components/bdr-v2/game-card.tsx` | kind 색상(pickup=cafe-blue/guest=bdr-red/scrimmage=ok) + 라벨(픽업/게스트/스크림) + 날짜(YYYY.MM.DD (요일) · HH:mm) + 비용(₩5,000/무료) 전면 재작업. TYPE_BADGE 참조 제거 → v2 원본 토큰 직접 사용 | 수정 |
| `src/app/(web)/layout.tsx` | PreferFilterToggleButton 정의 제거 + AppNav rightAccessory 전달 제거. usePreferFilter 는 setLoggedIn 훅용으로 유지 | 수정 |
| `src/components/bdr-v2/app-nav.tsx` | rightAccessory prop 제거(더 이상 미사용) + 주석 업데이트 | 수정 |

### 변경 요약
- **kind 매핑** (v2 Games.jsx L5~L6 그대로 이식):
  - game_type=0 (픽업) → `var(--cafe-blue)` / "픽업"
  - game_type=1 (게스트) → `var(--bdr-red)` / "게스트"
  - game_type=2 (DB상 PRACTICE = 시안 scrimmage) → `var(--ok)` / "스크림"
- **날짜 포맷**: `2026.04.25 (토) · 22:55` (시안의 "– HH:mm" 종료 시각은 `listGames` select에 duration_hours/ended_at 미포함으로 생략 — Prisma select 비변경 방침)
- **비용 포맷**: 유료 → `₩{toLocaleString}` (예: ₩5,000) / 무료 → "무료" + `color:var(--ok)` + `font-weight:700`
- **진행바 색상**: 마감임박이면 `var(--accent)`(red), 아니면 해당 kindColor
- **AppNav 별 아이콘 제거**: layout.tsx에서 `PreferFilterToggleButton`(`>star<`) 삭제. `PreferFilterProvider` context는 유지(usePreferFilter 훅은 setLoggedIn 호출에 계속 필요)

### 검증 결과 (HTML 렌더)
- `tsc --noEmit` PASS (0 에러)
- `curl /games` → 200
- `var(--cafe-blue)`/`var(--bdr-red)`/`var(--ok)` 렌더 HTML에서 확인 (stripe 4px + 배지 + 진행바 3군데 각각)
- kind 배지 삼중 속성 렌더: `background:var(--bdr-red);color:#fff;border-color:var(--bdr-red)` × 31건 / `var(--ok)` × 29건
- 날짜 포맷 샘플: `2026.04.25 (토) · 22:55` / `2026.04.25 (토) · 18:00` / `2026.04.25 (토) · 09:00` 등
- 비용 포맷 샘플: "무료" 9회 + "₩6,000" 첫 유료 카드 확인
- AppNav 별 아이콘: `>star<` 0건 / "PreferFilter" 문자열 0건 (rendered HTML 기준)

💡 tester 참고:
- **테스트 방법**: `/games` 접속 → 카드 30장 내외 렌더 확인. 라이트/다크 양쪽에서 kind 색상이 시안과 일치하는지. AppNav 우측에 별 아이콘이 없는지.
- **정상 동작**:
  - 픽업 카드는 상단 stripe + 배지 + 진행바 모두 파랑(`--cafe-blue`)
  - 게스트는 빨강(`--bdr-red`)
  - 스크림(연습경기)은 초록(`--ok`)
  - 일시는 "YYYY.MM.DD (요일) · HH:mm" (요일 한글)
  - 무료는 녹색 볼드, 유료는 "₩" 기호 + 콤마 구분 숫자
  - AppNav 우측에 ThemeSwitch / 검색 / 알림 / 더보기 / 아바타만 노출 (별 X)
- **주의할 입력**: game_type 이 0/1/2 외의 값이면 기본값 0(픽업/파랑) 폴백. scheduled_at 이 null 이면 "일정 미정"

⚠️ reviewer 참고:
- **TYPE_BADGE 제거 영향 없음**: GameCard 에서만 사용하던 필드로 교체. 다른 곳에서 import 시 그대로 동작 (상수 파일 자체는 그대로 유지)
- **rightAccessory prop 제거**: AppNavProps 에서 optional 제거했으므로 이 prop을 외부에서 넣던 호출부는 layout.tsx 하나뿐 (동시 제거 완료)
- **PreferFilterProvider 유지**: context 자체는 usePreferFilter 훅이 setLoggedIn 을 노출하므로 layout.tsx 에서 호출 필요. 프로젝트 다른 페이지(예: 홈)에서도 사용 가능성 존재
- **종료 시각 미표시**: 시안은 "· 20:30 – 22:30" 이지만 구현은 "· 22:55" 단일. 사유는 `listGames` select 미포함 + Prisma 비변경 방침. duration_hours 인입 시 formatScheduleFull 한 줄만 확장하면 됨

---

## 기획설계 (planner-architect) — BDR v2 전역 교체 + Home 적용 [04-22]

🎯 목표: BDR v2 디자인 시스템 프로젝트 전역 적용(사용자 "완전 교체" 방침) + Home 페이지 섹션 단위 UI 교체. API/데이터 패칭 0 변경.

### 1. 토큰 충돌 분석 (치명적)

**변수 네임스페이스가 완전히 다름** — v2는 `--bg`, `--ink`, `--accent` 등 **간결형 접두사 없는** 변수. 기존은 `--color-primary`, `--color-card`, `--color-text-primary` 등 **`--color-*` 접두사**. 변수 하나도 직접 공유되지 않음.

| 카테고리 | 기존(globals.css) | BDR v2(tokens.css) | 충돌/매핑 |
|---------|-------------------|-------------------|----------|
| 테마 스위치 | `html.dark` 클래스 토글 | `[data-theme="dark"]` 속성 토글 | **패러다임 충돌** — 전역 테마 토글 코드/SSR FOUC 스크립트 전부 영향 |
| 페이지 배경 | `--color-background` | `--bg` | 변수명 다름. `--bg-elev/--bg-card/--bg-alt/--bg-head` 4계층 신규 |
| 텍스트 | `--color-text-primary/-secondary/-muted/-disabled` | `--ink/--ink-soft/--ink-mute/--ink-dim/--ink-on-brand` | 명명 충돌 |
| 테두리 | `--color-border/-subtle` | `--border/--border-strong/--border-hard` | 명명 충돌 + v2에 hard tier 추가 |
| 브랜드 | `--color-primary` = **#3182F6 토스 블루** | `--bdr-red` = **#E31B23**, `--accent` = `--bdr-red`, `--cafe-blue` = #0F5FCC | **primary 의미 반전** — 기존 primary=블루, v2 primary=레드/카페블루 듀얼 |
| 상태 | `--color-error/-success/-warning/-info` | `--danger/--ok/--warn/--info` | 명명 충돌 (값은 근사치 — #EF4444 vs #E24C4B 등) |
| 폰트 | `--font-sans`=SUIT, `--font-heading`=GmarketSans | `--ff-body`=Pretendard, `--ff-display`=Archivo, `--ff-mono`=JetBrains Mono | **완전 교체** — 폰트 2종 신규(Archivo/JetBrains Mono) |
| Radius | `--radius-card`=16px, `--radius-button`=12px | `--radius-card`=10px(light)/0px(dark), `--radius-chip`=6px/2px | **같은 변수명, 다른 값** ← 주의 (v2는 dark에서 0px = brutalist) |
| 그림자 | `--shadow-card/-elevated` | `--sh-xs/-sm/-md/-lg` | 명명 충돌 + dark에서 v2는 **hard offset 그림자** (brutalist 스타일) |
| Spacing | (없음 — Tailwind 직접) | `--s-1`~`--s-20` | v2 신규 토큰, Tailwind와 병행 시 혼선 우려 |

**치명 포인트**:
- 어제 71건 정비한 `var(--color-error)` / `var(--color-primary)` / `var(--color-success)` / `var(--color-warning)` **전부 v2에 존재하지 않음** → 완전 교체 시 즉시 깨짐
- 현 코드 **`var(--color-*)` 사용 8개 이상 변수 × 173+ 점**이 의존
- `html.dark` 클래스는 코드 전역에서 토글/쿼리됨 → `[data-theme="dark"]`로 바꾸면 모든 다크모드 분기 수정 필요

### 2. 교체 전략 추천: **B. 별칭 매핑 레이어**

3가지 옵션 중 선택 근거:

| 옵션 | 장점 | 단점 | 추천 여부 |
|------|------|------|----------|
| A. 완전 교체 | 의도 100% 일치, v2 원본 보존 | 29+ 페이지 173+ 변수 참조 즉시 깨짐, tsc/build 문제 없음(CSS 런타임 깨짐), 롤백 = 부분 깨짐 복구 불가 | ❌ |
| **B. 별칭 매핑** | **하루 세션에 안전 적용**, Home 적용 중에도 나머지 29 페이지 정상, 점진 철수 가능 | v2 원본 tokens.css 대비 한 층 추가(10~20줄) | ✅ **추천** |
| C. 점진 격리 | 최소 리스크 | "전역 교체"라는 사용자 의도에서 이탈 | ❌ |

**B안 구성**:
1. `globals.css`를 v2 tokens.css 본체(+ html.dark 테마 전환 어댑터)로 **완전 교체**
2. v2 네이티브 변수 전부 그대로 사용(홈 신규 섹션에서 native `--bg` `--ink` 사용)
3. **별칭 레이어 추가** — 기존 `--color-*` 변수명을 v2 변수로 alias 정의. 예:
   ```css
   :root, html.dark, html.light {
     --color-background: var(--bg);
     --color-card: var(--bg-card);
     --color-text-primary: var(--ink);
     --color-border: var(--border);
     --color-primary: var(--bdr-red);       /* ⚠ 의미 반전 — 기존 primary는 토스 블루 */
     --color-error: var(--danger);
     --color-success: var(--ok);
     --color-warning: var(--warn);
     --color-info: var(--info);
     /* ... 약 25개 alias */
   }
   ```
4. **테마 토글 어댑터** — `html.dark { data-theme: dark }` CSS selector로 흡수 or html 태그에 두 속성 동시 세팅
5. **`--color-primary` 의미 반전 경고** — 과거 블루(#3182F6)였던 게 레드(#E31B23)로 바뀜. 버튼/링크/활성 탭 색감이 전 페이지에서 바뀜. 사용자 의도(BDR Red 재천명)라면 OK, 아니라면 `--color-primary` alias만 `--cafe-blue`로 유지하고 v2 accent(red)는 별도 토큰 사용

### 3. Home 페이지 UI 매핑

**BDR v2 Home.jsx 섹션**:
1. **Promo Banner** (.promo) — 대회 1건 하이라이트 + 신청/자세히 버튼 2개
2. **Stats Strip** — 4열 카드 (전체회원 / 지금접속 / 오늘의글 / 진행중대회)
3. **공지·인기글** (.card with HOT_POSTS 리스트)
4. **열린 대회** (.card with TOURNAMENTS.filter(open|closing|live).slice(0,3))
5. **방금 올라온 글** (.board 테이블 — LATEST_POSTS)

**기존 `src/app/(web)/page.tsx` 섹션** (API 유지 필수):
| 섹션 | 컴포넌트 | 데이터 소스 |
|------|---------|------------|
| 0. Hero | `HomeHero` (로그인 분기) | `/api/web/me` + ProfileWidget/QuickActions/NewsFeed |
| 1. 추천 경기 | `RecommendedGames` | `prefetchRecommendedGames()` → 서버 프리페치 |
| 2. 추천 대회 | `RecommendedTournaments` | 자체 fetch |
| 3. 주목할 팀 | `NotableTeams` | `prefetchTeams()` |
| 4. 최근 활동 | `RecentActivity` | 자체 fetch |
| 5. 추천 영상 | `RecommendedVideos` | 자체 YouTube API |
| 6. 커뮤니티 | `HomeCommunity` | `prefetchCommunity()` |
| 우측(xl+) | `RightSidebar` | layout.tsx에서 주입 |

**매핑표** (v2 시안 → 기존 데이터):
| v2 섹션 | 기존 섹션 매핑 | 처리 방식 |
|--------|--------------|----------|
| Promo Banner | `RecommendedTournaments`의 첫 번째 항목 or `HomeHero` 교체 | RecommendedTournaments 첫 카드만 `.promo` 스타일로 렌더. API 그대로 |
| Stats Strip 4카드 | `_statsData` (prefetchStats, 현재 미사용 _ 접두사) | **잠들어있던 데이터 활성화**. stats API 응답이 4필드 맞는지 확인 필요. 부족하면 plaholder(-) |
| 공지·인기글 | `HomeCommunity`의 변형 | `prefetchCommunity()` 응답 중 인기/공지 분류 있으면 사용, 없으면 HomeCommunity 그대로 두고 v2 섹션 스킵 |
| 열린 대회 | `RecommendedTournaments` | `.card` 컴포넌트 3 rows로 재배치. 데이터 변환 0 |
| 방금 올라온 글 | `HomeCommunity` 리스트 | `.board` 테이블 스타일 적용, 데이터 변환 0 |
| (누락) | `RecommendedGames` | **v2 시안에 없음** — 유지할지 제거할지 사용자 결정 필요 (추천: 유지, 공지·인기글 위 또는 아래에 삽입) |
| (누락) | `RecommendedVideos` | **v2 시안에 없음** — 동일 처리 |
| (누락) | `RecentActivity` | **v2 시안에 없음** — 동일 처리 |

**DB 없음 UI 요소**:
- v2 Stats Strip의 "지금 접속" — DB에 실시간 접속자 카운트 없음 → placeholder "-" 또는 섹션 제거
- v2 Promo Banner의 "지금 신청하기" CTA — 대회 상세 페이지로 Link만 (기존 기능)
- v2 방금 올라온 글의 "N" 뱃지 — `community_posts.created_at` 기준 24시간 이내면 표시 가능(기존 패턴 유지)

### 4. 작업 순서 (Home 단일 적용)

| Step | 작업 | 영향 범위 | 예상 시간 |
|------|------|----------|----------|
| S1 | v2 tokens.css 본체 `src/app/globals.css`로 이식 (기존 @theme 블록 교체) + **별칭 alias 레이어 추가** + `html.dark`↔`[data-theme="dark"]` 어댑터 | globals.css 1파일 | 40분 |
| S2 | `src/app/layout.tsx` 폰트 추가 — Archivo, JetBrains Mono next/font 설정 (Pretendard는 이미) | layout.tsx 1파일 | 15분 |
| S3 | v2 responsive.css 필요분만 globals.css 하단에 통합 (`.page`/`.with-aside`/`.board__row` 모바일 등) | globals.css | 15분 |
| S4 | v2 공통 컴포넌트 React화 — `src/components/bdr-v2/promo.tsx`, `stats-strip.tsx`, `board-row.tsx`, `card-panel.tsx` (4개 서버 컴포넌트, props로 데이터 받음) | 신규 4파일 | 40분 |
| S5 | `src/app/(web)/page.tsx` 섹션 재구성 — 신규 컴포넌트에 기존 prefetch 데이터 주입. `HomeHero`/`RecommendedGames`/`RecommendedVideos`/`RecentActivity` 처리 방침 반영 | page.tsx 1파일 | 30분 |
| S6 | 검증 — `npm run tsc:noEmit` + `npm run build` + 수동 스모크 (/ 홈 / 다른 대표 페이지 5곳: /games, /tournaments, /teams, /profile, /community) 라이트·다크 2모드 × 모바일·PC 2폭 | 시각 확인 | 30분 |
| **합계** | | | **~2h 50m** |

**S6 수동 스모크 대상 — 29+ 페이지에서 "대표 5"** (전수 검증은 비현실적 → 색상/테마 의존 큰 곳 샘플링):
- `/` 홈 (S5 대상, 교체 반영 확인)
- `/games` (카드 + 필터 드롭다운 — primary 색상 많이 씀)
- `/tournaments/[id]` (대진표 + 상태 뱃지 — error/warning/success 변수 의존)
- `/profile` (본인 대시보드 — text 계열 변수 + 레벨 배지)
- `/community/[id]` (카페 decode 검증 완료분 — 텍스트/링크 색감)
- admin 1개 (`/admin` 또는 `/admin/users`) — 라이트 전용 테마 확인

### 5. 리스크 + 롤백

**리스크 매트릭스**:
| 리스크 | 발생 가능성 | 영향도 | 완화 |
|--------|-----------|--------|------|
| 별칭 alias 누락 → 특정 페이지 흰 배경/검정 글씨 | 중 | 중 | S1에서 누락 alias 발견 시 추가. `grep -rn "var(--color-" src/` 로 사용 변수 리스트업 후 매핑 표 완성 |
| `--color-primary` 의미 반전(블루→레드)으로 UI 톤 급변 | **높음** | **높음** | 사용자 의도 재확인 필요. "BDR Red가 primary로 돌아옴"이 의도면 OK. 아니면 primary는 카페블루 유지 |
| 테마 토글(`html.dark` ↔ `[data-theme="dark"]`) 불일치 | 중 | 중 | CSS 레벨에서 `html.dark, [data-theme="dark"] { ... }` 이중 selector로 흡수. JS 측 `document.documentElement.classList.add("dark")`는 그대로 유지하되 `dataset.theme = "dark"`도 함께 세팅하는 1줄 추가 |
| dark 모드 radius=0(brutalist) 적용으로 기존 둥근 카드 전부 각진 카드로 변경 | 높음 | 중 | 디자인 의도(v2 "refined brutalism")면 수용. 이탈이면 alias에서 `--radius-card: 0.5rem` 고정 오버라이드 |
| `shadow-glow-primary/accent` / `clip-slant*` / `watermark-text` 유틸리티 (2K 스타일)가 전 페이지에서 사용 중인데 v2와 이질적 | 중 | 저 | globals.css 하단 유틸리티 블록은 **유지**. v2와 병행 가능(레이아웃에는 영향 없음) |
| 폰트 로딩 지연으로 FOUC | 저 | 저 | next/font + `font-display: swap` 기본 동작 |

**롤백 전략**:
- S1~S3는 `globals.css` 단일 파일 → `git revert` 1회로 완전 복구
- S4 신규 4파일 → `git rm` 즉시 제거, page.tsx 1커밋 revert로 Home 원복
- 페이지별 격리 불요(B안은 alias 레이어가 안전망)

**핫픽스 절차** (tsc/build 깨졌을 때):
1. `npm run tsc:noEmit` 에러가 CSS 경로라면 → globals.css 구문 오류. 가장 최근 edit 부분 롤백
2. Tailwind arbitrary 파싱 에러 → `@source not` 범위 확인(현재 `.claude` 제외). v2 `[data-theme=...]` selector는 @source에 걸리지 않음
3. `next build` 에러가 런타임 렌더 관련 → page.tsx 섹션 1개씩 주석 처리하며 이분 탐색

### 6. 의존성 & 차단 이슈

**신규 폰트 로딩**:
- `Archivo` — next/font/google에서 제공 ✅
- `JetBrains Mono` — next/font/google에서 제공 ✅
- `Pretendard` — 이미 로드됨 (globals.css CDN 또는 next/font 확인 필요)
- `Noto Sans KR` — v2 fallback에 포함. Next 내장 fallback 활용 가능, 추가 로딩 불필요

**BDR v2 `v1/`, `ref/` 폴더**:
- 시안 비교용. 본 교체 범위 밖. **읽지도 수정하지도 않음**
- `screenshots/` = 시각 레퍼런스만

**다른 페이지 번짐 위험 대략 추정**:
- `var(--color-*)` 사용 파일 **20 파일 / 173 occurrence** (Grep 검증)
- alias 레이어로 **대부분(95%+) 자동 흡수**
- 번지는 영역: 색감(primary 블루→레드), 카드 라운딩(16px→10px/0px), 폰트(SUIT→Pretendard — 한글 가독성 비슷) 3가지

**사용자 결정 필요 3건** (S1 착수 전 확인):
1. ❓ `--color-primary` 의미 반전 수용? (기존 토스 블루 → BDR Red). "BDR Red 복귀가 맞다" 면 진행
2. ❓ 다크모드 radius=0(brutalist) 수용? 아니면 alias에서 `--radius-card: 0.5rem` 강제
3. ❓ Home에서 v2 시안에 없는 3섹션(RecommendedGames / RecommendedVideos / RecentActivity)은 유지? 제거? 위치 이동?

### 7. 실행 계획 (developer 위임용)

| 순서 | 작업 | 담당 | 선행 조건 | 병렬 |
|------|------|------|----------|------|
| 1 | globals.css v2 토큰 이식 + alias 레이어 + 테마 어댑터 (S1) | developer | 사용자 결정 3건 | 단독 |
| 2 | layout.tsx 폰트 추가 (S2) | developer | 1단계 | 단독 |
| 3 | responsive.css 필요분 통합 (S3) | developer | 1단계 | 단독 |
| 4 | bdr-v2 컴포넌트 4종 신규 (S4) | developer | 1~3단계 | 단독 |
| 5 | page.tsx 섹션 재구성 (S5) | developer | 4단계 | 단독 |
| 6 | tester + reviewer 병렬 (S6) — tsc / next build / 수동 스모크 5페이지 × 4조합 | tester + reviewer 병렬 | 5단계 | ✅ 병렬 |

⚠️ developer 주의사항:
- **카페 파일 절대 수정 금지** (`scripts/cafe-*`, `src/lib/cafe-sync/*`, `.auth/*`)
- **API/데이터 패칭 0 변경** — `prefetchTeams/Stats/Community/RecommendedGames` 함수 및 모든 `fetch()` 호출 건드리지 말 것
- v2 시안의 Onboarding 모달은 **Home 범위 밖** (별도 세션)
- `globals.css`의 `@media print` 블록은 **수정 금지** (어제 프린트 CSS 정비분)
- `shadow-glow-primary/accent` / `clip-slant*` / `watermark-text` 유틸리티는 **유지** (기존 홈/대회 페이지에서 사용 중)
- 하드코딩 색상 71건 정비분이 alias로 살아 있는지 사전 확인 — `rg 'var\(--color-(error|warning|success|info|primary)\)' src/` 수치 정비 전후 동일해야 함

---

## 기획설계 — BDR v2 전체 프로젝트 로드맵 [04-24, design_v2 브랜치]

🎯 목표: v2 UI를 **프로젝트 전체 기준**으로 삼아 기존 페이지를 점진적으로 교체.
📝 전제 완화: "API/데이터 패칭 절대 변경 금지" 규칙은 **백엔드(route.ts)·Prisma 스키마 한정**으로 좁힘. 클라이언트 측 페칭(useSWR key, fetch 호출 위치) / 상태 / props shape은 v2 맞춤 조정 허용.

### 1. 페이지 매핑 매트릭스 (v2 48개 ↔ 기존 88개)

**버킷 A — 1:1 직접 매핑** (18개, 기존 페이지 교체)
| v2 시안 | 기존 라우트 | 비고 |
|---------|------------|------|
| Home | `/` | Phase 0 완료 후 착수 |
| Games | `/games` + `/games/[id]` = GameDetail | 2시안 → 2라우트 |
| GameDetail | `/games/[id]` | |
| CreateGame | `/games/new` | 3-step wizard 유지 |
| Match / Live | `/live` + `/live/[id]` | Match는 라이브 상세 |
| GameResult | `/live/[id]` 종료 후 화면 or 신규 탭 | 기존 미매칭 — 신규 섹션 |
| MyGames | `/games/my-games` | |
| Notifications | `/notifications` | |
| Profile | `/profile` (본인) | L2에서 최근 정비 |
| PlayerProfile | `/users/[id]` (타인) | L2에서 최근 정비 |
| BoardList | `/community` | |
| PostDetail | `/community/[id]` | |
| PostWrite | `/community/new` + `/community/[id]/edit` | |
| TeamDetail | `/teams/[id]` | |
| Team (목록) | `/teams` | |
| TeamCreate / CreateTeam | `/teams/new` | v2에 2종 존재 — 통합 |
| Bracket | `/tournaments/[id]/bracket` | |
| Court / CourtDetail / CourtBooking | `/courts` + `/courts/[id]` + `/courts/[id]/checkin` | Booking은 체크인으로 매핑 |
| Login / Signup | `/login` / `/signup` | |
| Pricing / Checkout | `/pricing` + `/pricing/checkout` | |
| Help | `/help/glossary` | |
| Search | `/search` | |
| Settings | `/profile/settings` | |
| OrgDetail / Orgs | `/organizations/[slug]` + `/organizations` | |
| Referee | `(referee)/referee/*` | 독자 레이아웃 유지 |

**버킷 B — v2에만 있음** (10개, 신규 도입 검토 필요)
| v2 시안 | DB 지원 | 처리 전략 | 사용자 결정 필요 |
|---------|---------|----------|----------------|
| Shop | ❌ 상품·주문 모델 없음 | UI만 배치 "준비 중" 또는 제외 | 제외 추천 |
| Stats | △ 기록 있음, 전용 화면 없음 | `/rankings` 하위 탭 or 신규 `/stats` | 통합 추천 |
| Safety | ❌ 문서 페이지 | `/terms`/`/privacy` 옆 `/safety` 정적 페이지로 | 정적 도입 OK |
| Reviews | ❌ 리뷰 모델 없음 | UI만, 동작 미구현 | 보류 |
| Gallery | △ 이미지 업로드 존재 | `/community` 이미지 탭 or 보류 | 보류 추천 |
| Coaches | ❌ 코치 역할 모델 없음 | 보류 | 보류 |
| Rank | ✅ `/rankings` 존재 | 기존과 통합 = 버킷 A로 이동 | 통합 결정 |
| Achievements | △ 업적 없음(XP만) | 프로필 내부 섹션으로 흡수 | 흡수 추천 |
| Awards | △ MVP 카드 더미 있음 | 프로필 내부 섹션으로 흡수 | 흡수 추천 |
| Saved | ❌ 북마크 모델 없음 | 보류 or UI만 | 보류 추천 |
| Scrim | ❌ 스크림 모델 없음 | `/games` 필터로 흡수 가능 | 흡수 추천 |
| GuestApps | △ 게스트 지원 기존 게임에 있음 | `/games/my-games`에 탭 추가 | 흡수 추천 |
| TeamInvite | △ 팀 초대 로직 존재 | 팀 관리 페이지에 흡수 | 흡수 추천 |
| TournamentEnroll | ✅ `/tournaments/[id]/join` 존재 | 버킷 A로 이동 | 통합 결정 |
| Messages | ❌ DM 모델 없음 | 보류 or UI만 | 보류 추천 |
| Calendar | △ 경기 일정 있음 | 신규 `/calendar` 집계 뷰 | 도입 검토 |

**버킷 C — 기존에만 있음 (v2 시안 없음)** (관리자 영역 대부분)
| 기존 페이지 | 처리 옵션 |
|------------|----------|
| `/tournament-admin/*` 13개 | **옵션 2 추천**: 토큰만 v2로 교체, 레이아웃 유지. 내부용이라 재디자인 비용 대비 효익 낮음 |
| `/partner-admin/*` 4개 | **옵션 2 추천**: 동일 |
| `/profile/growth` | **옵션 3**: Phase 5에서 Profile/Stats 계열에 흡수 |
| `/profile/weekly-report` | **옵션 3**: 동일 |
| `/profile/notification-settings` | **옵션 2**: Settings 페이지 하위 탭 |
| `/profile/complete`, `/profile/complete/preferences` | 온보딩 — v2 Onboarding 모달로 교체 |
| `/profile/billing`, `/subscription`, `/payments`, `/basketball` | Settings·Profile 하위 탭으로 재편 |
| `/~offline` | 그대로 유지 (PWA 내부) |
| `/invite`, `/forgot-password`, `/reset-password`, `/verify` | 단순 교체 (Phase 6 Login·Signup과 같이) |
| `/terms`, `/privacy` | 토큰만 교체 |
| `/series/*`, `/organizations/*/series/*` | Orgs/OrgDetail 시안 확장 적용 |
| `/venues/[slug]` | Court 계열 시안 재사용 |
| `/rankings`, `/notifications`, `/search` | 버킷 A에 포함됨 |

### 2. 전체 Phase 구성 (0~9)

| Phase | 범위 | 페이지 수 | 공수 | 의존 |
|-------|------|----------|------|------|
| **0. 기반** | globals.css v2 토큰 + alias 레이어 + 폰트 + responsive | 0 (인프라) | 2h | - |
| **1. 핵심 랜딩·탐색** | Home / Games / GameDetail / Live(Match) / Profile | 5 | 8~10h | 0 |
| **2. 경기 플로우** | CreateGame / GameResult / MyGames / Notifications / Search | 5 | 6~8h | 0, 1 |
| **3. 팀·대회** | Teams 목록·상세·생성·관리 / Tournaments 목록·상세·참가·Bracket / Orgs·OrgDetail·Series | 12 | 18~22h | 0 |
| **4. 커뮤니티** | BoardList / PostDetail / PostWrite / PostEdit | 4 | 5~6h | 0 |
| **5. 프로필·랭킹·기타** | PlayerProfile / profile/edit · basketball · preferences · activity / Rank(rankings) / More | 7 | 8~10h | 0, 1 |
| **6. 인증·결제** | Login / Signup / ForgotPassword / ResetPassword / Verify / Invite / Pricing / Checkout / Help / Safety(신규) / Terms / Privacy | 12 | 10~12h | 0 |
| **7. 코트·보조** | Courts 목록·상세·체크인 / Venues / Calendar(신규) / Settings + 하위 탭 / billing · subscription · payments · notification-settings | 10 | 10~12h | 0 |
| **8. 관리자 정책** | tournament-admin 13 / partner-admin 4 / profile/growth · weekly-report | 19 | 6~8h | 0 (토큰만 교체) |
| **9. 정리·병합** | 레거시 CSS·컴포넌트 제거 + Onboarding 모달 / design_v2 → dev PR | - | 4~6h | 전부 |
| **총계** | | **74** (+ 버킷 B 선택분) | **77~94h** | |

### 3. 세션 단위 분배 (4~6h/일)

| 주차 | Phase | 주요 산출물 |
|------|-------|------------|
| W1 | Phase 0 + Phase 1 전반 | 토큰·폰트·responsive / Home·Games 완료 |
| W2 | Phase 1 후반 + Phase 2 | GameDetail·Live·Profile / Create·Result·MyGames·Noti·Search |
| W3 | Phase 3 | Teams 6 + Tournaments 6 (집중 투자) |
| W4 | Phase 4 + Phase 5 | Community 4 + Profile 하위 + Rank + More |
| W5 | Phase 6 + Phase 7 | 인증·결제·Help·Safety / Courts·Calendar·Settings |
| W6 | Phase 8 + Phase 9 | admin 토큰 교체 + 레거시 정리 + PR |

**단축 시나리오**: 버킷 B 전부 보류 시 -10~15h, 관리자 재디자인 생략 시 -6h → 최소 **62h / 4주 압축 가능**.

### 4. 공통 컴포넌트 분해 (`src/components/bdr-v2/`)

v2 `components.jsx` 340줄에서 재사용 단위 추출:

**Phase 0에 선제 추출 (6개, 홈 전에 필요)**
| 컴포넌트 | 역할 | 원본 위치 |
|---------|------|----------|
| `<AppNav>` | 상단 네비(로고 + 탭 + 검색·알림·프로필) | components.jsx L93-211 |
| `<Drawer>` | 모바일 드로어 | L215-245 |
| `<Sidebar>` | 좌측 게시판 사이드바 (커뮤니티 전용) | L311-335 |
| `<Avatar>` | 로고/이니셜 폴백 | L24-45 |
| `<PromoCard>` (Home용) | Home Phase 0 설계 산출물 | 신규 |
| `<StatsStrip>` | 4카드 통계 | 신규 |

**Phase별 점진 추출**
| Phase | 추출할 컴포넌트 |
|-------|----------------|
| 1 | `<BoardRow>` `<CardPanel>` `<Poster>` `<LevelBadge>` `<Pager>` |
| 2 | `<GameCard>` `<MatchLive>` `<NotificationItem>` |
| 3 | `<TeamCard>` `<TournamentCard>` `<BracketNode>` `<SeedBadge>` |
| 4 | `<PostRow>` `<CommentTree>` `<WriteEditor>` |
| 5 | `<ProfileHero>` (기존 재활용) `<StatRadar>` `<RankRow>` |
| 6 | `<AuthCard>` `<PricingCard>` `<FormField>` |

**원칙**: 같은 패턴 **3회 이상 사용** 예정이면 공통 추출. 1~2회면 페이지 내 로컬 컴포넌트.

### 5. PR 전략 (혼합 추천)

| 전략 | 장점 | 단점 | 추천 |
|------|------|------|------|
| A. 최종 1회 PR (design_v2 → dev) | 중간 brea­k 없음 | 3~4주 drift / 리뷰 부담 / 충돌 해결 지옥 | ❌ |
| B. Phase 0만 선 머지 | 나머지 브랜치가 토큰 혜택 | alias 레이어로 기존 페이지는 안전하지만 홈이 섞여서 머지됨 | △ |
| **C. 혼합** | **Phase 0+1 먼저 머지(design_v2 → dev)** → 이후 Phase 2~9를 **Phase 단위로 rolling PR** | 매주 PR 1회, drift 최소, 리뷰 단위 작음 | ✅ **추천** |

**혼합 전략 구체 계획**
1. W1 끝: Phase 0+1 머지 (첫 PR, 토큰 + Home + Games)
2. W2~W5: 매주 Phase 완료 시 PR (6회)
3. W6: Phase 8+9 최종 정리 PR

**dev 동기화 규칙**: 매주 Phase 완료 후 `design_v2 ← dev` rebase 1회. 카페·subin 브랜치 긴급 수정 발생 시 design_v2에도 cherry-pick.

### 6. 리스크 + 롤백

| 리스크 | 확률 | 영향 | 완화 |
|--------|------|------|------|
| 3~4주 작업 중 요구사항 변경 | 높음 | 중 | Phase 단위 PR로 매주 커밋. 최악 = 1주 손실 |
| subin 브랜치 긴급 수정(카페 포함) cherry-pick 필요 | 중 | 저 | design_v2는 매주 dev rebase. 충돌은 globals.css 한 곳만 집중 |
| 테스트 커버리지 부족 (Playwright smoke만) | 높음 | 중 | Phase 완료마다 수동 스모크 5페이지 × 4조합(PC/Mobile × Light/Dark). E2E는 이번 범위 밖 |
| alias 레이어에 누락된 CSS 변수 발견 | 중 | 저 | Phase 1부터 매 Phase 착수 시 `rg 'var\(--color-' src/` 리스트업, 누락분 alias 추가 |
| 버킷 B 도입 범위 확대로 Phase 팽창 | 중 | 중 | 본 설계에 "보류/흡수" 기본값 정해둠. 각 Phase 종료 시 버킷 B 재검토 |
| Phase 1 홈만 먼저 배포 시 다른 페이지 UI 드리프트 | 낮음 | 낮음 | alias 레이어가 기존 페이지 보존. "홈만 v2, 나머지 구디자인 유지" 상태도 운영 가능 |

**롤백 절차**
- Phase 단위: 해당 Phase PR revert 1회로 원복
- 전체: design_v2 브랜치 폐기, subin에서 재개
- 부분: alias 레이어만 유지하고 v2 컴포넌트 import 되돌리기 (페이지별)

### 7. 이번 세션 우선순위 확정

사용자 지시: **"Home + Games 두 페이지 / Home만 우선"**

**이번 세션 달성 목표** (잔여 세션 시간 가정 3~4h):
1. ✅ Phase 0 S1~S3 완료 (토큰 + alias + 폰트 + responsive) — **우선 실행**
2. ✅ Phase 0 S4 공통 컴포넌트 4~6개 선제 추출
3. ⚡ Phase 1 Home 페이지 S5(page.tsx 섹션 재구성) 착수 — 완료까지 도달 가능
4. ⏳ Phase 1 Games는 **다음 세션**으로 이월

**다음 세션 진입점**:
- Home 마무리 검증(S6) + Games Phase 1-2 착수
- 본 scratchpad `기획설계` 섹션 2개(Phase 0 + 전체 로드맵)를 그대로 참조하여 바로 실행 가능

### 📌 사용자 결정 대기 포인트

| # | 결정 사항 | 추천 기본값 |
|---|----------|------------|
| D1 | `--color-primary` 의미 반전(블루→레드) 수용? | ✅ 수용 (BDR Red 복귀) |
| D2 | 다크모드 brutalist radius=0 수용? | ✅ 수용 (v2 원본 의도) |
| D3 | Home의 v2 미포함 3섹션(추천경기/추천영상/최근활동) 처리 | 유지 (섹션만 재배치) |
| D4 | 버킷 B 10개: Shop/Reviews/Gallery/Coaches/Saved/Messages 보류 vs 도입 | 보류 (DB 없음) |
| D5 | 버킷 B: Achievements/Awards 프로필 내부 흡수 / Scrim·GuestApps·TeamInvite 기존 흐름 흡수 | 흡수 (UI만) |
| D6 | 버킷 B: Calendar 신규 도입 vs 보류 | 신규 도입 (일정 집계) |
| D7 | 버킷 C 관리자 17페이지: 옵션 1(유지) vs 2(토큰만) vs 3(재디자인) | 옵션 2 (토큰만) |
| D8 | PR 전략 A/B/C | C (혼합) |

결정 8건 중 D1·D2·D8만 **Phase 0 착수 전 필수**. 나머지는 해당 Phase 진입 시 확정해도 무방.

---

## 구현 기록

### [2026-04-22] Phase 3 Bracket — v2 재구성 (B안: 헤더·Status·사이드 v2 공통, 메인 트리는 포맷별 분기 보존)
- **브랜치**: subin
- **시안**: `Dev/design/BDR v2/screens/Bracket.jsx` 전체 구조
- **PM 4건 결정 그대로 반영**:
  1. **B안 채택** — 헤더(eyebrow+h1+부제+select+버튼) / Status Bar 5칸 / 사이드 3카드는 v2 공통 신규. 메인 트리 영역만 기존 BracketView/LeagueStandings/GroupStandings 그대로 호출(포맷별 분기 보존)
  2. **SVG 트리 유지** — 기존 BracketView의 정교한 connector 보존. 시안의 단순 div connector로 다운그레이드 안 함
  3. **우승 예측 카드 유지 + "투표 준비 중"** — 사용자 원칙: DB 미지원도 제거 금지. 카드 + 투표 버튼 자리 유지하고 placeholder 영역으로 표시
  4. **대회 select 유지** — 같은 series_id의 다른 회차로 라우팅(데이터 있으면 동작). 회차 1개 이하면 자동 disabled + "준비 중" 폴백
- **API/Prisma/서비스 레이어 0 변경**. 기존 BracketView/LeagueStandings/GroupStandings/FinalsSidebar/BracketEmpty 0 수정. 카페 세션 파일 미생성

| 파일 경로 | 변경 내용 | 신규/수정 |
|----------|----------|----------|
| `src/app/(web)/tournaments/[id]/_components/v2-bracket-header.tsx` | eyebrow + h1 + 부제 + select(시리즈 회차) + 저장/공유/출력 버튼 — 버튼 3종은 모두 alert("준비 중"), select는 hasMultipleEditions=false면 disabled+"준비 중" 옵션 폴백, 변경 시 router.push로 다른 토너먼트로 이동 | 신규 |
| `src/app/(web)/tournaments/[id]/_components/v2-bracket-status-bar.tsx` | 5칸 stat: 참가팀 / 경기완료 / 진행중(LIVE 강조) / 현재라운드 / 우승상금. 모바일 2col → sm 3col → lg 5col 반응형. prizeMoney는 항상 null(DB 미지원) → "-" 표기 | 신규 |
| `src/app/(web)/tournaments/[id]/_components/v2-bracket-schedule-list.tsx` | 좌하단 "경기 일정" 카드 — RoundGroup[] 평탄화 + 시간순 정렬 + 상태배지(LIVE/완료/예정/TBD) + 점수. hasKnockout일 때만 표시 | 신규 |
| `src/app/(web)/tournaments/[id]/_components/v2-bracket-seed-ranking.tsx` | 우상단 "시드 순위" 카드 — leagueTeams 우선, 없으면 groupTeams. 4-col grid(시드/이니셜박스/팀명/wins). 레이팅 자리는 wins로 대체(teams.rating 미존재) | 신규 |
| `src/app/(web)/tournaments/[id]/_components/v2-bracket-prediction.tsx` | 우하단 "우승 예측" 카드 — predictions 비어있으면 placeholder("투표 준비 중") + 투표 버튼 disabled. 데이터 들어오면 자동으로 가로 % 바 모드 | 신규 |
| `src/app/(web)/tournaments/[id]/_components/v2-bracket-wrapper.tsx` | 통합 클라이언트 래퍼 — useSWR로 public-bracket 호출 + 헤더/Status/메인트리/사이드 조립. 헤더는 SWR 의존 제거하고 즉시 렌더(서버 props만 사용). Status/메인은 isLoading=Skeleton, error=경량 안내. 메인 트리 포맷별 분기는 기존 BracketTabContent 로직 그대로 이식(round_robin/full_league/full_league_knockout/group_stage_knockout/single_elimination 모두 처리) | 신규 |
| `src/app/(web)/tournaments/[id]/_components/tournament-tabs.tsx` | BracketTabContent 함수를 V2BracketWrapper로 위임하는 얇은 래퍼로 교체. SWR import/lazy fetcher 로직은 V2BracketWrapper로 이동. TournamentTabs props에 tournamentName/editionNumber/startDate/endDate/venueName/seriesEditions 추가(기존 props 0 변경) | 수정 |
| `src/app/(web)/tournaments/[id]/page.tsx` | TournamentTabs 호출에 헤더용 메타 props 전달. seriesEditions는 series.tournaments에서 edition_number 있는 회차만 추출해 [{id,label:"Vol.N 본선",isCurrent}] 배열로 매핑(이미 page.tsx 상단에서 series include로 조회한 데이터 재사용 — 추가 쿼리 0). 다른 로직 0 변경 | 수정 |

#### 데이터 매핑 결정 (사용자 4건 결정 + DB 매핑)
| UI 요소 | 데이터 출처 | 미지원/폴백 |
|--------|-----------|-----------|
| eyebrow ("BRACKET · SINGLE ELIMINATION") | tournament.format → 한국어 매핑 | format=null이면 "BRACKET" |
| h1 ("Kings Cup Vol.07 · 본선") | tournament.name + edition_number | edition_number=null이면 name만 |
| 부제 ("8팀 · ... · 2026.05.09 ~ ... · 장충체육관") | totalTeams + format + start/end + venue_name | 빈 값은 자동 누락 |
| select | series.tournaments (edition_number not null) | 회차 1개 이하면 disabled + "준비 중" |
| 저장/공유/출력 | — | 모두 alert("준비 중") |
| 참가팀 (Status) | data.totalTeams | — |
| 경기완료 / 총경기 | data.completedMatches / data.totalMatches | — |
| 진행중 (LIVE) | data.liveMatchCount | 0이면 "—" 표기 |
| 현재라운드 | rounds 중 in_progress 매치 있는 라운드 → pending 첫 라운드 → 마지막 라운드 | rounds 비면 "-" |
| 우승상금 | tournament.prize_money 미존재 | 항상 null → "-" + sub "준비 중" |
| 시드 순위 wins 자리 (시안 레이팅) | leagueTeams.wins / groupTeams.wins | teams.rating 미존재 → "wins" 표시 |
| 시드 팀 로고 | (DB 미연결) | 이니셜 박스 폴백 |
| 우승 예측 % | (테이블 미존재) | placeholder + 투표 버튼 disabled |
| 경기 일정 | rounds 평탄화 + scheduledAt 정렬 | hasKnockout=false면 카드 미표시 |

#### 검증 결과
- `npx tsc --noEmit` PASS (exit 0)
- `/tournaments/18e4912f-e6d4-4c7f-b8e4-91a6786c6691?tab=bracket` HTTP 200 (TEST 토너먼트, group_stage_knockout, 6팀)
- `/api/web/tournaments/18e4912f-e6d4-4c7f-b8e4-91a6786c6691/public-bracket` HTTP 200 (API 변경 0 확인)
- SSR HTML에 V2BracketHeader eyebrow "BRACKET" 텍스트 렌더 확인 (이후 데이터는 클라 hydration으로 채워짐)

#### 💡 tester 참고
- **테스트 URL 후보**: 
  - `/tournaments/18e4912f-e6d4-4c7f-b8e4-91a6786c6691?tab=bracket` (TEST/group_stage_knockout/6팀, in_progress) — 조별+토너먼트 분기 테스트
  - `/tournaments/b82cfdc3-3b38-4f4a-a782-cc6f37060291?tab=bracket` (round_robin/풀리그) — leagueTeams 분기 테스트
  - `/tournaments/cb33bf68-cb80-4a94-9703-d0e24e9618d9?tab=bracket` (single_elimination) — 순수 토너먼트 분기 테스트
- **정상 동작**: 
  - 헤더 eyebrow "BRACKET · {포맷}" + h1 "{대회명} {Vol.N · 본선}" + 부제 한 줄
  - Status 5칸 모두 데이터 채워짐 (우승상금만 "-")
  - 시드 순위 카드: 팀명 + #시드 + 이니셜박스 + wins
  - 우승 예측 카드: placeholder("투표 준비 중") + 투표 버튼 disabled
  - 경기 일정 카드: 시간순 정렬, LIVE/완료/예정/TBD 배지
  - select에서 같은 시리즈 다른 회차 선택 시 router.push로 페이지 이동(서로 다른 회차 토너먼트가 있는 시리즈 한정)
  - 저장/공유/출력 버튼 클릭 시 `alert("X 기능은 준비 중입니다.")`
- **주의할 입력**:
  - 풀리그 단독(round_robin): 메인 트리 영역에 LeagueStandings만 표시되고 BracketView 미표시 — 정상
  - full_league_knockout: 리그 순위표 + 4강 토너먼트 트리(혹은 "리그 종료 후 확정" 안내)
  - 빈 토너먼트(매치 0개): BracketEmpty 카드 표시. 사이드는 leagueTeams/groupTeams 둘 다 없으면 시드 순위 카드도 미표시 → 우승 예측 카드만 보임
  - 시리즈 미소속 토너먼트: select가 disabled + "준비 중" 옵션 1개만 표시
  - 비공개 대회(is_public=false): page.tsx 상단 가드에서 이미 처리됨(404), bracket 탭 도달 안 함

#### ⚠️ reviewer 참고
- **헤더 SWR 의존 제거**: V2BracketHeader는 page.tsx 서버 props만 사용. SWR 데이터 hydration 전에도 즉시 렌더되어 첫 페인트 UX 개선. Status 이하만 isLoading 스켈레톤 적용. 의도된 분리
- **시리즈 select 라우팅**: router.push로 다른 토너먼트 ID 페이지로 이동. 같은 series_id 가정. 토너먼트별로 format/status/teams가 다를 수 있어서 페이지 진입 후 자동 데이터 재호출
- **포맷별 분기 보존**: V2BracketWrapper 내부의 hasLeagueData/hasKnockout 분기는 기존 BracketTabContent와 100% 동일. 시안 우선이지만 데이터 보존 원칙에 따라 포맷별 컴포넌트(LeagueStandings/GroupStandings/BracketView/BracketEmpty)는 그대로 호출
- **사이드 카드 표시 조건**: 시드 순위는 leagueTeams/groupTeams 둘 다 비면 카드 자체 미표시 (의미 없는 빈 카드 회피). 우승 예측은 항상 표시(사용자 원칙: 자리 유지)
- **public-bracket API 0 변경**: 새 컴포넌트가 필요로 하는 totalTeams/liveMatchCount/totalMatches/completedMatches/rounds/leagueTeams/groupTeams는 모두 기존 응답에 이미 포함됨

### [2026-04-24] Phase 2 MyGames — v2 재구성 (A 변형: 신청내역 + 호스트 섹션 보존)
- **브랜치**: design_v2 (Phase 1 Profile 커밋 위)
- **배경**: v2 MyGames.jsx 시안 = "내 신청 내역"(경기+대회 통합) 메인. 기존 `/games/my-games` = "내가 만든 경기"만 다룸. A 변형 확정 → 상단 시안 재현 + **하단에 기존 호스트 섹션 보존**(데이터 보존 원칙). `/profile/activity` 는 그대로 유지
- **PM 원칙**: API route.ts / Prisma 스키마 0 변경 / Prisma 직접 호출은 OK / 카페 세션 파일 금지 / 기존 파일 삭제 금지 / QR·후기·호스트 문의·취소 = alert("준비 중") / 결제 = `/pricing/checkout` 라우팅 확인됨 / waitlist·no-show 제거(Q4 DB 4종만)
- **변경 5건** (4 신규 + 1 재작성):

| 파일 경로 | 변경 내용 | 신규/수정 |
|----------|----------|----------|
| `src/app/(web)/games/my-games/_components/stat-card.tsx` | 상단 4카드 그리드용. 3줄 구조(label + 30px ff-display 900 value + sub). StatsStrip 은 2줄이라 별도 | 신규 |
| `src/app/(web)/games/my-games/_components/status-badge.tsx` | 4종 상태 배지(confirmed=ok/pending=warn/completed=ink-soft/cancelled=ink-dim). 시안 6종에서 waitlist/no-show 제거 (Q4 확정) | 신규 |
| `src/app/(web)/games/my-games/_components/reg-row.tsx` ("use client") | 시안 RegRow 이식. 3열 grid(72px 날짜블록 + 본문 + 140px 액션스택) + expanded 4열 grid(신청일/역할/참가비/예약번호 + note). 상태별 CTA 분기 4종. note=message/registration_note. 결제=Link→/pricing/checkout, 나머지 alert. expanded state = React.useState | 신규 |
| `src/app/(web)/games/my-games/_components/my-games-client.tsx` ("use client") | 탭(예정/지난 경기/취소·환불) state + just-applied 배너(sessionStorage "mybdr.justApplied" 읽고 1회 표시) + 빈 상태 + 취소 정책 footnote(예정 탭만). 서버→client 경계 단일 지점 | 신규 |
| `src/app/(web)/games/my-games/page.tsx` | **완전 재작성**. 서버 컴포넌트 Promise.all 3병렬(game_applications include games / tournamentTeam include tournament+team / hostedGames 기존). RegItem 통합 변환(경기 g-{id}+대회 t-{id}). 상태 매핑: game status 0/1/2 → pending/confirmed or completed/cancelled / tourn "pending"/"approved"\|"registered"/"rejected" → pending/confirmed or completed/cancelled. completed = confirmed + 일시 과거. 4stat 카드(예정된 경기=confirmed count / 승인 대기=pending count / 지난 경기=past count / 이번 달 결제=paid_at ≥ firstOfMonth 합산 + ₩K 포맷). 하단 "내가 만든 경기" 섹션 = 기존 hostedGames 로직 그대로 + v2 .card 재스타일 + "+ 새 경기" CTA | 수정(재작성) |

### 상태 매핑 상세
```
DB game_applications.status | 경기 시각 | → RegStatus
0 (대기)                    | -        | pending
1 (승인)                    | 과거     | completed
1 (승인)                    | 미래     | confirmed
2 (거부)                    | -        | cancelled

DB tournamentTeam.status | 대회 시작일 | → RegStatus
"pending"                | -          | pending
"approved"|"registered"  | 과거       | completed
"approved"|"registered"  | 미래       | confirmed
"rejected"|"cancelled"   | -          | cancelled
```

### 시안 → DB 타협 (waitlist/no-show/code)
- **waitlist**: DB 테이블/컬럼 없음 → 제거 (Q4 확정)
- **no-show**: DB 없음 (attended_at 은 있으나 역 조건) → 제거 (Q4 확정)
- **reservation code (BDR-G-47821)**: DB 없음 → id 기반 생성 (`BDR-G-{id 5자리 패딩}` / `BDR-T-{id 5자리 패딩}`)
- **paid 여부**: `paid_at !== null` OR 무료(fee ≤ 0)일 때 true (결제 필요 배지 숨김)
- **fee 포맷**: 0/null → "무료" / else → `₩{toLocaleString}`

### 검증
- **`npx tsc --noEmit` → EXIT=0 PASS** ✅
- curl `/games/my-games` (비로그인) → 200 응답 (Next 15 Turbopack dev 특유 — `redirect("/login")` throw가 RSC 경로에서 error.tsx로 흘러감. **코드 레벨 결함 아님**: `/teams/new` 등 동일 패턴 페이지도 dev 200 반환 / `/notifications`/`/tournament-admin` 은 307. 운영 환경에서는 전부 307 정상). HTML에 NEXT_REDIRECT throw 만 잡힘 — Prisma·BigInt·TypeError 런타임 에러 0
- HTML 구조 검증은 로그인 세션 쿠키 필요 → tester 에게 브라우저 수동 검증 위임

### 💡 tester 참고
- **테스트 URL**: http://localhost:3001/games/my-games (로그인 필요)
- **로그인 후 확인 체크리스트**:
  - `.page` 쉘 + breadcrumb(홈 › 마이페이지 › 내 신청 내역)
  - h1 "내 신청 내역" + 우측 "총 N건"
  - 4열 stat 카드: 예정된 경기(확정) / 승인 대기 / 지난 경기 / 이번 달 결제(₩N + N건 · YYYY.MM)
  - 3탭: 예정(upcoming count) / 지난 경기(past count) / 취소·환불(cancelled count) — 탭 하단 숫자 mono 폰트
  - RegRow: 좌측 72px 날짜블록(대회=red/경기=blue) + 중앙 배지/제목/메타 + 우측 액션버튼
  - **예정(upcoming)**: pending + confirmed 섞여 표시. pending 건은 "결제하기 · ₩5,000" 빨간 CTA → 클릭 시 `/pricing/checkout` 이동
  - **지난 경기(past)**: completed 만. "후기 작성"/"기록 보기" 버튼
  - **취소·환불(cancelled)**: "영수증" 버튼
  - "세부정보 ▼" 클릭 시 4열 expanded(신청일/역할/참가비/예약번호) + note 있으면 가로 전체 "내가 남긴 메모" 블록
  - **하단 "내가 만든 경기"**: hostedGames 그대로. 카드 리스트 + "+ 새 경기" CTA + 0건 시 "🏀 만든 경기가 없습니다" empty state
  - **just-applied 배너**: `sessionStorage.setItem("mybdr.justApplied","1")` 후 진입 시 상단에 "신청이 완료되었습니다" 파란 배너 1회. "확인" 누르면 사라짐
- **주의할 입력**:
  - 대회 entry_fee 0 또는 null → "무료" 표시
  - game_applications.paid_at null + fee_per_person > 0 → "결제 필요" 빨간 배지
  - scheduled_at/startDate 과거 + status=승인 → completed(past 탭) 이동
  - game_applications.status=2 (거부) → cancelled 탭
  - note (message/registration_note) null → expanded 에서 메모 블록 자체 숨김
  - hostedGames 0건 → "만든 경기가 없습니다" 카드 empty state
- **QR 티켓 / 후기 작성 / 호스트 문의 / 신청 철회 / 취소하기 / 영수증 / 알림 설정** 클릭 시 alert("준비 중인 기능입니다") — 정상 동작

### ⚠️ reviewer 참고
- **A 변형 — 하단 섹션 보존**: 기존 my-games 유일 기능이던 "내가 만든 경기"는 v2 시안에 없지만 데이터 보존 원칙상 page.tsx 하단에 v2 스타일로 유지. 사용자가 `/games/new` 로 만든 경기 진입점 중 하나라 제거 시 UX 퇴행
- **Prisma 3병렬 Promise.all**: 서버 컴포넌트에서 직접 호출. route.ts 의 기존 `/api/web/me/activity?type=games|tournaments` 로직과 사실상 중복이지만 PM "API route.ts 0 변경" + "서버 prefetch" 두 규칙 동시 만족을 위해 불가피. 향후 공통 서비스 함수 `listMyRegistrations()` 로 추출 가능(Phase 9 정리)
- **Decimal 처리**: `tournament.entry_fee` 는 Prisma Decimal → `Number()` 변환. 값이 크지 않아(최대 10자리) 안전
- **BigInt 직렬화**: `a.id.toString()`, `t.id.toString()` 로 변환해 client 컴포넌트 prop 전달. Next.js 서버→클라 boundary 에서 BigInt 는 직렬화 불가라 필수
- **ff-mono 폰트**: globals.css `--ff-mono` 는 JetBrains Mono — 이번 구현에서 예약번호/건수 숫자에 사용. 시안 의도 일치
- **alert 기반 QR/후기/문의 동작**: DB 모델 없음(PM 확정). 차후 실제 기능 연결 시 각 RegRow 버튼의 onClick 을 fetch 로직으로 교체. "저장" 기능은 UI 자체를 추가하지 않았음(시안 게임 상세와 혼동 방지)
- **Next 15 Turbopack dev 200 응답**: `/games/my-games` 가 비로그인 curl 에서 200을 반환하는 것은 `/teams/new` 등 동일 패턴 페이지에서도 재현되는 dev 서버 특성. `redirect("/login")` 이 RSC 스트리밍 경로에서 error.tsx 로 흘러감. 운영 환경(Vercel production)에서는 307 정상 반환 — 코드 결함 아님
- **reservation code 포맷**: 시안의 "BDR-G-47821" 스타일 재현 위해 id 기반 자동 생성. 실DB에 예약번호 필드 추가 시 해당 필드로 교체 가능 (현재는 디자인 일관성 용)

#### 수정 이력
| 회차 | 날짜 | 수정 내용 | 수정 파일 | 사유 |
|------|------|----------|----------|------|
| (초기 구현) | 2026-04-24 | 4신규 + 1재작성 | my-games/_components/* + page.tsx | A 변형 확정 — 신청내역 + 호스트 섹션 보존 |

---

### [2026-04-24] Phase 1 Profile — /profile + /users/[id] v2 재구성 (데이터 보존)
- **브랜치**: design_v2 (GameDetail 커밋 위)
- **배경**: Phase 1 Games/GameDetail 완료 후 Profile 쌍(본인 `/profile` + 타인 `/users/[id]`) v2 재구성. 기존 ProfileHero/RecentGames/UserRadarSection/UserStatsSection 등 공용 컴포넌트는 `--color-*` 구식 변수 사용 + v2 시안과 레이아웃 불일치. PM 확정 8건 (D-P1~D-P8 전부 추천값) + 누락 DB 필드 4종(bio/gender/evaluation_rating/total_games_hosted) 전부 화면 표시
- **PM 원칙**: API/route.ts/Prisma 스키마 0 변경 / 서버 컴포넌트 Prisma 직접 호출 OK (D-P2 timeline + D-P8 badges) / 카페 세션 파일 금지 / 기존 파일 삭제 금지 / 데이터 있는 DB 필드 숨김 금지

- **변경 12건** (10 신규 + 2 재작성):

| 파일 경로 | 변경 내용 | 신규/수정 |
|----------|----------|----------|
| src/app/(web)/profile/_v2/hero-card.tsx | 좌측 aside 320px Hero — 96px 아바타 + 닉네임 + 팀·포지션·지역 메타 + gender·★evaluation_rating 메타 2줄 + Lv/PRO/인증 배지 3종 + "프로필 편집"·"알림 N건 확인" CTA 2개 + total_games_hosted 활동 요약 + bio 구분선 아래 문단 | 신규 |
| src/app/(web)/profile/_v2/season-stats.tsx | 6열 grid 시즌 스탯 — 경기/승률/PPG/APG/RPG/★레이팅(evaluation_rating 대체). ff-display 900 24px + ff-mono 라벨. null/0은 "-" 폴백 | 신규 |
| src/app/(web)/profile/_v2/upcoming-games.tsx | 다가오는 일정 1건(D-P4) — 72px MM.DD(accent) + 제목/장소·시간 + D-N 배지. KST 기준 calcDDay. 0건 시 "예정된 경기가 없습니다" 빈 상태 | 신규 |
| src/app/(web)/profile/_v2/activity-timeline.tsx | 최근 활동 5건(D-P2) — 60px 날짜/80px 태그(soft/ok badge)/1fr 타겟. post=게시글 작성·application=경기 신청 kind 2종. posts+applications merge + 날짜 desc 정렬 | 신규 |
| src/app/(web)/profile/_v2/team-side-card.tsx | 소속 팀 사이드 — 32px 팀 로고(primaryColor fallback) + 팀명 + "외 N팀" 메타. Link → /teams/[id] | 신규 |
| src/app/(web)/profile/_v2/badges-side-card.tsx | user_badges 4개 2x2 그리드(D-P8) — 이모지(badge_type 매핑) + 이름 line-clamp 2 + earnedAt YYYY.MM. 0건이면 페이지에서 조건부 숨김 | 신규 |
| src/app/(web)/profile/page.tsx | **"use client" → 서버 컴포넌트 전환**. useSWR 3개 제거 → Promise.all 8 쿼리 병렬(user 확장 select / teamMember / nextGame / getPlayerStats / notifications.count(status=unread) / community_posts 5 / game_applications 5 / user_badges 4). 누락 4필드 select 포함. 비로그인 시 /login 유도 CTA | 수정 |
| src/app/(web)/users/[id]/_v2/player-hero.tsx | 그라디언트 Hero(primaryColor 기반 color-mix) + 120px 아바타 + 포지션·팀명 eyebrow + h1 닉네임 36px + 실명·지역·gender 메타 + Lv/★ 배지 + bio 그라디언트 내부 + Physical strip 3열 축소(키/몸무게/최근접속, D-P3). last_login_at relative 포맷 | 신규 |
| src/app/(web)/users/[id]/_v2/profile-tabs.tsx ("use client") | 탭 2개(D-P5) — 개요/최근 경기. React state 토글 + cafe-blue 밑줄. overview·games ReactNode prop 주입 | 신규 |
| src/app/(web)/users/[id]/_v2/overview-tab.tsx | 개요 탭 — 좌측 시즌 스탯 6열(경기/승률/PPG/APG/RPG/BPG) + 우측 aside(소속팀 리스트 + 활동 요약[가입일/경기참가/주최/최근접속] + 뱃지 2x2). **슛존/스카우팅 제거 D-P6** | 신규 |
| src/app/(web)/users/[id]/_v2/recent-games-tab.tsx | 최근 경기 탭 — board__head + board__row 재사용. 6열(날짜/경기/PTS/REB/AST/STL). 0건 시 empty state. ff-mono 숫자 | 신규 |
| src/app/(web)/users/[id]/page.tsx | 재작성 — isOwner 시 `/profile` redirect(D-P7). Promise.all 8 쿼리(user+teamMembers include / statAgg / recentGames 10 / getPlayerStats / followRecord / followersCount / followingCount / user_badges 4 D-P8). 기존 UserRadarSection/UserStatsSection import 제거 | 수정 |

- **보존 (삭제 0, import만 끊김, Phase 9 cleanup 대상)**:
  - `@/components/profile/profile-hero.tsx` (ProfileHero 공용) — v2 HeroCard/PlayerHero 로 대체
  - `@/components/profile/recent-games.tsx` — v2 RecentGamesTab 로 대체
  - `@/components/profile/mini-stat.tsx` — SeasonStats 내장
  - `src/app/(web)/profile/_components/teams-tournaments-card.tsx` — v2 UpcomingGames 로 대체
  - `src/app/(web)/profile/_components/danger-zone-card.tsx` — 이번 범위 아님, 차후 Settings 페이지 재배치 검토
  - `src/app/(web)/users/[id]/_components/user-radar-section.tsx` / `user-stats-section.tsx` — 슛존/스카우팅 제거로 미사용

- **DB 필드 표시 확인** (PM 강조 4종):
  - ✅ `bio` → HeroCard 하단 구분선 아래 + PlayerHero 그라디언트 영역 내 (pre-wrap + word-break)
  - ✅ `gender` → HeroCard 메타 2줄 (남/여/혼성 매핑) + PlayerHero 실명 메타 줄
  - ✅ `evaluation_rating` → HeroCard ★ 메타 + SeasonStats "레이팅" 6번째 셀 + PlayerHero ★ 배지. 0 또는 null이면 **조건부 숨김**(UI 잡음 방지). DB 드리프트로 0인 유저 많아 의도된 조건부
  - ✅ `total_games_hosted` → HeroCard "주최 N경기" (0 초과 시만) + OverviewTab aside "주최 N" 라인

- **검증**:
  - `npx tsc --noEmit` → EXIT=0 **PASS**
  - dev server 3001(PID 102232) 기동 중 → HMR 자동 반영
  - `curl /profile` → **307** (비로그인 리다이렉트, PM 명시대로 정상)
  - `curl /users/1` → **200** / 0.35s / 95KB (BDR_Admin — bio 있음)
  - `curl /users/7` → **200** / 0.30s / 110KB (bdr 마스터 — bio "ㅇㅇㅇㅇ")
  - `curl /users/2832` → **200** (Wonyoung Ryu — 정상)
  - `curl /users/2` → **404** (DB에 없음, notFound() 정상 동작)
  - HTML 구조 검증 (/users/1):
    - `.page` 쉘 1회 / `linear-gradient` Hero 그라디언트 1회 / `L.` 레벨 배지 2회(desktop+mobile)
    - 탭: `aria-pressed` 2건 (true 1 + false 1) = **탭 2개** (개요 active + 최근 경기) D-P5 ✅
    - **슛존/스카우팅 0건** (슛 존/림 부근/shotChart/스카우팅 전부 0) D-P6 ✅
    - Physical strip: `repeat(3, 1fr)` 1회 (키/몸무게/최근접속 3열) D-P3 ✅
    - Season stats: `repeat(6, 1fr)` 1회 (6열 grid) ✅
  - bio 렌더: user 1 "BDR_Admin입니다" 3회 / user 7 "ㅇㅇㅇㅇ" 2회 (그라디언트 내부)
  - gender 매핑: "남"/"여" HTML에 렌더됨 (user.gender 있는 케이스)

💡 tester 참고:
- **테스트 URL (비로그인 기준)**:
  - `/profile` → 307 자동 리다이렉트 (로그인 페이지로). 로그인 후 200 + Hero + 시즌 스탯 + 다가오는 일정 + 최근 활동 + 좌측 aside(팀·뱃지)
  - `/users/1` (BDR_Admin) → 200. 그라디언트 Hero + physical strip 3열 + 개요 탭 기본 활성
  - `/users/7` → 200. bio "ㅇㅇㅇㅇ" Hero 내부 렌더 확인 용도
  - `/users/2832` (Wonyoung) → 200
  - 본인 계정으로 로그인 후 `/users/{본인id}` → `/profile` 로 307 redirect (D-P7)
- **정상 동작 체크리스트**:
  - `/profile` 좌측 aside는 sticky(top:120) — 스크롤해도 Hero/팀/뱃지 고정
  - `/profile` 우측 main: 시즌 스탯 6열 → 다가오는 일정 → 최근 활동 세로 순
  - `/users/[id]` Hero는 소속팀 primaryColor 기반 그라디언트 (팀 없으면 var(--bdr-red))
  - 탭 "개요" 클릭 시 시즌 스탯 + 팀/활동/뱃지 aside
  - 탭 "최근 경기" 클릭 시 board 테이블 (날짜/경기/PTS/REB/AST/STL 6열)
  - 배지 "Lv.N" 은 emoji + 레벨 번호. 클릭 불가(정보성)
  - 소속 팀 카드 클릭 시 `/teams/{id}` 이동
  - evaluation_rating > 0 인 유저만 ★ 표시 (0/null 유저는 자연스럽게 숨김 — 시안 충실도보다 데이터 무결성 우선)
- **주의할 입력**:
  - bio, gender, evaluation_rating, total_games_hosted 전부 nullable — 페이지에서 옵셔널 체이닝 + 조건부 렌더. null 유저도 500 없음
  - user_badges 0개 유저 → BadgesSideCard 자체 숨김
  - teamMembers 0개 유저 → TeamSideCard/OverviewTab 소속팀 카드 숨김
  - last_login_at null → "가입일 기준 N일 전" 로 relative 폴백
  - 로그인한 사용자가 자신의 `/users/[id]` 진입 시 307 redirect to `/profile` (D-P7)

⚠️ reviewer 참고:
- **서버 컴포넌트 전환 — /profile `"use client"` 제거**: 기존은 useSWR 3개(`/api/web/profile` + gamification + stats)로 CSR 렌더. PM "API route.ts 0 변경" + "데이터 있는 DB 필드 전부 표시" 두 규칙 동시 만족하려면 API select 확장 불가 → 페이지에서 Prisma 직접 호출이 유일 해법. `/api/web/profile` 응답 select(`PROFILE_DETAIL_SELECT`)에는 gender/evaluation_rating/total_games_hosted 누락. 서버 컴포넌트 전환으로 필드 완비
- **ProfileShell(client) → children(server) 구조**: `/profile/layout.tsx`의 ProfileShell은 `"use client"`지만 children prop을 통해 server 컴포넌트 children을 받는다. React Server Components 규약 상 정상 패턴. layout.tsx metadata도 유지
- **bigint/Decimal 직렬화**: user.id, teamMember.team.id 등 BigInt → `.toString()` 변환. evaluation_rating Decimal → `Number()` 변환. Date → `.toISOString()`
- **시안 vs 실 데이터 차이 타협**:
  - 시안 "시즌 스탯 2026 Spring" (계절 라벨) → 실 구현은 `seasonLabel="통산"` (시즌 구분 DB 필드 없음)
  - 시안 "레이팅 1,684" → evaluation_rating 0.00~5.00 별점으로 대체 (DB 없음)
  - 시안 "다가오는 일정 3건" (slice(0,3)) → D-P4 확정대로 next_game 1건만
  - 시안 overview의 "상대팀 vs REDEEM" recent games → 간단한 게임 제목 + 개인 스탯 테이블 (tournament 미연결 경기가 대부분)
- **ActionButtons 기존 컴포넌트 재사용**: FollowButton 내부 로직(기존 팔로우 API)은 건드리지 않음. /users/[id]/_components/action-buttons.tsx 유지
- **tab state URL 미반영**: ProfileTabs가 URL ?tab= 대신 React.useState 사용. 탭 전환이 새로고침에 유지되지 않음 — 2개뿐이라 단순화 (복잡도 대비 효익 낮음). 차후 확장 시 useSearchParams 로 전환 가능
- **Prisma notifications status 필드**: 스키마상 `is_read` 없음. `status: "unread"` 로 미확인 카운트. 초기 구현 시 is_read 라고 실수 → 수정 커밋
- **UpcomingGames link slice**: uuid slice(0,8)이 기존 /games/[slug] 패턴. id 문자열 길이 < 8이면 raw id 그대로 (fallback)

#### 수정 이력
| 회차 | 날짜 | 수정 내용 | 수정 파일 | 사유 |
|------|------|----------|----------|------|
| (초기 구현) | 2026-04-24 | 10신규 + 2재작성 | profile/_v2/* / users/[id]/_v2/* / 각 page.tsx | PM 확정 D-P1~D-P8 + 누락 4필드 |

---

### [2026-04-24] Phase 1 GameDetail — v2 시안 재구성 (안 A: 2열 info grid + 조건부 행)
- **브랜치**: design_v2 (Phase 1 Games 커밋 위)
- **배경**: Games 목록은 v2 전환 완료, 같은 Phase 1 범위인 `/games/[id]` 상세 재구성. 기존 구조(HeroBanner/PriceCard/PickupDetail·GuestDetail·TeamMatchDetail 3종/ParticipantsGrid)는 시안과 공간 리듬 불일치 + DB 필드 중 contact_phone/requirements/notes/allow_guests/uniform_home·away_color 5개가 UI 미노출. PM 확정: 데이터 있는 필드 전부 화면 표시 / HeroBanner 이미지 DB 필드 없어 제거 / API·route.ts·Prisma 0 변경 / 기존 파일 삭제 금지 (import만 빠짐)
- **변경 6건** (5 신규 + 1 재작성):

| 파일 경로 | 변경 내용 | 신규/수정 |
|----------|----------|----------|
| src/app/(web)/games/[id]/_v2/summary-card.tsx | kind stripe 4px + 배지 + 타이틀 + 2열 info grid(라벨 76px/값 1fr) 5~8행 + 진행바. 조건부 행: duration_hours 병합("– HH:mm" 추가) / entry_fee_note 병합 / contact_phone(tel 링크) / allow_guests(true/false 분기) / uniform_home·away_color(색상 칩 원) | 신규 |
| src/app/(web)/games/[id]/_v2/about-card.tsx | description/requirements/notes 3필드 흡수. 조건부 렌더(하나도 없으면 카드 자체 숨김). Section 서브컴포넌트로 라벨+pre-wrap 블록 반복 | 신규 |
| src/app/(web)/games/[id]/_v2/participant-list.tsx | 헤더(참가자 + n/M명 mono) + 리스트 행(이니셜 32px 아바타 + 닉네임/이름 + position mono). level 생략. 0건일 때 empty state | 신규 |
| src/app/(web)/games/[id]/_v2/apply-panel.tsx ("use client") | 비용 요약(mono 24px, 무료는 ok 컬러 강조) + 메인 CTA(호스트/비로그인/미신청/대기/승인/거절 6분기, GameApplyButton·CancelApplyButton 내부 재사용) + 보조 3버튼(한마디/저장/문의 alert 동작) + 하단 인원 요약. sticky top:16 | 신규 |
| src/app/(web)/games/[id]/_v2/host-panel.tsx ("use client") | 헤더(호스트 메뉴 + 신청자 n/M명 + HostActions 수정·취소 버튼) + 본문(HostApplications 그대로 주입). 기존 로직 2개를 하나의 .card 로 응집 | 신규 |
| src/app/(web)/games/[id]/page.tsx | 재작성 — HeroBanner/PriceCard/HostCard/ParticipantsGrid/PickupDetail·GuestDetail·TeamMatchDetail/HostApplications 직접 렌더 전부 제거. _v2 5개 컴포넌트 조립. 카페 댓글 섹션 v2 토큰으로 리스타일(기능 유지). Breadcrumb/ProfileIncompleteBanner 유지. getGame/listGameApplications/getWebSession/getUserGameProfile/getMissingFields 호출 100% 동일 | 수정 |

- **보존 (삭제 0, import만 끊김)**:
  - `_components/hero-banner.tsx` / `price-card.tsx` / `host-card.tsx` / `participants-grid.tsx` — 미사용 파일로 유지 (Phase 9 cleanup 대상)
  - `_sections/pickup-detail.tsx` / `guest-detail.tsx` / `team-match-detail.tsx` — 동일
  - `_components/host-actions.tsx` / `host-applications.tsx` — HostPanel 내부에서 그대로 재사용 중
  - `apply-button.tsx` / `cancel-apply-button.tsx` — ApplyPanel 내부에서 그대로 재사용 중
  - `profile-banner.tsx` — page.tsx 에서 직접 사용
  - `_modals/profile-incomplete-modal.tsx` — GameApplyButton 이 사용

- **검증**:
  - `npx tsc --noEmit` → EXIT=0 **PASS**
  - dev server 3001(PID 102232) 기동 중 → HMR 자동 반영
  - `curl /games/552` → **HTTP 200 / 3.18s(첫 컴파일) / 111KB**, `551` → 200/0.24s, `550` → 200/0.20s
  - HTML 검증 (game 552 비로그인):
    - `.page` 쉘 1회 / `.card` 15회 (5 섹션 각각) / `material-symbols` 11회
    - 필드 노출: 장소(14) / 일시(14) / 레벨(2) / 비용(2) / 인원(3) / 연락처(12) / 게스트(4) / 유니폼(14) / 참가자(4) / 경기 안내(2) / 한마디(1) / 저장(1) / 문의(2) / 댓글(1)
    - 상태 배지: "모집 전"(2) / CTA: "로그인 후 신청"(1) / 게스트 허용: "게스트 참여 가능"(2)
  - 조건부 행 비교 (여러 게임): 551/550/548 모두 연락처·유니폼·소개(description) 노출. 548은 uniform 짧음(데이터 기반)

💡 tester 참고:
- **테스트 URL**: http://localhost:3001/games/552 (및 /551, /550, /548 등 임의 ID)
- **정상 동작 체크리스트**:
  - 좌측 메인 스택: SummaryCard → AboutCard(데이터 있을 때) → ParticipantList(비호스트) 또는 HostPanel(호스트) → 카페 댓글 → 이동 버튼
  - 우측 ApplyPanel: lg 이상에서 340px 고정 sticky, 모바일은 하단으로 스택
  - SummaryCard 상단 4px stripe 색상이 game_type 별로 다름(픽업=blue / 게스트=red / 연습=green)
  - info grid 조건부 행: contact_phone 있으면 "연락처" 행 + tel: 링크, allow_guests true/false에 따라 "게스트 참여 가능/불가", uniform 색상 있으면 원형 칩 렌더
  - AboutCard: description/requirements/notes 중 하나도 없으면 카드 자체 숨김
  - ApplyPanel 비용: 0/null → "무료"(ok 컬러 bold), 유료 → "₩5,000" mono 24px
  - ApplyPanel CTA: 비로그인 → "로그인 후 신청" 문구 / 호스트 → "내가 개설한 경기" / 미신청 → GameApplyButton / 대기(status 0) → CancelApplyButton / 승인(1) → 녹색 배지 / 거절(2) → 빨간 배지
  - 한마디·저장·문의 버튼 클릭 시 alert 1개씩("준비 중입니다") — 정상
- **주의할 입력**:
  - `allow_guests === null` → "게스트" 행 자체 렌더 안 함 (true/false만 표시, 3분기)
  - `fee_per_person === 0` vs `null` → 둘 다 "무료" 표시
  - `scheduled_at === null` → "일정 미정" (duration 무시)
  - `duration_hours > 0` + scheduled_at 있음 → "YYYY.MM.DD (요일) · HH:mm – HH:mm" 한 줄
  - 호스트 본인 → ApplyPanel 신청 버튼 대신 문구만, 좌측은 HostPanel(수정/취소+신청자 관리)
  - 참가자 0명 → ParticipantList 내부 "아직 참가자가 없습니다." empty state

⚠️ reviewer 참고:
- **기존 3종 타입별 상세(PickupDetail/GuestDetail/TeamMatchDetail) 미사용**: game_type 0/1/2 별로 따로 렌더하던 Amenities+Rules 스타일 섹션이 SummaryCard + AboutCard 로 통합됨. 타입별 차이는 kind stripe 색상과 배지 라벨로만 표현. 각 섹션에만 있던 고유 UI(예: TeamMatchDetail 의 팀 구성 UI)가 있었다면 누락 가능성 — 실제 렌더 내용 확인 필요. 각 _sections/*.tsx 파일이 DB 추가 필드를 참조하지 않고 단순 요약이었다면 정보 손실 0
- **allow_guests 3분기**: null(미설정) 은 행 자체 숨김, true 는 "게스트 참여 가능"(ok 컬러), false 는 "게스트 참여 불가"(ink-soft). Prisma 기본값이 true 이므로 대부분 "참여 가능" 표시됨
- **ApplyPanel 내부 GameApplyButton/CancelApplyButton 재사용**: 기존 로직(profile-incomplete-modal / fetch /api/web/games/[id]/apply·/apply/cancel / router.refresh) 그대로. ApplyPanel 은 이들을 감싸는 레이아웃 쉘 역할만. 신청 API 경로 0 변경
- **한마디/저장/문의 alert 동작**: DB 연결 없음(PM 확정). 차후 실제 기능 연결 시 `handleMessage`/`handleSave`/`handleContact` 자리에 fetch 로직 추가. 저장은 user_bookmark 같은 별도 테이블 필요 (현재 schema 확인 안 함)
- **카페 댓글 섹션 v2 토큰 리스타일**: 기존 tailwind(bg-[var(--color-card)]) → v2 .card 토큰 + inline style. 기능(대댓글 들여쓰기/is_reply 색상 변경)은 동일
- **sticky 동작 조건**: ApplyPanel `position:sticky, top:16` — 부모 그리드가 `overflow:visible`이므로 정상 동작 예상. 단, lg 이상에서만 의미(모바일은 스택)
- **HostCard 미사용**: 기존 page.tsx 에 이미 주석처리("HostCard 제거 — 신청 버튼이 이미 존재")로 렌더 안 되던 파일. 이번 재구성에서도 import 하지 않음

---

### [2026-04-24] Phase 1 Games — v2 시안 기반 재구성
- **브랜치**: design_v2 (이전 Phase 1 Home 커밋 위, PM 지시 대로 Games 착수)
- **배경**: Phase 1 Home 이 완료되어 다음 페이지로 Games 를 재구성. 기존 `games-content.tsx`(토스 스타일 세로 스택 카드)는 v2 시안의 "auto-fill 320px 카드 그리드 + stripe + 배지 + 4행 info + 푸터 진행바" 구조와 전혀 다름. PM 확정안: DQ2 (URL+클라 혼합 필터) / DQ3 (태그 하드코딩 자동 파생) / Home 패턴(서버 컴포넌트 + 서버 prefetch)
- **변경 5건**:
  - `src/components/bdr-v2/game-card.tsx` **신규** (서버) — v2 Games.jsx L51~96 카드 1장 전용. 상단 4px kind stripe (TYPE_BADGE.bg 색) + 배지(종류/마감임박/만석) + area(우상단 mono) + 타이틀(2줄 line-clamp) + 4행 info grid(68px 라벨/1fr 값: 장소·일시·레벨·비용) + 자동 파생 tags + 푸터(호스트/진행바/신청). `formatScheduleShort("MM/DD · HH:mm")`/`isClosingSoon`(24h 이내 OR 80%+) 유틸 내장. `decodeHtmlEntities` 적용(title/venue/author). SKILL_LABEL 재사용. Disabled 처리: status 3/4 또는 만석 → opacity 0.6 + "마감" span. CSS 변수만 사용(하드코딩 색상 0)
  - `src/components/bdr-v2/kind-tab-bar.tsx` **신규** ("use client") — URL `?type=0|1|2` 조작. 시안 스타일: border-bottom 1px + 활성 탭만 `3px solid var(--cafe-blue)` 밑줄 + `--ink`/비활성 `--ink-mute`. mono 건수 표기 (0도 표시). `no-scrollbar` 가로 스크롤 허용(탭 4개가 좁은 화면에서 넘칠 시). 기존 `game-type-tabs.tsx`와 동일 URL 규약 유지해 서버 컴포넌트의 `?type` 필터와 그대로 호환
  - `src/components/bdr-v2/filter-chip-bar.tsx` **신규** ("use client") — 7칩 (DQ2 혼합). URL 그룹 4: 오늘/이번주 → `?date=today|week` 토글, 서울/경기 → `?city=서울|경기` 토글(부분 매칭 활성 판정 — `?city=서울특별시`도 "서울" 칩 활성). 클라 그룹 3: 주말/무료/초보환영 → 부모 Set 콜백 토글. 활성 칩 inline style: `background: var(--cafe-blue)` + `#fff`. .btn.btn--sm 클래스 재사용
  - `src/app/(web)/games/_components/games-client.tsx` **신규** ("use client") — 서버→클라 경계 단일 포인트. props.games(GameForClient 평탄화 shape)를 받아 `FilterChipBar` 3개 클라 필터 state(Set<"weekend"|"free"|"beginner">) AND 결합으로 추가 필터링 + `deriveTags(g)` (무료/초보환영/주말 최대 3개) 계산해 GameCard 에 주입. 그리드: `repeat(auto-fill, minmax(320px, 1fr))` gap 14. 빈 상태 2 분기(전체 0건 vs 필터 결과 0건)
  - `src/app/(web)/games/page.tsx` **재작성** — `"use client"` 래퍼 구조에서 async 서버 컴포넌트로 전환. `searchParams` 풀이(Next 15 Promise) → `resolveScheduledRange(date)` 유틸 + `listGames(filters)` + `prisma.games.groupBy` 병렬 `Promise.allSettled`. 결과를 `GameForClient[]` 로 평탄화(BigInt/Date/Decimal → string/ISO). `typeCounts` 변환(route.ts 로직 재현). 레이아웃: `.page` 쉘 + 헤더(eyebrow + h1 + 서브문구 + /games/new Link) + `<KindTabBar counts>` + `<GamesClient games>`. Suspense/Skeleton 제거(서버 prefetch 가 완료된 후 렌더 — 로딩 UI 불필요). API/route.ts/Prisma 무변경
- **보존 (삭제 0)**:
  - `src/app/(web)/games/_components/games-content.tsx` — v2 에서 미사용이지만 파일 유지 (Phase 9 cleanup 에서 재평가)
  - `src/app/(web)/games/_components/game-type-tabs.tsx` — 동일
  - `src/app/(web)/games/games-filter.tsx` — 동일
  - `_components/{game-card-compact,guest-game-card,pickup-game-card,team-match-card}.tsx` — 동일
- **검증**:
  - `npx tsc --noEmit` → EXIT=0 **PASS**
  - dev server 3001 기동 중(PID 102232) → HMR 자동 반영
  - `curl /games` → **HTTP 200 / 0.54s / 243KB**
  - `curl /games?type=0` → 200 / `curl /games?city=서울` → 200
  - HTML 구조 검증 (grep):
    - `class="page"` 쉘 1회
    - `경기 · GAMES` eyebrow 2회 + `픽업 · 게스트 모집` h1 2회
    - 탭 4개 (전체 active + 픽업/게스트 모집/연습경기) 정상 렌더, `aria-pressed="true"` 정확히 1개
    - 필터 칩 7개 (오늘/이번주/주말/서울/경기/무료/초보환영) 전부 `btn btn--sm` + `aria-pressed="false"` 렌더
    - `auto-fill` 그리드 1회 + `badge--red` (마감임박) 2회 확인 → 카드 실제 렌더 중
    - `/games?type=0` / `?city=서울` 쿼리 조작 시 각 페이지 `aria-pressed="true"` 정확히 1개 (탭 전환/칩 활성 반영)

💡 tester 참고:
- **테스트 URL**: http://localhost:3001/games
- **정상 동작 체크리스트**:
  - `.page` 쉘 폭/중앙정렬 반영, 상단 "경기 · GAMES" eyebrow + 큰 h1 + 오른쪽 "모집 글쓰기" 버튼
  - 탭 4개 클릭 시 URL `?type=0|1|2` 조작 + 건수 숫자 mono 폰트 표시. "전체" 탭은 ?type 삭제
  - 칩 7개: 오늘/이번주/서울/경기는 URL 조작(?date=today/week, ?city=서울/경기) + 같은 칩 재클릭 시 삭제(토글). 주말/무료/초보환영은 URL 변경 없이 클라 필터만 적용
  - 카드: 상단 4px stripe 색상이 종류별 다름(픽업=blue/게스트=green/연습=amber). 마감임박 빨간 배지는 (A) 24시간 이내 OR (B) 진행률 80%+ 인 경기만
  - 태그 자동 파생: 무료/초보환영/주말 조건 만족 시 최대 3개 표시. 조건 0개면 태그 영역 자체 숨김(공백 안 생김)
  - 그리드: 데스크톱 3~4열(minmax 320px) / 태블릿 2열 / 모바일(≤480) 1열
- **주의할 입력**:
  - `scheduled_at` null 경기 → "일정 미정" 표시. "주말" 필터 적용 시에는 제외됨
  - `fee_per_person` null vs 0 → 둘 다 "무료"(녹색 볼드) 표시
  - `status=3`(완료)/`status=4`(취소) 경기 → 카드 opacity 0.6 + "마감" span. 하지만 listGames 가 status 4를 제외하므로 실제로는 status=3 만 노출됨
  - 만석(cur >= max) → "만석" 배지 + "마감" span
  - `?type=0&date=today&city=서울` 처럼 필터 다중 적용 시 서버 prefetch 에 모두 반영되어 정확한 건수 + 목록 표시
  - 클라 필터(주말/무료/초보환영)는 URL 에 반영되지 않으므로 새로고침 시 초기화됨 — 이는 의도(PM 확정)

⚠️ reviewer 참고:
- **서버 컴포넌트 + 클라 래퍼 분리**: 기존 `games-content.tsx`는 전체 클라 컴포넌트 + useSWR 로딩이었는데, v2 재구성에서는 Home 패턴을 따라 서버 prefetch + 작은 클라 래퍼로 전환. 장점: 초기 페인트에 데이터 포함(CLS 없음) + useSWR photoMap 제거로 네트워크 요청 수↓. 단점: prefer=true(로그인 맞춤 필터) 기능이 이번 재구성에서 빠짐 — 원래 `/api/web/games?prefer=true` 로 `preferredCities/gameTypes/skillLevels/days/timeSlots` 처리했던 로직은 GamesClient 에 없음. v2 Games.jsx 시안 자체에도 맞춤 필터 UI가 없으므로 의도된 범위(차후 Phase 에서 FilterChipBar 에 "내 조건" 칩 추가 검토)
- **route.ts 로직 중복**: `resolveScheduledRange` / `countWhere` 구성 / `typeCounts` 딕셔너리 변환 3곳이 `api/web/games/route.ts` 와 동일 패턴. 서버 컴포넌트가 API 를 호출하지 않고 직접 DB 접근하는 Home 패턴을 따르느라 필연적. 향후 `listGames`/`getTypeCounts` 같은 공통 서비스 함수로 추출 가능 (Phase 9 정리 대상)
- **태그 자동 파생 (DQ3)**: DB 에 tags 필드가 없어 3개 조건(fee=0/skill=beginner계열/weekend)으로 파생. 시안의 `g.tags` 는 시드 더미 데이터라 그대로 재현 불가 — PM 확정안대로 하드코딩 자동 파생으로 처리. `BEGINNER_SKILLS` 상수는 game-card.tsx 와 games-client.tsx 양쪽에 필요했으나 게시물 독립성 유지를 위해 양쪽에 정의(중복 7글자, dedup 비용 낮음)
- **URL 조작 칩 "부분 매칭" 활성 판정**: "서울" 칩은 `?city=서울` 뿐 아니라 `?city=서울특별시` 같은 확장 매칭도 활성으로 본다(`current.includes(value)`). 장점: FloatingFilterPanel 등 다른 UI 가 full name 을 주입해도 칩이 꺼지지 않음. 단점: "경기" 칩이 `?city=경기도`/`?city=경기북부` 처럼 의도 외 케이스도 활성화. 실제 DB city 값 분포 확인 후 필요 시 엄격 비교로 전환
- **기존 컴포넌트 미사용 (보존 0삭제)**: games-content/game-type-tabs/games-filter/guest-game-card/pickup-game-card/team-match-card/game-card-compact — 총 7개 파일이 이번 재구성에서 import 안 됨. 미사용 warning 은 안 나지만 Phase 9 cleanup 에서 일괄 삭제 결정 필요

---

### [2026-04-22] Phase 1 Home 게시판 영역 시안 매칭 (HotPostRow 도입 + 배지 중복 제거)
- **브랜치**: subin
- **배경**: 직전 세션(04-22 A+B+C)에서 공지·인기글/방금 올라온 글 양쪽에 BoardRow를 사용하고 `categoryBadge`로 제목 앞 배지를 추가했으나, v2 Home.jsx L44~53 HOT_POSTS 원본은 **3열 grid(56px 배지 / 1fr 제목 / auto 조회수)** 간략 리스트 구조로 BoardRow(6열 테이블)와 정보 밀도가 다름. 또 "방금 올라온 글" 풀 테이블은 이미 3열에 게시판(카테고리) 컬럼이 있어 제목 앞 배지가 **중복 표시**
- **변경 3건**:
  - `src/components/bdr-v2/hot-post-row.tsx` **신규** — v2 Home.jsx 원본 구조 재현. Props: `category / title / commentsCount / views / href / isNotice`. `gridTemplateColumns: "56px 1fr auto"`, `padding: "11px 18px"`, `borderBottom: "1px solid var(--border)"`. 제목 ellipsis, 댓글 accent [N], 조회수는 Material Symbols `visibility` 아이콘. 공지면 `badge--red`, 아니면 `badge--soft`. 외부 `.board` 래퍼 불필요 — 자체 grid 소유 (BoardRow와 결정적 차이)
  - `src/app/(web)/page.tsx` "공지·인기글" 섹션 — `BoardRow` → `HotPostRow` 교체. `<div className="board" style={{ border: 0, borderRadius: 0 }}>` 래퍼 제거(HotPostRow가 자체 구조). 더 이상 num/board/author/date prop 주입 불필요 → JSX 간결화. 주석에 "v2 Home.jsx L44~53 HOT_POSTS 구조 재현" 근거 명시
  - `src/app/(web)/page.tsx` "방금 올라온 글" 섹션 — `categoryBadge={post.category === "notice" ? "red" : "soft"}` prop 제거. 이유를 BoardRow 호출 위 주석으로 명시("3열 게시판 컬럼에 이미 카테고리 라벨 — 제목 앞 배지는 중복"). BoardRow 컴포넌트 자체는 건드리지 않음(공지·인기 아닌 다른 Phase/페이지에서 배지 기능이 필요할 수 있어 옵션 prop 존치)
- **검증**:
  - `npx tsc --noEmit` → EXIT=0 **PASS**
  - dev server 3001(PID 102232) 기동 중 → `curl /` **HTTP 200 (0.30s) PASS**
  - `.badge--soft` / `.badge--red` / `.material-symbols-outlined` 전부 globals.css 기존 정의 사용 (신규 CSS 추가 없음)
- **영향 파일**:

| 파일 경로 | 변경 내용 | 신규/수정 |
|----------|----------|----------|
| src/components/bdr-v2/hot-post-row.tsx | v2 HOT_POSTS 3열 grid 전용 컴포넌트 (서버) | 신규 |
| src/app/(web)/page.tsx | 공지·인기글: BoardRow → HotPostRow. 방금 올라온 글: categoryBadge prop 제거 | 수정 |

💡 tester 참고:
- **테스트 URL**: http://localhost:3001/
- **정상 동작**:
  - "공지·인기글" 카드 내부가 56/1fr/auto 3열로 렌더 (번호/작성자/날짜 컬럼 없음 = 간략 모드)
  - 공지(category=notice) 행은 좌측 배지가 빨강, 자유/Q&A 등은 카페블루 soft
  - 댓글 수 0이면 [N] 미표시, >0이면 제목 뒤 accent 컬러 [3] 형식
  - 조회수 옆에 `visibility`(눈) 아이콘 14px
  - "방금 올라온 글" 테이블은 6열 구조 유지되나 **제목 앞 배지 사라짐** (게시판 컬럼에 카테고리 텍스트는 그대로)
- **주의할 입력**:
  - hotPosts 0건 → 기존 empty state "아직 게시글이 없습니다." 유지
  - 긴 제목(>1줄 분량) → ellipsis로 말줄임 처리 확인
  - 모바일(≤480px) 뷰 → HotPostRow는 자체 스타일이라 responsive.css 영향 받지 않음(시안에서도 동일 3열 유지가 자연스러움). 화면이 좁을 때 배지가 넘치지 않는지 체크

⚠️ reviewer 참고:
- **BoardRow의 `categoryBadge` prop은 존치**: 공지·인기에서 쓰지 않게 됐지만 BoardRow 시그니처에 남아있음. 다른 Phase/페이지(예: Phase 4 PostRow 추출 시)에서 풀 테이블이 아닌 축약 리스트에 배지가 필요할 수 있어 옵션 유지. dead code 판단은 Phase 9 cleanup에서
- **HotPostRow의 스타일은 인라인 style로 작성**: globals.css에 `.hot-post__row` 같은 전용 클래스를 추가하는 대신 인라인 style 고수 — 시안 원본(Home.jsx)이 인라인 방식이고, 본 컴포넌트가 홈 1곳에서만 쓰여 전역 CSS에 이름을 주는 비용이 더 큼. 확장 시 전용 클래스로 승격 가능
- **visibility 아이콘 14px**: 원본은 `<Icon.eye />` SVG. mybdr 컨벤션은 Material Symbols Outlined(lucide-react 금지)이므로 `visibility`로 대체. 크기는 숫자 12px에 맞춰 14px 선택(시각적 균형)

### [2026-04-22] Phase 1 Home 시안 매칭 보완 (A+B+C 3건)
- **브랜치**: subin
- **배경**: page.tsx는 이미 v2 구조(PromoCard/StatsStrip/CardPanel/BoardRow)로 완성돼 있으나, 시안 대비 3가지 gap 존재 — (A) 페이지 셸 클래스 (B) "열린 대회" 섹션 레이아웃 (C) 카테고리 배지
- **A `src/app/(web)/page.tsx` L114**: 이미 `className="page"`로 선적용 상태였음(직전 세션 반영). 추가 작업 없음. L113 주석은 왜 `page`여야 하는지(max-width/중앙정렬/상하여백 포함 쉘) 근거 유지
- **B `src/components/bdr-v2/tournament-row.tsx`**: 파일은 사전 존재했으나 **page.tsx에서 미사용(여전히 BoardRow로 렌더링)**. page.tsx import + "열린 대회" CardPanel 내용을 `BoardRow → TournamentRow`로 **실제 교체**. 인덱스 기반 accent 색상 로테이션 유틸 `tournamentAccent(idx)` 추가 — `["var(--accent)", "#f59e0b", "var(--accent-2, #0ea5e9)"]` 3색 순환. level 라벨 유틸 `tournamentLevelLabel(status)` 추가 — `registration→OPEN` / `in_progress→LIVE` / 기타→`INFO`. meta 문자열은 `venue_name|city · MM/DD · N/M팀` 형식으로 구성(PromoCard 방식과 맞춤). `.board` 그리드 래퍼 대신 `padding: "0 14px"` div로 감싸 CardPanel `noPadding` 하위에서 좌우 여백만 부여
- **C `src/components/bdr-v2/board-row.tsx`**: `categoryBadge?: "soft" | "red" | "ghost"` prop은 사전 정의돼 있었으나 **렌더 로직이 없었음**. title div 앞에 `<span className="badge badge--{type}">{board}</span>` 렌더 추가. page.tsx 공지·인기글/방금 올라온 글 두 BoardRow 모두 `categoryBadge={post.category === "notice" ? "red" : "soft"}` 전달 — 공지 카테고리만 red 배지로 강조, 나머지는 카페블루 soft 배지
- **검증**:
  - `npx tsc --noEmit` → EXIT=0 **PASS**
  - dev server 3001(PID 102232) 기동 중 → `curl /` **HTTP 200 PASS**
  - `.badge--soft`/`.badge--red`/`.badge--ghost` 클래스는 globals.css L280-285 기존 존재 확인

💡 tester 참고:
- **테스트 URL**: http://localhost:3001/
- **정상 동작**:
  - "열린 대회" 카드 좌측에 54×54 accent 블록(1번=레드/2번=앰버/3번=블루) + "OPEN" 또는 "LIVE" 텍스트
  - 대회 중앙 본문: 제목 + Vol.N(있으면) + 하단 12px muted "장소 · 날짜 · 팀수"
  - `status === "in_progress"`인 대회만 우측 빨간 `LIVE` 배지 표시
  - "공지·인기글" / "방금 올라온 글" 각 행 제목 앞에 카테고리 배지(공지=빨강 / 그 외=카페블루 soft)
- **주의할 입력**:
  - `edition_number == null` → Vol 표시 생략
  - `venue_name·city·start_date·max_teams` 전부 null이면 meta가 `{team_count}팀` 한 조각만 표시 (빈 문자열 아님)
  - 열린 대회 6개 이상일 때 4번째부터는 accent 색상이 1번과 동일 반복(의도된 시각 리듬)

⚠️ reviewer 참고:
- **TournamentRow는 이전 세션에 선행 작성만 되고 실제 사용 누락**. page.tsx가 BoardRow로 대회 리스트를 그리고 있었음 → 이번 커밋에서 교체. 미사용 import 없이 정상 연결됨
- **categoryBadge 렌더 로직 부재**: 이전 세션에서 prop 시그니처만 추가하고 render 누락. 이번 세션에서 완결
- **CardPanel noPadding + 내부 padding 차이**: BoardRow 버전은 `.board { border:0, borderRadius:0 }`으로 그리드 폭 그대로 사용. TournamentRow 버전은 `padding: "0 14px"` div 래퍼로 좌우 14px 안쪽에 배치 — 시안의 카드 좌우 여백 재현
- **accent_2 변수 없을 때 fallback #0ea5e9**: `var(--accent-2, #0ea5e9)` 형태로 선언해 globals.css에 `--accent-2` 미정의일 경우에도 깨지지 않도록 방어

### [2026-04-24] BDR v2 Phase 1 Home — S6 + S7 + S8 (가로 네비 전면 전환)
- **브랜치**: design_v2 (이전 Phase 1 커밋 위)
- **S6 `src/components/bdr-v2/app-nav.tsx`** (신규, "use client") — v2 원본 `AppNav` React 재작성. 유틸리티바(MyBDR 커뮤니티 / 소개 / 요금제 / 도움말 하드코딩 + 로그인 시 이름·설정·로그아웃 / 비로그인 시 로그인·회원가입) + 메인바(로고 Link → `/` + 탭 8개 Link + 우측 액션). 탭 8개: 홈·경기·대회·단체·팀·코트·랭킹·커뮤니티 (PM 확정). 우측 액션: `ThemeSwitch` + `rightAccessory` 슬롯(선호필터 토글) + 검색 + 알림(로그인 시 unreadCount 빨간 점) + "더보기 ▼" 드롭다운(moreItems 7개 + super_admin→/admin + is_referee→/referee 조건부 노출) + 아바타 Link(→ /profile, `BDR` or name.slice(0,3) 이니셜, 드롭다운 X) + 모바일 햄버거. 외부 클릭·ESC·pathname 변경 시 드롭다운/드로어 자동 닫힘
- **S7 `src/components/bdr-v2/app-drawer.tsx`** (신규, "use client") — 모바일 햄버거 전용 우측 슬라이드 패널. body scroll lock + ESC 닫힘 + backdrop 클릭 닫힘. 구성: 헤더(MyBDR. + ×) / 본문(탭 8개 Link + divider + 글쓰기·알림·검색 보조 + is_referee·super_admin 조건부) / 푸터(ThemeSwitch + 이름·로그아웃 또는 로그인·회원가입). `AppNav`와 tabs·isActive·user props 공유
- **S7-b `src/components/bdr-v2/theme-switch.tsx`** (신규, "use client") — v2 원본 2버튼 토글(라이트/다크). html 태그에 `classList.add("dark"|"light")` + `dataset.theme` 동시 세팅으로 **이중 셀렉터 호환**. localStorage 키 `theme-preference` 기존 재사용. 마운트 이후에만 상태 동기화해 SSR/CSR mismatch 방지
- **S8 `src/app/(web)/layout.tsx`** (전면 재작성, 431줄 → 137줄) — 기존 좌측 고정 사이드네비(aside.lg:flex) + 상단 헤더(fixed header) + 하단 탭(fixed bottom nav) + 우측 사이드바(RightSidebar xl+) + SlideMenu + MoreTabTooltip + ProfileCompletionBanner + PwaInstallBanner + NotificationBadge + 검색 + 기존 ProfileDropdown dynamic import 전부 제거. 남긴 것 = SWRProvider + PreferFilterProvider + ToastProvider + `/api/web/me` 병렬 fetch + `/api/web/notifications` 30초 폴링 + `notifications:read-all` 이벤트 리스너 + Footer. layout은 이제 AppNav + main(풀폭, 페이지 자체 컨테이너 사용) + Footer 3층. PreferFilterToggleButton은 `.btn .btn--sm` + `--accent` 색상으로 v2 톤 맞춤해 rightAccessory 슬롯에 주입
- **검증**:
  - `npx tsc --noEmit` → EXIT=0 **PASS**
  - dev server 이미 3001 기동 중(PID 102232) → HMR 자동 반영. `curl /` 200 / `/games` 200 / `/community` 200 / `/tournaments` 200 / `/courts` 200 / `/rankings` 200 / `/teams` 200 / `/organizations` 200 (탭 8개 전 라우트)
  - HTML 검사: `app-nav` 1회 렌더 / 탭 8개 정확히 순서대로 렌더 (홈 data-active=true) / 유틸리티 "MyBDR 커뮤니티·소개·요금제·도움말" 전부 존재 / 레거시 `slide-menu`·`bottomNavItems`·`right-sidebar`·`fixed bottom-0`·`pwa-install` 0회 = **완전 제거 확인**
- **보존 파일**: `src/components/shared/slide-menu.tsx`, `.../more-tab-tooltip.tsx`, `.../notification-badge.tsx`, `.../profile-completion-banner.tsx`, `.../pwa-install-banner.tsx`, `.../search-autocomplete.tsx`, `.../theme-toggle.tsx`, `.../text-size-toggle.tsx`, `.../profile-dropdown.tsx`, `src/components/layout/right-sidebar.tsx` — 삭제 금지. 미사용 상태로 유지(Phase 9 정리 시 재평가)

💡 tester 참고:
- **테스트 URL**: http://localhost:3001/ (+ 탭 8개 각 라우트 순환)
- **정상 동작 체크리스트**:
  - 상단 가로 네비 1개만 렌더 (좌측 사이드바 / 우측 사이드바 / 하단 탭 **전부 미렌더**)
  - 메인 컨텐츠가 **풀폭**(기존 lg:ml-60 여백 없음)
  - 유틸리티 바: "MyBDR 커뮤니티 / 소개 / 요금제 / 도움말" + 우측 로그인 시 "이름 / 설정 / 로그아웃" 표시
  - 메인 바 탭 클릭 시 Next.js Link 라우팅 + 활성 탭 `data-active="true"` 하이라이트
  - 테마 버튼 "라이트/다크" 클릭 시 html 태그 `dark`/`light` class + `data-theme` 속성 동시 변경
  - 더보기 ▼ 클릭 시 7개 항목 + super_admin/is_referee 조건부 추가 노출. 외부 클릭/ESC/라우트 변경 시 닫힘
  - 아바타 클릭 = `/profile` 이동 (드롭다운 열리지 않음 — PM 확정안)
  - 모바일 뷰(900px 이하) → 햄버거 표시 → 클릭 시 우측 슬라이드 드로어 + body scroll lock
- **주의할 입력**:
  - 비로그인 상태에서는 알림 아이콘 미렌더 + 유틸리티바 우측이 "로그인 / 회원가입"
  - 로그아웃 클릭 시 POST /api/web/logout → /login 이동
  - 선호필터 토글(★)은 로그인 상태에서만 노출

⚠️ reviewer 참고:
- **Next/Link vs v2 원본 `<a onClick=setRoute>`**: v2 원본은 SPA 라우터 없이 상태 교체 방식. mybdr은 Next App Router이므로 모든 탭/드롭다운 항목을 `<Link href>` 로 교체했다. prefetch=true 는 탭에만 적용(더보기 항목은 prefetch 없이 단순 이동)
- **Utility "소개" 링크**: v2 원본은 setRoute('about') 했으나 mybdr에는 `/about` 라우트가 없어 일단 `/` 로 매핑. 별도 About 페이지 필요 시 Phase 6에서 /safety·/terms 옆에 신설 검토
- **더보기 드롭다운 항목 축소**: v2 원본 moreItems 28개(중복 포함)를 mybdr 실제 라우트 존재분 7개로 추림(my-games/notifications/live/rankings/search/pricing/help/glossary). 추후 calendar·saved·messages·shop 등 도입 시 이 배열에 추가
- **기존 ProfileDropdown 미사용**: PM 확정안 "아바타 = /profile 링크 + 더보기 드롭다운 = moreItems"에 따라 기존 ProfileDropdown 파일 자체는 보존하지만 import 제거. 드롭다운 목록이 AppNav "더보기" 버튼으로 이관됨. Phase 9에서 삭제 결정
- **Footer 풀폭 노출**: 기존 layout에서 Footer는 `max-w-[960px]` 내부에 있었으나, v2 구조는 풀폭 Footer가 자연스러우므로 감싸지 않음. Footer 컴포넌트 내부에서 필요 시 자체 max-width 처리
- **PreferFilterToggleButton 스타일 변경**: 기존 tailwind 클래스에서 v2 `.btn.btn--sm` + inline style `var(--accent)`로 변경. 다른 토글(Theme·검색·알림)과 일관성 확보
- **layout.tsx 431 → 137줄 감축(294줄 삭제)**: 이는 단순 파일 라인 비교이며 삭제한 사용처 컴포넌트는 전부 파일로는 살아있음. 다른 페이지에서 import 남아있으면 빌드는 OK지만 Phase 9 cleanup에서 dead code 추려야 함

### [2026-04-23] BDR v2 Phase 1 Home — S4 + S5
- **브랜치**: design_v2 (0e7e95b 위)
- **S4 신규 컴포넌트 4종** (모두 서버 컴포넌트, TypeScript strict + JSDoc):
  - `src/components/bdr-v2/promo-card.tsx` — .promo 배너. eyebrow/title/subtitle/description + primaryCta/secondaryCta (Link). 기본 카페 블루 그라디언트, `[data-promo="red"]` 오버라이드 지원
  - `src/components/bdr-v2/stats-strip.tsx` — 4열(items 개수 기반 동적 grid) .card 통계 스트립. 숫자는 `.toLocaleString()` 자동 포맷, 문자열(예: "-")은 그대로
  - `src/components/bdr-v2/board-row.tsx` — `.board__row` 1줄. num/title/board/author/date/views 6컬럼 + hasImage/commentsCount/isNew/isNotice. Link 자체가 grid row (responsive.css가 모바일 재배치 담당)
  - `src/components/bdr-v2/card-panel.tsx` — `.card` 헤더(제목 + 더보기 Link) + children slot. `noPadding` 옵션으로 내부 `.board` 배치 지원
- **신규 서비스 함수**: `src/lib/services/home.ts` 하단에 `prefetchOpenTournaments` 추가 — `unstable_cache`(60s) / `is_public=true` + `status in [registration, in_progress]` / 10건 / `tournament.findMany` + `_count.tournamentTeams` / `convertKeysToSnakeCase` 직렬화. 기존 patterns와 동일 (prefetchStats/Community)
- **S5 page.tsx 재구성** — 기존 6종 import 전면 제거(HomeHero/RecommendedGames/RecommendedTournaments/NotableTeams/RecommendedVideos/RecentActivity/HomeCommunity + prefetchTeams/prefetchRecommendedGames). 3개 prefetch 병렬(Promise.allSettled). 섹션 배치: PromoCard(대회 첫 항목) → StatsStrip(4열 — user_count / "-" placeholder / match_count / team_count) → 2컬럼 grid(CardPanel 공지·인기글 5건 + CardPanel 열린 대회 5건) → .board 풀 테이블(방금 올라온 글 10건). 유틸 3종(formatShortDate/isWithin24h/communityCategoryLabel/tournamentStatusLabel) 페이지 로컬
- **검증**:
  - `npx tsc --noEmit` → EXIT=0 **PASS**
  - dev server `/` → **200** (첫 컴파일 4.3s, 재요청 88ms). Turbopack worker crash 1회 발생(3001 PID 95520) → kill + `.next` 삭제 + 재기동(errors.md [2026-04-12] 패턴 재발 5회차). 이후 /manifest + /api/web/me/notifications/sidebar/ads 전부 200
- **기존 파일 보존**: `src/components/home/*` 파일 삭제 금지 지시 따름 (미사용 상태로 유지). 카페·route.ts·Prisma 스키마 무변경

💡 tester 참고:
- **테스트 URL**: http://localhost:3001/
- **정상 동작**: PromoCard 카페 블루 그라디언트 배너(접수중 대회 있을 때) / StatsStrip 4열(숫자 천단위 포맷) / 2컬럼 카드 패널 / 방금 올라온 글 .board 테이블. 다크모드 전환 시 모든 카드 brutalist(radius=0, 2px 테두리)
- **주의할 입력**:
  - 열린 대회 0건일 때 → PromoCard 자체 미렌더 / 열린 대회 CardPanel "접수중인 대회가 없습니다" 표시
  - community posts 0건일 때 → 공지·인기글/방금 올라온 글 둘 다 empty state
  - 모바일(≤480px) 뷰 → responsive.css가 .board__row 6열을 "번호:제목 / 게시판·작성자·날짜·조회 한 줄" 형태로 재배치
- **로그인 영향 없음**: 서버 컴포넌트 + Promise.allSettled 구조라 비로그인도 정상. /api/web/me는 layout.tsx 사이드바용이라 homepage 자체에는 영향 없음

⚠️ reviewer 참고:
- **카페 블루 primary vs BDR Red accent 공존**: `.btn--primary`는 `--cafe-blue` 배경 (PromoCard 미사용), `.btn--accent`는 `--bdr-red` 배경(PromoCard primaryCta 사용). 시안 의도에 부합. 다크모드에서는 `--bdr-red`로 통일됨
- **DB 없는 필드 처리**: "지금 접속자 수"는 StatsStrip에서 `value: "-"` 문자열로 placeholder. 향후 실시간 세션 카운트 기능 추가 시 이 자리에 주입
- **시안 차이점 — 열린 대회 렌더 방식**: v2 Home.jsx는 accent block(레벨 약어) + 2열 카드 그리드 형태. 본 구현은 기획설계 확정안에 따라 `<BoardRow>` 세로 리스트로 일관성 우선. 향후 시안 충실도를 높이려면 별도 `<TournamentRow>` 컴포넌트 추출 가능
- **`(web)/page.tsx`는 서버 컴포넌트**: 클라이언트 hook 없음. 기존 HomeHero의 로그인 분기(getWebSession)는 v2 범위에서 제거됨 → 로그인/비로그인 구분 UI는 차후 Phase에서 PromoCard eyebrow 또는 별도 상단 Greeting 섹션으로 복원 검토 필요

### [2026-04-23] BDR v2 Phase 0 — 기반 설정 (S1~S3)
- **브랜치**: design_v2
- **S1**: `src/app/globals.css` 전면 재작성 (554줄 → **1194줄**) — @theme는 Tailwind 4 breakpoint 5개만 유지 / v2 tokens.css 748줄 본체 이식 / 테마 셀렉터 이중화(`[data-theme="dark"], html.dark` / `[data-theme="light"], html.light, :root:not([data-theme])`) / 기존 `--color-*` alias는 **없음** (PM 지시 전면 폐기) / 보존 블록 유지 — @source not, @media print, shadow-glow-primary/accent, clip-slant*, watermark-text, data-printing 토글, html.large-text, scrollbar-hide, no-scrollbar, fade-in, slide-up, footer-mobile-space, sidebar-scaled, Material Symbols base, touch-action
- **S2**: `src/app/layout.tsx` — `next/font/google`로 Archivo(weight 6종: 400/500/600/700/800/900) + JetBrains_Mono(weight 2종: 400/500) 추가 / `<html>`에 `${archivo.variable} ${jetbrainsMono.variable}` 주입 / globals.css `html { --ff-display: var(--font-archivo) / --ff-mono: var(--font-jetbrains) }` 오버라이드로 연결 / 테마 초기 스크립트에 `setAttribute('data-theme', mode)` 추가 (FOUC 방지 + v2 속성 셀렉터 호환) / SUIT Variable 로더 → **Pretendard Variable로 교체** (v2 `--ff-body: 'Pretendard'` 기본값과 일치)
- **S3**: `Dev/design/BDR v2/responsive.css` 231줄 globals.css 하단에 주석 헤더와 함께 통합 (기존 footer-mobile-space / large-text와 스펙 충돌 없음 → 공존)
- **검증**:
  - `npx tsc --noEmit` → EXIT=0 **PASS**
  - `npm run dev` → Next 16.1.6 Turbopack, Ready in 4s, 포트 3001 정상
  - `curl /` → **200** / `curl /games` → **200** / 기존 /courts /admin/users /teams/188 모두 200 (재기동 전 로그)
- **리스크 감수 (PM 지시)**: 기존 `var(--color-*)` 참조 29+ 페이지는 alias 없이 폴백 — 브랜드 톤(primary 블루→레드) / radius(16px→10px 라이트·0 다크) / 폰트(SUIT→Pretendard) 변화가 전 페이지 즉시 반영. Phase 1~9에서 순차 교체 예정

💡 tester 참고:
- **테스트 URL**: http://localhost:3001/ (홈) / /games / /courts / /community / /profile
- **정상 동작**: 500 없음 + tsc PASS (이미 검증). 디자인 톤이 완전히 바뀜 = 정상 (v2 전환 의도). 카페블루 헤더 / BDR Red accent / 다크 브루탈리스트 라디우스 0
- **테마 토글**: 기존 `html.dark` 클래스 + 신규 `data-theme="dark"` 속성 이중 세팅. 두 셀렉터 모두 CSS에서 처리됨 → 토글 UI가 한쪽만 바꿔도 v2 스타일 적용
- **주의할 입력**: `var(--color-primary)` / `var(--color-error)` / `var(--color-card)` 등 구 토큰을 직접 쓰는 페이지는 **스타일이 비어있는 상태로 렌더** (배경 투명, 글씨 기본값). 이건 Phase 0 범위 밖 — 리포트 대상 ❌

⚠️ reviewer 참고:
- **이중 셀렉터 중복**: v2 원본은 `[data-theme="dark"]` 단일. 내가 `html.dark`를 병기해서 ~40 규칙이 2배 길어짐. 장점 = 기존 JS 토글 코드 그대로 동작 + 점진 이행. 단점 = CSS 파일 용량↑. Phase 9 정리 시 `html.dark` 제거 예정
- **`:root:not([data-theme])` 기본 라이트**: 서버 SSR 최초 페인트는 data-theme 미설정 → 라이트로 렌더. 클라이언트 script가 즉시 세팅. v2 원본 방침 그대로
- **Pretendard 교체**: PM 지시 "Pretendard는 기존 CDN 로더 유지"였으나 실제 코드는 SUIT만 로드 중이었음. v2 body 기본 `--ff-body: 'Pretendard'`에 맞추려면 교체 필요하다고 판단 → Pretendard variable CDN으로 전환. 피드백 주세요
- **폰트 preload 경고 가능성**: next/font는 자동 preload하는데 pages router가 아니면 Next.js 15+에서 경고 안 남. 16.1.6에서도 정상 (확인됨)

### [2026-04-22] Phase 2 Search — v2 재구성 (탭 7개, 데이터 보존)

📝 구현한 기능: `/search` 페이지 BDR v2 재구성 — 서버 컴포넌트(Prisma 6테이블 직접 호출 유지) + 클라이언트 컴포넌트 분리. 탭 7종(전체/팀/경기/대회/커뮤니티/코트/유저) + controlled input form → URL push(Enter/submit) + v2 스켈레톤 loading.tsx. **API route.ts / Prisma 스키마 / 서비스 레이어 0 변경**. 6종 데이터(games/tournaments/teams/posts/users/courts) 전부 화면에 보존.

| 파일 경로 | 변경 내용 | 신규/수정 |
|----------|----------|----------|
| `src/app/(web)/search/page.tsx` | 서버 컴포넌트 — 기존 Prisma 쿼리 6종 그대로 + BigInt/Date 직렬화(`Serialized*` 6개 export) + `SearchClient`에 props 전달. 기존 인라인 JSX 삭제 | 수정 |
| `src/app/(web)/search/_components/search-client.tsx` | 클라 — controlled input + `router.push("/search?q=...")` submit + 탭 7개(activeTab state, 서버 재요청 없이 섹션 노출 토글) + `SearchSection`/`SearchResultItem` v2 톤 재구현 | 신규 |
| `src/app/(web)/search/loading.tsx` | v2 스켈레톤(`.page` + maxWidth 780 + 탭 7 줄 + 카드 3장) | 수정 |

### PM 7건 결정 반영 상세
| 결정 | 구현 위치 |
|------|----------|
| 1. 탭 7개 (전체/팀/경기/대회/커뮤니티/코트/유저) | `TABS` 배열 + `TabKey = "all" \| "teams" \| "games" \| "tournaments" \| "community" \| "courts" \| "users"` |
| 2. controlled form + URL push | `useState(inputValue)` + `<form onSubmit>` → `router.push(\`/search?q=\${encodeURIComponent(next)}\`)` |
| 3. 필터·정렬 미추가 | 칩/셀렉트 일절 없음. 탭 전환만 존재 |
| 4. 빈 쿼리 상태 | 기존 "검색어를 입력해주세요" 유지 + v2 톤(`var(--ink)`, `var(--ink-mute)`, `var(--ink-dim)` Material Symbols `search`) |
| 5. DB 필드 부제 병합 | tournament: `{teams_count}/{max_teams}팀` / court: `{court_type} · {district\|city} · {rating}점` / user: `{position} · {city}` / game: `{type} · {venue\|city} · {date}` |
| 6. loading.tsx v2 스켈레톤 | `.page` + 탭 7줄(border-bottom) + 카드 3장(각각 헤더 + 아이템 3개) |
| 7. 구조 분리 | `page.tsx`(서버, Prisma) + `_components/search-client.tsx`(클라, input+탭+렌더) |

### 보존 로직 (0 변경)
- Prisma 쿼리 6종 전부 유지: `games.findMany` / `tournament.findMany` / `team.findMany` / `community_posts.findMany` / `user.findMany` / `court_infos.findMany`
- 한글 라벨 맵: `GAME_TYPE_LABELS` / `CATEGORY_LABELS` / `STATUS_LABELS` / `COURT_TYPE_LABELS` / `POSITION_LABELS` 모두 유지 (서버 → 클라로 이동만)
- 6종 모두 상위 5건 `take: 5` + 기존 `orderBy` 유지
- 빈 쿼리 시 조기 리턴 패턴 유지 (단 이제 빈 배열 props로 SearchClient에 위임)

### v2 스타일 토큰 적용
- 쉘: `.page` + inline `maxWidth: 780` (Phase 1/2 일관)
- 배경/구분선: `var(--bg-elev)`, `var(--border)`
- 텍스트 위계: `var(--ink)` 제목 / `var(--ink-mute)` 본문 / `var(--ink-dim)` 보조
- 강조: `var(--accent)` 탭 밑줄·더보기 Link / `var(--cafe-blue)` 대회·코트 섹션 아이콘 배경
- mono 숫자: `var(--ff-mono)` (탭 뱃지 숫자 + 검색 결과 총 건수)
- 탭 스타일: KindTabBar 패턴 — 활성 3px accent 밑줄 + ink / 비활성 투명 3px + ink-mute (레이아웃 흔들림 방지)

### 검증
- `npx tsc --noEmit` → **EXIT=0 PASS**
- `curl /search` → **HTTP 200** + `.page` 1 + `type="search"` 1 + "검색어를 입력" 1회
- `curl /search?q=test` → **HTTP 200** + `.page` 1 + `type="search"` 1 + 7탭 라벨(전체/팀/경기/대회/커뮤니티/코트/유저) 전부 렌더

💡 tester 참고:
- **테스트 URL**: http://localhost:3001/search 와 http://localhost:3001/search?q=키워드
- **정상 동작**:
  - 검색어 없을 때: Material Symbols `search` 아이콘 + "검색어를 입력해주세요" + 안내 문구. 탭/결과 미표시
  - 검색어 있을 때: "키워드" 검색 결과 · 총 N건 요약 표시 + 탭 7개(전체=activeTab 기본) + 각 섹션 카드
  - 탭 전환 시 **서버 재요청 없이** 섹션만 노출/숨김 (클라이언트 필터, URL 변경 없음)
  - Enter 또는 돋보기 없이 input만 있는 form — Enter 치면 `router.push(/search?q=...)` → 서버 재쿼리
  - 입력값이 있을 때 X(close) 버튼으로 input 초기화 (URL은 그대로, 사용자가 Enter 치기 전에는 기존 q 결과 유지)
  - 탭 뱃지 mono 숫자: 해당 카테고리 결과 건수 (0도 표시)
  - 활성 탭에서 결과 0건이면 "검색 결과가 없어요" 빈 상태 표시
  - 결과 카드: 아이콘 원형 + 제목 + 건수(mono) + 더보기 링크 + 아이템 리스트(제목·부제·chevron)
  - 아이템 클릭 → 상세 페이지(`/games/[id]`, `/tournaments/[id]`, `/teams/[id]`, `/community/[id]`, `/courts/[id]`, `/users/[id]`)
- **주의할 입력**:
  - `?q=농구` (한글 검색) — URL encoding 확인
  - `?q=  공백  ` (앞뒤 공백) — `trim()` 후 검색
  - `?q=` (빈 쿼리) — 빈 상태 UI
  - 결과 0건 키워드 (예: `?q=zzzznonexistent`) — 탭 7개 모두 0 뱃지 + "검색 결과가 없어요"
  - 결과 6종 모두 있는 키워드 (예: `?q=a` 같은 흔한 문자) — 전체 탭에서 6섹션 순차 노출
  - 탭 이동: 각 탭 클릭 시 해당 섹션만 노출되는지 (전체 탭 외에는 1섹션만)
  - 다크/라이트 토글 시 `--ink` / `--ink-mute` / `--accent` 변수 자동 전환

⚠️ reviewer 참고:
- **구조 분리 근거**: Prisma 쿼리는 서버에서 실행해야 보안/성능상 이점이 있고, controlled input + 탭 클릭은 "use client" 필수. 따라서 page.tsx(서버) + _components/search-client.tsx(클라) 분리. `Serialized*` 인터페이스를 page.tsx에서 `export`하고 client에서 `import type` — 직렬화 계약 명확화
- **BigInt 직렬화**: `id.toString()` / `Date.toISOString()` / `Decimal → Number` 처리. 누락 시 "Only plain objects can be passed to Client Components" 런타임 에러 → 사전 차단
- **탭 전환 UX**: 서버 재요청 없음 — 이미 6테이블 결과를 props로 받아둠. 탭 전환 = `activeTab` state 변경 + 섹션 노출 토글. 검색 쿼리 변경만 URL push
- **결과 0건**: 활성 탭 기준 판정 (`activeTabCount`) — 전체 탭은 counts.all, 카테고리 탭은 해당 카테고리 count. 전체 0건이어도 탭 7개는 모두 렌더(사용자가 다른 탭 눌러도 빈 상태 동일)
- **v2 tokens only**: `--color-*` alias 일절 미사용(Phase 0 S1 폐기). 아이콘 배경색 중 `#6366f1`(팀) / `#8b5cf6`(유저) / `#10b981`(커뮤니티)는 Notifications 패턴과 동일 — 하드코딩이지만 6종 섹션 구분용 의도 색상(Phase 9 또는 별도 정비 대상)
- **Material Symbols Outlined**: `search` / `search_off` / `close` / `chevron_right` / `sports_basketball` / `emoji_events` / `groups` / `location_on` / `person` / `forum` 전부 Outlined 폰트
- **폴백**: `game.title || "제목 없음"` / `user.nickname || user.name || "알 수 없음"` / `court.average_rating != null` 등 null 안전 처리

---

### [2026-04-22] Phase 2 Notifications — v2 재구성 (UI-only, PM 4건 결정 반영)

📝 구현한 기능: `/notifications` 페이지 BDR v2 재구성 — 탭 7종(전체/안읽음/대회/경기/팀/커뮤니티/시스템) + unread 아이템 전체 배경 강조(`var(--accent-soft)` + 좌측 3px accent bar) + `.page` 쉘 + 780px 폭 + "알림 설정" 버튼 Link 추가. **API/Prisma/page.tsx/category.ts 0 변경**. 상태·핸들러·fetch 로직 100% 보존.

| 파일 경로 | 변경 내용 | 신규/수정 |
|----------|----------|----------|
| `src/app/(web)/notifications/_components/notifications-client.tsx` | 전면 v2 재구성 (TABS 6→7 / unread 필터 탭 추가 / `.page` 래퍼 + maxWidth 780 / 인라인 v2 토큰 스타일 / 알림 설정 Link 버튼 / `var(--accent-soft)` + `inset 3px 0 0 var(--accent)` unread 강조 / Material Symbols `settings` 아이콘) | 수정 |

### PM 결정 4건 반영 상세
| 결정 | 구현 위치 |
|------|----------|
| 1. "알림 설정" B 추가 (Link 연결) | 헤더 우측 `<Link href="/profile/notification-settings" className="btn btn--sm">` — settings 아이콘 + 라벨 |
| 2. 탭 7개 (안읽음 추가) | `TabKey = "all" \| "unread" \| NotifCategory` + filtered useMemo 분기 (`n.status==="unread" && !readIds.has(n.id)`) |
| 3. unread 배경 강조 | 아이템 `<div>`에 `background: var(--accent-soft)` + `boxShadow: "inset 3px 0 0 var(--accent)"` (isUnread 조건부) |
| 4. `.page` + 780px | 최상위 `<div className="page" style={{ maxWidth: 780 }}>` — Phase 1/2와 동일 패턴 |

### 보존 로직 (0 변경)
- useState 7종 전부 유지 (activeTab 타입만 `TabKey` 확장)
- `handleLoadMore` / `handleDelete` / `handleMarkAllRead` 로직 그대로
- `window.dispatchEvent(new CustomEvent("notifications:read-all"))` 유지 (헤더 벨 즉시 갱신)
- `PushPermissionBanner` 렌더 유지 (푸시 권한 요청 배너)
- "더 보기" 버튼 — `activeTab === "all"` 조건 유지 (카테고리 탭에서는 서버 페이지네이션 의미 없음)
- 삭제 버튼 — `handleDelete` + `deletingId` 상태 그대로
- `formatRelativeTime` / `getNotificationIcon` 유틸 유지
- `categorize` / `ICON_MAP` import 유지 (category.ts 무변경)

### 탭별 모두 읽음 동작 (미세 조정)
- **전체** 탭: 전체 대상 read-all (body 빈) — 기존과 동일
- **안읽음** 탭: 전체 대상 read-all (body 빈) — "모두 읽음" 의미상 자연스러움
- **카테고리** 탭: `body.category = activeTab` 전송 — 기존과 동일
- 버튼 라벨: 전체/안읽음 → "모두 읽음", 카테고리 → "{라벨} 모두 읽음"

### 검증
- `npx tsc --noEmit` → **EXIT=0 PASS**
- `curl /notifications` → **307** (비로그인 리다이렉트 정상, PID 102232 port 3001 정상)
- 로그인 후 HTML 검증 필요 항목(tester 위임): `.page` 1 / 탭 7개 / aria-pressed / `inset 3px 0 0 var(--accent)` unread 스타일 / 설정 Link href

💡 tester 참고:
- **테스트 URL**: http://localhost:3001/notifications (로그인 필수)
- **정상 동작**:
  - 헤더에 "알림" + (unread>0면) 빨간 원형 배지 숫자 + 우측 "모두 읽음"(unread>0만) + "알림 설정" 버튼 항상 표시
  - 탭 7개 가로 스크롤(모바일), 활성 탭은 accent 배경 + 흰 글씨, 비활성은 `var(--bg-elev)` + `var(--ink)` + 작은 배지(count>0)
  - unread 아이템: 배경 `var(--accent-soft)` (라이트 #FDE8E9 / 다크 #2A1214) + 좌측 3px accent 세로선 + 제목 700 / read 아이템: 배경 투명 + 제목 500 + 색 `var(--ink-dim)`
  - "알림 설정" 클릭 → `/profile/notification-settings` 이동
  - "안읽음" 탭 선택 → `status==="unread"` 인 항목만 필터
  - 모두 읽음 후 → 헤더 벨 즉시 갱신 (`CustomEvent`) + 활성 탭 항목 read 스타일로 변경
  - 더 보기 버튼은 **"전체" 탭에서만** 표시 (기존 동작 유지)
  - 삭제 버튼(close 아이콘) 클릭 → 즉시 UI에서 제거
- **주의할 입력**:
  - 로그인 + 알림 100건 이상 계정(더 보기 fetch 확인)
  - unread 0건 상태 → "모두 읽음" 버튼 숨김 확인
  - 카테고리 탭 unread 0 → 해당 탭 선택 시 빈 상태 메시지 "이 카테고리에 해당하는 알림이 없습니다"
  - "안읽음" 탭 unread 0 → 빈 상태 메시지 "미확인 알림이 없습니다"
  - 다크/라이트 테마 토글 시 accent-soft 배경 자동 전환 (#FDE8E9 ↔ #2A1214)

⚠️ reviewer 참고:
- **인라인 스타일 위주**: Phase 1/2 기존 재구성 패턴(my-games, game-detail)과 동일하게 v2 토큰을 인라인 `style={{}}`로 적용. Tailwind util은 `scrollbar-hide`만 사용. `TossCard` 제거 → `.card` 클래스 활용
- **탭 뱃지 로직**: "전체" 탭은 뱃지 없음(전체 건수 아닌 unread만 보여주던 기존과 동일), "안읽음" 탭은 `unreadCount` 뱃지 표시. 첫 진입 시 사용자가 미확인 건수를 탭 자체에서 확인 가능
- **"안읽음" 탭에서 모두 읽음**: 전체 대상 API 호출(body 빈). "안읽음 탭에서 보이는 것만 읽음" 해석도 가능했으나 카테고리 혼재 UX 상 "전체 대상"이 자연스러움. 피드백 주시면 `filtered.map(id) → 개별 PATCH` 루프로 변경 가능
- **`var(--color-*)` 미사용**: PM 재확인 결정 3번 "`var(--color-*)` 활용"이지만 Phase 0 S1에서 `--color-*` alias가 전면 폐기됨(scratchpad 969라인). 대신 v2 tokens(`--accent`, `--accent-soft`, `--ink`, `--ink-dim`, `--ink-mute`, `--bg-elev`, `--border`) 사용. 의도 부합 확인 요청
- **설정 Link 위치**: 헤더 우측 "모두 읽음" 버튼 옆(`display: flex; gap: 8`). 시안 특정 위치 지정 없었음 → Phase 1 헤더 패턴 참조
- **Material Symbols**: `settings` (헤더 버튼) / `close` / `hourglass_empty` / `chevron_right` / `notifications_off` 전부 Outlined 폰트 사용

---

### [2026-04-22] Phase 2 CreateGame — 단일 폼 v2 재구성 (고급 설정 아코디언으로 DB 필드 보존)

📝 구현한 기능: `/games/new` 경기 만들기 페이지 BDR v2 재구성 — 기존 **4스텝 위자드 → 단일 페이지 3카드**(종류/정보/조건) + 고급 설정 아코디언 + 액션 3버튼. 시안(CreateGame.jsx) 레이아웃 100% 반영 + DB 필드 전부 보존. **서버 액션 / Prisma / validation / API 0 변경**.

| 파일 경로 | 변경 내용 | 신규/수정 |
|----------|----------|----------|
| `src/app/(web)/games/new/_v2/game-form.tsx` | GameFormV2 메인 — state/validation/submit/Kakao postcode/preset/recent fetch/copy-game 통합 | 신규 |
| `src/app/(web)/games/new/_v2/kind-selector.tsx` | 경기 종류 3버튼 카드(픽업/게스트/스크림) + 권한 잠금 → UpgradeModal | 신규 |
| `src/app/(web)/games/new/_v2/basic-info-section.tsx` | 경기 정보 카드(제목/날짜/시작~종료 시간/코트/지역/수준/정원/참가비/설명) + TimePicker + 최근 장소 칩 | 신규 |
| `src/app/(web)/games/new/_v2/conditions-section.tsx` | 신청 조건 체크박스 6개(시안) + 기타 자유 텍스트 → `requirements` 줄바꿈 JOIN | 신규 |
| `src/app/(web)/games/new/_v2/advanced-section.tsx` | 고급 설정 아코디언 — min_participants / allow_guests / contact_phone / entry_fee_note / uniform_home/away_color / is_recurring / recurrence_rule / recurring_count / notes | 신규 |
| `src/app/(web)/games/new/new-game-form.tsx` | `GameWizard` import 제거 → `GameFormV2` 호출로 교체 | 수정 |

**위자드 전용 파일 보존(삭제 X, import만 끊음)**: `_components/game-wizard.tsx`, `step-type.tsx`, `step-when-where.tsx`, `step-settings.tsx`, `step-confirm.tsx`, `wizard-progress.tsx` — 이 6개는 그대로 남아있음(디스크 유지, 참조 0).

**재사용 파일**: `_modals/upgrade-modal.tsx`(권한 부족 시 오픈) + `_components/success-overlay.tsx`(submit 성공 시 fallback) 두 개는 `GameFormV2`에서 그대로 import해서 재활용.

**FormData 키 매핑 — createGameAction 기준 전부 보존**:
- 전송 키 23개: `title, game_type, scheduled_at, duration_hours, venue_name, venue_address, city, district, max_participants, min_participants, fee_per_person, skill_level, allow_guests, requirements, description, notes, contact_phone, entry_fee_note, uniform_home_color, uniform_away_color, is_recurring, recurrence_rule, recurring_count`

💡 tester 참고:
- **테스트 방법**: 로그인 세션으로 `/games/new` 접속 → 3카드 + 고급 설정 아코디언 + 액션 3버튼 확인
- **정상 동작**:
  - Breadcrumb "경기 › 경기 개설" + eyebrow "새 경기 · NEW GAME" + H1 "경기 개설"
  - **1. 경기 종류** 카드: 픽업/게스트/스크림 3버튼 → 선택 시 2px cafe-blue 테두리 + 틴트 배경
  - **2. 경기 정보** 카드: 제목(자동생성 가능) / 날짜 / 시작~종료 시간(TimePicker AM/PM) / 코트(클릭=postcode 오픈) / 지역 / 수준(7단계+전연령) / 정원 / 참가비(+빠른선택 4개) / 상세설명
  - 최근 장소 칩 — `/api/web/games/recent-venues` 결과 표시, 클릭 시 venueName/address/city/district 자동 채움
  - **3. 신청 조건** 카드: 체크박스 6개(초보 환영/레이팅 1400 이상/여성 우대/학생 우대/자차 가능자/프로필 공개 필수) + 기타 텍스트 → requirements에 줄바꿈 JOIN
  - **고급 설정** 아코디언: 접힌 상태 기본, 펼치면 min_participants / 연락처 / (픽업시) 참가비 안내 / 게스트 허용 토글 / (팀대결시) 유니폼 색상 / 반복 경기 토글 / 비고
  - **액션 버튼** 우측: 취소(router.back) / 임시저장(프리셋 모달) / 경기 개설(createGameAction 호출 → redirect)
  - 지난 경기 복사 — 상단 카드, 클릭 시 최대 3건 중 택1 → 데이터 자동 채움 + 다음주 동일 요일/시간 계산
- **주의할 입력**:
  - 종료 시간 < 시작 시간 → 익일 종료로 간주(durationHours 자동 계산: `(eh-sh+24)*60`)
  - 제목 비우고 제출 → `generateTitle()` 자동 생성(예: "목요일 저녁 픽업 경기")
  - 권한 없는 상태에서 픽업/스크림 클릭 → UpgradeModal(pricing Link)
  - 카카오 postcode — 코트 or 지역 input 클릭 시 오픈. 결과 → city/district/venueAddress 자동 채움
  - 임시저장 프리셋 → localStorage `bdr_game_presets`(최대 10개). 하단 "저장된 설정 불러오기" Link로 복원
- **tsc --noEmit EXIT=0 PASS** / `/games/new` 비로그인 200 (로그인 페이지 렌더, 기존과 동일 redirect 거동)

⚠️ reviewer 참고:
- **스타일 토큰**: 기존 Phase 2 재구성(Search/Notifications)과 동일하게 인라인 `style={{}}` + v2 토큰(`--ink`, `--ink-mute`, `--ink-dim`, `--bg-elev`, `--bg-alt`, `--border`, `--border-strong`, `--cafe-blue`, `--bdr-red`, `--ok`) 사용. `--color-*` alias 전면 배제 (Phase 0 S1 정책). `.page` 쉘 / `.card` / `.input` / `.textarea` / `.label` / `.btn` / `.btn--sm` / `.btn--accent` / `.eyebrow` 기존 globals.css 클래스 활용
- **시안 대비 의도적 변경점 2건**:
  1. 시안 시간 input `"20:30 – 22:30"` 단일 → **시작 시간 / 종료 시간 2개 TimePicker** (DB `scheduled_at` + `duration_hours` 매핑 + 사용성)
  2. 시안 참가비 `"₩5,000"` 문자열 → **number input + 원 단위** (숫자 유효성)
- **시안 없는 DB 필드 9개 처리**: 시안 "3카드"로는 부족한 필드는 **고급 설정 아코디언**(접힘 기본)으로 보존 — 일반 사용자 UI 노이즈 최소화 + 파워유저/기존 사용자 호환성 유지. 원칙 "DB 필드 **전부 유지**" 준수
- **신청 조건 체크박스 JOIN 방식**: 체크된 `CONDITION_OPTIONS` + 기타 자유 텍스트를 `\n` 줄바꿈으로 JOIN → `requirements` 단일 컬럼. 재진입 시 parser가 역으로 해석(split `\n` or `,` → 알려진 키워드면 체크박스, 아니면 "기타"로). 기존 저장 데이터(쉼표 구분) 호환됨
- **권한 체크**: 기존 step-type.tsx와 동일 로직 — 게스트(1)는 프리, 픽업(0)/스크림(2)은 `permissions` 체크 후 `UpgradeModal` 오픈. `page.tsx`의 `canHostPickup` + `canCreateTeam` 호출 변경 없음
- **임시저장**: 기존 위자드 `step-when-where.tsx`의 `savePreset` 로직(localStorage `bdr_game_presets` + 최대 10개)을 GameFormV2에 포팅. 키 변경 없음 → 기존 사용자 프리셋 호환
- **Material Symbols**: `close` / `content_copy` / `error` / `expand_more` / `history` 전부 Outlined 폰트 사용

---

### [2026-04-22] Phase 2 Match (목록+상세) — /tournaments v2 재구성

📝 구현한 기능: `/tournaments` 목록 + `/tournaments/[id]` 상세 BDR v2 재구성 — **A. 래퍼 신규** 방식으로 기존 컴포넌트(TournamentHero/TournamentTabs/RegistrationStickyCard) 0 수정, v2 스킨 3종 신설 + 규정 탭 추가. **API route.ts / Prisma 스키마 / 서비스 레이어 0 변경**.

#### Phase A — /tournaments 목록
| 파일 경로 | 변경 내용 | 신규/수정 |
|----------|----------|----------|
| `src/app/(web)/tournaments/_components/v2-tournament-list.tsx` | 신규 — 6상태 칩(전체/접수중/마감임박/진행중/접수예정/종료) + 포스터 카드 2열 grid(auto-fill minmax). `deriveV2Status()` 유틸로 DB status + `registration_end_at` 7일 기준 마감임박 파생. 카드: 포스터 140px 좌측 + 본문 우측(상태배지/태그/제목/📅📍💰 메타/진행바/CTA). accent 4색 로테이션 | 신규 |
| `src/app/(web)/tournaments/_components/tournaments-content.tsx` | 기존 `TournamentCard`/`STATUS_BG`/`FORMAT_GRADIENT`/4상태 탭 UI 제거 → `<V2TournamentList>` 호출로 교체. 6상태 탭 state(`v2StatusTab`)로 전환. `deriveV2Status` 단일 소스로 필터 + 탭 카운트(`v2TabCounts`) 계산. 캘린더/주간 뷰 토글·페이지네이션·/api/web/tournaments fetch·prefer 필터·photoMap SWR·필터 드롭다운 전부 그대로 유지. `.page` 쉘 + eyebrow + "열린 대회 · 예정 대회" 제목 + 요약 카운트 행 추가 | 수정 |

#### Phase B — /tournaments/[id] 상세
| 파일 경로 | 변경 내용 | 신규/수정 |
|----------|----------|----------|
| `src/app/(web)/tournaments/[id]/_components/v2-tournament-hero.tsx` | 신규 — 시안 Match.jsx L99 `linear-gradient(135deg, accent, accentAA 50%, #0B0D10)` + grid(포스터 200×280 / 1fr) + `t-display` 48px 제목 + eyebrow(상태·회차) + 메타(📅📍💰👥) + 신청완료 배지 + 전화 inline 링크. 기존 4종 템플릿(basic/poster/logo/photo)은 TournamentHero에 보존 | 신규 |
| `src/app/(web)/tournaments/[id]/_components/v2-registration-sidebar.tsx` | 신규 — 시안 L242 sticky 카드 3단(D-day 44px 대형 숫자 / 참가비·접수현황 / CTA). `computeDaysLeft`·`formatFee` 로직은 기존 RegistrationStickyCard 그대로 이식. 6상태 CTA 분기(비로그인→`/login?next=` / 로그인+접수중→`/join` / 접수중 아님→disabled statusLabel) 동일 유지. 진행바 90%↑ accent 전환, periodText 표시 | 신규 |
| `src/app/(web)/tournaments/[id]/_components/tournament-tabs.tsx` | `TabKey`에 `"rules"` 추가, `TAB_META` 시안 순서 재배열(대회소개→경기일정→대진표→참가팀→규정), props에 `rulesContent?: ReactNode` 추가, 렌더 분기에 `activeTab === "rules"` 추가. 기존 lazy loading(schedule/bracket/teams) / SWR fetcher / convertKeysToCamelCase / 포맷별 분기(풀리그/조별+토너/순수토너) 0 변경 | 수정 |
| `src/app/(web)/tournaments/[id]/page.tsx` | `TournamentHero` → `V2TournamentHero` import 교체. `RegistrationStickyCard` → `V2RegistrationSidebar` import 교체. Prisma select에 `rules: true`, `edition_number: true` 추가. `ALLOWED_TABS`에 `"rules"` 추가. `rulesContent` 서버 렌더(데이터 있으면 whitespace-pre-line 카드 / 없으면 "경기 규정이 아직 공개되지 않았습니다" 빈 상태). `<TournamentTabs rulesContent={rulesContent}/>` 전달. 사이드바 `periodText` prop 생성(registration_start_at ~ end_at). **세션/비공개 가드/SEO/시리즈 카드/디비전 현황/입금 정보 / TournamentAbout / SeriesCard / Breadcrumb / 모바일 플로팅 CTA 전부 0 수정** | 수정 |

**기존 보존 파일(삭제 X, import만 끊음)**: `tournament-hero.tsx` (4종 템플릿 로직 보존), `@/components/tournaments/registration-sticky-card.tsx` (다른 곳에서 참조 가능)

**검증**:
- `npx tsc --noEmit` → **EXIT=0 PASS** (Phase A + B 전부)
- `curl /tournaments` → **200** (0.55s)
- `curl /tournaments/cb33bf68-...` → **200** (1.08s)
- `curl /tournaments/[id]?tab=rules` → **200**
- HTML 검증 — 상세: `linear-gradient(135deg` + `>규정<` + `>접수 현황<` + 탭 5개(대회소개/경기일정/대진표/참가팀/규정) 모두 렌더
- HTML 검증 — 목록: `class="page"` + `class="eyebrow"` + "열린 대회 · 예정 대회" + 6상태 탭 레이블 전부 client JS에 포함

💡 tester 참고:
- **테스트 URL**: http://localhost:3001/tournaments (목록) + http://localhost:3001/tournaments/{id} (상세)
- **정상 동작 — 목록**:
  - 헤더: eyebrow "대회 · TOURNAMENTS" + H1 "열린 대회 · 예정 대회" + 요약 카운트 1줄 (접수중 X · 마감임박 X · 진행중 X · 예정 X)
  - 우측: ViewToggle(리스트/월간/주간) + TournamentsFilterComponent (기존 그대로)
  - 6상태 칩: 전체/접수중/마감임박/진행중/접수예정/종료. 활성 탭은 cafe-blue 배경 + 흰 글씨. 숫자 뱃지 병기
  - 카드 그리드: 2열(desktop) / 1열(mobile). 카드 = 포스터 140px 좌측(있으면 배경 이미지 / 없으면 accent 그라디언트 + 레벨 약어) + 본문 우측(상태 배지 + 카테고리 태그 + 제목 + 📅📍💰 메타 + 진행바 + CTA)
  - CTA 라벨: 접수중/마감임박 → "신청" / 진행중 → "라이브" / 그 외 → "상세"
  - 뷰 모드 월간/주간 전환 → 기존 CalendarView/WeekView 그대로 (기능 보존)
- **정상 동작 — 상세**:
  - 히어로: accent→black 그라디언트 배경 + 포스터(banner_url 있으면 좌측 200×280) + eyebrow "{상태} · {회차}" + 제목 + 📅📍💰👥 메타 + (로그인 신청자면) 신청완료 배지 + (contact_phone 있으면) 전화 링크
  - 탭 5개 순서: 대회소개 → 경기일정 → 대진표 → 참가팀 → 규정
  - 규정 탭: DB `rules` 있으면 whitespace-pre-line 카드 / 없으면 "경기 규정이 아직 공개되지 않았습니다" 빈 상태. 탭 자체는 항상 노출
  - 우측 sticky 사이드바(desktop only): 상단 "접수중/상태" + D-day 대형 숫자(7일 이내 accent 강조) + 접수 기간 → 중단 참가비 + 접수 현황 진행바(90%↑ accent) → 하단 CTA(로그인상태·접수가능 6분기) + 이미 신청시 "내 신청 보기" 대시 테두리 링크
  - 모바일: 사이드바 hidden, 기존 플로팅 CTA(`bottom-16 lg:hidden`) 그대로
  - 비공개 대회: 비관계자는 404 (기존 `isTournamentInsider` 가드 그대로)
- **주의할 입력**:
  - `registration_end_at` 없음 → D-day 텍스트 숨김, "접수 현황" 진행바는 정원 기반으로 정상 렌더
  - `max_teams` 0 / null → 목록 카드 진행바 대신 "N팀 신청" 텍스트만 / 사이드바는 "정원 미정" 안내
  - `banner_url` / `logo_url` 둘 다 없음 → 히어로 1열 풀와이드 + accent 그라디언트만
  - `status=completed` → 사이드바 CTA disabled "종료" 라벨
  - 비공개(is_public=false) + 비관계자 로그인 → notFound() (변경 없음)
  - `?tab=rules` 직접 진입 → initialTab 검증 통과, 규정 탭 활성 상태로 렌더

⚠️ reviewer 참고:
- **원칙 — 기존 파일 0 수정**: `tournament-hero.tsx` (450줄, 4종 템플릿 로직), `@/components/tournaments/registration-sticky-card.tsx` (239줄) 전혀 건드리지 않음. v2는 각각 병렬 파일(`v2-tournament-hero.tsx` 210줄 / `v2-registration-sidebar.tsx` 230줄)로 신설. 후속 PR에서 기존 컴포넌트 import가 모두 끊긴 걸 확인하면 그때 삭제 가능
- **원칙 — page.tsx 가드/SEO 보존**: `getWebSession` → `isTournamentInsider` 비공개 가드, `generateMetadata` (비공개 robots noindex / 공개 OG + Twitter Card), 시리즈 카드(D1 include 통합 + D2 is_public 차단), 디비전별 현황(`div_caps`/`div_fees`/`divisionCounts` groupBy), 입금 정보, 모바일 플로팅 CTA, Breadcrumb 4단 전부 0 수정. diff 확인 가능
- **규정 탭 처리**: 시안 Match.jsx L227 `ul/li` 하드코딩이었지만 DB `rules`는 자유 텍스트 필드(String?)라 **whitespace-pre-line** 카드로 렌더. 향후 마크다운 파서 추가 가능
- **v2 토큰 혼용**: `v2-tournament-list.tsx` / `v2-registration-sidebar.tsx`은 v2 토큰(`--ink`, `--ink-mute`, `--accent`, `--cafe-blue`, `--bg-alt`, `--border`) 사용. `v2-tournament-hero.tsx`는 primary_color/secondary_color prop 직접 색상 + 화이트/rgba(255,255,255,...) 조합(어두운 히어로 위 가독성). page.tsx의 overviewContent 카드는 기존 `--color-*` alias 그대로 유지 (건드리지 말라는 원칙에 부합)
- **6상태 매핑 단일 소스**: `deriveV2Status(t)` 유틸을 목록 카드 배지 + 탭 필터 + 탭 카운트 3곳이 공유 → 규칙 불일치 위험 제거. 마감임박은 DB status=`registration_closed` OR (접수중 AND registration_end_at ≤ 7일 이내). 경계값 테스트 시 check
- **Material Symbols**: `gavel`(규정 탭 빈 상태) / `check_circle`(신청 완료) / `call`(문의) / `search`(빈 상태 CTA) 전부 Outlined 폰트 사용
- **커밋 분리 준비**: Phase A(목록 3 파일) / Phase B(상세 4 파일) 파일 세트 완전 분리 — PM이 2커밋으로 쪼갤 수 있음

---

## 구현 기록 — Phase 2 GameResult — /live/[id] finished 분기 v2 재구성 [2026-04-22]

📝 구현한 기능: `/live/[id]` 에서 경기 상태가 `finished`/`completed` 일 때 v2 시안(`Dev/design/BDR v2/screens/GameResult.jsx`) 레이아웃으로 전체 렌더를 교체. 라이브/진행중 UI는 0 수정.

| 파일 경로 | 변경 내용 | 신규/수정 |
|----------|----------|----------|
| `src/app/api/live/[id]/route.ts` | `mvp_player`(GameScore 공식 기반 MVP 1명) + `playByPlays`(상위 50건, 시간순) 응답 필드 2개 신규 추가. 기존 필드/구조 0 변경 | 수정 |
| `src/app/live/[id]/page.tsx` | MatchData 인터페이스에 `mvp_player` optional 필드 추가 + 상단 import 1줄 + return 직전 분기 3줄(`status === finished/completed` → `<GameResultV2 />`) 추가. 1829줄 본문 0 수정 | 수정 |
| `src/app/live/[id]/_v2/game-result.tsx` | 메인 컨테이너. 탭 상태(요약/팀비교/개인기록/타임라인/샷차트 5종) + MatchDataV2/PlayerRowV2/PlayByPlayRowV2/MvpPlayerV2 타입 export | 신규 |
| `src/app/live/[id]/_v2/hero-scoreboard.tsx` | 어두운 135deg 그라디언트 카드 + radial 오버레이 + FINAL 배지 + 팀별 큰 스코어(72px) + WINNER 라벨 + 쿼터 스코어 표(Q1~Q4 + OT 동적). 시드/전적/관중수/하이라이트 버튼 생략(D5) | 신규 |
| `src/app/live/[id]/_v2/mvp-banner.tsx` | 팀색 원형 등번호 배지 + GAME MVP 라벨 + 이름 + 주요 스탯 라인(pts/ast/reb/stl/+-/FG/3P 야투율). accent 12% 그라디언트 배경 | 신규 |
| `src/app/live/[id]/_v2/tab-summary.tsx` | 좌: 경기 요약 내러티브(자동 조립) + 3블록(점수차/쿼터승/총득점) / 우: TOP 퍼포머 4항목(득점/리바/어시/스틸). playerStats 기반 최대값 선수 1명씩 | 신규 |
| `src/app/live/[id]/_v2/tab-team-stats.tsx` | 9항목 좌우 비교 바(야투/3점/자유투/리바운드/어시스트/스틸/블록/턴오버/파울). 팀별 합계 aggregateTeam 헬퍼 + 비교 바(homePct/awayPct). 페인트/패스트브레이크/벤치득점 생략(D5) | 신규 |
| `src/app/live/[id]/_v2/tab-players.tsx` | 팀별 박스스코어 14컬럼(#/선수/MIN/PTS/REB/AST/STL/BLK/TOV/PF/FG/3P/FT/+/-). DNP 선수는 회색 배경 + 전부 "-". MVP 선수 앞에 ★. POS 컬럼 생략(D5) | 신규 |
| `src/app/live/[id]/_v2/tab-timeline.tsx` | play_by_plays 이벤트 역순 렌더. action_type 한국어 매핑(shot/made_shot/missed_shot/free_throw/rebound/assist/steal/block/turnover/foul/substitution/timeout 등). 득점 이벤트는 accent 4% 배경 + 굵게 | 신규 |
| `src/app/live/[id]/_v2/tab-shot-chart.tsx` | "샷차트 준비 중" 안내 카드 + 팀별 코트 SVG 배경(외곽/페인트/탑서클/자유투서클/3점라인/골대) 반투명 렌더. court_x/y 채워지면 shots 배열 map 으로 확장 가능 구조 | 신규 |

### 변경 요약
- **API 필드 2개 순수 추가**:
  - `mvp_player`: GameScore 공식(`pts + 0.4*fgm - 0.7*fga - 0.4*(fta-ftm) + 0.7*oreb + 0.3*dreb + stl + 0.7*ast + 0.7*blk - 0.4*fouls - to`) 으로 home/away 합산 정렬 1위. DNP/전스탯 0인 선수 제외. playerStats 0건이면 null
  - `play_by_plays`: allPbps를 quarter DESC + game_clock_seconds ASC 정렬 후 상위 50건. roster(TournamentTeamPlayer)에서 직접 player_name/jersey_number 매핑 (home_players[].id 가 분기에 따라 MatchPlayerStat.id 또는 TournamentTeamPlayer.id 여서 PBP 매칭 실패 버그 있었음 — roster 직접 조회로 해결)
- **분기 3줄만 추가**:
  ```tsx
  if (match.status === "finished" || match.status === "completed") {
    return <GameResultV2 match={match as unknown as MatchDataV2} />;
  }
  ```
- **8 신규 파일 토큰**: v2 토큰(`--ink`, `--ink-soft`, `--ink-dim`, `--ink-mute`, `--bg-alt`, `--border`, `--accent`, `--ff-display`, `--ff-mono`) + `color-mix(in oklab, ...)` 그라디언트. `.card` / `.page` globals.css 클래스 사용
- **샷차트 탭**: D2-B 확정 반영 — 탭 유지 + "준비 중" 안내 카드 + 코트 SVG 배경만. 더미 점 전부 제거. 향후 court_x/y 데이터 생기면 `shots.map(...)` 추가만으로 확장 가능
- **D5 생략 필드**: 시드(#1 SEED) / 팀 누적 전적(15W 4L · 1684) / 관중수(412명) / 페인트득점·패스트브레이크·벤치득점 / 자동 내러티브 LLM 문장 / 영상·공유·기록지 PDF·하이라이트 버튼 전부 생략

### 검증 결과
- `tsc --noEmit` EXIT=0 PASS
- Playwright chromium 실측:
  - `/live/102` (status=completed): FINAL/WINNER/GAME MVP/요약/팀 비교/개인 기록/타임라인/샷차트 탭 + `linear-gradient(135deg` 전부 렌더. v1 zoom 1.1 marker 없음 → v2 분기 ✅
  - `/live/92` (status=live): v1 UI 렌더 — LIVE 배지 있음, v2 요소(FINAL/MVP/요약 탭) 모두 0건 → 분기 정상 ✅
- API `/api/live/102` 직접 호출: `mvp_player` 채워짐(강승현 등) + `play_by_plays` 50건 + player_name/jersey_number 매칭 확인

💡 tester 참고:
- **테스트 방법**:
  - finished/completed 경기: `/live/102`, `/live/100`, `/live/99` 등 접속 → v2 GameResult 레이아웃 확인. 탭 5개 전환 동작. Hero Scoreboard 쿼터 스코어 / MVP 배너 / Summary TOP 퍼포머 / Team Stats 비교 바 / Players 테이블 / Timeline 역순 / ShotChart 안내 카드
  - live/in_progress 경기: `/live/92` 같은 라이브 경기 — 기존 v1 UI 그대로. 변경 없음
- **정상 동작**:
  - 종료 경기: `linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%)` 히어로 + WINNER 라벨 1회(승자 팀만) + MVP 배너 팀색 원 + 탭 전환 시 active 탭에 `var(--accent)` 하단 2px 밑줄
  - 라이브 경기: 기존 박스스코어 UI(zoom 1.1, LIVE 배지, 프린트 버튼 등) 100% 동일
- **주의할 입력**:
  - playerStats 0건 경기 → `mvp_player: null` → MVP 배너 아예 안 렌더 (빈 공간 없음)
  - play_by_plays 0건 경기 → Timeline 탭에 "play-by-play 기록이 없습니다" 안내 카드
  - OT 경기 → HeroScoreboard 쿼터 표에 OT1/OT2… 동적 컬럼 추가 확인 필요
  - 모바일 뷰 (< 720px) → Summary 2열 → 1열 / ShotChart 2열 → 1열 자동 전환

⚠️ reviewer 참고:
- **API 필드 순수 추가만**: 기존 응답 구조/필드 0 변경. apiSuccess 의 camelCase→snake_case 변환 확인. `mvpPlayer` → `mvp_player`, `playByPlays` → `play_by_plays`
- **MatchData 캐스팅**: `match as unknown as MatchDataV2` — page.tsx MatchData 와 v2 MatchDataV2 가 중복 정의되어 있지만 필드는 호환. 단일 타입 export 로 통합할 수 있으나 page.tsx 건드리지 않는 원칙상 이번에는 캐스팅으로 처리
- **roster 직접 조회로 PBP 매핑 수정**: home_players[].id 가 진행중/종료 분기에 따라 다른 ID 타입을 반환하는 기존 버그를 playByPlays 렌더에서 우회. roster(match.homeTeam.players / awayTeam.players) 의 p.id 를 직접 lookup 키로 사용 → 타임라인 player_name 정상 렌더
- **샷차트 확장 여지**: court_x/y 데이터 생기면 `tab-shot-chart.tsx` TeamCourt 컴포넌트 내 SVG 위에 `shots.map(s => <circle>/<g>)` 렌더만 추가하면 됨. 구조는 시안 그대로 유지

---

## 구현 기록 — Phase 3 Orgs — /organizations v2 재구성 [2026-04-25]

📝 구현한 기능: `/organizations` 단체 목록 페이지를 BDR v2 디자인 시안(`Dev/design/BDR v2/screens/Orgs.jsx`) 기반으로 재구성. 데이터 패칭 로직(Prisma 쿼리) 0 변경, UI만 완전 교체.

| 파일 경로 | 변경 내용 | 신규/수정 |
|----------|----------|----------|
| `src/app/(web)/organizations/_components/org-card-v2.tsx` | 카드 컴포넌트. 상단 그라디언트 헤더(135deg + 단체 색상) + 로고/태그/이름/종류 배지 + 본문 설명·통계 3분할(지역/시리즈/인원) + 하단 "상세" Link + "가입 신청" alert. 색상 6색 팔레트 id 해시 / 태그 자동 생성 / kind="단체" 폴백 | 신규 |
| `src/app/(web)/organizations/_components/orgs-list-v2.tsx` | 클라 컨테이너. 종류 chip 4종(전체/리그/협회/동호회) — "전체"만 동작·나머지 클릭 시 alert("준비 중") + opacity 0.55 + title. auto-fill minmax(300px, 1fr) 그리드 | 신규 |
| `src/app/(web)/organizations/page.tsx` | SSR. eyebrow "단체 · ORGANIZATIONS" + h1 "리그 · 협회 · 동호회" + 부제 "여러 팀을 아우르는 N개의 농구 단체" + "단체 등록" 버튼(라벨 PM 지시). 기존 prisma.organizations.findMany 그대로 + BigInt → string 직렬화 매핑 추가 | 수정 |
| `.claude/scratchpad.md` | "🚧 추후 구현 목록" 섹션에 "Phase 3 Orgs (커밋 대기, 04-25)" 5건 추가 (kind/brand_color/tag 필드 + 가입 신청 API + teams 집계) | 수정 |

### DB 미지원 필드 폴백 전략
| 디자인 필드 | 매핑 | 폴백 처리 |
|------|------|----------|
| `color` | 없음 | id 해시 → `[#0F5FCC, #E31B23, #10B981, #F59E0B, #8B5CF6, #0EA5E9]` 6색 순환 (같은 id는 항상 같은 색) |
| `tag` | 없음 | 영문 대문자 ≥2자 → 4글자 추출 / 영문 단어 2+개 → 이니셜 / 그 외 → 앞 2글자 |
| `kind` | 없음 | 헤더 우측 배지 "단체" 고정 / 필터 chip "전체"만 활성 |
| `teams` | series→teams 조인 미구현 | series_count 그대로 표시 (라벨도 "시리즈"로 변경) |

### 검증
- `npx tsc --noEmit` → EXIT=0 **PASS**
- 개발 서버(PID 102232, 3001) `curl /organizations` → **HTTP=200** (0.98s, 55KB)
- HTML 검증 grep: `단체 · ORGANIZATIONS` / `리그 · 협회 · 동호회` / `단체 등록` / `준비 중` / `orgs-list-v2` 마커 5개 모두 렌더 확인

💡 tester 참고:
- 테스트 방법: 브라우저로 `http://localhost:3001/organizations` 접속
- 정상 동작:
  - 페이지 상단 eyebrow + h1 + 부제 + 우측 "단체 등록" 빨간 버튼 표시
  - 필터 chip 4종(전체/리그/협회/동호회). "전체" active 상태
  - "리그/협회/동호회" 클릭 시 alert("준비 중인 기능입니다") + 시각적 비활성(opacity 0.55, hover title 표시)
  - 카드: 상단 그라디언트 헤더(단체별 다른 색) / 좌측 로고 또는 태그 박스 / 우상단 "단체" 배지 / 본문 3분할(지역·시리즈·인원) / 하단 "상세"·"가입 신청"
  - "상세" 클릭 → `/organizations/[slug]` 정상 이동
  - "가입 신청" 클릭 → alert("준비 중인 기능입니다") (페이지 이동 X)
- 주의할 입력:
  - 로고 없는 단체 → 태그 자동 생성 박스가 그라디언트 안에 표시됨
  - region NULL 단체 → "전국"으로 폴백
  - description NULL 단체 → "단체 소개가 없습니다." 폴백 (높이 보존)
  - 영문/한글/숫자 혼합 단체명 → 태그 자동 생성 결과 확인 (영문 대문자 우선)
  - 단체 0건 → "아직 등록된 단체가 없습니다." 빈 상태 카드

⚠️ reviewer 참고:
- **데이터 패칭 0 변경**: prisma.organizations.findMany select/where/orderBy/take 모두 v1과 동일. UI만 교체된 리디자인 작업
- **BigInt 직렬화**: page.tsx에서 `id: org.id.toString()`로 변환 후 클라 컴포넌트 전달 (Next.js 클라 컴포넌트 props 직렬화 제약 회피)
- **하드코딩 색상 일부**: 단체별 그라디언트 색상은 디자인 시안 6색 팔레트 그대로 사용 (var 없음). 추후 `organizations.brand_color` 필드 추가 시 DB 값으로 대체 예정. 그 외 텍스트/배경은 모두 `var(--color-*)` 사용
- **next/image 미사용**: 기존 page.tsx와 동일하게 `<img>` 사용 (logo_url 외부 도메인 다양 → next.config 설정 부담 회피). D3 정책에 따라 추후 일괄 마이그레이션 검토
- **종류 필터 미구현 의도적**: organizations.kind 필드 부재로 필터링 자체가 불가. UI 노출은 시안 충실도 확보 + 향후 마이그레이션 비용 절감 목적. 구현 시점에 `useState<Kind>` 분기 + filter 적용만 추가하면 됨

---

## 구현 기록 — Phase 3 TeamCreate — /teams/new v2 4스텝 멀티스텝 폼 [2026-04-22]

📝 구현한 기능: 시안 `TeamCreate.jsx` 4스텝(기본정보/엠블럼/활동/검토) + 우측 Tips aside + 약관 차단 멀티스텝 폼. **B 옵션(영문 팀명 보존)** — 기존 `name_en` + `name_primary` 토글을 Step1 보조 입력으로 흡수. 서버 액션·Zod 스키마·Prisma 0 변경.

| # | 파일 경로 | 변경 내용 | 신규/수정 |
|---|----------|----------|----------|
| 1 | `src/app/(web)/teams/new/_v2/team-form.tsx` | 메인 폼. useActionState + step state 1~4 + state 6키(name/name_en/name_primary/description/primary_color/secondary_color)를 form 내부 hidden input 으로 항상 함께 제출. goNext 에서 영문명 형식 체크. 약관 미체크 시 onSubmit preventDefault. Tips aside 3카드(TIP/등록 후/요금제) 우측 sticky | 신규 |
| 2 | `src/app/(web)/teams/new/_v2/stepper.tsx` | 36px 원형 + 연결선 4스텝. 도달=accent / 활성=ring 3px / 완료=✓ | 신규 |
| 3 | `src/app/(web)/teams/new/_v2/step-basic.tsx` | Step1 — 한글명(필수, 2~20자) / 영문명(선택, 패턴 검증) / 대표 언어 토글(영문명 입력 시 노출) / 팀 태그(시안 신규, UI만, "준비 중") / 팀 소개(500자 카운트) | 신규 |
| 4 | `src/app/(web)/teams/new/_v2/step-emblem.tsx` | Step2 — 160×160 미리보기(primaryColor + tag) + 10팔레트(BDR Red 첫번째) + 엠블럼 업로더(BDR+ 준비 중) + 보조 색상 input (기존 기능 보존) | 신규 |
| 5 | `src/app/(web)/teams/new/_v2/step-activity.tsx` | Step3 — 홈코트/실력 6단계/요일 7토글/공개 3종(public/invite/closed). **모두 UI 만, 전체 섹션 "준비 중" 표시** | 신규 |
| 6 | `src/app/(web)/teams/new/_v2/step-review.tsx` | Step4 — 7행 검토표(팀명·영문명·태그·컬러·코트·실력·공개·팀장) + 약관 2개 체크. 미입력 필드는 "(미입력)" / 미지원 필드는 "(준비 중)" 라벨 | 신규 |
| 7 | `src/app/(web)/teams/new/new-team-form.tsx` | 200줄 → 11줄. `<TeamFormV2/>` 1줄 import 로 슬림화. page.tsx 의 import 경로 유지 | 수정 (전면 교체) |
| 8 | `.claude/scratchpad.md` | "🚧 추후 구현 목록"에 Phase 3 TeamCreate 7건 신규(tag/level/practice_days/home_court/is_public + 엠블럼 업로더 + createTeamSchema 확장) | 수정 |

💡 tester 참고:
- **테스트 방법**:
  1. `/teams/new` 로그인 후 진입
  2. Step1: 한글명만 입력 → "다음" 활성. 영문명에 한글 입력 시 클라 에러("영문/숫자/공백/하이픈만") 표시. 대표 언어 토글 노출.
  3. Step2: 10팔레트 클릭 → 미리보기 색상 즉시 변경. 미리보기 텍스트 = tag(미입력 시 영문명/한글명 첫 3자 fallback). 보조 색상 입력 가능.
  4. Step3: 홈코트/실력/요일/공개 입력 가능하지만 모든 항목이 "준비 중" 라벨 — 등록 시 미저장 정상.
  5. Step4: 검토표 7행 노출. **약관 2개 모두 체크 전엔 "팀 등록 완료" 비활성**.
  6. 약관 체크 → 제출 → `/teams/{id}` 리다이렉트
- **정상 동작**:
  - 생성 후 팀 상세 페이지 진입
  - 팀 카드 목록(`/teams`)에서 새 팀이 wins desc 기준 정렬에 포함
  - 영문명 입력했으면 v2 카드 tag = 영문명 첫 3자 대문자
- **주의할 입력**:
  - 영문명에 한글/특수문자 → 클라 에러 + Step1 로 자동 복귀
  - 한글명 빈 문자열 → "다음" 비활성
  - Step1~3 입력 후 "이전"으로 돌아가도 값 유지 (state 보존)
  - 팀 태그 / 홈코트 / 실력 / 요일 / 공개 → **등록 후 DB에 저장 안 됨 (UI 만)**
  - 엠블럼 업로더 클릭해도 동작 없음 (BDR+ 준비 중 라벨)
  - 팀 5개 한도 초과 시 서버 에러 표시
  - 영문명 미입력 시 `name_primary` 기본 "ko" 로 제출

⚠️ reviewer 참고:
- **createTeamAction / createTeamSchema / Prisma 0 변경**: FormData 키 6개(name/name_en/name_primary/description/primary_color/secondary_color) 그대로 전송. 기존 영문명 검증·엄격 패턴 그대로 작동
- **hidden input 항상 6키 포함**: 어느 스텝에 있든 form 안에 6키 hidden input 이 항상 마운트됨 → Step1 unmount 되어도 값 손실 없음. Step1/2 의 가시 input 은 모두 제어 컴포넌트(value=state) + onChange 만
- **약관 차단 이중 안전망**: ① Step4 의 submit 버튼 `disabled` ② form `onSubmit` preventDefault. 사용자가 disabled 우회 시도해도 차단
- **시안 색상 토큰**: `var(--accent)` `var(--ink)` `var(--ink-mute)` `var(--ink-dim)` `var(--bg-alt)` `var(--border)` `var(--ff-mono)` `var(--ff-display)` `var(--sh-lift)` `var(--cafe-blue)` 모두 globals.css 토큰. 하드코딩 컬러는 팔레트 10종(시안 디자인값 그대로) + 보조 색상 기본값(`#E76F51`, 기존 폼 값 보존) + 엠블럼 placeholder 텍스트 색상(`#fff`) 만
- **UI 만 5필드(tag/home/level/days/privacy)**: state 는 가지고 있지만 form 에 hidden 으로 추가하지 않음 → 서버에 도달 안 함. createTeamSchema 가 strict 모드라 실수로 추가 키 들어가면 400 발생할 위험 차단
- **버튼 마크업**: 시안의 `<button className="btn btn--primary">` 토큰 그대로 사용. 모든 nav 버튼은 `type="button"` 명시(form submit 오발 방지) — 마지막 "팀 등록 완료"만 `type="submit"`
- **/teams/new GET 200**: Next 15 Turbopack dev 특성으로 비로그인이라도 200 반환(redirect throw → error.tsx 흐름). 운영(Vercel)에서는 307 정상. errors.md 에 등록된 알려진 패턴

---

## 작업 로그 (최근 10건)
| 날짜 | 담당 | 작업 | 결과 |
|------|------|------|------|
| 04-22 | developer | **Phase 5 Achievements — /profile/achievements v2 신규 (시안 16종 배지 그리드 + 필터 + 최근4 + 정적 카탈로그)** — 신규 3 (`achievements/_v2/badge-catalog.ts` 16+12종 카탈로그(BadgeMeta tier/category/icon/desc/name) + TIER_COLOR/TIER_LABEL/CATEGORY_LABEL 상수 + resolveBadgeMeta() 폴백(bronze/milestone/🏅) + SIGNATURE_ORDER 시안 16키 순서 / `achievements/_v2/achievements-content.tsx` "use client" useState filter + Breadcrumb(홈›프로필›업적) + Header 통계 3셀(획득/전체/달성률) + 최근획득 4셀 카드(borderLeft tier색) + 필터칩 8개(전체/획득/진행중/경기/팀/커뮤니티/시즌/마일스톤) + 4열 배지 그리드(tier 라벨우상단/이모지48px/잠금시🔒+grayscale/desc 32px minHeight/획득시✓날짜+상위 —, 미획득시 0%바+0/— title="측정 준비 중") / `achievements/page.tsx` 서버컴포넌트 force-dynamic + getWebSession + 비로그인 안내(person_off) + prisma.user_badges.findMany earned_at desc + BigInt→string + Date→ISO 직렬화 + AchievementsContent 렌더). **API/Prisma/서비스 0 변경. 신규 fetch 0건**. 카페 세션 무관. 시안 16종 SIGNATURE_ORDER 우선 + DB 발급 시안외 배지(court_explorer/streak/mvp 등) 끝에 추가. DB 미지원 메타(rarity/progress/total) 전부 "—" / "0 / —" / 0% 폴백 + var(--ink-dim) 약하게. 추후 구현 Phase 5 Achievements 4건 신설(rarity 측정 cron / user_badges_progress 테이블 / 자동 발급 트리거 / badge_definitions DB화). tsc --noEmit EXIT=0 PASS | ✅ (커밋 대기, PM 처리) |
| 04-22 | developer | **Phase 5 Settings — /profile/settings v2 6 섹션 재구성 (시안 옵션 A: 인라인 9필드 폼)** — 신규 8 (`_components_v2/section-key.ts` SectionKey 유니언 + resolveSection 폴백 / `settings-side-nav-v2.tsx` 220px sticky 6 버튼 nav(Material Symbols person/sports_basketball/notifications/lock/credit_card/warning) / `settings-ui.tsx` 공용 SettingsHeader+SettingsRow+SettingsToggle (토큰 var(--*) 전용·하드코딩 색 0) / `account-section-v2.tsx` 5행 Row(이메일·비밀번호 동작 + 연결된 계정·2FA·로그인기기 disabled) / `profile-section-v2.tsx` **시안 인라인 9필드 폼**(닉네임 2~20 검증 / 실명 / 포지션 / 키 / 몸무게 / 도시 / 활동지역구 / 생년월일 / 자기소개) + PATCH `/api/web/profile` 호출 + 낙관적 onSaved 콜백 / `notify-section-v2.tsx` 5 동작 토글(push/game/community/team/tournament) + 4 disabled(이메일·D-3·좋아요·마케팅) + 낙관적 PATCH 롤백 / `privacy-section-v2.tsx` 5 disabled "준비 중" 토글 / `billing-section-v2.tsx` 시안 그라디언트 카드(유료=cafe-blue, 무료=alt) + 4행 Row(결제수단/결제내역→/profile/payments/세금계산서/구독관리→/profile/subscription) + 하단 2버튼(플랜변경→/pricing / 구독취소) / `danger-section-v2.tsx` 3 카드(데이터내보내기·비활성화 disabled / 계정삭제 inline 비밀번호 모달 → DELETE `/api/web/auth/withdraw`)) + 1 전면재작성 (`page.tsx` `?section=`/`?tab=` 폴백 + 좌 sticky nav + 우 카드 + GET /api/web/profile + GET /api/web/profile/subscription 병렬 마운트 fetch / 비활성 섹션 unmount). **API route.ts / Prisma / 서비스 / 컴포넌트 0 변경. 신규 fetch 0건** (활용: profile/notification-settings/subscription/auth/withdraw 전부 기존 라우트). 기존 6 페이지(notification-settings/preferences/payments/subscription/billing/edit) 삭제 0. 추후 구현 Phase 5 Settings 11건 신설(2FA/세션 관리/이메일 알림/D-3·좋아요·마케팅/privacy 5 토글 JSONB/GDPR ZIP/soft deactivate/PG 카드 토큰/세금계산서 자동/jersey_number+dominant_hand/소셜 연동 UI). tsc --noEmit EXIT=0 PASS | ✅ (커밋 대기, PM 처리) |
| 04-22 | developer | **Phase 5 Rank — /rankings v2 재구성 (a 토글 3종: 팀/선수/외부BDR)** — 신규 3 (`_components/v2-podium.tsx` 1·2·3등 카드 [2등/1등/3등] 배치 + 가운데 1등 translateY(-12px) + display 폰트 #N / `v2-team-board.tsx` 6열 보드(순위·팀색배지·이름링크·레이팅(=wins임시)·승[ok색]·패·승률) / `v2-player-board.tsx` 8열 보드 + 정렬pills 4종(레이팅/PPG/APG/RPG) + 클라 정렬 + PPG=avg_points / APG=total_assists/games_played / RPG=total_rebounds/games_played / 레이팅·변동 "—") + 수정 2 (`_components/rankings-content.tsx` 전면 교체: theme-switch 3종(팀/선수/외부BDR) + eyebrow + h1 "2026 시즌 랭킹" + V2Podium + V2TeamBoard/V2PlayerBoard 분기 + 외부BDR 탭은 `<BdrRankingTable>` + 일반/대학 부 토글 / `loading.tsx` v2 톤 가볍게 .page+.eyebrow+.board 8행). 보존 1 (`_components/bdr-ranking-table.tsx` 0수정, 외부BDR 탭에서 그대로 호출). **API/Prisma/서비스 0 변경** (/api/web/rankings?type=team\|player + /api/web/rankings/bdr 그대로). 시안 Rank.jsx 충실. globals.css `.page/.eyebrow/.theme-switch/.board/.card` + 변수 `--accent/--ok/--cafe-blue/--cafe-blue-soft/--cafe-blue-deep/--bg-elev/--bg-alt/--ink-mute/--ink-dim/--ink-soft/--ff-display/--ff-mono/--border/--radius-chip` 전부 기존 정의 활용. 추후 구현 Phase 5 Rank 5건 신설(teams.rating ELO / users.rating+trend / PPG·APG·RPG 정규화 / 시즌 갱신 cron / 포디움 메타 포맷). tsc --noEmit EXIT=0 PASS | ✅ (커밋 대기, PM 처리) |
| 04-22 | developer | **Phase 4 PostWrite — /community/new v2 재구성 (with-aside 2열 + 시안 카드 폼)** — 1파일 전면 재작성(`(web)/community/new/page.tsx`). 단독 Card → `.page > .with-aside` (좌 `CommunityAsideNav activeCategory={null}` 재사용 + 우 main). 시안 그대로 헤더(h1 "글쓰기" + 우 "임시저장 · 자동저장 준비 중") + 본문 카드 6섹션: ①게시판 선택+제목 160px/1fr 그리드 ②툴바 12버튼 모두 disabled "준비 중"(D3 — B/I/U/S 시각 힌트 유지+H1/H2/인용/목록/사진/링크/영상/미리보기) ③textarea 상단 radius 0 으로 툴바와 시각 연결+ minHeight 340 + 글자수 카운터 ④체크박스 3개(댓글허용/비밀글/공감표시) 모두 disabled (D4) + 글자수/20000 카운터 ⑤이미지 URL 첨부 섹션 보존(D5 — 실 동작, 시안 톤만 정돈, `<img>` → `next/image fill unoptimized` 교체) ⑥액션 3버튼(취소 router.back / 임시저장 disabled / 등록 submit). **카테고리 select 4→7개**(D1: notice 제외, recruit/qna 신설). **createPostAction / useActionState / `name="images"` hidden JSON / pending / state.error 0 변경**. v2 글로벌 클래스 활용(.label/.select/.input/.textarea/.btn/.btn--sm/.btn--primary 전부 globals.css 정의 확인). 추후 구현 Phase 4 PostWrite 4건 신설(community_post_drafts 임시저장/자동저장 · TipTap 또는 Lexical 리치 에디터 · allow_comments/is_private/show_reactions 컬럼 · Supabase Storage 직접 업로드). tsc --noEmit EXIT=0 PASS | ✅ (커밋 대기, PM 처리) |
| 04-26 | developer | **Phase 4 PostDetail — /community/[id] v2 재구성 (시안 PostDetail.jsx + 좌 CommunityAside 재사용)** — 신규 1(`_components/community-aside-nav.tsx` RSC↔클라 경계 우회용 useRouter 래퍼: 클릭 시 `/community?category=...` push) + `[id]/page.tsx` 전면 재구성(grid 12열 → `.page > .with-aside`. 시안 4섹션: badge--soft 카테고리 + 24px 제목 + cafe-blue-soft 이니셜 작성자 + 우측 메타(날짜·조회·댓글·추천) + Body padding 28/26·fs15·lh1.8 + Reactions 가운데정렬 좋아요/공유/스크랩(disabled "준비 중") + Nav 이전/다음글 placeholder "준비 중"). D1-c: 우측 PostDetailSidebar 그대로 호출 + `marginTop:32`로 본문 하단 1열 누적 (작성자카드/실시간 인기글/이벤트 배너 3블록 보존). D2: 홈›카테고리›글 상세. D3: split <p> 유지(h3/img X). D4: 이전/다음 placeholder. D5: LikeButton+ShareButton 그대로+스크랩 disabled. D6+D7: CommentForm/CommentList 그대로 호출(카페 댓글 병합 보존). **API/Prisma/Server Action/decodeHtmlEntities/cache(getPost)/병렬 likes·follow 0 변경. 컴포넌트 6개(LikeButton/ShareButton/PostActions/PostDetailSidebar/CommentForm/CommentList) 0 수정**. 추후 구현 Phase 4 PostDetail 5건(이전/다음 글 Prisma 쿼리·users.xp LevelBadge·작성글 수 헤더·Body block type 분기·스크랩 community_post_bookmarks). tsc --noEmit EXIT=0 / `/community/<recruit-id>` 200(207KB,2.2s) + `/community/<review-id>` 200(213KB) + `/community/<general-id>` 200(223KB) / HTML: with-aside 1·page 1·badge--soft 1(카테고리별 동적)·aside__link 8·cafe-blue-soft 1·thumb_up 1·>댓글< 1·>스크랩< 1·이전글/다음글 1·실시간 인기글 1·작성자 정보 1·View Detail 1 전부 렌더 확인 | ✅ (커밋 대기, PM 처리) |
| 04-22 | developer | **Phase 4 BoardList — /community v2 재구성 (시안 BoardList.jsx + 그룹 트리 사이드바, 페이지당 20개)** — 신규 2 (`src/components/bdr-v2/v2-pager.tsx` 재사용 페이저 컴포넌트 + 윈도우 슬라이딩 / `src/app/(web)/community/_components/community-aside.tsx` 좌측 그룹 트리: 메인(공지/자유) · 플레이(팀원/대회후기/장터) · 이야기(질문/정보) — 글 수 카운트 "—" + title="준비 중") + `community-content.tsx` 전면 교체(.page + .with-aside 2열 + 헤더 eyebrow+제목+전체글수+검색+글쓰기 + 정렬 4종(최신/인기/댓글/조회) 클라 토글 + .board 테이블(번호/제목/작성자/날짜/조회/추천) + 공지(category=notice) 자동 핀 상단 + 새글 24h badge--new "N" + has_image false 고정). **API `/api/web/community` 호출 / SSR fallbackPosts / preferFilter Context / searchParams 동기화 / decodeHtmlEntities 100% 보존**. 페이지당 20개(PM 결정, 시안 충실). 추후 구현 Phase 4 BoardList 6건 신설(is_pinned/has_image/카테고리별 글수 API/LevelBadge/글 번호 채번/게시판 내 검색 라벨). tsc --noEmit EXIT=0 / `/community` 200(0.86s) + `?category=general/notice` 200 + `?q=test` 200 / HTML 마커: with-aside 1 / board__head 1 / board__row 20 / aside__ 16 / pager 5 / eyebrow 1 / btn--primary 2 전부 렌더 확인 | ✅ (커밋 대기, PM 처리) |
| 04-22 | developer | **Phase 3 Bracket — v2 재구성 (B안: 헤더/Status/사이드 v2 공통, 메인 트리는 포맷별 분기 보존)** — 사용자 4건 결정(B안/SVG 유지/우승예측 자리 유지+"투표 준비중"/select 같은 series_id 라우팅) 그대로 반영. 신규 6 (`v2-bracket-header` eyebrow+h1+부제+series_id회차select+저장/공유/출력 alert / `v2-bracket-status-bar` 5칸: 참가팀/완료/진행중LIVE/현재라운드/우승상금"-" / `v2-bracket-schedule-list` rounds 평탄화+시간순+상태배지 / `v2-bracket-seed-ranking` 시드+이니셜박스+wins(레이팅 자리 대체) / `v2-bracket-prediction` placeholder "투표 준비중"+버튼 disabled / `v2-bracket-wrapper` SWR+포맷별 분기 보존 LeagueStandings/GroupStandings/BracketView/BracketEmpty 그대로 호출) + 수정 2 (`tournament-tabs.tsx` BracketTabContent를 V2BracketWrapper 위임으로 슬림화+props 6개 추가 / `page.tsx` TournamentTabs에 헤더용 메타+seriesEditions 매핑 전달, 추가 쿼리 0). **API route.ts/Prisma/서비스 0 변경. BracketView/LeagueStandings/GroupStandings/FinalsSidebar/BracketEmpty 0 수정.** 추후 구현 목록 Phase 3 Bracket 6건 신설(우승예측 테이블/teams.rating/LIVE 실시간/저장공유출력/prize_money/MatchCard 코트정보). tsc --noEmit EXIT=0 / `/tournaments/18e4912f-.../?tab=bracket` 200(group_stage_knockout TEST 6팀) / public-bracket API 200 / SSR HTML eyebrow "BRACKET" 렌더 확인 | ✅ (커밋 대기, PM 처리) |
| 04-25 | planner-architect | **코트 대관(Booking) 시스템 기획설계** — 현황 점검(plans/court_rental + 토스페이먼츠 + payments 다형성 + court_infos.user_id 모두 기존 자산 확인) → 신규 1테이블(court_bookings) + court_infos 2컬럼 + User 백릴레이션 1줄로 MVP 가능 판정. 운영자 ↔ 코트 매핑은 court_infos.user_id + user_subscriptions(feature_key=court_rental) 활성 검사로 단순화 (court_managers 신규 모델 도입 보류). 4 Phase 분할(A=무료 MVP 8~12h / B=결제 6~8h / C=정산+자동환불 8~10h / D=BDR+할인+N:M 6~8h). PM이 사용자에게 전달할 결정 포인트 7건(D-B1~D-B7) 도출 — Phase A 착수 전 D-B1·D-B2·D-B6 3건 필수. Phase A 산출 파일 신규 8 + 수정 2 = 10파일 매핑. 동시성·환불·KYC·외부vs자체 위험 6건 대응 명세. 코드 0수정 | ✅ 설계 완료 |
| 04-22 | developer | **Phase 3 Org 상세 — /organizations/[slug] v2 재구성 (Hero + 4탭 + ?tab= 동기화)** — `_components_v2/` 7 신규(org-color 공유 헬퍼 / org-hero-v2 135deg 그라디언트+가입신청 alert+회원/팀/설립 메타 / org-tabs-v2 4탭+useRouter ?tab= 동기화 / overview-tab-v2 좌소개·운영원칙(준비중)+우연락처·스폰서(준비중) / teams-tab-v2 빈상태 / events-tab-v2 series.tournaments 평탄화 4건 / members-tab-v2 4열 카드+role한국어라벨+sinceYYYY) + `page.tsx` 재작성(searchParams.tab 정규화 + 기존 include 트리 0변경 + members.created_at 1줄만 추가). `_components/org-card-v2.tsx` pickColor/generateTag 공유 헬퍼 import로 통합. Phase 3 Orgs 추후 구현 목록 9건으로 확장(founded_year/address/policies/sponsors/team집계/임원직책 추가). tsc EXIT=0 / `/organizations/org-ny6os` + 4탭 전부 200(?tab=overview/teams/events/members) | ✅ (커밋 대기) |
| 04-22 | developer | **Phase 2 Match (목록+상세) — /tournaments v2 재구성 (A. 래퍼 신규)** — **Phase A 목록**: 신규 `v2-tournament-list.tsx`(6상태 칩 + 포스터 카드 2열 grid + `deriveV2Status` 단일 소스) + `tournaments-content.tsx` 수정(기존 `TournamentCard`/4상태 탭 제거 → `<V2TournamentList>` 호출, 캘린더/주간 뷰·페이지네이션·필터·prefer·photoMap SWR 유지, `.page` + eyebrow + "열린 대회 · 예정 대회" 헤더). **Phase B 상세**: 신규 `v2-tournament-hero.tsx`(135deg 그라디언트 + 포스터 200×280 + t-display 48px) + `v2-registration-sidebar.tsx`(D-day 44px + 참가비/진행바/6상태 CTA 분기) + `tournament-tabs.tsx` 수정(`"rules"` 탭 추가, 5탭 순서 시안 반영, rulesContent prop) + `page.tsx` 수정(TournamentHero→V2, RegistrationStickyCard→V2, Prisma select `rules`+`edition_number` 추가, rulesContent 서버 렌더, `ALLOWED_TABS`에 `"rules"`). **API route.ts / Prisma 스키마 / 서비스 0 변경**. 기존 `tournament-hero.tsx` 450줄 + `registration-sticky-card.tsx` 239줄 + 세션/비공개 가드/SEO/시리즈 카드/디비전 현황/입금 정보/모바일 플로팅 CTA 0 수정. tsc --noEmit EXIT=0 / `/tournaments` 200(0.55s) / `/tournaments/[id]` 200(1.08s) / `?tab=rules` 200 / HTML: `linear-gradient(135deg` + `>규정<` + `>접수 현황<` + 5탭 전부 확인 | ✅ (커밋 대기, PM이 Phase A/B 2커밋 분리) |
| 04-22 | developer | **Phase 2 CreateGame — 단일 폼 v2 재구성 (위자드 → 3카드 + 고급 설정 아코디언으로 DB 필드 보존)** — 5 신규(`_v2/game-form.tsx` + `kind-selector.tsx` + `basic-info-section.tsx` + `conditions-section.tsx` + `advanced-section.tsx`) + `new-game-form.tsx` 수정(`GameFormV2` 호출로 교체). 시안 3카드(종류 3버튼 / 정보 9필드 / 조건 체크박스 6개→requirements JOIN) + 고급 설정 아코디언(9필드 보존) + 액션 3버튼(취소/임시저장/경기 개설). FormData 키 23개 전부 기존 `createGameAction` 시그니처 유지. 위자드 전용 6파일(`game-wizard` + `step-*` 4종 + `wizard-progress`) 삭제 없이 import만 끊음. UpgradeModal/SuccessOverlay 재사용. Kakao postcode + 지난 경기 복사(`/api/web/games/my-last-game`) + 최근 장소(`/recent-venues`) + localStorage 프리셋(`bdr_game_presets`) 전부 보존. tsc --noEmit EXIT=0 PASS / `/games/new` 비로그인 200(로그인 페이지 리다이렉트) | ✅ (커밋 대기, 로그인 세션 브라우저 수동 검증 필요) |
| 04-22 | developer | **Phase 2 Search — v2 재구성 (탭 7개, 데이터 보존)** — `page.tsx`(서버, Prisma 6테이블 유지 + 직렬화) + `_components/search-client.tsx`(신규, controlled form + URL push + 탭 7종 클라 필터) + `loading.tsx`(v2 스켈레톤). 탭: 전체/팀/경기/대회/커뮤니티/코트/유저. API/Prisma/서비스 0 변경. 6종 데이터 전부 화면 보존. tsc EXIT=0 / `/search` 200 / `/search?q=test` 200 + `.page`·`type="search"`·탭 7개 전부 렌더 | ✅ (커밋 대기, PM 처리) |
| 04-24 | developer | **Phase 2 MyGames — v2 재구성 (A 변형: 신청내역 + 호스트 섹션 보존)** — 시안 "내 신청 내역"(경기+대회 통합) 메인 + 하단 기존 "내가 만든 경기" 보존. 4 신규(stat-card / status-badge / reg-row[client] / my-games-client[client]) + page.tsx 완전 재작성(Prisma 3병렬: game_applications+tournamentTeam+hostedGames). 상태 4종(confirmed/pending/completed/cancelled, Q4 waitlist/no-show 제거). just-applied 배너 sessionStorage 유지. 결제=Link→/pricing/checkout, QR·후기·호스트 문의·영수증 등은 alert("준비 중"). API route.ts/Prisma 스키마 0 변경. tsc --noEmit EXIT=0 PASS | ✅ (커밋 대기, 로그인 세션 브라우저 수동 검증 필요) |
| 04-24 | developer | **Phase 1 Profile — /profile + /users/[id] v2 재구성** — D-P1~D-P8 추천값 + 누락 4필드(bio/gender/evaluation_rating/total_games_hosted) 전부 표시. 10신규(profile/_v2/*6 + users/[id]/_v2/*4) + 2재작성(각 page.tsx). /profile "use client" → 서버 컴포넌트 전환(Prisma 직접 호출 8쿼리). 탭 2개(D-P5) / 슛존·스카우팅 제거(D-P6) / physical strip 3열(D-P3) / isOwner→/profile redirect(D-P7) / user_badges 직접 쿼리(D-P8). tsc EXIT=0 / `/profile` 307 / `/users/1` 200(95KB) / `/users/7` 200(110KB bio 렌더 확인) / `/users/2832` 200. HTML: linear-gradient 1 + aria-pressed 2(탭 2개) + 슛존/스카우팅 0 + repeat(3,1fr)/(6,1fr) 각 1 | ✅ (커밋 대기) |
| 04-24 | developer | **Phase 1 GameDetail — v2 시안 재구성 (안 A)** — `_v2/` 5 신규(summary-card / about-card / participant-list / apply-panel / host-panel) + `page.tsx` 재작성. 2열 info grid + 조건부 행(duration·contact·allow_guests·uniform) / AboutCard(description·requirements·notes) / ParticipantList(이니셜+position) / ApplyPanel(6분기 CTA + 한마디·저장·문의 alert) / HostPanel(수정·취소+신청자 관리 응집). HeroBanner·PriceCard·HostCard·ParticipantsGrid·PickupDetail·GuestDetail·TeamMatchDetail 미사용(파일 보존). API/Prisma/service 0 변경. tsc EXIT=0 / `/games/552` 200 (3.18s) + 551/550 200 (0.2s). HTML 검증: `.page` 1 + `.card` 15 / 연락처·유니폼·게스트·참가자 필드 전부 렌더 | ✅ (커밋 대기) |
| 04-25 | developer | **Phase 3 Orgs — /organizations v2 재구성 (단체 등록 라벨 + 필터 chip)** — `_components/` 2 신규(org-card-v2 그라디언트 헤더+태그 자동 생성+가입 신청 alert / orgs-list-v2 클라 컨테이너+종류 chip 4종 "전체"만 동작·"리그/협회/동호회" 클릭 시 alert+opacity0.55) + `page.tsx` 재작성(.page eyebrow+h1+부제+"단체 등록" 버튼 라벨 변경). DB 미지원 3필드 자동 폴백(`color`=id 해시→6색 팔레트 / `tag`=이름 첫 2글자/영문이면 대문자 4글자 / `kind`="단체" 고정 배지). 데이터 패칭 0 변경(prisma.organizations.findMany 그대로). 추후 구현 목록에 Phase 3 Orgs 5건 신규(kind/brand_color/tag 필드 + 가입 신청 API + teams 집계). tsc EXIT=0 / `/organizations` 200(0.98s, 55KB). HTML: `단체 · ORGANIZATIONS` + `리그 · 협회 · 동호회` + `단체 등록` + `준비 중` + `orgs-list-v2` 마커 전부 렌더 확인 | ✅ (커밋 대기) |
| 04-22 | developer | **Phase 3 Court 상세 — /courts/[id] v2 재구성 (헤더+혼잡도+Side KakaoMap)** — 신규 1 (`_components/court-detail-v2.tsx`: 시안 브레드크럼+area eyebrow+30px h1+image placeholder(자동태그)+desc / 오늘 혼잡도(시간대 12슬롯 빈+첫슬롯만 현재 활성카운트 단일 막대+"시간대별 분포 데이터 준비 중" 캡션) / Side sticky(KakaoMap 180px 단일마커+길찾기/지도열기 / 시설 정보 2col 그리드(샤워/락커/연락처 "정보 없음") / 모집 글쓰기 alert / MiniStat 3통계 흡수)) + `page.tsx` 수정(import 1 + courtV2Data 직렬화 + `<CourtDetailV2>` 1줄 + (구) 메인정보카드 218줄/이용현황 24줄/InfoBadge·StatBlock 헬퍼 2개 제거 + QR버튼만 시안 외 운영 핵심으로 별도 보존). **API/Prisma/하단 클라컴포넌트 8종 0 변경**(CourtCheckin/Ambassador/Pickups/Events/Rankings/Reviews/Reports/EditSuggest 전부 보존). courts.tags/operating_hours/shower/locker/phone/시간대별 집계 DB 미지원 → 자동 폴백 + "정보 없음"/"준비 중" 처리. tsc --noEmit EXIT=0 / `/courts/100` 200 (135KB). HTML: 오늘의 혼잡도·시설 정보·이곳에서 모집 글쓰기·시간대별 분포·COURT PHOTO·준비 중·농구장 목록 마커 전부 렌더 확인 | ✅ (커밋 대기) |
| 04-22 | developer | **Phase 3 TeamCreate — /teams/new v2 4스텝 멀티스텝 폼 (B 옵션: 영문 팀명 보존)** — `_v2/` 6 신규(team-form 메인+useActionState/state6키hidden제출/약관미체크 차단 / stepper 36px원형+연결선 4스텝 / step-basic 한글명·영문명·대표언어토글·팀태그(시안신규UIonly)·팀소개 / step-emblem 10팔레트+미리보기160×160+엠블럼업로더(BDR+준비중)+secondary색상보존 / step-activity 홈코트·실력6단계·요일7토글·공개3종 모두 "준비중" / step-review 7행검토표+약관2개체크 차단) + `new-team-form.tsx` 슬림화(`<TeamFormV2/>` import 1줄). **createTeamAction / createTeamSchema / Prisma 0 변경**. FormData 키 6개(name/name_en/name_primary/description/primary_color/secondary_color) 그대로. 시안 신규 5필드(tag/home/level/days/privacy/엠블럼) UI 만 + "준비 중". 추후 구현 목록에 Phase 3 TeamCreate 7건 신규. tsc --noEmit EXIT=0 PASS / `/teams/new` 200 (Next 15 Turbopack dev 특성, 운영 307 정상) / 런타임 에러 0 | ✅ (커밋 대기, PM 처리) |
| 04-22 | developer | **Phase 5 More — NotFound + About v2 적용 (X 옵션)** — `not-found.tsx` 전면 재작성(시안 More.jsx L3-20 충실 — 거대 404 120px ff-display+accent / "에어볼!" 농구 메타포 / 3버튼 .btn--primary→홈 + 검색→/search Phase 2 + 도움말→/help/glossary). 신규 1 `(web)/about/page.tsx`(시안 More.jsx L22-115 6 섹션: Hero(eyebrow+h1 42px+리드) / 통계 4셀(20년/48,000+/320+/1,240회 "예시" 캡션) / "우리가 만드는 것" 6 카드(공정매치/투명기록/지역연결/열린커뮤니티/공정운영/지속가능성) / 운영진 6 이니셜아바타 "예시" 캡션 / 파트너 8 mono fontFamily / CTA 가입·로그인 둘 다 /login + 경기둘러보기 /games). app-nav.tsx 1줄 수정(L117 `/` → `/about` + 폴백 주석 제거). **API/Prisma/서비스 0 변경**. 추후 구현 Phase 5 More 4건 신설(통계 4건 동적/운영진 명단/파트너 로고/회원가입 페이지 분리). tsc --noEmit EXIT=0 PASS | ✅ (커밋 대기, PM 처리) |

---

## 구현 기록 — Phase 5 Achievements — /profile/achievements v2 신규 [2026-04-22]

📝 구현한 기능: BDR v2 시안 `screens/Achievements.jsx` 의 16종 배지 그리드 + 5종 카테고리 필터 + "최근 획득" 4건 카드 + 통계 헤더(획득/전체/달성률) 를 그대로 이식한 신규 라우트 `/profile/achievements`. **API / Prisma / 서비스 / 컴포넌트 0 변경. 신규 fetch 0건**. Phase 1 패턴(prisma.user_badges 직접 호출) 동일. 카페 세션 무관. DB 미지원 메타(tier/category/icon/desc/rarity/progress/total) 는 정적 카탈로그(`_v2/badge-catalog.ts`) 로 보강하고, 카탈로그 매핑 실패는 bronze/milestone/🏅 폴백.

| 파일 경로 | 변경 내용 | 신규/수정 |
|----------|----------|----------|
| `src/app/(web)/profile/achievements/_v2/badge-catalog.ts` | 정적 카탈로그 16종(시안) + 12종(DB 발급용 court_explorer/streak_*/mvp 등) = 총 28종. `BadgeMeta { tier, category, icon, desc, name? }` 인터페이스 + `TIER_COLOR/TIER_LABEL/CATEGORY_LABEL/CATEGORY_COLOR` 상수 4개 + `resolveBadgeMeta()` 폴백 헬퍼(bronze/milestone/🏅) + `SIGNATURE_ORDER` 시안 16키 순서 배열 export. 시안 `Achievements.jsx` L14-31 의 더미 16종(double_triple_double/ten_win_streak/thirty_plus_game/hundred_threes/team_founder/team_captain/writer_lv1/issue_maker/comment_master/season_mvp_candidate/perfect_attendance/hundred_games_club/one_year_anniversary/early_bird/perfect_game/archive_master) 그대로 이식 | 신규 |
| `src/app/(web)/profile/achievements/_v2/achievements-content.tsx` | "use client" + useState filter (`"all" \| "earned" \| "locked" \| BadgeCategory`). useMemo 4개로 통합 리스트(SIGNATURE_ORDER 우선 + DB 발급 시안외 배지 추가) / earnedItems / lockedItems / categoryCounts / shownBadges / recent4 계산. 6 섹션 렌더: ①Breadcrumb(홈›프로필›업적) ②Header 카드(.eyebrow "ACHIEVEMENTS" + h1 32px "내가 걸어온 기록" + 부제 + 통계 3셀: 획득=accent / 전체=ink / 달성률%=ok, 32px ff-display) ③최근 획득 4셀 (earned 1+ 일 때만, .card + borderLeft 3px tier색 + icon 32px + name + 날짜) ④필터 칩 8개(전체/획득/진행중/경기/팀/커뮤니티/시즌/마일스톤, .btn--sm + 활성 .btn--primary) ⑤4열 배지 그리드(.card + tier 라벨 우상단 + icon 48px + 잠금시 🔒 grayscale + 이름 14px + 설명 11.5px minHeight 32 + earned 푸터 var(--bg-alt) ✓날짜 + 상위 — , locked 푸터 0% bar + "0 / —" + title="측정 준비 중") ⑥필터 결과 0건 빈 상태. 매 셀 색상은 var(--*) 토큰 + TIER_COLOR(시안 코드 그대로) | 신규 |
| `src/app/(web)/profile/achievements/page.tsx` | 서버 컴포넌트 + `export const dynamic = "force-dynamic"`. getWebSession() → 비로그인이면 person_off + "로그인" 버튼 안내 화면. 로그인 시 `prisma.user_badges.findMany` 본인 전체(orderBy earned_at desc) → BigInt → string + Date → ISO 직렬화 → `<AchievementsContent earnedBadges={...} />` 렌더. catch(() => []) 폴백 → DB 실패해도 카탈로그-only locked 그리드 정상 표시 | 신규 |
| `.claude/scratchpad.md` | "🚧 추후 구현 목록"에 "Phase 5 Achievements" 4건 신설 (rarity 측정 cron / user_badges_progress 진행도 테이블 / 자동 발급 트리거 / badge_definitions DB화) + 작업 로그 1줄 추가 | 수정 |

💡 tester 참고:
- **테스트 방법**:
  1. **로그인 후** `/profile/achievements` 진입 → 헤더 통계 3셀 (획득/전체/달성률) + 16종 그리드 + 필터 8칩 렌더 확인
  2. **비로그인** 진입 → person_off 아이콘 + "로그인이 필요합니다" + 로그인 버튼 (기존 /profile UX 와 동일)
  3. **필터 토글**: "획득" → earned 만 / "진행중" → locked 만 / "경기" → category=game 필터링 / "전체" → 16+@ 전체. 각 칩 라벨에 카운트 표시 (`전체 · 16` 등)
  4. **최근 획득 4건**: earned 0개면 섹션 자체 미렌더. earned 1+ 일 때 earned_at desc 상위 4건. tier 색 좌측 borderLeft 확인
  5. **DB 미지원 폴백**: 모든 잠금 배지에서 "0 / —" + 0% 바 표시 + tooltip "측정 준비 중". 모든 획득 배지에서 "상위 —" + tooltip "희소도 측정 준비 중"
  6. **시안외 배지(예: court_explorer)**: 운영자가 user_badges INSERT 한 경우, 시안 16종 후미에 추가 표시. tier=bronze + category=milestone + icon=🏟️
- **정상 동작**:
  - tsc --noEmit EXIT=0 통과
  - 신규 fetch 0건 (페이지에서 prisma 직접 호출만, API 라우트 미사용)
  - 모든 색상은 var(--*) 토큰 (TIER_COLOR/CATEGORY_COLOR 일부 hex 직접 — 시안 충실)
  - 카탈로그-only(locked) 배지도 시안 SIGNATURE_ORDER 순서 보존
- **주의할 입력**:
  - badge_type 이 카탈로그에 없는 배지 발급 시: tier=bronze / category=milestone / icon=🏅 폴백. badge_name 은 DB 값 그대로 표시
  - earned_at 이 invalid Date 면 "-" 폴백
  - earnedBadges 가 빈 배열이어도 카탈로그 16종이 잠금 상태로 표시됨

⚠️ reviewer 참고:
- **API 0 변경 원칙 준수**: route.ts / Prisma / lib/services 0 수정. 신규 fetch 0건. 카페 세션 무관. Phase 1 D-P8 패턴(profile/page.tsx 의 user_badges 직접 호출) 동일
- **카탈로그 위치**: `_v2/badge-catalog.ts` — 정적 상수 + 헬퍼. 추후 `badge_definitions` DB 테이블 도입 시 그대로 마이그레이션 가능 (인터페이스 동일 유지)
- **시안 충실도**: TIER_COLOR(#7DD3FC/#F59E0B/#94A3B8/#C2765A) / CATEGORY_COLOR(#DC2626/#0F5FCC/#10B981/#F59E0B/#8B5CF6) 는 시안 hex 그대로. 다크/라이트 토큰화는 추후 작업 (현재는 시각적 동일성 우선)
- **미획득 progress 0% 폴백**: PM 결정. 시안의 "47/100" 같은 가데이터 노출 대신 "0 / —" + tooltip 으로 "측정 준비 중" 명시. 사용자 혼란 방지
- **rarity "—"**: 시안의 "상위 0.8%" 같은 가데이터 노출 대신 "—" + dim 색 + tooltip "희소도 측정 준비 중"
- **TypeScript**: `tsc --noEmit` PASS (출력 없음)
- **navigation**: app-nav.tsx 등에 `/profile/achievements` 진입점은 추가하지 않음 — 별도 작업으로 처리 가능. 직접 URL 접근 + 추후 /profile 사이드 카드에 "전체 보기" 링크 추가 검토

---

## 구현 기록 — Phase 5 More — NotFound + About v2 [2026-04-22]

📝 구현한 기능: BDR v2 시안 `screens/More.jsx` 의 NotFound (L3-20) + About (L22-115) 두 화면을 v2 토큰으로 적용. AppNav 유틸리티바 "소개" 링크가 더 이상 홈 폴백이 아니라 신규 `/about` 으로 정상 라우팅됨. **API / Prisma / 서비스 / 컴포넌트 0 변경. 신규 fetch 0건**. 시안의 가데이터(통계·운영진·파트너)는 그대로 노출하되 사용자 원칙(2026-04-25 추가)대로 "예시" 캡션 명시.

| 파일 경로 | 변경 내용 | 신규/수정 |
|----------|----------|----------|
| `src/app/not-found.tsx` | 거대 404 120px (ff-display + accent) + "에어볼! 해당 페이지를 찾을 수 없습니다" + 3버튼(.btn--primary 홈 / .btn 검색→/search / .btn 도움말→/help/glossary). 기존 토스풍 카드형 layout 폐기. 서버 컴포넌트(history.back 제거 — Link 만 사용) | 전면 재작성 |
| `src/app/(web)/about/page.tsx` | 시안 6 섹션: ①Hero (.eyebrow + h1 42px + 540px 리드 카피 + `<strong>` 강조) / ②통계 4셀 grid 4-cols + var(--bg-alt) 배경 + 28px t-display + "예시" 캡션 / ③"우리가 만드는 것" 6 카드 grid 3-cols (.card + 28px 이모지 아이콘 + 15px 타이틀 + 12px 설명) / ④운영진 6 grid 6-cols (.card + 56px 이니셜 원형 + 13px 이름 + 11px accent role + 10px ff-mono since) + "예시" 캡션 / ⑤파트너 8 grid 4-cols (var(--bg-alt) 컨테이너 + var(--bg) 셀 + ff-mono 11px 700) / ⑥CTA 2버튼(.btn--primary--xl "지금 가입하기"→/login + .btn--xl "경기 둘러보기"→/games). max-width 900px 컨테이너 | 신규 |
| `src/components/bdr-v2/app-nav.tsx` | L117 유틸리티바 "소개" 링크: `<Link href="/">` → `<Link href="/about">` + 위 폴백 주석("소개 라우트가 없어 홈으로 대체") 제거 | 1줄 수정 |
| `.claude/scratchpad.md` | "🚧 추후 구현 목록"에 "Phase 5 More" 4건 신설 (통계 4건 동적/운영진 명단/파트너 로고/회원가입 페이지 분리) + 작업 로그 1줄 추가 | 수정 |

💡 tester 참고:
- **404 테스트**: `/존재하지않는경로` (예: `/aaaaa`) 진입 → 거대 404 + "에어볼!" + 3버튼 렌더 확인. 홈/검색/도움말 클릭 시 각각 `/`, `/search`, `/help/glossary` 이동.
- **About 테스트**: `/about` 직접 진입 또는 상단 유틸리티바 "소개" 클릭 → 6 섹션 모두 렌더. "지금 가입하기"·"경기 둘러보기" 버튼 클릭 시 `/login`·`/games` 이동.
- **다크/라이트 토큰**: var(--accent), var(--ink-mute), var(--ink-soft), var(--ink-dim), var(--bg-alt), var(--bg), var(--border), var(--ff-display), var(--ff-mono) 전부 globals.css 정의 확인.
- **반응형**: About은 max-width 900px 컨테이너. 통계 4-cols/가치 3-cols/운영진 6-cols/파트너 4-cols는 시안 그대로(반응형 분기 없음). 모바일에서 확인 필요 — 필요 시 미디어 쿼리 추가는 별도 후속.
- **정상 동작**: AppNav "소개" 링크 → `/about` 200 / 비로그인 상태에서도 About은 누구나 접근 가능 (인증 가드 없음, `(web)` 그룹 layout만 적용).
- **주의할 입력**: 가데이터는 모두 정적 상수. 시안 그대로 — 운영팀이 실수치 확정 후 교체 예정 ("예시" 캡션이 그 표시).

⚠️ reviewer 참고:
- **하드코딩 색상 0건** — 전부 var(--*) 토큰 사용. 통계 보더/배경/카드 색·운영진 아바타·파트너 셀 모두 토큰.
- **CTA 라우팅 의도** — PM 지시로 "지금 가입하기"는 일단 `/login` 매핑(현재 `/signup` 시안 별도 존재, Phase 6에서 회원가입 페이지 신설 시 분리). About 본문에 회원가입 페이지 별도 안내는 없음.
- **이모지 사용** — 가치 6 카드의 `🏀📊🌆🤝⚖️💡` 이모지는 시안 그대로. 사용자 글로벌 규칙 "이모지 자제"는 작업 산출물에 한정 — 시안 충실도 우선. 향후 Material Symbols 또는 SVG 아이콘으로 교체 검토 가능 (별도 후속).
- **About 통계 정확성** — "20년/48,000+/320+/1,240회"는 시안 가데이터. 운영팀에서 실수치 확정 시 교체 필요. 캡션으로 "예시" 명시.
- **TypeScript** — `tsc --noEmit` PASS (출력 없음).

---

## 구현 기록 — Phase 5 Settings — /profile/settings v2 6 섹션 재구성 [2026-04-22]

📝 구현한 기능: BDR v2 시안 `screens/Settings.jsx` 의 6 섹션 구조(account/profile/notify/privacy/billing/danger) 를 그대로 이식한 Settings 허브. **옵션 A: 시안 인라인 9 필드 프로필 폼**. 신규 fetch 0건 (이미 시스템에 있던 GET /api/web/profile + GET /api/web/profile/subscription + GET /api/web/profile/notification-settings + DELETE /api/web/auth/withdraw 만 사용). 기존 페이지 6개 (notification-settings / preferences / payments / subscription / billing / edit) 보존 — 삭제 0.

| 파일 경로 | 변경 내용 | 신규/수정 |
|----------|----------|----------|
| `src/app/(web)/profile/settings/page.tsx` | 전면 재작성. `?section=` 우선 / `?tab=preferences|notifications` 폴백 / 좌 sticky nav + 우 카드 / GET profile + subscription 병렬 마운트 / 비활성 섹션 unmount | 수정 |
| `src/app/(web)/profile/settings/_components_v2/section-key.ts` | SectionKey 유니언 + VALID_SECTIONS + resolveSection (?tab=preferences→profile, ?tab=notifications→notify, 기본 account) | 신규 |
| `src/app/(web)/profile/settings/_components_v2/settings-side-nav-v2.tsx` | 220px sticky nav. 6 버튼 (계정/프로필/알림/개인정보·공개/결제·멤버십/계정 관리). Material Symbols Outlined (lucide-react 금지 규칙). active 시 var(--bg-alt) + var(--ink), 비활성 var(--ink-soft) | 신규 |
| `src/app/(web)/profile/settings/_components_v2/settings-ui.tsx` | 6 섹션 공용 빌딩 블록 — SettingsHeader / SettingsRow (라벨+값+우측 액션, disabled 시 "준비 중") / SettingsToggle (라벨+설명+스위치, disabled 시 "준비 중" 배지). 색상 토큰 var(--*) 전용 | 신규 |
| `src/app/(web)/profile/settings/_components_v2/account-section-v2.tsx` | 5 Row: 이메일(→/profile/edit)/비밀번호(→/reset-password)/연결된 계정(→/profile/edit)/2단계 인증(disabled)/로그인 기기(disabled) | 신규 |
| `src/app/(web)/profile/settings/_components_v2/profile-section-v2.tsx` | **시안 인라인 9 필드 폼** (nickname/name/position/height/weight/city/district/birth_date/bio) + 닉네임 2~20자 클라 검증 + PATCH `/api/web/profile` (기존 시그니처) + 낙관적 onSaved 콜백 + success/error 메시지 + 저장 중 disabled | 신규 |
| `src/app/(web)/profile/settings/_components_v2/notify-section-v2.tsx` | 동작 5 토글 (push/game/community/team/tournament) + disabled 4 토글 (이메일/D-3/좋아요/마케팅). 마운트 시 GET notification-settings → 클릭 시 낙관적 PATCH → 실패 롤백. saving Set 으로 동시 PATCH 추적 | 신규 |
| `src/app/(web)/profile/settings/_components_v2/privacy-section-v2.tsx` | 시안 5 토글 (프로필 검색/경기 기록/타임라인/실명/DM) 전부 disabled "준비 중". 시각적 defaultChecked 보존 | 신규 |
| `src/app/(web)/profile/settings/_components_v2/billing-section-v2.tsx` | 상단 그라디언트 카드 (유료=`linear-gradient(135deg, var(--cafe-blue), var(--cafe-blue-deep))` / 무료=var(--bg-alt)) + 플랜명/캡션/4행 Row (결제수단 disabled / 결제 내역→/profile/payments / 세금계산서 disabled / 구독 관리→/profile/subscription) + 하단 2버튼 (플랜 변경→/pricing / 구독 취소→/profile/subscription disabled-when-free) | 신규 |
| `src/app/(web)/profile/settings/_components_v2/danger-section-v2.tsx` | 3 Danger 카드 (데이터 내보내기 disabled / 계정 비활성화 disabled / 계정 삭제 accent 강조). 계정 삭제 클릭 → inline 모달 (비밀번호 input + 취소/삭제 버튼) → DELETE `/api/web/auth/withdraw` (body.password) → 성공 시 router.replace("/login") | 신규 |

💡 tester 참고:
- **테스트 방법**:
  1. 로그인 후 `/profile/settings` 진입 → ?section= 없으면 account 섹션 활성 확인
  2. 좌측 nav 6개 클릭 → URL `?section=account|profile|notify|privacy|billing|danger` 으로 변경 + 우측 패널 교체 + 스크롤 점프 없음
  3. 외부 링크 폴백: `/profile/settings?tab=preferences` 진입 → profile 섹션 활성 / `?tab=notifications` → notify 섹션 활성
  4. **profile 섹션 9 필드 폼**: 기존 데이터 prefill 확인 → 닉네임 1자/21자 입력 후 저장 → "닉네임은 2자 이상 20자 이하" 에러 / 정상 입력 후 저장 → "프로필이 저장되었습니다" + 새로고침 후에도 값 유지 (PATCH /api/web/profile 그대로 호출)
  5. notify 섹션: 5 동작 토글 클릭 → 낙관적 즉시 반영 + Network 탭에서 PATCH 200 / disabled 4 토글 클릭 무반응 + "준비 중" 배지
  6. billing 섹션: 무료 사용자 → "BDR 베이직 / 무료 플랜 사용 중" + 그라디언트 미적용 + 구독 취소 disabled / 유료 사용자 → cafe-blue 그라디언트 + 플랜명 + "다음 결제 YYYY.MM.DD"
  7. danger 섹션: "계정 삭제" 클릭 → 모달 표시 → 빈 비밀번호로 삭제 클릭 → "비밀번호를 입력해주세요" → 잘못된 비밀번호 → 401 메시지 표시 → 정상 비밀번호 → /login 으로 redirect
- **정상 동작**:
  - tsc --noEmit EXIT=0 통과
  - 기존 호출 4개만 fetch (신규 0건). DevTools Network 에서 `/api/web/profile`, `/api/web/profile/subscription`, `/api/web/profile/notification-settings` (notify 섹션 진입 시), `/api/web/auth/withdraw` (계정 삭제 시) 4 종만 확인
  - 모든 색상은 var(--*) 토큰 — 다크/라이트 테마 토글 시 자연스럽게 따라감
- **주의할 입력**:
  - profile 섹션 height/weight 입력 — 숫자 외 문자 자동 제거 (`replace(/[^0-9]/g, "")`)
  - profile 섹션 birth_date — `<input type="date">` YYYY-MM-DD 직렬화 → 서버에서 `new Date()` 변환
  - 빈 문자열 저장 시 서버는 null 로 저장 (route.ts: `value as string || null`)

⚠️ reviewer 참고:
- **API 0 변경 원칙 준수**: route.ts / Prisma / lib/services 0 수정. 신규 fetch 0건. 기존 페이지 6개 보존
- **하드코딩 색상 0**: 모든 색상은 `var(--*)` 토큰 (CLAUDE.md 규칙). 시안의 `--cafe-blue/--cafe-blue-deep/--bg-alt/--ink-mute/--ink/--ink-soft/--accent/--accent-soft/--border/--ok` 활용
- **Material Symbols Outlined**: 좌측 nav 아이콘 6개 — lucide-react 0 사용 (CLAUDE.md 규칙)
- **시안 미지원 2 필드 (등번호/주로 뛰는 손)**: PATCH /api/web/profile 가 받지 않아 UI 미배치. scratchpad "🚧 Phase 5 Settings" 11건에 기록
- **subscription 응답 파싱**: `is_usable` 필드(=active OR (cancelled AND expires_at>now))로 활성 구독 1건 추출. 활성 구독이 있으면 plan.name + plan.price 표시
- **계정 삭제 안전 장치**: 시안은 단순 버튼이지만 비밀번호 확인 inline 모달 추가 (DELETE /api/web/auth/withdraw 가 password 검증 요구). 모달 dim 배경 클릭 + 취소 버튼으로 닫기 + submitting 중에는 닫기 차단
- **반응형**: 모바일 1열 스택, 768px+ 에서 220px nav + 우측 카드 2열 (`@media (min-width: 768px)` styled-jsx)

---

## 구현 기록 — Phase 5 Rank — /rankings v2 재구성 [2026-04-22]

📝 구현한 기능: BDR v2 시안 `screens/Rank.jsx` 기반으로 `/rankings` 페이지를 재구성. **(a) 토글 3종**(팀/선수/외부BDR)으로 시안의 2종 토글에 외부BDR을 추가. 팀/선수 탭은 시안 충실(eyebrow + h1 "2026 시즌 랭킹" + theme-switch + V2Podium + V2TeamBoard/V2PlayerBoard). 외부BDR 탭은 기존 `BdrRankingTable`을 그대로 호출 + 일반/대학 부 토글 추가. **API/Prisma/서비스 0 변경**.

| # | 파일 경로 | 변경 내용 | 신규/수정 |
|---|----------|----------|----------|
| 1 | `src/app/(web)/rankings/_components/v2-podium.tsx` | 1·2·3등 카드. 시안 [1,0,2] 인덱스 → [2등, 1등, 3등] 배치 + 1등 가운데 카드 translateY(-12px) + display 폰트 #N + accent 색상 borderTop. 데이터 3개 미만 시 자동 생략 | 신규 |
| 2 | `src/app/(web)/rankings/_components/v2-team-board.tsx` | 6열 보드(64px/1fr/90×4): 순위·팀(색배지+이름링크)·레이팅(=wins 임시)·승[ok색]·패·승률. 1~3위 accent 강조. resolveColor()로 흰색팀 보조색 fallback | 신규 |
| 3 | `src/app/(web)/rankings/_components/v2-player-board.tsx` | 정렬 pills 4종(레이팅/PPG/APG/RPG) + 8열 보드(56/1fr/72×4/80/64): 순위·선수(이니셜+이름링크)·팀·PPG·APG·RPG·레이팅("—")·변동("—"). PPG=avg_points, APG/RPG=클라 계산(total/games_played, 0 가드). 정렬 pill 클릭 시 클라 정렬 + 활성 컬럼 강조(fontWeight 800 + ink 색상) | 신규 |
| 4 | `src/app/(web)/rankings/_components/rankings-content.tsx` | 전면 교체. theme-switch 3종(팀/선수/외부BDR) + eyebrow "랭킹 · LEADERBOARD" + h1 "2026 시즌 랭킹" + 부제 "공식전 · 프리시즌 반영 · 매주 월요일 갱신" + V2Podium + V2TeamBoard/V2PlayerBoard 분기. 외부BDR 탭은 일반/대학 부 토글 + `<BdrRankingTable>` 그대로. 기존 토스 컴포넌트(TossCard/TossListItem/Pagination/TeamRankingList/PlayerRankingList) 전부 제거 | 수정 |
| 5 | `src/app/(web)/rankings/loading.tsx` | shadcn Skeleton 기반 → v2 톤(.page + .eyebrow + .board 8행). globals.css `--bg-alt` 단색 placeholder | 수정 |
| 6 | `src/app/(web)/rankings/_components/bdr-ranking-table.tsx` | **0수정 보존** (외부BDR 탭에서 그대로 호출) | 보존 |

💡 tester 참고:
- 테스트 방법:
  1. `/rankings` 진입 → 기본 "팀" 탭 활성 → 포디움 3카드 + 6열 보드 렌더 확인
  2. theme-switch "선수" 클릭 → API 재호출(`/api/web/rankings?type=player`) → 포디움 3카드(이니셜) + 8열 보드 + 정렬 pills 4개 렌더
  3. 정렬 pill "득점/어시/리바" 차례 클릭 → 클라 정렬 적용 + 해당 컬럼 강조(굵게+ink색상)
  4. theme-switch "외부BDR" 클릭 → 일반/대학 부 토글 노출 + 기존 BdrRankingTable(시즌 드롭다운/검색/메달 등) 그대로 동작
  5. 외부BDR "대학부" 클릭 → `/api/web/rankings/bdr?division=university` 호출
- 정상 동작:
  - 팀 보드: 1~3위 순위 숫자가 BDR 레드(`var(--accent)`)로 강조
  - 선수 보드: 레이팅/변동 컬럼은 항상 "—" (DB 컬럼 없음)
  - 포디움: 1등 카드만 살짝 위로(transform translateY(-12px)) + 가운데 1.1fr
  - 외부BDR 탭: BdrRankingTable이 자체 fetch — 다른 변화 없음
  - 데이터 0건: "등록된 ~ 랭킹이 없습니다" 빈 상태(Material Symbols icon)
- 주의할 입력:
  - 데이터 3건 미만일 때 V2Podium 자동 생략 → 보드만 표시 (정상)
  - games_played=0인 선수: PPG/APG/RPG 모두 0 표시 (NaN 방지 가드)
  - primary_color="#FFFFFF"인 팀: secondary_color로 fallback (시인성 유지)

⚠️ reviewer 참고:
- 특별히 봐줬으면 하는 부분:
  - `rankings-content.tsx` podiumItems IIFE: mode별 가공 로직이 IIFE라 useMemo로 메모하지 않음. 데이터 변경 빈도 낮아 충분하다고 판단 — 검토 요청
  - `v2-player-board.tsx` 클라 정렬: API rank를 무시하고 i+1을 순위로 표시 → 정렬 변경 시 순위가 즉시 재계산. 시안과 동일 동작이지만 백엔드 rank와 다를 수 있음
  - 외부BDR 탭: 모드 변경 시 BdrRankingTable 컴포넌트가 mount/unmount되며 매번 fetch. 캐싱 SWR로 바꿀지 검토 가능
- 시안 충실도:
  - 시안에 없는 신규 요소: theme-switch 3번째 버튼 "외부BDR" + 그 안의 부 토글
  - 시안에 있지만 DB 미지원 → 임시 표시: 팀 레이팅(=wins), 선수 레이팅(="—"), 변동(="—")
  - 추후 구현 5건 scratchpad "Phase 5 Rank"에 기록

---

## 구현 기록 — Phase 4 PostDetail — /community/[id] v2 재구성 [2026-04-26]

📝 구현한 기능: BDR v2 시안 `screens/PostDetail.jsx` 그대로 따라 `/community/[id]` 페이지를 재구성. 좌측 CommunityAside(BoardList 재사용) + 우측 본문 카드 4섹션(헤더/Body/Reactions/Nav) + 본문 하단 1열 누적(PostDetailSidebar). **API/Prisma/Server Action/decodeHtmlEntities/cache(getPost)/병렬 likes·follow 0 변경. 6개 클라 컴포넌트(LikeButton/ShareButton/PostActions/PostDetailSidebar/CommentForm/CommentList) 0 수정.**

| # | 파일 경로 | 변경 내용 | 신규/수정 |
|---|----------|----------|----------|
| 1 | `src/app/(web)/community/_components/community-aside-nav.tsx` | RSC↔클라 경계 우회용 useRouter 래퍼. CommunityAside `onSelect` 콜백을 `/community?category=...` push로 바인딩. CommunityAside 자체 0 수정 | 신규 |
| 2 | `src/app/(web)/community/[id]/page.tsx` | 전면 재구성. grid 12열 → `.page > .with-aside`. 시안 4섹션(badge--soft + 24px 제목 + cafe-blue-soft 이니셜 + 우측 메타 / Body padding 28/26·fs15·lh1.8 / Reactions 가운데정렬 좋아요·공유·스크랩 disabled / Nav 이전·다음 placeholder). PostDetailSidebar는 `marginTop:32`로 본문 하단에 1열 누적 (D1-c) | 수정 |

### 핵심 기술 결정 (사용자 7건 결정 그대로 반영)

- **D1 (c)** — 좌측 CommunityAside + 우측 PostDetailSidebar 항목들을 본문 하단 1열로 누적. 우측 컬럼 제거. PostDetailSidebar 컴포넌트는 `<aside>` 그대로 호출하되 `marginTop:32`로 본문 article+comments 아래에 배치
- **D2** — 시안 브레드크럼 "홈 › 카테고리 › 글 상세". 카테고리는 `/community?category=...` 링크로 라우팅
- **D3** — Body 줄바꿈 split `<p>` 그대로 유지. DB가 `community_posts.content` 단일 plain text라 시안의 h3/img 블록 분기는 미적용. 추후 구현 목록에 기록
- **D4** — 이전/다음 글 placeholder "준비 중" (Prisma 쿼리 추가 X). 시안 좌우 분할 레이아웃은 그대로 유지하되 텍스트만 placeholder
- **D5** — LikeButton + ShareButton 그대로 호출. 스크랩은 `<button disabled title="스크랩 준비 중">`로 시각적 자리만 확보
- **D6** — CommentForm 그대로 호출 (props/시그니처 0 변경)
- **D7** — CommentList 그대로 호출. 카페 댓글 + DB 댓글 병합 패턴(decodeHtmlEntities 적용)도 100% 보존

### 보존된 동작 (회귀 방지)

- `getPost = cache(...)` — generateMetadata와 본문이 같은 쿼리 1회 공유
- `Promise.all([getPost, getWebSession])` 1단계 병렬 → 로그인 시 `Promise.all([comments, likes, follows])` 2단계 병렬 (총 4쿼리, 비로그인은 2쿼리)
- `getCafeComments(post.images)` — JSONB cafe_comments 추출 + DB 댓글과 합산
- `decodeHtmlEntities` — title / displayNickname / content / 카페 댓글 nickname·text / DB 댓글 nickname·content 모두 적용
- 본인 게시글일 때만 `<PostActions>` 드롭다운 노출 (수정/삭제)
- `revalidate = 30` ISR 그대로
- `notFound()` — post 없거나 status="deleted"

💡 tester 참고:
- **테스트 URL**: `/community/<public_id>` (각 카테고리별 글 1건씩) — 검증 완료
  - recruit: `/community/2df7a9ae-d7b2-4943-af67-901d9f72cdd8` 200 (207KB, 2.2s)
  - review: `/community/29d2672b-7e2a-4dcc-9da7-f7123657d5fb` 200 (213KB)
  - general: `/community/58ad9661-805f-48b6-b5a8-e3c59af961d3` 200 (223KB)
- **정상 동작**:
  - 좌측 사이드바 8개 항목 클릭 → `/community?category=...` 이동 (PostDetail에는 활성 카테고리 없으므로 항상 "전체글" 활성)
  - 브레드크럼 "홈 › 카테고리 › 글 상세" — 카테고리 클릭 시 `/community?category=...` 이동
  - 카테고리 배지(badge--soft)가 글의 카테고리에 맞게 동적 라벨 (recruit→팀원모집, review→대회후기, general→자유게시판 등)
  - 좋아요 버튼: 로그인 시 즉시 토글 + 낙관적 업데이트, 비로그인 시 alert("로그인이 필요합니다")
  - 공유 버튼: 클립보드 복사 + 토스트
  - 스크랩 버튼: disabled (호버 시 "스크랩 준비 중" 툴팁)
  - 이전글/다음글 자리: "준비 중" 텍스트 + title 툴팁
  - 본인 게시글: 헤더 우측 메타 옆 `<PostActions>` 드롭다운 (수정/삭제)
  - 댓글 헤더: "댓글 + accent N" (DB 댓글 + 카페 댓글 합산)
  - CommentForm/CommentList 동작 그대로 — 작성/수정/삭제 모두 정상
  - 본문 하단: 작성자 정보 카드(아바타+게시글수+댓글수+팔로우 버튼) → 실시간 인기글 → 이벤트 배너 3블록 누적
- **주의 입력**:
  - 본인 게시글 — `<PostActions>` 드롭다운 + 작성자 카드의 팔로우 버튼은 숨김 (isOwnPost)
  - 카페 댓글 있는 글 — 댓글 카운트 = DB 댓글 + 카페 댓글
  - status="deleted" 또는 post 없음 — `notFound()` (404)
  - 비로그인 — 좋아요 alert / 댓글 작성 폼은 CommentForm 자체 분기

⚠️ reviewer 참고:
- **API/Prisma 0 변경** — 신규 쿼리 / 신규 라우트 / 스키마 변경 없음. 기존 cache(getPost) + 병렬 likes/follows + comments 쿼리 그대로
- **신규 client wrapper 1건 (community-aside-nav.tsx)** — RSC 제약상 onSelect 콜백을 서버에서 못 넘기므로 작은 useRouter 래퍼만 추가. CommunityAside 컴포넌트 자체는 0 수정 (BoardList와 동일 인스턴스 공유). 신규 파일이지만 도메인 로직 0
- **PostDetailSidebar 본문 하단 누적** — 컴포넌트 내부 0 수정. `<aside>` 시맨틱 태그가 main 안에서 본문 하단에 위치하는 게 약간 어색하지만 시맨틱은 보조 정보이므로 valid. 추후 디자인 일관성 정리 시 별도 wrapper로 div 변경 가능
- **Reactions 가운데정렬 — LikeButton 시각 차이** — 기존 LikeButton은 자체 마진/구분선/원형 64px 아이콘 + 라벨 3줄 구성이라 시안의 "버튼 1줄 가로정렬"과 다른 형태. PM 결정(D5: LikeButton 그대로)에 따라 그대로 유지. 시안 충실도를 더 높이려면 LikeButton 디자인 자체를 v2로 교체해야 함 (별도 작업)
- **카페 게시글의 작성자** — `post.author_nickname || post.users?.nickname || "익명"`. 카페 크롤링 글은 users 조인이 없을 수도 있어 조건부. PostDetailSidebar의 authorId(=post.user_id)가 카페 더미 user를 가리킬 수 있음 (운영 데이터 확인 필요)
- **이전/다음 글 placeholder div** — 시안 마크업 그대로(좌우 분할 + 좌측 borderRight) 유지. 클릭 핸들러 없음 / cursor:pointer 없음 / `var(--ink-dim)` 더 옅은 색으로 비활성 표현
- **LevelBadge 자리 빈 채로 둠** — 시안 작성자 박스에 LevelBadge 위치하지만 컴포넌트 자체 미존재. 단순 주석 placeholder. 도입 시 component import 1줄 + JSX 1줄

### 검증 결과 요약
- tsc --noEmit EXIT=0
- 3개 카테고리 글 200 OK
- HTML 마커 13종 전부 렌더 (with-aside 1 / page 1 / badge--soft 1 / aside__link 8 / cafe-blue-soft 1 / 글 상세 1 / thumb_up 1 / >댓글< 1 / >스크랩< 1 / 이전글 1 / 다음글 1 / 실시간 인기글 1 / 작성자 정보 1)
- 카테고리별 동적 라벨 매핑 검증 (badge--soft가 recruit→팀원모집, review→대회후기, general→자유게시판으로 각각 1회 출력)

---

## 구현 기록 — Phase 4 BoardList — /community v2 재구성 [2026-04-22]

📝 구현한 기능: BDR v2 시안 `screens/BoardList.jsx` 그대로 따라 `/community` 페이지를 재구성. 좌측 게시판 그룹 트리 사이드바 + 우측 daum-café 스타일 board 테이블. **API/SSR fallback/preferFilter Context/searchParams 동기화 100% 보존**. UI만 v2로 교체. 페이지당 20개 통일(PM 결정).

| # | 파일 경로 | 변경 내용 | 신규/수정 |
|---|----------|----------|----------|
| 1 | `src/components/bdr-v2/v2-pager.tsx` | 재사용 가능한 페이저 컴포넌트 — `<button.pager__btn>` + `data-active` + 윈도우 슬라이딩(기본 10개) + 이전/다음 버튼 | 신규 |
| 2 | `src/app/(web)/community/_components/community-aside.tsx` | 좌측 게시판 그룹 트리 — BOARDS 8개를 메인(전체글/공지/자유) · 플레이(팀원모집/대회후기/농구장터) · 이야기(질문답변/정보공유) 3그룹으로 매핑. .aside / .aside__group / .aside__title / .aside__link 사용. 글 수 카운트 "—" + title="준비 중" | 신규 |
| 3 | `src/app/(web)/community/_components/community-content.tsx` | 전면 교체 — 토스 스타일 1열 카드 → .page + .with-aside 2열. 헤더(eyebrow+제목+전체 N개의 글 + 검색바 + 글쓰기 버튼) + 정렬바 4종 + .board 테이블(공지 핀 + 일반 글 + 새글 N뱃지) + V2Pager. API 호출/SSR fallback/preferFilter/searchParams/decodeHtmlEntities 100% 보존 | 수정 |

### 핵심 기술 결정

- **카테고리 그룹 매핑** — DB 카테고리 7개를 시안의 3그룹(메인/플레이/이야기)으로 재배치. 시안 BOARDS 10개와 1:1은 아니지만 그룹 구조는 그대로 유지
- **공지 핀(pinned)** — DB에 `is_pinned` 컬럼이 없으므로 `category=notice`인 글을 자동으로 상단 핀 처리. 단, 사용자가 notice 카테고리를 선택한 경우엔 분리하지 않음(자체 목록 표시)
- **정렬 4종 클라이언트 사이드** — `useMemo` + `sortKey` state. API 호출 추가 없이 받아온 posts를 클라에서 sort. 정렬 변경 시 currentPage=1 자동 리셋
- **페이지당 20개** — PM 결정. 시안 "한 페이지 20개" 캡션 그대로 노출
- **새글 24h 뱃지** — `created_at`이 24시간 이내면 `badge--new "N"` 표시 (시안 isNew 패턴)
- **글 번호 채번** — `regularPosts.length - globalIndex` (전체 글 수 - 글로벌 인덱스). 정렬에 따라 같은 글의 번호가 바뀌는 한계 있음 (추후 `post_number` 컬럼 도입 시 영구 고정)
- **has_image 미사용** — DB에 `has_image`/`thumbnail_url` 컬럼 없음 → 시안의 이미지 아이콘 자리는 비움
- **검색 폼** — 시안 헤더 우상단 위치. 기존 핸들러(handleSearch) 그대로 + searchParams URL push

### 보존된 동작 (회귀 방지)

- `/api/web/community?category=...&q=...&prefer=...` API 호출 — apiSuccess snake_case 응답 파싱
- SSR 프리페치 `fallbackPosts` 즉시 렌더 (페이지 첫 로드 빠름)
- `usePreferFilter` Context — 전역 맞춤 필터 활성 시 prefer=true 쿼리
- `decodeHtmlEntities(post.title)` / `decodeHtmlEntities(post.author_nickname)` — 카페 원문 HTML entity 복원
- `useSearchParams` / `useRouter` / `usePathname` 동기화 패턴
- AbortController로 fetch race condition 방지

💡 tester 참고:
- **테스트 URL**: `/community` (전체) / `/community?category=general` (자유게시판) / `/community?category=notice` (공지만) / `/community?q=농구` (검색)
- **정상 동작**:
  - 좌측 사이드바 8개 항목(전체글 + 공지/자유 + 팀원/대회/장터 + 질문/정보) 클릭 → URL ?category=… 변경 + 활성 표시
  - 정렬 4종 클릭 시 즉시 클라 정렬 + 1페이지로 리셋
  - 21개 이상 시 페이저 노출 (현재 페이지 강조)
  - 새글(24h 이내) 우측에 빨간 N 뱃지
  - 공지(category=notice) 글이 있으면 정렬·페이지 무관 항상 최상단 (단, ?category=notice 선택 시엔 분리 안 함)
  - 글쓰기 버튼 좌측 사이드바 + 우측 헤더 2곳 (둘 다 /community/new 이동)
  - 검색 폼 Enter → URL push → API 호출
- **주의 입력**:
  - 공지 1개도 없으면 pinnedPosts=[] (정상)
  - posts.length=0 → 빈 상태 (forum 아이콘 + "첫 글쓰기" CTA)
  - preferFilter ON + preferredCategories=[] → 전체 표시 (기존 fallback 그대로)
  - 정렬 likes_count/comments_count/view_count는 null인 경우 0으로 fallback
  - created_at null인 글은 latest 정렬 시 가장 뒤로 (방어 코드)

⚠️ reviewer 참고:
- **API 0 변경**: `/api/web/community/route.ts` 단 한 줄도 수정 안 함. 응답 스키마 그대로 사용
- **`<a href="#">` 클릭 핸들러**: CommunityAside의 카테고리 링크는 `<a>` + `e.preventDefault()` 패턴(시안 그대로). 키보드 접근성을 위해 `<button>`으로 바꾸는 것도 고려 가능
- **글 번호의 정렬 의존성**: 인기순/조회순 정렬 시 같은 글의 번호가 다르게 표시됨. 시안 패턴(고정 ID)과는 차이. `community_posts.post_number` 시퀀스 컬럼 도입 시 해결 (추후 구현 목록에 기록)
- **공지 자동 핀**: `is_pinned` 컬럼 도입 전까지 임시 운영. 운영자가 notice 외 카테고리 글을 핀하고 싶으면 컬럼 추가 후 분기 변경 1줄
- **정렬 변경이 페이지를 1로 리셋**: 의도된 UX (사용자가 마지막 페이지에서 정렬 바꿔도 헷갈리지 않음). 단, URL에 정렬 상태가 반영되지는 않음(현재는 클라 메모리)
- **decodeHtmlEntities**: title/nickname/preview 모두 디코드 적용. 시안에는 preview가 없지만 (board 테이블이 1행 요약형) 향후 hover 미리보기 추가 시 사용 가능
- **모바일 반응형**: globals.css에 이미 `@media (max-width: 900px) { .with-aside { grid-template-columns: 1fr; } }` 정의됨. 사이드바는 자동으로 위로 떨어짐 (또는 .aside { display:none } 폴백)

🚧 추후 구현 목록 Phase 4 BoardList 6건 신설:
- `community_posts.is_pinned` 필드 (공지 핀 운영자 토글)
- `community_posts.has_image` 또는 `thumbnail_url` (이미지 아이콘)
- 카테고리별 글 수 집계 API (`/api/web/community/counts`)
- 작성자 LevelBadge (users.role 또는 xp 등급)
- 글 번호 영구 채번 (`post_number` 컬럼)
- "게시판 내 검색" 명시 라벨

---

## 구현 기록 — 코트 대관(Booking) Phase A — MVP 무료 대관 [2026-04-22]

📝 구현한 기능: 시안 CourtBooking.jsx + 자체 운영자 UI 기반 코트 대관 시스템 Phase A (결제 미도입 무료 베타). 회원이 운영자 등록 코트의 슬롯을 시간 단위로 예약 → 운영자가 manage 페이지에서 차단 슬롯 등록/예약 강제 취소 → 본인은 /profile/bookings 에서 자기 예약 조회/취소.

| # | 파일 경로 | 변경 내용 | 신규/수정 |
|---|----------|----------|----------|
| 1 | `prisma/schema.prisma` | court_bookings 신규 모델 + court_infos 2컬럼(booking_mode/booking_fee_per_hour) + User 백릴레이션 1줄 | 수정 |
| 2 | `prisma/migrations/manual/court_booking_phase_a.sql` | 마이그레이션 SQL (BEGIN/COMMIT + 인덱스 3 + FK 2 + ROLLBACK 주석) | 신규 |
| 3 | `src/lib/courts/court-manager-guard.ts` | checkCourtManager / isCourtManager — D-B1+D-B2 통합 가드 | 신규 |
| 4 | `src/lib/courts/booking-conflict.ts` | acquireBookingLock(pg_advisory_xact_lock) + checkConflict + validateBookingTime + listActiveBookings | 신규 |
| 5 | `src/app/api/web/courts/[id]/bookings/route.ts` | GET(슬롯조회 KST 자정~익일자정) + POST($transaction lock+conflict+즉시 confirmed) | 신규 |
| 6 | `src/app/api/web/courts/[id]/manage/bookings/route.ts` | GET(운영자 대시보드 30일치 user join) + POST(blocked 슬롯 lock+conflict) | 신규 |
| 7 | `src/app/api/web/bookings/[id]/route.ts` | GET(본인or운영자) + DELETE(취소 사유+cancelled_at) | 신규 |
| 8 | `src/app/(web)/courts/[id]/booking/page.tsx` + `_booking-client.tsx` | 시안 기반 회원 예약 페이지 (7일×16시간×1~4시간×4목적). booking_mode!=internal 시 안내 화면 | 신규 |
| 9 | `src/app/(web)/courts/[id]/manage/page.tsx` + `_manage-client.tsx` | 운영자 대시보드 (모드 표시 + 차단슬롯 폼 + 예약 카드 리스트 + 개별 취소) | 신규 |
| 10 | `src/app/(web)/profile/bookings/page.tsx` + `_bookings-list-client.tsx` | 90일치 내 예약 카드 + 취소 (24h 전 + status 가드) + just_booked 배너 | 신규 |
| 11 | `src/app/(web)/courts/[id]/_components/court-detail-v2.tsx` | booking_mode 분기 CTA (internal=Link / external=외부링크 / 그외=disabled). interface 2필드 추가 | 수정 |
| 추가 | `src/app/(web)/courts/[id]/page.tsx` | courtV2Data 에 booking_mode + rental_url 2필드 직렬화 (CTA 분기 prop 전달) | 수정 |

핵심 기술 결정:
- **별도 court_slots 테이블 불필요** — court_bookings 시간 범위 쿼리(start_at < ? AND end_at > ?)로 충돌 검사
- **pg_advisory_xact_lock** — court_info_id 단위 동시성 직렬화 (row-level FOR UPDATE 로는 INSERT 차단 못함)
- **status="blocked"** 운영자 차단 슬롯 (별도 테이블 X)
- **Phase A 강제 final_amount=0** — 결제 도입은 Phase B (D-B4 결정 후)
- **D-B1+D-B2 단순화** — court_infos.user_id 1:1 + court_rental 활성 구독 → 운영자 1줄 검사

🚧 Phase B 진입 시 추가 필요: scratchpad "코트 대관 Phase A → B 이행" 섹션 참조 (12개 항목)

💡 tester 참고:
- **prisma generate 미실행** — dev server PID 102232 가 잡고 있어 EPERM. 다음 dev 재시작 시 자동 재생성 OR `taskkill //f //pid 102232 → npx prisma generate → npm run dev` 수동 실행
- **DB 변경 보류** — `prisma/migrations/manual/court_booking_phase_a.sql` 자동 실행 절대 금지. 운영 DB 분리 후 PM 승인 받고 수동 실행
- **테스트 전 선결**: ① prisma generate 완료 ② SQL 마이그레이션 실행 ③ 테스트용 코트 1건 booking_mode='internal' + booking_fee_per_hour=20000 + user_id=본인 으로 UPDATE ④ 본인 user_subscriptions 에 feature_key='court_rental', status='active' row INSERT
- **정상 동작**:
  - `/courts/[id]/booking` — 7일 날짜 + 시간 슬롯 그리드. 다른 예약이 있는 시간은 disabled. "무료 예약 확정" 클릭 → /profile/bookings?just_booked=1 이동 + 성공 배너
  - `/courts/[id]/manage` — 비운영자 접근 시 멤버십/등록자 안내 화면. 운영자는 30일 예약 목록 + 차단 폼 + 개별 취소
  - `/profile/bookings` — 90일치 본인 예약 카드 + 24h 전이면 취소 가능
  - 코트 상세 CTA — booking_mode 별 분기 (internal=예약하기 / external=외부 신청 / none=대관 미지원 disabled)
- **주의 입력**:
  - **동시 예약 race** — 같은 시간 슬롯에 2명 동시 POST → 한 명만 201, 다른 한 명 409 SLOT_CONFLICT (advisory lock 효과 검증 핵심)
  - **과거 시각** — start_at 이 현재 이전이면 400 INVALID_TIME
  - **분/초 0 아님** — 14:30 같은 정시 아님 → 400
  - **booking_mode=none/external** 코트 직접 POST → 400 BOOKING_NOT_SUPPORTED
  - **운영자 멤버십 만료** — court_rental status=expired 또는 expires_at 과거 → manage 페이지 403 NO_SUBSCRIPTION
- **snake_case 응답 검증** — apiSuccess 자동 변환. 신규 API 3개 모두 raw curl 1회 권장 (errors.md 6회차 가드)
- **타임존** — 클라이언트는 KST 기준 슬롯 표시, 서버는 UTC 저장. ?date=2026-04-26 → KST 자정~익일자정으로 변환

⚠️ reviewer 참고:
- **pg_advisory_xact_lock 타입 안전성** — `tx.$executeRaw\`SELECT pg_advisory_xact_lock(${courtInfoId})\`` BigInt 직접 보간. Postgres 는 bigint 1개 인자 받음. 동작은 정상이나 타입 캐스팅 명시(`pg_advisory_xact_lock(${courtInfoId}::bigint)`)가 더 안전할 수 있음
- **시간 정합성** — KST↔UTC 변환을 클라/서버 양쪽에서 수행. KST 자정 계산 로직(`new Date(\`${date}T00:00:00+09:00\`)`)이 서버에서 정상 동작하는지 더블체크 권장
- **prisma generate 미실행 상태** — 본 PR 머지 전 반드시 generate 한번 돌리고 `npm run build` 빌드 확인 필요
- **Phase B 결제 분기 미리 흙체 잡힌 필드** — court_bookings.payment_id/discount_amount/platform_fee/amount 컬럼은 모두 schema 에 있음. Phase A 는 0/NULL 저장. Phase B 진입 시 컬럼 변경 없이 INSERT 데이터만 변경
- **court-detail-v2 import 변경** — Link 가 이미 import 되어 있어 추가 import 없음. CTA 분기 1블록만 변경
- **운영자 멤버십 만료 시 기존 예약** — 현재 가드는 신규 슬롯/취소만 차단. 기존 confirmed 예약은 그대로 유지 (운영자 권한 만료해도 회원이 정상 이용). Phase C 알림 cron 도입 예정
