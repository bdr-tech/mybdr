"use client";

/**
 * 대진표 v2 — Header (eyebrow + h1 + 부제 + select + 액션 버튼)
 *
 * 시안: Bracket.jsx L97~113
 *  - eyebrow: "BRACKET · SINGLE ELIMINATION"
 *  - h1: "Kings Cup Vol.07 · 본선"
 *  - 부제: "8팀 · 싱글 엘리미네이션 · 2026.05.09 ~ 05.17 · 장충체육관"
 *  - select: 같은 시리즈의 다른 회차 (있으면 동작, 없으면 disabled)
 *  - 버튼 3종: 저장 / 공유 / 출력 — 모두 alert("준비 중") 처리
 *
 * 사용자 원칙: "DB 미지원도 제거 금지" → select 자체는 유지하고
 *   시리즈 회차 데이터가 부족하면 disabled + 옵션 1개("준비 중")로 폴백.
 */

import { useRouter } from "next/navigation";

interface SeriesEdition {
  // 라우팅용 tournament id
  id: string;
  // select option label (예: "Vol.07 본선")
  label: string;
  // 현재 페이지 표시 여부
  isCurrent: boolean;
}

interface V2BracketHeaderProps {
  // 라운드 헤더 라벨 (예: "BRACKET · SINGLE ELIMINATION") — 포맷에 따라 분기
  eyebrow: string;
  // h1: 대회명 + 회차 (예: "Kings Cup Vol.07 · 본선")
  title: string;
  // 부제 한 줄 (예: "8팀 · 싱글 엘리미네이션 · 2026.05.09 ~ 05.17 · 장충체육관")
  subtitle: string;
  // 같은 시리즈 회차 목록 — 없으면 빈 배열 (select 자동 disabled)
  seriesEditions: SeriesEdition[];
  // 현재 토너먼트 id (select 기본값)
  currentTournamentId: string;
}

export function V2BracketHeader({
  eyebrow,
  title,
  subtitle,
  seriesEditions,
  currentTournamentId,
}: V2BracketHeaderProps) {
  const router = useRouter();

  // 시리즈에 다른 회차가 1개 이상 있어야만 의미 있음 → 그 외엔 disabled
  // (현재 회차 1개만 있어도 "선택지 없음"이므로 disabled 처리)
  const hasMultipleEditions = seriesEditions.length > 1;

  // 저장/공유/출력은 추후 구현 — 사용자 원칙: 자리는 유지하고 안내
  const handleNotReady = (label: string) => () => {
    alert(`${label} 기능은 준비 중입니다.`);
  };

  // select 변경 시 해당 토너먼트 bracket 탭으로 라우팅
  // 같은 페이지 다른 ID이므로 router.push로 이동
  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nextId = e.target.value;
    if (nextId && nextId !== currentTournamentId) {
      router.push(`/tournaments/${nextId}?tab=bracket`);
    }
  };

  return (
    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      {/* 좌측: eyebrow + h1 + 부제 */}
      <div className="min-w-0">
        <div
          // eyebrow — 작은 대문자 라벨 (시안 .eyebrow)
          className="text-[10px] font-extrabold tracking-[0.16em]"
          style={{ color: "var(--color-text-muted)" }}
        >
          {eyebrow}
        </div>
        <h1
          // h1 — 큰 제목 (display 폰트, 800 weight)
          className="mt-1 text-2xl font-extrabold tracking-tight sm:text-3xl"
          style={{
            fontFamily: "var(--font-heading, var(--font-display))",
            color: "var(--color-text-primary)",
          }}
        >
          {title}
        </h1>
        <p
          // 부제 한 줄
          className="mt-1 text-xs sm:text-sm"
          style={{ color: "var(--color-text-muted)" }}
        >
          {subtitle}
        </p>
      </div>

      {/* 우측: select + 버튼 3종 */}
      <div className="flex flex-wrap items-center gap-1.5">
        <select
          // 시리즈 회차 select — 시안 L104~108
          // 데이터 부족(편차 1개 이하)이면 disabled
          value={currentTournamentId}
          onChange={handleSelectChange}
          disabled={!hasMultipleEditions}
          className="rounded border px-2 py-1 text-xs disabled:cursor-not-allowed disabled:opacity-50"
          style={{
            borderColor: "var(--color-border)",
            backgroundColor: "var(--color-card)",
            color: "var(--color-text-primary)",
            minWidth: 140,
          }}
          title={hasMultipleEditions ? "다른 회차로 이동" : "다른 회차 데이터 준비 중"}
        >
          {hasMultipleEditions ? (
            seriesEditions.map((ed) => (
              <option key={ed.id} value={ed.id}>
                {ed.label}
              </option>
            ))
          ) : (
            // 폴백: 현재 회차 단일 옵션 (disabled 상태)
            <option value={currentTournamentId}>준비 중</option>
          )}
        </select>

        {/* 저장 — 사용자 원칙: 시안 자리 유지 + 동작은 준비 중 */}
        <button
          type="button"
          onClick={handleNotReady("저장")}
          className="inline-flex items-center gap-1 rounded border px-2.5 py-1 text-xs transition-colors hover:bg-[var(--color-elevated)]"
          style={{
            borderColor: "var(--color-border)",
            color: "var(--color-text-secondary)",
          }}
        >
          <span className="material-symbols-outlined text-sm">bookmark</span>
          저장
        </button>

        {/* 공유 */}
        <button
          type="button"
          onClick={handleNotReady("공유")}
          className="inline-flex items-center gap-1 rounded border px-2.5 py-1 text-xs transition-colors hover:bg-[var(--color-elevated)]"
          style={{
            borderColor: "var(--color-border)",
            color: "var(--color-text-secondary)",
          }}
        >
          <span className="material-symbols-outlined text-sm">share</span>
          공유
        </button>

        {/* 출력 (대진표 PDF/이미지) */}
        <button
          type="button"
          onClick={handleNotReady("출력")}
          className="inline-flex items-center gap-1 rounded border px-2.5 py-1 text-xs transition-colors hover:bg-[var(--color-elevated)]"
          style={{
            borderColor: "var(--color-border)",
            color: "var(--color-text-secondary)",
          }}
        >
          <span className="material-symbols-outlined text-sm">print</span>
          출력
        </button>
      </div>
    </div>
  );
}

export type { SeriesEdition };
