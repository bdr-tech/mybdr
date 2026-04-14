"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import RefereePicker, {
  type RefereePickerPool,
} from "../../_components/referee-picker";

/**
 * /referee/admin/assignments — 심판 경기 배정 관리 페이지 (배정워크플로우 3차 리팩토링).
 *
 * 이유: 이전 버전은 "우리 협회 전체 심판"을 드롭다운에 보여줬는데,
 *      배정 워크플로우가 "공고 → 신청 → 일자별 선정풀 → 경기 배정"으로 정리되면서
 *      실제 배정 단계에서는 "해당 경기 일자에 선정된 풀"에서만 골라야 한다.
 *
 * 구조:
 *   1단계: 대회 검색/선택 (기존 동일)
 *   2단계: 경기 목록 + 경기별 available_pools (기존 동일 + 풀 정보 추가)
 *   3단계: 배정 추가 모달 — RefereePicker (풀 기반) + 역할 선택 + 메모
 *
 * 빈 풀 안내:
 *   - 경기 일자 풀이 하나도 없으면 "일자별 운영에서 먼저 인원 선정" 안내 + 링크
 *   - 풀은 있지만 모두 배정된 경우 "모든 선정 인원이 배정되었습니다"
 *
 * 기존 기능 유지: 대회 검색, 경기 목록, 역할 지정, 메모, 타 협회 배정 표시.
 */

// ── 타입 정의 (API 응답 형태) ──
type Tournament = {
  id: string; // UUID
  name: string;
  status: string | null;
  start_date: string | null;
  end_date: string | null;
  venue_name: string | null;
};

type AssignmentRow = {
  id: string | number; // BigInt → JSON은 string으로 옴
  referee_id: string | number;
  referee_name: string;
  role: string;
  status: string;
  memo: string | null;
  is_own_association: boolean;
};

// 배정워크플로우 3차 — 경기에 포함된 "해당 일자 선정 풀"
type AvailablePool = {
  id: string | number;
  referee_id: string | number;
  name: string;
  level: string | null;
  is_chief: boolean;
  role_type: string;
};

type MatchRow = {
  id: string | number;
  scheduled_at: string | null;
  round_name: string | null;
  status: string | null;
  court_number: string | null;
  home_team_name: string | null;
  away_team_name: string | null;
  assignments: AssignmentRow[];
  available_pools: AvailablePool[]; // 3차 추가
};

// ── 역할 라벨 맵 ──
const ROLE_LABELS: Record<string, string> = {
  main: "주심",
  sub: "부심",
  recorder: "기록원",
  timer: "타이머",
};
const STATUS_LABELS: Record<string, string> = {
  assigned: "배정",
  confirmed: "확정",
  declined: "거절",
  cancelled: "취소",
  completed: "완료",
};

