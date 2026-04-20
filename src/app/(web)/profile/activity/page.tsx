"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useToast } from "@/contexts/toast-context";

/* ============================================================
 * /profile/activity — 내 활동 통합 뷰 (W4 M4)
 *
 * 이유: 기존에는 "내 대회 참가 이력", "내 경기 신청", "내 팀 가입 신청"이
 *      각기 다른 경로/페이지/UI로 흩어져 있었다. 사용자 멘탈 모델은
 *      "내가 뭘 신청했더라?" 단일. 3개 탭으로 통합해 진입 비용을 낮춘다.
 *
 * 구조: client 컴포넌트. `?tab=tournaments|games|teams` 로 탭 상태 보존.
 *      탭 전환 시 해당 type만 /api/web/me/activity 로 fetch.
 *
 * M7 4번 연동: 팀 탭의 pending 카드에 "신청 취소" 빠른 액션
 *            (DELETE /api/web/teams/[id]/my-application — M7에서 신설).
 *
 * ⚠️ apiSuccess 래핑 없음 + snake_case 자동 변환 (errors.md 6회차 가드):
 *    응답은 { items: [...] } 최상위. 각 item의 필드는 snake_case로 접근.
 * ============================================================ */

type Tab = "tournaments" | "games" | "teams";

// 탭별 아이템 타입 — API 응답 구조(snake_case)와 일치
type TournamentItem = {
  id: string;
  status: string; // "pending" | "approved" | "rejected" | ...
  created_at: string;
  tournament: {
    id: string;
    name: string;
    start_date: string | null;
    venue_name: string | null;
    city: string | null;
    status: string | null;
  };
  team: { id: string; uuid: string | null; name: string };
};

type GameItem = {
  id: string;
  status: number; // 0=대기, 1=승인, 2=거부
  created_at: string;
  game: {
    id: string;
    uuid: string | null;
    title: string | null;
    scheduled_at: string | null;
    venue_name: string | null;
    city: string | null;
    status: number;
  } | null;
};

type TeamItem = {
  id: string;
  status: string; // "pending" | "approved" | "rejected"
  created_at: string;
  rejection_reason: string | null;
  team: {
    id: string;
    uuid: string | null;
    name: string;
    city: string | null;
    district: string | null;
  };
};

// 탭 탭바 정의 — 순서: 경기(가장 빈번) → 대회 → 팀
const TABS: { key: Tab; label: string; icon: string }[] = [
  { key: "games", label: "내 경기 신청", icon: "sports_basketball" },
  { key: "tournaments", label: "내 대회 신청", icon: "emoji_events" },
  { key: "teams", label: "내 팀 가입", icon: "groups" },
];

// 한국어 상태 라벨 — 각 도메인이 상태값 형태가 달라 분리
const GAME_APP_STATUS: Record<number, { label: string; tone: "warn" | "success" | "error" | "muted" }> = {
  0: { label: "대기", tone: "warn" },
  1: { label: "승인", tone: "success" },
  2: { label: "거부", tone: "error" },
};
const STRING_STATUS: Record<string, { label: string; tone: "warn" | "success" | "error" | "muted" }> = {
  pending: { label: "대기", tone: "warn" },
  approved: { label: "승인", tone: "success" },
  rejected: { label: "거부", tone: "error" },
  registered: { label: "등록", tone: "success" },
  cancelled: { label: "취소", tone: "muted" },
};

function StatusBadge({ tone, label }: { tone: "warn" | "success" | "error" | "muted"; label: string }) {
  // CSS 변수 기반 배지 — 하드코딩 색상 금지 (CLAUDE.md)
  const bg =
    tone === "success"
      ? "color-mix(in srgb, var(--color-success) 15%, transparent)"
      : tone === "error"
        ? "color-mix(in srgb, var(--color-error) 15%, transparent)"
        : tone === "warn"
          ? "color-mix(in srgb, var(--color-primary) 15%, transparent)"
          : "var(--color-surface-bright)";
  const fg =
    tone === "success"
      ? "var(--color-success)"
      : tone === "error"
        ? "var(--color-error)"
        : tone === "warn"
          ? "var(--color-primary)"
          : "var(--color-text-muted)";
  return (
    <span
      className="inline-flex shrink-0 items-center px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide"
      style={{ backgroundColor: bg, color: fg, borderRadius: 4 }}
    >
      {label}
    </span>
  );
}

