import { NextRequest, NextResponse } from "next/server";
import { getWebSession } from "@/lib/auth/web-session";
import { prisma } from "@/lib/db/prisma";
import { adminLog } from "@/lib/admin/log";

async function requireAdmin() {
  const session = await getWebSession();
  if (!session || session.role !== "super_admin") return null;
  return session;
}

export async function GET() {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const plans = await prisma.plans.findMany({
    orderBy: { created_at: "desc" },
  });

  return NextResponse.json(
    plans.map((p) => ({
      id: p.id.toString(),
      name: p.name,
      description: p.description,
      plan_type: p.plan_type,
      feature_key: p.feature_key,
      price: p.price,
      max_uses: p.max_uses,
      is_active: p.is_active,
      created_at: p.created_at,
    }))
  );
}

export async function POST(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { name, description, plan_type, feature_key, price, max_uses } = body;

  if (!name?.trim() || !feature_key?.trim() || !price) {
    return NextResponse.json({ error: "name, feature_key, price는 필수입니다." }, { status: 400 });
  }

  const plan = await prisma.plans.create({
    data: {
      name: name.trim(),
      description: description?.trim() || null,
      plan_type: plan_type || "monthly",
      feature_key: feature_key.trim(),
      price: parseInt(price),
      max_uses: max_uses ? parseInt(max_uses) : null,
    },
  });

  await adminLog("plan.create", "Plan", {
    resourceId: plan.id,
    description: `요금제 생성: ${plan.name}`,
    changesMade: { name: plan.name, feature_key: plan.feature_key, price: plan.price, plan_type: plan.plan_type },
  });

  return NextResponse.json({ id: plan.id.toString() }, { status: 201 });
}
