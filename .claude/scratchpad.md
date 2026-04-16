# 작업 스크래치패드

## 현재 작업
- **요청**: (다음 작업 대기 중)
- **상태**: 대기
- **현재 담당**: pm

## 전체 프로젝트 현황 (2026-04-17 마감)
| 항목 | 값 |
|------|-----|
| 현재 브랜치 | subin (로컬 `56324c1`, origin/subin은 gh auto-delete로 삭제됨) |
| main / dev | `60b2a97` / `79a9416` — **오늘 작업 전부 main 반영 완료** |
| 오늘 머지 PR | #30 (subin→dev), #31 (dev→main), #32 (subin→dev, auto dev→main) |
| 미푸시 커밋 | 0개 |
| 알림 | 다음 작업 시 `git push -u origin subin`으로 원격 재생성 필요 |

## 오늘 핵심 성과 (2026-04-17)
| 영역 | 결과 |
|------|------|
| **열혈SEASON2 데이터 정리** | 선수 userId 백필 25건 / MatchPlayerStat 197건 자동 연결 / 대회 endDate 4/11 → 6/27 / DELETE 0 |
| **팀 병합 (soft)** | 셋업(196)←경기 셋업(209), 쓰리포인트(198)←원주 3포인트(210) / status="merged" 비활성 / 로고 이관 |
| **동명이인 User 처리** | 가짜 계정 2984/2985 보존 + 본계정 2954/2862 연결 (닉네임 힌트로 구분) |
| **팀 가시성/로고 보정** | 라이징이글스(194) is_public=true + 쓰리포인트 로고 `/team-logos/3point.png` |
| **next/image 카카오 CDN** | `img1/t1.kakaocdn.net` remotePatterns 추가 (pathname 제한) |
| **팀 페이지 경기 탭/개요** | TournamentMatch 연합 조회 + 미래 경기 제외 필터 |
| **권한 부여** | nonggudan 대회 열람 (tournament_admin_members) + cobby8 슈퍼관리자 + phone |
| **4/18 경기 status 복구** | id=120 live → scheduled (Flutter 테스트 데이터) |
| **Phase 3 전역 공식 기록 가드** | `officialMatchWhere` 공통 유틸 + 7곳 적용 (순위/선수기록/팀승패/라이브) |
| **개발 포트 복구** | `package.json` dev 3002 → 3001 (CLAUDE.md subin 규칙 일치) |

## 운영 팁 (유지)
- **gh 인증 풀림 시**: `GH_TOKEN=$(printf "protocol=https\nhost=github.com\n\n" | git credential fill 2>/dev/null | grep ^password= | cut -d= -f2) gh ...`
- **subin drift 해소**: `git reset --hard origin/main` + `git push --force-with-lease origin subin`
- **subin remote 재생성**: gh auto-delete 시 `git push -u origin subin`
- **일회성 DB 정리**: `scripts/`에 임시 스크립트 → dry-run → --execute → 완료 후 삭제. 데이터 보존(DELETE 금지) 원칙
- **대회 DB 정합성 검증**: `userId=NULL` 비율 + `completed/live 중 homeScore=awayScore=0` 카운트 2개가 핵심 지표
- **공식 기록 쿼리**: 반드시 `officialMatchWhere()` 유틸 사용 (Flutter 테스트 오염 방어)

## 남은 과제 (내일 이후)
- **운영 DB 동기화** — 개발 DB에 한 작업(백필/병합/endDate/권한)을 운영 DB에 반영 (원영 협의 필요)
- **원영 영역 공식 기록 가드 적용** — public-bracket API, _site/*.tsx (원영과 협의)
- **고아 페이지 정리** — `tournaments/[id]/{bracket,schedule,standings}/` (bracket/_components 재사용 조사 후)

## 작업 로그 (최근 10건)
| 날짜 | 담당 | 작업 | 결과 |
|------|------|------|------|
| 04-17 | pm | 토큰 절약 효율화 — 글로벌 CLAUDE.md 초보자 비유 제거, 프로젝트 CLAUDE.md 40% 슬림화(192→115줄), 스크립트 템플릿 3종, Agent 호출 기준 conventions 추가 | ✅ |
| 04-17 | pm | 권한 부여 (nonggudan 대회 열람 + cobby8 슈퍼관리자 + phone 010-9167-8117) | ✅ |
| 04-17 | developer | Phase 3 공식 기록 가드 — `official-match.ts` 신규(3함수+SQL상수) + 7파일 적용, 기존 status 보존 | ✅ tsc 통과 |
| 04-17 | developer | 팀 개요탭 "최근 경기" 위젯 — TournamentMatch 연합 조회 (병합 후 상위 5건) | ✅ |
| 04-17 | developer | 팀 상세 "경기" 탭 — TournamentMatch 병행 조회 + 미래/NULL 제외 | ✅ |
| 04-17 | debugger | next.config remotePatterns에 카카오 CDN 2종(img1/t1) 추가 | ✅ |
| 04-17 | pm | 라이징이글스 공개 복구 + 쓰리포인트 로고 이관 (팀 병합 후속) | ✅ |
| 04-17 | pm | 열혈SEASON2 Phase A+B+C+D (선수 백필 25건 / endDate / 팀 병합 2쌍 / 포트 3001) | ✅ |
| 04-16 | pm | PR #24 플레이스홀더 `—` → `-` 통일 | ✅ |
| 04-16 | pm | PR #23 프린트 방향 안내 (Hancom PDF 회피) | ✅ |
