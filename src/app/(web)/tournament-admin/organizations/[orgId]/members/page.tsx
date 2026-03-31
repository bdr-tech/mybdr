"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

/* ============================================================
 * 멤버 관리 — /tournament-admin/organizations/[orgId]/members
 *
 * 멤버 목록 + 이메일로 초대 + 멤버 제거 기능.
 * owner/admin만 초대/제거 가능.
 * ============================================================ */

interface Member {
  id: string;
  userId: string;
  nickname: string | null;
  email: string;
  profileImageUrl: string | null;
  role: string;
}

export default function OrganizationMembersPage() {
  const params = useParams();
  const orgId = params.orgId as string;

  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("member");
  const [inviting, setInviting] = useState(false);
  const [message, setMessage] = useState("");

  // 멤버 목록 로드
  const loadMembers = () => {
    fetch(`/api/web/organizations/${orgId}/members`)
      .then((r) => r.json())
      .then((data) => {
        setMembers(
          (data.members || []).map((m: Record<string, unknown>) => ({
            id: m.id,
            userId: m.user_id,
            nickname: m.nickname,
            email: m.email,
            profileImageUrl: m.profile_image_url,
            role: m.role,
          }))
        );
      })
      .catch(() => setMembers([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadMembers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgId]);

  // 멤버 초대
  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;
    setInviting(true);
    setMessage("");

    try {
      const res = await fetch(`/api/web/organizations/${orgId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail.trim(), role: inviteRole }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage(data.message || "초대 완료");
        setInviteEmail("");
        loadMembers(); // 목록 새로고침
      } else {
        setMessage(data.error || "초대 실패");
      }
    } catch {
      setMessage("네트워크 오류");
    } finally {
      setInviting(false);
    }
  };

  // 멤버 제거
  const handleRemove = async (memberId: string, nickname: string | null) => {
    if (!confirm(`${nickname || "이 멤버"}를 제거하시겠습니까?`)) return;

    try {
      const res = await fetch(
        `/api/web/organizations/${orgId}/members/${memberId}`,
        { method: "DELETE" }
      );
      const data = await res.json();
      if (res.ok) {
        // 목록에서 즉시 제거
        setMembers((prev) => prev.filter((m) => m.id !== memberId));
      } else {
        setMessage(data.error || "제거 실패");
      }
    } catch {
      setMessage("네트워크 오류");
    }
  };

  // 역할 한국어 라벨
  const roleLabel = (role: string) => {
    if (role === "owner") return "소유자";
    if (role === "admin") return "관리자";
    return "멤버";
  };

  const roleColor = (role: string) => {
    if (role === "owner") return "var(--color-primary)";
    if (role === "admin") return "var(--color-info)";
    return "var(--color-text-muted)";
  };

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 text-xl font-bold text-[var(--color-text-primary)]">
        멤버 관리
      </h1>

      {/* 메시지 */}
      {message && (
        <div className="mb-4 rounded border border-[var(--color-border)] bg-[var(--color-surface)] p-3 text-sm text-[var(--color-text-primary)]">
          {message}
        </div>
      )}

      {/* 초대 폼 */}
      <div className="mb-6 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
        <h2 className="mb-3 text-sm font-medium text-[var(--color-text-primary)]">
          <span className="material-symbols-outlined mr-1 text-base align-middle">
            person_add
          </span>
          멤버 초대
        </h2>
        <div className="flex gap-2">
          <input
            type="email"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder="이메일 주소"
            className="flex-1 rounded border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-2 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-primary)]"
            onKeyDown={(e) => e.key === "Enter" && handleInvite()}
          />
          <select
            value={inviteRole}
            onChange={(e) => setInviteRole(e.target.value)}
            className="rounded border border-[var(--color-border)] bg-[var(--color-card)] px-2 py-2 text-sm text-[var(--color-text-primary)]"
          >
            <option value="member">멤버</option>
            <option value="admin">관리자</option>
          </select>
          <button
            onClick={handleInvite}
            disabled={inviting}
            className="rounded bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
          >
            {inviting ? "..." : "초대"}
          </button>
        </div>
      </div>

      {/* 로딩 */}
      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-16 animate-pulse rounded-lg bg-[var(--color-surface)]"
            />
          ))}
        </div>
      )}

      {/* 멤버 목록 */}
      {!loading && (
        <div className="space-y-2">
          {members.map((m) => (
            <div
              key={m.id}
              className="flex items-center justify-between rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4"
            >
              <div className="flex items-center gap-3">
                {/* 프로필 이미지 */}
                {m.profileImageUrl ? (
                  <img
                    src={m.profileImageUrl}
                    alt={m.nickname || ""}
                    className="h-9 w-9 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-border)] text-xs font-medium text-[var(--color-text-muted)]">
                    {(m.nickname || m.email).charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium text-[var(--color-text-primary)]">
                    {m.nickname || "이름 없음"}
                  </p>
                  <p className="text-xs text-[var(--color-text-muted)]">
                    {m.email}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {/* 역할 뱃지 */}
                <span
                  className="rounded-full px-2 py-0.5 text-xs font-medium"
                  style={{
                    color: roleColor(m.role),
                    backgroundColor: `color-mix(in srgb, ${roleColor(m.role)} 12%, transparent)`,
                  }}
                >
                  {roleLabel(m.role)}
                </span>
                {/* owner는 제거 불가 */}
                {m.role !== "owner" && (
                  <button
                    onClick={() => handleRemove(m.id, m.nickname)}
                    className="text-[var(--color-text-muted)] hover:text-[var(--color-primary)]"
                    title="멤버 제거"
                  >
                    <span className="material-symbols-outlined text-lg">
                      close
                    </span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && members.length === 0 && (
        <p className="py-10 text-center text-sm text-[var(--color-text-muted)]">
          멤버가 없습니다.
        </p>
      )}
    </div>
  );
}
