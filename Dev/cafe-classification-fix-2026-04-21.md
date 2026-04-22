# 다음카페 sync game_type 오분류 수정안

> 작성: 2026-04-21 · 작성자: Cowork PM (본 세션)
> 실행 대상: 카페 sync 세션 (Claude Code)
> 관련 파일: `src/lib/cafe-sync/upsert.ts` `src/lib/parsers/cafe-game-parser.ts` `scripts/backfill-games-from-cafe.ts`
> 세션 분리 원칙 준수 — 본 세션에서 문서만 작성, 코드 변경은 카페 세션에서

---

## 1. 사용자 의도 확정

수빈 제공:
- `https://cafe.daum.net/dongarry/IVHA` — **픽업게임**
- `https://cafe.daum.net/dongarry/Dilr` — **게스트구인**
- `https://cafe.daum.net/dongarry/MptT` — **연습경기**
  - (원 메시지에 IVHA URL이 두 번 적혀 있었으나 세 번째 라벨이 "연습경기"인 것으로 보아 MptT 오기로 판단. 이 전제가 틀리면 지적 부탁드림)

현재 `board-map.ts` 설정과 **일치**:
- IVHA → `PICKUP` / prefix `PU` / label "픽업게임"
- Dilr → `GUEST` / prefix `GU` / label "게스트 모집"
- MptT → `PRACTICE` / prefix `PR` / label "연습 경기"

→ **게시판 자체 매핑은 정확**. 문제는 "어느 게임 타입으로 저장하느냐" 의 판단 로직.

## 2. 문제 재현

### 2-1. 현재 로직 (`src/lib/cafe-sync/upsert.ts` `resolveGameType`)

```text
1. board.gameType === "PRACTICE" (MptT) → 무조건 2 반환  ← 2026-04-20 핫픽스
2. parsed.gameType (본문 키워드 기반) 이 0/1/2 중 하나면 그 값 반환  ← 문제 지점
3. 없으면 board 기본값 (PICKUP=0, GUEST=1, PRACTICE=2)
```

### 2-2. 오분류 시나리오

| 케이스 | 게시판 | 본문 키워드 | parser 판정 | 실제 저장 | 표시 위치 |
|--------|--------|-----------|-----------|---------|---------|
| α | **IVHA** (픽업) | "게스트 모집 4명" 포함 | 1 = GUEST | **1 (GUEST)** | 게스트 탭 ❌ |
| β | **Dilr** (게스트) | "픽업게임 한팀 모집" | 0 = PICKUP | **0 (PICKUP)** | 픽업 탭 ❌ |
| γ | **MptT** (연습) | "게스트 모집" 혼입 | 1 = GUEST | 2 (PRACTICE) ✅ | 연습 탭 (2026-04-20부터) |
| δ | IVHA (픽업) | "픽업" 만 | 0 또는 null | 0 ✅ | 픽업 탭 |
| ε | Dilr (게스트) | "게스트모집" + 모집인원 | 1 ✅ | 1 ✅ | 게스트 탭 |

### 2-3. 왜 이렇게 설계됐는가

`upsert.ts` 주석 (2026-04-20):
> "PICKUP/GUEST 게시판은 혼재 글(픽업 게스트 구함 등)이 실제로 많으므로 parser 재분류 결과를 유지 (설계대로)."

→ "혼재 글 처리" 를 parser 에 맡긴 설계. 하지만 실사용에서는 **운영자가 어느 게시판에 올렸느냐가 1차 의도 신호**이고, 혼재 글이라도 게시판 선택을 1순위로 보는 게 표시 위치 혼동을 줄임.

→ MptT 경우 실측에서 4/5 오분류(80%)가 나와 2026-04-20 board 강제로 전환. **같은 논리를 IVHA/Dilr 에도 확장 필요**.

## 3. 수정안

### 3-1. 로직 변경 — **board 강제 (기본) + 힌트 메타데이터 (선택 보존)**

`resolveGameType()` 을 아래처럼 단순화:

```text
// 변경 후 의사코드
function resolveGameType(parsed, board) {
  // 1) board 매핑을 절대 기준으로 삼는다
  if (board.gameType === "PICKUP")   return 0;
  if (board.gameType === "GUEST")    return 1;
  if (board.gameType === "PRACTICE") return 2;
  return 2; // fallback
}

// 그리고 upsert 시 metadata에 parser 판정이 다를 때 힌트 기록:
// metadata.mixed_type_hint = { suggested_type: "GUEST", reason: "keyword:게스트모집" }
// metadata.parser_game_type = 1 (원본 parser 결과)
```

