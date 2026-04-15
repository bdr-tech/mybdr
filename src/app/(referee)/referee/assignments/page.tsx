"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { EmptyState } from "../_components/empty-state";

/**
 * /referee/assignments — 내 배정 목록 (Client Component)
 *
 * 이유: 상태별 필터 탭 + 페이지네이션이 클라이언트 상태로 관리되어야 하므로 "use client".
 *      certificates 페이지와 동일한 UI 패턴 사용.
 *      데스크톱: 테이블, 모바일: 카드형.
 */

// ─── 타입 정의 ───
type MatchInfo = {
  id: string;
  tournament_name: string | null;
  scheduled_at: string | null;
  venue_name: string | null;
  round_name: string | null;
  match_status: string | null;
  home_team: string | null;
  away_team: string | null;
  home_score: number | null;
  away_score: number | null;
};

type Assignment = {
  id: string;
  role: string;
  role_label: string;
  status: string;
  assigned_at: string;
  memo: string | null;
  match: MatchInfo | null;
};

type ApiResponse = {
  items: Assignment[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
};

// ─── 상태 탭 정의 ───
const STATUS_TABS = [
  { value: "", label: "전체" },
  { value: "assigned", label: "배정됨" },
  { value: "confirmed", label: "확정" },
  { value: "declined", label: "거부" },
  { value: "cancelled", label: "취소" },
  { value: "completed", label: "완료" },
] as const;

// 상태별 뱃지 색상 (CSS 변수 기반)
const STATUS_BADGE: Record<string, { bg: string; color: string; label: string }> = {
  assigned:  { bg: "var(--color-info, #0079B9)",    color: "#fff", label: "배정됨" },
  confirmed: { bg: "var(--color-success, #22c55e)", color: "#fff", label: "확정" },
  declined:  { bg: "var(--color-primary)",           color: "#fff", label: "거부" },
  cancelled: { bg: "var(--color-text-muted)",        color: "#fff", label: "취소" },
  completed: { bg: "var(--color-navy, #1B3C87)",     color: "#fff", label: "완료" },
};

export default function RefereeAssignmentsPage() {
  const [items, setItems] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // 필터 & 페이지네이션 상태
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // 목록 조회
  const loadList = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set("status", statusFilter);
      params.set("page", String(page));
      params.set("limit", "20");

      const res = await fetch(`/api/web/referee-assignments?${params}`, {
        credentials: "include",
      });

      if (res.ok) {
        const data = (await res.json()) as ApiResponse;
        setItems(data.items ?? []);
        setTotal(data.total ?? 0);
        setTotalPages(data.total_pages ?? 1);
        setErrorCode(null);
        setErrorMsg(null);
      } else {
        let code: string | null = null;
        let msg: string | null = null;
        try {
          const data = (await res.json()) as { code?: string; error?: string };
          code = data.code ?? null;
          msg = data.error ?? null;
        } catch { /* 무시 */ }
        setErrorCode(code);
        setErrorMsg(msg ?? "배정 목록을 불러올 수 없습니다.");
        setItems([]);
      }
    } catch {
      setErrorMsg("네트워크 오류가 발생했습니다.");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, page]);

  useEffect(() => {
    void loadList();
  }, [loadList]);

  // 필터 변경 시 1페이지로 리셋
  const handleStatusChange = (value: string) => {
    setStatusFilter(value);
    setPage(1);
  };

  // 프로필 미등록 상태
  if (errorCode === "NO_REFEREE_PROFILE") {
    return (
      <div className="space-y-6">
        <PageHeader total={0} />
        <EmptyState
          icon="badge"
          title="심판 프로필이 필요합니다"
          description="배정 기록을 확인하려면 먼저 심판 프로필을 등록하세요."
          ctaText="프로필 등록하기"
          ctaHref="/referee/profile/edit"
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader total={total} />

      {/* 에러 배너 */}
      {errorMsg && errorCode !== "NO_REFEREE_PROFILE" && (
        <div
          className="px-3 py-2 text-xs"
          style={{
            backgroundColor: "var(--color-surface)",
            color: "var(--color-primary)",
            border: "1px solid var(--color-primary)",
            borderRadius: 4,
          }}
        >
          {errorMsg}
        </div>
      )}

      {/* 상태별 필터 탭 */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {STATUS_TABS.map((tab) => {
          const active = statusFilter === tab.value;
          return (
            <button
              key={tab.value}
              type="button"
              onClick={() => handleStatusChange(tab.value)}
              className="whitespace-nowrap px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-colors"
              style={{
                backgroundColor: active ? "var(--color-primary)" : "var(--color-surface)",
                color: active ? "#fff" : "var(--color-text-secondary)",
                borderRadius: 4,
                border: active ? "none" : "1px solid var(--color-border)",
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* 목록 */}
      {loading ? (
        <p
          className="p-8 text-center text-sm"
          style={{ color: "var(--color-text-muted)" }}
        >
          불러오는 중...
        </p>
      ) : items.length === 0 ? (
        <div
          className="flex flex-col items-center px-6 py-16 text-center"
          style={{
            backgroundColor: "var(--color-card)",
            border: "1px solid var(--color-border)",
            borderRadius: 4,
          }}
        >
          <span
            className="material-symbols-outlined text-5xl"
            style={{ color: "var(--color-text-muted)" }}
          >
            event
          </span>
          <h2
            className="mt-4 text-lg font-bold"
            style={{ color: "var(--color-text-primary)" }}
          >
            배정 기록이 없습니다
          </h2>
          <p
            className="mt-2 text-sm"
            style={{ color: "var(--color-text-muted)" }}
          >
            경기 배정이 등록되면 이곳에 표시됩니다.
          </p>
        </div>
      ) : (
        <>
          {/* 데스크톱: 테이블 (lg 이상) */}
          <div
            className="hidden lg:block overflow-x-auto"
            style={{
              backgroundColor: "var(--color-card)",
              border: "1px solid var(--color-border)",
              borderRadius: 4,
            }}
          >
            <table className="w-full text-sm">
              <thead>
                <tr
                  style={{
                    borderBottom: "1px solid var(--color-border)",
                    color: "var(--color-text-muted)",
                  }}
                >
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider">대회/경기</th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider">일시</th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider">역할</th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider">상태</th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider">배정일</th>
                </tr>
              </thead>
              <tbody>
                {items.map((a) => (
                  <tr
                    key={String(a.id)}
                    style={{ borderBottom: "1px solid var(--color-border)" }}
                  >
                    {/* 대회/경기 */}
                    <td className="px-4 py-3">
                      <div style={{ color: "var(--color-text-primary)" }} className="font-semibold">
                        {a.match?.tournament_name ?? "미정"}
                      </div>
                      {a.match?.home_team && a.match?.away_team && (
                        <div
                          className="mt-0.5 text-xs"
                          style={{ color: "var(--color-text-secondary)" }}
                        >
                          {a.match.home_team} vs {a.match.away_team}
                          {a.match.round_name && ` (${a.match.round_name})`}
                        </div>
                      )}
                    </td>
                    {/* 일시 */}
                    <td className="px-4 py-3" style={{ color: "var(--color-text-secondary)" }}>
                      {a.match?.scheduled_at ? formatDateTime(a.match.scheduled_at) : "-"}
                    </td>
                    {/* 역할 */}
                    <td className="px-4 py-3" style={{ color: "var(--color-text-primary)" }}>
                      {a.role_label}
                    </td>
                    {/* 상태 뱃지 */}
                    <td className="px-4 py-3">
                      <StatusBadge status={a.status} />
                    </td>
                    {/* 배정일 */}
                    <td className="px-4 py-3" style={{ color: "var(--color-text-muted)" }}>
                      {formatDate(a.assigned_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 모바일: 카드형 (lg 미만) */}
          <ul className="space-y-3 lg:hidden">
            {items.map((a) => (
              <li
                key={String(a.id)}
                className="p-4"
                style={{
                  backgroundColor: "var(--color-card)",
                  border: "1px solid var(--color-border)",
                  borderRadius: 4,
                }}
              >
                {/* 상단: 대회명 + 상태뱃지 */}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <h3
                      className="truncate text-sm font-bold"
                      style={{ color: "var(--color-text-primary)" }}
                    >
                      {a.match?.tournament_name ?? "미정"}
                    </h3>
                    {a.match?.home_team && a.match?.away_team && (
                      <p
                        className="mt-0.5 truncate text-xs"
                        style={{ color: "var(--color-text-secondary)" }}
                      >
                        {a.match.home_team} vs {a.match.away_team}
                      </p>
                    )}
                  </div>
                  <StatusBadge status={a.status} />
                </div>

                {/* 하단: 메타 정보 */}
                <div
                  className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">sports</span>
                    {a.role_label}
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">schedule</span>
                    {a.match?.scheduled_at ? formatDateTime(a.match.scheduled_at) : "-"}
                  </span>
                  {a.match?.venue_name && (
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">location_on</span>
                      {a.match.venue_name}
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ul>

          {/* 페이지네이션 */}
          {totalPages > 1 && (
            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
          )}
        </>
      )}
    </div>
  );
}

// ─── 하위 컴포넌트 ───

function PageHeader({ total }: { total: number }) {
  return (
    <header>
      <h1
        className="text-2xl font-black uppercase tracking-wider"
        style={{ color: "var(--color-text-primary)" }}
      >
        내 배정
      </h1>
      <p
        className="mt-1 text-sm"
        style={{ color: "var(--color-text-muted)" }}
      >
        배정된 경기 목록을 확인하세요.{" "}
        {total > 0 && (
          <span style={{ color: "var(--color-text-secondary)" }}>
            총 {total.toLocaleString("ko-KR")}건
          </span>
        )}
      </p>
    </header>
  );
}

// 상태 뱃지 컴포넌트
function StatusBadge({ status }: { status: string }) {
  const badge = STATUS_BADGE[status] ?? {
    bg: "var(--color-surface)",
    color: "var(--color-text-muted)",
    label: status,
  };
  return (
    <span
      className="inline-flex px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
      style={{
        backgroundColor: badge.bg,
        color: badge.color,
        borderRadius: 4,
      }}
    >
      {badge.label}
    </span>
  );
}

// 페이지네이션 컴포넌트
function Pagination({
  page,
  totalPages,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  onPageChange: (p: number) => void;
}) {
  return (
    <div className="flex items-center justify-center gap-2">
      <button
        type="button"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
        className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold"
        style={{
          color: page <= 1 ? "var(--color-text-muted)" : "var(--color-text-primary)",
          border: "1px solid var(--color-border)",
          borderRadius: 4,
          opacity: page <= 1 ? 0.5 : 1,
        }}
      >
        <span className="material-symbols-outlined text-sm">chevron_left</span>
        이전
      </button>
      <span
        className="text-xs"
        style={{ color: "var(--color-text-secondary)" }}
      >
        {page} / {totalPages}
      </span>
      <button
        type="button"
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
        className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold"
        style={{
          color: page >= totalPages ? "var(--color-text-muted)" : "var(--color-text-primary)",
          border: "1px solid var(--color-border)",
          borderRadius: 4,
          opacity: page >= totalPages ? 0.5 : 1,
        }}
      >
        다음
        <span className="material-symbols-outlined text-sm">chevron_right</span>
      </button>
    </div>
  );
}

// ─── 유틸 함수 ───

// 날짜 포맷: 2026-04-12
function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  } catch {
    return iso;
  }
}

// 날짜+시간 포맷: 2026.04.12 14:30
function formatDateTime(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }) + " " + d.toLocaleTimeString("ko-KR", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  } catch {
    return iso;
  }
}
