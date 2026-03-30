# 프로젝트 지식 목차
> 최종 갱신: 2026-03-29 (장기 로드맵 4건 기획설계)

## 파일별 요약
| 파일 | 항목 수 | 최종 업데이트 | 설명 |
|------|--------|------------|------|
| architecture.md | 15 | 2026-03-28 | 페이지별 구조, admin 개편, 프론트-백엔드 연결맵 |
| conventions.md | 11 | 2026-03-28 | 디자인 시스템, 디비전 체계, 대회 상태 4종, admin UI 패턴 |
| decisions.md | 26 | 2026-03-29 | 기술 결정 (성능/구조/디비전/admin 개편/코트 데이터 정리/픽업게임/위키/앰배서더/리포트/3x3/히트맵) |
| errors.md | 5 | 2026-03-28 | 에러 패턴, 함정, 주의사항 |
| lessons.md | 4 | 2026-03-28 | 삽질 경험, 효과적 접근법 |
| toss-design-analysis.md | 10 | 2026-03-28 | 토스 디자인 시스템 심층 분석 (색상/폰트/간격/컴포넌트/레이아웃) |
| ux-audit-report.md | 28 | 2026-03-28 | UI/UX 사용성 심층 조사 (11개 영역, 28개 개선안, 우선순위 정리) |
| project-structure-audit.md | 10 | 2026-03-28 | 전체 구조 분석 (미사용 파일/API + 페이지 연결맵 + 사용자 흐름 + 사각지대) |

## 빠른 검색 가이드

### 페이지별 구조를 알고 싶을 때 → architecture.md
| 키워드 | 항목 제목 |
|--------|----------|
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

### 디자인/코딩 규칙을 알고 싶을 때 → conventions.md
| 키워드 | 항목 제목 |
|--------|----------|
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
| admin, 테이블, 모달, 탭 | admin UI 공통 패턴 (서버page+클라이언트content) |

### 왜 이렇게 결정했는지 알고 싶을 때 → decisions.md
| 키워드 | 항목 제목 |
|--------|----------|
| 팔로우, follows, FollowButton, 공통컴포넌트 | 팔로우 시스템 follows 테이블 + 공통 FollowButton |
| 좋아요, likes, 전용테이블, ServerAction | 좋아요 시스템 전용 테이블 + Server Action |
| 랭킹, groupBy, DB유지 | 랭킹 페이지 DB 변경 없이 기존 필드 활용 |
| BDR 랭킹, xlsx, proxy, 서버사이드 | 외부 BDR 랭킹 서버사이드 proxy + 3탭 결정 |
| 커뮤니티, 좋아요, 티어 | 커뮤니티 리디자인 방침 |
| 대회, 필터, bracket | 대회 리디자인 방침 |
| 프로필, 레이더, SVG | 프로필 리디자인 방침 |
| 팀, 페이지네이션 | 팀 리디자인 방침 |
| 경기, API 유지 | 경기 리디자인 방침 |
| 위자드, fixed, 오버레이 | 경기 생성 위자드 배치 변경 |
| lucide, Material Symbols | 아이콘 라이브러리 전체 교체 |
| YouTube, playlistItems | YouTube 인기 영상 API 변경 |
| ISR, getWebSession, CDN | 홈 ISR 활성화 — getWebSession 분리 |
| Google Places, 사진, 캐시 | Google Places 사진 연동 3단계 캐시 |
| 카드, 컴팩트, 그라디언트 | 카드 컴팩트화 + 유형별 그라디언트 |
| 상수, 통일, 공통파일 | 프론트/admin/API 상수 공통 import 원칙 |
| 대회 상태, 4종 | 준비중/접수중/진행중/종료 4종 통일 |
| admin, 모달, 탭, 개편 | admin UI 전면 개편 — 컴팩트 테이블+플로팅 모달 |

### 에러/함정을 알고 싶을 때 → errors.md
| 키워드 | 항목 제목 |
|--------|----------|
| YouTube, viewCount | YouTube Search API 정렬 부정확 |
| 라이트모드, 테마, dark/light | 라이트모드 CSS 변수 미적용 |
| admin, 레이아웃 이중 | admin 레이아웃 이중 적용 |
| apiSuccess, .data, 래핑, snake_case | apiSuccess 응답에 .data로 접근하는 버그 |
| categories, boolean, array, divs.map | categories JSON boolean/array 혼용 에러 |

### 삽질 교훈을 알고 싶을 때 → lessons.md
| 키워드 | 항목 제목 |
|--------|----------|
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
