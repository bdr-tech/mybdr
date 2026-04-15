"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

/**
 * /referee/admin/settlements — 관리자 정산 목록 (Client Component)
 *
 * 이유: 상태 탭/필터/페이지네이션/상태 변경 드롭다운이 모두 클라이언트 상호작용 → "use client".
 *      데이터는 /api/web/referee-admin/settlements에서 조회.
 *
 * 기능:
 *   - 상단 요약 카드 5개 (미지급/지급예정/지급완료/취소/환수 건수+금액)
 *   - 대회 드롭다운 + 상태 탭 + 기간 필터
 *   - 테이블: 경기일 | 대회 | 심판 | 역할 | 금액 | 상태 | 서류 | 액션
 *   - 상태 변경 드롭다운 (사무국장만 조작 가능)
 *   - 서류 미완비 경고 (툴팁)
 *
 * 권한: UI는 열람 허용. 수정/삭제/상태변경 버튼은 서버에서 settlement_manage로 차단
 *       (현재 로그인 사용자 역할 정보를 별도 API로 가져와 UI 숨김/노출 처리 가능)
 */

// ─── 타입 정의 ───
type MatchInfo = {
  id: string;
  tournament_id: string;
  tournament_name: string | null;
  scheduled_at: string | null;
  venue_name: string | null;
  round_name: string | null;
};

type Settlement = {
  id: string;
  referee_id: string;
  referee_name: string;
  assignment_id: string;
  role: string | null;
  assignment_status: string | null;
  fee_snapshot: number | null;
  amount: number;
  status: string; // pending/scheduled/paid/cancelled/refunded
  scheduled_at: string | null;
  paid_at: string | null;
  memo: string | null;
  created_at: string;
  updated_at: string;
  match: MatchInfo | null;
  documents_complete: boolean;
  missing_documents: string[];
};

type StatusBucket = { count: number; amount: number };
type Summary = {
  total: StatusBucket;
  pending: StatusBucket;
  scheduled: StatusBucket;
  paid: StatusBucket;
  cancelled: StatusBucket;
  refunded: StatusBucket;
};

