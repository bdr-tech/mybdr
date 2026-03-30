"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export function CancelApplyButton({ gameId }: { gameId: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleCancel() {
    if (!confirm("참가 신청을 취소하시겠습니까?")) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/web/games/${gameId}/apply/cancel`, {
        method: "DELETE",
      });
      if (res.ok) {
        router.refresh();
      } else {
        const data = await res.json() as { error?: string };
        alert(data.error ?? "취소 중 오류가 발생했습니다.");
      }
    } catch {
      alert("네트워크 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-1">
      <p className="text-sm text-[var(--color-text-muted)]">⏳ 호스트 승인 대기 중입니다.</p>
      <Button variant="secondary" className="w-full" onClick={handleCancel} disabled={loading}>
        {loading ? "취소 중..." : "신청 취소"}
      </Button>
    </div>
  );
}
