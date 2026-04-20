import Link from "next/link";
import type { Metadata } from "next";

// SEO: 용어 사전 페이지 메타데이터
export const metadata: Metadata = {
  title: "용어 사전 | MyBDR",
  description:
    "MyBDR에서 쓰는 농구 관련 용어(대회, 경기, 픽업, 게스트, 디비전, 시드, 토너먼트, 풀리그)를 쉽게 정리했습니다.",
};

/* ============================================================
 * 용어 사전 (Help > Glossary) — W4 L1
 *
 * 이유: 서비스 내 용어가 중첩되어 신규 사용자가 "대회 vs 경기",
 *      "픽업 vs 게스트 vs 연습경기", "토너먼트 vs 풀리그"
 *      같은 구분을 어려워함. 한 곳에서 짧은 설명 + 예시 + 관련
 *      링크를 제공해 내비게이션 편의를 높인다.
 *
 * 구조: 정적 서버 컴포넌트. 각 용어를 <section> 단위로 나열하고
 *      관련 링크를 Link로 연결해 탐색을 유도한다.
 *
 * 디자인: /terms, /privacy 패턴에 맞춰 var(--color-*) 변수 사용.
 *        Material Symbols 아이콘은 섹션 헤더 왼쪽에 소형 배치.
 * ============================================================ */

// 용어 1건 타입 — 섹션 반복 렌더링을 위한 구조화
type GlossaryEntry = {
  term: string; // 한글 용어
  english?: string; // 영문/부연
  icon: string; // Material Symbols 이름
  description: string; // 1~2문장 설명
  example?: string; // 예시 (선택)
  links?: { href: string; label: string }[]; // 관련 내부 링크
};

// 최소 스코프 9개 — 기획서 권장(대회/경기/픽업/게스트/디비전/시드/토너먼트/풀리그 등)
const entries: GlossaryEntry[] = [
  {
    term: "대회",
    english: "Tournament",
    icon: "emoji_events",
    description:
      "정해진 기간 동안 여러 팀이 우승을 다투는 경기 묶음입니다. 토너먼트, 풀리그, 혼합(리그+토너먼트) 방식이 있습니다.",
    example: "예: BDR 서울 오픈 2026 (16팀 · 2일간 · 풀리그+결선 토너먼트)",
    links: [{ href: "/tournaments", label: "진행 중인 대회 보기" }],
  },
  {
    term: "경기",
    english: "Game",
    icon: "sports_basketball",
    description:
      "단일 경기 단위입니다. 픽업·게스트·연습경기 3가지 유형으로 구분되며, 대회 내 경기와는 별개로 누구나 만들고 참가 신청할 수 있습니다.",
    example: "예: 강남구 토요일 저녁 픽업, A팀 게스트 모집",
    links: [{ href: "/games", label: "모집 중인 경기 보기" }],
  },
  {
    term: "픽업",
    english: "Pickup",
    icon: "group_add",
    description:
      "개인이 서로 모여 즉석에서 팀을 짜는 공개 경기입니다. 개인 단위 참가 신청으로 팀이 구성됩니다.",
    example: "예: 10명 모집 → 추첨/순서대로 5:5 팀 배정",
    links: [{ href: "/games?type=pickup", label: "픽업 경기 보기" }],
  },
  {
    term: "게스트",
    english: "Guest",
    icon: "person_add",
    description:
      "기존 팀이 부족한 인원을 채우기 위해 외부 선수를 초청하는 경기입니다. 주축은 팀원이고, 게스트 몇 명이 합류합니다.",
    example: "예: A팀 주축 7명 + 게스트 3명 모집",
    links: [{ href: "/games?type=guest", label: "게스트 경기 보기" }],
  },
  {
    term: "연습경기",
    english: "Practice Match",
    icon: "fitness_center",
    description:
      "두 팀이 비공식적으로 만나 치르는 경기입니다. 승패나 개인 기록이 공식 랭킹·커리어에 반영되지 않습니다.",
    example: "예: B팀 vs C팀 주말 연습경기",
    links: [{ href: "/games?type=practice", label: "연습경기 보기" }],
  },
  {
    term: "디비전",
    english: "Division",
    icon: "category",
    description:
      "대회 내에서 실력·나이 등 기준으로 나눈 참가 그룹입니다. 한 대회 안에서 여러 디비전이 동시에 진행될 수 있습니다.",
    example: "예: 오픈 · 챌린저 · 비기너 3개 디비전",
  },
  {
    term: "시드",
    english: "Seed",
    icon: "star",
    description:
      "대진 추첨 시 상위 팀에게 부여하는 우선 배정입니다. 강팀끼리 초반에 만나지 않도록 분산 배치하는 역할을 합니다.",
    example: "예: 직전 대회 4강 이상 팀에게 1~4번 시드",
  },
  {
    term: "토너먼트 (싱글/더블 엘리미네이션)",
    english: "Single/Double Elimination",
    icon: "account_tree",
    description:
      "승자만 다음 라운드로 올라가는 방식입니다. 한 번 지면(싱글) 또는 두 번 지면(더블) 탈락합니다.",
    example: "예: 8강 → 4강 → 결승 (싱글 엘리미네이션)",
  },
  {
    term: "풀리그",
    english: "Round Robin",
    icon: "swap_horiz",
    description:
      "모든 팀이 서로 한 번씩 경기를 치르는 방식입니다. 순위는 누적 승수와 득실점 차로 결정합니다.",
    example: "예: 4팀 풀리그 → 총 6경기 → 1~4위 확정",
  },
];

