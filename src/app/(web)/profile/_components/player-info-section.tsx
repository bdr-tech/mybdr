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
    <div className="rounded-[20px] border border-[#E8ECF0] bg-[#FFFFFF] p-4 sm:p-5 shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
      <h2
        className="mb-3 text-base font-bold uppercase tracking-wide text-[#111827]"
        style={{ fontFamily: "var(--font-heading)" }}
      >
        선수 정보
      </h2>
      <div className="space-y-2.5">
        {rows.map((r) => (
          <div key={r.label} className="flex justify-between text-sm">
            <span className="text-[#9CA3AF]">{r.label}</span>
            <span className="text-[#111827]">{r.value}</span>
          </div>
        ))}
      </div>
      {bio && (
        <div className="mt-3 rounded-[12px] bg-[#F9FAFB] px-4 py-3 text-sm leading-relaxed text-[#374151]">
          {bio}
        </div>
      )}
    </div>
  );
}
