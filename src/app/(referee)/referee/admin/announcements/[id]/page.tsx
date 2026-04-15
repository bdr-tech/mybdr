"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

/**
 * /referee/admin/announcements/[id] — 공고 상세 + 일자별 선정 UI
 *
 * 이유: 공고에 들어온 신청자 중 "이 날짜에 이 심판을 쓰겠다"를 일자별로 확정하고,
 *       각 일자마다 책임자(주심/팀장)를 1명 지정할 수 있어야 한다.
 *       이 페이지는 배정 워크플로우 2차의 핵심 화면이다.
 *
 * 레이아웃:
 *   - 상단: 공고 요약 (제목, 대회, 설명, 마감일, 상태)
 *   - 일자 탭: announcement.dates 순
 *   - 각 일자 패널: [좌] 미선정 신청자 목록 / [우] 선정된 풀 목록
 *
 * API:
 *   - GET  /api/web/referee-admin/announcements/[id]  (공고 + applications)
 *   - GET  /api/web/referee-admin/pools?tournament_id=&date= (풀 목록)
 *   - POST /api/web/referee-admin/pools  (선정)
 *   - DELETE /api/web/referee-admin/pools/[poolId]  (선정 취소)
 *   - PATCH  /api/web/referee-admin/pools/[poolId] { is_chief: true } (책임자 토글)
 */

// ── 타입 ──
type ApplicationRow = {
  id: string | number;
  referee_id: string | number;
  referee_name: string;
  referee_phone: string | null;
  memo: string | null;
  status: string;
  created_at: string;
  dates: string[]; // ISO 날짜 문자열
};

type AnnouncementDetail = {
  id: string | number;
  tournament_id: string;
  tournament_name: string | null;
  title: string;
  description: string | null;
  role_type: "referee" | "game_official";
  dates: string[];
  required_count: Record<string, number>;
  deadline: string | null;
  status: "open" | "closed" | "cancelled";
  applications: ApplicationRow[];
};

type PoolItem = {
  id: string | number;
  tournament_id: string;
  date: string;
  referee_id: string | number;
  role_type: "referee" | "game_official";
  is_chief: boolean;
  memo: string | null;
  referee_name: string;
  referee_level: string | null;
  referee_cert_grade: string | null;
};

// YYYY-MM-DD (UTC)
function toYmd(iso: string): string {
  return new Date(iso).toISOString().slice(0, 10);
}

const ROLE_LABELS: Record<string, string> = {
  referee: "심판",
  game_official: "경기원",
};

const STATUS_LABELS: Record<string, string> = {
  open: "모집중",
  closed: "마감",
  cancelled: "취소",
};

