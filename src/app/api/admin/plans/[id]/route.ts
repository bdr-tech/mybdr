import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth/jwt";
import { WEB_SESSION_COOKIE } from "@/lib/auth/web-session";
import { prisma } from "@/lib/db/prisma";

async function requireAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get(WEB_SESSION_COOKIE)?.value;
  if (!token) return null;
  const session = await verifyToken(token);
  if (!session) return null;
  const user = await prisma.user.findUnique({ where: { id: BigInt(session.sub) }, select: { isAdmin: true } }).catch(() => null);
  if (!user?.isAdmin) return null;
  return session;
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const { name, description, price, is_active, max_uses } = body;

  const plan = await prisma.plans.update({
    where: { id: BigInt(id) },
    data: {
      ...(name !== undefined && { name: name.trim() }),
      ...(description !== undefined && { description: description?.trim() || null }),
      ...(price !== undefined && { price: parseInt(price) }),
      ...(is_active !== undefined && { is_active: Boolean(is_active) }),
      ...(max_uses !== undefined && { max_uses: max_uses ? parseInt(max_uses) : null }),
    },
  }).catch(() => null);

  if (!plan) return NextResponse.json({ error: "요금제를 찾을 수 없습니다." }, { status: 404 });

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  // 구독자가 있으면 비활성화만
  const subCount = await prisma.user_subscriptions.count({
    where: { plan_id: BigInt(id), status: "active" },
  });

  if (subCount > 0) {
    await prisma.plans.update({ where: { id: BigInt(id) }, data: { is_active: false } });
    return NextResponse.json({ ok: true, deactivated: true });
  }

  await prisma.plans.delete({ where: { id: BigInt(id) } }).catch(() => null);
  return NextResponse.json({ ok: true });
}
