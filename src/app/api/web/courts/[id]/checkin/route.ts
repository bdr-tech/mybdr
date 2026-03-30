import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getWebSession } from "@/lib/auth/web-session";
import { apiSuccess, apiError } from "@/lib/api/response";
import { completeSession } from "@/lib/services/gamification";
import { XP_REWARDS } from "@/lib/constants/gamification";

// 3시간 이내 세션만 활성으로 간주 (밀리초)
const SESSION_TIMEOUT_MS = 3 * 60 * 60 * 1000;

// 체크인 허용 최대 거리 (미터)
const MAX_CHECKIN_DISTANCE_M = 100;

// ─────────────────────────────────────────────────
// Haversine 공식: 두 위경도 좌표 사이의 거리를 미터 단위로 계산
// 지구를 완전한 구로 가정 (R = 6371km)
// ─────────────────────────────────────────────────
function haversineDistanceM(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const R = 6371000; // 지구 반지름 (미터)
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  // Haversine 핵심 공식: sin²(Δlat/2) + cos(lat1)·cos(lat2)·sin²(Δlng/2)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// ─────────────────────────────────────────────────
// GET: 현재 코트의 체크인 현황 조회
// - 활성 세션 수 (checked_out 안 했고 3시간 이내)
// - 현재 유저가 이 코트에 체크인 중인지
// ─────────────────────────────────────────────────
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  // ID가 숫자인지 검증 — 문자열이 들어오면 BigInt 변환 시 500 에러 방지
  if (!/^\d+$/.test(id)) {
    return apiError("유효하지 않은 코트 ID입니다", 400);
  }
  const courtId = BigInt(id);

  // 3시간 전 시각 계산
  const cutoff = new Date(Date.now() - SESSION_TIMEOUT_MS);

  // 활성 세션 수 조회 (체크아웃 안 했고 3시간 이내 체크인)
  const activeCount = await prisma.court_sessions.count({
    where: {
      court_id: courtId,
      checked_out_at: null,
      checked_in_at: { gte: cutoff },
    },
  });

  // 로그인한 유저가 이 코트에 체크인 중인지 확인
  const session = await getWebSession();
  let mySession = null;

  if (session) {
    const active = await prisma.court_sessions.findFirst({
      where: {
        user_id: BigInt(session.sub),
        checked_out_at: null,
        checked_in_at: { gte: cutoff },
      },
      orderBy: { checked_in_at: "desc" },
    });

    if (active) {
      // 다른 코트에 체크인 중이면 해당 코트 이름도 조회
      let courtName: string | null = null;
      if (active.court_id !== courtId) {
        const otherCourt = await prisma.court_infos.findUnique({
          where: { id: active.court_id },
          select: { name: true },
        });
        courtName = otherCourt?.name ?? "알 수 없는 코트";
      }

      mySession = {
        id: active.id.toString(),
        courtId: active.court_id.toString(),
        checkedInAt: active.checked_in_at.toISOString(),
        // 현재 경과 시간(분)
        elapsedMinutes: Math.floor(
          (Date.now() - active.checked_in_at.getTime()) / 60000
        ),
        // 이 코트인지 다른 코트인지
        isThisCourt: active.court_id === courtId,
        // 다른 코트일 때 코트 이름 (UI에서 "○○에 체크인 중" 표시용)
        courtName,
      };
    }
  }

  return apiSuccess({
    activeCount,
    mySession,
  });
}

