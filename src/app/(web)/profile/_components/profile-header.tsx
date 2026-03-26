import Image from "next/image";
import Link from "next/link";

/**
 * ProfileHeader - 내 프로필 상단 헤더
 *
 * 디자인 시안(bdr_1/3): 큰 아바타 + 티어 배지 + 이름 + "프로필 수정" 버튼
 * + 포지션/지역/가입일 메타 정보 + 우측 TOTAL GAMES / WIN RATE 통계
 */

interface ProfileHeaderProps {
  nickname: string | null;
  email: string;
  profileImageUrl: string | null;
  /** 포지션 (SF, PG 등) */
  position: string | null;
  /** 활동 지역 */
  city: string | null;
  /** 가입일 ISO 문자열 */
  createdAt?: string | null;
  /** 총 참가 경기 수 */
  totalGames: number;
  /** 승률 (0~100, 결과 확정 경기가 없으면 null) */
  winRate?: number | null;
}

/** 포지션 한글 이름 매핑 */
const POSITION_FULL: Record<string, string> = {
  PG: "Point Guard",
  SG: "Shooting Guard",
  SF: "Small Forward",
  PF: "Power Forward",
  C: "Center",
};

/**
 * 티어 배지 계산 - 총 경기수 기반
 * DB에 티어 필드가 없으므로 프론트에서 임시 계산
 */
function getTierBadge(totalGames: number): { label: string; color: string } {
  if (totalGames >= 100) return { label: "PLATINUM", color: "var(--color-tertiary)" };
  if (totalGames >= 60) return { label: "GOLD", color: "var(--color-tier-gold)" };
  if (totalGames >= 30) return { label: "SILVER", color: "var(--color-tier-silver)" };
  if (totalGames >= 10) return { label: "BRONZE", color: "var(--color-tier-bronze)" };
  return { label: "ROOKIE", color: "var(--color-text-muted)" };
}

export function ProfileHeader({
  nickname,
  email,
  profileImageUrl,
  position,
  city,
  createdAt,
  totalGames,
  winRate,
}: ProfileHeaderProps) {
  const displayName = nickname ?? "사용자";
  const initial = displayName.trim()[0]?.toUpperCase() || "U";
  const tier = getTierBadge(totalGames);

  return (
    <section className="mb-8 flex flex-col md:flex-row items-center md:items-end gap-8">
      {/* 좌측: 아바타 + 티어 배지 */}
      <div className="relative flex-shrink-0">
        <div
          className="w-28 h-28 md:w-36 md:h-36 rounded-xl overflow-hidden border-2 shadow-2xl"
          style={{
            borderColor: "rgba(227, 27, 35, 0.3)",
            backgroundColor: "var(--color-surface-high)",
          }}
        >
          {profileImageUrl ? (
            <Image
              src={profileImageUrl}
              alt={displayName}
              width={144}
              height={144}
              className="w-full h-full object-cover"
            />
          ) : (
            /* 이미지 없을 때 이니셜 표시 */
            <div
              className="w-full h-full flex items-center justify-center text-4xl font-bold"
              style={{ color: "var(--color-primary)", backgroundColor: "var(--color-surface)" }}
            >
              {initial}
            </div>
          )}
        </div>
        {/* 티어 배지: 우하단 오버레이 */}
        <div
          className="absolute -bottom-2 -right-2 text-white text-xs font-bold px-3 py-1 rounded shadow-lg"
          style={{ backgroundColor: tier.color }}
        >
          {tier.label}
        </div>
      </div>

      {/* 중앙: 이름 + 메타 정보 */}
      <div className="flex-1 text-center md:text-left">
        {/* 이름 + 프로필 수정 버튼 */}
        <div className="flex flex-col md:flex-row md:items-center gap-3 mb-3">
          <h1
            className="text-3xl md:text-4xl font-bold tracking-tight"
            style={{ fontFamily: "var(--font-heading)", color: "var(--color-text-primary)" }}
          >
            {displayName}
          </h1>
          <Link
            href="/profile/edit"
            className="inline-flex items-center justify-center text-xs font-semibold px-4 py-2 rounded border transition-all hover:opacity-80"
            style={{
              borderColor: "var(--color-border)",
              backgroundColor: "var(--color-surface-high)",
              color: "var(--color-text-primary)",
            }}
          >
            프로필 수정
          </Link>
        </div>

        {/* 메타 정보: 포지션 / 지역 / 가입일 */}
        <div className="flex flex-wrap justify-center md:justify-start gap-5 text-sm"
          style={{ color: "var(--color-text-secondary)" }}
        >
          {position && (
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-base" style={{ color: "var(--color-primary)" }}>
                category
              </span>
              <span>
                주 포지션:{" "}
                <span style={{ color: "var(--color-text-primary)" }}>
                  {position} {POSITION_FULL[position] ? `(${POSITION_FULL[position]})` : ""}
                </span>
              </span>
            </div>
          )}
          {city && (
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-base" style={{ color: "var(--color-primary)" }}>
                location_on
              </span>
              <span>
                활동 지역:{" "}
                <span style={{ color: "var(--color-text-primary)" }}>{city}</span>
              </span>
            </div>
          )}
          {createdAt && (
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-base" style={{ color: "var(--color-primary)" }}>
                calendar_today
              </span>
              <span>
                가입일:{" "}
                <span style={{ color: "var(--color-text-primary)" }}>
                  {new Date(createdAt).toLocaleDateString("ko-KR")}
                </span>
              </span>
            </div>
          )}
        </div>
      </div>

      {/* 우측: TOTAL GAMES + WIN RATE 통계 카드 */}
      <div className="flex gap-3">
        <div
          className="text-center px-5 py-3 rounded-lg border"
          style={{
            borderColor: "var(--color-border)",
            backgroundColor: "var(--color-surface)",
          }}
        >
          <div
            className="text-2xl font-bold"
            style={{ fontFamily: "var(--font-heading)", color: "var(--color-text-primary)" }}
          >
            {totalGames}
          </div>
          <div className="text-xs uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>
            Total Games
          </div>
        </div>
        <div
          className="text-center px-5 py-3 rounded-lg border"
          style={{
            borderColor: "var(--color-border)",
            backgroundColor: "var(--color-surface)",
          }}
        >
          {/* 승률: API에서 계산된 실제 값 표시 (없으면 -%) */}
          <div
            className="text-2xl font-bold"
            style={{ fontFamily: "var(--font-heading)", color: "var(--color-primary)" }}
          >
            {winRate != null ? `${winRate}%` : "-%"}
          </div>
          <div className="text-xs uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>
            Win Rate
          </div>
        </div>
      </div>
    </section>
  );
}
