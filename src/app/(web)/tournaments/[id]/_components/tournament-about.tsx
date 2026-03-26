/**
 * 대회 설명 섹션 (About the Tournament)
 * - parseDescription 로직을 page.tsx에서 그대로 가져옴 (100% 동일)
 * - 렌더링 스타일만 시안(bdr_1/bdr_5)에 맞게 교체
 * - 시안: 카드 스타일 + 좌측 빨간 바 제목 + 아이콘 활용
 */

// -- 대회 설명 파서 (기존 로직 100% 유지) --

type Section =
  | { type: "keyvalue"; items: [string, string][] }
  | { type: "numbered"; title: string; items: string[] }
  | { type: "bullets"; title: string; items: string[] }
  | { type: "prizes"; title: string; items: { rank: string; items: string[] }[] }
  | { type: "misc"; items: { label?: string; value: string; url?: string }[] }
  | { type: "sponsors"; sponsors: string[] };

function parsePrizeLine(line: string): { rank: string; items: string[] } {
  // "MVP: 트로피 / 부상"
  const colonMatch = line.match(/^([^:]+):\s*(.+)/);
  if (colonMatch) {
    return { rank: colonMatch[1].trim(), items: colonMatch[2].split("/").map((s) => s.trim()) };
  }
  // "우승 트로피 / 상금 50만원"
  const [rank, ...rest] = line.split(" ");
  return { rank, items: rest.join(" ").split("/").map((s) => s.trim()) };
}

function parseDescription(text: string): Section[] {
  const paragraphs = text.trim().split(/\n\n+/);
  const sections: Section[] = [];

  for (const para of paragraphs) {
    const lines = para.split("\n").map((l) => l.trim()).filter(Boolean);
    if (!lines.length) continue;

    const [first, ...rest] = lines;

    // Sponsored By
    if (first.startsWith("Sponsored By:")) {
      const val = first.replace("Sponsored By:", "").trim();
      sections.push({ type: "sponsors", sponsors: val.split(",").map((s) => s.trim()) });
      continue;
    }

    // 모든 줄이 key:value 형식
    const allKV = lines.every((l) => /^[^:]+:\s*.+/.test(l));
    if (allKV) {
      const items = lines.map((l) => {
        const idx = l.indexOf(":");
        return [l.slice(0, idx).trim(), l.slice(idx + 1).trim()] as [string, string];
      });
      sections.push({ type: "keyvalue", items });
      continue;
    }

    // 첫 줄이 섹션 헤더
    if (rest.length > 0 && !first.startsWith("-") && !/^\d+\./.test(first)) {
      if (rest.every((l) => /^\d+\./.test(l))) {
        sections.push({
          type: "numbered",
          title: first,
          items: rest.map((l) => l.replace(/^\d+\.\s*/, "")),
        });
        continue;
      }
      if (rest.every((l) => l.startsWith("-"))) {
        sections.push({
          type: "bullets",
          title: first,
          items: rest.map((l) => l.replace(/^-\s*/, "")),
        });
        continue;
      }
      if (first.includes("시상")) {
        sections.push({
          type: "prizes",
          title: first,
          items: rest.map(parsePrizeLine),
        });
        continue;
      }
    }

    // 기타 (혼합)
    const miscItems = lines.map((l) => {
      const urlMatch = l.match(/\(?(https?:\/\/[^\s)]+)\)?/);
      const kvMatch = l.match(/^([^:]+):\s*(.+)/);
      if (kvMatch) {
        return { label: kvMatch[1].trim(), value: kvMatch[2].trim(), url: urlMatch?.[1] };
      }
      return { value: l, url: urlMatch?.[1] };
    });
    sections.push({ type: "misc", items: miscItems });
  }

  return sections;
}

// -- 순위 아이콘 매핑 --
const PRIZE_ICON: Record<string, string> = { 우승: "1st", 준우승: "2nd", MVP: "MVP" };

