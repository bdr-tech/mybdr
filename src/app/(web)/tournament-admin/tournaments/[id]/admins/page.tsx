"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type Admin = {
  id: string;
  userId: string;
  role: string;
  createdAt: string;
  user: {
    id: string;
    nickname: string | null;
    email: string;
    profile_image_url: string | null;
  };
};

const ROLE_LABEL: Record<string, string> = {
  owner: "주최자",
  admin: "관리자",
  staff: "스태프",
  scorer: "기록원",
};

export default function TournamentAdminsPage() {
  const { id } = useParams<{ id: string }>();
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("admin");
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/web/tournaments/${id}/admins`);
      if (res.ok) setAdmins(await res.json());
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const addAdmin = async () => {
    if (!email.trim()) return;
    setAdding(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch(`/api/web/tournaments/${id}/admins`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), role }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "추가 실패");
      setEmail("");
      setSuccess(`${data.user?.nickname ?? email} 님을 추가했습니다.`);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "오류 발생");
    } finally {
      setAdding(false);
    }
  };

  const removeAdmin = async (adminId: string, name: string) => {
    if (!confirm(`${name} 님의 관리자 권한을 제거하시겠습니까?`)) return;
    try {
      await fetch(`/api/web/tournaments/${id}/admins/${adminId}`, { method: "DELETE" });
      await load();
    } catch { /* ignore */ }
  };

  if (loading)
    return <div className="flex h-40 items-center justify-center text-[var(--color-text-muted)]">불러오는 중...</div>;

  return (
    <div>
      <div className="mb-6">
        <Link href={`/tournament-admin/tournaments/${id}`} className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]">← 대회 관리</Link>
        <h1 className="mt-1 text-xl font-bold sm:text-2xl">관리자 관리</h1>
      </div>

      {/* 추가 폼 */}
      <Card className="mb-6">
        <h2 className="mb-4 text-base font-semibold">관리자 추가</h2>
        {/* 하드코딩 색상 → CSS 변수 토큰 (시맨틱 메시지: 실패/성공) */}
        {error && <p className="mb-3 text-sm text-[var(--color-error)]">{error}</p>}
        {success && <p className="mb-3 text-sm text-[var(--color-success)]">{success}</p>}
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="이메일 주소"
            className="flex-1 rounded-[16px] border-none bg-[var(--color-border)] px-4 py-3 text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/50"
            onKeyDown={(e) => e.key === "Enter" && addAdmin()}
          />
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="rounded-[16px] border-none bg-[var(--color-border)] px-4 py-3 text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/50"
          >
            <option value="admin">관리자</option>
            <option value="staff">스태프</option>
            <option value="scorer">기록원</option>
          </select>
          <Button onClick={addAdmin} disabled={adding || !email.trim()}>
            {adding ? "추가 중..." : "추가"}
          </Button>
        </div>
      </Card>

      {/* 관리자 목록 */}
      {admins.length === 0 ? (
        <Card className="py-12 text-center text-[var(--color-text-muted)]">
          <div className="mb-2 text-3xl">👥</div>
          추가된 관리자가 없습니다.
        </Card>
      ) : (
        <div className="space-y-2">
          {admins.map((admin) => (
            <Card key={admin.id}>
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-elevated)] text-sm font-bold text-[var(--color-primary)]">
                    {(admin.user.nickname ?? admin.user.email)[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium">{admin.user.nickname ?? "이름 없음"}</p>
                    <p className="text-xs text-[var(--color-text-muted)]">{admin.user.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="rounded-full bg-[var(--color-elevated)] px-3 py-1 text-xs text-[var(--color-text-muted)]">
                    {ROLE_LABEL[admin.role] ?? admin.role}
                  </span>
                  <button
                    onClick={() => removeAdmin(admin.id, admin.user.nickname ?? admin.user.email)}
                    className="text-xs text-[var(--color-error)] hover:underline"
                  >
                    제거
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
