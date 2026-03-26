"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface JoinRequest {
  id: string;
  user_id: string;
  user: {
    id: string;
    nickname: string | null;
    name: string | null;
    position: string | null;
    city: string | null;
    district: string | null;
    profile_image: string | null;
  } | null;
  message: string | null;
  preferred_position: string | null;
  created_at: string;
}

export default function TeamManagePage({ params }: { params: { id: string } }) {
  const { id } = params;
  const [requests, setRequests] = useState<JoinRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState<string | null>(null);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/web/teams/${id}/members`);
      if (res.status === 403) {
        setError("팀장만 접근할 수 있습니다.");
        return;
      }
      if (!res.ok) throw new Error("조회 실패");
      const data = await res.json();
      setRequests(data.data ?? []);
    } catch {
      setError("가입신청 목록을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  async function handleAction(requestId: string, action: "approve" | "reject") {
    setProcessing(requestId);
    try {
      const res = await fetch(`/api/web/teams/${id}/members`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId, action }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.message ?? "처리 중 오류가 발생했습니다.");
        return;
      }
      // 목록에서 제거
      setRequests((prev) => prev.filter((r) => r.id !== requestId));
    } catch {
      alert("네트워크 오류가 발생했습니다.");
    } finally {
      setProcessing(null);
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold sm:text-2xl">멤버 관리</h1>
          <p className="mt-0.5 text-sm text-[var(--color-text-muted)]">가입 신청 처리</p>
        </div>
        <Link
          href={`/teams/${id}`}
          className="rounded-full border border-[var(--color-border)] px-4 py-2 text-sm text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-surface-bright)]"
        >
          팀 상세로
        </Link>
      </div>

      {loading && (
        <div className="py-12 text-center text-sm text-[var(--color-text-secondary)]">불러오는 중...</div>
      )}

      {!loading && error && (
        <div className="rounded-[16px] bg-red-50 px-5 py-4 text-sm text-red-600">{error}</div>
      )}

      {!loading && !error && requests.length === 0 && (
        <div className="rounded-[16px] bg-[var(--color-card)] py-16 text-center">
          <div className="mb-2 text-4xl">🏀</div>
          <p className="text-sm text-[var(--color-text-secondary)]">대기 중인 가입 신청이 없습니다.</p>
        </div>
      )}

      {!loading && !error && requests.length > 0 && (
        <div className="space-y-3">
          {requests.map((req) => {
            const displayName = req.user?.nickname ?? req.user?.name ?? "신청자";
            const location = [req.user?.city, req.user?.district].filter(Boolean).join(" ");
            const isProcessing = processing === req.id;

            return (
              <div
                key={req.id}
                className="rounded-[16px] bg-[var(--color-card)] p-5"
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-[var(--color-surface-bright)] text-lg font-bold text-[var(--color-accent)]">
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-[var(--color-text-primary)]">{displayName}</p>
                      {req.user?.position && (
                        <span className="rounded-full bg-[var(--color-surface-bright)] px-2 py-0.5 text-xs text-[var(--color-accent)]">
                          {req.user.position}
                        </span>
                      )}
                    </div>
                    {location && (
                      <p className="mt-0.5 text-xs text-[var(--color-text-secondary)]">📍 {location}</p>
                    )}
                    {req.message && (
                      <p className="mt-2 rounded-[8px] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text-muted)]">
                        {req.message}
                      </p>
                    )}
                    <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
                      신청일: {new Date(req.created_at).toLocaleDateString("ko-KR", { timeZone: "Asia/Seoul" })}
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex gap-2">
                  <Button
                    className="flex-1"
                    disabled={isProcessing}
                    onClick={() => handleAction(req.id, "approve")}
                  >
                    {isProcessing ? "처리 중..." : "승인"}
                  </Button>
                  <Button
                    variant="secondary"
                    className="flex-1"
                    disabled={isProcessing}
                    onClick={() => handleAction(req.id, "reject")}
                  >
                    거부
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
