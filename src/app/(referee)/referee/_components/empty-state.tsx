import Link from "next/link";

/**
 * 심판 프로필 미등록 상태 등에서 공통으로 사용할 CTA 카드.
 * 아이콘/제목/설명/버튼 텍스트를 props로 받아 재사용 가능하도록 함.
 */

type EmptyStateProps = {
  icon: string; // Material Symbols ligature
  title: string;
  description: string;
  ctaText: string;
  ctaHref: string;
};

export function EmptyState({
  icon,
  title,
  description,
  ctaText,
  ctaHref,
}: EmptyStateProps) {
  return (
    <div
      className="flex flex-col items-center justify-center px-6 py-16 text-center"
      style={{
        backgroundColor: "var(--color-card)",
        border: "1px solid var(--color-border)",
        borderRadius: 4,
      }}
    >
      <span
        className="material-symbols-outlined text-5xl"
        style={{ color: "var(--color-text-muted)" }}
      >
        {icon}
      </span>
      <h2
        className="mt-4 text-lg font-bold"
        style={{ color: "var(--color-text-primary)" }}
      >
        {title}
      </h2>
      <p
        className="mt-2 max-w-sm text-sm"
        style={{ color: "var(--color-text-muted)" }}
      >
        {description}
      </p>
      <Link
        href={ctaHref}
        className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 text-sm font-bold uppercase tracking-wide"
        style={{
          backgroundColor: "var(--color-primary)",
          color: "var(--color-text-on-primary, #fff)",
          borderRadius: 4,
        }}
      >
        <span className="material-symbols-outlined text-base">add</span>
        {ctaText}
      </Link>
    </div>
  );
}
