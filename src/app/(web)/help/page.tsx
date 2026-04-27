"use client";

/* ============================================================
 * 도움말 (Help) — Phase 6
 *
 * 이유: 신규 사용자가 FAQ·용어·정책을 한 화면에서 빠르게 훑어볼
 *      랜딩이 없었음. 시안(Dev/design/BDR v2/screens/Help.jsx)을
 *      그대로 박제해 탭 3종(faq / glossary / policy) + 검색 +
 *      1:1 문의 안내까지 한 번에 노출.
 *
 * 원칙:
 *  - API/Prisma/서비스 0 변경. 데이터는 시안 박제(상수).
 *  - 기존 /help/glossary 페이지 0 변경. "전체 용어 사전 보기"
 *    링크로만 연결.
 *  - 정책 카드: terms / privacy 만 활성. 나머지 4종은 "준비 중"
 *    비활성 표시.
 *  - 카페 세션과 무관 (cafe-sync 파일 손대지 않음).
 *
 * 데이터 추후 마이그레이션 (scratchpad "🚧 추후 구현"):
 *  - FAQ 모델 (DB 박제 → 운영자 편집 가능)
 *  - 1:1 문의 모델 (Inquiry 테이블 + 운영자 답변 워크플로)
 *  - 운영정책 / 환불 / 광고제휴 / 저작권 정책 페이지
 *  - FAQ 검색 (현재는 GLOSSARY만 검색)
 * ============================================================ */

import Link from "next/link";
import { useState } from "react";

// FAQ 6건 — 시안(extras-data.jsx HELP_FAQ) 그대로 박제
const HELP_FAQ: { q: string; a: string }[] = [
  {
    q: "팀 등록은 어떻게 하나요?",
    a: "상단 메뉴 [팀] → [팀 등록] 버튼으로 최소 3명 이상이 모인 팀을 등록할 수 있습니다. 팀장 1명, 부팀장 1명, 팀원 1명이 기본 구성입니다.",
  },
  {
    q: "대회 신청 후 취소할 수 있나요?",
    a: "접수 마감 3일 전까지는 자유롭게 취소 가능하며, 참가비는 100% 환불됩니다. 이후에는 50%만 환불됩니다.",
  },
  {
    q: "레이팅은 어떻게 계산되나요?",
    a: "기본 1500에서 시작하여, 각 경기의 승패·점수차·상대 레이팅에 따라 매 경기 ±5~±40 변동됩니다.",
  },
  {
    q: "픽업과 게스트의 차이는?",
    a: "픽업은 개인 단위로 모여 즉석 팀을 구성하는 것이고, 게스트는 기존 팀의 부족한 인원을 일회성으로 채우는 역할입니다.",
  },
  {
    q: "대회 성적은 어디에 반영되나요?",
    a: "OPEN·PRO 대회는 팀 레이팅에 반영되고, 선수별 기록(PPG/APG/RPG)은 개인 프로필과 선수 랭킹에 반영됩니다.",
  },
  {
    q: "유료 멤버십은 꼭 필요한가요?",
    a: "아니요. 기본 기능은 모두 무료입니다. PRO 멤버십은 대회 우선 접수·상세 통계·광고 제거 등 편의 기능입니다.",
  },
];

// 용어 16건 — 시안(GLOSSARY) 그대로 박제
// 전체 사전은 /help/glossary 별도 페이지(9개 핵심 용어, 더 풍부한 설명+링크)
const GLOSSARY: { term: string; desc: string }[] = [
  { term: "픽업 (Pick-up)", desc: "사전 팀 구성 없이 현장에서 인원을 모아 즉석으로 진행하는 경기." },
  { term: "게스트 (Guest)", desc: "기존 팀에 일회성으로 합류하는 외부 선수. 팀원 공백을 메우기 위함." },
  { term: "스크림 (Scrimmage)", desc: "팀 간 합의된 비공식 연습경기. 기록은 개인 기록에만 반영." },
  { term: "픽앤롤 (Pick & Roll)", desc: "스크리너가 스크린 후 골대 방향으로 돌아 공을 받는 공격 전술." },
  { term: "풀코트 (Full-court)", desc: "농구장 전체를 사용하는 5v5 경기. 국내 아마추어 표준." },
  { term: "하프코트 (Half-court)", desc: "골대 한 쪽만 사용. 3v3·픽업의 기본 형식." },
  { term: "OPEN", desc: "레벨 제한 없는 대회. 모든 팀 참가 가능." },
  { term: "PRO", desc: "선수 등록·경력 제한이 있는 상위 레벨 대회." },
  { term: "AMATEUR", desc: "비선출·아마추어 전용 레벨. 참가 자격 심사 있음." },
  { term: "더블 엘리미네이션", desc: "두 번 패할 때까지 탈락하지 않는 대진 방식." },
  { term: "싱글 엘리미네이션", desc: "한 번 패하면 탈락하는 대진 방식. 짧은 대회에 적합." },
  { term: "레이팅", desc: "경기 결과 기반 계산되는 팀·선수 실력 지표. 기본값 1500." },
  { term: "승률", desc: "승 / (승 + 패) × 100. 시즌 단위로 집계." },
  { term: "PPG / APG / RPG", desc: "경기당 평균 득점 / 어시스트 / 리바운드." },
  { term: "D-N", desc: "접수 마감까지 남은 일 수. D-0은 오늘 마감." },
  { term: "운영진", desc: "대회·경기·커뮤니티를 관리하는 BDR 공식 스태프." },
];

