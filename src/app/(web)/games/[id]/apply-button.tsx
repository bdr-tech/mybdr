"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function GameApplyButton({ gameId }: { gameId: string }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  async function handleApply() {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/web/games/${gameId}/apply`, { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setMessage({ text: data.message ?? "신청 완료!", type: "success" });
      } else {
        setMessage({ text: data.error ?? "오류가 발생했습니다.", type: "error" });
      }
    } catch {
      setMessage({ text: "네트워크 오류가 발생했습니다.", type: "error" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      {message && (
        <p className={`text-sm ${message.type === "success" ? "text-green-400" : "text-red-400"}`}>
          {message.text}
        </p>
      )}
      <Button className="w-full" onClick={handleApply} disabled={loading}>
        {loading ? "신청 중..." : "참가 신청"}
      </Button>
    </div>
  );
}
