import Link from "next/link";
import { Calendar } from "lucide-react";
import { SectionWrapper } from "./section-wrapper";

interface Game {
  id: string;
  title: string | null;
  scheduled_at: string | null;
  status: number;
}

export function RecentGamesSection({ games }: { games: Game[] }) {
  const items = games.slice(0, 3);
  return (
    <SectionWrapper
      title="최근 경기"
      href="/games/my-games"
      isEmpty={items.length === 0}
      emptyText="참여한 경기가 없습니다. 새로운 경기를 찾아보세요!"
    >
      <div className="space-y-2">
        {items.map((g) => (
          <Link
            key={g.id}
            href={`/games/${g.id.slice(0, 8)}`}
            className="flex items-center gap-3 rounded-[12px] border border-[#E8ECF0] bg-[#F9FAFB] px-3 py-2.5 transition-colors hover:bg-[#EEF2FF]"
          >
            <Calendar size={14} className="flex-shrink-0 text-[#F4A261]" />
            <span className="flex-1 truncate text-sm text-[#111827]">{g.title ?? "경기"}</span>
            <span className="text-xs text-[#9CA3AF]">
              {g.scheduled_at ? new Date(g.scheduled_at).toLocaleDateString("ko-KR") : "-"}
            </span>
          </Link>
        ))}
      </div>
    </SectionWrapper>
  );
}
