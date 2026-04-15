"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

/**
 * /referee/admin/settlements/new-batch — 정산 일괄 생성 페이지
 *
 * 이유: 월말에 한 대회의 completed 배정 수십 건을 한 번에 정산 생성할 때 사용.
 *      GET /bulk-create로 "예상 금액 미리보기" → 개별 편집/체크 → POST /bulk-create 확정.
 *
 * 흐름:
 *   1) 대회 드롭다운 선택
 *   2) 미리보기 자동 로드 (assignment 목록 + 예상 금액)
 *   3) 체크박스로 대상 선택 + 각 행 금액 편집 가능
 *   4) "일괄 생성" → 결과 요약 표시 + 정산 관리로 이동 링크
 */

type Tournament = { id: string; name: string };

type PreviewItem = {
  assignment_id: string;
  referee_id: string;
  referee_name: string;
  role: string;
  fee_snapshot: number | null;
  expected_amount: number;
  match: {
    id: string;
    scheduled_at: string | null;
    venue_name: string | null;
    round_name: string | null;
  } | null;
};

type PreviewResponse = {
  items: PreviewItem[];
  fees: {
    fee_main: number;
    fee_sub: number;
    fee_recorder: number;
    fee_timer: number;
  } | null;
};

type BulkResult = {
  created: number;
  created_ids: string[];
  failed: { assignment_id: string; reason: string }[];
};

// 역할 라벨
const ROLE_LABEL: Record<string, string> = {
  main: "주심",
  sub: "부심",
  recorder: "기록원",
  timer: "타이머",
};

// 실패 사유 라벨 — 사용자 친화
const FAIL_REASON: Record<string, string> = {
  NOT_FOUND: "배정 없음",
  FORBIDDEN: "권한 없음(다른 협회)",
  NOT_COMPLETED: "배정이 완료 상태 아님",
  DUPLICATE: "이미 정산 존재",
  ERROR: "DB 에러",
};

// 숫자 입력 유틸 — 천단위 콤마 표시 ↔ 원시 숫자
const formatNumber = (n: number) => n.toLocaleString("ko-KR");

