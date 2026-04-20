// 고아 라우트: /tournaments/[id]/bracket
// next.config.ts의 redirects()가 먼저 308로 인터셉트하므로 이 파일은 실질적으로 미사용.
// 하지만 Next.js의 라우트 매핑이 바뀔 때를 대비한 안전망으로 유지.
// 여기서도 동일하게 메인 상세 ?tab=bracket 경로로 리다이렉트한다.
import { redirect } from "next/navigation";

export default async function BracketPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  // Next.js App Router의 redirect()는 기본적으로 307(임시)이지만,
  // next.config의 redirects가 먼저 308(영구)로 처리하므로 SEO 영향은 거기서 보장.
  redirect(`/tournaments/${id}?tab=bracket`);
}
