/**
 * 다음카페 동기화 Phase 2b — cafe_posts + games upsert 레이어.
 *
 * ──────────────────────────────────────────────────────────────────────────────
 * 왜 이 모듈이 필요한가
 * ──────────────────────────────────────────────────────────────────────────────
 * Phase 2a까지는 콘솔 출력만 했지만 Phase 2b부터는 실제로 DB에 쓴다.
 * 단순 `prisma.games.create` 만으로는 다음 3가지가 깨진다.
 *
 *   1) cafe_posts와 games의 원자성 — 한쪽만 들어가면 역방향 백필 불가능
 *   2) 중복 INSERT 방지 — 같은 dataid 글을 재스캔할 때마다 새 row가 쌓임
 *   3) 운영 DB 오염 — 실수로 운영 DATABASE_URL로 실행되면 복구 불가
 *
 * 이 모듈은 위 3가지를 단일 진입점 `upsertCafeSyncedGame()`으로 해결한다.
 *
 * ──────────────────────────────────────────────────────────────────────────────
 * 설계 결정 (PM 사전 승인)
 * ──────────────────────────────────────────────────────────────────────────────
 *  - organizer_id: 1 (BDR_Admin). 기존 112건과 동일. env `CAFE_SYNC_ORGANIZER_ID`로 override 가능.
 *  - status: 0 (schema default. 기존 112건 중 103건 동일).
 *  - game_type: parsed.gameType ?? board.gameType 매핑 (IVHA=0/Dilr=1/MptT=2).
 *  - scheduled_at: parsed.scheduledAt ?? (crawledAt + 3일). NOT NULL 제약 회피.
 *  - max_participants: parsed.guestCount ?? 10 / fee_per_person: parsed.feePerPerson ?? 0.
 *  - metadata 7키: cafe_dataid, cafe_board, source_url, cafe_author, cafe_created, cafe_comments, cafe_source_id.
 *  - 중복 체크: metadata->>'cafe_dataid' + metadata->>'cafe_board' — 기존 112건은 이 키 없음 → 항상 "새 INSERT".
 *    역방향 백필(기존 112건 연결)은 Phase 2b 후반 별도 승인 단계.
 */

import type { PrismaClient, Prisma } from "@prisma/client";
import type { CafeBoard } from "./board-map";
import { articleUrl } from "./board-map";
import type { ParsedCafeGame } from "@/lib/parsers/cafe-game-parser";
// Phase 2b Step 4 — parseCafeGame 실패 필드를 관대한 정규식으로 보완하는 2단계 fallback.
// parser 는 공식 포맷만 신뢰하므로, 라벨 없는 "4월19일 저녁10시" 같은 본문을 위해 별도 모듈로 분리.
import { extractFallbacks } from "./extract-fallbacks";
// Phase 2b 재수정 — DB 저장 직전 2차 방어 마스킹용.
// 왜: 호출자(sync-cafe.ts)에서 마스킹을 누락해도 평문이 DB 에 절대 들어가지 않게 보장.
// maskPersonalInfo 는 멱등이므로 호출자가 이미 마스킹했어도 결과 동일.
import { maskPersonalInfo } from "@/lib/security/mask-personal-info";

// ─────────────────────────────────────────────────────────────────────────────
// 운영 DB 가드 (1차)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * 개발 DB(Supabase 개발 프로젝트)의 식별자.
 * `DATABASE_URL`에 이 문자열이 **포함되어야** upsert 실행 허용.
 *
 * 왜 이 방식인가:
 *   - 운영 DB URL에는 이 식별자가 없으므로 실수로 .env를 바꿔 넣어도 즉시 abort.
 *   - sync-cafe.ts에도 같은 체크가 있어 2중 방어.
 */
const DEV_DB_IDENTIFIER = "bwoorsgoijvlgutkrcvs";

/**
 * DATABASE_URL이 개발 DB인지 확인하고, 아니면 throw.
 *
 * 호출 시점:
 *   `upsertCafeSyncedGame()` 진입 즉시 (매 레코드마다 실행 — 싸다).
 */
