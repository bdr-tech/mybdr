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

### Phase 5 Awards (커밋 대기, 2026-04-22)
> 시안 Awards.jsx 의 시즌 셀렉터 + MVP Hero + 팀 레이팅 + Honor 6 + 올스타 1st/2nd + 역대 우승팀 v2 재구성 완료. `/awards` 신규 (글로벌 톱레벨, profile 하위 X). **API/Prisma 스키마/서비스 0 변경**. `prisma.tournament_series` / `prisma.tournament` / `prisma.tournamentMatch` / `prisma.matchPlayerStat` / 시즌 리더는 `$queryRaw + officialMatchWhere()` 직접 호출. 시즌 = `tournament_series` 1:1 매핑. DB 미지원 메타는 정적 카탈로그(`_v2/awards-catalog.ts`)로 보강.
- **`team_ratings` 테이블 + ELO 갱신 잡** — 시안 우상단 "올-시즌 팀 레이팅" 카드 5행. 현재 빈 placeholder + "집계 준비 중". 매주 ELO 재계산 cron + `teams.rating_current/rating_last_week` 또는 별도 `team_ratings` 시계열 테이블 도입 시 표시
- **`season_all_star_teams` 테이블 (포지션별 best 5)** — 시안 1st/2nd 팀 5포지션(PG/SG/SF/PF/C). 현재 모든 슬롯 "준비 중". 포지션별 시즌 평균 기준 자동 선정 알고리즘 + 운영자 보정 입력 가능 모델 (`season_all_star_teams: series_id+rank+position+player_id`)
- **`Team.coach_user_id` 컬럼 (올해의 감독)** — Honor 6 카드 중 "올해의 감독" 자리는 빈 카드 + "집계 준비 중". Team 에 코치 레퍼런스 컬럼 + 시즌 종료 시 우승팀 코치 자동 매칭 또는 운영자 수동 선정
- **`tournament_mvp_quotes` 테이블 (MVP 코멘트)** — 시안 MVP Hero 의 인용 영역. 현재 "수상 코멘트는 준비 중입니다." 폴백. 토너먼트별 MVP 코멘트 입력 폼 + 다국어 지원
- **`seasons` 테이블 별도 정의** — 현재 `tournament_series` 1:1 대체. 향후 시즌 라이프사이클(시작/종료일·번호) 모델이 series 와 분리되어야 한다면 신규 테이블. 현재는 series.created_at desc 로 정렬
- **NEW FACE 루키 식별 로직** — 시안 6번째 honor. 현재 빈 카드 + "집계 준비 중". 가입 6개월 이내 + 시즌 첫 출전 + 평균 N PPG 이상 등 조건 정의 후 자동 선정
- **Finals MVP 결승 식별 정밀화** — 현재 `roundName LIKE '%결승%' OR '%final%'` 휴리스틱 + 폴백으로 시즌 최신 mvp 매치. 정확한 식별 위해 `tournament_matches.is_final` BOOLEAN 또는 `bracket_level` 표준화 필요
- **시즌 변동(d:+48 등) snapshot** — 시안 우상단 카드 우측 "변동" 컬럼. 현재 "—" 폴백. team_rating_history 시계열 테이블 또는 시즌 시작/종료 snapshot 비교

### Phase 5 Saved (커밋 대기, 2026-04-22)
> 시안 Saved.jsx 7탭(전체/게시글/게시판/경기/대회/팀/코트) 중 DB 모델 존재하는 2종(게시판=`board_favorites`, 코트=`user_favorite_courts`)만 실데이터로 표시, 나머지 4탭은 "북마크 시스템 준비 중" 안내. `/saved` 신규(글로벌 톱레벨). **API/Prisma 스키마 0 변경**. 서버 컴포넌트에서 `prisma.board_favorites` / `prisma.user_favorite_courts` 직접 호출.
- **`community_post_bookmarks` 테이블** — 시안 "게시글" 탭. 현재 "북마크 시스템 준비 중" 안내. 모델: `id / user_id / post_id / created_at` + `@@unique([user_id, post_id])`. community_posts 상세 페이지에 🔖 토글 버튼 + 본 페이지 게시글 탭 활성화
- **`game_bookmarks` 테이블** — 시안 "경기" 탭. 모델: `id / user_id / game_id / created_at` + `@@unique`. games 상세에 🔖 + 본 페이지 경기 탭 활성화. 카드는 시안 그대로(픽업/게스트/스크림 배지 + 마감임박 + 일시·장소·참가비·모집)
- **`tournament_bookmarks` 테이블** — 시안 "대회" 탭. 모델: `id / user_id / tournament_id / created_at` + `@@unique`. Tournament 상세에 🔖 + 본 페이지 대회 탭 활성화. 포스터 + 우승상금 + 시안 OPEN/CLOSED 상태
- **`team_follows` 테이블 (Phase 3 Teams 의 팔로우와 통합)** — 시안 "팀" 탭. 이미 Phase 3 Teams 에서 follows 모델 검토 가능 → 통합 검토. 모델 결정 후 본 페이지 팀 탭 + 팀 카드(태그·승률·레이팅·저장일) 활성화
- **`saved_folders` 테이블 (폴더 분류)** — 시안 우상단 "폴더 관리" 버튼. 현재 disabled. 모델: `id / user_id / name / position`. 각 북마크 모델에 `folder_id?` 컬럼 추가. 보관함 진입 시 폴더 셀렉터 + 드래그앤드롭 이동
- **내보내기 (CSV / PDF)** — 시안 우상단 "내보내기" 버튼. 현재 disabled. 7탭별 CSV(or 통합 PDF) 생성 + 사용자 다운로드. Phase 5 Settings 의 "데이터 내보내기" 와 통합 가능

### Phase 5 Reviews (커밋 대기, 2026-04-22)
> 시안 Reviews.jsx 4탭(대회/코트/팀/심판) 중 DB 모델 존재하는 1종(코트=`court_reviews`)만 실데이터로 표시. 나머지 3탭은 "리뷰 시스템 준비 중" 안내. `/reviews` 신규(글로벌 톱레벨). **API/Prisma 스키마 0 변경**. 서버 컴포넌트에서 `prisma.court_reviews` 직접 호출 (status='published' 최신순 60건). C안 Saved 패턴 응용.
- **`tournament_reviews` 테이블** — 시안 "대회" 탭. 현재 빈 안내 카드. 모델 후보: `id / user_id / tournament_id / rating / content / photos JSON / verified / likes_count / status / created_at` + `@@unique([user_id, tournament_id])`. tournament 상세 페이지에 작성 폼 + 본 페이지 대회 탭 활성화. 시안 verified 는 실제 참가 인증 (game_applications.status='approved' 검증)
- **`team_reviews` 테이블** — 시안 "팀" 탭. 모델 후보: `id / author_user_id / target_team_id / rating / content / context (game/scrim/guest 컨텍스트 enum) / photos / verified / likes_count / status / created_at`. 팀 상세에 작성 폼. 게스트 경기/스크림 매칭 후 참가자가 후기 작성. 부정 리뷰 도용 방지를 위한 game_id 연결 필수 검토
- **`referee_reviews` 테이블** — 시안 "심판" 탭. 모델 후보: `id / author_user_id / referee_user_id / tournament_match_id / rating / content / criteria JSON (consistency/communication/judgment) / status / created_at` + `@@unique([author_user_id, tournament_match_id])`. 매치 종료 후 양 팀 선수만 작성 가능. 심판 등급 산정과 연계 (referee/admin 평가 시스템)
- **`court_reviews.helpful_count` 컬럼 분리** — 시안 "도움됨 N" 자리. 현재 likes_count 단일 컬럼으로 매핑(♥와 동일값). 별도 helpful_count 컬럼 + 사용자별 1회 토글 (`court_review_helpfuls` 테이블 신규) 도입 후 분리. 시안은 ♥ 좋아요와 👍 도움됨이 별개 카운트
- **리뷰 태그 시스템** — 시안 카드 본문 하단 #해시태그 (예: #실내 #주차무료). 현재 시안에는 있으나 DB 미지원 → UI 생략. `court_reviews.tags JSON` 컬럼 또는 정규화된 `review_tags` (review_id+tag_slug) 모델 도입 후 표시
- **User 레벨 표시 (LevelBadge)** — 시안 작성자 옆 "L.5" "L.8" 등 등급 뱃지. 현재 모든 리뷰 "L.—" 폴백. `users.xp` 또는 `users.level` 컬럼 + 활동 기반 산정 (게시글/리뷰/경기참가 누적 XP). PostDetail/BoardList의 LevelBadge 컴포넌트 공유 예정
- **리뷰 통합 작성 폼 ("+ 리뷰 쓰기" 버튼)** — 시안 컨트롤 바 우측 버튼. 현재 disabled. 4종 리뷰 타입(대회/코트/팀/심판) 통합 모달 또는 별도 라우트 `/reviews/new?type=court&target=N`. 각 타입별 대상 검색 + 별점 + 내용 + 사진 업로드 통합 UX
- **리뷰 신고 기능** — 시안 우측 "🚩 신고" 버튼. 현재 disabled. `review_reports` 테이블 (review_id+reporter_id+reason+status+created_at) + admin 검토 워크플로우. court_reports 패턴 재사용 가능
- **리뷰 본문 길이 정책** — 현재 본문 5줄 line-clamp 후 잘림. 상세 페이지 또는 카드 확장 토글로 전체 노출 옵션 추가 검토 (시안에는 명시되지 않으나 UX 개선)
- **사진 라이트박스/캐러셀** — 시안 "📷 사진 N장" 표기만. 현재 photos JSON 카운트만 노출. court_reviews.photos URL 배열을 클릭 시 라이트박스로 펼치는 컴포넌트 도입 (court_reviews/[id] 상세 또는 모달)
- **리뷰 페이지네이션** — 현재 60건 take 한계. 무한 스크롤 또는 페이지네이션 (Phase 5 Reviews 트래픽 증가 시 도입)

### Phase 6 Pricing (커밋 대기, 2026-04-22)
> 시안 Pricing.jsx 박제(FREE/BDR+/PRO 3종 등급 모델). 기존 plans 테이블은 feature_key 4종(team_create/pickup_game/court_rental/tournament_create)을 1회/월간 단위 결제로 운영 — 시안의 등급 모델과 구조가 다름. 시안 박제 + 모든 CTA `alert("준비 중")` + /pricing/checkout 라우트 자체는 보존(소스 0 변경) 결정. tier 등급제 도입 시 본 항목 일괄 처리.
- **plans 등급 모델 도입** — 시안 FREE/BDR+/PRO 3종을 plans.tier enum 으로 추가하거나 별도 `plan_tiers` 테이블 신설. 현재 plans 는 feature_key 단건 결제(team_create 등). 등급 = 여러 feature_key 를 패키지로 묶은 상위 모델. user_subscriptions 도 tier_id 컬럼 추가 필요
- **yearly/monthly 가격 분기 동작** — 시안 토글 시 BDR+ 가 ₩4,900 → ₩3,900 으로 변경(연간 2개월 할인). 현재 토글은 UI 표시만 — 실제 결제 진입점에 cycle 파라미터 전달해야 함. plans 테이블에 `yearly_price` 컬럼 또는 `plan_id_yearly` 별도 row
- **BDR+/PRO CTA 결제 진입점 연결** — 현재 모든 CTA `alert("준비 중")`. /pricing/checkout 라우트 + 토스페이먼츠 흐름은 살아있으므로, tier 모델 도입 후 `/pricing/checkout?tier=plus&cycle=yearly` 형태로 라우팅 + payment confirm 단에서 user_subscriptions 발급 분기
- **feature_key 4종 결제 진입점 통합** — 기존 4종(team_create / pickup_game / court_rental / tournament_create)은 시안 등급 모델로는 BDR+/PRO 에 포함된 기능(팀 3개·코트 대관·대회 생성). 마이그레이션 전략: ①신규 등급제로 통합 후 기존 4종 결제는 deprecate ②또는 두 모델 병행(등급=구독, feature_key=일회성) ③또는 기존 4종 → BDR+/PRO 패키지 자동 매핑. PM 결정 필요
- **"가장 인기" 강조 처리 동적화** — 시안 BDR+ 카드 highlight=true 박제. 추후 plans 테이블에 `is_recommended` 컬럼 추가 시 동적 분기 가능
- **결제 문의 메일 → 1:1 문의 모달 전환** — 현재 푸터 mailto:bdr.wonyoung@gmail.com 박제. Phase 6 Help 의 inquiries 모델 도입 시 통합

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

## 기획설계 (planner-architect) — 코트 대관 Phase B 결제 통합 [2026-04-27]

🎯 **목표**: 유료 코트(`booking_fee_per_hour > 0`)에 토스페이먼츠 결제를 붙여, 결제 성공 시에만 `confirmed`로 슬롯을 잠그도록 한다. 무료 코트는 Phase A 흐름 그대로 유지.

### A. 현재 흐름 요약 (Phase A 적용 상태)

**1) booking 페이지** — `src/app/(web)/courts/[id]/booking/page.tsx` + `_booking-client.tsx`
- 서버: `getWebSession` 가드 → `court_infos` 조회 → `booking_mode !== "internal"`이면 안내 화면 / `internal`이면 클라이언트로 `courtData` 직렬화 전달
- 클라: 7일 × 16시간 그리드 → SWR로 `/api/web/courts/[id]/bookings?date=YYYY-MM-DD` 점유 슬롯 표시 → 시간/이용시간/목적/인원 선택 → POST `/api/web/courts/[id]/bookings`
- 결제 영역: 이미 `대관료 / BDR+ 할인 / 결제금액` 3행 카드가 시안대로 박제됨. **현재는 강제로 `finalAmount = 0`** + 버튼 "무료 예약 확정"

**2) 예약 생성 API** — `src/app/api/web/courts/[id]/bookings/route.ts:140 POST`
- ① 세션 ② Zod 검증 ③ `validateBookingTime`(정시·1~4h·과거차단) ④ `booking_mode === "internal"` 가드
- ⑤ `$transaction` 내부에서 `acquireBookingLock` (`pg_advisory_xact_lock(courtInfoId)`) → `checkConflict`(겹침은 confirmed/pending/blocked만) → `INSERT`
- **금액 계산**: `feePerHour * duration_hours = amount`는 저장하지만, **`final_amount = 0` 하드코딩** + `status = "confirmed"`로 즉시 확정
- 응답 후 클라가 `/profile/bookings?just_booked=1`로 이동

**3) 운영자 흐름** — `manage/bookings/route.ts` GET(조회) / POST(blocked 슬롯)
- `checkCourtManager` 가드(코트 등록자 + `feature_key="court_rental"` 활성 구독) 사용
- 운영자 차단 슬롯은 status=`blocked`, purpose=`block`으로 INSERT

**4) 취소 API** — `src/app/api/web/bookings/[id]/route.ts` DELETE
- 본인 또는 코트 운영자만 가능
- **현재는 단순 status="cancelled" + cancellation_reason 기록만** — PG 환불 호출 없음

**5) 결제 인프라(재활용 가능)**
- `payments` 모델: `payable_type` + `payable_id` 다형성, `toss_payment_key`, `toss_response`, `final_amount`, `refund_*` 컬럼 등 **그대로 재활용 가능**. 현재 사용 중인 payable_type은 `"Plan"`만
- `/api/web/payments/confirm/route.ts`: 토스 successUrl 콜백 패턴(plan 전용) — `paymentKey/orderId/amount` 검증 → 토스 confirm POST → DB INSERT(payments) + user_subscriptions 생성 → success URL redirect
- `/api/web/payments/[id]/refund/route.ts`: 토스 cancel 호출 + `payments.status="refunded"` 업데이트. **plan/booking 무관하게 `payments.id`만 받는 구조라 그대로 사용 가능**
- `/pricing/checkout/page.tsx`: 토스 SDK 로드 → `requestPayment({ method:"CARD", amount, orderId, orderName, successUrl, failUrl, customerEmail, customerName })` 패턴
- **DB 보유 컬럼**: `court_bookings.payment_id BigInt?`, `court_bookings.platform_fee Decimal?` — Phase A에서 schema에 추가됐고 NULL/0으로 미사용

### B. 결제 통합 설계

**B-1) 결제 트리거 — 권장: 옵션 B (예약-결제 분리, pending → confirmed)**

| 비교 | A. 선결제 (슬롯 임시잠금 없이 토스 호출) | **B. pending 후 결제 (권장)** |
|------|---------|---------|
| 슬롯 점유 | 결제 완료 직전까지 비점유 → race 가능 | INSERT 시 즉시 advisory lock + status=pending 잠금 |
| 결제 실패 시 | 슬롯에 영향 없음 | pending → cancelled (또는 expired) — cron으로 만료 정리 필요 |
| Phase A 코드 | 거의 새로 작성 | 기존 POST /bookings 흐름 90% 재사용 (status만 분기) |
| booking-conflict | 변경 없음 | `pending`이 이미 ACTIVE_STATUSES에 포함됨 — 코드 변경 불필요 |
| UX | 결제 화면에서 "선점하지 못함" 가능 | 결제 화면 진입 시점에 슬롯 확보 보장 |

→ **Phase A의 `acquireBookingLock + checkConflict + INSERT(status=pending)` 흐름 그대로 + 결제 콜백에서 confirmed로만 바꾸면 됨**. checkConflict는 이미 pending도 ACTIVE_STATUSES에 포함하므로 동시성 문제 없음.

**B-2) 결제 흐름 다이어그램**

```
[BookingClient]
   │ (1) 슬롯 선택 + "결제하고 예약 확정" 클릭
   ▼
POST /api/web/courts/[id]/bookings  ← 기존 API (status 분기 추가)
   │  - 무료(fee=0): status=confirmed (Phase A 그대로)
   │  - 유료(fee>0): status=pending, final_amount=amount
   │  - 응답: { booking: { id, status, final_amount, order_id } }
   ▼
[BookingClient]
   │ (2) status=pending 응답 받으면 토스 SDK requestPayment 호출
   │     orderId = `BOOKING-${bookingId}-${userId}-${ts}`
   │     successUrl = /api/web/payments/confirm/booking?bookingId=...
   ▼
[Toss Payments 결제창]
   │ 결제 성공
   ▼
GET /api/web/payments/confirm/booking?bookingId=...&paymentKey=...&orderId=...&amount=...  ← 신규
   │  - bookingId로 court_bookings 조회 + status=pending 검증
   │  - amount === court_bookings.final_amount 검증 (변조 차단)
   │  - 토스 /v1/payments/confirm POST
   │  - $transaction:
   │    · payments INSERT (payable_type="CourtBooking", payable_id=bookingId)
   │    · court_bookings UPDATE { status: "confirmed", payment_id }
   ▼
redirect /profile/bookings?just_paid=1

[실패 경로]
GET .../fail → /api/web/court-bookings/[id]/payment-cancel  ← 신규(가벼운 PATCH)
   │  pending → cancelled + cancellation_reason="결제 실패/취소"
   ▼
redirect /courts/[id]/booking?error=...

[pending 만료 cron]
Vercel Cron → /api/cron/expire-pending-bookings  ← 신규(15분 이상 pending 일괄 cancelled)
```

**B-3) 신규/수정 API 목록**

| 경로 | 메서드 | 변경 | 역할 |
|------|--------|------|------|
| `/api/web/courts/[id]/bookings` | POST | **수정** | 유료 코트면 `status=pending`, `final_amount=amount`로 INSERT (현 코드 ⑤ 트랜잭션 분기 추가) + 응답에 `order_id` 포함 |
| `/api/web/payments/confirm/booking` | GET | **신규** | 토스 successUrl 콜백. Plan 분기와 분리(URL 분기로 단순화) |
| `/api/web/court-bookings/[id]/payment-cancel` | POST | **신규** | failUrl 콜백 — pending 예약을 cancelled로 정리 |
| `/api/cron/expire-pending-bookings` | GET | **신규** | 15분+ pending 자동 cancelled (Vercel Cron) |
| `/api/web/bookings/[id]` DELETE | **수정** | 유료 예약(`final_amount > 0` + `status=confirmed`) 취소 시 환불 정책에 따라 토스 부분/전체 환불 호출 | |
| `/api/web/payments/[id]/refund` | POST | **변경 없음** | 기존 그대로 — payable_type 무관. 단, 부분 환불을 위해 cancel API 호출 시 `cancelAmount` 전달 가능하도록 살짝 확장 검토 |

**B-4) 신규/수정 컴포넌트**

| 파일 | 변경 | 역할 |
|------|------|------|
| `src/app/(web)/courts/[id]/booking/_booking-client.tsx` | **수정** | (a) 토스 SDK 스크립트 로드 (`useEffect`) (b) `finalAmount = total - discount` 실제 계산으로 복구 (c) `handleSubmit`을 2단계로: ① POST /bookings → ② `data.booking.status === "pending"`면 `toss.requestPayment` 호출 / `confirmed`(무료)면 즉시 redirect (d) 약관 동의 4종 박스 추가 (`/pricing/checkout`에서 그대로 복제) (e) "결제하고 예약 확정" 라벨로 복원 |
| `src/app/(web)/courts/[id]/booking/page.tsx` | **수정** | 직렬화에 `customer_email/name` 노출용 me 정보(또는 `getWebSession`에서 가져오는 user) 1회 추가 |
| `src/app/(web)/courts/[id]/booking/payment-fail/page.tsx` | **신규**(소형) | 토스 failUrl 도착 페이지(에러 코드 + 다시 시도 + 코트 상세) — `/pricing/fail` 패턴 복제 |
| `src/app/(web)/profile/bookings/_bookings-list-client.tsx` | **수정 (소량)** | `?just_paid=1` 토스트 + 환불 정책 안내 노출 (UI만) |

**B-5) DB 스키마 변경**

→ **변경 없음**. Phase A에서 이미:
- `court_bookings.payment_id BigInt?` 보유
- `court_bookings.platform_fee Decimal?` 보유
- `court_bookings.refunded_at DateTime?` 보유
- `payments.payable_type` 다형성에 `"CourtBooking"` 추가만 — 마이그레이션 불필요(VarChar)

→ **유일한 데이터 측면 변경**: `payments` 테이블에 INSERT 시 `payable_type="CourtBooking"` 사용 + admin 결제 조회 페이지에서 `"Plan"`만 가정한 분기가 있으면 식별 라벨 추가 필요 (조사 후 1~2곳 보완)

**B-6) 결제 검증 로직 (`/api/web/payments/confirm/booking`)**

```
1) bookingId·paymentKey·orderId·amount 파라미터 확인
2) court_bookings.findUnique({ where: { id, user_id: ctx.userId, status: "pending" } })
   → 없거나 다른 사용자거나 pending 아니면 fail redirect
3) Number(b.final_amount) !== parseInt(amount) → AMOUNT_MISMATCH
4) Toss /v1/payments/confirm POST (Basic Auth)
5) $transaction:
   - payments.create({ payable_type:"CourtBooking", payable_id: b.id, payment_code: orderId, ... })
   - court_bookings.update({ status:"confirmed", payment_id: payments.id })
6) redirect /profile/bookings?just_paid=1
```

→ Plan 흐름과 분리한 이유: orderId 형식·payable_type·후속 처리(user_subscriptions 생성)가 다름. 분기 if문보다 URL 분리가 명확하고 회귀 위험 적음.

### C. 사용자 결정 필요 (PM이 사용자에게 전달)

| Q | 항목 | 옵션 | 권장 |
|---|------|------|------|
| **Q1** | 결제 트리거 | (a) 선결제 (b) pending→결제→confirmed | **(b)** — Phase A 코드 90% 재사용 + 슬롯 선점 보장 |
| **Q2** | 무료 대관 흐름 (`booking_fee_per_hour=0` or null) | (a) 결제 스킵 → 즉시 confirmed (b) 무료라도 토스 0원 결제 | **(a)** — Phase A 흐름 그대로. POST에서 fee=0이면 status=confirmed |
| **Q3** | 결제 실패 처리 | (a) 즉시 cancelled (b) pending 유지(15분 만료) | **(b)** — failUrl이 와야만 즉시 cancelled, 사용자가 결제창을 닫아 failUrl 안 오는 케이스 대비 cron 만료 |
| **Q4** | 환불 정책 — TournamentEnroll 시안 동일? | (a) D-3 100% / D-2~D-1 50% / 당일 0% (시안과 동일) (b) 운영자 수동 (Phase A 그대로) (c) 코트별 정책 컬럼 도입 | **(a)** — 시안과 통일 + 룰 엔진 1유틸. (c)는 Phase D |
| **Q5** | 환불 시 토스 호출 | (a) 자동 (취소 즉시 토스 cancel API) (b) 수동 (cancelled만 표시 후 운영자 수동 환불) | **(a)** — 이미 `/api/web/payments/[id]/refund` 가동 중. 부분환불은 `cancelAmount` 옵션 사용 |
| **Q6** | platform_fee | (a) 0% Phase B (b) 5% 고정 (c) 운영자별 가변 | **(a)** Phase B는 0% 또는 5% 고정 → D-B4 결정 필요. (c)는 Phase D |
| **Q7** | 결제 약관 | (a) `/pricing/checkout` 4종 그대로 복제 (b) 코트 대관 전용 문구 | **(a)** — 동일 4종(pg/third/refund/marketing) 박제 |

→ **Phase B 착수 최소 결정**: Q1, Q2, Q3, Q4 (4건)

### D. 작업 분해 (단계별)

| 순서 | 작업 | 담당 | 선행 |
|------|------|------|------|
| **B-0** | 사용자에게 Q1~Q7 결정 받기 | pm | — |
| **B-1** | 환불 정책 룰 유틸 — `src/lib/courts/refund-policy.ts` (D-3/D-2/당일 → refundRatio 반환) | developer | B-0 |
| **B-2** | POST `/api/web/courts/[id]/bookings` 수정 — fee>0이면 status=pending+order_id 응답 / fee=0이면 confirmed 그대로 | developer | B-1 |
| **B-3** | `/api/web/payments/confirm/booking` GET 신규 — 토스 confirm + payments INSERT + court_bookings UPDATE | developer (병렬: tester 시나리오 작성) | B-2 |
| **B-4** | `/api/web/court-bookings/[id]/payment-cancel` POST 신규 — failUrl 처리 | developer | B-2 |
| **B-5** | `_booking-client.tsx` 수정 — 토스 SDK 로드 + 약관 4종 + 2단계 handleSubmit | developer | B-3 |
| **B-6** | `/courts/[id]/booking/payment-fail/page.tsx` 신규 — failUrl 랜딩 | developer | B-5 |
| **B-7** | DELETE `/api/web/bookings/[id]` 수정 — 환불 정책 적용 + 토스 cancel API 호출 | developer | B-1 |
| **B-8** | Cron `/api/cron/expire-pending-bookings` GET 신규 — 15분+ pending → cancelled (vercel.json 등록) | developer | B-2 |
| **B-9** | tester (개발 DB로 무료/유료/실패/만료/환불 5시나리오 검증) + reviewer 병렬 | tester + reviewer | B-3~B-8 |

→ 7단계 제한이지만 Phase B는 결제 흐름 특성상 위험·외부 API 의존이 많아 9단계 권장. **PM이 단계 묶음 가능 여부 판단**.

### E. 위험 / 보존 사항

| 위험 | 대응 |
|------|------|
| **금액 변조** (클라가 final_amount 조작) | confirm/booking에서 DB의 `court_bookings.final_amount`와 토스 응답 amount **양쪽 일치 검증**. 클라이언트 값 무시 |
| **결제창 닫기 → failUrl 미도착** | Cron 만료(15분) + 사용자가 다시 예약 시도 시 기존 pending row 자동 cancelled 처리 |
| **토스 confirm 호출 후 DB 트랜잭션 실패** | confirm 결제는 이미 승인된 상태 → 즉시 토스 cancel API로 보상 호출(rollback) + 사용자 안내 |
| **부분 환불 표현** | `payments` 모델에 `refund_amount` 컬럼 존재. 환불 50% 시 partial cancel + payment.status="partial_refunded" 신규 값 사용 (admin 조회 영향 검토) |
| **payable_type 분기 누락** | admin/payments 페이지가 "Plan"만 가정한 분기 있으면 "CourtBooking" 라벨 + 링크 추가 (B-9 reviewer가 grep) |
| **Phase A 무료 흐름 회귀** | B-2에서 fee=0 분기 명확히 + tester가 "무료 코트 확정 시 결제 스킵" 시나리오 1건 필수 |
| **payment_id 외래키 무결성** | court_bookings.payment_id는 FK 미설정(BigInt?만). UPDATE 시 payments.id가 실제 INSERT된 값인지 트랜잭션 내 보장 |
| **개발 DB 결제 테스트** | 토스 테스트 클라이언트 키 사용. 운영 키 절대 노출 금지. `.env`에 `NEXT_PUBLIC_TOSS_CLIENT_KEY` + `TOSS_SECRET_KEY` 개발용 분리 확인 |
| **운영 DB 마이그레이션 0건** | Phase A 컬럼만으로 충분 — schema 변경 PR 없음 |

