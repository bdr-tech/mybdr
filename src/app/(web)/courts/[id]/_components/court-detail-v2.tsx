"use client";

/* ============================================================
 * CourtDetailV2 — Phase 3 Court 상세 v2 시안 적용
 *
 * 디자인 시안: Dev/design/BDR v2/screens/CourtDetail.jsx
 *
 * 데이터 보존 원칙:
 *  - API/Prisma 변경 0
 *  - 본 컴포넌트는 page.tsx 의 메인 정보 카드 영역(타이틀·주소·뱃지·desc·시설·CTA·이용현황) 만 대체
 *  - 하단 클라이언트 섹션(체크인/앰배서더/픽업/이벤트/랭킹/리뷰/제보/수정제안) 은 page.tsx 에서 그대로 호출
 *
 * "준비 중" 처리 (DB 미지원):
 *  - 시간대별 혼잡도(12슬롯) → 빈 막대 + "시간대별 데이터 준비 중" 캡션
 *    (단, 현재 활성 카운트는 단일 큰 막대로 노출 → 데이터 보존 + 시안 형태 유지)
 *  - 샤워/락커/연락처 → "정보 없음"
 *  - 운영시간 → lighting_until 있으면 노출, 없으면 "운영시간 미상"
 *  - 자유 태그(courts.tags) → pickupCount > 0 면 "픽업 모집중", verified 면 "검증됨". 그 외 생략
 *  - "이곳에서 모집 글쓰기" → alert("준비 중인 기능입니다")
 *
 * KakaoMap 임베드 (Side 첫 카드):
 *  - 좌표 있으면 단일 마커 + showCurrentLocation
 *  - 좌표 없으면 placeholder
 * ============================================================ */

import useSWR from "swr";
import { KakaoMap, type MapMarker } from "@/components/shared/kakao-map";
import Link from "next/link";

// SWR fetcher
const fetcher = (url: string) => fetch(url).then((r) => r.json());

// 바닥재질 한글 매핑 (court-card-v2 와 동일)
const SURFACE_LABELS: Record<string, string> = {
  urethane: "우레탄",
  rubber: "고무",
  modular: "모듈형",
  concrete: "콘크리트",
  asphalt: "아스팔트",
  wood: "마룻바닥",
};

// 코트 데이터 — page.tsx 의 prisma.court_infos.findUnique 결과 중 본 v2 카드에서 사용하는 필드만 직렬화
export interface CourtDetailV2Data {
  id: string;
  name: string;
  address: string;
  city: string;
  district: string | null;
  description: string | null;
  court_type: string; // "indoor" | "outdoor" | "unknown"
  surface_type: string | null;
  hoops_count: number | null;
  is_free: boolean | null;
  fee: number | null;
  has_lighting: boolean | null;
  lighting_until: string | null;
  has_restroom: boolean | null;
  has_parking: boolean | null;
  verified: boolean;
  data_source: string | null;
  nearest_station: string | null;
  facilities: string[];
  average_rating: number | null;
  reviews_count: number;
  checkins_count: number;
  pickup_count: number;
  latitude: number;
  longitude: number;
  // Phase A 코트 대관 — booking_mode 분기 CTA 용 (none/external/internal)
  booking_mode: string;
  rental_url: string | null;
}

// 시간대별 혼잡도 — DB 미지원 → 빈 슬롯 12개 (시안 시각 형태 유지 + "데이터 준비 중" 캡션)
const TIME_SLOTS = [
  "09",
  "10",
  "11",
  "12",
  "13",
  "14",
  "15",
  "16",
  "17",
  "18",
  "19",
  "20",
] as const;

// 시안 fee 라벨
function feeLabel(d: CourtDetailV2Data): string {
  if (d.is_free === true) return "무료";
  if (d.is_free === false) return d.fee ? `${d.fee.toLocaleString()}원` : "유료";
  return "요금 미상";
}