// 날짜 YYYY-MM-DD
const formatDate = (iso: string | null) => {
  if (!iso) return "-";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "-";
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

export default function NewBatchSettlementPage() {
  // 대회 목록
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [tournamentId, setTournamentId] = useState<string>("");

  // 미리보기 데이터
  const [items, setItems] = useState<PreviewItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 행별 편집 상태 — assignment_id → { checked, amount, memo }
  // 이유: 각 행의 체크 여부 / 수정된 금액 / 메모를 독립 관리.
  const [edits, setEdits] = useState<
    Record<string, { checked: boolean; amount: string; memo: string }>
  >({});

  // 제출 결과
  const [result, setResult] = useState<BulkResult | null>(null);
  const [submitting, setSubmitting] = useState(false);

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
        /* 무시 */
      });
  }, []);

  // 대회 선택 시 미리보기 로드
  const loadPreview = useCallback(async (tid: string) => {
    setLoading(true);
    setError(null);
    setItems([]);
    setEdits({});
    try {
      const url = new URL(
        "/api/web/referee-admin/settlements/bulk-create",
        window.location.origin
      );
      url.searchParams.set("tournament_id", tid);
      const res = await fetch(url.toString(), { cache: "no-store" });
      const data = (await res.json()) as PreviewResponse & { error?: string };
      if (!res.ok) {
        throw new Error(data.error ?? "미리보기를 불러오지 못했습니다.");
      }
      setItems(data.items ?? []);
      // 초기 편집 상태 — 모두 체크 + 예상 금액 채움
      const init: typeof edits = {};
      for (const it of data.items ?? []) {
        init[it.assignment_id.toString()] = {
          checked: true,
          amount: String(it.expected_amount),
          memo: "",
        };
      }
      setEdits(init);
    } catch (e) {
      setError(e instanceof Error ? e.message : "실패");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (tournamentId) loadPreview(tournamentId);
    else {
      setItems([]);
      setEdits({});
    }
  }, [tournamentId, loadPreview]);

  // 전체 체크박스 상태
  const allChecked = useMemo(() => {
    if (items.length === 0) return false;
    return items.every((it) => edits[it.assignment_id.toString()]?.checked);
  }, [items, edits]);

  const toggleAll = (v: boolean) => {
    setEdits((prev) => {
      const next = { ...prev };
      for (const it of items) {
        const key = it.assignment_id.toString();
        next[key] = { ...(next[key] ?? { amount: "0", memo: "" }), checked: v };
      }
      return next;
    });
  };

  const toggleOne = (key: string, v: boolean) => {
    setEdits((prev) => ({
      ...prev,
      [key]: { ...(prev[key] ?? { amount: "0", memo: "" }), checked: v },
    }));
  };

  const setAmount = (key: string, v: string) => {
    setEdits((prev) => ({
      ...prev,
      [key]: {
        ...(prev[key] ?? { checked: true, memo: "" }),
        amount: v.replace(/[^0-9]/g, ""), // 숫자만
      },
    }));
  };

  const setMemo = (key: string, v: string) => {
    setEdits((prev) => ({
      ...prev,
      [key]: { ...(prev[key] ?? { checked: true, amount: "0" }), memo: v },
    }));
  };

  // 선택 합계
  const selectedStats = useMemo(() => {
    let count = 0;
    let sum = 0;
    for (const it of items) {
      const e = edits[it.assignment_id.toString()];
      if (e?.checked) {
        count += 1;
        sum += parseInt(e.amount || "0", 10) || 0;
      }
    }
    return { count, sum };
  }, [items, edits]);

  // 제출
  const submit = async () => {
    if (!tournamentId) return;
    const selectedItems = items
      .filter((it) => edits[it.assignment_id.toString()]?.checked)
      .map((it) => {
        const e = edits[it.assignment_id.toString()];
        return {
          assignment_id: it.assignment_id,
          amount: parseInt(e.amount || "0", 10) || 0,
          memo: e.memo || undefined,
        };
      });
    if (selectedItems.length === 0) {
      setError("선택된 항목이 없습니다.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(
        "/api/web/referee-admin/settlements/bulk-create",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tournament_id: tournamentId,
            items: selectedItems,
          }),
        }
      );
      const data = (await res.json()) as BulkResult & { error?: string };
      if (!res.ok) {
        throw new Error(data.error ?? "일괄 생성에 실패했습니다.");
      }
      setResult(data);
      // 생성 성공한 항목은 목록에서 제거 (남은 실패 건만 재시도 가능)
      // 이유: created_ids는 settlement id라 어떤 assignment인지 역추적 불가 →
      //      "선택했는데 failed에 없는 건"을 성공으로 간주해 목록에서 제거.
      const selectedAssignmentIds = new Set(
        selectedItems.map((s) => s.assignment_id.toString())
      );
      const failedIds = new Set(
        (data.failed ?? []).map((f) => f.assignment_id.toString())
      );
      setItems((prev) =>
        prev.filter((it) => {
          const aid = it.assignment_id.toString();
          if (selectedAssignmentIds.has(aid) && !failedIds.has(aid)) return false;
          return true;
        })
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "실패");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6" style={{ color: "var(--color-text-primary)" }}>
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs" style={{ color: "var(--color-text-muted)" }}>
            <Link href="/referee/admin/settlements" className="hover:underline">
              정산 관리
            </Link>
            <span>/</span>
            <span>일괄 생성</span>
          </div>
          <h1 className="text-2xl font-black mt-1">정산 일괄 생성</h1>
          <p className="mt-1 text-sm" style={{ color: "var(--color-text-muted)" }}>
            대회별로 completed 배정 중 아직 정산이 없는 건을 한 번에 생성합니다.
          </p>
        </div>
      </div>

      {/* 대회 선택 */}
      <div
        className="border p-4 space-y-3"
        style={{
          borderColor: "var(--color-border)",
          backgroundColor: "var(--color-surface)",
          borderRadius: 4,
        }}
      >
        <label className="block text-sm">
          <span
            className="block text-xs font-bold"
            style={{ color: "var(--color-text-muted)" }}
          >
            대회 선택
          </span>
          <select
            value={tournamentId}
            onChange={(e) => {
              setTournamentId(e.target.value);
              setResult(null);
            }}
            className="mt-1 w-full px-3 py-2 text-sm"
            style={{
              border: "1px solid var(--color-border)",
              backgroundColor: "var(--color-background)",
              color: "var(--color-text-primary)",
              borderRadius: 4,
            }}
          >
            <option value="">-- 대회를 선택하세요 --</option>
            {tournaments.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      {/* 결과 요약 */}
      {result && (
        <div
          className="border p-4 text-sm space-y-2"
          style={{
            borderColor: "var(--color-success, #22c55e)",
            backgroundColor:
              "color-mix(in srgb, var(--color-success, #22c55e) 8%, transparent)",
            borderRadius: 4,
          }}
        >
          <div className="font-bold">
            생성 완료: {result.created}건
            {result.failed.length > 0 && ` / 실패: ${result.failed.length}건`}
          </div>
          {result.failed.length > 0 && (
            <ul className="text-xs space-y-0.5" style={{ color: "var(--color-text-muted)" }}>
              {result.failed.map((f) => (
                <li key={f.assignment_id}>
                  • 배정 #{f.assignment_id}: {FAIL_REASON[f.reason] ?? f.reason}
                </li>
              ))}
            </ul>
          )}
          <Link
            href="/referee/admin/settlements"
            className="inline-block px-3 py-1.5 text-xs font-bold"
            style={{
              backgroundColor: "var(--color-primary, #E31B23)",
              color: "var(--color-text-on-primary, #fff)",
              borderRadius: 4,
            }}
          >
            정산 관리로 이동
          </Link>
        </div>
      )}

      {/* 에러 */}
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

      {/* 로딩 */}
      {loading && (
        <div
          className="p-6 text-center text-sm"
          style={{ color: "var(--color-text-muted)" }}
        >
          불러오는 중...
        </div>
      )}

      {/* 미리보기 테이블 */}
      {!loading && tournamentId && items.length === 0 && !result && (
        <div
          className="border p-10 text-center text-sm"
          style={{
            borderColor: "var(--color-border)",
            backgroundColor: "var(--color-surface)",
            color: "var(--color-text-muted)",
            borderRadius: 4,
          }}
        >
          생성 가능한 배정이 없습니다. (완료된 배정이 없거나 이미 정산이 존재)
        </div>
      )}

      {!loading && items.length > 0 && (
        <>
          {/* 전체 선택 + 합계 */}
          <div
            className="flex flex-wrap items-center justify-between gap-3 border p-3"
            style={{
              borderColor: "var(--color-border)",
              backgroundColor: "var(--color-surface)",
              borderRadius: 4,
            }}
          >
            <label className="flex items-center gap-2 text-sm font-bold">
              <input
                type="checkbox"
                checked={allChecked}
                onChange={(e) => toggleAll(e.target.checked)}
              />
              전체 선택 ({items.length}건 중)
            </label>
            <div className="text-sm">
              선택:{" "}
              <b>{selectedStats.count}</b>건, 예상 금액{" "}
              <b>{formatNumber(selectedStats.sum)}원</b>
            </div>
          </div>

          {/* 테이블 */}
          <div
            className="border overflow-x-auto"
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
                  <th className="px-3 py-2 text-center w-10"></th>
                  <th className="px-3 py-2 text-left text-xs font-bold">경기일</th>
                  <th className="px-3 py-2 text-left text-xs font-bold">심판</th>
                  <th className="px-3 py-2 text-left text-xs font-bold">역할</th>
                  <th className="px-3 py-2 text-right text-xs font-bold">금액(원)</th>
                  <th className="px-3 py-2 text-left text-xs font-bold">메모</th>
                </tr>
              </thead>
              <tbody>
                {items.map((it) => {
                  const key = it.assignment_id.toString();
                  const e = edits[key] ?? {
                    checked: true,
                    amount: String(it.expected_amount),
                    memo: "",
                  };
                  return (
                    <tr
                      key={key}
                      className="border-t"
                      style={{
                        borderColor: "var(--color-border)",
                        opacity: e.checked ? 1 : 0.5,
                      }}
                    >
                      <td className="px-3 py-2 text-center">
                        <input
                          type="checkbox"
                          checked={e.checked}
                          onChange={(ev) => toggleOne(key, ev.target.checked)}
                        />
                      </td>
                      <td className="px-3 py-2">
                        {formatDate(it.match?.scheduled_at ?? null)}
                        {it.match?.round_name && (
                          <div
                            className="text-xs"
                            style={{ color: "var(--color-text-muted)" }}
                          >
                            {it.match.round_name}
                            {it.match.venue_name ? ` · ${it.match.venue_name}` : ""}
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-2">{it.referee_name}</td>
                      <td className="px-3 py-2">
                        {ROLE_LABEL[it.role] ?? it.role}
                      </td>
                      <td className="px-3 py-2 text-right">
                        <input
                          type="text"
                          inputMode="numeric"
                          value={e.amount}
                          onChange={(ev) => setAmount(key, ev.target.value)}
                          className="w-24 px-2 py-1 text-sm text-right"
                          style={{
                            border: "1px solid var(--color-border)",
                            backgroundColor: "var(--color-background)",
                            color: "var(--color-text-primary)",
                            borderRadius: 4,
                          }}
                        />
                        {it.fee_snapshot === null && (
                          <div
                            className="text-[10px] mt-0.5"
                            style={{ color: "var(--color-text-muted)" }}
                          >
                            (단가표 기준)
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="text"
                          value={e.memo}
                          onChange={(ev) => setMemo(key, ev.target.value)}
                          placeholder="선택"
                          className="w-full px-2 py-1 text-sm"
                          style={{
                            border: "1px solid var(--color-border)",
                            backgroundColor: "var(--color-background)",
                            color: "var(--color-text-primary)",
                            borderRadius: 4,
                          }}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* 제출 버튼 */}
          <div className="flex justify-end gap-2">
            <Link
              href="/referee/admin/settlements"
              className="px-3 py-2 text-sm font-bold"
              style={{
                border: "1px solid var(--color-border)",
                color: "var(--color-text-muted)",
                borderRadius: 4,
              }}
            >
              취소
            </Link>
            <button
              type="button"
              disabled={submitting || selectedStats.count === 0}
              onClick={submit}
              className="px-4 py-2 text-sm font-black disabled:opacity-40"
              style={{
                backgroundColor: "var(--color-primary, #E31B23)",
                color: "var(--color-text-on-primary, #fff)",
                borderRadius: 4,
              }}
            >
              {submitting
                ? "생성 중..."
                : `${selectedStats.count}건 일괄 생성`}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
