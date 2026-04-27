"use client";

/* ============================================================
 * /gallery — 갤러리 (Gallery) v2 신규 — Phase 8
 *
 * 이유: BDR v2 디자인 적용 작업의 일환. 커뮤니티가 올린 클립·사진을
 *      한 화면에서 둘러보는 랜딩이 필요함.
 *      시안(Dev/design/BDR v2/screens/Gallery.jsx)을 그대로 박제.
 *
 * 원칙 (사용자 지침: "DB 미지원도 제거 금지 — UI 배치 + '준비 중' 표시"):
 *  - API/Prisma/서비스 0 변경. 데이터는 시안 박제(상수).
 *  - DB 0% → 정적 더미 데이터로 UI만 박제 (실 동작 0).
 *  - 페이지 상단에 "준비 중" 안내 1줄 노출.
 *  - 시안 인라인 이모지(▶/📷/♥/👁/🔗/🚩) 그대로 박제.
 *  - 타입: union('clip'|'photo') + optional duration/team — TS strict 호환.
 *
 * 데이터 추후 마이그레이션 (스코프 외):
 *  - gallery_items 모델 (id, type, title, author, team_code, duration,
 *    views, likes, created_at, hue, media_url 등)
 *  - gallery_likes 모델 (user_id × item_id)
 *
 * 참고: src/app/(web)/safety/page.tsx 동일 패턴.
 * ============================================================ */

import Link from "next/link";
import { useState } from "react";

// 갤러리 아이템 타입 — TS strict. type 'clip'은 duration 권장, 'photo'는 없음.
type GalleryItem = {
  id: number;
  type: "clip" | "photo";
  title: string;
  author: string;
  team: string | null;
  teamColor: string;
  duration?: string;
  views: number;
  likes: number;
  date: string;
  hue: number;
};

// 갤러리 더미 — 시안 그대로 박제. DB 모델 미존재.
const ITEMS: GalleryItem[] = [
  { id: 1, type: "clip", title: "버저비터 3점 · 킹스크루 vs 3POINT", author: "편집자", team: "KGS", teamColor: "#0F5FCC", duration: "0:42", views: 12847, likes: 1240, date: "04.20", hue: 215 },
  { id: 2, type: "photo", title: "장충 메인코트 조명쇼", author: "리딤캡틴", team: "RDM", teamColor: "#DC2626", views: 834, likes: 412, date: "04.20", hue: 0 },
  { id: 3, type: "clip", title: "크로스오버 → 레이업 · monkey_7", author: "몽키즈공식", team: "MNK", teamColor: "#F59E0B", duration: "0:18", views: 8421, likes: 902, date: "04.18", hue: 38 },
  { id: 4, type: "photo", title: "우승 트로피 · Winter Finals", author: "운영팀", team: null, teamColor: "#111", views: 5420, likes: 1820, date: "02.15", hue: 210 },
  { id: 5, type: "clip", title: "풀코트 속공 덩크 · iron_c", author: "IRON공식", team: "IRN", teamColor: "#374151", duration: "0:12", views: 15230, likes: 2104, date: "04.12", hue: 220 },
  { id: 6, type: "photo", title: "용산센터 리노베이션 오픈", author: "코트지킴이", team: null, teamColor: "#10B981", views: 3120, likes: 284, date: "04.18", hue: 160 },
  { id: 7, type: "clip", title: "클러치 자유투 2연속 · kings_cap", author: "편집자", team: "KGS", teamColor: "#0F5FCC", duration: "0:24", views: 6840, likes: 712, date: "04.09", hue: 210 },
  { id: 8, type: "photo", title: "팀 단체사진 · BDR Challenge 예선", author: "분석가", team: null, teamColor: "#8B5CF6", views: 2180, likes: 340, date: "04.11", hue: 270 },
  { id: 9, type: "clip", title: "노룩 패스 하이라이트", author: "편집자", team: "3PT", teamColor: "#E31B23", duration: "0:15", views: 9120, likes: 1102, date: "04.05", hue: 0 },
  { id: 10, type: "photo", title: "코트 불빛 · 새벽 6시 픽업", author: "sunrise", team: null, teamColor: "#F59E0B", views: 1240, likes: 198, date: "04.03", hue: 40 },
  { id: 11, type: "clip", title: "블록 + 패스트브레이크", author: "SWEEP공식", team: "SWP", teamColor: "#F59E0B", duration: "0:20", views: 5210, likes: 604, date: "03.29", hue: 30 },
  { id: 12, type: "photo", title: "결승전 직전 화이팅", author: "편집자", team: null, teamColor: "#DC2626", views: 1820, likes: 241, date: "04.12", hue: 0 },
];

