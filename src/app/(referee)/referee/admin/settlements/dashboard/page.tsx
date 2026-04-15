"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

/**
 * /referee/admin/settlements/dashboard — 정산 통계 대시보드
 *
 * 이유: 사무국장/팀장이 월간 정산 상황을 한 화면에서 파악. 카드 6종 + 6개월 추이 +
 *      지급액 상위 심판/대회 + 서류 미완비 경고.
 *
 * 차트: 외부 라이브러리 없이 div 기반 바 차트 (CSS height %).
 */

// ─── 타입 ───
type Bucket = { count: number; amount: number };
type Summary = {
  year: number;
  month: number;
  total: Bucket;
  by_status: {
    pending: Bucket;
    scheduled: Bucket;
    paid: Bucket;
    cancelled: Bucket;
    refunded: Bucket;
  };
  by_month: {
    month: string;
    paid_amount: number;
    paid_count: number;
    pending_count: number;
  }[];
  top_referees: {
    referee_id: string;
    name: string;
    total_paid: number;
    count: number;
  }[];
  by_tournament: {
    tournament_id: string;
    name: string;
    total_amount: number;
    count: number;
  }[];
  documents_incomplete_count: number;
};

// ─── 상수 ───
const STATUS_META: Record<
  string,
  { label: string; color: string; icon: string }
> = {
  total:     { label: "전체",     color: "var(--color-text-primary)",    icon: "functions" },
  pending:   { label: "미지급",   color: "var(--color-text-muted)",       icon: "pending" },
  scheduled: { label: "지급예정", color: "var(--color-warning, #f59e0b)", icon: "schedule" },
  paid:      { label: "지급완료", color: "var(--color-success, #22c55e)", icon: "check_circle" },
  cancelled: { label: "취소",     color: "var(--color-primary, #E31B23)", icon: "cancel" },
  refunded:  { label: "환수",     color: "var(--color-info, #0079B9)",    icon: "undo" },
};

const formatMoney = (n: number) => `${n.toLocaleString("ko-KR")}원`;

// 현재 월 기준 최근 12개월 옵션 생성
function getMonthOptions(): { value: string; label: string }[] {
  const now = new Date();
  const result: { value: string; label: string }[] = [];
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const y = d.getFullYear();
    const m = d.getMonth() + 1;
    result.push({
      value: `${y}-${String(m).padStart(2, "0")}`,
      label: `${y}년 ${m}월`,
    });
  }
  return result;
}

