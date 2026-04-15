import { type NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { apiSuccess, apiError } from "@/lib/api/response";

/**
 * Vercel Cron: 배정 공고 자동 마감.
 *
 * 이유: AssignmentAnnouncement.deadline이 지난 open 공고를 closed로 전환.
 *      관리자 목록 GET 시점의 lazy close만으로는 "심판/경기원이 봤을 때도 closed로 보이게"
 *      하기 어려우므로, 정기 cron으로 전역 일괄 처리를 보조.
 *
 * 스케줄: vercel.json에 "0 * * * *" (매시간) 등록.
 *        Hobby 플랜이면 Vercel이 일 1회로 제한할 수 있음 — 그 경우에도 lazy close가 커버.
 *
 * 보안: CRON_SECRET Bearer 인증 (tournament-reminders와 동일 패턴).
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return apiError("Unauthorized", 401);
  }

  try {
    // deadline이 현재 시각보다 과거인 open 공고를 일괄 closed 처리
    // updateMany 한 방으로 N+1 회피 — status/deadline 컬럼에 인덱스 있음
    const result = await prisma.assignmentAnnouncement.updateMany({
      where: {
        status: "open",
        deadline: { lt: new Date() },
      },
      data: { status: "closed" },
    });

    return apiSuccess({ closed: result.count });
  } catch (error) {
    console.error("[cron/referee-announcement-close] 실패:", error);
    return apiError("Cron 실행 실패", 500, "INTERNAL_ERROR");
  }
}