### F. developer 주의사항

1. **Phase A 호환 모드 유지** — `booking_fee_per_hour = 0 or null` 코트는 Phase A 흐름(즉시 confirmed) 그대로. POST 분기 1줄로 처리
2. **booking-conflict ACTIVE_STATUSES 변경 금지** — `pending`이 이미 포함되어 있어 중복 슬롯 차단 작동. 손대지 말 것
3. **토스 SDK는 클라 측에서 동적 로드** — `/pricing/checkout`의 `useEffect` 패턴 그대로 복사 (sdkLoaded ref로 1회 보장)
4. **orderId 형식**: `BOOKING-${bookingId}-${userId}-${Date.now()}` (Plan 형식과 prefix만 다름)
5. **successUrl/failUrl absolute URL** — `${window.location.origin}/api/web/payments/confirm/booking?bookingId=${id}`
6. **금액 검증 3중 게이트**: ① 클라 → ② POST /bookings에서 DB 저장 시 amount=fee*duration ③ confirm/booking에서 DB.final_amount === toss amount
7. **환불 부분 금액 계산**: `refund-policy.ts`가 ratio(0/0.5/1.0) 반환 → cancel 호출 시 `cancelAmount = floor(payment.final_amount * ratio)` 전달
8. **에러 메시지 한국어** — 기존 Phase A API 톤 유지("결제 처리 중 오류가 발생했습니다" 등)
9. **payments INSERT 필수 필드**: payment_code(=orderId) unique, order_id unique, created_at/updated_at 명시 (Plan 분기 그대로)

### G. 산출 파일 영향 (Phase B)

| 파일 | 역할 | 신규/수정 |
|------|------|----------|
| `src/lib/courts/refund-policy.ts` | D-3/D-2/당일 환불 비율 계산 유틸 | **신규** |
| `src/app/api/web/courts/[id]/bookings/route.ts` | POST 분기 추가 (pending vs confirmed) | 수정 |
| `src/app/api/web/payments/confirm/booking/route.ts` | 토스 successUrl 콜백 | **신규** |
| `src/app/api/web/court-bookings/[id]/payment-cancel/route.ts` | failUrl 처리 | **신규** |
| `src/app/api/web/bookings/[id]/route.ts` | DELETE에 환불 정책 + 토스 cancel | 수정 |
| `src/app/api/cron/expire-pending-bookings/route.ts` | 15분+ pending 만료 | **신규** |
| `src/app/(web)/courts/[id]/booking/_booking-client.tsx` | 토스 SDK + 약관 + 2단계 submit | 수정 |
| `src/app/(web)/courts/[id]/booking/page.tsx` | me 정보 직렬화 추가 | 수정 (소량) |
| `src/app/(web)/courts/[id]/booking/payment-fail/page.tsx` | failUrl 랜딩 | **신규** |
| `src/app/(web)/profile/bookings/_bookings-list-client.tsx` | just_paid 토스트 + 정책 표기 | 수정 (소량) |
| `vercel.json` | cron 등록 (`/api/cron/expire-pending-bookings`) | 수정 (1줄) |

→ 신규 5 + 수정 6 = **11파일**. Prisma 0 / 마이그레이션 0.

### H. 다음 액션

1. **PM이 사용자에게 Q1~Q7 전달** (최소 Q1~Q4 4건 결정).
2. 사용자 결정 후 → `developer`에게 B-1(refund-policy) → B-2(POST 분기) 순으로 **단계별 착수**.
3. B-3 토스 successUrl 콜백 구현 시 `tester`가 결제 시나리오 작성 병렬.
4. **운영 DB는 schema 변경 0건** — payable_type만 새 값 사용. 마이그레이션 PR 없음.

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

#### 수정 이력
| 회차 | 날짜 | 수정 내용 | 수정 파일 | 사유 |
|------|------|----------|----------|------|
| 1차 | 2026-04-27 | 시안 박제 전면 재작성 — 781줄 단일 행 카드 리스트 → `Dev/design/BDR v2/screens/Search.jsx` 1:1. 폭 780→900, 큰 input(52/17), 헤더 위치(input 위 → 제목+카운트 아래), 팀 grid auto-fill 200 카드 + 32×32 이니셜 칩, 경기 board(60/1fr/auto + badge--soft), 대회 board(56/1fr/auto + 48×48 status accent 박스 + 상세 btn), 커뮤니티 board(60/1fr/auto + badge--soft), 코트/유저는 시안 외이지만 사용자 원칙대로 팀 grid 톤과 통일하여 추가. 빈 상태 60px+search_off. 탭 cafe-blue 밑줄(시안). | `src/app/(web)/search/_components/search-client.tsx` 전면 재작성 | PM 지시 — "기존 단일 행 리스트는 시안 톤과 거리. 시안의 grid/board/56px accent/badge 패턴을 그대로 박제" |

#### 시안 매핑 표 (1차 수정 기준)
| 시안 (Search.jsx) | 적용 |
|---|---|
| L21 `maxWidth:900, margin:'0 auto'` | 동일 |
| L22~26 큰 input(52/17, 좌측 search absolute) | `<form>` 안 `position:relative` + Material Symbols absolute + className="input" |
| L28~37 헤더("키워드" 검색 결과 + 카운트 라인) | 동일. 단 카운트 라인에 코트/유저는 0 초과 시에만 추가(사용자 원칙) |
| L39~48 탭 cafe-blue 3px 밑줄 | 동일. 5탭 → 7탭(코트/유저 추가) |
| L50~67 팀 grid auto-fill 200px + 32×32 tag 칩 + rating | DB에 tag/color/rating 없음 → 이름 이니셜 + id 결정 4톤 칩 + city/members 표시 |
| L69~85 경기 card 0pad + 60/1fr/auto + badge--soft + applied/spots | DB에 정원 필드 없음 → 우측 chevron으로 대체 |
| L87~103 대회 56/1fr/auto + 48×48 accent 박스 + level + edition + 상세 btn | status 약어("접수"/"진행"/"준비"/"종료") + status별 토큰 색 + teams_count/max_teams + Link className="btn btn--sm" |
| L105~118 커뮤니티 60/1fr/auto + badge--soft + author·date | author select 없음 → 댓글 + 날짜 |
| L120~125 빈 상태 60px + 36px ○ | 60px + Material Symbols `search_off` 48px |
| (시안 외) 코트 / 유저 섹션 | 팀 grid 톤 그대로 (auto-fill 200, 32×32 칩) — 코트는 location_on 칩(cafe-blue), 유저는 이니셜 칩(원형) |

#### 보존 (1차 수정 — 0 변경)
- `page.tsx` (서버 컴포넌트) — Prisma 6테이블 쿼리, 직렬화, props 전달 100% 동일
- `loading.tsx` 무변경 (이미 v2 스켈레톤 적용)
- `SearchClientProps` 인터페이스, `useState(inputValue/activeTab)`, `handleSubmit` → `router.push` 동작 동일
- `searchParams.q` → 서버 → 클라 흐름 동일
- 6종 데이터(games/tournaments/teams/posts/users/courts) 전부 화면 노출
- 한글 라벨 매핑 그대로(시안 폭에 맞춰 GAME_TYPE/STATUS 일부 짧게)

