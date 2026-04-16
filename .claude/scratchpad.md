# 작업 스크래치패드

## 현재 작업
- **요청**: (다음 작업 대기 중)
- **상태**: 대기
- **현재 담당**: pm

## 전체 프로젝트 현황 (2026-04-17)
| 항목 | 값 |
|------|-----|
| 현재 브랜치 | subin |
| main | `b8e1e8a` (PR #15까지, 원영 dev→main 머지 대기) |
| dev / subin | `e87fa82` 동기화 |
| 미푸시 커밋 | 1개 (2026-04-17 정리 커밋 예정) |

## 오늘 핵심 성과 (2026-04-17)
| 영역 | 결과 |
|------|------|
| **열혈SEASON2 선수 userId 백필** | 25건 UPDATE / MatchPlayerStat 197건 자동 연결 / 데이터 손실 0 |
| **대회 endDate 복구** | 2024-04-11 단일 → 2024-04-11 ~ **2024-06-27** (장기 대회) |
| **팀 병합 (soft)** | 셋업(196) ← 경기 셋업(209), 쓰리포인트(198) ← 원주 3포인트(210) / DELETE 0 / status="merged" 비활성 |
| **개발 포트 복구** | `package.json` dev 스크립트 3002 → 3001 (CLAUDE.md subin 규칙 일치) |
| **동명이인 User 4명** | 가짜 계정(2984,2985) 보존, 본계정(2954,2862) 연결로 확정 |
| **팀 가시성/로고 보정** | 라이징이글스(194) is_public=true + 쓰리포인트(198) 로고 `/team-logos/3point.png` 이관 |

## 운영 팁 (유지)
- **gh 인증 풀림 시**: `GH_TOKEN=$(printf "protocol=https\nhost=github.com\n\n" | git credential fill 2>/dev/null | grep ^password= | cut -d= -f2) gh ...`
- **subin drift 해소**: `git reset --hard origin/main` + `git push --force-with-lease origin subin`
- **일회성 DB 정리**: `scripts/`에 임시 스크립트 → dry-run → --execute → 완료 후 삭제. 데이터 보존(DELETE 금지) 원칙
- **대회 DB 정합성 검증**: `userId=NULL` 비율 + `completed/live 중 homeScore=awayScore=0` 카운트 2개가 핵심 지표

## 작업 로그 (최근 10건)
| 날짜 | 담당 | 작업 | 결과 |
|------|------|------|------|
| 04-17 | developer | 팀 개요탭 "최근 경기" 위젯 — TournamentMatch 연합 조회 추가 (games-tab과 동일 패턴, 병합 후 상위 5건) | ✅ tsc 통과 |
| 04-17 | developer | 팀 상세 "경기" 탭 — TournamentMatch 병행 조회(미래/NULL 제외, completed+live) + 픽업과 날짜순 병합 표시 | ✅ tsc 통과 |
| 04-17 | debugger | next.config remotePatterns에 카카오 CDN 2종(img1/t1) 추가 — 카카오 기본 프로필 이미지 next/image 에러 해결 | ✅ |
| 04-17 | pm | 라이징이글스 공개 복구 + 쓰리포인트 로고 이관 (팀 병합 후속) | ✅ |
| 04-17 | pm | 열혈SEASON2 Phase A+B+C+D (선수 백필 25건 / endDate 복구 / 팀 병합 2쌍 / 포트 3001 복구) | ✅ |
| 04-16 | pm | PR #24 플레이스홀더 `—` → `-` 통일 | ✅ |
| 04-16 | pm | PR #23 프린트 방향 안내 (Hancom PDF 회피) | ✅ |
| 04-16 | pm | PR #22 파일명 YYMMDDHH + 가로 방향 강화 | ✅ |
| 04-16 | pm | PR #20 프린트 헤더/데이터 정렬 수정 | ✅ |
| 04-16 | pm | PR #19 zoom 1.25 → 1.1 | ✅ |
