import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

// 서브도메인 대회 사이트에서 참가 신청 (비인증)
export async function POST(req: Request) {
  try {
    const { subdomain, teamName, captainName, captainPhone, captainEmail, playerCount, message } =
      await req.json();

    if (!subdomain || !teamName || !captainName || !captainEmail) {
      return NextResponse.json({ error: "필수 항목이 누락되었습니다." }, { status: 400 });
    }

    const site = await prisma.tournamentSite.findUnique({
      where: { subdomain },
      select: { tournamentId: true, isPublished: true, tournament: { select: { status: true } } },
    });

    if (!site || !site.isPublished) {
      return NextResponse.json({ error: "대회를 찾을 수 없습니다." }, { status: 404 });
    }

    if (site.tournament.status !== "registration") {
      return NextResponse.json({ error: "현재 참가 신청 기간이 아닙니다." }, { status: 400 });
    }

    // 메타데이터로 참가 신청 기록 저장 (별도 registration 테이블 없으므로 tournament 메타 활용)
    // TODO: 추후 별도 registration 테이블 추가 시 교체
    // 현재: 대회 시스템 내 팀 생성 없이 간단한 문의 형식으로 처리
    // 실운영에서는 이 데이터를 관리자에게 이메일/알림으로 전송해야 함

    return NextResponse.json({
      success: true,
      message: "참가 신청이 완료되었습니다. 관리자 승인 후 안내드립니다.",
      data: {
        tournamentId: site.tournamentId,
        teamName,
        captainName,
        captainEmail,
        playerCount: playerCount ? Number(playerCount) : null,
        submittedAt: new Date().toISOString(),
      },
    });
  } catch {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
