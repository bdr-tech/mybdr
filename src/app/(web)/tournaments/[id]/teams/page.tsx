// 고아 라우트: /tournaments/[id]/teams
// next.config.ts의 redirects()가 먼저 308로 인터셉트.
// 참가팀 탭으로 리다이렉트한다.
import { redirect } from "next/navigation";

export default async function TournamentTeamsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/tournaments/${id}?tab=teams`);
}
