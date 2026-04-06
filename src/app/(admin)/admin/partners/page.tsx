"use client";

/* ============================================================
 * Admin 파트너 관리 페이지
 * 파트너사 목록 / 상태 변경(승인/반려) / 신규 등록
 * ============================================================ */

import { useState, useEffect, useCallback } from "react";
import { AdminPageHeader } from "@/components/admin/admin-page-header";

// 파트너 타입 정의
interface Partner {
  id: string;
  uuid: string;
  name: string;
  logo_url: string | null;
  website_url: string | null;
  contact_email: string | null;
  status: string;
  description: string | null;
  owner: { id: string; nickname: string; email: string };
  campaigns_count: number;
  members_count: number;
  created_at: string;
}

// 상태별 뱃지 색상 매핑
function statusBadge(status: string) {
  const map: Record<string, { bg: string; text: string; label: string }> = {
    pending:   { bg: "var(--color-warning)",  text: "#fff", label: "대기" },
    approved:  { bg: "var(--color-success)",  text: "#fff", label: "승인" },
    rejected:  { bg: "var(--color-error)",    text: "#fff", label: "반려" },
    suspended: { bg: "var(--color-text-muted)", text: "#fff", label: "정지" },
  };
  return map[status] || map.pending;
}

export default function AdminPartnersPage() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>(""); // 상태 필터
  const [showForm, setShowForm] = useState(false);

  // 파트너 목록 조회
  const fetchPartners = useCallback(async () => {
    setLoading(true);
    const qs = filter ? `?status=${filter}` : "";
    const res = await fetch(`/api/admin/partners${qs}`);
    if (res.ok) {
      const data = await res.json();
      setPartners(data);
    }
    setLoading(false);
  }, [filter]);

  useEffect(() => { fetchPartners(); }, [fetchPartners]);

  // 상태 변경 핸들러 (승인/반려/정지)
  const handleStatusChange = async (id: string, newStatus: string) => {
    const res = await fetch(`/api/admin/partners/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.ok) fetchPartners(); // 목록 새로고침
  };

  // 신규 파트너 등록 핸들러
  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const body = {
      name: form.get("name"),
      contact_email: form.get("contact_email"),
      website_url: form.get("website_url"),
      description: form.get("description"),
      owner_id: form.get("owner_id"),
    };
    const res = await fetch("/api/admin/partners", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      setShowForm(false);
      fetchPartners();
    }
  };

  return (
    <div>
      <AdminPageHeader title="파트너 관리" subtitle="광고 파트너사 등록/승인/관리" />

      {/* 필터 + 등록 버튼 */}
      <div className="flex items-center gap-3 mb-6">
        {/* 상태 필터 탭 */}
        {[
          { value: "", label: "전체" },
          { value: "pending", label: "대기" },
          { value: "approved", label: "승인" },
          { value: "rejected", label: "반려" },
        ].map((tab) => (
          <button
            key={tab.value}
            onClick={() => setFilter(tab.value)}
            className="px-3 py-1.5 rounded text-sm font-medium transition-colors"
            style={{
              backgroundColor: filter === tab.value ? "var(--color-primary)" : "var(--color-surface)",
              color: filter === tab.value ? "#fff" : "var(--color-text-secondary)",
            }}
          >
            {tab.label}
          </button>
        ))}

        <button
          onClick={() => setShowForm(!showForm)}
          className="ml-auto flex items-center gap-1 px-4 py-2 rounded text-sm font-bold text-white"
          style={{ backgroundColor: "var(--color-primary)" }}
        >
          <span className="material-symbols-outlined text-lg">add</span>
          파트너 등록
        </button>
      </div>

      {/* 신규 등록 폼 (토글) */}
      {showForm && (
        <form
          onSubmit={handleCreate}
          className="mb-6 rounded-md border p-5 space-y-3"
          style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}
        >
          <h3 className="text-sm font-bold mb-2" style={{ color: "var(--color-text-primary)" }}>
            신규 파트너 등록
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <input name="name" placeholder="파트너사명 *" required
              className="rounded border px-3 py-2 text-sm"
              style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)", color: "var(--color-text-primary)" }}
            />
            <input name="owner_id" placeholder="소유자 User ID *" required type="number"
              className="rounded border px-3 py-2 text-sm"
              style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)", color: "var(--color-text-primary)" }}
            />
            <input name="contact_email" placeholder="담당자 이메일"
              className="rounded border px-3 py-2 text-sm"
              style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)", color: "var(--color-text-primary)" }}
            />
            <input name="website_url" placeholder="웹사이트 URL"
              className="rounded border px-3 py-2 text-sm"
              style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)", color: "var(--color-text-primary)" }}
            />
          </div>
          <textarea name="description" placeholder="파트너 소개" rows={2}
            className="w-full rounded border px-3 py-2 text-sm"
            style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)", color: "var(--color-text-primary)" }}
          />
          <div className="flex gap-2">
            <button type="submit" className="px-4 py-2 rounded text-sm font-bold text-white"
              style={{ backgroundColor: "var(--color-primary)" }}>
              등록
            </button>
            <button type="button" onClick={() => setShowForm(false)}
              className="px-4 py-2 rounded text-sm"
              style={{ color: "var(--color-text-muted)" }}>
              취소
            </button>
          </div>
        </form>
      )}

      {/* 파트너 목록 테이블 */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 rounded-lg animate-pulse"
              style={{ backgroundColor: "var(--color-surface)" }} />
          ))}
        </div>
      ) : partners.length === 0 ? (
        <div className="text-center py-12 text-sm" style={{ color: "var(--color-text-muted)" }}>
          등록된 파트너가 없습니다
        </div>
      ) : (
        <div className="rounded-md border overflow-hidden"
          style={{ borderColor: "var(--color-border)" }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ backgroundColor: "var(--color-surface)" }}>
                <th className="text-left px-4 py-3 font-medium" style={{ color: "var(--color-text-secondary)" }}>파트너사</th>
                <th className="text-left px-4 py-3 font-medium" style={{ color: "var(--color-text-secondary)" }}>소유자</th>
                <th className="text-center px-4 py-3 font-medium" style={{ color: "var(--color-text-secondary)" }}>캠페인</th>
                <th className="text-center px-4 py-3 font-medium" style={{ color: "var(--color-text-secondary)" }}>상태</th>
                <th className="text-center px-4 py-3 font-medium" style={{ color: "var(--color-text-secondary)" }}>관리</th>
              </tr>
            </thead>
            <tbody>
              {partners.map((p) => {
                const badge = statusBadge(p.status);
                return (
                  <tr key={p.id} className="border-t" style={{ borderColor: "var(--color-border)" }}>
                    <td className="px-4 py-3">
                      <p className="font-medium" style={{ color: "var(--color-text-primary)" }}>{p.name}</p>
                      <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>{p.contact_email || "-"}</p>
                    </td>
                    <td className="px-4 py-3" style={{ color: "var(--color-text-secondary)" }}>
                      {p.owner.nickname || p.owner.email}
                    </td>
                    <td className="px-4 py-3 text-center" style={{ color: "var(--color-text-secondary)" }}>
                      {p.campaigns_count}개
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-block px-2 py-0.5 rounded text-xs font-bold"
                        style={{ backgroundColor: badge.bg, color: badge.text }}>
                        {badge.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {/* 승인 대기 상태일 때 승인/반려 버튼 */}
                        {p.status === "pending" && (
                          <>
                            <button onClick={() => handleStatusChange(p.id, "approved")}
                              className="px-2 py-1 rounded text-xs font-medium text-white"
                              style={{ backgroundColor: "var(--color-success)" }}>
                              승인
                            </button>
                            <button onClick={() => handleStatusChange(p.id, "rejected")}
                              className="px-2 py-1 rounded text-xs font-medium text-white"
                              style={{ backgroundColor: "var(--color-error)" }}>
                              반려
                            </button>
                          </>
                        )}
                        {/* 승인 상태일 때 정지 버튼 */}
                        {p.status === "approved" && (
                          <button onClick={() => handleStatusChange(p.id, "suspended")}
                            className="px-2 py-1 rounded text-xs font-medium"
                            style={{ color: "var(--color-error)" }}>
                            정지
                          </button>
                        )}
                        {/* 정지 상태일 때 재승인 버튼 */}
                        {p.status === "suspended" && (
                          <button onClick={() => handleStatusChange(p.id, "approved")}
                            className="px-2 py-1 rounded text-xs font-medium"
                            style={{ color: "var(--color-success)" }}>
                            재승인
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
