import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth/jwt";
import { WEB_SESSION_COOKIE } from "@/lib/auth/web-session";

export const dynamic = "force-dynamic";

// 가벼운 세션 확인 엔드포인트 — DB 쿼리 없이 JWT만 검증
export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(WEB_SESSION_COOKIE)?.value;
  if (!token) return NextResponse.json({ loggedIn: false }, { status: 401 });

  const session = await verifyToken(token);
  if (!session) return NextResponse.json({ loggedIn: false }, { status: 401 });

  return NextResponse.json({
    id: session.sub,
    email: session.email,
    name: session.name,
    role: session.role,
  });
}
