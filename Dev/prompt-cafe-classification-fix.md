# Claude Code 실행 프롬프트 — 다음카페 sync game_type 오분류 수정

> 사용법: 아래 긴 블록 전체를 **카페 sync 전용 Claude Code 세션**에 복붙
> 대상 브랜치: subin
> 예상 공수: ~2시간 (코드 30~45분 + 백필 45분 + dry-run·승인·실행 30분)
> 선행 문서: `Dev/cafe-classification-fix-2026-04-21.md` (자세한 근거)

---

## 복붙용 프롬프트 (여기부터 ↓ 맨 아래까지)

```
오늘 작업 시작. 아래 순서로 진행.

## 0. 사전 점검 (CLAUDE.md "오늘 작업 시작" 체크리스트)
1. git remote -v (github.com/bdr-tech/mybdr 확인)
2. git fetch origin --prune + main/dev/subin 차이 요약
3. 현재 브랜치 subin 확인. 아니면 전환
4. .env DATABASE_URL이 개발 DB 식별자(bwoorsgoijvlgutkrcvs) 맞는지 — 값 노출 금지
5. .env.local 로컬 오버라이드 존재 여부
6. 결과 요약 후 "이대로 진행할까요?" 승인 받고 본 작업 시작


## 1. 컨텍스트 (문제 요약)

다음카페 3개 게시판에서 /games 의 경기 유형 탭으로 분류되는 로직에 오분류가 있다.

- IVHA → PICKUP (픽업게임)
- Dilr → GUEST (게스트구인)
- MptT → PRACTICE (연습경기)

현재 src/lib/cafe-sync/upsert.ts 의 resolveGameType() 는 이렇게 동작한다:
  1) board === PRACTICE 면 2 강제 (2026-04-20 핫픽스)
  2) parsed.gameType (본문 키워드 기반) 이 숫자면 그 값 사용
  3) 그 외 board 기본값

문제 패턴:
  - IVHA 게시판 글 본문에 "게스트 모집" 키워드 있으면 → GUEST(1) 로 저장 → 게스트 탭에 표시 (오분류)
  - Dilr 게시판 글 본문에 "픽업게임" 있으면 → PICKUP(0) 으로 저장 → 픽업 탭에 표시 (오분류)
  - MptT 만 이미 board 강제 적용됨

수빈 결정: 운영자가 어느 게시판에 올렸느냐가 1순위 의도. 3개 게시판 모두 board 강제.
parser 의 inferGameType() 은 건드리지 말 것 — vitest 통과 중이고 metadata 힌트로 계속 쓸 예정.


## 2. 작업 순서

### Step A — resolveGameType() 단순화 (src/lib/cafe-sync/upsert.ts)

변경 내용:
  - parsed.gameType 분기 제거
  - 3개 게시판 모두 board.gameType → game_type 1:1 매핑만 남김
    - PICKUP → 0, GUEST → 1, PRACTICE → 2
  - 주석 갱신: "2026-04-20 MptT 강제" → "2026-04-21 3개 게시판 전면 board 강제"
  - 주석에 이유 명시: "운영자 게시판 선택을 1순위로 신뢰. parser 결과는 metadata 힌트로만 보존"

### Step B — upsert 시 metadata 에 힌트 2키 기록

upsert.ts 에서 games 테이블에 쓰기 전, metadata 조립 부분에 조건부 추가:
  - parsed.gameType 이 null 이 아니고 board 기반 숫자값과 다를 때만:
    - metadata.mixed_type_hint = { suggested_type: "PICKUP|GUEST|PRACTICE", reason: "parser_keyword", at: ISO 날짜 }
    - metadata.parser_game_type = parsed.gameType (숫자 0/1/2)
  - 일치하면 두 키 모두 기록하지 않음 (noise 최소화)

### Step C — 테스트 업데이트

src/__tests__/cafe-sync/ 아래 upsert 관련 테스트가 있으면:
  - IVHA + "게스트 모집" 본문 → game_type = 0 + mixed_type_hint 기록됨
  - Dilr + "픽업게임" 본문 → game_type = 1 + mixed_type_hint 기록됨
  - MptT + 모든 경우 → game_type = 2
  - parser 결과와 board 가 일치하면 mixed_type_hint 없음

테스트 파일이 없으면 최소 3 케이스 신규 작성 (describe 1개 + it 3개).

### Step D — 백필 스크립트 신규 작성 (scripts/backfill-cafe-game-type.ts)

  - scripts/_templates/backfill-*.template.ts 패턴 준수
  - dry-run 기본. --execute 로 실제 UPDATE
  - 운영 DB 가드: process.env.DATABASE_URL 이 bwoorsgoijvlgutkrcvs 포함할 때만 실행
  - 대상: games.metadata->>'cafe_board' 가 있고 game_type 이 board 매핑과 다른 행
  - 업데이트:
    - game_type ← board 매핑 값 (0/1/2)
    - metadata.mixed_type_hint ← { suggested_type: <기존 매핑 라벨>, reason: "backfill_2026-04-21", original_game_type: <기존 숫자> }
    - metadata.parser_game_type ← <기존 game_type 숫자>
  - 배치 크기 100 건씩 UPDATE (트랜잭션 분리)
  - 로그 출력:
    - 게시판별 변경 예정 건수 (IVHA/Dilr/MptT × game_type)
    - 상위 5건 dataid + 제목 샘플
    - dry-run/execute 모드 명시

### Step E — dry-run 실행 후 보고

```
npx tsx --env-file=.env.local scripts/backfill-cafe-game-type.ts
```

결과를 아래 형태로 보고:
  - 게시판별 변경 예정 건수 (예: IVHA 12건, Dilr 4건, MptT 0건)
  - 상위 5건 샘플 (dataid, 제목, 기존 type → 변경 후 type)
  - "이 규모로 --execute 해도 될까요?" 로 승인 대기 — 승인 없이 execute 금지

### Step F — 승인 후 execute + 검증

```
npx tsx --env-file=.env.local scripts/backfill-cafe-game-type.ts --execute
```

검증 쿼리 (scripts/inspect-games-cafe-meta.ts 확장 or 임시 인라인):
  - 게시판별 × game_type 조합이 1:1 정합인지 (IVHA 행 중 game_type != 0 = 0 건)
  - mixed_type_hint 가 기록된 행 개수 + 샘플 5건

### Step G — 신규 동기화 smoke

```
npx tsx --env-file=.env.local scripts/sync-cafe.ts --board=all --limit=5 --execute
```

결과 확인:
  - 신규 업서트 된 5건 × 3 게시판 = 최대 15건이 board 와 정합되는지
  - mixed_type_hint 가 의심 본문에만 기록되는지


## 3. 커밋 / PR

커밋 2개로 분리 권장:
  - C1: feat(cafe-sync): resolveGameType 3게시판 전면 board 강제 + mixed_type_hint 힌트 보존
  - C2: feat(cafe-sync): backfill-cafe-game-type.ts + 백필 실행 기록

둘 다 push origin subin 후, 카페 세션 묶음 PR (#C4 가칭) 생성:
  - subin → dev squash
  - 본문에 "변경 요약 / 영향 건수 (게시판별) / 테스트 방법 / 롤백 계획" 4섹션


## 4. knowledge 갱신 (작업 끝나고 반드시)

.claude/knowledge/decisions.md 에 신규 항목:
  - 제목: "2026-04-21 카페 sync 3게시판 전면 board 강제 + parser 힌트 메타데이터화"
  - 이유: 2026-04-20 MptT 핫픽스의 논리를 IVHA/Dilr 에도 확장. 운영자 게시판 선택이 1순위 의도.
  - 효과: 혼재 키워드 글이 parser 에 의해 다른 탭으로 빠지는 오분류 제거.

.claude/knowledge/lessons.md 에 신규 항목:
  - 제목: "parser 키워드 판정을 신뢰하지 말고 운영자의 명시 신호(게시판 선택)를 1순위로 사용"
  - 교훈: inferGameType 같은 추측 로직은 힌트 메타데이터로 보존, 최종 분류는 명시 신호 사용.
  - 참조: errors.md "실측 4/5 오분류 (MptT)" + decisions.md 2026-04-20 MptT 강제 결정

.claude/knowledge/index.md 상단 "최근 추가된 지식" 에 2건 추가.

.claude/scratchpad-cafe-sync.md 작업 로그 1줄.


## 5. 보고 포맷 (수빈에게)

모든 단계 끝나면 아래 형식으로 요약:
  - 변경 파일 목록 (upsert.ts / 백필 스크립트 / 테스트 / knowledge 3종)
  - 백필 영향 건수 (게시판별)
  - mixed_type_hint 기록된 행 수 (혼재 의심 건수)
  - 커밋 해시 2개 + PR 링크
  - 검증 쿼리 결과 (게시판 × game_type 정합 0건 확인)
  - 다음 단계 (admin UI에 mixed_type_hint 필터 추가 등, 이번 작업 범위 밖)


## 6. 제약 (절대 준수)

- 운영 DB 대상 db push / migrate / DELETE 금지
- 스크립트는 dry-run 기본, --execute 수빈 승인 전 금지
- parser 파일 (src/lib/parsers/cafe-game-parser.ts) 은 수정 금지. 호출만 유지.
- games.game_type 이외 필드 덮어쓰기 금지 (venue/city/district/fee/scheduled_at 등)
- 쿠키/secret 값 로그 출력 금지
- 의심 가는 지점에서 막히면 --dry-run 결과 + 에러 로그 그대로 보고하고 멈추기. 임의 판단으로 계속 진행 금지.
```

---

## 사용 방법

1. 위 ```로 감싼 프롬프트 전체를 복사
2. 카페 sync 전용 Claude Code 세션 열기 (본 세션 아님 — 세션 분리 원칙)
3. 붙여넣기
4. Claude Code 가 Step A~G 순서대로 진행하다가 **Step E 끝에서 dry-run 결과를 들고 수빈에게 승인 요청**
5. 승인하면 Step F 실행 → Step G smoke → 커밋/PR/knowledge 갱신
6. 완료 보고 받으면 본 세션에 결과 공유해주세요. scratchpad + weekly-status 에 반영합니다.

## 참고

- 근거 설명 상세본: `Dev/cafe-classification-fix-2026-04-21.md`
- MptT 게시판 핫픽스 선례: `src/lib/cafe-sync/upsert.ts` 127~149 주석 (2026-04-20)
- parser 단위 테스트: `src/__tests__/parsers/cafe-game-parser.test.ts` (건드리지 말 것)
