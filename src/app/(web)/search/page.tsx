import type { Metadata } from "next";
import { prisma } from "@/lib/db/prisma";
import Link from "next/link";

// SEO: 검색 페이지 메타데이터
export const metadata: Metadata = {
  title: "검색 - MyBDR",
  description: "경기, 대회, 팀, 코트, 유저를 통합 검색하세요.",
};

/* ============================================================
 * /search?q=키워드 — 통합 검색 결과 페이지
 *
 * 서버 컴포넌트에서 Prisma로 5개 테이블 직접 검색.
 * API를 거치지 않고 서버에서 바로 쿼리하여 응답 속도 최적화.
 * 카테고리별(경기/대회/팀/커뮤니티) 섹션으로 결과 표시.
 * ============================================================ */

// 경기 유형 한글 매핑
const GAME_TYPE_LABELS: Record<number, string> = {
  0: "픽업게임",
  1: "팀매치",
  2: "대회경기",
};

// 커뮤니티 카테고리 한글 매핑
const CATEGORY_LABELS: Record<string, string> = {
  general: "자유",
  question: "질문",
  info: "정보",
  recruit: "모집",
  trade: "거래",
  review: "후기",
};

// 대회 상태 한글 매핑 (4종 통일 규칙)
const STATUS_LABELS: Record<string, string> = {
  draft: "준비중",
  upcoming: "준비중",
  registration: "접수중",
  active: "접수중",
  open: "접수중",
  in_progress: "진행중",
  live: "진행중",
  ongoing: "진행중",
  completed: "종료",
  ended: "종료",
  cancelled: "종료",
};

export const dynamic = "force-dynamic";

interface SearchPageProps {
  searchParams: Promise<{ q?: string }>;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const q = params.q?.trim() || "";

  // 검색어가 없으면 안내 메시지만 표시
  if (!q) {
    return (
      <div className="py-20 text-center">
        <span
          className="material-symbols-outlined mb-4 block text-5xl"
          style={{ color: "var(--color-text-disabled)" }}
        >
          search
        </span>
        <p className="text-lg font-semibold" style={{ color: "var(--color-text-primary)" }}>
          검색어를 입력해주세요
        </p>
        <p className="mt-2 text-sm" style={{ color: "var(--color-text-muted)" }}>
          경기, 대회, 팀, 코트, 커뮤니티 글을 한번에 검색할 수 있어요
        </p>
      </div>
    );
  }

