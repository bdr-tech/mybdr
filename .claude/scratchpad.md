# 작업 스크래치패드

## 현재 작업
- **요청**: Phase 2C(팀명 표시 UI 일괄 반영) 마무리 → 2D tester → dev PR
- **상태**: 진행중
- **현재 담당**: pm

## 전체 프로젝트 현황 대시보드 (2026-04-15)
| 항목 | 수치 |
|------|------|
| 웹 페이지 (web) | 84개 |
| 관리자 페이지 (admin) | 16개 |
| Prisma 모델 | 87개 (Referee 시스템 14개 추가) |
| Web API | 120+ 라우트 |
| subin 커밋 (dev 대비) | ~46개 |

## Phase 2: 팀명 한/영 구조화 진행 현황
| 단계 | 상태 | 커밋 |
|------|------|------|
| 2A-1 스키마 추가 | ✅ | 66e6736 |
| 2A-2 API/검색/Zod | ✅ | e6a0ef7 |
| 2B 생성/수정 폼 UI | ✅ | c53fb71 |
| **2C 표시 UI 일괄 반영** | **🔄 워킹트리 9파일 변경 + 2신규** | - |
| 2D tester 일괄 검증 | ⏸ 대기 | - |

## 기획설계 (planner-architect)
(없음 — 2C는 2A 설계 범위 내에서 developer가 직접 진행)

## 구현 기록 (developer)
(Phase 2C 점검 후 채울 예정)

## 테스트 결과 (tester)
(대진표 시스템 + 팀명 한/영 일괄 검증 대기 — dev 머지 전 필수)

## 리뷰 결과 (reviewer)
(아직 없음)

## 수정 요청
| 요청자 | 대상 파일 | 문제 설명 | 상태 |
|--------|----------|----------|------|

## ⚠️ 원영에게 공유 필요
- `db push --accept-data-loss`로 개발 DB의 referee/association 23행 삭제
- schema 구조는 복원(커밋 66e6736), 데이터는 빈 상태
- subin-referee 작업 시 데이터 재입력 필요할 수 있음
- 상세: .claude/knowledge/errors.md (2026-04-15 항목)

## 작업 로그 (최근 10건)
| 날짜 | 담당 | 작업 | 결과 |
|------|------|------|------|
| 04-15 | pm | scratchpad 경량화 (163→약 55줄) | ✅ 완료 |
| 04-15 | pm | 중간 정리: knowledge 갱신(6파일) + scratchpad 대청소 | ✅ 완료 |
| 04-13 | developer | Phase 2B: 팀 생성/수정 폼 UI에 영문명 + 대표언어 토글 (c53fb71) | ✅ 완료 |
| 04-15 | developer | Phase 2A-2: Team name_en API/Zod/검색 반영 (e6a0ef7) | ✅ 완료 |
| 04-15 | developer | Phase 2A-1: Team.name_en/name_primary + Referee 14모델 schema (66e6736) | ✅ 완료 |
| 04-15 | developer | 참가팀 탭 → TeamCard 재사용 UI 통일 (2b69d12) | ✅ 완료 |
| 04-15 | developer | 대진표 박스 모바일 확장 + 좌/우 슬라이드 (02a3b6e) | ✅ 완료 |
| 04-15 | developer | 대진표 카드 20% 확대 + 헤더 카드 위 이동 (2f9c96e) | ✅ 완료 |
| 04-15 | developer | 대진표 박스 입체감 + 라운드 헤더 강조 (f5b8c8a) | ✅ 완료 |
| 04-14 | developer | 토너먼트 카드 시인성 개선 (e71fd80) | ✅ 완료 |
