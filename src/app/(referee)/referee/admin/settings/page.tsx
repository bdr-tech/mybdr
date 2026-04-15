"use client";

import { useState, useEffect, useCallback } from "react";

/**
 * /referee/admin/settings — 관리자 역할 관리 페이지
 *
 * 이유: 협회 관리자 목록을 조회하고, admin_manage 권한이 있는 사용자(사무국장)만
 *       관리자를 추가/역할 변경/삭제할 수 있다.
 *
 * 구조:
 *   - 관리자 목록 테이블 (이름, 이메일, 역할 뱃지, 추가일)
 *   - admin_manage 권한자: 추가/변경/삭제 버튼 표시
 *   - 권한 없는 사용자: 목록만 열람
 */

// ── 역할 한국어 매핑 ──
const ROLE_LABELS: Record<string, string> = {
  president: "회장",
  vice_president: "부회장",
  director: "이사",
  secretary_general: "사무국장",
  staff: "직원",
  referee_chief: "심판팀장",
  referee_clerk: "심판총무",
  game_chief: "경기팀장",
  game_clerk: "경기총무",
};

// ── 역할별 뱃지 색상 ──
const ROLE_COLORS: Record<string, { bg: string; text: string }> = {
  president: { bg: "var(--color-warning-subtle, rgba(234,179,8,0.15))", text: "var(--color-warning, #eab308)" },
  vice_president: { bg: "var(--color-warning-subtle, rgba(234,179,8,0.1))", text: "var(--color-warning, #eab308)" },
  director: { bg: "var(--color-info-subtle, rgba(0,121,185,0.1))", text: "var(--color-info, #0079B9)" },
  secretary_general: { bg: "var(--color-primary-subtle, rgba(227,27,35,0.1))", text: "var(--color-primary, #E31B23)" },
  staff: { bg: "var(--color-surface)", text: "var(--color-text-secondary)" },
  referee_chief: { bg: "var(--color-success-subtle, rgba(34,197,94,0.1))", text: "var(--color-success, #22c55e)" },
  referee_clerk: { bg: "var(--color-success-subtle, rgba(34,197,94,0.1))", text: "var(--color-success, #22c55e)" },
  game_chief: { bg: "var(--color-info-subtle, rgba(0,121,185,0.1))", text: "var(--color-info, #0079B9)" },
  game_clerk: { bg: "var(--color-info-subtle, rgba(0,121,185,0.1))", text: "var(--color-info, #0079B9)" },
};

// ── 역할 목록 (드롭다운용) ──
const ALL_ROLES = [
  "president",
  "vice_president",
  "director",
  "secretary_general",
  "staff",
  "referee_chief",
  "referee_clerk",
  "game_chief",
  "game_clerk",
];

// ── 관리자 아이템 타입 ──
type AdminItem = {
  id: string;
  user_id: string;
  user_name: string | null;
  user_email: string | null;
  role: string;
  created_at: string;
};

