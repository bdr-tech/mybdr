"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * /referee/applications — 본인 배정 신청 페이지.
 *
 * 이유: 심판이 협회에서 게시한 공고를 보고, 가능한 일자를 골라 신청/취소할 수 있어야 한다.
 *      API는 세션 기반이라 referee_id 노출 없음 (IDOR 방지).
 *
 * 구조: 탭 2개 — 열려있는 공고 / 내 신청 목록
 *   탭1: 공고 카드 + 신청 모달 (일자 체크박스 + 메모)
 *   탭2: 내 신청 목록 + 취소 버튼
 *
 * 디자인: var(--color-*) + Material Symbols + border-radius 4px
 */

// ── 타입 ──
type OpenAnnouncement = {
  id: string | number;
  tournament_id: string;
  tournament_name: string | null;
  title: string;
  description: string | null;
  role_type: "referee" | "game_official";
  dates: string[];
  required_count: Record<string, number>;
  deadline: string | null;
  status: string;
  already_applied: boolean;
  my_application_id: string | number | null;
};

type MyApplication = {
  id: string | number;
  status: string;
  memo: string | null;
  created_at: string;
  dates: string[];
  announcement: {
    id: string | number;
    tournament_id: string;
    tournament_name: string | null;
    title: string;
    role_type: string;
    dates: string[];
    deadline: string | null;
    status: string;
  };
};

const ROLE_LABELS: Record<string, string> = {
  referee: "심판",
  game_official: "경기원",
};

const APP_STATUS_LABELS: Record<string, string> = {
  submitted: "제출됨",
  withdrawn: "취소",
};

// Date 문자열 → YYYY-MM-DD
function toYmd(s: string | Date): string {
  const d = typeof s === "string" ? new Date(s) : s;
  return d.toISOString().slice(0, 10);
}

