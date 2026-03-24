import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { apiSuccess, apiError } from "@/lib/api/response";
import { getWebSession } from "@/lib/auth/web-session";

/**
 * GET /api/web/community
 *
 * 게시글 목록을 반환하는 공개 API
 * - 인증 불필요 (공개 목록)
 * - 쿼리 파라미터: category(카테고리), q(제목+본문 검색), prefer(선호 카테고리 필터)
 * - prefer=true이면 로그인 유저의 preferred_board_categories를 카테고리 필터로 적용
 * - BigInt/Date 필드를 JSON 직렬화 가능한 형태로 변환
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;

    // 쿼리 파라미터 추출
    const category = searchParams.get("category") || undefined;
    const q = searchParams.get("q") || undefined;
    const prefer = searchParams.get("prefer") === "true";

    // where 조건 구성 (기존 page.tsx에서 이동)
    const where: Record<string, unknown> = {};

    // prefer=true일 때 로그인 유저의 선호 게시판 카테고리를 필터로 적용
    // 명시적 category 파라미터가 있으면 그것을 우선하므로 선호 필터는 적용하지 않음
    let preferredCategories: string[] | undefined;
    if (prefer && !category) {
      const session = await getWebSession();
      if (session) {
        const user = await prisma.user.findUnique({
          where: { id: BigInt(session.sub) },
          select: { preferred_board_categories: true },
        });
        // preferred_board_categories는 Json 타입 (문자열 배열로 저장됨)
        const cats = user?.preferred_board_categories;
        if (Array.isArray(cats) && cats.length > 0) {
          preferredCategories = cats as string[];
        }
      }
    }

    // 카테고리 필터: 명시적 선택 > 선호 카테고리 > 전체
    if (category) {
      where.category = category;
    } else if (preferredCategories && preferredCategories.length > 0) {
      // 선호 카테고리가 여러 개일 수 있으므로 in 조건 사용
      where.category = { in: preferredCategories };
    }

    // 검색어가 있으면 제목 + 본문에서 검색 (대소문자 무시)
    if (q) {
      where.OR = [
        { title: { contains: q, mode: "insensitive" } },
        { body: { contains: q, mode: "insensitive" } },
      ];
    }

    // 게시글 목록 조회 (최신순 30개, 작성자 닉네임 + 프로필 이미지 포함)
    const posts = await prisma.community_posts.findMany({
      where,
      orderBy: { created_at: "desc" },
      take: 30,
      include: {
        users: {
          select: {
            nickname: true,
            profile_image_url: true,  // 작성자 아바타용 프로필 이미지 추가
          },
        },
      },
    }).catch(() => []);

    // BigInt/Date 필드를 직렬화 가능한 형태로 변환
    const serializedPosts = posts.map((p) => ({
      id: p.id.toString(),                                    // BigInt -> string
      publicId: p.public_id,
      title: p.title,
      category: p.category,
      viewCount: p.view_count ?? 0,
      commentsCount: p.comments_count ?? 0,
      createdAt: p.created_at?.toISOString() ?? null,          // Date -> ISO string
      authorNickname: p.users?.nickname ?? "익명",              // 작성자 닉네임 추출
      authorProfileImage: p.users?.profile_image_url ?? null,  // 작성자 프로필 이미지 URL
      contentPreview: p.content?.slice(0, 120) ?? "",          // 본문 미리보기 (앞 120자)
    }));

    // 선호 카테고리 목록도 함께 반환 (프론트엔드에서 하이라이트 표시용)
    return apiSuccess({
      posts: serializedPosts,
      preferred_categories: preferredCategories ?? [],
    });
  } catch (error) {
    console.error("[GET /api/web/community] Error:", error);
    return apiError("게시글 목록을 불러올 수 없습니다.", 500, "INTERNAL_ERROR");
  }
}
