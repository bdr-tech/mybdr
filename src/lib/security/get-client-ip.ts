import { NextRequest } from "next/server";

/**
 * 클라이언트 IP 추출 (스푸핑 방지)
 * - Vercel: x-real-ip (신뢰할 수 있는 단일 값)
 * - 프록시: x-forwarded-for 첫 번째 IP만 사용
 */
export function getClientIp(req: NextRequest): string {
  // Vercel이 주입하는 신뢰할 수 있는 단일 IP
  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp.trim();

  // 프록시 체인의 첫 번째 IP만 신뢰 (마지막은 스푸핑 가능)
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();

  return "unknown";
}
