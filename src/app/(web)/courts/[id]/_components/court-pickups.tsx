"use client";

/**
 * CourtPickups -- 코트 상세의 픽업게임 모집 섹션
 *
 * - SWR로 해당 코트의 모집 중인 픽업게임 목록을 패치
 * - 로그인 유저: 참가/탈퇴 + 새 게임 생성
 * - 비로그인: 목록만 열람
 *
 * 패턴: court-reports.tsx와 동일한 SWR + 폼 토글 방식
 */

import { useState } from "react";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

// ─── 타입 정의 ───
interface Participant {
  id: string;
  user_id: string;
  nickname: string;
  profile_image: string | null;
  joined_at: string;
}

interface PickupData {
  id: string;
  court_info_id: string;
  court_type: string; // indoor | outdoor | unknown — 실내/야외 구분
  host_id: string;
  host_nickname: string;
  host_image: string | null;
  title: string;
  description: string | null;
  scheduled_date: string;
  start_time: string;
  end_time: string | null;
  max_players: number;
  current_players: number;
  skill_level: string | null;
  status: string;
  participants: Participant[];
  created_at: string;
}

interface CourtPickupsProps {
  courtId: string;
  currentUserId?: string; // 로그인 유저 ID
}

// 실력 수준 한글 매핑
const SKILL_LABELS: Record<string, string> = {
  beginner: "초급",
  intermediate: "중급",
  advanced: "상급",
  any: "누구나",
};

