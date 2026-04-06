"use client";

/**
 * CourtEvents -- 코트 상세의 3x3 이벤트 섹션
 *
 * - SWR로 이벤트 목록 패치
 * - 이벤트 생성 폼 (로그인 유저만)
 * - 이벤트 상세: 팀 목록 + 팀 등록 + 대진표 시각화
 * - 대진표 생성 & 결과 입력 (주최자만)
 *
 * 패턴: court-pickups.tsx와 동일한 SWR + 폼 토글 방식
 */

import { useState } from "react";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

// ─── 타입 정의 ───
interface PlayerData {
  id: string;
  userId: string;
  nickname: string;
  profileImage: string | null;
  jerseyNumber: number | null;
  isCaptain: boolean;
}

interface TeamData {
  id: string;
  teamName: string;
  seed: number | null;
  status: string;
  players: PlayerData[];
}

interface MatchData {
  id: string;
  eventId: string;
  round: number;
  matchOrder: number;
  homeTeam: { id: string; teamName: string; seed: number | null } | null;
  awayTeam: { id: string; teamName: string; seed: number | null } | null;
  homeScore: number | null;
  awayScore: number | null;
  winner: { id: string; teamName: string } | null;
  status: string;
  scheduledTime: string | null;
}

interface EventData {
  id: string;
  courtInfoId: string;
  organizerId: string;
  organizerNickname: string;
  organizerImage: string | null;
  title: string;
  description: string | null;
  eventDate: string;
  startTime: string | null;
  endTime: string | null;
  maxTeams: number;
  teamSize: number;
  format: string;
  status: string;
  rules: string | null;
  prize: string | null;
  teamsCount: number;
  matchesCount: number;
  teams: TeamData[];
  createdAt: string;
}

interface CourtEventsProps {
  courtId: string;
  currentUserId?: string;
}

// 대회 형식 한글 매핑
const FORMAT_LABELS: Record<string, string> = {
  single_elimination: "싱글 엘리미네이션",
  round_robin: "라운드 로빈",
};

// 상태 한글 매핑
const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  recruiting: { label: "팀 모집중", color: "var(--color-success)" },
  ready: { label: "대진표 확정", color: "var(--color-info)" },
  in_progress: { label: "진행중", color: "var(--color-warning)" },
  completed: { label: "완료", color: "var(--color-text-disabled)" },
  cancelled: { label: "취소", color: "var(--color-error)" },
};

export function CourtEvents({ courtId, currentUserId }: CourtEventsProps) {
  const [showForm, setShowForm] = useState(false);
  // 펼쳐서 상세를 보고 있는 이벤트 ID
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // SWR로 이벤트 목록 패치
  const { data, mutate } = useSWR<{ events: EventData[] }>(
    `/api/web/courts/${courtId}/events`,
    fetcher,
    { revalidateOnFocus: false }
  );

  const events = data?.events ?? [];

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
            emoji_events
          </span>
          3x3 이벤트
          {events.length > 0 && (
            <span
              className="ml-1.5 inline-flex items-center justify-center rounded-full px-1.5 text-xs font-bold text-white"
              style={{ backgroundColor: "var(--color-primary)", minWidth: "18px", height: "18px" }}
            >
              {events.length}
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
            <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>add</span>
            이벤트 만들기
          </button>
        )}
      </div>

      {/* 이벤트 생성 폼 */}
      {showForm && (
        <EventCreateForm
          courtId={courtId}
          onCreated={() => { setShowForm(false); mutate(); }}
          onCancel={() => setShowForm(false)}
        />
      )}

      {/* 이벤트 목록 */}
      {events.length > 0 ? (
        <div className="space-y-3">
          {events.map((ev) => (
            <EventCard
              key={ev.id}
              event={ev}
              currentUserId={currentUserId}
              isExpanded={expandedId === ev.id}
              onToggle={() => setExpandedId(expandedId === ev.id ? null : ev.id)}
              onRefresh={() => mutate()}
            />
          ))}
        </div>
      ) : (
        !showForm && (
          <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
            현재 진행 중인 3x3 이벤트가 없습니다.
          </p>
        )
      )}
    </div>
  );
}

