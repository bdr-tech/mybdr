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

export async function createGameAction(
  _prevState: { error: string } | null,
  formData: FormData
) {
  const session = await getWebSession();
  if (!session) redirect("/login");

  const title = (formData.get("title") as string)?.trim();
  const scheduledAt = formData.get("scheduled_at") as string;

  if (!title || !scheduledAt) {
    return { error: "제목과 일시는 필수입니다." };
  }

  const gameType = parseInt(formData.get("game_type") as string) || 0;

  // 권한 체크: membershipType 기반 (서버사이드 2차 검증)
  const organizerId = BigInt(session.sub);
  if (gameType === 0 || gameType === 2) {
    const user = await prisma.user.findUnique({
      where: { id: organizerId },
      select: { membershipType: true, isAdmin: true },
    });
    const mt = user?.membershipType ?? 0;
    const isAdmin = user?.isAdmin ?? false;

    if (!isAdmin) {
      if (gameType === 0 && !canHostPickup(mt)) {
        return { error: "픽업 게임을 개설하려면 픽업 호스트 이상 계정이 필요합니다." };
      }
      if (gameType === 2 && !canCreateTeam(mt)) {
        return { error: "팀 대결을 개설하려면 팀장 이상 계정이 필요합니다." };
      }
    }
  }

  const venueName = (formData.get("venue_name") as string)?.trim() || null;
  const maxParticipants = parseInt(formData.get("max_participants") as string) || 10;
  const feePerPerson = parseInt(formData.get("fee_per_person") as string) || 0;
  const description = (formData.get("description") as string)?.trim() || null;
  const durationHours = parseInt(formData.get("duration_hours") as string) || 2;
  const city = (formData.get("city") as string)?.trim() || null;
  const district = (formData.get("district") as string)?.trim() || null;
  const venueAddress = (formData.get("venue_address") as string)?.trim() || null;
  const courtIdRaw = (formData.get("court_id") as string)?.trim();
  const courtId = courtIdRaw ? BigInt(courtIdRaw) : null;
  const minParticipants = parseInt(formData.get("min_participants") as string) || 4;
  const skillLevel = (formData.get("skill_level") as string) || "all";
  const requirements = (formData.get("requirements") as string)?.trim() || null;
  const allowGuests = formData.get("allow_guests") === "true";
  const uniformHomeColor = (formData.get("uniform_home_color") as string) || "#FF0000";
  const uniformAwayColor = (formData.get("uniform_away_color") as string) || "#0000FF";
  const isRecurring = formData.get("is_recurring") === "true";
  const recurrenceRule = (formData.get("recurrence_rule") as string) || null;
  const recurringCount = parseInt(formData.get("recurring_count") as string) || 0;
  const notes = (formData.get("notes") as string)?.trim() || null;
  // 픽업 전용 필드
  const contactPhone = (formData.get("contact_phone") as string)?.trim() || null;
  const entryFeeNote = (formData.get("entry_fee_note") as string)?.trim() || null;

  let createdGameId: string;
  try {
    const game = await prisma.games.create({
      data: {
        game_id: generateGameId(gameType),
        uuid: crypto.randomUUID(),
        title,
        scheduled_at: new Date(scheduledAt),
        venue_name: venueName,
        max_participants: maxParticipants,
        fee_per_person: feePerPerson,
        description,
        organizer_id: organizerId,
        game_type: gameType,
        duration_hours: durationHours,
        city,
        district,
        venue_address: venueAddress,
        court_id: courtId,
        min_participants: minParticipants,
        skill_level: skillLevel,
        requirements,
        allow_guests: allowGuests,
        uniform_home_color: uniformHomeColor,
        uniform_away_color: uniformAwayColor,
        is_recurring: isRecurring,
        recurrence_rule: isRecurring ? recurrenceRule : null,
        notes,
        contact_phone: contactPhone,
        entry_fee_note: entryFeeNote,
        status: 1,
        created_at: new Date(),
        updated_at: new Date(),
      },
    });

    if (isRecurring && recurringCount > 1 && recurrenceRule) {
      const baseDate = new Date(scheduledAt);
      const copies = [];

      for (let i = 1; i < recurringCount; i++) {
        const nextDate = new Date(baseDate);
        if (recurrenceRule === "weekly")
          nextDate.setDate(nextDate.getDate() + 7 * i);
        else if (recurrenceRule === "biweekly")
          nextDate.setDate(nextDate.getDate() + 14 * i);
        else if (recurrenceRule === "monthly")
          nextDate.setMonth(nextDate.getMonth() + i);

        copies.push({
          game_id: generateGameId(gameType),
          title,
          scheduled_at: nextDate,
          venue_name: venueName,
          max_participants: maxParticipants,
          fee_per_person: feePerPerson,
          description,
          organizer_id: organizerId,
          game_type: gameType,
          duration_hours: durationHours,
          city,
          district,
          venue_address: venueAddress,
          court_id: courtId,
          min_participants: minParticipants,
          skill_level: skillLevel,
          requirements,
          allow_guests: allowGuests,
          uniform_home_color: uniformHomeColor,
          uniform_away_color: uniformAwayColor,
          is_recurring: true,
          recurrence_rule: recurrenceRule,
          notes,
          contact_phone: contactPhone,
          entry_fee_note: entryFeeNote,
          status: 1,
          cloned_from_id: game.id,
          created_at: new Date(),
          updated_at: new Date(),
        });
      }

      if (copies.length > 0) {
        await prisma.games.createMany({ data: copies });
      }
    }

    createdGameId = game.uuid!;
  } catch {
    return { error: "경기 생성 중 오류가 발생했습니다." };
  }

  redirect(`/games/${createdGameId}`);
}
