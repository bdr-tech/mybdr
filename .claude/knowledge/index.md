# 프로젝트 지식 목차
> 최종 갱신: 2026-04-15 (Phase 2C 완료 + 신규 파일 add 누락 에러 + gh 인증 우회)

## 파일별 요약
| 파일 | 항목 수 | 최종 업데이트 | 설명 |
|------|--------|------------|------|
| architecture.md | 22 | 2026-04-15 | 페이지별 구조, 대회 상세 개편, 대진표 4단계, 팀명 2필드, Referee 시스템 통합 |
| conventions.md | 15 | 2026-04-14 | 디자인 시스템, 디비전, 대회 상태 4종, admin UI, --color-on-*, 경기결과 집계, camelCase 변환, TeamCard 공통 |
| decisions.md | 30 | 2026-04-14 | 기술 결정 (KBL 순위/대진표 자동 생성/userId 연결/전역 Link/대회 프리셋/맞춤설정/픽업게임/위키/앰배서더/리포트/3x3/히트맵) |
| errors.md | 11 | 2026-04-15 | 에러 패턴 (신규 파일 add 누락 빌드 실패, DB 사고, Turbopack, apiSuccess .data, categories JSON, 개발서버 hung) |
| lessons.md | 8 | 2026-04-15 | 삽질 경험 (신규 파일 add 체크, gh 인증 우회, db push 위험, snake/camel 변환, YouTube API, 테마 전환, ISR, DB 리전) |
| toss-design-analysis.md | 10 | 2026-03-28 | 토스 디자인 시스템 심층 분석 (색상/폰트/간격/컴포넌트/레이아웃) |
| ux-audit-report.md | 28 | 2026-03-28 | UI/UX 사용성 심층 조사 (11개 영역, 28개 개선안, 우선순위 정리) |
| project-structure-audit.md | 10 | 2026-03-28 | 전체 구조 분석 (미사용 파일/API + 페이지 연결맵 + 사용자 흐름 + 사각지대) |

## 최근 추가된 지식 (최근 10건)
- [04-15] errors: **신규 파일 git add 누락 → 로컬 OK인데 원격 Vercel 빌드 실패** — 커밋 전 git status --short의 ?? 표시 확인 필수
- [04-15] lessons: 신규 파일 add 누락 방지 — 커밋 전 `git status --short`로 `??` 확인 습관화
- [04-15] lessons: gh 인증 풀렸을 때 `git credential fill`로 GH_TOKEN 세션 주입 우회
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
