import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth/jwt";
import { WEB_SESSION_COOKIE } from "@/lib/auth/web-session";
import { prisma } from "@/lib/db/prisma";

const FORMAT_MAP: Record<string, string> = {
  "싱글 엘리미네이션": "single_elimination",
  "라운드 로빈": "round_robin",
  "그룹 스테이지": "group_stage",
  "더블 엘리미네이션": "double_elimination",
  "스위스": "swiss",
};

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get(WEB_SESSION_COOKIE)?.value;
  if (!token) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });

  const session = await verifyToken(token);
  if (!session) return NextResponse.json({ error: "세션이 만료되었습니다." }, { status: 401 });

  try {
    const body = await req.json();
    const { name, format, startDate, endDate, subdomain, primaryColor, secondaryColor } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: "대회 이름은 필수입니다." }, { status: 400 });
    }

    const organizerId = BigInt(session.sub);

    // 구독 확인
    const sub = await prisma.user_subscriptions.findFirst({
      where: {
        user_id: organizerId,
        feature_key: "tournament_create",
        status: "active",
        OR: [{ expires_at: null }, { expires_at: { gte: new Date() } }],
      },
    });
    if (!sub) {
      return NextResponse.json({ error: "UPGRADE_REQUIRED", feature: "tournament_create" }, { status: 402 });
    }
    const normalizedFormat = FORMAT_MAP[format] ?? format ?? "single_elimination";

    const tournament = await prisma.tournament.create({
      data: {
        name: name.trim(),
        organizerId,
        format: normalizedFormat,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        primary_color: primaryColor || "#F4A261",
        secondary_color: secondaryColor || "#E76F51",
        status: "draft",
      },
    });

    // 서브도메인이 있으면 TournamentSite 생성
    if (subdomain?.trim()) {
      await prisma.tournamentSite.create({
        data: {
          tournamentId: tournament.id,
          subdomain: subdomain.trim().toLowerCase(),
          isPublished: false,
          primaryColor: primaryColor || "#F4A261",
          secondaryColor: secondaryColor || "#E76F51",
        },
      });
    }

    return NextResponse.json({
      success: true,
      tournamentId: tournament.id,
      redirectUrl: `/tournament-admin/tournaments/${tournament.id}`,
    });
  } catch {
    return NextResponse.json({ error: "대회 생성 중 오류가 발생했습니다." }, { status: 500 });
  }
}
