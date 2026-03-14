# 코드 리뷰 수정 실행 계획서
## 상품화 수준 품질 달성 — mybdr + bdr_stat 동시 수정

```
작성: Dylan (01-기획)
날짜: 2026-03-15
기준: 코드 리뷰 결과 (Critical 3건 / Warning 2건 / Suggestion 4건 / Flutter 3건)
목표: 상품화 수준 — 기능 정확성 + 데이터 무결성 + 크로스플랫폼 일관성
```

---

## 1. 수정 항목 전체 맵

| ID | 분류 | 파일 | 핵심 문제 | 담당 |
|----|------|------|-----------|------|
| C-3 | Critical | `src/lib/validation/match.ts` | batchSyncSchema "live" 상태 누락 | Ethan |
| C-4 | Critical | `src/app/api/v1/recorder/matches/route.ts` | super_admin 쿼리 take 제한 없음 | Ethan |
| C-6 | Critical | `src/app/api/v1/tournaments/[id]/matches/sync/route.ts:241-243` | advanceWinner/updateTeamStandings 실패 silent fail | Ethan |
| W-1-b | 신규 Critical | `src/app/api/live/route.ts` + `src/app/live/page.tsx` | 응답 키 recentCompleted vs recent_completed 불일치 (현재 버그) | Ethan |
| W-1 | Warning | `src/app/api/v1/tournaments/[id]/full-data/route.ts` | API 응답 camelCase/snake_case 이중 변환 검토 | Ethan |
| W-4 | Warning | `src/app/api/v1/recorder/matches/route.ts` | "draft" 대회 경기 노출 — 의도 확인 필요 | 사장 확인 |
| S-1 | Suggestion | 신규: `src/lib/constants/match-status.ts` | 매치 상태 enum 분산 정의 | Ethan |
| S-2 | Suggestion | Flutter: SyncManager, EventQueue, conflictCache | bdr_stat 물리기기 안정성 | Kai |
| S-3 | Suggestion | `src/app/api/live/route.ts` | 공개 엔드포인트 Rate Limiting 없음 | Ethan |
| F-1 | Flutter | bdr_stat 전반 | Android/iOS 디자인 비통일 | Kai |
| F-2 | Flutter | SyncManager, EventQueue | 재시도/dead-letter/TTL 미흡 | Kai |
| F-3 | Flutter | 상태 enum | 서버 상태값과 미동기화 | Kai |

---

## 2. 범위 확정

### In-Scope
- mybdr(Next.js): C-3, C-4, C-6, W-1-b, W-1, S-1, S-3 수정
- bdr_stat(Flutter): S-2, F-1, F-2, F-3 수정
- W-4("draft" 대회 노출) 의도 확인 후 처리

### Out-of-Scope
- Rate Limiter → Upstash Redis 교체 (별도 인프라 작업, Phase 2)
- bdr_stat 신규 기능 추가

### 범위 재분류 (계획 수립 중 코드 직독 후 발견)
**W-1-b (신규 발견)**: `src/app/api/live/route.ts`는 `recentCompleted`(camelCase)로 응답하지만,
`src/app/live/page.tsx:42`에서는 `json.recent_completed`(snake_case)로 읽음.
현재 `/live` 페이지에서 최근 종료 경기가 항상 빈 배열로 표시되는 버그 상태.
C-3, C-4와 같은 Critical 수준으로 격상하여 이번 작업에 포함.

---

## 3. 사장 확인 필요 — W-4

`recorder/matches/route.ts` 44라인에서 주최자(organizer)는 `draft` 상태 대회 경기도 볼 수 있습니다.
외부 기록원에게는 노출되지 않고 주최자에게만 해당합니다.

**옵션 A (현행 유지)** — 주최자가 대회 준비 중에 기록 테스트 가능. 기록원에게는 노출 안 됨.

**옵션 B (draft 제거)** — 실제 진행 중인 대회만 표시. 테스트 목적이면 별도 개발환경 사용.

