import { apiSuccess, apiError, validationError } from "@/lib/api/response";
import {
  getAssociationAdmin,
  requirePermission,
} from "@/lib/auth/admin-guard";
import { prisma } from "@/lib/db/prisma";
import { z } from "zod";
import type { NextRequest } from "next/server";
// 공고 게시 시 협회 소속 심판에게 일괄 알림 발송 — 실패해도 메인 트랜잭션은 성공
import { notifyAnnouncementPublished } from "@/lib/notifications/referee-events";
// 헬스체크 봇의 쓰기 작업 차단 가드 (봇이 운영 데이터를 더럽히지 못하게)
import { requireNotBot } from "@/lib/healthcheck/is-bot";

/**
 * /api/web/referee-admin/announcements
 *
 * POST — 배정 신청 공고 게시
 * GET  — 협회 공고 목록 (관리자용)
 *
 * 이유: 협회 심판팀장/경기팀장이 "언제/몇 명 필요"라는 공고를 먼저 게시해야,
 *       심판들이 본인 일정에 맞춰 신청할 수 있다. 신청 접수 모델(일자 다중 선택)을
 *       위해 공고 단위에 대상 일자 배열 + 일자별 필요 인원 JSON을 둔다.
 *
 * 보안:
 *   - POST: requirePermission("assignment_manage") — 팀장급 이상만
 *   - association_id는 세션에서 강제 (IDOR 방지 — body의 값은 무시)
 *   - Tournament.id는 외부 공용 자원이므로 association과 별개 검증
 */

export const dynamic = "force-dynamic";

// ── 공통 유틸 ──

// "YYYY-MM-DD" 문자열을 UTC 기준 Date로 변환 (타임존 이슈 회피)
// PostgreSQL Date 컬럼은 시각 성분을 저장하지 않으므로 UTC 자정으로 통일
function toUtcDate(ymd: string): Date {
  return new Date(`${ymd}T00:00:00.000Z`);
}

// ── Zod 스키마: POST 생성 ──
const createSchema = z.object({
  // Tournament.id는 UUID(String) — 존재 확인 필요
  tournament_id: z.string().min(1),
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional().nullable(),
  // 역할 유형: 심판 | 경기원
  role_type: z.enum(["referee", "game_official"]),
  // 대상 일자들 (YYYY-MM-DD). 최소 1개
  dates: z
    .array(z.string().regex(/^\d{4}-\d{2}-\d{2}$/))
    .min(1)
    .max(31),
  // 일자별 필요 인원: {"2026-05-02": 5, ...}. 키는 dates와 매칭되는지 서버에서 검증
  required_count: z.record(z.string(), z.number().int().min(0).max(100)),
  // 마감일 (ISO datetime 문자열) — 선택
  deadline: z.string().datetime().optional().nullable(),
});

// ── POST: 공고 생성 ──
export async function POST(req: NextRequest) {
  // 1) 권한: 팀장급 이상만
  const admin = await getAssociationAdmin();
  if (!admin) {
    return apiError("접근 권한이 없습니다.", 403, "FORBIDDEN");
  }
  const denied = requirePermission(admin.role, "assignment_manage");
  if (denied) return denied;

  // 1-1) 봇 방어 — 헬스체크 봇 계정은 쓰기 차단 (읽기는 허용)
  const botCheck = await requireNotBot(admin.userId);
  if (botCheck) return botCheck.error;

  // 2) body 파싱 + Zod 검증
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return apiError("잘못된 요청 형식입니다.", 400, "BAD_REQUEST");
  }
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return validationError(parsed.error.issues);
  }
  const { tournament_id, title, description, role_type, dates, required_count, deadline } =
    parsed.data;

  // 3) dates와 required_count 키 일치 검증 (클라이언트 실수 방지)
  const dateSet = new Set(dates);
  const rcKeys = Object.keys(required_count);
  for (const k of rcKeys) {
    if (!dateSet.has(k)) {
      return apiError(
        `required_count의 일자 "${k}"가 dates에 없습니다.`,
        400,
        "INVALID_REQUIRED_COUNT"
      );
    }
  }

  try {
    // 4) Tournament 존재 확인 (UUID)
    const t = await prisma.tournament.findUnique({
      where: { id: tournament_id },
      select: { id: true },
    });
    if (!t) {
      return apiError("대회를 찾을 수 없습니다.", 404, "TOURNAMENT_NOT_FOUND");
    }

    // 5) 공고 생성 — association_id는 세션에서 강제
    const created = await prisma.assignmentAnnouncement.create({
      data: {
        tournament_id,
        association_id: admin.associationId, // ★ IDOR 방지
        title,
        description: description ?? null,
        role_type,
        dates: dates.map(toUtcDate), // Prisma Date[]로 변환
        required_count, // JSON 그대로 저장
        deadline: deadline ? new Date(deadline) : null,
        status: "open",
        created_by: admin.userId,
      },
      select: {
        id: true,
        tournament_id: true,
        title: true,
        description: true,
        role_type: true,
        dates: true,
        required_count: true,
        deadline: true,
        status: true,
        created_at: true,
      },
    });

    // 6) 알림: 협회 소속 + role_type 일치 심판 전원에게 공고 알림 발송
    //    이유: 심판들이 "내 앞으로 새 공고가 떴다"는 걸 즉시 알 수 있어야 신청 접수율이 오름.
    //    실패해도 공고 생성 자체는 성공으로 처리 (헬퍼 내부 try/catch)
    await notifyAnnouncementPublished({
      association_id: admin.associationId,
      role_type,
      title,
      announcement_id: created.id,
    });

    return apiSuccess({ announcement: created }, 201);
  } catch (error) {
    console.error("[referee-admin/announcements] POST 실패:", error);
    return apiError("공고를 게시하지 못했습니다.", 500, "INTERNAL_ERROR");
  }
}