export default function AdminSettingsPage() {
  // 관리자 목록
  const [admins, setAdmins] = useState<AdminItem[]>([]);
  // 현재 로그인 유저 ID (자기 자신 표시 + 수정 방지용)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  // admin_manage 권한 여부 (목록만 열람 vs 수정 가능)
  const [canManage, setCanManage] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 추가 폼 상태
  const [showAddForm, setShowAddForm] = useState(false);
  const [addUserId, setAddUserId] = useState("");
  const [addRole, setAddRole] = useState("staff");
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  // 역할 변경 중인 관리자 ID
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editRole, setEditRole] = useState("");

  // ── 데이터 로드 ──
  const loadAdmins = useCallback(async () => {
    try {
      setError(null);
      const res = await fetch("/api/web/referee-admin/settings");
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "목록 조회 실패");
      }
      const data = await res.json();
      setAdmins(data.items || []);
      setCurrentUserId(data.current_user_id?.toString() || null);

      // admin_manage 권한 판정: 현재 유저가 secretary_general인지 확인
      const me = (data.items || []).find(
        (a: AdminItem) => a.user_id?.toString() === data.current_user_id?.toString()
      );
      setCanManage(me?.role === "secretary_general");
    } catch (err) {
      setError(err instanceof Error ? err.message : "목록을 불러올 수 없습니다.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAdmins();
  }, [loadAdmins]);

  // ── 관리자 추가 ──
  const handleAdd = async () => {
    if (!addUserId.trim()) {
      setAddError("유저 ID를 입력하세요.");
      return;
    }
    const userId = parseInt(addUserId, 10);
    if (isNaN(userId) || userId <= 0) {
      setAddError("유효한 숫자 ID를 입력하세요.");
      return;
    }

    setAddLoading(true);
    setAddError(null);
    try {
      const res = await fetch("/api/web/referee-admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, role: addRole }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "추가 실패");
      }
      // 성공: 폼 초기화 + 목록 새로고침
      setShowAddForm(false);
      setAddUserId("");
      setAddRole("staff");
      await loadAdmins();
    } catch (err) {
      setAddError(err instanceof Error ? err.message : "관리자 추가에 실패했습니다.");
    } finally {
      setAddLoading(false);
    }
  };

  // ── 역할 변경 ──
  const handleRoleChange = async (adminId: string) => {
    try {
      const res = await fetch(`/api/web/referee-admin/settings/${adminId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: editRole }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "변경 실패");
      }
      setEditingId(null);
      await loadAdmins();
    } catch (err) {
      alert(err instanceof Error ? err.message : "역할 변경에 실패했습니다.");
    }
  };

  // ── 관리자 삭제 ──
  const handleDelete = async (adminId: string, name: string | null) => {
    if (!confirm(`${name ?? "이 관리자"}를 삭제하시겠습니까?`)) return;
    try {
      const res = await fetch(`/api/web/referee-admin/settings/${adminId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "삭제 실패");
      }
      await loadAdmins();
    } catch (err) {
      alert(err instanceof Error ? err.message : "관리자 삭제에 실패했습니다.");
    }
  };

  // ── 로딩 상태 ──
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 animate-pulse" style={{ backgroundColor: "var(--color-surface)", borderRadius: 4 }} />
        <div className="h-64 animate-pulse" style={{ backgroundColor: "var(--color-surface)", borderRadius: 4 }} />
      </div>
    );
  }

  // ── 에러 상태 ──
  if (error) {
    return (
      <div
        className="flex flex-col items-center justify-center px-6 py-16 text-center"
        style={{
          backgroundColor: "var(--color-card)",
          border: "1px solid var(--color-border)",
          borderRadius: 4,
        }}
      >
        <span className="material-symbols-outlined text-4xl" style={{ color: "var(--color-text-muted)" }}>
          error
        </span>
        <p className="mt-3 text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>
          {error}
        </p>
        <button
          onClick={() => { setLoading(true); loadAdmins(); }}
          className="mt-4 px-4 py-2 text-xs font-bold"
          style={{
            backgroundColor: "var(--color-primary)",
            color: "var(--color-text-on-primary, #fff)",
            borderRadius: 4,
          }}
        >
          다시 시도
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <header className="flex items-center justify-between">
        <div>
          <h1
            className="text-2xl font-black uppercase tracking-wider"
            style={{ color: "var(--color-text-primary)" }}
          >
            관리자 설정
          </h1>
          <p
            className="mt-1 text-sm"
            style={{ color: "var(--color-text-muted)" }}
          >
            협회 관리자 목록 및 역할을 관리합니다.
          </p>
        </div>
        {/* 관리자 추가 버튼 (admin_manage 권한자만) */}
        {canManage && !showAddForm && (
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-1 px-4 py-2 text-xs font-bold"
            style={{
              backgroundColor: "var(--color-primary)",
              color: "var(--color-text-on-primary, #fff)",
              borderRadius: 4,
            }}
          >
            <span className="material-symbols-outlined text-base">person_add</span>
            관리자 추가
          </button>
        )}
      </header>

      {/* ── 관리자 추가 폼 (인라인) ── */}
      {showAddForm && (
        <div
          className="space-y-3 p-4"
          style={{
            backgroundColor: "var(--color-card)",
            border: "1px solid var(--color-border)",
            borderRadius: 4,
          }}
        >
          <h3
            className="text-sm font-bold"
            style={{ color: "var(--color-text-primary)" }}
          >
            관리자 추가
          </h3>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            {/* 유저 ID 입력 */}
            <div className="flex-1">
              <label
                className="mb-1 block text-xs font-semibold"
                style={{ color: "var(--color-text-secondary)" }}
              >
                유저 ID (숫자)
              </label>
              <input
                type="number"
                value={addUserId}
                onChange={(e) => setAddUserId(e.target.value)}
                placeholder="유저 ID 입력"
                className="w-full px-3 py-2 text-sm"
                style={{
                  backgroundColor: "var(--color-surface)",
                  color: "var(--color-text-primary)",
                  border: "1px solid var(--color-border)",
                  borderRadius: 4,
                }}
              />
            </div>
            {/* 역할 선택 */}
            <div className="flex-1">
              <label
                className="mb-1 block text-xs font-semibold"
                style={{ color: "var(--color-text-secondary)" }}
              >
                역할
              </label>
              <select
                value={addRole}
                onChange={(e) => setAddRole(e.target.value)}
                className="w-full px-3 py-2 text-sm"
                style={{
                  backgroundColor: "var(--color-surface)",
                  color: "var(--color-text-primary)",
                  border: "1px solid var(--color-border)",
                  borderRadius: 4,
                }}
              >
                {ALL_ROLES.map((r) => (
                  <option key={r} value={r}>
                    {ROLE_LABELS[r] ?? r}
                  </option>
                ))}
              </select>
            </div>
            {/* 버튼 */}
            <div className="flex gap-2">
              <button
                onClick={handleAdd}
                disabled={addLoading}
                className="px-4 py-2 text-xs font-bold"
                style={{
                  backgroundColor: "var(--color-primary)",
                  color: "var(--color-text-on-primary, #fff)",
                  borderRadius: 4,
                  opacity: addLoading ? 0.6 : 1,
                }}
              >
                {addLoading ? "추가 중..." : "추가"}
              </button>
              <button
                onClick={() => { setShowAddForm(false); setAddError(null); }}
                className="px-4 py-2 text-xs font-bold"
                style={{
                  backgroundColor: "var(--color-surface)",
                  color: "var(--color-text-secondary)",
                  borderRadius: 4,
                }}
              >
                취소
              </button>
            </div>
          </div>
          {addError && (
            <p className="text-xs font-semibold" style={{ color: "var(--color-error, #ef4444)" }}>
              {addError}
            </p>
          )}
        </div>
      )}

      {/* ── 관리자 목록 테이블 (데스크톱) / 카드 (모바일) ── */}
      <div
        style={{
          backgroundColor: "var(--color-card)",
          border: "1px solid var(--color-border)",
          borderRadius: 4,
        }}
      >
        {admins.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center px-6 py-16 text-center"
          >
            <span className="material-symbols-outlined text-4xl" style={{ color: "var(--color-text-muted)" }}>
              group
            </span>
            <p className="mt-3 text-sm" style={{ color: "var(--color-text-muted)" }}>
              등록된 관리자가 없습니다.
            </p>
          </div>
        ) : (
          <>
            {/* 데스크톱 테이블 */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr
                    style={{
                      borderBottom: "1px solid var(--color-border)",
                    }}
                  >
                    <th
                      className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider"
                      style={{ color: "var(--color-text-muted)" }}
                    >
                      이름
                    </th>
                    <th
                      className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider"
                      style={{ color: "var(--color-text-muted)" }}
                    >
                      이메일
                    </th>
                    <th
                      className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider"
                      style={{ color: "var(--color-text-muted)" }}
                    >
                      역할
                    </th>
                    <th
                      className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider"
                      style={{ color: "var(--color-text-muted)" }}
                    >
                      추가일
                    </th>
                    {canManage && (
                      <th
                        className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wider"
                        style={{ color: "var(--color-text-muted)" }}
                      >
                        관리
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {admins.map((admin) => {
                    const isSelf = admin.user_id?.toString() === currentUserId;
                    const isEditing = editingId === admin.id?.toString();
                    const colors = ROLE_COLORS[admin.role] || ROLE_COLORS.staff;

                    return (
                      <tr
                        key={admin.id}
                        style={{ borderBottom: "1px solid var(--color-border)" }}
                      >
                        {/* 이름 */}
                        <td className="px-4 py-3">
                          <span
                            className="font-semibold"
                            style={{ color: "var(--color-text-primary)" }}
                          >
                            {admin.user_name ?? "-"}
                          </span>
                          {isSelf && (
                            <span
                              className="ml-2 inline-flex items-center px-1.5 py-0.5 text-[10px] font-bold"
                              style={{
                                backgroundColor: "var(--color-surface)",
                                color: "var(--color-text-muted)",
                                borderRadius: 4,
                              }}
                            >
                              나
                            </span>
                          )}
                        </td>
                        {/* 이메일 */}
                        <td
                          className="px-4 py-3 text-xs"
                          style={{ color: "var(--color-text-secondary)" }}
                        >
                          {admin.user_email ?? "-"}
                        </td>
                        {/* 역할 */}
                        <td className="px-4 py-3">
                          {isEditing ? (
                            <div className="flex items-center gap-2">
                              <select
                                value={editRole}
                                onChange={(e) => setEditRole(e.target.value)}
                                className="px-2 py-1 text-xs"
                                style={{
                                  backgroundColor: "var(--color-surface)",
                                  color: "var(--color-text-primary)",
                                  border: "1px solid var(--color-border)",
                                  borderRadius: 4,
                                }}
                              >
                                {ALL_ROLES.map((r) => (
                                  <option key={r} value={r}>
                                    {ROLE_LABELS[r] ?? r}
                                  </option>
                                ))}
                              </select>
                              <button
                                onClick={() => handleRoleChange(admin.id.toString())}
                                className="px-2 py-1 text-xs font-bold"
                                style={{
                                  backgroundColor: "var(--color-primary)",
                                  color: "var(--color-text-on-primary, #fff)",
                                  borderRadius: 4,
                                }}
                              >
                                저장
                              </button>
                              <button
                                onClick={() => setEditingId(null)}
                                className="px-2 py-1 text-xs"
                                style={{
                                  color: "var(--color-text-muted)",
                                }}
                              >
                                취소
                              </button>
                            </div>
                          ) : (
                            <span
                              className="inline-flex items-center px-2 py-1 text-xs font-bold"
                              style={{
                                backgroundColor: colors.bg,
                                color: colors.text,
                                borderRadius: 4,
                              }}
                            >
                              {ROLE_LABELS[admin.role] ?? admin.role}
                            </span>
                          )}
                        </td>
                        {/* 추가일 */}
                        <td
                          className="px-4 py-3 text-xs"
                          style={{ color: "var(--color-text-muted)" }}
                        >
                          {admin.created_at
                            ? new Date(admin.created_at).toLocaleDateString("ko-KR")
                            : "-"}
                        </td>
                        {/* 관리 버튼 */}
                        {canManage && (
                          <td className="px-4 py-3 text-right">
                            {!isSelf && !isEditing && (
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  onClick={() => {
                                    setEditingId(admin.id.toString());
                                    setEditRole(admin.role);
                                  }}
                                  className="p-1.5"
                                  style={{ color: "var(--color-text-secondary)", borderRadius: 4 }}
                                  title="역할 변경"
                                >
                                  <span className="material-symbols-outlined text-base">edit</span>
                                </button>
                                <button
                                  onClick={() => handleDelete(admin.id.toString(), admin.user_name)}
                                  className="p-1.5"
                                  style={{ color: "var(--color-error, #ef4444)", borderRadius: 4 }}
                                  title="삭제"
                                >
                                  <span className="material-symbols-outlined text-base">delete</span>
                                </button>
                              </div>
                            )}
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* 모바일 카드 레이아웃 */}
            <div className="space-y-0 sm:hidden">
              {admins.map((admin) => {
                const isSelf = admin.user_id?.toString() === currentUserId;
                const colors = ROLE_COLORS[admin.role] || ROLE_COLORS.staff;

                return (
                  <div
                    key={admin.id}
                    className="flex items-center justify-between px-4 py-3"
                    style={{ borderBottom: "1px solid var(--color-border)" }}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span
                          className="text-sm font-semibold truncate"
                          style={{ color: "var(--color-text-primary)" }}
                        >
                          {admin.user_name ?? "-"}
                        </span>
                        {isSelf && (
                          <span
                            className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-bold"
                            style={{
                              backgroundColor: "var(--color-surface)",
                              color: "var(--color-text-muted)",
                              borderRadius: 4,
                            }}
                          >
                            나
                          </span>
                        )}
                      </div>
                      <div className="mt-1 flex items-center gap-2">
                        <span
                          className="inline-flex items-center px-2 py-0.5 text-[10px] font-bold"
                          style={{
                            backgroundColor: colors.bg,
                            color: colors.text,
                            borderRadius: 4,
                          }}
                        >
                          {ROLE_LABELS[admin.role] ?? admin.role}
                        </span>
                        <span
                          className="text-[10px]"
                          style={{ color: "var(--color-text-muted)" }}
                        >
                          {admin.created_at
                            ? new Date(admin.created_at).toLocaleDateString("ko-KR")
                            : ""}
                        </span>
                      </div>
                    </div>
                    {/* 모바일 관리 버튼 */}
                    {canManage && !isSelf && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setEditingId(admin.id.toString());
                            setEditRole(admin.role);
                          }}
                          className="p-1.5"
                          style={{ color: "var(--color-text-secondary)" }}
                        >
                          <span className="material-symbols-outlined text-base">edit</span>
                        </button>
                        <button
                          onClick={() => handleDelete(admin.id.toString(), admin.user_name)}
                          className="p-1.5"
                          style={{ color: "var(--color-error, #ef4444)" }}
                        >
                          <span className="material-symbols-outlined text-base">delete</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* 역할 설명 카드 */}
      <div
        className="p-4"
        style={{
          backgroundColor: "var(--color-card)",
          border: "1px solid var(--color-border)",
          borderRadius: 4,
        }}
      >
        <h3
          className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider"
          style={{ color: "var(--color-text-muted)" }}
        >
          <span className="material-symbols-outlined text-base">info</span>
          역할별 권한 안내
        </h3>
        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {[
            { roles: "회장 / 부회장 / 이사", desc: "모든 기능 열람 (수정 불가)" },
            { roles: "사무국장", desc: "전체 관리 + 관리자 추가/삭제 + 주민번호 열람" },
            { roles: "직원", desc: "기본 열람" },
            { roles: "심판팀장 / 심판총무", desc: "심판 등록/수정/검증/Excel" },
            { roles: "경기팀장 / 경기총무", desc: "경기원 등록/수정/검증/Excel" },
          ].map((item) => (
            <div
              key={item.roles}
              className="flex items-start gap-2 text-xs"
              style={{ color: "var(--color-text-secondary)" }}
            >
              <span
                className="mt-0.5 h-1.5 w-1.5 shrink-0"
                style={{
                  backgroundColor: "var(--color-primary)",
                  borderRadius: "50%",
                }}
              />
              <div>
                <span className="font-semibold" style={{ color: "var(--color-text-primary)" }}>
                  {item.roles}
                </span>
                <span className="ml-1">{item.desc}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