이 계획서는 **옵션 A(유지)를 기본값**으로 진행합니다. 변경 원하시면 알려주세요.

---

## 4. 실행 단계별 상세 계획

### Phase 1 — Critical 수정 (Ethan, Day 1)

#### 태스크 1-A + 1-B: C-3 + S-1 묶음 처리
- 신규 파일: `src/lib/constants/match-status.ts`
  ```typescript
  export const MATCH_STATUSES = ["scheduled", "live", "in_progress", "completed"] as const;
  export type MatchStatus = typeof MATCH_STATUSES[number];
  ```
- `src/lib/validation/match.ts` batchSyncSchema: `z.enum(["scheduled", "in_progress", "completed"])` → `z.enum(MATCH_STATUSES)`
- `sync/route.ts` singleMatchSyncSchema, `recorder/matches/route.ts` status 필터도 동일 상수 참조
- 검증 기준:
  - bdr_stat이 `status: "live"` 전송 시 400 오류 없이 통과
  - 상태 값이 3개 이상 파일에 하드코딩된 곳 0곳

#### 태스크 1-C: C-4 super_admin 쿼리 take 제한
- 파일: `src/app/api/v1/recorder/matches/route.ts`
- 수정: `prisma.tournamentMatch.findMany({ where: {...}, take: 100, orderBy: [...] })`
- 검증 기준: DB에 200개 이상 경기가 있어도 응답이 100개 이하

#### 태스크 1-D: C-6 post-process 실패 처리 (가장 복잡)
- 파일: `src/app/api/v1/tournaments/[id]/matches/sync/route.ts:241-243`
- 현재 문제: fire-and-forget 패턴. 실패해도 클라이언트는 성공 응답 받음. 후속 복구 불가.
  ```typescript
  // 현재 (문제)
  advanceWinner(matchId).catch((e) => console.error("...", e));
  updateTeamStandings(matchId).catch((e) => console.error("...", e));
  ```
- 수정 방향:
  - `Promise.allSettled`로 두 함수 동시 실행
  - 실패 여부를 구조화 로그 (`[match-sync:post-process]` 태그) + DB 기록
  - 응답 본문에 `post_process_status` 필드 추가 (클라이언트가 재시도 판단 가능)
  ```typescript
  // 수정 후
  const [advanceResult, standingsResult] = await Promise.allSettled([
    advanceWinner(matchId),
    updateTeamStandings(matchId),
  ]);
  const postProcessFailed =
    advanceResult.status === "rejected" || standingsResult.status === "rejected";
  if (postProcessFailed) {
    console.error("[match-sync:post-process] partial failure", {
      matchId: Number(matchId),
      advance: advanceResult.status,
      standings: standingsResult.status,
    });
    // DB 기록 (tournamentMatch.sync_error 컬럼 또는 별도 로그 테이블)
  }
  // 응답에 포함
  post_process_status: postProcessFailed ? "partial_failure" : "ok"
  ```
- 검증 기준:
  - advanceWinner 실패 시 응답에 `post_process_status: "partial_failure"` 포함
  - 콘솔 에러에 `[match-sync:post-process]` 태그 + matchId 포함
  - DB에 실패 이력 기록 (Nora 검증용)

#### 태스크 1-E: W-1-b live API 응답 필드명 통일
- 파일: `src/app/api/live/route.ts`
- 현재: `apiSuccess({ live: ..., recentCompleted: ... })` → camelCase 키
- 소비자: `src/app/live/page.tsx:42` → `json.recent_completed` (snake_case)로 읽음 (현재 버그)
- 수정: `apiSuccess` 내부 snake_case 자동 변환을 믿거나, 명시적으로 `recent_completed` 키 사용
- 검증 기준: `/live` 페이지에서 30분 이내 종료 경기가 실제로 표시됨

### Phase 2 — Warning + Suggestion 수정 (Ethan, Day 2 전반)

