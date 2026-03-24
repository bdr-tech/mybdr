"use client";

import { useState } from "react";

export function CopyLinkButton({ slug }: { slug: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    const url = `${window.location.origin}/series/${slug}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      onClick={handleCopy}
      className="flex-shrink-0 rounded-full border border-[#E8ECF0] px-3 py-1.5 text-xs text-[#6B7280] hover:border-[#1B3C87] hover:text-[#1B3C87] transition-colors"
    >
      {copied ? "✓ 복사됨" : "🔗 공개 링크"}
    </button>
  );
}