// -- 섹션 제목 컴포넌트: 좌측 빨간 바 + 제목 (시안 스타일) --
function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="mb-4 flex items-center gap-2 text-lg font-bold">
      {/* 좌측 빨간 바 (시안 bdr_5의 제목 앞 장식) */}
      <span
        className="h-6 w-1.5 flex-shrink-0 rounded-full"
        style={{ backgroundColor: "var(--color-primary)" }}
      />
      {children}
    </h3>
  );
}

// -- 메인 컴포넌트 --
export function TournamentAbout({
  description,
  categories,
  format,
}: {
  description: string;
  categories: Record<string, string[]>;
  format: string | null;
}) {
  const sections = parseDescription(description);
  const hasCategories = Object.keys(categories).length > 0;

  // 포맷 라벨 -- DB에 저장된 영어 포맷값을 한글로 변환
  const FORMAT_LABEL: Record<string, string> = {
    single_elimination: "싱글 엘리미네이션",
    double_elimination: "더블 엘리미네이션",
    round_robin: "리그전",
    hybrid: "혼합",
    group_stage_knockout: "조별리그+토너먼트",
    GROUP_STAGE_KNOCKOUT: "조별리그+토너먼트",
    swiss: "스위스 라운드",
  };

  return (
    <div className="space-y-8">
      {/* 종목/카테고리 카드 (시안의 3열 아이콘 카드) */}
      {hasCategories && (
        <div
          className="rounded-[var(--radius-card)] border p-6 sm:p-8"
          style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}
        >
          <SectionTitle>대회 소개</SectionTitle>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {/* 포맷 카드 (아이콘: 파랑 — 정보성 카테고리 아이콘) */}
            <div
              className="rounded-lg p-4 text-center"
              style={{ backgroundColor: "var(--color-elevated)" }}
            >
              <span
                className="material-symbols-outlined mb-2 block text-3xl"
                style={{ color: "var(--color-info)" }}
              >
                emoji_events
              </span>
              <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>포맷</p>
              <p className="text-sm font-bold">{FORMAT_LABEL[format ?? ""] ?? format ?? "-"}</p>
            </div>
            {/* 카테고리별 카드 */}
            {Object.entries(categories).map(([cat, divs]) => (
              <div
                key={cat}
                className="rounded-lg p-4 text-center"
                style={{ backgroundColor: "var(--color-elevated)" }}
              >
                <span
                  className="material-symbols-outlined mb-2 block text-3xl"
                  style={{ color: "var(--color-info)" }}
                >
                  sports_basketball
                </span>
                <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>{cat}</p>
                <p className="text-sm font-bold">{divs.join(", ")}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* parseDescription 결과 렌더링 (로직 100% 유지, 스타일만 교체) */}
      {sections.map((sec, i) => {
        // keyvalue: 경기 정보 테이블 형식
        if (sec.type === "keyvalue") {
          return (
            <div
              key={i}
              className="rounded-[var(--radius-card)] border p-6 sm:p-8"
              style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}
            >
              <SectionTitle>경기 정보</SectionTitle>
              <dl className="space-y-3">
                {sec.items.map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-4 text-sm">
                    <dt style={{ color: "var(--color-text-secondary)" }}>{k}</dt>
                    <dd className="text-right font-medium">{v}</dd>
                  </div>
                ))}
              </dl>
            </div>
          );
        }

        // numbered: 번호 목록
        if (sec.type === "numbered") {
          return (
            <div
              key={i}
              className="rounded-[var(--radius-card)] border p-6 sm:p-8"
              style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}
            >
              <SectionTitle>{sec.title}</SectionTitle>
              <ol className="space-y-3">
                {sec.items.map((item, j) => (
                  <li key={j} className="flex gap-3 text-sm">
                    {/* 넘버 원: primary 컬러 */}
                    <span
                      className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                      style={{ backgroundColor: "var(--color-primary)" }}
                    >
                      {j + 1}
                    </span>
                    <span className="leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>{item}</span>
                  </li>
                ))}
              </ol>
            </div>
          );
        }

        // bullets: 글머리 기호
        if (sec.type === "bullets") {
          return (
            <div
              key={i}
              className="rounded-[var(--radius-card)] border p-6 sm:p-8"
              style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}
            >
              <SectionTitle>{sec.title}</SectionTitle>
              <ul className="space-y-3">
                {sec.items.map((item, j) => (
                  <li key={j} className="flex items-start gap-3 text-sm">
                    <span
                      className="material-symbols-outlined mt-0.5 flex-shrink-0 text-base"
                      style={{ color: "var(--color-primary)" }}
                    >
                      check_circle
                    </span>
                    <span className="leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          );
        }

        // prizes: 시상 테이블
        if (sec.type === "prizes") {
          return (
            <div
              key={i}
              className="rounded-[var(--radius-card)] border p-6 sm:p-8"
              style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}
            >
              <SectionTitle>
                <span className="flex items-center gap-2">
                  <span className="material-symbols-outlined" style={{ color: "var(--color-primary)" }}>emoji_events</span>
                  {sec.title}
                </span>
              </SectionTitle>
              <div className="space-y-3">
                {sec.items.map((prize, j) => (
                  <div
                    key={j}
                    className="flex items-center justify-between border-b py-3 last:border-b-0"
                    style={{ borderColor: "var(--color-border)" }}
                  >
                    <div className="flex items-center gap-3">
                      {/* 순위 아이콘: 원형 배지 */}
                      <div
                        className="flex h-8 w-8 items-center justify-center rounded text-xs font-bold"
                        style={{
                          backgroundColor: j === 0 ? "var(--color-primary)" : "var(--color-elevated)",
                          color: j === 0 ? "white" : "var(--color-text-secondary)",
                        }}
                      >
                        {PRIZE_ICON[prize.rank] ?? (j + 1)}
                      </div>
                      <span className="font-medium">{prize.rank}</span>
                    </div>
                    <span className="text-sm font-bold" style={{ color: j === 0 ? "var(--color-primary)" : "var(--color-text-primary)" }}>
                      {prize.items.join(" + ")}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          );
        }

        // misc: 혼합 텍스트/링크
        if (sec.type === "misc") {
          return (
            <div
              key={i}
              className="rounded-[var(--radius-card)] border p-6 sm:p-8"
              style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}
            >
              <div className="space-y-2">
                {sec.items.map((item, j) => {
                  if (item.url) {
                    const displayValue = item.value.replace(/\(https?:\/\/[^\s)]+\)/g, "").trim();
                    return (
                      <div key={j} className="text-sm">
                        {item.label && (
                          <span className="mr-1" style={{ color: "var(--color-text-secondary)" }}>{item.label}:</span>
                        )}
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline underline-offset-2"
                          style={{ color: "var(--color-primary)" }}
                        >
                          {displayValue || item.url}
                        </a>
                      </div>
                    );
                  }
                  return (
                    <div key={j} className="text-sm leading-relaxed">
                      {item.label ? (
                        <>
                          <span style={{ color: "var(--color-text-secondary)" }}>{item.label}: </span>
                          <span>{item.value.replace(`${item.label}: `, "")}</span>
                        </>
                      ) : (
                        <span style={{ color: "var(--color-text-secondary)" }}>{item.value}</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        }

        // sponsors: 후원사
        if (sec.type === "sponsors") {
          return (
            <div
              key={i}
              className="rounded-[var(--radius-card)] border p-6 sm:p-8"
              style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}
            >
              <SectionTitle>공식 후원사</SectionTitle>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                {sec.sponsors.map((s) => (
                  <div
                    key={s}
                    className="flex items-center justify-center rounded-lg border p-6 transition-colors"
                    style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-elevated)" }}
                  >
                    <span className="text-sm font-bold" style={{ color: "var(--color-text-secondary)" }}>{s}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        }

        return null;
      })}
    </div>
  );
}
