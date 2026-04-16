# 프로젝트 지식 목차
> 최종 갱신: 2026-04-17 (Phase 3 공식 기록 가드 + 열혈SEASON2 일회성 정리)

## 파일별 요약
| 파일 | 항목 수 | 최종 업데이트 | 설명 |
|------|--------|------------|------|
| architecture.md | 29 | 2026-04-15 | 페이지 구조, 대회/대진표, 팀명 2필드, Referee 시스템, Flutter API 호환 |
| conventions.md | 24 | 2026-04-17 | 디자인/색상/경기집계/sticky/프린트CSS/공식 기록 가드/**에이전트 호출 기준**/**스크립트 템플릿 재사용** |
| decisions.md | 66 | 2026-04-17 | 기술 결정 (KBL 순위/대진표/userId 연결/Referee v2/헬스체크 cron/열혈SEASON2 정리/**공식 기록 가드 전역 적용**) |
| errors.md | 16 | 2026-04-17 | 에러 패턴 (sticky, @page Hancom PDF, th/td 정렬, DB 사고, add 누락, next/image 외부 호스트) |
| lessons.md | 15 | 2026-04-17 | 교훈 (프린트 API, 모바일 zoom, 브랜치 drift, Flutter 테스트 오염, 팀 병합 logo 이관, 동명이인 닉네임 힌트, **HTTP 5xx + git 실상 확인**) |
| toss-design-analysis.md | 10 | 2026-03-28 | 토스 디자인 시스템 심층 분석 |
| ux-audit-report.md | 28 | 2026-03-28 | UI/UX 사용성 심층 조사 |
| project-structure-audit.md | 10 | 2026-03-28 | 전체 구조 분석 |

## 최근 추가된 지식 (최근 10건)
- [04-17] lessons: **HTTP 5xx 에러 시 "실패" 단정 금지** — nginx 502는 "응답만 실패, 처리는 완료"일 수 있음. git log/DB로 실상 확인 후 판단. 멱등 작업은 재시도 안전
- [04-17] conventions: **에이전트 호출 최소화 기준** — PM 직접/Explore/planner/developer/debugger 담당 범위 표. 토큰 절약 + 불필요 호출 방지
- [04-17] conventions: **일회성 DB 스크립트 템플릿 재사용** — `scripts/_templates/`에 verify/backfill/merge 3종 (UPDATE only, DELETE 금지)
- [04-17] decisions: **공식 기록 가드 전역 적용** — `officialMatchWhere` 공통 유틸 3함수+SQL상수로 9개 지점(순위/선수기록/팀승패/라이브) 일관 적용. Flutter 테스트 데이터(미래 live) 오염 방어
- [04-17] conventions: **공식 기록 쿼리 — officialMatchWhere 필수 사용** — 맥락별 3갈래 분기 (표준/nested/status-override) + raw SQL 상수
- [04-17] lessons: **Flutter 테스트 데이터가 공식 기록 오염** — 미래 scheduledAt + status=live 자주 발생 → scheduledAt 가드 필수
- [04-17] lessons: **팀 병합 시 logo_url/banner_url 이관 체크** — FK UPDATE만 하고 UI 컨텐츠 필드 빠뜨리기 쉬움
- [04-17] lessons: **동명이인은 닉네임 팀/역할 힌트로 구분** — "(셋업주장)" 같은 패턴이 수동 확인을 쉽게 함
- [04-17] errors: Next.js 16 next/image 외부 호스트 미허용 — `img1/t1.kakaocdn.net` remotePatterns 누락
- [04-17] decisions: 열혈농구단 SEASON2 일회성 백필 + 팀 병합 — 25건 userId + 4개 팀 2개 soft merge, DELETE 0
- [04-17] decisions: 2026-04-16 "회원가입 hook 자동 연결" ⛔ 정정 — 일회성 처리로 대체
- [04-16] errors: **sticky 셀 가로 스크롤 겹침** — 배경 투명 + z-index 누락 이중 원인
- [04-16] errors: **Chrome @page를 가상 프린터(Hancom PDF)가 무시** — 웹 API로 제어 불가, UI 안내가 유일한 해결책
- [04-16] errors: 프린트 th center vs td left 기본값 불일치 → 정렬 깨짐 (table-layout: fixed + text-align 명시 필요)
- [04-16] lessons: 브라우저 프린트 API는 OS/드라이버 제어 불가 — Chrome "PDF로 저장" 유도가 최선
- [04-16] lessons: 모바일 UI는 데스크톱 확대에 희생되면 안 됨 — 듀얼 렌더(sm:hidden) + zoom 절충(1.1)
- [04-16] lessons: 개인 브랜치 drift 해소 — reset --hard origin/dev + push --force-with-lease
- [04-16] conventions: sticky 셀 규칙 — 불투명 배경 + z-10 쌍
- [04-16] conventions: 프린트 CSS 표준 @page 키워드 + table-layout: fixed
- [04-16] conventions: 모바일/데스크톱 듀얼 렌더 패턴 (`sm:hidden` + `hidden sm:flex`)
- [04-16] conventions: 플레이스홀더 기호는 `-` 통일 (em-dash `—` 금지)
- [04-15] errors: 신규 파일 git add 누락 → Vercel 빌드 실패
- [04-15] lessons: gh 인증 풀렸을 때 `git credential fill`로 GH_TOKEN 세션 주입
- [04-15] errors: **prisma db push --accept-data-loss로 타 브랜치 Referee 테이블 4개 drop 사고** — 개발 DB라도 db push 전 migrate diff 필수
- [04-15] lessons: DB 마이그레이션 --accept-data-loss는 타 브랜치 데이터 파괴 가능 — migrate dev --create-only로 SQL 먼저 확인
- [04-15] architecture: 팀명 2필드 구조 (Team.name_en + name_primary "ko"/"en") + Referee 시스템 14개 모델 schema 통합
- [04-14] architecture: 대회 상세 페이지 전면 개편 — 탭 4개(대회정보/대진표/일정/참가팀), 히어로 통합, 사이드바 제거
- [04-14] architecture: 대진표 시스템 4단계 구현 — 풀리그 순위표 → 토너먼트 자동 할당 → 시드 뱃지 → 뼈대 선생성 → admin wizard
- [04-14] architecture: 토너먼트 트리 NBA.com 스타일 — SVG 통일, 카드 분리형, 좌측 유니폼 색 띠
- [04-14] architecture: 대회 선수 userId 자동 연결 — link-player-user.ts 이름 정확 일치 매칭
- [04-14] architecture: 사이트 전역 팀명/선수명 Link 전환 — /teams/{id}, /users/{id}
- [04-14] decisions: KBL 방식 순위 로직 — 승률 → 득실차 → 다득점, 경기결과 실시간 집계
- [04-14] decisions: 대진표 자동 생성 흐름 — 뼈대 선생성 + 리그 완료 시 할당 + BYE 자동 처리
- [04-14] decisions: 대회 선수 userId 자동 연결 — 이름 정확 일치만 허용(오매칭 방지)
- [04-14] decisions: 사이트 전역 팀명/선수명을 Link로 전환 — 일정 카드 내부는 중첩 방지 예외
- [04-14] conventions: 경기결과 실시간 집계 패턴 — Team.wins 필드 무시, tournament_matches에서 status completed+live 집계
- [04-14] conventions: API 응답 snake_case → camelCase 자동 변환 — fetcher 래퍼로 근본 해결
- [04-14] conventions: 팀 카드 공통 컴포넌트 TeamCard 재사용
- [04-14] lessons: snake_case/camelCase 변환 버그는 fetcher 래퍼로 근본 해결 — 3번 재발 후 구조적 해결

## 빠른 검색 가이드

### 페이지별 구조를 알고 싶을 때 → architecture.md
| 키워드 | 항목 제목 |
|--------|----------|
| 팀명, name_en, name_primary, Referee, associations | 팀명 2필드 구조 + Referee 시스템 통합 |
| 대회 상세, 탭 4개, 히어로, 1열 | 대회 상세 페이지 전면 개편 |
| 대진표, 풀리그, 토너먼트, 자동 할당, 뼈대, 시드 뱃지 | 대진표 시스템 4단계 구현 |
| BracketView, SVG, NBA.com, 카드 분리형 | 토너먼트 트리 NBA.com 스타일 |
| userId 연결, link-player-user, 이름 매칭 | 대회 선수 userId 자동 연결 시스템 |
| 전역 Link, /teams, /users, 팀명 클릭 | 사이트 전역 팀명/선수명 Link 전환 |
| 홈, 사이드바, 히어로 | 홈페이지 리디자인 구조 설계 |
| 경기, 게임, 위자드 | 경기 페이지 구조 분석 |
| 팀, 목록, 상세 | 팀 페이지 구조 분석 |
| 프로필, 스탯, 레이더 | 프로필 페이지 구조 분석 |
| 대회, 대진표, 브라켓 | 대회 페이지 구조 분석 |
| 커뮤니티, 게시글, 댓글 | 커뮤니티 페이지 구조 분석 |
| admin, 라우트 그룹 | admin 라우트 그룹 분리 |
| 심판, referee, 경기원, 자격증 | 심판 플랫폼 라우트 그룹 (referee) 설계 |
| 랭킹, rankings, 팀, 개인 | 랭킹 페이지 구조 설계 |
| BDR 랭킹, 외부, xlsx, proxy | 외부 BDR 랭킹 연동 구조 설계 |
| 하드코딩, API 연결 | 하드코딩 vs DB/API 전체 분석 |
| 색상, CSS 변수 | CSS 하드코딩 색상 전환 대상 분류 |
| 전체 구조, 90개 페이지 | 전체 페이지 구조 분석 |
| 현장등록, Flutter, TournamentTeamPlayer | 대회 선수 등록 및 userId 연결 흐름 분석 |
| 경기기록, match_events, MatchPlayerStat, 기록원 | 경기 기록 입력 시스템 전체 구조 분석 |

### 디자인/코딩 규칙을 알고 싶을 때 → conventions.md
| 키워드 | 항목 제목 |
|--------|----------|
| 경기결과, wins, losses, 실시간 집계, tournament_matches | 경기결과 실시간 집계 패턴 (Team.wins 필드 무시) |
| fetcher, snake_case, camelCase, convertKeysToCamelCase | API 응답 snake_case → camelCase 자동 변환 |
| TeamCard, 팀 카드, 공통 컴포넌트, 재사용 | 팀 카드 공통 컴포넌트 재사용 |
| 색상, Primary, 쿨그레이 | 디자인 시스템 색상 체계 |
| 아이콘, Material Symbols | 아이콘 라이브러리 |
| 폰트, Pretendard | 폰트 체계 |
| 버튼, 카드, radius | 버튼/컴포넌트 스타일 |
| 브레이크포인트, 모바일 | 레이아웃 브레이크포인트 |
| 리디자인, 2열, API 유지 | 페이지 리디자인 공통 패턴 |
| DB 없음, placeholder | DB 미지원 기능 처리 규칙 |
| 스크롤, 그리드, 반응형 | 가로 스크롤 + 그리드 반응형 패턴 |
| 디비전, 종별, 성별, D3~D8 | BDR 디비전 체계 3단계 표준 규격 |
| 대회 상태, 준비중/접수중/진행중/종료 | 대회 상태 4종 통일 규칙 |
| admin, 테이블, 모달, 탭 | admin UI 공통 패턴 |
| 다크모드, 텍스트 가시성, --color-on-*, text-white 금지 | 테마 반응형 배경 위 텍스트 --color-on-* 변수 |

### 왜 이렇게 결정했는지 알고 싶을 때 → decisions.md
| 키워드 | 항목 제목 |
|--------|----------|
| KBL, 순위, 승률, 득실차, 다득점 | KBL 방식 순위 로직 |
| 대진표 자동, 뼈대 선생성, BYE, 시드, seedNumber | 대진표 자동 생성 흐름 |
| 이름 매칭, 정확 일치, 오매칭, link-player-user | 대회 선수 userId 자동 연결 |
| 전역 Link, 중첩 금지, /teams, /users | 사이트 전역 팀명/선수명을 Link로 전환 |
| 대회 프리셋, settings Json, 스네이크 드래프트, 교차 시딩 | 대회 형식 프리셋 시스템 |
| format 분기, public-bracket, 조별 전적 | 대진표 탭 format 기반 조건부 렌더링 |
| 팀 병합, teamId UPDATE | 중복 팀 병합 B안 |
| userId 시나리오, A>D>B>C | 대회 기록 자동 연결 4시나리오 우선순위 |
| 팔로우, follows, FollowButton | 팔로우 시스템 follows 테이블 + 공통 FollowButton |
| 좋아요, likes, ServerAction | 좋아요 시스템 전용 테이블 + Server Action |
| 랭킹, groupBy, DB유지 | 랭킹 페이지 DB 변경 없이 기존 필드 활용 |
| BDR 랭킹, xlsx, proxy | 외부 BDR 랭킹 서버사이드 proxy |
| 위자드, fixed, 오버레이 | 경기 생성 위자드 배치 변경 |
| lucide, Material Symbols | 아이콘 라이브러리 전체 교체 |
| YouTube, playlistItems | YouTube 인기 영상 API 변경 |
| ISR, getWebSession, CDN | 홈 ISR 활성화 — getWebSession 분리 |
| Google Places, 사진, 캐시 | Google Places 사진 연동 3단계 캐시 |
| admin, 모달, 탭, 개편 | admin UI 전면 개편 |
| 카드, 컴팩트, 그라디언트 | 카드 컴팩트화 + 유형별 그라디언트 |
| 상수, 통일, 공통파일 | 프론트/admin/API 상수 공통 import 원칙 |
| 대회 상태, 4종 | 준비중/접수중/진행중/종료 4종 통일 |
| admin, 모달, 탭, 개편 | admin UI 전면 개편 — 컴팩트 테이블+플로팅 모달 |
| 심판, Referee, 샌드위치, User 0수정 | 심판 플랫폼 샌드위치 구조 / User 모델 1줄 / 브랜치 격리 DB |

### 에러/함정을 알고 싶을 때 → errors.md
| 키워드 | 항목 제목 |
|--------|----------|
| db push, --accept-data-loss, 테이블 drop, 브랜치 schema | **prisma db push --accept-data-loss로 타 브랜치 테이블 drop** |
| Turbopack, Jest worker, child process | Turbopack dev worker pool 에러 |
| YouTube, viewCount | YouTube Search API 정렬 부정확 |
| 라이트모드, 테마, dark/light | 라이트모드 CSS 변수 미적용 |
| admin, 레이아웃 이중 | admin 레이아웃 이중 적용 |
| apiSuccess, .data, 래핑, snake_case | apiSuccess 응답에 .data로 접근하는 버그 |
| categories, boolean, array, divs.map | categories JSON boolean/array 혼용 에러 |
| setLoggedIn, 경쟁 조건 | 커뮤니티 맞춤 필터 미적용 경쟁 조건 |
| 체크인, SWR, POST 409 | SWR GET과 POST 409 응답 정보 불일치 |
| 개발서버, hung, 무한 로딩, 메모리 | Next.js 개발서버 무한 로딩 |

### 삽질 교훈을 알고 싶을 때 → lessons.md
| 키워드 | 항목 제목 |
|--------|----------|
| db push, accept-data-loss, 브랜치, 마이그레이션 | DB 마이그레이션 --accept-data-loss는 타 브랜치 데이터 파괴 가능 |
| fetcher, snake/camel, 재발, 구조적 해결 | snake/camelCase 변환 버그는 fetcher 래퍼로 근본 해결 |
| YouTube, 쿼터, API | playlistItems가 Search보다 정확+저렴 |
| 테마, 다크/라이트, CSS변수 | 테마 전환 시 3가지 동시 처리 |
| ISR, cookies, getWebSession | ISR 캐시 무효화 — cookies() 호출이 원인 |
| DB, 리전, Supabase, 인도 | DB 리전이 성능 병목 — 한국으로 이전 |

## 외부 참고 문서
| 문서 | 위치 | 설명 |
|------|------|------|
| DESIGN.md | Dev/design/DESIGN.md | 디자인 시스템 통합 문서 (색상/폰트/레이아웃/컴포넌트) |
| Stitch 원본 | Dev/design/0. 레이아웃/DESIGN.md | Stitch에서 내보낸 원본 디자인 규격 |

## 최근 추가된 지식 (최근 10건)
- [04-15] decisions: 헬스체크 cron 2차 — self-fetch + Promise.allSettled 병렬 + 실패해도 끝까지 진행 (내부 함수 호출 대비 유저 경로 검증 이점)
- [04-12] architecture: 심판 플랫폼 재설계 v2 — 6모델(Association/AssociationAdmin/Referee/Certificate/Assignment/Settlement) + 17API + Excel 2단계 업로드, users 0수정 CREATE 6건만
- [04-12] decisions: v2 협회 계층형 Association — self-relation, 20개 시드(KBA+시도17+KBL/WKBL), REGIONS 재사용
- [04-12] decisions: v2 자격증 파일 업로드 제거 — cert_number + 실명/생년월일/전화 교차검증으로 대체
- [04-12] decisions: v2 Excel 일괄 + 개별 토글 2-way — preview/confirm 2단계, 5MB/500행 제한, 파일 미저장
- [04-12] decisions: v2 심판 공개 목록 제거 — /registry 삭제, 본인 profile + admin members 두 컨텍스트만
- [04-12] decisions: v2 실명 노출 — User.name 사용, verified_* 스냅샷을 Referee에 저장
- [04-12] decisions: v2 배정/정산 조회 전용 포함 — RefereeAssignment+Settlement 스키마 1차 확정, tournament_match_id/game_id 분리 FK
- [04-12] decisions: v2 AssociationAdmin 매핑 테이블 — users 0수정(ALTER 회피), admin_role 기존값 재사용, 1인 1협회 unique
- [04-12] architecture: 심판 플랫폼 라우트 그룹 (referee) — v1 초안 (registry 포함, 2 모델)
- [04-12] decisions: 심판 플랫폼 샌드위치 구조 — v1 초안 (신규 테이블 2개만, 1인 1 Referee 원칙)
- [04-02] decisions: 맞춤 설정 강화 — 실력 7단계 + 메뉴 토글 + 카테고리 분리 (DB 변경 최소, 하위 호환 유지)
- [04-02] architecture: 맞춤 설정 시스템 구조 분석 — preference-form + API + context + 필터 적용 흐름 + SKILL_LABEL 중복 4곳
- [03-29] decisions: GPS 히트맵 — Canvas 오버레이 + simpleheat (카카오맵 히트맵 미지원, court_sessions 시간대 집계)
- [03-29] decisions: 3x3 이벤트 — tournament 완전 분리, court_events 4테이블 신설 (코트 종속 경량 대회)
- [03-29] decisions: 앰배서더 — court_ambassadors 테이블 + 위키 바이패스 (코트별 동네 관리자)
- [03-29] decisions: 주간 리포트 — DB 없이 court_sessions 실시간 집계 + Vercel Cron (1차 앱내 알림)
- [03-29] decisions: 코트 유저 위키 — court_edit_suggestions 1테이블 + changes JSON diff (reports와 분리, 승인 시 XP 10)
- [03-29] decisions: 픽업게임 모집 — 별도 pickup_games 테이블 신설 (games 분리, 즉시 확정 참가, 코트 직접 연결)
- [03-29] decisions: 코트 데이터 품질 정리 기준 — 658개 추정 데이터 null 초기화 + 유저 위키 시스템
- [03-28] project-structure-audit: 전체 구조 분석 — 미사용 API 6개/고립 페이지 4개/TODO 3건/레거시 3쌍 발견
- [03-28] ux-audit-report: UI/UX 사용성 심층 조사 — 11개 영역/28개 개선안/단기10+중기8+장기5 우선순위
- [03-28] toss-design-analysis: 토스 디자인 시스템 심층 분석 — 색상/폰트/간격/컴포넌트/레이아웃 전수치 + MyBDR 매핑 테이블
- [03-28] decisions: admin UI 전면 개편 — 컴팩트 테이블 + 플로팅 모달 + 상태 탭
- [03-28] conventions: admin UI 패턴 — 서버page + 클라이언트content 분리
- [03-28] conventions: 대회 상태 4종 통일 (준비중/접수중/진행중/종료)
- [03-28] architecture: admin 누락 관리 기능 4개 추가 (경기/커뮤니티/팀/코트)
- [03-28] decisions: 프론트/admin/API 상수 통일 — 공통 상수 파일 import 원칙
- [03-28] conventions: BDR 디비전 체계 3단계 (성별→종별→디비전) 표준 규격
- [03-28] errors: categories JSON boolean/array 혼용 — Array.isArray 체크 필수
- [03-28] lessons: ISR 캐시 무효화 — getWebSession()의 cookies()가 원인
- [03-27] decisions: 홈 ISR 활성화 — getWebSession 분리로 CDN 캐시 가능
- [03-27] decisions: Google Places 사진 연동 — 서버 proxy + 3단계 캐시
