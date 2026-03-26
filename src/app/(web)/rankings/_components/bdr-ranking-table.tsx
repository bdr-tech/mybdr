"use client";

import { useState, useEffect, useMemo } from "react";
import { Skeleton } from "@/components/ui/skeleton";

/* ============================================================
 * 타입 정의
 * ============================================================ */

// BDR 랭킹 항목 (API 응답 형태)
interface BdrRankingItem {
  rank: number;
  team: string;
  city: string;
  score: number;
  move: number;
  score_change: number; // apiSuccess가 snake_case로 변환
}

// Props: 어떤 부(division)의 데이터를 보여줄지
interface BdrRankingTableProps {
  division: "general" | "university";
}

/* ============================================================
 * 테이블 스켈레톤 (로딩 중 표시)
 * ============================================================ */
function TableSkeleton() {
  return (
    <div
      className="rounded-lg border overflow-hidden"
      style={{
        borderColor: "var(--color-border)",
        backgroundColor: "var(--color-surface)",
      }}
    >
      <div className="px-4 py-3" style={{ backgroundColor: "var(--color-elevated)" }}>
        <Skeleton className="h-4 w-full" />
      </div>
      {Array.from({ length: 10 }).map((_, i) => (
        <div
          key={i}
          className="px-4 py-3"
          style={{ borderTop: "1px solid var(--color-border)" }}
        >
          <Skeleton className="h-4 w-full" />
        </div>
      ))}
    </div>
  );
}

/* ============================================================
 * 순위 변동 배지 컴포넌트
 * - 양수: 초록색 상승 화살표
 * - 음수: 빨간색 하락 화살표
 * - 0: 회색 가로줄 (변동 없음)
 * ============================================================ */
function MoveBadge({ value }: { value: number }) {
  if (value > 0) {
    return (
      <span className="inline-flex items-center gap-0.5 text-xs font-bold" style={{ color: "var(--color-success)" }}>
        <span className="material-symbols-outlined text-sm">arrow_upward</span>
        +{value}
      </span>
    );
  }
  if (value < 0) {
    return (
      <span className="inline-flex items-center gap-0.5 text-xs font-bold" style={{ color: "var(--color-primary)" }}>
        <span className="material-symbols-outlined text-sm">arrow_downward</span>
        {value}
      </span>
    );
  }
  // 변동 없음
  return (
    <span className="inline-flex items-center text-xs" style={{ color: "var(--color-text-disabled)" }}>
      <span className="material-symbols-outlined text-sm">remove</span>
    </span>
  );
}

/* ============================================================
 * 점수 변화 배지 컴포넌트
 * ============================================================ */
function ScoreChangeBadge({ value }: { value: number }) {
  if (value > 0) {
    return (
      <span className="text-xs font-bold" style={{ color: "var(--color-success)" }}>
        +{value.toFixed(1)}
      </span>
    );
  }
  if (value < 0) {
    return (
      <span className="text-xs font-bold" style={{ color: "var(--color-primary)" }}>
        {value.toFixed(1)}
      </span>
    );
  }
  return (
    <span className="text-xs" style={{ color: "var(--color-text-disabled)" }}>
      -
    </span>
  );
}

/* ============================================================
 * 순위 표시 (1~3위는 메달 아이콘으로 강조)
 * ============================================================ */
function RankDisplay({ rank }: { rank: number }) {
  // 1~3위: 메달 색상으로 emoji_events 아이콘 표시
  if (rank <= 3) {
    // 금/은/동 색상 (CSS 변수가 없으므로 메달 전용 색상 사용)
    const medalColors: Record<number, string> = {
      1: "#FFD700", // 금
      2: "#C0C0C0", // 은
      3: "#CD7F32", // 동
    };
    return (
      <span className="inline-flex items-center justify-center">
        <span
          className="material-symbols-outlined text-lg"
          style={{
            color: medalColors[rank],
            fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24",
          }}
        >
          emoji_events
        </span>
      </span>
    );
  }
  // 4위 이하: 숫자 표시
  return (
    <span
      className="text-sm font-black"
      style={{ color: "var(--color-text-muted)" }}
    >
      {rank}
    </span>
  );
}

/* ============================================================
 * 메인 컴포넌트: BdrRankingTable
 * - API에서 외부 BDR 랭킹 데이터를 가져와 테이블로 표시
 * - 팀명/지역 검색 기능 포함
 * ============================================================ */