export function CourtPickups({ courtId, currentUserId }: CourtPickupsProps) {
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // 참가/탈퇴 로딩 중인 게임 ID
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // 폼 상태
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [maxPlayers, setMaxPlayers] = useState(10);
  const [skillLevel, setSkillLevel] = useState("any");

  // SWR로 픽업게임 목록 패치
  const { data, mutate } = useSWR<{ pickups: PickupData[]; total: number }>(
    `/api/web/courts/${courtId}/pickups`,
    fetcher,
    { revalidateOnFocus: false }
  );

  const pickups = data?.pickups ?? [];

  // 오늘 날짜 (input[type=date]의 min 값)
  const today = new Date().toISOString().split("T")[0];

  // ─── 픽업게임 생성 ───
  const handleCreate = async () => {
    if (!title.trim()) {
      setError("제목을 입력해주세요");
      return;
    }
    if (!scheduledDate) {
      setError("날짜를 선택해주세요");
      return;
    }
    if (!startTime) {
      setError("시작 시간을 선택해주세요");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/web/courts/${courtId}/pickups`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || undefined,
          scheduled_date: scheduledDate,
          start_time: startTime,
          end_time: endTime || undefined,
          max_players: maxPlayers,
          skill_level: skillLevel,
        }),
      });

      const resData = await res.json();
      if (!res.ok) {
        setError(resData.error || "생성에 실패했습니다");
        return;
      }

      // 성공 → 폼 초기화 + 목록 갱신
      setShowForm(false);
      setTitle("");
      setDescription("");
      setScheduledDate("");
      setStartTime("");
      setEndTime("");
      setMaxPlayers(10);
      setSkillLevel("any");
      mutate();
    } catch {
      setError("네트워크 오류가 발생했습니다");
    } finally {
      setSubmitting(false);
    }
  };

  // ─── 참가하기 ───
  const handleJoin = async (pickupId: string) => {
    setActionLoading(pickupId);
    try {
      const res = await fetch(`/api/web/pickups/${pickupId}/join`, {
        method: "POST",
      });
      const resData = await res.json();
      if (!res.ok) {
        alert(resData.error || "참가에 실패했습니다");
        return;
      }
      mutate(); // 목록 갱신
    } catch {
      alert("네트워크 오류가 발생했습니다");
    } finally {
      setActionLoading(null);
    }
  };

  // ─── 탈퇴하기 ───
  const handleLeave = async (pickupId: string) => {
    if (!confirm("정말 탈퇴하시겠습니까?")) return;
    setActionLoading(pickupId);
    try {
      const res = await fetch(`/api/web/pickups/${pickupId}/join`, {
        method: "DELETE",
      });
      const resData = await res.json();
      if (!res.ok) {
        alert(resData.error || "탈퇴에 실패했습니다");
        return;
      }
      mutate();
    } catch {
      alert("네트워크 오류가 발생했습니다");
    } finally {
      setActionLoading(null);
    }
  };

  // ─── 게임 취소 (방장만) ───
  const handleCancel = async (pickupId: string) => {
    if (!confirm("정말 이 게임을 취소하시겠습니까? 참가자들에게 알림이 가지 않습니다.")) return;
    setActionLoading(pickupId);
    try {
      const res = await fetch(`/api/web/pickups/${pickupId}`, {
        method: "DELETE",
      });
      const resData = await res.json();
      if (!res.ok) {
        alert(resData.error || "취소에 실패했습니다");
        return;
      }
      mutate();
    } catch {
      alert("네트워크 오류가 발생했습니다");
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div
      className="rounded-md p-5 sm:p-6 mb-4"
      style={{
        backgroundColor: "var(--color-card)",
        boxShadow: "var(--shadow-card)",
      }}
    >
      {/* 섹션 헤더 */}
      <div className="flex items-center justify-between mb-3">
        <h2
          className="text-base font-bold"
          style={{ color: "var(--color-text-primary)" }}
        >
          <span
            className="material-symbols-outlined text-base align-middle mr-1"
            style={{ color: "var(--color-primary)" }}
          >
            sports_basketball
          </span>
          픽업게임
          {pickups.length > 0 && (
            <span
              className="ml-1.5 inline-flex items-center justify-center rounded-full px-1.5 text-xs font-bold text-white"
              style={{ backgroundColor: "var(--color-primary)", minWidth: "18px", height: "18px" }}
            >
              {pickups.length}
            </span>
          )}
        </h2>

        {/* 생성 버튼: 로그인 시만 */}
        {currentUserId && !showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-1 rounded-[4px] px-3 py-1.5 text-xs font-semibold transition-colors"
            style={{
              backgroundColor: "color-mix(in srgb, var(--color-primary) 15%, transparent)",
              color: "var(--color-primary)",
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>
              add
            </span>
            게임 만들기
          </button>
        )}
      </div>

      {/* ═══════ 생성 폼 ═══════ */}
      {showForm && (
        <div
          className="rounded-md p-4 mb-3"
          style={{
            backgroundColor: "var(--color-surface)",
            border: "1px solid var(--color-border-subtle)",
          }}
        >
          <h3
            className="text-sm font-bold mb-3"
            style={{ color: "var(--color-text-primary)" }}
          >
            새 픽업게임
          </h3>

          {/* 제목 */}
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="게임 제목 (예: 3대3 픽업 누구나 환영)"
            maxLength={100}
            className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none mb-2"
            style={{
              backgroundColor: "var(--color-surface-bright)",
              color: "var(--color-text-primary)",
              border: "1px solid var(--color-border-subtle)",
            }}
          />

          {/* 날짜 + 시간 */}
          <div className="grid grid-cols-3 gap-2 mb-2">
            <div>
              <label className="block text-[11px] mb-0.5" style={{ color: "var(--color-text-muted)" }}>
                날짜
              </label>
              <input
                type="date"
                value={scheduledDate}
                min={today}
                onChange={(e) => setScheduledDate(e.target.value)}
                className="w-full rounded-lg px-2 py-1.5 text-sm focus:outline-none"
                style={{
                  backgroundColor: "var(--color-surface-bright)",
                  color: "var(--color-text-primary)",
                  border: "1px solid var(--color-border-subtle)",
                }}
              />
            </div>
            <div>
              <label className="block text-[11px] mb-0.5" style={{ color: "var(--color-text-muted)" }}>
                시작
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full rounded-lg px-2 py-1.5 text-sm focus:outline-none"
                style={{
                  backgroundColor: "var(--color-surface-bright)",
                  color: "var(--color-text-primary)",
                  border: "1px solid var(--color-border-subtle)",
                }}
              />
            </div>
            <div>
              <label className="block text-[11px] mb-0.5" style={{ color: "var(--color-text-muted)" }}>
                종료 (선택)
              </label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full rounded-lg px-2 py-1.5 text-sm focus:outline-none"
                style={{
                  backgroundColor: "var(--color-surface-bright)",
                  color: "var(--color-text-primary)",
                  border: "1px solid var(--color-border-subtle)",
                }}
              />
            </div>
          </div>

          {/* 인원 + 실력 */}
          <div className="grid grid-cols-2 gap-2 mb-2">
            <div>
              <label className="block text-[11px] mb-0.5" style={{ color: "var(--color-text-muted)" }}>
                최대 인원
              </label>
              <input
                type="number"
                value={maxPlayers}
                min={2}
                max={30}
                onChange={(e) => setMaxPlayers(Number(e.target.value))}
                className="w-full rounded-lg px-2 py-1.5 text-sm focus:outline-none"
                style={{
                  backgroundColor: "var(--color-surface-bright)",
                  color: "var(--color-text-primary)",
                  border: "1px solid var(--color-border-subtle)",
                }}
              />
            </div>
            <div>
              <label className="block text-[11px] mb-0.5" style={{ color: "var(--color-text-muted)" }}>
                실력 수준
              </label>
              <select
                value={skillLevel}
                onChange={(e) => setSkillLevel(e.target.value)}
                className="w-full rounded-lg px-2 py-1.5 text-sm focus:outline-none"
                style={{
                  backgroundColor: "var(--color-surface-bright)",
                  color: "var(--color-text-primary)",
                  border: "1px solid var(--color-border-subtle)",
                }}
              >
                <option value="any">누구나</option>
                <option value="beginner">초급</option>
                <option value="intermediate">중급</option>
                <option value="advanced">상급</option>
              </select>
            </div>
          </div>

          {/* 설명 (선택) */}
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="추가 설명 (선택, 예: 공 가져올게요)"
            maxLength={300}
            rows={2}
            className="w-full rounded-lg px-3 py-2 text-sm resize-none focus:outline-none mb-2"
            style={{
              backgroundColor: "var(--color-surface-bright)",
              color: "var(--color-text-primary)",
              border: "1px solid var(--color-border-subtle)",
            }}
          />

          {/* 에러 메시지 */}
          {error && (
            <p className="mb-2 text-xs" style={{ color: "var(--color-error)" }}>
              {error}
            </p>
          )}

          {/* 버튼 */}
          <div className="flex gap-2">
            <button
              onClick={handleCreate}
              disabled={submitting}
              className="rounded-[4px] px-4 py-2 text-sm font-semibold text-white transition-colors disabled:opacity-50"
              style={{ backgroundColor: "var(--color-primary)" }}
            >
              {submitting ? "생성 중..." : "게임 만들기"}
            </button>
            <button
              onClick={() => {
                setShowForm(false);
                setError(null);
              }}
              className="rounded-[4px] px-4 py-2 text-sm font-semibold transition-colors"
              style={{
                backgroundColor: "var(--color-surface-bright)",
                color: "var(--color-text-secondary)",
              }}
            >
              취소
            </button>
          </div>
        </div>
      )}

      {/* ═══════ 픽업게임 목록 ═══════ */}
      {pickups.length > 0 ? (
        <div className="space-y-3">
          {pickups.map((p) => {
            // 내가 참가 중인지 확인
            const isParticipant = currentUserId
              ? p.participants.some((pt) => pt.user_id === currentUserId)
              : false;
            const isHost = currentUserId ? p.host_id === currentUserId : false;
            const isFull = p.current_players >= p.max_players;
            const isLoading = actionLoading === p.id;

            return (
              <div
                key={p.id}
                className="rounded-md p-4"
                style={{
                  backgroundColor: "var(--color-surface)",
                  border: `1px solid ${
                    isHost
                      ? "color-mix(in srgb, var(--color-primary) 30%, transparent)"
                      : "var(--color-border-subtle)"
                  }`,
                }}
              >
                {/* 상단: 제목 + 상태 */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h3
                      className="text-sm font-bold truncate"
                      style={{ color: "var(--color-text-primary)" }}
                    >
                      {p.title}
                    </h3>
                    <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>
                      {p.host_nickname}
                      {isHost && (
                        <span
                          className="ml-1 text-[10px] px-1 rounded"
                          style={{
                            backgroundColor: "color-mix(in srgb, var(--color-primary) 15%, transparent)",
                            color: "var(--color-primary)",
                          }}
                        >
                          방장
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {/* 실내/야외 뱃지 */}
                    <CourtTypeBadge courtType={p.court_type} />
                    <StatusBadge status={p.status} />
                  </div>
                </div>

                {/* 정보 행 */}
                <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs" style={{ color: "var(--color-text-muted)" }}>
                  <span className="inline-flex items-center gap-0.5">
                    <span className="material-symbols-outlined" style={{ fontSize: "13px" }}>calendar_today</span>
                    {formatDate(p.scheduled_date)}
                  </span>
                  <span className="inline-flex items-center gap-0.5">
                    <span className="material-symbols-outlined" style={{ fontSize: "13px" }}>schedule</span>
                    {p.start_time}{p.end_time ? ` ~ ${p.end_time}` : ""}
                  </span>
                  <span className="inline-flex items-center gap-0.5">
                    <span className="material-symbols-outlined" style={{ fontSize: "13px" }}>group</span>
                    {p.current_players}/{p.max_players}명
                  </span>
                  {p.skill_level && p.skill_level !== "any" && (
                    <span className="inline-flex items-center gap-0.5">
                      <span className="material-symbols-outlined" style={{ fontSize: "13px" }}>fitness_center</span>
                      {SKILL_LABELS[p.skill_level] ?? p.skill_level}
                    </span>
                  )}
                </div>

                {/* 설명 */}
                {p.description && (
                  <p
                    className="mt-1.5 text-xs leading-relaxed"
                    style={{ color: "var(--color-text-muted)" }}
                  >
                    {p.description}
                  </p>
                )}

                {/* 참가자 아바타 */}
                {p.participants.length > 0 && (
                  <div className="mt-2 flex items-center gap-1">
                    {p.participants.slice(0, 6).map((pt) => (
                      <div
                        key={pt.id}
                        className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold"
                        title={pt.nickname}
                        style={{
                          backgroundColor: "color-mix(in srgb, var(--color-primary) 15%, transparent)",
                          color: "var(--color-primary)",
                        }}
                      >
                        {pt.nickname?.[0] ?? "?"}
                      </div>
                    ))}
                    {p.participants.length > 6 && (
                      <span className="text-[10px]" style={{ color: "var(--color-text-disabled)" }}>
                        +{p.participants.length - 6}
                      </span>
                    )}
                  </div>
                )}

                {/* 인원 바 */}
                <div className="mt-2">
                  <div
                    className="h-1.5 rounded-full overflow-hidden"
                    style={{ backgroundColor: "var(--color-surface-bright)" }}
                  >
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${Math.min((p.current_players / p.max_players) * 100, 100)}%`,
                        backgroundColor: isFull ? "var(--color-success)" : "var(--color-primary)",
                      }}
                    />
                  </div>
                </div>

                {/* 액션 버튼 (로그인 시만) */}
                {currentUserId && (
                  <div className="mt-3 flex gap-2">
                    {isHost ? (
                      // 방장: 취소 버튼
                      <button
                        onClick={() => handleCancel(p.id)}
                        disabled={isLoading}
                        className="rounded-[4px] px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50"
                        style={{
                          backgroundColor: "color-mix(in srgb, var(--color-error) 12%, transparent)",
                          color: "var(--color-error)",
                        }}
                      >
                        {isLoading ? "처리 중..." : "게임 취소"}
                      </button>
                    ) : isParticipant ? (
                      // 참가자: 탈퇴 버튼
                      <button
                        onClick={() => handleLeave(p.id)}
                        disabled={isLoading}
                        className="rounded-[4px] px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50"
                        style={{
                          backgroundColor: "var(--color-surface-bright)",
                          color: "var(--color-text-secondary)",
                        }}
                      >
                        {isLoading ? "처리 중..." : "탈퇴"}
                      </button>
                    ) : p.status === "recruiting" && !isFull ? (
                      // 미참가자: 참가 버튼
                      <button
                        onClick={() => handleJoin(p.id)}
                        disabled={isLoading}
                        className="rounded-[4px] px-3 py-1.5 text-xs font-semibold text-white transition-colors disabled:opacity-50"
                        style={{ backgroundColor: "var(--color-primary)" }}
                      >
                        {isLoading ? "참가 중..." : "참가하기"}
                      </button>
                    ) : null}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        !showForm && (
          <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
            현재 모집 중인 픽업게임이 없습니다.
          </p>
        )
      )}
    </div>
  );
}

