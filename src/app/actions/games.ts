"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { getWebSession } from "@/lib/auth/web-session";
import { canHostPickup, canCreateTeam } from "@/lib/auth/roles";

function generateGameId(gameType: number): string {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, "");
  const typeCode = gameType === 1 ? "GST" : gameType === 2 ? "TVT" : "PIK";
  const rand = Math.random()
    .toString(36)
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 4)
    .padEnd(4, "0");
  return `GAME-${dateStr}-${typeCode}-${rand}`;
}

/** FormData에서 게임 필드를 추출하고 기본값을 적용한다. */
function extractGameFields(formData: FormData) {
  const title = (formData.get("title") as string)?.trim();
  const scheduledAt = formData.get("scheduled_at") as string;
  const gameType = parseInt(formData.get("game_type") as string) || 0;

  const courtIdRaw = (formData.get("court_id") as string)?.trim();

  return {
    title,
    scheduledAt,
    gameType,
    venueName: (formData.get("venue_name") as string)?.trim() || null,
    maxParticipants: parseInt(formData.get("max_participants") as string) || 10,
    feePerPerson: parseInt(formData.get("fee_per_person") as string) || 0,
    description: (formData.get("description") as string)?.trim() || null,
    durationHours: parseInt(formData.get("duration_hours") as string) || 2,
    city: (formData.get("city") as string)?.trim() || null,
    district: (formData.get("district") as string)?.trim() || null,
    venueAddress: (formData.get("venue_address") as string)?.trim() || null,
    courtId: courtIdRaw ? BigInt(courtIdRaw) : null,
    minParticipants: parseInt(formData.get("min_participants") as string) || 4,
    skillLevel: (formData.get("skill_level") as string) || "all",
    requirements: (formData.get("requirements") as string)?.trim() || null,
    allowGuests: formData.get("allow_guests") === "true",
    uniformHomeColor: (formData.get("uniform_home_color") as string) || "#FF0000",
    uniformAwayColor: (formData.get("uniform_away_color") as string) || "#0000FF",
    isRecurring: formData.get("is_recurring") === "true",
    recurrenceRule: (formData.get("recurrence_rule") as string) || null,
    recurringCount: parseInt(formData.get("recurring_count") as string) || 0,
    notes: (formData.get("notes") as string)?.trim() || null,
    contactPhone: (formData.get("contact_phone") as string)?.trim() || null,
    entryFeeNote: (formData.get("entry_fee_note") as string)?.trim() || null,
  };
}

/** 반복 게임 복사본을 일괄 생성한다. */
async function createRecurringGames(
  baseGameId: bigint,
  fields: ReturnType<typeof extractGameFields>,
  organizerId: bigint
) {
  const { recurringCount, recurrenceRule, scheduledAt, gameType } = fields;
  if (!fields.isRecurring || recurringCount <= 1 || !recurrenceRule) return;

  const baseDate = new Date(scheduledAt);
  const copies = [];

  for (let i = 1; i < recurringCount; i++) {
    const nextDate = new Date(baseDate);
    if (recurrenceRule === "weekly") nextDate.setDate(nextDate.getDate() + 7 * i);
    else if (recurrenceRule === "biweekly") nextDate.setDate(nextDate.getDate() + 14 * i);
    else if (recurrenceRule === "monthly") nextDate.setMonth(nextDate.getMonth() + i);

    copies.push({
      game_id: generateGameId(gameType),
      title: fields.title,
      scheduled_at: nextDate,
      venue_name: fields.venueName,
      max_participants: fields.maxParticipants,
      fee_per_person: fields.feePerPerson,
      description: fields.description,
      organizer_id: organizerId,
      game_type: gameType,
      duration_hours: fields.durationHours,
      city: fields.city,
      district: fields.district,
      venue_address: fields.venueAddress,
      court_id: fields.courtId,
      min_participants: fields.minParticipants,
      skill_level: fields.skillLevel,
      requirements: fields.requirements,
      allow_guests: fields.allowGuests,
      uniform_home_color: fields.uniformHomeColor,
      uniform_away_color: fields.uniformAwayColor,
      is_recurring: true,
      recurrence_rule: recurrenceRule,
      notes: fields.notes,
      contact_phone: fields.contactPhone,
      entry_fee_note: fields.entryFeeNote,
      status: 1,
      cloned_from_id: baseGameId,
      created_at: new Date(),
      updated_at: new Date(),
    });
  }

  if (copies.length > 0) {
    await prisma.games.createMany({ data: copies });
  }
}

export async function createGameAction(
  _prevState: { error: string } | null,
  formData: FormData
) {
  const session = await getWebSession();
  if (!session) redirect("/login");

  const fields = extractGameFields(formData);

  if (!fields.title || !fields.scheduledAt) {
    return { error: "제목과 일시는 필수입니다." };
  }

  // 권한 체크: membershipType 기반 (서버사이드 2차 검증)
  const organizerId = BigInt(session.sub);
  if (fields.gameType === 0 || fields.gameType === 2) {
    const user = await prisma.user.findUnique({
      where: { id: organizerId },
      select: { membershipType: true, isAdmin: true },
    });
    const mt = user?.membershipType ?? 0;
    const isAdmin = user?.isAdmin ?? false;

    if (!isAdmin) {
      if (fields.gameType === 0 && !canHostPickup(mt)) {
        return { error: "픽업 게임을 개설하려면 픽업 호스트 이상 계정이 필요합니다." };
      }
      if (fields.gameType === 2 && !canCreateTeam(mt)) {
        return { error: "팀 대결을 개설하려면 팀장 이상 계정이 필요합니다." };
      }
    }
  }

  let createdGameId: string;
  try {
    const game = await prisma.games.create({
      data: {
        game_id: generateGameId(fields.gameType),
        uuid: crypto.randomUUID(),
        title: fields.title,
        scheduled_at: new Date(fields.scheduledAt),
        venue_name: fields.venueName,
        max_participants: fields.maxParticipants,
        fee_per_person: fields.feePerPerson,
        description: fields.description,
        organizer_id: organizerId,
        game_type: fields.gameType,
        duration_hours: fields.durationHours,
        city: fields.city,
        district: fields.district,
        venue_address: fields.venueAddress,
        court_id: fields.courtId,
        min_participants: fields.minParticipants,
        skill_level: fields.skillLevel,
        requirements: fields.requirements,
        allow_guests: fields.allowGuests,
        uniform_home_color: fields.uniformHomeColor,
        uniform_away_color: fields.uniformAwayColor,
        is_recurring: fields.isRecurring,
        recurrence_rule: fields.isRecurring ? fields.recurrenceRule : null,
        notes: fields.notes,
        contact_phone: fields.contactPhone,
        entry_fee_note: fields.entryFeeNote,
        status: 1,
        created_at: new Date(),
        updated_at: new Date(),
      },
    });

    await createRecurringGames(game.id, fields, organizerId);

    createdGameId = game.uuid!;
  } catch {
    return { error: "경기 생성 중 오류가 발생했습니다." };
  }

  redirect(`/games/${createdGameId.slice(0, 8)}`);
}