// 정책 카드 6종 — terms / privacy 만 활성, 나머지 4종은 "준비 중" 비활성
// 비활성 카드는 클릭해도 이동하지 않고 시각적으로만 dim 처리
type PolicyCard = {
  title: string;
  desc: string;
  href?: string; // undefined면 비활성("준비 중")
};
const POLICY_CARDS: PolicyCard[] = [
  { title: "이용약관", desc: "커뮤니티 참여, 경기·대회 신청·취소 규정 전반", href: "/terms" },
  { title: "개인정보처리방침", desc: "수집 항목, 보관 기간, 제3자 제공 여부", href: "/privacy" },
  { title: "운영정책", desc: "게시물 관리, 제재 기준, 이의 제기 절차" },
  { title: "환불규정", desc: "대회 참가비, 멤버십 결제 환불 기준" },
  { title: "광고·제휴 문의", desc: "브랜드 제휴, 배너 광고, 코트 스폰서십" },
  { title: "저작권 안내", desc: "이미지·영상 사용, 무단 전재 금지 조항" },
];

type Tab = "faq" | "glossary" | "policy";

export default function HelpPage() {
  // 탭 상태: 시안과 동일하게 'faq' 기본값
  const [tab, setTab] = useState<Tab>("faq");
  // 검색어 상태: 시안 한계 그대로(GLOSSARY 만 필터링) — FAQ 검색은 추후 구현
  const [q, setQ] = useState("");

  // 용어 검색 필터: term 또는 desc 부분 일치 (대소문자 무시)
  const filteredGlossary = GLOSSARY.filter((g) => {
    if (!q) return true;
    const needle = q.toLowerCase();
    return g.term.toLowerCase().includes(needle) || g.desc.toLowerCase().includes(needle);
  });

  return (
    <div className="page">
      <div style={{ maxWidth: 820, margin: "0 auto" }}>
        {/* 헤더: eyebrow + h1 + 검색 input (시안 그대로) */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div className="eyebrow" style={{ justifyContent: "center" }}>
            도움말 · HELP
          </div>
          <h1
            style={{
              margin: "10px 0 10px",
              fontSize: 32,
              fontWeight: 800,
              letterSpacing: "-0.02em",
            }}
          >
            무엇을 도와드릴까요?
          </h1>
          <div style={{ position: "relative", maxWidth: 520, margin: "18px auto 0" }}>
            {/* Material Symbols Outlined 아이콘 — lucide-react 금지 (CLAUDE.md) */}
            <span
              className="material-symbols-outlined"
              style={{
                position: "absolute",
                left: 14,
                top: "50%",
                transform: "translateY(-50%)",
                color: "var(--ink-dim)",
                fontSize: 20,
                pointerEvents: "none",
              }}
              aria-hidden
            >
              search
            </span>
            <input
              className="input"
              placeholder="용어·FAQ 검색 (예: 픽업, 레이팅)"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              style={{ paddingLeft: 38, height: 44, fontSize: 15 }}
            />
          </div>
        </div>

        {/* 탭 3종 — cafe-blue 하단 라인 (시안 그대로) */}
        <div
          style={{
            display: "flex",
            gap: 4,
            marginBottom: 20,
            borderBottom: "1px solid var(--border)",
            justifyContent: "center",
          }}
        >
          {(
            [
              ["faq", "자주 묻는 질문"],
              ["glossary", "용어집"],
              ["policy", "정책"],
            ] as [Tab, string][]
          ).map(([k, l]) => (
            <button
              key={k}
              onClick={() => setTab(k)}
              style={{
                padding: "12px 20px",
                background: "transparent",
                border: 0,
                borderBottom:
                  tab === k ? "3px solid var(--cafe-blue)" : "3px solid transparent",
                color: tab === k ? "var(--ink)" : "var(--ink-mute)",
                fontWeight: tab === k ? 700 : 500,
                fontSize: 14,
                cursor: "pointer",
                marginBottom: -1,
              }}
            >
              {l}
            </button>
          ))}
        </div>

        {/* FAQ 탭: <details> 아코디언 6건 */}
        {tab === "faq" && (
          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            {HELP_FAQ.map((f, i) => (
              <details
                key={i}
                style={{
                  borderBottom:
                    i < HELP_FAQ.length - 1 ? "1px solid var(--border)" : 0,
                }}
              >
                <summary
                  style={{
                    padding: "18px 22px",
                    cursor: "pointer",
                    fontWeight: 600,
                    fontSize: 15,
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                  }}
                >
                  {/* 질문 번호: accent(BDR red) + mono 폰트로 강조 */}
                  <span
                    style={{
                      color: "var(--accent)",
                      fontFamily: "var(--ff-mono)",
                      fontWeight: 700,
                    }}
                  >
                    Q{i + 1}.
                  </span>
                  {f.q}
                </summary>
                <div
                  style={{
                    padding: "0 22px 18px 48px",
                    color: "var(--ink-soft)",
                    lineHeight: 1.7,
                    fontSize: 14,
                  }}
                >
                  {f.a}
                </div>
              </details>
            ))}
          </div>
        )}

        {/* 용어집 탭: 검색 필터 + "전체 용어 사전 보기" 링크 */}
        {tab === "glossary" && (
          <>
            <div className="card" style={{ padding: 0, overflow: "hidden" }}>
              {filteredGlossary.map((g, i) => (
                <div
                  key={i}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "200px 1fr",
                    padding: "14px 22px",
                    borderBottom:
                      i < filteredGlossary.length - 1
                        ? "1px solid var(--border)"
                        : 0,
                    gap: 16,
                    alignItems: "baseline",
                  }}
                >
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{g.term}</div>
                  <div
                    style={{
                      fontSize: 13.5,
                      color: "var(--ink-soft)",
                      lineHeight: 1.6,
                    }}
                  >
                    {g.desc}
                  </div>
                </div>
              ))}
              {filteredGlossary.length === 0 && (
                <div
                  style={{
                    padding: 40,
                    textAlign: "center",
                    color: "var(--ink-dim)",
                  }}
                >
                  검색 결과가 없습니다
                </div>
              )}
            </div>
            {/* 전체 용어 사전 보기 — 기존 /help/glossary 페이지로 연결 */}
            <div style={{ textAlign: "right", marginTop: 12 }}>
              <Link
                href="/help/glossary"
                style={{
                  fontSize: 13,
                  color: "var(--cafe-blue)",
                  fontWeight: 600,
                }}
              >
                전체 용어 사전 보기 →
              </Link>
            </div>
          </>
        )}

        {/* 정책 탭: 6카드 그리드 (활성 2종 + 비활성 4종) */}
        {tab === "policy" && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 14,
            }}
          >
            {POLICY_CARDS.map((p) => {
              // 활성 카드(href 있음) vs 비활성 카드("준비 중")
              const isReady = !!p.href;
              // 비활성 카드는 클릭 불가 + 시각적으로 dim 처리
              const cardStyle: React.CSSProperties = {
                padding: "18px 20px",
                cursor: isReady ? "pointer" : "default",
                opacity: isReady ? 1 : 0.55,
                display: "block",
              };
              const inner = (
                <>
                  <div
                    style={{
                      fontWeight: 700,
                      fontSize: 15,
                      marginBottom: 4,
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <span>{p.title}</span>
                    {!isReady && (
                      // "준비 중" 배지 — 비활성임을 명확히
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          color: "var(--ink-mute)",
                          background: "var(--bg-alt)",
                          border: "1px solid var(--border)",
                          padding: "2px 6px",
                          borderRadius: 4,
                        }}
                      >
                        준비 중
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--ink-mute)" }}>
                    {p.desc}
                  </div>
                </>
              );
              // 활성: <Link>로 페이지 이동, 비활성: <div>로 표시만
              return isReady ? (
                <Link key={p.title} href={p.href!} className="card" style={cardStyle}>
                  {inner}
                </Link>
              ) : (
                <div
                  key={p.title}
                  className="card"
                  style={cardStyle}
                  aria-disabled
                >
                  {inner}
                </div>
              );
            })}
          </div>
        )}

        {/* 하단 1:1 문의 카드 — mailto: 링크로 메일 클라이언트 호출 */}
        <div
          className="card"
          style={{
            padding: "20px 24px",
            marginTop: 24,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
            flexWrap: "wrap",
          }}
        >
          <div>
            <div style={{ fontWeight: 700, fontSize: 15 }}>
              여전히 해결이 안 되시나요?
            </div>
            <div style={{ fontSize: 13, color: "var(--ink-mute)", marginTop: 4 }}>
              운영팀이 평일 10–19시에 답변드립니다
            </div>
          </div>
          {/* mailto: 제목 prefill — 운영팀 분류 용이. 추후 Inquiry 모델 도입 시 교체 */}
          <a
            href="mailto:bdrbasket@gmail.com?subject=%5BMyBDR%20%EB%AC%B8%EC%9D%98%5D%20"
            className="btn btn--primary"
          >
            1:1 문의하기
          </a>
        </div>
      </div>
    </div>
  );
}
