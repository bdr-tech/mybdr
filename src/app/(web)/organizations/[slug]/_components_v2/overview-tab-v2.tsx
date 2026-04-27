/* ============================================================
 * 단체 상세 - 소개 탭 v2 (Server Component)
 *
 * 이유(왜):
 *  - v2 시안은 좌(소개+운영원칙) / 우(연락처+스폰서) 2칸 그리드.
 *  - "운영 원칙" / "주요 스폰서" / "본부 주소" 는 DB에 컬럼이 없음
 *    → scratchpad "Phase 3 Orgs 추후 구현 목록"과 일치하도록
 *      "준비 중" placeholder로 표시 (UI는 살리되 빈 상태).
 *  - 데이터 패칭 변경 없음. 부모 page에서 받아온 props만 사용.
 * ============================================================ */

interface OverviewTabV2Props {
  description: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  websiteUrl: string | null;
}

export function OverviewTabV2({
  description,
  contactEmail,
  contactPhone,
  websiteUrl,
}: OverviewTabV2Props) {
  return (
    // 시안 그대로 좌측은 1fr, 우측은 300px 고정. lg 미만에선 1열 스택
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
      {/* 좌측: 단체 소개 + 운영 원칙 */}
      <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-[26px] py-6">
        <h2 className="mb-3 text-lg font-bold text-[var(--color-text-primary)]">
          단체 소개
        </h2>
        <p className="mb-3.5 leading-[1.75] text-[var(--color-text-secondary)]">
          {description || "단체 소개가 아직 등록되지 않았습니다."}
        </p>

        {/* 운영 원칙 — DB 컬럼 없음. "준비 중" 안내 (구현 시 별도 필드 추가 필요) */}
        <h3 className="mb-2.5 mt-5 text-[15px] font-bold text-[var(--color-text-primary)]">
          운영 원칙
        </h3>
        <p className="m-0 text-sm leading-[1.7] text-[var(--color-text-muted)]">
          운영 원칙은 준비 중입니다.
        </p>
      </div>

      {/* 우측: 연락처 + 스폰서 (300px 고정) */}
      <div className="flex flex-col gap-3">
        {/* 연락처 카드 — DB 값이 있으면 노출, 없으면 placeholder */}
        <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-[18px]">
          <div className="mb-2.5 text-sm font-bold text-[var(--color-text-primary)]">
            연락처
          </div>
          <div className="space-y-1.5 text-[13px] leading-[1.8] text-[var(--color-text-secondary)]">
            {/* 이메일 */}
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-base">mail</span>
              <span>{contactEmail || "준비 중"}</span>
            </div>
            {/* 전화 */}
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-base">phone</span>
              <span>{contactPhone || "준비 중"}</span>
            </div>
            {/* 본부 주소 — organizations에 address 컬럼 없음 → "준비 중" */}
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-base">
                business
              </span>
              <span className="text-[var(--color-text-muted)]">준비 중</span>
            </div>
            {/* 웹사이트 (있을 때만 노출) */}
            {websiteUrl && (
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-base">
                  language
                </span>
                <a
                  href={websiteUrl}
                  target="_blank"
                  rel="noopener"
                  className="text-[var(--color-info)] hover:underline"
                >
                  웹사이트
                </a>
              </div>
            )}
          </div>
        </div>

        {/* 주요 스폰서 — DB 컬럼 없음 → "준비 중" placeholder */}
        <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-[18px]">
          <div className="mb-2.5 text-sm font-bold text-[var(--color-text-primary)]">
            주요 스폰서
          </div>
          <p className="m-0 text-[13px] text-[var(--color-text-muted)]">
            스폰서 정보는 준비 중입니다.
          </p>
        </div>
      </div>
    </div>
  );
}
