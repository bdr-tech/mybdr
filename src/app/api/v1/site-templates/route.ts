import { prisma } from "@/lib/db/prisma";
import { apiSuccess, internalError } from "@/lib/api/response";

// FR-072: 사이트 템플릿 목록 (인증 불필요)
export async function GET() {
  try {
    const templates = await prisma.siteTemplate.findMany({
      select: {
        id: true,
        name: true,
        description: true,
        thumbnail_url: true,
        category: true,
      },
      orderBy: { createdAt: "asc" },
    });

    return apiSuccess(templates);
  } catch (error) {
    console.error("[GET /api/v1/site-templates]", error);
    return internalError();
  }
}
