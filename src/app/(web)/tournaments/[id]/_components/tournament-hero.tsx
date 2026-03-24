/**
 * 대회 상세 히어로 섹션
 * - 디자인 시안: 전체 너비 그라디언트 배경 + 배지 + 대회명(대형) + 메타(날짜/장소/팀수)
 * - 경기장 이미지가 DB에 없으므로 다크 그라디언트 배경으로 대체
 */

import { Badge } from "@/components/ui/badge";

// 대회 포맷 한글 매핑
const FORMAT_LABEL: Record<string, string> = {
  single_elimination: "싱글 엘리미",
  double_elimination: "더블 엘리미",
  round_robin: "리그전",
  hybrid: "혼합",
};

// 대회 상태 배지 매핑
const STATUS_LABEL: Record<string, { label: string; variant: "default" | "success" | "error" | "warning" | "info" }> = {
  draft:              { label: "준비중",  variant: "default" },
  active:             { label: "모집중",  variant: "info" },
  published:          { label: "모집중",  variant: "info" },
  registration:       { label: "참가접수", variant: "info" },
  registration_open:  { label: "참가접수", variant: "info" },
  registration_closed:{ label: "접수마감", variant: "warning" },
  ongoing:            { label: "진행중",  variant: "success" },
  completed:          { label: "완료",   variant: "default" },
  cancelled:          { label: "취소",   variant: "error" },
};

interface TournamentHeroProps {
  name: string;
  format: string | null;
  status: string | null;
  startDate: Date | null;
  endDate: Date | null;
  city: string | null;
  venueName: string | null;
  teamCount: number;
  maxTeams: number | null;
}

export function TournamentHero({
  name,
  format,
  status,
  startDate,
  endDate,
  city,
  venueName,
  teamCount,
  maxTeams,
}: TournamentHeroProps) {
  const statusInfo = STATUS_LABEL[status ?? "draft"] ?? { label: status ?? "draft", variant: "default" as const };
  const formatLabel = FORMAT_LABEL[format ?? ""] ?? format ?? "";

  // 날짜 포맷
  const dateStr = startDate
    ? `${startDate.toLocaleDateString("ko-KR")}${endDate ? ` ~ ${endDate.toLocaleDateString("ko-KR")}` : ""}`
    : null;

  // 팀 수 표시
  const teamsStr = maxTeams ? `${teamCount} / ${maxTeams}팀` : `${teamCount}팀`;

  return (
    /* 히어로 전체: 다크 그라디언트 배경 (이미지 대신) */
    <section className="relative w-full overflow-hidden" style={{ minHeight: "360px" }}>
      {/* 배경 그라디언트: 어두운 톤에서 primary 컬러를 살짝 비춰주는 효과 */}
      <div
        className="absolute inset-0"
        style={{
          background: "linear-gradient(135deg, var(--color-surface) 0%, var(--color-elevated) 40%, var(--color-surface) 100%)",
        }}
      />
      {/* 하단 페이드: 배경색으로 자연스럽게 이어지도록 */}
      <div
        className="absolute inset-0"
        style={{
          background: "linear-gradient(to top, var(--color-background) 0%, transparent 60%)",
        }}
      />
      {/* 좌측에 살짝 보이는 장식 원 */}
      <div
        className="absolute -left-20 -top-20 h-80 w-80 rounded-full opacity-10"
        style={{ background: "radial-gradient(circle, var(--color-primary) 0%, transparent 70%)" }}
      />

      {/* 콘텐츠 영역 */}
      <div className="relative flex h-full min-h-[360px] flex-col justify-end px-6 pb-10 sm:px-10">
        {/* 배지 그룹: 상태 + 포맷 */}
        <div className="mb-4 flex items-center gap-3">
          <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
          {formatLabel && (
            <span
              className="rounded-sm px-3 py-1 text-xs font-bold uppercase tracking-wider text-white"
              style={{ backgroundColor: "var(--color-primary)" }}
            >
              {formatLabel}
            </span>
          )}
        </div>

        {/* 대회명: 대형 타이포그래피 */}
        <h1
          className="mb-6 text-4xl font-extrabold uppercase leading-none tracking-tight sm:text-5xl lg:text-6xl"
          style={{ fontFamily: "var(--font-heading)", color: "var(--color-text-primary)" }}
        >
          {name}
        </h1>

        {/* 메타 정보: 날짜 / 장소 / 팀수 (아이콘 + 텍스트) */}
        <div className="flex flex-wrap gap-6">
          {dateStr && (
            <div className="flex items-center gap-2">
              <span
                className="material-symbols-outlined text-lg"
                style={{ color: "var(--color-primary)" }}
              >
                calendar_today
              </span>
              <span className="text-sm font-medium sm:text-base" style={{ color: "var(--color-text-secondary)" }}>
                {dateStr}
              </span>
            </div>
          )}
          {(city || venueName) && (
            <div className="flex items-center gap-2">
              <span
                className="material-symbols-outlined text-lg"
                style={{ color: "var(--color-primary)" }}
              >
                location_on
              </span>
              <span className="text-sm font-medium sm:text-base" style={{ color: "var(--color-text-secondary)" }}>
                {[city, venueName].filter(Boolean).join(" ")}
              </span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <span
              className="material-symbols-outlined text-lg"
              style={{ color: "var(--color-primary)" }}
            >
              groups
            </span>
            <span className="text-sm font-medium sm:text-base" style={{ color: "var(--color-text-secondary)" }}>
              {teamsStr}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
