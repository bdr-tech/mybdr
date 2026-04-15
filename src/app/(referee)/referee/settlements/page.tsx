"use client";

import { useEffect, useState, useCallback } from "react";
import { EmptyState } from "../_components/empty-state";

/**
 * /referee/settlements — 내 정산 목록 (Client Component)
 *
 * 이유: 합계 카드 3개 + 상태별 필터 + 페이지네이션이 클라이언트 상태이므로 "use client".
 *      certificates/assignments 페이지와 동일한 UI 패턴 사용.
 *      데스크톱: 테이블, 모바일: 카드형.
 */

// ─── 타입 정의 ───
type MatchInfo = {
  tournament_name: string | null;
  scheduled_at: string | null;
  venue_name: string | null;
  round_name: string | null;
  home_team: string | null;
  away_team: string | null;
};

type AssignmentInfo = {
  id: string;
  role: string;
  status: string;
};

type Settlement = {
  id: string;
  amount: number;
  status: string;
  paid_at: string | null;
  memo: string | null;
  created_at: string;
  assignment: AssignmentInfo;
  match: MatchInfo | null;
};

type Summary = {
  total_amount: number;
  paid_amount: number;
  pending_amount: number;
};

// 본인 서류 3종 보유 여부 API 응답 타입
type DocumentsStatus = {
  certificate: boolean;
  id_card: boolean;
  bankbook: boolean;
  complete: boolean;
  missing: string[];
};

