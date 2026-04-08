import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getWebSession } from "@/lib/auth/web-session";
import { NewTeamForm } from "./new-team-form";

// SEO: 팀 생성 페이지 메타데이터
export const metadata: Metadata = {
  title: "팀 만들기 | MyBDR",
  description: "나만의 농구 팀을 만들고 팀원을 모집하세요.",
};

export default async function NewTeamPage() {
  const session = await getWebSession();
  if (!session) redirect("/login");

  return <NewTeamForm />;
}