type ApiResponse = {
  items: Settlement[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
  summary: Summary;
};

type Tournament = {
  id: string;
  name: string;
};

// ─── 상수 ───
const STATUS_TABS = [
  { value: "", label: "전체" },
  { value: "pending", label: "미지급" },
  { value: "scheduled", label: "지급예정" },
  { value: "paid", label: "지급완료" },
  { value: "cancelled", label: "취소" },
  { value: "refunded", label: "환수" },
] as const;

// 상태 뱃지 색상 — 디자인 규칙상 var(--color-*) fallback으로 지정
const STATUS_BADGE: Record<string, { bg: string; color: string; label: string }> = {
  pending:   { bg: "var(--color-text-muted)",        color: "#fff", label: "미지급" },
  scheduled: { bg: "var(--color-warning, #f59e0b)",  color: "#fff", label: "지급예정" },
  paid:      { bg: "var(--color-success, #22c55e)",  color: "#fff", label: "지급완료" },
  cancelled: { bg: "var(--color-primary, #E31B23)",  color: "#fff", label: "취소" },
  refunded:  { bg: "var(--color-info, #0079B9)",     color: "#fff", label: "환수" },
};

const ROLE_LABEL: Record<string, string> = {
  main: "주심",
  sub: "부심",
  recorder: "기록원",
  timer: "타이머",
};

const DOC_LABEL: Record<string, string> = {
  certificate: "자격증",
  id_card: "신분증",
  bankbook: "통장",
};

// 천단위 콤마
const formatMoney = (amount: number) => `${amount.toLocaleString("ko-KR")}원`;

// YYYY-MM-DD HH:MM
const formatDateTime = (iso: string | null) => {
  if (!iso) return "-";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "-";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${y}-${m}-${day} ${hh}:${mm}`;
};

const formatDate = (iso: string | null) => {
  if (!iso) return "-";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "-";
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

export default function AdminSettlementsPage() {
  // ── 쿼리 상태 ──
  const [status, setStatus] = useState<string>("");
  const [tournamentId, setTournamentId] = useState<string>("");
  const [from, setFrom] = useState<string>("");
  const [to, setTo] = useState<string>("");
  const [page, setPage] = useState(1);
  const limit = 20;

  // ── 데이터 상태 ──
  const [items, setItems] = useState<Settlement[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [total, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── 대회 목록 (필터 드롭다운용) ──
  const [tournaments, setTournaments] = useState<Tournament[]>([]);

  // ── 상태 변경/수정 모달 상태 ──
  const [statusTarget, setStatusTarget] = useState<Settlement | null>(null);
  const [editTarget, setEditTarget] = useState<Settlement | null>(null);
  const [mutating, setMutating] = useState(false);

  // ── 일괄 선택 상태 (2차) ──
  // settlement id 문자열 Set — 현재 페이지에 한정하여 체크 기억
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  // 일괄 결과 요약 모달
  const [bulkResult, setBulkResult] = useState<{
    target_status: string;
    succeeded: number;
    skipped: { id: string; reason: string }[];
    failed: { id: string; reason: string }[];
  } | null>(null);

  // 대회 목록 로드 (초기 1회)
  useEffect(() => {
    const url = new URL(
      "/api/web/referee-admin/tournaments",
      window.location.origin
    );
    url.searchParams.set("limit", "50");
    fetch(url.toString(), { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d?.items)) setTournaments(d.items);
      })
      .catch(() => {
        // 무시 — 필터 드롭다운은 옵션 기능
      });
  }, []);

  // 정산 목록 조회
  const fetchList = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const url = new URL(
        "/api/web/referee-admin/settlements",
        window.location.origin
      );
      if (status) url.searchParams.set("status", status);
      if (tournamentId) url.searchParams.set("tournament_id", tournamentId);
      if (from) url.searchParams.set("from", from);
      if (to) url.searchParams.set("to", to);
      url.searchParams.set("page", String(page));
      url.searchParams.set("limit", String(limit));

      const res = await fetch(url.toString(), { cache: "no-store" });
      const data = (await res.json()) as ApiResponse & {
        error?: string;
      };
      if (!res.ok) {
        throw new Error(data?.error ?? "조회에 실패했습니다.");
      }
      setItems(data.items ?? []);
      setSummary(data.summary ?? null);
      setTotalCount(data.total ?? 0);
      setTotalPages(data.total_pages ?? 1);
    } catch (e) {
      setError(e instanceof Error ? e.message : "조회에 실패했습니다.");
      setItems([]);
      setSummary(null);
    } finally {
      setLoading(false);
    }
  }, [status, tournamentId, from, to, page]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  // 필터 변경 시 페이지 1로
  useEffect(() => {
    setPage(1);
  }, [status, tournamentId, from, to]);

  // 필터/페이지 변경 시 체크박스 초기화 — 다른 페이지 건 섞이지 않도록
  useEffect(() => {
    setSelectedIds(new Set());
  }, [items]);

  // ── 일괄 처리 유틸 ──
  const toggleOne = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  const toggleAll = () => {
    setSelectedIds((prev) => {
      if (prev.size === items.length && items.length > 0) return new Set();
      return new Set(items.map((i) => i.id.toString()));
    });
  };

  // 일괄 상태 변경 API 호출
  const runBulkStatus = async (target: string) => {
    if (selectedIds.size === 0) return;
    const confirmMsg =
      target === "paid"
        ? "선택한 정산을 지급완료로 변경합니다. 서류 미완비 심판은 자동 제외됩니다. 진행할까요?"
        : target === "scheduled"
        ? "선택한 정산을 지급예정으로 변경합니다. 진행할까요?"
        : "선택한 정산을 취소로 변경합니다. 진행할까요?";
    if (!confirm(confirmMsg)) return;

    setMutating(true);
    setError(null);
    try {
      const res = await fetch(
        "/api/web/referee-admin/settlements/bulk-status",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            settlement_ids: Array.from(selectedIds),
            target_status: target,
          }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "일괄 변경 실패");
      setBulkResult({
        target_status: target,
        succeeded: data.succeeded ?? 0,
        skipped: data.skipped ?? [],
        failed: data.failed ?? [],
      });
      setSelectedIds(new Set());
      fetchList();
    } catch (e) {
      setError(e instanceof Error ? e.message : "실패");
    } finally {
      setMutating(false);
    }
  };

  // ── 요약 카드 데이터 ──
  const summaryCards = useMemo(() => {
    if (!summary) return [];
    return [
      { key: "pending", label: "미지급", ...summary.pending, bg: STATUS_BADGE.pending.bg },
      { key: "scheduled", label: "지급예정", ...summary.scheduled, bg: STATUS_BADGE.scheduled.bg },
      { key: "paid", label: "지급완료", ...summary.paid, bg: STATUS_BADGE.paid.bg },
      { key: "cancelled", label: "취소", ...summary.cancelled, bg: STATUS_BADGE.cancelled.bg },
      { key: "refunded", label: "환수", ...summary.refunded, bg: STATUS_BADGE.refunded.bg },
    ];
  }, [summary]);

  // ── 페이지 이동 ──
  const goPrev = () => setPage((p) => Math.max(1, p - 1));
  const goNext = () => setPage((p) => Math.min(totalPages, p + 1));

  return (
    <div
      className="space-y-6"
      style={{ color: "var(--color-text-primary)" }}
    >
      {/* 페이지 헤더 */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black">정산 관리</h1>
          <p
            className="mt-1 text-sm"
            style={{ color: "var(--color-text-muted)" }}
          >
            배정이 완료된 경기의 정산을 관리합니다.
          </p>
        </div>
        {/* 바로가기 버튼 2개 — 일괄 생성 / 통계 */}
        <div className="flex gap-2">
          <Link
            href="/referee/admin/settlements/new-batch"
            className="inline-flex items-center gap-1 px-3 py-2 text-xs font-bold"
            style={{
              border: "1px solid var(--color-border)",
              color: "var(--color-text-primary)",
              borderRadius: 4,
            }}
          >
            <span className="material-symbols-outlined text-sm">playlist_add</span>
            일괄 생성
          </Link>
          <Link
            href="/referee/admin/settlements/dashboard"
            className="inline-flex items-center gap-1 px-3 py-2 text-xs font-bold"
            style={{
              backgroundColor: "var(--color-primary, #E31B23)",
              color: "var(--color-text-on-primary, #fff)",
              borderRadius: 4,
            }}
          >
            <span className="material-symbols-outlined text-sm">insights</span>
            통계 보기
          </Link>
        </div>
      </div>

      {/* 상단 요약 카드 */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        {summaryCards.map((c) => (
          <div
            key={c.key}
            className="border p-4"
            style={{
              borderColor: "var(--color-border)",
              backgroundColor: "var(--color-surface)",
              borderRadius: 4,
            }}
          >
            <div className="flex items-center gap-2">
              <span
                className="inline-block h-2 w-2 rounded-full"
                style={{ backgroundColor: c.bg }}
              />
              <span
                className="text-xs font-bold"
                style={{ color: "var(--color-text-muted)" }}
              >
                {c.label}
              </span>
            </div>
            <div className="mt-2 text-lg font-black">{c.count}건</div>
            <div
              className="text-sm"
              style={{ color: "var(--color-text-secondary)" }}
            >
              {formatMoney(c.amount)}
            </div>
          </div>
        ))}
      </div>

      {/* 필터 영역 */}
      <div
        className="border p-4 space-y-3"
        style={{
          borderColor: "var(--color-border)",
          backgroundColor: "var(--color-surface)",
          borderRadius: 4,
        }}
      >
        {/* 상태 탭 */}
        <div className="flex flex-wrap gap-2">
          {STATUS_TABS.map((tab) => {
            const active = status === tab.value;
            return (
              <button
                key={tab.value || "all"}
                type="button"
                onClick={() => setStatus(tab.value)}
                className="px-3 py-1.5 text-xs font-bold"
                style={{
                  borderRadius: 4,
                  border: "1px solid var(--color-border)",
                  backgroundColor: active
                    ? "var(--color-primary)"
                    : "transparent",
                  color: active
                    ? "var(--color-text-on-primary, #fff)"
                    : "var(--color-text-secondary)",
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* 대회/기간 필터 */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <label
              className="text-xs font-bold"
              style={{ color: "var(--color-text-muted)" }}
            >
              대회
            </label>
            <select
              value={tournamentId}
              onChange={(e) => setTournamentId(e.target.value)}
              className="px-2 py-1 text-sm"
              style={{
                border: "1px solid var(--color-border)",
                backgroundColor: "var(--color-background)",
                color: "var(--color-text-primary)",
                borderRadius: 4,
              }}
            >
              <option value="">전체</option>
              {tournaments.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label
              className="text-xs font-bold"
              style={{ color: "var(--color-text-muted)" }}
            >
              기간
            </label>
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="px-2 py-1 text-sm"
              style={{
                border: "1px solid var(--color-border)",
                backgroundColor: "var(--color-background)",
                color: "var(--color-text-primary)",
                borderRadius: 4,
              }}
            />
            <span style={{ color: "var(--color-text-muted)" }}>~</span>
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="px-2 py-1 text-sm"
              style={{
                border: "1px solid var(--color-border)",
                backgroundColor: "var(--color-background)",
                color: "var(--color-text-primary)",
                borderRadius: 4,
              }}
            />
          </div>

          {(status || tournamentId || from || to) && (
            <button
              type="button"
              onClick={() => {
                setStatus("");
                setTournamentId("");
                setFrom("");
                setTo("");
              }}
              className="ml-auto px-3 py-1 text-xs font-bold"
              style={{
                color: "var(--color-text-muted)",
                border: "1px solid var(--color-border)",
                borderRadius: 4,
              }}
            >
              초기화
            </button>
          )}
        </div>
      </div>

      {/* 에러/로딩 */}
      {error && (
        <div
          className="border p-3 text-sm"
          style={{
            borderColor: "var(--color-primary, #E31B23)",
            color: "var(--color-primary, #E31B23)",
            borderRadius: 4,
          }}
        >
          {error}
        </div>
      )}

      {/* 목록 테이블 (데스크톱) */}
      <div
        className="hidden md:block border overflow-x-auto"
        style={{
          borderColor: "var(--color-border)",
          backgroundColor: "var(--color-surface)",
          borderRadius: 4,
        }}
      >
        <table className="w-full text-sm">
          <thead
            style={{
              backgroundColor: "var(--color-background)",
              color: "var(--color-text-muted)",
            }}
          >
            <tr>
              <th className="px-2 py-2 text-center w-8">
                {/* 전체 선택 체크박스 */}
                <input
                  type="checkbox"
                  checked={
                    items.length > 0 && selectedIds.size === items.length
                  }
                  onChange={toggleAll}
                  aria-label="전체 선택"
                />
              </th>
              <th className="px-3 py-2 text-left text-xs font-bold">경기일</th>
              <th className="px-3 py-2 text-left text-xs font-bold">대회</th>
              <th className="px-3 py-2 text-left text-xs font-bold">심판</th>
              <th className="px-3 py-2 text-left text-xs font-bold">역할</th>
              <th className="px-3 py-2 text-right text-xs font-bold">금액</th>
              <th className="px-3 py-2 text-center text-xs font-bold">상태</th>
              <th className="px-3 py-2 text-center text-xs font-bold">서류</th>
              <th className="px-3 py-2 text-right text-xs font-bold">액션</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td
                  colSpan={9}
                  className="px-3 py-10 text-center"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  불러오는 중...
                </td>
              </tr>
            )}
            {!loading && items.length === 0 && (
              <tr>
                <td
                  colSpan={9}
                  className="px-3 py-10 text-center"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  조건에 맞는 정산이 없습니다.
                </td>
              </tr>
            )}
            {!loading &&
              items.map((s) => {
                const badge =
                  STATUS_BADGE[s.status] ?? STATUS_BADGE.pending;
                return (
                  <tr
                    key={s.id}
                    className="border-t"
                    style={{ borderColor: "var(--color-border)" }}
                  >
                    <td className="px-2 py-2 text-center">
                      {/* 일괄 선택 체크박스 */}
                      <input
                        type="checkbox"
                        checked={selectedIds.has(s.id.toString())}
                        onChange={() => toggleOne(s.id.toString())}
                        aria-label="선택"
                      />
                    </td>
                    <td className="px-3 py-2">
                      {formatDate(s.match?.scheduled_at ?? null)}
                    </td>
                    <td className="px-3 py-2">
                      <div className="font-bold">
                        {s.match?.tournament_name ?? "-"}
                      </div>
                      {s.match?.round_name && (
                        <div
                          className="text-xs"
                          style={{ color: "var(--color-text-muted)" }}
                        >
                          {s.match.round_name}
                          {s.match.venue_name ? ` · ${s.match.venue_name}` : ""}
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-2">{s.referee_name}</td>
                    <td className="px-3 py-2">
                      {s.role ? ROLE_LABEL[s.role] ?? s.role : "-"}
                    </td>
                    <td className="px-3 py-2 text-right font-bold">
                      {formatMoney(s.amount)}
                    </td>
                    <td className="px-3 py-2 text-center">
                      <span
                        className="inline-block px-2 py-0.5 text-[11px] font-black"
                        style={{
                          backgroundColor: badge.bg,
                          color: badge.color,
                          borderRadius: 4,
                        }}
                      >
                        {badge.label}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-center">
                      {s.documents_complete ? (
                        <span
                          className="material-symbols-outlined text-base"
                          style={{
                            color: "var(--color-success, #22c55e)",
                            fontVariationSettings: "'FILL' 1",
                          }}
                          title="서류 3종 완비"
                        >
                          check_circle
                        </span>
                      ) : (
                        <span
                          className="material-symbols-outlined text-base"
                          style={{
                            color: "var(--color-warning, #f59e0b)",
                            fontVariationSettings: "'FILL' 1",
                          }}
                          title={`부족: ${s.missing_documents
                            .map((d) => DOC_LABEL[d] ?? d)
                            .join(", ")}`}
                        >
                          warning
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => setStatusTarget(s)}
                          className="px-2 py-1 text-xs font-bold"
                          style={{
                            border: "1px solid var(--color-border)",
                            color: "var(--color-text-secondary)",
                            borderRadius: 4,
                          }}
                        >
                          상태
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditTarget(s)}
                          className="px-2 py-1 text-xs font-bold"
                          style={{
                            border: "1px solid var(--color-border)",
                            color: "var(--color-text-secondary)",
                            borderRadius: 4,
                          }}
                        >
                          수정
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>

      {/* 모바일 카드 목록 */}
      <div className="md:hidden space-y-2">
        {loading && (
          <div
            className="p-6 text-center text-sm"
            style={{ color: "var(--color-text-muted)" }}
          >
            불러오는 중...
          </div>
        )}
        {!loading && items.length === 0 && (
          <div
            className="p-6 text-center text-sm"
            style={{ color: "var(--color-text-muted)" }}
          >
            조건에 맞는 정산이 없습니다.
          </div>
        )}
        {!loading &&
          items.map((s) => {
            const badge = STATUS_BADGE[s.status] ?? STATUS_BADGE.pending;
            return (
              <div
                key={s.id}
                className="border p-3"
                style={{
                  borderColor: "var(--color-border)",
                  backgroundColor: "var(--color-surface)",
                  borderRadius: 4,
                }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                      {formatDate(s.match?.scheduled_at ?? null)}
                    </div>
                    <div className="font-bold truncate">
                      {s.match?.tournament_name ?? "-"}
                    </div>
                    <div className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>
                      {s.referee_name} · {s.role ? ROLE_LABEL[s.role] ?? s.role : "-"}
                    </div>
                  </div>
                  <span
                    className="inline-block px-2 py-0.5 text-[11px] font-black shrink-0"
                    style={{
                      backgroundColor: badge.bg,
                      color: badge.color,
                      borderRadius: 4,
                    }}
                  >
                    {badge.label}
                  </span>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <div className="font-black">{formatMoney(s.amount)}</div>
                  <div className="flex items-center gap-1">
                    {!s.documents_complete && (
                      <span
                        className="material-symbols-outlined text-base"
                        style={{
                          color: "var(--color-warning, #f59e0b)",
                          fontVariationSettings: "'FILL' 1",
                        }}
                        title={`부족: ${s.missing_documents
                          .map((d) => DOC_LABEL[d] ?? d)
                          .join(", ")}`}
                      >
                        warning
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => setStatusTarget(s)}
                      className="px-2 py-1 text-xs font-bold"
                      style={{
                        border: "1px solid var(--color-border)",
                        color: "var(--color-text-secondary)",
                        borderRadius: 4,
                      }}
                    >
                      상태
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditTarget(s)}
                      className="px-2 py-1 text-xs font-bold"
                      style={{
                        border: "1px solid var(--color-border)",
                        color: "var(--color-text-secondary)",
                        borderRadius: 4,
                      }}
                    >
                      수정
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
      </div>

      {/* 일괄 처리 고정 바 (선택 시 나타남) */}
      {selectedIds.size > 0 && (
        <div
          className="fixed bottom-4 left-1/2 z-40 -translate-x-1/2 px-4 py-3 flex items-center gap-3 shadow-lg"
          style={{
            backgroundColor: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            borderRadius: 4,
          }}
        >
          <div className="text-sm font-bold">
            선택: <span style={{ color: "var(--color-primary, #E31B23)" }}>{selectedIds.size}</span>건
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={mutating}
              onClick={() => runBulkStatus("scheduled")}
              className="px-3 py-1.5 text-xs font-bold disabled:opacity-40"
              style={{
                backgroundColor: "var(--color-warning, #f59e0b)",
                color: "#fff",
                borderRadius: 4,
              }}
            >
              지급예정으로
            </button>
            <button
              type="button"
              disabled={mutating}
              onClick={() => runBulkStatus("paid")}
              className="px-3 py-1.5 text-xs font-bold disabled:opacity-40"
              style={{
                backgroundColor: "var(--color-success, #22c55e)",
                color: "#fff",
                borderRadius: 4,
              }}
            >
              지급완료로
            </button>
            <button
              type="button"
              disabled={mutating}
              onClick={() => runBulkStatus("cancelled")}
              className="px-3 py-1.5 text-xs font-bold disabled:opacity-40"
              style={{
                border: "1px solid var(--color-primary, #E31B23)",
                color: "var(--color-primary, #E31B23)",
                borderRadius: 4,
              }}
            >
              취소
            </button>
            <button
              type="button"
              onClick={() => setSelectedIds(new Set())}
              className="px-3 py-1.5 text-xs font-bold"
              style={{
                color: "var(--color-text-muted)",
                borderRadius: 4,
              }}
            >
              선택 해제
            </button>
          </div>
        </div>
      )}

      {/* 일괄 결과 요약 모달 */}
      {bulkResult && (
        <BulkResultModal
          result={bulkResult}
          onClose={() => setBulkResult(null)}
        />
      )}

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            type="button"
            onClick={goPrev}
            disabled={page <= 1}
            className="px-3 py-1.5 text-xs font-bold disabled:opacity-40"
            style={{
              border: "1px solid var(--color-border)",
              color: "var(--color-text-secondary)",
              borderRadius: 4,
            }}
          >
            이전
          </button>
          <span
            className="text-xs"
            style={{ color: "var(--color-text-muted)" }}
          >
            {page} / {totalPages} (총 {total}건)
          </span>
          <button
            type="button"
            onClick={goNext}
            disabled={page >= totalPages}
            className="px-3 py-1.5 text-xs font-bold disabled:opacity-40"
            style={{
              border: "1px solid var(--color-border)",
              color: "var(--color-text-secondary)",
              borderRadius: 4,
            }}
          >
            다음
          </button>
        </div>
      )}

      {/* 상태 변경 모달 */}
      {statusTarget && (
        <StatusChangeModal
          settlement={statusTarget}
          onClose={() => setStatusTarget(null)}
          onDone={() => {
            setStatusTarget(null);
            fetchList();
          }}
          mutating={mutating}
          setMutating={setMutating}
        />
      )}

      {/* 금액/메모 수정 모달 */}
      {editTarget && (
        <EditModal
          settlement={editTarget}
          onClose={() => setEditTarget(null)}
          onDone={() => {
            setEditTarget(null);
            fetchList();
          }}
          mutating={mutating}
          setMutating={setMutating}
        />
      )}
    </div>
  );
}

/* ==========================================================================
 * StatusChangeModal — 상태 전이 + 필요 시 force/memo 입력
 * ========================================================================== */
function StatusChangeModal({
  settlement,
  onClose,
  onDone,
  mutating,
  setMutating,
}: {
  settlement: Settlement;
  onClose: () => void;
  onDone: () => void;
  mutating: boolean;
  setMutating: (v: boolean) => void;
}) {
  // 전이 화이트리스트 — 서버 로직과 동일하게 유지
  const TRANSITIONS: Record<string, string[]> = {
    pending: ["scheduled", "cancelled"],
    scheduled: ["paid", "pending", "cancelled"],
    paid: ["refunded"],
    cancelled: ["pending"],
    refunded: ["pending"],
  };
  const available = TRANSITIONS[settlement.status] ?? [];
  const [next, setNext] = useState<string>(available[0] ?? "");
  const [force, setForce] = useState(false);
  const [memo, setMemo] = useState("");
  const [err, setErr] = useState<string | null>(null);

  // paid로 전환 시 서류 미완비면 force+memo 필요
  const needForce = next === "paid" && !settlement.documents_complete;

  const submit = async () => {
    setMutating(true);
    setErr(null);
    try {
      const res = await fetch(
        `/api/web/referee-admin/settlements/${settlement.id}/status`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: next,
            ...(needForce && { force }),
            ...(memo && { memo }),
          }),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error ?? "상태 변경에 실패했습니다.");
      }
      onDone();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "실패");
    } finally {
      setMutating(false);
    }
  };

  return (
    <ModalShell onClose={onClose} title="상태 변경">
      <div className="space-y-3">
        <div className="text-sm">
          <span style={{ color: "var(--color-text-muted)" }}>현재: </span>
          <b>{STATUS_BADGE[settlement.status]?.label ?? settlement.status}</b>
        </div>
        {available.length === 0 ? (
          <div
            className="text-sm"
            style={{ color: "var(--color-text-muted)" }}
          >
            이 상태에서 전이할 수 있는 대상이 없습니다.
          </div>
        ) : (
          <>
            <label className="block text-sm">
              <span
                className="block text-xs font-bold"
                style={{ color: "var(--color-text-muted)" }}
              >
                변경 상태
              </span>
              <select
                value={next}
                onChange={(e) => setNext(e.target.value)}
                className="mt-1 w-full px-2 py-1.5 text-sm"
                style={{
                  border: "1px solid var(--color-border)",
                  backgroundColor: "var(--color-background)",
                  color: "var(--color-text-primary)",
                  borderRadius: 4,
                }}
              >
                {available.map((s) => (
                  <option key={s} value={s}>
                    {STATUS_BADGE[s]?.label ?? s}
                  </option>
                ))}
              </select>
            </label>

            {needForce && (
              <div
                className="p-3 text-xs space-y-2"
                style={{
                  backgroundColor:
                    "color-mix(in srgb, var(--color-warning, #f59e0b) 10%, transparent)",
                  border: "1px solid var(--color-warning, #f59e0b)",
                  borderRadius: 4,
                }}
              >
                <div className="font-bold">
                  ⚠️ 서류 3종이 완비되지 않았습니다.
                </div>
                <div style={{ color: "var(--color-text-muted)" }}>
                  부족:{" "}
                  {settlement.missing_documents
                    .map((d) => DOC_LABEL[d] ?? d)
                    .join(", ")}
                </div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={force}
                    onChange={(e) => setForce(e.target.checked)}
                  />
                  강행 지급 (사유 memo 필수)
                </label>
              </div>
            )}

            <label className="block text-sm">
              <span
                className="block text-xs font-bold"
                style={{ color: "var(--color-text-muted)" }}
              >
                메모
                {needForce && force && (
                  <span style={{ color: "var(--color-primary, #E31B23)" }}>
                    {" "}
                    *필수
                  </span>
                )}
              </span>
              <textarea
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                rows={3}
                placeholder={
                  needForce ? "서류 미완비 강행 사유를 입력하세요" : "선택"
                }
                className="mt-1 w-full px-2 py-1.5 text-sm"
                style={{
                  border: "1px solid var(--color-border)",
                  backgroundColor: "var(--color-background)",
                  color: "var(--color-text-primary)",
                  borderRadius: 4,
                }}
              />
            </label>

            {err && (
              <div
                className="text-xs"
                style={{ color: "var(--color-primary, #E31B23)" }}
              >
                {err}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 text-sm font-bold"
                style={{
                  border: "1px solid var(--color-border)",
                  color: "var(--color-text-muted)",
                  borderRadius: 4,
                }}
              >
                취소
              </button>
              <button
                type="button"
                disabled={
                  mutating ||
                  !next ||
                  (needForce && force && !memo.trim())
                }
                onClick={submit}
                className="px-3 py-1.5 text-sm font-bold disabled:opacity-40"
                style={{
                  backgroundColor: "var(--color-primary, #E31B23)",
                  color: "var(--color-text-on-primary, #fff)",
                  borderRadius: 4,
                }}
              >
                {mutating ? "처리 중..." : "변경"}
              </button>
            </div>
          </>
        )}
      </div>
    </ModalShell>
  );
}

/* ==========================================================================
 * EditModal — 금액/메모 수정 + 삭제
 * ========================================================================== */
function EditModal({
  settlement,
  onClose,
  onDone,
  mutating,
  setMutating,
}: {
  settlement: Settlement;
  onClose: () => void;
  onDone: () => void;
  mutating: boolean;
  setMutating: (v: boolean) => void;
}) {
  const [amount, setAmount] = useState<string>(String(settlement.amount));
  const [memo, setMemo] = useState(settlement.memo ?? "");
  const [err, setErr] = useState<string | null>(null);

  const save = async () => {
    setMutating(true);
    setErr(null);
    try {
      const amountNum = Number.parseInt(amount, 10);
      if (!Number.isFinite(amountNum) || amountNum < 0) {
        throw new Error("금액은 0 이상의 정수여야 합니다.");
      }
      const res = await fetch(
        `/api/web/referee-admin/settlements/${settlement.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ amount: amountNum, memo }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "저장 실패");
      onDone();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "실패");
    } finally {
      setMutating(false);
    }
  };

  const remove = async () => {
    if (settlement.status !== "pending") {
      setErr("미지급 상태의 정산만 삭제할 수 있습니다.");
      return;
    }
    if (!confirm("이 정산을 삭제하시겠습니까?")) return;
    setMutating(true);
    setErr(null);
    try {
      const res = await fetch(
        `/api/web/referee-admin/settlements/${settlement.id}`,
        { method: "DELETE" }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "삭제 실패");
      onDone();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "실패");
    } finally {
      setMutating(false);
    }
  };

  return (
    <ModalShell onClose={onClose} title="정산 수정">
      <div className="space-y-3">
        <label className="block text-sm">
          <span
            className="block text-xs font-bold"
            style={{ color: "var(--color-text-muted)" }}
          >
            금액 (원)
          </span>
          <input
            type="number"
            min={0}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="mt-1 w-full px-2 py-1.5 text-sm"
            style={{
              border: "1px solid var(--color-border)",
              backgroundColor: "var(--color-background)",
              color: "var(--color-text-primary)",
              borderRadius: 4,
            }}
          />
        </label>
        <label className="block text-sm">
          <span
            className="block text-xs font-bold"
            style={{ color: "var(--color-text-muted)" }}
          >
            메모
          </span>
          <textarea
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            rows={3}
            className="mt-1 w-full px-2 py-1.5 text-sm"
            style={{
              border: "1px solid var(--color-border)",
              backgroundColor: "var(--color-background)",
              color: "var(--color-text-primary)",
              borderRadius: 4,
            }}
          />
        </label>
        {err && (
          <div
            className="text-xs"
            style={{ color: "var(--color-primary, #E31B23)" }}
          >
            {err}
          </div>
        )}
        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            disabled={mutating || settlement.status !== "pending"}
            onClick={remove}
            className="px-3 py-1.5 text-sm font-bold disabled:opacity-40"
            style={{
              border: "1px solid var(--color-primary, #E31B23)",
              color: "var(--color-primary, #E31B23)",
              borderRadius: 4,
            }}
            title={
              settlement.status !== "pending"
                ? "미지급 상태만 삭제 가능"
                : undefined
            }
          >
            삭제
          </button>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-sm font-bold"
              style={{
                border: "1px solid var(--color-border)",
                color: "var(--color-text-muted)",
                borderRadius: 4,
              }}
            >
              취소
            </button>
            <button
              type="button"
              disabled={mutating}
              onClick={save}
              className="px-3 py-1.5 text-sm font-bold disabled:opacity-40"
              style={{
                backgroundColor: "var(--color-primary, #E31B23)",
                color: "var(--color-text-on-primary, #fff)",
                borderRadius: 4,
              }}
            >
              {mutating ? "저장 중..." : "저장"}
            </button>
          </div>
        </div>
      </div>
    </ModalShell>
  );
}

