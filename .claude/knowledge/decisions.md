# 기술 결정 이력
<!-- 담당: planner-architect | 최대 30항목 -->
<!-- "왜 A 대신 B를 선택했는지" 기술 결정의 배경과 이유를 기록 -->

### [2026-03-29] GPS 밀집도 히트맵: Canvas 오버레이 + simpleheat 방식
- **분류**: decision
- **발견자**: planner-architect
- **결정**: (1) 카카오맵에는 공식 히트맵 레이어가 없으므로 CustomOverlay + canvas 방식 채택. (2) simpleheat.js(3KB) 경량 라이브러리 또는 직접 canvas 2D gradient 구현. (3) 데이터는 court_sessions를 시간대별(오전/오후/저녁) groupBy하여 코트별 세션 수를 weight로 사용. (4) 별도 DB 테이블 불필요 -- 기존 court_sessions + court_infos.lat/lng로 충분. (5) ISR 10분 캐시로 서버 부하 최소화.
- **이유**: (1) 카카오맵 히트맵 미지원 확인 (네이버맵은 지원하나 카카오맵으로 이미 통일). (2) Google Maps처럼 HeatmapLayer가 없으므로 canvas 오버레이가 유일한 방법. (3) simpleheat는 3KB로 번들 영향 최소. (4) 대안으로 원형 오버레이(크기=세션수)도 가능하지만 히트맵이 시각적으로 더 직관적.
- **대안 기각**: (A) 네이버맵 전환 -- 기존 카카오맵 코드 전체 교체 비용 과다. (B) Mapbox/Leaflet 전환 -- 동일한 이유. (C) 코트별 단순 숫자 뱃지 -- 밀집도 표현력 부족.
- **참조횟수**: 0

### [2026-03-29] 코트 3x3 이벤트: 기존 tournament과 완전 분리
- **분류**: decision
- **발견자**: planner-architect
- **결정**: (1) court_events + court_event_teams + court_event_players + court_event_matches 4테이블 신설. (2) 기존 Tournament 모델과 완전 분리. (3) 대진표는 4~8팀 단순 single_elimination/round_robin만 지원 (bracket-builder 재사용 가능하나 간소 버전). (4) 코트 상세 페이지에 "이 코트의 3x3 이벤트" 섹션 추가.
- **이유**: (1) Tournament은 UUID PK + series + 서브도메인 사이트 + 디비전 + 복잡한 팀 등록 워크플로를 가진 공식 대회 시스템. 3x3 이벤트는 "오늘 저녁 코트에서 4팀 미니대회" 수준의 가벼운 이벤트. (2) Tournament에 is_3x3 플래그를 추가하면 기존 tournament API/UI 전체에 분기 로직이 침투. (3) 3x3 이벤트는 court_infos에 종속(코트가 주체), tournament은 독립적(어느 코트에서든 개최 가능).
- **대안 기각**: (A) Tournament에 type 필드 추가 -- 기존 17개 파일에 분기 필요, 위험. (B) pickup_games 확장 -- 픽업게임은 개인 참가, 3x3은 팀 참가로 구조가 다름.
- **참조횟수**: 0

### [2026-03-29] 코트 앰배서더: court_ambassadors 테이블 + 위키 바이패스
- **분류**: decision
- **발견자**: planner-architect
- **결정**: (1) court_ambassadors 테이블 신설 (user_id, court_info_id, status). (2) 앰배서더는 해당 코트의 court_edit_suggestions를 직접 승인 가능 (관리자 승인 바이패스). (3) 앰배서더 자신의 수정은 승인 없이 직접 반영. (4) 신청 → 관리자 승인 워크플로. (5) 앰배서더 뱃지 + 활동 시 XP 보너스.
- **이유**: (1) 672개 코트를 관리자 혼자 관리할 수 없음 -- 코트별 "동네 관리자"가 필요. (2) 위키 시스템의 승인 병목 해소 -- 앰배서더가 있는 코트는 즉시 정보 갱신 가능. (3) 앰배서더 뱃지는 커뮤니티 기여 인정 + 게이미피케이션 연계.
- **대안 기각**: (A) 누구나 직접 수정 (승인 없음) -- 악의적 수정 위험. (B) 등급 기반 자동 승인 (Lv5+) -- 레벨이 높아도 해당 코트에 대한 지식이 없을 수 있음.
- **참조횟수**: 0

### [2026-03-29] 주간 운동 리포트: DB 없이 court_sessions 실시간 집계 + Vercel Cron
- **분류**: decision
- **발견자**: planner-architect
- **결정**: (1) 별도 weekly_reports 테이블 불필요 -- court_sessions에서 지난주 범위로 집계. (2) /profile/weekly-report 페이지에서 클라이언트가 GET 요청 시 실시간 계산. (3) Web Push는 Vercel Cron(매주 월 09:00 KST)으로 발송하되, 1차로는 notifications 테이블 INSERT만 (앱 내 알림). (4) 진짜 Web Push는 Push API 구독 관리가 필요하므로 2차 확장으로 분리.
- **이유**: (1) 주간 데이터를 별도 저장하면 court_sessions과 이중 관리 -- 집계 쿼리가 충분히 빠름 (인덱스 있음). (2) Vercel Cron은 vercel.json에 1줄 추가로 설정 가능, 별도 인프라 불필요. (3) Web Push 구독 관리(PushSubscription 저장)는 별도 테이블이 필요하므로 1차에서는 앱 내 알림만.
- **대안 기각**: (A) weekly_reports 캐시 테이블 -- 조회 빈도가 주 1회 수준이라 캐시 효용 낮음. (B) 이메일 발송 -- 이메일 인프라(SendGrid 등) 추가 비용+설정 필요.
- **참조횟수**: 0