// ─── 헬퍼 컴포넌트 ───

// 상태 뱃지
function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; color: string }> = {
    recruiting: { label: "모집중", color: "var(--color-success)" },
    full: { label: "마감", color: "var(--color-warning)" },
    in_progress: { label: "진행중", color: "var(--color-info)" },
    completed: { label: "완료", color: "var(--color-text-disabled)" },
    cancelled: { label: "취소", color: "var(--color-error)" },
  };
  const { label, color } = config[status] ?? { label: status, color: "var(--color-text-muted)" };
  return (
    <span
      className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold"
      style={{
        backgroundColor: `color-mix(in srgb, ${color} 15%, transparent)`,
        color,
      }}
    >
      {label}
    </span>
  );
}

// 실내/야외 뱃지 — indoor=파란, outdoor=초록
function CourtTypeBadge({ courtType }: { courtType: string }) {
  if (courtType === "indoor") {
    return (
      <span
        className="inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-semibold"
        style={{
          backgroundColor: "color-mix(in srgb, var(--color-info) 15%, transparent)",
          color: "var(--color-info)",
        }}
      >
        <span className="material-symbols-outlined" style={{ fontSize: "11px" }}>stadium</span>
        실내
      </span>
    );
  }
  if (courtType === "outdoor") {
    return (
      <span
        className="inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-semibold"
        style={{
          backgroundColor: "color-mix(in srgb, var(--color-success) 15%, transparent)",
          color: "var(--color-success)",
        }}
      >
        <span className="material-symbols-outlined" style={{ fontSize: "11px" }}>park</span>
        야외
      </span>
    );
  }
  return null; // unknown이면 표시 안 함
}

// 날짜 포맷: 2026-03-30 → 3/30(월)
function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  const days = ["일", "월", "화", "수", "목", "금", "토"];
  return `${d.getMonth() + 1}/${d.getDate()}(${days[d.getDay()]})`;
}
