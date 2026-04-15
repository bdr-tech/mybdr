import { withWebAuth, type WebAuthContext } from "@/lib/auth/web-session";
import { apiSuccess, apiError, validationError } from "@/lib/api/response";
import { prisma } from "@/lib/db/prisma";
import { z } from "zod";
// 헬스체크 봇의 쓰기 작업 차단 가드
import { requireNotBot } from "@/lib/healthcheck/is-bot";

/**
 * /api/web/referee-applications
 *
 * POST — 본인 배정 신청 제출 (일자 다중 선택)
 * GET  — 내 신청 목록
 *
 * 이유: 심판이 공고의 일자 중 가능한 날짜를 골라 신청을 제출한다.
 *      AssignmentApplication(1 row) + AssignmentApplicationDate(N rows) 트랜잭션.
 *
 * 보안:
 *   - referee_id는 세션 기반 (IDOR 방지)
 *   - 공고가 open 상태이고 본인 협회인지 검증
 *   - @@unique([announcement_id, referee_id])로 중복 신청 차단 + 친절 에러
 */

export const dynamic = "force-dynamic";

function toUtcDate(ymd: string): Date {
  return new Date(`${ymd}T00:00:00.000Z`);
}

// YYYY-MM-DD 문자열로 포매팅 (타임존 이슈 회피 — UTC 기준)
function toYmd(d: Date): string {
  return d.toISOString().slice(0, 10);
}

// ── Zod: POST 신청 ──
const createSchema = z.object({
  announcement_id: z.union([z.number(), z.string()]).transform((v) => BigInt(v)),
  dates: z.array(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).min(1).max(31),
  memo: z.string().max(1000).optional().nullable(),
});

// ── POST: 신청 제출 ──
export const POST = withWebAuth(async (req: Request, ctx: WebAuthContext) => {
  // 0) 봇 방어 — 헬스체크 봇 계정은 쓰기 차단
  const botCheck = await requireNotBot(ctx.userId);
  if (botCheck) return botCheck.error;

  // 1) 본인 Referee 조회
  const referee = await prisma.referee.findUnique({
    where: { user_id: ctx.userId },
    select: { id: true, association_id: true, role_type: true },
  });
  if (!referee) {
    return apiError("먼저 심판 프로필을 등록하세요.", 404, "NO_REFEREE_PROFILE");
  }
  if (!referee.association_id) {
    return apiError("협회 소속이 없어 신청할 수 없습니다.", 400, "NO_ASSOCIATION");
  }

  // 2) body 파싱 + Zod
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return apiError("잘못된 요청 형식입니다.", 400, "BAD_REQUEST");
  }
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return validationError(parsed.error.issues);
  const { announcement_id, dates, memo } = parsed.data;

  try {
    // 3) 공고 유효성 검증
    const ann = await prisma.assignmentAnnouncement.findUnique({
      where: { id: announcement_id },
      select: {
        id: true,
        association_id: true,
        status: true,
        role_type: true,
        dates: true,
        deadline: true,
      },
    });
    if (!ann) return apiError("공고를 찾을 수 없습니다.", 404, "NOT_FOUND");

    // 본인 협회 소속 공고인지 (IDOR 방지)
    if (ann.association_id !== referee.association_id) {
      return apiError("본인 협회의 공고가 아닙니다.", 403, "FORBIDDEN");
    }
    if (ann.status !== "open") {
      return apiError("마감되었거나 취소된 공고입니다.", 400, "NOT_OPEN");
    }
    if (ann.deadline && new Date() > new Date(ann.deadline)) {
      return apiError("신청 마감 시각이 지났습니다.", 400, "DEADLINE_PASSED");
    }

    // 역할 유형 일치 검증 (Referee.role_type 기반 버킷)
    const myBucket = referee.role_type === "referee" ? "referee" : "game_official";
    if (ann.role_type !== myBucket) {
      return apiError("내 역할 유형과 맞지 않는 공고입니다.", 400, "ROLE_MISMATCH");
    }

    // 4) 신청 일자가 공고 대상 일자에 모두 포함되는지 검증
    const allowedSet = new Set(ann.dates.map((d) => toYmd(d)));
    for (const d of dates) {
      if (!allowedSet.has(d)) {
        return apiError(
          `공고에 없는 일자입니다: ${d}`,
          400,
          "INVALID_DATE"
        );
      }
    }

    // 5) 중복 신청 사전 체크 (unique 제약 + 친절 에러)
    const dup = await prisma.assignmentApplication.findUnique({
      where: {
        announcement_id_referee_id: {
          announcement_id,
          referee_id: referee.id,
        },
      },
      select: { id: true },
    });
    if (dup) {
      return apiError("이미 이 공고에 신청하셨습니다.", 409, "DUPLICATE_APPLICATION");
    }

    // 6) 트랜잭션: Application + ApplicationDate N개 한번에
    const created = await prisma.$transaction(async (tx) => {
      const app = await tx.assignmentApplication.create({
        data: {
          announcement_id,
          referee_id: referee.id,
          memo: memo ?? null,
          status: "submitted",
        },
        select: { id: true, created_at: true, status: true, memo: true },
      });
      // 일자별 레코드 일괄 생성
      await tx.assignmentApplicationDate.createMany({
        data: dates.map((d) => ({
          application_id: app.id,
          date: toUtcDate(d),
        })),
      });
      return app;
    });

    return apiSuccess(
      { application: { id: created.id, dates, memo: created.memo, status: created.status } },
      201
    );
  } catch (error) {
    const err = error as { code?: string };
    if (err.code === "P2002") {
      return apiError("이미 이 공고에 신청하셨습니다.", 409, "DUPLICATE_APPLICATION");
    }
    console.error("[referee-applications] POST 실패:", error);
    return apiError("신청을 접수하지 못했습니다.", 500, "INTERNAL_ERROR");
  }
});

