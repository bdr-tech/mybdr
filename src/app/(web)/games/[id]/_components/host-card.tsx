// 호스트 정보 카드: 프로필 이미지 + 호스트명 + Contact Host 버튼
// 디자인 시안 - 네이비 배경 (CSS 변수 --color-accent 사용)

interface HostCardProps {
  organizerName: string | null;
}

export function HostCard({ organizerName }: HostCardProps) {
  return (
    <div className="bg-[var(--color-accent)] p-6 rounded-xl text-white">
      <div className="flex items-center gap-4 mb-4">
        {/* 호스트 아바타 placeholder (DB에 이미지 없으므로 이니셜 표시) */}
        <div className="w-12 h-12 rounded-full bg-white/20 border-2 border-white/20 flex items-center justify-center text-white font-bold text-lg">
          {/* 이름 첫 글자를 이니셜로 사용 */}
          {organizerName ? organizerName.charAt(0).toUpperCase() : "H"}
        </div>
        <div>
          <div className="text-xs text-white/60">Managed by</div>
          <div className="font-bold">{organizerName || "Host"}</div>
        </div>
      </div>
      {/* Contact Host 아웃라인 버튼 */}
      <button className="w-full py-2 border border-white/20 rounded text-xs font-bold hover:bg-white/10 transition-colors">
        Contact Host
      </button>
    </div>
  );
}