// 날짜 포맷 — ISO string 또는 null
function formatWhen(iso: string | null | undefined) {
  if (!iso) return null;
  try {
    const d = new Date(iso);
    return d.toLocaleString("ko-KR", {
      timeZone: "Asia/Seoul",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return null;
  }
}

// 신청 시각 (짧은 상대/절대 혼합)
function formatApplied(iso: string) {
  try {
    const then = new Date(iso).getTime();
    const diff = Date.now() - then;
    if (diff < 60_000) return "방금 신청";
    if (diff < 3600_000) return `${Math.floor(diff / 60_000)}분 전 신청`;
    if (diff < 86400_000) return `${Math.floor(diff / 3600_000)}시간 전 신청`;
    if (diff < 7 * 86400_000) return `${Math.floor(diff / 86400_000)}일 전 신청`;
    return `${new Date(iso).toLocaleDateString("ko-KR")} 신청`;
  } catch {
    return "";
  }
}

export default function ProfileActivityPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const { showToast } = useToast();

  // 현재 탭 — 쿼리 파라미터에서 파싱. 기본 games (사용 빈도 가장 높다고 가정)
  const rawTab = searchParams.get("tab");
  const tab: Tab =
    rawTab === "tournaments" ? "tournaments" : rawTab === "teams" ? "teams" : "games";

  // 3 탭 데이터 병렬 캐시 — 탭 전환 시 재fetch 없이 배지·리스트 즉시 표시
  // 캐시 목적: (1) 다른 탭에 몇 건 있는지 탭 바에 배지로 미리 보여주기
  //          (2) 탭 전환 시 로딩 스피너 깜빡임 제거
  const [cache, setCache] = useState<{
    games: GameItem[];
    tournaments: TournamentItem[];
    teams: TeamItem[];
  }>({ games: [], tournaments: [], teams: [] });
  const [loading, setLoading] = useState(true);

  // 단일 탭 refetch — cancel/action 후 해당 탭만 갱신
  const loadOne = useCallback(async (type: Tab) => {
    try {
      const res = await fetch(`/api/web/me/activity?type=${type}`, {
        credentials: "include",
      });
      if (!res.ok) return;
      const json = (await res.json()) as { items?: unknown };
      const items = Array.isArray(json.items) ? json.items : [];
      setCache((prev) => ({ ...prev, [type]: items as never }));
    } catch {
      // 무시 — 기존 캐시 유지
    }
  }, []);

  // 초기 1회: 3 탭 병렬 fetch
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [g, t, te] = await Promise.all([
          fetch("/api/web/me/activity?type=games", { credentials: "include" }).then((r) =>
            r.ok ? (r.json() as Promise<{ items?: GameItem[] }>) : { items: [] },
          ),
          fetch("/api/web/me/activity?type=tournaments", { credentials: "include" }).then(
            (r) => (r.ok ? (r.json() as Promise<{ items?: TournamentItem[] }>) : { items: [] }),
          ),
          fetch("/api/web/me/activity?type=teams", { credentials: "include" }).then((r) =>
            r.ok ? (r.json() as Promise<{ items?: TeamItem[] }>) : { items: [] },
          ),
        ]);
        if (cancelled) return;
        setCache({
          games: Array.isArray(g.items) ? g.items : [],
          tournaments: Array.isArray(t.items) ? t.items : [],
          teams: Array.isArray(te.items) ? te.items : [],
        });
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const items = cache[tab];
  const counts = {
    games: cache.games.length,
    tournaments: cache.tournaments.length,
    teams: cache.teams.length,
  };

  function changeTab(next: Tab) {
    if (next === tab) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", next);
    router.replace(`${pathname}?${params.toString()}`);
  }

  /* 팀 가입 취소 — M7 DELETE API 재활용. pending 건에만 노출 */
  async function cancelTeamJoin(teamId: string) {
    if (!confirm("가입 신청을 취소할까요?")) return;
    try {
      const res = await fetch(`/api/web/teams/${teamId}/my-application`, {
        method: "DELETE",
        credentials: "include",
      });
      const body = (await res.json()) as { message?: string; error?: string };
      if (res.ok) {
        showToast(body.message ?? "신청이 취소되었습니다.", "success");
        await loadOne("teams"); // teams 탭만 refetch
      } else {
        showToast(body.error ?? "취소 중 오류가 발생했습니다.", "error");
      }
    } catch {
      showToast("네트워크 오류가 발생했습니다.", "error");
    }
  }

  return (
    <div className="space-y-6">
      {/* 페이지 헤더 */}
      <header>
        <h1
          className="text-xl font-extrabold uppercase tracking-wide sm:text-2xl"
          style={{ fontFamily: "var(--font-heading)", color: "var(--color-text-primary)" }}
        >
          내 활동
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--color-text-muted)" }}>
          내가 신청한 경기·대회, 가입 신청한 팀 현황을 한눈에 확인하세요.
        </p>
      </header>

      {/* 탭 바 */}
      <div
        className="flex gap-1 border-b overflow-x-auto scrollbar-none"
        style={{ borderColor: "var(--color-border)" }}
      >
        {TABS.map((t) => {
          const active = tab === t.key;
          const count = counts[t.key];
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => changeTab(t.key)}
              className={`flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-2 text-sm font-bold transition-colors ${
                active ? "" : "border-transparent"
              }`}
              style={{
                borderColor: active ? "var(--color-primary)" : undefined,
                color: active ? "var(--color-primary)" : "var(--color-text-muted)",
              }}
            >
              <span
                className="material-symbols-outlined text-base"
                style={active ? { fontVariationSettings: "'FILL' 1" } : undefined}
              >
                {t.icon}
              </span>
              {t.label}
              {/* 건수 배지 — 0건이거나 아직 로딩 중이면 숨김 */}
              {count > 0 && (
                <span
                  className="inline-flex items-center justify-center px-1.5 text-[10px] font-black tabular-nums"
                  style={{
                    backgroundColor: active
                      ? "var(--color-primary)"
                      : "var(--color-surface-bright)",
                    color: active ? "#fff" : "var(--color-text-muted)",
                    borderRadius: 4,
                    minWidth: "1.25rem",
                    height: "1rem",
                    lineHeight: 1,
                  }}
                >
                  {count > 99 ? "99+" : count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* 본문 */}
      {loading ? (
        <div
          className="py-12 text-center text-sm"
          style={{ color: "var(--color-text-muted)" }}
        >
          불러오는 중...
        </div>
      ) : items.length === 0 ? (
        <EmptyState tab={tab} />
      ) : (
        <div className="space-y-2">
          {tab === "games" &&
            (items as GameItem[]).map((it) => <GameCard key={it.id} item={it} />)}
          {tab === "tournaments" &&
            (items as TournamentItem[]).map((it) => (
              <TournamentCard key={it.id} item={it} />
            ))}
          {tab === "teams" &&
            (items as TeamItem[]).map((it) => (
              <TeamCard key={it.id} item={it} onCancel={cancelTeamJoin} />
            ))}
        </div>
      )}
    </div>
  );
}

/* ============================================================
 * 빈 상태 — 탭별 CTA 링크
 * ============================================================ */
function EmptyState({ tab }: { tab: Tab }) {
  const config: Record<Tab, { msg: string; cta: string; href: string; icon: string }> = {
    games: {
      msg: "아직 신청한 경기가 없어요",
      cta: "경기 둘러보기",
      href: "/games",
      icon: "sports_basketball",
    },
    tournaments: {
      msg: "아직 신청한 대회가 없어요",
      cta: "대회 보러 가기",
      href: "/tournaments",
      icon: "emoji_events",
    },
    teams: {
      msg: "아직 가입 신청한 팀이 없어요",
      cta: "팀 둘러보기",
      href: "/teams",
      icon: "groups",
    },
  };
  const c = config[tab];
  return (
    <div
      className="flex flex-col items-center justify-center gap-3 py-12 text-center"
      style={{
        border: "1px dashed var(--color-border)",
        borderRadius: 4,
        color: "var(--color-text-muted)",
      }}
    >
      <span
        className="material-symbols-outlined text-4xl"
        style={{ color: "var(--color-text-muted)" }}
        aria-hidden
      >
        {c.icon}
      </span>
      <p className="text-sm">{c.msg}</p>
      <Link
        href={c.href}
        className="inline-flex items-center gap-1 px-4 py-2 text-xs font-bold uppercase tracking-wide"
        style={{
          backgroundColor: "var(--color-primary)",
          color: "#fff",
          borderRadius: 4,
        }}
      >
        {c.cta}
        <span className="material-symbols-outlined text-sm" aria-hidden>
          arrow_forward
        </span>
      </Link>
    </div>
  );
}

/* ============================================================
 * 카드 3종 — 공통 레이아웃 + 도메인별 info
 * ============================================================ */

function GameCard({ item }: { item: GameItem }) {
  const st = GAME_APP_STATUS[item.status] ?? GAME_APP_STATUS[0];
  const g = item.game;
  const when = formatWhen(g?.scheduled_at);
  const href = g?.uuid ? `/games/${g.uuid.slice(0, 8)}` : g?.id ? `/games/${g.id}` : "#";
  return (
    <Link
      href={href}
      className="flex items-center justify-between gap-3 border px-4 py-3 transition-colors hover:opacity-90"
      style={{
        borderColor: "var(--color-border)",
        backgroundColor: "var(--color-card)",
        borderRadius: 4,
      }}
    >
      <div className="min-w-0">
        <p
          className="truncate text-sm font-semibold"
          style={{ color: "var(--color-text-primary)" }}
        >
          {g?.title ?? "경기"}
        </p>
        <p className="mt-0.5 text-xs" style={{ color: "var(--color-text-muted)" }}>
          {[when, g?.venue_name ?? g?.city].filter(Boolean).join(" · ") || "-"}
        </p>
        <p className="mt-1 text-[10px]" style={{ color: "var(--color-text-muted)" }}>
          {formatApplied(item.created_at)}
        </p>
      </div>
      <StatusBadge tone={st.tone} label={st.label} />
    </Link>
  );
}

function TournamentCard({ item }: { item: TournamentItem }) {
  const st = STRING_STATUS[item.status] ?? { label: item.status, tone: "muted" as const };
  const t = item.tournament;
  const when = formatWhen(t.start_date);
  const href = `/tournaments/${t.id}`;
  return (
    <Link
      href={href}
      className="flex items-center justify-between gap-3 border px-4 py-3 transition-colors hover:opacity-90"
      style={{
        borderColor: "var(--color-border)",
        backgroundColor: "var(--color-card)",
        borderRadius: 4,
      }}
    >
      <div className="min-w-0">
        <p
          className="truncate text-sm font-semibold"
          style={{ color: "var(--color-text-primary)" }}
        >
          {t.name}
        </p>
        <p className="mt-0.5 text-xs" style={{ color: "var(--color-text-muted)" }}>
          {[when, t.venue_name ?? t.city, `팀: ${item.team.name}`]
            .filter(Boolean)
            .join(" · ")}
        </p>
        <p className="mt-1 text-[10px]" style={{ color: "var(--color-text-muted)" }}>
          {formatApplied(item.created_at)}
        </p>
      </div>
      <StatusBadge tone={st.tone} label={st.label} />
    </Link>
  );
}

function TeamCard({
  item,
  onCancel,
}: {
  item: TeamItem;
  onCancel: (teamId: string) => void;
}) {
  const st = STRING_STATUS[item.status] ?? { label: item.status, tone: "muted" as const };
  const isPending = item.status === "pending";
  const location = [item.team.city, item.team.district].filter(Boolean).join(" ");
  const href = `/teams/${item.team.uuid ?? item.team.id}`;
  return (
    <div
      className="flex items-center justify-between gap-3 border px-4 py-3"
      style={{
        borderColor: "var(--color-border)",
        backgroundColor: "var(--color-card)",
        borderRadius: 4,
      }}
    >
      {/* 좌측: 링크 영역 (이름/지역/신청 시각/거부 사유) */}
      <Link href={href} className="min-w-0 flex-1 transition-colors hover:opacity-90">
        <p
          className="truncate text-sm font-semibold"
          style={{ color: "var(--color-text-primary)" }}
        >
          {item.team.name}
        </p>
        <p className="mt-0.5 text-xs" style={{ color: "var(--color-text-muted)" }}>
          {[location, formatApplied(item.created_at)].filter(Boolean).join(" · ") || "-"}
        </p>
        {item.status === "rejected" && item.rejection_reason && (
          <p
            className="mt-1 text-[11px]"
            style={{ color: "var(--color-error)" }}
          >
            사유: {item.rejection_reason}
          </p>
        )}
      </Link>

      {/* 우측: 상태 배지 + (pending일 때) 취소 버튼 — M7 4번 */}
      <div className="flex shrink-0 items-center gap-2">
        <StatusBadge tone={st.tone} label={st.label} />
        {isPending && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              onCancel(item.team.id);
            }}
            className="text-[11px] font-semibold underline-offset-2 hover:underline"
            style={{ color: "var(--color-text-muted)" }}
          >
            취소
          </button>
        )}
      </div>
    </div>
  );
}
