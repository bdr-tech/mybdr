import { prisma } from "@/lib/db/prisma";
import { StatCard, Card } from "@/components/ui/card";
import { AdminPageHeader } from "@/components/admin/admin-page-header";

export const dynamic = "force-dynamic";

// 최근 활동 로그에서 액션을 한글로 표시하는 매핑
const ACTION_LABEL: Record<string, string> = {
  "user.role_change": "역할 변경",
  "user.status_change": "상태 변경",
  "user.admin_toggle": "관리자 전환",
  "user.force_withdraw": "강제 탈퇴",
  "user.delete": "유저 삭제",
  "plan.create": "요금제 생성",
  "plan.update": "요금제 수정",
  "plan.deactivate": "요금제 비활성화",
  "plan.delete": "요금제 삭제",
  "tournament.status_change": "대회 상태 변경",
  "suggestion.status_change": "건의사항 상태 변경",
  "settings.cache_clear": "캐시 초기화",
  "settings.maintenance_toggle": "점검모드 변경",
};

// FR-060: Admin 대시보드
export default async function AdminDashboard() {
  // 통계 + 최근 활동 로그를 병렬로 조회
  const [userCount, tournamentCount, matchCount, teamCount, recentLogs] =
    await Promise.all([
      prisma.user.count(),
      prisma.tournament.count(),
      prisma.tournamentMatch.count({ where: { status: "live" } }),
      prisma.team.count(),
      // 최근 관리자 활동 5건 조회 (logs/page.tsx 패턴 참조)
      prisma.admin_logs
        .findMany({
          orderBy: { created_at: "desc" },
          take: 5,
          include: { users: { select: { nickname: true, email: true } } },
        })
        .catch(() => []),
    ]);

  return (
    <div>
      <AdminPageHeader title="대시보드" />

      {/* 통계 카드 4개: Material Symbols 아이콘 사용 */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="전체 유저"
          value={userCount}
          icon={<span className="material-symbols-outlined text-2xl">people</span>}
        />
        <StatCard
          label="토너먼트"
          value={tournamentCount}
          icon={<span className="material-symbols-outlined text-2xl">emoji_events</span>}
        />
        <StatCard
          label="진행 중 경기"
          value={matchCount}
          icon={<span className="material-symbols-outlined text-2xl">sports_basketball</span>}
        />
        <StatCard
          label="등록 팀"
          value={teamCount}
          icon={<span className="material-symbols-outlined text-2xl">groups</span>}
        />
      </div>

      {/* 최근 활동 로그: admin_logs 테이블에서 최근 5건 */}
      <Card>
        <h2 className="mb-4 text-lg font-semibold">최근 활동</h2>
        {recentLogs.length > 0 ? (
          <div className="divide-y divide-[var(--color-border-subtle)]">
            {recentLogs.map((log) => {
              const admin = log.users
                ? (log.users.nickname ?? log.users.email)
                : "unknown";
              return (
                <div
                  key={log.id.toString()}
                  className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"
                >
                  {/* 심각도 표시 점 */}
                  <span
                    className={`h-2 w-2 shrink-0 rounded-full ${
                      log.severity === "error"
                        ? "bg-[var(--color-error)]"
                        : log.severity === "warning"
                          ? "bg-[var(--color-warning)]"
                          : "bg-[var(--color-text-muted)]"
                    }`}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm">
                      <span className="font-medium">
                        {ACTION_LABEL[log.action] ?? log.action}
                      </span>
                      {log.description && (
                        <span className="ml-1 text-[var(--color-text-muted)]">
                          - {log.description}
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-[var(--color-text-muted)]">
                      {admin} ·{" "}
                      {log.created_at.toLocaleString("ko-KR", {
                        timeZone: "Asia/Seoul",
                      })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-[var(--color-text-muted)]">
            아직 기록된 활동이 없습니다.
          </p>
        )}
      </Card>
    </div>
  );
}