// 시안 hours 라벨
function hoursLabel(d: CourtDetailV2Data): string {
  if (d.lighting_until) return `~${d.lighting_until}`;
  if (d.court_type === "outdoor" && d.has_lighting === true) return "야간 가능";
  if (d.court_type === "outdoor" && d.has_lighting === false) return "주간만";
  return "운영시간 미상";
}

// 코트 유형 + 갯수 라벨
function typeAndCountLabel(d: CourtDetailV2Data): string {
  const t = d.court_type === "indoor" ? "실내" : d.court_type === "outdoor" ? "야외" : "미분류";
  if (d.hoops_count != null) return `${t} · ${d.hoops_count}코트`;
  return t;
}

// 자유 태그 — 시안 c.tags 자리. DB 미지원이므로 실데이터 기반 자동 생성
function buildAutoTags(d: CourtDetailV2Data): string[] {
  const tags: string[] = [];
  if (d.verified) tags.push("검증됨");
  if (d.pickup_count > 0) tags.push("픽업 모집중");
  if (d.has_lighting === true) tags.push("야간 가능");
  return tags;
}

interface CourtDetailV2Props {
  court: CourtDetailV2Data;
}

export function CourtDetailV2({ court }: CourtDetailV2Props) {
  // 현재 활성 체크인 — court-checkin 과 동일 엔드포인트
  // 이유: 시안의 "오늘의 혼잡도"를 시간대별 분포로 못 그리므로 현재 활성 카운트만 단일 막대로 노출
  const { data } = useSWR<{ data?: { active_count?: number } }>(
    `/api/web/courts/${court.id}/checkins`,
    fetcher,
    { refreshInterval: 30_000, revalidateOnFocus: false }
  );
  const activeCount = data?.data?.active_count ?? 0;

  const lat = court.latitude;
  const lng = court.longitude;
  const hasCoord = lat !== 0 && lng !== 0;

  // 카카오맵 외부 URL (Side 버튼)
  const kakaoMapUrl = hasCoord
    ? `https://map.kakao.com/link/map/${encodeURIComponent(court.name)},${lat},${lng}`
    : "#";
  const kakaoNaviUrl = hasCoord
    ? `https://map.kakao.com/link/to/${encodeURIComponent(court.name)},${lat},${lng}`
    : "#";

  const tags = buildAutoTags(court);
  const surface = court.surface_type ? SURFACE_LABELS[court.surface_type] ?? court.surface_type : null;
  const area = court.district || court.city;
  const fee = feeLabel(court);
  const hours = hoursLabel(court);
  const tc = typeAndCountLabel(court);

  // 단일 마커 (Side 지도용)
  const mapMarker: MapMarker[] = hasCoord
    ? [
        {
          id: court.id,
          lat,
          lng,
          name: court.name,
          type: court.court_type === "indoor" ? "indoor" : "outdoor",
          activeCount,
          rating: court.average_rating ?? undefined,
        },
      ]
    : [];

  // 시안 단일 막대(현재 활성) — busy/total 비율 = activeCount/20 (20명 풀 가정, court-checkin 과 동일 임계)
  // 색: pct>0.8 accent / >0.5 warn / else ok
  const pct = Math.min(activeCount / 20, 1);
  const barColor =
    pct > 0.8 ? "var(--accent)" : pct > 0.5 ? "var(--warn)" : "var(--ok)";
  const statusLabel =
    activeCount >= 5 ? "혼잡" : activeCount >= 1 ? "보통" : "한산";

  return (
    <div className="page page--wide" style={{ padding: 0 }}>
      {/* ─── 브레드크럼 ─── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          fontSize: 12,
          color: "var(--ink-mute)",
          marginBottom: 14,
          flexWrap: "wrap",
        }}
      >
        <Link href="/" style={{ color: "var(--ink-mute)", textDecoration: "none" }}>
          홈
        </Link>
        <span>›</span>
        <Link href="/courts" style={{ color: "var(--ink-mute)", textDecoration: "none" }}>
          코트
        </Link>
        <span>›</span>
        <span style={{ color: "var(--ink)" }}>{court.name}</span>
      </div>

      {/* ─── 시안 그리드: 좌측 메인 + 우측 sticky Side ─── */}
      <div
        className="court-detail-v2-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1fr)",
          gap: 24,
          alignItems: "flex-start",
        }}
      >
        {/* ─── 좌측: 메인 ─── */}
        <div>
          {/* 헤더 카드 */}
          <div className="card" style={{ padding: 0, overflow: "hidden", marginBottom: 20 }}>
            {/* 시안 placeholder 영역 — image 없음 → 회색 줄무늬 그라디언트 + 자동 태그 배지 */}
            <div
              style={{
                height: 220,
                background:
                  "repeating-linear-gradient(45deg, var(--bg-alt) 0 14px, var(--bg-elev) 14px 28px)",
                position: "relative",
                borderBottom: "1px solid var(--border)",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "grid",
                  placeItems: "center",
                  fontFamily: "var(--ff-mono)",
                  fontSize: 12,
                  color: "var(--ink-dim)",
                }}
              >
                COURT PHOTO · 준비 중
              </div>
              {tags.length > 0 && (
                <div style={{ position: "absolute", left: 16, top: 16, display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {tags.map((t) => (
                    <span key={t} className="badge badge--soft">
                      {t}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div style={{ padding: "22px 24px" }}>
              {/* area (uppercase eyebrow) */}
              <div
                style={{
                  fontSize: 12,
                  color: "var(--ink-dim)",
                  letterSpacing: ".08em",
                  textTransform: "uppercase",
                  fontWeight: 700,
                  marginBottom: 6,
                }}
              >
                {area}
              </div>
              <h1
                style={{
                  margin: "0 0 8px",
                  fontSize: 30,
                  fontWeight: 800,
                  letterSpacing: "-0.02em",
                  color: "var(--ink)",
                }}
              >
                {court.name}
              </h1>
              <div
                style={{
                  fontSize: 13,
                  color: "var(--ink-mute)",
                  marginBottom: 14,
                }}
              >
                {court.address}
              </div>
              {court.description ? (
                <p style={{ margin: 0, color: "var(--ink-soft)", lineHeight: 1.7 }}>
                  {court.description}
                </p>
              ) : (
                <p
                  style={{
                    margin: 0,
                    color: "var(--ink-dim)",
                    lineHeight: 1.7,
                    fontStyle: "italic",
                  }}
                >
                  코트 소개가 아직 등록되지 않았습니다.
                </p>
              )}

              {/* 정보 출처 — 데이터 신뢰 표기는 v1 그대로 보존 */}
              {court.data_source && (
                <div
                  style={{
                    marginTop: 12,
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    fontSize: 11,
                    color: "var(--ink-dim)",
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 13 }}>
                    info
                  </span>
                  정보 출처:{" "}
                  {court.data_source === "manual_curation"
                    ? "관리자 직접 확인"
                    : court.data_source === "kakao_search"
                    ? "카카오맵"
                    : court.data_source === "google_places"
                    ? "구글맵"
                    : court.data_source === "ambassador"
                    ? "앰배서더 직접 수정"
                    : court.data_source}
                  {!court.verified && " (미검증 — 실제와 다를 수 있습니다)"}
                </div>
              )}
            </div>
          </div>

          {/* ─── 오늘의 혼잡도 카드 (단일 막대 + "시간대별 준비 중") ─── */}
          <div className="card" style={{ padding: "20px 22px", marginBottom: 20 }}>
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                justifyContent: "space-between",
                marginBottom: 14,
                gap: 8,
              }}
            >
              <h2
                style={{
                  margin: 0,
                  fontSize: 18,
                  fontWeight: 700,
                  color: "var(--ink)",
                }}
              >
                오늘의 혼잡도
              </h2>
              {/* 현재 상태 라벨 (활성 N명) */}
              <div style={{ fontSize: 12, color: "var(--ink-mute)" }}>
                현재{" "}
                <b style={{ fontFamily: "var(--ff-mono)", color: "var(--ink)" }}>
                  {activeCount}
                </b>
                명 ·{" "}
                <span style={{ color: barColor, fontWeight: 700 }}>{statusLabel}</span>
              </div>
            </div>

            {/* 시안 형태: 시간대별 12 막대 — DB 미지원이므로 회색 빈 슬롯 + 좌측 1번째에 현재 막대만 채움 */}
            {/* 이유: "시간대별 데이터 준비 중" 캡션과 함께 빈 슬롯을 보여주면 시안 형태 유지하면서도 가짜 데이터 회피 */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: `repeat(${TIME_SLOTS.length}, 1fr)`,
                gap: 4,
                alignItems: "end",
                height: 120,
              }}
            >
              {TIME_SLOTS.map((label, idx) => {
                // 첫 번째 슬롯에만 현재 활성 비율을 채운다 — 데이터 있는 영역과 없는 영역의 시각 분리
                const isCurrent = idx === 0;
                const heightPct = isCurrent ? Math.max(pct * 100, 4) : 0;
                return (
                  <div
                    key={label}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 4,
                      height: "100%",
                    }}
                  >
                    {/* 막대 컨테이너 (배경색으로 빈 슬롯 표현) */}
                    <div
                      style={{
                        width: "100%",
                        flex: 1,
                        position: "relative",
                        background: isCurrent
                          ? "transparent"
                          : "color-mix(in srgb, var(--ink-dim) 8%, transparent)",
                        borderRadius: 2,
                        display: "flex",
                        alignItems: "flex-end",
                      }}
                    >
                      {isCurrent && (
                        <div
                          style={{
                            width: "100%",
                            height: `${heightPct}%`,
                            background: barColor,
                            minHeight: 3,
                            borderRadius: 2,
                            transition: "height 0.3s ease",
                          }}
                        />
                      )}
                    </div>
                    <div
                      style={{
                        fontSize: 10,
                        fontFamily: "var(--ff-mono)",
                        color: isCurrent ? "var(--ink)" : "var(--ink-dim)",
                        fontWeight: isCurrent ? 700 : 400,
                      }}
                    >
                      {label}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 범례 */}
            <div
              style={{
                display: "flex",
                gap: 14,
                marginTop: 12,
                fontSize: 11,
                color: "var(--ink-mute)",
                flexWrap: "wrap",
              }}
            >
              <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                <span style={{ width: 10, height: 10, background: "var(--ok)", borderRadius: 2 }} />
                한산
              </div>
              <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                <span style={{ width: 10, height: 10, background: "var(--warn)", borderRadius: 2 }} />
                보통
              </div>
              <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                <span style={{ width: 10, height: 10, background: "var(--accent)", borderRadius: 2 }} />
                혼잡
              </div>
            </div>

            {/* "시간대별 준비 중" 캡션 — 가짜 데이터 회피 + 현 데이터 한계 명시 */}
            <div
              style={{
                marginTop: 10,
                fontSize: 11,
                color: "var(--ink-dim)",
                fontStyle: "italic",
              }}
            >
              ※ 시간대별 분포 데이터 준비 중 — 현재 막대는 실시간 활성 인원 기준입니다.
            </div>
          </div>
        </div>

        {/* ─── 우측: Side ─── */}
        <aside className="court-detail-v2-aside" style={{ position: "sticky", top: 120 }}>
          {/* Map 카드 */}
          <div
            className="card"
            style={{ padding: 0, overflow: "hidden", marginBottom: 14 }}
          >
            <div
              style={{
                height: 180,
                position: "relative",
                borderBottom: "1px solid var(--border)",
              }}
            >
              {hasCoord ? (
                <KakaoMap
                  markers={mapMarker}
                  center={{ lat, lng }}
                  level={4}
                  className="h-full w-full"
                  showCurrentLocation
                />
              ) : (
                // 좌표 없으면 시안 placeholder 그대로
                <div
                  style={{
                    height: "100%",
                    background:
                      "repeating-linear-gradient(45deg, var(--bg-alt) 0 10px, var(--bg-elev) 10px 20px)",
                    display: "grid",
                    placeItems: "center",
                    fontFamily: "var(--ff-mono)",
                    fontSize: 11,
                    color: "var(--ink-dim)",
                  }}
                >
                  좌표 정보 준비 중
                </div>
              )}
            </div>

            <div style={{ padding: "14px 18px", display: "flex", flexDirection: "column", gap: 6 }}>
              {/* 길찾기 (카카오 navi) */}
              <a
                href={kakaoNaviUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn--sm"
                aria-disabled={!hasCoord}
                style={{
                  width: "100%",
                  justifyContent: "center",
                  pointerEvents: hasCoord ? "auto" : "none",
                  opacity: hasCoord ? 1 : 0.5,
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                  directions
                </span>
                길찾기
              </a>
              {/* 지도에서 열기 (카카오 map) */}
              <a
                href={kakaoMapUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn--sm"
                aria-disabled={!hasCoord}
                style={{
                  width: "100%",
                  justifyContent: "center",
                  pointerEvents: hasCoord ? "auto" : "none",
                  opacity: hasCoord ? 1 : 0.5,
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                  map
                </span>
                지도에서 열기
              </a>
            </div>
          </div>

          {/* 시설 정보 카드 */}
          <div className="card" style={{ padding: "18px 20px", marginBottom: 14 }}>
            <div
              style={{
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: ".1em",
                color: "var(--ink-dim)",
                textTransform: "uppercase",
                marginBottom: 12,
              }}
            >
              시설 정보
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "80px 1fr",
                rowGap: 9,
                fontSize: 13,
                color: "var(--ink)",
              }}
            >
              {/* 유형 */}
              <div style={{ color: "var(--ink-dim)" }}>유형</div>
              <div>{tc}</div>

              {/* 이용료 */}
              <div style={{ color: "var(--ink-dim)" }}>이용료</div>
              <div>{fee}</div>

              {/* 운영시간 */}
              <div style={{ color: "var(--ink-dim)" }}>운영시간</div>
              <div>{hours}</div>

              {/* 바닥 */}
              <div style={{ color: "var(--ink-dim)" }}>바닥</div>
              <div style={{ color: surface ? "var(--ink)" : "var(--ink-dim)" }}>
                {surface ?? "정보 없음"}
              </div>

              {/* 조명 */}
              <div style={{ color: "var(--ink-dim)" }}>조명</div>
              <div
                style={{
                  color:
                    court.has_lighting === null ? "var(--ink-dim)" : "var(--ink)",
                }}
              >
                {court.has_lighting === true
                  ? court.lighting_until
                    ? `있음 (~${court.lighting_until})`
                    : "있음"
                  : court.has_lighting === false
                  ? "없음"
                  : "정보 없음"}
              </div>

              {/* 주차 */}
              <div style={{ color: "var(--ink-dim)" }}>주차</div>
              <div
                style={{
                  color:
                    court.has_parking === null ? "var(--ink-dim)" : "var(--ink)",
                }}
              >
                {court.has_parking === true
                  ? "가능"
                  : court.has_parking === false
                  ? "없음"
                  : "정보 없음"}
              </div>

              {/* 화장실 */}
              <div style={{ color: "var(--ink-dim)" }}>화장실</div>
              <div
                style={{
                  color:
                    court.has_restroom === null ? "var(--ink-dim)" : "var(--ink)",
                }}
              >
                {court.has_restroom === true
                  ? "있음"
                  : court.has_restroom === false
                  ? "없음"
                  : "정보 없음"}
              </div>

              {/* 샤워실 — DB 미지원 */}
              <div style={{ color: "var(--ink-dim)" }}>샤워실</div>
              <div style={{ color: "var(--ink-dim)" }}>정보 없음</div>

              {/* 락커 — DB 미지원 */}
              <div style={{ color: "var(--ink-dim)" }}>락커</div>
              <div style={{ color: "var(--ink-dim)" }}>정보 없음</div>

              {/* 연락처 — DB 미지원 */}
              <div style={{ color: "var(--ink-dim)" }}>연락처</div>
              <div style={{ color: "var(--ink-dim)", fontFamily: "var(--ff-mono)" }}>
                정보 없음
              </div>

              {/* 가까운 역 — 있을 때만 (보존) */}
              {court.nearest_station && (
                <>
                  <div style={{ color: "var(--ink-dim)" }}>가까운 역</div>
                  <div>{court.nearest_station}</div>
                </>
              )}
            </div>

            {/* 편의시설 (보존) */}
            {court.facilities.length > 0 && (
              <div style={{ marginTop: 14, paddingTop: 12, borderTop: "1px solid var(--border)" }}>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 800,
                    letterSpacing: ".1em",
                    color: "var(--ink-dim)",
                    textTransform: "uppercase",
                    marginBottom: 8,
                  }}
                >
                  편의시설
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {court.facilities.map((f, i) => (
                    <span key={i} className="badge badge--soft" style={{ fontSize: 11 }}>
                      {f}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* CTA: 코트 예약 (booking_mode 분기) — Phase A */}
          {/* 이유: court_infos.booking_mode 가 internal 이면 시스템 예약 페이지로,
                  external 이면 rental_url 외부 링크로, none 이면 비활성 상태로 노출 */}
          {court.booking_mode === "internal" ? (
            <Link
              href={`/courts/${court.id}/booking`}
              className="btn btn--primary btn--xl"
              style={{ width: "100%", justifyContent: "center", marginBottom: 8 }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                event_available
              </span>
              코트 예약하기
            </Link>
          ) : court.booking_mode === "external" && court.rental_url ? (
            <a
              href={court.rental_url}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn--primary btn--xl"
              style={{ width: "100%", justifyContent: "center", marginBottom: 8 }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                open_in_new
              </span>
              외부 대관 신청
            </a>
          ) : (
            <button
              type="button"
              className="btn btn--xl"
              disabled
              title="이 코트는 현재 대관을 받지 않습니다"
              style={{
                width: "100%",
                justifyContent: "center",
                marginBottom: 8,
                opacity: 0.55,
                cursor: "not-allowed",
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                event_busy
              </span>
              대관 미지원
            </button>
          )}

          {/* CTA: 모집 글쓰기 — DB 미지원 → alert */}
          <button
            type="button"
            className="btn btn--primary btn--xl"
            style={{ width: "100%", justifyContent: "center" }}
            onClick={() => alert("준비 중인 기능입니다")}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
              edit
            </span>
            이곳에서 모집 글쓰기
          </button>

          {/* 이용 현황 미니 (보존) — 시안 외지만 데이터 가치 우선 */}
          <div
            className="card"
            style={{
              padding: "14px 18px",
              marginTop: 14,
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              gap: 8,
              textAlign: "center",
            }}
          >
            <MiniStat
              label="평점"
              value={
                court.average_rating && court.average_rating > 0
                  ? court.average_rating.toFixed(1)
                  : "-"
              }
            />
            <MiniStat label="리뷰" value={`${court.reviews_count}`} />
            <MiniStat label="체크인" value={`${court.checkins_count}`} />
          </div>
        </aside>
      </div>

      {/* lg+ 에서 2열 (시안 minmax(0,1fr) 340px) */}
      <style jsx>{`
        @media (min-width: 1024px) {
          :global(.court-detail-v2-grid) {
            grid-template-columns: minmax(0, 1fr) 340px !important;
          }
        }
        @media (max-width: 1023px) {
          :global(.court-detail-v2-aside) {
            position: static !important;
          }
        }
      `}</style>
    </div>
  );
}

// 이용 현황 미니 통계 셀
function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ fontSize: 11, color: "var(--ink-dim)", marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 16, fontWeight: 700, color: "var(--ink)", fontFamily: "var(--ff-mono)" }}>
        {value}
      </div>
    </div>
  );
}
