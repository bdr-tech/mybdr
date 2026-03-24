import Link from "next/link";

export function BracketEmpty({ tournamentId }: { tournamentId: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-[16px] border border-[#E8ECF0] bg-white py-16 px-6 text-center shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
      <div className="mb-4 text-4xl">🏆</div>
      <h2 className="mb-2 text-lg font-semibold text-[#111827]">
        아직 대진표가 없습니다
      </h2>
      <p className="mb-6 text-sm text-[#6B7280]">
        대회 주최자가 대진표를 생성하면 여기에 표시됩니다.
      </p>
      <Link
        href={`/tournaments/${tournamentId}/teams`}
        className="rounded-full bg-[#1B3C87] px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#142D6B]"
      >
        참가팀 보러가기
      </Link>
    </div>
  );
}