function assertDevDatabase(): void {
  const url = process.env.DATABASE_URL ?? "";
  if (!url.includes(DEV_DB_IDENTIFIER)) {
    throw new Error(
      `🛑 운영 DB 가드(upsert.ts): DATABASE_URL이 개발 DB가 아닙니다. ` +
        `개발 DB 식별자 "${DEV_DB_IDENTIFIER}"를 포함해야 실행 가능합니다.`,
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 입력 타입
// ─────────────────────────────────────────────────────────────────────────────

/**
 * upsert 한 건에 필요한 데이터 묶음.
 * sync-cafe.ts가 BoardItem + ArticleFetchResult를 합쳐서 넘긴다.
 */
export interface CafeSyncInput {
  /** 대상 게시판 (IVHA/Dilr/MptT) */
  board: CafeBoard;
  /** 카페 게시글 고유 id */
  dataid: string;
  /**
   * dataid 를 정수로 변환한 값 (선택).
   *
   * [2026-04-20] 정렬 tie-break 2차키용. `metadata.cafe_article_id` (Int) 에 저장된다.
   * 왜 optional: 과거 스크립트/테스트가 dataid 만 넘길 수 있어 하위 호환 유지.
   *              없으면 metadata.cafe_article_id 는 기록되지 않고 정렬 시 "후순위"로 밀린다.
   */
  dataidNum?: number;
  /** 게시글 제목 */
  title: string;
  /** 작성자 닉네임 (없으면 빈 문자열) */
  author: string;
  /** 추출된 본문 텍스트 (마스킹 전 원본) */
  content: string;
  /** 게시글 작성 시각 (HTML에서 추출 성공 시) */
  postedAt: Date | null;
  /** 크롤 시각 (호출자가 new Date()로 주입) */
  crawledAt: Date;
  /** parseCafeGame 결과. null이면 본문 파싱 실패 — 이 경우 game은 스킵하고 cafe_post만 저장 */
  parsed: ParsedCafeGame | null;
}

/**
 * 단건 처리 결과 — sync-cafe.ts 최종 요약용.
 */
export interface CafeSyncResult {
  /** cafe_posts 처리 결과 */
  cafePost: "created" | "updated" | "failed";
  /** games 처리 결과 — null이면 parsed 없어서 스킵 */
  game: "inserted" | "skipped_duplicate" | "skipped_no_parse" | "failed" | null;
  /** cafe_post id (성공 시). 실패 시 null */
  cafePostId: bigint | null;
  /** game id (insert 성공 시). 실패/스킵 시 null */
  gameId: bigint | null;
  /** 실패 사유 (있을 때만) */
  error?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// 내부 헬퍼
// ─────────────────────────────────────────────────────────────────────────────

/**
 * board → game_type 숫자 매핑.
 *
 * [2026-04-21] **3개 게시판 전체 board 강제** (PM 승인):
 *   2026-04-20 에 MptT(PRACTICE) 만 board 강제로 바꿨는데,
 *   IVHA/Dilr 에서도 같은 오분류 패턴 발견 (본문에 타 유형 키워드 혼입 시
 *   parser 가 GUEST/PICKUP 로 재분류 → 실제 의도와 탭 표시 불일치).
 *   운영자가 **어느 게시판에 올렸는가** 가 가장 강한 의도 신호이므로
 *   board → game_type 1:1 매핑을 절대 기준으로 삼는다.
 *
 *   parser 결과(parsed.gameType) 는 소비하지 않고, 대신
 *   `buildMetadataHints()` 에서 metadata.mixed_type_hint 로 보존한다
 *   (admin UI 의 "혼재 의심" 필터 재활용 대비).
 *
 * export 이유: 백필 스크립트(scripts/backfill-cafe-game-type.ts) 에서
 *   동일 매핑을 재사용하기 위해 공개.
 */
export function resolveGameType(board: CafeBoard): number {
  // 1:1 매핑만 남김 — parser 결과 분기 제거 (2026-04-21)
  if (board.gameType === "PICKUP") return 0;
  if (board.gameType === "GUEST") return 1;
  if (board.gameType === "PRACTICE") return 2;
  return 2; // 이론상 도달 불가 — CafeBoard.gameType 은 3가지 유니온
}

/**
 * parser 재분류 결과가 board 와 다를 때 metadata 힌트 객체 생성.
 *
 * 왜 분리했나 (2026-04-21):
 *   - 단위 테스트 가능 (DB 없이 pure function 검증)
 *   - insertGameFromCafe 와 previewUpsert 두 곳에서 같은 로직 재사용
 *   - 분기 조건이 4 단계(null/undefined/일치/불일치) 라 조립 지점에
 *     ternary 쌓으면 가독성 나빠짐
 *
 * 반환 규칙:
 *   - parsed === null                              → {}  (파서 실패, 힌트 없음)
 *   - parsed.gameType == null/undefined            → {}  (파서가 미분류)
 *   - parsed.gameType === resolvedType             → {}  (의도 일치, 힌트 불필요)
 *   - 불일치                                         → { mixed_type_hint, parser_game_type }
 *
 * - mixed_type_hint.suggested_type: 문자열 라벨 ("PICKUP"/"GUEST"/"PRACTICE")
 * - mixed_type_hint.reason: "parser_mismatch_board_forced" (고정)
 * - mixed_type_hint.original_parser_type: parser 가 뽑은 숫자 (0/1/2)
 * - parser_game_type: parser 가 뽑은 숫자 그대로 (top-level 복제 — admin 쿼리 편의)
 */
type GameTypeLabel = "PICKUP" | "GUEST" | "PRACTICE";
function labelOfGameType(n: number): GameTypeLabel {
  if (n === 0) return "PICKUP";
  if (n === 1) return "GUEST";
  return "PRACTICE"; // 2 또는 이론상 도달 불가
}

export interface MetadataHints {
  mixed_type_hint?: {
    suggested_type: GameTypeLabel;
    reason: "parser_mismatch_board_forced";
    original_parser_type: 0 | 1 | 2;
  };
  parser_game_type?: 0 | 1 | 2;
}

export function buildMetadataHints(
  board: CafeBoard,
  parsed: ParsedCafeGame | null,
  resolvedType: number,
): MetadataHints {
  // 파서가 본문 판정 못한 경우 힌트 없음
  if (!parsed) return {};
  if (parsed.gameType == null) return {};
  // board 강제 결과와 파서 결과가 같으면 혼재 글 아님
  if (parsed.gameType === resolvedType) return {};

  const n = parsed.gameType as 0 | 1 | 2;
  return {
    mixed_type_hint: {
      suggested_type: labelOfGameType(n),
      reason: "parser_mismatch_board_forced",
      original_parser_type: n,
    },
    parser_game_type: n,
  };
}

/**
 * scheduled_at NOT NULL 제약 회피용 fallback.
 * 3일 뒤로 설정 — "미정" 의미 + 과거 필터에 안 잡히도록.
 */
function fallbackScheduledAt(crawledAt: Date): Date {
  const d = new Date(crawledAt.getTime() + 3 * 24 * 60 * 60 * 1000);
  return d;
}

/**
 * game_id 생성: `{prefix}-CAFE-{dataid}`.
 * 예: PU-CAFE-3926, GU-CAFE-12345, PR-CAFE-99.
 *
 * 왜 이 포맷:
 *   - prefix는 board 기반이라 딱 1:1 매칭
 *   - "CAFE" 토큰으로 카페 출처 즉시 식별
 *   - dataid가 유일성 확보 (중복 시 Prisma unique constraint가 걸러줌)
 */
function buildGameId(board: CafeBoard, dataid: string): string {
  return `${board.prefix}-CAFE-${dataid}`;
}

/**
 * cafe_source_id 포맷 — metadata에 기록하는 추적 식별자.
 * game_id와 동일 규칙 (D1-B 스펙).
 */
function buildCafeSourceId(board: CafeBoard, dataid: string): string {
  return `${board.prefix}-CAFE-${dataid}`;
}

/**
 * organizer_id 결정 — env override 지원.
 * 기본 1 (BDR_Admin). 숫자 파싱 실패 시 1 fallback.
 */
function resolveOrganizerId(): bigint {
  const raw = process.env.CAFE_SYNC_ORGANIZER_ID;
  if (!raw) return BigInt(1);
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 1) return BigInt(1);
  return BigInt(Math.floor(n));
}

// ─────────────────────────────────────────────────────────────────────────────
// cafe_posts upsert
// ─────────────────────────────────────────────────────────────────────────────

/**
 * cafe_posts 테이블에 1건 upsert.
 *
 * 유일성 기준: (cafe_code, board_id, dataid) — schema.prisma @@unique
 * 동일 글 재스캔 시: content/title/author/views_count 등을 최신값으로 갱신.
 *
 * 이 함수는 `upsertCafeSyncedGame()` 내 트랜잭션에서만 호출된다.
 * 외부에서 직접 부르지 말 것 (트랜잭션 바깥 호출 방지용으로 export 안 함).
 */
async function upsertCafePost(
  tx: Prisma.TransactionClient,
  input: CafeSyncInput,
): Promise<bigint> {
  const now = new Date();
  const cafeCode = "dongarry"; // board-map.CAFE_CODE 와 동기화. 직접 쓰는 이유: tx 내 import 체인 단축
  const originalUrl = articleUrl(input.board, input.dataid);

  const row = await tx.cafe_posts.upsert({
    where: {
      // composite unique key @@unique([cafe_code, board_id, dataid], map: "idx_cafe_posts_unique")
      // Prisma는 map 이름과 무관하게 컬럼 조합 기반 이름을 생성 → `cafe_code_board_id_dataid`
      cafe_code_board_id_dataid: {
        cafe_code: cafeCode,
        board_id: input.board.id,
        dataid: input.dataid,
      },
    },
    update: {
      title: input.title,
      content: input.content,
      author: input.author || null,
      original_url: originalUrl,
      crawled_at: input.crawledAt,
      updated_at: now,
    },
    create: {
      cafe_code: cafeCode,
      board_id: input.board.id,
      board_name: input.board.label,
      dataid: input.dataid,
      title: input.title,
      content: input.content,
      author: input.author || null,
      original_url: originalUrl,
      crawled_at: input.crawledAt,
      created_at: now,
      updated_at: now,
    },
  });

  return row.id;
}

// ─────────────────────────────────────────────────────────────────────────────
// games insert
// ─────────────────────────────────────────────────────────────────────────────

/**
 * metadata 기준 games 중복 존재 여부 체크.
 *
 * 왜 $queryRaw인가:
 *   - Prisma가 JSON path 쿼리를 공식 지원하지 않음 (Prisma 6.x 기준).
 *   - metadata::jsonb ->> 'cafe_dataid' 로 직접 조회.
 *
 * 기존 112건은 cafe_dataid 키가 없으므로 이 쿼리로는 안 걸린다 → 항상 "중복 없음" 판정.
 * 역방향 백필로 112건에 metadata를 채우는 작업은 Phase 2b 후반 별도 승인.
 */
async function findExistingGameByCafeMetadata(
  tx: Prisma.TransactionClient,
  boardId: string,
  dataid: string,
): Promise<bigint | null> {
  const rows = await tx.$queryRaw<Array<{ id: bigint }>>`
    SELECT id FROM games
    WHERE metadata->>'cafe_dataid' = ${dataid}
      AND metadata->>'cafe_board' = ${boardId}
    LIMIT 1
  `;
  return rows.length > 0 ? rows[0].id : null;
}

/**
 * games 테이블에 새 row insert (cafe 동기화 전용).
 *
 * 호출 조건:
 *   - parsed !== null (parseCafeGame 성공)
 *   - findExistingGameByCafeMetadata 결과가 null (중복 없음)
 */
async function insertGameFromCafe(
  tx: Prisma.TransactionClient,
  input: CafeSyncInput,
): Promise<bigint> {
  if (!input.parsed) {
    throw new Error("insertGameFromCafe: parsed is null — 호출 전 체크 누락");
  }

  const now = new Date();
  const parsed = input.parsed;
  // [2026-04-21] board 강제 매핑 — parsed.gameType 무시. 혼재 글은 hints 로 기록.
  const gameType = resolveGameType(input.board);
  const hints = buildMetadataHints(input.board, parsed, gameType);
  const gameId = buildGameId(input.board, input.dataid);
  const organizerId = resolveOrganizerId();

  // Phase 2b Step 4 — parser 실패 필드 2단계 fallback.
  // 왜 여기서 한 번 계산: 아래 5개 필드(scheduledAt/fee/guestCount/skill/city/district)
  // 각각 동일한 content 를 여러 번 스캔하기보다 한 번에 뽑아두고 체인으로 소비한다.
  const extracted = extractFallbacks(input.content, input.crawledAt);

  // fallback 체인 — parsed(공식 포맷) → extracted(관대 정규식) → 상수 fallback
  const scheduledAt =
    parsed.scheduledAt ?? extracted.scheduledAt ?? fallbackScheduledAt(input.crawledAt);
  const feePerPerson = parsed.feePerPerson ?? extracted.fee ?? 0;
  // guestCount 는 "0"(미기재 의미) 을 유효값으로 받아들이지 않음 — 0 이면 한 단계 더 내려감.
  const maxParticipants =
    parsed.guestCount && parsed.guestCount > 0
      ? parsed.guestCount
      : extracted.guestCount && extracted.guestCount > 0
        ? extracted.guestCount
        : 10;
  // skillLevel — parser 에 로직 없으므로 extracted 우선, 못 찾으면 "all" 로 게임 목록 필터와 일관.
  const skillLevel = extracted.skillLevel ?? "all";
  const city = parsed.city ?? extracted.city ?? null;
  const district = parsed.district ?? extracted.district ?? null;
  // Phase 2b 품질 보강: venue 도 fallback 체인 적용 (parsed → extracted → null).
  //   id=397 실측: parser 가 "장소 :" 라벨 변형 못 잡아 null, extracted 가 구제.
  const venueName = parsed.venueName ?? extracted.venueName ?? null;

  // metadata 8키 + [2026-04-21] 혼재 글 힌트 (조건부 0~2키 추가)
  //
  // 왜 cafe_article_id (Int) 를 별도 저장:
  //   - listGames 정렬에서 `created_at desc` 동률일 때 2차 tie-break 키로 사용.
  //   - cafe_dataid 는 string 이라 수치 비교가 안 되고, 저장 시점의 타입 일관성을 위해
  //     JSON 안에 Int 로 직렬화된 복제본을 둔다.
  //   - dataidNum 이 optional 이라 누락 시 undefined → JSON 키 자체 생략(JSON.stringify 규칙).
  //     이 경우 정렬에서 null 로 취급되어 같은 분 안에서 뒤로 밀릴 뿐, 기능 이상 없음.
  //
  // 왜 hints 를 spread:
  //   - buildMetadataHints 가 빈 객체 또는 2키 객체를 반환 → 불일치 케이스에만 metadata 에 섞임.
  //   - 일치 케이스에선 mixed_type_hint / parser_game_type 키 자체가 없어 스토리지 깨끗.
  const metadata = {
    cafe_dataid: input.dataid,
    cafe_article_id: input.dataidNum, // ← 8번째 키 (정렬 tie-break 용, Int)
    cafe_board: input.board.id,
    source_url: articleUrl(input.board, input.dataid),
    cafe_author: input.author || null,
    cafe_created: input.postedAt ? input.postedAt.toISOString() : null,
    cafe_comments: [], // Phase 2b에선 아직 댓글 수집 안 함. 빈 배열로 스키마만 확보.
    cafe_source_id: buildCafeSourceId(input.board, input.dataid),
    ...hints, // [2026-04-21] board 와 parser 판정 불일치 시 mixed_type_hint + parser_game_type
  } as const;

  const row = await tx.games.create({
    data: {
      game_id: gameId,
      title: input.title,
      game_type: gameType,
      organizer_id: organizerId,
      city,
      district,
      venue_name: venueName,
      scheduled_at: scheduledAt,
      max_participants: maxParticipants,
      fee_per_person: feePerPerson,
      skill_level: skillLevel, // Phase 2b Step 4 — 필터(SKILL_OPTIONS) 4단계 키와 일관
      status: 0, // 기존 관례: 103/112건이 status=0
      description: input.content.slice(0, 2000), // 너무 긴 본문 차단 (게시판 평균 300자 수준)
      author_nickname: input.author || null,
      metadata: metadata as unknown as Prisma.InputJsonValue,
      // [2026-04-20] games.created_at = 카페 원본 게시 시각(input.postedAt) 우선 저장.
      //   왜: /games 목록이 `orderBy: created_at desc` 로 정렬되는데, 기본 now 를 넣으면
      //   "우리 DB INSERT 순서"가 기준이 되어 카페 게시 시간과 어긋남 (사용자 지적).
      //   postedAt 을 created_at 로 저장하면 정렬이 자연히 "카페 최신 → 과거" 가 된다.
      //   postedAt 이 null 이면 now 로 fallback (일반 게임은 이 코드 경로를 타지 않음).
      created_at: input.postedAt ?? now,
      updated_at: now,
    },
  });

  return row.id;
}

// ─────────────────────────────────────────────────────────────────────────────
// 단일 진입점 — sync-cafe.ts에서 호출
// ─────────────────────────────────────────────────────────────────────────────

/**
 * 카페 1건 동기화 (cafe_posts + games 원자 처리).
 *
 * 동작:
 *   1) assertDevDatabase() — 운영 DB 가드 (1차)
 *   2) prisma.$transaction:
 *      a) cafe_posts upsert (created/updated)
 *      b) parsed 있고 기존 game 없으면 games insert (inserted)
 *      c) parsed 없으면 "skipped_no_parse"
 *      d) 기존 game 있으면 "skipped_duplicate"
 *   3) 실패 시 트랜잭션 롤백 + CafeSyncResult.failed 반환 (throw 하지 않음 — 스크립트가 계속 진행)
 *
 * 왜 throw 안 하고 result.failed로 반환하나:
 *   - 30~60건 배치 처리 중 1건 실패로 전체 중단되면 재실행 복잡.
 *   - 실패는 배열에 모아 최종 요약에 찍고 사용자가 원인 파악 후 재시도.
 *   - 단, 운영 DB 가드 실패는 throw (전체 중단이 올바름).
 */
export async function upsertCafeSyncedGame(
  prisma: PrismaClient,
  input: CafeSyncInput,
): Promise<CafeSyncResult> {
  // 1차 가드 — throw 허용 (전체 중단 의도)
  assertDevDatabase();

  // ⚠️ 2차 방어 마스킹 (9가드 #5) — 호출자 실수 대비 마지막 안전망.
  //   왜 input 을 복제: 호출자가 원본 content 를 다른 곳(로그 등)에 재사용할 수 있어
  //   spread 로 새 객체를 만들고 content 만 교체. 원본 객체는 건드리지 않는다.
  //   maskPersonalInfo 는 멱등 — 이미 마스킹된 값이라도 동일 결과(`*`는 더 이상 매칭 안 됨).
  const safeInput: CafeSyncInput = {
    ...input,
    content: maskPersonalInfo(input.content),
  };

  try {
    return await prisma.$transaction(async (tx) => {
      // (a) cafe_posts upsert
      const cafePostId = await upsertCafePost(tx, safeInput);

      // parsed 없으면 game은 스킵 (parsed 참조는 content 와 무관하므로 원본 input OK)
      if (!safeInput.parsed) {
        return {
          cafePost: "created" as const, // upsert는 created/updated 구분 어려움. 다음 줄에서 추후 보정.
          game: "skipped_no_parse" as const,
          cafePostId,
          gameId: null,
        };
      }

      // (b) 기존 game 존재 체크 (board.id + dataid 만 사용 — content 무관)
      const existingId = await findExistingGameByCafeMetadata(tx, safeInput.board.id, safeInput.dataid);
      if (existingId !== null) {
        return {
          cafePost: "created" as const,
          game: "skipped_duplicate" as const,
          cafePostId,
          gameId: existingId,
        };
      }

      // (c) games insert — ⚠️ safeInput 전달 필수. games.description 에 마스킹된 content 저장.
      const gameId = await insertGameFromCafe(tx, safeInput);
      return {
        cafePost: "created" as const,
        game: "inserted" as const,
        cafePostId,
        gameId,
      };
    });
  } catch (err) {
    // 운영 DB 가드 throw는 위에서 이미 처리됨. 여기는 트랜잭션 내 에러만.
    const msg = err instanceof Error ? err.message : String(err);
    return {
      cafePost: "failed",
      game: "failed",
      cafePostId: null,
      gameId: null,
      error: msg,
    };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// dry-run 미리보기용 (DB 접근 0)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * --execute 없을 때 "이 입력이 들어가면 어떻게 생길까"를 미리 보여주는 헬퍼.
 *
 * DB 전혀 안 건드림. sync-cafe.ts가 콘솔 출력에만 사용.
 */
export function previewUpsert(input: CafeSyncInput): {
  gameId: string;
  gameType: number;
  scheduledAt: string;
  scheduledAtSource: "parsed" | "extracted" | "fallback";
  fee: number;
  feeSource: "parsed" | "extracted" | "fallback";
  maxParticipants: number;
  maxParticipantsSource: "parsed" | "extracted" | "fallback";
  skillLevel: string;
  skillLevelSource: "extracted" | "fallback";
  city: string | null;
  citySource: "parsed" | "extracted" | "fallback";
  district: string | null;
  districtSource: "parsed" | "extracted" | "fallback";
  venueName: string | null;
  venueNameSource: "parsed" | "extracted" | "fallback";
  willInsertGame: boolean;
  metadata: Record<string, unknown>;
} {
  const parsed = input.parsed;
  // [2026-04-21] insert 경로와 동일한 board 강제 매핑 — 미리보기 결과 일관성 유지.
  const gameType = resolveGameType(input.board);
  const hints = buildMetadataHints(input.board, parsed, gameType);
  // Phase 2b Step 4 — 실제 insert 와 동일한 체인을 dry-run 미리보기에서도 적용.
  // 로그 라인에 "어느 단계에서 값이 왔는가"를 표시하기 위해 *Source 필드도 함께 계산.
  const extracted = extractFallbacks(input.content, input.crawledAt);

  let scheduledAt: Date;
  let scheduledAtSource: "parsed" | "extracted" | "fallback";
  if (parsed?.scheduledAt) {
    scheduledAt = parsed.scheduledAt;
    scheduledAtSource = "parsed";
  } else if (extracted.scheduledAt) {
    scheduledAt = extracted.scheduledAt;
    scheduledAtSource = "extracted";
  } else {
    scheduledAt = fallbackScheduledAt(input.crawledAt);
    scheduledAtSource = "fallback";
  }

  let fee: number;
  let feeSource: "parsed" | "extracted" | "fallback";
  if (parsed?.feePerPerson !== undefined) {
    fee = parsed.feePerPerson;
    feeSource = "parsed";
  } else if (extracted.fee !== null) {
    fee = extracted.fee;
    feeSource = "extracted";
  } else {
    fee = 0;
    feeSource = "fallback";
  }

  let maxParticipants: number;
  let maxParticipantsSource: "parsed" | "extracted" | "fallback";
  if (parsed?.guestCount && parsed.guestCount > 0) {
    maxParticipants = parsed.guestCount;
    maxParticipantsSource = "parsed";
  } else if (extracted.guestCount && extracted.guestCount > 0) {
    maxParticipants = extracted.guestCount;
    maxParticipantsSource = "extracted";
  } else {
    maxParticipants = 10;
    maxParticipantsSource = "fallback";
  }

  const skillLevel = extracted.skillLevel ?? "all";
  const skillLevelSource: "extracted" | "fallback" =
    extracted.skillLevel !== null ? "extracted" : "fallback";

  let city: string | null;
  let citySource: "parsed" | "extracted" | "fallback";
  if (parsed?.city) {
    city = parsed.city;
    citySource = "parsed";
  } else if (extracted.city) {
    city = extracted.city;
    citySource = "extracted";
  } else {
    city = null;
    citySource = "fallback";
  }

  let district: string | null;
  let districtSource: "parsed" | "extracted" | "fallback";
  if (parsed?.district) {
    district = parsed.district;
    districtSource = "parsed";
  } else if (extracted.district) {
    district = extracted.district;
    districtSource = "extracted";
  } else {
    district = null;
    districtSource = "fallback";
  }

  // Phase 2b 품질 보강: venue 도 source 추적
  let venueName: string | null;
  let venueNameSource: "parsed" | "extracted" | "fallback";
  if (parsed?.venueName) {
    venueName = parsed.venueName;
    venueNameSource = "parsed";
  } else if (extracted.venueName) {
    venueName = extracted.venueName;
    venueNameSource = "extracted";
  } else {
    venueName = null;
    venueNameSource = "fallback";
  }

  return {
    gameId: buildGameId(input.board, input.dataid),
    gameType,
    scheduledAt: scheduledAt.toISOString(),
    scheduledAtSource,
    fee,
    feeSource,
    maxParticipants,
    maxParticipantsSource,
    skillLevel,
    skillLevelSource,
    city,
    citySource,
    district,
    districtSource,
    venueName,
    venueNameSource,
    willInsertGame: parsed !== null,
    // 실제 insert 경로(insertGameFromCafe)와 동일한 8키 + hints 구성 — 미리보기 정확성 유지.
    metadata: {
      cafe_dataid: input.dataid,
      cafe_article_id: input.dataidNum, // ← 8번째 키 (Int, tie-break 2차키)
      cafe_board: input.board.id,
      source_url: articleUrl(input.board, input.dataid),
      cafe_author: input.author || null,
      cafe_created: input.postedAt ? input.postedAt.toISOString() : null,
      cafe_comments: [],
      cafe_source_id: buildCafeSourceId(input.board, input.dataid),
      ...hints, // [2026-04-21] 혼재 글 힌트 (insert 와 동일)
    },
  };
}

// ═════════════════════════════════════════════════════════════════════════════
// [2026-04-21] Community 게시판(일반 4종) upsert — community_posts 테이블 타겟
// ═════════════════════════════════════════════════════════════════════════════
//
// 대상: N54V(자유) / IVd2(익명) / E7hL(BDR칼럼) / bWL(구인구팀)
//
// 설계 결정 (PM 확정 Q1~Q4):
//   - Q1: 시스템 유저 = 카페 봇 1명 (email: cafe-bot@mybdr.local)
//   - Q2: 카테고리 key 재사용 — `general` / `anonymous`(신규) / `review` / `recruit`
//         ("대회후기" → "BDR칼럼" 라벨 변경은 UX 세션 담당, key 는 `review` 유지)
//   - Q3: 익명게시판(IVd2) 은 author_nickname = "익명" 강제, images.cafe_author = null
//   - Q4: 1차 이전 = E7hL + bWL 먼저 → 규모 검증 → 자유/익명 후속
//
// 중복 방지:
//   - community_posts 에 `cafe_source_id` 컬럼 없음 (Prisma schema 변경 금지 — 운영 DB 가드)
//   - `images` JSON 내 `cafe_source_id` 키로 관리 → `$queryRaw` + `images->>'cafe_source_id'` 매칭
//   - source_id 포맷: `PU-CAFE-<boardId>-<dataid>` (boardId 포함 필수, 게시판 간 dataid 충돌 방지)

/** 카페 봇 유저 email — seed-cafe-bot-user.ts 와 동일 상수 */
export const CAFE_BOT_EMAIL = "cafe-bot@mybdr.local";

/**
 * 런타임 캐시: 카페 봇 user_id 를 프로세스당 1회만 DB 조회.
 *
 * 왜 캐시:
 *   - backfill 이 수백~천 건 upsert 하면서 매번 User.findUnique 호출 시 N+1 느려짐.
 *   - 캐시 히트 시 DB 왕복 0.
 *
 * 초기값 null — 최초 upsert 호출 시 lazy 로드.
 */
let CAFE_BOT_USER_ID: bigint | null = null;

/**
 * 카페 봇 user_id 를 반환. 없으면 throw (seed 먼저 실행 요구).
 *
 * 호출자:
 *   - upsertCommunityPostFromCafe (내부)
 *   - backfill-cafe-community.ts 등 스크립트에서 사전 로드 가능
 */
export async function resolveCafeBotUserId(prisma: PrismaClient): Promise<bigint> {
  if (CAFE_BOT_USER_ID !== null) return CAFE_BOT_USER_ID;
  const bot = await prisma.user.findUnique({ where: { email: CAFE_BOT_EMAIL } });
  if (!bot) {
    throw new Error(
      `🛑 카페 봇 유저 없음 — \`npx tsx scripts/seed-cafe-bot-user.ts --execute\` 먼저 실행 필요. ` +
        `(email: ${CAFE_BOT_EMAIL})`,
    );
  }
  CAFE_BOT_USER_ID = bot.id;
  return bot.id;
}

/**
 * 테스트/재초기화용 — 캐시 리셋. 프로덕션 경로에선 호출 안 함.
 */
export function __resetCafeBotUserIdCacheForTest(): void {
  CAFE_BOT_USER_ID = null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Community 입력/출력 타입
// ─────────────────────────────────────────────────────────────────────────────

export interface CafeCommunityInput {
  /** 대상 게시판 (target="community_posts" 만 허용) */
  board: CafeBoard;
  /** 카페 dataid (string) */
  dataid: string;
  /** dataid 정수 변환 — tie-break/정렬 용 (optional) */
  dataidNum?: number;
  /** 원본 제목 (마스킹 전) */
  title: string;
  /** 원본 작성자 닉네임 (anonymousAuthor 면 저장 안 됨) */
  author: string;
  /** 본문 (마스킹 전 — upsertCommunityPostFromCafe 내에서 2차 마스킹) */
  content: string;
  /** 작성 시각 (없으면 now fallback) */
  postedAt: Date | null;
  /** 크롤 시각 */
  crawledAt: Date;
  /** 본문에서 추출한 이미지 URL 배열 (없으면 []) */
  imageUrls?: string[];
  /** 댓글 배열 — Phase 2b 시점은 빈 배열 기본 */
  comments?: unknown[];
}

export type CommunityUpsertResult =
  | {
      action: "created";
      postId: bigint;
    }
  | {
      action: "skipped_duplicate";
      postId: bigint;
    }
  | {
      action: "failed";
      error: string;
    };

// ─────────────────────────────────────────────────────────────────────────────
// Pure helpers — 단위 테스트용 (DB 무관)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * 커뮤니티용 cafe_source_id 포맷.
 *
 * 왜 games 의 `buildCafeSourceId` 와 다른가:
 *   - games 는 prefix(PU/GU/PR) 가 board 타입별로 고정되어 있었음 → `PU-CAFE-3928`
 *   - community 는 prefix 개념 없음 + 4게시판 모두 dataid 체계 달라 **board id 명시 필수**
 *   - 포맷: `COM-CAFE-<boardId>-<dataid>` (COM = Community)
 *
 * 중복 방지 핵심: 게시판 간 dataid 충돌 방어 (Dilr 320221 vs bWL 320221 별개 레코드)
 */
export function buildCommunityCafeSourceId(boardId: string, dataid: string): string {
  return `COM-CAFE-${boardId}-${dataid}`;
}

/**
 * author_nickname 결정 — 익명게시판(anonymousAuthor=true) 이면 "익명" 고정.
 *
 * 왜 헬퍼로 분리:
 *   - 단위 테스트 용이 (DB 무관 pure function)
 *   - upsert 와 preview 에서 동일 로직 공유
 */
export function resolveCommunityAuthorNickname(board: CafeBoard, author: string): string {
  if (board.anonymousAuthor) return "익명";
  return author || "카페 회원"; // 빈 문자열 방어
}

/**
 * community_posts.images JSON 객체 조립 — 원본 이미지 URL 배열 + 카페 메타.
 *
 * 스키마(schema.prisma L815 주석): "이미지 URL 배열 + 카페 메타 (cafe_source_id, cafe_author, cafe_comments)"
 *
 * 구조: 객체 (PM 결정 — 메타 쿼리 가능, `images->>'cafe_source_id'` 로 중복 체크)
 *
 * 필드:
 *   - cafe_source_id: 중복 방지 키
 *   - cafe_board: 게시판 id (N54V/IVd2/E7hL/bWL)
 *   - cafe_dataid: 원본 dataid (string)
 *   - cafe_article_id: dataidNum (Int, 정렬 tie-break 용)
 *   - cafe_author: 원본 닉네임 (익명게시판이면 null — Q3 "의도 존중")
 *   - source_url: 원본 URL
 *   - cafe_comments: 댓글 배열 (Phase 2b 기본 [])
 *   - urls: 본문 이미지 URL 배열
 */
export function buildCommunityImagesMeta(input: CafeCommunityInput): Record<string, unknown> {
  const isAnonymous = !!input.board.anonymousAuthor;
  return {
    cafe_source_id: buildCommunityCafeSourceId(input.board.id, input.dataid),
    cafe_board: input.board.id,
    cafe_dataid: input.dataid,
    cafe_article_id: input.dataidNum, // undefined 면 키 자동 생략 (JSON.stringify 규칙)
    cafe_author: isAnonymous ? null : input.author || null, // Q3: 익명은 원본도 저장 안 함
    source_url: articleUrl(input.board, input.dataid),
    cafe_comments: input.comments ?? [],
    urls: input.imageUrls ?? [],
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// community_posts 중복 검사
// ─────────────────────────────────────────────────────────────────────────────

/**
 * `images->>'cafe_source_id'` 매칭으로 기존 행 조회.
 *
 * 왜 $queryRaw:
 *   - community_posts 에 cafe_source_id 컬럼 없음 → JSON path 쿼리 필요.
 *   - Prisma 가 JSON 연산자 공식 미지원.
 *
 * 성능: 현재 수백 scale 에서는 full scan 허용. GIN index 는 수천건 넘어가면 고려.
 */
async function findExistingCommunityPostByCafeSourceId(
  prisma: PrismaClient,
  cafeSourceId: string,
): Promise<bigint | null> {
  const rows = await prisma.$queryRaw<Array<{ id: bigint }>>`
    SELECT id FROM community_posts
    WHERE images->>'cafe_source_id' = ${cafeSourceId}
    LIMIT 1
  `;
  return rows.length > 0 ? rows[0].id : null;
}

// ─────────────────────────────────────────────────────────────────────────────
// community_posts upsert 메인
// ─────────────────────────────────────────────────────────────────────────────

/**
 * 카페 일반 게시판 1건 → community_posts INSERT (중복이면 skip).
 *
 * 동작:
 *   1) assertDevDatabase() — 운영 DB 가드
 *   2) resolveCafeBotUserId — 봇 user_id 캐시 로드 (없으면 throw)
 *   3) buildCommunityCafeSourceId 로 source_id 생성
 *   4) findExistingCommunityPostByCafeSourceId — 중복 확인
 *   5) 중복이면 skipped_duplicate
 *   6) 마스킹 + INSERT
 *
 * 트랜잭션: 단일 INSERT 라 $transaction 불필요.
 * 실패 처리: throw 없이 result.failed 반환 (games 와 동일 패턴).
 *
 * 호출자 책임:
 *   - board.target === "community_posts" 확인 후 호출
 *   - input.content 는 원본 또는 마스킹 완료 (이 함수가 2차 마스킹)
 */
export async function upsertCommunityPostFromCafe(
  prisma: PrismaClient,
  input: CafeCommunityInput,
): Promise<CommunityUpsertResult> {
  // 1차 가드 — throw (전체 중단 의도)
  assertDevDatabase();

  try {
    if (input.board.target !== "community_posts") {
      return {
        action: "failed",
        error: `board.target 이 community_posts 가 아님 (${input.board.target})`,
      };
    }
    if (!input.board.category) {
      return {
        action: "failed",
        error: `board.category 누락 — community 게시판은 category 필수`,
      };
    }

    // 봇 user_id 로드 (캐시, 없으면 throw)
    const botUserId = await resolveCafeBotUserId(prisma);

    // 중복 체크
    const cafeSourceId = buildCommunityCafeSourceId(input.board.id, input.dataid);
    const existing = await findExistingCommunityPostByCafeSourceId(prisma, cafeSourceId);
    if (existing !== null) {
      return { action: "skipped_duplicate", postId: existing };
    }

    // 2차 방어 마스킹 (9가드 #5) — title 도 포함
    const maskedTitle = maskPersonalInfo(input.title);
    const maskedContent = maskPersonalInfo(input.content);

    const now = new Date();
    const authorNickname = resolveCommunityAuthorNickname(input.board, input.author);
    const images = buildCommunityImagesMeta({
      ...input,
      // 마스킹된 author 는 images 에 안 들어감 (buildCommunityImagesMeta 가 anonymousAuthor 판정)
    });

    const row = await prisma.community_posts.create({
      data: {
        user_id: botUserId,
        title: maskedTitle.slice(0, 255), // VARCHAR 길이 방어
        content: maskedContent,
        category: input.board.category,
        status: "published",
        view_count: 0,
        comments_count: 0,
        likes_count: 0,
        author_nickname: authorNickname,
        // images: JSON — 배열이 아닌 객체로 저장 (PM 결정). UX 렌더링 시 Array.isArray 분기.
        images: images as unknown as Prisma.InputJsonValue,
        // created_at = 카페 원본 게시 시각 우선 (games 와 동일 정책)
        created_at: input.postedAt ?? now,
        updated_at: now,
      },
    });

    return { action: "created", postId: row.id };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { action: "failed", error: msg };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// community preview (dry-run)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * --execute 없을 때 미리보기 — DB 접근 0 (중복 체크 제외).
 *
 * 호출 시점:
 *   - sync-cafe.ts dry-run
 *   - backfill-cafe-community.ts dry-run
 *
 * 중복 체크는 DB 접근 필요하므로 여기선 하지 않음 (호출자가 별도 판단).
 */
export function previewCommunityUpsert(input: CafeCommunityInput): {
  cafeSourceId: string;
  category: string;
  authorNickname: string;
  willInsert: boolean;
  images: Record<string, unknown>;
} {
  const cafeSourceId = buildCommunityCafeSourceId(input.board.id, input.dataid);
  return {
    cafeSourceId,
    category: input.board.category ?? "(category 누락)",
    authorNickname: resolveCommunityAuthorNickname(input.board, input.author),
    willInsert: input.board.target === "community_posts" && !!input.board.category,
    images: buildCommunityImagesMeta(input),
  };
}
