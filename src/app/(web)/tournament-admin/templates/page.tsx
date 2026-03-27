import { Card } from "@/components/ui/card";

// 템플릿 기능은 아직 준비 중 — 하드코딩 카드 제거
export default function TournamentAdminTemplatesPage() {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-extrabold uppercase tracking-wide sm:text-3xl" style={{ fontFamily: "var(--font-heading)" }}>사이트 템플릿</h1>
      <Card className="py-16 text-center">
        <span className="material-symbols-outlined mb-3 text-4xl text-[var(--color-text-muted)]">construction</span>
        <p className="text-lg font-semibold text-[var(--color-text-primary)]">준비 중</p>
        <p className="mt-2 text-sm text-[var(--color-text-muted)]">
          사이트 템플릿 기능을 준비하고 있습니다.<br />
          조금만 기다려 주세요.
        </p>
      </Card>
    </div>
  );
}
