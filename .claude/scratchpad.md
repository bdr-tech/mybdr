# 작업 스크래치패드

## 현재 작업
- **요청**: 관리자 통합 메뉴 + 권한별 노출
- **상태**: 구현 완료 (tsc 통과, 기존 lucide-react 에러 1건만 잔존)
- **현재 담당**: developer

### 구현 기록

구현한 기능: 관리자 통합 메뉴 — 권한별 메뉴 필터링 + 접근 권한 확장 (5파일 수정)

| 파일 경로 | 변경 내용 | 신규/수정 |
|----------|----------|----------|
| src/components/admin/sidebar.tsx | roles prop 받아 권한별 메뉴 필터링 (NavItem에 roles 배열) | 수정 |
| src/app/(admin)/admin/layout.tsx | 접근 권한 확장: DB 조회로 partner_members/organization_members 소속 확인 | 수정 |
| src/components/shared/slide-menu.tsx | 3개 관리 링크 → "관리" 1개로 통합 | 수정 |
| src/app/(web)/layout.tsx | PC 사이드네비 3개 관리 링크 → "관리" 1개로 통합 | 수정 |
| src/proxy.ts | ADMIN_PATHS 미들웨어 체크 제거 (layout에서 DB 기반 권한 판단으로 위임) | 수정 |

tester 참고:
- super_admin 계정: /admin 접속 시 전체 메뉴 표시
- tournament_admin 계정: /admin 접속 시 대시보드 + 대회관리 링크만 표시
- partner_members 소속 유저: /admin 접속 시 대시보드 + 협력업체/캠페인 메뉴 표시
- 권한 없는 유저: /admin 접속 시 /login?error=no_permission으로 리다이렉트
- 슬라이드 메뉴/PC 사이드네비: 로그인 유저에게 "관리" 링크 1개만 표시

## 전체 프로젝트 현황 대시보드 (2026-04-01)

### 규모 요약
| 항목 | 수치 |
|------|------|
| 웹 페이지 (web) | 84개 (+6: partner-admin 5P + venues 1P + invite 1P) |
| 관리자 페이지 (admin) | 16개 |
| Prisma 모델 | 73개 |
| Web API | 111개 라우트 (+1: tournaments/calendar) |

---

## 작업 로그 (최근 10건)
| 날짜 | 담당 | 작업 | 결과 |
|------|------|------|------|
| 04-01 | developer | #7 파트너셀프서비스+#8 대관+#9 카페이전 (API7+페이지7, 14파일) | 완료 |
| 04-01 | developer | #1~#6 역할체계+단체승인제 (타입에러1건 수정) | 완료 |
| 04-01 | developer | 네이티브 광고 시스템 MVP (스키마4모델+API4+Admin2P+광고컴포넌트+삽입3곳, 13파일) | 완료 |
| 04-01 | developer | Organization 3단계 계층 (스키마+API7개+관리4P+공개3P+기존연결, 15파일) | 완료 |
| 03-31 | developer | #8 검색코트 + #9 알림설정 + #10 PWA배너 (7파일) | 완료 |
| 03-31 | developer | 비밀번호 재설정 + 회원 탈퇴 (8파일) | 완료 |
| 03-31 | pm | main 머지 + 푸시 (Phase 5 성능 + 소셜) | 완료 |
| 03-31 | developer | #16관리자+#17검색+#18알림 (차트/발송/유저검색/최근검색/삭제) | 완료 |
| 03-31 | developer | 경기 수정/취소 + 팀 수정/해산 API+UI (5파일) | 완료 |
| 03-31 | developer | #21소셜+#22이미지/댓글좋아요+#23시즌+#24admin보강 (8파일) | 완료 |
