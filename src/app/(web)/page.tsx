import type { Metadata } from "next";

// SEO: 홈 페이지 메타데이터
export const metadata: Metadata = {
  title: "MyBDR | 농구 매칭 플랫폼",
  description: "픽업 게임, 팀 대결, 대회까지 — 농구인을 위한 올인원 매칭 플랫폼",
};

/* ============================================================
 * 홈페이지 — BDR v2 디자인 적용 (Phase 1)
 *
 * 레이아웃 (v2 Home.jsx 시안 기준):
 * 1. PromoCard — prefetchOpenTournaments 첫 항목 하이라이트
 * 2. StatsStrip — 4열 통계 (전체회원/지금접속/오늘의글/진행중대회)
 * 3. 2컬럼 grid
 *    - CardPanel "공지·인기글" : prefetchCommunity 상위 5건 → BoardRow
 *    - CardPanel "열린 대회"   : prefetchOpenTournaments → BoardRow
 * 4. CardPanel "방금 올라온 글" : prefetchCommunity 상위 10건 → BoardRow
 *
 * v2 전환으로 기존 6종 섹션(HomeHero/RecommendedGames/RecommendedTournaments/
 * NotableTeams/RecommendedVideos/RecentActivity/HomeCommunity)은 제거.
 * components/home/* 파일은 미사용 상태로 보존 (삭제하지 않음).
 *
 * API/DB/route.ts 변경 없음. 서비스 레이어(home.ts)에 prefetchOpenTournaments
 * 추가만 있음. Promise.allSettled로 부분 실패 허용.
 * ============================================================ */

import { PromoCard } from "@/components/bdr-v2/promo-card";
import { StatsStrip } from "@/components/bdr-v2/stats-strip";
import { BoardRow } from "@/components/bdr-v2/board-row";
import { HotPostRow } from "@/components/bdr-v2/hot-post-row";
import { TournamentRow } from "@/components/bdr-v2/tournament-row";
import { CardPanel } from "@/components/bdr-v2/card-panel";
import {
  prefetchStats,
  prefetchCommunity,
  prefetchOpenTournaments,
} from "@/lib/services/home";

/* ISR: 60초마다 재생성. getWebSession() 호출 없음 → 정적 캐시 유효 */
export const revalidate = 60;

/* -- 유틸: ISO 날짜 → "MM-DD" 짧은 포맷 (BoardRow의 date 컬럼용) -- */
function formatShortDate(iso: string | null): string {
  if (!iso) return "";
  // "2026-04-22T..." → "04-22"
  return iso.slice(5, 10);
}

/* -- 유틸: 24시간 이내 작성 여부 (NEW 뱃지 표시용) -- */
function isWithin24h(iso: string | null): boolean {
  if (!iso) return false;
  const diff = Date.now() - new Date(iso).getTime();
  return diff >= 0 && diff < 24 * 60 * 60 * 1000;
}

/* -- 유틸: 카테고리 코드 → 한글 라벨 매핑 (기존 community 규약과 맞춤) -- */
function communityCategoryLabel(category: string | null): string {
  if (!category) return "자유";
  const map: Record<string, string> = {
    free: "자유",
    notice: "공지",
    qna: "Q&A",
    match: "경기",
    team: "팀",
    tournament: "대회",
  };
  return map[category] ?? category;
}

/* -- 유틸: 대회 상태 코드 → 한글 라벨 매핑 -- */
function tournamentStatusLabel(status: string | null): string {
  if (!status) return "";
  const map: Record<string, string> = {
    registration: "접수중",
    in_progress: "진행중",
  };
  return map[status] ?? status;
}

/* -- 유틸: 대회 상태 코드 → TournamentRow level 약어 (좌측 accent 블록용) --
 * 왜: v2 Home.jsx 시안의 "열린 대회" 좌측 54×54 accent 블록은 4~5자 영문
 * 약어로 상태를 보여줌. status 원코드를 그대로 쓰면 너무 길어지므로 매핑. */
function tournamentLevelLabel(status: string | null): string {
  if (status === "registration") return "OPEN";
  if (status === "in_progress") return "LIVE";
  return "INFO";
}

/* -- 유틸: 인덱스 → accent 색상 로테이션 --
 * PM 지정 3색 순환. 4번째 이상은 다시 0번부터 반복 (시안의 시각 리듬 유지).
 * CSS 변수가 없는 환경을 대비해 #f59e0b / #0ea5e9은 리터럴 fallback 제공. */
