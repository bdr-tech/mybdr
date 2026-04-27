"use client";

/**
 * 대진표 v2 — Status Bar (5칸 stat)
 *
 * 시안: Bracket.jsx L116~130 (5-col grid card)
 *  [참가팀] [경기완료] [진행중] [현재라운드] [우승상금]
 *
 * 데이터 매핑:
 *  - 참가팀: API totalTeams (모름이면 "-")
 *  - 경기완료: completedMatches / totalMatches
 *  - 진행중: liveMatchCount (LIVE 강조)
 *  - 현재라운드: rounds 중 마지막 미완료(or 마지막 라운드) 이름
 *  - 우승상금: tournament.prize_money 미존재 → "-" (추후 구현 목록)
 *
 * 모바일: 시안은 데스크톱 5col 가정 → 모바일에선 2col로 자동 wrap
 *  (시안은 5col 강제이지만 시안이 데스크톱 와이드 기준이라 현실적인 절충)
 */

type Stat = {
  label: string;
  value: string;
  sub: string;
  // 진행중(LIVE)만 강조 색상
  highlight?: boolean;
};

interface V2BracketStatusBarProps {
  totalTeams: number;
  completedMatches: number;
  totalMatches: number;
  liveMatchCount: number;
  // 현재 라운드 라벨 (예: "8강", "준결승") — 미정이면 "-"
  currentRoundLabel: string | null;
  // 우승상금: 현재 DB 미지원 → 항상 null이 들어옴 (자리는 유지)
  prizeMoney: number | null;
}

export function V2BracketStatusBar({
  totalTeams,
  completedMatches,
  totalMatches,
  liveMatchCount,
  currentRoundLabel,
  prizeMoney,
}: V2BracketStatusBarProps) {
  // 통화 포맷 — 시안은 "₩3,000,000" 형태
  const prizeText = prizeMoney != null && prizeMoney > 0
    ? `₩${prizeMoney.toLocaleString("ko-KR")}`
    : "-";

  const stats: Stat[] = [
    { label: "참가팀", value: String(totalTeams), sub: totalTeams > 0 ? "전원 본선" : "" },
    { label: "경기완료", value: String(completedMatches), sub: `/ ${totalMatches}경기` },
    { label: "진행중", value: String(liveMatchCount), sub: liveMatchCount > 0 ? "LIVE" : "—", highlight: liveMatchCount > 0 },
    { label: "현재라운드", value: currentRoundLabel ?? "-", sub: "" },
    { label: "우승상금", value: prizeText, sub: prizeMoney ? "+ 트로피" : "준비 중" },
  ];

  return (
    <div
      // 카드 컨테이너 — 시안 .card 스타일 차용 (CSS 변수만 사용, 하드코딩 금지)
      className="rounded-md border"
      style={{
        borderColor: "var(--color-border)",
        backgroundColor: "var(--color-card)",
      }}
    >
      {/* 시안은 5col 강제. 모바일은 2col → sm 3col → lg 5col 으로 점진 확장 */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
        {stats.map((s, i) => (
          <div
            key={s.label}
            className="px-3 py-3 text-center sm:px-4 sm:py-4"
            // 시안: 두 번째 셀부터 좌측 구분선 — 모바일 2col에선 어색하므로 lg부터만 적용
            style={{
              borderLeft: i > 0 ? "1px solid var(--color-border)" : undefined,
            }}
          >
            <div
              // 라벨 (대문자 느낌의 작은 글자)
              className="text-[10px] font-extrabold tracking-[0.12em]"
              style={{ color: "var(--color-text-muted)" }}
            >
              {s.label}
            </div>
            <div
              // 메인 수치 (큰 숫자) — LIVE면 빨강
              className="mt-1 text-xl font-black"
              style={{
                fontFamily: "var(--font-heading, var(--font-display))",
                color: s.highlight ? "var(--color-error)" : "var(--color-text-primary)",
              }}
            >
              {s.value}
            </div>
            {s.sub && (
              <div
                className="text-[10px] font-mono"
                style={{ color: "var(--color-text-muted)" }}
              >
                {s.sub}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
