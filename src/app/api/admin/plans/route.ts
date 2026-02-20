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

  return NextResponse.json({ id: plan.id.toString() }, { status: 201 });
}
