"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function NewSeriesPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 이름 기반 slug 미리보기
  const slugPreview = name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-") || "series";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/web/series", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), description: description.trim() }),
      });
      const data = await res.json() as { id?: string; error?: string };

      if (res.ok && data.id) {
        router.push(`/tournament-admin/series/${data.id}`);
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
      <h1 className="mb-6 text-xl font-bold sm:text-2xl">새 시리즈 만들기</h1>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* 시리즈 이름 */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[var(--color-text-primary)]">
              시리즈 이름 <span className="text-[var(--color-error)]">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="예: BDR 서울 올스타전"
              className="w-full rounded-[12px] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm outline-none focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)]"
              required
              autoFocus
            />
            {name && (
              <p className="mt-1.5 text-xs text-[var(--color-text-muted)]">
                URL 경로: /series/<span className="font-mono text-[var(--color-text-muted)]">{slugPreview}-xxxxx</span>
              </p>
            )}
          </div>

          {/* 한 줄 설명 (선택) */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[var(--color-text-primary)]">
              한 줄 설명 <span className="text-[var(--color-text-muted)] font-normal">(선택)</span>
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="예: 매분기 진행되는 BDR 정기 대회"
              className="w-full rounded-[12px] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm outline-none focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)]"
            />
          </div>

          {error && (
            <p className="rounded-[12px] bg-[rgba(239,68,68,0.1)] px-4 py-3 text-sm text-[var(--color-error)]">
              {error}
            </p>
          )}

          <Button
            type="submit"
            disabled={!name.trim() || loading}
            className="w-full py-3"
          >
            {loading ? "생성 중..." : "시리즈 만들기"}
          </Button>
        </form>
      </Card>

      <p className="mt-4 text-center text-xs text-[var(--color-text-muted)]">
        시리즈 생성 후 회차(1회, 2회...)를 추가할 수 있습니다.
      </p>
    </div>
  );
}