const TOURNAMENT_ACCENTS = [
  "var(--accent)",
  "#f59e0b",
  "var(--accent-2, #0ea5e9)",
] as const;
function tournamentAccent(idx: number): string {
  return TOURNAMENT_ACCENTS[idx % TOURNAMENT_ACCENTS.length];
}

export default async function HomePage() {
  // 3개 데이터를 병렬 프리페치 — 하나 실패해도 나머지는 정상 반영
  const [statsResult, communityResult, tournamentsResult] =
    await Promise.allSettled([
      prefetchStats(),
      prefetchCommunity(),
      prefetchOpenTournaments(),
    ]);

  // 성공한 결과만 추출 (실패 시 undefined → 빈 상태 fallback)
  const statsData =
    statsResult.status === "fulfilled" ? statsResult.value : undefined;
  const communityData =
    communityResult.status === "fulfilled" ? communityResult.value : undefined;
  const tournamentsData =
    tournamentsResult.status === "fulfilled"
      ? tournamentsResult.value
      : undefined;

  // Promo 배너용 첫 번째 열린 대회 (없으면 배너 자체 렌더 skip)
  const mainTournament = tournamentsData?.tournaments?.[0];

  // 공지·인기글: prefetchCommunity 상위 5건 (DB에 별도 "인기" 플래그가 없으므로
  // 최신 정렬 기준 상위 5건을 공지/인기 섹션에 매핑. 추후 likes 기준 정렬 가능)
  const hotPosts = communityData?.posts?.slice(0, 5) ?? [];

  // 방금 올라온 글: prefetchCommunity 상위 10건
  const latestPosts = communityData?.posts?.slice(0, 10) ?? [];

  // 열린 대회 리스트: 최대 5개 (공지·인기글과 높이 맞춤)
  const openTournaments = tournamentsData?.tournaments?.slice(0, 5) ?? [];

  return (
    // page: v2 globals.css의 .page 쉘 — max-width + 중앙 정렬 + 기본 상하 여백
    // (이전 "pb-10"은 좌우 maxw/gutter 제한이 없어 콘텐츠가 전폭으로 퍼져 시안과 어긋났음)
    <div className="page">
      {/* 1. Promo 배너 — 열린 대회 첫 항목이 있을 때만 표시 */}
      {mainTournament && (
        <PromoCard
          eyebrow={`NOW OPEN · ${tournamentStatusLabel(mainTournament.status)}`}
          title={mainTournament.name}
          subtitle={
            mainTournament.edition_number
              ? `Vol.${mainTournament.edition_number}`
              : undefined
          }
          description={[
            mainTournament.venue_name || mainTournament.city,
            mainTournament.start_date
              ? new Date(mainTournament.start_date).toLocaleDateString(
                  "ko-KR",
                  { month: "long", day: "numeric" }
                )
              : null,
            mainTournament.max_teams
              ? `접수 ${mainTournament.team_count}/${mainTournament.max_teams}팀`
              : `${mainTournament.team_count}팀 참가`,
          ]
            .filter(Boolean)
            .join(" · ")}
          primaryCta={{
            label: "지금 신청하기",
            href: `/tournaments/${mainTournament.id}`,
          }}
          secondaryCta={{
            label: "대회 전체 보기",
            href: "/tournaments",
          }}
        />
      )}

      {/* 2. Stats Strip — 통계 4열
       * 지금 접속자 수는 DB에 실시간 카운트가 없어 placeholder "-" 표시 */}
      <StatsStrip
        items={[
          { label: "전체 회원", value: statsData?.user_count ?? 0 },
          { label: "지금 접속", value: "-" },
          { label: "누적 경기", value: statsData?.match_count ?? 0 },
          { label: "활동 팀", value: statsData?.team_count ?? 0 },
        ]}
      />

      {/* 3. 2컬럼 그리드 — 공지·인기글 + 열린 대회 */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 20,
        }}
      >
        {/* 공지·인기글 패널 — HotPostRow 방식 (시안 3열 grid 간략 리스트)
         * v2 Home.jsx L44~53 HOT_POSTS 구조: 56px 배지 / 1fr 제목 / auto 조회수.
         * "방금 올라온 글"의 풀 테이블(6열)과 정보 밀도가 달라 별도 컴포넌트 사용. */}
        <CardPanel
          title="공지 · 인기글"
          moreHref="/community"
          noPadding
        >
          {hotPosts.length === 0 ? (
            <div
              style={{
                padding: "28px 18px",
                textAlign: "center",
                color: "var(--ink-dim)",
                fontSize: 13,
              }}
            >
              아직 게시글이 없습니다.
            </div>
          ) : (
            // 외부 `.board` 래퍼 불필요 — HotPostRow가 자체 grid 소유
            <div>
              {hotPosts.map((post) => (
                <HotPostRow
                  key={post.id}
                  category={communityCategoryLabel(post.category)}
                  title={post.title}
                  commentsCount={post.comments_count}
                  views={post.view_count}
                  /* 공지 카테고리만 red 배지로 강조 — 시안 매칭 */
                  isNotice={post.category === "notice"}
                  href={`/community/${post.public_id ?? post.id}`}
                />
              ))}
            </div>
          )}
        </CardPanel>

        {/* 열린 대회 패널 — TournamentRow 방식 (시안 3-column 카드형)
         * BoardRow의 6열 테이블과 달리, 좌측 54×54 accent 블록 + 중앙 본문 +
         * 우측 LIVE 배지 구조. 인덱스별 accent 색상 로테이션 적용. */}
        <CardPanel title="열린 대회" moreHref="/tournaments" noPadding>
          {openTournaments.length === 0 ? (
            <div
              style={{
                padding: "28px 18px",
                textAlign: "center",
                color: "var(--ink-dim)",
                fontSize: 13,
              }}
            >
              접수중인 대회가 없습니다.
            </div>
          ) : (
            <div style={{ padding: "0 14px" }}>
              {openTournaments.map((tournament, idx) => {
                // 부제(meta) 구성: 장소 · 날짜 · 접수현황을 " · "로 연결
                const metaParts = [
                  tournament.venue_name || tournament.city,
                  tournament.start_date
                    ? new Date(tournament.start_date).toLocaleDateString(
                        "ko-KR",
                        { month: "numeric", day: "numeric" }
                      )
                    : null,
                  tournament.max_teams
                    ? `${tournament.team_count}/${tournament.max_teams}팀`
                    : `${tournament.team_count}팀`,
                ].filter(Boolean);

                return (
                  <TournamentRow
                    key={tournament.id}
                    accent={tournamentAccent(idx)}
                    level={tournamentLevelLabel(tournament.status)}
                    title={tournament.name}
                    edition={
                      tournament.edition_number
                        ? `Vol.${tournament.edition_number}`
                        : undefined
                    }
                    meta={metaParts.join(" · ")}
                    status={tournament.status ?? ""}
                    href={`/tournaments/${tournament.id}`}
                  />
                );
              })}
            </div>
          )}
        </CardPanel>
      </div>

      {/* 4. 방금 올라온 글 — 별도 섹션, 위 그리드와 24px 간격 */}
      <section style={{ marginTop: 24 }}>
        {/* 섹션 헤더 — CardPanel과 다른 자유 형태 (시안 재현) */}
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            justifyContent: "space-between",
            marginBottom: 12,
          }}
        >
          <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>
            방금 올라온 글
          </h3>
          <a href="/community" style={{ fontSize: 12 }}>
            전체 보기 ›
          </a>
        </div>

        {/* .board 풀 스타일 테이블 — 헤더 행 포함 */}
        {latestPosts.length === 0 ? (
          <div
            className="card"
            style={{
              padding: "32px 18px",
              textAlign: "center",
              color: "var(--ink-dim)",
              fontSize: 13,
            }}
          >
            아직 게시글이 없습니다.
          </div>
        ) : (
          <div className="board">
            {/* 테이블 헤더 — .board__head 그리드 컬럼과 동일 */}
            <div className="board__head">
              <div>번호</div>
              <div>제목</div>
              <div>게시판</div>
              <div>작성자</div>
              <div>날짜</div>
              <div>조회</div>
            </div>
            {latestPosts.map((post, idx) => (
              /* categoryBadge prop 제거 이유: BoardRow의 3열(게시판 이름)에
               * 이미 카테고리 라벨이 표시되므로 제목 앞 배지는 중복 표시.
               * 시안도 "방금 올라온 글"은 테이블 한 줄(배지 없음) 스타일 */
              <BoardRow
                key={post.id}
                num={idx + 1}
                title={post.title}
                board={communityCategoryLabel(post.category)}
                author={post.author_nickname}
                date={formatShortDate(post.created_at)}
                views={post.view_count}
                commentsCount={post.comments_count}
                isNew={isWithin24h(post.created_at)}
                href={`/community/${post.public_id ?? post.id}`}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
