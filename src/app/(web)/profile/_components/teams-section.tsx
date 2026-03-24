import Link from "next/link";
// lucide-react 제거 → Material Symbols Outlined 사용
import { Badge } from "@/components/ui/badge";
import { SectionWrapper } from "./section-wrapper";

interface Team {
  id: string;
  name: string;
  role: string;
}

export function TeamsSection({ teams }: { teams: Team[] }) {
  const items = teams.slice(0, 3);
  return (
    <SectionWrapper
      title="내 팀"
      href="/teams"
      isEmpty={items.length === 0}
      emptyText="소속 팀이 없습니다. 팀에 가입해보세요!"
    >
      <div className="space-y-2">
        {items.map((t) => (
          /* 리스트 아이템: 테두리/배경 CSS 변수 */
          <Link
            key={t.id}
            href={`/teams/${t.id}`}
            className="flex items-center gap-3 rounded-[12px] border px-3 py-2.5 transition-colors"
            style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-elevated)' }}
          >
            <span className="material-symbols-outlined flex-shrink-0 text-sm" style={{ color: 'var(--color-primary)' }}>group</span>
            <span className="flex-1 truncate text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>{t.name}</span>
            <Badge>{t.role === "captain" ? "주장" : "멤버"}</Badge>
          </Link>
        ))}
      </div>
    </SectionWrapper>
  );
}
