"use client";

/* ============================================================
 * Admin 캠페인 관리 페이지
 * 캠페인 목록 / 승인 / 반려 / 배치 상태 확인
 * ============================================================ */

import { useState, useEffect, useCallback } from "react";
import { AdminPageHeader } from "@/components/admin/admin-page-header";

// 캠페인 타입 정의
interface Campaign {
  id: string;
  uuid: string;
  partner_name: string;
  partner_logo: string | null;
  title: string;
  headline: string;
  description: string | null;
  image_url: string | null;
  link_url: string;
  cta_text: string | null;
  status: string;
  start_date: string | null;
  end_date: string | null;
  impressions: number;
  clicks: number;
  placements_count: number;
  created_at: string;
}

// 상태별 뱃지 색상 매핑
function statusBadge(status: string) {
  const map: Record<string, { bg: string; text: string; label: string }> = {
    draft:    { bg: "var(--color-surface-bright)", text: "var(--color-text-muted)", label: "초안" },
    pending:  { bg: "var(--color-warning)", text: "#fff", label: "심사중" },
    approved: { bg: "var(--color-success)", text: "#fff", label: "승인" },
    rejected: { bg: "var(--color-error)",   text: "#fff", label: "반려" },
    paused:   { bg: "var(--color-text-muted)", text: "#fff", label: "일시정지" },
    ended:    { bg: "var(--color-surface-bright)", text: "var(--color-text-muted)", label: "종료" },
  };
  return map[status] || map.draft;
}

// CTR 계산 (클릭률)
function ctr(impressions: number, clicks: number): string {
  if (impressions === 0) return "0%";
  return `${((clicks / impressions) * 100).toFixed(1)}%`;
}

export default function AdminCampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("");

  // 캠페인 목록 조회
  const fetchCampaigns = useCallback(async () => {
    setLoading(true);
    const qs = filter ? `?status=${filter}` : "";
    const res = await fetch(`/api/admin/campaigns${qs}`);
    if (res.ok) {
      const data = await res.json();
      setCampaigns(data);
    }
    setLoading(false);
  }, [filter]);

  useEffect(() => { fetchCampaigns(); }, [fetchCampaigns]);

  // 캠페인 상태 변경
  const handleStatusChange = async (id: string, newStatus: string) => {
    const res = await fetch(`/api/admin/campaigns/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.ok) fetchCampaigns();
  };

  return (
    <div>
      <AdminPageHeader title="광고 캠페인" subtitle="캠페인 심사/승인/반려 관리" />

      {/* 상태 필터 탭 */}
      <div className="flex items-center gap-2 mb-6 flex-wrap">
        {[
          { value: "", label: "전체" },
          { value: "pending", label: "심사중" },
          { value: "approved", label: "승인" },
          { value: "rejected", label: "반려" },
          { value: "paused", label: "일시정지" },
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
      </div>

      {/* 캠페인 목록 */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 rounded-lg animate-pulse"
              style={{ backgroundColor: "var(--color-surface)" }} />
          ))}
        </div>
      ) : campaigns.length === 0 ? (
        <div className="text-center py-12 text-sm" style={{ color: "var(--color-text-muted)" }}>
          캠페인이 없습니다
        </div>
      ) : (
        <div className="space-y-3">
          {campaigns.map((c) => {
            const badge = statusBadge(c.status);
            return (
              <div
                key={c.id}
                className="rounded-md border p-4 flex items-start gap-4"
                style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}
              >
                {/* 광고 이미지 미리보기 */}
                {c.image_url ? (
                  <div className="w-20 h-14 rounded-lg overflow-hidden shrink-0 bg-cover bg-center"
                    style={{ backgroundImage: `url(${c.image_url})` }} />
                ) : (
                  <div className="w-20 h-14 rounded-lg shrink-0 flex items-center justify-center"
                    style={{ backgroundColor: "var(--color-surface)" }}>
                    <span className="material-symbols-outlined text-xl" style={{ color: "var(--color-text-disabled)" }}>image</span>
                  </div>
                )}

                {/* 캠페인 정보 */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-bold truncate" style={{ color: "var(--color-text-primary)" }}>
                      {c.headline}
                    </p>
                    <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold shrink-0"
                      style={{ backgroundColor: badge.bg, color: badge.text }}>
                      {badge.label}
                    </span>
                  </div>
                  <p className="text-xs mb-1" style={{ color: "var(--color-text-muted)" }}>
                    {c.partner_name} · {c.title}
                  </p>
                  <div className="flex items-center gap-4 text-xs" style={{ color: "var(--color-text-secondary)" }}>
                    <span>노출 {c.impressions.toLocaleString()}</span>
                    <span>클릭 {c.clicks.toLocaleString()}</span>
                    <span>CTR {ctr(c.impressions, c.clicks)}</span>
                    <span>배치 {c.placements_count}곳</span>
                  </div>
                </div>

                {/* 액션 버튼 */}
                <div className="flex items-center gap-1 shrink-0">
                  {c.status === "pending" && (
                    <>
                      <button onClick={() => handleStatusChange(c.id, "approved")}
                        className="px-3 py-1.5 rounded text-xs font-bold text-white"
                        style={{ backgroundColor: "var(--color-success)" }}>
                        승인
                      </button>
                      <button onClick={() => handleStatusChange(c.id, "rejected")}
                        className="px-3 py-1.5 rounded text-xs font-bold text-white"
                        style={{ backgroundColor: "var(--color-error)" }}>
                        반려
                      </button>
                    </>
                  )}
                  {c.status === "approved" && (
                    <button onClick={() => handleStatusChange(c.id, "paused")}
                      className="px-3 py-1.5 rounded text-xs font-medium"
                      style={{ color: "var(--color-warning)" }}>
                      일시정지
                    </button>
                  )}
                  {c.status === "paused" && (
                    <button onClick={() => handleStatusChange(c.id, "approved")}
                      className="px-3 py-1.5 rounded text-xs font-medium"
                      style={{ color: "var(--color-success)" }}>
                      재개
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
