# 작업 스크래치패드

## 현재 작업
- **요청**: Phase 3 — 전역 공식 기록 가드 (미래 경기 + Flutter 테스트 데이터 제외)
- **원칙**: `status IN (completed, live) AND scheduledAt <= NOW() AND scheduledAt IS NOT NULL`
- **공통 유틸**: `src/lib/tournaments/official-match.ts` (`officialMatchWhere()`)
- **제외 영역(원영 담당)**: tournament-tabs.tsx, `bracket/_components/*`, public-bracket API (확인 필요)
- **상태**: planner 조사 완료 → developer 구현 중
- **담당**: developer (background)
- **PM 결정 확정**:
  - Q1 (api/live L20 진행중 리스트) = **적용**
  - Q2 (public-bracket) = **원영에게 미룸** (PR #16 fallback 호환 검증 필요)
  - Q3 (_site/*.tsx) = **보수적, 원영 확인 후 진행**
- **이번 PR 범위 (7 파일, 8건)**: teams/[id]/page.tsx L106, overview-tab, games-tab(리팩토링), public-standings, services/user.ts getPlayerStats 2군데 + raw SQL, api/live recentCompleted + 진행중

## 기획설계 (Phase 3 공식 기록 가드)

목표: `status IN (completed, live) AND scheduledAt <= NOW() AND scheduledAt IS NOT NULL` 조건을
공통 유틸 `officialMatchWhere()` 로 추출해서 subin 담당 영역 전체에 일관 적용.

적용 대상 (subin) — (a) 공식 기록 집계
| # | 파일:라인 | 용도 | 가드 변경 |
|---|---------|------|---------|
| 1 | src/app/(web)/teams/[id]/page.tsx L106-114 | 팀 승패 집계 (completedMatches) | `scheduledAt<=now, not null` 추가 |
| 2 | src/app/(web)/teams/[id]/_tabs/overview-tab.tsx L54 | 개요탭 최근5경기 | 이미 적용 → 유틸로 교체 |
| 3 | src/app/(web)/teams/[id]/_tabs/games-tab.tsx L54 | 경기탭 30건 | 이미 적용 → 유틸로 교체 |
| 4 | src/app/api/web/tournaments/[id]/public-standings/route.ts L31 | 순위 탭 전적 집계 | 가드 **추가** (대회 내 집계라 past만 정석) |
| 5 | src/lib/services/user.ts L153/165 getPlayerStats | 선수 커리어/시즌최고 aggregate | `tournamentMatch: { officialMatchWhere() }` nested filter |
| 6 | src/lib/services/user.ts L186-199 raw SQL winRate | 승률 DB 집계 | SQL에 `tm.scheduled_at <= NOW() AND tm.scheduled_at IS NOT NULL AND tm.status IN ('completed','live')` 추가 |
| 7 | src/app/api/live/route.ts L44 recentCompleted | 24h 이내 종료 경기 | `scheduledAt<=now` 추가 (status=completed라 대체로 안전하지만 보수적으로) |
| 8 | src/app/_site/results/page.tsx L19 | 서브도메인 경기결과 | 가드 **추가** |
| 9 | src/app/_site/page.tsx L25 matches | 서브도메인 메인 일정표 | 가드 **추가** (일정+점수 혼합 → 일정 뷰 아니라서 OK) |

제외 (가드 적용 **안 함**)
- 대진표/일정 쿼리: 예정 경기를 봐야 함 → public-schedule, public-bracket, schedule/page.tsx, bracket/page.tsx, _site/schedule, _site/[[...path]]/page.tsx
- admin/편집/CRUD: bracket/route.ts, matches/[matchId], sync, batch-sync, league-generator, tournament-seeding, update-standings, score-updater, match.ts service, tournament.ts L516
- 진행 중 live 모니터링: api/live/route.ts L20 (진행중 리스트는 미래 포함도 OK? → 확인 필요 **결정 1**)
- admin 대시보드 카운트: admin/page.tsx L32 (live 단순 집계, 원영 협의 후)
- 기록원/심판/예약: require-recorder, recorder/matches, duo/pair, matches/[id]/stats|roster|events, referee-* 7파일 — 경기 제어용
- tournament/[id]/route.ts L47: 미완료 카운트 (반대 의미 → 제외)
- tournament-seeding L216/330/514 count: 뼈대/seeding 카운트 → 제외

**원영 담당 영역 (subin 건드리지 말 것)**
- tournament-tabs.tsx — prisma 미사용(API fetch만)이라 영향 없음
- public-bracket/route.ts L41 — 원영 집계 핫픽스(PR #16) 존재 → 가드 적용 시 충돌 우려 → **결정 2**
- tournaments/[id]/bracket/page.tsx L40 — 대진표 렌더링(미래 포함 필요) → 제외 자연스러움
- tournament-auth.ts — 권한 체크용, 쿼리 없음

공통 유틸 설계 — `src/lib/tournaments/official-match.ts`
```ts
import type { Prisma } from "@prisma/client";
// "공식 기록"으로 취급할 경기 = 이미 치러진 공식 경기만
// - status in completed/live : 예정(scheduled) 제외, 라이브도 현재 스코어로 인정
// - scheduledAt <= now       : 미래 Flutter 테스트 데이터 방어(id=120 사례)
// - scheduledAt != null      : 날짜 없는 더미 제외
export function officialMatchWhere(
  extra: Prisma.TournamentMatchWhereInput = {},
): Prisma.TournamentMatchWhereInput {
  return {
    ...extra,
    status: { in: ["completed", "live"] },
    scheduledAt: { lte: new Date(), not: null },
  };
}
// nested filter용 (MatchPlayerStat → tournamentMatch 조인 시)
export function officialMatchNestedFilter(): Prisma.TournamentMatchWhereInput {
  return {
    status: { in: ["completed", "live"] },
    scheduledAt: { lte: new Date(), not: null },
  };
}
```
- Prisma에 TournamentMatch status enum 없음(String?), 상수화는 유틸 내부로만
- raw SQL용 단편은 주석으로 제공 (타입 없이 복붙)

실행 계획
| 순서 | 작업 | 담당 | 소요 | 선행 |
|------|------|------|------|------|
| 1 | `official-match.ts` 생성 + 2함수 export | developer | 10분 | 없음 |
| 2 | subin 영역 9곳 순차 교체 (유틸 호출로) | developer | 40분 | 1 |
| 3 | getPlayerStats raw SQL 가드 삽입 | developer | 10분 | 1 |
| 4 | tsc --noEmit 통과 확인 | developer | 3분 | 2,3 |
| 5 | tester(공식/예정 경계 테스트) + reviewer 병렬 | tester+reviewer | 30분 | 4 |
| 6 | 원영에게 안내 노트 작성 (public-bracket 적용 후보) | pm | 5분 | 5 |

developer 주의사항
- 팀 승패집계(L106)는 `homeTeamId: { not: null }, awayTeamId: { not: null }` 기존 조건 유지 + 가드 스프레드
- services/user.ts getPlayerStats는 aggregate _avg/_max/_count 3번 모두 where에 nested `tournamentMatch` 추가 필요
- 시간 경계: `new Date()` 는 UTC 기준으로 prisma가 서버시각 그대로 보냄 → PostgreSQL의 scheduled_at(Timestamp(6))과 일치, KST 보정 불필요
- raw SQL 블록(user.ts L188)에는 템플릿 리터럴로 직접 삽입, Prisma.sql 불필요

PM 결정 필요
1. `api/live/route.ts` L20 (진행중 리스트)에 가드 적용 여부 — live 라이브 페이지는 방금 시작한 경기만 보여야 하므로 가드 적용이 타당 (권장: 적용)
2. public-bracket/route.ts 적용을 subin이 할지 원영 PR 후 협의할지 — PR #16 호환 확인 필요, **원영 선처리 권장**
3. _site/results/page.tsx가 서브도메인 토너먼트 사이트인데 subin 범위인지 — 기술적으로 건드려도 무방하나 **원영 확인 후 진행 권장**

리스크
- scheduledAt NULL인 과거 공식 경기가 있으면 그 경기는 가드에 걸려 안 보이게 됨 → DB 데이터 정합성 문제 (열혈SEASON2에서 이미 확인 안 됨)
- 열혈SEASON2는 2024-04-11 경기 + endDate 2024-06-27까지라 모두 과거 → 정상 표시됨

### 리뷰 결과 (reviewer, 04-17)

📊 **종합 판정: 통과 (Approved)**

✅ 잘된 점
- 유틸 3갈래 분기(`officialMatchWhere`/`Nested`/`pastOrOngoingSchedule`) 설계가 호출자 맥락 기반으로 올바르게 분리됨
- JSDoc "왜+사용예" 풍부 → 다음 개발자가 바로 집어 씀
- spread 순서(`...extra` 먼저, 가드 덮어쓰기)로 호출자 실수 방어 견고
- 파일별 유틸 선택 근거가 주석으로 명시 → 추적 가능
- raw SQL `Prisma.join(playerIds)`로 IN 절만 바인딩 + 상수는 `Prisma.raw` — 안전한 분리

🔴 필수 수정: **없음**

🟡 권장 수정 (선택)
- `official-match.ts:79` `OFFICIAL_MATCH_SQL_CONDITION` 위에 경고 주석 추가: "외부 입력 받으면 Prisma.sql로 교체 필수" (현재는 안전, 장기 리팩토링 방어용)
- `teams/[id]/page.tsx:110-114` OR + homeTeamId/awayTeamId not:null 중복 표현 — 동작 맞음, 주석으로 "양팀 모두 배정된 경기만" 의도 명시 권장
- `api/live` recentCompleted 이중 가드는 **과도하지 않음** (Phase 3 일관성 목적 부합, 유지 권장)

🧪 테스트 제안 (선택, 회귀 방어)
1. `officialMatchWhere({status:"scheduled"})` 호출 시 결과 status가 `{in:[completed,live]}`로 덮어써지는지 단위 테스트
2. `pastOrOngoingSchedule()` 리턴값 형태 타입 체크
3. (integration) 미래 completed 경기 seed 후 쿼리가 배제하는지 — Phase 3 버그(id=120) 재현 방지

📎 Prisma.raw 판단: 현재 구조 안전 (상수 리터럴만 받음), 유지 + 경고 주석 추가 권장
📎 유틸 선택 일관성: 7곳 모두 근거 있음, 적절

---

## 전체 프로젝트 현황 (2026-04-17 23시경 기준)
| 항목 | 값 |
|------|-----|
| 현재 브랜치 | subin |
| main / dev / subin | `7adf40b` / `9afff97` / `9afff97` (main은 dev 병합 완료) |
| 미푸시 커밋 | 0개 (PR #30, #31 머지 완료) |

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
| 04-17 | developer | Phase 3 공식 기록 가드 — `lib/tournaments/official-match.ts` 신규(3함수+SQL상수) + 7파일 교체(teams/[id], overview/games-tab, public-standings, services/user.ts aggregate×2+raw SQL, api/live ongoing+recent). 기존 status 값 전부 보존(in_progress 포함) | ✅ tsc 통과 |
| 04-17 | developer | 팀 개요탭 "최근 경기" 위젯 — TournamentMatch 연합 조회 추가 (games-tab과 동일 패턴, 병합 후 상위 5건) | ✅ tsc 통과 |
| 04-17 | developer | 팀 상세 "경기" 탭 — TournamentMatch 병행 조회(미래/NULL 제외, completed+live) + 픽업과 날짜순 병합 표시 | ✅ tsc 통과 |
| 04-17 | debugger | next.config remotePatterns에 카카오 CDN 2종(img1/t1) 추가 — 카카오 기본 프로필 이미지 next/image 에러 해결 | ✅ |
| 04-17 | pm | 라이징이글스 공개 복구 + 쓰리포인트 로고 이관 (팀 병합 후속) | ✅ |
| 04-17 | pm | 열혈SEASON2 Phase A+B+C+D (선수 백필 25건 / endDate 복구 / 팀 병합 2쌍 / 포트 3001 복구) | ✅ |
| 04-16 | pm | PR #24 플레이스홀더 `—` → `-` 통일 | ✅ |
| 04-16 | pm | PR #23 프린트 방향 안내 (Hancom PDF 회피) | ✅ |
| 04-16 | pm | PR #22 파일명 YYMMDDHH + 가로 방향 강화 | ✅ |
| 04-16 | pm | PR #20 프린트 헤더/데이터 정렬 수정 | ✅ |
