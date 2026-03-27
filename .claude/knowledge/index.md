# 프로젝트 지식 목차
> 최종 갱신: 2026-03-28

## 파일별 요약
| 파일 | 항목 수 | 최종 업데이트 | 설명 |
|------|--------|------------|------|
| architecture.md | 13 | 2026-03-26 | 페이지별 구조 분석, 라우트/컴포넌트/API 매핑 |
| conventions.md | 9 | 2026-03-28 | 디자인 시스템, 반응형 패턴, 코딩 규칙, 디비전 체계 |
| decisions.md | 16 | 2026-03-28 | 기술 결정 배경과 이유 (성능/구조/디비전) |
| errors.md | 5 | 2026-03-28 | 에러 패턴, 함정, 주의사항 |
| lessons.md | 4 | 2026-03-28 | 삽질 경험, 효과적 접근법 |

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

### 에러/함정을 알고 싶을 때 → errors.md
| 키워드 | 항목 제목 |
|--------|----------|
| YouTube, viewCount | YouTube Search API 정렬 부정확 |
| 라이트모드, 테마, dark/light | 라이트모드 CSS 변수 미적용 |
| admin, 레이아웃 이중 | admin 레이아웃 이중 적용 |
| apiSuccess, .data, 래핑, snake_case | apiSuccess 응답에 .data로 접근하는 버그 |

### 삽질 교훈을 알고 싶을 때 → lessons.md
| 키워드 | 항목 제목 |
|--------|----------|
| YouTube, 쿼터, API | playlistItems가 Search보다 정확+저렴 |
| 테마, 다크/라이트, CSS변수 | 테마 전환 시 3가지 동시 처리 |

## 외부 참고 문서
| 문서 | 위치 | 설명 |
|------|------|------|
| DESIGN.md | Dev/design/DESIGN.md | 디자인 시스템 통합 문서 (색상/폰트/레이아웃/컴포넌트) |
| Stitch 원본 | Dev/design/0. 레이아웃/DESIGN.md | Stitch에서 내보낸 원본 디자인 규격 |

## 최근 추가된 지식 (최근 10건)
- [03-28] conventions: BDR 디비전 체계 3단계 (성별→종별→디비전) 표준 규격
- [03-28] decisions: 프론트/admin/API 상수 통일 — 공통 상수 파일 import 원칙
- [03-28] errors: categories JSON이 boolean/array 혼용 — Array.isArray 체크 필수
- [03-28] lessons: ISR 캐시 무효화 — getWebSession()의 cookies()가 원인
- [03-28] lessons: DB 리전이 성능 병목 — ap-south-1(인도)에서 한국 리전으로 이전
- [03-27] decisions: 홈 ISR 활성화 — getWebSession 분리로 CDN 캐시 가능
- [03-27] decisions: Google Places 사진 연동 — 서버 proxy + 3단계 캐시
- [03-27] decisions: 카드 컴팩트화 — 이미지 축소 + 정보 2줄 압축 패턴
- [03-26] architecture: 외부 BDR 랭킹 연동 구조 설계 (GitHub xlsx + 서버 proxy)
- [03-26] decisions: 외부 BDR 랭킹 서버사이드 xlsx proxy 결정
