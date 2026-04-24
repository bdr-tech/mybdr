import Link from "next/link";
import { prisma } from "@/lib/db/prisma";

/**
 * RosterTabV2
 * ─────────────────────────────────────────────────────────
 * v2 시안 `TeamDetail.jsx` tab === 'roster' 재현.
 *
 * 이유(왜): 기존 RosterTab은 스태프 섹션 + 포지션 그룹핑 카드(3열 grid)
 * 로 "시각적으로 풍부하지만 정보 밀도는 낮음". 시안은 `.board` 5열 테이블
 * (#/이름/포지션/역할/PPG) 단일 뷰로 승부.
 *
 * 방법(어떻게):
 * - 기존 Prisma 쿼리 그대로 재사용 (teamMember.findMany where active)
 * - `.board` + `.board__head` + `.board__row` 5열 grid
 *   columns: `56px 1fr 80px 100px 80px`
 * - 등번호: accent 색 / ff-display 900 16px
 * - 이름: 22px 원형 이니셜 + 이름
 * - 포지션: ff-mono 700
 * - 역할: "주장"→badge--red, "부주장"→badge--soft, 나머지→ink-mute 12px
 * - PPG: DB 없음 → "—" (준비 중 / match_player_stat 집계 추후 추가)
 *
 * DB 매핑 / 미지원:
 * - jerseyNumber → #
 * - nickname/name → 이름
 * - user.position → 포지션
 * - role: captain|director|coach|manager|treasurer|member → 역할 라벨
 * - PPG → 전부 "—" (추후 match_player_stat 집계)
 */

type Props = {
  teamId: bigint;
  accent: string;
};

// 역할 라벨 — 기존 roster-tab.tsx와 통일
const ROLE_LABEL: Record<string, string> = {
  director: "감독",
  coach: "코치",
  captain: "주장",
  manager: "매니저",
  treasurer: "총무",
  member: "선수",
};

// 정렬 우선순위 — 주장/부주장/선수 순 (시안 샘플은 주장→부주장→일반 순서)
const ROLE_ORDER: Record<string, number> = {
  captain: 0,
  director: 1,
  coach: 2,
  manager: 3,
  treasurer: 4,
  member: 5,
};

export async function RosterTabV2({ teamId, accent }: Props) {
  // 기존 쿼리 100% 유지 (API/스키마 0 변경)
  const members = await prisma.teamMember
    .findMany({
      where: { teamId, status: "active" },
      include: {
        user: {
          select: {
            id: true,
            nickname: true,
            name: true,
            position: true,
          },
        },
      },
      orderBy: [{ jerseyNumber: "asc" }, { createdAt: "asc" }],
    })
    .catch(() => []);

  if (members.length === 0) {
    return (
      <div
        className="card"
        style={{
          padding: "40px 20px",
          textAlign: "center",
          color: "var(--ink-mute)",
        }}
      >
        <span
          className="material-symbols-outlined"
          style={{ fontSize: 32, marginBottom: 8, display: "block" }}
        >
          groups
        </span>
        <p style={{ margin: 0, fontSize: 14 }}>로스터가 비어 있습니다.</p>
      </div>
    );
  }

  // 역할 우선 정렬 (DB orderBy는 jerseyNumber 기준이므로 역할 기준 재정렬)
  const sorted = [...members].sort((a, b) => {
    const ra = ROLE_ORDER[a.role ?? "member"] ?? 99;
    const rb = ROLE_ORDER[b.role ?? "member"] ?? 99;
    if (ra !== rb) return ra - rb;
    // 같은 역할이면 등번호 오름차순
    const ja = a.jerseyNumber ?? 999;
    const jb = b.jerseyNumber ?? 999;
    return ja - jb;
  });

  // 시안 grid 템플릿 — 모바일에선 columns를 좁힘 (기존 `.board` 토큰 기반이라
  // 반응형은 style로 덮어씀).
  const gridColumns = "56px 1fr 80px 100px 80px";

  return (
    <div className="board">
      <div
        className="board__head"
        style={{ gridTemplateColumns: gridColumns }}
      >
        <div>#</div>
        <div>이름</div>
        <div>포지션</div>
        <div>역할</div>
        <div>PPG</div>
      </div>

      {sorted.map((m) => {
        const displayName = m.user?.nickname ?? m.user?.name ?? "멤버";
        const userId = m.user?.id?.toString();
        const position = m.user?.position ?? "—";
        const role = m.role ?? "member";
        const roleLabel = ROLE_LABEL[role] ?? role;
        const jersey = m.jerseyNumber ?? "—";

        const rowInner = (
          <div
            className="board__row"
            style={{ gridTemplateColumns: gridColumns }}
          >
            {/* # 등번호 — accent 색 (팀 고유색) + ff-display 900 16px */}
            <div
              style={{
                fontFamily: "var(--ff-display)",
                fontWeight: 900,
                fontSize: 16,
                color: accent,
              }}
            >
              {jersey}
            </div>

            {/* 이름 + 이니셜 원형 */}
            <div className="title" style={{ gap: 8 }}>
              <span
                style={{
                  width: 22,
                  height: 22,
                  background: "var(--bg-alt)",
                  display: "grid",
                  placeItems: "center",
                  fontSize: 11,
                  fontWeight: 700,
                  borderRadius: "50%",
                  flexShrink: 0,
                }}
              >
                {displayName.charAt(0)}
              </span>
              <span style={{ fontWeight: 600 }}>{displayName}</span>
            </div>

            {/* 포지션 — ff-mono 700 */}
            <div
              style={{
                fontFamily: "var(--ff-mono)",
                fontWeight: 700,
              }}
            >
              {position}
            </div>

            {/* 역할 — 주장 red / 나머지 soft or text */}
            <div>
              {role === "captain" ? (
                <span className="badge badge--red">주장</span>
              ) : role === "director" ||
                role === "coach" ||
                role === "manager" ||
                role === "treasurer" ? (
                <span className="badge badge--soft">{roleLabel}</span>
              ) : (
                <span style={{ color: "var(--ink-mute)", fontSize: 12 }}>
                  {roleLabel}
                </span>
              )}
            </div>

            {/* PPG — DB 미지원 (match_player_stat 집계 추가 시 실제 평균) */}
            <div
              title="준비 중 — 개인 평균 득점은 경기 기록이 쌓이면 표시됩니다"
              style={{
                fontFamily: "var(--ff-mono)",
                fontWeight: 700,
                color: "var(--ink-mute)",
              }}
            >
              —
            </div>
          </div>
        );

        return userId ? (
          <Link
            key={m.id.toString()}
            href={`/users/${userId}`}
            style={{ textDecoration: "none", color: "inherit" }}
          >
            {rowInner}
          </Link>
        ) : (
          <div key={m.id.toString()}>{rowInner}</div>
        );
      })}
    </div>
  );
}
