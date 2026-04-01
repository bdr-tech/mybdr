import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { getClientIp } from "@/lib/security/get-client-ip";

export const dynamic = "force-dynamic";

// 중복 확인 전용 rate limit: 분당 20회 (무차별 이메일 탐색 방지)
const CHECK_DUPLICATE_LIMIT = { maxRequests: 20, windowMs: 60 * 1000 };

export async function GET(req: NextRequest) {
  // IP 기반 rate limit (공개 API이므로 무차별 대입 방지 필수)
  const ip = getClientIp(req);
  const rl = await checkRateLimit(`check-dup:${ip}`, CHECK_DUPLICATE_LIMIT);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요." },
      { status: 429 }
    );
  }

  const type = req.nextUrl.searchParams.get("type");
  const value = req.nextUrl.searchParams.get("value")?.trim();

  if (!type || !value) {
    return NextResponse.json({ error: "type과 value가 필요합니다." }, { status: 400 });
  }

  if (type === "email") {
    const exists = await prisma.user.findUnique({ where: { email: value }, select: { id: true } });
    return NextResponse.json({ available: !exists });
  }

  if (type === "nickname") {
    const exists = await prisma.user.findFirst({
      where: { nickname: { equals: value, mode: "insensitive" } },
      select: { id: true },
    });
    return NextResponse.json({ available: !exists });
  }

  return NextResponse.json({ error: "type은 email 또는 nickname이어야 합니다." }, { status: 400 });
}
