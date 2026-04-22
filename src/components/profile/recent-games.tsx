/**
 * RecentGames — 공용 최근 경기 리스트/테이블
 *
 * 왜:
 * - 본인(/profile)과 타인(/users/[id])에 각각 별도 구현이 있어 유지보수 비용이 컸다:
 *   · profile/_components/recent-games-section.tsx — 간단 목록 + chevron + "전체보기"
 *   · users/[id]/_components/user-recent-games.tsx   — 스탯 컬럼 포함 테이블
 * - 본 컴포넌트는 `variant` prop으로 두 UI를 모두 지원하는 공용 컴포넌트.
 *
 * 어떻게:
 * - variant="list"  → 날짜 + 제목 + chevron (본인용)
 * - variant="table" → 날짜 + 제목 + 개인 스탯 (타인용)
 * - games 배열은 양쪽 호출자에서 각자 DB → props 매핑을 책임 (컴포넌트는 표시만).
 * - 색상 전부 CSS 변수, Material Symbols 아이콘.
 */

import Link from "next/link";

export interface RecentGameRow {
  /** 경기 ID (list variant에서 /games/[id] 링크로 이동할 때 사용) */
  id?: string;
  /** 경기 제목 (null이면 "경기"로 표시) */
  gameTitle: string | null;
  /** 경기 예정 일시 (ISO 문자열 또는 null) */
  scheduledAt: string | null;
  /** 개인 스탯 — table variant에서만 사용 */
  points?: number;
  assists?: number;
  rebounds?: number;
  steals?: number;
}

export interface RecentGamesProps {
  games: RecentGameRow[];
  /**
   * 표시 형식:
   * - "list"  = 본인 대시보드용 간단 목록 (아이콘 + 제목 + chevron)
   * - "table" = 타인 프로필용 상세 테이블 (스탯 컬럼 포함)
   */
  variant: "list" | "table";
  /** "전체보기" 링크. 있을 때만 헤더 우측에 렌더 */
  showMoreHref?: string;
  /** 헤더 타이틀 (기본: "최근 경기 기록") */
  title?: string;
}

export function RecentGames({
  games,
  variant,
  showMoreHref,
  title = "최근 경기 기록",
}: RecentGamesProps) {
  const items = games.slice(0, 5);

  return (
    <div
      className="rounded-md border overflow-hidden"
      style={{
        borderColor: "var(--color-border)",
        backgroundColor: "var(--color-surface)",
      }}
    >
      {/* 공통 헤더: 타이틀 + "전체보기" 링크 (옵션) */}
      <div
        className="px-5 py-4 flex justify-between items-center border-b"
        style={{ borderColor: "var(--color-border)" }}
      >
        {/*
          heading 계층 — 이 컴포넌트는 페이지 h1 바로 아래 섹션으로 쓰인다
          (/users/[id], /profile 양쪽 모두). 그래서 h2가 올바른 레벨.
        */}
        <h2
          className="font-bold text-lg"
          style={{ color: "var(--color-text-primary)" }}
        >
          {title}
        </h2>
        {showMoreHref && (
          <Link
            href={showMoreHref}
            className="text-xs transition-all hover:opacity-80"
            style={{ color: "var(--color-text-muted)" }}
          >
            전체보기
          </Link>
        )}
      </div>

      {/* 빈 상태 — 양 variant 공통 */}
      {items.length === 0 ? (
        <div className="px-5 py-8 text-center">
          <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
            참여한 경기가 없습니다
          </p>
        </div>
      ) : variant === "list" ? (
        // ============================ LIST variant ============================
        // 본인 대시보드: 각 행이 Link, chevron 아이콘으로 시안(bdr_1) 복원
        <div>
          {items.map((g, index) => {
            const dateStr = g.scheduledAt
              ? new Date(g.scheduledAt).toLocaleDateString("ko-KR", {
                  month: "2-digit",
                  day: "2-digit",
                })
              : "-";
            // id가 있으면 Link, 없으면 div (클릭 불가 상태)
            const key = g.id ?? `${g.gameTitle ?? ""}-${index}`;
            const row = (
              <div
                className="px-5 py-3.5 flex items-center gap-4 transition-colors hover:opacity-80"
                style={{
                  borderBottom:
                    index < items.length - 1
                      ? "1px solid var(--color-border)"
                      : "none",
                }}
              >
                <div className="w-12 text-center flex-shrink-0">
                  <div
                    className="text-xs"
                    style={{ color: "var(--color-text-muted)" }}
                  >
                    {dateStr}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div
                    className="font-medium text-sm truncate"
                    style={{ color: "var(--color-text-primary)" }}
                  >
                    {g.gameTitle ?? "경기"}
                  </div>
                </div>
                <span
                  className="material-symbols-outlined text-sm flex-shrink-0"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  chevron_right
                </span>
              </div>
            );
            // id가 있으면 /games/[id-slug] 경로로 링크 (기존 패턴 유지 — slice(0,8))
            return g.id ? (
              <Link key={key} href={`/games/${g.id.slice(0, 8)}`}>
                {row}
              </Link>
            ) : (
              <div key={key}>{row}</div>
            );
          })}
        </div>
      ) : (
        // ============================ TABLE variant ============================
        // 타인 프로필: 날짜 / 경기 / 개인 스탯(PTS/AST/REB) 컬럼
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr style={{ backgroundColor: "var(--color-card)" }}>
                <th
                  className="px-5 py-3 text-xs font-semibold uppercase tracking-wider"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  경기 날짜
                </th>
                <th
                  className="px-5 py-3 text-xs font-semibold uppercase tracking-wider"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  경기
                </th>
                <th
                  className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-right"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  개인 스탯
                </th>
              </tr>
            </thead>
            <tbody>
              {items.map((game, i) => (
                <tr
                  key={game.id ?? i}
                  className="transition-colors hover:opacity-80"
                  style={{
                    borderBottom:
                      i < items.length - 1
                        ? "1px solid var(--color-border)"
                        : "none",
                  }}
                >
                  <td
                    className="px-5 py-4 text-sm"
                    style={{ color: "var(--color-text-secondary)" }}
                  >
                    {game.scheduledAt
                      ? new Date(game.scheduledAt).toLocaleDateString("ko-KR")
                      : "-"}
                  </td>
                  <td
                    className="px-5 py-4 text-sm"
                    style={{ color: "var(--color-text-primary)" }}
                  >
                    {game.gameTitle ?? "경기"}
                  </td>
                  <td
                    className="px-5 py-4 text-sm text-right"
                    style={{ fontFamily: "var(--font-heading)" }}
                  >
                    <span style={{ color: "var(--color-primary)" }}>
                      {game.points ?? 0}
                    </span>
                    <span style={{ color: "var(--color-text-muted)" }}>
                      {" "}
                      PTS /{" "}
                    </span>
                    <span style={{ color: "var(--color-text-primary)" }}>
                      {game.assists ?? 0}
                    </span>
                    <span style={{ color: "var(--color-text-muted)" }}>
                      {" "}
                      AST /{" "}
                    </span>
                    <span style={{ color: "var(--color-text-primary)" }}>
                      {game.rebounds ?? 0}
                    </span>
                    <span style={{ color: "var(--color-text-muted)" }}>
                      {" "}
                      REB
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
