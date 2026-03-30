"use client";

import { useToast } from "@/contexts/toast-context";

export function CopyLinkButton({ slug }: { slug: string }) {
  const { showToast } = useToast();

  async function handleCopy() {
    const url = `${window.location.origin}/series/${slug}`;
    try {
      await navigator.clipboard.writeText(url);
      showToast("링크가 복사되었습니다", "success");
    } catch {
      showToast("링크 복사에 실패했습니다", "error");
    }
  }

  return (
    <button
      onClick={handleCopy}
      className="flex-shrink-0 rounded-full border border-[var(--color-border)] px-3 py-1.5 text-xs text-[var(--color-text-muted)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] transition-colors"
    >
      링크 복사
    </button>
  );
}