#### 검증 (1차)
- `npx tsc --noEmit` → **EXIT=0 PASS** (에러/경고 0)
- 커밋 보류 — PM 처리 대기

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
| 04-27 | developer | **코트 대관 Phase B reviewer 후속 4건 (라벨/문구/쿼리)** — 4파일 수정. ①`(admin)/admin/payments/admin-payments-content.tsx` STATUS_LABEL/COLOR에 `partial_refunded:"부분 환불"` + info 톤 컬러 추가(B-7에서 신규 도입한 status 값 admin 화면 매핑). ②`(web)/courts/[id]/booking/_booking-client.tsx` 환불 정책 안내문 "시작 24h 전 100% / 12h 전 50%" → "3일 전 100% / 1~2일 전 50% / 당일 0%" (refund-policy.ts 정책과 정렬). ③같은 파일 `successUrl` query `?bookingId=...` 제거(B-3 confirm/booking은 orderId 파싱 — bookingId 미사용). failUrl은 payment-fail 페이지가 사용하므로 유지. ④`payment-fail/page.tsx` "예약은 자동으로 취소되었습니다" → "예약은 자동으로 취소 처리됩니다"(미래형, B-4 API 응답 도착 전 안내 일관성). **동작 변경 0** — 라벨/문구/미사용 쿼리만. TOSS SDK 인자(method/amount/orderId/orderName/successUrl/failUrl/customerEmail/customerName) 변경 0. tsc --noEmit EXIT=0 PASS | ✅ (커밋 금지 — PM 처리) |
| 04-27 | developer | **코트 대관 Phase B-7 — DELETE /bookings/[id] 환불 정책 적용** — 1파일 수정(`src/app/api/web/bookings/[id]/route.ts` 183→ ~360줄). DELETE 핸들러만 교체, GET/loadBookingWithPermission/findBooking 100% 보존. **신규 import**: `calcRefundAmount` from `@/lib/courts/refund-policy`. **신규 가드**: `now >= start_at` → 409 ALREADY_STARTED. **3분기 환불 로직**: ①무료(payment_id=null OR final_amount=0) → status=cancelled만 + `refund: null` ②유료 ratio=0(당일+본인) → 토스 호출 X, DB만 cancel + `refund: { amount:0, ratio:0, label:"당일" }` ③유료 ratio>0 → 토스 `/v1/payments/{key}/cancel` POST(Basic Auth, body `{cancelReason, cancelAmount}`) → 성공 시 `prisma.$transaction([court_bookings.update + payments.update])` 동시 갱신. **운영자 정책**: `result.isManager`이면 ratio=1.0 강제(전액 환불) — 운영 사정 취소 시 사용자 보호. **payments.status 결정**: `refund.amount < paidAmount` → "partial_refunded" / 전액 → "refunded". **결제 가드**: payments 미존재 500 PAYMENT_NOT_FOUND, 이미 환불(`refunded`/`partial_refunded`/`cancelled`) 400 PAYMENT_ALREADY_REFUNDED. **토스 실패**: 트랜잭션 외부 호출이라 500 응답 시 DB 변경 0(자동 롤백). **dev fallback**: `secretKey` 또는 `toss_payment_key` 미존재 시 토스 호출 skip + DB 갱신만(기존 `/payments/[id]/refund` 패턴 재사용). **보존**: getWebSession·CancelSchema·loadBookingWithPermission·isCourtManager·apiSuccess/apiError·기존 ALREADY_TERMINATED 가드 모두 그대로. tsc --noEmit EXIT=0 PASS | ✅ (커밋 금지 — PM 처리) |
| 04-27 | developer | **코트 대관 Phase B-3 — payments/confirm/booking 신규 (토스 successUrl 콜백)** — 신규 1(`src/app/api/web/payments/confirm/booking/route.ts` 237줄: `withWebAuth` GET, paymentKey/orderId/amount 쿼리 검증 + orderId 파싱(`BOOKING-{bookingId}-{userId}-{ts}` 4세그먼트 BigInt 변환) + booking 조회 + **3중 보안 게이트**(세션user===orderIduser===booking.user_id / status="pending"+payment_id===null / DB.final_amount===query.amount) + 토스 `/v1/payments/confirm` POST(Basic Auth) + 응답 totalAmount 4번째 검증(불일치 시 `tossCancelCompensate` 보상) + `prisma.$transaction`(payments INSERT payable_type="CourtBooking" + court_bookings.updateMany where status="pending" AND payment_id=null → race 가드 count!==1이면 throw 롤백) + 보상 호출(DB 실패 시 토스 cancel API)). **DB 변경 0** — Plan 결제 라우트 0 변경, payable_type 다형성에 "CourtBooking" 신규 값만. URL 분리 결정으로 회귀 위험 차단. tsc --noEmit EXIT=0 PASS | ✅ (커밋 금지 — PM 처리) |
| 04-27 | developer | **코트 대관 Phase B-1 — refund-policy 유틸 신규** — 신규 1(`src/lib/courts/refund-policy.ts` 약 145줄: KST 자정 기준 환불 정책 룰 엔진. `toKstMidnight()` (UTC ms+9h → setUTCHours(0,0,0,0) 패턴, 코드베이스 다수 위치와 일관) + `calcDaysBeforeBookingKst()` (예약 시작일까지 KST 달력 일수 계산, 음수 가능) + `getRefundRatio()` (시안 동일: D-3 이전 100% / D-2~D-1 50% / 당일 0%) + `calcRefundAmount()` (Math.floor 절단으로 사업자 유리, 무료/음수 paidAmount 안전 처리) + `RefundLabel`/`RefundCalculation` 타입 export). **의존성 0** — Date만 사용해 테스트 용이. **Phase A 호환** — paidAmount=0이면 amount=0 반환. 사용자 결정 Q4=(a) 시안 통일 + KST 자정 기준 명시. tsc --noEmit EXIT=0 PASS | ✅ (커밋 금지 — PM 처리) |
| 04-27 | developer | **코트 대관 Phase B-2 — POST /bookings 결제 분기** — 1파일 수정(`src/app/api/web/courts/[id]/bookings/route.ts` 290→323줄, +33). Phase A 강제 `final_amount=0`+`status=confirmed` 제거 후 fee=0/fee>0 분기 도입: 무료(amount==0)는 Phase A 흐름 그대로(status=confirmed, final_amount=0, `requiresPayment:false`) / 유료(amount>0)는 status=pending + final_amount=실제 금액 + 응답에 `requiresPayment:true, orderId, amount` 동봉. **DB 변경 0** — order_id 컬럼 신설하지 않고 `BOOKING-${bookingId}-${userId}-${Date.now()}` 패턴으로 응답 시점 생성, successUrl 콜백에서 bookingId 파싱 lookup 방식. **보존 100%**: getWebSession 인증·Zod 검증·validateBookingTime·booking_mode==="internal" 가드·prisma.$transaction·acquireBookingLock(pg_advisory_xact_lock)·checkConflict(ACTIVE_STATUSES에 pending 이미 포함)·SLOT_CONFLICT 409 변환·apiSuccess snake_case 자동 변환. platform_fee=0 유지(Phase C 이후). tsc --noEmit EXIT=0 PASS | ✅ (커밋 금지 — PM 처리) |
| 04-27 | developer | **코트 대관 Phase B-8 — expire-pending-bookings Cron 신규** — 신규 1(`src/app/api/cron/expire-pending-bookings/route.ts` 65줄: GET + CRON_SECRET Bearer 검증(미설정 시 검증 생략 — 로컬 편의) + cutoff=now-15분 + `prisma.court_bookings.updateMany({ where: status="pending" + created_at < cutoff, data: status="cancelled"+cancelled_at+cancellation_reason="결제 미완료 자동 만료"+updated_at }) 단일 SQL UPDATE` + JSON 응답 `{expired, cutoff, timestamp}` + `dynamic="force-dynamic"`) + 수정 1(`vercel.json` 기존 crons 3건(tournament-reminders/youtube-recommend/weekly-report) 보존 + `/api/cron/expire-pending-bookings` `*/10 * * * *` 1건 추가). **다른 API 호출 0건**(pending=결제 confirm 전이라 토스 환불 불필요). **Phase A 무료 흐름(status=confirmed) 영향 0**(where status=pending만 대상). tsc --noEmit EXIT=0 PASS | ✅ (커밋 금지 — PM 처리) |
| 04-27 | planner-architect | **코트 대관 Phase B 결제 통합 분석 + 설계** — 현재 Phase A 흐름 5요소 파악(booking 페이지/POST bookings/manage bookings/DELETE bookings/booking-conflict) + 결제 인프라 재활용 가능성 확인(/pricing/checkout 토스 SDK 패턴 + /api/web/payments/confirm Plan 콜백 + /api/web/payments/[id]/refund payable_type 무관 재사용 가능 + payments 다형성에 "CourtBooking" 추가만 필요 — 마이그레이션 0). 결제 트리거 옵션 B(예약 pending → 결제 → confirmed) 권장 — Phase A 코드 90% 재사용 + booking-conflict ACTIVE_STATUSES에 pending 이미 포함. 사용자 결정 7건(Q1 트리거/Q2 무료흐름/Q3 실패처리/Q4 환불정책/Q5 토스호출/Q6 platform_fee/Q7 약관) 도출 — 최소 Q1~Q4 4건 결정 필요. 작업 분해 9단계(B-0~B-9 환불유틸/POST분기/confirm콜백/fail콜백/UI/cron/취소환불/검증). 산출 11파일(신규 5+수정 6) + Prisma 0 + 운영 DB 마이그 0. 위험 9건(금액 변조/결제창 닫기/confirm 후 DB 실패/부분환불/payable_type admin 분기 누락/Phase A 무료 회귀/payment_id 무결성/개발 토스키/운영 DB 보호). scratchpad "기획설계 (planner-architect) — 코트 대관 Phase B 결제 통합 [2026-04-27]" 섹션 신설 | ✅ 분석/설계 완료 — 사용자 결정 대기 |
| 04-27 | developer | **알림 페이지 v2 시안 박제 (옵션 A)** — 1파일 수정(`(web)/notifications/_components/notifications-client.tsx`). eyebrow "알림 · NOTIFICATIONS"(11px/.14em/uppercase/cafe-blue-deep) 추가 + h1 옆 unread 빨간 22px 텍스트(뱃지 X, ff-mono) + "읽지 않은 알림 N건" 보조문구(ink-dim) + 활성 탭 cafe-blue 배경+cafe-blue-deep 보더(accent → cafe-blue) + unread 카드 bg-elev 배경+좌측 6px 원형 점(accent-soft + 3px bar 제거) + 시간 ff-mono+ink-dim + 그리드 44px/1fr/auto 패딩 16/20 + 본문 서브텍스트 ink-dim + "모두 읽음" 항상 노출(0건 disabled+opacity 0.45) + `getNotificationEmoji()` 신규(시안 박제: 🏆 match/tournament·🏀 game/scrim·💬 comment/mention·👥 team/friend·📈 rating/achievement·❤️ like/react·⚙️ system, 키워드 부분일치+categorize 폴백) + Material Symbols 아이콘 원형 → 이모지 26px. 보존 100%: SerializedNotification 타입(status: string)·Props(notifications/total/initialCategoryCounts)·6 useState·handleLoadMore/handleDelete/handleMarkAllRead·categorize() 사용·`/api/web/notifications/read-all` 호출 흐름·CustomEvent "notifications:read-all" 발행·PushPermissionBanner·더 보기·삭제 버튼·page.tsx 0 변경. **이모지 박제 근거**: CLAUDE.md "Material Symbols Outlined" 규칙은 lucide-react 외부 라이브러리 import 금지가 핵심, 이모지는 시안 결정 영역. shop/scrim/guest-apps와 일관성 유지(시안 인라인 이모지 그대로 박제). tsc --noEmit EXIT=0 PASS | ✅ (커밋 금지 — PM 처리) |
| 04-27 | developer | **Phase 7 이모지 정책 점검 + 최종 tsc 통과** — PM 지시("시안 인라인 이모지 그대로 박제, Material Symbols 강제 변환 X") 따라 TournamentEnroll(★ 시안 더미 컬럼 미사용, 💡 enroll-step-docs L133, ⚠️ page.tsx L1275 박제 확인) + GuestApps(⚡🎯🏆📅📍💳 박제 확인 + 주석 명시 L221) 양쪽 모두 시안 충실 박제 일관성 유지. 코드 수정 0. tsc --noEmit EXIT=0. | ✅ (커밋 금지 — PM 처리) |
| 04-27 | developer | **Phase 7-1 TournamentEnroll v2 박제** — `/tournaments/[id]/join` 전면 재작성 + `_v2/` 4 신규(enroll-poster/enroll-stepper/enroll-aside/enroll-step-docs). API/Prisma 0 변경, 보존 9건(팀선택/대표자/디비전/유니폼/선수/카테고리/입금계좌/완료/대기) 동작 유지, 5-step(hasCategories=true)/4-step adaptive, 서류 step "준비 중" 박제, 결제 step 입금 안내 흐름 유지(토스 미연결), 우측 sticky aside(포스터 placeholder + D-카운터 정적 + 환불 정책 mock). tsc --noEmit EXIT=0. | ✅ (커밋 대기, PM 처리) |
| 04-27 | developer | **Phase 6 Pricing 1차 수정 — /pricing/checkout v2 정렬 (PM 미해결 4건 일괄)** — 1파일 전면 수정(`src/app/(web)/pricing/checkout/page.tsx`). ①breadcrumb 추가(홈›요금제›결제, `@/components/shared/breadcrumb`) ②약관 4종 라벨 카드(결제 대행/개인정보 제3자/구독·환불 정책/마케팅 선택, UI 박제 — 결제 차단 X) ③`/api/web/me` useEffect fetch 후 email·이름 readOnly input 노출(빈 값 placeholder "(미등록)" + var(--ink-dim), 실패 시 무시) ④plan_type 라벨 기존 그대로(monthly→"월 구독 (30일)", 그 외→"1회 구매") ⑤loading/error/Suspense fallback 모두 v2 spinner(`var(--accent)`)+`.card` 정렬(기존 tailwind --color-* alias 제거). **토스 SDK `toss.requestPayment({ method, amount, orderId, orderName, successUrl, failUrl, customerEmail, customerName })` 인자 한 글자도 변경 X**. handlePay 흐름·SDK 로드 useEffect·planId 가드·router·useSearchParams 보존. tsc --noEmit EXIT=0 PASS | ✅ (커밋 대기, PM 처리) |
| 04-22 | developer | **Phase 6 Pricing — /pricing v2 시안 박제 (server wrapper + client content 분리)** — 1전면재작성(`(web)/pricing/page.tsx` server wrapper 슬림화: metadata + revalidate=300 보존, prisma/getWebSession/feature_key 4종 카드 전부 제거, `<PricingContent/>` 단일 호출) + 1신규(`(web)/pricing/_v2/pricing-content.tsx` "use client" useState<"monthly"\|"yearly"> 시안 Pricing.jsx 90줄 박제 — 헤더 eyebrow+h1 36px+부제+theme-switch 월간/연간 토글(연간=2개월 할인 ok색) + 카드 3종(FREE/BDR+/PRO) extras-data.jsx PRICING 박제: highlight 카드 BDR+ 만 translateY(-8px)+2px accent border+sh-lg+상단 "가장 인기" 라운드 뱃지 / 가격 ff-display 40px / 연간 토글 시 BDR+ 만 ₩4,900→₩3,900 분기(시안 L42 동작) / btn--accent btn--xl CTA / 기능 ✓ 6항목 list / 비교표 7행 .board 4열(기능/FREE/BDR+/PRO) BDR+ 컬럼 ○ 시 accent / 결제 문의 mailto 푸터). **결정 B: 모든 CTA `alert("준비 중입니다.")` — /pricing/checkout 라우트 자체는 0 변경(소스 보존). 결정 C: 시안 그대로 박제(기존 plans/user_subscriptions 동적 데이터 0 활용)**. 카페 세션 무관. 기존 FAQ 3건 / 광고 문의 박스 제거(Help로 통합됨). globals.css `.page/.card/.btn/.btn--accent/.btn--xl/.theme-switch/.theme-switch__btn/.eyebrow/.board/.board__head/.board__row` + 변수 `--accent/--ok/--ink/--ink-mute/--ink-dim/--ink-soft/--ff-display/--sh-lg` 전부 기존 정의 활용. 추후 구현 Phase 6 Pricing 6건 신설(plans 등급 모델 / yearly_price 분기 / BDR+·PRO 결제 진입점 연결 / feature_key 4종 통합 마이그레이션 / is_recommended 동적 / 결제 문의 → inquiries 모달). tsc --noEmit EXIT=0 PASS | ✅ (커밋 대기, PM 처리) |
| 04-22 | developer | **Phase 6 Help — /help v2 신규 (시안 86줄 박제 + 탭 3종 + 검색 + 정책 6카드 + 1:1 문의)** — 신규 1 (`src/app/(web)/help/page.tsx` "use client" useState tab/q + 헤더(eyebrow+h1 32px+검색 input padding-left:38 Material Symbols search 아이콘) + 탭 3종(faq/glossary/policy) cafe-blue 3px 하단 라인 + FAQ 6건 시안 박제 `<details>` 아코디언 Q번호 accent+mono + 용어집 16건 시안 박제 200/1fr 그리드 + GLOSSARY 검색 필터(term/desc 부분일치 toLowerCase) + 결과 0건 안내 + "전체 용어 사전 보기 →" Link `/help/glossary` + 정책 6카드 1fr 1fr 그리드(terms/privacy 활성 Link, 운영정책/환불/광고제휴/저작권 4종 비활성 opacity 0.55 + "준비 중" badge bg-alt) + 하단 1:1 문의 카드 mailto:bdrbasket@gmail.com?subject=%5BMyBDR%20문의%5D btn--primary). **API/Prisma/서비스 0 변경. 신규 fetch 0건. 기존 /help/glossary 0 변경**(링크만 연결). 카페 세션 무관. globals.css `.page/.card/.input/.btn/.btn--primary/.eyebrow` + 변수 `--cafe-blue/--ink/--ink-soft/--ink-mute/--ink-dim/--accent/--border/--bg-alt/--ff-mono` 전부 기존 정의 활용. 추후 구현 Phase 6 Help 4건 신설(FAQ DB 박제→운영자 편집 / 1:1 문의 Inquiry 모델+답변 워크플로 / 운영정책·환불·광고제휴·저작권 정책 페이지 / FAQ 검색 — 현재 GLOSSARY만 검색). tsc --noEmit EXIT=0 PASS | ✅ (커밋 대기, PM 처리) |
| 04-22 | developer | **Phase 5 Achievements — /profile/achievements v2 신규 (시안 16종 배지 그리드 + 필터 + 최근4 + 정적 카탈로그)** — 신규 3 (`achievements/_v2/badge-catalog.ts` 16+12종 카탈로그(BadgeMeta tier/category/icon/desc/name) + TIER_COLOR/TIER_LABEL/CATEGORY_LABEL 상수 + resolveBadgeMeta() 폴백(bronze/milestone/🏅) + SIGNATURE_ORDER 시안 16키 순서 / `achievements/_v2/achievements-content.tsx` "use client" useState filter + Breadcrumb(홈›프로필›업적) + Header 통계 3셀(획득/전체/달성률) + 최근획득 4셀 카드(borderLeft tier색) + 필터칩 8개(전체/획득/진행중/경기/팀/커뮤니티/시즌/마일스톤) + 4열 배지 그리드(tier 라벨우상단/이모지48px/잠금시🔒+grayscale/desc 32px minHeight/획득시✓날짜+상위 —, 미획득시 0%바+0/— title="측정 준비 중") / `achievements/page.tsx` 서버컴포넌트 force-dynamic + getWebSession + 비로그인 안내(person_off) + prisma.user_badges.findMany earned_at desc + BigInt→string + Date→ISO 직렬화 + AchievementsContent 렌더). **API/Prisma/서비스 0 변경. 신규 fetch 0건**. 카페 세션 무관. 시안 16종 SIGNATURE_ORDER 우선 + DB 발급 시안외 배지(court_explorer/streak/mvp 등) 끝에 추가. DB 미지원 메타(rarity/progress/total) 전부 "—" / "0 / —" / 0% 폴백 + var(--ink-dim) 약하게. 추후 구현 Phase 5 Achievements 4건 신설(rarity 측정 cron / user_badges_progress 테이블 / 자동 발급 트리거 / badge_definitions DB화). tsc --noEmit EXIT=0 PASS | ✅ (커밋 대기, PM 처리) |
| 04-22 | developer | **Phase 5 Settings — /profile/settings v2 6 섹션 재구성 (시안 옵션 A: 인라인 9필드 폼)** — 신규 8 (`_components_v2/section-key.ts` SectionKey 유니언 + resolveSection 폴백 / `settings-side-nav-v2.tsx` 220px sticky 6 버튼 nav(Material Symbols person/sports_basketball/notifications/lock/credit_card/warning) / `settings-ui.tsx` 공용 SettingsHeader+SettingsRow+SettingsToggle (토큰 var(--*) 전용·하드코딩 색 0) / `account-section-v2.tsx` 5행 Row(이메일·비밀번호 동작 + 연결된 계정·2FA·로그인기기 disabled) / `profile-section-v2.tsx` **시안 인라인 9필드 폼**(닉네임 2~20 검증 / 실명 / 포지션 / 키 / 몸무게 / 도시 / 활동지역구 / 생년월일 / 자기소개) + PATCH `/api/web/profile` 호출 + 낙관적 onSaved 콜백 / `notify-section-v2.tsx` 5 동작 토글(push/game/community/team/tournament) + 4 disabled(이메일·D-3·좋아요·마케팅) + 낙관적 PATCH 롤백 / `privacy-section-v2.tsx` 5 disabled "준비 중" 토글 / `billing-section-v2.tsx` 시안 그라디언트 카드(유료=cafe-blue, 무료=alt) + 4행 Row(결제수단/결제내역→/profile/payments/세금계산서/구독관리→/profile/subscription) + 하단 2버튼(플랜변경→/pricing / 구독취소) / `danger-section-v2.tsx` 3 카드(데이터내보내기·비활성화 disabled / 계정삭제 inline 비밀번호 모달 → DELETE `/api/web/auth/withdraw`)) + 1 전면재작성 (`page.tsx` `?section=`/`?tab=` 폴백 + 좌 sticky nav + 우 카드 + GET /api/web/profile + GET /api/web/profile/subscription 병렬 마운트 fetch / 비활성 섹션 unmount). **API route.ts / Prisma / 서비스 / 컴포넌트 0 변경. 신규 fetch 0건** (활용: profile/notification-settings/subscription/auth/withdraw 전부 기존 라우트). 기존 6 페이지(notification-settings/preferences/payments/subscription/billing/edit) 삭제 0. 추후 구현 Phase 5 Settings 11건 신설(2FA/세션 관리/이메일 알림/D-3·좋아요·마케팅/privacy 5 토글 JSONB/GDPR ZIP/soft deactivate/PG 카드 토큰/세금계산서 자동/jersey_number+dominant_hand/소셜 연동 UI). tsc --noEmit EXIT=0 PASS | ✅ (커밋 대기, PM 처리) |
| 04-22 | developer | **Phase 5 Rank — /rankings v2 재구성 (a 토글 3종: 팀/선수/외부BDR)** — 신규 3 (`_components/v2-podium.tsx` 1·2·3등 카드 [2등/1등/3등] 배치 + 가운데 1등 translateY(-12px) + display 폰트 #N / `v2-team-board.tsx` 6열 보드(순위·팀색배지·이름링크·레이팅(=wins임시)·승[ok색]·패·승률) / `v2-player-board.tsx` 8열 보드 + 정렬pills 4종(레이팅/PPG/APG/RPG) + 클라 정렬 + PPG=avg_points / APG=total_assists/games_played / RPG=total_rebounds/games_played / 레이팅·변동 "—") + 수정 2 (`_components/rankings-content.tsx` 전면 교체: theme-switch 3종(팀/선수/외부BDR) + eyebrow + h1 "2026 시즌 랭킹" + V2Podium + V2TeamBoard/V2PlayerBoard 분기 + 외부BDR 탭은 `<BdrRankingTable>` + 일반/대학 부 토글 / `loading.tsx` v2 톤 가볍게 .page+.eyebrow+.board 8행). 보존 1 (`_components/bdr-ranking-table.tsx` 0수정, 외부BDR 탭에서 그대로 호출). **API/Prisma/서비스 0 변경** (/api/web/rankings?type=team\|player + /api/web/rankings/bdr 그대로). 시안 Rank.jsx 충실. globals.css `.page/.eyebrow/.theme-switch/.board/.card` + 변수 `--accent/--ok/--cafe-blue/--cafe-blue-soft/--cafe-blue-deep/--bg-elev/--bg-alt/--ink-mute/--ink-dim/--ink-soft/--ff-display/--ff-mono/--border/--radius-chip` 전부 기존 정의 활용. 추후 구현 Phase 5 Rank 5건 신설(teams.rating ELO / users.rating+trend / PPG·APG·RPG 정규화 / 시즌 갱신 cron / 포디움 메타 포맷). tsc --noEmit EXIT=0 PASS | ✅ (커밋 대기, PM 처리) |
| 04-22 | developer | **Phase 4 PostWrite — /community/new v2 재구성 (with-aside 2열 + 시안 카드 폼)** — 1파일 전면 재작성(`(web)/community/new/page.tsx`). 단독 Card → `.page > .with-aside` (좌 `CommunityAsideNav activeCategory={null}` 재사용 + 우 main). 시안 그대로 헤더(h1 "글쓰기" + 우 "임시저장 · 자동저장 준비 중") + 본문 카드 6섹션: ①게시판 선택+제목 160px/1fr 그리드 ②툴바 12버튼 모두 disabled "준비 중"(D3 — B/I/U/S 시각 힌트 유지+H1/H2/인용/목록/사진/링크/영상/미리보기) ③textarea 상단 radius 0 으로 툴바와 시각 연결+ minHeight 340 + 글자수 카운터 ④체크박스 3개(댓글허용/비밀글/공감표시) 모두 disabled (D4) + 글자수/20000 카운터 ⑤이미지 URL 첨부 섹션 보존(D5 — 실 동작, 시안 톤만 정돈, `<img>` → `next/image fill unoptimized` 교체) ⑥액션 3버튼(취소 router.back / 임시저장 disabled / 등록 submit). **카테고리 select 4→7개**(D1: notice 제외, recruit/qna 신설). **createPostAction / useActionState / `name="images"` hidden JSON / pending / state.error 0 변경**. v2 글로벌 클래스 활용(.label/.select/.input/.textarea/.btn/.btn--sm/.btn--primary 전부 globals.css 정의 확인). 추후 구현 Phase 4 PostWrite 4건 신설(community_post_drafts 임시저장/자동저장 · TipTap 또는 Lexical 리치 에디터 · allow_comments/is_private/show_reactions 컬럼 · Supabase Storage 직접 업로드). tsc --noEmit EXIT=0 PASS | ✅ (커밋 대기, PM 처리) |
| 04-26 | developer | **Phase 4 PostDetail — /community/[id] v2 재구성 (시안 PostDetail.jsx + 좌 CommunityAside 재사용)** — 신규 1(`_components/community-aside-nav.tsx` RSC↔클라 경계 우회용 useRouter 래퍼: 클릭 시 `/community?category=...` push) + `[id]/page.tsx` 전면 재구성(grid 12열 → `.page > .with-aside`. 시안 4섹션: badge--soft 카테고리 + 24px 제목 + cafe-blue-soft 이니셜 작성자 + 우측 메타(날짜·조회·댓글·추천) + Body padding 28/26·fs15·lh1.8 + Reactions 가운데정렬 좋아요/공유/스크랩(disabled "준비 중") + Nav 이전/다음글 placeholder "준비 중"). D1-c: 우측 PostDetailSidebar 그대로 호출 + `marginTop:32`로 본문 하단 1열 누적 (작성자카드/실시간 인기글/이벤트 배너 3블록 보존). D2: 홈›카테고리›글 상세. D3: split <p> 유지(h3/img X). D4: 이전/다음 placeholder. D5: LikeButton+ShareButton 그대로+스크랩 disabled. D6+D7: CommentForm/CommentList 그대로 호출(카페 댓글 병합 보존). **API/Prisma/Server Action/decodeHtmlEntities/cache(getPost)/병렬 likes·follow 0 변경. 컴포넌트 6개(LikeButton/ShareButton/PostActions/PostDetailSidebar/CommentForm/CommentList) 0 수정**. 추후 구현 Phase 4 PostDetail 5건(이전/다음 글 Prisma 쿼리·users.xp LevelBadge·작성글 수 헤더·Body block type 분기·스크랩 community_post_bookmarks). tsc --noEmit EXIT=0 / `/community/<recruit-id>` 200(207KB,2.2s) + `/community/<review-id>` 200(213KB) + `/community/<general-id>` 200(223KB) / HTML: with-aside 1·page 1·badge--soft 1(카테고리별 동적)·aside__link 8·cafe-blue-soft 1·thumb_up 1·>댓글< 1·>스크랩< 1·이전글/다음글 1·실시간 인기글 1·작성자 정보 1·View Detail 1 전부 렌더 확인 | ✅ (커밋 대기, PM 처리) |
| 04-22 | developer | **Phase 4 BoardList — /community v2 재구성 (시안 BoardList.jsx + 그룹 트리 사이드바, 페이지당 20개)** — 신규 2 (`src/components/bdr-v2/v2-pager.tsx` 재사용 페이저 컴포넌트 + 윈도우 슬라이딩 / `src/app/(web)/community/_components/community-aside.tsx` 좌측 그룹 트리: 메인(공지/자유) · 플레이(팀원/대회후기/장터) · 이야기(질문/정보) — 글 수 카운트 "—" + title="준비 중") + `community-content.tsx` 전면 교체(.page + .with-aside 2열 + 헤더 eyebrow+제목+전체글수+검색+글쓰기 + 정렬 4종(최신/인기/댓글/조회) 클라 토글 + .board 테이블(번호/제목/작성자/날짜/조회/추천) + 공지(category=notice) 자동 핀 상단 + 새글 24h badge--new "N" + has_image false 고정). **API `/api/web/community` 호출 / SSR fallbackPosts / preferFilter Context / searchParams 동기화 / decodeHtmlEntities 100% 보존**. 페이지당 20개(PM 결정, 시안 충실). 추후 구현 Phase 4 BoardList 6건 신설(is_pinned/has_image/카테고리별 글수 API/LevelBadge/글 번호 채번/게시판 내 검색 라벨). tsc --noEmit EXIT=0 / `/community` 200(0.86s) + `?category=general/notice` 200 + `?q=test` 200 / HTML 마커: with-aside 1 / board__head 1 / board__row 20 / aside__ 16 / pager 5 / eyebrow 1 / btn--primary 2 전부 렌더 확인 | ✅ (커밋 대기, PM 처리) |
| 04-22 | developer | **Phase 3 Bracket — v2 재구성 (B안: 헤더/Status/사이드 v2 공통, 메인 트리는 포맷별 분기 보존)** — 사용자 4건 결정(B안/SVG 유지/우승예측 자리 유지+"투표 준비중"/select 같은 series_id 라우팅) 그대로 반영. 신규 6 (`v2-bracket-header` eyebrow+h1+부제+series_id회차select+저장/공유/출력 alert / `v2-bracket-status-bar` 5칸: 참가팀/완료/진행중LIVE/현재라운드/우승상금"-" / `v2-bracket-schedule-list` rounds 평탄화+시간순+상태배지 / `v2-bracket-seed-ranking` 시드+이니셜박스+wins(레이팅 자리 대체) / `v2-bracket-prediction` placeholder "투표 준비중"+버튼 disabled / `v2-bracket-wrapper` SWR+포맷별 분기 보존 LeagueStandings/GroupStandings/BracketView/BracketEmpty 그대로 호출) + 수정 2 (`tournament-tabs.tsx` BracketTabContent를 V2BracketWrapper 위임으로 슬림화+props 6개 추가 / `page.tsx` TournamentTabs에 헤더용 메타+seriesEditions 매핑 전달, 추가 쿼리 0). **API route.ts/Prisma/서비스 0 변경. BracketView/LeagueStandings/GroupStandings/FinalsSidebar/BracketEmpty 0 수정.** 추후 구현 목록 Phase 3 Bracket 6건 신설(우승예측 테이블/teams.rating/LIVE 실시간/저장공유출력/prize_money/MatchCard 코트정보). tsc --noEmit EXIT=0 / `/tournaments/18e4912f-.../?tab=bracket` 200(group_stage_knockout TEST 6팀) / public-bracket API 200 / SSR HTML eyebrow "BRACKET" 렌더 확인 | ✅ (커밋 대기, PM 처리) |
| 04-25 | planner-architect | **코트 대관(Booking) 시스템 기획설계** — 현황 점검(plans/court_rental + 토스페이먼츠 + payments 다형성 + court_infos.user_id 모두 기존 자산 확인) → 신규 1테이블(court_bookings) + court_infos 2컬럼 + User 백릴레이션 1줄로 MVP 가능 판정. 운영자 ↔ 코트 매핑은 court_infos.user_id + user_subscriptions(feature_key=court_rental) 활성 검사로 단순화 (court_managers 신규 모델 도입 보류). 4 Phase 분할(A=무료 MVP 8~12h / B=결제 6~8h / C=정산+자동환불 8~10h / D=BDR+할인+N:M 6~8h). PM이 사용자에게 전달할 결정 포인트 7건(D-B1~D-B7) 도출 — Phase A 착수 전 D-B1·D-B2·D-B6 3건 필수. Phase A 산출 파일 신규 8 + 수정 2 = 10파일 매핑. 동시성·환불·KYC·외부vs자체 위험 6건 대응 명세. 코드 0수정 | ✅ 설계 완료 |
| 04-22 | developer | **Phase 3 Org 상세 — /organizations/[slug] v2 재구성 (Hero + 4탭 + ?tab= 동기화)** — `_components_v2/` 7 신규(org-color 공유 헬퍼 / org-hero-v2 135deg 그라디언트+가입신청 alert+회원/팀/설립 메타 / org-tabs-v2 4탭+useRouter ?tab= 동기화 / overview-tab-v2 좌소개·운영원칙(준비중)+우연락처·스폰서(준비중) / teams-tab-v2 빈상태 / events-tab-v2 series.tournaments 평탄화 4건 / members-tab-v2 4열 카드+role한국어라벨+sinceYYYY) + `page.tsx` 재작성(searchParams.tab 정규화 + 기존 include 트리 0변경 + members.created_at 1줄만 추가). `_components/org-card-v2.tsx` pickColor/generateTag 공유 헬퍼 import로 통합. Phase 3 Orgs 추후 구현 목록 9건으로 확장(founded_year/address/policies/sponsors/team집계/임원직책 추가). tsc EXIT=0 / `/organizations/org-ny6os` + 4탭 전부 200(?tab=overview/teams/events/members) | ✅ (커밋 대기) |
| 04-22 | developer | **Phase 2 CreateGame — 단일 폼 v2 재구성 (위자드 → 3카드 + 고급 설정 아코디언으로 DB 필드 보존)** — 5 신규(`_v2/game-form.tsx` + `kind-selector.tsx` + `basic-info-section.tsx` + `conditions-section.tsx` + `advanced-section.tsx`) + `new-game-form.tsx` 수정(`GameFormV2` 호출로 교체). 시안 3카드(종류 3버튼 / 정보 9필드 / 조건 체크박스 6개→requirements JOIN) + 고급 설정 아코디언(9필드 보존) + 액션 3버튼(취소/임시저장/경기 개설). FormData 키 23개 전부 기존 `createGameAction` 시그니처 유지. 위자드 전용 6파일(`game-wizard` + `step-*` 4종 + `wizard-progress`) 삭제 없이 import만 끊음. UpgradeModal/SuccessOverlay 재사용. Kakao postcode + 지난 경기 복사(`/api/web/games/my-last-game`) + 최근 장소(`/recent-venues`) + localStorage 프리셋(`bdr_game_presets`) 전부 보존. tsc --noEmit EXIT=0 PASS / `/games/new` 비로그인 200(로그인 페이지 리다이렉트) | ✅ (커밋 대기, 로그인 세션 브라우저 수동 검증 필요) |
| 04-22 | developer | **Phase 2 Search — v2 재구성 (탭 7개, 데이터 보존)** — `page.tsx`(서버, Prisma 6테이블 유지 + 직렬화) + `_components/search-client.tsx`(신규, controlled form + URL push + 탭 7종 클라 필터) + `loading.tsx`(v2 스켈레톤). 탭: 전체/팀/경기/대회/커뮤니티/코트/유저. API/Prisma/서비스 0 변경. 6종 데이터 전부 화면 보존. tsc EXIT=0 / `/search` 200 / `/search?q=test` 200 + `.page`·`type="search"`·탭 7개 전부 렌더 | ✅ (커밋 대기, PM 처리) |
| 04-24 | developer | **Phase 2 MyGames — v2 재구성 (A 변형: 신청내역 + 호스트 섹션 보존)** — 시안 "내 신청 내역"(경기+대회 통합) 메인 + 하단 기존 "내가 만든 경기" 보존. 4 신규(stat-card / status-badge / reg-row[client] / my-games-client[client]) + page.tsx 완전 재작성(Prisma 3병렬: game_applications+tournamentTeam+hostedGames). 상태 4종(confirmed/pending/completed/cancelled, Q4 waitlist/no-show 제거). just-applied 배너 sessionStorage 유지. 결제=Link→/pricing/checkout, QR·후기·호스트 문의·영수증 등은 alert("준비 중"). API route.ts/Prisma 스키마 0 변경. tsc --noEmit EXIT=0 PASS | ✅ (커밋 대기, 로그인 세션 브라우저 수동 검증 필요) |
| 04-24 | developer | **Phase 1 Profile — /profile + /users/[id] v2 재구성** — D-P1~D-P8 추천값 + 누락 4필드(bio/gender/evaluation_rating/total_games_hosted) 전부 표시. 10신규(profile/_v2/*6 + users/[id]/_v2/*4) + 2재작성(각 page.tsx). /profile "use client" → 서버 컴포넌트 전환(Prisma 직접 호출 8쿼리). 탭 2개(D-P5) / 슛존·스카우팅 제거(D-P6) / physical strip 3열(D-P3) / isOwner→/profile redirect(D-P7) / user_badges 직접 쿼리(D-P8). tsc EXIT=0 / `/profile` 307 / `/users/1` 200(95KB) / `/users/7` 200(110KB bio 렌더 확인) / `/users/2832` 200. HTML: linear-gradient 1 + aria-pressed 2(탭 2개) + 슛존/스카우팅 0 + repeat(3,1fr)/(6,1fr) 각 1 | ✅ (커밋 대기) |
| 04-24 | developer | **Phase 1 GameDetail — v2 시안 재구성 (안 A)** — `_v2/` 5 신규(summary-card / about-card / participant-list / apply-panel / host-panel) + `page.tsx` 재작성. 2열 info grid + 조건부 행(duration·contact·allow_guests·uniform) / AboutCard(description·requirements·notes) / ParticipantList(이니셜+position) / ApplyPanel(6분기 CTA + 한마디·저장·문의 alert) / HostPanel(수정·취소+신청자 관리 응집). HeroBanner·PriceCard·HostCard·ParticipantsGrid·PickupDetail·GuestDetail·TeamMatchDetail 미사용(파일 보존). API/Prisma/service 0 변경. tsc EXIT=0 / `/games/552` 200 (3.18s) + 551/550 200 (0.2s). HTML 검증: `.page` 1 + `.card` 15 / 연락처·유니폼·게스트·참가자 필드 전부 렌더 | ✅ (커밋 대기) |
| 04-25 | developer | **Phase 3 Orgs — /organizations v2 재구성 (단체 등록 라벨 + 필터 chip)** — `_components/` 2 신규(org-card-v2 그라디언트 헤더+태그 자동 생성+가입 신청 alert / orgs-list-v2 클라 컨테이너+종류 chip 4종 "전체"만 동작·"리그/협회/동호회" 클릭 시 alert+opacity0.55) + `page.tsx` 재작성(.page eyebrow+h1+부제+"단체 등록" 버튼 라벨 변경). DB 미지원 3필드 자동 폴백(`color`=id 해시→6색 팔레트 / `tag`=이름 첫 2글자/영문이면 대문자 4글자 / `kind`="단체" 고정 배지). 데이터 패칭 0 변경(prisma.organizations.findMany 그대로). 추후 구현 목록에 Phase 3 Orgs 5건 신규(kind/brand_color/tag 필드 + 가입 신청 API + teams 집계). tsc EXIT=0 / `/organizations` 200(0.98s, 55KB). HTML: `단체 · ORGANIZATIONS` + `리그 · 협회 · 동호회` + `단체 등록` + `준비 중` + `orgs-list-v2` 마커 전부 렌더 확인 | ✅ (커밋 대기) |
| 04-22 | developer | **Phase 3 Court 상세 — /courts/[id] v2 재구성 (헤더+혼잡도+Side KakaoMap)** — 신규 1 (`_components/court-detail-v2.tsx`: 시안 브레드크럼+area eyebrow+30px h1+image placeholder(자동태그)+desc / 오늘 혼잡도(시간대 12슬롯 빈+첫슬롯만 현재 활성카운트 단일 막대+"시간대별 분포 데이터 준비 중" 캡션) / Side sticky(KakaoMap 180px 단일마커+길찾기/지도열기 / 시설 정보 2col 그리드(샤워/락커/연락처 "정보 없음") / 모집 글쓰기 alert / MiniStat 3통계 흡수)) + `page.tsx` 수정(import 1 + courtV2Data 직렬화 + `<CourtDetailV2>` 1줄 + (구) 메인정보카드 218줄/이용현황 24줄/InfoBadge·StatBlock 헬퍼 2개 제거 + QR버튼만 시안 외 운영 핵심으로 별도 보존). **API/Prisma/하단 클라컴포넌트 8종 0 변경**(CourtCheckin/Ambassador/Pickups/Events/Rankings/Reviews/Reports/EditSuggest 전부 보존). courts.tags/operating_hours/shower/locker/phone/시간대별 집계 DB 미지원 → 자동 폴백 + "정보 없음"/"준비 중" 처리. tsc --noEmit EXIT=0 / `/courts/100` 200 (135KB). HTML: 오늘의 혼잡도·시설 정보·이곳에서 모집 글쓰기·시간대별 분포·COURT PHOTO·준비 중·농구장 목록 마커 전부 렌더 확인 | ✅ (커밋 대기) |
| 04-22 | developer | **Phase 3 TeamCreate — /teams/new v2 4스텝 멀티스텝 폼 (B 옵션: 영문 팀명 보존)** — `_v2/` 6 신규(team-form 메인+useActionState/state6키hidden제출/약관미체크 차단 / stepper 36px원형+연결선 4스텝 / step-basic 한글명·영문명·대표언어토글·팀태그(시안신규UIonly)·팀소개 / step-emblem 10팔레트+미리보기160×160+엠블럼업로더(BDR+준비중)+secondary색상보존 / step-activity 홈코트·실력6단계·요일7토글·공개3종 모두 "준비중" / step-review 7행검토표+약관2개체크 차단) + `new-team-form.tsx` 슬림화(`<TeamFormV2/>` import 1줄). **createTeamAction / createTeamSchema / Prisma 0 변경**. FormData 키 6개(name/name_en/name_primary/description/primary_color/secondary_color) 그대로. 시안 신규 5필드(tag/home/level/days/privacy/엠블럼) UI 만 + "준비 중". 추후 구현 목록에 Phase 3 TeamCreate 7건 신규. tsc --noEmit EXIT=0 PASS / `/teams/new` 200 (Next 15 Turbopack dev 특성, 운영 307 정상) / 런타임 에러 0 | ✅ (커밋 대기, PM 처리) |
| 04-22 | developer | **Phase 5 More — NotFound + About v2 적용 (X 옵션)** — `not-found.tsx` 전면 재작성(시안 More.jsx L3-20 충실 — 거대 404 120px ff-display+accent / "에어볼!" 농구 메타포 / 3버튼 .btn--primary→홈 + 검색→/search Phase 2 + 도움말→/help/glossary). 신규 1 `(web)/about/page.tsx`(시안 More.jsx L22-115 6 섹션: Hero(eyebrow+h1 42px+리드) / 통계 4셀(20년/48,000+/320+/1,240회 "예시" 캡션) / "우리가 만드는 것" 6 카드(공정매치/투명기록/지역연결/열린커뮤니티/공정운영/지속가능성) / 운영진 6 이니셜아바타 "예시" 캡션 / 파트너 8 mono fontFamily / CTA 가입·로그인 둘 다 /login + 경기둘러보기 /games). app-nav.tsx 1줄 수정(L117 `/` → `/about` + 폴백 주석 제거). **API/Prisma/서비스 0 변경**. 추후 구현 Phase 5 More 4건 신설(통계 4건 동적/운영진 명단/파트너 로고/회원가입 페이지 분리). tsc --noEmit EXIT=0 PASS | ✅ (커밋 대기, PM 처리) |
| 04-22 | developer | **Phase 5 Awards — /awards v2 신규 (글로벌 톱레벨, profile 하위 X)** — 신규 3 (`awards/_v2/awards-catalog.ts` 시안 6 honor 정적 메타 카탈로그 — kind/label/color + notReady 폴백 / `HONOR_CATALOG[6]` 순서 보존 + `ALL_STAR_POSITIONS=[PG,SG,SF,PF,C]` + `ALL_STAR_GROUPS [first/accent, second/cafe-blue]` / `awards/_v2/awards-content.tsx` "use client" 시안 Awards.jsx L50-176 충실 이식: Breadcrumb(홈›수상·아카이브) + 시즌 셀렉터(useRouter+useSearchParams ?series= URL 동기화 + 활성 ink배경) + 시즌 MVP Hero(135deg teamColor→#000 그라디언트 + 트로피 이모지 + 56px ff-display name + teamTag(영문3자/한글2자 폴백) + PPG/APG/RPG/WIN%(null="—") + MVP 코멘트 폴백 "수상 코멘트는 준비 중") + 우상단 팀 레이팅 카드(빈 5행 dashed placeholder + "집계 준비 중" + query_stats 아이콘) + 주요 수상 6 카드 3열(borderTop 3px tier색 + 36×36 tag박스 + 데이터 있으면 선수+metric, 없으면 "준비 중"·"수상자가 없습니다") + 올-스타 1st/2nd 2카드 5포지션 빈 슬롯("준비 중" + opacity 0.5 + schedule 아이콘) + 역대 우승팀 .board 6열(시즌·대회·우승🏆·준우승·스코어·MVP, 빈 상태 fallback) / `awards/page.tsx` 서버 컴포넌트 force-dynamic + 비로그인 허용 + searchParams.series 폴백 + 6단계 Prisma 직접 호출: ①tournament_series.findMany is_public+status=active(20건) → seasons 셀렉터 + "전체" 옵션 ②Tournament.findFirst(시즌범위 + mvp_player_id ≠ null) ORDER BY endDate desc → 시즌 MVP + matchPlayerStat.aggregate(_avg points/assists/total_rebounds) ③`$queryRaw` GROUP BY user_id × 3 (득점왕/어시왕/리바왕, AVG NULLS LAST DESC LIMIT 1, OFFICIAL_MATCH_SQL_CONDITION + series 필터 Prisma.sql 바인딩) + 팀명 서브쿼리 ④TournamentMatch.findMany roundName LIKE 결승/final/championship + 폴백(시즌 최신 mvp 매치) → Finals MVP ⑤Tournament.findMany champion_team_id ≠ null ORDER BY endDate desc 10건 + tournamentTeams where final_rank=2 + tournamentMatches where roundName 키워드 매칭 → 역대 우승팀(시즌라벨/대회/우승🏆/준우승/스코어/MVP). **API route.ts / Prisma 스키마 / 서비스 0 변경. 신규 fetch 0건**. 카페 세션 무관. is_public=true 가드. officialMatchWhere() / officialMatchNestedFilter() / OFFICIAL_MATCH_SQL_CONDITION 전부 사용. BigInt→string + Decimal→Number(.toString()) + Date→ISO 직렬화. DB 미지원 5건 "준비 중" 빈 카드 처리(팀 ELO/올해의 감독/올스타 1st·2nd/MVP 코멘트/d:+48 변동). 추후 구현 Phase 5 Awards 8건 신설(team_ratings 테이블+ELO cron / season_all_star_teams / Team.coach_user_id / tournament_mvp_quotes / seasons 테이블 분리 / NEW FACE 루키 식별 / Finals MVP 결승 식별 정밀화 / 시즌 변동 snapshot). tsc --noEmit EXIT=0 PASS | ✅ (커밋 대기, PM 처리) |
| 04-22 | developer | **Phase 5 Reviews — /reviews v2 신규 (C안 Saved 패턴 응용 + 4탭 분리, 글로벌 톱레벨)** — 신규 2 (`reviews/page.tsx` 서버 컴포넌트 force-dynamic + 비로그인 허용(공개 콘텐츠) + `prisma.court_reviews.findMany({where:{status:"published"}, include:{court_infos:select(id/name/city/district/address) + users:select(id/nickname/name)}, orderBy:{created_at:"desc"}, take:60})` + splitTitleBody(content) "첫 줄=title 나머지=body, 60자 초과 한 줄은 50자 컷+'…'" + countPhotos(JSON 배열 길이) + targetSub city+district→address 폴백 + author=nickname→name→"익명" 폴백 + authorLevel="L.—" placeholder + likes=helpful=likes_count 매핑(helpful_count 컬럼 분리 전) + verified=is_checkin + BigInt→string + Date→ISO 직렬화 / `reviews/_v2/reviews-content.tsx` "use client" useState<TabId>("all")+useState<SortId>("recent") + 4탭(전체/대회/코트/팀/심판, court 만 실데이터) + 정렬 3종(최신/별점/도움) + 시안 Reviews.jsx 충실: ①Breadcrumb(홈›리뷰) ②Header 2열 그리드 minmax(0,1fr) 360px(좌:eyebrow+h1 32px+부제 / 우:요약 카드 평균별점 44px ff-display+StarRow+ "{total}개 리뷰 · 인증 {verified}"+5★~1★ 분포바 grid 20px/1fr/32px, 4-5★=ok/3★=accent/1-2★=err) ③Controls 카드 좌:타입 5버튼 chip(active=btn--primary, count opacity 0.7 ff-mono) 우:정렬 select+"+ 리뷰 쓰기" disabled "코트 상세 페이지에서…" ④카드 grid 180px/1fr/auto: 좌(코트 상세 Link → `/courts/{courtId}` + 시안 typeColor.court=cafe-blue 라벨 + 코트명 + targetSub mono) 중(StarRow 14px + b 제목 15px + 본문 5줄 line-clamp + 📷 사진 N장 + 작성자 b/L.— 뱃지/날짜 mono) 우(👍 도움됨 + 🚩 신고 transparent + ♥ likes — 모두 disabled "준비 중") ⑤미지원 3탭(대회/팀/심판) construction 48px + "리뷰 시스템 준비 중" + 탭별 메시지 ⑥coiurts 0건(rate_review 48px) "아직 등록된 코트 리뷰가 없습니다"). **API route.ts / Prisma 스키마 / 서비스 0 변경. 신규 fetch 0건**. 카페 세션 무관. 비로그인도 열람 가능(공개). status='published' 만 노출. `eyebrow/badge--ok/badge--soft/btn--primary/btn--accent/btn--sm/input/card/badge--ok` 기존 globals.css 정의 활용. 추후 구현 Phase 5 Reviews 11건 신설(tournament_reviews/team_reviews/referee_reviews 모델 / helpful_count 분리 + court_review_helpfuls 토글 / 리뷰 태그 / User 레벨 LevelBadge / 통합 작성 폼 / 신고 기능 / 본문 line-clamp 토글 / 사진 라이트박스 / 페이지네이션). tsc --noEmit EXIT=0 PASS | ✅ (커밋 대기, PM 처리) |
| 04-22 | developer | **Phase 6 Login — /login v2 리디자인 (시안 Login.jsx + 탭 2종 + 인라인 폼)** — 1파일 전면 재작성(`(web)/login/page.tsx` 288→362줄). UI 교체만, 인증 로직/서버 액션/OAuth href/InfoDialog/Dev 자동 로그인 0 변경. 헤더 `MyBDR.` 대형 ff-display 36px + `.` accent + 부제 "서울 3x3 농구 커뮤니티". `.card` + 탭 2종(로그인/회원가입) cafe-blue 3px 하단 라인 + bg-elev/bg-alt 토글. 로그인 탭: `.label`+`.input` 2필드(email/password) + 자동로그인 체크박스 disabled+title="준비 중"+우측 "준비 중" 뱃지(D4) + 비밀번호 찾기 button → `router.push("/forgot-password")` + `.btn--primary .btn--xl` "로그인" + "또는" divider + 카카오/네이버 grid(네이버 disabled+title) + Google OAuth 추가 행(시안 외 PM 결정 유지). 회원가입 탭: cafe-blue-soft 안내 뱃지("준비 중") + 5필드 모두 disabled(아이디/비번/비번확인/닉네임/활동지역) + 약관 체크 disabled + 가입하기 button → `router.push("/signup")`. 푸터: `← 홈으로 돌아가기` button → `/`. Dev 자동 로그인 별도 카드(NODE_ENV !== production, .btn--sm). **보존**: `loginAction`/`devLoginAction`/`useActionState`/`name="email"/"password"/"redirect"` hidden input/`isValidRedirect`/`OAUTH_ERRORS`/`REDIRECT_BANNERS`/`InfoDialog 2종`(redirectBanner+OAuth error). **삭제**: 이메일 모달(`showEmailModal`), 눈 아이콘 토글(`showPassword`), `<style jsx global>` slide-up/fade-in (인라인 폼으로 대체). 모든 색상 BDR v2 토큰(var(--cafe-blue)/--ink/--ink-mute/--ink-dim/--bg-elev/--bg-alt/--border/--accent/--accent-soft/--cafe-blue-soft/--cafe-blue-deep/--danger/--link). globals.css `.card`/`.input`/`.label`/`.select`/`.btn`/`.btn--primary`/`.btn--xl`/`.btn--sm` 그대로 활용. **layout.tsx 0 변경**(getWebSession 가드 유지). 추후 구현 Phase 6 Login 3건 신설(자동 로그인 토큰 시스템 / 회원가입 인라인 폼 / 네이버 OAuth 활성화). tsc --noEmit EXIT=0 PASS | ✅ (커밋 대기, PM 처리) |
| 04-22 | developer | **Phase 5 Saved — /saved v2 신규 (옵션 C + 7탭 분리, 글로벌 톱레벨)** — 신규 2 (`saved/page.tsx` 서버 컴포넌트 force-dynamic + getWebSession + 비로그인 시 인라인 로그인 카드(`bookmark` 아이콘+`/login?redirect=/saved` btn--accent) + Promise.all 2병렬: `prisma.board_favorites.findMany select(id/category/position/created_at) orderBy[position asc, created_at asc]` + `prisma.user_favorite_courts.findMany include:{courts select(id/public_id/name/city/district/indoor/rental_fee/opening_hours)} orderBy[last_used_at desc, created_at desc]` + CATEGORY_LABEL 7매핑(notice/general/recruit/review/marketplace/qna/info → 한글) + courts.public_id 폴백 + city+district 합쳐 area + last_used_at→created_at 폴백 + BigInt→string + Date→ISO 직렬화 / `saved/_v2/saved-content.tsx` "use client" useState<TabId> + 7탭(전체/게시글/게시판/경기/대회/팀/코트, count fontFamily mono) + 활성 시 var(--accent) 2px underline + 시안 Saved.jsx Breadcrumb(홈›보관함) + Header eyebrow "Saved · Bookmarks"+h1 32px+부제 + 액션 2버튼 disabled "준비 중"(내보내기/폴더 관리, opacity 0.5 cursor not-allowed) + 게시판 섹션(forum 아이콘 + auto-fill minmax(220px,1fr) Link 카드 → `/community?category={category}` + 🔖 bookmark var(--accent) 우상단 + 저장일 ff-mono) + 코트 섹션(place 아이콘 + auto-fill minmax(260px,1fr) Link 카드 → `/courts/{public_id}` + nickname 우선 본명 보조표기 + area + opening_hours/rental_fee(0=무료)/indoor 메타 + 사용 N회 + 저장일) + 미지원 4탭 안내(construction 아이콘 + "게시글/경기/대회/팀 북마크 기능은 곧 추가됩니다") + 전체+0건 글로벌 빈상태(bookmark_border 48px) + 게시판 0건/코트 0건 탭별 안내). **API route.ts / Prisma 스키마 / 서비스 0 변경. 신규 fetch 0건**. 카페 세션 무관. 세션 userId 기반 본인 데이터만(IDOR 없음). 추후 구현 Phase 5 Saved 6건 신설(community_post_bookmarks / game_bookmarks / tournament_bookmarks / team_follows(Phase 3 Teams 통합) / saved_folders / 내보내기 CSV·PDF). tsc --noEmit EXIT=0 PASS | ✅ (커밋 대기, PM 처리) |

---

## 구현 기록 — Phase 5 Reviews — /reviews v2 신규 [2026-04-22]

📝 구현한 기능: BDR v2 시안 `screens/Reviews.jsx` 의 4탭(대회/코트/팀/심판) 커뮤니티 리뷰 페이지를 글로벌 톱레벨 라우트 `/reviews` 로 신규 구현. PM 결정 C안(Saved 패턴 응용 + 4탭 분리). **API/Prisma 스키마 0 변경**. 현재 DB에 모델 존재하는 1종(`court_reviews`) 만 실데이터 표시, 나머지 3종(대회/팀/심판)은 "리뷰 시스템 준비 중" 안내 카드. 비로그인도 열람 가능(공개 콘텐츠).

| 파일 경로 | 변경 내용 | 신규/수정 |
|----------|----------|----------|
| `src/app/(web)/reviews/page.tsx` | 서버 컴포넌트 + `export const dynamic = "force-dynamic"`. 비로그인 허용(공개 데이터). `prisma.court_reviews.findMany({where:{status:"published"}, include:{court_infos:{select:{id/name/city/district/address}}, users:{select:{id/nickname/name}}}, orderBy:{created_at:"desc"}, take:60})`. 헬퍼 2: ①`splitTitleBody(content)` — 첫 줄=title 나머지=body, 한 줄 60자 초과면 50자 컷+"…" 후 본문으로 이동, null/빈 문자열 폴백 "리뷰" ②`countPhotos(photos JSON)` — 배열이면 length, 아니면 0. **매핑**: target=court_infos.name / targetSub=city+district 폴백→address / author=nickname→name→"익명" / authorLevel="L.—" placeholder / likes=helpful=likes_count(helpful_count 컬럼 분리 전 동일 매핑) / verified=is_checkin / photos=photos JSON 배열 길이. court_infos null 또는 users null 인 행 필터링(외래키 onDelete:NoAction). courtId 는 numeric id(코트 상세 라우트 BigInt(id) 기반). BigInt→string + Date→ISO 직렬화. `<ReviewsContent courts={courts} />` 렌더 | 신규 |
| `src/app/(web)/reviews/_v2/reviews-content.tsx` | "use client" + `useState<TabId>("all")` + `useState<SortId>("recent")`. **TabId** = "all" \| "tournament" \| "court" \| "team" \| "referee". **PENDING_TABS** = ["tournament","team","referee"] (DB 모델 부재). **SortId** = "recent" \| "rating" \| "helpful". **TYPE_COLOR** {tournament:accent, court:cafe-blue, team:ok, referee:#8B5CF6}. **fmtDate(iso)** "YYYY.MM.DD" mono. **StarRow({rating,size})** Math.round(rating) 채움 + 5-rating 빈칸. **summary** useMemo: total/avg(toFixed(1))/dist[5★~1★]/verified 카운트 (court 만 대상). **counts** all=courts.length / 미지원=0 / court=courts.length. **visibleCourts** all 또는 court 탭만 노출. **sortedCourts** rating은 별점 desc + 동점 시 createdAt desc, helpful은 helpful desc + 동점 시 createdAt desc, recent는 createdAt ISO 문자열 비교 desc. **showPending** PENDING_TABS 포함. **showCourtsEmpty** all/court 탭 + courts.length===0. UI: ①Breadcrumb(홈›리뷰) ②Header 2열 그리드 minmax(0,1fr) 360px(좌:eyebrow "커뮤니티 리뷰 · REVIEWS"+h1 32px "다녀온 사람들의 진짜 후기"+부제 / 우:요약 카드 평균별점 44px ff-display+StarRow 16px+ "{total}개 리뷰 · 인증 {verified}"+5★~1★ 분포바 grid 20px/1fr/32px, 4-5★=ok/3★=accent/1-2★=err) ③Controls 카드(좌:타입 5버튼 chip [전체/대회 0/코트 N/팀 0/심판 0], active=btn--primary, count opacity 0.7 ff-mono / 우:정렬 select+"+ 리뷰 쓰기" disabled "코트 상세 페이지에서 리뷰를 작성할 수 있습니다 (통합 작성 폼은 준비 중)") ④카드 grid 180px/1fr/auto: 좌(코트 상세 Link → `/courts/{courtId}` + 시안 typeColor.court=cafe-blue 라벨 "코트" + 코트명 fw700 + targetSub 11px mono) 중(StarRow 14px + b 제목 15px + 인증 badge--ok + 본문 5줄 line-clamp(WebkitLineClamp 5) + 📷 사진 N장 + 작성자 b/L.— badge--soft/날짜 mono) 우(👍 도움됨 + 🚩 신고 transparent border 0 ink-dim + ♥ likes — 모두 disabled "준비 중") ⑤미지원 3탭(대회/팀/심판) construction 48px + "리뷰 시스템 준비 중" + 탭별 메시지("대회/팀/심판 후기는 곧 추가됩니다") ⑥coiurts 0건 rate_review 48px "아직 등록된 코트 리뷰가 없습니다" + "첫 리뷰를 작성하려면 코트 상세 페이지에서 별점을 남겨주세요" | 신규 |
| `.claude/scratchpad.md` | "🚧 추후 구현 목록"에 "Phase 5 Reviews" 11건 신설(tournament_reviews / team_reviews / referee_reviews 모델 / helpful_count 컬럼 분리 + court_review_helpfuls 토글 / 리뷰 태그 시스템 / User 레벨 LevelBadge / 리뷰 통합 작성 폼 / 신고 기능 review_reports / 본문 line-clamp 토글 / 사진 라이트박스 / 페이지네이션) + 작업 로그 1줄 추가 + 본 구현 기록 섹션 추가 | 수정 |

💡 tester 참고:
- **테스트 방법 1 (비로그인 허용)**: 로그아웃 상태로 `/reviews` 진입 → 200 + 리뷰 카드 그리드 정상 노출. Saved 와 달리 로그인 가드 없음.
- **테스트 방법 2 (4탭 + 카운트)**: 전체 탭 = court 데이터만 표시. 대회/팀/심판 탭 클릭 시 각각 0 카운트 + construction 안내 카드. 코트 탭 클릭 시 court 데이터만 표시(전체와 동일하나 명시적).
- **테스트 방법 3 (정렬)**: 정렬 select 토글 — 최신순(created_at desc) / 별점순(rating desc + 동점 시 최신) / 도움순(likes_count desc + 동점 시 최신). 결과 순서 확인.
- **테스트 방법 4 (리뷰 카드 클릭)**: 좌측 라벨/코트명 영역 클릭 → `/courts/{numeric_id}` 이동. 우측 도움됨/신고 버튼 hover 시 `title="준비 중"` 툴팁 + disabled.
- **테스트 방법 5 (요약 카드)**: 우상단 평균별점이 court 리뷰 평균과 일치. 분포바 5행 합계 = total. "인증 N" = is_checkin=true 카운트와 일치.
- **테스트 방법 6 (제목/본문 분리)**: content 가 한 줄짜리 짧은 텍스트 → 그대로 title, body="". 한 줄짜리 60자 초과 → title=50자+"…", body=원본. 줄바꿈 있는 멀티라인 → 첫 줄 title, 나머지 body. content NULL/빈 문자열 → title="리뷰", body="".
- **정상 동작**: 4탭 + 정렬 + 카드 그리드 + Link 이동 + 5줄 line-clamp + 사진 N장 표기 + 인증 뱃지 + L.— placeholder + ♥/도움됨/신고 모두 disabled.
- **주의할 입력**: ①리뷰 0건 DB → 전체/코트 탭에서 rate_review 빈상태 ②court_infos 또는 users 가 NULL(외래키 onDelete:NoAction이라 일반적으로는 남아있음, 만일 직접 DELETE 된 경우) → 페이지에서 자동 필터링 ③users.nickname/name 둘 다 NULL → "익명" 표시 ④content 매우 긴 본문 → 5줄 line-clamp 후 잘림(라이트박스 미구현) ⑤photos 가 string 또는 객체(잘못된 JSON) → countPhotos 0 반환 ⑥status='draft'/'hidden'/'reported' → 자동 제외(where 가드).

⚠️ reviewer 참고:
- **공개 가드**: `where:{status:"published"}` 만 노출. draft/hidden/deleted 자동 제외. 비공개 리뷰 노출 위험 0.
- **API 0 변경**: 기존 라우트(/api/web/...) 신규 추가 0건. 모든 데이터는 서버 컴포넌트 직접 Prisma 호출. PM 규칙 "API/Prisma 0 변경" 준수.
- **라우트 충돌**: 기존 라우트 `/reviews` 부재 확인 완료. globally-leveled.
- **기존 court_reviews UI 영향**: court 상세 페이지의 CourtReviews 클라이언트 컴포넌트(`_components/court-reviews.tsx`)는 SWR 로 별도 fetch 하며 본 작업과 무관. 영향 0.
- **광고 자료 같은 코트명·주소 노출**: court_infos 테이블의 공개 필드만 사용. 작성자 닉네임도 PostDetail/CommunityList 와 동일한 노출 정책.
- **CSS 클래스 검증**: `.eyebrow / .badge--ok / .badge--soft / .btn / .btn--primary / .btn--accent / .btn--sm / .input / .card / .page` 모두 globals.css 정의 확인(grep 207/238/241/242/243/247/282/283/316). 신규 클래스 0.
- **typeColor TypeScript 안전성**: `Record<Exclude<TabId, "all">, string>` 으로 모든 4타입 강제. all 탭은 court 만 노출하므로 미사용 키 없음.
- **Decimal 변환 0**: court_reviews 에 Decimal 컬럼 없음(rating=Int / likes_count=Int). users 모델도 string 만 사용. 직렬화 BigInt→string + Date→ISO 만 필요.
- **하드코딩 색상**: TYPE_COLOR.referee 의 `#8B5CF6` 만 시안 그대로 보존(violet 8b5cf6). 추후 `--violet-500` 같은 토큰 도입 시 교체 검토. 다른 색은 var(--*) 토큰 100% 사용.

---

## 구현 기록 — Phase 5 Saved — /saved v2 신규 [2026-04-22]

📝 구현한 기능: BDR v2 시안 `screens/Saved.jsx` 의 7탭(전체/게시글/게시판/경기/대회/팀/코트) 보관함을 글로벌 톱레벨 라우트 `/saved` 로 신규 구현. PM 결정 옵션 C(7탭 분리, 미지원 4탭 빈상태). **API/Prisma 스키마 0 변경**. 현재 DB에 모델 존재하는 2종(`board_favorites` / `user_favorite_courts`) 만 실데이터 표시, 나머지 4종(게시글/경기/대회/팀)은 "북마크 시스템 준비 중" 안내 카드.

| 파일 경로 | 변경 내용 | 신규/수정 |
|----------|----------|----------|
| `src/app/(web)/saved/page.tsx` | 서버 컴포넌트 + `export const dynamic = "force-dynamic"`. `getWebSession()` 비로그인 → 인라인 로그인 카드(`bookmark` 48px + `/login?redirect=/saved` btn--accent). `Promise.all` 2병렬: ①`prisma.board_favorites.findMany({where:{user_id}, select:{id/category/position/created_at}, orderBy:[{position:"asc"},{created_at:"asc"}]})` ②`prisma.user_favorite_courts.findMany({where:{user_id}, include:{courts:{select:{id/public_id/name/city/district/indoor/rental_fee/opening_hours}}}, orderBy:[{last_used_at:"desc"},{created_at:"desc"}]})`. **CATEGORY_LABEL 7매핑**(notice/general/recruit/review/marketplace/qna/info → 한글, community-aside.tsx 와 동일). courts.public_id 폴백 + city+district join → area + last_used_at→created_at 폴백 + BigInt→string + Date→ISO 직렬화 + courts null 필터링(코트 삭제 케이스). `<SavedContent boards={boards} courts={courts} />` 렌더 | 신규 |
| `src/app/(web)/saved/_v2/saved-content.tsx` | "use client" + `useState<TabId>("all")`. **TabId** = "all" \| "posts" \| "boards" \| "games" \| "tourney" \| "teams" \| "courts". **PENDING_TABS** = ["posts","games","tourney","teams"] (DB 모델 부재). **fmtDate(iso)** "YYYY.MM.DD" mono 표기. **counts** useMemo로 7탭 카운트(미지원=0). **showBoards/showCourts** 전체 탭 시 데이터 있을 때만 + 전용 탭 시 항상. **showPending** PENDING_TABS 포함 시 안내 카드. **isAllEmpty** 전체 탭 + 0+0건일 때 글로벌 빈상태. UI: ①Breadcrumb(홈›보관함) ②Header eyebrow "Saved · Bookmarks" + h1 32px + 부제 + 액션 2 disabled "준비 중"(opacity 0.5 cursor not-allowed) ③탭 7개(활성=var(--accent) 2px underline + 700, count=ff-mono 11px) ④게시판 섹션(forum 18px + h2 + auto-fill minmax(220px,1fr) Link 카드 → `/community?category={category}` + 🔖 bookmark var(--accent) 우상단 + 저장일 ff-mono) ⑤코트 섹션(place 18px + auto-fill minmax(260px,1fr) Link 카드 → `/courts/{courtPublicId}` + nickname 우선 본명 보조표기 + area + 시간/요금(0=무료)/실내외 메타 + 사용 N회 + 저장일) ⑥미지원 4탭 안내(construction 48px + 탭별 메시지) ⑦전체+0건 글로벌 빈(bookmark_border 48px) ⑧게시판/코트 탭 0건 안내 | 신규 |
| `.claude/scratchpad.md` | "🚧 추후 구현 목록"에 "Phase 5 Saved" 6건 신설(community_post_bookmarks/game_bookmarks/tournament_bookmarks/team_follows(Phase 3 Teams 통합)/saved_folders/내보내기 CSV·PDF) + 작업 로그 1줄 추가 + 본 구현 기록 섹션 추가 | 수정 |

💡 tester 참고:
- **테스트 방법 1 (비로그인)**: 로그아웃 상태로 `/saved` 진입 → 200 + bookmark 아이콘 + "보관함을 보려면 로그인이 필요합니다" + 로그인 버튼이 `/login?redirect=/saved` 로 이동.
- **테스트 방법 2 (로그인 + 데이터 0건)**: 신규 가입 직후 또는 board_favorites/user_favorite_courts 모두 0건인 사용자 → 전체 탭에서 bookmark_border 48px + "아직 보관한 항목이 없어요" 안내 카드.
- **테스트 방법 3 (게시판 데이터 표시)**: `board_favorites` 가 있는 사용자 → 전체 탭에 forum 섹션 + 게시판 카드들. 카드 클릭 시 `/community?category={slug}` 이동(예: notice → /community?category=notice). 카테고리 매핑 실패 시 슬러그 그대로 표시.
- **테스트 방법 4 (코트 데이터 표시)**: `user_favorite_courts` 가 있는 사용자 → 전체 탭에 place 섹션 + 코트 카드들. 카드 클릭 시 `/courts/{public_id}` 이동. nickname 있으면 "별명 (코트명)" 형태, 없으면 코트명만. 사용 N회 + 저장일(last_used_at 또는 created_at).
- **테스트 방법 5 (탭 전환)**: 탭 클릭 시 React state 만 변경(URL 변동 없음). 전체 → 게시판 → 코트 정상 필터링. 게시글/경기/대회/팀 클릭 시 construction 아이콘 + "북마크 기능은 곧 추가됩니다" 안내 카드.
- **테스트 방법 6 (액션 disabled)**: 우상단 "내보내기"/"폴더 관리" 버튼 hover 시 `title="준비 중"` 툴팁 + 클릭 비활성(disabled).
- **정상 동작**: 비로그인 200 + 인라인 로그인 카드 / 로그인 + 데이터 0건 빈상태 / 데이터 있을 때 카드 그리드 + Link 이동 / 7탭 카운트 표시 정확 / 미지원 4탭 안내 카드 표시.
- **주의할 입력**: ①CATEGORY_LABEL 에 없는 슬러그(예: 운영자가 새 카테고리 추가) → 슬러그 원문 표시(라벨 매핑 실패 폴백) ②favorite_courts 의 courts join 결과 null(원본 코트 삭제 시) → 페이지에서 자동 필터링 ③last_used_at NULL 인 코트 → created_at 폴백 사용 ④nickname 없는 코트 → 본명만 표시 ⑤rental_fee=0 → "무료", null → 미표시 ⑥session.sub BigInt 변환 시 잘못된 토큰 → catch 폴백으로 빈 배열 반환.

⚠️ reviewer 참고:
- **IDOR 검증**: `where:{user_id: BigInt(session.sub)}` 둘 다 본인 ID 강제. 다른 사용자 ID 주입 경로 없음. 직접 호출 페이지라 API IDOR 표면 자체 부재.
- **API 0 변경**: 기존 라우트(/api/web/...) 신규 추가 0건. 모든 데이터는 서버 컴포넌트 직접 Prisma 호출. PM 규칙 "API/Prisma 0 변경" 준수.
- **카테고리 매핑 일관성**: CATEGORY_LABEL 은 `community-aside.tsx` 의 BOARDS 와 1:1 매핑(notice/general/recruit/review/marketplace/qna/info 7종). 새 카테고리 추가 시 양쪽 갱신 필요(주석 명시). 매핑 실패는 슬러그 원문 노출 + 추적 가능.
- **🔖 토글 동작 미구현**: 코트/게시판 카드 우상단 bookmark 아이콘은 현재 "표시만". 토글(해제) 동작은 추후 구현. 시안 Saved.jsx L84의 `e.stopPropagation()` 핸들러도 미적용(액션 없음). 추후 컴포넌트화 시 onClick + DELETE API 추가.
- **미지원 5건 안내 일관성**: 게시글/경기/대회/팀 4탭 = 동일한 construction 아이콘 + "북마크 시스템 준비 중" 패턴. 시안 5탭(게시글/경기/대회/팀/+토너먼트별 더미)과 다르게 단순화. 카탈로그 분리 없이 인라인 메시지(탭 종류 4개 뿐이라 충분).
- **빈 상태 분기**: 전체 탭 + 0+0건 = 글로벌 카드 / 게시판 탭 0건 = 텍스트만 / 코트 탭 0건 = 텍스트만 / 미지원 탭 = construction 카드. 4가지 빈상태가 중복 없이 분기됨.
- **TypeScript 검증**: tsc --noEmit EXIT=0 PASS. 신규 2 파일 + scratchpad 수정만, 기존 코드 0 영향.
- **시안 충실도**: 시안 액션 2개(내보내기/폴더 관리) UI 자리 유지 + disabled 처리(시안의 5탭 → 7탭 분리는 옵션 C 결정). 시안 dummy(POSTS/GAMES/TOURNAMENTS/TEAMS) 의존 5탭 = 빈상태 + 추후 구현 목록 유도.

---

## 구현 기록 — Phase 5 Awards — /awards v2 신규 [2026-04-22]

📝 구현한 기능: BDR v2 시안 `screens/Awards.jsx` 의 시즌 셀렉터 + MVP Hero + 팀 레이팅 + Honor 6 + 올-스타 1st/2nd + 역대 우승팀을 그대로 이식한 신규 라우트 `/awards` (글로벌 톱레벨, profile 하위 X). **API / Prisma 스키마 / 서비스 0 변경. 신규 fetch 0건**. Prisma 직접 호출 패턴(Phase 1 동일). 카페 세션 무관, 비로그인 열람 허용. 시즌 = `tournament_series` 1:1 매핑 (사용자 결정). DB 미지원 5블록(팀 ELO / 올해의 감독 / NEW FACE / 올스타 1st·2nd / MVP 코멘트)은 "준비 중" 빈 카드 + opacity 0.4~0.5 + title 툴팁으로 자리 유지(데이터 있는 필드는 절대 숨기지 않음 원칙).

| 파일 경로 | 변경 내용 | 신규/수정 |
|----------|----------|----------|
| `src/app/(web)/awards/_v2/awards-catalog.ts` | 정적 카탈로그. `HonorKind` 유니언 6종(finals_mvp/scoring_leader/assists_leader/rebounds_leader/coach_of_year/new_face). `HonorMeta { kind, label, color, notReady? }`. `HONOR_CATALOG[6]` 시안 카드 그리드 순서 보존(보더 색 시안 그대로 — #F59E0B/#E31B23/#0F5FCC/#374151/#DC2626/#10B981). coach_of_year/new_face 만 `notReady="집계 준비 중"`. `ALL_STAR_POSITIONS=["PG","SG","SF","PF","C"] as const + AllStarPosition` 타입. `ALL_STAR_GROUPS=[{first/var(--accent)}, {second/var(--cafe-blue)}]` | 신규 |
| `src/app/(web)/awards/_v2/awards-content.tsx` | "use client". `useRouter` + `useSearchParams` 로 `?series=<slug>` URL 동기화 (`handleSeasonChange` → `router.push` → 서버 재페치). `teamTag()` 폴백 헬퍼(영문 앞 3자 대문자 / 한글 앞 2자), `fmtMetric()` null→"—" + `.toFixed(1)`, `pickHonorPlayer()` kind→DTO 매핑. **8 섹션 렌더**: ①Breadcrumb(홈›수상·아카이브) ②시즌 셀렉터(eyebrow "AWARDS · 수상 아카이브" + h1 34px ff-display + 우측 series chip 토글, 활성=ink배경) ③시즌 MVP Hero(2열 grid 1fr/340px, 135deg teamColor→#000 그라디언트 + 140×140 트로피 이모지 + 56px ff-display name + 11px ff-mono teamTag + 4셀 PPG/APG/RPG/WIN% null="—" + 인용 코멘트 폴백) — MVP 미존재 시 "선정된 MVP가 없습니다" 빈 상태 ④팀 레이팅 사이드(query_stats 아이콘 + "집계 준비 중" 안내 + 빈 5행 dashed placeholder opacity 0.4) ⑤주요 수상 6 카드 3열 grid(borderTop 3px tier색 + 카테고리 라벨 + 36×36 tag박스 + 선수명/팀명/metric var(--bg-alt) 박스, 데이터 없으면 notReady 빈 상태) ⑥올-스타 2 그룹 카드(eyebrow 그룹 색 + 5포지션 슬롯 var(--bg-alt) opacity 0.5 + schedule 아이콘 안내) ⑦역대 우승팀 .board__head + .board__row 6열(시즌/대회/우승🏆 b/준우승/스코어 ff-mono/MVP, fmtScore 큰값 앞) — 빈 상태 폴백. 모든 색상 var(--*) 토큰 + 시안 컬러 코드는 카탈로그에만 존재 | 신규 |
| `src/app/(web)/awards/page.tsx` | 서버 컴포넌트 + `export const dynamic = "force-dynamic"`. `searchParams: Promise<{ series?: string }>` 비동기 await. **DTO 6종 export**(SeasonOption/PlayerRefDTO/SeasonMvpDTO/ChampionRowDTO/AwardsDataDTO + 헬퍼 dec/fmtScore/isFinalsRound). 6단계 Prisma 직접 호출: ①`prisma.tournament_series.findMany`(is_public=true + status=active, orderBy created_at desc, take 20) + "전체" 옵션 prepend ②현재 series 식별 후 `tournamentWhere` 조건(is_public=true + series_id 매칭) ③시즌 MVP: `prisma.tournament.findFirst`(tournamentWhere + mvp_player_id ≠ null, orderBy endDate desc) → users_tournaments_mvp_player_idTousers + tournamentTeamPlayer 팀명 + matchPlayerStat.aggregate(_avg PPG/APG/RPG, officialMatchNestedFilter 가드) ④시즌 리더 3종: `$queryRaw` × 3 (Prisma.sql, GROUP BY user_id, AVG points/assists/total_rebounds, OFFICIAL_MATCH_SQL_CONDITION 라우 SQL 단편 + series 필터 Prisma.sql 바인딩 + 팀명 서브쿼리, ORDER BY avg DESC NULLS LAST LIMIT 1, HAVING COUNT >= 1) ⑤Finals MVP: `prisma.tournamentMatch.findMany`(roundName contains 결승/final/championship + officialMatchNestedFilter + tournament 시즌범위, take 1) → 폴백(시즌 최신 mvp 매치) + 본인 시즌 평균 aggregate ⑥역대 우승팀: `prisma.tournament.findMany`(is_public=true + champion_team_id ≠ null, orderBy endDate desc, take 10) + nested(teams 우승팀 / tournament_series 시즌라벨 / users_tournaments_mvp_player_idTousers / tournamentTeams where final_rank=2 / tournamentMatches roundName 매칭). BigInt → string + Decimal → number(.toString()) + Date → year toString. try/catch 폴백 패턴(에러 시 null/[] 빈 상태). `<AwardsContent data={data} />` 렌더 | 신규 |
| `.claude/scratchpad.md` | "🚧 추후 구현 목록"에 "Phase 5 Awards" 8건 신설 (team_ratings 테이블+ELO cron / season_all_star_teams 포지션 best5 / Team.coach_user_id / tournament_mvp_quotes / seasons 테이블 분리 / NEW FACE 루키 식별 / Finals MVP 결승 식별 정밀화 / 시즌 변동 snapshot) + 작업 로그 1줄 추가 | 수정 |

💡 tester 참고:
- **테스트 방법 1 (페이지 200)**: `/awards` 진입 시 비로그인도 200 + 시즌 셀렉터(전체 + tournament_series.name 최대 20개) + MVP Hero / 6 honor 카드 / 올스타 2 카드 / 역대 우승팀 보드 6 섹션 모두 렌더되어야 함.
- **테스트 방법 2 (시즌 셀렉터)**: 셀렉터 내 series chip 클릭 → URL 이 `/awards?series=<slug>` 로 변경 + 서버 재페치되어 해당 시즌의 MVP/리더/Finals MVP 가 갱신. "전체" 클릭 시 `?series=` 제거.
- **테스트 방법 3 (DB 미지원 빈 상태)**: 팀 레이팅 사이드 카드 우측 "집계 준비 중" 텍스트 + opacity 0.4 빈 5행 dashed. 올스타 1st/2nd 카드 모든 5포지션 슬롯 "—" + "준비 중" + opacity 0.5. coach_of_year/new_face honor 카드 두 곳도 "집계 준비 중".
- **테스트 방법 4 (시즌 리더 정확성)**: `match_player_stats` 가 1건 이상 있는 시즌 선택 → 득점왕/어시왕/리바왕 카드에 선수명 + N.N PPG/APG/RPG 표시(시즌 평균). 시즌 데이터 없으면 "수상자가 없습니다".
- **테스트 방법 5 (역대 우승팀)**: `Tournament.champion_team_id` 가 NULL 아닌 토너먼트 10건 ORDER BY endDate desc. 우승팀 이름 / 준우승(final_rank=2) / 결승 점수(roundName 매칭) / Finals MVP 모두 채워지면 정상. 누락은 "—".
- **정상 동작**: 비로그인 200 / 모든 series chip 클릭 시 페이지 재로드 + 데이터 갱신 / DB 미지원 5블록 전부 자리 유지 + 한글 안내 / officialMatchWhere 가드로 미래·예정 경기 제외.
- **주의할 입력**: ① `?series=존재안하는-슬러그` → "전체"로 폴백(seasons[0]) ② match_player_stats 1건도 없는 시즌 → 리더 3종 모두 "수상자가 없습니다" ③ tournament_series 0건 → seasons=[전체]만 ④ champion_team_id 없는 환경 → 역대 우승팀 빈 상태 ⑤ tournament.is_public=false 인 비공개 대회는 모든 쿼리에서 제외됨(보안 가드).

⚠️ reviewer 참고:
- **`$queryRaw` 보안**: series_id 바인딩은 `Prisma.sql\`AND t.series_id = ${currentSeriesId}\`` 로 파라미터화. `Prisma.raw(OFFICIAL_MATCH_SQL_CONDITION)` 은 상수 문자열만(NOW() 등) 인젝션 가능 입력 X. SQL 레벨 IDOR 위험 없음.
- **공식 기록 가드 일관성**: Prisma builder 호출(MVP / Finals MVP) 은 `officialMatchNestedFilter()` 사용. raw SQL(시즌 리더 3종) 은 `OFFICIAL_MATCH_SQL_CONDITION` 사용. 두 단편 모두 status IN (completed, live) + scheduled_at <= NOW() + NOT NULL 동일 조건이라 서로 일치.
- **DB 컬럼 매핑**: tournament_series 는 모델명 `tournament_series` (snake_case 모델명 그대로). Tournament 의 mvp 관계는 `users_tournaments_mvp_player_idTousers` / champion 관계는 `teams` (단수, 우승팀). final_rank=2 준우승은 `tournamentTeams` 1:N include + take 1. 결승전 식별은 라운드명 한글/영어 키워드 + 폴백.
- **빈 상태 누락 검토**: 시즌에 토너먼트 N개 + champion_team_id 모두 NULL 인 경우 → 역대 우승팀 빈 보드 메시지("우승팀 기록이 아직 없습니다."). MVP/리더/Finals MVP 도 모두 null 폴백.
- **시안 충실도**: 시안 더미 데이터(kings_cap/MNK/3PT/RDM 등) 는 모두 DB 라이브로 교체. 시안 d:+48 변동 컬럼은 DB snapshot 부재 → "—" + 주석으로 향후 구현 명시. 시안 MVP 코멘트는 정적 폴백 "수상 코멘트는 준비 중입니다."
- **비로그인 허용**: 다른 v2 페이지(profile/achievements 등)는 getWebSession 후 비로그인 차단했으나, awards 는 글로벌 톱레벨 + 공개 정보(우승팀/MVP)라 의도적으로 세션 검증 생략. is_public=true 가드만 유지.
- **TypeScript 검증**: tsc --noEmit EXIT=0 PASS.

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

---

## 구현 기록 — Phase 6 Login 리디자인 [2026-04-22]

📝 구현한 기능: BDR v2 시안(Dev/design/BDR v2/screens/Login.jsx) 기반 로그인 페이지 UI 전면 교체. 인증 로직/서버 액션/OAuth href/InfoDialog/Dev 자동 로그인은 0 변경 — UI만 교체.

| # | 파일 경로 | 변경 내용 | 신규/수정 |
|---|----------|----------|----------|
| 1 | `src/app/(web)/login/page.tsx` | 시안 적용: 헤더 `MyBDR.` 대형 타이포, 탭 2종(로그인/회원가입) cafe-blue 하단 라인, 로그인 탭 인라인 폼 + 자동로그인(disabled+tooltip "준비 중"+뱃지) + 비번찾기 + `.btn--primary .btn--xl` + "또는" divider + 카카오/네이버 grid + Google 행, 회원가입 탭 모두 disabled + 안내 뱃지 + 가입하기→`/signup` router push, 하단 ← 홈으로, Dev 자동 로그인 별도 카드. 288→362줄 | 수정 |
| 2 | `src/app/(web)/login/layout.tsx` | 변경 없음 (메타데이터/getWebSession 그대로) | 미수정 |

핵심 결정:
- **API/액션 0 변경** — `loginAction`, `devLoginAction`, `useActionState`, `name="email"/"password"/"redirect"` hidden input, OAuth href, `isValidRedirect`, `OAUTH_ERRORS`, `REDIRECT_BANNERS`, `InfoDialog` 모두 보존
- **시안 외 추가 보존**: ① 구글 OAuth 행 ② Dev 자동 로그인 카드 ③ InfoDialog 2종 (redirectBanner / oauth error)
- **비밀번호 찾기**: 시안 `<a href="#">` → `router.push("/forgot-password")` 로 기존 라우트 연결
- **이전 이메일 모달 제거**: 인라인 폼으로 대체했으므로 `showEmailModal`, `showPassword` (눈 아이콘), `<style jsx global>` 슬라이드 애니메이션 모두 삭제 → 코드 단순화
- **CSS 토큰**: `var(--cafe-blue)`, `var(--ink)`, `var(--ink-mute)`, `var(--ink-dim)`, `var(--bg-elev)`, `var(--bg-alt)`, `var(--border)`, `var(--accent)`, `var(--accent-soft)`, `var(--cafe-blue-soft)`, `var(--cafe-blue-deep)`, `var(--danger)`, `var(--link)` — globals.css BDR v2 토큰 그대로 활용
- **시안 클래스 활용**: `.card`, `.input`, `.label`, `.select`, `.btn`, `.btn--primary`, `.btn--xl`, `.btn--sm` — 추가 스타일 정의 0

🚧 추후 구현 — Phase 6 Login (PM 의뢰 기록):
- 자동 로그인 ("remember me") 토큰 시스템 — DB 컬럼/세션 토큰 만료 정책/로그아웃 무효화 설계 필요
- 회원가입 인라인 폼 — 현재 /signup 페이지로 이동 (인라인 검증/중복 체크/약관 동의 처리)
- 네이버 OAuth 활성화 — 현재 disabled 표시, 콜백 라우트는 이미 존재 (NAVER_* env + 서비스 등록 필요)

💡 tester 참고:
- **테스트 방법**: `npm run dev` → http://localhost:3001/login
- **정상 동작**:
  - 헤더 `MyBDR.` 표시 + 마지막 점이 BDR red (var(--accent))
  - 탭 클릭 — 로그인/회원가입 토글, cafe-blue 하단 라인 이동
  - 로그인 폼 제출 → 기존 loginAction 동작 (이메일/패스워드 → /로 리다이렉트). 에러 시 빨간 배너 표시
  - 자동 로그인 체크박스 — disabled + hover 시 "준비 중" tooltip + 우측 뱃지
  - 비밀번호 찾기 클릭 → /forgot-password 이동
  - 카카오 클릭 → /api/auth/login?provider=kakao (redirect 쿼리 보존)
  - Google 클릭 → /api/auth/login?provider=google
  - 네이버 disabled (클릭 불가)
  - 회원가입 탭 → 모든 입력 disabled + 가입하기 클릭 → /signup 이동
  - ← 홈으로 → /
  - Dev 자동 로그인 (NODE_ENV=development) → devLoginAction 동작
- **주의 입력**:
  - `?error=kakao_token` 쿼리 → InfoDialog "로그인 오류" 모달 (확인/ESC/backdrop 닫기 + URL 쿼리 정리)
  - `?redirect=/games/new` 쿼리 → InfoDialog "경기 만들기는 로그인이 필요해요" 모달 + 로그인 성공 후 /games/new로 이동
  - `?redirect=//evil.com` (open redirect 공격) → isValidRedirect로 차단됨 (redirectTo=null)
  - 이미 로그인된 상태 접근 → layout.tsx에서 / 로 리다이렉트
- **tsc --noEmit 통과 확인** (exit=0)

⚠️ reviewer 참고:
- **시안 충실도**: Login.jsx 의 `<a href="#">비밀번호 찾기</a>` 만 `router.push("/forgot-password")` 로 변경. 그 외 시안과 1:1 매칭
- **인라인 style vs Tailwind**: 시안이 인라인 style을 쓰고 있고 globals.css의 `.card/.input/.label/.btn` 클래스가 BDR v2 토큰 기반 — 일관성을 위해 시안 그대로 인라인 style 유지. 다른 BDR v2 페이지(community/new 등)도 동일 패턴
- **회원가입 탭 disabled 처리**: 시안에는 disabled 표시가 없으나 PM 결정 "A 시안 인라인 폼 (입력 disabled + 준비 중 뱃지 + 가입하기는 /signup 이동)" 반영
- **Google/Dev 로그인 추가 행**: 시안 외 추가지만 PM 명시 결정 "유지". 카카오/네이버 grid 아래 Google, 카드 외부에 Dev 자동 로그인 카드. 시각적으로 시안 흐름을 해치지 않도록 마진/카드 분리
- **다크모드**: 모든 색상 var(--*) 토큰 사용으로 자동 대응
- **접근성**: 자동 로그인 disabled 체크박스에 `title="준비 중"` 추가. 네이버 버튼도 동일

---

## 구현 기록 — Phase 6 Help [2026-04-22]

📝 구현한 기능: `/help` 페이지 신규 (시안 박제 + 탭 3종 + 검색 + 정책 6카드 + 1:1 문의 mailto). 데이터는 시안 박제(상수). API/Prisma/서비스 0 변경.

| 파일 경로 | 변경 내용 | 신규/수정 |
|----------|----------|----------|
| `src/app/(web)/help/page.tsx` | "use client" 신규 — 탭 useState + 검색 useState + FAQ 6건 박제 + GLOSSARY 16건 박제 + 정책 6카드 (terms/privacy 활성, 4종 "준비 중" 비활성) + 1:1 문의 mailto 카드 | 신규 |

💡 tester 참고:
- **테스트 URL**: `http://localhost:3001/help`
- **시안 비교**: `Dev/design/BDR v2/screens/Help.jsx` (86줄)
- **정상 동작**:
  1. 헤더 검색 input + Material Symbols search 아이콘 좌측 absolute (paddingLeft:38)
  2. 탭 3종 클릭 시 cafe-blue 3px 하단 라인 + 폰트 굵기 700 전환
  3. FAQ 탭: 6건 `<details>`, summary 클릭 시 펼침/접힘. Q1~Q6 mono 폰트 + accent(BDR red) 색
  4. 용어집 탭: 16건 200/1fr 그리드. 검색 input에 "픽업" 입력 → 1건 필터링 ("픽업 (Pick-up)")
  5. 용어집 검색 결과 없을 시 "검색 결과가 없습니다" 안내
  6. 용어집 하단 우측 "전체 용어 사전 보기 →" Link 클릭 → `/help/glossary` 이동
  7. 정책 탭: 1fr 1fr 그리드 6카드. 이용약관/개인정보처리방침 클릭 시 `/terms`/`/privacy` 이동. 나머지 4종은 opacity:0.55 dim + "준비 중" 회색 배지 + cursor:default
  8. 하단 1:1 문의 카드 "1:1 문의하기" 버튼 클릭 → 메일 클라이언트 호출 (to: bdrbasket@gmail.com, 제목: [MyBDR 문의] )
- **주의 입력**:
  - 검색어 영문 대소문자 무시 ("PICK" → "픽업 (Pick-up)" 매칭)
  - 검색어 desc 본문 매칭 ("스크리너" → "픽앤롤" 매칭)
  - 탭 전환 시 검색어 q 상태 유지 (탭 간 검색어 공유)
- **tsc --noEmit 통과 확인** (EXIT=0)

⚠️ reviewer 참고:
- **시안 충실도**: Help.jsx 86줄 1:1 박제. `Icon.search` → Material Symbols Outlined `search` 로 교체(CLAUDE.md "lucide-react 금지" 컨벤션). `setRoute` prop 제거(Next.js 라우팅으로 대체).
- **인라인 style vs Tailwind**: 시안이 인라인 style을 쓰고 있고 globals.css의 `.card/.input/.btn/.eyebrow` 클래스가 BDR v2 토큰 기반 — 일관성을 위해 시안 그대로 인라인 style 유지 (Login·BoardList·PostDetail 등 다른 v2 페이지와 동일 패턴)
- **GLOSSARY 16건 vs /help/glossary 9건**: 시안 GLOSSARY는 농구 일반 용어 16건(픽앤롤/풀코트/PPG 등). 기존 `/help/glossary`는 서비스 핵심 용어 9건(대회/경기/픽업/게스트/디비전 등) — 컨벤션 [2026-04-20]에서 단일 소스로 지정. **둘은 보완 관계**: /help는 빠른 훑어보기(검색·요약), /help/glossary는 단일 소스(상세 설명+예시+관련 링크). PM 의뢰대로 "전체 용어 사전 보기 →" 링크로 연결만.
- **정책 카드 비활성 처리**: 4종("운영정책/환불규정/광고·제휴 문의/저작권 안내")은 `<div>` 로 렌더(클릭 무반응) + opacity 0.55 + "준비 중" 배지. 활성 2종은 `<Link>`. 추후 페이지 신설 시 href 추가 + 비활성 카드는 `<Link>` 로 승격.
- **1:1 문의 mailto**: `bdrbasket@gmail.com?subject=[MyBDR 문의]` 인코딩됨. PM 의뢰대로. 추후 Inquiry 모델 도입 시 모달/폼 페이지로 교체.
- **메타데이터 부재**: Client Component라 `export const metadata` 불가. Phase 6 후속 작업으로 layout.tsx 분리 검토 가능.
- **다크모드**: 모든 색상 var(--*) 토큰 사용으로 자동 대응 (cafe-blue/ink-*/accent/border 다크 페어 정의 globals.css 141~146 라인 기존)

🚧 추후 구현 — Phase 6 Help (PM 의뢰 기록):
1. **FAQ 모델**: DB 박제 → 운영자 편집 가능 (admin/help/faq CRUD + 카테고리/태그/순서)
2. **1:1 문의 모델**: `inquiries` 테이블 (사용자/제목/본문/상태/답변) + 운영자 답변 워크플로 + 사용자 알림
3. **정책 페이지 4종 신설**: `/operating-policy`, `/refund-policy`, `/advertising-inquiry`, `/copyright` (현재는 "준비 중" 배지)
4. **FAQ 검색**: 현재 GLOSSARY만 검색. FAQ q/a 동시 검색 + 통합 검색(FAQ + 용어 결합) 검토

---

## 구현 기록 — Phase 6 Pricing [2026-04-22]

📝 구현한 기능: `/pricing` 페이지 BDR v2 시안 박제(FREE/BDR+/PRO 3종 + 월간/연간 토글 + 비교표 7행). server wrapper(metadata 보존) + client content(useState 토글) 분리. 모든 CTA `alert("준비 중")`. /pricing/checkout 라우트 0 변경.

| 파일 경로 | 변경 내용 | 신규/수정 |
|----------|----------|----------|
| `src/app/(web)/pricing/page.tsx` | 전면 재작성. **server wrapper 로 슬림화** — metadata+revalidate 보존, prisma/getWebSession/feature_key 4종 카드/FAQ/광고 문의 전부 제거. `<PricingContent/>` 단일 호출 | 수정(전면 재작성) |
| `src/app/(web)/pricing/_v2/pricing-content.tsx` | "use client" useState<"monthly"\|"yearly">. 시안 Pricing.jsx 90줄 박제 — 헤더(eyebrow+h1 36px+부제) + theme-switch 월간/연간 토글(연간=2개월 할인 ok색) + 카드 3종(FREE/BDR+/PRO) PRICING 상수 박제(BDR+ highlight + translateY-8px + 2px accent border + sh-lg + "가장 인기" 라운드 뱃지) + 연간 토글 시 BDR+ 만 ₩4,900→₩3,900 분기(시안 L42 동작) + 기능 ✓ list + 비교표 7행 `.board` 4열 + 결제 문의 mailto 푸터 | 신규 |
| `src/app/(web)/pricing/checkout/page.tsx` | 0 변경 (보존) | — |

#### 수정 이력
| 회차 | 날짜 | 수정 내용 | 수정 파일 | 사유 |
|------|------|----------|----------|------|
| 1차 | 2026-04-27 | checkout 페이지 v2 스타일 정렬 + breadcrumb(홈›요금제›결제) + 약관 4종 라벨(결제 대행/개인정보 제3자/구독·환불 정책/마케팅 선택) UI 박제 + `/api/web/me` useEffect fetch 후 email·이름 readOnly input 노출(빈 값 "(미등록)") + loading/error/Suspense fallback v2 spinner(`var(--accent)`)+`.card` 적용. plan_type 라벨(monthly→"월 구독"·그 외→"1회 구매") 유지. **토스 SDK requestPayment 인자 한 글자도 변경 X**. tsc --noEmit 통과 | `src/app/(web)/pricing/checkout/page.tsx` | PM 미해결 4건 일괄 처리 지시 (breadcrumb / 약관 라벨 / me readOnly / plan_type 라벨 유지) |
| 2차 | 2026-04-27 | 약관 가드 1줄 추가 — `agreedTerms` state(pg/third/refund/marketing) 도입 + 4개 체크박스 `checked`/`onChange` 동기화 + 결제 버튼 `disabled={paying \|\| !allRequiredAgreed}` (필수 3종 모두 체크 시만 활성화, marketing 선택은 제외) + 버튼 위 안내 문구 "필수 약관 3건 동의 시 결제 가능"(미체크 시만 ink-dim 12px). **토스 SDK 인자 0 변경**. tsc --noEmit 통과 | `src/app/(web)/pricing/checkout/page.tsx` | reviewer 지적: PM 최초 지시 "agreed=true 일 때만 결제 가능" 미반영 |

💡 tester 참고 (1차 수정):
- **테스트 URL**: `http://localhost:3001/pricing/checkout?planId=<유효 plan id>`
- **정상 동작**:
  1. 페이지 상단 breadcrumb: `홈 › 요금제 › 결제` (PC만, 모바일 hidden lg:block)
  2. h1 "결제하기" + var(--ink) 색
  3. 요금제 카드: 플랜명/plan_type 라벨/결제 금액 — 금액은 var(--accent) 빨강 + ff-display 22px
  4. 결제자 정보 카드: 이메일/이름 readOnly input 2개. me 응답 있으면 값 표시, 없으면 placeholder "(미등록)" + var(--ink-dim) 흐린 색
  5. 약관 4종 카드: 4개 체크박스 + 라벨 (UI 박제, 체크 여부가 결제 진행을 막지 **않음** — PM 지시 범위 외)
  6. 결제 버튼: `.btn .btn--accent .btn--xl` — 클릭 시 토스 SDK 호출 (인자 0 변경)
  7. me fetch 실패(401 등): readOnly input 미표시 placeholder만 보이지만 결제는 진행 가능 (handlePay에서 다시 me fetch → 실패 시 /login 리다이렉트)
- **다크 모드**: var(--*) 토큰 자동 대응

⚠️ reviewer 참고 (1차 수정):
- **토스 SDK 인자 보존**: handlePay 내부 `toss.requestPayment({ method, amount, orderId, orderName, successUrl, failUrl, customerEmail, customerName })` 한 글자도 변경 X
- **약관 체크 가드 미적용**: PM 지시는 "약관 라벨 추가". 체크 여부로 결제 진행을 차단하는 가드는 추가하지 않음 (필요 시 추가 작업)
- **me 사전 fetch + handlePay 재 fetch 중복**: handlePay 재 fetch 는 기존 동작 보존(401 시 /login 리다이렉트가 거기서만 일어남). 사전 fetch 는 readOnly UI 노출용으로만 사용 — 이중 호출이지만 의도적
- **`.input` 클래스 readOnly 시각 구분**: `background: var(--bg-alt)` + `cursor: default` inline 오버라이드. globals.css `.input` 기본은 흰 배경 + cursor 텍스트라 readOnly 인지가 약함
- **추후 구현 항목 그대로 유효**: BDR+/PRO 결제 진입점 / yearly_price 분기 / feature_key 통합 마이그레이션 등 6건은 미해결

---

💡 tester 참고:
- **테스트 URL**: `http://localhost:3001/pricing`
- **시안 비교**: `Dev/design/BDR v2/screens/Pricing.jsx` (90줄)
- **정상 동작**:
  1. 메타데이터: HTML `<title>` "요금제 \| MyBDR" 노출 (server wrapper 보존)
  2. 헤더: `eyebrow` "요금제 · PRICING" + h1 36px ("더 자주 뛰는 사람들을 위한 BDR+" — BDR+ 만 var(--accent) 강조) + 부제 1줄
  3. **월간/연간 토글**: 클릭 시 `data-active="true"` 전환 + BDR+ 가격만 ₩4,900 ↔ ₩3,900 변경. FREE / PRO 가격은 고정
  4. 카드 3종: FREE(highlight=false 평면) / BDR+(highlight=true 4px translateY 위로 + 2px accent border + 상단 "가장 인기" 둥근 뱃지) / PRO(평면). 가격은 ff-display 40px + 900 weight
  5. 모든 ✓ 마크: BDR+ 카드는 var(--accent) 빨강, FREE/PRO 카드는 var(--ok) 초록
  6. **모든 CTA 버튼 클릭 시**: `alert("준비 중입니다.")` 표시. 페이지 이동 X.
     - FREE "지금 시작" / BDR+ "14일 무료 체험" / PRO "문의하기"
  7. 비교표 7행 (`.board`): 기능 / FREE / BDR+ / PRO 4컬럼. BDR+ 컬럼 ○ 셀은 var(--accent) 빨강 강조
  8. 푸터: `bdr.wonyoung@gmail.com` mailto 링크 클릭 시 메일 클라이언트 호출
  9. **다크 모드**: var(--*) 토큰 자동 대응 (border-strong 2px / accent-soft 등 다크 페어 작동)
- **주의 입력**:
  - `/pricing/checkout?planId=X` 직접 URL 입력 시: 기존 결제 플로우 그대로 작동 (라우트 보존). 단, /pricing 페이지에서 진입할 방법이 alert 차단되어 사실상 비활성
  - 비로그인 / 로그인 두 상태 모두 동일 화면 (세션 분기 없음)
  - 기존 user_subscriptions "구독 중" 배지 표시 X (시안 박제로 동적 데이터 비활용)
- **tsc --noEmit 통과 확인** (EXIT=0)

⚠️ reviewer 참고:
- **server wrapper / client content 분리 패턴**: Awards / Reviews / Saved / Achievements 등 다른 v2 페이지와 동일한 패턴. metadata export 유지 + useState 인터랙션 클라 분리.
- **시안 충실도**: Pricing.jsx 90줄 1:1 박제. setRoute prop 제거 / `Icon` 제거 (시안 외 사용 안함) / yearlyPrice 필드만 시안 L42 inline 분기를 명시적 데이터로 추출 (가독성).
- **인라인 style vs Tailwind**: 시안이 인라인 style을 쓰고 globals.css의 `.card/.btn/.btn--accent/.btn--xl/.theme-switch/.eyebrow/.board` 클래스가 BDR v2 토큰 기반 — 일관성을 위해 시안 그대로 인라인 style 유지(Login·Help·BoardList 등 다른 v2 페이지와 동일 패턴).
- **결정 B 처리**: alert 단일 함수 `handleCta` 로 통합. 추후 tier 결제 진입점 연결 시 이 함수만 교체하면 됨. /pricing/checkout 라우트는 살아있으나 진입점만 차단 — 토스페이먼츠 흐름 / payments 테이블 / user_subscriptions 발급 0 영향.
- **결정 C 처리**: 기존 page.tsx 의 동적 plans/subscribedFeatures 쿼리 제거. 시안의 등급 모델(FREE/BDR+/PRO)은 현재 plans 의 feature_key 모델(team_create/pickup_game/court_rental/tournament_create)과 구조가 달라 동적 매핑 불가. tier 모델 도입(추후 구현 #1) 시 동적 데이터 복원.
- **이미지/이모지**: 시안 그대로 ✓ 텍스트 마크 사용 (CLAUDE.md "lucide-react 금지" + Material Symbols Outlined 컨벤션 무관 — Material Symbols 도입 검토 가능하나 시안 충실도 우선).
- **다크모드**: 모든 색상 var(--*) 토큰 사용으로 자동 대응 (accent / accent-soft / ink-* / ok / sh-lg 다크 페어 globals.css 에 정의됨).
- **추후 구현 신설**: Phase 6 Pricing 6건(plans 등급 모델 / yearly_price 분기 / BDR+·PRO 결제 진입점 / feature_key 4종 통합 마이그레이션 / is_recommended 동적 / 결제 문의 inquiries 모달).

🚧 추후 구현 — Phase 6 Pricing (PM 의뢰 기록):
1. **plans 등급 모델**: FREE/BDR+/PRO 3종을 plans.tier enum 또는 plan_tiers 테이블 신설. user_subscriptions.tier_id 컬럼 추가
2. **yearly/monthly 가격 분기 동작**: plans.yearly_price 또는 plan_id_yearly 별도 row + cycle 파라미터 결제 진입점 전달
3. **BDR+/PRO CTA 결제 진입점 연결**: `/pricing/checkout?tier=plus&cycle=yearly` 라우팅 + confirm 단에서 user_subscriptions 발급 분기
4. **feature_key 4종 통합 마이그레이션**: 기존 4종(team_create/pickup_game/court_rental/tournament_create) ↔ 등급 모델(BDR+/PRO 패키지) 통합. PM 결정 필요 (deprecate / 병행 / 자동 매핑)
5. **is_recommended 동적 처리**: 현재 BDR+ highlight=true 박제. plans.is_recommended 컬럼 추가 시 동적 분기
6. **결제 문의 mailto → inquiries 모달**: Phase 6 Help inquiries 모델 도입 시 통합

---

## 구현 기록 — Phase 6 Signup (3-step 위저드) [2026-04-22]

📝 구현한 기능: `/signup` 페이지 BDR v2 시안 박제 — 3-step 위저드(계정→프로필→활동환경) + Step indicator + useActionState(signupAction). Step 1만 실작동(이메일/비번/비번확인/약관), Step 2 닉네임 + 포지션·키·등번호 UI(준비중), Step 3 지역·실력·관심유형 UI(준비중). signupAction 0 변경.

| 파일 경로 | 변경 내용 | 신규/수정 |
|----------|----------|----------|
| `src/app/(web)/signup/page.tsx` | 전면 재작성 (90→약 470줄). "use client" + useState<1\|2\|3> + useState(email/password/passwordConfirm/agreed/nickname) + useActionState(signupAction). Step indicator(원 1·2·3 + 진행선 cafe-blue) + "회원가입 · N/3" + 단계별 헤딩/부제 + 카드 본문(.card 28px) + Step 1 실작동(email/password/password_confirm/약관 체크) + 약관·개인정보 Link + OAuth 3종(시안 외 보존, 카카오/네이버/Google grid) + Step 2 닉네임(실작동) + 포지션 5/키/등번호 disabled+"준비 중" 뱃지 + Step 3 지역 8/실력 5/관심 5 disabled+"준비 중" + 하단 이전/다음(Step 1·2)·시작하기(Step 3 type=submit) + 풋터 "이미 계정이 있으신가요? 로그인" Link | 수정(전면 재작성) |
| `src/app/(web)/signup/layout.tsx` | 0 변경 (metadata 보존) | 미수정 |

핵심 결정:
- **signupAction 0 변경** — `email/nickname/password/password_confirm` 4필드만 사용 (`src/app/actions/auth.ts` L115~). 닉네임 2~20자, 비번 8자+영문+숫자+특수문자, /verify?missing=phone 리다이렉트 모두 보존
- **3-step 데이터 — Step 2/3 추가 입력은 form submit 시 무시** (DB 컬럼 없음). 추후 hidden field로 보내도록 Phase 6 Signup 백로그 등록
- **진입 가드 (클라이언트)**:
  - Step 1→2: `isValidEmail` (단순 RFC 정규식) + 비번 8자 + 비번/확인 일치 + 약관 체크
  - Step 2→3: 닉네임 2~20자 (signupAction과 동일 규칙)
  - Step 3 → submit: 가드 없음 (signupAction이 모든 검증 수행, 비번 강도 등 서버에서 catch)
- **에러 표시 3종**: ① OAuth ?error= 쿼리 ② stepError (클라이언트 진입 가드) ③ serverState.error (signupAction 반환). 모두 `var(--accent-soft) / var(--danger)` 빨간 배너
- **OAuth 3종 보존**: Step 1 하단 grid 3열 (카카오 #FEE500 / 네이버 #03C75A / Google `.btn`). 시안 외 추가지만 PM 결정 "보존"
- **Step 컴포넌트 분리**: `<Step s step isLast />` 함수 컴포넌트로 추출 — 시안의 `React.Fragment + map` 패턴을 가독성 향상
- **CSS 토큰**: `var(--cafe-blue)`, `var(--bg-alt)`, `var(--ink-dim)`, `var(--ink-mute)`, `var(--ink)`, `var(--ff-mono)`, `var(--border)`, `var(--accent-soft)`, `var(--danger)` — globals.css BDR v2 토큰만 사용
- **시안 클래스 활용**: `.card`, `.input`, `.label`, `.btn`, `.btn--sm`, `.btn--primary`, `.btn--xl` — 추가 스타일 0

🚧 추후 구현 — Phase 6 Signup (PM 의뢰 기록):
1. **User.position 컬럼**: prisma schema 추가 + 회원가입 시 hidden field로 전달 → signupAction에서 수신/저장 (Step 2 포지션 5종 활성화)
2. **User.height / jersey_number 컬럼**: prisma 추가 + Step 2 입력 활성화. height numeric(5,2) cm, jersey_number int (2자리)
3. **User.regions JSONB 멀티**: 활동 지역 복수 선택 (Step 3 지역 8개). 추후 시·구 수준 행정구역 정규화 검토
4. **User.skill_level 컬럼**: enum(beginner/lower-mid/mid/upper-mid/advanced) — Step 3 5단계
5. **User.preferred_game_types JSONB**: pickup/guest/scrim/tournament/regular_team 멀티 — Step 3 관심 경기 유형 5종
6. **3-step 데이터 hidden field 추가**: 컬럼 추가 후 Step 2·3 입력값을 `<input type="hidden" name="position" value={...} />` 등으로 form submit 시 함께 전송. signupAction에서 formData.get 으로 수신 + 검증/저장 분기 추가

💡 tester 참고:
- **테스트 URL**: `http://localhost:3001/signup`
- **시안 비교**: `Dev/design/BDR v2/screens/Signup.jsx` (118줄)
- **정상 동작**:
  1. Step 1 진입 — Step indicator 원1=cafe-blue 채움, 원2/3=bg-alt 회색. "회원가입 · 1/3" + "계정 만들기"
  2. 이메일 형식 오류 + "다음" 클릭 → 빨간 배너 "올바른 이메일 형식을 입력하세요."
  3. 비번 8자 미만 → "비밀번호는 8자 이상이어야 합니다."
  4. 비번/확인 불일치 → "비밀번호가 일치하지 않습니다."
  5. 약관 미체크 → "이용약관 및 개인정보처리방침에 동의해주세요."
  6. 4가지 모두 통과 → Step 2로 이동, 진행선 cafe-blue 채움, "회원가입 · 2/3" + "선수 프로필"
  7. Step 2 닉네임 1자 또는 21자 입력 + "다음" → "닉네임은 2~20자여야 합니다."
  8. Step 2 포지션·키·등번호 — 모두 disabled, hover 시 "준비 중" tooltip + 라벨 옆 회색 뱃지
  9. Step 3 진입 → 진행선 양쪽 채움. 지역/실력/관심유형 모두 disabled + "준비 중" 뱃지
  10. Step 3 "시작하기 →" 클릭 → form submit → signupAction 호출 → 성공 시 /verify?missing=phone 리다이렉트
  11. signupAction 에러 시 (이메일/닉네임 중복) 빨간 배너 표시 + 단계는 3에 머무름 (재시도 가능)
  12. "이전" 버튼 클릭 시 입력값 보존 (state 유지)
  13. OAuth 카카오/네이버/Google 클릭 → 기존 라우트 그대로
  14. 풋터 "로그인" Link 클릭 → /login 이동
- **주의 입력**:
  - `?error=kakao_token` 등 OAuth 콜백 에러 쿼리 → Step 1에서 빨간 배너로 표시
  - 비번 영문+숫자+특수문자 모두 포함 안 한 경우 → 클라이언트 가드 통과 → Step 3 submit 시 signupAction이 차단 ("비밀번호는 영문, 숫자, 특수문자를 모두 포함해야 합니다.")
  - 이미 가입된 이메일/닉네임 → signupAction 에러 배너
- **tsc --noEmit 통과 확인** (EXIT=0)

⚠️ reviewer 참고:
- **시안 충실도**: Signup.jsx 118줄 1:1 박제. `setRoute` prop 제거 (Next.js 라우팅으로 대체). `defaultValue="rdm_captain@mybdr.kr"` 등 시안의 박제 데이터는 제거하고 controlled input + placeholder로 교체.
- **인라인 style vs Tailwind**: 시안이 인라인 style을 쓰고 있어 Login/Help/Pricing 등 다른 BDR v2 페이지와 동일한 패턴 유지. globals.css의 .card/.input/.label/.btn 클래스가 BDR v2 토큰 기반이므로 시안 충실도 우선.
- **OAuth 3종 추가 위치**: 시안에는 OAuth 없으나 PM 결정 "보존". Step 1 하단 grid 3열 (카카오/네이버/Google). 시안의 카드 흐름을 해치지 않도록 "또는 간편 가입" divider 후 배치. Step 2/3에서는 비노출.
- **Step 2/3 추가 입력 무시 정책**: form submit 시 signupAction에 전달되는 필드는 Step 1 + Step 2 닉네임만 (controlled input의 name 속성 4개 — email/password/password_confirm/nickname). 포지션/키/등번호/지역/실력/관심유형은 disabled 라 form data에 포함 안 됨. 추후 컬럼 추가 시 hidden input + name 속성으로 활성화.
- **Fragment 대신 함수 컴포넌트**: 시안의 `React.Fragment` + 인라인 map → `<Step />` 함수 컴포넌트로 추출. JSX 가독성 향상.
- **다크모드**: 모든 색상 var(--*) 토큰 사용으로 자동 대응.
- **접근성**: 모든 disabled 입력에 `title="준비 중"` 추가. 클라이언트 가드 에러는 form 상단 빨간 배너로 명확히 표시.

## 구현 기록 — Phase 7-1 TournamentEnroll v2 박제 [2026-04-27]
- `/tournaments/[id]/join` page.tsx v2 시안(`screens/TournamentEnroll.jsx`) 박제. API/Prisma 0 변경 + 보존 9건(팀선택/대표자/디비전/유니폼/선수/카테고리/입금계좌/완료/대기) 동작 유지. 5-step(hasCategories=true)/4-step adaptive stepper, 서류 step "준비 중" 박제, 결제 step은 입금 안내 흐름 유지(토스 미연결), 우측 sticky aside(포스터 placeholder + D-카운터 정적 + 환불 정책).
- 신규 4파일: `_v2/enroll-poster.tsx` `_v2/enroll-stepper.tsx` `_v2/enroll-aside.tsx` `_v2/enroll-step-docs.tsx` / 수정 1파일: `page.tsx` 전면 재작성. tsc --noEmit 통과(에러 0).

## 구현 기록 — Phase 7 GuestApps v2 박제 [2026-04-27]

📝 구현한 기능: 게스트 지원 현황 신규 라우트 `/guest-apps` — 시안(GuestApps.jsx 273줄) 박제. DB 미지원 → UI 미리보기 (실 동작 0).

| 파일 경로 | 변경 내용 | 신규/수정 |
|----------|----------|----------|
| `src/app/(web)/guest-apps/page.tsx` | 시안 박제 + 더미 상수 외부화 + Link/useState | 신규 |

핵심 결정:
- **API/Prisma 0 변경** — DB 모델 0% 지원. 정적 더미만 (ACTIVE 3건/PAST 3건/MY_STATS/RELIABILITY_TIPS).
- **상단 안내 1줄** — "현재 게스트 신청 관리는 준비 중입니다. UI 미리보기로만 동작합니다." (사용자 지침)
- **시안 GAMES 의존 제거** — 시안 `GAMES[1]/[7]/[4]` 참조를 인라인 game 객체로 박제 (화면 자체 완결).
- **setRoute → Link 매핑**: home→/, profile→/profile, games→/games, gameDetail→/games, teamDetail→/teams.
- **이모지 유지** — ⚡🎯🏆📅📍💳 시안 그대로 (Material Symbols로 강제 변환 안 함, lucide 미사용).
- **TS strict 타입**: ActiveApp/PastApp 분리 + GuestApp 합집합 + 탭별 좁히기. `"role" in a` / `"teamReview" in a` 등 in 연산자 가드.
- **status 5종**: accepted/pending/shortlist (active 전용) + completed/declined (past 전용). STATUS_MAP에 통합.
- **CSS 토큰**: `var(--bdr-red)`, `var(--cafe-blue/-deep/-soft)`, `var(--ok)`, `var(--warn)`, `var(--danger)`, `var(--ink/-soft/-mute/-dim)`, `var(--bg-alt)`, `var(--border)`, `var(--accent)`, `var(--ff-mono/-display)` — globals.css BDR v2 토큰만 사용. 하드코딩 색상 0 (단, 팀 컬러는 시안 박제값 #F59E0B/#6B7280/#0EA5E9/#8B5CF6/#10B981 — 데이터 속성).
- **시안 클래스 활용**: `.page`, `.card`, `.btn`, `.btn--sm`, `.btn--primary`, `.badge`, `.badge--ghost`, `.badge--red` — 추가 스타일 0.

🚧 추후 구현 — Phase 7 GuestApps DB 연동 (백로그):
1. **guest_applications 모델**: user_id + game_id(또는 host_team_id) + status(accepted/pending/shortlist/completed/declined) + role + fee + paid + applied_at + decided_at + declined_reason
2. **guest_messages 모델**: application_id + author(user/team) + body + created_at — 지원 메시지/팀 답신 양방향
3. **guest_reviews 모델**: application_id + rating(1~5) + body + created_at — 경기 후 팀 → 게스트 평점/한줄평
4. **User.guest_stats 집계**: total_apps / accepted / win_rate / mvp_count / avg_rating / reliability — 백그라운드 잡 또는 view로 계산
5. **버튼 액션 5종 활성화**: 경기 상세(/games/[id])·팀과 채팅(DM 또는 팀 채널)·참가 취소(status=cancelled)·지원 철회(soft delete)·후기 남기기(POST /api/web/guest-reviews)
6. **신뢰도 산식**: 응답시간 평균 + 출석률 + 평점 가중합 → reliability% 자동 계산

💡 tester 참고:
- **테스트 URL**: `http://localhost:3001/guest-apps` (또는 dev 프리뷰 `/guest-apps`)
- **시안 비교**: `Dev/design/BDR v2/screens/GuestApps.jsx` (273줄)
- **정상 동작**:
  1. 진입 시 브레드크럼(홈 › 마이페이지 › 게스트 지원 현황) + h1 + "준비 중" 안내 노출
  2. 게스트 프로필 카드 — RDM 이니셜 + 신뢰도 94% 빨간 뱃지 + 통계 5종(총18/수락12/승률67%/MVP2/★4.6) 가로 배치
  3. "게스트 찾기 →" 클릭 → /games 이동
  4. 신뢰도 팁 3개 카드(빠른 응답/수락률 향상/게스트 뱃지) 가로 그리드
  5. 탭 2개 — 진행 중 (3) / 완료·종료 (3). 클릭 시 cafe-blue 하단 라인 + bold + 카운트 표시
  6. **진행 중 탭** 카드 3장:
     - SWEEP (수락됨/포워드) — 결제완료 · 내 메시지 + 팀 답신 2건 노출, 우측 액션 3개(경기 상세[Link]/팀과 채팅/참가 취소[red])
     - IRON WOLVES (응답 대기/8h 경과/가드) — 미결제 · 내 메시지만, 우측 액션 2개(팀에 문의/지원 철회[red])
     - 3POINT (고려 중/옵저버) — 관람 무료 · 내 메시지 + 팀 답신, 우측 액션 2개(팀과 채팅/지원 철회[red])
  7. **완료·종료 탭** 카드 3장:
     - KINGS CREW (경기 완료/MVP 빨간 뱃지) — 3전 2승 1패 · 결제완료 · 팀 평가 ★★★★★ 5점 노출, 액션(후기 남기기[primary]/다시 지원[Link])
     - THE ZONE (거절) — 미결제 · 거절 사유 italic 표시, 액션 1개(팀 보기[Link])
     - BLOCK (경기 완료) — 4전 3승 1패 · 결제완료 · 팀 평가 ★★★★☆ 4점, 액션(후기 남기기[primary]/다시 지원[Link])
  8. 모든 버튼 클릭 시 API 호출 0 (UI만). Link 3개(`/games`, `/teams` 2건)는 정상 라우팅
- **주의 입력**:
  - 다크모드 토글 시 모든 토큰 자동 대응 확인 (var(--bg-alt) 등)
  - 좁은 화면(<768px)에서 grid `repeat(3,1fr)` 팁 카드와 `auto 1fr auto` 카드 레이아웃 깨짐 가능성 — 반응형은 시안 따라 추가 작업 안 함
  - rating이 0인 PastApp이 들어오면 ★ 0개 + ☆ 5개 표시 (현재 데이터 없음)
- **tsc --noEmit 통과 확인** (EXIT=0, 에러 0)

⚠️ reviewer 참고:
- **시안 충실도**: GuestApps.jsx 273줄 1:1 박제. `setRoute` prop 추상화는 Next.js Link/Router로 대체. `GAMES[i]` 배열 의존은 인라인 game 객체로 직접 박제 (다른 페이지의 GAMES와 결합 회피).
- **인라인 style vs Tailwind**: 시안이 인라인 style을 쓰고 있어 Safety/Help/Login 등 다른 BDR v2 페이지와 동일한 패턴 유지. globals.css의 .card/.btn/.badge 클래스가 BDR v2 토큰 기반이므로 시안 충실도 우선.
- **타입 분리**: ActiveApp/PastApp을 union으로 합쳐 GuestApp 정의. status별 좁히기는 `a.status === "completed"` + `(a as PastApp)` 캐스트 또는 `"role" in a` in 연산자 가드 사용. TS strict 통과.
- **이모지 유지 (Material Symbols 변환 안 함)**: 시안에 이모지(⚡🎯🏆📅📍💳)가 명시되어 있고, BDR v2 시안 의도가 그러함. 다른 BDR v2 페이지(Safety 등)도 이모지 유지. lucide-react 미사용 (CLAUDE.md 준수).
- **버튼 vs Link**: 라우팅이 있는 액션(경기 상세/다시 지원/팀 보기/게스트 찾기)은 `<Link>` + `.btn` 클래스 조합. 단순 액션(팀과 채팅/참가 취소/팀에 문의/지원 철회/후기 남기기)은 `<button type="button">` (현재 동작 0, 추후 핸들러 추가).
- **다크모드**: 모든 색상 var(--*) 토큰 사용으로 자동 대응. 단 팀 컬러(teamColor/teamInk)는 데이터 속성이므로 다크/라이트 모두 동일.
- **접근성**: 메시지 따옴표는 `&quot;` 엔티티로 escape (react/no-unescaped-entities 회피).

## 구현 기록 — Phase 7 Calendar v2 박제 [2026-04-27]

📝 구현한 기능: 내 일정 신규 라우트 `/calendar` — 시안(Calendar.jsx 279줄) 박제. DB 미지원 → UI 미리보기 (실 동작 0).

| 파일 경로 | 변경 내용 | 신규/수정 |
|----------|----------|----------|
| `src/app/(web)/calendar/page.tsx` | 시안 박제 + 더미 EVENTS 17건 외부화 + 월/리스트/주(준비중) 3뷰 + 필터 6종(전체/픽업/게스트/스크림/대회/완료) + 사이드 다가오는 일정·이번 달 통계·TIP 3카드 | 신규 |

핵심 결정:
- **API/Prisma 0 변경** — DB 모델 0% 지원. 정적 더미만 (EVENTS 17건/TODAY '2026-04-23'/DOWS).
- **시안 색 키 중복 버그 수정** — 시안 L153/L157 객체 리터럴 `color` 키 중복(JS는 마지막 값 유지). 단일 `color`로 통합 (isToday=#fff / dow=0=err / dow=6=cafe-blue / 기본=ink). 의도 보존.
- **이벤트 클릭 noop** — PM 지시. `cursor: e.hasRoute ? "pointer" : "default"`만 시안 그대로. setRoute 호출 제거. 시안 L10의 `route:'gameDetail'`만 hasRoute=true로 변환(첫 번째 픽업 이벤트만 cursor pointer).
- **'오늘' 버튼 시안 하드코딩 유지** — `setMonth({ y: 2026, m: 4 })` 그대로 (PM 지시). 실 환경 today 추출 로직 미적용.
- **week 뷰 "준비 중" 박스** — 시안 L269~L273 그대로 박제 (`view==='week'` 시 카드 1개 + 안내 텍스트).
- **+ 일정 등록 / ↗ ICS 내보내기 noop** — `disabled + title="준비 중"` (PM 지시). 시안 원본은 `<button>`만 있음.
- **6주 42칸 캘린더 그리드** — 시안 L31~L51 박제(prev tail / current / next head). isToday 셀 accent 6% 배경 + 일자 배지 accent 원형 흰글씨.
- **이벤트 칩 최대 3개 + "+N건"** — 시안 L162~L174 박제. color-mix 18%/20% 배경 + borderLeft 2px.
- **CSS 토큰**: `var(--cafe-blue)`, `var(--accent)`, `var(--ok)`, `var(--err)`, `var(--ink/-soft/-mute/-dim)`, `var(--bg/-alt)`, `var(--border)`, `var(--ff-mono/-display)` — globals.css BDR v2 토큰만 사용. 하드코딩 색상 2건(스크림 #8B5CF6 / 대회 #F59E0B)은 시안 박제값.
- **시안 클래스 활용**: `.page`, `.card`, `.btn`, `.btn--sm`, `.btn--primary`, `.theme-switch`, `.theme-switch__btn`, `.eyebrow`, `.badge`, `.badge--ok`, `.badge--ghost` — 추가 스타일 0.
- **Link 매핑**: 시안 setRoute('home')만 사용 → `<Link href="/">홈</Link>` 1건. 그 외는 noop.

🚧 추후 구현 — Phase 7 Calendar DB 연동 (백로그):
1. **사용자별 일정 집계 API** `/api/web/calendar?from=YYYY-MM-DD&to=...` — game_applications + guest_applications + tournament_matches + scrim_matches 통합 쿼리
2. **이벤트 5종 분류 정형화** — pickup/guest/scrim/tournament/done. status 기반(scheduled→pickup·guest·scrim, completed→done, tournament_matches→tournament)
3. **이벤트 클릭 라우팅 활성화** — pickup/guest→/games/[id], scrim→/teams/[id]/scrims/[matchId], tournament→/tournaments/[id]
4. **+ 일정 등록 모달** — 사용자 정의 일정 모델 `user_calendar_events` (id, user_id, date, time, title, court, type, color, created_at). 외부 일정(농구장 답사 등) 메모 기능
5. **ICS 내보내기** — text/calendar 응답 + UID/DTSTART/DTEND/SUMMARY/LOCATION/DESCRIPTION. /api/web/calendar/export.ics 라우트
6. **주(week) 뷰 본구현** — Mon~Sun 7컬럼 + 시간대(00~23) 24행 그리드 + 이벤트 블록 절대위치 (높이=duration). 현재 "준비 중" 박스
7. **친구 일정 겹쳐보기 (BDR+ 멤버 전용)** — TIP 카드 시안 문구. friends 모델 + view='week' 색상 분기
8. **이번 달 통계 동적화** — 현재 EVENTS 상수 기반 카운트. 사용자별 실데이터 + 전월 대비 trend

💡 tester 참고:
- **테스트 URL**: `http://localhost:3001/calendar` (또는 dev 프리뷰 `/calendar`)
- **시안 비교**: `Dev/design/BDR v2/screens/Calendar.jsx` (279줄)
- **정상 동작**:
  1. 진입 시 브레드크럼(홈 › 내 일정) + eyebrow "My Calendar · 2026" + h1 "내 일정"
  2. 우상단 뷰 토글(월/주/리스트) + "+ 일정 등록"(disabled) + "↗ 내보내기 (ICS)"(disabled)
  3. 필터 6종 칩 — 전체(17)/픽업(5)/게스트(3)/스크림(1)/대회(6)/완료(4). 클릭 시 btn--primary 활성화 + 색 점 8x8
  4. **월(month) 뷰** — 좌측 6주 42칸 그리드 + 우측 320px 사이드(다가오는 일정·통계·TIP)
  5. 월 헤더 — ‹ / 오늘 / › / "2026년 4월" + 우측 N건 카운터
  6. 요일 헤더 — 일(빨강)/월~금(회색)/토(cafe-blue)
  7. 셀 — `2026-04-23` (today)는 accent 6% 배경 + 일자 accent 원형 흰글씨. 다른 달은 opacity 0.35 + bg-alt
  8. 이벤트 칩 — 최대 3개 + "+N건". HH:MM + 제목 ellipsis. 첫 픽업(미사강변)만 cursor pointer, 나머지 default
  9. ‹/› 클릭 시 월 이동, "오늘" 클릭 시 2026-04 강제 복귀 (PM 지시)
  10. **리스트(list) 뷰** — 카드 1개 안 "예정 (N)" + "완료 (N)" 2섹션. 80px(날짜·시간) / 1fr(타입칩+제목+장소) / auto(badge 확정/완료)
  11. **주(week) 뷰** — 시안대로 "주간 뷰는 준비 중입니다. 월간 또는 리스트 뷰를 이용해주세요." 단일 박스
  12. 다가오는 일정 카드 — TODAY 이후 done 제외 6건. 44px 날짜(MM월/DD) + title + time·court. borderLeft 3px 이벤트 컬러
  13. 이번 달 통계 카드 — 2x2 (경기/대회/완료/예정) 큰 숫자 + 라벨
  14. TIP 카드 — bg-alt 배경 + ICS 안내 1줄
  15. 모든 클릭 액션 noop (cursor pointer만). 브레드크럼 "홈"만 Link 정상 동작
- **주의 입력**:
  - 좁은 화면(<768px)에서 grid `minmax(0,1fr) 320px` 깨짐 가능성 — 반응형은 시안 따라 추가 작업 안 함
  - 다크모드 토글 시 var(--*) 토큰 자동 대응 (스크림 #8B5CF6 / 대회 #F59E0B는 정적이므로 동일)
  - 시안의 today '2026-04-23'은 EVENTS 중간 시점. 월 변경 시 다른 달에는 isToday 셀 없음
- **tsc --noEmit 통과 확인** (EXIT=0)

⚠️ reviewer 참고:
- **시안 충실도**: Calendar.jsx 279줄 1:1 박제. `setRoute` prop은 noop + cursor pointer만 (PM 지시). `Icon` 미사용.
- **시안 버그 수정**: L141~L160 일자 배지 인라인 style 객체에서 `color` 키가 L153과 L157에 두 번 정의됨 — JS spec상 마지막 값(L157)이 적용됨. 두 키 모두 같은 의미였으므로 동작에는 차이 없으나, 시안 그대로 옮기면 lint(no-dupe-keys) 경고. 단일 키로 통합하면서 의도 보존(isToday=#fff / dow별 색).
- **인라인 style vs Tailwind**: 시안이 인라인 style을 쓰고 있어 GuestApps/Help/Login 등 다른 BDR v2 페이지와 동일한 패턴 유지. globals.css의 .card/.btn/.theme-switch/.eyebrow/.badge 클래스가 BDR v2 토큰 기반이므로 시안 충실도 우선.
- **타입 정의**: EventType union (5종) + FilterId = "all" | EventType + ViewMode = "month" | "week" | "list". hasRoute는 optional boolean (시안 route 키 noop화).
- **EVENTS 상수 위치**: 컴포넌트 외부(모듈 스코프)에 17건 박제. 시안 L9~L27 동일.
- **'오늘' 버튼 동작**: 시안 L120 `setMonth({y:2026, m:4})` 그대로 (PM 지시). 실 환경 `new Date()` 기반 today 산정은 추후 구현 시점에 함께 처리(현재 today='2026-04-23' 박제와 일관성 유지).
- **week 뷰 미구현**: 시안도 박스 1개로 "준비 중" 표시. PM 지시대로 시안 그대로 박제.
- **다크모드**: 모든 var(--*) 토큰 자동 대응. 스크림 #8B5CF6 / 대회 #F59E0B는 데이터 속성이므로 다크/라이트 동일 (시안 박제값).
- **+ 일정 등록 / ICS 내보내기 disabled 처리**: 시안 원본은 단순 `<button>`이지만 PM 지시로 `disabled + title="준비 중"` 추가하여 인터랙션 차단 명시.
- **추후 구현 8건 백로그 등록** — 일정 집계 API / 5종 분류 정형화 / 클릭 라우팅 / 일정 등록 모달 / ICS / 주(week) 뷰 본구현 / 친구 일정 겹쳐보기 / 이번 달 통계 동적화

---

### 구현 기록 — Phase 8 TeamInvite v2 박제 (2026-04-27)

📝 구현한 기능: 팀 초대 수락/거절 페이지 v2 신규 박제 (`/team-invite`)

| 파일 경로 | 변경 내용 | 신규/수정 |
|----------|----------|----------|
| src/app/(web)/team-invite/page.tsx | 메타데이터 + 클라 컴포넌트 마운트 (29줄) | 신규 |
| src/app/(web)/team-invite/_v2/team-invite-client.tsx | TeamInvite.jsx 시안 1:1 박제 (537줄) | 신규 |

**라우트 충돌**: 없음. `/invite`는 카페 이전 안내 정적 페이지라 별개. `/team-invite`는 미점유 → 신규 생성.

**보존 항목**:
- 시안 인라인 데이터 100% 유지 (team / inviter / invite 객체)
- DB 호출 0건, API 호출 0건 (사용자 원칙 — 박제 + '준비 중' 형태)
- useState 인터랙션 (status: pending/accepted/declined, showProfile) 그대로
- 시안 인라인 style + color-mix() 그라디언트 유지

**시안 변형**:
- a 태그 onClick → button 변환 (a11y) — "초대 다시 보기" / "프로필 펼치기"
- 라우터 `setRoute('teamDetail')` → `<Link href="/teams">`로 폴백 (실제 팀 ID 없음)
- 메시지 따옴표 `"..."` → HTML 엔티티 `&ldquo;&rdquo;` (react/no-unescaped-entities)
- 빈 a href → `#team-rules`, `#report` 앵커 (lint 회피)

💡 tester 참고:
- 테스트 방법: `/team-invite` 직접 방문
- 정상 동작: 초대 카드 → "수락하고 합류하기" 클릭 → 환영 화면 / "거절" → 거절 화면 → "초대 다시 보기"로 복귀
- 프로필 펼치기 토글 동작 확인
- 주의: DB/API 미연결 (박제) — 새로고침 시 status 초기화는 정상

⚠️ reviewer 참고:
- 시안 충실도: TeamInvite.jsx 205줄 1:1 박제. 시안의 mock TEAMS[2] 객체는 박제 시 인라인으로 풀어냄 (몽키즈 컬러 #F5C842 추정값 — 시안 원본 TEAMS 배열 미접근).
- lucide-react 미사용. 시안 원본도 텍스트 ✓ ✕ 만 사용 (Material Symbols 불필요).
- v2 토큰(--bg-alt, --ink-mute, --ff-display, --cafe-blue-soft 등) 다른 v2 페이지와 동일 사용 → globals.css 영향 없음.
- 향후 DB 연결 시: TeamInvitation 테이블 신설 + `/team-invite/[code]` 동적 세그먼트 변경 + GET/POST API 3종 추가.
- tsc --noEmit 통과 (EXIT=0).

---

### 구현 기록 — 코트 대관 Phase B-8 — expire-pending-bookings Cron 신규 (2026-04-27)

📝 구현한 기능: 코트 대관 결제 미완료(15분+ pending) 자동 만료 Vercel Cron (10분 주기)

| 파일 경로 | 변경 내용 | 신규/수정 |
|----------|----------|----------|
| `src/app/api/cron/expire-pending-bookings/route.ts` | GET 핸들러 + CRON_SECRET Bearer 검증 + cutoff=now-15분 + `prisma.court_bookings.updateMany` 단일 UPDATE + JSON 응답 `{expired, cutoff, timestamp}` + `dynamic="force-dynamic"` | 신규 (65줄) |
| `vercel.json` | 기존 crons 3건 보존 + `/api/cron/expire-pending-bookings` `*/10 * * * *` 1건 추가 (4건 총) | 수정 (5줄 추가) |

🔧 핵심 동작:
- `WHERE status="pending" AND created_at < (now - 15분)` → `SET status="cancelled", cancelled_at=now, cancellation_reason="결제 미완료 자동 만료", updated_at=now`
- 단일 SQL UPDATE 한 번 (다른 API 호출 0건)
- pending은 결제 confirm 전이라 토스 환불 호출 불필요

🛡 보안:
- CRON_SECRET 헤더 검증 (Authorization: Bearer ...) — 다른 cron(referee-healthcheck/tournament-reminders/weekly-report)과 동일 패턴
- `process.env.CRON_SECRET` 미설정 시 검증 생략 (로컬 개발 편의 — referee-healthcheck도 동일 정책은 아니지만 PM 명세 따름)

📐 영향 범위:
- Phase A 무료 흐름(status="confirmed" 즉시 생성) 영향 0건 — `where status="pending"`만 대상
- court_bookings 다른 컬럼/인덱스 변경 0건
- Prisma 마이그레이션 0건 (schema.prisma 변경 없음)

💡 tester 참고:
- 테스트 방법:
  1. 로컬: `INSERT INTO court_bookings (..., status='pending', created_at=NOW() - INTERVAL '20 minutes', ...)` 더미 1건 + `curl http://localhost:3001/api/cron/expire-pending-bookings -H "Authorization: Bearer $CRON_SECRET"` (CRON_SECRET 미설정 시 헤더 생략 가능)
  2. 응답 `{ expired: 1, cutoff: "...", timestamp: "..." }` 확인
  3. DB 재조회 → status=cancelled, cancelled_at NOT NULL, cancellation_reason="결제 미완료 자동 만료" 확인
- 정상 동작:
  - pending + 15분+ → cancelled로 변경
  - confirmed 또는 cancelled 상태는 절대 건드리지 않음 (where status=pending만 대상)
  - pending이지만 14분 경과 → 변경 X (cutoff 미달)
  - 만료 대상 0건 → `{ expired: 0, ... }` 정상 반환
- 주의할 입력:
  - CRON_SECRET 잘못된 헤더 → 401
  - CRON_SECRET 미설정 환경에서는 어떤 헤더든 통과 (로컬 개발용, 운영은 반드시 .env에 CRON_SECRET 설정 필요)

⚠️ reviewer 참고:
- **CRON_SECRET 미설정 시 검증 생략**은 PM 명세 그대로 (`if (process.env.CRON_SECRET && authHeader !== ...)`). referee-healthcheck는 무조건 검증하지만, 본 cron은 PM이 "권장"이라고 명시.
- `dynamic = "force-dynamic"` 명시 — Vercel Cron은 GET이라 Next 정적 최적화 차단 필요.
- `updated_at` 명시 지정 — Prisma `@updatedAt`이 `updateMany`에서도 자동 갱신되지만 PM 명세 그대로 가독성 위해 명시.
- 토스페이먼츠 환불 호출 X — pending 상태는 결제 confirm 전이므로 결제 자체가 없음.
- vercel.json `*/10 * * * *` (10분마다 정각/10분/20분/30분/40분/50분 실행) — 사용자가 결제창을 띄우고 15분 이상 방치 시 최대 25분 후 슬롯 해제(평균 20분).

---

### 구현 기록 — 코트 대관 Phase B-1 — refund-policy 유틸 신규 (2026-04-27)

📝 구현한 기능: 코트 예약 환불 정책 룰 엔진 (KST 자정 기준 일수 차이 → 환불 비율/금액 산출)

| 파일 경로 | 변경 내용 | 신규/수정 |
|----------|----------|----------|
| `src/lib/courts/refund-policy.ts` | 약 145줄. Phase B 환불 정책 1유틸. `KST_OFFSET_MS`/`DAY_MS` 상수 + `RefundLabel` 타입 + `toKstMidnight(d)` (UTC ms+9h → setUTCHours(0,0,0,0), 코드베이스 17개 위치와 동일 패턴) + `calcDaysBeforeBookingKst(start, now=new Date())` (Math.round로 일수 정수화, 음수 가능) + `getRefundRatio(daysBefore)` (≥3→1.0/≥1→0.5/≤0→0.0) + `RefundCalculation` 타입 export + `calcRefundAmount(start, paid, now=new Date())` (paid<0 보정 + Math.floor 절단 → DELETE booking에서 토스 cancelAmount로 그대로 사용) | 신규 |

🔧 핵심 정책 (시안 TournamentEnroll과 통일, 사용자 결정 Q4=a):
- D-3 이전 (시작일까지 3일 이상): 100% 환불 (`label: "D-3 이전"`)
- D-2 ~ D-1 (1~2일 전): 50% 환불 (`label: "D-2 ~ D-1"`)
- 당일 (0일) 또는 이미 지난 예약(음수): 0% (`label: "당일"`)

⏰ 타임존:
- **한국 시간(Asia/Seoul, UTC+9) 자정 기준** (사용자 결정)
- 사유: 사용자 체감 "D-3"은 시계 시각이 아닌 KST 달력 날짜 차이. 23:59 취소와 00:01 취소가 같은 일자로 간주되어야 함
- 방법: `getTime() + 9시간 → setUTCHours(0,0,0,0)` (코드베이스 다수 위치 일관 패턴)

📐 영향 범위:
- 의존성 0 — Date만 사용 (Prisma/외부 라이브러리 0)
- DB 변경 0
- Phase A 호환 — paidAmount=0이면 amount=0 안전 반환 (무료 예약에도 호출 가능)

💡 tester 참고:
- 테스트 방법: 단위 테스트 케이스 (Date 주입 가능)
  ```ts
  const start = new Date('2026-04-30T05:00:00Z'); // KST 14:00
  // 4일 전 (KST 자정 기준) → 100% 환불
  calcRefundAmount(start, 100000, new Date('2026-04-26T15:00:00Z')) // KST 4-27 00:00 직후
  // → { ratio: 1.0, amount: 100000, daysBefore: 3, label: "D-3 이전" }

  // 2일 전 → 50%
  calcRefundAmount(start, 100000, new Date('2026-04-28T15:00:00Z'))
  // → { ratio: 0.5, amount: 50000, daysBefore: 2, label: "D-2 ~ D-1" }

  // 당일 → 0%
  calcRefundAmount(start, 100000, new Date('2026-04-30T05:00:00Z'))
  // → { ratio: 0.0, amount: 0, daysBefore: 0, label: "당일" }
  ```
- 정상 동작:
  - 정확히 3일 전(KST 자정 기준) = 100% (≥ 3 비교)
  - 정확히 2일/1일 전 = 50%
  - 0일/음수일 = 0%
  - 무료 예약(paid=0) → amount=0
  - 음수 paidAmount → 0으로 보정
- 주의할 입력:
  - 시작 시각이 KST 자정 직전(23:59) vs 직후(00:01): 자정 절단으로 같은 일자 처리되는지
  - 50% 환불 시 odd 금액(예: 12345) → Math.floor → 6172 (절단 확인)
  - 이미 지난 예약(과거) → daysBefore 음수, label="당일", amount=0

⚠️ reviewer 참고:
- **toKstMidnight 결정**: 사용자 가이드한 `getTime() + 9h → setUTCHours(0,0,0,0)` 패턴 그대로 채택. 코드베이스 17곳에서 동일 패턴 사용 중 (gamification/notifications/utils/format-date/courts/page/booking-client/upcoming-games/teams-tournaments-card/profile/weekly-report/cron/* 전부) — 일관성 우선. `Intl.DateTimeFormat` 변환 방식은 도입하지 않음.
- **반환 Date의 의미**: toKstMidnight() 반환 Date의 `getTime()`은 "KST 자정의 실제 UTC 시각보다 9시간 빠른" 값. 이 함수로 가공한 두 Date 차분은 정확하지만, 외부에 직접 노출 시 혼동 가능. 함수 JSDoc에 명시.
- **DAY_MS는 24h 고정**: KST는 DST 미적용이라 안전. UTC↔로컬 환산이 아니라 두 KST 자정 차분이라 더더욱 안전.
- **Math.round vs Math.floor**: 일수 계산은 `Math.round` 사용 (KST 자정끼리 비교라 항상 정수 일수가 나오지만 부동소수점 안전 마진).
- **B-7(DELETE bookings)에서 사용 시**: `result.amount`를 토스 cancel API의 `cancelAmount`로 그대로 전달. 부분환불은 토스 API 옵션 그대로.
- **무료 예약 호출 안전성**: Phase A 무료 예약(final_amount=0) 취소 흐름에서도 호출 가능 — amount=0 반환되어 토스 호출 분기에서 자연스럽게 skip 가능.

---

### 구현 기록 — 코트 대관 Phase B-2 — POST /bookings 결제 분기 (2026-04-27)

📝 구현한 기능: Phase A 의 `final_amount=0` + `status=confirmed` 강제 분기를 제거하고, 유료(fee>0)/무료(fee=0) 분기 도입. 유료 예약은 `status=pending` + 실제 금액 + 응답에 orderId 포함하여 토스 결제창 호출 가능 상태로 반환.

| 파일 경로 | 변경 내용 | 신규/수정 |
|----------|----------|----------|
| `src/app/api/web/courts/[id]/bookings/route.ts` | 헤더 주석 Phase A→B-2 갱신 + INSERT 직전 `isPaid=amount>0` 분기(`finalAmount`/`initialStatus` 조건부) + 트랜잭션 외부 응답 분기(유료=`requiresPayment:true,orderId,amount` / 무료=`requiresPayment:false`) | 수정 (290→323줄, +33) |

🔧 핵심 분기 로직:
```typescript
// 트랜잭션 내부 (INSERT 직전)
const feePerHour = court.booking_fee_per_hour ? Number(court.booking_fee_per_hour) : 0;
const amount = feePerHour * duration_hours;
const isPaid = amount > 0;
const finalAmount = isPaid ? amount : 0;
const initialStatus = isPaid ? "pending" : "confirmed";
// → court_bookings.create({ ..., amount, final_amount: finalAmount, status: initialStatus })

// 트랜잭션 외부 (응답)
const isPaid = Number(created.final_amount) > 0;
const orderId = isPaid ? `BOOKING-${id}-${userId}-${Date.now()}` : null;
// 유료: { booking, requiresPayment: true, orderId, amount }
// 무료: { booking, requiresPayment: false }
```

🛡 보존 항목 (Phase A → B-2 100% 유지):
- `getWebSession` 인증 (① UNAUTHORIZED 401)
- `CreateBookingSchema` Zod 검증 (② VALIDATION_ERROR 400)
- `validateBookingTime` 시간 정합성 (③ INVALID_TIME 400)
- `booking_mode === "internal"` 가드 (④ BOOKING_NOT_SUPPORTED 400)
- `prisma.$transaction` + `acquireBookingLock(tx, courtInfoId)` (pg_advisory_xact_lock — 동시 요청 race 방지)
- `checkConflict(tx, ...)` — `ACTIVE_STATUSES`에 `pending` 이미 포함되어 있어 결제 대기 중 예약도 충돌 검사 대상
- `SLOT_CONFLICT` → 409 변환 catch
- `apiSuccess` 자동 snake_case 변환 (errors.md 6회차 가드)

📐 order_id 처리 방식 (DB 변경 0 원칙):
- `court_bookings` 테이블에 `order_id` 컬럼 **추가하지 않음**
- 응답 시점에 `BOOKING-${bookingId}-${userId}-${Date.now()}` 패턴으로 생성 → 클라이언트가 `toss.requestPayment({ orderId, ... })` 에 그대로 전달
- successUrl 콜백(B-3)에서 `orderId` 의 `BOOKING-` 다음 첫 segment 를 파싱하여 `bookingId` 추출 → `prisma.court_bookings.findUnique({ where: { id: BigInt(bookingId) } })` 로 lookup
- userId 도 패턴에 포함되어 있어 콜백에서 세션 사용자와 일치 검증 가능 (위변조 방지 보조 수단)
- timestamp 는 동일 booking 재시도 시 orderId 중복 방지 + 토스 측 idempotency

📊 Phase A vs Phase B-2 결과 비교:
| 항목 | 무료 코트 (fee=0) | 유료 코트 (fee>0) |
|------|---------|---------|
| `amount` | 0 | feePerHour × hours |
| `final_amount` | 0 | feePerHour × hours |
| `status` | `confirmed` | `pending` |
| `platform_fee` | 0 (Phase C 이후) | 0 (Phase C 이후) |
| `payment_id` | NULL | NULL (B-3 confirm 콜백에서 채움) |
| 응답 `requiresPayment` | `false` | `true` |
| 응답 `orderId` | (없음) | `BOOKING-{id}-{userId}-{ts}` |
| 응답 `amount` (유료 동봉) | (없음) | feePerHour × hours |

💡 tester 참고:
- 테스트 방법:
  1. **무료 회귀**: `booking_fee_per_hour=0` 또는 NULL 코트 → POST `/api/web/courts/[id]/bookings` body `{ start_at, duration_hours: 1, purpose: "pickup" }` → 응답 `{ booking.status: "confirmed", booking.final_amount: 0, requiresPayment: false }` 확인 (Phase A 회귀 테스트 핵심)
  2. **유료 신규**: `booking_fee_per_hour=10000` 코트 → 동일 요청 → 응답 `{ booking.status: "pending", booking.final_amount: 10000, requiresPayment: true, orderId: "BOOKING-...", amount: 10000 }` 확인. DB 직접 조회 시 `status='pending'` `final_amount=10000` 확인.
  3. **충돌 검사 회귀**: 같은 코트 같은 시간대 두 번 요청 → 두 번째는 409 `SLOT_CONFLICT` (pending 도 ACTIVE_STATUSES 라 충돌 검사 통과 확인)
  4. **인증/검증 회귀**: 비로그인 401, 잘못된 body 400, external/none mode 코트 400(BOOKING_NOT_SUPPORTED)
- 정상 동작:
  - 무료 코트 → 즉시 `confirmed` (Phase A 와 동일 흐름)
  - 유료 코트 → `pending` 으로 INSERT, orderId 응답 (클라가 토스 결제창 호출 → 성공 시 B-3 confirm 콜백이 `confirmed` 로 변경)
  - pending 상태도 다른 사용자 예약 시도 시 충돌 발생 → 슬롯 점유 효과
  - 15분+ 방치된 pending 은 B-8 cron 이 자동 cancelled 처리 (이미 구현됨)
- 주의할 입력:
  - `booking_fee_per_hour` 가 Decimal 타입이라 `Number()` 변환 필수 (이미 처리). null 일 수 있어 `?? 0` 폴백
  - `feePerHour=0` 명시 + duration>0 조합도 amount=0 → 무료 흐름 (의도된 동작)
  - 매우 작은 fee(예: 1원) 도 `amount > 0` 이라 유료 분기. PG 최소 결제 금액(보통 100원) 미달 시 토스 측에서 400 반환 — 운영 정책으로 booking_fee_per_hour 최소값 검증은 admin 측 책임 (Phase A 부터 동일)

⚠️ reviewer 참고:
- **isPaid 두 번 계산** — 트랜잭션 내부(`amount > 0`)와 외부(`Number(created.final_amount) > 0`)에서 별도 계산. select 결과에서 final_amount 가 Decimal 로 오므로 `Number()` 한 번 더 필요. 동일 의미지만 변수 이름 충돌이 없는 별도 스코프라 의도적으로 그대로 둠.
- **orderId 에 BigInt → string 변환** — `created.id.toString()` + `userId.toString()` 모두 안전 (BigInt 직렬화 우회)
- **DB 변경 0** — `prisma/schema.prisma` 0 변경, 마이그레이션 0 (운영 DB 보호)
- **platform_fee=0 유지** — Phase C(정산) 이후에 사용. Phase B 단계에서 미리 채우면 환불 시 정합성 깨질 위험
- **payment_id NULL** — B-3 confirm 콜백에서 토스 paymentKey 검증 후 채움. 본 분기에서는 건드리지 않음
- **무료 응답 형식 변경** — 기존 `{ booking }` → `{ booking, requiresPayment: false }`. 클라가 `requiresPayment` 미체크 시에도 `booking.status` 만 보고 동작 가능 (하위 호환). Phase A 클라이언트 코드 영향 0 (booking 객체 키는 동일).

🔗 다음 작업 (Phase B-3 successUrl 콜백):
- `src/app/api/web/courts/[id]/bookings/[bookingId]/confirm/route.ts` 신규 → toss.confirmPayment 호출 + payment_id/status="confirmed" 업데이트
- orderId 패턴(`BOOKING-${bookingId}-${userId}-${ts}`) 파싱 검증 로직 필요
- 결제 검증 실패 → status="cancelled" + cancellation_reason="결제 실패"

---

### 구현 기록 — 코트 대관 Phase B-3 — payments/confirm/booking GET 신규 (2026-04-27)

📝 구현한 기능: 토스페이먼츠 successUrl 콜백 — 코트 예약 결제 승인 → DB(payments INSERT + court_bookings UPDATE) 트랜잭션 처리. Plan 결제 흐름과 분리된 URL(`/api/web/payments/confirm/booking`).

| 파일 경로 | 변경 내용 | 신규/수정 |
|----------|----------|----------|
| `src/app/api/web/payments/confirm/booking/route.ts` | 237줄. `withWebAuth` GET. 입력: `paymentKey`/`orderId`/`amount` 쿼리. orderId 파싱(`BOOKING-{bookingId}-{userId}-{ts}` 4세그먼트) + booking 조회 + **3중 보안 게이트**(세션user===orderIduser===booking.user_id / status="pending" + payment_id===null / DB.final_amount===query.amount) → 토스 `/v1/payments/confirm` POST(Basic Auth) → 응답 totalAmount 4번째 검증(불일치 시 `tossCancelCompensate`) → `prisma.$transaction`(payments INSERT payable_type="CourtBooking" + court_bookings.updateMany where status="pending" AND payment_id=null → race 가드, count!==1이면 throw 롤백) → 실패 시 `tossCancelCompensate` 보상 호출 → 성공 `/profile/bookings?just_paid=1` redirect, 실패 `/courts/{courtId}/booking/payment-fail?reason=...` redirect (courtId 모를 때는 `/profile/bookings?fail=...` 폴백). | 신규 |

🛡 신뢰 경계 (4중 게이트):
1. **세션 user vs orderId user vs booking owner** 일치 — query 변조 차단
2. **booking.status === "pending" + payment_id === null** — 이미 결제된 booking 재결제 차단
3. **DB final_amount === query amount** — 클라가 amount 변조해도 DB가 최종 신뢰소스
4. **토스 응답 totalAmount === amount** — 토스 측 응답까지 재대조 (이중 보안)

🔧 보상 호출 (`tossCancelCompensate`):
- 토스 confirm 은 이미 카드 승인된 상태 → DB 트랜잭션 실패 시 결제만 살아있는 상태 방지
- 사유 2종: ① 토스 응답 totalAmount 불일치(검증 실패) ② DB 저장 실패(트랜잭션 롤백)
- 보상 호출까지 실패 시 console.error 로그만 남기고 사용자에게 fail redirect (운영자 수동 개입)

⚙️ 트랜잭션 race 가드:
- `court_bookings.updateMany({ where: { id, status: "pending", payment_id: null }, ... })` — 두 번째 요청은 0 row 영향
- count !== 1 → throw "BOOKING_RACE" → 트랜잭션 롤백 → payments INSERT 도 취소 → 토스 cancel 보상

📐 DB 변경 0:
- `payable_type` 다형성에 `"CourtBooking"` 신규 값만 사용 (VarChar라 마이그레이션 X)
- `court_bookings.payment_id` 는 Phase A에서 이미 추가된 BigInt? 컬럼 활용
- Plan 결제 (`/api/web/payments/confirm/route.ts`) 파일 0 변경 — URL 분리로 회귀 위험 차단

💡 tester 참고:
- 테스트 방법:
  1. **유료 정상 흐름**: B-2 POST `/api/web/courts/[id]/bookings` 로 fee>0 코트 예약 생성 → 응답 `orderId` 확보 → 토스 결제창 호출 → 성공 시 `/api/web/payments/confirm/booking?paymentKey=...&orderId=...&amount=...` 콜백 도달 → DB `payments.payable_type="CourtBooking"`, `payable_id=bookingId`, `status="paid"` + `court_bookings.status="confirmed"`, `payment_id=payments.id` 확인 → `/profile/bookings?just_paid=1` 도착
  2. **금액 변조 차단**: 콜백 URL의 `amount` 만 다른 값으로 변조 → `?fail=amount_mismatch` redirect, DB 변경 0
  3. **owner 변조 차단**: 다른 사용자 세션으로 같은 콜백 도달 → `?reason=owner_mismatch`
  4. **재처리 차단**: 동일 콜백 두 번 도달 → 두 번째는 `?reason=already_processed` (status=confirmed + payment_id 존재)
  5. **race 동시성**: 동일 booking 콜백 거의 동시 2건 → 한 건만 success, 다른 건은 db_error + 보상 cancel
  6. **토스 confirm 실패**: 잘못된 paymentKey → toss_error code redirect, DB 변경 0
  7. **DB 저장 실패 시뮬레이션**: payment_code unique 충돌 일부러 만들기 → db_error redirect + 토스 cancel API 호출 확인 (서버 로그)
- 정상 동작:
  - pending booking + 정상 amount → confirmed 전환 + payments row 생성
  - 무료 booking 흐름(B-2 confirmed 즉시)은 본 라우트 호출 X (영향 0)
  - 결제창 닫기 → 본 라우트 미도달, B-8 cron 이 15분 후 cancelled 처리
- 주의할 입력:
  - orderId가 BOOKING- prefix가 아니거나 4세그먼트 아니면 invalid_order_id
  - bookingId/userId BigInt 변환 실패 시 invalid_order_id catch
  - amount<=0 또는 NaN → invalid_amount
  - `TOSS_SECRET_KEY` 미설정 → config_error (개발 .env 확인)

⚠️ reviewer 참고:
- **URL 분리 결정**: 기존 `/api/web/payments/confirm/route.ts` (Plan 전용) 0 변경 + 신규 booking 전용 라우트. 이유: orderId 형식·payable_type·후속 처리(user_subscriptions 미생성)가 다름. 분기 if문보다 회귀 위험 적음 (planner 권장 그대로).
- **3중 보안 게이트 + 토스 totalAmount 4번째 검증** — 기획서 B-6은 3중까지 명시, 본 구현은 토스 응답까지 재대조하여 4중. 신중함 추가 (제거해도 정합성에 영향 X).
- **`payment_id: null` 추가 조건** — booking.status="pending" 이지만 payment_id가 이미 있다면(이상 상태) 새 payments 안 만들고 already_processed 차단. 방어적 코드.
- **`updateMany` + count===1 가드** — `update`가 아닌 `updateMany`인 이유: race 동시성에서 두 번째 호출이 throw 안 나고 count=0 받게 하기 위함. 그 다음 `if (count !== 1) throw`로 명시적 롤백.
- **보상 호출 idempotency** — `tossCancelCompensate` 는 try/catch 만 있고 멱등성 보장 X. 동일 paymentKey 두 번 cancel 호출 시 토스가 409 반환할 수 있음 (현 코드는 console.error만). 운영 시 모니터링 필요 (필요시 추후 `cancelReason` 별 idempotencyKey 추가).
- **Plan 라우트의 amount 검증 차이** — Plan은 `parseInt(amount) !== plan.price` 단순 비교, 본 라우트는 booking 측 BigInt + Number(Decimal) 변환. final_amount Decimal은 항상 정수원이라 안전.
- **redirect URL의 reason 코드** — 한국어 라벨이 아닌 영문 코드(missing_params, owner_mismatch, amount_mismatch, already_processed, db_error, config_error, toss_error 등). B-6 payment-fail 페이지에서 reason → 한국어 매핑 dictionary 필요.

🔗 다음 작업 (Phase B-4 failUrl 콜백):
- `src/app/api/web/court-bookings/[id]/payment-cancel/route.ts` POST 신규
- pending → cancelled + cancellation_reason="결제 실패/취소"
- 본인 검증만 (토스 confirm 호출 X — 결제 미승인 상태)
- 그 다음 B-5 (_booking-client.tsx 토스 SDK + 약관 + 2단계 handleSubmit), B-6 (payment-fail page), B-7 (DELETE 환불 정책)

---

### 구현 기록 (developer) — 2026-04-27 Phase B-4

📝 구현한 기능: court-bookings 결제 실패/취소 정리 API (POST)

| 파일 경로 | 변경 내용 | 신규/수정 |
|----------|----------|----------|
| `src/app/api/web/court-bookings/[id]/payment-cancel/route.ts` | POST — pending booking 본인 검증 후 cancelled 전환 | **신규** (113라인) |

**핵심 로직 (8단계)**
1. `getWebSession()` 인증 → 401 UNAUTHORIZED
2. `params.id` 정규식 + BigInt 변환 → 400 INVALID_ID
3. Body Zod (`{ reason?: max200 }`) 옵셔널 파싱 (body 없어도 OK)
4. `court_bookings.findUnique({id})` → 404 NOT_FOUND
5. `user_id !== session.userId` → 403 FORBIDDEN (본인 검증)
6. `status !== "pending"` → 409 ALREADY_PROCESSED
7. `updateMany` (where.status="pending" 가드) → status=cancelled, cancelled_at, cancellation_reason
8. count !== 1 시 409 (race 차단) / 성공 시 apiSuccess({booking: {...}})

**보안 가드**
- 본인만 가능 (user_id 검증)
- pending → cancelled 만 허용 (다른 status 409)
- updateMany + where.status="pending" 으로 successUrl/failUrl 동시 콜백 race 차단
- 토스 cancel 호출 안 함 (결제 미완료 상태이므로 불필요 — B-3 와 차이점)

💡 tester 참고:
- 테스트 방법:
  1. pending booking 만들고 본인 세션으로 POST → 200 + status="cancelled" 정상
  2. 다른 사용자 세션으로 POST → 403 FORBIDDEN
  3. 미인증으로 POST → 401 UNAUTHORIZED
  4. confirmed/cancelled booking 에 POST → 409 ALREADY_PROCESSED
  5. 존재하지 않는 id (예: 99999) → 404 NOT_FOUND
  6. 잘못된 id (예: "abc") → 400 INVALID_ID
  7. body 없이 POST → 200 (cancellation_reason="결제 실패" 기본값)
  8. body `{ reason: "사용자 취소" }` → 200 + cancellation_reason="사용자 취소"
- 정상 동작: 응답 `{ booking: { id, status:"cancelled", cancelled_at, cancellation_reason } }` (snake_case)
- 주의할 입력: reason 200자 초과는 Zod 실패 → safeParse 무시되어 기본값 적용 (현 구현은 422 안 던짐, 옵셔널 처리)

⚠️ reviewer 참고:
- **`updateMany` 선택**: `update` 대신 `updateMany` 사용 이유는 동시성 race 가드 (B-3 패턴 동일).
- **reason 기본값 "결제 실패"**: failUrl 시나리오 가정. body 로 reason 보내면 그 값 우선.
- **토스 cancel API 호출 안 함**: 결제창 진입 후 사용자가 취소/실패한 경우 토스 측 결제는 미완료 상태 → 보상 호출 불필요. 단, 만약 결제는 됐는데 클라이언트가 잘못 failUrl 로 와도 이 API 는 토스 정산을 건드리지 않으므로 안전 (별도 reconciliation 필요 시 운영자 수동).
- **Zod 200자 초과 시 무시**: 옵셔널 처리로 `parsed.success` 시에만 reason 적용. 엄격하게 422 던지고 싶다면 추가 검토.

✅ tsc --noEmit: PASS (exit 0)
🚫 미푸시 / 미커밋 (PM 처리 대기)

---

### 구현 기록 — 코트 대관 Phase B-7 — DELETE /bookings/[id] 환불 정책 적용 (2026-04-27)

📝 구현한 기능: 코트 예약 취소 API에 환불 정책(D-3 100% / D-2~D-1 50% / 당일 0%) + 토스 cancel API 호출 + payments 동시 갱신 트랜잭션 적용. 운영자 취소는 100% 환불 강제. Phase A 단순 status="cancelled" 흐름을 환불 룰 엔진 기반으로 확장.

| 파일 경로 | 변경 내용 | 신규/수정 |
|----------|----------|----------|
| `src/app/api/web/bookings/[id]/route.ts` | 183→약 360줄. DELETE 핸들러만 교체(GET/findBooking/loadBookingWithPermission 100% 보존). `calcRefundAmount` import 1줄 추가. ALREADY_STARTED 가드 신규(now>=start_at→409). 3분기 환불 분기(무료/유료ratio=0/유료ratio>0). 운영자 취소 시 ratio=1.0 강제. payments.status `partial_refunded`/`refunded` 결정. 토스 cancel POST + Basic Auth + cancelAmount 부분환불. `prisma.$transaction([court_bookings.update, payments.update])` 동시 갱신. 토스 실패 시 500 응답 + DB 변경 0(트랜잭션 밖이라 자동 롤백). | 수정 |

🔧 핵심 분기 로직:
```
A. 무료 (payment_id=null OR final_amount=0)
   → court_bookings UPDATE status=cancelled
   → 응답 { booking, refund: null }

B. 유료 ratio=0 (당일 + 본인 취소)
   → 토스 호출 X, court_bookings UPDATE만
   → 응답 { booking, refund: { amount:0, ratio:0, label:"당일", days_before } }

C. 유료 ratio>0
   → 토스 POST /v1/payments/{toss_payment_key}/cancel
      Body: { cancelReason, cancelAmount: refund.amount }
      Auth: Basic base64(SECRET_KEY:)
   → 성공 시 prisma.$transaction([
       court_bookings.update(status=cancelled, cancelled_at, cancellation_reason, refunded_at),
       payments.update(status=partial_refunded|refunded, refund_amount, refund_reason, refund_status="completed", refunded_at, updated_at)
     ])
   → 실패 시 500 TOSS_CANCEL_FAILED (DB 변경 0)
   → 응답 { booking, refund: { amount, ratio, label, days_before, payment_status } }
```

🛡 운영자 취소 정책 (사용자 결정 — PM 명세):
- `result.isManager === true`이면 ratio=1.0 강제(전액 환불)
- 사유: 운영 사정으로 인한 강제 취소이므로 사용자 보호. 본인 잘못이 아니므로 D-3 정책 무시.
- 코드: `refund = { ratio: 1.0, amount: paidAmount, daysBefore: refund.daysBefore, label: "D-3 이전" }`로 덮어쓰기.

🛡 보존 항목 (Phase A 100% 유지):
- `getWebSession` 인증(401 UNAUTHORIZED)
- BigInt 변환 + ID 검증(400)
- `CancelSchema` Zod 검증(reason ≤200자, 옵셔널)
- `loadBookingWithPermission` — booking 조회 + isOwner/isManager 분기 + 404/403
- `isCourtManager` 운영자 권한 검사
- 기존 ALREADY_TERMINATED 가드(cancelled/refunded/completed 상태)
- `apiSuccess`/`apiError` 응답 헬퍼(snake_case 자동 변환)
- GET 핸들러 + findBooking 함수 + import 구조

🛡 신규 가드:
- **ALREADY_STARTED (409)**: `now.getTime() >= booking.start_at.getTime()` — 시작 시각이 지난 예약은 취소·환불 모두 의미 없음. 운영자가 별도 "완료 처리" 흐름으로 분리 필요.
- **PAYMENT_NOT_FOUND (500)**: payment_id가 있는데 payments 레코드가 없으면 데이터 정합성 오류.
- **PAYMENT_ALREADY_REFUNDED (400)**: payment.status가 이미 refunded/partial_refunded/cancelled면 재환불 차단.

📐 payments.status 값 결정:
- `refund.amount === paidAmount` (전액 환불) → `"refunded"`
- `refund.amount < paidAmount` (부분 환불 — 50%) → `"partial_refunded"`
- 기존 `"paid"` 외 신규 값 `"partial_refunded"`만 추가됨. admin 조회 코드 영향 검토 필요(reviewer 항목).

📐 dev 환경 fallback:
- `process.env.TOSS_SECRET_KEY` 미설정 OR `payment.toss_payment_key` 미존재 시 토스 호출 skip → DB 트랜잭션만 실행
- 기존 `/api/web/payments/[id]/refund` 라우트와 동일 패턴(L62~88) — 로컬 개발/테스트 편의
- 운영 환경에서는 secretKey가 반드시 있고, B-3 confirm에서 toss_payment_key 채워지므로 정상 토스 호출 흐름

💡 tester 참고:
- 테스트 방법:
  1. **무료 예약 취소**: Phase A 무료 코트(`final_amount=0`) DELETE → 응답 `{ booking.status:"cancelled", refund: null }` (Phase A 회귀 보장)
  2. **유료 D-3 이전**: 시작 5일 전 confirmed 유료 예약(`final_amount=10000`) 본인 DELETE → 토스 cancel(amount=10000) → 응답 `refund: { amount:10000, ratio:1.0, label:"D-3 이전", payment_status:"refunded" }`. payments.status="refunded", refund_amount=10000, refunded_at NOT NULL 확인.
  3. **유료 D-2 이전**: 시작 2일 전 본인 DELETE → 토스 cancel(amount=5000) → 응답 `refund: { amount:5000, ratio:0.5, label:"D-2 ~ D-1", payment_status:"partial_refunded" }`. payments.status="partial_refunded" 확인.
  4. **유료 당일 본인**: 시작 당일(daysBefore=0) 본인 DELETE → 토스 호출 X → 응답 `refund: { amount:0, ratio:0, label:"당일" }`. payments.status는 변경 없음(여전히 paid). court_bookings만 cancelled.
  5. **유료 당일 운영자**: 시작 당일 운영자 DELETE → ratio=1.0 강제 → 토스 cancel(전액) → 응답 `refund: { amount:10000, ratio:1.0, label:"D-3 이전", payment_status:"refunded" }` (운영자 보호 정책 검증 핵심).
  6. **시작 후 취소 시도**: 시작 시각 이후 DELETE → 409 ALREADY_STARTED.
  7. **이중 취소**: 이미 cancelled된 예약 재DELETE → 400 ALREADY_TERMINATED (기존 가드 회귀).
  8. **토스 실패 시뮬**: TOSS_SECRET_KEY 잘못된 값 + 유료 ratio>0 → 500 TOSS_CANCEL_FAILED. court_bookings/payments 모두 변경 0 확인.
  9. **권한**: 다른 사용자 예약 DELETE → 403 FORBIDDEN. 비로그인 → 401.
- 정상 동작:
  - 토스 cancel 응답 ok → DB 트랜잭션 양쪽 갱신 일관성
  - 무료/당일0%는 토스 호출 0 (안전)
  - 부분 환불 시 payments.status="partial_refunded" + refund_amount 명시
  - 운영자 취소는 항상 100% 환불 (label="D-3 이전" 표시)
- 주의할 입력:
  - `final_amount` Decimal → `Number()` 변환 필수 (이미 처리)
  - 토스 SECRET_KEY 미설정 환경에서는 dev fallback으로 DB만 갱신됨 → 운영 배포 전 환경변수 점검
  - payments.toss_payment_key가 NULL인 레거시 데이터(B-3 콜백 이전 데이터) → dev fallback 진입. 운영에선 발생 안 해야 정상
  - 50% 환불 시 odd 금액 12345 → Math.floor → 6172 (refund-policy 유틸 절단 규칙 그대로)

⚠️ reviewer 참고:
- **트랜잭션 외부 토스 호출 결정**: `prisma.$transaction`은 외부 I/O(fetch)를 포함하면 안 된다(connection 점유 위험). 그래서 토스 호출은 트랜잭션 밖에 두고, **성공 응답 받은 후에만** DB 트랜잭션 시작. 토스 실패 시 DB는 0 변경이라 정합성 안전.
- **반대 위험 — 토스는 성공했는데 DB 트랜잭션이 실패**: 이론상 가능. 트랜잭션이 BigInt/connection 등으로 실패하면 토스 환불은 됐는데 DB는 그대로. 사용자가 다시 DELETE 시도하면 PAYMENT_ALREADY_REFUNDED 가드가 동작하지 않음. 운영 모니터링 필요(현재 보상 호출은 미구현 — Phase B-9 검증 또는 운영 reconciliation cron으로 분리). 기존 `/payments/confirm/booking`도 동일 패턴이라 일관성 우선.
- **payment_status="partial_refunded" 신규 값**: admin 결제 조회 페이지에 status 필터가 있는지 확인 필요. 기존 코드는 paid/refunded/cancelled만 가정할 수 있음. 별도 grep로 검증 권장.
- **운영자 취소 100% 강제**: PM 명세 그대로. 사용자 결정. 운영자가 코트 점검·정전·일정 변경 등으로 강제 취소 시 사용자 보호. 운영자 부담 100%(플랫폼 수수료도 함께 환불됨 — Phase C 정산 시 운영자 측 차감 처리 필요).
- **refund-policy 재사용 안전성**: B-1에서 KST 자정 기준으로 검증된 유틸 그대로 호출. 운영자 분기에서는 `refund.daysBefore`만 정보용으로 유지하고 ratio/amount/label만 덮어씀.
- **GET 핸들러 0 변경**: GET 응답에 환불 정보 미포함. 클라가 취소 모달에서 환불 예상 금액 표시하려면 별도 GET 응답 확장 또는 클라 측에서 `calcRefundAmount` 동일 룰 호출 필요. Phase B-5(UI) 결정 영역.
- **`refund.amount === paidAmount` 비교**: Math.floor 절단 후 비교라 D-3 이전(ratio=1.0) 시 항상 동일 → "refunded". D-2/D-1(ratio=0.5)에서 paidAmount가 짝수면 정확히 절반, 홀수면 절단되어 amount<paidAmount → "partial_refunded".
- **Phase A 회귀 보장**: 무료 분기는 PG 호출 0 + payments 미참조 + 응답 형식 보존(`refund: null` 신규 키 추가, 기존 `booking` 키 호환). Phase A 클라이언트 영향 0.

🔗 다음 작업 (Phase B-9 검증):
- 무료/유료/실패/만료/환불 5시나리오 통합 테스트 (tester)
- 운영자 100% 환불 정책 별도 시나리오 추가
- payments.status="partial_refunded" 값에 대한 admin 결제 페이지 영향 검토 (reviewer)

✅ tsc --noEmit: PASS (exit 0)
🚫 미푸시 / 미커밋 (PM 처리 대기)

---

### 구현 기록 — 코트 대관 Phase B reviewer 후속 4건 (2026-04-27)

📝 구현한 기능: reviewer 권장 1건 + Minor 3건 일괄 반영. 동작 변경 없음 — 라벨/안내문/미사용 쿼리 정정.

| 파일 경로 | 변경 내용 | 신규/수정 |
|----------|----------|----------|
| `src/app/(admin)/admin/payments/admin-payments-content.tsx` | STATUS_LABEL에 `partial_refunded:"부분 환불"` + STATUS_COLOR에 동일 키 info 톤(refunded와 동일 클래스) 추가. 한 줄씩만 추가, 기존 키 보존 | 수정 |
| `src/app/(web)/courts/[id]/booking/_booking-client.tsx` | (1) 환불 정책 안내문 "시작 24h 전 100% / 12h 전 50% / 그 외 0%" → "3일 전 100% / 1~2일 전 50% / 당일 0%" (refund-policy.ts D-3/D-2~D-1/당일 정책과 정렬) (2) successUrl에서 `?bookingId=...` query 제거 — B-3 confirm/booking 라우트는 orderId(`BOOKING-{bookingId}-...`)를 파싱해 bookingId를 얻으므로 query 미사용. failUrl은 payment-fail 페이지가 query를 사용하므로 유지 | 수정 |
| `src/app/(web)/courts/[id]/booking/payment-fail/page.tsx` | "예약은 자동으로 취소되었습니다" → "예약은 자동으로 취소 처리됩니다" 미래형. B-4 API 응답 도착 전 단정 표현 부적절 — 안내 일관성 | 수정 |

💡 tester 참고:
- 테스트 방법:
  1. **admin/payments 라벨**: payments 테이블에 `status='partial_refunded'` 레코드 1건 생성 → `/admin/payments` 진입 → 상태 칼럼이 "부분 환불"로 표시(영문 폴백 사라짐).
  2. **환불 정책 문구**: `/courts/[id]/booking?...` 진입 후 isPaid=true 상태(유료 코트) 사이드 우측 안내문이 "3일 전 100% / 1~2일 전 50% / 당일 0%"로 표시.
  3. **successUrl**: 토스 결제창에서 결제 완료 → 실제 호출 URL이 `/api/web/payments/confirm/booking?paymentKey=...&orderId=BOOKING-{bookingId}-{userId}-{ts}&amount=...` 형식. `&bookingId=...` 추가 query는 더이상 안 붙음. confirm/booking은 orderId만으로 정상 동작.
  4. **failUrl**: 결제창 X 클릭 → `/courts/[id]/booking/payment-fail?bookingId=...` 페이지에 "예약은 자동으로 취소 처리됩니다" 문구 표시(과거형 X).
- 정상 동작:
  - admin/payments: partial_refunded 라벨이 한국어로 표시되며, refunded와 동일한 info 톤 색상 유지
  - 결제 흐름: B-3 confirm/booking이 successUrl bookingId query 없이도 정상 처리(orderId만으로 booking 식별)
  - 안내문 텍스트가 refund-policy.ts 실제 정책과 일치
- 주의할 입력:
  - successUrl 변경은 B-3 라우트 query 파싱 로직과 결합 — confirm/booking 코드를 함께 확인 필요(이미 orderId 기반 파싱이라 회귀 0)
  - admin/payments status 탭 필터(라인 61~63): partial_refunded 탭 노출 여부는 별도 결정 — 본 작업에서는 라벨 매핑만 추가, 탭은 PM 결정 영역

⚠️ reviewer 참고:
- 동작 변경 0 — TOSS SDK 인자(method/amount/orderId/orderName/successUrl/failUrl/customerEmail/customerName) 8개 그대로 유지, 라우트 핸들러/Prisma/Zod 모두 0 변경
- successUrl 변경은 reviewer 명시 권장 사항. confirm/booking 라우트가 orderId 의존이라 안전성 검증됨(reviewer Phase B 통과 결과 #2 orderId 위조 방어 게이트 그대로 유지)
- partial_refunded 컬러 결정: `STATUS_COLOR.refunded`와 동일 클래스(text/bg-info) 사용 — refunded/partial_refunded 시각적 일관성 확보. 추후 운영자 피드백에 따라 분리 가능

✅ tsc --noEmit: PASS (exit 0)
🚫 미푸시 / 미커밋 (PM 처리 대기)

---

### 리뷰 결과 (reviewer) — 2026-04-27 / Phase B 결제 통합 8단계

📊 **종합 판정: 통과 (수정 권장 1건 — 배포 전 보강 추천)**

핵심 보안 게이트(4중 금액 검증, orderId 위변조 방어, race condition 가드)는 모두 정상 작동. 데이터 일관성 및 Phase A 회귀도 안전. admin/payments 페이지의 partial_refunded 라벨 누락만 배포 후 즉시 보강 권장(차단 사유 아님).

✅ **OK (확인 완료)**:
1. **금액 변조 방어 (4중 게이트)** — `confirm/booking` 79~80, 134~138, 173~177줄. amount<=0/NaN 거부 → DB.final_amount === query.amount → 토스 응답 totalAmount === amount. 변조 query 모든 경우 차단됨.
2. **orderId 위조 방어** — `confirm/booking` 84~96줄. `parts.length !== 4 || parts[0] !== "BOOKING"` + BigInt 변환 try/catch. + booking.user_id === ctx.userId === orderUserId(122~126) 3중 일치. 다른 사용자 booking 강탈 불가.
3. **권한 가드** — B-4(payment-cancel) 본인만 허용(70~72), B-7(DELETE bookings) 본인 OR 운영자(`isCourtManager` 체크 47~51). 분리 정확.
4. **race condition** — confirm/booking 208~219줄 `updateMany where: { status: "pending", payment_id: null }` + `count !== 1` 트랜잭션 throw. payment-cancel 90~107줄 동일 패턴. 동시 confirm/cancel 콜백 안전.
5. **CRON_SECRET** — expire-pending-bookings 36~39줄. `process.env.CRON_SECRET` 설정 시만 검증, 미설정 시 우회(개발 편의). Vercel 환경에서 운영 시 SECRET 설정만 확실히 하면 OK. 다른 cron 라우트와 동일 패턴(referee-healthcheck 등).
6. **트랜잭션 경계** — 토스 fetch는 항상 `prisma.$transaction` 외부. confirm/booking은 토스 성공 후 트랜잭션 진입 → DB 실패 시 `tossCancelCompensate()` 보상 호출(42~64줄). DELETE/bookings는 토스 cancel 성공 → 트랜잭션 진입(355~386). 둘 다 connection pool 점유 위험 0.
7. **payment_id FK 무결성** — court_bookings.payment_id는 confirm/booking 트랜잭션에서 `payments INSERT` 의 select id 결과를 즉시 사용(212~214). FK 외래키 위배 시점 없음.
8. **Phase A 회귀** — bookings POST 222~234줄 `isPaid = amount > 0` 분기. fee=0/NULL 코트는 `status="confirmed", final_amount=0` 즉시 확정. DELETE/bookings 183~210줄 `payment_id===null || finalAmount===0` 무료 분기에서 토스/payments 미참조. Phase A 클라이언트 영향 0.
9. **KST 자정 계산** — refund-policy 56~61줄 `+9h → setUTCHours(0,0,0,0)` 패턴. KST DST 미적용이라 안전. tournaments 도메인의 동일 패턴과 일치(architecture 검증된 방식).
10. **calcRefundAmount Math.floor** — 146줄 `Math.floor(safePaid * ratio)`. 사업자 유리 절단. 부분환불 시 `refund.amount < paidAmount` 분기 → `partial_refunded`로 정확 분류.
11. **TOSS_SECRET_KEY env 누락** — confirm/booking 141~144줄에서 사전 검증, redirect로 fail. DELETE/bookings 302줄 `canCallToss` 가드로 dev fallback 처리. 운영 누락 시 데이터 깨짐 없음.
12. **payable_type="CourtBooking"** — admin/payments page.tsx 33줄 `payableType: p.payable_type` 그대로 직렬화. 별도 분기 없음(단순 라벨 표시) → "CourtBooking" 값이 문자열로 그대로 노출됨. admin-payments-content는 status 필터만 사용하고 payable_type 필터/라벨 매핑 없음 → 충돌 없음.

🟡 **권장 수정 (배포 후 즉시 — 차단 아님)**:

1. **admin/payments status 라벨에 `partial_refunded` 누락**
   - 위치: `src/app/(admin)/admin/payments/admin-payments-content.tsx:27~38`
   - 현황: `STATUS_LABEL` / `STATUS_COLOR` 맵에 `paid`/`cancelled`/`refunded`만 있음. `partial_refunded` 값이 들어오면 `STATUS_LABEL[p.status] ?? p.status` 폴백으로 영문 그대로 노출됨(122~125줄).
   - 영향: 50% 환불 케이스 발생 시 admin이 "partial_refunded" 영문 라벨을 보게 됨. 동작은 정상이나 운영자 UX 저하.
   - 권장: `STATUS_LABEL.partial_refunded = "부분환불"` + `STATUS_COLOR.partial_refunded = STATUS_COLOR.refunded` 추가. status 탭(61~63줄)에도 노출 여부 결정.

🟢 **Minor (백로그)**:

1. **booking-client UI 안내 문구와 실제 정책 불일치**
   - 위치: `_booking-client.tsx:867`
   - 현황: "환불 정책: 시작 24h 전 100% / 12h 전 50% / 그 외 0%" 텍스트가 시간 단위 표기. 실제 `refund-policy.ts`는 KST 달력일 기준(D-3 이전 100% / D-2~D-1 50% / 당일 0%)
   - 권장: "시작 3일 전 100% / 1~2일 전 50% / 당일 0%" 로 표시. 사용자 혼란 방지.

2. **booking-client `successUrl` 의 bookingId 쿼리 사용처 없음**
   - 위치: `_booking-client.tsx:285`
   - 현황: `successUrl=/api/web/payments/confirm/booking?bookingId=${data.booking.id}` 로 보내지만, confirm/booking 라우트는 토스가 추가한 `paymentKey/orderId/amount`만 사용하고 `bookingId` 쿼리는 무시함(orderId에서 파싱).
   - 권장: 의도적 fallback이면 주석 추가, 아니면 제거(코드 가독성).

3. **payment-fail 페이지의 안내문 단정**
   - 위치: `payment-fail/page.tsx:176`
   - 현황: "예약은 자동으로 취소되었습니다" 단정. 그러나 fetch 실패 시 cron(15분 뒤)이 처리하므로 즉시 cancelled 보장이 아님.
   - 권장: "자동으로 취소됩니다" 또는 "취소 처리됩니다" — 현재로도 OK.

4. **DELETE/bookings 토스 응답 검증 미구현**
   - 위치: `bookings/[id]/route.ts:340~341` 주석
   - 현황: 토스 cancel 응답의 `cancels[].cancelAmount` 값 일치 검증 미구현. 운영 안정화 후 추가 예정으로 명시되어 있음.
   - 권장: Phase B-9 후속으로 추가. 현재 ok 신뢰 충분.

5. **expire-pending-bookings 알림 없음**
   - 위치: `cron/expire-pending-bookings/route.ts`
   - 현황: 만료 시 사용자 메일 알림 없음. 결제 미완료 사용자가 자기 예약이 사라진 줄 모름.
   - 권장: 백로그(Phase D 정도). 현재는 booking_status를 /profile/bookings에서 직접 확인 가능.

6. **운영자 취소 시 100% 환불의 비대칭성**
   - 위치: `bookings/[id]/route.ts:250~257`
   - 현황: 운영자 취소 시 `ratio=1.0` 강제하지만 `daysBefore`는 정보용으로 유지하면서 `label="D-3 이전"`으로 덮어씀. UI에서 "D-3 이전 환불" 라벨이 표시되는데 실제로는 당일이었을 수도 있음 → 사용자 혼란 가능성.
   - 권장: `label="운영자 취소 (전액 환불)"` 같은 명확한 라벨 신설. RefundLabel 타입 확장 필요. 백로그.

📌 **운영 환경 최종 체크리스트**:
- ✅ 운영 DB schema 변경 0건 (Phase A 컬럼만 사용 — court_bookings.payment_id, payments.payable_type)
- ✅ TOSS_SECRET_KEY / NEXT_PUBLIC_TOSS_CLIENT_KEY env 누락 시 graceful fallback
- ✅ CRON_SECRET 누락 시 우회 (기존 cron과 일관)
- ⚠️ 배포 후 admin/payments 페이지의 `partial_refunded` 라벨 추가 권장 (위 권장 수정 1번)

📋 **수정 요청 (developer 작업)**:
| # | 우선순위 | 파일 | 수정 내용 |
|---|----------|------|----------|
| 1 | 권장 | `src/app/(admin)/admin/payments/admin-payments-content.tsx` | `STATUS_LABEL.partial_refunded = "부분환불"` + `STATUS_COLOR.partial_refunded` 추가 |
| 2 | Minor | `_booking-client.tsx:867` | 환불 정책 안내문 시간단위 → 일단위로 정정 |
| 3 | Minor | `_booking-client.tsx:285` | successUrl의 미사용 bookingId 쿼리 제거 또는 주석 |