export default function SettlementsDashboardPage() {
  const now = new Date();
  const [month, setMonth] = useState<string>(
    `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
  );
  const [data, setData] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const monthOptions = useMemo(() => getMonthOptions(), []);

  // 데이터 로드
  useEffect(() => {
    setLoading(true);
    setError(null);
    const [y, m] = month.split("-");
    const url = new URL(
      "/api/web/referee-admin/settlements/summary",
      window.location.origin
    );
    url.searchParams.set("year", y);
    url.searchParams.set("month", String(parseInt(m, 10)));

    fetch(url.toString(), { cache: "no-store" })
      .then(async (r) => {
        const d = (await r.json()) as Summary & { error?: string };
        if (!r.ok) throw new Error(d.error ?? "통계 조회 실패");
        return d;
      })
      .then((d) => setData(d))
      .catch((e) => setError(e instanceof Error ? e.message : "실패"))
      .finally(() => setLoading(false));
  }, [month]);

  // 바 차트 최대값 (y축 스케일)
  const maxBarValue = useMemo(() => {
    if (!data?.by_month?.length) return 0;
    return Math.max(...data.by_month.map((r) => r.paid_amount));
  }, [data]);

  return (
    <div className="space-y-6" style={{ color: "var(--color-text-primary)" }}>
      {/* 헤더 */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div
            className="flex items-center gap-2 text-xs"
            style={{ color: "var(--color-text-muted)" }}
          >
            <Link href="/referee/admin/settlements" className="hover:underline">
              정산 관리
            </Link>
            <span>/</span>
            <span>대시보드</span>
          </div>
          <h1 className="text-2xl font-black mt-1">정산 통계 대시보드</h1>
          <p
            className="mt-1 text-sm"
            style={{ color: "var(--color-text-muted)" }}
          >
            월별 정산 현황과 상위 심판/대회 통계를 확인합니다.
          </p>
        </div>
        <select
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="px-3 py-2 text-sm"
          style={{
            border: "1px solid var(--color-border)",
            backgroundColor: "var(--color-surface)",
            color: "var(--color-text-primary)",
            borderRadius: 4,
          }}
        >
          {monthOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
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
      {loading && (
        <div
          className="p-8 text-center text-sm"
          style={{ color: "var(--color-text-muted)" }}
        >
          불러오는 중...
        </div>
      )}

      {!loading && data && (
        <>
          {/* 서류 미완비 경고 */}
          {data.documents_incomplete_count > 0 && (
            <div
              className="border p-3 text-sm flex items-start gap-2"
              style={{
                borderColor: "var(--color-warning, #f59e0b)",
                backgroundColor:
                  "color-mix(in srgb, var(--color-warning, #f59e0b) 10%, transparent)",
                borderRadius: 4,
              }}
            >
              <span
                className="material-symbols-outlined text-base shrink-0"
                style={{
                  color: "var(--color-warning, #f59e0b)",
                  fontVariationSettings: "'FILL' 1",
                }}
              >
                warning
              </span>
              <div className="flex-1">
                <div className="font-bold">서류 미완비 경고</div>
                <div
                  className="text-xs mt-0.5"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  서류 3종(자격증/신분증/통장)이 부족한 심판의 정산{" "}
                  <b>{data.documents_incomplete_count}건</b>이 지급 대기 중입니다.
                  paid 전환 전에 서류를 확인하세요.
                </div>
              </div>
              <Link
                href="/referee/admin/settlements"
                className="px-3 py-1 text-xs font-bold"
                style={{
                  backgroundColor: "var(--color-warning, #f59e0b)",
                  color: "#fff",
                  borderRadius: 4,
                }}
              >
                정산 보기
              </Link>
            </div>
          )}

          {/* 상단 카드 6개: 전체 + 5개 상태 */}
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
            <StatCard
              label={STATUS_META.total.label}
              icon={STATUS_META.total.icon}
              color={STATUS_META.total.color}
              count={data.total.count}
              amount={data.total.amount}
              highlight
            />
            {(
              ["pending", "scheduled", "paid", "cancelled", "refunded"] as const
            ).map((s) => (
              <StatCard
                key={s}
                label={STATUS_META[s].label}
                icon={STATUS_META[s].icon}
                color={STATUS_META[s].color}
                count={data.by_status[s].count}
                amount={data.by_status[s].amount}
              />
            ))}
          </div>

          {/* 6개월 추이 바 차트 */}
          <div
            className="border p-4"
            style={{
              borderColor: "var(--color-border)",
              backgroundColor: "var(--color-surface)",
              borderRadius: 4,
            }}
          >
            <h2 className="text-base font-black">최근 6개월 지급액 추이</h2>
            <p
              className="mt-0.5 text-xs"
              style={{ color: "var(--color-text-muted)" }}
            >
              월별 paid 상태 정산 총액 (기준: 정산 생성일)
            </p>
            {data.by_month.length === 0 || maxBarValue === 0 ? (
              <div
                className="mt-4 p-8 text-center text-sm"
                style={{ color: "var(--color-text-muted)" }}
              >
                데이터가 없습니다.
              </div>
            ) : (
              <div className="mt-4 flex items-end gap-2 h-48">
                {data.by_month.map((row) => {
                  const heightPct = maxBarValue
                    ? (row.paid_amount / maxBarValue) * 100
                    : 0;
                  const isCurrent = row.month === month;
                  return (
                    <div
                      key={row.month}
                      className="flex-1 flex flex-col items-center justify-end gap-1"
                    >
                      <div
                        className="text-[10px] font-bold tabular-nums"
                        style={{ color: "var(--color-text-muted)" }}
                      >
                        {row.paid_amount >= 10000
                          ? `${Math.round(row.paid_amount / 1000).toLocaleString("ko-KR")}k`
                          : row.paid_amount.toLocaleString("ko-KR")}
                      </div>
                      <div
                        className="w-full transition-all"
                        style={{
                          height: `${Math.max(2, heightPct)}%`,
                          backgroundColor: isCurrent
                            ? "var(--color-primary, #E31B23)"
                            : "var(--color-success, #22c55e)",
                          borderRadius: "4px 4px 0 0",
                          minHeight: 2,
                        }}
                        title={`${row.month} · paid ${row.paid_count}건 · pending ${row.pending_count}건`}
                      />
                      <div
                        className="text-[10px] font-bold mt-1"
                        style={{
                          color: isCurrent
                            ? "var(--color-primary, #E31B23)"
                            : "var(--color-text-secondary)",
                        }}
                      >
                        {row.month.slice(5)}월
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 하위 섹션 2개: 상위 심판 + 대회 */}
          <div className="grid gap-4 md:grid-cols-2">
            {/* 지급액 상위 심판 */}
            <div
              className="border p-4"
              style={{
                borderColor: "var(--color-border)",
                backgroundColor: "var(--color-surface)",
                borderRadius: 4,
              }}
            >
              <h2 className="text-base font-black">지급액 상위 심판</h2>
              <p
                className="mt-0.5 text-xs"
                style={{ color: "var(--color-text-muted)" }}
              >
                이번 달 paid 기준 상위 5명
              </p>
              {data.top_referees.length === 0 ? (
                <div
                  className="mt-4 p-6 text-center text-sm"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  데이터 없음
                </div>
              ) : (
                <ol className="mt-3 space-y-2">
                  {data.top_referees.map((r, idx) => (
                    <li
                      key={r.referee_id.toString()}
                      className="flex items-center gap-3 text-sm"
                    >
                      <div
                        className="w-6 h-6 flex items-center justify-center text-xs font-black shrink-0"
                        style={{
                          backgroundColor:
                            idx === 0
                              ? "var(--color-warning, #f59e0b)"
                              : "var(--color-background)",
                          color:
                            idx === 0
                              ? "#fff"
                              : "var(--color-text-muted)",
                          borderRadius: 4,
                          border: "1px solid var(--color-border)",
                        }}
                      >
                        {idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold truncate">{r.name}</div>
                        <div
                          className="text-xs"
                          style={{ color: "var(--color-text-muted)" }}
                        >
                          {r.count}건
                        </div>
                      </div>
                      <div className="font-black tabular-nums">
                        {formatMoney(r.total_paid)}
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </div>

            {/* 대회별 상위 */}
            <div
              className="border p-4"
              style={{
                borderColor: "var(--color-border)",
                backgroundColor: "var(--color-surface)",
                borderRadius: 4,
              }}
            >
              <h2 className="text-base font-black">대회별 정산 상위</h2>
              <p
                className="mt-0.5 text-xs"
                style={{ color: "var(--color-text-muted)" }}
              >
                이번 달 정산 총액 상위 5개 대회
              </p>
              {data.by_tournament.length === 0 ? (
                <div
                  className="mt-4 p-6 text-center text-sm"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  데이터 없음
                </div>
              ) : (
                <ol className="mt-3 space-y-2">
                  {data.by_tournament.map((t, idx) => (
                    <li
                      key={t.tournament_id}
                      className="flex items-center gap-3 text-sm"
                    >
                      <div
                        className="w-6 h-6 flex items-center justify-center text-xs font-black shrink-0"
                        style={{
                          backgroundColor:
                            idx === 0
                              ? "var(--color-info, #0079B9)"
                              : "var(--color-background)",
                          color:
                            idx === 0
                              ? "#fff"
                              : "var(--color-text-muted)",
                          borderRadius: 4,
                          border: "1px solid var(--color-border)",
                        }}
                      >
                        {idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold truncate">{t.name}</div>
                        <div
                          className="text-xs"
                          style={{ color: "var(--color-text-muted)" }}
                        >
                          {t.count}건
                        </div>
                      </div>
                      <div className="font-black tabular-nums">
                        {formatMoney(t.total_amount)}
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ─── 카드 컴포넌트 ───
function StatCard({
  label,
  icon,
  color,
  count,
  amount,
  highlight,
}: {
  label: string;
  icon: string;
  color: string;
  count: number;
  amount: number;
  highlight?: boolean;
}) {
  return (
    <div
      className="border p-3"
      style={{
        borderColor: highlight ? color : "var(--color-border)",
        backgroundColor: "var(--color-surface)",
        borderRadius: 4,
        borderLeftWidth: highlight ? 3 : 1,
        borderLeftColor: color,
      }}
    >
      <div className="flex items-center gap-2">
        <span
          className="material-symbols-outlined text-base"
          style={{ color, fontVariationSettings: "'FILL' 1" }}
        >
          {icon}
        </span>
        <span
          className="text-[11px] font-bold uppercase tracking-wider"
          style={{ color: "var(--color-text-muted)" }}
        >
          {label}
        </span>
      </div>
      <div className="mt-2 text-lg font-black">{count}건</div>
      <div
        className="text-xs tabular-nums"
        style={{ color: "var(--color-text-secondary)" }}
      >
        {amount.toLocaleString("ko-KR")}원
      </div>
    </div>
  );
}
