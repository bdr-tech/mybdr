/**
 * 카페 봇 유저 seed — community_posts 에 카페 글 저장 시 user_id FK 로 사용할 유저 1명 생성.
 *
 * 사용법:
 *   npx tsx --env-file=.env --env-file=.env.local scripts/seed-cafe-bot-user.ts          # dry-run (기본)
 *   npx tsx --env-file=.env --env-file=.env.local scripts/seed-cafe-bot-user.ts --execute # 실제 INSERT
 *
 * 멱등성:
 *   - email unique 제약으로 중복 실행 방어
 *   - 이미 존재하면 skipped 표시 + 기존 user_id 출력
 *
 * 안전장치:
 *   - 운영 DB 가드 (bwoorsgoijvlgutkrcvs 식별자 포함 필수)
 *   - dry-run 이 기본, --execute 없으면 실제 쓰기 안 함
 *   - bcrypt 로 password digest 생성 (임의 UUID — 로그인 불가 효과)
 *
 * 설계 배경:
 *   community_posts.user_id 는 FK NOT NULL.
 *   카페 원본 닉네임을 author_nickname 에 저장하고, 실제 user 는 "카페 봇" 1개로 통합.
 *   PM Q1 결정 (2026-04-21): 신규 카페 봇 유저 방식 (A안).
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { randomUUID } from "node:crypto";

// ─────────────────────────────────────────────────────────────────────────────
// 상수
// ─────────────────────────────────────────────────────────────────────────────

/** upsert.ts 의 CAFE_BOT_EMAIL 과 동기화 필수 */
const CAFE_BOT_EMAIL = "cafe-bot@mybdr.local";
const CAFE_BOT_NAME = "카페 봇";
const CAFE_BOT_NICKNAME = "카페 봇";

const DEV_DB_IDENTIFIER = "bwoorsgoijvlgutkrcvs";

// ─────────────────────────────────────────────────────────────────────────────
// 인자 파싱
// ─────────────────────────────────────────────────────────────────────────────

const EXECUTE_MODE = process.argv.includes("--execute");

// ─────────────────────────────────────────────────────────────────────────────
// 운영 DB 가드
// ─────────────────────────────────────────────────────────────────────────────

function assertDevDatabase(): void {
  const url = process.env.DATABASE_URL ?? "";
  if (!url.includes(DEV_DB_IDENTIFIER)) {
    console.error(
      `🛑 운영 DB 가드: DATABASE_URL 이 개발 DB 가 아닙니다.\n` +
        `   식별자 "${DEV_DB_IDENTIFIER}" 를 포함해야 실행 가능합니다.\n` +
        `   .env / .env.local 확인 후 재시도하세요.`,
    );
    process.exit(1);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 메인
// ─────────────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log("========================================");
  console.log(`[${EXECUTE_MODE ? "EXECUTE" : "DRY RUN"}] 카페 봇 유저 seed`);
  console.log("========================================");

  // 1차 가드 — DATABASE_URL 확인 후 진행
  assertDevDatabase();
  console.log(`✓ 개발 DB 식별자 확인됨 (${DEV_DB_IDENTIFIER})`);

  const prisma = new PrismaClient();

  try {
    const existing = await prisma.user.findUnique({
      where: { email: CAFE_BOT_EMAIL },
      select: { id: true, email: true, name: true, createdAt: true },
    });

    if (existing) {
      console.log("");
      console.log("ℹ️  이미 존재하는 카페 봇 유저 발견:");
      console.log(`   id            : ${existing.id}`);
      console.log(`   email         : ${existing.email}`);
      console.log(`   name          : ${existing.name}`);
      console.log(`   createdAt     : ${existing.createdAt.toISOString()}`);
      console.log("");
      console.log("✅ 추가 작업 없음. upsertCommunityPostFromCafe 가 이 user_id 를 사용합니다.");
      return;
    }

    console.log("");
    console.log("▶ 기존 카페 봇 유저 없음 — 신규 생성 계획:");
    console.log(`   email         : ${CAFE_BOT_EMAIL}`);
    console.log(`   name          : ${CAFE_BOT_NAME}`);
    console.log(`   nickname      : ${CAFE_BOT_NICKNAME}`);
    console.log(`   passwordDigest: bcrypt(randomUUID()) — 로그인 불가`);
    console.log(`   status        : active`);
    console.log(`   isAdmin       : false`);

    if (!EXECUTE_MODE) {
      console.log("");
      console.log("💡 dry-run 모드. 실제 INSERT 는 수행하지 않음.");
      console.log("   실제 생성: `--execute` 플래그 추가");
      return;
    }

    // 실제 INSERT
    const now = new Date();
    const randomPassword = randomUUID() + "-" + randomUUID(); // 충분한 엔트로피
    const passwordDigest = await bcrypt.hash(randomPassword, 10);

    const created = await prisma.user.create({
      data: {
        email: CAFE_BOT_EMAIL,
        passwordDigest,
        name: CAFE_BOT_NAME,
        nickname: CAFE_BOT_NICKNAME,
        status: "active",
        isAdmin: false,
        createdAt: now,
        updatedAt: now,
      },
      select: { id: true, email: true, createdAt: true },
    });

    console.log("");
    console.log("✅ 카페 봇 유저 생성 완료:");
    console.log(`   id            : ${created.id}`);
    console.log(`   email         : ${created.email}`);
    console.log(`   createdAt     : ${created.createdAt.toISOString()}`);
    console.log("");
    console.log("다음 단계: `scripts/sync-cafe.ts` / `scripts/backfill-cafe-community.ts` 실행 시 이 유저 자동 사용.");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error("💥 실행 중 에러:", err);
  process.exit(1);
});
