import Link from "next/link";

/* ============================================================
 * 단체 상세 - 임원진 탭 v2 (Server Component)
 *
 * 이유(왜):
 *  - 시안은 4열 그리드 (회장/부회장/총무/심판장 등). 우리 DB의
 *    organization_members.role 은 owner/admin/member 3종뿐 → 직책
 *    세분화는 "추후 구현 목록"에 등록 (회장/부회장/총무 etc).
 *  - 그래서 임시로:
 *      role = owner  → "주최자"
 *      role = admin  → "운영진"
 *      role = member → "멤버"
 *    로 한국어 라벨링만 입혀서 시안 모양을 살린다.
 *
 * 방법(어떻게):
 *  - 부모 page.tsx 가 이미 fetch한 members(top 20) 를 그대로 받아 사용.
 *  - since 라벨은 created_at 의 연도(YYYY) 만 표기.
 * ============================================================ */

interface MemberItem {
  id: bigint;
  role: string;
  user: {
    id: number;
    nickname: string | null;
    profile_image_url: string | null;
  };
  // created_at 은 추후 since 라벨용. (부모에서 별도 select 해줄 것)
  created_at?: Date;
}

interface MembersTabV2Props {
  members: MemberItem[];
}

// role → 한국어 라벨 (조직 직책 컬럼 미존재 → fallback)
function roleLabel(role: string): string {
  switch (role) {
    case "owner":
      return "주최자";
    case "admin":
      return "운영진";
    default:
      return "멤버";
  }
}

export function MembersTabV2({ members }: MembersTabV2Props) {
  if (members.length === 0) {
    return (
      <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] py-16 text-center">
        <span className="material-symbols-outlined text-4xl text-[var(--color-text-disabled)]">
          group
        </span>
        <p className="mt-2 text-sm text-[var(--color-text-muted)]">
          아직 등록된 임원이 없습니다.
        </p>
      </div>
    );
  }

  return (
    // 시안 4열 고정. 모바일은 2열로 자연스럽게 축소
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {members.map((m) => {
        const sinceYear =
          m.created_at instanceof Date
            ? m.created_at.getFullYear()
            : m.created_at
              ? new Date(m.created_at).getFullYear()
              : null;
        const initial = (m.user.nickname || "?").charAt(0);
        return (
          <Link
            key={m.id.toString()}
            href={`/users/${m.user.id}`}
            className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-[18px] text-center transition-colors hover:border-[var(--color-primary)]"
          >
            {/* 64px 원형 아바타 (이미지 또는 이니셜) */}
            {m.user.profile_image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={m.user.profile_image_url}
                alt={m.user.nickname || ""}
                className="mx-auto mb-2.5 h-16 w-16 rounded-full object-cover"
              />
            ) : (
              <div className="mx-auto mb-2.5 grid h-16 w-16 place-items-center rounded-full bg-[var(--color-text-secondary)] text-xl font-bold text-[var(--color-bg)]">
                {initial}
              </div>
            )}
            {/* 이름 */}
            <div className="text-sm font-bold text-[var(--color-text-primary)]">
              {m.user.nickname || "이름 없음"}
            </div>
            {/* role 라벨 (시안 accent 색) */}
            <div className="mt-0.5 text-xs font-semibold text-[var(--color-primary)]">
              {roleLabel(m.role)}
            </div>
            {/* since YYYY (created_at 없을 땐 "준비 중") */}
            <div
              className="mt-1 text-[11px] text-[var(--color-text-muted)]"
              style={{ fontFamily: "var(--font-space-grotesk), monospace" }}
            >
              {sinceYear ? `since ${sinceYear}` : "since 준비 중"}
            </div>
          </Link>
        );
      })}
    </div>
  );
}