이유:
- **운영자 의도 1순위**: 게시판 선택이 가장 강한 신호. 본문에 키워드가 섞여도 게시판이 최종 의도.
- **단순함**: 분기 3갈래 → 게시판당 1:1. 버그 재발 거의 불가능.
- **정보 손실 없음**: parser 결과는 `metadata.mixed_type_hint` 로 보존. admin UI 에서 "혼재 의심" 필터로 재활용 가능.
- **MptT 로직 흡수**: 이미 2026-04-20에 PRACTICE만 board 강제 → 이번 변경으로 3개 게시판 대칭.

### 3-2. parser 는 건드리지 않는다

`cafe-game-parser.ts` 의 `inferGameType()` 은 유지. 이유:
- vitest 59/59 통과 중 — 회귀 부담
- 결과를 `parsed.gameType` 으로 계속 반환하되, upsert 에서 **소비만 안 함** (힌트로만 기록)
- 향후 admin UI 가 "운영자 실수 의심" 을 보여주고 싶을 때 이 값이 필요

### 3-3. 스키마 변경 없음

- `cafe_posts.board_id` 는 이미 존재 (upsert.ts 234 line, composite unique key 참여)
- `games.metadata` JSON 필드에 `mixed_type_hint` / `parser_game_type` 2 키 추가 (스키마 변경 X — JSON 필드라 자유)

## 4. 과거 데이터 백필

### 4-1. 대상 파악 쿼리 (실행 전 dry-run)

```sql
-- IVHA 게시판인데 game_type != 0 (PICKUP 이어야 함)
SELECT COUNT(*), game_type
FROM games
WHERE metadata->>'cafe_board' = 'IVHA'
GROUP BY game_type;

-- Dilr 게시판인데 game_type != 1 (GUEST 이어야 함)
SELECT COUNT(*), game_type
FROM games
WHERE metadata->>'cafe_board' = 'Dilr'
GROUP BY game_type;

-- MptT 게시판인데 game_type != 2 (PRACTICE 이어야 함) — 2026-04-20 이전 분
SELECT COUNT(*), game_type
FROM games
WHERE metadata->>'cafe_board' = 'MptT'
GROUP BY game_type;
```

### 4-2. 백필 스크립트 스펙

- 파일: `scripts/backfill-cafe-game-type.ts` 신규
- 모드: dry-run 기본, `--execute` 명시 시 UPDATE
- 운영 DB 가드: `DEV_DB_HOST` 화이트리스트 (`bwoorsgoijvlgutkrcvs`) — 다른 백필 스크립트와 동일 관습
- 변경 대상: `games.metadata.cafe_board` 가 있고 board 매핑과 `game_type` 이 다른 경우만
- 업데이트 내용:
  - `game_type` ← board 기반 값
  - `metadata.mixed_type_hint` ← `{ suggested_type: (기존 값), reason: "backfill_2026-04-21", original_parser_type: (기존 값) }`
  - `metadata.parser_game_type` ← (기존 `game_type` 값 보존)
- 로그: 게시판별/변경 전후 카운트 + 상위 5건 dataid·제목 샘플

### 4-3. 순서

1. dry-run 실행해서 건수 확인
2. 수빈 승인 (/games 탭에 어느 정도 영향가는지)
3. `--execute` 로 실제 UPDATE
4. 검증 쿼리 재실행 → 각 게시판 × game_type 조합이 **1:1 정합**인지 확인

## 5. 코드 변경 diff (요약)

### 5-1. `src/lib/cafe-sync/upsert.ts`

```text
- resolveGameType() 의 parsed.gameType 분기 제거
- board.gameType → game_type 1:1 매핑만 남김
- upsert 시 metadata 에 mixed_type_hint / parser_game_type 2키 추가
- 주석 갱신: "2026-04-20 MptT 강제" → "2026-04-21 3개 게시판 전체 board 강제"
```

### 5-2. `src/__tests__/cafe-sync/upsert.test.ts` (있으면)

```text
- IVHA + "게스트 모집" 키워드 → game_type 0 (기존 기대값 수정)
- Dilr + "픽업게임" 키워드 → game_type 1 (기존 기대값 수정)
- MptT 기존 테스트 유지
- 신규: mixed_type_hint 가 기록되는지 검증
```

### 5-3. `scripts/backfill-cafe-game-type.ts` 신규

위 4-2 스펙대로 작성. `scripts/_templates/` 의 `backfill-*.template.ts` 참고.

