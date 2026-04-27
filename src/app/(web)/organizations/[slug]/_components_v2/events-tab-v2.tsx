import Link from "next/link";

/* ============================================================
 * 단체 상세 - 대회·이벤트 탭 v2 (Server Component)
 *
 * 이유(왜):
 *  - 시안은 "이벤트(대회) 카드 리스트"를 보여준다. 우리 DB에서는
 *    organization → tournament_series → tournaments 구조라
 *    series.tournaments 를 평탄화해서 한 줄짜리 이벤트 리스트로 변환.
 *  - 부모 page.tsx 의 기존 include 그대로 받아쓴다 (쿼리 변경 없음).
 *
 * 방법(어떻게):
 *  - series 배열을 받아 [series.id, t] 페어 평탄화
 *  - 각 카드: 좌(시리즈 약식 라벨) / 본문(대회명+편차+날짜) / 우(상세 버튼)
 *  - 빈 결과면 placeholder
 * ============================================================ */

interface SeriesTournament {
  id: number;
  name: string;
  // tournaments.status 는 Prisma 스키마상 nullable → 그대로 받아 fallback 처리
  status: string | null;
  startDate: Date | null;
}

interface SeriesItem {
  id: bigint;
  slug: string;
  name: string;
  tournaments: SeriesTournament[];
}

interface EventsTabV2Props {
  orgSlug: string;
  series: SeriesItem[];
}

export function EventsTabV2({ orgSlug, series }: EventsTabV2Props) {
  // series.tournaments 평탄화 — 각 행에 시리즈 컨텍스트도 보존
  const items = series.flatMap((s) =>
    s.tournaments.map((t) => ({
      tournamentId: t.id,
      tournamentName: t.name,
      tournamentStatus: t.status,
      startDate: t.startDate,
      seriesSlug: s.slug,
      seriesName: s.name,
    }))
  );

  // 시안 그대로 4건 노출 (필요시 추후 확장)
  const visible = items.slice(0, 4);

  if (visible.length === 0) {
    return (
      <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] py-16 text-center">
        <span className="material-symbols-outlined text-4xl text-[var(--color-text-disabled)]">
          event
        </span>
        <p className="mt-2 text-sm text-[var(--color-text-muted)]">
          아직 등록된 대회가 없습니다.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2.5">
      {visible.map((it) => (
        <Link
          // 시리즈 상세로 이동 (개별 대회 상세 라우트 분리 시 변경 가능)
          key={`${it.seriesSlug}-${it.tournamentId}`}
          href={`/organizations/${orgSlug}/series/${it.seriesSlug}`}
          className="grid items-center gap-3.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-[18px] py-3.5 transition-colors hover:border-[var(--color-primary)]"
          style={{
            // 시안 60px / 1fr / auto 그리드 (좌측 시리즈 라벨 / 본문 / 버튼)
            gridTemplateColumns: "60px 1fr auto",
          }}
        >
          {/* 좌측: 시리즈 약식 라벨 (편차 대신 시리즈명 앞 4글자) */}
          <div
            className="text-[11px] font-black uppercase tracking-wide text-[var(--color-info)]"
            title={it.seriesName}
          >
            {it.seriesName.slice(0, 4)}
          </div>

          {/* 본문: 대회명 + 시리즈명 (시안 edition 자리) + 날짜 */}
          <div className="min-w-0">
            <div className="truncate font-bold text-[var(--color-text-primary)]">
              {it.tournamentName}{" "}
              <span className="text-xs font-normal text-[var(--color-text-muted)]">
                {it.seriesName}
              </span>
            </div>
            <div className="mt-0.5 text-xs text-[var(--color-text-muted)]">
              {it.startDate
                ? new Date(it.startDate).toLocaleDateString("ko-KR")
                : "날짜 미정"}{" "}
              · {it.tournamentStatus || "예정"}
            </div>
          </div>

          {/* 우측: 상세 버튼 (Link 자체가 클릭 영역 → 내부 표기는 chip 형태) */}
          <span className="rounded border border-[var(--color-border)] px-3 py-1 text-xs text-[var(--color-text-primary)]">
            상세
          </span>
        </Link>
      ))}
    </div>
  );
}