### [2026-03-29] 코트 유저 위키: court_edit_suggestions 1테이블 + changes JSON diff 방식
- **분류**: decision
- **발견자**: planner-architect
- **결정**: (1) court_edit_suggestions 테이블 1개 신설 — 제안+이력을 한 테이블에서 관리. (2) changes 필드는 JSON으로 `{"필드명": {"old": 이전값, "new": 새값}}` 형태 — 여러 필드를 한 번에 제안 가능 + diff 표시 용이. (3) 상태 3종: pending→approved/rejected. (4) 승인 시 트랜잭션으로 court_infos 업데이트 + XP 10 지급. (5) 같은 코트에 같은 유저의 pending 제안 있으면 중복 차단. (6) court_reports(상태 제보)와 완전 분리 — reports는 물리적 문제 신고(119 신고), suggestions는 정보 보정(위키 편집).
- **이유**: (1) 필드별 테이블(court_field_edits)은 "바닥재+조명+화장실"을 동시에 제안할 때 3행이 생겨 관리 복잡. JSON이면 1행. (2) old/new 구조로 관리자가 "null→우레탄" 같은 변경을 한눈에 볼 수 있어 승인 판단 용이. (3) court_reports의 report_type은 "hoop_broken" 같은 고정 유형인 반면, edit_suggestions는 court_infos의 14개 필드 중 아무거나 수정 가능해야 해서 구조가 다름.
- **대안 기각**: (A) court_reports 테이블 재활용 — 목적이 다름(신고 vs 보정), report_type 필드가 맞지 않음, 상태 워크플로도 다름(active/resolved vs pending/approved). (B) 필드별 별도 행 — 한 번에 5개 필드 수정 시 5행 생성, 승인도 5번 해야 함, UX 나쁨. (C) 자동 승인 — 초기에는 관리자 검수가 필요, 악의적 수정 방지. 향후 신뢰 기여자 자동 승인은 확장 가능.
- **참조횟수**: 0

### [2026-03-29] 픽업게임 모집: 별도 pickup_games 테이블 신설 (기존 games와 분리)
- **분류**: decision
- **발견자**: planner-architect
- **결정**: (1) pickup_games + pickup_participants 2개 테이블을 신규 생성하여 court_infos와 직접 연결. (2) 기존 games 모델(game_type=0)을 재활용하지 않음. (3) 참가 방식은 "즉시 확정"(confirmed) — games의 "신청→승인" 워크플로와 다름. (4) 상태 5종: recruiting→full→in_progress→completed→cancelled. (5) cron 없이 조회 시 자동 상태 전이 (날짜 지나면 completed). (6) courts API에 pickupCount 서브쿼리 추가하여 "픽업게임" pill 필터 구현.
- **이유**: (1) games.court_id는 courts(레거시 테이블) 참조 — court_infos와 FK 연결 불가. (2) game_applications의 status=0→1→2 승인 워크플로는 픽업게임의 "버튼 누르면 바로 참가" UX와 맞지 않음. (3) games는 팀매치/대회경기와 혼재되어 있어 코트 시스템 내에서 독립적 진화가 어려움. (4) 픽업게임은 가볍고 빈번(하루 수십 건)한 반면 games는 공식적이고 드문 이벤트 — 라이프사이클이 다름.
- **대안 기각**: (A) games 모델에 game_type=0 활용 — FK 충돌(courts vs court_infos) + 참가 워크플로 불일치. (B) games에 court_info_id 필드 추가 — 기존 games/game_applications 코드 전체 수정 필요, 리스크 대비 이익 적음.
- **참조횟수**: 0

### [2026-03-29] 코트 데이터 품질 정리: 불확실한 필드 null 초기화 + 유저 위키 시스템
- **분류**: decision
- **발견자**: planner-architect
- **결정**: (1) 672개 코트 중 verified=false인 658개의 is_free, surface_type, hoops_count를 null로 초기화. 스크립트 기본값("아스팔트", "마루", hoops_count=2, is_free=true/false)은 실제 확인된 정보가 아니라 추정값이므로 "모름"으로 표시하는 것이 정직함. (2) is_free 필드를 Boolean에서 Boolean?(nullable)로 변경하여 "무료/유료/알 수 없음" 3상태 표현. (3) UI에서 null인 필드는 "미확인" 회색 뱃지로 표시하여 사용자에게 정보 부재를 솔직히 알림. (4) court_edit_suggestions 테이블 신설로 유저가 위키처럼 코트 정보를 수정 제안할 수 있게 함. 관리자 승인 후 반영.
- **이유**: (1) "아스팔트 바닥, 무료"로 표시된 코트를 찾아갔더니 실내 체육관이거나 유료인 경우 사용자 신뢰 추락. 거짓 정보보다 "미확인"이 나음. (2) 실내 체육관 105개가 "무료"로 표시되어 있는데 실내 체육관은 대부분 유료 — 명백한 데이터 오류. (3) 유저 위키 방식은 플랫폼 운영자의 전수 조사 없이도 데이터 품질을 점진적으로 개선할 수 있는 확장 가능한 방법.
- **대안 기각**: (A) 전수 수동 조사 — 672개를 일일이 카카오맵에서 확인하는 것은 비현실적. (B) 불확실한 코트 삭제 — 위치+이름은 정확하므로 코트 자체를 삭제하면 커버리지 손실. (C) Boolean 유지 + 별도 confidence 필드 — 필드 수 증가, 복잡도 대비 효용 낮음.
- **데이터 출처별 신뢰 등급**: manual_curation(14개)=높음, kakao_search(131개)=위치만 높음/상세 낮음, google(527개)=위치만 높음/상세 낮음.
- **참조횟수**: 0

