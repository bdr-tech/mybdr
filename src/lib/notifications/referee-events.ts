/**
 * 심판 플랫폼 — 이벤트별 알림 생성 헬퍼.
 *
 * 이유: 공고/선정/배정/정산 등 워크플로우 각 단계에서 발생하는 알림 생성 로직을
 *      한 곳에 모아 API 라우트가 얇아지게 한다. 모든 함수는 try/catch로 감싸
 *      알림 실패가 메인 트랜잭션(선정·배정·정산 등)을 방해하지 않도록 한다.
 *
 * 비유: "우체국 창구 5종" — API는 서류를 접수만 하고 실제 편지 배달(알림 발송)은
 *      이 파일에서 담당. 편지 분실(알림 실패)이 서류 접수 자체를 무효화하면 안 됨.
 *
 * 주의: notifications.user_id는 User.id(BigInt). Referee.user_id로 조인하여 얻는다.
 *      Referee 자체가 아닌 해당 심판의 유저 계정으로 알림이 간다.
 */

import { prisma } from "@/lib/db/prisma";
import { createNotificationBulk, createNotification } from "./create";
import { NOTIFICATION_TYPES } from "./types";

// 알림 실패 로그 공통 — 메인 흐름 방해 없이 조용히 기록
function logNotifyError(kind: string, err: unknown) {
  console.error(`[referee-events] ${kind} 알림 생성 실패:`, err);
}

// Date → "YYYY-MM-DD (요일)" 한글 라벨 (KST)
// 이유: 알림 content에 일자를 사람이 읽기 쉬운 형태로 노출
function toKstDateLabel(d: Date): string {
  // UTC 저장값을 KST로 보정 (+9h)
  const kst = new Date(d.getTime() + 9 * 60 * 60 * 1000);
  const y = kst.getUTCFullYear();
  const m = String(kst.getUTCMonth() + 1).padStart(2, "0");
  const day = String(kst.getUTCDate()).padStart(2, "0");
  const dow = ["일", "월", "화", "수", "목", "금", "토"][kst.getUTCDay()];
  return `${y}-${m}-${day} (${dow})`;
}

// Date → "YYYY-MM-DD HH:MM" (KST)
function toKstDateTimeLabel(d: Date): string {
  const kst = new Date(d.getTime() + 9 * 60 * 60 * 1000);
  const y = kst.getUTCFullYear();
  const m = String(kst.getUTCMonth() + 1).padStart(2, "0");
  const day = String(kst.getUTCDate()).padStart(2, "0");
  const hh = String(kst.getUTCHours()).padStart(2, "0");
  const mm = String(kst.getUTCMinutes()).padStart(2, "0");
  return `${y}-${m}-${day} ${hh}:${mm}`;
}

// 역할 한글 라벨 (경기 배정용)
const ROLE_KO: Record<string, string> = {
  main: "주심",
  sub: "부심",
  recorder: "기록원",
  timer: "타이머",
  referee: "심판",
  game_official: "경기원",
};

// ────────────────────────────────────────────
// 1) 공고 풀 선정 — refereeIds 여러 명 가능 (bulk)
// ────────────────────────────────────────────
export async function notifyPoolSelected(
  refereeIds: bigint[],
  params: {
    tournament_name: string;
    date: Date;
    role_type: string; // "referee" | "game_official"
  }
): Promise<void> {
  try {
    if (refereeIds.length === 0) return;
    // Referee → user_id 매핑 (1쿼리)
    // Referee.user_id는 nullable — null인 심판(아직 앱 가입 전)은 알림 대상에서 제외
    const referees = await prisma.referee.findMany({
      where: { id: { in: refereeIds }, user_id: { not: null } },
      select: { user_id: true },
    });
    const dateLabel = toKstDateLabel(params.date);
    const roleLabel = ROLE_KO[params.role_type] ?? params.role_type;

    const inputs = referees
      .filter((r): r is { user_id: bigint } => r.user_id !== null)
      .map((r) => ({
        userId: r.user_id,
        notificationType: NOTIFICATION_TYPES.REFEREE_POOL_SELECTED,
        title: `${params.tournament_name} ${roleLabel} 선정`,
        content: `${dateLabel} ${roleLabel}으로 선정되었습니다.`,
        actionUrl: "/referee/applications",
      }));
    if (inputs.length === 0) return;
    await createNotificationBulk(inputs);
  } catch (err) {
    logNotifyError("notifyPoolSelected", err);
  }
}

// ────────────────────────────────────────────
// 2) 책임심판 지정 — 단건
// ────────────────────────────────────────────
export async function notifyChiefAssigned(
  refereeId: bigint,
  params: {
    tournament_name: string;
    date: Date;
  }
): Promise<void> {
  try {
    const referee = await prisma.referee.findUnique({
      where: { id: refereeId },
      select: { user_id: true },
    });
    // user_id가 null이면 앱 미가입 심판 — 알림 대상 아님
    if (!referee || referee.user_id === null) return;
    await createNotification({
      userId: referee.user_id,
      notificationType: NOTIFICATION_TYPES.REFEREE_POOL_CHIEF,
      title: "책임심판 지정",
      content: `${params.tournament_name} ${toKstDateLabel(params.date)} 책임심판으로 지정되었습니다.`,
      actionUrl: "/referee/assignments",
    });
  } catch (err) {
    logNotifyError("notifyChiefAssigned", err);
  }
}

