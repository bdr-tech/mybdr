"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface Applicant {
  id: string;
  status: number;
  nickname: string | null;
  name: string | null;
  phone: string | null;
  position: string | null;
  city: string | null;
  district: string | null;
}

interface HostApplicationsProps {
  gameId: string;
  applicants: Applicant[];
}

const STATUS_LABEL: Record<number, string> = { 0: "대기", 1: "승인", 2: "거절" };

export function HostApplications({ gameId, applicants }: HostApplicationsProps) {
  const [list, setList] = useState(applicants);
  const [loading, setLoading] = useState<string | null>(null);

  async function handleAction(appId: string, action: "approve" | "reject") {
    setLoading(appId + action);
    try {
      const res = await fetch(`/api/web/games/${gameId}/applications/${appId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (res.ok) {
        setList((prev) =>
          prev.map((a) =>
            a.id === appId ? { ...a, status: action === "approve" ? 1 : 2 } : a
          )
        );
      } else {
        const data = await res.json() as { error?: string };
        alert(data.error ?? "오류가 발생했습니다.");
      }
    } catch {
      alert("네트워크 오류가 발생했습니다.");
    } finally {
      setLoading(null);
    }
  }

  const pending = list.filter((a) => a.status === 0);
  const processed = list.filter((a) => a.status !== 0);

  return (
    <div className="space-y-4">
      {/* 대기 중 */}
      {pending.length > 0 && (
        <div>
          <p className="mb-2 text-sm font-medium text-[var(--color-primary)]">
            승인 대기 {pending.length}명
          </p>
          <div className="space-y-2">
            {pending.map((a) => (
              <div
                key={a.id}
                className="flex items-center justify-between rounded-[12px] border border-[var(--color-primary)]/30 bg-[var(--color-warning)]/5 px-4 py-3"
              >
                <div>
                  <p className="text-sm font-medium">
                    {a.nickname ?? a.name ?? "익명"}
                  </p>
                  <p className="text-xs text-[var(--color-text-muted)]">
                    {[a.position, a.city, a.district].filter(Boolean).join(" · ") || "정보 없음"}
                  </p>
                  {a.phone && (
                    <a
                      href={`tel:${a.phone}`}
                      className="text-xs text-[var(--color-accent)] hover:underline"
                    >
                      {a.phone}
                    </a>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    className="px-4 py-1.5 text-sm"
                    onClick={() => handleAction(a.id, "approve")}
                    disabled={!!loading}
                  >
                    {loading === a.id + "approve" ? "..." : "승인"}
                  </Button>
                  <Button
                    className="px-4 py-1.5 text-sm"
                    variant="secondary"
                    onClick={() => handleAction(a.id, "reject")}
                    disabled={!!loading}
                  >
                    {loading === a.id + "reject" ? "..." : "거절"}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 처리 완료 */}
      {processed.length > 0 && (
        <div>
          <p className="mb-2 text-sm font-medium text-[var(--color-text-muted)]">처리 완료</p>
          <div className="space-y-2">
            {processed.map((a) => (
              <div
                key={a.id}
                className="flex items-center justify-between rounded-[12px] bg-[var(--color-surface-bright)] px-4 py-2.5"
              >
                <p className="text-sm">{a.nickname ?? a.name ?? "익명"}</p>
                <Badge variant={a.status === 1 ? "success" : "error"}>
                  {STATUS_LABEL[a.status]}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {list.length === 0 && (
        <p className="text-sm text-[var(--color-text-secondary)]">아직 신청자가 없습니다.</p>
      )}
    </div>
  );
}
