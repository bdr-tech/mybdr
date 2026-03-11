import { type NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { apiSuccess, apiError } from "@/lib/api/response";

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
    return apiError("요금제를 찾을 수 없습니다.", 404);
  }

  return apiSuccess({
    id: plan.id.toString(),
    name: plan.name,
    price: plan.price,
    plan_type: plan.plan_type,
    feature_key: plan.feature_key,
    description: plan.description,
  });
}