// ────────────────────────────────────────────
// 3) 경기 배정 생성 — 단건
// ────────────────────────────────────────────
export async function notifyAssignmentCreated(
  refereeId: bigint,
  match_info: {
    tournament_name: string;
    scheduled_at: Date | null;
    role: string; // main/sub/recorder/timer
  }
): Promise<void> {
  try {
    const referee = await prisma.referee.findUnique({
      where: { id: refereeId },
      select: { user_id: true },
    });
    if (!referee || referee.user_id === null) return;

    const roleLabel = ROLE_KO[match_info.role] ?? match_info.role;
    const timeLabel = match_info.scheduled_at
      ? toKstDateTimeLabel(match_info.scheduled_at)
      : "일정 미확정";

    await createNotification({
      userId: referee.user_id,
      notificationType: NOTIFICATION_TYPES.REFEREE_ASSIGNMENT_CREATED,
      title: "경기 배정",
      content: `${match_info.tournament_name} ${timeLabel} ${roleLabel}으로 배정되었습니다.`,
      actionUrl: "/referee/assignments",
    });
  } catch (err) {
    logNotifyError("notifyAssignmentCreated", err);
  }
}

// ────────────────────────────────────────────
// 4) 정산 상태 변경 — paid/cancelled/refunded만
// ────────────────────────────────────────────
export async function notifySettlementStatusChanged(
  refereeId: bigint,
  amount: number,
  new_status: "paid" | "cancelled" | "refunded"
): Promise<void> {
  try {
    const referee = await prisma.referee.findUnique({
      where: { id: refereeId },
      select: { user_id: true },
    });
    if (!referee || referee.user_id === null) return;

    // 상태별 문구 매핑
    const STATUS_MSG: Record<
      "paid" | "cancelled" | "refunded",
      { title: string; content: (a: number) => string }
    > = {
      paid: {
        title: "정산 지급완료",
        content: (a) => `${a.toLocaleString("ko-KR")}원 지급이 완료되었습니다.`,
      },
      cancelled: {
        title: "정산 취소",
        content: (a) => `${a.toLocaleString("ko-KR")}원 정산이 취소되었습니다.`,
      },
      refunded: {
        title: "정산 환수",
        content: (a) => `${a.toLocaleString("ko-KR")}원 정산이 환수되었습니다.`,
      },
    };
    const msg = STATUS_MSG[new_status];

    await createNotification({
      userId: referee.user_id,
      notificationType: NOTIFICATION_TYPES.REFEREE_SETTLEMENT_PAID,
      title: msg.title,
      content: msg.content(amount),
      actionUrl: "/referee/settlements",
    });
  } catch (err) {
    logNotifyError("notifySettlementStatusChanged", err);
  }
}

// ────────────────────────────────────────────
// 5) 공고 게시 — 해당 협회 소속 심판 중 role_type 일치하는 전원에게
// ────────────────────────────────────────────
export async function notifyAnnouncementPublished(
  params: {
    association_id: bigint;
    role_type: string; // "referee" | "game_official"
    title: string;
    announcement_id?: bigint; // 현재는 action_url 딥링크에 사용 안 하지만 metadata로 남김
  }
): Promise<void> {
  try {
    // 해당 협회 소속 + role_type 일치 + user_id 있는 심판만 조회
    // 대규모 협회 대비 user_id만 select / user_id null(앱 미가입)은 대상 아님
    const referees = await prisma.referee.findMany({
      where: {
        association_id: params.association_id,
        role_type: params.role_type,
        user_id: { not: null },
      },
      select: { user_id: true },
    });
    if (referees.length === 0) return;

    // 중복 user_id 제거 (한 유저가 여러 Referee 레코드를 가질 가능성은 낮지만 방어)
    const uniqueUserIds = Array.from(
      new Set(
        referees
          .filter((r): r is { user_id: bigint } => r.user_id !== null)
          .map((r) => r.user_id.toString())
      )
    ).map((s) => BigInt(s));

    const inputs = uniqueUserIds.map((userId) => ({
      userId,
      notificationType: NOTIFICATION_TYPES.REFEREE_ANNOUNCEMENT_NEW,
      title: "새 배정 공고",
      content: `"${params.title}" 공고가 게시되었습니다.`,
      actionUrl: "/referee/applications",
      ...(params.announcement_id
        ? {
            notifiableType: "AssignmentAnnouncement",
            notifiableId: params.announcement_id,
          }
        : {}),
    }));
    await createNotificationBulk(inputs);
  } catch (err) {
    logNotifyError("notifyAnnouncementPublished", err);
  }
}
