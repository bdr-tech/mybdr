# 작업 스크래치패드

## 현재 작업
- **요청**: 네이티브 광고 시스템 MVP 7단계
- **상태**: 구현 완료 (tsc 통과, 기존 lucide-react 에러 1건은 이전부터 존재)
- **현재 담당**: developer

### 구현 기록

구현한 기능: 네이티브 광고 시스템 MVP (스키마 4모델 + API 4개 + Admin 2P + 광고 컴포넌트 + 피드/사이드바/코트 삽입, 11파일)

| 파일 경로 | 변경 내용 | 신규/수정 |
|----------|----------|----------|
| prisma/schema.prisma | partners, partner_members, ad_campaigns, ad_placements 4모델 + User에 관계 추가 | 수정 |
| src/app/api/web/ads/route.ts | GET 광고 조회 API (placement 파라미터, 5분 캐시) | 신규 |
| src/app/api/admin/partners/route.ts | GET(목록)+POST(등록) 파트너 관리 API | 신규 |
| src/app/api/admin/partners/[id]/route.ts | GET(상세)+PATCH(수정/상태변경) 파트너 API | 신규 |
| src/app/api/admin/campaigns/route.ts | GET(목록) 캠페인 관리 API | 신규 |
| src/app/api/admin/campaigns/[id]/route.ts | PATCH(승인/반려/일시정지) 캠페인 API | 신규 |
| src/app/(admin)/admin/partners/page.tsx | 파트너 관리 페이지 (목록/등록/승인/반려) | 신규 |
| src/app/(admin)/admin/campaigns/page.tsx | 캠페인 관리 페이지 (목록/승인/반려) | 신규 |
| src/components/ads/ad-card.tsx | 광고 카드 (FeedAd/SidebarAd/CourtTopAd/ListAd) + useAds 훅 | 신규 |
| src/components/home/news-feed.tsx | 2번째 위치에 FeedAd 삽입 | 수정 |
| src/components/layout/right-sidebar.tsx | 주목할팀-인기코트 사이에 SidebarAd 삽입 | 수정 |
| src/app/(web)/courts/_components/courts-content.tsx | 코트 목록 상단에 CourtTopAd 삽입 | 수정 |
| src/components/admin/sidebar.tsx | 파트너관리+광고캠페인 메뉴 추가 | 수정 |

tester 참고:
- Prisma 모델 4개 추가 (partners, partner_members, ad_campaigns, ad_placements) → DB 마이그레이션 필요
- 관리자 페이지: /admin/partners (파트너 등록/승인/반려), /admin/campaigns (캠페인 승인/반려)
- 광고 조회: /api/web/ads?placement=feed|sidebar|court_top|list
- 광고가 없으면 모든 광고 영역이 자동으로 숨겨짐 (null 반환)
- 과금 로직은 스키마만 (budget/spent/pricing_type), 실제 과금 미구현
- 광고 뱃지: text-[10px], surface-bright 배경, text-muted 색상

## 전체 프로젝트 현황 대시보드 (2026-04-01)

### 규모 요약
| 항목 | 수치 |
|------|------|
| 웹 페이지 (web) | 78개 |
| 관리자 페이지 (admin) | 16개 (+2: partners, campaigns) |
| Prisma 모델 | 73개 (+4: partners, partner_members, ad_campaigns, ad_placements) |
| Web API | 101개 라우트 (+3: ads, admin/partners, admin/campaigns) |

---

## 작업 로그 (최근 10건)
| 날짜 | 담당 | 작업 | 결과 |
|------|------|------|------|
| 04-01 | developer | 네이티브 광고 시스템 MVP (스키마4모델+API4+Admin2P+광고컴포넌트+삽입3곳, 13파일) | 완료 |
| 04-01 | developer | Organization 3단계 계층 (스키마+API7개+관리4P+공개3P+기존연결, 15파일) | 완료 |
| 03-31 | developer | #8 검색코트 + #9 알림설정 + #10 PWA배너 (7파일) | 완료 |
| 03-31 | developer | 비밀번호 재설정 + 회원 탈퇴 (8파일) | 완료 |
| 03-31 | pm | main 머지 + 푸시 (Phase 5 성능 + 소셜) | 완료 |
| 03-31 | developer | #16관리자+#17검색+#18알림 (차트/발송/유저검색/최근검색/삭제) | 완료 |
| 03-31 | developer | 경기 수정/취소 + 팀 수정/해산 API+UI (5파일) | 완료 |
| 03-31 | developer | #21소셜+#22이미지/댓글좋아요+#23시즌+#24admin보강 (8파일) | 완료 |
| 03-31 | developer | SMS Redis저장소+RateLimit4API+에러추적 (9파일) | 완료 |
| 03-31 | developer | middleware+error.tsx+헬스체크 (3파일 신규) | 완료 |
