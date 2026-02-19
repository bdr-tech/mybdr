import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { withAuth, withErrorHandler, type AuthContext } from "@/lib/api/middleware";
import { apiSuccess, apiError } from "@/lib/api/response";

const RESERVED_SUBDOMAINS = [
  "www", "api", "admin", "app", "mail", "ftp",
  "staging", "dev", "test", "demo", "help", "support",
  "blog", "docs", "status",
];

// FR-071: 서브도메인 가용성 확인
async function handler(req: NextRequest, _ctx: AuthContext) {
  const name = req.nextUrl.searchParams.get("name");

  if (!name) {
    return apiError("name parameter required", 400, "VALIDATION_ERROR");
  }

  // 형식 검증
  if (!/^[a-z0-9-]{3,30}$/.test(name)) {
    return apiSuccess({
      available: false,
      reason: "invalid_format",
    });
  }

  // 예약어 체크
  if (RESERVED_SUBDOMAINS.includes(name)) {
    return apiSuccess({
      available: false,
      reason: "reserved",
    });
  }

  // DB 중복 체크
  const existing = await prisma.tournamentSite.findUnique({
    where: { subdomain: name },
    select: { id: true },
  });

  return apiSuccess({
    available: !existing,
    reason: existing ? "already_taken" : null,
  });
}

export const GET = withErrorHandler(withAuth(handler));