  // 6개 테이블 동시 검색 (서버 컴포넌트이므로 Prisma 직접 사용)
  const [games, tournaments, teams, posts, users, courts] = await Promise.all([
    prisma.games.findMany({
      where: { title: { contains: q, mode: "insensitive" } },
      orderBy: { scheduled_at: "desc" },
      take: 5,
      select: {
        id: true,
        title: true,
        game_type: true,
        venue_name: true,
        city: true,
        scheduled_at: true,
      },
    }),
    prisma.tournament.findMany({
      where: { name: { contains: q, mode: "insensitive" } },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        name: true,
        status: true,
        city: true,
        startDate: true,
        teams_count: true,
        maxTeams: true,
      },
    }),
    prisma.team.findMany({
      where: { name: { contains: q, mode: "insensitive" } },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        name: true,
        city: true,
        members_count: true,
      },
    }),
    prisma.community_posts.findMany({
      where: {
        title: { contains: q, mode: "insensitive" },
        status: "published",
      },
      orderBy: { created_at: "desc" },
      take: 5,
      select: {
        id: true,
        title: true,
        category: true,
        comments_count: true,
        created_at: true,
      },
    }),
    // 유저: nickname 또는 name에서 키워드 검색
    prisma.user.findMany({
      where: {
        OR: [
          { nickname: { contains: q, mode: "insensitive" } },
          { name: { contains: q, mode: "insensitive" } },
        ],
      },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        nickname: true,
        name: true,
        position: true,
        city: true,
      },
    }),

    // 코트: name 또는 address에서 키워드 검색
    prisma.court_infos.findMany({
      where: {
        status: "active",
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { address: { contains: q, mode: "insensitive" } },
        ],
      },
      orderBy: { checkins_count: "desc" },
      take: 5,
      select: {
        id: true,
        name: true,
        address: true,
        city: true,
        district: true,
        court_type: true,
        average_rating: true,
      },
    }),
  ]);

  // 코트 유형 한글 매핑
  const COURT_TYPE_LABELS: Record<string, string> = {
    outdoor: "야외",
    indoor: "실내",
    rooftop: "옥상",
  };

  // 포지션 한글 매핑
  const POSITION_LABELS: Record<string, string> = {
    PG: "포인트가드",
    SG: "슈팅가드",
    SF: "스몰포워드",
    PF: "파워포워드",
    C: "센터",
  };

  // 전체 결과가 0건인지 확인
  const totalCount = games.length + tournaments.length + teams.length + posts.length + courts.length + users.length;

  return (
    <div className="space-y-6">
      {/* 검색 헤더 */}
      <div className="pb-2">
        <h1
          className="text-xl font-bold"
          style={{ color: "var(--color-text-primary)" }}
        >
          &ldquo;{q}&rdquo; 검색 결과
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--color-text-muted)" }}>
          총 {totalCount}건
        </p>
      </div>

      {/* 결과가 없을 때 */}
      {totalCount === 0 && (
        <div className="py-16 text-center">
          <span
            className="material-symbols-outlined mb-4 block text-5xl"
            style={{ color: "var(--color-text-disabled)" }}
          >
            search_off
          </span>
          <p className="text-lg font-semibold" style={{ color: "var(--color-text-primary)" }}>
            검색 결과가 없어요
          </p>
          <p className="mt-2 text-sm" style={{ color: "var(--color-text-muted)" }}>
            다른 키워드로 다시 검색해보세요
          </p>
        </div>
      )}

      {/* 경기 섹션 */}
      {games.length > 0 && (
        <SearchSection
          icon="sports_basketball"
          iconBg="var(--color-primary)"
          title="경기"
          count={games.length}
          moreHref={`/games?q=${encodeURIComponent(q)}`}
        >
          {games.map((game) => (
            <SearchResultItem
              key={game.id.toString()}
              href={`/games/${game.id}`}
              title={game.title || "제목 없음"}
              subtitle={[
                GAME_TYPE_LABELS[game.game_type] || "경기",
                game.venue_name || game.city,
                game.scheduled_at
                  ? new Date(game.scheduled_at).toLocaleDateString("ko-KR", {
                      month: "short",
                      day: "numeric",
                    })
                  : null,
              ]
                .filter(Boolean)
                .join(" · ")}
            />
          ))}
        </SearchSection>
      )}

      {/* 대회 섹션 */}
      {tournaments.length > 0 && (
        <SearchSection
          icon="emoji_events"
          iconBg="var(--color-info)"
          title="대회"
          count={tournaments.length}
          moreHref={`/tournaments`}
        >
          {tournaments.map((t) => (
            <SearchResultItem
              key={t.id}
              href={`/tournaments/${t.id}`}
              title={t.name}
              subtitle={[
                STATUS_LABELS[t.status || "draft"] || t.status,
                t.city,
                t.teams_count != null && t.maxTeams
                  ? `${t.teams_count}/${t.maxTeams}팀`
                  : null,
              ]
                .filter(Boolean)
                .join(" · ")}
            />
          ))}
        </SearchSection>
      )}

      {/* 팀 섹션 */}
      {teams.length > 0 && (
        <SearchSection
          icon="groups"
          iconBg="#6366f1"
          title="팀"
          count={teams.length}
          moreHref={`/teams`}
        >
          {teams.map((team) => (
            <SearchResultItem
              key={team.id.toString()}
              href={`/teams/${team.id}`}
              title={team.name}
              subtitle={[
                team.city,
                team.members_count != null ? `${team.members_count}명` : null,
              ]
                .filter(Boolean)
                .join(" · ")}
            />
          ))}
        </SearchSection>
      )}

      {/* 코트 섹션 */}
      {courts.length > 0 && (
        <SearchSection
          icon="location_on"
          iconBg="var(--color-info)"
          title="코트"
          count={courts.length}
          moreHref={`/courts`}
        >
          {courts.map((court) => (
            <SearchResultItem
              key={court.id.toString()}
              href={`/courts/${court.id}`}
              title={court.name}
              subtitle={[
                COURT_TYPE_LABELS[court.court_type] || court.court_type,
                court.district || court.city,
                court.average_rating
                  ? `${Number(court.average_rating).toFixed(1)}점`
                  : null,
              ]
                .filter(Boolean)
                .join(" · ")}
            />
          ))}
        </SearchSection>
      )}

      {/* 유저 섹션 */}
      {users.length > 0 && (
        <SearchSection
          icon="person"
          iconBg="#8b5cf6"
          title="유저"
          count={users.length}
          moreHref={`/search?q=${encodeURIComponent(q)}`}
        >
          {users.map((user) => (
            <SearchResultItem
              key={user.id.toString()}
              href={`/profile/${user.id}`}
              title={user.nickname || user.name || "알 수 없음"}
              subtitle={[
                user.position ? (POSITION_LABELS[user.position] || user.position) : null,
                user.city,
              ]
                .filter(Boolean)
                .join(" · ")}
            />
          ))}
        </SearchSection>
      )}

      {/* 커뮤니티 섹션 */}
      {posts.length > 0 && (
        <SearchSection
          icon="forum"
          iconBg="#10b981"
          title="커뮤니티"
          count={posts.length}
          moreHref={`/community`}
        >
          {posts.map((post) => (
            <SearchResultItem
              key={post.id.toString()}
              href={`/community/${post.id}`}
              title={post.title}
              subtitle={[
                CATEGORY_LABELS[post.category || "general"] || post.category,
                post.comments_count > 0 ? `댓글 ${post.comments_count}` : null,
                post.created_at
                  ? new Date(post.created_at).toLocaleDateString("ko-KR", {
                      month: "short",
                      day: "numeric",
                    })
                  : null,
              ]
                .filter(Boolean)
                .join(" · ")}
            />
          ))}
        </SearchSection>
      )}
    </div>
  );
}

