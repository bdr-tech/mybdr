/* ============================================================
 * AboutCard — BDR v2 경기 상세 설명 카드
 *
 * 왜 이 컴포넌트가 있는가:
 * description 만 있던 기존 구조를 확장해 DB의 텍스트 필드를 전부 흡수:
 *   - description  : 본문 (있을 때만)
 *   - requirements : "참가 요건" (있을 때만)
 *   - notes        : "안내사항" (있을 때만)
 * 하나도 없으면 카드 자체를 렌더하지 않는다 (page.tsx에서 판단).
 *
 * 디코드/줄바꿈 보존(white-space: pre-wrap) + v2 .card 토큰 유지.
 *
 * 서버 컴포넌트 — 순수 텍스트 표시.
 * ============================================================ */

import { decodeHtmlEntities } from "@/lib/utils/decode-html";

export interface AboutCardProps {
  description?: string | null;
  requirements?: string | null;
  notes?: string | null;
}

export function AboutCard({ description, requirements, notes }: AboutCardProps) {
  // 3필드 모두 비었으면 카드 렌더 안 함 (호출측에서도 판단하지만 방어)
  const hasAny = Boolean(description || requirements || notes);
  if (!hasAny) return null;

  return (
    <section className="card" style={{ padding: "18px 20px" }}>
      {/* 카드 타이틀 — v2 CardPanel header 와 동일한 톤 */}
      <div
        style={{
          fontWeight: 700,
          fontSize: 15,
          marginBottom: 12,
          color: "var(--ink)",
        }}
      >
        경기 안내
      </div>

      {/* 본문(description) — 카페 크롤링 원문 포함 가능성 있어 디코드 */}
      {description && (
        <Section title="소개">
          {decodeHtmlEntities(description)}
        </Section>
      )}

      {/* 참가 요건(requirements) */}
      {requirements && (
        <Section title="참가 요건">
          {decodeHtmlEntities(requirements)}
        </Section>
      )}

      {/* 안내사항(notes) */}
      {notes && (
        <Section title="안내사항">
          {decodeHtmlEntities(notes)}
        </Section>
      )}
    </section>
  );
}

// 반복되는 label + pre-wrap 텍스트 블록. 각 section 사이 간격 유지
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div
        style={{
          fontSize: 12,
          fontWeight: 600,
          color: "var(--ink-dim)",
          marginBottom: 4,
          textTransform: "uppercase",
          letterSpacing: 0.3,
        }}
      >
        {title}
      </div>
      {/* 카페 원문/사용자 입력 줄바꿈 보존 — pre-wrap */}
      <p
        style={{
          fontSize: 14,
          lineHeight: 1.6,
          color: "var(--ink-mute)",
          whiteSpace: "pre-wrap",
          margin: 0,
        }}
      >
        {children}
      </p>
    </div>
  );
}
