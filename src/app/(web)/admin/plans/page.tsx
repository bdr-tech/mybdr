"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type Plan = {
  id: string;
  name: string;
  description: string | null;
  plan_type: string;
  feature_key: string;
  price: number;
  max_uses: number | null;
  is_active: boolean;
  created_at: string;
};

const PLAN_TYPE_LABELS: Record<string, string> = { monthly: "월 구독", one_time: "1회 구매" };
const FEATURE_KEY_OPTIONS = [
  { value: "team_create", label: "팀 생성권" },
  { value: "pickup_game", label: "픽업게임" },
  { value: "court_rental", label: "체육관 대관" },
  { value: "tournament_create", label: "대회 생성" },
];

const PROMO_TIERS = [
  { membershipType: 2, label: "팀장", price: "₩3,900/월" },
  { membershipType: 3, label: "대회관리자", price: "₩199,000/월" },
];

const EMPTY_FORM = { name: "", description: "", plan_type: "monthly", feature_key: "team_create", price: "", max_uses: "" };

type PromoStats = { membershipType: number; count: number };

export default function AdminPlansPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState<Plan | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [promoStats, setPromoStats] = useState<PromoStats[]>([]);
  const [endingPromo, setEndingPromo] = useState<number | null>(null);

  const load = async () => {
    setLoading(true);
    const [plansRes, statsRes] = await Promise.all([
      fetch("/api/admin/plans"),
      fetch("/api/admin/promo-stats"),
    ]);
    const plansData = await plansRes.json();
    setPlans(Array.isArray(plansData) ? plansData : []);
    if (statsRes.ok) {
      const statsData = await statsRes.json();
      setPromoStats(Array.isArray(statsData) ? statsData : []);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  function openCreate() {
    setEditTarget(null);
    setForm(EMPTY_FORM);
    setError(null);
    setShowModal(true);
  }

  function openEdit(plan: Plan) {
    setEditTarget(plan);
    setForm({
      name: plan.name,
      description: plan.description ?? "",
      plan_type: plan.plan_type,
      feature_key: plan.feature_key,
      price: String(plan.price),
      max_uses: plan.max_uses ? String(plan.max_uses) : "",
    });
    setError(null);
    setShowModal(true);
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    const url = editTarget ? `/api/admin/plans/${editTarget.id}` : "/api/admin/plans";
    const method = editTarget ? "PUT" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, price: parseInt(form.price), max_uses: form.max_uses ? parseInt(form.max_uses) : null }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error ?? "저장 실패"); setSaving(false); return; }
    setSaving(false);
    setShowModal(false);
    load();
  }

  async function handleToggle(plan: Plan) {
    await fetch(`/api/admin/plans/${plan.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: !plan.is_active }),
    });
    load();
  }

  async function handleDelete(plan: Plan) {
    if (!confirm(`"${plan.name}" 요금제를 삭제하시겠습니까?`)) return;
    const res = await fetch(`/api/admin/plans/${plan.id}`, { method: "DELETE" });
    const data = await res.json();
    if (data.deactivated) alert("구독자가 있어 비활성화 처리되었습니다.");
    load();
  }

  const endPromotion = async (membershipType: number, label: string) => {
    const count = promoStats.find((s) => s.membershipType === membershipType)?.count ?? 0;
    if (!confirm(`[${label}] 프로모션을 종료하시겠습니까?\n현재 ${count}명의 구독이 만료됩니다.`)) return;
    setEndingPromo(membershipType);
    try {
      const formData = new FormData();
      formData.append("membership_type", String(membershipType));
      const { endPromotionAction } = await import("@/app/actions/admin-users");
      const result = await endPromotionAction(formData);
      if (result.error) {
        alert(result.error);
      } else {
        await load();
      }
    } catch {
      alert("오류가 발생했습니다.");
    } finally {
      setEndingPromo(null);
    }
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">요금제 관리</h1>
        <Button onClick={openCreate}>+ 요금제 추가</Button>
      </div>

      {/* 프로모션 관리 */}
      <Card className="mb-6">
        <h2 className="mb-4 text-base font-semibold">프로모션 관리</h2>
        <div className="space-y-3">
          {PROMO_TIERS.map((tier) => {
            const stat = promoStats.find((s) => s.membershipType === tier.membershipType);
            const count = stat?.count ?? 0;
            return (
              <div
                key={tier.membershipType}
                className="flex items-center justify-between rounded-[12px] bg-[#F5F7FA] px-4 py-3"
              >
                <div>
                  <p className="font-medium text-[#111827]">{tier.label}</p>
                  <p className="text-xs text-[#6B7280]">
                    정가 {tier.price} ·{" "}
                    <span className="font-medium text-[#F4A261]">프로모션 무료 {count}명</span>
                  </p>
                </div>
                {count > 0 ? (
                  <button
                    onClick={() => endPromotion(tier.membershipType, tier.label)}
                    disabled={endingPromo === tier.membershipType}
                    className="rounded-full bg-[rgba(239,68,68,0.1)] px-4 py-2 text-xs font-semibold text-[#EF4444] hover:bg-[rgba(239,68,68,0.2)] disabled:opacity-50"
                  >
                    {endingPromo === tier.membershipType ? "처리 중..." : "프로모션 종료"}
                  </button>
                ) : (
                  <span className="rounded-full bg-[#EEF2FF] px-3 py-1 text-xs text-[#9CA3AF]">
                    프로모션 없음
                  </span>
                )}
              </div>
            );
          })}
        </div>
        <p className="mt-3 text-xs text-[#9CA3AF]">
          * 프로모션 종료 시 해당 티어의 subscription_expires_at = NULL 인 유저가 즉시 만료됩니다.
        </p>
      </Card>

      {loading ? (
        <div className="py-12 text-center text-[#6B7280]">로딩 중...</div>
      ) : plans.length === 0 ? (
        <Card className="py-12 text-center text-[#6B7280]">
          <div className="mb-2 text-3xl">💰</div>
          등록된 요금제가 없습니다.
        </Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full table-fixed text-sm">
              <colgroup>
                <col />
                <col className="w-[130px]" />
                <col className="w-[90px]" />
                <col className="w-[105px]" />
                <col className="w-[75px]" />
                <col className="w-[165px]" />
              </colgroup>
              <thead>
                <tr className="border-b border-[#EEF2FF] text-left text-xs text-[#9CA3AF]">
                  <th className="pb-3 pr-4">이름</th>
                  <th className="pb-3 pr-4">기능 키</th>
                  <th className="pb-3 pr-4">타입</th>
                  <th className="pb-3 pr-4">금액</th>
                  <th className="pb-3 pr-4">상태</th>
                  <th className="pb-3">관리</th>
                </tr>
              </thead>
              <tbody>
                {plans.map((plan) => (
                  <tr key={plan.id} className="border-b border-[#FFFFFF] hover:bg-[#EEF2FF]/50">
                    <td className="py-3 pr-4 font-medium">
                      {plan.name}
                      {plan.description && (
                        <div className="text-xs text-[#9CA3AF]">{plan.description}</div>
                      )}
                    </td>
                    <td className="py-3 pr-4 font-mono text-xs text-[#6B7280]">{plan.feature_key}</td>
                    <td className="py-3 pr-4 text-xs text-[#6B7280]">{PLAN_TYPE_LABELS[plan.plan_type] ?? plan.plan_type}</td>
                    <td className="py-3 pr-4 font-semibold">{plan.price.toLocaleString()}원</td>
                    <td className="py-3 pr-4">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${plan.is_active ? "bg-[rgba(74,222,128,0.1)] text-[#4ADE80]" : "bg-[#EEF2FF] text-[#9CA3AF]"}`}>
                        {plan.is_active ? "활성" : "비활성"}
                      </span>
                    </td>
                    <td className="py-3">
                      <div className="flex gap-2">
                        <button onClick={() => openEdit(plan)} className="rounded-[8px] bg-[#EEF2FF] px-3 py-1 text-xs text-[#6B7280] hover:text-[#111827]">
                          수정
                        </button>
                        <button onClick={() => handleToggle(plan)} className="rounded-[8px] bg-[#EEF2FF] px-3 py-1 text-xs text-[#6B7280] hover:text-[#111827]">
                          {plan.is_active ? "비활성화" : "활성화"}
                        </button>
                        <button onClick={() => handleDelete(plan)} className="rounded-[8px] bg-[rgba(239,68,68,0.1)] px-3 py-1 text-xs text-[#EF4444] hover:bg-[rgba(239,68,68,0.2)]">
                          삭제
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md rounded-[20px] border border-[#E8ECF0] bg-[#FFFFFF] p-6">
            <h2 className="mb-4 text-lg font-bold">{editTarget ? "요금제 수정" : "요금제 추가"}</h2>

            {error && (
              <div className="mb-4 rounded-[12px] bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</div>
            )}

            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs text-[#6B7280]">이름 *</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full rounded-[12px] border-none bg-[#E8ECF0] px-4 py-2.5 text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#0066FF]/50"
                  placeholder="예: 팀 생성권"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-[#6B7280]">설명</label>
                <input
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full rounded-[12px] border-none bg-[#E8ECF0] px-4 py-2.5 text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#0066FF]/50"
                  placeholder="간단한 설명"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs text-[#6B7280]">타입 *</label>
                  <select
                    value={form.plan_type}
                    onChange={(e) => setForm({ ...form, plan_type: e.target.value })}
                    disabled={!!editTarget}
                    className="w-full rounded-[12px] border-none bg-[#E8ECF0] px-4 py-2.5 text-sm text-[#111827] focus:outline-none"
                  >
                    <option value="monthly">월 구독</option>
                    <option value="one_time">1회 구매</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs text-[#6B7280]">기능 키 *</label>
                  <select
                    value={form.feature_key}
                    onChange={(e) => setForm({ ...form, feature_key: e.target.value })}
                    disabled={!!editTarget}
                    className="w-full rounded-[12px] border-none bg-[#E8ECF0] px-4 py-2.5 text-sm text-[#111827] focus:outline-none"
                  >
                    {FEATURE_KEY_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs text-[#6B7280]">금액 (원) *</label>
                  <input
                    type="number"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    className="w-full rounded-[12px] border-none bg-[#E8ECF0] px-4 py-2.5 text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#0066FF]/50"
                    placeholder="9900"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-[#6B7280]">최대 사용 횟수</label>
                  <input
                    type="number"
                    value={form.max_uses}
                    onChange={(e) => setForm({ ...form, max_uses: e.target.value })}
                    className="w-full rounded-[12px] border-none bg-[#E8ECF0] px-4 py-2.5 text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#0066FF]/50"
                    placeholder="2 (선택)"
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <Button onClick={handleSave} disabled={saving} className="flex-1">
                {saving ? "저장 중..." : "저장"}
              </Button>
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 rounded-[12px] border border-[#E8ECF0] py-2 text-sm text-[#6B7280] hover:text-[#111827]"
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