## 6. 검증 체크리스트

실행 후 다음을 모두 확인:

- [ ] `resolveGameType()` 단위 테스트 3 케이스(각 게시판 × 혼재 키워드) 통과
- [ ] `scripts/sync-cafe.ts --board=all --limit=10 --execute` 실행 → 각 게시판이 올바른 game_type 으로 들어감
- [ ] `/games` 페이지 각 유형 탭(픽업/게스트/연습경기) 이 **게시판 출처와 1:1 일치**
- [ ] 백필 후 `metadata.cafe_board` 와 `game_type` 불일치 건수 = 0
- [ ] `metadata.mixed_type_hint` 가 필요한 케이스에 기록됨 (샘플 5건 직접 확인)
- [ ] `knowledge/decisions.md` 에 "2026-04-21 카페 3게시판 board 강제 규칙 전면 적용" 결정 기록
- [ ] `knowledge/lessons.md` 에 "parser 키워드 판정을 믿지 말고 운영자 게시판 선택을 1순위" 교훈 기록

## 7. 리스크·주의

| 리스크 | 대응 |
|--------|------|
| 운영자가 실제로 다른 게시판에 올린 혼재 글이 많다면 분류가 "게시판 기준"으로 획일화되며 사용자 체감 덜어짐 | `metadata.mixed_type_hint` 가 기록되므로 admin UI에 "혼재 의심 N건" 표시 후 운영자 수동 이동 가능 |
| 백필 시 UPDATE 대량 발생 | dry-run 필수 + 운영 DB 가드 + 단일 트랜잭션 회피(배치 100건 단위) |
| `/games` 탭 개수 급변하여 사용자 혼란 | 수빈 승인 후 실행 + 필요시 admin 로그에 "2026-04-21 분류 체계 정리" 안내 공지 |
| parser 의 `inferGameType()` 을 완전히 제거하면 나중에 admin 힌트 기능 만들 때 없어짐 | **제거하지 않고 결과를 소비만 안 함** — 3-2 원칙 준수 |

## 8. 카페 세션에 전달할 실행 프롬프트

아래 블록을 카페 sync 전용 세션에 그대로 복붙:

```text
다음카페 sync game_type 오분류 수정 실행 — 수정안 Dev/cafe-classification-fix-2026-04-21.md 준수.

단계:
1. 개발 DB 환경 확인 (bwoorsgoijvlgutkrcvs 가드) + 현재 brach subin인지 확인
2. src/lib/cafe-sync/upsert.ts 의 resolveGameType() 을 board 1:1 매핑으로 단순화
   - PRACTICE=2 강제 분기 제거, 3개 게시판 모두 board 기반 고정
   - upsert 시 metadata 에 mixed_type_hint / parser_game_type 2키 추가 (parser 결과가 board 와 다를 때만)
3. 기존 upsert 단위 테스트 있으면 기대값 수정 + mixed_type_hint 기록 케이스 추가
4. scripts/backfill-cafe-game-type.ts 신규 작성
   - scripts/_templates/backfill-*.template.ts 패턴 준수
   - dry-run 기본, --execute 로 UPDATE, 운영 DB 가드
   - 게시판 × game_type 불일치 건만 수정, metadata.mixed_type_hint 기록
5. 먼저 pnpm vitest run upsert 관련 테스트 통과 확인
6. npx tsx --env-file=.env.local scripts/backfill-cafe-game-type.ts 로 dry-run
7. 결과(게시판별 변경 예정 건수)를 수빈에게 보고 후 --execute 승인 대기

검증:
- sync-cafe.ts --execute 재실행 → 게시판 × game_type 1:1 정합
- /games 각 탭이 게시판 출처와 일치
- knowledge/decisions.md + lessons.md 갱신
- 변경 파일 + 영향 건수 커밋 1 또는 2 단위로 분리 후 push origin subin
```

## 9. 요약

**한 줄**: "본문 키워드 기반 자동 분류를 IVHA/Dilr 게시판에서도 포기하고 **운영자의 게시판 선택을 1순위로 신뢰**하도록 `resolveGameType()` 을 3게시판 전부 board 강제로 단순화. parser 결과는 `mixed_type_hint` 로 메타데이터에 보존만 하고 소비 안 함. 과거 데이터는 백필 스크립트로 일괄 보정."

**공수**: 코드 수정 30~45분 + 백필 스크립트 작성 45분 + dry-run·승인·실행 15분 = **~2시간**. 카페 세션에서 단일 PR(#C4 가칭)로 처리 가능.
