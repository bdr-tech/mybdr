import type { Metadata } from "next";
import { prisma } from "@/lib/db/prisma";
import { getWebSession } from "@/lib/auth/web-session";
import { redirect } from "next/navigation";
import Link from "next/link";
import { StatCard } from "./_components/stat-card";
import { MyGamesClient } from "./_components/my-games-client";
import type { RegItem } from "./_components/reg-row";
import type { RegStatus } from "./_components/status-badge";

/* ============================================================
 * /games/my-games — BDR v2 "내 신청 내역" (A 변형)
 *
 * 왜 재구성:
 *   - v2 MyGames.jsx 시안은 "신청 내역"(경기 + 대회 통합)이 메인.
 *   - 기존 /games/my-games 는 "내가 만든 경기"만 다뤘음 → 하단 섹션으로 보존.
 *   - /profile/activity 는 그대로 유지(향후 별도 정비).
 *
 * 구조:
 *   1) 상단 메인: 시안 그대로 (타이틀 + just-applied 배너 + 4 stat + 3탭 + 리스트)
 *   2) 하단: "내가 만든 경기" (기존 hostedGames 로직 + v2 .card 재스타일)
 *
 * 원칙 (PM 확정):
 *   - API route.ts / Prisma 스키마 0 변경 (Prisma 서버 직접 호출은 OK)
 *   - 기존 파일 삭제 금지 (하단 섹션에 데이터 보존)
 *   - 결제 경로 /pricing/checkout 존재 확인됨 → Link 라우팅
 *   - QR/후기/호스트 문의/취소 등은 alert("준비 중인 기능입니다")
 *
 * 상태 4종 매핑 (Q4 확정, waitlist/no-show 제거):
 *   - confirmed: game_applications.status=1 OR tournamentTeam.status in ("approved","registered")
 *   - pending:   game_applications.status=0 OR tournamentTeam.status="pending"
 *   - completed: 위 confirmed 중 scheduled_at/startDate 가 과거 + 현재 시각 기준
 *   - cancelled: game_applications.status=2 OR tournamentTeam.status="rejected"
 * ============================================================ */

export const metadata: Metadata = {
  title: "내 신청 내역 | MyBDR",
  description: "경기·대회 신청 현황과 결제 내역을 한눈에 관리하세요.",
};

export const dynamic = "force-dynamic";

// 경기 status 코드 → 한글 라벨 (하단 "내가 만든 경기" 섹션용)
const GAME_STATUS_LABEL: Record<number, string> = {
  0: "대기",
  1: "모집중",
  2: "마감",
  3: "진행중",
  4: "완료",
  5: "취소",
};

// 금액 포맷 — 0/null → "무료", 나머지 → ₩5,000
function formatFee(fee: number | null | undefined): string {
  if (!fee || fee <= 0) return "무료";
  return `₩${fee.toLocaleString()}`;
}

// 날짜 블록용 "04.22" 포맷 (연도 제거)
function dateBlockOf(d: Date | null | undefined): string {
  if (!d) return "--";
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${m}.${day}`;
}

// 시안의 "2026.04.22 (토) · 19:00" 포맷 (KST)
function formatWhen(d: Date | null | undefined): string | null {
  if (!d) return null;
  try {
    // ko-KR 로캘 + Asia/Seoul — 다른 페이지에서도 동일 패턴
    return d.toLocaleString("ko-KR", {
      timeZone: "Asia/Seoul",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      weekday: "short",
      hour12: false,
    });
  } catch {
    return null;
  }
}

// 신청일 YYYY.MM.DD
function formatApplied(d: Date | null | undefined): string {
  if (!d) return "—";
  try {
    const s = d.toLocaleDateString("ko-KR", {
      timeZone: "Asia/Seoul",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    // "2026. 4. 22." → "2026.04.22"
    return s.replace(/\.\s/g, ".").replace(/\.$/, "");
  } catch {
    return "—";
  }
}

// 월 YYYY.MM 포맷 (이번 달 결제 카드 sub)
function thisMonthLabel(): string {
  const d = new Date();
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}`;
}

