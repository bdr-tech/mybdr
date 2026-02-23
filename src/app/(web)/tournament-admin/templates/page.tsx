import { Card } from "@/components/ui/card";

export default function TournamentAdminTemplatesPage() {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">사이트 템플릿</h1>
      <div className="grid gap-4 sm:grid-cols-3">
        {["기본형", "리그형", "토너먼트형"].map((t) => (
          <Card key={t} className="text-center hover:bg-[#EEF2FF] transition-colors cursor-pointer">
            <div className="mb-4 aspect-video rounded-[12px] bg-[#EEF2FF]" />
            <h3 className="font-semibold">{t}</h3>
            <p className="mt-1 text-sm text-[#6B7280]">대회 전용 사이트 템플릿</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
