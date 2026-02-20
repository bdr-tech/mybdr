"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function TeamJoinButton({ teamId }: { teamId: string }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  async function handleJoin() {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/web/teams/${teamId}/join`, { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setMessage({ text: data.message ?? "완료!", type: "success" });
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
    <div className="text-right">
      {message && (
        <p className={`mb-1 text-xs ${message.type === "success" ? "text-green-400" : "text-red-400"}`}>
          {message.text}
        </p>
      )}
      <Button variant="secondary" onClick={handleJoin} disabled={loading}>
        {loading ? "신청 중..." : "가입 신청"}
      </Button>
    </div>
  );
}
