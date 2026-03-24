"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ProfileIncompleteModal } from "./_modals/profile-incomplete-modal";

interface GameApplyButtonProps {
  gameId: string;
  profileCompleted: boolean;
  missingFields: string[];
  gameStatus: number;
}

export function GameApplyButton({
  gameId,
  profileCompleted,
  missingFields,
  gameStatus,
}: GameApplyButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [applied, setApplied] = useState(false);
  const [message, setMessage] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);
  const [showModal, setShowModal] = useState(false);

  // 모집중(1)이 아니면 버튼 비활성화
  if (gameStatus !== 1) {
    const labels: Record<number, string> = {
      0: "모집 전",
      2: "신청 마감",
      3: "경기 완료",
      4: "취소된 경기",
    };
    return (
      <Button className="w-full" disabled>
        {labels[gameStatus] ?? "신청 불가"}
      </Button>
    );
  }

  async function handleApply() {
    // missingFields 기반 실시간 판단 (DB profile_completed 컬럼이 갱신 안 될 수 있음)
    if (missingFields.length > 0) {
      setShowModal(true);
      return;
    }
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/web/games/${gameId}/apply`, {
        method: "POST",
      });
      const data = await res.json() as { message?: string; error?: string };
      if (res.ok) {
        setMessage({ text: data.message ?? "신청 완료!", type: "success" });
        setApplied(true);
        router.refresh();
      } else {
        setMessage({
          text: data.error ?? "오류가 발생했습니다.",
          type: "error",
        });
      }
    } catch {
      setMessage({ text: "네트워크 오류가 발생했습니다.", type: "error" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {showModal && (
        <ProfileIncompleteModal
          missingFields={missingFields}
          onClose={() => setShowModal(false)}
        />
      )}
      <div className="space-y-2">
        {message && (
          <p
            className={`text-sm ${
              message.type === "success" ? "text-green-600" : "text-red-500"
            }`}
          >
            {message.text}
          </p>
        )}
        <Button className="w-full" onClick={handleApply} disabled={loading || applied}>
          {loading ? "신청 중..." : applied ? "신청 완료" : "참가 신청"}
        </Button>
      </div>
    </>
  );
}
