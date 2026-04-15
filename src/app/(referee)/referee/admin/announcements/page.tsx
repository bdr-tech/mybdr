"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

/**
 * /referee/admin/announcements — 배정 신청 공고 관리 페이지.
 *
 * 이유: 협회 심판팀장/경기팀장이 "언제 / 몇 명 필요"를 공개 공고로 내고,
 *      심판들의 신청을 모아야 배정 워크플로우가 시작된다.
 *      1차는 게시/조회/수정/삭제 + 신청자 수 표시까지만. 선정은 2차에서.
 *
 * 구조:
 *   - 상단: "공고 게시" 버튼 (모달)
 *   - 테이블: 제목/대회/역할/일자수/신청자수/상태/마감일/관리
 *   - 모달: 대회선택 + 제목 + 설명 + 역할 + 일자 추가 + 일자별 필요인원 + 마감일
 *
 * 디자인: var(--color-*) + Material Symbols + border-radius 4px
 */

// ── 타입 ──
type Tournament = {
  id: string;
  name: string;
  status: string | null;
  start_date: string | null;
  end_date: string | null;
};

type Announcement = {
  id: string | number;
  tournament_id: string;
  tournament_name: string | null;
  title: string;
  role_type: "referee" | "game_official";
  dates: string[]; // ISO 문자열로 직렬화됨
  required_count: Record<string, number>;
  deadline: string | null;
  status: "open" | "closed" | "cancelled";
  applications_count: number;
  created_at: string;
};

const ROLE_LABELS: Record<string, string> = {
  referee: "심판",
  game_official: "경기원",
};
const STATUS_LABELS: Record<string, string> = {
  open: "모집중",
  closed: "마감",
  cancelled: "취소",
};

