"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface SerializedUser {
  id: string;
  email: string;
  nickname: string | null;
  name: string | null;
  phone: string | null;
  membershipType: number;
  isAdmin: boolean | null;
  status: string | null;
  provider: string | null;
  uid: string | null;
  city: string | null;
  district: string | null;
  position: string | null;
  height: number | null;
  weight: number | null;
  bio: string | null;
  birth_date: string | null;
  profile_image_url: string | null;
  evaluation_rating: number | null;
  total_games_hosted: number | null;
  total_games_participated: number | null;
  last_login_at: string | null;
  createdAt: string;
  updatedAt: string;
}

const ROLE_MAP: Record<number, { label: string; variant: "default" | "success" | "error" | "info" | "warning" }> = {
  0: { label: "일반유저", variant: "default" },
  1: { label: "픽업호스트", variant: "info" },
  2: { label: "팀장", variant: "warning" },
  3: { label: "대회관리자", variant: "info" },
};

interface Props {
  users: SerializedUser[];
  updateUserRoleAction: (formData: FormData) => Promise<void>;
  updateUserStatusAction: (formData: FormData) => Promise<void>;
  toggleUserAdminAction: (formData: FormData) => Promise<void>;
  forceWithdrawAction: (formData: FormData) => Promise<void>;
  deleteAction: (formData: FormData) => Promise<void>;
}

