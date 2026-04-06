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
        {/* 컴팩트 카드에 맞춰 스켈레톤도 낮은 높이로 */}
        <div className="flex gap-3 overflow-hidden">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-[112px] w-[280px] rounded-md shrink-0" />
          ))}
        </div>
      </section>
    );
  }

  return (
    <section>
      {/* 2K 스타일 헤더: 두껍고 기울어짐 */}
      <div className="flex items-end justify-between mb-4 pb-2 border-b-2 border-[var(--color-border)]">
        <h2 className="text-xl md:text-2xl font-black uppercase tracking-tighter drop-shadow-sm">
          추천 대회
        </h2>
        <Link href="/tournaments" className="text-[10px] font-black text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-colors uppercase">
          VIEW ALL &raquo;
        </Link>
      </div>

      {/* 가로 스크롤 캐러셀: 추천경기와 동일한 패턴 */}
      <div className="flex gap-3 overflow-x-auto no-scrollbar -mx-5 px-5 pb-2">
        {tournaments.map((tournament) => (
          <TournamentCard key={tournament.id} tournament={tournament} />
        ))}
      </div>
    </section>
  );
}

/* ---- 개별 대회 카드: 컴팩트 가로형 (아이콘 64x64 + 우측 정보) ---- */
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

  const locationStr = tournament.venueName ?? tournament.city ?? "";

  return (
    <Link href={href} className="block shrink-0 w-[280px]">
      {/* 컴팩트 카드: 가로 배치, 네온 호버 효과 유지 */}
      <div
        className="group rounded-md overflow-hidden bg-[var(--color-card)] transition-all duration-300 hover:-translate-y-1 hover:shadow-glow-primary border border-transparent hover:border-[var(--color-primary)] flex flex-row relative h-[112px]"
        style={{ boxShadow: "var(--shadow-card)" }}
      >
        {/* 좌측 아이콘/그라디언트 영역 (64px 고정) */}
        <div
          className="relative w-16 h-[112px] shrink-0 flex items-center justify-center"
          style={{ background: gradient }}
        >
          <span className="material-symbols-outlined text-2xl text-white/40">
            emoji_events
          </span>
        </div>

        {/* 우측 정보 영역 */}
        <div className="flex-1 min-w-0 p-2.5 flex flex-col justify-center gap-1">
          {/* 1행: 상태 뱃지 + 포맷 뱃지 */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {statusLabel && (
              <span
                className="px-1.5 py-0.5 text-[9px] font-black uppercase rounded-sm bg-white/90 leading-none"
                style={{ color: "var(--color-primary)" }}
              >
                {statusLabel}
              </span>
            )}
            {formatLabel && (
              <span className="rounded-sm bg-black/60 px-1.5 py-0.5 text-[9px] font-black text-white leading-none">
                {formatLabel}
              </span>
            )}
          </div>

          {/* 2행: 대회명 (1줄 말줄임) */}
          <h4 className="text-sm font-extrabold text-[var(--color-text-primary)] truncate leading-tight tracking-tight uppercase group-hover:text-[var(--color-primary)] transition-colors">
            {tournament.name}
          </h4>

          {/* 3행: 장소 + 일정 (한 줄로 · 구분) */}
          <p className="text-[11px] text-[var(--color-text-muted)] font-medium truncate flex items-center gap-1">
            {locationStr && (
              <>
                <span className="material-symbols-outlined text-[12px]">location_on</span>
                <span className="truncate">{locationStr}</span>
              </>
            )}
            {locationStr && startStr && <span className="opacity-40">·</span>}
            {startStr && (
              <>
                <span className="material-symbols-outlined text-[12px]">calendar_today</span>
                <span className="whitespace-nowrap">{startStr}</span>
              </>
            )}
          </p>

          {/* 4행: 참가 현황 */}
          <p className="flex items-center gap-1.5">
            <span className="text-[9px] uppercase font-black tracking-wider text-[var(--color-text-muted)]">ENTRY</span>
            <span className="text-[11px] font-black text-[var(--color-primary)]">
              {capacityText}
            </span>
          </p>
        </div>
      </div>
    </Link>
  );
}
