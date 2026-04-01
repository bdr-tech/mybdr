# 작업 스크래치패드

## 현재 작업
- **요청**: 폰트 가독성 개선 + 흐린 텍스트 색상 진하게
- **상태**: 구현 완료
- **현재 담당**: developer

### 구현 기록

구현한 기능: 본문 폰트 크기/간격/굵기 조정 + muted 텍스트 색상 진하게 (CSS 변수만 수정)

| 파일 경로 | 변경 내용 | 신규/수정 |
|----------|----------|----------|
| src/app/globals.css | body: font-size 15px, line-height 1.65, letter-spacing -0.01em, font-weight 420 | 수정 |
| src/app/globals.css | 라이트 --color-text-muted: #8B95A1 -> #7B8894 (+10% 진하게) | 수정 |
| src/app/globals.css | 다크 --color-text-muted: #6B7684 -> #808B98 (+15% 밝게) | 수정 |

tester 참고:
- 라이트/다크 모드 모두에서 본문 텍스트 크기가 살짝 커지고 줄간격이 넉넉해졌는지 확인
- 캡션/힌트 텍스트(muted)가 이전보다 더 잘 보이는지 확인
- disabled 텍스트는 의도적으로 유지 (변경 없음)

| 파일 경로 | 변경 내용 | 신규/수정 |
|----------|----------|----------|
| src/components/shared/profile-dropdown.tsx | 헤더 우측 프로필 드롭다운 (4카테고리 플랫 목록, 외부클릭/ESC 닫힘) | 신규 |
| src/app/(web)/layout.tsx | 사이드네비에서 ProfileAccordion 제거, 헤더에 ProfileDropdown 교체 | 수정 |
| src/app/(web)/profile/basketball/page.tsx | 내 농구 페이지 (팀/경기/대회/통계 이동) | 신규 |
| src/app/(web)/profile/growth/page.tsx | 내 성장 페이지 (XP/레벨/스트릭/뱃지/도장깨기 이동) | 신규 |
| src/app/(web)/profile/page.tsx | 4카테고리 허브 카드로 간소화 | 수정 |

tester 참고:
- 헤더 우측 프로필 아이콘(B) 클릭 → 드롭다운 메뉴 표시 (4카테고리 + 로그아웃)
- 외부 클릭 또는 ESC로 드롭다운 닫힘
- 각 링크 클릭 시 드롭다운 닫힘 + 해당 페이지 이동
- /profile: 아바타+닉네임+레벨 + 4개 카테고리 카드 그리드
- /profile/basketball: 통계+팀+경기+대회+주간리포트
- /profile/growth: XP/레벨+스트릭+도장깨기+뱃지
- PC 사이드네비: 프로필 아코디언 제거됨, 관리 링크만 남음
- 모바일 슬라이드 메뉴: 기존 ProfileAccordion 유지 (변경 없음)

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
