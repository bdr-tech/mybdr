"use client";

import { pickColor, generateTag } from "./org-color";

/* ============================================================
 * 단체 상세 Hero v2 — design/BDR v2/screens/OrgDetail.jsx 기반
 *
 * 이유(왜):
 *  - v1은 "로고 + 헤더" 평면 레이아웃이었으나 v2 시안은 단체별 brand color
 *    그라디언트로 시각 임팩트를 강화한다.
 *  - 가입 신청 버튼은 우측에 노출하되, DB/API 미지원이므로 alert("준비 중")
 *    로 대응 (scratchpad "Phase 3 Orgs" 추후 구현 목록과 일치).
 *
 * 방법(어떻게):
 *  - 클라이언트 컴포넌트 (alert 핸들러 필요)
 *  - 색상은 `pickColor(org.id)` 결정적 매핑 → linear-gradient 배경
 *  - 메타 라인은 시안 그대로 "회원 N명 / 팀 N개 / 설립 N년" 표기
 *    └ 팀 수: DB 집계 미구현 → "준비 중" 표기
 *    └ 설립: organizations.founded_year 컬럼 미존재 → "준비 중" 표기
 * ============================================================ */

interface OrgHeroV2Props {
  id: string;
  name: string;
  logoUrl: string | null;
  region: string | null;
  description: string | null;
  membersCount: number;
}

export function OrgHeroV2({
  id,
  name,
  logoUrl,
  region,
  description,
  membersCount,
}: OrgHeroV2Props) {
  // 단체별 결정적 brand color (DB 컬럼 없을 때의 fallback)
  const color = pickColor(id);
  const tag = generateTag(name);

  // 가입 신청: API 미구현 → 준비 중 안내
  const handleApply = () => {
    alert("준비 중인 기능입니다");
  };

  return (
    <div
      className="relative mb-5 overflow-hidden rounded-lg px-8 py-9 text-white"
      style={{
        // 시안 그대로: 단체 색상 → 60% 지점에서 어두운 배경으로 페이드
        background: `linear-gradient(135deg, ${color}, ${color}AA 60%, #0B0D10)`,
      }}
    >
      <div className="flex flex-wrap items-end gap-5">
        {/* 로고 또는 태그 박스 (96x96) */}
        {logoUrl ? (
          // 시안에서 정의된 96x96 라운드 박스. 현재 카드 v2와 동일하게
          // <img> 사용 (next/image 도입은 운영 DB 분리 후 일괄 작업 예정)
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={logoUrl}
            alt={name}
            className="h-24 w-24 flex-shrink-0 rounded-[10px] object-cover"
            style={{ background: "rgba(255,255,255,0.18)" }}
          />
        ) : (
          <div
            className="flex h-24 w-24 flex-shrink-0 items-center justify-center rounded-[10px] text-base font-extrabold tracking-wide"
            style={{ background: "rgba(255,255,255,0.18)" }}
          >
            {tag}
          </div>
        )}

        {/* 본문 정보 */}
        <div className="min-w-0 flex-1">
          {/* eyebrow: kind · area — kind 컬럼 미존재 → "단체" 고정 */}
          <div className="text-[11px] font-extrabold tracking-[0.12em] opacity-85">
            단체 · {region || "전국"}
          </div>
          {/* 단체명: 시안 fontSize 40 + tracking -0.02em */}
          <h1
            className="mt-1.5 text-[40px] font-black leading-tight tracking-[-0.02em]"
            style={{ marginBottom: 4 }}
          >
            {name}
          </h1>
          {/* 설명 (없으면 placeholder) */}
          <div className="mb-2.5 text-sm opacity-90">
            {description || "단체 소개가 없습니다."}
          </div>
          {/* 메타: 회원 / 팀 / 설립 — 팀 수 + 설립연도는 "준비 중" */}
          <div className="flex flex-wrap gap-[18px] text-[13px] opacity-90">
            <span>
              <span className="material-symbols-outlined mr-0.5 align-middle text-base">
                group
              </span>
              회원 {membersCount}명
            </span>
            <span title="팀 집계 준비 중">
              <span className="material-symbols-outlined mr-0.5 align-middle text-base">
                sports_basketball
              </span>
              팀 준비 중
            </span>
            <span title="설립 연도 준비 중">
              <span className="material-symbols-outlined mr-0.5 align-middle text-base">
                calendar_month
              </span>
              설립 준비 중
            </span>
          </div>
        </div>

        {/* 가입 신청 버튼 (alert) */}
        <button
          type="button"
          onClick={handleApply}
          className="rounded bg-[var(--color-primary)] px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[var(--color-primary-hover)]"
        >
          가입 신청
        </button>
      </div>
    </div>
  );
}