// ═════════════════════════════════════════════════
// 이벤트 생성 폼 컴포넌트
// ═════════════════════════════════════════════════
function EventCreateForm({
  courtId,
  onCreated,
  onCancel,
}: {
  courtId: string;
  onCreated: () => void;
  onCancel: () => void;
}) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // 폼 상태
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [maxTeams, setMaxTeams] = useState(8);
  const [teamSize, setTeamSize] = useState(3);
  const [format, setFormat] = useState("single_elimination");
  const [rules, setRules] = useState("");
  const [prize, setPrize] = useState("");

  const today = new Date().toISOString().split("T")[0];

  const handleCreate = async () => {
    if (!title.trim()) { setError("제목을 입력해주세요"); return; }
    if (!eventDate) { setError("날짜를 선택해주세요"); return; }

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/web/courts/${courtId}/events`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || undefined,
          event_date: eventDate,
          start_time: startTime || undefined,
          end_time: endTime || undefined,
          max_teams: maxTeams,
          team_size: teamSize,
          format,
          rules: rules.trim() || undefined,
          prize: prize.trim() || undefined,
        }),
      });

      const resData = await res.json();
      if (!res.ok) {
        setError(resData.error || "생성에 실패했습니다");
        return;
      }
      onCreated();
    } catch {
      setError("네트워크 오류가 발생했습니다");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="rounded-md p-4 mb-3"
      style={{
        backgroundColor: "var(--color-surface)",
        border: "1px solid var(--color-border-subtle)",
      }}
    >
      <h3 className="text-sm font-bold mb-3" style={{ color: "var(--color-text-primary)" }}>
        새 3x3 이벤트
      </h3>

      {/* 제목 */}
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="이벤트 제목 (예: 주말 3x3 토너먼트)"
        maxLength={200}
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
          <label className="block text-[11px] mb-0.5" style={{ color: "var(--color-text-muted)" }}>날짜</label>
          <input type="date" value={eventDate} min={today} onChange={(e) => setEventDate(e.target.value)}
            className="w-full rounded-lg px-2 py-1.5 text-sm focus:outline-none"
            style={{ backgroundColor: "var(--color-surface-bright)", color: "var(--color-text-primary)", border: "1px solid var(--color-border-subtle)" }}
          />
        </div>
        <div>
          <label className="block text-[11px] mb-0.5" style={{ color: "var(--color-text-muted)" }}>시작</label>
          <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)}
            className="w-full rounded-lg px-2 py-1.5 text-sm focus:outline-none"
            style={{ backgroundColor: "var(--color-surface-bright)", color: "var(--color-text-primary)", border: "1px solid var(--color-border-subtle)" }}
          />
        </div>
        <div>
          <label className="block text-[11px] mb-0.5" style={{ color: "var(--color-text-muted)" }}>종료 (선택)</label>
          <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)}
            className="w-full rounded-lg px-2 py-1.5 text-sm focus:outline-none"
            style={{ backgroundColor: "var(--color-surface-bright)", color: "var(--color-text-primary)", border: "1px solid var(--color-border-subtle)" }}
          />
        </div>
      </div>

      {/* 팀 설정 */}
      <div className="grid grid-cols-3 gap-2 mb-2">
        <div>
          <label className="block text-[11px] mb-0.5" style={{ color: "var(--color-text-muted)" }}>최대 팀 수</label>
          <select value={maxTeams} onChange={(e) => setMaxTeams(Number(e.target.value))}
            className="w-full rounded-lg px-2 py-1.5 text-sm focus:outline-none"
            style={{ backgroundColor: "var(--color-surface-bright)", color: "var(--color-text-primary)", border: "1px solid var(--color-border-subtle)" }}
          >
            <option value={4}>4팀</option>
            <option value={8}>8팀</option>
            <option value={16}>16팀</option>
          </select>
        </div>
        <div>
          <label className="block text-[11px] mb-0.5" style={{ color: "var(--color-text-muted)" }}>팀 인원</label>
          <select value={teamSize} onChange={(e) => setTeamSize(Number(e.target.value))}
            className="w-full rounded-lg px-2 py-1.5 text-sm focus:outline-none"
            style={{ backgroundColor: "var(--color-surface-bright)", color: "var(--color-text-primary)", border: "1px solid var(--color-border-subtle)" }}
          >
            <option value={2}>2명</option>
            <option value={3}>3명</option>
            <option value={4}>4명</option>
            <option value={5}>5명</option>
          </select>
        </div>
        <div>
          <label className="block text-[11px] mb-0.5" style={{ color: "var(--color-text-muted)" }}>대회 형식</label>
          <select value={format} onChange={(e) => setFormat(e.target.value)}
            className="w-full rounded-lg px-2 py-1.5 text-sm focus:outline-none"
            style={{ backgroundColor: "var(--color-surface-bright)", color: "var(--color-text-primary)", border: "1px solid var(--color-border-subtle)" }}
          >
            <option value="single_elimination">토너먼트</option>
            <option value="round_robin">라운드 로빈</option>
          </select>
        </div>
      </div>

      {/* 설명 */}
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="이벤트 설명 (선택)"
        maxLength={500}
        rows={2}
        className="w-full rounded-lg px-3 py-2 text-sm resize-none focus:outline-none mb-2"
        style={{ backgroundColor: "var(--color-surface-bright)", color: "var(--color-text-primary)", border: "1px solid var(--color-border-subtle)" }}
      />

      {/* 규칙 + 상금 (한 줄) */}
      <div className="grid grid-cols-2 gap-2 mb-2">
        <input type="text" value={rules} onChange={(e) => setRules(e.target.value)}
          placeholder="경기 규칙 (선택)"
          className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none"
          style={{ backgroundColor: "var(--color-surface-bright)", color: "var(--color-text-primary)", border: "1px solid var(--color-border-subtle)" }}
        />
        <input type="text" value={prize} onChange={(e) => setPrize(e.target.value)}
          placeholder="상금/상품 (선택)"
          className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none"
          style={{ backgroundColor: "var(--color-surface-bright)", color: "var(--color-text-primary)", border: "1px solid var(--color-border-subtle)" }}
        />
      </div>

      {/* 에러 */}
      {error && (
        <p className="mb-2 text-xs" style={{ color: "var(--color-error)" }}>{error}</p>
      )}

      {/* 버튼 */}
      <div className="flex gap-2">
        <button
          onClick={handleCreate}
          disabled={submitting}
          className="rounded-[4px] px-4 py-2 text-sm font-semibold text-white transition-colors disabled:opacity-50"
          style={{ backgroundColor: "var(--color-primary)" }}
        >
          {submitting ? "생성 중..." : "이벤트 만들기"}
        </button>
        <button
          onClick={onCancel}
          className="rounded-[4px] px-4 py-2 text-sm font-semibold transition-colors"
          style={{ backgroundColor: "var(--color-surface-bright)", color: "var(--color-text-secondary)" }}
        >
          취소
        </button>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════
// 이벤트 카드 컴포넌트 (목록 아이템)
// ═════════════════════════════════════════════════
function EventCard({
  event: ev,
  currentUserId,
  isExpanded,
  onToggle,
  onRefresh,
}: {
  event: EventData;
  currentUserId?: string;
  isExpanded: boolean;
  onToggle: () => void;
  onRefresh: () => void;
}) {
  const isOrganizer = currentUserId === ev.organizerId;
  const statusCfg = STATUS_CONFIG[ev.status] ?? { label: ev.status, color: "var(--color-text-muted)" };

  return (
    <div
      className="rounded-md overflow-hidden"
      style={{
        backgroundColor: "var(--color-surface)",
        border: `1px solid ${isOrganizer ? "color-mix(in srgb, var(--color-primary) 30%, transparent)" : "var(--color-border-subtle)"}`,
      }}
    >
      {/* 카드 헤더 — 클릭하면 상세 토글 */}
      <button
        onClick={onToggle}
        className="w-full text-left p-4"
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-bold truncate" style={{ color: "var(--color-text-primary)" }}>
              {ev.title}
            </h3>
            <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>
              {ev.organizerNickname}
              {isOrganizer && (
                <span
                  className="ml-1 text-[10px] px-1 rounded"
                  style={{
                    backgroundColor: "color-mix(in srgb, var(--color-primary) 15%, transparent)",
                    color: "var(--color-primary)",
                  }}
                >
                  주최자
                </span>
              )}
            </p>
          </div>
          <span
            className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold"
            style={{
              backgroundColor: `color-mix(in srgb, ${statusCfg.color} 15%, transparent)`,
              color: statusCfg.color,
            }}
          >
            {statusCfg.label}
          </span>
        </div>

        {/* 정보 행 */}
        <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs" style={{ color: "var(--color-text-muted)" }}>
          <span className="inline-flex items-center gap-0.5">
            <span className="material-symbols-outlined" style={{ fontSize: "13px" }}>calendar_today</span>
            {formatDate(ev.eventDate)}
          </span>
          {ev.startTime && (
            <span className="inline-flex items-center gap-0.5">
              <span className="material-symbols-outlined" style={{ fontSize: "13px" }}>schedule</span>
              {ev.startTime}{ev.endTime ? ` ~ ${ev.endTime}` : ""}
            </span>
          )}
          <span className="inline-flex items-center gap-0.5">
            <span className="material-symbols-outlined" style={{ fontSize: "13px" }}>groups</span>
            {ev.teamsCount}/{ev.maxTeams}팀
          </span>
          <span className="inline-flex items-center gap-0.5">
            <span className="material-symbols-outlined" style={{ fontSize: "13px" }}>person</span>
            {ev.teamSize}인
          </span>
          <span className="inline-flex items-center gap-0.5">
            <span className="material-symbols-outlined" style={{ fontSize: "13px" }}>trophy</span>
            {FORMAT_LABELS[ev.format] ?? ev.format}
          </span>
        </div>

        {/* 팀 등록 진행 바 */}
        <div className="mt-2">
          <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "var(--color-surface-bright)" }}>
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${Math.min((ev.teamsCount / ev.maxTeams) * 100, 100)}%`,
                backgroundColor: ev.teamsCount >= ev.maxTeams ? "var(--color-success)" : "var(--color-primary)",
              }}
            />
          </div>
        </div>

        {/* 토글 표시 */}
        <div className="mt-2 flex justify-center">
          <span
            className="material-symbols-outlined text-base transition-transform"
            style={{
              color: "var(--color-text-disabled)",
              transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
            }}
          >
            expand_more
          </span>
        </div>
      </button>

      {/* 상세 영역 — 펼침 시만 표시 */}
      {isExpanded && (
        <EventDetail
          event={ev}
          courtId={ev.courtInfoId}
          currentUserId={currentUserId}
          isOrganizer={isOrganizer}
          onRefresh={onRefresh}
        />
      )}
    </div>
  );
}

