"use client";

/* ============================================================
 * /shop — 굿즈 샵 (Shop) v2 신규 — Phase 7
 *
 * 이유: BDR v2 디자인 적용. Shop 시안을 1:1 박제.
 *      시안: Dev/design/BDR v2/screens/Shop.jsx
 *
 * 원칙 (사용자 지침: "DB 미지원 기능도 제거 금지 — UI 배치 + 준비 중 표시"):
 *  - API/Prisma/서비스 0 변경. DB 0% 지원 → 정적 더미만.
 *  - 페이지 상단 "준비 중" 안내 1줄 노출.
 *  - 시안의 인라인 이모지(🛒 ♡ ★ 🚚 ↩️ ✅ 💳)는 그대로 박제 (Material Symbols 변환 X).
 *  - lucide-react 금지. setRoute → next/link.
 *
 * 데이터 추후 마이그레이션 (스코프 외):
 *  - products / product_variants 모델 (브랜드·가격·재고·태그)
 *  - product_categories 모델 (5종: shoe/ball/wear/gear/team)
 *  - product_reviews 모델 (rating·reviews)
 *  - cart_items / wishlist_items 모델 (♡, 🛒)
 *
 * 참고: src/app/(web)/safety/page.tsx, src/app/(web)/calendar/page.tsx 동일 패턴.
 * ============================================================ */

import Link from "next/link";
import { useState } from "react";

// 카테고리 5종 — 시안 그대로. id는 product.cat과 매칭
const CATS: { id: string; label: string }[] = [
  { id: "shoe", label: "농구화" },
  { id: "ball", label: "공" },
  { id: "wear", label: "의류" },
  { id: "gear", label: "보호대·장비" },
  { id: "team", label: "팀 굿즈" },
];

// 상품 더미 12종 — 시안 그대로 박제. DB 모델 미존재.
// price=정가, sale=할인가 (sale<price면 할인 표시), color=썸네일 그라디언트 색상.
type Product = {
  id: string;
  cat: string;
  brand: string;
  name: string;
  price: number;
  sale: number;
  rating: number;
  reviews: number;
  stock: string;
  color: string;
  tags: string[];
};

const PRODUCTS: Product[] = [
  { id: "p1", cat: "shoe", brand: "NIKE", name: 'KD 16 "Ready Play"', price: 169000, sale: 139000, rating: 4.8, reviews: 234, stock: "재고 多", color: "#DC2626", tags: ["EXCLUSIVE"] },
  { id: "p2", cat: "shoe", brand: "UNDER ARMOUR", name: "Curry 11 Low Team", price: 179000, sale: 159000, rating: 4.9, reviews: 412, stock: "품절임박", color: "#0F5FCC", tags: ["HOT"] },
  { id: "p3", cat: "ball", brand: "MOLTEN", name: "BGG7X · FIBA 공인구", price: 68000, sale: 59000, rating: 4.9, reviews: 892, stock: "재고 多", color: "#F59E0B", tags: ["BESTSELLER"] },
  { id: "p4", cat: "ball", brand: "SPALDING", name: "TF-1000 Legacy 7호", price: 98000, sale: 89000, rating: 4.7, reviews: 340, stock: "재고 多", color: "#7C2D12", tags: [] },
  { id: "p5", cat: "wear", brand: "BDR STUDIO", name: "REDEEM 2026 저지 홈", price: 59000, sale: 59000, rating: 4.6, reviews: 47, stock: "입고대기", color: "#DC2626", tags: ["팀"] },
  { id: "p6", cat: "wear", brand: "NIKE", name: "Dri-FIT 숏 슬리브 농구 티", price: 49000, sale: 39000, rating: 4.5, reviews: 178, stock: "재고 多", color: "#000", tags: [] },
  { id: "p7", cat: "gear", brand: "BODY FRIEND", name: "무릎 슬리브 Pro 2", price: 35000, sale: 32000, rating: 4.7, reviews: 521, stock: "재고 多", color: "#374151", tags: [] },
  { id: "p8", cat: "gear", brand: "McDAVID", name: "발목 보호대 195", price: 29000, sale: 26000, rating: 4.8, reviews: 814, stock: "재고 多", color: "#10B981", tags: ["재구매율↑"] },
  { id: "p9", cat: "team", brand: "BDR STUDIO", name: "BDR Challenge 공식 후디", price: 79000, sale: 69000, rating: 4.8, reviews: 120, stock: "S/M/L", color: "#111", tags: ["한정"] },
  { id: "p10", cat: "team", brand: "BDR STUDIO", name: "팀 맞춤 저지 (5장 세트)", price: 350000, sale: 320000, rating: 5.0, reviews: 28, stock: "주문제작", color: "#8B5CF6", tags: ["CUSTOM"] },
  { id: "p11", cat: "shoe", brand: "ADIDAS", name: "Harden Vol.9", price: 189000, sale: 169000, rating: 4.6, reviews: 156, stock: "재고 多", color: "#475569", tags: [] },
  { id: "p12", cat: "gear", brand: "SKLZ", name: "드리블 고글 (시야 제한 훈련)", price: 42000, sale: 39000, rating: 4.4, reviews: 62, stock: "재고 多", color: "#F59E0B", tags: [] },
];

