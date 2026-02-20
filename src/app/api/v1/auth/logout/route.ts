import { NextRequest } from "next/server";
import { withAuth } from "@/lib/api/middleware";
import { apiSuccess } from "@/lib/api/response";

// POST /api/v1/auth/logout
// JWT는 stateless이므로 서버측 무효화 없이 성공 응답.
// 클라이언트(Flutter)가 로컬 토큰을 삭제해야 함.
export const POST = withAuth(async (_req: NextRequest) => {
  return apiSuccess({ message: "Logged out successfully" });
});