### [2026-03-29] 게이미피케이션 시스템: User 직접 확장 + 뱃지 별도 테이블
- **분류**: decision
- **발견자**: planner-architect
- **결정**: (1) XP/레벨/스트릭 3개 필드를 User 테이블에 직접 추가. (2) 뱃지는 user_badges 별도 테이블로 분리 (1:N 관계). (3) XP 적립은 별도 API 없이 기존 체크아웃/리뷰/제보 API 내부에서 addXP() 호출. (4) 도장깨기 카운트는 court_sessions의 DISTINCT court_id로 실시간 계산 (별도 캐시 컬럼 불필요). (5) 스트릭은 한국시간(KST) 기준 날짜 비교.
- **이유**: (1) User에 4필드 추가는 별도 user_stats 테이블 대비 JOIN 없이 프로필 조회 가능 — 프로필 페이지가 useSWR로 자주 호출되므로 쿼리 단순화 중요. (2) 뱃지는 한 유저가 N개 보유 + 종류 확장 가능하므로 별도 테이블이 적합. (3) XP 적립 API를 별도로 만들면 클라이언트가 호출 안 하는 실수 가능 — 서버사이드에서 강제 호출이 안전. (4) 도장깨기는 672개 코트 중 유저당 방문 코트가 많아야 수십 개 — DISTINCT count가 충분히 빠름.
- **대안 기각**: (A) user_gamification 별도 테이블 — 4필드에 불과하여 테이블 오버헤드. (B) xp_logs 이력 테이블 — 현 단계에서 이력 추적 불필요, court_sessions/reviews/reports가 이미 이력 역할. (C) 프론트에서 XP API 호출 — 호출 누락 위험.
- **참조횟수**: 0

### [2026-03-29] 코트 리뷰 5항목 세부 별점 + 사진 업로드 방식
- **분류**: decision
- **발견자**: planner-architect
- **결정**: (1) 기존 court_reviews 테이블에 5개 세부 별점 필드를 nullable Int로 추가 (기존 데이터 보존). rating 필드는 5항목 평균으로 자동 계산하여 호환성 유지. (2) 사진 업로드는 서버 proxy 방식: 클라이언트 → /api/web/upload/court-photo → Supabase Storage. photos 필드는 Json 배열. (3) 중복 리뷰 방지를 @@unique([court_info_id, user_id])로 DB 레벨에서 강제. (4) 상태 제보(court_reports)는 별도 테이블 신규 생성. 리뷰와 분리하는 이유: 리뷰는 평가(별점+감상), 제보는 문제 신고(유형+긴급도) — 목적과 수명주기가 다름. 제보는 해결되면 비활성화, 리뷰는 영구 보존.
- **이유**: (1) nullable 추가는 기존 데이터에 영향 없는 가장 안전한 확장 방법. (2) 클라이언트 직접 Supabase 업로드는 NEXT_PUBLIC_ 키 노출 필요 — 보안 규칙 위반. (3) 리뷰+제보 합치면 UI가 복잡해지고 평균 별점 계산에 제보가 섞임.
- **대안 기각**: (A) 별도 court_review_ratings 테이블 — 조인 비용 + 복잡도 증가, 필드 5개면 컬럼 추가가 단순. (B) rating을 Json으로 변경 — 집계 쿼리 불가.
- **참조횟수**: 0

### [2026-03-29] 웹(PWA) 백그라운드 위치 기반 자동 체크인 -- 기술 불가 판정
- **분류**: decision
- **발견자**: planner-architect
- **결정**: 웹 PWA에서 백그라운드 자동 체크인은 기술적으로 불가능. QR 코드 원탭 체크인을 1순위 대안으로 채택.
- **이유**: (1) Geolocation API는 Service Worker에서 접근 불가 (W3C 제안만 존재, 구현 없음). (2) 탭/앱이 백그라운드로 가면 위치 추적 즉시 중단 (특히 iOS Safari). (3) Web Geofencing API는 Editor's Draft에서 방치, 브라우저 구현 전무. (4) Web NFC는 Android Chrome만 지원 (iOS Safari 미지원). (5) BLE Beacon은 웹에서 접근 불가.
- **대안 채택 순위**: QR 코드(1순위, 크로스플랫폼 100%) > 포그라운드 근접 감지(2순위, 앱 열려있을 때) > NFC(3순위, Android만) > Flutter 앱(장기, 완전 자동)
- **참조횟수**: 0

### [2026-03-28] BDR-join-v1 대회 생성 기능 MyBDR 이식 방침
- **분류**: decision
- **발견자**: planner-architect
- **결정**: (1) BDR-join-v1의 대회 생성 7가지 기능 영역(기본정보/일정장소/결제/경기장/상세정보/미디어/종별디비전)을 MyBDR의 기존 7탭 위자드에 병합. (2) 신규 추가 필드 6개: organizer, host, sponsors, game_time, game_ball, game_method — DB 마이그레이션 필요. (3) 경기장 검색을 기존 Google Places에서 유지하되, 복수 경기장 지원을 위해 places JSON 배열 필드 추가. (4) 종별/디비전 생성기(DivisionGeneratorModal)를 이식하여 성별+종별+디비전 3단계 자동 생성 지원. (5) 참가신청 시 선수명단 작성 기능은 불필요(MyBDR은 가입 유저+팀 기반). (6) 이전 대회 불러오기(복사) 기능 이식. (7) 포스터 이미지 업로드는 MyBDR의 기존 이미지 인프라 활용.
- **이유**: BDR-join-v1은 실제 대회 운영 경험에서 나온 필드 구성. 특히 game_time/game_ball/game_method는 대회 요강의 핵심 정보인데 MyBDR에 누락. 복수 경기장은 실제 대회에서 2~3개 체육관 동시 운영이 흔함.
- **대안 기각**: BDR-join-v1의 Supabase 직접 연동 방식은 부적합 — MyBDR은 Prisma+PostgreSQL이므로 API 라우트를 통해야 함.
- **참조횟수**: 0

