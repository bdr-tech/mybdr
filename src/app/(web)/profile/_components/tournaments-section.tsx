import Link from "next/link";
import { TOURNAMENT_STATUS_LABEL } from "@/lib/constants/tournament-status";
import { SectionWrapper } from "./section-wrapper";

interface Tournament {
  id: string;
  name: string;
  status: string | null;
}

export function TournamentsSection({ tournaments }: { tournaments: Tournament[] }) {
  const items = tournaments.slice(0, 3);
  return (
    <SectionWrapper
      title="대회"
      href="/tournaments"
      isEmpty={items.length === 0}
      emptyText="참가한 대회가 없습니다. 대회에 도전해보세요!"
    >
      <div className="space-y-2">
        {items.map((t, i) => (
          /* 리스트 아이템: 테두리/배경 CSS 변수, 트로피 아이콘 accent */
          <Link
            key={`${t.id}-${i}`}
            href={`/tournaments/${t.id}`}
            className="flex items-center gap-3 rounded-[12px] border px-3 py-2.5 transition-colors"
            style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-elevated)' }}
          >
            <span className="material-symbols-outlined flex-shrink-0 text-sm" style={{ color: 'var(--color-accent)' }}>emoji_events</span>
            <span className="flex-1 truncate text-sm" style={{ color: 'var(--color-text-primary)' }}>{t.name}</span>
            <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
              {TOURNAMENT_STATUS_LABEL[t.status ?? ""] ?? t.status ?? "-"}
            </span>
          </Link>
        ))}
      </div>
    </SectionWrapper>
  );
}