#### 태스크 2-A: W-1 full-data 이중 변환 검토
- 파일: `src/app/api/v1/tournaments/[id]/full-data/route.ts`
- 현재 상태: 50~98라인에서 이미 snake_case 키로 수동 빌드 후 `apiSuccess()` 호출
- 문제: `apiSuccess()` 내부 camelCase → snake_case 변환이 다시 일어나면 이중 변환 위험
- 수정 방향:
  - `apiSuccess()` 내부 변환 로직 확인
  - 이미 snake_case 수동 빌드 → 변환 생략 옵션 사용, 또는 내부 빌드를 camelCase로 통일 후 단일 변환
- 검증 기준: Kai가 Flutter에서 `full-data` 응답 파싱 시 필드명 불일치 0건

#### 태스크 2-B: S-3 /api/live Rate Limiting 추가
- 파일: `src/app/api/live/route.ts`
- 현재: 인증 없는 공개 엔드포인트, Rate Limiting 없음
- 수정: 기존 in-memory Rate Limiter 적용 (IP 기준, 60초 30회)
- 제약: Upstash Redis 교체는 Out-of-Scope — in-memory 한계 인지하고 진행
- 검증 기준: 1분 내 31번 연속 호출 시 429 응답

### Phase 3 — Flutter 수정 (Kai, Day 1~2 병렬)

#### 태스크 3-A: F-3 상태 enum 서버 동기화 (Day 1, Ethan과 병렬)
- 파일: bdr_stat 내 MatchStatus enum 정의 파일
- 수정: `scheduled | live | in_progress | completed` 4가지로 통일 (S-1 match-status.ts와 맞춤)
- 검증 기준: Ethan의 `match-status.ts` 상수값과 1:1 대응 확인 → CP-1 체크포인트

#### 태스크 3-B: F-2 SyncManager 안정성 개선 (Day 2)
- 수정 항목:
  - `maxRetries`: 3 → 5 (물리기기 간헐적 네트워크 대응)
  - `EventQueue` dead-letter queue: 최대 재시도 초과 이벤트를 별도 큐에 보존 (로컬 DB)
  - `conflictCache` TTL: 현재 무제한 → 24시간으로 제한
- 검증 기준:
  - 5회 재시도 소진 이벤트가 dead-letter queue에 존재
  - 24시간 이후 conflictCache 항목이 자동 제거됨
  - 물리 Android 기기에서 Wi-Fi 끊김/재연결 시 이벤트 손실 0건

#### 태스크 3-C: F-1 Android/iOS 디자인 통일 (Day 2)
- 기준: iOS 현행 디자인을 마스터로 설정
- 우선 범위: 기록원 연동 화면 (경기 목록, 기록 입력, 점수판)
- 수정 대상: Android 전용 위젯 스타일, 폰트 크기, 색상 토큰, 버튼 높이
- 검증 기준: iOS 시뮬레이터 vs Android 에뮬레이터 동일 화면 스크린샷 비교 → CP-5 체크리스트

---

## 5. 크로스체크 포인트 (Ethan x Kai x Nora)

| 체크포인트 | 참여자 | 확인 내용 | 타이밍 |
|-----------|--------|-----------|--------|
| CP-1 | Ethan + Kai | `match-status.ts` 상수값 vs Flutter MatchStatus enum 1:1 대응 | Day 1 저녁 |
| CP-2 | Ethan + Kai | `full-data` 응답 snake_case 필드 Flutter 파싱 불일치 0건 | Day 2 완료 후 |
| CP-3 | Ethan + Nora | 경기 완료 sync → advanceWinner/updateTeamStandings → DB 상태 변경 end-to-end | Day 1 저녁 |
| CP-4 | Ethan + Nora | `/api/live` 과호출 429 반환, 정상 호출 200 | Day 2 완료 후 |
| CP-5 | Kai + Nora | Android/iOS 스크린샷 비교 — 폰트/색상/여백/버튼 4개 항목 체크리스트 | Day 3 전반 |
| CP-6 | Ethan + Kai + Nora | bdr_stat 경기 완료 sync → mybdr DB 반영 → `/live` 페이지 표시 전체 흐름 | 릴리스 전 |

