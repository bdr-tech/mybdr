import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth/jwt";
import { WEB_SESSION_COOKIE } from "@/lib/auth/web-session";
import { prisma } from "@/lib/db/prisma";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const cookieStore = await cookies();
  const token = cookieStore.get(WEB_SESSION_COOKIE)?.value;
  if (!token) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });

  const session = await verifyToken(token);
  if (!session) return NextResponse.json({ error: "세션이 만료되었습니다." }, { status: 401 });

  try {
    const teamId = BigInt(id);
    const userId = BigInt(session.sub);

    // 이미 가입 요청했는지 확인
    const existingRequest = await prisma.team_join_requests.findFirst({
      where: { team_id: teamId, user_id: userId, status: "pending" },
    });
    if (existingRequest) {
      return NextResponse.json({ error: "이미 가입 신청한 팀입니다." }, { status: 409 });
    }

    // 이미 멤버인지 확인
    const existingMember = await prisma.teamMember.findUnique({
      where: { teamId_userId: { teamId, userId } },
    });
    if (existingMember) {
      return NextResponse.json({ error: "이미 팀 멤버입니다." }, { status: 409 });
    }

    const team = await prisma.team.findUnique({ where: { id: teamId } });
    if (!team) return NextResponse.json({ error: "팀을 찾을 수 없습니다." }, { status: 404 });

    if (team.auto_accept_members) {
      // 자동 수락
      await prisma.teamMember.create({
        data: {
          teamId,
          userId,
          role: "member",
          status: "active",
          joined_at: new Date(),
        },
      });
      await prisma.team.update({
        where: { id: teamId },
        data: { members_count: { increment: 1 } },
      });
      return NextResponse.json({ success: true, message: "팀에 가입되었습니다." });
    }

    // 가입 신청
    await prisma.team_join_requests.create({
      data: {
        team_id: teamId,
        user_id: userId,
        status: "pending",
        created_at: new Date(),
        updated_at: new Date(),
      },
    });

    return NextResponse.json({ success: true, message: "가입 신청이 완료되었습니다. 승인을 기다려 주세요." });
  } catch {
    return NextResponse.json({ error: "가입 신청 중 오류가 발생했습니다." }, { status: 500 });
  }
}
