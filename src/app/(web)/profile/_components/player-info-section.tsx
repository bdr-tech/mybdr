interface PlayerInfoProps {
  position: string | null;
  height: number | null;
  city: string | null;
  bio: string | null;
}

export function PlayerInfoSection({ position, height, city, bio }: PlayerInfoProps) {
  const rows = [
    { label: "포지션", value: position?.split(",").join(" / ") },
    { label: "키", value: height ? `${height}cm` : null },
    { label: "지역", value: city?.split(",").join(" / ") },
  ].filter((r) => r.value);

  return (
    /* 카드 외형: CSS 변수 */
    <div className="rounded-[20px] border p-4 sm:p-5" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-card)', boxShadow: 'var(--shadow-card)' }}>
      <h2
        className="mb-3 text-base font-bold uppercase tracking-wide"
        style={{ fontFamily: "var(--font-heading)", color: 'var(--color-text-primary)' }}
      >
        선수 정보
      </h2>
      <div className="space-y-2.5">
        {rows.map((r) => (
          <div key={r.label} className="flex justify-between text-sm">
            {/* 라벨: muted 색상 */}
            <span style={{ color: 'var(--color-text-muted)' }}>{r.label}</span>
            <span style={{ color: 'var(--color-text-primary)' }}>{r.value}</span>
          </div>
        ))}
      </div>
      {bio && (
        /* 자기소개 배경: elevated 색상 */
        <div className="mt-3 rounded-[12px] px-4 py-3 text-sm leading-relaxed" style={{ backgroundColor: 'var(--color-elevated)', color: 'var(--color-text-primary)' }}>
          {bio}
        </div>
      )}
    </div>
  );
}