---

## 6. 완료 정의 (DoD)

모든 항목 체크 후 릴리스 승인.

### mybdr (Next.js)
- [ ] C-3: batchSyncSchema에서 `live` status 허용 확인
- [ ] C-4: super_admin 쿼리 응답 최대 100건
- [ ] C-6: 경기 완료 sync 후 post-process 실패 시 DB 기록 + `post_process_status` 응답 필드
- [ ] W-1-b: `/live` 페이지에서 최근 종료 경기 표시 정상 동작
- [ ] W-1: full-data 응답 이중 변환 없음 확인
- [ ] S-1: `match-status.ts` 단일 파일 존재, 3개 이상 파일이 이를 참조
- [ ] S-3: `/api/live` 60초 30회 초과 시 429 반환

### bdr_stat (Flutter)
- [ ] F-3: Flutter MatchStatus enum이 서버 상수 4개값과 일치
- [ ] F-2: maxRetries=5, dead-letter queue 동작, conflictCache TTL=24시간
- [ ] F-1: 기록원 화면 Android/iOS 체크리스트 (폰트/색상/여백/버튼) 4개 항목 모두 통과

### 크로스체크
- [ ] CP-1 ~ CP-6 전부 통과 (담당자 확인)

---

## 7. 실행 일정

```
Day 1 (Ethan + Kai 병렬)
  Ethan:
    1-A+1-B  C-3 + match-status.ts 생성      (30분)
    1-C      C-4 take:100                    (15분)
    1-D      C-6 post-process 실패 처리      (2~3시간)
    1-E      W-1-b live API 필드명 통일       (30분)
    2-B      S-3 Rate Limiting               (1시간)
  Kai:
    3-A      Flutter 상태 enum 동기화         (1~2시간)

  Day 1 저녁: CP-1 (Ethan+Kai), CP-3 (Ethan+Nora)

Day 2 (Ethan + Kai 병렬)
  Ethan:
    2-A      W-1 full-data 이중 변환 검토     (1~2시간)
  Kai:
    3-B      SyncManager 안정성              (반나절)
    3-C      Android/iOS 디자인 통일          (반나절, 기록원 화면 우선)

  Day 2 저녁: CP-2 (Ethan+Kai), CP-4 (Ethan+Nora)

Day 3 (Nora)
  CP-5      Android/iOS 스크린샷 비교
  CP-6      통합 시나리오 end-to-end 검증
  릴리스 Go/No-Go 판정
```

---

## 8. 리스크

| ID | 리스크 | 확률 | 영향 | 대응 |
|----|--------|------|------|------|
| R-1 | C-6 수정 시 tournamentMatch 테이블에 sync_error 컬럼 없어 마이그레이션 필요 | 중 | 중 | 컬럼 없으면 별도 sync_log 테이블 신규 생성으로 대체 |
| R-2 | full-data apiSuccess() 내부 변환 확인 중 이중 변환 버그 발견 | 저 | 고 | Kai와 실시간 파싱 테스트로 즉시 확인 후 방향 결정 |
| R-3 | Android 디자인 통일 범위가 예상보다 넓어 Day 2 내 완료 불가 | 중 | 저 | 기록원 화면 우선 완료, 나머지는 Phase 2 후보 이동 |
| R-4 | SyncManager dead-letter queue가 기존 이벤트 처리 흐름과 충돌 | 저 | 중 | 기존 로직 건드리지 않고 catch 블록에 별도 큐 저장으로 격리 |

---

## 9. 비고

- S-5(user_name 폴백)는 `full-data/route.ts:50` 확인 결과 이미 적용 완료. 추가 작업 없음.
- W-4("draft" 대회 노출) 기본값 유지. 옵션 B 원하시면 `recorder/matches/route.ts` 44라인 `"draft"` 제거.
- 이 계획서 기준으로 Ethan, Kai가 즉시 착수 가능. 사장 확인 필요 항목은 W-4 단 1건.