export default function AnnouncementsPage() {
  const [items, setItems] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);

  // 모달 관련 상태
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // 대회 검색
  const [tSearch, setTSearch] = useState("");
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [selectedTournament, setSelectedTournament] =
    useState<Tournament | null>(null);

  // 폼 필드
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [roleType, setRoleType] = useState<"referee" | "game_official">("referee");
  const [dateInput, setDateInput] = useState("");
  const [dates, setDates] = useState<string[]>([]);
  const [requiredCount, setRequiredCount] = useState<Record<string, number>>({});
  const [deadline, setDeadline] = useState<string>(""); // datetime-local 값

  // ── 목록 로드 ──
  const loadList = useCallback(async () => {
    setLoading(true);
    setPageError(null);
    try {
      const res = await fetch("/api/web/referee-admin/announcements", {
        cache: "no-store",
      });
      const data = await res.json();
      if (!res.ok) {
        setPageError(data?.error ?? "목록을 불러오지 못했습니다.");
        return;
      }
      setItems(data.items ?? []);
    } catch {
      setPageError("네트워크 오류");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadList();
  }, [loadList]);

  // ── 대회 검색 ──
  const searchTournaments = useCallback(async (q: string) => {
    const url = new URL(
      "/api/web/referee-admin/tournaments",
      window.location.origin
    );
    if (q) url.searchParams.set("q", q);
    url.searchParams.set("limit", "20");
    try {
      const res = await fetch(url.toString(), { cache: "no-store" });
      const data = await res.json();
      if (res.ok) setTournaments(data.items ?? []);
    } catch {
      // 무시 — 빈 목록 유지
    }
  }, []);

  // 모달 열릴 때 기본 대회 목록 로드
  useEffect(() => {
    if (modalOpen && tournaments.length === 0) {
      searchTournaments("");
    }
  }, [modalOpen, tournaments.length, searchTournaments]);

  // ── 일자 추가/삭제 ──
  const addDate = useCallback(() => {
    if (!dateInput) return;
    if (dates.includes(dateInput)) return;
    setDates((prev) => [...prev, dateInput].sort());
    setRequiredCount((prev) => ({ ...prev, [dateInput]: 1 }));
    setDateInput("");
  }, [dateInput, dates]);

  const removeDate = useCallback((d: string) => {
    setDates((prev) => prev.filter((x) => x !== d));
    setRequiredCount((prev) => {
      const next = { ...prev };
      delete next[d];
      return next;
    });
  }, []);

  // ── 폼 리셋 ──
  const resetForm = useCallback(() => {
    setSelectedTournament(null);
    setTSearch("");
    setTitle("");
    setDescription("");
    setRoleType("referee");
    setDateInput("");
    setDates([]);
    setRequiredCount({});
    setDeadline("");
    setFormError(null);
  }, []);

  // ── 공고 게시 ──
  const submitForm = useCallback(async () => {
    setFormError(null);
    if (!selectedTournament) {
      setFormError("대회를 선택해 주세요.");
      return;
    }
    if (!title.trim()) {
      setFormError("제목을 입력해 주세요.");
      return;
    }
    if (dates.length === 0) {
      setFormError("일자를 최소 1개 추가해 주세요.");
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        tournament_id: selectedTournament.id,
        title: title.trim(),
        description: description.trim() || undefined,
        role_type: roleType,
        dates,
        required_count: requiredCount,
        // datetime-local은 타임존 없이 오므로 ISO 변환
        deadline: deadline ? new Date(deadline).toISOString() : undefined,
      };
      const res = await fetch("/api/web/referee-admin/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setFormError(
          typeof data?.error === "string"
            ? data.error
            : "공고 게시에 실패했습니다."
        );
        return;
      }
      setModalOpen(false);
      resetForm();
      await loadList();
    } catch {
      setFormError("네트워크 오류");
    } finally {
      setSubmitting(false);
    }
  }, [
    selectedTournament,
    title,
    description,
    roleType,
    dates,
    requiredCount,
    deadline,
    resetForm,
    loadList,
  ]);

  // ── 삭제 ──
  const deleteItem = useCallback(
    async (id: string | number) => {
      if (!confirm("이 공고를 삭제하시겠습니까?")) return;
      try {
        const res = await fetch(`/api/web/referee-admin/announcements/${id}`, {
          method: "DELETE",
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          alert(data?.error ?? "삭제에 실패했습니다.");
          return;
        }
        await loadList();
      } catch {
        alert("네트워크 오류");
      }
    },
    [loadList]
  );

  // ── 상태 토글 (열기/닫기) ──
  const toggleStatus = useCallback(
    async (a: Announcement) => {
      const nextStatus: "open" | "closed" = a.status === "open" ? "closed" : "open";
      try {
        const res = await fetch(`/api/web/referee-admin/announcements/${a.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: nextStatus }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          alert(data?.error ?? "상태 변경에 실패했습니다.");
          return;
        }
        await loadList();
      } catch {
        alert("네트워크 오류");
      }
    },
    [loadList]
  );

  // 합계 필요 인원 (공고 행에서 표시)
  const totalRequired = useCallback((rc: Record<string, number>) => {
    return Object.values(rc ?? {}).reduce((sum, n) => sum + (n || 0), 0);
  }, []);

  // ── 렌더 ──
  return (
    <div className="space-y-4">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1
            className="text-xl font-black tracking-tight"
            style={{ color: "var(--color-text-primary)" }}
          >
            배정 신청 공고
          </h1>
          <p
            className="mt-1 text-sm"
            style={{ color: "var(--color-text-muted)" }}
          >
            심판/경기원에게 배정 신청을 받을 공고를 게시하고 관리합니다.
          </p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 text-sm font-bold"
          style={{
            backgroundColor: "var(--color-primary)",
            color: "#ffffff",
            borderRadius: 4,
          }}
        >
          <span className="material-symbols-outlined text-lg">add</span>
          공고 게시
        </button>
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

      {/* 목록 */}
      {loading ? (
        <div
          className="py-10 text-center text-sm"
          style={{ color: "var(--color-text-muted)" }}
        >
          불러오는 중...
        </div>
      ) : items.length === 0 ? (
        <div
          className="py-12 text-center text-sm"
          style={{
            color: "var(--color-text-muted)",
            backgroundColor: "var(--color-surface)",
            borderRadius: 4,
          }}
        >
          게시된 공고가 없습니다. "공고 게시" 버튼으로 추가해 주세요.
        </div>
      ) : (
        <div
          className="overflow-hidden border"
          style={{
            borderColor: "var(--color-border)",
            backgroundColor: "var(--color-surface)",
            borderRadius: 4,
          }}
        >
          <table className="w-full text-sm">
            <thead>
              <tr
                className="text-xs uppercase tracking-wider"
                style={{
                  color: "var(--color-text-muted)",
                  borderBottom: "1px solid var(--color-border)",
                }}
              >
                <th className="px-4 py-3 text-left">제목</th>
                <th className="px-4 py-3 text-left">대회</th>
                <th className="px-4 py-3 text-left">역할</th>
                <th className="px-4 py-3 text-center">일자</th>
                <th className="px-4 py-3 text-center">필요/신청</th>
                <th className="px-4 py-3 text-center">상태</th>
                <th className="px-4 py-3 text-left">마감일</th>
                <th className="px-4 py-3 text-right">관리</th>
              </tr>
            </thead>
            <tbody>
              {items.map((a) => (
                <tr
                  key={String(a.id)}
                  style={{
                    borderTop: "1px solid var(--color-border)",
                    color: "var(--color-text-primary)",
                  }}
                >
                  <td className="px-4 py-3 font-semibold">{a.title}</td>
                  <td
                    className="px-4 py-3"
                    style={{ color: "var(--color-text-secondary)" }}
                  >
                    {a.tournament_name ?? "-"}
                  </td>
                  <td className="px-4 py-3">{ROLE_LABELS[a.role_type] ?? a.role_type}</td>
                  <td className="px-4 py-3 text-center">{a.dates.length}일</td>
                  <td className="px-4 py-3 text-center">
                    {totalRequired(a.required_count)}명 / {a.applications_count}명
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className="inline-block px-2 py-0.5 text-[11px] font-bold"
                      style={{
                        backgroundColor:
                          a.status === "open"
                            ? "var(--color-primary)"
                            : "var(--color-border)",
                        color:
                          a.status === "open"
                            ? "#ffffff"
                            : "var(--color-text-muted)",
                        borderRadius: 4,
                      }}
                    >
                      {STATUS_LABELS[a.status] ?? a.status}
                    </span>
                  </td>
                  <td
                    className="px-4 py-3"
                    style={{ color: "var(--color-text-muted)" }}
                  >
                    {a.deadline ? new Date(a.deadline).toLocaleString("ko-KR") : "-"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      {/* 배정 워크플로우 2차: 공고 상세(선정 UI) 이동 */}
                      <Link
                        href={`/referee/admin/announcements/${a.id}`}
                        className="px-2 py-1 text-xs font-semibold"
                        style={{
                          border: "1px solid var(--color-primary)",
                          color: "var(--color-primary)",
                          borderRadius: 4,
                        }}
                      >
                        상세
                      </Link>
                      <button
                        onClick={() => toggleStatus(a)}
                        className="px-2 py-1 text-xs font-semibold"
                        style={{
                          border: "1px solid var(--color-border)",
                          color: "var(--color-text-secondary)",
                          borderRadius: 4,
                        }}
                      >
                        {a.status === "open" ? "마감" : "열기"}
                      </button>
                      <button
                        onClick={() => deleteItem(a.id)}
                        className="px-2 py-1 text-xs font-semibold"
                        style={{
                          border: "1px solid var(--color-primary)",
                          color: "var(--color-primary)",
                          borderRadius: 4,
                        }}
                      >
                        삭제
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ===== 공고 게시 모달 ===== */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.6)" }}
          onClick={(e) => {
            // 배경 클릭 시 닫기
            if (e.target === e.currentTarget && !submitting) {
              setModalOpen(false);
              resetForm();
            }
          }}
        >
          <div
            className="w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6"
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
                새 공고 게시
              </h2>
              <button
                onClick={() => {
                  if (!submitting) {
                    setModalOpen(false);
                    resetForm();
                  }
                }}
                style={{ color: "var(--color-text-muted)" }}
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {formError && (
              <div
                className="mb-4 p-3 text-sm"
                style={{
                  color: "var(--color-primary)",
                  backgroundColor: "var(--color-surface)",
                  borderRadius: 4,
                }}
              >
                {formError}
              </div>
            )}

            <div className="space-y-4">
              {/* 대회 선택 */}
              <div>
                <label
                  className="block text-xs font-bold uppercase tracking-wider mb-1"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  대회
                </label>
                {selectedTournament ? (
                  <div
                    className="flex items-center justify-between p-3"
                    style={{
                      backgroundColor: "var(--color-surface)",
                      borderRadius: 4,
                    }}
                  >
                    <div
                      className="font-semibold"
                      style={{ color: "var(--color-text-primary)" }}
                    >
                      {selectedTournament.name}
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedTournament(null)}
                      className="text-xs"
                      style={{ color: "var(--color-text-muted)" }}
                    >
                      변경
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <input
                      value={tSearch}
                      onChange={(e) => setTSearch(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          searchTournaments(tSearch);
                        }
                      }}
                      placeholder="대회명 검색 (Enter)"
                      className="w-full px-3 py-2 text-sm"
                      style={{
                        backgroundColor: "var(--color-surface)",
                        border: "1px solid var(--color-border)",
                        color: "var(--color-text-primary)",
                        borderRadius: 4,
                      }}
                    />
                    <div
                      className="max-h-40 overflow-y-auto"
                      style={{
                        border: "1px solid var(--color-border)",
                        borderRadius: 4,
                      }}
                    >
                      {tournaments.length === 0 ? (
                        <div
                          className="p-3 text-xs text-center"
                          style={{ color: "var(--color-text-muted)" }}
                        >
                          검색 결과 없음
                        </div>
                      ) : (
                        tournaments.map((t) => (
                          <button
                            type="button"
                            key={t.id}
                            onClick={() => setSelectedTournament(t)}
                            className="block w-full px-3 py-2 text-left text-sm"
                            style={{
                              color: "var(--color-text-primary)",
                              borderTop: "1px solid var(--color-border)",
                            }}
                          >
                            {t.name}
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* 제목 */}
              <div>
                <label
                  className="block text-xs font-bold uppercase tracking-wider mb-1"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  제목
                </label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="예: 5월 U18 챔피언십 심판 모집"
                  className="w-full px-3 py-2 text-sm"
                  style={{
                    backgroundColor: "var(--color-surface)",
                    border: "1px solid var(--color-border)",
                    color: "var(--color-text-primary)",
                    borderRadius: 4,
                  }}
                />
              </div>

              {/* 설명 */}
              <div>
                <label
                  className="block text-xs font-bold uppercase tracking-wider mb-1"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  설명 (선택)
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  placeholder="모집 안내 / 근무 조건 등"
                  className="w-full px-3 py-2 text-sm"
                  style={{
                    backgroundColor: "var(--color-surface)",
                    border: "1px solid var(--color-border)",
                    color: "var(--color-text-primary)",
                    borderRadius: 4,
                  }}
                />
              </div>

              {/* 역할 유형 */}
              <div>
                <label
                  className="block text-xs font-bold uppercase tracking-wider mb-1"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  역할 유형
                </label>
                <div className="flex gap-2">
                  {(["referee", "game_official"] as const).map((r) => (
                    <button
                      type="button"
                      key={r}
                      onClick={() => setRoleType(r)}
                      className="px-3 py-2 text-xs font-bold"
                      style={{
                        backgroundColor:
                          roleType === r ? "var(--color-primary)" : "var(--color-surface)",
                        color:
                          roleType === r ? "#ffffff" : "var(--color-text-secondary)",
                        border: "1px solid var(--color-border)",
                        borderRadius: 4,
                      }}
                    >
                      {ROLE_LABELS[r]}
                    </button>
                  ))}
                </div>
              </div>

              {/* 일자 추가 */}
              <div>
                <label
                  className="block text-xs font-bold uppercase tracking-wider mb-1"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  대상 일자
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="date"
                    value={dateInput}
                    onChange={(e) => setDateInput(e.target.value)}
                    className="flex-1 px-3 py-2 text-sm"
                    style={{
                      backgroundColor: "var(--color-surface)",
                      border: "1px solid var(--color-border)",
                      color: "var(--color-text-primary)",
                      borderRadius: 4,
                    }}
                  />
                  <button
                    type="button"
                    onClick={addDate}
                    className="px-3 py-2 text-xs font-bold"
                    style={{
                      backgroundColor: "var(--color-primary)",
                      color: "#ffffff",
                      borderRadius: 4,
                    }}
                  >
                    추가
                  </button>
                </div>
                {dates.length > 0 && (
                  <div className="space-y-1">
                    {dates.map((d) => (
                      <div
                        key={d}
                        className="flex items-center justify-between p-2"
                        style={{
                          backgroundColor: "var(--color-surface)",
                          borderRadius: 4,
                        }}
                      >
                        <span
                          className="text-sm"
                          style={{ color: "var(--color-text-primary)" }}
                        >
                          {d}
                        </span>
                        <div className="flex items-center gap-2">
                          <label
                            className="text-xs"
                            style={{ color: "var(--color-text-muted)" }}
                          >
                            필요 인원
                          </label>
                          <input
                            type="number"
                            min={0}
                            max={100}
                            value={requiredCount[d] ?? 1}
                            onChange={(e) =>
                              setRequiredCount((prev) => ({
                                ...prev,
                                [d]: Number(e.target.value) || 0,
                              }))
                            }
                            className="w-16 px-2 py-1 text-sm text-right"
                            style={{
                              backgroundColor: "var(--color-background)",
                              border: "1px solid var(--color-border)",
                              color: "var(--color-text-primary)",
                              borderRadius: 4,
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => removeDate(d)}
                            style={{ color: "var(--color-primary)" }}
                          >
                            <span className="material-symbols-outlined text-base">
                              close
                            </span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 마감일 */}
              <div>
                <label
                  className="block text-xs font-bold uppercase tracking-wider mb-1"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  신청 마감 (선택)
                </label>
                <input
                  type="datetime-local"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full px-3 py-2 text-sm"
                  style={{
                    backgroundColor: "var(--color-surface)",
                    border: "1px solid var(--color-border)",
                    color: "var(--color-text-primary)",
                    borderRadius: 4,
                  }}
                />
              </div>

              {/* 액션 */}
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    if (!submitting) {
                      setModalOpen(false);
                      resetForm();
                    }
                  }}
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
                  onClick={submitForm}
                  disabled={submitting}
                  className="px-4 py-2 text-sm font-bold disabled:opacity-50"
                  style={{
                    backgroundColor: "var(--color-primary)",
                    color: "#ffffff",
                    borderRadius: 4,
                  }}
                >
                  {submitting ? "게시 중..." : "게시하기"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
