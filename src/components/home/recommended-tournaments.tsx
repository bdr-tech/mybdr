"use client";

/* ============================================================
 * RecommendedTournaments -- 추천 대회 섹션 (토스 스타일)
 *
 * /api/web/tournaments API에서 접수중 대회를 가져와 가로 스크롤로 표시.
 * RecommendedGames 컴포넌트와 동일한 패턴(useSWR + TossSectionHeader + 가로 스크롤).
 *
 * API/데이터 패칭은 기존 tournaments API를 그대로 사용.
 * ============================================================ */

import Link from "next/link";
import useSWR from "swr";
import { Skeleton } from "@/components/ui/skeleton";
import { TossSectionHeader } from "@/components/toss/toss-section-header";

/* API 응답의 각 대회 항목 (apiSuccess가 snake_case로 변환) */
interface TournamentItem {
  id: number;
  name: string;
  format: string | null;
  status: string | null;
  startDate: string | null;
  endDate: string | null;
  entryFee: string | null;
  city: string | null;
  venueName: string | null;
  maxTeams: number | null;
  divisions: string[];
  teamCount: number;
}

/* API 전체 응답 구조 */
interface TournamentsResponse {
  tournaments: TournamentItem[];
}

/* SWR fetcher */
const fetcher = (url: string) => fetch(url).then((r) => r.json());

/* 대회 상태 한글 매핑 */
const STATUS_LABEL: Record<string, string> = {
  registration: "접수중",
  in_progress: "진행중",
  completed: "완료",
  draft: "준비중",
};

/* 대회 포맷 한글 매핑 */
const FORMAT_LABEL: Record<string, string> = {
  single_elimination: "토너먼트",
  round_robin: "리그",
  group_stage: "그룹 스테이지",
  double_elimination: "더블 엘리미네이션",
  swiss: "스위스",
};

/* 대회 상태별 그라디언트 색상 */
const STATUS_GRADIENT: Record<string, string> = {
  registration: "linear-gradient(135deg, #1B3C87, #0079B9)",
  in_progress: "linear-gradient(135deg, #E31B23, #FF6B35)",
  completed: "linear-gradient(135deg, #374151, #6B7280)",
  draft: "linear-gradient(135deg, #4B5563, #9CA3AF)",
};

export function RecommendedTournaments() {
  // useSWR로 대회 목록 API 호출
  const { data, isLoading: loading } = useSWR<TournamentsResponse>(
    "/api/web/tournaments",
    fetcher,
    { revalidateOnFocus: false }
  );

  // 접수중 대회를 우선 표시, 없으면 전체에서 최근 4개
  const allTournaments = data?.tournaments ?? [];
  const registrationTournaments = allTournaments.filter(
    (t) => t.status === "registration"
  );
  // 접수중이 있으면 접수중 우선, 없으면 전체에서 4개
  const tournaments =
    registrationTournaments.length > 0
      ? registrationTournaments.slice(0, 4)
      : allTournaments.slice(0, 4);

  // 대회가 아예 없으면 섹션 자체를 숨김
  if (!loading && tournaments.length === 0) {
    return null;
  }

  if (loading) {
    return (
      <section>
        <Skeleton className="h-6 w-40 mb-4" />
        <div className="flex gap-4 overflow-hidden">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-44 w-56 rounded-2xl shrink-0" />
          ))}
        </div>
      </section>
    );
  }

  return (
    <section>
      {/* 토스 스타일 섹션 헤더: 제목 + "전체보기 >" */}
      <TossSectionHeader title="추천 대회" actionHref="/tournaments" />

      {/* 가로 스크롤 캐러셀: 추천경기와 동일한 패턴 */}
      <div className="flex gap-3 overflow-x-auto no-scrollbar -mx-5 px-5 pb-2">
        {tournaments.map((tournament) => (
          <TournamentCard key={tournament.id} tournament={tournament} />
        ))}
      </div>
    </section>
  );
}

/* ---- 개별 대회 카드: 토스 스타일 (둥근 모서리, 가벼운 그림자) ---- */
function TournamentCard({ tournament }: { tournament: TournamentItem }) {
  const href = `/tournaments/${tournament.id}`;
  const statusLabel = STATUS_LABEL[tournament.status ?? ""] ?? tournament.status ?? "";
  const formatLabel = FORMAT_LABEL[tournament.format ?? ""] ?? tournament.format ?? "";
  const gradient = STATUS_GRADIENT[tournament.status ?? ""] ?? STATUS_GRADIENT.draft;

  // 날짜 포맷: "3월 15일" 형태
  const startStr = tournament.startDate
    ? new Date(tournament.startDate).toLocaleDateString("ko-KR", {
        month: "long",
        day: "numeric",
      })
    : null;

  // 참가 현황 텍스트
  const capacityText = tournament.maxTeams
    ? `${tournament.teamCount}/${tournament.maxTeams}팀`
    : `${tournament.teamCount}팀 참가`;

  return (
    <Link href={href} className="block shrink-0 w-56">
      {/* 토스 카드: 둥근 모서리(16px) + 가벼운 그림자 + 호버 효과 */}
      <div
        className="group rounded-2xl overflow-hidden bg-[var(--color-card)] transition-all duration-200 hover:scale-[1.02] hover:shadow-[var(--shadow-elevated)] h-full"
        style={{ boxShadow: "var(--shadow-card)" }}
      >
        {/* 이미지 영역: 상태별 그라디언트 배경 + 아이콘 */}
        <div
          className="relative h-28 flex items-center justify-center"
          style={{ background: gradient }}
        >
          {/* 대회 아이콘 */}
          <span className="material-symbols-outlined text-5xl text-white/20">
            emoji_events
          </span>

          {/* 상태 뱃지 (좌상단) */}
          {statusLabel && (
            <span
              className="absolute top-2 left-2 rounded-md px-2 py-0.5 text-xs font-bold"
              style={{
                backgroundColor: "rgba(255,255,255,0.9)",
                color: "var(--color-primary)",
              }}
            >
              {statusLabel}
            </span>
          )}

          {/* 포맷 뱃지 (우상단) */}
          {formatLabel && (
            <span className="absolute top-2 right-2 rounded-md bg-black/40 px-1.5 py-0.5 text-xs font-bold text-white">
              {formatLabel}
            </span>
          )}
        </div>

        {/* 정보 영역: 토스 스타일 패딩 + 계층적 텍스트 */}
        <div className="p-3.5">
          {/* 대회명 */}
          <h4 className="text-sm font-bold text-[var(--color-text-primary)] line-clamp-1 mb-1.5">
            {tournament.name}
          </h4>

          {/* 장소 + 일정 */}
          <div className="space-y-1">
            {(tournament.venueName || tournament.city) && (
              <p className="flex items-center gap-1 text-xs text-[var(--color-text-muted)]">
                <span className="material-symbols-outlined text-xs">location_on</span>
                <span className="truncate">
                  {tournament.venueName ?? tournament.city}
                </span>
              </p>
            )}
            {startStr && (
              <p className="flex items-center gap-1 text-xs text-[var(--color-text-muted)]">
                <span className="material-symbols-outlined text-xs">calendar_today</span>
                {startStr}
              </p>
            )}
          </div>

          {/* 참가 현황 */}
          <p className="mt-2 text-xs font-bold text-[var(--color-primary)]">
            {capacityText}
          </p>
        </div>
      </div>
    </Link>
  );
}