/* ==========================================================================
 * BulkResultModal — 일괄 처리 결과 요약
 * ========================================================================== */
function BulkResultModal({
  result,
  onClose,
}: {
  result: {
    target_status: string;
    succeeded: number;
    skipped: { id: string; reason: string }[];
    failed: { id: string; reason: string }[];
  };
  onClose: () => void;
}) {
  // skip reason 사용자 친화 라벨
  const reasonLabel = (r: string) => {
    if (r.startsWith("MISSING_DOCUMENTS:")) {
      const names = r
        .replace("MISSING_DOCUMENTS:", "")
        .split(",")
        .map((d) => DOC_LABEL[d] ?? d)
        .join(", ");
      return `서류 부족 (${names})`;
    }
    const map: Record<string, string> = {
      NOT_FOUND_OR_FORBIDDEN: "대상 없음 또는 권한 없음",
      SAME_STATUS: "이미 해당 상태",
      INVALID_TRANSITION: "전이 불가",
      UNKNOWN_STATUS: "알 수 없는 상태",
      UPDATE_ERROR: "DB 오류",
    };
    return map[r] ?? r;
  };

  const targetLabel =
    STATUS_BADGE[result.target_status]?.label ?? result.target_status;

  return (
    <ModalShell onClose={onClose} title={`일괄 처리 결과 (${targetLabel})`}>
      <div className="space-y-3 text-sm">
        <div className="flex items-center gap-3">
          <span
            className="material-symbols-outlined text-2xl"
            style={{
              color: "var(--color-success, #22c55e)",
              fontVariationSettings: "'FILL' 1",
            }}
          >
            check_circle
          </span>
          <div>
            성공:{" "}
            <b style={{ color: "var(--color-success, #22c55e)" }}>
              {result.succeeded}건
            </b>
          </div>
        </div>
        {result.skipped.length > 0 && (
          <div>
            <div className="font-bold text-xs mb-1">
              제외 ({result.skipped.length}건)
            </div>
            <ul
              className="max-h-40 overflow-y-auto text-xs space-y-0.5 pl-2"
              style={{ color: "var(--color-text-muted)" }}
            >
              {result.skipped.map((s, idx) => (
                <li key={`${s.id}-${idx}`}>
                  • #{s.id}: {reasonLabel(s.reason)}
                </li>
              ))}
            </ul>
          </div>
        )}
        {result.failed.length > 0 && (
          <div>
            <div
              className="font-bold text-xs mb-1"
              style={{ color: "var(--color-primary, #E31B23)" }}
            >
              실패 ({result.failed.length}건)
            </div>
            <ul
              className="max-h-32 overflow-y-auto text-xs space-y-0.5 pl-2"
              style={{ color: "var(--color-primary, #E31B23)" }}
            >
              {result.failed.map((f, idx) => (
                <li key={`${f.id}-${idx}`}>
                  • #{f.id}: {reasonLabel(f.reason)}
                </li>
              ))}
            </ul>
          </div>
        )}
        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 text-sm font-bold"
            style={{
              backgroundColor: "var(--color-primary, #E31B23)",
              color: "var(--color-text-on-primary, #fff)",
              borderRadius: 4,
            }}
          >
            확인
          </button>
        </div>
      </div>
    </ModalShell>
  );
}

/* ==========================================================================
 * ModalShell — 배경 클릭/ESC 닫기 지원
 * ========================================================================== */
function ModalShell({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{
        backgroundColor: "color-mix(in srgb, #000 40%, transparent)",
      }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md border"
        style={{
          borderColor: "var(--color-border)",
          backgroundColor: "var(--color-surface)",
          borderRadius: 4,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="flex items-center justify-between border-b px-4 py-3"
          style={{ borderColor: "var(--color-border)" }}
        >
          <h2 className="text-base font-black">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="material-symbols-outlined text-xl"
            style={{ color: "var(--color-text-muted)" }}
            aria-label="닫기"
          >
            close
          </button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}
