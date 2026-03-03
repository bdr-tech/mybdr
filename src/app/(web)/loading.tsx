export default function WebLoading() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="rounded-[24px] bg-[#E8ECF0] h-48" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-[16px] bg-white border border-[#E8ECF0] h-24" />
        ))}
      </div>
    </div>
  );
}
