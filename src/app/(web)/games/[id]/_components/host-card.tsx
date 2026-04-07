// 호스트 정보 카드: 프로필 이미지 + 호스트명 + Contact Host 버튼

interface HostCardProps {
  organizerName: string | null;
  contactPhone: string | null;
}

export function HostCard({ organizerName, contactPhone }: HostCardProps) {
  return (
    <div className="bg-[var(--color-accent)] p-6 rounded-md text-white">
      <div className="flex items-center gap-4 mb-4">
        <div className="w-12 h-12 rounded-full bg-white/20 border-2 border-white/20 flex items-center justify-center text-white font-bold text-lg">
          {organizerName ? organizerName.charAt(0).toUpperCase() : "H"}
        </div>
        <div>
          <div className="text-xs text-white/60">Managed by</div>
          <div className="font-bold">{organizerName || "Host"}</div>
        </div>
      </div>
      {contactPhone ? (
        <a
          href={`tel:${contactPhone}`}
          className="block w-full py-2 border border-white/20 rounded text-xs font-bold text-center hover:bg-white/10 transition-colors"
        >
          📞 전화 연결
        </a>
      ) : (
        <button
          disabled
          className="w-full py-2 border border-white/20 rounded text-xs font-bold opacity-40 cursor-not-allowed"
        >
          연락처 미등록
        </button>
      )}
    </div>
  );
}
