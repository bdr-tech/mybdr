export default function GameDetailLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* 메인 카드 */}
      <div className="rounded-[16px] bg-white border border-[#E8ECF0] p-6">
        <div className="mb-4 flex gap-2">
          <div className="h-6 w-14 rounded-full bg-[#E8ECF0]" />
          <div className="h-6 w-14 rounded-full bg-[#E8ECF0]" />
        </div>
        <div className="mb-4 h-8 w-2/3 rounded-[8px] bg-[#E8ECF0]" />
        <div className="space-y-2">
          <div className="h-4 w-full rounded bg-[#E8ECF0]" />
          <div className="h-4 w-3/4 rounded bg-[#E8ECF0]" />
          <div className="h-4 w-1/2 rounded bg-[#E8ECF0]" />
        </div>
        <div className="mt-6 h-11 w-full rounded-[12px] bg-[#E8ECF0]" />
      </div>

      {/* 참가자 카드 */}
      <div className="rounded-[16px] bg-white border border-[#E8ECF0] p-6">
        <div className="mb-4 h-6 w-32 rounded bg-[#E8ECF0]" />
        <div className="space-y-2">
          <div className="h-10 w-full rounded-[12px] bg-[#E8ECF0]" />
          <div className="h-10 w-full rounded-[12px] bg-[#E8ECF0]" />
        </div>
      </div>
    </div>
  );
}