/* ============================================================
 * SearchSection — 카테고리별 검색 결과 섹션
 * TossSectionHeader 패턴: 아이콘 + 제목 + 건수 + 전체보기
 * ============================================================ */
function SearchSection({
  icon,
  iconBg,
  title,
  count,
  moreHref,
  children,
}: {
  icon: string;
  iconBg: string;
  title: string;
  count: number;
  moreHref: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="rounded-md p-5"
      style={{
        backgroundColor: "var(--color-card)",
        boxShadow: "var(--shadow-card)",
      }}
    >
      {/* 섹션 헤더: 아이콘 + 제목(건수) + 더보기 링크 */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-full"
            style={{ backgroundColor: iconBg }}
          >
            <span className="material-symbols-outlined text-base text-white">
              {icon}
            </span>
          </div>
          <h3
            className="text-base font-bold"
            style={{ color: "var(--color-text-primary)" }}
          >
            {title}
            <span
              className="ml-1.5 text-sm font-medium"
              style={{ color: "var(--color-text-muted)" }}
            >
              {count}건
            </span>
          </h3>
        </div>
        <Link
          href={moreHref}
          className="flex items-center gap-0.5 text-sm font-medium transition-colors"
          style={{ color: "var(--color-primary)" }}
        >
          더보기
          <span className="material-symbols-outlined text-sm">
            chevron_right
          </span>
        </Link>
      </div>

      {/* 결과 리스트 */}
      <div className="divide-y divide-[var(--color-border-subtle)]">
        {children}
      </div>
    </div>
  );
}

/* ============================================================
 * SearchResultItem — 개별 검색 결과 아이템
 * TossListItem 패턴: 제목 + 부가정보 + 화살표
 * ============================================================ */
function SearchResultItem({
  href,
  title,
  subtitle,
}: {
  href: string;
  title: string;
  subtitle: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between gap-3 rounded-lg px-3 py-3.5 transition-colors hover:bg-[var(--color-surface-bright)]"
    >
      <div className="min-w-0 flex-1">
        <p
          className="truncate text-sm font-semibold"
          style={{ color: "var(--color-text-primary)" }}
        >
          {title}
        </p>
        {subtitle && (
          <p
            className="mt-0.5 truncate text-xs"
            style={{ color: "var(--color-text-muted)" }}
          >
            {subtitle}
          </p>
        )}
      </div>
      <span
        className="material-symbols-outlined shrink-0 text-lg"
        style={{ color: "var(--color-text-disabled)" }}
      >
        chevron_right
      </span>
    </Link>
  );
}