type ApiResponse = {
  items: Settlement[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
  summary: Summary;
};

// ─── 상태 탭 정의 (정산 3차: 5종 전체 반영) ───
const STATUS_TABS = [
  { value: "", label: "전체" },
  { value: "pending", label: "미지급" },
  { value: "scheduled", label: "지급예정" },
  { value: "paid", label: "지급완료" },
  { value: "cancelled", label: "취소" },
  { value: "refunded", label: "환수" },
] as const;

// 상태별 뱃지 색상 — 관리자 페이지와 일관된 5종 체계
const STATUS_BADGE: Record<string, { bg: string; color: string; label: string }> = {
  pending:   { bg: "var(--color-text-muted)",         color: "#fff", label: "미지급" },
  scheduled: { bg: "var(--color-warning, #f59e0b)",   color: "#fff", label: "지급예정" },
  paid:      { bg: "var(--color-success, #22c55e)",   color: "#fff", label: "지급완료" },
  cancelled: { bg: "var(--color-primary, #E31B23)",   color: "#fff", label: "취소" },
  refunded:  { bg: "var(--color-info, #0079B9)",      color: "#fff", label: "환수" },
};

// 역할 한글 매핑
const ROLE_LABEL: Record<string, string> = {
  main: "주심",
  sub: "부심",
  recorder: "기록원",
  timer: "타이머",
};

export default function RefereeSettlementsPage() {
  const [items, setItems] = useState<Settlement[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // 합계 상태
  const [summary, setSummary] = useState<Summary>({
    total_amount: 0,
    paid_amount: 0,
    pending_amount: 0,
  });

  // 필터 & 페이지네이션
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // 내 서류 3종 상태 (경고 배너용)
  // 이유: paid 전환 시 관리자가 막히므로 본인이 미리 채우도록 안내
  const [docsStatus, setDocsStatus] = useState<DocumentsStatus | null>(null);

  // 목록 조회
  const loadList = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set("status", statusFilter);
      params.set("page", String(page));
      params.set("limit", "20");

      const res = await fetch(`/api/web/referee-settlements?${params}`, {
        credentials: "include",
      });

      if (res.ok) {
        const data = (await res.json()) as ApiResponse;
        setItems(data.items ?? []);
        setTotal(data.total ?? 0);
        setTotalPages(data.total_pages ?? 1);
        setSummary(data.summary ?? { total_amount: 0, paid_amount: 0, pending_amount: 0 });
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
        setErrorMsg(msg ?? "정산 목록을 불러올 수 없습니다.");
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

  // 내 서류 3종 상태 로드 (초기 1회)
  // 이유: 응답은 [{doc_type, ...}, ...] 배열. 필요 doc_type 3종 보유 여부로 경고 여부 결정.
  useEffect(() => {
    fetch("/api/web/referee-documents", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!Array.isArray(data)) return;
        const owned = new Set(
          data
            .map((d: { doc_type?: string }) => d?.doc_type)
            .filter(Boolean) as string[]
        );
        const required = ["certificate", "id_card", "bankbook"];
        const missing = required.filter((t) => !owned.has(t));
        setDocsStatus({
          certificate: owned.has("certificate"),
          id_card: owned.has("id_card"),
          bankbook: owned.has("bankbook"),
          complete: missing.length === 0,
          missing,
        });
      })
      .catch(() => {
        /* 서류 조회 실패해도 정산 페이지는 계속 보여줌 */
      });
  }, []);

  // 필터 변경 시 1페이지로 리셋
  const handleStatusChange = (value: string) => {
    setStatusFilter(value);
    setPage(1);
  };

  // 프로필 미등록 상태
  if (errorCode === "NO_REFEREE_PROFILE") {
    return (
      <div className="space-y-6">
        <PageHeader />
        <EmptyState
          icon="badge"
          title="심판 프로필이 필요합니다"
          description="정산 기록을 확인하려면 먼저 심판 프로필을 등록하세요."
          ctaText="프로필 등록하기"
          ctaHref="/referee/profile/edit"
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader />

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

      {/* 서류 미완비 안내 (3차 추가) */}
      {/* 이유: paid 전환 시 관리자가 막히므로 본인에게 미리 서류 업로드 유도 */}
      {docsStatus && !docsStatus.complete && (
        <div
          className="flex items-start gap-3 p-3"
          style={{
            backgroundColor:
              "color-mix(in srgb, var(--color-warning, #f59e0b) 10%, transparent)",
            border: "1px solid var(--color-warning, #f59e0b)",
            borderRadius: 4,
          }}
        >
          <span
            className="material-symbols-outlined text-lg shrink-0"
            style={{
              color: "var(--color-warning, #f59e0b)",
              fontVariationSettings: "'FILL' 1",
            }}
          >
            info
          </span>
          <div className="flex-1 min-w-0">
            <div
              className="text-sm font-bold"
              style={{ color: "var(--color-text-primary)" }}
            >
              정산 처리를 위해 서류 등록이 필요합니다
            </div>
            <div
              className="mt-0.5 text-xs"
              style={{ color: "var(--color-text-muted)" }}
            >
              자격증 / 신분증 / 통장 사본을 모두 등록하면 정산 처리가 원활합니다.
              부족:{" "}
              {docsStatus.missing
                .map(
                  (t) =>
                    ({
                      certificate: "자격증",
                      id_card: "신분증",
                      bankbook: "통장",
                    }[t] ?? t)
                )
                .join(", ")}
            </div>
          </div>
          <a
            href="/referee/documents"
            className="px-3 py-1.5 text-xs font-bold whitespace-nowrap"
            style={{
              backgroundColor: "var(--color-warning, #f59e0b)",
              color: "#fff",
              borderRadius: 4,
            }}
          >
            서류 등록
          </a>
        </div>
      )}

      {/* 합계 카드 3개 */}
      <div className="grid grid-cols-3 gap-3">
        <SummaryCard
          icon="account_balance_wallet"
          label="총 정산액"
          amount={summary.total_amount}
          accentColor="var(--color-info, #0079B9)"
        />
        <SummaryCard
          icon="check_circle"
          label="지급완료"
          amount={summary.paid_amount}
          accentColor="var(--color-success, #22c55e)"
        />
        <SummaryCard
          icon="pending"
          label="미지급"
          amount={summary.pending_amount}
          accentColor="var(--color-warning, #f59e0b)"
        />
      </div>

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
            payments
          </span>
          <h2
            className="mt-4 text-lg font-bold"
            style={{ color: "var(--color-text-primary)" }}
          >
            정산 기록이 없습니다
          </h2>
          <p
            className="mt-2 text-sm"
            style={{ color: "var(--color-text-muted)" }}
          >
            정산이 등록되면 이곳에 표시됩니다.
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
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider">역할</th>
                  <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wider">금액</th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider">상태</th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider">지급일</th>
                </tr>
              </thead>
              <tbody>
                {items.map((s) => (
                  <tr
                    key={String(s.id)}
                    style={{ borderBottom: "1px solid var(--color-border)" }}
                  >
                    {/* 대회/경기 */}
                    <td className="px-4 py-3">
                      <div style={{ color: "var(--color-text-primary)" }} className="font-semibold">
                        {s.match?.tournament_name ?? "미정"}
                      </div>
                      {s.match?.home_team && s.match?.away_team && (
                        <div
                          className="mt-0.5 text-xs"
                          style={{ color: "var(--color-text-secondary)" }}
                        >
                          {s.match.home_team} vs {s.match.away_team}
                        </div>
                      )}
                    </td>
                    {/* 역할 */}
                    <td className="px-4 py-3" style={{ color: "var(--color-text-primary)" }}>
                      {ROLE_LABEL[s.assignment.role] ?? s.assignment.role}
                    </td>
                    {/* 금액 (오른쪽 정렬) */}
                    <td
                      className="px-4 py-3 text-right font-bold tabular-nums"
                      style={{ color: "var(--color-text-primary)" }}
                    >
                      {s.amount.toLocaleString("ko-KR")}원
                    </td>
                    {/* 상태 뱃지 */}
                    <td className="px-4 py-3">
                      <SettlementStatusBadge status={s.status} />
                    </td>
                    {/* 지급일 */}
                    <td className="px-4 py-3" style={{ color: "var(--color-text-muted)" }}>
                      {s.paid_at ? formatDate(s.paid_at) : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 모바일: 카드형 (lg 미만) */}
          <ul className="space-y-3 lg:hidden">
            {items.map((s) => (
              <li
                key={String(s.id)}
                className="p-4"
                style={{
                  backgroundColor: "var(--color-card)",
                  border: "1px solid var(--color-border)",
                  borderRadius: 4,
                }}
              >
                {/* 상단: 대회명 + 금액 */}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <h3
                      className="truncate text-sm font-bold"
                      style={{ color: "var(--color-text-primary)" }}
                    >
                      {s.match?.tournament_name ?? "미정"}
                    </h3>
                    {s.match?.home_team && s.match?.away_team && (
                      <p
                        className="mt-0.5 truncate text-xs"
                        style={{ color: "var(--color-text-secondary)" }}
                      >
                        {s.match.home_team} vs {s.match.away_team}
                      </p>
                    )}
                  </div>
                  <span
                    className="whitespace-nowrap text-sm font-bold tabular-nums"
                    style={{ color: "var(--color-text-primary)" }}
                  >
                    {s.amount.toLocaleString("ko-KR")}원
                  </span>
                </div>

                {/* 하단: 메타 정보 */}
                <div
                  className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">sports</span>
                    {ROLE_LABEL[s.assignment.role] ?? s.assignment.role}
                  </span>
                  <SettlementStatusBadge status={s.status} />
                  {s.paid_at && (
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">calendar_today</span>
                      {formatDate(s.paid_at)}
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

function PageHeader() {
  return (
    <header>
      <h1
        className="text-2xl font-black uppercase tracking-wider"
        style={{ color: "var(--color-text-primary)" }}
      >
        내 정산
      </h1>
      <p
        className="mt-1 text-sm"
        style={{ color: "var(--color-text-muted)" }}
      >
        경기 심판 정산 내역을 확인하세요.
      </p>
    </header>
  );
}

// 합계 카드 컴포넌트
function SummaryCard({
  icon,
  label,
  amount,
  accentColor,
}: {
  icon: string;
  label: string;
  amount: number;
  accentColor: string;
}) {
  return (
    <div
      className="p-4"
      style={{
        backgroundColor: "var(--color-card)",
        border: "1px solid var(--color-border)",
        borderRadius: 4,
        // 상단에 accent 색상 보더 (2px)
        borderTop: `3px solid ${accentColor}`,
      }}
    >
      <div className="flex items-center gap-2">
        <span
          className="material-symbols-outlined text-lg"
          style={{ color: accentColor }}
        >
          {icon}
        </span>
        <span
          className="text-[10px] font-bold uppercase tracking-wider"
          style={{ color: "var(--color-text-muted)" }}
        >
          {label}
        </span>
      </div>
      <p
        className="mt-2 text-lg font-black tabular-nums"
        style={{ color: "var(--color-text-primary)" }}
      >
        {amount.toLocaleString("ko-KR")}
        <span className="ml-0.5 text-xs font-normal" style={{ color: "var(--color-text-muted)" }}>
          원
        </span>
      </p>
    </div>
  );
}

// 정산 상태 뱃지
function SettlementStatusBadge({ status }: { status: string }) {
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

// 페이지네이션
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
