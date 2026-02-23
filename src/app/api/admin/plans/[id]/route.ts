import { NextRequest, NextResponse } from "next/server";
import { getWebSession } from "@/lib/auth/web-session";
import { prisma } from "@/lib/db/prisma";
import { adminLog } from "@/lib/admin/log";

async function requireAdmin() {
  const session = await getWebSession();
  if (!session || session.role !== "super_admin") return null;
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

  const prev = await prisma.plans.findUnique({ where: { id: BigInt(id) } }).catch(() => null);

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

  await adminLog("plan.update", "Plan", {
    resourceId: id,
    description: `요금제 수정: ${plan.name}`,
    previousValues: prev ? { name: prev.name, price: prev.price, is_active: prev.is_active } : {},
    changesMade: body,
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const prev = await prisma.plans.findUnique({ where: { id: BigInt(id) } }).catch(() => null);

  // 구독자가 있으면 비활성화만
  const subCount = await prisma.user_subscriptions.count({
    where: { plan_id: BigInt(id), status: "active" },
  });

  if (subCount > 0) {
    await prisma.plans.update({ where: { id: BigInt(id) }, data: { is_active: false } });

    await adminLog("plan.deactivate", "Plan", {
      resourceId: id,
      description: `요금제 비활성화 (구독자 ${subCount}명): ${prev?.name}`,
      changesMade: { is_active: false },
      severity: "warning",
    });

    return NextResponse.json({ ok: true, deactivated: true });
  }

  await prisma.plans.delete({ where: { id: BigInt(id) } }).catch(() => null);

  await adminLog("plan.delete", "Plan", {
    resourceId: id,
    description: `요금제 삭제: ${prev?.name}`,
    previousValues: prev ? { name: prev.name, price: prev.price } : {},
    severity: "warning",
  });

  return NextResponse.json({ ok: true });
}
