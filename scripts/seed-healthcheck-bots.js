/**
 * ============================================================================
 * 헬스체크 봇 시드 스크립트 (개발 DB 전용)
 * ============================================================================
 *
 * ⚠️ 경고: 운영 DB에 절대 실행하지 마세요.
 *         .env의 DATABASE_URL이 개발 DB인지 먼저 확인하세요.
 *
 * 생성 내역:
 *   1) BOT협회 1개 (code: "BOT-HEALTHCHECK")
 *   2) 봇 User 3개
 *      - bot-admin@healthcheck.bot    (사무국장 — 관리자 플로우 검증)
 *      - bot-referee@healthcheck.bot  (심판 — 본인 플로우 검증)
 *      - bot-guest@healthcheck.bot    (일반 유저 — 비권한 플로우 검증)
 *   3) AssociationAdmin 매핑 (bot-admin만)
 *   4) Referee 매칭 (bot-referee만)
 *
 * 실행:
 *   BOT_DEFAULT_PASSWORD=your-secret node scripts/seed-healthcheck-bots.js
 *
 * 환경변수 미지정 시 실행 시각 기반 임시 비밀번호를 콘솔에 출력합니다.
 * ============================================================================
 */
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

// 비밀번호 — 환경변수 우선, 없으면 시각 기반 임시값
const DEFAULT_PASSWORD =
  process.env.BOT_DEFAULT_PASSWORD || "healthcheck-bot-" + Date.now();

async function main() {
  const p = new PrismaClient();

  try {
    // ── 1) BOT협회 upsert ──
    // code 기준 upsert이므로 반복 실행해도 안전.
    const association = await p.association.upsert({
      where: { code: "BOT-HEALTHCHECK" },
      create: {
        code: "BOT-HEALTHCHECK",
        name: "헬스체크봇협회",
        parent_id: null,
        region_sido: null,
        level: "national",
      },
      update: {},
    });
    console.log("BOT협회 id:", Number(association.id));

    // ── 2) 봇 계정 3개 생성 ──
    const hash = await bcrypt.hash(DEFAULT_PASSWORD, 10);

    const accounts = [
      {
        email: "bot-admin@healthcheck.bot",
        nickname: "BotAdmin",
        name: "봇관리자",
        // 사무국장 — 가장 광범위한 권한으로 관리자 API 전반 커버
        role: "secretary_general",
      },
      {
        email: "bot-referee@healthcheck.bot",
        nickname: "BotReferee",
        name: "봇심판",
        // 심판 — 본인 플로우 검증용 (referee_id로 신청/조회)
        role: null,
      },
      {
        email: "bot-guest@healthcheck.bot",
        nickname: "BotGuest",
        name: "봇게스트",
        // 권한 없는 유저 — 403 응답 검증용
        role: null,
      },
    ];

    for (const acc of accounts) {
      // email 기준 upsert. 기존 봇 계정이 있으면 업데이트 없이 그대로 사용.
      const user = await p.user.upsert({
        where: { email: acc.email },
        create: {
          email: acc.email,
          passwordDigest: hash,
          nickname: acc.nickname,
          name: acc.name,
          phone: null,
          isAdmin: false,
          // admin_role은 AssociationAdmin 매핑이 있을 때만 "association_admin"으로 설정
          admin_role: acc.role ? "association_admin" : null,
          status: "active",
        },
        update: {},
      });
      console.log(`User 생성: ${acc.email} (id=${Number(user.id)})`);

      // ── 3) AssociationAdmin 매핑 — 사무국장 봇만 ──
      if (acc.role) {
        await p.associationAdmin.upsert({
          where: { user_id: user.id },
          create: {
            user_id: user.id,
            association_id: association.id,
            role: acc.role,
          },
          update: {
            association_id: association.id,
            role: acc.role,
          },
        });
        console.log(`  → 봇협회 ${acc.role} 등록`);
      }

      // ── 4) Referee 레코드 — 심판 봇만 ──
      // user_id UNIQUE 제약 대응을 위해 where은 user_id 기준.
      if (acc.email === "bot-referee@healthcheck.bot") {
        await p.referee.upsert({
          where: { user_id: user.id },
          create: {
            user_id: user.id,
            association_id: association.id,
            verified_name: acc.name,
            verified_phone: null,
            // license_number는 UNIQUE이므로 충돌 회피를 위해 시각 suffix
            license_number: `BOT-REF-${Date.now()}`,
            level: "advanced",
            role_type: "referee",
            status: "active",
            match_status: "matched",
            matched_at: new Date(),
            registered_name: acc.name,
            registered_phone: null,
          },
          update: {},
        });
        console.log("  → Referee 매칭");
      }
    }

    console.log("\n✅ 시드 완료");
    console.log("비밀번호:", DEFAULT_PASSWORD);
    console.log(
      "⚠️  운영 배포 전 BOT_DEFAULT_PASSWORD 환경변수를 반드시 변경하세요."
    );
  } catch (err) {
    console.error("시드 실패:", err);
    process.exitCode = 1;
  } finally {
    await p.$disconnect();
  }
}

main();