// 하단 안내 4종 — 시안 이모지 그대로 박제 (Material Symbols 변환 금지)
const INFO_BAR: { icon: string; t: string; d: string }[] = [
  { icon: "🚚", t: "무료 배송", d: "50,000원 이상 전국 무료" },
  { icon: "↩️", t: "30일 반품", d: "미개봉 제품 무조건 반품" },
  { icon: "✅", t: "정품 보증", d: "공식 파트너 직배송" },
  { icon: "💳", t: "무이자 할부", d: "5만원 이상 2~6개월" },
];

export default function ShopPage() {
  // 카테고리 필터 — 'all' 또는 cats[].id 중 하나
  const [cat, setCat] = useState<string>("all");
  // 장바구니 카운트 — 시안 기본값 3, 버튼 클릭 시 +1 (실제 동작 X, UI 박제)
  const [cart, setCart] = useState<number>(3);

  // 카테고리별 필터링된 노출 상품
  const shown = cat === "all" ? PRODUCTS : PRODUCTS.filter((p) => p.cat === cat);

  return (
    <div className="page">
      {/* 브레드크럼 — 시안의 setRoute('home') → next/link */}
      <div style={{ display: "flex", gap: 6, fontSize: 12, color: "var(--ink-mute)", marginBottom: 12 }}>
        <Link href="/" style={{ color: "inherit" }}>홈</Link>
        <span>›</span>
        <span style={{ color: "var(--ink)" }}>샵</span>
      </div>

      {/* "준비 중" 안내 — 사용자 지침: DB 미지원 기능은 빈 상태/안내로 표시 */}
      <p style={{ margin: "0 0 12px", color: "var(--ink-dim)", fontSize: 12, lineHeight: 1.5 }}>
        현재 굿즈 샵은 준비 중입니다. UI 미리보기로만 동작합니다.
      </p>

      {/* Hero — BDR Red 그라디언트 + 데코 원형 보더 2개 */}
      <div
        className="card"
        style={{
          padding: "32px 40px",
          marginBottom: 18,
          background: "linear-gradient(110deg, #DC2626 0%, #7F1D1D 60%, #000 100%)",
          color: "#fff",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* 데코 원형 1 — 우상단 큰 원 */}
        <div
          style={{
            position: "absolute",
            right: -40,
            top: -40,
            width: 280,
            height: 280,
            border: "40px solid rgba(255,255,255,.08)",
            borderRadius: "50%",
          }}
        />
        {/* 데코 원형 2 — 우상단 작은 원 */}
        <div
          style={{
            position: "absolute",
            right: 60,
            top: 60,
            width: 180,
            height: 180,
            border: "20px solid rgba(255,255,255,.12)",
            borderRadius: "50%",
          }}
        />
        <div style={{ position: "relative" }}>
          <div
            style={{
              fontSize: 11,
              letterSpacing: ".14em",
              opacity: 0.85,
              fontWeight: 800,
              textTransform: "uppercase",
            }}
          >
            BDR SHOP · 2026 SPRING
          </div>
          <h1
            style={{
              margin: "6px 0 8px",
              fontFamily: "var(--ff-display)",
              fontSize: 42,
              fontWeight: 900,
              letterSpacing: "-0.03em",
              lineHeight: 1.1,
            }}
          >
            우리가 직접 쓰는 것만.
          </h1>
          <p style={{ margin: 0, fontSize: 14, opacity: 0.9, maxWidth: 520 }}>
            커뮤니티 멤버 리뷰 4.5+ 제품 · 공식 파트너 직배송 · 팀 굿즈 맞춤 제작
          </p>
          <div style={{ display: "flex", gap: 8, marginTop: 18 }}>
            <button className="btn" style={{ background: "#fff", color: "#000", border: 0 }}>
              시즌 신상 보기 →
            </button>
            <button
              className="btn"
              style={{
                background: "transparent",
                color: "#fff",
                border: "1px solid rgba(255,255,255,.4)",
              }}
            >
              팀 주문 상담
            </button>
          </div>
        </div>
      </div>

      {/* Toolbar — 좌측 카테고리 필터 + 우측 정렬/장바구니 */}
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
          {/* 'all' + cats 5종 → 6개 버튼. 라벨에 카테고리별 상품 수 표기 */}
          {[
            { id: "all", label: `전체 · ${PRODUCTS.length}` },
            ...CATS.map((c) => ({
              id: c.id,
              label: `${c.label} · ${PRODUCTS.filter((p) => p.cat === c.id).length}`,
            })),
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setCat(f.id)}
              className={`btn ${cat === f.id ? "btn--primary" : ""} btn--sm`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", gap: 6, alignItems: "center", fontSize: 12 }}>
          <select className="input" style={{ padding: "4px 8px", fontSize: 12 }}>
            <option>추천순</option>
            <option>리뷰순</option>
            <option>가격낮은순</option>
            <option>신상순</option>
          </select>
          <button className="btn btn--sm" onClick={() => setCart(cart + 1)}>
            🛒 장바구니{" "}
            <span
              style={{
                fontFamily: "var(--ff-mono)",
                fontWeight: 700,
                marginLeft: 4,
                background: "var(--accent)",
                color: "#fff",
                padding: "1px 6px",
                borderRadius: 99,
              }}
            >
              {cart}
            </span>
          </button>
        </div>
      </div>

      {/* Grid — 4열 카드. 썸네일은 색상 그라디언트 + 브랜드 3글자 워터마크 */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
        {shown.map((p) => (
          <div key={p.id} className="card" style={{ padding: 0, overflow: "hidden", cursor: "pointer" }}>
            {/* 썸네일 영역 — 1:1 비율 + 브랜드명 워터마크 + 태그/할인/♡ */}
            <div
              style={{
                aspectRatio: "1/1",
                background: `linear-gradient(135deg, ${p.color} 0%, #000 130%)`,
                position: "relative",
                display: "grid",
                placeItems: "center",
              }}
            >
              <div
                style={{
                  fontFamily: "var(--ff-display)",
                  fontSize: 56,
                  fontWeight: 900,
                  color: "rgba(255,255,255,.18)",
                  letterSpacing: "-0.04em",
                }}
              >
                {p.brand.slice(0, 3)}
              </div>
              {/* 좌상단 태그 칩 — tags 배열 세로 나열 */}
              {p.tags.length > 0 && (
                <div style={{ position: "absolute", top: 10, left: 10, display: "flex", flexDirection: "column", gap: 3 }}>
                  {p.tags.map((t) => (
                    <span
                      key={t}
                      style={{
                        background: "#fff",
                        color: "#000",
                        fontSize: 9,
                        fontWeight: 800,
                        letterSpacing: ".08em",
                        padding: "3px 7px",
                        borderRadius: 3,
                        textTransform: "uppercase",
                      }}
                    >
                      {t}
                    </span>
                  ))}
                </div>
              )}
              {/* 좌하단 할인율 — sale<price일 때만 노출 */}
              {p.sale < p.price && (
                <span
                  style={{
                    position: "absolute",
                    bottom: 10,
                    left: 10,
                    background: "var(--accent)",
                    color: "#fff",
                    fontSize: 11,
                    fontWeight: 800,
                    padding: "3px 8px",
                    borderRadius: 3,
                    fontFamily: "var(--ff-mono)",
                  }}
                >
                  -{Math.round((1 - p.sale / p.price) * 100)}%
                </span>
              )}
              {/* 우상단 위시리스트 ♡ — 시안 이모지 그대로 박제 */}
              <button
                style={{
                  position: "absolute",
                  top: 10,
                  right: 10,
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  background: "rgba(255,255,255,.9)",
                  border: 0,
                  cursor: "pointer",
                  fontSize: 14,
                }}
                aria-label="위시리스트 추가"
              >
                ♡
              </button>
            </div>
            {/* 카드 텍스트 영역 */}
            <div style={{ padding: "14px 16px" }}>
              <div
                style={{
                  fontSize: 10,
                  color: "var(--ink-dim)",
                  fontWeight: 800,
                  letterSpacing: ".12em",
                  fontFamily: "var(--ff-mono)",
                }}
              >
                {p.brand}
              </div>
              <div style={{ fontWeight: 700, fontSize: 13, margin: "4px 0", lineHeight: 1.4, minHeight: 36 }}>
                {p.name}
              </div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 6 }}>
                {/* 할인 시 sale=accent색, 정가 시 ink색 */}
                <span
                  style={{
                    fontFamily: "var(--ff-display)",
                    fontSize: 18,
                    fontWeight: 900,
                    color: p.sale < p.price ? "var(--accent)" : "var(--ink)",
                  }}
                >
                  ₩{p.sale.toLocaleString()}
                </span>
                {p.sale < p.price && (
                  <span
                    style={{
                      fontSize: 11,
                      color: "var(--ink-dim)",
                      textDecoration: "line-through",
                      fontFamily: "var(--ff-mono)",
                    }}
                  >
                    ₩{p.price.toLocaleString()}
                  </span>
                )}
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: 11,
                  color: "var(--ink-mute)",
                  fontFamily: "var(--ff-mono)",
                }}
              >
                {/* ★ 시안 이모지 그대로 — 평점 + 리뷰 수 */}
                <span>★ {p.rating} ({p.reviews})</span>
                {/* 재고 상태별 색상 분기 — 품절임박=err, 입고대기=dim, 그 외=ok */}
                <span
                  style={{
                    color:
                      p.stock === "품절임박"
                        ? "var(--err)"
                        : p.stock === "입고대기"
                          ? "var(--ink-dim)"
                          : "var(--ok)",
                  }}
                >
                  {p.stock}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Info bar — 4열 안내. 이모지 시안 그대로 (🚚 ↩️ ✅ 💳) */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginTop: 24 }}>
        {INFO_BAR.map((s) => (
          <div key={s.t} style={{ padding: "16px 18px", background: "var(--bg-alt)", borderRadius: 6 }}>
            <div style={{ fontSize: 22, marginBottom: 4 }}>{s.icon}</div>
            <div style={{ fontWeight: 700, fontSize: 13 }}>{s.t}</div>
            <div style={{ fontSize: 11, color: "var(--ink-mute)" }}>{s.d}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
