import { prisma } from "@/lib/db/prisma";
import { Card } from "@/components/ui/card";
import Link from "next/link";

export const dynamic = "force-dynamic";

const SEVERITY_COLOR: Record<string, string> = {
  info: "text-[var(--color-text-muted)]",
  warning: "text-[var(--color-warning)]",
  error: "text-[var(--color-error)]",
};

const ACTION_LABEL: Record<string, string> = {
  "user.role_change": "역할 변경",
  "user.status_change": "상태 변경",
  "plan.create": "요금제 생성",
  "plan.update": "요금제 수정",
  "plan.deactivate": "요금제 비활성화",
  "plan.delete": "요금제 삭제",
  "tournament.status_change": "대회 상태 변경",
  "settings.cache_clear": "캐시 초기화",
  "settings.maintenance_toggle": "점검모드 변경",
};

function toKSTDate(date: Date): string {
  // YYYY-MM-DD (KST)
  const s = date.toLocaleDateString("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  // ko-KR: "2026. 02. 23." → "2026-02-23"
  return s.replace(/\. /g, "-").replace(/\.$/, "").replace(/\./g, "");
}

function toKSTTime(date: Date): string {
  return date.toLocaleTimeString("ko-KR", { timeZone: "Asia/Seoul", hour: "2-digit", minute: "2-digit" });
}

function toKSTFull(date: Date): string {
  return date.toLocaleString("ko-KR", { timeZone: "Asia/Seoul" });
}

// FR-066: 관리자 활동 로그 (날짜별 마크다운 뷰)
export default async function AdminLogsPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const { date: dateFilter } = await searchParams;

  let whereClause = {};
  if (dateFilter) {
    // KST 날짜 → UTC 범위로 변환
    const kstStart = new Date(`${dateFilter}T00:00:00+09:00`);
    const kstEnd = new Date(`${dateFilter}T23:59:59+09:00`);
    whereClause = { created_at: { gte: kstStart, lte: kstEnd } };
  }

  const logs = await prisma.admin_logs.findMany({
    where: whereClause,
    orderBy: { created_at: "desc" },
    take: 200,
    include: { users: { select: { nickname: true, email: true } } },
  }).catch(() => []);

  // 날짜별 그룹핑 (KST 기준)
  type LogEntry = (typeof logs)[number];
  const grouped = new Map<string, LogEntry[]>();
  for (const log of logs) {
    const dateKey = toKSTDate(log.created_at);
    if (!grouped.has(dateKey)) grouped.set(dateKey, []);
    grouped.get(dateKey)!.push(log);
  }

  const availableDates = Array.from(grouped.keys()).sort((a, b) => b.localeCompare(a));

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold uppercase tracking-wide sm:text-3xl" style={{ fontFamily: "var(--font-heading)" }}>활동 로그</h1>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            {dateFilter ? `${dateFilter} 로그` : "최근 200건"} · 총 {logs.length}건
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {dateFilter && (
            <Link
              href="/admin/logs"
              className="rounded-[10px] border border-[var(--color-border)] px-3 py-1.5 text-sm text-[var(--color-text-muted)] hover:bg-[var(--color-elevated)]"
            >
              전체 보기
            </Link>
          )}
          {availableDates.slice(0, 7).map((d) => (
            <Link
              key={d}
              href={`?date=${d}`}
              className={`rounded-[10px] px-3 py-1.5 text-xs transition-colors ${
                dateFilter === d
                  ? "bg-[var(--color-accent)] text-[var(--color-on-accent)]"
                  : "border border-[var(--color-border)] text-[var(--color-text-muted)] hover:bg-[var(--color-elevated)]"
              }`}
            >
              {d.slice(5)}
            </Link>
          ))}
        </div>
      </div>

      {logs.length === 0 ? (
        <Card className="p-8 text-center text-[var(--color-text-muted)]">
          {dateFilter ? `${dateFilter}에 기록된 활동이 없습니다.` : "활동 로그가 없습니다."}
        </Card>
      ) : (
        <div className="space-y-8">
          {availableDates.map((dateKey) => {
            const dayLogs = grouped.get(dateKey)!;

            // 이 날짜의 마크다운 콘텐츠 (서버에서 생성)
            const mdLines: string[] = [
              `# Admin Log — ${dateKey}`,
              "",
              `> 총 ${dayLogs.length}건`,
              "",
            ];
            for (const log of dayLogs) {
              const time = log.created_at.toLocaleTimeString("ko-KR", { timeZone: "Asia/Seoul", hour: "2-digit", minute: "2-digit", second: "2-digit" });
              const admin = log.users ? (log.users.nickname ?? log.users.email) : "unknown";
              const sev = log.severity === "warning" ? "⚠️" : log.severity === "error" ? "🔴" : "•";
              mdLines.push(`- ${sev} \`${time}\` **${log.action}** [${log.resource_type}]`);
              if (log.description) mdLines.push(`  ${log.description}`);
              mdLines.push(`  _by ${admin}_`);
              const changes = log.changes_made as Record<string, unknown> | null;
              if (changes && Object.keys(changes).length > 0) {
                mdLines.push(`  \`${JSON.stringify(changes)}\``);
              }
              mdLines.push("");
            }
            const mdContent = mdLines.join("\n");

            return (
              <div key={dateKey}>
                {/* 날짜 헤더 (마크다운 ## 스타일) */}
                <div className="mb-3 flex items-center gap-3">
                  <span className="font-mono text-sm font-bold text-[var(--color-text-muted)]">##</span>
                  <h2 className="font-bold text-[var(--color-text-primary)]">{dateKey}</h2>
                  <span className="text-xs text-[var(--color-text-muted)]">{dayLogs.length}건</span>
                  {/* 마크다운 다운로드 */}
                  <a
                    href={`data:text/markdown;charset=utf-8,${encodeURIComponent(mdContent)}`}
                    download={`admin-log-${dateKey}.md`}
                    className="ml-auto rounded px-2 py-0.5 text-xs text-[var(--color-accent)] hover:bg-[var(--color-elevated)]"
                  >
                    .md 저장
                  </a>
                </div>

                <Card className="overflow-hidden p-0">
                  <div className="divide-y divide-[var(--color-border-subtle)]">
                    {dayLogs.map((log) => {
                      const changes = log.changes_made as Record<string, unknown> | null;
                      const prev = log.previous_values as Record<string, unknown> | null;
                      return (
                        <div key={log.id.toString()} className="flex items-start gap-4 px-5 py-3 hover:bg-[var(--color-surface)]">
                          {/* 시간 */}
                          <span className="mt-0.5 w-12 shrink-0 font-mono text-xs text-[var(--color-text-muted)]">
                            {toKSTTime(log.created_at)}
                          </span>

                          {/* 심각도 dot */}
                          <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                            log.severity === "error" ? "bg-[var(--color-error)]" :
                            log.severity === "warning" ? "bg-[var(--color-warning)]" : "bg-[var(--color-text-muted)]"
                          }`} />

                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className={`font-mono text-xs font-semibold ${SEVERITY_COLOR[log.severity ?? "info"]}`}>
                                {log.action}
                              </span>
                              <span className="rounded bg-[var(--color-surface)] px-1.5 py-0.5 font-mono text-xs text-[var(--color-text-muted)]">
                                {log.resource_type}
                              </span>
                              {ACTION_LABEL[log.action] && (
                                <span className="text-xs text-[var(--color-text-secondary)]">-- {ACTION_LABEL[log.action]}</span>
                              )}
                            </div>

                            {log.description && (
                              <p className="mt-0.5 text-sm text-[var(--color-text-secondary)]">{log.description}</p>
                            )}

                            {/* 변경 diff */}
                            {changes && Object.keys(changes).length > 0 && (
                              <div className="mt-1 flex flex-wrap gap-3 font-mono text-xs">
                                {Object.entries(changes).map(([k, v]) => (
                                  <span key={k}>
                                    <span className="text-[var(--color-text-muted)]">{k}:</span>{" "}
                                    {prev?.[k] !== undefined && (
                                      <span className="text-[var(--color-error)] line-through">{String(prev[k])}</span>
                                    )}
                                    {prev?.[k] !== undefined && " → "}
                                    <span className="text-[var(--color-accent)]">{String(v)}</span>
                                  </span>
                                ))}
                              </div>
                            )}

                            {log.users && (
                              <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">
                                by {log.users.nickname ?? log.users.email}
                              </p>
                            )}
                          </div>

                          <span className="hidden shrink-0 text-xs text-[var(--color-text-muted)] lg:block">
                            {toKSTFull(log.created_at)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </Card>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
