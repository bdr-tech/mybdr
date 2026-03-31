# 작업 스크래치패드

## 현재 작업
- **요청**: 대회 단체(Organization) 3단계 계층 구조 전체 구현
- **상태**: 구현 완료 (tsc 통과)
- **현재 담당**: developer

### 구현 기록

구현한 기능: Organization 3단계 계층 (단체 -> 시리즈 -> 대회) 전체 구현 (7단계, 15파일)

| 파일 경로 | 변경 내용 | 신규/수정 |
|----------|----------|----------|
| prisma/schema.prisma | organizations + organization_members 모델 + tournament_series에 organization_id 추가 | 수정 |
| src/app/api/web/organizations/route.ts | POST(생성)+GET(내 목록) API | 신규 |
| src/app/api/web/organizations/[id]/route.ts | GET(상세)+PATCH(수정) API | 신규 |
| src/app/api/web/organizations/[id]/members/route.ts | GET(멤버목록)+POST(초대) API | 신규 |
| src/app/api/web/organizations/[id]/members/[memberId]/route.ts | DELETE(멤버제거) API | 신규 |
| src/app/api/web/organizations/slug/[slug]/route.ts | 공개 단체 조회 (인증 불필요) | 신규 |
| src/app/api/web/organizations/slug/[slug]/series/route.ts | 소속 시리즈 목록 (인증 불필요) | 신규 |
| src/app/(web)/tournament-admin/organizations/page.tsx | 내 단체 목록 (관리) | 신규 |
| src/app/(web)/tournament-admin/organizations/new/page.tsx | 단체 생성 폼 | 신규 |
| src/app/(web)/tournament-admin/organizations/[orgId]/page.tsx | 단체 대시보드 (정보+시리즈+멤버) | 신규 |
| src/app/(web)/tournament-admin/organizations/[orgId]/members/page.tsx | 멤버 관리 (초대+제거) | 신규 |
| src/app/(web)/organizations/page.tsx | 공개 단체 목록 (ISR 60초) | 신규 |
| src/app/(web)/organizations/[slug]/page.tsx | 공개 단체 상세 (통계+시리즈+멤버) | 신규 |
| src/app/(web)/organizations/[slug]/series/[seriesSlug]/page.tsx | 시리즈 상세 (회차 타임라인) | 신규 |
| src/app/api/web/series/route.ts | POST에 organization_id 파라미터 추가 | 수정 |
| src/app/(web)/tournament-admin/_components/tournament-admin-nav.tsx | 네비에 "단체" 메뉴 추가 | 수정 |

tester 참고:
- Prisma 모델 2개 추가 (organizations, organization_members) → DB 마이그레이션 필요
- 관리 페이지: /tournament-admin/organizations 에서 단체 CRUD + 멤버 관리
- 공개 페이지: /organizations 에서 단체 목록 → /organizations/{slug} 상세 → 시리즈 상세
- 권한: owner/admin만 단체 수정/멤버 초대 가능, owner만 admin 제거 가능
- organization_id는 nullable (기존 시리즈 호환)
- 시리즈 생성 시 organization_id 전달하면 단체 series_count 자동 증가

## 전체 프로젝트 현황 대시보드 (2026-03-31)

### 규모 요약
| 항목 | 수치 |
|------|------|
| 웹 페이지 (web) | 78개 |
| 관리자 페이지 (admin) | 14개 |
| 사이트 페이지 (_site) | 6개 |
| 라이브 페이지 | 2개 |
| Web API | 98개 라우트 |
| Flutter API (v1) | 33개 라우트 |
| Cron | 2개 (대회알림, 주간리포트) |
| Prisma 모델 | 69개 (organizations + organization_members 추가) |
| 코트 데이터 | 1,045개 (카카오 실데이터) |
| tsc 에러 | 0개 |