export default function AnnouncementDetailPage() {
  // URL 파라미터로부터 공고 id
  const params = useParams<{ id: string }>();
  const announcementId = params.id;

  const [detail, setDetail] = useState<AnnouncementDetail | null>(null);
  const [pools, setPools] = useState<PoolItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);

  // 현재 선택된 일자 탭 (YYYY-MM-DD)
  const [activeDate, setActiveDate] = useState<string | null>(null);

  // 선정 중(중복 클릭 방지)인 referee_id 집합
  const [selecting, setSelecting] = useState<Set<string>>(new Set());

  // ── 공고 상세 로드 ──
  const loadDetail = useCallback(async () => {
    setLoading(true);
    setPageError(null);
    try {
      const res = await fetch(
        `/api/web/referee-admin/announcements/${announcementId}`,
        { cache: "no-store" }
      );
      const data = await res.json();
      if (!res.ok) {
        setPageError(
          typeof data?.error === "string"
            ? data.error
            : "공고를 불러오지 못했습니다."
        );
        return;
      }
      const ann: AnnouncementDetail = data.announcement;
      setDetail(ann);
      // 첫 진입 시 첫 일자 활성화
      if (ann.dates.length > 0 && !activeDate) {
        setActiveDate(toYmd(ann.dates[0]));
      }
    } catch {
      setPageError("네트워크 오류");
    } finally {
      setLoading(false);
    }
  }, [announcementId, activeDate]);

  // ── 풀 전체 로드 (대회 단위로 한번에 가져와 클라에서 일자별 필터) ──
  const loadPools = useCallback(async () => {
    if (!detail) return;
    try {
      const url = new URL(
        "/api/web/referee-admin/pools",
        window.location.origin
      );
      url.searchParams.set("tournament_id", detail.tournament_id);
      const res = await fetch(url.toString(), { cache: "no-store" });
      const data = await res.json();
      if (res.ok) {
        setPools((data.items ?? []) as PoolItem[]);
      }
    } catch {
      // 무시 — 풀 없음 상태 유지
    }
  }, [detail]);

  useEffect(() => {
    loadDetail();
  }, [loadDetail]);

  useEffect(() => {
    if (detail) loadPools();
  }, [detail, loadPools]);

  // ── 현재 일자 기준: 해당 일자 신청자 / 해당 일자 풀 / 미선정 신청자 ──
  const currentApplicants = useMemo(() => {
    if (!detail || !activeDate) return [] as ApplicationRow[];
    return detail.applications.filter((a) =>
      a.dates.some((d) => toYmd(d) === activeDate)
    );
  }, [detail, activeDate]);

  const currentPools = useMemo(() => {
    if (!activeDate) return [] as PoolItem[];
    return pools.filter((p) => toYmd(p.date) === activeDate);
  }, [pools, activeDate]);

  const selectedRefereeIds = useMemo(() => {
    return new Set(currentPools.map((p) => String(p.referee_id)));
  }, [currentPools]);

  // 미선정 신청자 = currentApplicants - selectedRefereeIds
  const pendingApplicants = useMemo(() => {
    return currentApplicants.filter(
      (a) => !selectedRefereeIds.has(String(a.referee_id))
    );
  }, [currentApplicants, selectedRefereeIds]);

  // ── 일자별 필요 인원 대비 선정 인원 표시용 ──
  const dateSummary = useCallback(
    (ymd: string) => {
      const need = detail?.required_count?.[ymd] ?? 0;
      const selected = pools.filter((p) => toYmd(p.date) === ymd).length;
      return { need, selected };
    },
    [detail, pools]
  );

  // ── 선정 ──
  const selectReferee = useCallback(
    async (refereeId: string | number) => {
      if (!detail || !activeDate) return;
      const key = String(refereeId);
      if (selecting.has(key)) return;
      setSelecting((prev) => new Set(prev).add(key));
      try {
        const res = await fetch("/api/web/referee-admin/pools", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tournament_id: detail.tournament_id,
            date: activeDate,
            referee_id: refereeId,
            role_type: detail.role_type,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          alert(
            typeof data?.error === "string"
              ? data.error
              : "선정에 실패했습니다."
          );
          return;
        }
        await loadPools();
      } catch {
        alert("네트워크 오류");
      } finally {
        setSelecting((prev) => {
          const next = new Set(prev);
          next.delete(key);
          return next;
        });
      }
    },
    [detail, activeDate, selecting, loadPools]
  );

  // ── 선정 취소 ──
  const unselectPool = useCallback(
    async (poolId: string | number) => {
      if (!confirm("이 심판의 선정을 취소하시겠습니까?")) return;
      try {
        const res = await fetch(`/api/web/referee-admin/pools/${poolId}`, {
          method: "DELETE",
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          alert(
            typeof data?.error === "string"
              ? data.error
              : "선정 취소에 실패했습니다."
          );
          return;
        }
        await loadPools();
      } catch {
        alert("네트워크 오류");
      }
    },
    [loadPools]
  );

  // ── 책임자 토글 ──
  const toggleChief = useCallback(
    async (poolId: string | number, nextValue: boolean) => {
      try {
        const res = await fetch(`/api/web/referee-admin/pools/${poolId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ is_chief: nextValue }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          alert(
            typeof data?.error === "string"
              ? data.error
              : "책임자 지정에 실패했습니다."
          );
          return;
        }
        await loadPools();
      } catch {
        alert("네트워크 오류");
      }
    },
    [loadPools]
  );

  // ── 렌더 ──
  if (loading && !detail) {
    return (
      <div
        className="py-10 text-center text-sm"
        style={{ color: "var(--color-text-muted)" }}
      >
        불러오는 중...
      </div>
    );
  }

  if (pageError || !detail) {
    return (
      <div className="space-y-4">
        <Link
          href="/referee/admin/announcements"
          className="inline-flex items-center gap-1 text-sm"
          style={{ color: "var(--color-text-muted)" }}
        >
          <span className="material-symbols-outlined text-base">arrow_back</span>
          공고 목록
        </Link>
        <div
          className="p-4 text-sm"
          style={{
            color: "var(--color-primary)",
            backgroundColor: "var(--color-surface)",
            borderRadius: 4,
          }}
        >
          {pageError ?? "공고를 찾을 수 없습니다."}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 뒤로가기 */}
      <Link
        href="/referee/admin/announcements"
        className="inline-flex items-center gap-1 text-sm"
        style={{ color: "var(--color-text-muted)" }}
      >
        <span className="material-symbols-outlined text-base">arrow_back</span>
        공고 목록
      </Link>

      {/* 공고 요약 */}
      <div
        className="p-5"
        style={{
          backgroundColor: "var(--color-surface)",
          border: "1px solid var(--color-border)",
          borderRadius: 4,
        }}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span
                className="inline-block px-2 py-0.5 text-[11px] font-bold"
                style={{
                  backgroundColor:
                    detail.status === "open"
                      ? "var(--color-primary)"
                      : "var(--color-border)",
                  color:
                    detail.status === "open"
                      ? "#ffffff"
                      : "var(--color-text-muted)",
                  borderRadius: 4,
                }}
              >
                {STATUS_LABELS[detail.status] ?? detail.status}
              </span>
              <span
                className="text-xs font-semibold"
                style={{ color: "var(--color-text-muted)" }}
              >
                {ROLE_LABELS[detail.role_type] ?? detail.role_type}
              </span>
            </div>
            <h1
              className="text-xl font-black tracking-tight"
              style={{ color: "var(--color-text-primary)" }}
            >
              {detail.title}
            </h1>
            <div
              className="mt-1 text-sm"
              style={{ color: "var(--color-text-secondary)" }}
            >
              {detail.tournament_name ?? "-"}
            </div>
            {detail.description && (
              <p
                className="mt-3 text-sm whitespace-pre-wrap"
                style={{ color: "var(--color-text-secondary)" }}
              >
                {detail.description}
              </p>
            )}
          </div>
          <div
            className="text-right text-xs"
            style={{ color: "var(--color-text-muted)" }}
          >
            <div>
              마감일:{" "}
              {detail.deadline
                ? new Date(detail.deadline).toLocaleString("ko-KR")
                : "-"}
            </div>
            <div className="mt-1">신청자 {detail.applications.length}명</div>
          </div>
        </div>
      </div>

      {/* 일자 탭 */}
      <div
        className="flex flex-wrap gap-2 overflow-x-auto"
        role="tablist"
      >
        {detail.dates.map((iso) => {
          const ymd = toYmd(iso);
          const { need, selected } = dateSummary(ymd);
          const active = activeDate === ymd;
          return (
            <button
              key={ymd}
              type="button"
              role="tab"
              onClick={() => setActiveDate(ymd)}
              className="px-3 py-2 text-xs font-bold"
              style={{
                backgroundColor: active
                  ? "var(--color-primary)"
                  : "var(--color-surface)",
                color: active ? "#ffffff" : "var(--color-text-secondary)",
                border: "1px solid var(--color-border)",
                borderRadius: 4,
              }}
            >
              <div>{ymd}</div>
              <div
                className="text-[10px] font-semibold mt-0.5"
                style={{
                  color: active ? "#ffffff" : "var(--color-text-muted)",
                }}
              >
                {selected}/{need} 선정
              </div>
            </button>
          );
        })}
      </div>

      {/* 일자 패널: 좌 신청자 / 우 선정 풀 */}
      {activeDate && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* 좌: 미선정 신청자 */}
          <section
            className="p-4"
            style={{
              backgroundColor: "var(--color-surface)",
              border: "1px solid var(--color-border)",
              borderRadius: 4,
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <h2
                className="text-sm font-black uppercase tracking-wider"
                style={{ color: "var(--color-text-primary)" }}
              >
                신청자 ({pendingApplicants.length})
              </h2>
              <span
                className="text-xs"
                style={{ color: "var(--color-text-muted)" }}
              >
                {activeDate}
              </span>
            </div>
            {pendingApplicants.length === 0 ? (
              <div
                className="py-6 text-center text-xs"
                style={{ color: "var(--color-text-muted)" }}
              >
                이 일자에 대한 미선정 신청자가 없습니다.
              </div>
            ) : (
              <ul className="space-y-2">
                {pendingApplicants.map((a) => {
                  const key = String(a.referee_id);
                  const busy = selecting.has(key);
                  return (
                    <li
                      key={String(a.id)}
                      className="flex items-center justify-between p-3"
                      style={{
                        backgroundColor: "var(--color-background)",
                        border: "1px solid var(--color-border)",
                        borderRadius: 4,
                      }}
                    >
                      <div className="min-w-0 flex-1">
                        <div
                          className="text-sm font-semibold truncate"
                          style={{ color: "var(--color-text-primary)" }}
                        >
                          {a.referee_name}
                        </div>
                        {a.memo && (
                          <div
                            className="mt-1 text-xs whitespace-pre-wrap"
                            style={{ color: "var(--color-text-muted)" }}
                          >
                            {a.memo}
                          </div>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => selectReferee(a.referee_id)}
                        disabled={busy}
                        className="ml-3 px-3 py-1.5 text-xs font-bold disabled:opacity-50"
                        style={{
                          backgroundColor: "var(--color-primary)",
                          color: "#ffffff",
                          borderRadius: 4,
                        }}
                      >
                        {busy ? "선정 중..." : "선정"}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          {/* 우: 선정된 풀 */}
          <section
            className="p-4"
            style={{
              backgroundColor: "var(--color-surface)",
              border: "1px solid var(--color-border)",
              borderRadius: 4,
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <h2
                className="text-sm font-black uppercase tracking-wider"
                style={{ color: "var(--color-text-primary)" }}
              >
                선정된 풀 ({currentPools.length}/
                {detail.required_count?.[activeDate] ?? 0})
              </h2>
              <span
                className="text-xs"
                style={{ color: "var(--color-text-muted)" }}
              >
                {activeDate}
              </span>
            </div>
            {currentPools.length === 0 ? (
              <div
                className="py-6 text-center text-xs"
                style={{ color: "var(--color-text-muted)" }}
              >
                아직 선정된 인원이 없습니다. 좌측에서 선정해 주세요.
              </div>
            ) : (
              <ul className="space-y-2">
                {currentPools.map((p) => (
                  <li
                    key={String(p.id)}
                    className="flex items-center justify-between p-3"
                    style={{
                      backgroundColor: "var(--color-background)",
                      border: p.is_chief
                        ? "1px solid var(--color-primary)"
                        : "1px solid var(--color-border)",
                      borderRadius: 4,
                    }}
                  >
                    <div className="min-w-0 flex-1">
                      <div
                        className="flex items-center gap-1 text-sm font-semibold truncate"
                        style={{ color: "var(--color-text-primary)" }}
                      >
                        {p.is_chief && (
                          <span
                            className="material-symbols-outlined text-base"
                            style={{
                              color: "var(--color-primary)",
                              fontVariationSettings: "'FILL' 1",
                            }}
                            title="책임자"
                          >
                            star
                          </span>
                        )}
                        {p.referee_name}
                      </div>
                      <div
                        className="mt-0.5 text-[11px]"
                        style={{ color: "var(--color-text-muted)" }}
                      >
                        {p.referee_cert_grade ?? p.referee_level ?? "등급 미등록"}
                      </div>
                    </div>
                    <div className="ml-3 flex items-center gap-1">
                      {/* 책임자 토글 */}
                      <button
                        type="button"
                        onClick={() => toggleChief(p.id, !p.is_chief)}
                        className="px-2 py-1 text-xs font-semibold"
                        style={{
                          border: p.is_chief
                            ? "1px solid var(--color-primary)"
                            : "1px solid var(--color-border)",
                          color: p.is_chief
                            ? "var(--color-primary)"
                            : "var(--color-text-secondary)",
                          borderRadius: 4,
                        }}
                        title={p.is_chief ? "책임자 해제" : "책임자 지정"}
                      >
                        <span className="material-symbols-outlined text-base align-middle">
                          {p.is_chief ? "star" : "star_border"}
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => unselectPool(p.id)}
                        className="px-2 py-1 text-xs font-semibold"
                        style={{
                          border: "1px solid var(--color-border)",
                          color: "var(--color-text-secondary)",
                          borderRadius: 4,
                        }}
                      >
                        취소
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