export default function AssignmentsPage() {
  // 1단계 상태
  const [searchQ, setSearchQ] = useState("");
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loadingT, setLoadingT] = useState(false);
  const [selected, setSelected] = useState<Tournament | null>(null);

  // 2단계 상태
  const [matches, setMatches] = useState<MatchRow[]>([]);
  const [loadingM, setLoadingM] = useState(false);

  // 3단계 상태 (모달)
  const [modalMatch, setModalMatch] = useState<MatchRow | null>(null);
  // RefereePicker에서 선택된 풀 (id + referee_id + name 세트로 보관)
  const [pickedPool, setPickedPool] = useState<{
    id: string;
    referee_id: string;
    name: string;
  } | null>(null);
  const [formRole, setFormRole] = useState<keyof typeof ROLE_LABELS>("main");
  const [formMemo, setFormMemo] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // 공통 에러
  const [pageError, setPageError] = useState<string | null>(null);

  // ── 1단계: 대회 검색 ──
  const fetchTournaments = useCallback(async (q: string) => {
    setLoadingT(true);
    setPageError(null);
    try {
      const url = new URL(
        "/api/web/referee-admin/tournaments",
        window.location.origin
      );
      if (q) url.searchParams.set("q", q);
      url.searchParams.set("limit", "30");
      const res = await fetch(url.toString());
      if (!res.ok) throw new Error("대회 목록 조회 실패");
      const json = await res.json();
      setTournaments(json.items ?? []);
    } catch (e) {
      setPageError((e as Error).message);
      setTournaments([]);
    } finally {
      setLoadingT(false);
    }
  }, []);

  // 최초 로드: 전체 대회 리스트 (최신순 20개)
  useEffect(() => {
    fetchTournaments("");
  }, [fetchTournaments]);

  // 검색 디바운스
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchTournaments(searchQ);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQ, fetchTournaments]);

  // ── 2단계: 경기 목록 로드 ──
  const fetchMatches = useCallback(async (tournamentId: string) => {
    setLoadingM(true);
    setPageError(null);
    try {
      const res = await fetch(
        `/api/web/referee-admin/tournaments/${tournamentId}/matches`
      );
      if (!res.ok) throw new Error("경기 목록 조회 실패");
      const json = await res.json();
      setMatches(json.items ?? []);
    } catch (e) {
      setPageError((e as Error).message);
      setMatches([]);
    } finally {
      setLoadingM(false);
    }
  }, []);

  useEffect(() => {
    if (selected) {
      fetchMatches(selected.id);
    } else {
      setMatches([]);
    }
  }, [selected, fetchMatches]);

  // ── 3단계 액션: 배정 생성 ──
  const openModal = (match: MatchRow) => {
    setModalMatch(match);
    setPickedPool(null);
    setFormRole("main");
    setFormMemo("");
    setFormError(null);
  };
  const closeModal = () => {
    if (!submitting) setModalMatch(null);
  };

  const submitAssignment = async () => {
    if (!modalMatch) return;
    if (!pickedPool) {
      setFormError("심판을 선택해 주세요.");
      return;
    }
    setSubmitting(true);
    setFormError(null);
    try {
      const res = await fetch("/api/web/referee-admin/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          referee_id: pickedPool.referee_id,
          tournament_match_id: String(modalMatch.id),
          role: formRole,
          memo: formMemo || null,
          // 3차 핵심: pool_id 함께 전달 → 서버가 4중 검증 + 저장
          pool_id: pickedPool.id,
        }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(
          typeof json.error === "string" ? json.error : "배정 생성 실패"
        );
      }
      // 새 배정 반영 → 경기 목록 재조회
      if (selected) await fetchMatches(selected.id);
      setModalMatch(null);
    } catch (e) {
      setFormError((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  // ── 액션: 상태 변경 / 삭제 ──
  const updateStatus = async (
    assignmentId: string | number,
    status: string
  ) => {
    if (!confirm(`상태를 "${STATUS_LABELS[status] ?? status}"로 변경할까요?`))
      return;
    try {
      const res = await fetch(
        `/api/web/referee-admin/assignments/${assignmentId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        }
      );
      if (!res.ok) throw new Error("상태 변경 실패");
      if (selected) await fetchMatches(selected.id);
    } catch (e) {
      alert((e as Error).message);
    }
  };

  const deleteAssignment = async (assignmentId: string | number) => {
    if (!confirm("이 배정을 삭제하시겠습니까?")) return;
    try {
      const res = await fetch(
        `/api/web/referee-admin/assignments/${assignmentId}`,
        { method: "DELETE" }
      );
      if (!res.ok) throw new Error("삭제 실패");
      if (selected) await fetchMatches(selected.id);
    } catch (e) {
      alert((e as Error).message);
    }
  };

  // ── 렌더 헬퍼 ──
  const formatDate = (iso: string | null) => {
    if (!iso) return "미정";
    try {
      const d = new Date(iso);
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      const h = String(d.getHours()).padStart(2, "0");
      const min = String(d.getMinutes()).padStart(2, "0");
      return `${d.getFullYear()}.${m}.${day} ${h}:${min}`;
    } catch {
      return iso;
    }
  };

  // 요약 뱃지: "주심 1/부심 0" 같은 카운트
  const summarizeAssignments = (list: AssignmentRow[]) => {
    const counts: Record<string, number> = {
      main: 0,
      sub: 0,
      recorder: 0,
      timer: 0,
    };
    for (const a of list) {
      if (counts[a.role] !== undefined) counts[a.role] += 1;
    }
    return counts;
  };

  // RefereePicker용 풀 변환 — API 응답(AvailablePool) → 컴포넌트 props 타입
  // id/referee_id가 string|number 혼합이라 문자열로 통일
  const toPickerPools = (list: AvailablePool[]): RefereePickerPool[] =>
    list.map((p) => ({
      id: String(p.id),
      referee_id: String(p.referee_id),
      name: p.name,
      level: p.level ?? undefined,
      is_chief: p.is_chief,
    }));

  // 이미 배정된 심판 id 목록 (RefereePicker excludeRefereeIds)
  const getExcludeIds = (m: MatchRow) =>
    m.assignments.map((a) => String(a.referee_id));

  return (
    <div className="space-y-6">
      {/* 페이지 헤더 */}
      <header className="flex flex-col gap-1">
        <h1
          className="text-2xl font-black"
          style={{ color: "var(--color-text-primary)" }}
        >
          경기 배정 관리
        </h1>
        <p
          className="text-sm"
          style={{ color: "var(--color-text-muted)" }}
        >
          대회를 선택한 뒤 경기별로 심판을 배정하세요. 심판은 해당 일자에 선정된
          인원 중에서만 고를 수 있습니다.
        </p>
      </header>

      {pageError && (
        <div
          className="flex items-center gap-2 rounded px-3 py-2 text-sm"
          style={{
            backgroundColor: "color-mix(in srgb, var(--color-primary) 10%, transparent)",
            color: "var(--color-primary)",
          }}
        >
          <span className="material-symbols-outlined text-base">error</span>
          {pageError}
        </div>
      )}

      {/* ======================= 1단계: 대회 선택 ======================= */}
      <section
        className="rounded border p-4"
        style={{
          borderColor: "var(--color-border)",
          backgroundColor: "var(--color-surface)",
          borderRadius: 4,
        }}
      >
        <div className="mb-3 flex items-center justify-between">
          <h2
            className="text-sm font-black uppercase tracking-wider"
            style={{ color: "var(--color-text-primary)" }}
          >
            1. 대회 선택
          </h2>
          {selected && (
            <button
              type="button"
              onClick={() => setSelected(null)}
              className="flex items-center gap-1 text-xs font-semibold"
              style={{ color: "var(--color-text-muted)" }}
            >
              <span className="material-symbols-outlined text-sm">close</span>
              선택 해제
            </button>
          )}
        </div>

        {/* 검색 인풋 */}
        <div className="mb-3">
          <div
            className="flex items-center gap-2 rounded border px-3 py-2"
            style={{
              borderColor: "var(--color-border)",
              backgroundColor: "var(--color-background)",
              borderRadius: 4,
            }}
          >
            <span
              className="material-symbols-outlined text-lg"
              style={{ color: "var(--color-text-muted)" }}
            >
              search
            </span>
            <input
              type="text"
              placeholder="대회명 검색"
              value={searchQ}
              onChange={(e) => setSearchQ(e.target.value)}
              className="flex-1 bg-transparent text-sm outline-none"
              style={{ color: "var(--color-text-primary)" }}
            />
          </div>
        </div>

        {/* 선택된 대회 표시 */}
        {selected ? (
          <div
            className="flex items-center gap-3 rounded px-3 py-2"
            style={{
              backgroundColor: "color-mix(in srgb, var(--color-primary) 8%, transparent)",
              borderRadius: 4,
            }}
          >
            <span
              className="material-symbols-outlined text-xl"
              style={{ color: "var(--color-primary)" }}
            >
              emoji_events
            </span>
            <div className="flex-1">
              <div
                className="text-sm font-bold"
                style={{ color: "var(--color-text-primary)" }}
              >
                {selected.name}
              </div>
              <div
                className="text-xs"
                style={{ color: "var(--color-text-muted)" }}
              >
                {selected.status ?? "-"} · {formatDate(selected.start_date)} ~{" "}
                {formatDate(selected.end_date)}
                {selected.venue_name && ` · ${selected.venue_name}`}
              </div>
            </div>
          </div>
        ) : loadingT ? (
          <div
            className="py-8 text-center text-sm"
            style={{ color: "var(--color-text-muted)" }}
          >
            불러오는 중...
          </div>
        ) : tournaments.length === 0 ? (
          <div
            className="py-8 text-center text-sm"
            style={{ color: "var(--color-text-muted)" }}
          >
            검색된 대회가 없습니다.
          </div>
        ) : (
          <div className="max-h-72 overflow-y-auto space-y-1">
            {tournaments.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setSelected(t)}
                className="w-full text-left flex items-start gap-2 px-3 py-2 text-sm transition-colors hover:opacity-80"
                style={{
                  backgroundColor: "var(--color-background)",
                  borderRadius: 4,
                  color: "var(--color-text-primary)",
                }}
              >
                <span
                  className="material-symbols-outlined text-base mt-0.5"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  emoji_events
                </span>
                <div className="flex-1">
                  <div className="font-semibold">{t.name}</div>
                  <div
                    className="text-xs"
                    style={{ color: "var(--color-text-muted)" }}
                  >
                    {t.status ?? "-"} · {formatDate(t.start_date)}
                    {t.venue_name && ` · ${t.venue_name}`}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </section>

      {/* ======================= 2단계: 경기 목록 ======================= */}
      {selected && (
        <section
          className="rounded border p-4"
          style={{
            borderColor: "var(--color-border)",
            backgroundColor: "var(--color-surface)",
            borderRadius: 4,
          }}
        >
          <h2
            className="mb-3 text-sm font-black uppercase tracking-wider"
            style={{ color: "var(--color-text-primary)" }}
          >
            2. 경기 목록 ({matches.length}건)
          </h2>

          {loadingM ? (
            <div
              className="py-8 text-center text-sm"
              style={{ color: "var(--color-text-muted)" }}
            >
              불러오는 중...
            </div>
          ) : matches.length === 0 ? (
            <div
              className="py-8 text-center text-sm"
              style={{ color: "var(--color-text-muted)" }}
            >
              이 대회에는 등록된 경기가 없습니다.
            </div>
          ) : (
            <div className="space-y-3">
              {matches.map((m) => {
                const counts = summarizeAssignments(m.assignments);
                // 풀 상태: 0개면 "선정 필요", 있지만 모두 배정됐으면 "모두 배정됨"
                const poolTotal = m.available_pools.length;
                const assignedRefIds = new Set(
                  m.assignments.map((a) => String(a.referee_id))
                );
                const poolRemaining = m.available_pools.filter(
                  (p) => !assignedRefIds.has(String(p.referee_id))
                ).length;
                const canAdd = poolTotal > 0 && poolRemaining > 0;

                return (
                  <div
                    key={String(m.id)}
                    className="rounded border p-3"
                    style={{
                      borderColor: "var(--color-border)",
                      backgroundColor: "var(--color-background)",
                      borderRadius: 4,
                    }}
                  >
                    {/* 경기 헤더: 날짜 + 팀 + 배정추가 버튼 */}
                    <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                      <div className="flex-1 min-w-[200px]">
                        <div
                          className="text-xs"
                          style={{ color: "var(--color-text-muted)" }}
                        >
                          {formatDate(m.scheduled_at)}
                          {m.round_name && ` · ${m.round_name}`}
                          {m.court_number && ` · 코트 ${m.court_number}`}
                        </div>
                        <div
                          className="text-sm font-bold mt-1"
                          style={{ color: "var(--color-text-primary)" }}
                        >
                          {m.home_team_name ?? "TBD"} vs{" "}
                          {m.away_team_name ?? "TBD"}
                        </div>
                        {/* 풀 상태 뱃지 — 선정 인원이 몇 명 남았는지 표시 */}
                        <div
                          className="text-[11px] mt-1"
                          style={{ color: "var(--color-text-muted)" }}
                        >
                          선정 풀: {poolTotal}명 · 가용 {poolRemaining}명
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* 요약 뱃지 */}
                        <div
                          className="flex items-center gap-1 text-[11px] font-bold px-2 py-1"
                          style={{
                            backgroundColor: "var(--color-surface)",
                            color: "var(--color-text-secondary)",
                            borderRadius: 4,
                          }}
                        >
                          주 {counts.main} / 부 {counts.sub} / 기 {counts.recorder} / 타{" "}
                          {counts.timer}
                        </div>
                        <button
                          type="button"
                          onClick={() => openModal(m)}
                          disabled={!canAdd}
                          className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold disabled:cursor-not-allowed"
                          style={{
                            backgroundColor: canAdd
                              ? "var(--color-primary)"
                              : "var(--color-border)",
                            color: canAdd
                              ? "var(--color-text-on-primary, #fff)"
                              : "var(--color-text-muted)",
                            borderRadius: 4,
                            opacity: canAdd ? 1 : 0.6,
                          }}
                          title={
                            !canAdd
                              ? poolTotal === 0
                                ? "이 일자에 선정된 인원이 없습니다"
                                : "선정 인원이 모두 배정되었습니다"
                              : undefined
                          }
                        >
                          <span className="material-symbols-outlined text-sm">
                            add
                          </span>
                          배정 추가
                        </button>
                      </div>
                    </div>

                    {/* 풀 상태 안내 — 빈 풀 / 모두 배정됨 */}
                    {poolTotal === 0 && (
                      <div
                        className="flex items-center gap-2 text-xs py-2 px-2 mb-2"
                        style={{
                          backgroundColor:
                            "color-mix(in srgb, var(--color-primary) 8%, transparent)",
                          color: "var(--color-primary)",
                          borderRadius: 4,
                        }}
                      >
                        <span className="material-symbols-outlined text-base">
                          info
                        </span>
                        <span className="flex-1">
                          이 일자에 선정된 인원이 없습니다. 먼저 일자별 운영에서
                          인원을 선정하세요.
                        </span>
                        <Link
                          href={`/referee/admin/pools?tournament_id=${selected.id}`}
                          className="font-bold underline"
                        >
                          일자별 운영 →
                        </Link>
                      </div>
                    )}
                    {poolTotal > 0 && poolRemaining === 0 && (
                      <div
                        className="flex items-center gap-2 text-xs py-2 px-2 mb-2"
                        style={{
                          backgroundColor:
                            "color-mix(in srgb, var(--color-text-muted) 10%, transparent)",
                          color: "var(--color-text-muted)",
                          borderRadius: 4,
                        }}
                      >
                        <span className="material-symbols-outlined text-base">
                          check_circle
                        </span>
                        모든 선정 인원이 이미 배정되었습니다.
                      </div>
                    )}

                    {/* 배정 목록 */}
                    {m.assignments.length === 0 ? (
                      <div
                        className="text-xs py-2"
                        style={{ color: "var(--color-text-muted)" }}
                      >
                        아직 배정된 심판이 없습니다.
                      </div>
                    ) : (
                      <div className="space-y-1">
                        {m.assignments.map((a) => (
                          <div
                            key={String(a.id)}
                            className="flex flex-wrap items-center gap-2 px-2 py-1.5 text-xs"
                            style={{
                              backgroundColor: "var(--color-surface)",
                              borderRadius: 4,
                            }}
                          >
                            <span
                              className="font-bold"
                              style={{ color: "var(--color-primary)" }}
                            >
                              {ROLE_LABELS[a.role] ?? a.role}
                            </span>
                            <span
                              style={{ color: "var(--color-text-primary)" }}
                            >
                              {a.referee_name}
                            </span>
                            {!a.is_own_association && (
                              <span
                                className="px-1.5 py-0.5 text-[10px]"
                                style={{
                                  backgroundColor:
                                    "color-mix(in srgb, var(--color-text-muted) 20%, transparent)",
                                  color: "var(--color-text-muted)",
                                  borderRadius: 4,
                                }}
                              >
                                타협회
                              </span>
                            )}
                            <span
                              className="px-1.5 py-0.5 text-[10px] font-semibold"
                              style={{
                                backgroundColor:
                                  a.status === "confirmed"
                                    ? "color-mix(in srgb, #22c55e 20%, transparent)"
                                    : a.status === "declined" || a.status === "cancelled"
                                      ? "color-mix(in srgb, var(--color-primary) 15%, transparent)"
                                      : "color-mix(in srgb, var(--color-text-muted) 15%, transparent)",
                                color: "var(--color-text-primary)",
                                borderRadius: 4,
                              }}
                            >
                              {STATUS_LABELS[a.status] ?? a.status}
                            </span>
                            <div className="ml-auto flex items-center gap-1">
                              {/* 우리 협회 배정만 액션 버튼 노출 */}
                              {a.is_own_association && (
                                <>
                                  {a.status !== "confirmed" && (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        updateStatus(a.id, "confirmed")
                                      }
                                      className="px-2 py-0.5 text-[10px] font-semibold"
                                      style={{
                                        color: "var(--color-text-muted)",
                                        borderRadius: 4,
                                      }}
                                      title="확정"
                                    >
                                      확정
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => deleteAssignment(a.id)}
                                    className="px-2 py-0.5 text-[10px] font-semibold"
                                    style={{
                                      color: "var(--color-primary)",
                                      borderRadius: 4,
                                    }}
                                    title="삭제"
                                  >
                                    삭제
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* ======================= 3단계: 배정 추가 모달 ======================= */}
      {modalMatch && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          onClick={closeModal}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded p-5"
            style={{
              backgroundColor: "var(--color-background)",
              border: "1px solid var(--color-border)",
              borderRadius: 4,
            }}
          >
            <h3
              className="text-base font-black mb-3"
              style={{ color: "var(--color-text-primary)" }}
            >
              배정 추가
            </h3>
            <div
              className="text-xs mb-4"
              style={{ color: "var(--color-text-muted)" }}
            >
              {formatDate(modalMatch.scheduled_at)} ·{" "}
              {modalMatch.home_team_name ?? "TBD"} vs{" "}
              {modalMatch.away_team_name ?? "TBD"}
            </div>

            {/* 심판 선택 — RefereePicker (풀 기반) */}
            <label
              className="block text-xs font-bold mb-1"
              style={{ color: "var(--color-text-secondary)" }}
            >
              심판 * (선정된 인원 중에서만 선택)
            </label>
            <div className="mb-3">
              <RefereePicker
                pools={toPickerPools(modalMatch.available_pools)}
                excludeRefereeIds={getExcludeIds(modalMatch)}
                value={pickedPool?.id}
                onSelect={(p) => setPickedPool(p)}
                placeholder="심판 이름으로 검색"
              />
              {modalMatch.available_pools.length === 0 && (
                <div
                  className="mt-2 text-[11px]"
                  style={{ color: "var(--color-primary)" }}
                >
                  이 일자에 선정된 인원이 없습니다.
                  {selected && (
                    <>
                      {" "}
                      <Link
                        href={`/referee/admin/pools?tournament_id=${selected.id}`}
                        className="underline font-bold"
                      >
                        일자별 운영 →
                      </Link>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* 역할 */}
            <label
              className="block text-xs font-bold mb-1"
              style={{ color: "var(--color-text-secondary)" }}
            >
              역할 *
            </label>
            <select
              value={formRole}
              onChange={(e) =>
                setFormRole(e.target.value as keyof typeof ROLE_LABELS)
              }
              className="w-full mb-3 px-3 py-2 text-sm"
              style={{
                backgroundColor: "var(--color-surface)",
                border: "1px solid var(--color-border)",
                color: "var(--color-text-primary)",
                borderRadius: 4,
              }}
            >
              <option value="main">주심</option>
              <option value="sub">부심</option>
              <option value="recorder">기록원</option>
              <option value="timer">타이머</option>
            </select>

            {/* 메모 */}
            <label
              className="block text-xs font-bold mb-1"
              style={{ color: "var(--color-text-secondary)" }}
            >
              메모
            </label>
            <textarea
              value={formMemo}
              onChange={(e) => setFormMemo(e.target.value)}
              rows={2}
              className="w-full mb-3 px-3 py-2 text-sm resize-none"
              style={{
                backgroundColor: "var(--color-surface)",
                border: "1px solid var(--color-border)",
                color: "var(--color-text-primary)",
                borderRadius: 4,
              }}
              placeholder="선택사항"
            />

            {formError && (
              <div
                className="text-xs mb-3"
                style={{ color: "var(--color-primary)" }}
              >
                {formError}
              </div>
            )}

            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={closeModal}
                disabled={submitting}
                className="px-4 py-2 text-sm font-semibold"
                style={{
                  color: "var(--color-text-muted)",
                  borderRadius: 4,
                }}
              >
                취소
              </button>
              <button
                type="button"
                onClick={submitAssignment}
                disabled={submitting || !pickedPool}
                className="px-4 py-2 text-sm font-bold"
                style={{
                  backgroundColor: "var(--color-primary)",
                  color: "var(--color-text-on-primary, #fff)",
                  borderRadius: 4,
                  opacity: submitting || !pickedPool ? 0.6 : 1,
                }}
              >
                {submitting ? "저장 중..." : "배정 확정"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