export default function GlossaryPage() {
  return (
    <div className="mx-auto max-w-2xl py-10">
      {/* 헤더 */}
      <div className="mb-8">
        <h1
          className="text-xl font-bold sm:text-2xl"
          style={{ color: "var(--color-text-primary)" }}
        >
          용어 사전
        </h1>
        <p
          className="mt-1 text-sm"
          style={{ color: "var(--color-text-muted)" }}
        >
          MyBDR에서 자주 쓰는 농구 용어를 한 곳에서 확인하세요.
        </p>
      </div>

      {/* 용어 목록 */}
      <div className="space-y-8">
        {entries.map((e) => (
          <section
            key={e.term}
            // 항목마다 얇은 상단 구분선 — 스크롤 가독성 확보
            className="border-t pt-6 first:border-t-0 first:pt-0"
            style={{ borderColor: "var(--color-border)" }}
          >
            {/* 제목 줄: 아이콘 + 한글 용어 + 영문 부연 */}
            <div className="mb-2 flex items-center gap-2">
              <span
                className="material-symbols-outlined text-lg"
                style={{ color: "var(--color-primary)" }}
                aria-hidden
              >
                {e.icon}
              </span>
              <h2
                className="text-base font-semibold"
                style={{ color: "var(--color-text-primary)" }}
              >
                {e.term}
              </h2>
              {e.english && (
                <span
                  className="text-xs font-medium"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  · {e.english}
                </span>
              )}
            </div>

            {/* 설명 */}
            <p
              className="text-sm leading-relaxed"
              style={{ color: "var(--color-text-secondary)" }}
            >
              {e.description}
            </p>

            {/* 예시 (선택) — 살짝 들여쓰기한 박스 */}
            {e.example && (
              <p
                className="mt-2 text-xs leading-relaxed"
                style={{ color: "var(--color-text-muted)" }}
              >
                {e.example}
              </p>
            )}

            {/* 관련 링크 (선택) */}
            {e.links && e.links.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {e.links.map((l) => (
                  <Link
                    key={l.href}
                    href={l.href}
                    // 라벨형 링크 — border-radius 4px, CLAUDE.md 컨벤션
                    className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold transition-colors"
                    style={{
                      border: "1px solid var(--color-border)",
                      color: "var(--color-text-secondary)",
                      borderRadius: 4,
                    }}
                  >
                    {l.label}
                    <span
                      className="material-symbols-outlined text-sm"
                      aria-hidden
                    >
                      arrow_forward
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </section>
        ))}
      </div>

      {/* 하단 안내 — 더 궁금한 점이 있을 때 */}
      <div
        className="mt-10 rounded-md p-4 text-xs leading-relaxed"
        style={{
          backgroundColor: "var(--color-bg-secondary)",
          color: "var(--color-text-muted)",
          border: "1px solid var(--color-border)",
          borderRadius: 4,
        }}
      >
        <p>
          궁금한 용어가 더 있다면{" "}
          <a
            href="mailto:bdr.wonyoung@gmail.com"
            className="font-semibold underline"
            style={{ color: "var(--color-primary)" }}
          >
            bdr.wonyoung@gmail.com
          </a>
          으로 알려주세요. 다음 업데이트에 추가하겠습니다.
        </p>
      </div>
    </div>
  );
}