// ₩ 포맷 축약 (1000 단위 K)
function formatKoCurrency(won: number): string {
  if (won <= 0) return "₩0";
  if (won >= 1_000_000) return `₩${(won / 1_000_000).toFixed(1)}M`;
  if (won >= 1_000) return `₩${Math.round(won / 1_000)}K`;
  return `₩${won.toLocaleString()}`;
}

export default async function MyGamesPage() {
  const session = await getWebSession();
  if (!session) redirect("/login");

  const userId = BigInt(session.sub);
  const now = new Date();

  // ====== Step 1: Prisma 병렬 prefetch (경기 신청 / 대회 등록 / 호스트 경기) ======
  // 3 쿼리 동시 발사 — 순차 호출 대비 TTFB 단축
  const [gameApps, tournTeams, hostedGames] = await Promise.all([
    // 내가 신청한 경기 (game_applications)
    prisma.game_applications
      .findMany({
        where: { user_id: userId },
        orderBy: { created_at: "desc" },
        take: 50,
        include: {
          games: {
            select: {
              id: true,
              uuid: true,
              title: true,
              scheduled_at: true,
              venue_name: true,
              city: true,
              district: true,
              fee_per_person: true,
            },
          },
        },
      })
      .catch(() => []),

    // 내가 등록한 대회 팀 (tournamentTeam)
    prisma.tournamentTeam
      .findMany({
        where: { registered_by_id: userId },
        orderBy: { createdAt: "desc" },
        take: 50,
        include: {
          tournament: {
            select: {
              id: true,
              name: true,
              startDate: true,
              venue_name: true,
              city: true,
              entry_fee: true,
            },
          },
          team: {
            select: { id: true, name: true },
          },
        },
      })
      .catch(() => []),

    // 내가 만든 경기 (기존 로직 그대로, 하단 섹션)
    prisma.games
      .findMany({
        where: { organizer_id: userId },
        orderBy: { scheduled_at: "desc" },
        take: 10,
      })
      .catch(() => []),
  ]);

  // ====== Step 2: RegItem 변환 (경기 + 대회 통합) ======

  // 경기 신청 → RegItem
  const gameItems: RegItem[] = gameApps.map((a) => {
    // DB status 숫자코드 → 4종 상태 매핑
    // 0=대기 → pending / 1=승인 → confirmed or completed / 2=거부 → cancelled
    let status: RegStatus;
    if (a.status === 2) {
      status = "cancelled";
    } else if (a.status === 0) {
      status = "pending";
    } else {
      // status === 1 (승인) — 경기 일시가 과거면 completed, 미래면 confirmed
      const when = a.games?.scheduled_at ?? null;
      status = when && when < now ? "completed" : "confirmed";
    }

    const fee = a.games?.fee_per_person ?? 0;
    const place = [a.games?.venue_name, a.games?.district ?? a.games?.city]
      .filter(Boolean)
      .join(" · ");

    return {
      id: `g-${a.id.toString()}`,
      kind: "game" as const,
      status,
      title: a.games?.title ?? "경기",
      href: a.games?.uuid
        ? `/games/${a.games.uuid.slice(0, 8)}`
        : a.games?.id
          ? `/games/${a.games.id.toString()}`
          : "#",
      whenText: formatWhen(a.games?.scheduled_at),
      dateBlockText: dateBlockOf(a.games?.scheduled_at),
      placeText: place || null,
      // 예약번호 — DB 없음, id 기반으로 시안 포맷 모방
      code: `BDR-G-${a.id.toString().padStart(5, "0")}`,
      appliedText: formatApplied(a.created_at),
      fee: formatFee(fee),
      // paid_at 있으면 결제완료. 무료 경기는 자동 true (결제 필요 배지 숨김)
      paid: a.paid_at !== null || !fee || fee <= 0,
      role: a.is_guest ? ("guest" as const) : ("player" as const),
      teamName: null,
      note: a.message,
    };
  });

  // 대회 등록 → RegItem
  const tournItems: RegItem[] = tournTeams.map((t) => {
    // 대회 status 문자열 → 4종 상태 매핑
    // "pending" → pending / "approved"|"registered" → confirmed|completed / "rejected" → cancelled
    let status: RegStatus;
    if (t.status === "rejected" || t.status === "cancelled") {
      status = "cancelled";
    } else if (t.status === "pending" || !t.status) {
      status = "pending";
    } else {
      // approved / registered — 대회 시작일 과거면 completed
      const when = t.tournament?.startDate ?? null;
      status = when && when < now ? "completed" : "confirmed";
    }

    // entry_fee 는 Decimal — Number 변환. 0/null → 무료
    const feeNum = t.tournament?.entry_fee ? Number(t.tournament.entry_fee) : 0;
    const place = [t.tournament?.venue_name, t.tournament?.city]
      .filter(Boolean)
      .join(" · ");

    return {
      id: `t-${t.id.toString()}`,
      kind: "tournament" as const,
      status,
      title: t.tournament?.name ?? "대회",
      href: t.tournament?.id ? `/tournaments/${t.tournament.id}` : "#",
      whenText: formatWhen(t.tournament?.startDate),
      dateBlockText: dateBlockOf(t.tournament?.startDate),
      placeText: place || null,
      code: `BDR-T-${t.id.toString().padStart(5, "0")}`,
      appliedText: formatApplied(t.createdAt),
      fee: formatFee(feeNum),
      paid: t.paid_at !== null || feeNum <= 0,
      // 대회는 팀 등록자 = 팀장 가정 (manager_name 있으면 그대로)
      role: "team-captain" as const,
      teamName: t.team?.name ?? null,
      note: t.registration_note,
    };
  });

  // ====== Step 3: 탭별 분류 ======
  const all = [...gameItems, ...tournItems];
  const upcoming = all.filter((r) => r.status === "pending" || r.status === "confirmed");
  const past = all.filter((r) => r.status === "completed");
  const cancelled = all.filter((r) => r.status === "cancelled");

  // ====== Step 4: stat 계산 ======
  // "예정된 경기" = confirmed (미래 확정)
  const confirmedCount = upcoming.filter((r) => r.status === "confirmed").length;
  // "승인 대기"
  const pendingCount = upcoming.filter((r) => r.status === "pending").length;
  // "지난 경기"
  const pastCount = past.length;
  // "이번 달 결제" — paid_at 이 이번 달인 건만 집계
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthGamePaid = gameApps
    .filter((a) => a.paid_at && a.paid_at >= firstOfMonth)
    .reduce((sum, a) => sum + (a.games?.fee_per_person ?? 0), 0);
  const monthTournPaid = tournTeams
    .filter((t) => t.paid_at && t.paid_at >= firstOfMonth)
    .reduce((sum, t) => sum + (t.tournament?.entry_fee ? Number(t.tournament.entry_fee) : 0), 0);
  const monthPaidTotal = monthGamePaid + monthTournPaid;
  const monthPaidCount =
    gameApps.filter((a) => a.paid_at && a.paid_at >= firstOfMonth).length +
    tournTeams.filter((t) => t.paid_at && t.paid_at >= firstOfMonth).length;

  return (
    // v2 시안 .page 쉘 — globals.css 에 정의됨
    <div className="page">
      {/* Breadcrumb — 시안 그대로 */}
      <div
        style={{
          display: "flex",
          gap: 6,
          fontSize: 12,
          color: "var(--ink-mute)",
          marginBottom: 12,
        }}
      >
        <Link href="/" style={{ textDecoration: "none", color: "inherit" }}>
          홈
        </Link>
        <span>›</span>
        <Link href="/profile" style={{ textDecoration: "none", color: "inherit" }}>
          마이페이지
        </Link>
        <span>›</span>
        <span style={{ color: "var(--ink)" }}>내 신청 내역</span>
      </div>

      {/* 타이틀 + 총 건수 */}
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          marginBottom: 8,
        }}
      >
        <h1
          style={{
            margin: 0,
            fontSize: 28,
            fontWeight: 800,
            letterSpacing: "-0.015em",
          }}
        >
          내 신청 내역
        </h1>
        <div style={{ fontSize: 12, color: "var(--ink-dim)" }}>
          총 <b style={{ color: "var(--ink)" }}>{all.length}</b>건
        </div>
      </div>
      <p
        style={{
          margin: "0 0 20px",
          color: "var(--ink-mute)",
          fontSize: 14,
        }}
      >
        경기·대회 신청 현황과 결제 내역을 한눈에 관리하세요.
      </p>

      {/* 4열 stat 카드 */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 12,
          marginBottom: 20,
        }}
      >
        <StatCard label="예정된 경기" value={confirmedCount} sub="확정" />
        <StatCard label="승인 대기" value={pendingCount} sub="호스트 응답 대기" />
        <StatCard label="지난 경기" value={pastCount} sub="완료된 참가" />
        <StatCard
          label="이번 달 결제"
          value={formatKoCurrency(monthPaidTotal)}
          sub={`${monthPaidCount}건 · ${thisMonthLabel()}`}
        />
      </div>

      {/* 탭 + 리스트 + 배너 + 정책 footnote — client 쉘 */}
      <MyGamesClient upcoming={upcoming} past={past} cancelled={cancelled} />

      {/* ============================================================
       * 하단: 내가 만든 경기 (기존 로직 보존, v2 .card 재스타일)
       * ============================================================ */}
      <section style={{ marginTop: 48 }}>
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            justifyContent: "space-between",
            marginBottom: 12,
          }}
        >
          <h2
            style={{
              margin: 0,
              fontSize: 20,
              fontWeight: 800,
              letterSpacing: "-0.01em",
            }}
          >
            내가 만든 경기
          </h2>
          <Link
            href="/games/new"
            className="btn btn--primary btn--sm"
            style={{ textDecoration: "none" }}
          >
            + 새 경기
          </Link>
        </div>

        {hostedGames.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {hostedGames.map((g) => (
              <Link
                key={g.id.toString()}
                href={`/games/${g.uuid?.slice(0, 8) ?? g.id.toString()}`}
                className="card"
                style={{
                  padding: "14px 18px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                  textDecoration: "none",
                  color: "inherit",
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <p
                    style={{
                      margin: 0,
                      fontWeight: 700,
                      fontSize: 14.5,
                      color: "var(--ink)",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {g.title ?? "제목 없음"}
                  </p>
                  <p
                    style={{
                      margin: "4px 0 0",
                      fontSize: 12,
                      color: "var(--ink-mute)",
                    }}
                  >
                    {g.scheduled_at
                      ? g.scheduled_at.toLocaleString("ko-KR", {
                          timeZone: "Asia/Seoul",
                          month: "2-digit",
                          day: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "일정 미정"}
                    {" · "}
                    {g.venue_name ?? g.city ?? "-"}
                  </p>
                </div>
                <span className="badge" style={{ flexShrink: 0 }}>
                  {GAME_STATUS_LABEL[g.status] ?? "대기"}
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <div
            className="card"
            style={{
              padding: "40px 20px",
              textAlign: "center",
              color: "var(--ink-mute)",
            }}
          >
            <div style={{ fontSize: 28, marginBottom: 8 }} aria-hidden>
              🏀
            </div>
            <p style={{ margin: "0 0 12px", fontSize: 13 }}>만든 경기가 없습니다.</p>
            <Link
              href="/games/new"
              className="btn btn--primary btn--sm"
              style={{ textDecoration: "none" }}
            >
              경기 만들기
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}