// ── GET: 공고 목록 (관리자 뷰) ──
export async function GET(req: NextRequest) {
  // 1) 관리자 인증 (열람은 모든 관리자 허용)
  const admin = await getAssociationAdmin();
  if (!admin) {
    return apiError("접근 권한이 없습니다.", 403, "FORBIDDEN");
  }

  // 1-1) 공고 자동 마감(lazy close):
  //      Vercel Cron이 누락되거나 지연될 수 있으므로, 관리자 목록 조회 시점에
  //      deadline이 지난 open 공고를 updateMany 한 방으로 closed 처리.
  //      인덱스가 status/association_id에 걸려 있어 비용이 크지 않다.
  //      실패해도 목록 조회는 계속 — catch로 감싸서 UX 영향 최소화.
  try {
    await prisma.assignmentAnnouncement.updateMany({
      where: {
        association_id: admin.associationId,
        status: "open",
        deadline: { lt: new Date() },
      },
      data: { status: "closed" },
    });
  } catch (err) {
    console.error("[referee-admin/announcements] lazy close 실패:", err);
  }

  // 2) 쿼리 파라미터
  const { searchParams } = new URL(req.url);
  const tournamentId = searchParams.get("tournament_id");
  const statusFilter = searchParams.get("status");
  const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") ?? "20")));
  const skip = (page - 1) * limit;

  // 3) where 조립 — 항상 association_id 필터
  const where: Record<string, unknown> = {
    association_id: admin.associationId,
  };
  if (tournamentId) where.tournament_id = tournamentId;
  if (statusFilter) where.status = statusFilter;

  try {
    // 4) 목록 + 전체 건수 병렬
    const [items, total] = await Promise.all([
      prisma.assignmentAnnouncement.findMany({
        where,
        orderBy: [{ created_at: "desc" }],
        skip,
        take: limit,
        select: {
          id: true,
          tournament_id: true,
          title: true,
          role_type: true,
          dates: true,
          required_count: true,
          deadline: true,
          status: true,
          created_at: true,
          // 신청자 수 포함 — _count 사용
          _count: { select: { applications: true } },
        },
      }),
      prisma.assignmentAnnouncement.count({ where }),
    ]);

    // 5) 대회 이름 일괄 조회 (tournament_id는 UUID String)
    const tIds = [...new Set(items.map((i) => i.tournament_id))];
    const tournaments = tIds.length
      ? await prisma.tournament.findMany({
          where: { id: { in: tIds } },
          select: { id: true, name: true },
        })
      : [];
    const tMap = new Map(tournaments.map((t) => [t.id, t.name]));

    // 6) 응답 매핑
    const mapped = items.map((i) => ({
      id: i.id,
      tournament_id: i.tournament_id,
      tournament_name: tMap.get(i.tournament_id) ?? null,
      title: i.title,
      role_type: i.role_type,
      dates: i.dates,
      required_count: i.required_count,
      deadline: i.deadline,
      status: i.status,
      created_at: i.created_at,
      applications_count: i._count.applications,
    }));

    return apiSuccess({ items: mapped, total, page, limit });
  } catch (error) {
    console.error("[referee-admin/announcements] GET 실패:", error);
    return apiError("공고 목록을 불러오지 못했습니다.", 500, "INTERNAL_ERROR");
  }
}
