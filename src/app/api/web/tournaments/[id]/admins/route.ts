import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireTournamentAdmin, toJSON } from "@/lib/auth/tournament-auth";

type Ctx = { params: Promise<{ id: string }> };

// GET /api/web/tournaments/[id]/admins
export async function GET(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const auth = await requireTournamentAdmin(id);
  if ("error" in auth) return auth.error;

  const admins = await prisma.tournamentAdminMember.findMany({
    where: { tournamentId: id, isActive: true },
    include: {
      user: { select: { id: true, nickname: true, email: true, profile_image_url: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  return toJSON(admins);
}

// POST /api/web/tournaments/[id]/admins
// body: { email: string, role?: string }
export async function POST(req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const auth = await requireTournamentAdmin(id);
  if ("error" in auth) return auth.error;

  let body: { email?: string; role?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  if (!body.email?.trim())
    return NextResponse.json({ error: "이메일이 필요합니다." }, { status: 400 });

  const user = await prisma.user.findUnique({
    where: { email: body.email.trim().toLowerCase() },
    select: { id: true, nickname: true, email: true },
  });
  if (!user)
    return NextResponse.json({ error: "해당 이메일의 유저를 찾을 수 없습니다." }, { status: 404 });

  // 이미 관리자인지 확인
  const existing = await prisma.tournamentAdminMember.findFirst({
    where: { tournamentId: id, userId: user.id },
  });

  if (existing) {
    if (existing.isActive)
      return NextResponse.json({ error: "이미 관리자로 등록된 유저입니다." }, { status: 409 });
    // 비활성 → 재활성화
    const reactivated = await prisma.tournamentAdminMember.update({
      where: { id: existing.id },
      data: { isActive: true, role: body.role ?? "admin" },
    });
    return toJSON(reactivated);
  }

  const member = await prisma.tournamentAdminMember.create({
    data: {
      tournamentId: id,
      userId: user.id,
      role: body.role ?? "admin",
      isActive: true,
    },
  });

  return toJSON({ ...member, user });
}
