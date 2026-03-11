import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { apiSuccess, apiError } from "@/lib/api/response";

const registrationSchema = z.object({
  subdomain:    z.string().min(1).max(50),
  teamName:     z.string().min(1).max(100),
  captainName:  z.string().min(1).max(50),
  captainPhone: z.string().max(20).optional(),
  captainEmail: z.string().email().max(100),
  playerCount:  z.number().int().min(1).max(100).optional(),
  message:      z.string().max(1000).optional(),
});

// POST /api/site/registration - 서브도메인 대회 사이트에서 참가 신청 (비인증)
export async function POST(req: Request) {
  try {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return apiError("잘못된 요청입니다.", 400);
    }

    const parsed = registrationSchema.safeParse(body);
    if (!parsed.success) {
      return apiError("필수 항목이 누락되었거나 형식이 올바르지 않습니다.", 400);
    }

    const { subdomain, teamName, captainName, captainPhone, captainEmail, playerCount, message } = parsed.data;

    const site = await prisma.tournamentSite.findUnique({
      where: { subdomain },
      select: { tournamentId: true, isPublished: true, tournament: { select: { status: true } } },
    });

    if (!site || !site.isPublished) {
      return apiError("대회를 찾을 수 없습니다.", 404);
    }

    if (site.tournament.status !== "registration") {
      return apiError("현재 참가 신청 기간이 아닙니다.", 400);
    }

    // 중복 신청 방지: 동일 대회 + 동일 이메일 + 동일 팀명
    const existing = await prisma.site_registrations.findUnique({
      where: {
        tournamentId_captainEmail_teamName: {
          tournamentId: site.tournamentId,
          captainEmail,
          teamName,
        },
      },
    });

    if (existing) {
      return apiError("이미 동일한 팀명과 이메일로 신청한 이력이 있습니다.", 409);
    }

    // DB에 참가 신청 저장
    const registration = await prisma.site_registrations.create({
      data: {
        tournamentId: site.tournamentId,
        teamName,
        captainName,
        captainPhone: captainPhone ?? null,
        captainEmail,
        playerCount: playerCount ?? null,
        message: message ?? null,
      },
    });

    return apiSuccess({
      success: true,
      message: "참가 신청이 완료되었습니다. 관리자 승인 후 안내드립니다.",
      data: {
        id: registration.id.toString(),
        tournamentId: site.tournamentId,
        teamName,
        captainName,
        captainEmail,
        playerCount: playerCount ?? null,
        submittedAt: registration.createdAt.toISOString(),
      },
    });
  } catch (err) {
    console.error("[POST /api/site/registration]", err);
    return apiError("Internal error", 500);
  }
}
