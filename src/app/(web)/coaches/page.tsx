"use client";

/* ============================================================
 * /coaches — 코치·트레이너 (Coaches) v2 신규 — Phase 8
 *
 * 이유: BDR v2 디자인 적용 작업의 일환. 사용자가 코치/트레이너를
 *      지역·전문분야·평점으로 필터하여 한 화면에서 살펴보고
 *      예약 동선까지 파악할 수 있는 랜딩이 필요함.
 *      시안(Dev/design/BDR v2/screens/Coaches.jsx)을 그대로 박제.
 *
 * 원칙 (사용자 지침: "DB 미지원도 제거 금지 — UI 배치 + '준비 중' 표시"):
 *  - API/Prisma/서비스 0 변경. 데이터는 시안 박제(상수).
 *  - DB 0% 지원 → 정적 더미 데이터로 UI만 박제 (실 동작 0).
 *  - 페이지 상단 1줄 안내 노출.
 *  - 필터(전체/코치/트레이너) + 카드 그리드 3열 + 내 예약 + 가이드.
 *
 * 데이터 추후 마이그레이션 (스코프 외):
 *  - coaches 모델 (코치 프로필 + 인증 등급 + 시급)
 *  - coach_bookings 모델 (예약 + 결제 상태)
 *  - coach_reviews 모델 (리뷰/평점 별도 집계)
 *
 * 참고: src/app/(web)/safety/page.tsx, src/app/(web)/scrim/page.tsx 동일 패턴.
 * ============================================================ */

import Link from "next/link";
import { useState } from "react";

// 코치 종류 union — TS strict
type CoachKind = "coach" | "trainer";

// 코치 1건 타입 — 시안의 필드를 그대로 복사
type Coach = {
  id: string;
  name: string;
  real: string;
  role: string;
  spec: string;
  area: string;
  rating: number;
  reviews: number;
  rate: string;
  years: number;
  cert: string[];
  bio: string;
  tags: string[];
  avail: string;
  active: boolean;
  color: string;
  kind: CoachKind;
};

// 코치/트레이너 더미 — 시안 그대로 박제. DB 모델 미존재.
const COACHES: Coach[] = [
  {
    id: "c1",
    name: "코치K",
    real: "김한솔",
    role: "코치",
    spec: "슈팅·볼핸들링",
    area: "서울 강남·송파",
    rating: 4.9,
    reviews: 87,
    rate: "₩50,000/시간",
    years: 7,
    cert: ["BDR L.3", "대학리그 경력"],
    bio: "개인 슛 폼 교정, 볼핸들링 기초. 초보부터 중급까지.",
    tags: ["개인레슨", "그룹OK", "온라인코칭"],
    avail: "주중 오후·주말",
    active: true,
    color: "#DC2626",
    kind: "coach",
  },
  {
    id: "c2",
    name: "트레이너_진",
    real: "이진수",
    role: "트레이너",
    spec: "체력·민첩성",
    area: "서울 용산·마포",
    rating: 4.8,
    reviews: 54,
    rate: "₩45,000/시간",
    years: 5,
    cert: ["NSCA-CPT", "BDR 트레이닝 인증"],
    bio: "농구 특화 컨디셔닝. 점프력·풋워크 집중.",
    tags: ["컨디셔닝", "재활", "그룹OK"],
    avail: "평일 오전·저녁",
    active: true,
    color: "#0F5FCC",
    kind: "trainer",
  },
  {
    id: "c3",
    name: "슛닥터",
    real: "정혜린",
    role: "코치",
    spec: "3점·미드레인지",
    area: "경기 성남·분당",
    rating: 5.0,
    reviews: 42,
    rate: "₩60,000/시간",
    years: 10,
    cert: ["WKBL 경력", "BDR L.1"],
    bio: "WKBL 은퇴 후 전업 코치. 슈팅 역학 전문.",
    tags: ["개인레슨", "영상분석", "여성코치"],
    avail: "주말·화·목",
    active: true,
    color: "#F59E0B",
    kind: "coach",
  },
  {
    id: "c4",
    name: "빅맨스쿨",
    real: "박태양",
    role: "코치",
    spec: "포스트·리바운드",
    area: "서울 노원·도봉",
    rating: 4.7,
    reviews: 31,
    rate: "₩45,000/시간",
    years: 6,
    cert: ["고교리그 지도자", "BDR L.2"],
    bio: "190+ 빅맨 전용. 포스트무브, 포지셔닝, 리바운드.",
    tags: ["개인레슨", "빅맨전문"],
    avail: "주말만",
    active: true,
    color: "#10B981",
    kind: "coach",
  },
  {
    id: "c5",
    name: "리햅_스미스",
    real: "Sarah Smith",
    role: "트레이너",
    spec: "부상·재활",
    area: "서울 강남",
    rating: 4.9,
    reviews: 28,
    rate: "₩70,000/시간",
    years: 8,
    cert: ["DPT", "스포츠물리치료사"],
    bio: "무릎·발목 부상 재활 전문. 영문 상담 가능.",
    tags: ["재활", "영어OK", "개인레슨"],
    avail: "예약제",
    active: true,
    color: "#8B5CF6",
    kind: "trainer",
  },
  {
    id: "c6",
    name: "팀전술",
    real: "최승도",
    role: "코치",
    spec: "팀 전술·수비",
    area: "서울 전역 출장",
    rating: 4.8,
    reviews: 19,
    rate: "₩200,000/팀 2h",
    years: 12,
    cert: ["프로팀 어시스턴트", "BDR L.1"],
    bio: "팀 단위 수비 세트·공격 전술 세팅. 팀 전용.",
    tags: ["팀레슨", "출장OK"],
    avail: "예약제",
    active: true,
    color: "#DC2626",
    kind: "coach",
  },
];

