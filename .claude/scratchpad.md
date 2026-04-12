# 작업 스크래치패드

## 현재 작업
- **요청**: Flutter 앱 기록 입력 기능 조사 → 웹 동일 기능 개발 준비 보고서
- **상태**: 🔍 조사중
- **현재 담당**: planner-architect

## 전체 프로젝트 현황 대시보드 (2026-04-01)
| 항목 | 수치 |
|------|------|
| 웹 페이지 (web) | 84개 |
| 관리자 페이지 (admin) | 16개 |
| Prisma 모델 | 73개 |
| Web API | 111개 라우트 |

## 기획설계 (planner-architect)

### 경기 기록 입력 시스템 완전 분석 완료 (2026-04-13)

핵심 발견:
- API 12개 엔드포인트 분석 (v1 matches/events/stats/roster/status/live-token + duo + recorder + sync)
- 2가지 기록 방식: (1) 이벤트 기반 실시간 (match_events), (2) 최종 스탯 동기화 (MatchPlayerStat)
- 실시간 통신: Supabase Realtime Broadcast (Flutter -> scoreboard 페이지)
- 인증: requireRecorder 미들웨어 (JWT + API token 폴백)
- 웹 구현 시 API 전부 재사용 가능, 새로 만들 것은 기록 입력 UI만

## 구현 기록 (developer)

📝 구현한 기능: 모바일 UI 3건 수정 (탭 아이콘 삭제 + 통계 카드 축소 + 푸터 최소화)

| 파일 경로 | 변경 내용 | 신규/수정 |
|----------|----------|----------|
| src/app/(web)/teams/[id]/page.tsx | 탭 아이콘 span 삭제 + gap-1.5 제거 | 수정 |
| src/app/(web)/teams/[id]/_tabs/overview-tab.tsx | 통계 카드 숫자 text-2xl/xl + 패딩 p-4 + 간격 gap-3 (모바일) | 수정 |
| src/components/layout/Footer.tsx | py-4 + gap-2 + gap-x-4/y-1 + gap-3 (모바일) | 수정 |

💡 tester 참고:
- 테스트 방법: 모바일 뷰포트(375px)에서 팀 상세 페이지 + 푸터 확인
- 정상 동작: 탭에 아이콘 없이 텍스트만 표시, 통계 숫자가 작게, 푸터가 컴팩트하게
- sm(640px) 이상에서는 기존과 동일해야 함

## 테스트 결과 (tester)

테스트 일시: 2026-04-13

### 1. 타입 검증
| 테스트 항목 | 결과 | 비고 |
|-----------|------|------|
| npx tsc --noEmit | ✅ 통과 | EXIT_CODE=0, 에러 없음 |

### 2. page.tsx — 탭 아이콘 삭제
| 테스트 항목 | 결과 | 비고 |
|-----------|------|------|
| material-symbols-outlined span 제거 | ✅ 통과 | Link 내부에 {t.label} 텍스트만 존재 |
| gap-1.5 제거 | ✅ 통과 | Link className에 gap-1.5 없음 |
| 기존 스타일 유지 (flex-1, justify-center 등) | ✅ 통과 | flex flex-1 items-center justify-center whitespace-nowrap 유지 |

### 3. overview-tab.tsx — 통계 카드 글자 축소
| 테스트 항목 | 결과 | 비고 |
|-----------|------|------|
| 시즌 승률 숫자 text-2xl sm:text-4xl | ✅ 통과 | 79줄 확인 |
| 경기 수 숫자 text-xl sm:text-3xl | ✅ 통과 | 110줄 확인 |
| 멤버 수 숫자 text-xl sm:text-3xl | ✅ 통과 | 122줄 확인 |
| 시즌 승률 카드 패딩 p-4 sm:p-6 | ✅ 통과 | 73줄 확인 |
| 통계 그리드 간격 gap-3 sm:gap-4 | ✅ 통과 | 71줄 확인 |
| API/prisma 쿼리 미변경 | ✅ 통과 | findMany 3건 동일 |

### 4. Footer.tsx — 푸터 높이 최소화
| 테스트 항목 | 결과 | 비고 |
|-----------|------|------|
| footer py-4 sm:py-8 | ✅ 통과 | 6줄 확인 |
| 항목 간격 gap-2 sm:gap-4 | ✅ 통과 | 8줄 확인 |
| nav 링크 gap-x-4 gap-y-1 sm:gap-x-6 sm:gap-y-2 | ✅ 통과 | 15줄 확인 |
| SNS 간격 gap-3 sm:gap-4 | ✅ 통과 | 35줄 확인 |
| 링크 미변경 (요금제/이용약관/개인정보/광고문의) | ✅ 통과 | 4개 링크 href 동일 |

종합: 15개 중 15개 통과 / 0개 실패

참고: page.tsx TABS 배열에 icon 프로퍼티 정의가 남아있으나 렌더링 미사용. 기능 문제 없음.

## 리뷰 결과 (reviewer)
(아직 없음)

## 수정 요청
| 요청자 | 대상 파일 | 문제 설명 | 상태 |
|--------|----------|----------|------|

## 작업 로그 (최근 10건)
| 날짜 | 담당 | 작업 | 결과 |
|------|------|------|------|
| 04-13 | developer+tester | 모바일 최적화 2/5: 팀 상세 히어로/탭/버튼 반응형 (3파일) | ✅ 완료 |
| 04-13 | developer+tester | 모바일 최적화 1/5: 하단 탭 네비 아이콘/텍스트/간격 조정 (layout.tsx) | ✅ 완료 |
| 04-12 | developer+tester | Phase 3b: host-card/pricing/button 가시성 버그 3건 수정 (6파일) | ✅ 완료 |
| 04-12 | pm | 새 PC 세팅: origin/subin reset + .env 생성 + npm install | 완료 |
| 04-12 | developer+tester | 다크모드 accent 버튼 가시성 전수 수정 (40파일/59포인트, 3단계) | 완료 |
| 04-05 | pm | AG→main 머지+푸시 (타이포그래피+슬라이드메뉴 정리) | 완료 |
| 04-02 | developer+tester | 맞춤 설정 필터 미동작 5건 수정 + 전수 검증 30건 통과 | 완료 |
| 04-02 | developer | 메뉴 토글 + 테마/텍스트크기 설정 (20건 검증 통과) | 완료 |
| 04-02 | developer | 맞춤 설정 강화 — 실력 7단계, 카테고리 분리, 용어 통일 | 완료 |
| 04-01 | developer | 파트너셀프서비스+대관+카페이전 (14파일) | 완료 |
| 04-01 | developer | 역할체계+단체승인제 | 완료 |
