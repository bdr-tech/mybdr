import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth/jwt";
import { WEB_SESSION_COOKIE } from "@/lib/auth/web-session";
import { prisma } from "@/lib/db/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const paymentKey = searchParams.get("paymentKey");
  const orderId = searchParams.get("orderId");
  const amount = searchParams.get("amount");
  const planId = searchParams.get("planId");

  if (!paymentKey || !orderId || !amount || !planId) {
    return NextResponse.redirect(new URL("/pricing/fail?code=MISSING_PARAMS", req.url));
  }

  // 세션 확인
  const cookieStore = await cookies();
  const token = cookieStore.get(WEB_SESSION_COOKIE)?.value;
  if (!token) return NextResponse.redirect(new URL("/login", req.url));

  const session = await verifyToken(token);
  if (!session) return NextResponse.redirect(new URL("/login", req.url));

  const userId = BigInt(session.sub);

  // 플랜 조회
  const plan = await prisma.plans.findUnique({
    where: { id: BigInt(planId), is_active: true },
  }).catch(() => null);

  if (!plan) {
    return NextResponse.redirect(new URL("/pricing/fail?code=PLAN_NOT_FOUND", req.url));
  }

  // 금액 검증
  if (parseInt(amount) !== plan.price) {
    return NextResponse.redirect(new URL("/pricing/fail?code=AMOUNT_MISMATCH", req.url));
  }

  // 토스페이먼츠 서버 승인
  const secretKey = process.env.TOSS_SECRET_KEY;
  if (!secretKey) {
    return NextResponse.redirect(new URL("/pricing/fail?code=CONFIG_ERROR", req.url));
  }

  const encoded = Buffer.from(`${secretKey}:`).toString("base64");
  const tossRes = await fetch("https://api.tosspayments.com/v1/payments/confirm", {
    method: "POST",
    headers: {
      Authorization: `Basic ${encoded}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ paymentKey, orderId, amount: parseInt(amount) }),
  });

  if (!tossRes.ok) {
    const errBody = await tossRes.json().catch(() => ({}));
    console.error("[Toss Confirm Error]", errBody);
    return NextResponse.redirect(new URL(`/pricing/fail?code=${encodeURIComponent((errBody as { code?: string }).code ?? "TOSS_ERROR")}`, req.url));
  }

  const tossData = await tossRes.json();

  try {
    await prisma.$transaction(async (tx) => {
      // payments 기록
      await tx.payments.create({
        data: {
          user_id: userId,
          payable_type: "Plan",
          payable_id: plan.id,
          payment_code: orderId,
          order_id: orderId,
          payment_key: paymentKey,
          toss_payment_key: paymentKey,
          toss_order_id: orderId,
          amount: plan.price,
          final_amount: plan.price,
          currency: "KRW",
          payment_method: tossData.method ?? null,
          status: "paid",
          paid_at: new Date(),
          toss_response: tossData,
          created_at: new Date(),
          updated_at: new Date(),
        },
      });

      // user_subscriptions 생성
      const expiresAt =
        plan.plan_type === "monthly"
          ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
          : null;

      await tx.user_subscriptions.create({
        data: {
          user_id: userId,
          plan_id: plan.id,
          feature_key: plan.feature_key,
          status: "active",
          expires_at: expiresAt,
          payment_key: paymentKey,
          order_id: orderId,
        },
      });
    });
  } catch (err) {
    console.error("[Subscription Create Error]", err);
    return NextResponse.redirect(new URL("/pricing/fail?code=DB_ERROR", req.url));
  }

  return NextResponse.redirect(new URL(`/pricing/success?orderId=${orderId}`, req.url));
}
