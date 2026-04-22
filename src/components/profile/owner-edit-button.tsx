import Link from "next/link";

/**
 * OwnerEditButton — 본인 프로필 "프로필 편집" 진입 버튼 (공용)
 *
 * 왜 공용으로 뽑았나:
 * - `/profile` 대시보드와 `/users/[id]` 본인 분기(ProfileHero actionSlot)에서
 *   동일한 JSX가 2곳 중복이었다.
 * - 스타일(border/color/padding)과 기본 링크 대상(`/profile/edit`)이
 *   양쪽에서 같아 "미세한 편차"가 생기기 전에 한 곳으로 통합.
 *
 * 어떻게:
 * - props.href가 없으면 기본 `/profile/edit` 사용 (L2 설계: 편집 경로 단일화).
 * - Material Symbols Outlined `edit` 아이콘 + "프로필 편집" 텍스트.
 * - 하드코딩 색상 금지 — border/color는 CSS 변수(var(--color-*))만 사용.
 */

interface OwnerEditButtonProps {
  /** 이동 경로. 생략 시 `/profile/edit`. */
  href?: string;
}

export function OwnerEditButton({ href = "/profile/edit" }: OwnerEditButtonProps) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1.5 rounded border px-4 py-2 text-sm font-semibold transition-colors hover:bg-[var(--color-surface-bright,var(--color-surface))]"
      style={{
        borderColor: "var(--color-primary)",
        color: "var(--color-primary)",
        borderRadius: "4px",
      }}
    >
      <span className="material-symbols-outlined text-base">edit</span>
      프로필 편집
    </Link>
  );
}