// 내 예약 더미 — 시안 그대로. status 2종(확정/결제대기).
type Booking = { id: string; coach: string; when: string; place: string; status: "확정" | "결제대기" };
const BOOKED: Booking[] = [
  { id: "b1", coach: "코치K", when: "4/26 (토) 10:00 – 11:30", place: "양재 농구장", status: "확정" },
  { id: "b2", coach: "슛닥터", when: "5/03 (토) 14:00 – 15:30", place: "분당체육관", status: "결제대기" },
];

// 필터 union (전체 포함) — TS strict
type Filter = "all" | CoachKind;

export default function CoachesPage() {
  // 필터 상태 — 시안과 동일하게 'all' 기본값
  const [filter, setFilter] = useState<Filter>("all");

  // 필터 적용 — 'all'이면 전체, 아니면 kind 일치만
  const filtered = filter === "all" ? COACHES : COACHES.filter((c) => c.kind === filter);

  return (
    <div className="page">
      {/* 브레드크럼 — 시안의 setRoute 추상화를 Next.js Link로 대체 */}
      <div style={{ display: "flex", gap: 6, fontSize: 12, color: "var(--ink-mute)", marginBottom: 12 }}>
        <Link href="/" style={{ color: "inherit" }}>
          홈
        </Link>
        <span>›</span>
        <span style={{ color: "var(--ink)" }}>코치·트레이너</span>
      </div>

      {/* 헤더 — eyebrow + h1 + 설명 + "나도 코치 등록" 버튼 */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          marginBottom: 18,
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div>
          <div className="eyebrow">COACHES · TRAINERS</div>
          <h1 style={{ margin: "4px 0 6px", fontSize: 32, fontWeight: 800, letterSpacing: "-0.02em" }}>
            더 잘하고 싶다면 · 코칭 센터
          </h1>
          <p style={{ margin: 0, color: "var(--ink-mute)", fontSize: 14, maxWidth: 620, lineHeight: 1.6 }}>
            BDR 인증 코치와 트레이너를 한 곳에서. 지역·전문분야·리뷰로 필터하고 바로 예약하세요.
          </p>
          {/* "준비 중" 안내 — 사용자 지침: DB 미지원 기능은 제거 금지, 빈 상태/안내로 표시 */}
          <p style={{ margin: "8px 0 0", color: "var(--ink-dim)", fontSize: 12, lineHeight: 1.5 }}>
            현재 코치 페이지는 준비 중입니다. UI 미리보기로만 동작합니다.
          </p>
        </div>
        <button className="btn btn--accent">나도 코치 등록</button>
      </div>

      {/* 내 예약 — booked 비어있지 않을 때만 표시. accent 좌측 보더로 강조 */}
      {BOOKED.length > 0 && (
        <div className="card" style={{ padding: "16px 20px", marginBottom: 16, borderLeft: "3px solid var(--accent)" }}>
          <div
            style={{
              fontSize: 11,
              color: "var(--accent)",
              fontWeight: 800,
              letterSpacing: ".08em",
              textTransform: "uppercase",
              marginBottom: 8,
            }}
          >
            내 예약
          </div>
          {BOOKED.map((b) => (
            <div
              key={b.id}
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr auto",
                gap: 14,
                padding: "8px 0",
                borderBottom: "1px dashed var(--border)",
                alignItems: "center",
              }}
            >
              <div>
                <b style={{ fontSize: 13 }}>{b.coach}</b>
              </div>
              <div style={{ fontFamily: "var(--ff-mono)", fontSize: 12 }}>{b.when}</div>
              <div style={{ fontSize: 12, color: "var(--ink-mute)" }}>📍 {b.place}</div>
              {/* 확정=ok 배지 / 결제대기=warn 배지 */}
              <span className={`badge ${b.status === "확정" ? "badge--ok" : "badge--warn"}`}>{b.status}</span>
            </div>
          ))}
        </div>
      )}

      {/* 필터 + 셀렉트들 — kind 카운트 표시 */}
      <div
        className="card"
        style={{
          padding: "12px 14px",
          marginBottom: 14,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 10,
        }}
      >
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {(
            [
              { id: "all", label: `전체 · ${COACHES.length}` },
              { id: "coach", label: `코치 · ${COACHES.filter((c) => c.kind === "coach").length}` },
              { id: "trainer", label: `트레이너 · ${COACHES.filter((c) => c.kind === "trainer").length}` },
            ] as { id: Filter; label: string }[]
          ).map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`btn ${filter === f.id ? "btn--primary" : ""} btn--sm`}
            >
              {f.label}
            </button>
          ))}
        </div>
        {/* 셀렉트 3종 — UI만, 동작 미구현 (시안 박제) */}
        <div style={{ display: "flex", gap: 6, fontSize: 12 }}>
          <select className="input" style={{ padding: "4px 8px", fontSize: 12 }}>
            <option>지역 전체</option>
            <option>강남</option>
            <option>용산</option>
            <option>송파</option>
          </select>
          <select className="input" style={{ padding: "4px 8px", fontSize: 12 }}>
            <option>전문분야</option>
            <option>슈팅</option>
            <option>볼핸들링</option>
            <option>컨디셔닝</option>
            <option>재활</option>
          </select>
          <select className="input" style={{ padding: "4px 8px", fontSize: 12 }}>
            <option>평점순</option>
            <option>리뷰순</option>
            <option>가격낮은순</option>
          </select>
        </div>
      </div>

      {/* 코치 카드 그리드 — 3열 (시안 그대로) */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
        {filtered.map((c) => (
          <div key={c.id} className="card" style={{ padding: 0, overflow: "hidden" }}>
            {/* 상단 헤더 — 색상 그라디언트 + role 배지 + 평점 배지 */}
            <div
              style={{
                height: 80,
                background: `linear-gradient(135deg, ${c.color} 0%, #000 130%)`,
                position: "relative",
              }}
            >
              <span
                style={{
                  position: "absolute",
                  top: 10,
                  left: 12,
                  background: "rgba(255,255,255,.2)",
                  color: "#fff",
                  fontSize: 10,
                  fontWeight: 800,
                  letterSpacing: ".08em",
                  padding: "3px 8px",
                  borderRadius: 3,
                  textTransform: "uppercase",
                  backdropFilter: "blur(4px)",
                }}
              >
                {c.role}
              </span>
              <span
                style={{
                  position: "absolute",
                  top: 10,
                  right: 12,
                  background: "#fff",
                  color: c.color,
                  fontSize: 11,
                  fontFamily: "var(--ff-mono)",
                  fontWeight: 800,
                  padding: "3px 8px",
                  borderRadius: 3,
                }}
              >
                ★ {c.rating}
              </span>
            </div>
            {/* 본문 — 아바타가 헤더와 겹치도록 marginTop:-32 */}
            <div style={{ padding: "0 22px 20px", marginTop: -32, position: "relative" }}>
              {/* 아바타 — 첫 글자 이니셜 (이미지 없으면 컬러 원) */}
              <div
                style={{
                  width: 64,
                  height: 64,
                  background: "var(--bg)",
                  border: "3px solid var(--bg)",
                  borderRadius: "50%",
                  display: "grid",
                  placeItems: "center",
                }}
              >
                <div
                  style={{
                    width: "100%",
                    height: "100%",
                    borderRadius: "50%",
                    background: c.color,
                    color: "#fff",
                    display: "grid",
                    placeItems: "center",
                    fontFamily: "var(--ff-display)",
                    fontWeight: 900,
                    fontSize: 22,
                  }}
                >
                  {c.name[0]}
                </div>
              </div>
              <div style={{ marginTop: 12 }}>
                <div style={{ fontWeight: 800, fontSize: 17, letterSpacing: "-0.01em" }}>{c.name}</div>
                <div style={{ fontSize: 12, color: "var(--ink-mute)" }}>
                  {c.real} · {c.years}년차
                </div>
              </div>
              {/* 전문분야 박스 — bg-alt 배경 */}
              <div style={{ marginTop: 10, padding: "10px 12px", background: "var(--bg-alt)", borderRadius: 4 }}>
                <div style={{ fontSize: 11, color: "var(--ink-dim)", fontWeight: 700, letterSpacing: ".06em" }}>전문</div>
                <div style={{ fontSize: 13, fontWeight: 700, marginTop: 2 }}>{c.spec}</div>
                <div style={{ fontSize: 11, color: "var(--ink-mute)", marginTop: 2 }}>
                  📍 {c.area} · {c.avail}
                </div>
              </div>
              {/* 자기소개 — 카드 높이 일정하게 minHeight:36 */}
              <p style={{ margin: "10px 0 0", fontSize: 12.5, color: "var(--ink-soft)", lineHeight: 1.5, minHeight: 36 }}>
                {c.bio}
              </p>
              {/* 태그 칩 */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 4, margin: "10px 0" }}>
                {c.tags.map((t) => (
                  <span key={t} className="badge badge--ghost" style={{ fontSize: 10 }}>
                    #{t}
                  </span>
                ))}
              </div>
              {/* 가격 + 예약 버튼 — 점선 상단 보더로 분리 */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginTop: 12,
                  paddingTop: 12,
                  borderTop: "1px dashed var(--border)",
                }}
              >
                <div>
                  <div style={{ fontFamily: "var(--ff-display)", fontWeight: 900, fontSize: 16, color: c.color }}>
                    {c.rate}
                  </div>
                  <div style={{ fontSize: 10, color: "var(--ink-dim)" }}>리뷰 {c.reviews}건</div>
                </div>
                <button className="btn btn--primary btn--sm">예약</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 가이드 박스 — 시안 그대로 */}
      <div
        style={{
          marginTop: 22,
          padding: "18px 22px",
          background: "var(--bg-alt)",
          borderRadius: 8,
          fontSize: 13,
          color: "var(--ink-soft)",
          lineHeight: 1.7,
        }}
      >
        <b>💡 코치 선택 가이드</b> · 개인 레슨은 3–4회 묶음 예약 시 할인. 첫 미팅은 무료 상담을 제공하는 코치가 많아요. 리뷰
        20건 이상 · 평점 4.7+ 를 기준으로 잡으면 실패가 적습니다.
      </div>
    </div>
  );
}