// ═════════════════════════════════════════════════
// 이벤트 상세 (팀 목록 + 팀 등록 + 대진표)
// ═════════════════════════════════════════════════
function EventDetail({
  event: ev,
  courtId,
  currentUserId,
  isOrganizer,
  onRefresh,
}: {
  event: EventData;
  courtId: string;
  currentUserId?: string;
  isOrganizer: boolean;
  onRefresh: () => void;
}) {
  const [showTeamForm, setShowTeamForm] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // 대진표 데이터 (별도 SWR)
  const { data: bracketData, mutate: mutateBracket } = useSWR<{ matches: MatchData[] }>(
    ev.matchesCount > 0 || ev.status !== "recruiting"
      ? `/api/web/courts/${courtId}/events/${ev.id}/bracket`
      : null,
    fetcher,
    { revalidateOnFocus: false }
  );

  const matches = bracketData?.matches ?? [];

  // 주최자: 대진표 생성
  const handleGenerateBracket = async () => {
    if (!confirm("대진표를 생성하시겠습니까? 생성 후에는 팀 등록이 불가합니다.")) return;
    setActionLoading(true);
    setActionError(null);
    try {
      const res = await fetch(`/api/web/courts/${courtId}/events/${ev.id}/bracket`, {
        method: "POST",
      });
      const resData = await res.json();
      if (!res.ok) {
        setActionError(resData.error || "대진표 생성에 실패했습니다");
        return;
      }
      mutateBracket();
      onRefresh(); // 이벤트 상태 갱신 (recruiting → ready)
    } catch {
      setActionError("네트워크 오류가 발생했습니다");
    } finally {
      setActionLoading(false);
    }
  };

  // 주최자: 이벤트 상태 변경
  const handleStatusChange = async (newStatus: string) => {
    setActionLoading(true);
    setActionError(null);
    try {
      const res = await fetch(`/api/web/courts/${courtId}/events/${ev.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const resData = await res.json();
      if (!res.ok) {
        setActionError(resData.error || "상태 변경에 실패했습니다");
        return;
      }
      onRefresh();
    } catch {
      setActionError("네트워크 오류가 발생했습니다");
    } finally {
      setActionLoading(false);
    }
  };

  // 주최자: 이벤트 취소
  const handleCancel = async () => {
    if (!confirm("정말 이 이벤트를 취소하시겠습니까?")) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/web/courts/${courtId}/events/${ev.id}`, {
        method: "DELETE",
      });
      const resData = await res.json();
      if (!res.ok) {
        alert(resData.error || "취소에 실패했습니다");
        return;
      }
      onRefresh();
    } catch {
      alert("네트워크 오류가 발생했습니다");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div
      className="px-4 pb-4"
      style={{ borderTop: "1px solid var(--color-border-subtle)" }}
    >
      {/* 설명/규칙/상금 */}
      {ev.description && (
        <p className="mt-3 text-xs leading-relaxed" style={{ color: "var(--color-text-muted)" }}>
          {ev.description}
        </p>
      )}
      <div className="mt-2 flex flex-wrap gap-2">
        {ev.rules && (
          <span className="inline-flex items-center gap-0.5 text-[11px] rounded px-2 py-0.5"
            style={{ backgroundColor: "var(--color-surface-bright)", color: "var(--color-text-muted)" }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: "12px" }}>gavel</span>
            {ev.rules}
          </span>
        )}
        {ev.prize && (
          <span className="inline-flex items-center gap-0.5 text-[11px] rounded px-2 py-0.5"
            style={{ backgroundColor: "color-mix(in srgb, var(--color-accent) 12%, transparent)", color: "var(--color-accent)" }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: "12px" }}>redeem</span>
            {ev.prize}
          </span>
        )}
      </div>

      {/* 에러 메시지 */}
      {actionError && (
        <p className="mt-2 text-xs" style={{ color: "var(--color-error)" }}>{actionError}</p>
      )}

      {/* 주최자 액션 버튼 */}
      {isOrganizer && ev.status !== "completed" && ev.status !== "cancelled" && (
        <div className="mt-3 flex flex-wrap gap-2">
          {ev.status === "recruiting" && ev.teamsCount >= 2 && matches.length === 0 && (
            <button
              onClick={handleGenerateBracket}
              disabled={actionLoading}
              className="rounded-[4px] px-3 py-1.5 text-xs font-semibold text-white transition-colors disabled:opacity-50"
              style={{ backgroundColor: "var(--color-info)" }}
            >
              {actionLoading ? "생성 중..." : "대진표 생성"}
            </button>
          )}
          {ev.status === "ready" && (
            <button
              onClick={() => handleStatusChange("in_progress")}
              disabled={actionLoading}
              className="rounded-[4px] px-3 py-1.5 text-xs font-semibold text-white transition-colors disabled:opacity-50"
              style={{ backgroundColor: "var(--color-success)" }}
            >
              {actionLoading ? "변경 중..." : "대회 시작"}
            </button>
          )}
          <button
            onClick={handleCancel}
            disabled={actionLoading}
            className="rounded-[4px] px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50"
            style={{
              backgroundColor: "color-mix(in srgb, var(--color-error) 12%, transparent)",
              color: "var(--color-error)",
            }}
          >
            이벤트 취소
          </button>
        </div>
      )}

      {/* 팀 목록 */}
      <div className="mt-4">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-xs font-bold" style={{ color: "var(--color-text-secondary)" }}>
            참가 팀 ({ev.teamsCount}/{ev.maxTeams})
          </h4>
          {/* 팀 등록 버튼: 모집중 + 로그인 + 자리 남았을 때 */}
          {currentUserId && ev.status === "recruiting" && ev.teamsCount < ev.maxTeams && !showTeamForm && (
            <button
              onClick={() => setShowTeamForm(true)}
              className="inline-flex items-center gap-0.5 text-[11px] font-semibold"
              style={{ color: "var(--color-primary)" }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: "13px" }}>add</span>
              팀 등록
            </button>
          )}
        </div>

        {/* 팀 등록 폼 */}
        {showTeamForm && (
          <TeamRegisterForm
            courtId={courtId}
            eventId={ev.id}
            teamSize={ev.teamSize}
            onRegistered={() => { setShowTeamForm(false); onRefresh(); }}
            onCancel={() => setShowTeamForm(false)}
          />
        )}

        {/* 팀 카드 */}
        {ev.teams.length > 0 ? (
          <div className="space-y-2">
            {ev.teams.map((team) => (
              <div
                key={team.id}
                className="rounded-lg p-3"
                style={{ backgroundColor: "var(--color-surface-bright)" }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {team.seed && (
                      <span
                        className="flex h-5 w-5 items-center justify-center rounded text-[10px] font-bold"
                        style={{
                          backgroundColor: "color-mix(in srgb, var(--color-primary) 15%, transparent)",
                          color: "var(--color-primary)",
                        }}
                      >
                        {team.seed}
                      </span>
                    )}
                    <span className="text-xs font-semibold" style={{ color: "var(--color-text-primary)" }}>
                      {team.teamName}
                    </span>
                  </div>
                  <TeamStatusBadge status={team.status} />
                </div>
                {/* 선수 목록 */}
                <div className="mt-1.5 flex items-center gap-1">
                  {team.players.map((p) => (
                    <div
                      key={p.id}
                      className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold"
                      title={`${p.nickname}${p.isCaptain ? " (주장)" : ""}${p.jerseyNumber ? ` #${p.jerseyNumber}` : ""}`}
                      style={{
                        backgroundColor: p.isCaptain
                          ? "color-mix(in srgb, var(--color-accent) 20%, transparent)"
                          : "color-mix(in srgb, var(--color-primary) 15%, transparent)",
                        color: p.isCaptain ? "var(--color-accent)" : "var(--color-primary)",
                        border: p.isCaptain ? "1px solid var(--color-accent)" : "none",
                      }}
                    >
                      {p.nickname?.[0] ?? "?"}
                    </div>
                  ))}
                  <span className="text-[10px] ml-1" style={{ color: "var(--color-text-disabled)" }}>
                    {team.players.length}명
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs" style={{ color: "var(--color-text-disabled)" }}>
            아직 등록된 팀이 없습니다.
          </p>
        )}
      </div>

      {/* 대진표 시각화 */}
      {matches.length > 0 && (
        <BracketView
          matches={matches}
          eventId={ev.id}
          courtId={courtId}
          isOrganizer={isOrganizer}
          eventStatus={ev.status}
          onRefresh={() => { mutateBracket(); onRefresh(); }}
        />
      )}
    </div>
  );
}

// ═════════════════════════════════════════════════
// 팀 등록 폼
// ═════════════════════════════════════════════════
function TeamRegisterForm({
  courtId,
  eventId,
  teamSize,
  onRegistered,
  onCancel,
}: {
  courtId: string;
  eventId: string;
  teamSize: number;
  onRegistered: () => void;
  onCancel: () => void;
}) {
  const [teamName, setTeamName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!teamName.trim()) { setError("팀명을 입력해주세요"); return; }
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/web/courts/${courtId}/events/${eventId}/teams`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          team_name: teamName.trim(),
          // 현재 버전에서는 등록자 혼자 등록 (추후 팀원 초대 기능 추가 가능)
          player_ids: [],
        }),
      });
      const resData = await res.json();
      if (!res.ok) {
        setError(resData.error || "팀 등록에 실패했습니다");
        return;
      }
      onRegistered();
    } catch {
      setError("네트워크 오류가 발생했습니다");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="rounded-lg p-3 mb-2" style={{ backgroundColor: "var(--color-surface-bright)", border: "1px solid var(--color-border-subtle)" }}>
      <div className="flex items-center gap-2 mb-1.5">
        <input
          type="text"
          value={teamName}
          onChange={(e) => setTeamName(e.target.value)}
          placeholder={`팀명 입력 (${teamSize}인팀)`}
          maxLength={100}
          className="flex-1 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none"
          style={{ backgroundColor: "var(--color-surface)", color: "var(--color-text-primary)", border: "1px solid var(--color-border-subtle)" }}
        />
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="rounded-[4px] px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
          style={{ backgroundColor: "var(--color-primary)" }}
        >
          {submitting ? "..." : "등록"}
        </button>
        <button
          onClick={onCancel}
          className="rounded-[4px] px-2 py-1.5 text-xs"
          style={{ color: "var(--color-text-muted)" }}
        >
          취소
        </button>
      </div>
      {error && <p className="text-[11px]" style={{ color: "var(--color-error)" }}>{error}</p>}
      <p className="text-[10px]" style={{ color: "var(--color-text-disabled)" }}>
        등록하면 본인이 주장으로 자동 배정됩니다. 팀원은 추후 초대 가능합니다.
      </p>
    </div>
  );
}

// ═════════════════════════════════════════════════
// 대진표 시각화 (싱글 엘리미네이션)
// ═════════════════════════════════════════════════
function BracketView({
  matches,
  eventId,
  courtId,
  isOrganizer,
  eventStatus,
  onRefresh,
}: {
  matches: MatchData[];
  eventId: string;
  courtId: string;
  isOrganizer: boolean;
  eventStatus: string;
  onRefresh: () => void;
}) {
  const [scoreInput, setScoreInput] = useState<{
    matchId: string;
    homeScore: string;
    awayScore: string;
  } | null>(null);
  const [submittingScore, setSubmittingScore] = useState(false);

  // 라운드별 매치 그룹핑 (round 내림차순 = 1라운드부터)
  const rounds = new Map<number, MatchData[]>();
  for (const m of matches) {
    const arr = rounds.get(m.round) || [];
    arr.push(m);
    rounds.set(m.round, arr);
  }
  // round 키를 내림차순 정렬 (큰 숫자 = 1라운드)
  const sortedRounds = Array.from(rounds.entries()).sort((a, b) => b[0] - a[0]);

  // 라운드 라벨
  const roundLabel = (round: number, maxRound: number): string => {
    if (round === 1) return "결승";
    if (round === 2) return "준결승";
    if (round === maxRound) return "1라운드";
    return `${round}강`;
  };

  const maxRound = sortedRounds.length > 0 ? sortedRounds[0][0] : 1;

  // 점수 입력 제출
  const handleScoreSubmit = async () => {
    if (!scoreInput) return;
    const home = parseInt(scoreInput.homeScore, 10);
    const away = parseInt(scoreInput.awayScore, 10);
    if (isNaN(home) || isNaN(away)) { alert("점수를 숫자로 입력해주세요"); return; }
    if (home === away) { alert("무승부는 불가합니다"); return; }

    setSubmittingScore(true);
    try {
      const res = await fetch(`/api/web/courts/${courtId}/events/${eventId}/bracket`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          match_id: scoreInput.matchId,
          home_score: home,
          away_score: away,
        }),
      });
      const resData = await res.json();
      if (!res.ok) {
        alert(resData.error || "결과 입력에 실패했습니다");
        return;
      }
      setScoreInput(null);
      onRefresh();
    } catch {
      alert("네트워크 오류가 발생했습니다");
    } finally {
      setSubmittingScore(false);
    }
  };

  return (
    <div className="mt-4">
      <h4 className="text-xs font-bold mb-2" style={{ color: "var(--color-text-secondary)" }}>
        <span className="material-symbols-outlined text-xs align-middle mr-0.5" style={{ color: "var(--color-info)" }}>
          account_tree
        </span>
        대진표
      </h4>

      {/* 라운드별 가로 스크롤 */}
      <div className="overflow-x-auto">
        <div className="flex gap-3" style={{ minWidth: `${sortedRounds.length * 160}px` }}>
          {sortedRounds.map(([round, roundMatches]) => (
            <div key={round} className="flex-shrink-0" style={{ width: "150px" }}>
              {/* 라운드 헤더 */}
              <div
                className="text-center text-[10px] font-bold mb-2 py-1 rounded"
                style={{
                  backgroundColor: round === 1
                    ? "color-mix(in srgb, var(--color-accent) 15%, transparent)"
                    : "var(--color-surface-bright)",
                  color: round === 1 ? "var(--color-accent)" : "var(--color-text-muted)",
                }}
              >
                {roundLabel(round, maxRound)}
              </div>

              {/* 매치 카드 */}
              <div className="space-y-2">
                {roundMatches
                  .sort((a, b) => a.matchOrder - b.matchOrder)
                  .map((m) => {
                    const isEditing = scoreInput?.matchId === m.id;
                    const canInput = isOrganizer
                      && m.homeTeam && m.awayTeam
                      && m.status !== "completed"
                      && (eventStatus === "in_progress" || eventStatus === "ready");

                    return (
                      <div
                        key={m.id}
                        className="rounded-lg overflow-hidden"
                        style={{
                          border: `1px solid ${m.status === "completed" ? "var(--color-border-subtle)" : "color-mix(in srgb, var(--color-info) 30%, transparent)"}`,
                        }}
                      >
                        {/* 홈팀 */}
                        <MatchTeamRow
                          teamName={m.homeTeam?.teamName ?? "TBD"}
                          seed={m.homeTeam?.seed ?? null}
                          score={m.homeScore}
                          isWinner={m.winner?.id === m.homeTeam?.id}
                          isEmpty={!m.homeTeam}
                        />
                        {/* 구분선 */}
                        <div style={{ height: "1px", backgroundColor: "var(--color-border-subtle)" }} />
                        {/* 어웨이팀 */}
                        <MatchTeamRow
                          teamName={m.awayTeam?.teamName ?? "TBD"}
                          seed={m.awayTeam?.seed ?? null}
                          score={m.awayScore}
                          isWinner={m.winner?.id === m.awayTeam?.id}
                          isEmpty={!m.awayTeam}
                        />

                        {/* 주최자: 점수 입력 버튼 */}
                        {canInput && !isEditing && (
                          <button
                            onClick={() => setScoreInput({ matchId: m.id, homeScore: "", awayScore: "" })}
                            className="w-full py-1 text-[10px] font-semibold"
                            style={{ backgroundColor: "var(--color-surface-bright)", color: "var(--color-info)" }}
                          >
                            결과 입력
                          </button>
                        )}

                        {/* 점수 입력 폼 */}
                        {isEditing && (
                          <div className="p-2 flex items-center gap-1" style={{ backgroundColor: "var(--color-surface-bright)" }}>
                            <input
                              type="number"
                              value={scoreInput.homeScore}
                              onChange={(e) => setScoreInput({ ...scoreInput, homeScore: e.target.value })}
                              className="w-10 text-center rounded px-1 py-0.5 text-xs"
                              style={{ backgroundColor: "var(--color-surface)", color: "var(--color-text-primary)", border: "1px solid var(--color-border-subtle)" }}
                              placeholder="H"
                            />
                            <span className="text-[10px]" style={{ color: "var(--color-text-disabled)" }}>:</span>
                            <input
                              type="number"
                              value={scoreInput.awayScore}
                              onChange={(e) => setScoreInput({ ...scoreInput, awayScore: e.target.value })}
                              className="w-10 text-center rounded px-1 py-0.5 text-xs"
                              style={{ backgroundColor: "var(--color-surface)", color: "var(--color-text-primary)", border: "1px solid var(--color-border-subtle)" }}
                              placeholder="A"
                            />
                            <button
                              onClick={handleScoreSubmit}
                              disabled={submittingScore}
                              className="rounded px-2 py-0.5 text-[10px] font-bold text-white disabled:opacity-50"
                              style={{ backgroundColor: "var(--color-primary)" }}
                            >
                              {submittingScore ? "..." : "OK"}
                            </button>
                            <button
                              onClick={() => setScoreInput(null)}
                              className="text-[10px]"
                              style={{ color: "var(--color-text-muted)" }}
                            >
                              X
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── 대진표 내 팀 행 ───
function MatchTeamRow({
  teamName,
  seed,
  score,
  isWinner,
  isEmpty,
}: {
  teamName: string;
  seed: number | null;
  score: number | null;
  isWinner: boolean;
  isEmpty: boolean;
}) {
  return (
    <div
      className="flex items-center justify-between px-2 py-1.5"
      style={{
        backgroundColor: isWinner
          ? "color-mix(in srgb, var(--color-success) 8%, var(--color-surface))"
          : "var(--color-surface)",
      }}
    >
      <div className="flex items-center gap-1 min-w-0 flex-1">
        {seed && (
          <span className="text-[9px] font-bold" style={{ color: "var(--color-text-disabled)" }}>
            [{seed}]
          </span>
        )}
        <span
          className="text-[11px] truncate"
          style={{
            color: isEmpty ? "var(--color-text-disabled)" : "var(--color-text-primary)",
            fontWeight: isWinner ? 700 : 400,
            fontStyle: isEmpty ? "italic" : "normal",
          }}
        >
          {teamName}
        </span>
      </div>
      {score != null && (
        <span
          className="text-xs font-bold ml-1"
          style={{ color: isWinner ? "var(--color-success)" : "var(--color-text-muted)" }}
        >
          {score}
        </span>
      )}
    </div>
  );
}

// ─── 팀 상태 뱃지 ───
function TeamStatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; color: string }> = {
    registered: { label: "등록", color: "var(--color-text-muted)" },
    confirmed: { label: "확정", color: "var(--color-info)" },
    eliminated: { label: "탈락", color: "var(--color-error)" },
    winner: { label: "우승", color: "var(--color-accent)" },
  };
  const { label, color } = config[status] ?? { label: status, color: "var(--color-text-muted)" };
  return (
    <span
      className="text-[9px] font-semibold px-1.5 py-0.5 rounded"
      style={{
        backgroundColor: `color-mix(in srgb, ${color} 12%, transparent)`,
        color,
      }}
    >
      {label}
    </span>
  );
}

// ─── 날짜 포맷: 2026-03-30 → 3/30(월) ───
function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  const days = ["일", "월", "화", "수", "목", "금", "토"];
  return `${d.getMonth() + 1}/${d.getDate()}(${days[d.getDay()]})`;
}
