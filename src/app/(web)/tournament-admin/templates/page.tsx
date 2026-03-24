import { Card } from "@/components/ui/card";

export default function TournamentAdminTemplatesPage() {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-extrabold uppercase tracking-wide sm:text-3xl" style={{ fontFamily: "var(--font-heading)" }}>사이트 템플릿</h1>
      <div className="grid gap-4 sm:grid-cols-3">
        {["기본형", "리그형", "토너먼트형"].map((t) => (
          <Card key={t} className="text-center hover:bg-[var(--color-elevated)] transition-colors cursor-pointer">
            <div className="mb-4 aspect-video rounded-[12px] bg-[var(--color-elevated)]" />
            <h3 className="font-semibold">{t}</h3>
            <p className="mt-1 text-sm text-[var(--color-text-muted)]">대회 전용 사이트 템플릿</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
