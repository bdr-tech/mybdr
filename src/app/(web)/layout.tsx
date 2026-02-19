import { Header } from "@/components/shared/header";

export default function WebLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      <Header />
      <main className="mx-auto max-w-7xl px-4 pb-24 pt-6 md:pb-6">
        {children}
      </main>
    </div>
  );
}
