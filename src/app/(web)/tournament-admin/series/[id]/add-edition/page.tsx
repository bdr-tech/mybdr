"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function AddEditionPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();

  const [startDate, setStartDate] = useState("");
  const [venueName, setVenueName] = useState("");
  const [maxTeams, setMaxTeams] = useState(8);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!startDate) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/web/series/${id}/editions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ startDate, venueName: venueName.trim(), maxTeams }),
      });
      const data = await res.json() as { success?: boolean; editionNumber?: number; redirectUrl?: string; error?: string };

      if (res.ok && data.success) {
        router.push(`/tournament-admin/series/${id}?added=${data.editionNumber}`);
      } else {
        setError(data.error ?? "오류가 발생했습니다.");
        setLoading(false);
      }
    } catch {
      setError("네트워크 오류가 발생했습니다.");
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg">
      <Link href={`/tournament-admin/series/${id}`} className="mb-4 inline-block text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-muted)]">
        ← 시리즈로 돌아가기
      </Link>
      <h1 className="mb-6 text-xl font-bold sm:text-2xl">새 회차 추가</h1>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* 날짜 */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[var(--color-text-primary)]">
              대회 날짜 <span className="text-[var(--color-error)]">*</span>
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full rounded-[12px] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-4 text-sm outline-none focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)]"
              required
              autoFocus
            />
          </div>

          {/* 장소 */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[var(--color-text-primary)]">
              장소 <span className="text-[var(--color-text-muted)] font-normal">(선택)</span>
            </label>
            <input
              type="text"
              value={venueName}
              onChange={(e) => setVenueName(e.target.value)}
              placeholder="예: 강남구민체육센터"
              className="w-full rounded-[12px] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-4 text-sm outline-none focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)]"
            />
          </div>

          {/* 최대 팀 수 */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[var(--color-text-primary)]">
              최대 참가 팀 수
            </label>
            <input
              type="number"
              inputMode="numeric"
              value={maxTeams}
              onChange={(e) => setMaxTeams(Math.max(2, Number(e.target.value)))}
              min={2}
              max={64}
              className="w-full rounded-[12px] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-4 text-sm outline-none focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)]"
            />
            <p className="mt-1.5 text-xs text-[var(--color-text-muted)]">기본값 8팀, 최대 64팀</p>
          </div>

          {error && (
            <p className="rounded-[12px] bg-[rgba(239,68,68,0.1)] px-4 py-3 text-sm text-[var(--color-error)]">
              {error}
            </p>
          )}

          <Button
            type="submit"
            disabled={!startDate || loading}
            className="w-full py-4"
          >
            {loading ? "추가 중..." : "회차 추가하기"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