export function AdminUsersTable({ users, updateUserRoleAction, updateUserStatusAction, toggleUserAdminAction, forceWithdrawAction, deleteAction }: Props) {
  const [selectedUser, setSelectedUser] = useState<SerializedUser | null>(null);
  const [tab, setTab] = useState<"info" | "edit">("info");
  const [confirm, setConfirm] = useState<"withdraw" | "delete" | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    document.body.style.overflow = selectedUser ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [selectedUser]);

  const closeModal = () => { setSelectedUser(null); setTab("info"); setConfirm(null); };

  const runAction = async (action: (fd: FormData) => Promise<void>, data: Record<string, string>) => {
    setPending(true);
    const fd = new FormData();
    for (const [k, v] of Object.entries(data)) fd.set(k, v);
    await action(fd);
    setPending(false);
    closeModal();
  };

  const fmt = (iso: string | null) => iso ? new Date(iso).toLocaleDateString("ko-KR") : "-";
  const fmtFull = (iso: string | null) => iso ? new Date(iso).toLocaleString("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }) : "-";

  const statusBadge = (s: string | null) => {
    if (s === "active") return <Badge variant="success">활성</Badge>;
    if (s === "withdrawn") return <Badge variant="default">탈퇴</Badge>;
    return <Badge variant="error">정지</Badge>;
  };

  return (
    <>
      {/* 테이블 */}
      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-muted)]">
              <tr>
                <th className="px-5 py-3.5 font-medium">닉네임</th>
                <th className="px-5 py-3.5 font-medium">이메일</th>
                <th className="px-5 py-3.5 font-medium">역할</th>
                <th className="px-5 py-3.5 font-medium text-center">관리자</th>
                <th className="px-5 py-3.5 font-medium text-center">상태</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => {
                const role = ROLE_MAP[user.membershipType] ?? { label: String(user.membershipType), variant: "default" as const };
                return (
                  <tr
                    key={user.id}
                    onClick={() => { setSelectedUser(user); setTab("info"); setConfirm(null); }}
                    className={`cursor-pointer border-b border-[var(--color-border-subtle)] transition-all hover:bg-[var(--color-elevated)]/60 active:bg-[var(--color-elevated)] ${user.isAdmin ? "bg-[var(--color-error)]/[0.02]" : ""}`}
                  >
                    <td className="px-5 py-3 font-medium">
                      {user.isAdmin && <span className="mr-1 text-[var(--color-error)]">★</span>}
                      {user.nickname ?? "-"}
                    </td>
                    <td className="px-5 py-3 text-[var(--color-text-muted)] max-w-[200px] truncate">{user.email}</td>
                    <td className="px-5 py-3"><Badge variant={role.variant}>{role.label}</Badge></td>
                    <td className="px-5 py-3 text-center">
                      {user.isAdmin ? <span className="text-[var(--color-error)] text-xs font-semibold">ON</span> : <span className="text-[var(--color-text-muted)]">-</span>}
                    </td>
                    <td className="px-5 py-3 text-center">{statusBadge(user.status)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* 상세 모달 */}
      {selectedUser && (() => {
        const u = selectedUser;
        const role = ROLE_MAP[u.membershipType] ?? { label: String(u.membershipType), variant: "default" as const };
        return (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm" onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}>
            <div className="w-full max-w-md max-h-[90vh] overflow-hidden rounded-t-[20px] sm:rounded-[20px] bg-[var(--color-card)] shadow-[0_-8px_40px_rgba(0,0,0,0.2)] sm:shadow-[0_8px_40px_rgba(0,0,0,0.2)] flex flex-col animate-slide-up sm:animate-fade-in">

              {/* 프로필 헤더 */}
              <div className="relative bg-gradient-to-br from-[var(--color-accent)] to-[var(--color-accent-hover)] px-6 pt-5 pb-4">
                <button onClick={closeModal} className="absolute right-4 top-4 flex h-7 w-7 items-center justify-center rounded-full bg-white/20 text-white/80 hover:bg-white/30">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12" /></svg>
                </button>
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20 text-lg font-bold text-white">
                    {(u.nickname ?? u.email)?.[0]?.toUpperCase() ?? "?"}
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-white flex items-center gap-1.5">
                      {u.nickname ?? "-"}
                      {u.isAdmin && <span className="text-yellow-300 text-xs">★ 관리자</span>}
                    </h2>
                    <p className="text-xs text-white/70">{u.email}</p>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <Badge variant={role.variant}>{role.label}</Badge>
                  {statusBadge(u.status)}
                  {u.provider && <span className="rounded-full bg-white/15 px-2 py-0.5 text-xs text-white/80">{u.provider}</span>}
                </div>
              </div>

              {/* 탭 */}
              <div className="flex border-b border-[var(--color-border)]">
                <button onClick={() => { setTab("info"); setConfirm(null); }}
                  className={`flex-1 py-2.5 text-xs font-semibold transition-colors ${tab === "info" ? "text-[var(--color-accent)] border-b-2 border-[var(--color-accent)]" : "text-[var(--color-text-muted)]"}`}>
                  상세정보
                </button>
                <button onClick={() => { setTab("edit"); setConfirm(null); }}
                  className={`flex-1 py-2.5 text-xs font-semibold transition-colors ${tab === "edit" ? "text-[var(--color-accent)] border-b-2 border-[var(--color-accent)]" : "text-[var(--color-text-muted)]"}`}>
                  관리
                </button>
              </div>

              {/* 컨텐츠 */}
              <div className="flex-1 overflow-y-auto px-5 py-4">
                {tab === "info" ? (
                  <div className="space-y-4">
                    <InfoSection title="기본 정보" rows={[
                      ["ID", u.id],
                      ["이름", u.name],
                      ["연락처", u.phone],
                      ["생년월일", fmt(u.birth_date)],
                      ["지역", [u.city, u.district].filter(Boolean).join(" ") || null],
                      ["소개", u.bio],
                    ]} />
                    <InfoSection title="농구 정보" rows={[
                      ["포지션", u.position],
                      ["키", u.height ? `${u.height}cm` : null],
                      ["몸무게", u.weight ? `${u.weight}kg` : null],
                      ["평가점수", u.evaluation_rating?.toFixed(1) ?? null],
                      ["주최 경기", String(u.total_games_hosted ?? 0)],
                      ["참여 경기", String(u.total_games_participated ?? 0)],
                    ]} />
                    <InfoSection title="계정" rows={[
                      ["OAuth", u.provider ?? "이메일"],
                      ["가입일", fmtFull(u.createdAt)],
                      ["최근 로그인", fmtFull(u.last_login_at)],
                    ]} />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* 역할 변경 */}
                    <div className="rounded-[14px] border border-[var(--color-border)] p-4">
                      <p className="mb-2.5 text-xs font-bold text-[var(--color-text-secondary)]">역할 변경</p>
                      <form action={async (fd: FormData) => { fd.set("user_id", u.id); await updateUserRoleAction(fd); closeModal(); }}
                        className="flex items-center gap-2">
                        <select name="membership_type" defaultValue={u.membershipType}
                          className="flex-1 rounded-[10px] border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-2 text-sm text-[var(--color-text-secondary)] outline-none focus:border-[var(--color-accent)]">
                          <option value={0}>일반유저</option>
                          <option value={1}>픽업호스트</option>
                          <option value={2}>팀장</option>
                          <option value={3}>대회관리자</option>
                        </select>
                        <button type="submit" className="rounded-[10px] bg-[var(--color-accent)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--color-accent)]">변경</button>
                      </form>
                    </div>

                    {/* 슈퍼관리자 */}
                    <div className="rounded-[14px] border border-[var(--color-border)] p-4 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-[var(--color-text-secondary)]">슈퍼관리자</p>
                        <p className="text-xs text-[var(--color-text-muted)]">시스템 전체 관리 권한</p>
                      </div>
                      <button onClick={() => runAction(toggleUserAdminAction, { user_id: u.id, make_admin: u.isAdmin ? "false" : "true" })}
                        disabled={pending}
                        className={`rounded-[10px] px-4 py-2 text-sm font-semibold transition-colors ${u.isAdmin ? "bg-[var(--color-error)] text-white hover:bg-[var(--color-error)]" : "bg-[var(--color-elevated)] text-[var(--color-accent)] hover:bg-[var(--color-accent-light)]"}`}>
                        {u.isAdmin ? "해제" : "지정"}
                      </button>
                    </div>

                    {/* 계정 상태 */}
                    <div className="rounded-[14px] border border-[var(--color-border)] p-4 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-[var(--color-text-secondary)]">계정 상태</p>
                        <p className="text-xs text-[var(--color-text-muted)]">현재: {u.status === "active" ? "활성" : u.status === "withdrawn" ? "탈퇴" : "정지"}</p>
                      </div>
                      <button onClick={() => runAction(updateUserStatusAction, { user_id: u.id, status: u.status === "active" ? "suspended" : "active" })}
                        disabled={pending}
                        className={`rounded-[10px] px-4 py-2 text-sm font-semibold transition-colors ${u.status === "active" ? "bg-[var(--color-warning)]/10 text-[var(--color-warning)] hover:bg-[var(--color-warning)]/20" : "bg-[var(--color-success)]/10 text-[var(--color-success)] hover:bg-[var(--color-success)]/20"}`}>
                        {u.status === "active" ? "정지" : "활성화"}
                      </button>
                    </div>

                    {/* 위험 영역 */}
                    {!u.isAdmin && (
                      <div className="rounded-[14px] border border-[var(--color-error)]/30 bg-[var(--color-error)]/[0.03] p-4">
                        <p className="mb-1 text-xs font-bold text-[var(--color-error)]">위험 영역</p>
                        <p className="mb-3 text-xs text-[var(--color-text-muted)]">이 작업은 되돌릴 수 없습니다.</p>
                        {confirm ? (
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-[var(--color-error)]">
                              {confirm === "delete" ? "DB에서 완전히 삭제합니다." : "개인정보를 삭제하고 탈퇴 처리합니다."}
                            </span>
                            <div className="flex gap-1.5 ml-auto">
                              <button onClick={() => setConfirm(null)} className="rounded-[8px] border border-[var(--color-border)] px-3 py-1.5 text-xs text-[var(--color-text-muted)] hover:bg-[var(--color-surface)]">취소</button>
                              <button onClick={() => runAction(confirm === "delete" ? deleteAction : forceWithdrawAction, { user_id: u.id })}
                                disabled={pending}
                                className="rounded-[8px] bg-[var(--color-error)] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[var(--color-error)] disabled:opacity-50">
                                {pending ? "처리 중..." : "확인"}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            {u.status !== "withdrawn" && (
                              <button onClick={() => setConfirm("withdraw")}
                                className="rounded-[10px] border border-[var(--color-warning)]/40 px-4 py-2 text-sm font-semibold text-[var(--color-warning)] hover:bg-[var(--color-warning)]/10 transition-colors">
                                강제탈퇴
                              </button>
                            )}
                            <button onClick={() => setConfirm("delete")}
                              className="rounded-[10px] border border-[var(--color-error)]/40 px-4 py-2 text-sm font-semibold text-[var(--color-error)] hover:bg-[var(--color-error)]/10 transition-colors">
                              완전 삭제
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      <style jsx global>{`
        @keyframes slide-up { from { transform: translateY(100%); } to { transform: translateY(0); } }
        @keyframes fade-in { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        .animate-slide-up { animation: slide-up 0.25s ease-out; }
        .animate-fade-in { animation: fade-in 0.2s ease-out; }
      `}</style>
    </>
  );
}

function InfoSection({ title, rows }: { title: string; rows: [string, string | null | undefined][] }) {
  return (
    <div>
      <p className="mb-1.5 text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider">{title}</p>
      <div className="rounded-[12px] border border-[var(--color-border)] overflow-hidden">
        {rows.map(([label, value], i) => (
          <div key={label} className={`flex items-center px-4 py-2 ${i > 0 ? "border-t border-[var(--color-border-subtle)]" : ""}`}>
            <span className="w-20 shrink-0 text-xs text-[var(--color-text-muted)]">{label}</span>
            <span className="text-sm text-[var(--color-text-primary)] break-all">{value || <span className="text-[var(--color-text-muted)]">-</span>}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