export function BdrRankingTable({ division }: BdrRankingTableProps) {
  // 데이터 상태
  const [rankings, setRankings] = useState<BdrRankingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  // 검색어 상태
  const [searchQuery, setSearchQuery] = useState("");

  // division이 바뀌면 API 호출
  useEffect(() => {
    setLoading(true);
    setError(false);
    setSearchQuery(""); // 탭 전환 시 검색어 초기화

    fetch(`/api/web/rankings/bdr?division=${division}`)
      .then(async (res) => {
        if (!res.ok) throw new Error("API error");
        return res.json();
      })
      .then((data) => {
        setRankings(data.rankings ?? []);
      })
      .catch(() => {
        setRankings([]);
        setError(true);
      })
      .finally(() => setLoading(false));
  }, [division]);

  // 검색 필터: 팀명 또는 지역에 검색어 포함
  const filteredRankings = useMemo(() => {
    if (!searchQuery.trim()) return rankings;
    const q = searchQuery.trim().toLowerCase();
    return rankings.filter(
      (item) =>
        item.team.toLowerCase().includes(q) ||
        item.city.toLowerCase().includes(q)
    );
  }, [rankings, searchQuery]);

  // 로딩 중
  if (loading) return <TableSkeleton />;

  // 에러 상태
  if (error) {
    return (
      <div className="py-20 text-center">
        <span
          className="material-symbols-outlined text-5xl mb-3 block"
          style={{ color: "var(--color-text-disabled)" }}
        >
          cloud_off
        </span>
        <p style={{ color: "var(--color-text-secondary)" }}>
          랭킹 데이터를 불러올 수 없습니다.
        </p>
        <p className="text-xs mt-1" style={{ color: "var(--color-text-disabled)" }}>
          잠시 후 다시 시도해주세요.
        </p>
      </div>
    );
  }

  // 데이터 없음
  if (rankings.length === 0) {
    return (
      <div className="py-20 text-center">
        <span
          className="material-symbols-outlined text-5xl mb-3 block"
          style={{ color: "var(--color-text-disabled)" }}
        >
          leaderboard
        </span>
        <p style={{ color: "var(--color-text-secondary)" }}>
          등록된 랭킹 데이터가 없습니다.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* 검색 입력 + 결과 수 */}
      <div className="flex items-center gap-3 mb-4">
        <div
          className="flex items-center gap-2 flex-1 px-3 py-2 rounded border"
          style={{
            borderColor: "var(--color-border)",
            backgroundColor: "var(--color-elevated)",
          }}
        >
          <span
            className="material-symbols-outlined text-lg"
            style={{ color: "var(--color-text-disabled)" }}
          >
            search
          </span>
          <input
            type="text"
            placeholder="팀명 또는 지역으로 검색"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent text-sm outline-none"
            style={{ color: "var(--color-text-primary)" }}
          />
          {/* 검색어가 있으면 X 버튼 표시 */}
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="flex items-center"
              style={{ color: "var(--color-text-disabled)" }}
            >
              <span className="material-symbols-outlined text-sm">close</span>
            </button>
          )}
        </div>
        {/* 총 팀 수 표시 */}
        <span className="text-xs whitespace-nowrap" style={{ color: "var(--color-text-disabled)" }}>
          {filteredRankings.length}개 팀
        </span>
      </div>

      {/* 테이블 */}
      <div
        className="rounded-lg border overflow-hidden"
        style={{
          borderColor: "var(--color-border)",
          backgroundColor: "var(--color-surface)",
        }}
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px]">
            {/* 테이블 헤더 */}
            <thead>
              <tr
                className="text-xs font-bold uppercase tracking-wider"
                style={{
                  backgroundColor: "var(--color-elevated)",
                  color: "var(--color-text-muted)",
                }}
              >
                <th className="px-4 py-3 text-center w-14">#</th>
                <th className="px-4 py-3 text-left">팀명</th>
                <th className="px-4 py-3 text-center w-20">지역</th>
                <th className="px-4 py-3 text-center w-20">점수</th>
                <th className="px-4 py-3 text-center w-20">순위변동</th>
                <th className="px-4 py-3 text-center w-24">점수변화</th>
              </tr>
            </thead>
            <tbody>
              {filteredRankings.length === 0 ? (
                // 검색 결과 없음
                <tr>
                  <td colSpan={6} className="py-12 text-center">
                    <span
                      className="material-symbols-outlined text-3xl mb-2 block"
                      style={{ color: "var(--color-text-disabled)" }}
                    >
                      search_off
                    </span>
                    <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                      검색 결과가 없습니다.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredRankings.map((item) => (
                  <tr
                    key={`${item.rank}-${item.team}`}
                    className="transition-colors hover:bg-[var(--color-elevated)]"
                    style={{ borderTop: "1px solid var(--color-border)" }}
                  >
                    {/* 순위 (1~3위 메달) */}
                    <td className="px-4 py-3 text-center">
                      <RankDisplay rank={item.rank} />
                    </td>

                    {/* 팀명 */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {/* 팀 이니셜 원 */}
                        <div
                          className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold text-white"
                          style={{ backgroundColor: "var(--color-navy, #1B3C87)" }}
                        >
                          {item.team?.[0] ?? "?"}
                        </div>
                        <span
                          className="text-sm font-bold"
                          style={{ color: "var(--color-text-primary)" }}
                        >
                          {item.team}
                        </span>
                      </div>
                    </td>

                    {/* 지역 */}
                    <td
                      className="px-4 py-3 text-center text-xs"
                      style={{ color: "var(--color-text-secondary)" }}
                    >
                      {item.city || "-"}
                    </td>

                    {/* 점수 */}
                    <td className="px-4 py-3 text-center">
                      <span
                        className="text-sm font-bold"
                        style={{ color: "var(--color-info, #0079B9)" }}
                      >
                        {item.score.toFixed(1)}
                      </span>
                    </td>

                    {/* 순위변동 */}
                    <td className="px-4 py-3 text-center">
                      <MoveBadge value={item.move} />
                    </td>

                    {/* 점수변화 */}
                    <td className="px-4 py-3 text-center">
                      <ScoreChangeBadge value={item.score_change} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