### 기능 완성도 (영역별)
| 영역 | 완성도 | 상세 |
|------|--------|------|
| 인증 | 95% | 로그인/회원가입/소셜/JWT/비밀번호재설정/회원탈퇴 |
| 홈 | 85% | 6섹션 구성, ISR, API 연동 |
| 대회 | 95% | CRUD/위자드/팀관리/대진표/참가신청/시리즈 |
| 경기 | 95% | 게스트/픽업/팀매치/위자드/신청관리/라이브/수정/취소 |
| 팀 | 90% | 생성/관리/멤버/가입신청/팔로우/수정/해산 |
| 코트 | 95% | 지도/체크인/리뷰/제보/위키/픽업/앰배서더/이벤트/QR/히트맵 |
| 프로필 | 90% | 정보수정/스탯/게이미피케이션/주간리포트/결제내역/구독관리/소셜계정표시 |
| 커뮤니티 | 90% | 게시판/댓글/글쓰기/좋아요/이미지첨부/댓글좋아요/수정/삭제 |
| 랭킹 | 95% | BDR랭킹(외부xlsx)/시즌드롭다운/플랫폼팀/플랫폼개인 |
| 관리자 | 85% | users/tournaments/courts/ambassadors필터/알림발송/7일차트/analytics보강 |
| PWA | 90% | manifest+Serwist+웹푸시+설치배너 |
| 알림 | 90% | 인앱+웹푸시(VAPID)+유형별 설정+개별삭제 |
| 검색 | 95% | 통합 검색(코트+유저) + 자동완성 + 최근검색어 |
| 결제 | 95% | 요금제/체크아웃/성공/실패/환불/내역/구독관리 |

### 완료된 Phase
| Phase | 작업 | 상태 |
|-------|------|------|
| 1. 정리 | tsc 0건 + xlsx 동적 import + 레거시 정리 | ✅ |
| 2. 소셜 | 팔로우/좋아요 알림 연동 | ✅ |
| 3. 알림 | 웹 푸시 알림 전체 구현 | ✅ |
| 4. 성능 | unstable_cache + 동적 import + 인덱스 | ✅ |
| 5. 배포 | main 머지 + GitHub 푸시 | ✅ |

---

## 작업 로그 (최근 10건)
| 날짜 | 담당 | 작업 | 결과 |
|------|------|------|------|
| 04-01 | developer | Organization 3단계 계층 (스키마+API7개+관리4P+공개3P+기존연결, 15파일) | 완료 |
| 03-31 | developer | #8 검색코트 + #9 알림설정 + #10 PWA배너 (7파일) | 완료 |
| 03-31 | developer | 비밀번호 재설정 + 회원 탈퇴 (8파일) | 완료 |
| 03-31 | pm | main 머지 + 푸시 (Phase 5 성능 + 소셜) | 완료 |
| 03-31 | developer | #16관리자+#17검색+#18알림 (차트/발송/유저검색/최근검색/삭제) | 완료 |
| 03-31 | developer | 경기 수정/취소 + 팀 수정/해산 API+UI (5파일) | 완료 |
| 03-31 | developer | #21소셜+#22이미지/댓글좋아요+#23시즌+#24admin보강 (8파일) | 완료 |
| 03-31 | developer | SMS Redis저장소+RateLimit4API+에러추적 (9파일) | 완료 |
| 03-31 | developer | middleware+error.tsx+헬스체크 (3파일 신규) | 완료 |
| 03-31 | developer | #7메타데이터(9파일)+#9loading(7파일)+#12모바일검색(1파일) | 완료 |
| 03-31 | developer | #13SVG차단+#14sitemap동적+#15user_id주석 (3파일) | 완료 |
| 03-31 | developer | 홈 히어로 개인화+픽업 실내/야외 (대시보드API확장+동적버튼+뱃지, 8파일) | 완료 |
| 03-31 | developer | 홈 히어로 리디자인 (프로필위젯+퀵액션+소식피드, 6파일) | 완료 |
