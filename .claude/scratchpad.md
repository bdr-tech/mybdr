# 작업 스크래치패드

## 현재 작업
- **요청**: (다음 작업 대기 중)
- **상태**: 대기
- **현재 담당**: pm

## 전체 프로젝트 현황 (2026-04-16)
| 항목 | 값 |
|------|-----|
| main / dev / subin | `b9ab78f` 동기화 |
| 원격 브랜치 | 5개 (main / dev / subin / subin-referee / wonyoung) |
| 오늘 머지 PR | 12개 (#13~#24) |
| 미푸시 커밋 | 0개 |

## 오늘 핵심 성과 (2026-04-16)
| 영역 | 결과 |
|------|------|
| **라이브 경기 페이지** | 라이트모드 + 티빙 스타일 5단 + 쿼터 필터 + 프린트 다이얼로그 전면 개편 |
| **모바일 UI** | 2행 레이아웃 재설계 + sticky 겹침 수정 + zoom 1.1 절충 |
| **리그 순위표** | `homeScore=0` 경기 playerStats 합산 fallback 로직 |
| **프린트 PDF** | 파일명 `YYMMDDHH_홈_원정`, 가로 방향 CSS + 사용자 가이드 |
| **참가팀 로고** | 8팀 PNG 반영 + `teams.logo_url` DB 업데이트 |

## 운영 팁 (이 세션 확립)
- **gh 인증 풀림 시**: `GH_TOKEN=$(printf "protocol=https\nhost=github.com\n\n" | git credential fill 2>/dev/null | grep ^password= | cut -d= -f2) gh ...`
- **subin drift 해소**: `git reset --hard origin/main` + `git push --force-with-lease origin subin`
- **주의**: Chrome "PDF로 저장" ≠ Hancom PDF. 가상 프린터는 @page 무시함 → 사용자에게 "PDF로 저장" 권장

## 작업 로그 (최근 10건)
| 날짜 | 담당 | 작업 | 결과 |
|------|------|------|------|
| 04-16 | pm | PR #24 플레이스홀더 `—` → `-` 통일 | ✅ |
| 04-16 | pm | PR #23 프린트 방향 안내 (Hancom PDF 회피) | ✅ |
| 04-16 | pm | PR #22 파일명 YYMMDDHH + 가로 방향 강화 | ✅ |
| 04-16 | pm | PR #20 프린트 헤더/데이터 정렬 수정 | ✅ |
| 04-16 | pm | PR #19 zoom 1.25 → 1.1 | ✅ |
| 04-16 | pm | PR #18 sticky 셀 z-10 추가 | ✅ |
| 04-16 | pm | PR #17 모바일 2행 레이아웃 + sticky 배경 불투명 | ✅ |
| 04-16 | pm | PR #16 리그 순위표 homeScore=0 fallback | ✅ |
| 04-16 | pm | PR #13 라이브 페이지 수빈 버전 통합 | ✅ |
| 04-15 | developer | 참가팀 8개 로고 PNG 반영 + DB 업데이트 | ✅ |
