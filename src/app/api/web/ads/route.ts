import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

/**
 * GET /api/web/ads?placement=feed|sidebar|court_top|list
 * 네이티브 광고 조회 API
 * - placement 파라미터로 위치별 광고를 필터링
 * - 승인(approved) + 기간 내 + 활성 배치만 반환
 * - 5분(300초) 캐시로 DB 부하 최소화
 */

// 5분 캐시 — 광고 데이터는 실시간일 필요 없음
export const revalidate = 300;

export async function GET(request: NextRequest) {
  try {
    // placement 파라미터: 어디에 표시할 광고인지 (feed, sidebar 등)
    const { searchParams } = new URL(request.url);
    const placement = searchParams.get("placement");

    if (!placement) {
      return NextResponse.json({ error: "placement parameter required" }, { status: 400 });
    }

    const now = new Date();

    // 활성 배치 + 승인된 캠페인 + 기간 내 조건으로 조회
    const placements = await prisma.ad_placements.findMany({
      where: {
        placement,
        is_active: true,
        campaign: {
          status: "approved",
          // 시작일이 null이거나 오늘 이전
          OR: [
            { start_date: null },
            { start_date: { lte: now } },
          ],
          // 종료일이 null이거나 오늘 이후
          AND: [
            {
              OR: [
                { end_date: null },
                { end_date: { gte: now } },
              ],
            },
          ],
          // 파트너사도 승인 상태여야 함
          partner: {
            status: "approved",
          },
        },
      },
      orderBy: { priority: "desc" },
      take: 5, // 최대 5개까지만
      include: {
        campaign: {
          select: {
            uuid: true,
            headline: true,
            description: true,
            image_url: true,
            link_url: true,
            cta_text: true,
            partner: {
              select: {
                name: true,
                logo_url: true,
              },
            },
          },
        },
      },
    });

    // 클라이언트에 필요한 필드만 변환하여 반환
    const ads = placements.map((p) => ({
      id: p.campaign.uuid,
      headline: p.campaign.headline,
      description: p.campaign.description,
      image_url: p.campaign.image_url,
      link_url: p.campaign.link_url,
      cta_text: p.campaign.cta_text,
      partner_name: p.campaign.partner.name,
      partner_logo: p.campaign.partner.logo_url,
      placement: p.placement,
    }));

    return NextResponse.json({ ads });
  } catch (error) {
    console.error("[ads] GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
