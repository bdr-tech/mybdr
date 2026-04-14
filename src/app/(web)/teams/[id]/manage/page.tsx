"use client";

import { useEffect, useState, useCallback, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

// ─────────────────────────────────────────────────
// 타입 정의
// ─────────────────────────────────────────────────

const ROLE_OPTIONS = [
  { value: "director", label: "감독" },
  { value: "coach", label: "코치" },
  { value: "captain", label: "팀장" },
  { value: "manager", label: "매니저" },
  { value: "treasurer", label: "총무" },
  { value: "member", label: "멤버" },
];

interface TeamMember {
  id: string;
  user_id: string;
  nickname: string;
  position: string | null;
  profile_image: string | null;
  role: string;
}

interface JoinRequest {
  id: string;
  user_id: string;
  user: {
    id: string;
    nickname: string | null;
    name: string | null;
    position: string | null;
    city: string | null;
    district: string | null;
    profile_image: string | null;
  } | null;
  message: string | null;
  preferred_position: string | null;
  created_at: string;
}

interface TeamEditData {
  id: string;
  name: string;
  description: string | null;
  city: string | null;
  district: string | null;
  home_court: string | null;
  founded_year: number | null;
  primary_color: string | null;
  secondary_color: string | null;
  is_public: boolean | null;
  accepting_members: boolean | null;
  max_members: number | null;
  status: string | null;
}

// 현재 활성 탭: 멤버관리 / 팀설정
type ManageTab = "members" | "settings";

export default function TeamManagePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  // 탭 상태
  const [tab, setTab] = useState<ManageTab>("members");

  // ─── 멤버 관리 상태 ───
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [requests, setRequests] = useState<JoinRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState<string | null>(null);
  const [roleChanging, setRoleChanging] = useState<string | null>(null);

  // ─── 팀 설정 상태 ───
  const [teamData, setTeamData] = useState<TeamEditData | null>(null);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showDissolve, setShowDissolve] = useState(false);
  const [dissolving, setDissolving] = useState(false);

  // 팀 수정 폼 필드
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [city, setCity] = useState("");
  const [district, setDistrict] = useState("");
  const [homeCourt, setHomeCourt] = useState("");
  const [foundedYear, setFoundedYear] = useState<number | "">("");
  const [primaryColor, setPrimaryColor] = useState("#FFFFFF");
  const [secondaryColor, setSecondaryColor] = useState("#000000");
  const [isPublic, setIsPublic] = useState(true);
  const [acceptingMembers, setAcceptingMembers] = useState(true);
  const [maxMembers, setMaxMembers] = useState(15);

  // ─── 멤버 관리: 가입 신청 목록 조회 ───
  const fetchRequests = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/web/teams/${id}/members`);
      if (res.status === 403) {
        setError("팀장만 접근할 수 있습니다.");
        return;
      }
      if (!res.ok) throw new Error("조회 실패");
      const data = await res.json();
      setMembers(data.data?.members ?? data.members ?? []);
      setRequests(data.data?.requests ?? data.data ?? []);
    } catch {
      setError("가입신청 목록을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  // ─── 팀 설정: 팀 정보 로드 ───
  const fetchTeamData = useCallback(async () => {
    setSettingsLoading(true);
    try {
      const res = await fetch(`/api/web/teams/${id}`);
      if (res.status === 403) {
        setError("팀장만 접근할 수 있습니다.");
        return;
      }
      if (!res.ok) throw new Error();
      const json = await res.json();
      const data: TeamEditData = json.data;
      setTeamData(data);

      // 폼 초기값 설정
      setName(data.name ?? "");
      setDescription(data.description ?? "");
      setCity(data.city ?? "");
      setDistrict(data.district ?? "");
      setHomeCourt(data.home_court ?? "");
      setFoundedYear(data.founded_year ?? "");
      setPrimaryColor(data.primary_color ?? "#FFFFFF");
      setSecondaryColor(data.secondary_color ?? "#000000");
      setIsPublic(data.is_public ?? true);
      setAcceptingMembers(data.accepting_members ?? true);
      setMaxMembers(data.max_members ?? 15);
    } catch {
      // 설정 로드 실패는 무시 (멤버 관리만 사용 가능)
    } finally {
      setSettingsLoading(false);
    }
  }, [id]);

  // 초기 로드: 탭에 따라 다르게
  useEffect(() => { fetchRequests(); }, [fetchRequests]);
  useEffect(() => {
    if (tab === "settings" && !teamData) {
      fetchTeamData();
    }
  }, [tab, teamData, fetchTeamData]);

  // ─── 멤버 관리: 승인/거부 핸들러 ───
  async function handleAction(requestId: string, action: "approve" | "reject") {
    setProcessing(requestId);
    try {
      const res = await fetch(`/api/web/teams/${id}/members`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId, action }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.message ?? "처리 중 오류가 발생했습니다.");
        return;
      }
      setRequests((prev) => prev.filter((r) => r.id !== requestId));
    } catch {
      alert("네트워크 오류가 발생했습니다.");
    } finally {
      setProcessing(null);
    }
  }

  // ─── 멤버 관리: 역할 변경 핸들러 ───
  async function handleRoleChange(memberId: string, newRole: string) {
    setRoleChanging(memberId);
    try {
      const res = await fetch(`/api/web/teams/${id}/members`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId, role: newRole }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.error ?? data.message ?? "역할 변경 실패");
        return;
      }
      setMembers((prev) => prev.map((m) => m.id === memberId ? { ...m, role: newRole } : m));
    } catch {
      alert("네트워크 오류");
    } finally {
      setRoleChanging(null);
    }
  }

  // ─── 팀 설정: 수정 제출 핸들러 ───
  async function handleSaveSettings(e: React.FormEvent) {
    e.preventDefault();
    if (name.trim().length < 2) {
      alert("팀명은 2자 이상 입력해주세요.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/web/teams/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
          city: city.trim() || null,
          district: district.trim() || null,
          home_court: homeCourt.trim() || null,
          founded_year: foundedYear || null,
          primary_color: primaryColor,
          secondary_color: secondaryColor,
          is_public: isPublic,
          accepting_members: acceptingMembers,
          max_members: maxMembers,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.message ?? "수정 중 오류가 발생했습니다.");
        return;
      }
      alert("팀 정보가 수정되었습니다.");
      router.refresh();
    } catch {
      alert("네트워크 오류가 발생했습니다.");
    } finally {
      setSaving(false);
    }
  }

  // ─── 팀 해산 핸들러 ───
  async function handleDissolve() {
    setDissolving(true);
    try {
      const res = await fetch(`/api/web/teams/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.message ?? "해산 처리 중 오류가 발생했습니다.");
        return;
      }
      // 해산 성공 → 팀 목록으로 이동
      router.push("/teams");
      router.refresh();
    } catch {
      alert("네트워크 오류가 발생했습니다.");
    } finally {
      setDissolving(false);
      setShowDissolve(false);
    }
  }

  return (
    <div>
      {/* 헤더: 제목 + 팀 상세 링크 */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold sm:text-2xl">팀 관리</h1>
          <p className="mt-0.5 text-sm text-[var(--color-text-muted)]">멤버 관리 및 팀 설정</p>
        </div>
        <Link
          href={`/teams/${id}`}
          className="rounded-full border border-[var(--color-border)] px-4 py-2 text-sm text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-surface-bright)]"
        >
          팀 상세로
        </Link>
      </div>

      {/* 탭 네비게이션 */}
      <div className="mb-6 flex gap-1 rounded-lg bg-[var(--color-surface)] p-1">
        <button
          onClick={() => setTab("members")}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-2 sm:px-4 sm:py-2.5 text-xs sm:text-sm font-medium whitespace-nowrap transition-colors ${
            tab === "members"
              ? "bg-[var(--color-card)] text-[var(--color-text-primary)] shadow-sm"
              : "text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]"
          }`}
        >
          {/* 모바일에서 아이콘 숨김 — 공간 절약 */}
          <span className="material-symbols-outlined text-base hidden sm:inline">group</span>
          멤버 관리
        </button>
        <button
          onClick={() => setTab("settings")}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-2 sm:px-4 sm:py-2.5 text-xs sm:text-sm font-medium whitespace-nowrap transition-colors ${
            tab === "settings"
              ? "bg-[var(--color-card)] text-[var(--color-text-primary)] shadow-sm"
              : "text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]"
          }`}
        >
          {/* 모바일에서 아이콘 숨김 — 공간 절약 */}
          <span className="material-symbols-outlined text-base hidden sm:inline">settings</span>
          팀 설정
        </button>
      </div>

      {/* ═══════════ 멤버 관리 탭 ═══════════ */}
      {tab === "members" && (
        <>
          {/* ─── 현재 멤버 목록 + 역할 변경 ─── */}
          {!loading && members.length > 0 && (
            <div className="mb-6">
              <h3 className="mb-3 text-sm font-semibold text-[var(--color-text-secondary)]">
                멤버 ({members.length}명)
              </h3>
              <div className="space-y-2">
                {members.map((m) => (
                  <div key={m.id} className="flex items-center gap-3 rounded-lg bg-[var(--color-card)] p-3">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[var(--color-surface-bright)] text-sm font-bold text-[var(--color-accent)]">
                      {m.nickname.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-[var(--color-text-primary)] truncate">{m.nickname}</p>
                      {m.position && <p className="text-xs text-[var(--color-text-muted)]">{m.position}</p>}
                    </div>
                    <select
                      value={m.role}
                      onChange={(e) => handleRoleChange(m.id, e.target.value)}
                      disabled={roleChanging === m.id}
                      className="rounded border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-1.5 text-xs sm:text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-primary)]"
                    >
                      {ROLE_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ─── 가입 신청 ─── */}
          {!loading && requests.length > 0 && (
            <h3 className="mb-3 text-sm font-semibold text-[var(--color-text-secondary)]">
              가입 신청 ({requests.length}건)
            </h3>
          )}

          {loading && (
            <div className="py-12 text-center text-sm text-[var(--color-text-secondary)]">불러오는 중...</div>
          )}

          {!loading && error && (
            <div className="rounded-lg bg-red-50 dark:bg-red-900/20 px-5 py-4 text-sm text-red-600 dark:text-red-400">{error}</div>
          )}

          {!loading && !error && requests.length === 0 && (
            <div className="rounded-lg bg-[var(--color-card)] py-16 text-center">
              <span className="material-symbols-outlined mb-2 text-4xl text-[var(--color-text-muted)]">
                person_search
              </span>
              <p className="text-sm text-[var(--color-text-secondary)]">대기 중인 가입 신청이 없습니다.</p>
            </div>
          )}

          {!loading && !error && requests.length > 0 && (
            <div className="space-y-3">
              {requests.map((req) => {
                const displayName = req.user?.nickname ?? req.user?.name ?? "신청자";
                const location = [req.user?.city, req.user?.district].filter(Boolean).join(" ");
                const isProcessing = processing === req.id;

                return (
                  <div
                    key={req.id}
                    className="rounded-lg bg-[var(--color-card)] p-5"
                  >
                    <div className="flex items-start gap-4">
                      {/* 아바타: 이니셜 */}
                      <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-[var(--color-surface-bright)] text-lg font-bold text-[var(--color-accent)]">
                        {displayName.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold text-[var(--color-text-primary)]">{displayName}</p>
                          {req.user?.position && (
                            <span className="rounded-full bg-[var(--color-surface-bright)] px-2 py-0.5 text-xs text-[var(--color-accent)]">
                              {req.user.position}
                            </span>
                          )}
                        </div>
                        {location && (
                          <p className="mt-0.5 flex items-center gap-1 text-xs text-[var(--color-text-secondary)]">
                            <span className="material-symbols-outlined text-xs">location_on</span>
                            {location}
                          </p>
                        )}
                        {req.message && (
                          <p className="mt-2 rounded-md bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text-muted)]">
                            {req.message}
                          </p>
                        )}
                        <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
                          신청일: {new Date(req.created_at).toLocaleDateString("ko-KR", { timeZone: "Asia/Seoul" })}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 flex gap-2">
                      <Button
                        className="flex-1"
                        disabled={isProcessing}
                        onClick={() => handleAction(req.id, "approve")}
                      >
                        {isProcessing ? "처리 중..." : "승인"}
                      </Button>
                      <Button
                        variant="secondary"
                        className="flex-1"
                        disabled={isProcessing}
                        onClick={() => handleAction(req.id, "reject")}
                      >
                        거부
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ═══════════ 팀 설정 탭 ═══════════ */}
      {tab === "settings" && (
        <>
          {settingsLoading && (
            <div className="py-12 text-center text-sm text-[var(--color-text-secondary)]">불러오는 중...</div>
          )}

          {!settingsLoading && teamData && (
            <form onSubmit={handleSaveSettings} className="space-y-6">
              {/* 기본 정보 */}
              <div className="rounded-lg bg-[var(--color-card)] p-5">
                <h3 className="mb-4 flex items-center gap-1.5 text-base font-semibold text-[var(--color-text-primary)]">
                  <span className="material-symbols-outlined text-base">badge</span>
                  기본 정보
                </h3>
                <div className="space-y-4">
                  {/* 팀명 */}
                  <div>
                    <label className="mb-1 block text-sm font-medium text-[var(--color-text-secondary)]">팀명 *</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      maxLength={30}
                      required
                      className="w-full rounded border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-primary)]"
                    />
                  </div>
                  {/* 팀 소개 */}
                  <div>
                    <label className="mb-1 block text-sm font-medium text-[var(--color-text-secondary)]">팀 소개</label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={3}
                      className="w-full rounded border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-primary)]"
                    />
                  </div>
                  {/* 도시 / 지역구 */}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-sm font-medium text-[var(--color-text-secondary)]">도시</label>
                      <input
                        type="text"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="서울"
                        className="w-full rounded border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-primary)]"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-[var(--color-text-secondary)]">지역구</label>
                      <input
                        type="text"
                        value={district}
                        onChange={(e) => setDistrict(e.target.value)}
                        placeholder="강남구"
                        className="w-full rounded border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-primary)]"
                      />
                    </div>
                  </div>
                  {/* 홈코트 */}
                  <div>
                    <label className="mb-1 block text-sm font-medium text-[var(--color-text-secondary)]">홈코트</label>
                    <input
                      type="text"
                      value={homeCourt}
                      onChange={(e) => setHomeCourt(e.target.value)}
                      placeholder="OO체육관"
                      className="w-full rounded border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-primary)]"
                    />
                  </div>
                  {/* 창단연도 */}
                  <div>
                    <label className="mb-1 block text-sm font-medium text-[var(--color-text-secondary)]">창단연도</label>
                    <input
                      type="number"
                      value={foundedYear}
                      onChange={(e) => setFoundedYear(e.target.value ? Number(e.target.value) : "")}
                      min={1900}
                      max={new Date().getFullYear()}
                      placeholder="2024"
                      className="w-full rounded border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-primary)]"
                    />
                  </div>
                </div>
              </div>

              {/* 팀 색상 */}
              <div className="rounded-lg bg-[var(--color-card)] p-5">
                <h3 className="mb-4 flex items-center gap-1.5 text-base font-semibold text-[var(--color-text-primary)]">
                  <span className="material-symbols-outlined text-base">palette</span>
                  팀 색상
                </h3>
                <div className="grid gap-3 sm:gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-[var(--color-text-secondary)]">주 색상</label>
                    <div className="flex items-center gap-2 sm:gap-3">
                      <input
                        type="color"
                        value={primaryColor}
                        onChange={(e) => setPrimaryColor(e.target.value)}
                        className="h-8 w-8 sm:h-10 sm:w-10 cursor-pointer rounded border border-[var(--color-border)]"
                      />
                      <input
                        type="text"
                        value={primaryColor}
                        onChange={(e) => setPrimaryColor(e.target.value)}
                        maxLength={7}
                        className="flex-1 rounded border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-primary)]"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-[var(--color-text-secondary)]">보조 색상</label>
                    <div className="flex items-center gap-2 sm:gap-3">
                      <input
                        type="color"
                        value={secondaryColor}
                        onChange={(e) => setSecondaryColor(e.target.value)}
                        className="h-8 w-8 sm:h-10 sm:w-10 cursor-pointer rounded border border-[var(--color-border)]"
                      />
                      <input
                        type="text"
                        value={secondaryColor}
                        onChange={(e) => setSecondaryColor(e.target.value)}
                        maxLength={7}
                        className="flex-1 rounded border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-primary)]"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* 운영 설정 */}
              <div className="rounded-lg bg-[var(--color-card)] p-5">
                <h3 className="mb-4 flex items-center gap-1.5 text-base font-semibold text-[var(--color-text-primary)]">
                  <span className="material-symbols-outlined text-base">tune</span>
                  운영 설정
                </h3>
                <div className="space-y-4">
                  {/* 공개 여부 토글 */}
                  <label className="flex items-center justify-between">
                    <span className="text-sm text-[var(--color-text-secondary)]">팀 공개</span>
                    <input
                      type="checkbox"
                      checked={isPublic}
                      onChange={(e) => setIsPublic(e.target.checked)}
                      className="h-5 w-5 rounded accent-[var(--color-primary)]"
                    />
                  </label>
                  {/* 멤버 모집 토글 */}
                  <label className="flex items-center justify-between">
                    <span className="text-sm text-[var(--color-text-secondary)]">멤버 모집중</span>
                    <input
                      type="checkbox"
                      checked={acceptingMembers}
                      onChange={(e) => setAcceptingMembers(e.target.checked)}
                      className="h-5 w-5 rounded accent-[var(--color-primary)]"
                    />
                  </label>
                  {/* 최대 인원 */}
                  <div>
                    <label className="mb-1 block text-sm font-medium text-[var(--color-text-secondary)]">최대 멤버 수</label>
                    <input
                      type="number"
                      value={maxMembers}
                      onChange={(e) => setMaxMembers(Number(e.target.value))}
                      min={2}
                      max={50}
                      className="w-full rounded border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-primary)]"
                    />
                  </div>
                </div>
              </div>

              {/* 저장 버튼 */}
              <Button type="submit" disabled={saving} className="w-full">
                {saving ? "저장 중..." : "설정 저장"}
              </Button>

              {/* ─── 위험 영역: 팀 해산 ─── */}
              <div className="mt-8 rounded-lg border border-red-500/30 bg-red-500/5 p-5">
                <h3 className="mb-2 flex items-center gap-1.5 text-base font-semibold text-red-500">
                  <span className="material-symbols-outlined text-base">warning</span>
                  위험 영역
                </h3>
                <p className="mb-4 text-sm text-[var(--color-text-muted)]">
                  팀을 해산하면 되돌릴 수 없습니다. 모든 멤버가 팀에서 제외되며, 팀 정보는 비활성화됩니다.
                </p>
                <button
                  type="button"
                  onClick={() => setShowDissolve(true)}
                  className="rounded border border-red-500 px-4 py-2.5 text-sm font-medium text-red-500 transition-colors hover:bg-red-500 hover:text-white"
                >
                  팀 해산
                </button>
              </div>
            </form>
          )}
        </>
      )}

      {/* ═══════════ 팀 해산 확인 모달 ═══════════ */}
      {showDissolve && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => !dissolving && setShowDissolve(false)}
        >
          <div
            className="mx-4 w-full max-w-sm rounded-lg bg-[var(--color-card)] p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex justify-center">
              <span className="material-symbols-outlined text-4xl text-red-500">
                delete_forever
              </span>
            </div>
            <h3 className="mb-2 text-center text-lg font-bold text-[var(--color-text-primary)]">
              정말로 팀을 해산하시겠습니까?
            </h3>
            <p className="mb-6 text-center text-sm text-[var(--color-text-muted)]">
              이 작업은 되돌릴 수 없습니다. 팀의 모든 활동이 중단되고 멤버 모집이 비활성화됩니다.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDissolve(false)}
                disabled={dissolving}
                className="flex-1 rounded border border-[var(--color-border)] px-4 py-2.5 text-sm font-medium text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-elevated)]"
              >
                취소
              </button>
              <button
                onClick={handleDissolve}
                disabled={dissolving}
                className="flex-1 rounded bg-red-500 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-red-600 disabled:opacity-50"
              >
                {dissolving ? "해산 처리중..." : "팀 해산"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
