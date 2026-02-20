import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const planId = BigInt(id);

  const plan = await prisma.plans.findUnique({
    where: { id: planId, is_active: true },
    select: { id: true, name: true, price: true, plan_type: true, feature_key: true, description: true },
  }).catch(() => null);

  if (!plan) {
    return NextResponse.json({ error: "요금제를 찾을 수 없습니다." }, { status: 404 });
  }

  return NextResponse.json({
    id: plan.id.toString(),
    name: plan.name,
    price: plan.price,
    plan_type: plan.plan_type,
    feature_key: plan.feature_key,
    description: plan.description,
  });
}
