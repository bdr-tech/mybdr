import { type NextRequest } from "next/server";
import { getWebSession } from "@/lib/auth/web-session";
import { prisma } from "@/lib/db/prisma";
import { adminLog } from "@/lib/admin/log";
import { apiSuccess, apiError } from "@/lib/api/response";
import { z } from "zod";

async function requireAdmin() {
  const session = await getWebSession();
  if (!session || session.role !== "super_admin") return null;
  return session;
}

export async function GET() {
  const session = await requireAdmin();
  if (!session) return apiError("Unauthorized", 401);

  const plans = await prisma.plans.findMany({
    orderBy: { created_at: "desc" },
  });

  return apiSuccess(
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
  if (!session) return apiError("Unauthorized", 401);

  const raw = await req.json();
  const schema = z.object({
    name: z.string().min(1).max(100),
    description: z.string().max(500).optional(),
    plan_type: z.enum(["monthly", "yearly", "one_time"]).default("monthly"),
    feature_key: z.string().min(1).max(50),
    price: z.number().int().min(0),
    max_uses: z.number().int().min(1).nullish(),
  });
  const parsed = schema.safeParse(raw);
  if (!parsed.success) return apiError("입력값이 올바르지 않습니다.", 400);
  const { name, description, plan_type, feature_key, price, max_uses } = parsed.data;

  const plan = await prisma.plans.create({
    data: {
      name: name.trim(),
      description: description?.trim() || null,
      plan_type,
      feature_key: feature_key.trim(),
      price,
      max_uses: max_uses ?? null,
    },
  });

  await adminLog("plan.create", "Plan", {
    resourceId: plan.id,
    description: `요금제 생성: ${plan.name}`,
    changesMade: { name: plan.name, feature_key: plan.feature_key, price: plan.price, plan_type: plan.plan_type },
  });

  return apiSuccess({ id: plan.id.toString() }, 201);
}