export default function ApplicationsPage() {
  const [tab, setTab] = useState<"open" | "mine">("open");

  const [announcements, setAnnouncements] = useState<OpenAnnouncement[]>([]);
  const [myApps, setMyApps] = useState<MyApplication[]>([]);
  const [loading, setLoading] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);

  // 신청 모달
  const [modalAnn, setModalAnn] = useState<OpenAnnouncement | null>(null);
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [memo, setMemo] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // ── 열려있는 공고 로드 ──
  const loadOpen = useCallback(async () => {
    setLoading(true);
    setPageError(null);
    try {
      const res = await fetch("/api/web/referee-applications/announcements", {
        cache: "no-store",
      });
      const data = await res.json();
      if (!res.ok) {
        setPageError(data?.error ?? "공고를 불러오지 못했습니다.");
        return;
      }
      setAnnouncements(data.items ?? []);
    } catch {
      setPageError("네트워크 오류");
    } finally {
      setLoading(false);
    }
  }, []);

  // ── 내 신청 로드 ──
  const loadMine = useCallback(async () => {
    setLoading(true);
    setPageError(null);
    try {
      const res = await fetch("/api/web/referee-applications", {
        cache: "no-store",
      });
      const data = await res.json();
      if (!res.ok) {
        setPageError(data?.error ?? "신청 목록을 불러오지 못했습니다.");
        return;
      }
      setMyApps(data.items ?? []);
    } catch {
      setPageError("네트워크 오류");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (tab === "open") loadOpen();
    else loadMine();
  }, [tab, loadOpen, loadMine]);

  // ── 신청 모달 열기 ──
  const openApplyModal = useCallback((ann: OpenAnnouncement) => {
    setModalAnn(ann);
    setSelectedDates([]);
    setMemo("");
    setFormError(null);
  }, []);

  // ── 일자 토글 ──
  const toggleDate = useCallback((d: string) => {
    setSelectedDates((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d].sort()
    );
  }, []);

  // ── 신청 제출 ──
  const submitApply = useCallback(async () => {
    if (!modalAnn) return;
    if (selectedDates.length === 0) {
      setFormError("신청할 일자를 최소 1개 선택해 주세요.");
      return;
    }
    setSubmitting(true);
    setFormError(null);
    try {
      const res = await fetch("/api/web/referee-applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          announcement_id:
            typeof modalAnn.id === "string" ? modalAnn.id : String(modalAnn.id),
          dates: selectedDates,
          memo: memo.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFormError(
          typeof data?.error === "string" ? data.error : "신청에 실패했습니다."
        );
        return;
      }
      setModalAnn(null);
      await loadOpen();
    } catch {
      setFormError("네트워크 오류");
    } finally {
      setSubmitting(false);
    }
  }, [modalAnn, selectedDates, memo, loadOpen]);

  // ── 신청 취소 ──
  const cancelApp = useCallback(
    async (id: string | number) => {
      if (!confirm("이 신청을 취소하시겠습니까?")) return;
      try {
        const res = await fetch(`/api/web/referee-applications/${id}`, {
          method: "DELETE",
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          alert(data?.error ?? "취소에 실패했습니다.");
          return;
        }
        await loadMine();
      } catch {
        alert("네트워크 오류");
      }
    },
    [loadMine]
  );

  return (
    <div className="space-y-4">
      {/* 헤더 */}
      <div>
        <h1
          className="text-xl font-black tracking-tight"
          style={{ color: "var(--color-text-primary)" }}
        >
          배정 신청
        </h1>
        <p
          className="mt-1 text-sm"
          style={{ color: "var(--color-text-muted)" }}
        >
          협회가 게시한 공고를 확인하고, 가능한 일자에 신청할 수 있습니다.
        </p>
      </div>

      {/* 탭 */}
      <div
        className="flex gap-1"
        style={{ borderBottom: "1px solid var(--color-border)" }}
      >
        {(["open", "mine"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="px-4 py-2 text-sm font-bold"
            style={{
              color: tab === t ? "var(--color-primary)" : "var(--color-text-muted)",
              borderBottom: tab === t ? "2px solid var(--color-primary)" : "2px solid transparent",
            }}
          >
            {t === "open" ? "열려있는 공고" : "내 신청 목록"}
          </button>
        ))}
      </div>

      {pageError && (
        <div
          className="p-3 text-sm"
          style={{
            color: "var(--color-primary)",
            backgroundColor: "var(--color-surface)",
            borderRadius: 4,
          }}
        >
          {pageError}
        </div>
      )}

      {loading && (
        <div
          className="py-10 text-center text-sm"
          style={{ color: "var(--color-text-muted)" }}
        >
          불러오는 중...
        </div>
      )}

      {/* ===== 탭 1: 열려있는 공고 ===== */}
      {!loading && tab === "open" && (
        <>
          {announcements.length === 0 ? (
            <div
              className="py-12 text-center text-sm"
              style={{
                color: "var(--color-text-muted)",
                backgroundColor: "var(--color-surface)",
                borderRadius: 4,
              }}
            >
              지금 신청 가능한 공고가 없습니다.
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {announcements.map((a) => (
                <div
                  key={String(a.id)}
                  className="p-4"
                  style={{
                    backgroundColor: "var(--color-surface)",
                    border: "1px solid var(--color-border)",
                    borderRadius: 4,
                  }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className="text-[11px] font-bold uppercase tracking-wider"
                      style={{ color: "var(--color-text-muted)" }}
                    >
                      {ROLE_LABELS[a.role_type] ?? a.role_type}
                    </span>
                    {a.already_applied && (
                      <span
                        className="text-[11px] font-bold px-2 py-0.5"
                        style={{
                          backgroundColor: "var(--color-primary)",
                          color: "#ffffff",
                          borderRadius: 4,
                        }}
                      >
                        신청 완료
                      </span>
                    )}
                  </div>
                  <h3
                    className="text-base font-bold mb-1"
                    style={{ color: "var(--color-text-primary)" }}
                  >
                    {a.title}
                  </h3>
                  <div
                    className="text-xs mb-2"
                    style={{ color: "var(--color-text-secondary)" }}
                  >
                    {a.tournament_name ?? "대회 미지정"}
                  </div>
                  {a.description && (
                    <p
                      className="text-sm mb-3 whitespace-pre-wrap"
                      style={{ color: "var(--color-text-secondary)" }}
                    >
                      {a.description}
                    </p>
                  )}
                  <div
                    className="text-xs space-y-1 mb-3"
                    style={{ color: "var(--color-text-muted)" }}
                  >
                    <div>대상 일자: {a.dates.map((d) => toYmd(d)).join(", ")}</div>
                    <div>
                      필요 인원:{" "}
                      {Object.entries(a.required_count ?? {})
                        .map(([d, n]) => `${d}(${n}명)`)
                        .join(" / ")}
                    </div>
                    {a.deadline && (
                      <div>마감: {new Date(a.deadline).toLocaleString("ko-KR")}</div>
                    )}
                  </div>
                  <button
                    onClick={() => openApplyModal(a)}
                    disabled={a.already_applied}
                    className="w-full py-2 text-sm font-bold disabled:opacity-50"
                    style={{
                      backgroundColor: a.already_applied
                        ? "var(--color-border)"
                        : "var(--color-primary)",
                      color: a.already_applied
                        ? "var(--color-text-muted)"
                        : "#ffffff",
                      borderRadius: 4,
                    }}
                  >
                    {a.already_applied ? "이미 신청함" : "신청하기"}
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ===== 탭 2: 내 신청 목록 ===== */}
      {!loading && tab === "mine" && (
        <>
          {myApps.length === 0 ? (
            <div
              className="py-12 text-center text-sm"
              style={{
                color: "var(--color-text-muted)",
                backgroundColor: "var(--color-surface)",
                borderRadius: 4,
              }}
            >
              제출한 신청이 없습니다.
            </div>
          ) : (
            <div className="space-y-3">
              {myApps.map((m) => (
                <div
                  key={String(m.id)}
                  className="p-4"
                  style={{
                    backgroundColor: "var(--color-surface)",
                    border: "1px solid var(--color-border)",
                    borderRadius: 4,
                  }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className="text-[11px] font-bold uppercase tracking-wider"
                          style={{ color: "var(--color-text-muted)" }}
                        >
                          {ROLE_LABELS[m.announcement.role_type] ??
                            m.announcement.role_type}
                        </span>
                        <span
                          className="text-[11px] font-bold px-2 py-0.5"
                          style={{
                            backgroundColor:
                              m.status === "submitted"
                                ? "var(--color-primary)"
                                : "var(--color-border)",
                            color:
                              m.status === "submitted"
                                ? "#ffffff"
                                : "var(--color-text-muted)",
                            borderRadius: 4,
                          }}
                        >
                          {APP_STATUS_LABELS[m.status] ?? m.status}
                        </span>
                      </div>
                      <h3
                        className="text-base font-bold mb-1"
                        style={{ color: "var(--color-text-primary)" }}
                      >
                        {m.announcement.title}
                      </h3>
                      <div
                        className="text-xs mb-2"
                        style={{ color: "var(--color-text-secondary)" }}
                      >
                        {m.announcement.tournament_name ?? "대회 미지정"}
                      </div>
                      <div
                        className="text-xs"
                        style={{ color: "var(--color-text-muted)" }}
                      >
                        신청 일자: {m.dates.map((d) => toYmd(d)).join(", ")}
                      </div>
                      {m.memo && (
                        <div
                          className="text-xs mt-1"
                          style={{ color: "var(--color-text-muted)" }}
                        >
                          메모: {m.memo}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => cancelApp(m.id)}
                      className="px-3 py-1.5 text-xs font-semibold whitespace-nowrap"
                      style={{
                        border: "1px solid var(--color-primary)",
                        color: "var(--color-primary)",
                        borderRadius: 4,
                      }}
                    >
                      취소
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ===== 신청 모달 ===== */}
      {modalAnn && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.6)" }}
          onClick={(e) => {
            if (e.target === e.currentTarget && !submitting) {
              setModalAnn(null);
            }
          }}
        >
          <div
            className="w-full max-w-md p-6"
            style={{
              backgroundColor: "var(--color-background)",
              border: "1px solid var(--color-border)",
              borderRadius: 4,
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2
                className="text-lg font-black"
                style={{ color: "var(--color-text-primary)" }}
              >
                신청하기
              </h2>
              <button
                onClick={() => !submitting && setModalAnn(null)}
                style={{ color: "var(--color-text-muted)" }}
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div
              className="mb-3 text-sm font-semibold"
              style={{ color: "var(--color-text-primary)" }}
            >
              {modalAnn.title}
            </div>

            {formError && (
              <div
                className="mb-3 p-2 text-sm"
                style={{
                  color: "var(--color-primary)",
                  backgroundColor: "var(--color-surface)",
                  borderRadius: 4,
                }}
              >
                {formError}
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label
                  className="block text-xs font-bold uppercase tracking-wider mb-2"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  가능한 일자를 선택
                </label>
                <div className="space-y-1">
                  {modalAnn.dates.map((iso) => {
                    const d = toYmd(iso);
                    const checked = selectedDates.includes(d);
                    const need = modalAnn.required_count?.[d] ?? 0;
                    return (
                      <label
                        key={d}
                        className="flex items-center gap-2 p-2 cursor-pointer"
                        style={{
                          backgroundColor: checked
                            ? "var(--color-surface)"
                            : "transparent",
                          border: "1px solid var(--color-border)",
                          borderRadius: 4,
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleDate(d)}
                        />
                        <span
                          className="flex-1 text-sm"
                          style={{ color: "var(--color-text-primary)" }}
                        >
                          {d}
                        </span>
                        <span
                          className="text-xs"
                          style={{ color: "var(--color-text-muted)" }}
                        >
                          필요 {need}명
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div>
                <label
                  className="block text-xs font-bold uppercase tracking-wider mb-1"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  메모 (선택)
                </label>
                <textarea
                  value={memo}
                  onChange={(e) => setMemo(e.target.value)}
                  rows={3}
                  placeholder="특이사항 / 선호 역할 등"
                  className="w-full px-3 py-2 text-sm"
                  style={{
                    backgroundColor: "var(--color-surface)",
                    border: "1px solid var(--color-border)",
                    color: "var(--color-text-primary)",
                    borderRadius: 4,
                  }}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => !submitting && setModalAnn(null)}
                  className="px-4 py-2 text-sm font-semibold"
                  style={{
                    border: "1px solid var(--color-border)",
                    color: "var(--color-text-secondary)",
                    borderRadius: 4,
                  }}
                >
                  취소
                </button>
                <button
                  type="button"
                  onClick={submitApply}
                  disabled={submitting}
                  className="px-4 py-2 text-sm font-bold disabled:opacity-50"
                  style={{
                    backgroundColor: "var(--color-primary)",
                    color: "#ffffff",
                    borderRadius: 4,
                  }}
                >
                  {submitting ? "제출 중..." : "제출하기"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
