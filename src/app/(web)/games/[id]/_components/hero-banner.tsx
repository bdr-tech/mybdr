import type { games } from "@prisma/client";

// 히어로 배너: 경기장 이미지 + 그라디언트 오버레이 + MATCH DAY 배지 + 경기장명 + 위치
// 디자인 시안(bdr_2, bdr_6) 기반 - CSS 변수로 다크/라이트 자동 전환

interface HeroBannerProps {
  game: Pick<
    games,
    | "title"
    | "venue_name"
    | "venue_address"
    | "city"
    | "district"
    | "status"
  >;
}

// 경기 상태에 따른 배지 텍스트 매핑
const STATUS_BADGE: Record<number, { text: string; color: string }> = {
  1: { text: "MATCH DAY", color: "bg-[var(--color-primary)]" },       // 모집중
  3: { text: "LIVE NOW", color: "bg-[var(--color-primary)]" },         // 진행중
  2: { text: "CLOSED", color: "bg-gray-500" },            // 마감
  4: { text: "COMPLETED", color: "bg-gray-500" },         // 완료
  5: { text: "CANCELLED", color: "bg-gray-500" },         // 취소
};

export function HeroBanner({ game }: HeroBannerProps) {
  // 장소 문자열 조합 (시 + 구 + 장소명 중 존재하는 것만)
  const locationText = [game.city, game.district].filter(Boolean).join(", ");
  // 배지 정보 (기본값: MATCH DAY)
  const badge = STATUS_BADGE[game.status] ?? STATUS_BADGE[1];

  return (
    <section className="relative h-64 md:h-[400px] rounded-xl overflow-hidden shadow-lg group">
      {/* 경기장 placeholder 이미지 - DB에 이미지 필드가 없으므로 그라디언트 배경 사용 */}
      <div className="w-full h-full bg-gradient-to-br from-[var(--color-accent)] to-[var(--color-surface-lowest)] transition-transform duration-700 group-hover:scale-105" />

      {/* 그라디언트 오버레이: 하단에서 어두워지는 효과 */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-6 md:p-10">
        {/* 상태 배지 */}
        <span className={`inline-block px-3 py-1 ${badge.color} text-white text-xs font-bold rounded mb-3 w-fit`}>
          {badge.text}
        </span>

        {/* 경기장/경기 이름 (큰 텍스트, Space Grotesk 느낌) */}
        <h2
          className="text-white text-3xl md:text-5xl font-bold mb-2 uppercase tracking-wide"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          {game.venue_name || game.title || "GAME VENUE"}
        </h2>

        {/* 위치 정보: Material Symbols 아이콘 + 주소 */}
        {(locationText || game.venue_address) && (
          <p className="text-white/80 flex items-center gap-2 font-medium">
            <span className="material-symbols-outlined text-sm">location_on</span>
            {game.venue_address || locationText}
          </p>
        )}
      </div>
    </section>
  );
}
