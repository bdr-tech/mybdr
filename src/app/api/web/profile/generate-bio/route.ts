import { withWebAuth, type WebAuthContext } from "@/lib/auth/web-session";
import { apiSuccess, apiError } from "@/lib/api/response";
import { prisma } from "@/lib/db/prisma";

export const POST = withWebAuth(async (_req: Request, ctx: WebAuthContext) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return apiError("AI 서비스가 설정되지 않았습니다. (GEMINI_API_KEY 필요)", 503);
  }

  try {
    // 1) 유저 기본 프로필
    const user = await prisma.user.findUnique({
      where: { id: ctx.userId },
      select: {
        nickname: true,
        position: true,
        height: true,
        weight: true,
        city: true,
        district: true,
        total_games_participated: true,
      },
    });

    if (!user) return apiError("User not found", 404);

    // 2) 소속 팀 (에러 시 빈 배열)
    const teamMembers = await prisma.teamMember
      .findMany({
        where: { userId: ctx.userId, status: "active" },
        include: {
          team: { select: { name: true, wins: true, losses: true, city: true } },
        },
        take: 5,
      })
      .catch(() => []);

    // 3) 대회 참가 이력 (에러 시 빈 배열)
    const tournamentPlayers = await prisma.tournamentTeamPlayer
      .findMany({
        where: { userId: ctx.userId },
        include: {
          tournamentTeam: {
            include: {
              tournament: { select: { name: true, status: true } },
            },
          },
        },
        take: 5,
      })
      .catch(() => []);

    // 4) 스탯 (tournamentTeamPlayer ID 경유)
    const playerIds = tournamentPlayers.map((tp) => tp.id);
    const stats =
      playerIds.length > 0
        ? await prisma.matchPlayerStat
            .findMany({
              where: { tournamentTeamPlayerId: { in: playerIds } },
              select: {
                points: true,
                total_rebounds: true,
                assists: true,
                steals: true,
                blocks: true,
              },
              take: 20,
            })
            .catch(() => [])
        : [];

    // 평균 스탯
    const avgStats =
      stats.length > 0
        ? {
            games: stats.length,
            pts: (stats.reduce((s, v) => s + (v.points ?? 0), 0) / stats.length).toFixed(1),
            reb: (stats.reduce((s, v) => s + (v.total_rebounds ?? 0), 0) / stats.length).toFixed(1),
            ast: (stats.reduce((s, v) => s + (v.assists ?? 0), 0) / stats.length).toFixed(1),
            stl: (stats.reduce((s, v) => s + (v.steals ?? 0), 0) / stats.length).toFixed(1),
            blk: (stats.reduce((s, v) => s + (v.blocks ?? 0), 0) / stats.length).toFixed(1),
          }
        : null;

    // 활동 요약
    const teams = teamMembers.map(
      (m) => `${m.team.name} (${m.team.wins ?? 0}승 ${m.team.losses ?? 0}패)`,
    );
    const tournaments = tournamentPlayers.map(
      (tp) => tp.tournamentTeam.tournament.name,
    );

    const lines = [
      `닉네임: ${user.nickname ?? "미설정"}`,
      `포지션: ${user.position ?? "미설정"}`,
      user.height ? `키: ${user.height}cm` : null,
      user.weight ? `몸무게: ${user.weight}kg` : null,
      `활동지역: ${[user.city, user.district].filter(Boolean).join(" ") || "미설정"}`,
      `총 참가 경기수: ${user.total_games_participated ?? 0}`,
      teams.length > 0 ? `소속 팀: ${teams.join(", ")}` : "소속 팀 없음",
      tournaments.length > 0 ? `참가 대회: ${tournaments.join(", ")}` : null,
      avgStats
        ? `최근 ${avgStats.games}경기 평균: ${avgStats.pts}득점 ${avgStats.reb}리바 ${avgStats.ast}어시 ${avgStats.stl}스틸 ${avgStats.blk}블록`
        : null,
    ]
      .filter(Boolean)
      .join("\n");

    // Gemini API
    const prompt = `농구 선수 프로필 자기소개를 한국어로 작성해.

규칙:
1. 255자 이내, 완결된 문장으로 끝낼 것
2. 정중한 존댓말 (~합니다, ~입니다)
3. 포지션, 활동지역, 팀/대회 경험을 간결하게 포함
4. 데이터 부족 시 농구를 좋아하는 간결한 소개
5. 자기소개 텍스트만 바로 출력 (따옴표, 부연설명, 마크다운 없이)

선수 데이터:
${lines}`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { maxOutputTokens: 8192, temperature: 0.7 },
        }),
      },
    );

    if (!response.ok) {
      const errText = await response.text().catch(() => "");
      console.error("[generate-bio] Gemini error:", response.status, errText);
      return apiError("AI 생성에 실패했습니다.", 502);
    }

    const result = await response.json();
    const bio =
      result.candidates?.[0]?.content?.parts?.[0]?.text?.trim().slice(0, 255) ?? "";

    return apiSuccess({ bio });
  } catch (err) {
    console.error("[generate-bio] Error:", err);
    const msg = err instanceof Error ? err.message : "unknown";
    return apiError("자기소개 생성에 실패했습니다. 잠시 후 다시 시도해주세요.", 500);
  }
});