### [2026-03-28] 토스 스타일 UI 전면 개편: TOSS 실험 브랜치 + CSS 변수 기반 전환
- **분류**: decision
- **발견자**: planner-architect
- **결정**: (1) TOSS 브랜치에서 독립 실험. merge 여부는 비교 후 결정. (2) CSS 변수(@theme) 값만 교체하여 전체 색상/라운딩/그림자 일괄 전환. (3) 레이아웃을 데스크탑 사이드바에서 모바일 퍼스트 하단 네비로 전환. (4) API/데이터 패칭 절대 변경 금지, UI 렌더링만 교체. (5) 기존 BDR 컴포넌트는 보존하고, 토스 전용 컴포넌트를 src/components/toss/에 신규 생성. (6) Primary 색상: BDR Red -> 토스 블루(#3182F6). (7) 기본 테마: 다크 -> 라이트.
- **이유**: (1) 실험이므로 본 코드에 영향 주면 안 됨. (2) 기존 CSS 변수 시스템 덕분에 globals.css만 바꾸면 하위 컴포넌트 자동 반영 -- 이전 작업에서 하드코딩 색상을 전부 CSS 변수로 전환해놨기 때문에 가능. (3) 토스의 핵심 UX는 "모바일 앱 같은 느낌"이므로 하단 네비가 필수. (4) Flutter 앱 호환 API를 건드리면 안 됨. (5) 비교 평가를 위해 원본 보존.
- **대안 기각**: (A) 기존 컴포넌트를 직접 수정 -- 롤백이 어려움. (B) 별도 프로젝트로 복사 -- 유지보수 이중화. (C) CSS-in-JS 테마 전환 -- 현재 Tailwind CSS 4 기반이라 CSS 변수 방식이 자연스러움.
- **참조횟수**: 0

### [2026-03-28] 관리자 UI 전체 개편: 요약 테이블 + 상세 패널 + 상태 탭
- **분류**: decision
- **발견자**: planner-architect
- **결정**: admin 13개 페이지 중 8개(유저/토너먼트/경기/팀/코트/커뮤니티/결제/건의사항)에 3가지 패턴 적용: (1) AdminDetailPanel 공통 우측 슬라이드 패널 -- 테이블 행 클릭 시 상세 정보 표시 (유저 모달 패턴을 패널로 확장). (2) AdminStatusTabs 공통 상태 탭 -- 전체/활성/비활성 등 상태별 클라이언트 필터링. (3) 테이블 컬럼 축소 -- 핵심 3~5개만 노출, 나머지는 패널로 이동. 서버+클라이언트 분리 패턴(page.tsx 서버 데이터 패칭 + admin-{name}-content.tsx 클라이언트 UI) 적용.
- **이유**: (1) 사용자 피드백 "한눈에 안 들어옴, 정보량 과다" 반영. (2) 유저 관리의 기존 모달이 잘 작동하므로 이 패턴을 다른 페이지에 확대 적용. (3) 프론트의 FloatingFilterPanel/탭 패턴을 admin에도 도입하여 UX 일관성 확보. (4) 서버 컴포넌트 유지로 prisma 직접 쿼리 보존, API 신규 생성 불필요.
- **대안 기각**: (A) 전체 클라이언트 전환 + /api/admin/* fetch -- API 13개 신규 생성 필요, 과도한 작업량. (B) 공통 AdminTable 추상화 -- 각 테이블 컬럼/기능이 달라 추상화 비용 높음. (C) 모달 대신 별도 상세 페이지 -- 페이지 이동 시 목록 컨텍스트 유실.
- **참조횟수**: 0

### [2026-03-28] 관리자 UI 개선 전략: 공통 패턴 정의 + 점진 통일
- **분류**: decision
- **발견자**: planner-architect
- **결정**: 관리자 9개 페이지를 전면 리디자인하지 않고, (1) 공통 AdminPageHeader 컴포넌트 1개 신규 생성, (2) 테이블 헤더 스타일 통일(bg-surface + border-b), (3) 대시보드 최근 활동 실데이터 연결, (4) 건의사항만 카드->테이블 변환+상태변경 기능 추가의 4가지 핵심 변경만 진행.
- **이유**: (1) users/logs/settings는 이미 완성도가 높아 대규모 변경 불필요. (2) 프론트처럼 2열 레이아웃/시안 기반 리디자인이 아니라, 관리자는 "데이터를 빨리 찾고 조작하는" 것이 목적이므로 심플함이 최우선. (3) 공통 컴포넌트 1개로 9개 페이지의 헤더 일관성을 확보하면 작업량 대비 효과가 큼. (4) 건의사항만 기능이 부족(상태 변경 불가)하므로 기능 추가 포함.
- **대안 기각**: (A) 전면 리디자인 -- 시안 없고 현재도 동작하므로 과투자. (B) 공통 AdminTable 컴포넌트 -- 각 테이블의 컬럼/기능이 달라 추상화 비용이 높음, 스타일만 통일하는 것이 실용적.
- **참조횟수**: 0

### [2026-03-28] 상수 공통화 전략: 로컬 하드코딩 -> lib/constants 중앙화
- **분류**: decision
- **발견자**: planner-architect
- **결정**: 프론트/admin/API 전체 검토 후 6개 영역에서 상수 불일치 발견. (1) 대회 상태/형식 라벨: 3곳(공통/목록/상세)에서 각각 다르게 정의 -> tournament-status.ts 하나로 통일. (2) 유저 역할: admin-users-table.tsx 로컬 ROLE_MAP -> roles.ts MEMBERSHIP_LABELS 재사용. (3) 경기 유형/상태: games 로컬 _constants -> lib/constants/game-status.ts로 이동. (4) 결제/건의/요금제 상수: admin 전용이므로 현재 위치 유지 (프론트 사용 시 이동). (5) API 응답: 5개 API가 NextResponse.json 직접 사용(apiSuccess 우회) -> 점진 전환.
- **이유**: (1) 같은 상태(active)가 "진행중"/"모집중"으로 표시되는 실제 불일치 존재. (2) 공통 상수 1곳 수정으로 전체 반영 가능. (3) 카드 UI에서 약어가 필요한 경우 _SHORT variant 별도 제공. (4) admin 전용 상수는 사용 범위가 1곳이면 이동 불필요(YAGNI). (5) apiSuccess 우회 5곳은 프론트가 이미 해당 형식에 맞춤 코딩되어 즉시 수정 불필요.
- **참조횟수**: 0

### [2026-03-27] 홈 TTFB 코드 레벨 최적화: ISR 살리기 (getWebSession 분리) 선택
- **분류**: decision
- **발견자**: planner-architect
- **결정**: 7가지 방법(SSG/Streaming/Edge/Redis/ISR분리/Accelerate/전용API) 비교 후 "ISR 살리기" 선택. page.tsx에서 getWebSession() 제거하면 cookies() 미호출 -> revalidate=60이 정상 작동 -> Vercel CDN 캐시 히트 시 50-100ms. 로그인 판단과 개인화는 클라이언트로 이동.
- **이유**: (1) 변경 파일 1-2개로 최소 수정 (2) 외부 서비스/비용 없음 (3) 4개 프리페치 중 3.5개가 로그인 무관 (4) ISR이 살면 DB가 인도여도 60초에 1번만 쿼리 (5) Redis/Accelerate는 ISR로 충분한데 과도한 추가 복잡도
- **대안 기각**: SSG(SEO불리+스켈레톤), Edge(Prisma호환성), Redis(ISR로충분), Accelerate(유료+ISR로충분)
- **참조횟수**: 0

### [2026-03-27] 홈 화면 3초 TTFB 근본 원인: DB 리전(인도) + 동적 렌더링 + cold start
- **분류**: decision
- **발견자**: planner-architect
- **결정**: 3초의 근본 원인 3가지 규명. (1) Supabase DB가 ap-south-1(인도 뭄바이)에 위치하여 모든 Prisma 쿼리마다 150-300ms 네트워크 왕복 추가. 홈페이지 6-8개 쿼리 x 200ms = 1.2-1.8초. (2) page.tsx에 revalidate=60이 있지만 getWebSession()이 cookies()를 호출하여 Next.js가 동적 렌더링으로 전환. ISR 캐시가 작동하지 않아 매 요청마다 DB 조회. (3) Vercel 서버리스 cold start 시 Prisma connection pool 초기화 500-800ms 추가.
- **해결 우선순위**: (1) Vercel 함수 리전 도쿄 설정 (즉시, 1줄). (2) Supabase DB 리전 이전 (중기). (3) 비로그인 ISR 분리 (중기). (4) Prisma 글로벌 캐시 (즉시, 1줄).
- **참조횟수**: 0

### [2026-03-27] 성능 병목 2차 심층 분석: Places API 폭포수 + 대회 중복 쿼리
- **분류**: decision
- **발견자**: planner-architect
- **결정**: 이전 최적화(SWR/캐시/폰트/프리페치) 이후에도 느린 원인을 6개 도출. 해결 우선순위: (1) Google Places API 카드별 개별 호출을 batch API로 전환 (2) 대회 상세의 6개 중복 Prisma 쿼리를 탭별 lazy loading으로 전환 (3) listGames() select 누락 수정 (4) prefetchCommunity() content 전체 로드 최적화
- **이유**: (1) 경기 목록 60개 표시 시 place-photo API 60번 동시 호출 = 브라우저 동시 연결 제한(6개)에 걸려 이미지 로딩이 직렬화됨. (2) 대회 상세에서 tournamentMatch 2번, tournamentTeam 3번 중복 조회 + 사용자가 보지 않는 탭 데이터까지 전부 로드. (3) games 40컬럼 전체 반환 vs 필요한 10컬럼. (4) content(수천자) 30건 로드 후 120자만 사용.
- **참조횟수**: 0

### [2026-03-26] 외부 BDR 랭킹: 서버사이드 xlsx proxy + 3탭 구조
- **분류**: decision
- **발견자**: planner-architect
- **결정**: (1) 서버사이드 API proxy 방식으로 GitHub xlsx를 fetch+파싱. (2) 클라이언트에서 xlsx 직접 파싱하지 않음. (3) 기존 /api/web/rankings API는 수정 없이 별도 /api/web/rankings/bdr 경로로 분리. (4) 탭 3개(BDR 랭킹/플랫폼 팀/플랫폼 개인)로 확장. (5) BDR 랭킹 내에 일반부/대학부 서브탭 + 지역 클라이언트 필터.
- **이유**: (1)(2) XLSX.js가 200KB+라서 브라우저에 보내면 무거움. 서버에서 파싱하고 JSON으로 변환하면 클라이언트는 가벼운 데이터만 받음. (3) 기존 API 안정성 유지 -- 외부 데이터 장애가 내부 랭킹에 영향 주면 안 됨. (4) BDR 공식 랭킹과 플랫폼 자체 랭킹은 성격이 다르므로 탭 분리. (5) 지역 필터는 데이터 양이 적어(50~100팀) 클라이언트 사이드로 충분.
- **대안**: (A) 클라이언트에서 직접 xlsx fetch+파싱 -- 무거움 (B) 외부 데이터를 DB에 주기적 동기화 -- 과설계 (데이터가 수동 업데이트되는 엑셀이므로)
- **참조횟수**: 0

### [2026-03-25] 필터 UI를 플로팅 패널 공통 컴포넌트로 통합
- **분류**: decision
- **발견자**: planner-architect
- **내용**: 4개 페이지(games/teams/tournaments/community)의 필터가 각각 다른 방식(인라인 select, 탭 버튼, 커스텀 드롭다운, pill 탭)으로 구현되어 있어 일관성 없음. 공통 FloatingFilterPanel 컴포넌트를 만들어 페이지별 config 객체로 필터 항목을 전달하는 방식으로 통합. 선택 이유: (1) 화면 공간 절약 -- 필터가 항상 보이지 않고 필요할 때만 열림 (2) 일관된 UX -- 모든 페이지에서 동일한 패턴 (3) 모바일 친화 -- 좁은 화면에서 인라인 필터 4개가 2줄로 깨지는 문제 해결. 아이콘은 "tune" (filter_list보다 조절/설정 느낌이 강함). 패널은 모바일 하단시트 + 데스크탑 우측 슬라이드. 기존 필터 로직(URL params, state, API 호출)은 100% 유지하고 UI만 교체.
- **참조횟수**: 0

### [2026-03-25] 추가 최적화 조사: 9개 항목 발견 (기적용 9개 제외)
- **분류**: decision
- **발견자**: planner-architect
- **내용**: 기적용 9개(SWR/폴링/캐시헤더/패키지정리/폰트/Redis/SQL/프리페치/병렬화) 제외하고 8개 영역 전수 조사. 발견 9개: (1) lucide-react 잔존 12파일 제거 필요. (2) rankings/games/tournaments/community API에 Cache-Control 미설정. (3) 커뮤니티 상세 generateMetadata+본문 중복 쿼리(React.cache로 해소). (4) 팀 overview-tab 3단 waterfall(topMembers 병렬화). (5) 커뮤니티 상세 post/session/comments 순차 실행(병렬화). (6) img태그 직접 사용(next/image 미활용). (7) next/image AVIF 미설정. (8) dynamic import 전무(효과 제한적이라 선택적). (9) ISR revalidate 미설정 페이지(courts/pricing). 잘 되어 있는 것: Tailwind purge, Prisma pool(5+pgbouncer), DB 인덱스 244개, staleTimes, 서버컴포넌트 병렬, Vercel 자동 압축.
- **참조횟수**: 0

### [2026-03-25] 홈 프리페치: SWR fallbackData 방식 선택 (3안 비교)
- **분류**: decision
- **발견자**: planner-architect
- **내용**: 홈페이지 서버 프리페치 3가지 방법 비교 후 방법 A(SWR fallbackData) 선택. (A) page.tsx에서 Prisma 직접 조회 -> 각 컴포넌트에 fallbackData prop -> SWR이 초기값으로 사용 + 백그라운드 revalidate. (B) Props 직접 전달(SWR 제거) -> 리밸리데이션 상실, 전면 재작성 필요. (C) RSC+Suspense -> layout.tsx가 "use client"라서 사실상 불가능, 레이아웃 리팩토링 필수. 선택 이유: 기존 코드 변경 최소, SWR 기능 100% 유지, 단계적 적용 가능, 롤백 1분. 주의: snake_case 변환 필요(apiSuccess와 동일 형식), YouTube/profile-stats는 프리페치 제외(외부 API/복잡도).
- **참조횟수**: 0

### [2026-03-25] 성능 근본 원인: 폰트 렌더링 차단 + YouTube 서버리스 캐시 미스 + 클라이언트 waterfall
- **분류**: decision
- **발견자**: planner-architect
- **결정**: 코드 레벨 심층 분석 결과, 이전 SWR/캐시 개선으로도 체감 속도가 나아지지 않은 이유가 3가지: (1) layout.tsx `<head>`에서 외부 폰트 CSS 3종(Pretendard, Material Symbols, Quicksand)을 동기 로딩하여 브라우저 렌더링 자체를 차단. (2) YouTube recommend API가 Vercel 서버리스에서 인메모리 캐시를 쓰므로 인스턴스 cold start 시 YouTube API 6번 호출(3~5초). (3) 홈페이지가 서버에서 데이터를 안 가져오고 모두 클라이언트 SWR에 위임하여, HTML 도착 후 다시 API 5~7개 waterfall 발생. 추가로 recommended-games API에 Cache-Control 누락, getPlayerStats 3단계 순차 쿼리 발견.
- **이유**: SWR 중복 제거와 캐시 헤더는 "같은 데이터를 덜 가져오는" 최적화였지만, 근본 문제는 "데이터를 가져오기도 전에 화면이 멈추는 것(폰트 차단)"과 "서버가 할 수 있는 일을 클라이언트에 떠넘기는 구조"였다.
- **참조횟수**: 0

### [2026-03-25] 성능 개선: 레이아웃 구조 변경 없이 SWR+캐시로 최적화
- **분류**: decision
- **발견자**: planner-architect
- **결정**: layout.tsx의 "use client" 구조는 유지하고 그 안에서 가능한 개선만 진행. 6영역 9개 항목: (A) SWR 글로벌 설정 + 홈 6개 컴포넌트 useSWR 전환 -> /api/web/teams, youtube/recommend 중복 호출 자동 제거. (B) 알림 폴링을 pathname 의존에서 30초 setInterval로 변경. (C) 미사용 패키지 3개(lucide-react, @sentry/nextjs, next-auth) + 미사용 파일 3개(1,075줄) 제거. (D) API 3개에 Cache-Control 헤더 추가 (recommended-games, teams, stats). (E) YouTube 인메모리 캐시를 Upstash Redis로 전환. (F) 랭킹/승률 Prisma 쿼리 병렬화.
- **이유**: 레이아웃 서버 컴포넌트 전환(아일랜드 패턴)은 60+개 하위 페이지에 영향, 대규모 리팩토링이라 위험도가 높다. 현재 구조 내에서 SWR 중복 제거만으로 홈 API 호출을 8~9건에서 6건으로 줄일 수 있고, 캐시 헤더 추가로 서버 부하를 줄일 수 있다.
- **참조횟수**: 1

### [2026-03-25] 팔로우 시스템: follows 전용 테이블 + Server Action + 공통 FollowButton
- **분류**: decision
- **발견자**: planner-architect
- **결정**: (1) follows 전용 테이블 (follower_id + following_id + @@unique). (2) Server Action (actions/follow.ts 신규 파일). (3) 카운터 캐시 없음 (followers_count 필드 추가 안 함). (4) FollowButton 공통 컴포넌트를 src/components/에 배치하여 커뮤니티 사이드바 + 타인 프로필 두 곳에서 재사용. (5) 낙관적 업데이트 (LikeButton 패턴 동일).
- **이유**: (1) 좋아요와 동일한 단순 구조 우선. (2) 기존 community.ts의 toggleLikeAction과 패턴 통일하되, 팔로우는 커뮤니티 전용이 아니므로 별도 파일. (3) 현재 팔로워 수를 표시하는 UI가 없어 카운터 캐시는 YAGNI. (4) 두 곳에서 사용하므로 페이지 내 _components가 아닌 공통 위치. (5) 즉각 반응 UX.
- **참조횟수**: 0

### [2026-03-25] 좋아요 시스템: 전용 테이블 + Server Action + 낙관적 업데이트
- **분류**: decision
- **발견자**: planner-architect
- **결정**: (1) community_post_likes 전용 테이블 (polymorphic 아님). (2) API route 아닌 Server Action 방식 (기존 댓글과 동일 패턴). (3) likes_count 카운터 캐시 필드 추가 (매번 count 쿼리 방지). (4) LikeButton 클라이언트 컴포넌트에서 낙관적 업데이트.
- **이유**: (1) 현재 좋아요가 필요한 곳이 community_posts뿐이라 polymorphic은 과설계. 나중에 필요하면 전환 가능. (2) 상세 페이지가 서버 컴포넌트이고 댓글도 Server Action이라 패턴 통일. (3) comments_count와 동일한 카운터 캐시 패턴으로 성능과 일관성 확보. (4) 좋아요는 즉각 반응이 중요한 UX.
- **참조횟수**: 0

### [2026-03-25] 랭킹 페이지: DB 변경 없이 기존 필드 활용 + groupBy 합산
- **분류**: decision
- **발견자**: planner-architect
- **결정**: (1) 팀 랭킹은 Team.wins로 직접 정렬 (별도 집계 테이블 없이). (2) 개인 랭킹은 TournamentTeamPlayer의 누적 스탯 필드를 groupBy+_sum으로 합산 (MatchPlayerStat aggregate 대신). (3) 페이지네이션은 클라이언트 사이드 (API 50건, 프론트 20건/페이지). (4) 디자인 시안 없으므로 팀 목록 페이지의 테이블 스타일 응용.
- **이유**: (1) Team에 이미 wins/losses 카운터 캐시가 있어 추가 쿼리 불필요. (2) TournamentTeamPlayer에 total_points 등 누적 필드가 있어 MatchPlayerStat를 매번 aggregate하는 것보다 성능 우수. (3) 50건이면 클라이언트 처리 충분, 기존 팀/대회와 패턴 통일. (4) 시안 없는 기능은 기존 UI 패턴 재활용이 가장 안전.
- **참조횟수**: 0

### [2026-03-23] 커뮤니티 리디자인: API 최소 확장 + 좋아요 미구현 + 티어 숨김
- **분류**: decision
- **발견자**: planner-architect
- **결정**: (1) /api/web/community 응답에 authorProfileImage + contentPreview 2개 필드만 추가(기존 필드 변경 없음). (2) 좋아요 기능은 DB에 likes_count 필드가 없어 버튼 UI만 배치하고 동작 미구현. (3) 티어 배지(GOLD 등)는 User에 tier 필드가 없어 숨김 처리. (4) 인기글 사이드바는 별도 API 없이 기존 응답의 view_count 기준 정렬로 대체. (5) 팔로우 기능은 DB에 없어 버튼 UI만 배치(비활성). (6) 카테고리 7개 탭은 UI만 표시, 실제 DB는 기존 4개 유지.
- **이유**: (1) 시안 반영에 최소한의 데이터(아바타+미리보기)만 필요. (2)(3)(5) DB 스키마 변경은 별도 작업으로 분리하여 리스크 최소화. (4) 30건 내 정렬이라 서버 추가 쿼리 불필요. (6) 카테고리 확장은 글쓰기 페이지와 함께 진행해야 의미 있음.
- **참조횟수**: 0

### [2026-03-23] 대회 리디자인: API 유지 + 클라이언트 필터/페이지네이션 + bracket-builder 유지
- **분류**: decision
- **발견자**: planner-architect
- **결정**: (1) /api/web/tournaments 응답 구조 변경 없음. (2) Region/Date/Fee 필터는 클라이언트 사이드 구현(API는 status만 지원). (3) 페이지네이션도 클라이언트 사이드(API take:60 고정, 팀 목록과 동일 패턴). (4) bracket-builder.ts 유틸리티 함수/타입 변경 없음. (5) 대회 상세의 parseDescription 로직은 유지하고 렌더러만 분리. (6) 경기장 이미지는 DB 필드 없으므로 CSS 그라디언트로 대체. (7) 대진표에 조별리그 순위표 통합(tournamentTeam groupName 기반).
- **이유**: (1)(4) 경기/팀/프로필 리디자인과 동일한 "기존 로직 유지, UI만 변경" 원칙. (2)(3) 서버 사이드 필터 추가는 API 변경이 필요하므로 별도 작업으로 분리. (5) parseDescription은 안정적으로 동작하므로 리스크 최소화. (6) 외부 이미지 URL 사용은 보안/성능 이슈. (7) 시안이 대진표 페이지 내에 조별리그를 통합 표시.
- **참조횟수**: 0

### [2026-03-23] 프로필 리디자인: SVG 직접 구현 레이더 차트 + API 유지 + prisma 확장 허용
- **분류**: decision
- **발견자**: planner-architect
- **결정**: (1) 레이더/헥사곤 차트는 recharts/chart.js 없이 SVG polygon으로 직접 구현. (2) 내 프로필 API(/api/web/profile, /api/web/profile/stats)는 변경하지 않음. (3) 타인 프로필(users/[id]/page.tsx)은 서버 컴포넌트이므로 matchPlayerStat 추가 쿼리 허용(기존 user 쿼리 유지). (4) 티어 배지(GOLD I 등)는 DB에 없으므로 총 경기수 기반 프론트 계산. (5) 데이터 없는 요소(승률/팔로워/야투성공률)는 숨기거나 placeholder 처리.
- **이유**: (1) 정적 도형이라 라이브러리 불필요, 번들 크기 절약. (2) 경기/팀 리디자인과 동일한 "API 유지, UI만 변경" 원칙. (3) 타인 프로필은 서버 컴포넌트라 prisma 직접 쿼리가 자연스러움. (4)(5) 시안 100% 재현보다 있는 데이터로 깔끔하게 보여주는 것이 현실적.
- **참조횟수**: 0

### [2026-03-22] 경기 페이지 리디자인: API 로직 유지, UI만 변경
- **분류**: decision
- **발견자**: planner-architect
- **결정**: 경기 3종 페이지 리디자인 시 데이터 호출 로직(fetch URL, Server Action, 서비스 함수)은 일절 변경하지 않고 UI 렌더링 부분만 교체한다.
- **이유**: (1) API가 Flutter 앱과 100% 호환되어야 하므로 건드리면 위험. (2) 현재 데이터 흐름이 안정적으로 동작 중. (3) 리디자인 범위를 UI로 한정해야 작업 시간과 리스크를 줄일 수 있음.
- **대안**: 경기 이미지(image_url) 등 신규 필드가 필요한 경우 DB에 없으면 placeholder로 대체, API 변경은 별도 작업으로 분리.
- **참조횟수**: 0

### [2026-03-22] 경기 생성 위자드: fixed 오버레이 -> 일반 페이지 내 배치
- **분류**: decision
- **발견자**: planner-architect
- **결정**: 현재 경기 생성 위자드가 `fixed inset-0 z-[100]`으로 전체 화면을 덮는 오버레이인데, 디자인 시안에서는 일반 페이지 내 2열 레이아웃(폼+Summary)으로 변경.
- **이유**: (1) 시안이 사이드바가 보이는 일반 페이지 내 배치를 보여줌. (2) 오버레이 방식은 모바일에서는 좋지만 데스크탑에서 사이드바 네비게이션이 가려져 UX가 단절됨.
- **주의**: 모바일에서는 여전히 전체화면처럼 보이도록 반응형 처리 필요 (xl: 이상에서만 2열).
- **참조횟수**: 0

### [2026-03-23] lucide-react → Material Symbols Outlined 전체 교체
- **분류**: decision
- **발견자**: pm
- **결정**: 레이아웃만 교체(B안)가 아닌, 프로젝트 전체에서 lucide-react를 제거하고 Material Symbols Outlined로 통일(A안).
- **이유**: (1) 디자인 시안이 Material Symbols 기준으로 작성됨. (2) 두 라이브러리 혼용은 번들 크기 증가+일관성 저하. (3) 사용자가 A안 선택.
- **영향**: 19파일, ~50개 아이콘 교체. lucide-react 의존성 제거 가능.
- **참조횟수**: 1

### [2026-03-23] 팀 페이지 리디자인: API 유지 + 클라이언트 사이드 페이지네이션
- **분류**: decision
- **발견자**: planner-architect
- **결정**: 팀 목록/상세 리디자인 시 기존 API(/api/web/teams, prisma 직접 쿼리)는 변경하지 않는다. 페이지네이션은 클라이언트 사이드로 처리(API가 take:60 고정). 디비전 배지는 DB 필드 없으므로 승수 기반 임시 계산. 배경 배너는 팀 고유색 그라디언트로 대체.
- **이유**: (1) 경기 페이지 리디자인과 동일한 원칙(API 로직 유지, UI만 변경). (2) 서버 사이드 페이지네이션 추가는 API 변경이 필요하므로 별도 작업으로 분리. (3) 60팀이면 클라이언트 사이드로 충분.
- **참조횟수**: 0

### [2026-03-23] YouTube 인기 영상: Search API → playlistItems 페이지네이션
- **분류**: decision
- **발견자**: pm (디버깅 과정에서)
- **결정**: YouTube Search API(order=viewCount)가 실제 조회수와 다른 결과를 반환하여, playlistItems 3페이지(150개) + Videos API 실제 조회수 조회 + 서버 정렬 방식으로 변경.
- **이유**: (1) Search API 부정확 (10,092뷰 영상이 1,518뷰 아래 표시). (2) 쿼터 97% 절약 (200→6). (3) playlistItems+Videos는 정확한 viewCount 반환.
- **대안**: YouTube Analytics API (더 정확하지만 OAuth 필요, 구현 복잡도 높음)
- **참조**: errors.md "YouTube Search API" / lessons.md "YouTube API"
- **참조횟수**: 1
