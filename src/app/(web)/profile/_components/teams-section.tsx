import Link from "next/link";
import { Users } from "lucide-react";
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
          <Link
            key={t.id}
            href={`/teams/${t.id}`}
            className="flex items-center gap-3 rounded-[12px] border border-[#E8ECF0] bg-[#F9FAFB] px-3 py-2.5 transition-colors hover:bg-[#EEF2FF]"
          >
            <Users size={14} className="flex-shrink-0 text-[#1B3C87]" />
            <span className="flex-1 truncate text-sm font-medium text-[#111827]">{t.name}</span>
            <Badge>{t.role === "captain" ? "주장" : "멤버"}</Badge>
          </Link>
        ))}
      </div>
    </SectionWrapper>
  );
}
