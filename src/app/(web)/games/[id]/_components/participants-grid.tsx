// 참여자 아바타 그리드: 승인된 참가자를 원형 아바타로 표시
// 디자인 시안(bdr_2, bdr_6) 기반 - 빈 자리는 dashed 테두리 + person_add 아이콘

interface Participant {
  id: string;
  nickname: string | null;
  name: string | null;
}

interface ParticipantsGridProps {
  participants: Participant[];
  maxParticipants: number | null;
}

// 이름의 첫 글자를 이니셜로 반환하는 헬퍼
function getInitial(nickname: string | null, name: string | null): string {
  const display = nickname || name || "?";
  return display.charAt(0).toUpperCase();
}

export function ParticipantsGrid({ participants, maxParticipants }: ParticipantsGridProps) {
  const max = maxParticipants ?? 0;
  // 빈 자리 수 계산 (최대 6개까지만 표시)
  const emptySlots = max > 0 ? Math.min(max - participants.length, 6) : 0;

  return (
    <section className="bg-[var(--color-card)] p-6 rounded-xl border border-[var(--color-border)] shadow-sm">
      {/* 제목 + 현재/최대 인원 */}
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-[var(--color-accent)] dark:text-[var(--color-game-guest)] font-bold text-xl">
          참여자 명단 (Participants)
        </h3>
        <span className="text-sm text-[var(--color-text-muted)]">
          {participants.length} / {max || "~"} 명 신청
        </span>
      </div>

      {/* 아바타 그리드 */}
      <div className="flex flex-wrap gap-4">
        {/* 승인된 참가자 아바타 */}
        {participants.map((p) => (
          <div key={p.id} className="group relative">
            {/* 이니셜 아바타 (DB에 프로필 이미지 없으므로) */}
            <div className="w-12 h-12 rounded-full bg-[var(--color-surface)] border-2 border-[var(--color-border)] shadow-sm ring-2 ring-transparent group-hover:ring-[var(--color-primary)] transition-all flex items-center justify-center text-sm font-bold text-[var(--color-text-primary)]">
              {getInitial(p.nickname, p.name)}
            </div>
            {/* 온라인 표시 (첫 번째 참가자만 데모용) */}
          </div>
        ))}

        {/* 빈 자리 표시 */}
        {emptySlots > 0 &&
          Array.from({ length: emptySlots }).map((_, i) => (
            <div
              key={`empty-${i}`}
              className="w-12 h-12 rounded-full border-2 border-dashed border-[var(--color-border)] flex items-center justify-center text-[var(--color-border)]"
            >
              <span className="material-symbols-outlined text-sm">person_add</span>
            </div>
          ))}
      </div>

      {/* 참가자가 없을 때 */}
      {participants.length === 0 && (
        <p className="text-sm text-[var(--color-text-muted)] mt-2">
          아직 승인된 참가자가 없습니다.
        </p>
      )}
    </section>
  );
}