// ─────────────────────────────────────────────────
// POST: 체크인 (농구 시작!)
// - 이미 다른 코트에 체크인 중이면 에러
// - court_sessions에 새 레코드 insert
// ─────────────────────────────────────────────────
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // 인증 필수
  const session = await getWebSession();
  if (!session) {
    return apiError("로그인이 필요합니다", 401, "UNAUTHORIZED");
  }

  const { id } = await params;
  // ID가 숫자인지 검증
  if (!/^\d+$/.test(id)) {
    return apiError("유효하지 않은 코트 ID입니다", 400);
  }
  const courtId = BigInt(id);
  const userId = BigInt(session.sub);
  const cutoff = new Date(Date.now() - SESSION_TIMEOUT_MS);

  // body에서 위치 정보 추출 (필수)
  let checkinLat: number | null = null;
  let checkinLng: number | null = null;
  let checkinMethod = "manual";
  try {
    const body = await req.json();
    if (body.latitude != null && body.longitude != null) {
      checkinLat = Number(body.latitude);
      checkinLng = Number(body.longitude);
    }
    if (body.method) {
      checkinMethod = body.method;
    }
  } catch {
    // body 파싱 실패
  }

  // QR 체크인이 아닌 경우: 위치 정보 필수
  // QR 방식은 현장에 QR이 부착되어 있으므로 GPS 검증을 스킵한다
  const isQrCheckin = checkinMethod === "qr";

  if (!isQrCheckin && (checkinLat == null || checkinLng == null)) {
    return apiError("위치 서비스를 활성화해주세요", 400, "LOCATION_REQUIRED");
  }

  // 코트 존재 확인 + 위경도 조회 (거리 검증에 필요)
  const court = await prisma.court_infos.findUnique({
    where: { id: courtId },
    select: { id: true, name: true, latitude: true, longitude: true },
  });
  if (!court) {
    return apiError("존재하지 않는 코트입니다", 404, "NOT_FOUND");
  }

  // GPS 거리 검증: QR 체크인이면 스킵, 코트 위경도가 (0,0)이면 스킵
  if (!isQrCheckin) {
    const courtLat = Number(court.latitude);
    const courtLng = Number(court.longitude);
    if (courtLat !== 0 && courtLng !== 0 && checkinLat != null && checkinLng != null) {
      const distanceM = haversineDistanceM(checkinLat, checkinLng, courtLat, courtLng);
      if (distanceM > MAX_CHECKIN_DISTANCE_M) {
        return apiError(
          "코트에서 100m 이내에서만 체크인할 수 있어요",
          400,
          "TOO_FAR"
        );
      }
    }
  }

  // 이미 활성 세션이 있는지 확인 (어떤 코트든)
  const existing = await prisma.court_sessions.findFirst({
    where: {
      user_id: userId,
      checked_out_at: null,
      checked_in_at: { gte: cutoff },
    },
  });

  if (existing) {
    // 409 응답에 체크인 중인 코트 정보를 포함 (UI에서 "체크인 중인 농구장 보기" 안내)
    const checkedInCourt = await prisma.court_infos.findUnique({
      where: { id: existing.court_id },
      select: { name: true },
    });
    return apiError("이미 다른 코트에 체크인 중입니다", 409, "ALREADY_CHECKED_IN", {
      checked_in_court_id: existing.court_id.toString(),
      checked_in_court_name: checkedInCourt?.name ?? "알 수 없는 코트",
    });
  }

  // 새 세션 생성
  const newSession = await prisma.court_sessions.create({
    data: {
      user_id: userId,
      court_id: courtId,
      checkin_method: checkinMethod,
      checkin_lat: checkinLat,
      checkin_lng: checkinLng,
    },
  });

  // 코트 checkins_count 증가
  await prisma.court_infos.update({
    where: { id: courtId },
    data: { checkins_count: { increment: 1 } },
  }).catch(() => null); // 실패해도 체크인은 성공

  // 현재 활성 세션 수 반환
  const activeCount = await prisma.court_sessions.count({
    where: {
      court_id: courtId,
      checked_out_at: null,
      checked_in_at: { gte: cutoff },
    },
  });

  return apiSuccess({
    sessionId: newSession.id.toString(),
    checkedInAt: newSession.checked_in_at.toISOString(),
    activeCount,
  }, 201);
}

// ─────────────────────────────────────────────────
// DELETE: 체크아웃 (농구 끝!)
// - 현재 활성 세션 찾아서 checked_out_at 설정
// - duration_minutes 계산
// - XP 계산: 기본 10 + 30분이상 5 + 1시간이상 10
// ─────────────────────────────────────────────────
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getWebSession();
  if (!session) {
    return apiError("로그인이 필요합니다", 401, "UNAUTHORIZED");
  }

  const { id } = await params;
  // ID가 숫자인지 검증
  if (!/^\d+$/.test(id)) {
    return apiError("유효하지 않은 코트 ID입니다", 400);
  }
  const courtId = BigInt(id);
  const userId = BigInt(session.sub);
  const cutoff = new Date(Date.now() - SESSION_TIMEOUT_MS);

  // 이 코트의 활성 세션 찾기
  const active = await prisma.court_sessions.findFirst({
    where: {
      user_id: userId,
      court_id: courtId,
      checked_out_at: null,
      checked_in_at: { gte: cutoff },
    },
  });

  if (!active) {
    return apiError("활성 체크인 세션이 없습니다", 404, "NO_ACTIVE_SESSION");
  }

  // 경과 시간 계산 (분)
  const now = new Date();
  const durationMinutes = Math.floor(
    (now.getTime() - active.checked_in_at.getTime()) / 60000
  );

  // XP 계산: 체크인 기본 10XP + 30분이상 5XP + 1시간이상 10XP
  let xp = 10;
  if (durationMinutes >= 30) xp += 5;
  if (durationMinutes >= 60) xp += 10;

  // 세션 업데이트
  const updated = await prisma.court_sessions.update({
    where: { id: active.id },
    data: {
      checked_out_at: now,
      duration_minutes: durationMinutes,
      xp_earned: xp,
    },
  });

  // ─── 게이미피케이션: 트랜잭션으로 XP + 스트릭 + 도장깨기 일괄 처리 ───
  // completeSession이 $transaction 안에서 3개 함수를 순차 호출
  // 하나라도 실패하면 전체 롤백되어 데이터 불일치 방지
  const gamResult = await completeSession(userId, xp);

  const { xpResult, streakResult, courtBadgeResult } = gamResult;

  return apiSuccess({
    sessionId: updated.id.toString(),
    durationMinutes,
    xpEarned: xp,
    // 게이미피케이션 결과 (클라이언트에서 세션 완료 카드에 표시)
    gamification: {
      totalXp: xpResult?.newXp ?? 0,
      level: xpResult?.newLevel ?? 1,
      title: xpResult?.newTitle ?? "루키",
      leveledUp: xpResult?.leveledUp ?? false,
      levelUpBadge: xpResult?.levelUpBadge ?? null,
      streak: streakResult?.streak ?? 0,
      streakBonus: streakResult?.bonus ?? false,
      streakBonusXp: streakResult?.bonus ? XP_REWARDS.streak_7 : 0,
      newCourtBadges: courtBadgeResult?.newBadges ?? [],
      courtCount: courtBadgeResult?.courtCount ?? 0,
    },
  });
}