// 필터 타입 — 'all' + type union
type Filter = "all" | "clip" | "photo";

export default function GalleryPage() {
  // 필터 + 라이트박스 상태 — 시안과 동일하게 'all' 기본값
  const [filter, setFilter] = useState<Filter>("all");
  const [lightbox, setLightbox] = useState<GalleryItem | null>(null);

  // 필터링 — 'all'이면 전체, 그 외엔 type 매칭
  const filtered = ITEMS.filter((i) => filter === "all" || i.type === filter);

  return (
    <div className="page">
      {/* 브레드크럼 — 시안의 setRoute 추상화를 Next.js Link로 대체 */}
      <div style={{ display: "flex", gap: 6, fontSize: 12, color: "var(--ink-mute)", marginBottom: 12 }}>
        <Link href="/" style={{ color: "inherit" }}>홈</Link>
        <span>›</span>
        <span style={{ color: "var(--ink)" }}>갤러리</span>
      </div>

      {/* 헤더 — eyebrow + h1 + 설명 + 업로드 버튼 2종 */}
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
          <div className="eyebrow">하이라이트 · HIGHLIGHTS</div>
          <h1 style={{ margin: "4px 0 6px", fontSize: 32, fontWeight: 800, letterSpacing: "-0.02em" }}>
            그 날의 코트, 다시 보기
          </h1>
          <p style={{ margin: 0, color: "var(--ink-mute)", fontSize: 14 }}>
            커뮤니티가 올린 클립·사진. 좋아요 많은 순으로 주간 하이라이트에 선정됩니다.
          </p>
          {/* "준비 중" 안내 — 사용자 지침: DB 미지원 제거 금지, 미리보기만 */}
          <p style={{ margin: "8px 0 0", color: "var(--ink-dim)", fontSize: 12, lineHeight: 1.5 }}>
            현재 갤러리 페이지는 준비 중입니다. UI 미리보기로만 동작합니다.
          </p>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <button className="btn btn--sm">📷 사진 업로드</button>
          <button className="btn btn--accent btn--sm">▶ 클립 업로드</button>
        </div>
      </div>

      {/* Featured strip — 16:6 비율 메인 배너. 클릭 시 첫 아이템 라이트박스 */}
      <div
        className="card"
        style={{
          padding: 0,
          overflow: "hidden",
          marginBottom: 18,
          position: "relative",
          aspectRatio: "16/6",
          background: "linear-gradient(135deg, hsl(215 60% 30%) 0%, #000 100%)",
          cursor: "pointer",
        }}
        onClick={() => setLightbox(ITEMS[0])}
      >
        {/* 가짜 코트 라인 SVG — 시안 그대로 */}
        <svg viewBox="0 0 1600 600" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.2 }}>
          <circle cx="800" cy="300" r="120" stroke="#fff" strokeWidth="3" fill="none" />
          <rect x="200" y="180" width="160" height="240" stroke="#fff" strokeWidth="3" fill="none" />
          <rect x="1240" y="180" width="160" height="240" stroke="#fff" strokeWidth="3" fill="none" />
          <line x1="800" y1="0" x2="800" y2="600" stroke="#fff" strokeWidth="3" />
        </svg>
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-end",
            padding: 36,
            color: "#fff",
          }}
        >
          <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
            <span
              style={{
                background: "var(--accent)",
                fontSize: 10,
                fontWeight: 900,
                letterSpacing: ".12em",
                padding: "4px 10px",
                borderRadius: 3,
                textTransform: "uppercase",
              }}
            >
              이 주의 클립
            </span>
            <span
              style={{
                background: "rgba(255,255,255,.15)",
                fontSize: 10,
                fontWeight: 700,
                padding: "4px 10px",
                borderRadius: 3,
                letterSpacing: ".06em",
              }}
            >
              0:42
            </span>
          </div>
          <h2
            style={{
              margin: 0,
              fontFamily: "var(--ff-display)",
              fontSize: 38,
              fontWeight: 900,
              letterSpacing: "-0.02em",
              maxWidth: 700,
            }}
          >
            버저비터 3점 · 킹스크루 vs 3POINT
          </h2>
          <div style={{ fontSize: 13, opacity: 0.85, marginTop: 8, fontFamily: "var(--ff-mono)" }}>
            @편집자 · ♥ 1,240 · 12.8k views · 04.20
          </div>
        </div>
        {/* 우측 큰 플레이 버튼 */}
        <div
          style={{
            position: "absolute",
            top: "50%",
            right: 48,
            transform: "translateY(-50%)",
            width: 72,
            height: 72,
            background: "rgba(255,255,255,.18)",
            borderRadius: "50%",
            display: "grid",
            placeItems: "center",
            border: "2px solid rgba(255,255,255,.6)",
            backdropFilter: "blur(8px)",
          }}
        >
          <div
            style={{
              width: 0,
              height: 0,
              borderLeft: "22px solid #fff",
              borderTop: "14px solid transparent",
              borderBottom: "14px solid transparent",
              marginLeft: 6,
            }}
          />
        </div>
      </div>

      {/* Filters — all / clip / photo + 정렬 select */}
      <div style={{ display: "flex", gap: 6, marginBottom: 14, flexWrap: "wrap" }}>
        {(
          [
            { id: "all", label: "전체", n: ITEMS.length },
            { id: "clip", label: "클립", n: ITEMS.filter((i) => i.type === "clip").length },
            { id: "photo", label: "사진", n: ITEMS.filter((i) => i.type === "photo").length },
          ] as { id: Filter; label: string; n: number }[]
        ).map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`btn ${filter === f.id ? "btn--primary" : ""} btn--sm`}
          >
            {f.label}{" "}
            <span style={{ marginLeft: 4, opacity: 0.7, fontFamily: "var(--ff-mono)" }}>{f.n}</span>
          </button>
        ))}
        <div style={{ flex: 1 }} />
        <select className="input" style={{ padding: "4px 10px", fontSize: 12 }}>
          <option>최신순</option>
          <option>좋아요순</option>
          <option>조회순</option>
        </select>
      </div>

      {/* Grid — 4열, 4:3 비율 썸네일 */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
        {filtered.map((it) => (
          <Thumb key={it.id} it={it} onClick={() => setLightbox(it)} />
        ))}
      </div>

      {/* Lightbox — 모달. 좌(미디어) + 우(메타/액션) 2단 그리드 */}
      {lightbox && (
        <div
          onClick={() => setLightbox(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,.85)",
            zIndex: 1000,
            display: "grid",
            placeItems: "center",
            padding: 40,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: 1100,
              width: "100%",
              display: "grid",
              gridTemplateColumns: "minmax(0,1fr) 320px",
              gap: 0,
              background: "var(--bg)",
              borderRadius: 8,
              overflow: "hidden",
              boxShadow: "0 40px 120px rgba(0,0,0,.6)",
            }}
          >
            {/* 좌: 미디어 영역 — clip이면 플레이 버튼, 16:10 비율 */}
            <div
              style={{
                aspectRatio: "16/10",
                background: `linear-gradient(135deg, hsl(${lightbox.hue} 60% 42%) 0%, hsl(${lightbox.hue} 70% 18%) 100%)`,
                position: "relative",
              }}
            >
              <svg
                viewBox="0 0 400 300"
                style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.25 }}
              >
                <circle cx="200" cy="150" r="55" stroke="#fff" strokeWidth="2" fill="none" />
                <rect x="50" y="80" width="80" height="140" stroke="#fff" strokeWidth="2" fill="none" />
                <rect x="270" y="80" width="80" height="140" stroke="#fff" strokeWidth="2" fill="none" />
                <line x1="200" y1="0" x2="200" y2="300" stroke="#fff" strokeWidth="2" />
              </svg>
              {lightbox.type === "clip" && (
                <div
                  style={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%,-50%)",
                    width: 80,
                    height: 80,
                    background: "rgba(0,0,0,.6)",
                    borderRadius: "50%",
                    display: "grid",
                    placeItems: "center",
                  }}
                >
                  <div
                    style={{
                      width: 0,
                      height: 0,
                      borderLeft: "22px solid #fff",
                      borderTop: "14px solid transparent",
                      borderBottom: "14px solid transparent",
                      marginLeft: 6,
                    }}
                  />
                </div>
              )}
            </div>

            {/* 우: 메타 + 좋아요/조회 + 액션 버튼 3종 */}
            <div style={{ padding: "24px 22px", display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
                <span className="badge badge--soft">{lightbox.type === "clip" ? "CLIP" : "PHOTO"}</span>
                {lightbox.team && (
                  <span
                    className="badge"
                    style={{ background: lightbox.teamColor, color: "#fff", border: 0 }}
                  >
                    {lightbox.team}
                  </span>
                )}
              </div>
              <h3
                style={{
                  margin: "0 0 10px",
                  fontSize: 18,
                  fontWeight: 800,
                  letterSpacing: "-0.015em",
                  lineHeight: 1.3,
                }}
              >
                {lightbox.title}
              </h3>
              <div
                style={{
                  fontSize: 12,
                  color: "var(--ink-mute)",
                  fontFamily: "var(--ff-mono)",
                  marginBottom: 16,
                }}
              >
                @{lightbox.author} · {lightbox.date}
              </div>
              {/* 좋아요 / 조회수 박스 2개 */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 8,
                  marginBottom: 16,
                }}
              >
                <div style={{ padding: "10px 12px", background: "var(--bg-alt)", borderRadius: 4 }}>
                  <div
                    style={{
                      fontSize: 10,
                      color: "var(--ink-dim)",
                      fontWeight: 700,
                      letterSpacing: ".06em",
                    }}
                  >
                    LIKES
                  </div>
                  <div style={{ fontFamily: "var(--ff-display)", fontSize: 20, fontWeight: 900 }}>
                    {lightbox.likes.toLocaleString()}
                  </div>
                </div>
                <div style={{ padding: "10px 12px", background: "var(--bg-alt)", borderRadius: 4 }}>
                  <div
                    style={{
                      fontSize: 10,
                      color: "var(--ink-dim)",
                      fontWeight: 700,
                      letterSpacing: ".06em",
                    }}
                  >
                    VIEWS
                  </div>
                  <div style={{ fontFamily: "var(--ff-display)", fontSize: 20, fontWeight: 900 }}>
                    {lightbox.views.toLocaleString()}
                  </div>
                </div>
              </div>
              {/* 액션 버튼 — 좋아요(primary) / 공유 / 신고(고스트) */}
              <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: "auto" }}>
                <button className="btn btn--primary btn--sm">♥ 좋아요</button>
                <button className="btn btn--sm">🔗 공유</button>
                <button
                  className="btn btn--sm"
                  style={{
                    background: "transparent",
                    border: 0,
                    color: "var(--ink-dim)",
                    fontSize: 11,
                  }}
                >
                  🚩 신고
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------
 * Thumb — 썸네일 카드.
 * 시안의 인라인 컴포넌트를 분리. hover 시 Y축 -2px transform 효과.
 * ------------------------------------------------------------ */