// ── GET: 내 신청 목록 ──
export const GET = withWebAuth(async (_req: Request, ctx: WebAuthContext) => {
  try {
    const referee = await prisma.referee.findUnique({
      where: { user_id: ctx.userId },
      select: { id: true },
    });
    if (!referee) {
      return apiError("먼저 심판 프로필을 등록하세요.", 404, "NO_REFEREE_PROFILE");
    }

    const apps = await prisma.assignmentApplication.findMany({
      where: { referee_id: referee.id },
      orderBy: [{ created_at: "desc" }],
      select: {
        id: true,
        status: true,
        memo: true,
        created_at: true,
        dates: { select: { date: true }, orderBy: { date: "asc" } },
        announcement: {
          select: {
            id: true,
            tournament_id: true,
            title: true,
            role_type: true,
            dates: true,
            deadline: true,
            status: true,
          },
        },
      },
    });

    // 대회명 일괄 조회
    const tIds = [...new Set(apps.map((a) => a.announcement.tournament_id))];
    const tournaments = tIds.length
      ? await prisma.tournament.findMany({
          where: { id: { in: tIds } },
          select: { id: true, name: true },
        })
      : [];
    const tMap = new Map(tournaments.map((t) => [t.id, t.name]));

    const items = apps.map((a) => ({
      id: a.id,
      status: a.status,
      memo: a.memo,
      created_at: a.created_at,
      dates: a.dates.map((d) => d.date),
      announcement: {
        id: a.announcement.id,
        tournament_id: a.announcement.tournament_id,
        tournament_name: tMap.get(a.announcement.tournament_id) ?? null,
        title: a.announcement.title,
        role_type: a.announcement.role_type,
        dates: a.announcement.dates,
        deadline: a.announcement.deadline,
        status: a.announcement.status,
      },
    }));

    return apiSuccess({ items });
  } catch (error) {
    console.error("[referee-applications] GET 실패:", error);
    return apiError("신청 목록을 불러오지 못했습니다.", 500, "INTERNAL_ERROR");
  }
});