function Thumb({ it, onClick }: { it: GalleryItem; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      style={{
        position: "relative",
        aspectRatio: "4/3",
        borderRadius: 6,
        overflow: "hidden",
        cursor: "pointer",
        background: `linear-gradient(135deg, hsl(${it.hue} 60% 42%) 0%, hsl(${it.hue} 70% 18%) 100%)`,
        boxShadow: "0 1px 2px rgba(0,0,0,.08)",
        transition: "transform .15s",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-2px)")}
      onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
    >
      {/* 가짜 코트 라인 — 시안 그대로 */}
      <svg
        viewBox="0 0 400 300"
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.25 }}
      >
        <circle cx="200" cy="150" r="55" stroke="#fff" strokeWidth="2" fill="none" />
        <rect x="50" y="80" width="80" height="140" stroke="#fff" strokeWidth="2" fill="none" />
        <rect x="270" y="80" width="80" height="140" stroke="#fff" strokeWidth="2" fill="none" />
        <line x1="200" y1="0" x2="200" y2="300" stroke="#fff" strokeWidth="2" />
      </svg>

      {/* 클립일 때 중앙 플레이 버튼 */}
      {it.type === "clip" && (
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%,-50%)",
            width: 52,
            height: 52,
            background: "rgba(0,0,0,.55)",
            borderRadius: "50%",
            display: "grid",
            placeItems: "center",
            backdropFilter: "blur(4px)",
          }}
        >
          <div
            style={{
              width: 0,
              height: 0,
              borderLeft: "14px solid #fff",
              borderTop: "9px solid transparent",
              borderBottom: "9px solid transparent",
              marginLeft: 4,
            }}
          />
        </div>
      )}

      {/* 좌상단 배지: type 라벨 + 팀 코드 */}
      <div style={{ position: "absolute", top: 10, left: 10, display: "flex", gap: 5 }}>
        <span
          style={{
            background: "rgba(0,0,0,.65)",
            color: "#fff",
            fontSize: 10,
            fontWeight: 800,
            letterSpacing: ".06em",
            padding: "3px 7px",
            borderRadius: 3,
            textTransform: "uppercase",
          }}
        >
          {it.type === "clip" ? "▶ CLIP" : "📷 PHOTO"}
        </span>
        {it.team && (
          <span
            style={{
              background: it.teamColor,
              color: "#fff",
              fontSize: 10,
              fontWeight: 800,
              letterSpacing: ".06em",
              padding: "3px 7px",
              borderRadius: 3,
              fontFamily: "var(--ff-mono)",
            }}
          >
            {it.team}
          </span>
        )}
      </div>

      {/* 우상단 duration (clip 전용) */}
      {it.duration && (
        <span
          style={{
            position: "absolute",
            top: 10,
            right: 10,
            background: "rgba(0,0,0,.65)",
            color: "#fff",
            fontSize: 10,
            fontWeight: 700,
            padding: "2px 6px",
            borderRadius: 3,
            fontFamily: "var(--ff-mono)",
          }}
        >
          {it.duration}
        </span>
      )}

      {/* 하단 그라디언트 + 제목/메타 */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          padding: "16px 12px 10px",
          background: "linear-gradient(transparent, rgba(0,0,0,.85))",
          color: "#fff",
        }}
      >
        <div style={{ fontWeight: 700, fontSize: 13, lineHeight: 1.3 }}>{it.title}</div>
        <div
          style={{
            fontSize: 10,
            opacity: 0.8,
            fontFamily: "var(--ff-mono)",
            marginTop: 4,
            display: "flex",
            gap: 8,
          }}
        >
          <span>♥ {(it.likes / 1000).toFixed(1)}k</span>
          <span>👁 {(it.views / 1000).toFixed(1)}k</span>
          <span>· {it.date}</span>
        </div>
      </div>
    </div>
  );
}
