"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";

/**
 * /referee/admin/pools — 대회별 일자별 풀 대시보드
 *
 * 이유: 공고(announcement)는 여러 개로 나뉠 수 있고, 하나의 대회에 심판·경기원 공고가
 *       따로 있을 수 있다. 관리자는 "이 대회의 하루하루 운영 상태"를 한눈에 볼 필요가 있다.
 *       이 페이지는 여러 공고를 가로지르는 일자별 풀 요약을 보여준다.
 *
 * 흐름:
 *   1) 대회 선택 (드롭다운/검색)
 *   2) 대회 선택 시 /api/web/referee-admin/pools?tournament_id=xxx 전체 조회
 *   3) 클라에서 date + role_type별 그룹화 → 카드로 표시
 *   4) 각 카드 클릭 시 첫 연관 공고 상세로 이동
 *
 * API: 기존 announcements/tournaments/pools GET만 사용 (신규 API 없음)
 */

// ── 타입 ──
type Tournament = {
  id: string;
  name: string;
  status: string | null;
  start_date: string | null;
  end_date: string | null;
};

type PoolItem = {
  id: string | number;
  tournament_id: string;
  date: string; // ISO
  referee_id: string | number;
  role_type: "referee" | "game_official";
  is_chief: boolean;
  referee_name: string;
  referee_level: string | null;
  referee_cert_grade: string | null;
};

type AnnouncementLite = {
  id: string | number;
  tournament_id: string;
  title: string;
  role_type: "referee" | "game_official";
  dates: string[];
  required_count: Record<string, number>;
};

const ROLE_LABELS: Record<string, string> = {
  referee: "심판",
  game_official: "경기원",
};

function toYmd(iso: string): string {
  return new Date(iso).toISOString().slice(0, 10);
}

// 카드 그룹 키 = "YYYY-MM-DD|role_type"
function groupKey(ymd: string, role: string) {
  return `${ymd}|${role}`;
}

export default function AdminPoolsPage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [tSearch, setTSearch] = useState("");
  const [selected, setSelected] = useState<Tournament | null>(null);

  const [pools, setPools] = useState<PoolItem[]>([]);
  const [announcements, setAnnouncements] = useState<AnnouncementLite[]>([]);
  const [loading, setLoading] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);

  // ── 대회 검색 ──
  const searchTournaments = useCallback(async (q: string) => {
    const url = new URL(
      "/api/web/referee-admin/tournaments",
      window.location.origin
    );
    if (q) url.searchParams.set("q", q);
    url.searchParams.set("limit", "20");
    try {
      const res = await fetch(url.toString(), { cache: "no-store" });
      const data = await res.json();
      if (res.ok) setTournaments(data.items ?? []);
    } catch {
      // 무시
    }
  }, []);

  useEffect(() => {
    // 초기 진입 시 기본 대회 목록
    searchTournaments("");
  }, [searchTournaments]);

  // ── 대회 선택 시 풀 + 관련 공고 동시 로드 ──
  const loadForTournament = useCallback(async (t: Tournament) => {
    setLoading(true);
    setPageError(null);
    try {
      const poolsUrl = new URL(
        "/api/web/referee-admin/pools",
        window.location.origin
      );
      poolsUrl.searchParams.set("tournament_id", t.id);

      const annUrl = new URL(
        "/api/web/referee-admin/announcements",
        window.location.origin
      );
      annUrl.searchParams.set("tournament_id", t.id);
      annUrl.searchParams.set("limit", "100");

      const [poolsRes, annRes] = await Promise.all([
        fetch(poolsUrl.toString(), { cache: "no-store" }),
        fetch(annUrl.toString(), { cache: "no-store" }),
      ]);
      const poolsData = await poolsRes.json();
      const annData = await annRes.json();

      if (!poolsRes.ok) {
        setPageError(
          typeof poolsData?.error === "string"
            ? poolsData.error
            : "풀을 불러오지 못했습니다."
        );
        return;
      }
      setPools((poolsData.items ?? []) as PoolItem[]);
      setAnnouncements(
        (annRes.ok ? annData.items ?? [] : []) as AnnouncementLite[]
      );
    } catch {
      setPageError("네트워크 오류");
    } finally {
      setLoading(false);
    }
  }, []);

  const onSelectTournament = useCallback(
    (t: Tournament) => {
      setSelected(t);
      loadForTournament(t);
    },
    [loadForTournament]
  );

  // ── 일자 + role_type별 그룹 ──
  const groups = useMemo(() => {
    // Map<key, {date, role, items[], chiefId|null, needCount}>
    const map = new Map<
      string,
      {
        date: string;
        role: "referee" | "game_official";
        items: PoolItem[];
        chief: PoolItem | null;
      }
    >();
    for (const p of pools) {
      const ymd = toYmd(p.date);
      const k = groupKey(ymd, p.role_type);
      const g = map.get(k) ?? {
        date: ymd,
        role: p.role_type,
        items: [],
        chief: null,
      };
      g.items.push(p);
      if (p.is_chief) g.chief = p;
      map.set(k, g);
    }
    // 정렬: 날짜 asc → 역할 asc
    return [...map.values()].sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      return a.role.localeCompare(b.role);
    });
  }, [pools]);

  // date+role별 "필요 인원" 합계 (해당 대회의 공고들을 전부 합산)
  const needFor = useCallback(
    (ymd: string, role: "referee" | "game_official") => {
      let total = 0;
      for (const a of announcements) {
        if (a.role_type !== role) continue;
        total += a.required_count?.[ymd] ?? 0;
      }
      return total;
    },
    [announcements]
  );

  // date+role별 대표 공고 id (상세로 이동할 대상)
  const announcementFor = useCallback(
    (ymd: string, role: "referee" | "game_official") => {
      // 해당 일자를 dates에 포함하고 role이 일치하는 첫 공고
      return (
        announcements.find(
          (a) => a.role_type === role && a.dates.some((d) => toYmd(d) === ymd)
        ) ?? null
      );
    },
    [announcements]
  );

  // ── 상단 요약 ──
  const summary = useMemo(() => {
    const uniqueDates = new Set(groups.map((g) => g.date));
    const withChief = groups.filter((g) => g.chief).length;
    return {
      dateCount: uniqueDates.size,
      groupCount: groups.length,
      chiefCount: withChief,
      totalSelected: pools.length,
    };
  }, [groups, pools.length]);

  // ── 렌더 ──
  return (
    <div className="space-y-4">
      <div>
        <h1
          className="text-xl font-black tracking-tight"
          style={{ color: "var(--color-text-primary)" }}
        >
          일자별 운영
        </h1>
        <p
          className="mt-1 text-sm"
          style={{ color: "var(--color-text-muted)" }}
        >
          대회를 선택하면 일자별 선정 인원과 책임자 지정 현황을 확인할 수 있습니다.
        </p>
      </div>

      {/* 대회 선택 */}
      <div
        className="p-4"
        style={{
          backgroundColor: "var(--color-surface)",
          border: "1px solid var(--color-border)",
          borderRadius: 4,
        }}
      >
        <label
          className="block text-xs font-bold uppercase tracking-wider mb-2"
          style={{ color: "var(--color-text-muted)" }}
        >
          대회 검색
        </label>
        <div className="flex gap-2 mb-3">
          <input
            value={tSearch}
            onChange={(e) => setTSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                searchTournaments(tSearch);
              }
            }}
            placeholder="대회명 검색 (Enter)"
            className="flex-1 px-3 py-2 text-sm"
            style={{
              backgroundColor: "var(--color-background)",
              border: "1px solid var(--color-border)",
              color: "var(--color-text-primary)",
              borderRadius: 4,
            }}
          />
          <button
            type="button"
            onClick={() => searchTournaments(tSearch)}
            className="px-3 py-2 text-xs font-bold"
            style={{
              backgroundColor: "var(--color-primary)",
              color: "#ffffff",
              borderRadius: 4,
            }}
          >
            검색
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {tournaments.length === 0 ? (
            <div
              className="text-xs"
              style={{ color: "var(--color-text-muted)" }}
            >
              검색 결과 없음
            </div>
          ) : (
            tournaments.map((t) => {
              const active = selected?.id === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => onSelectTournament(t)}
                  className="px-3 py-1.5 text-xs font-semibold"
                  style={{
                    backgroundColor: active
                      ? "var(--color-primary)"
                      : "var(--color-background)",
                    color: active ? "#ffffff" : "var(--color-text-secondary)",
                    border: "1px solid var(--color-border)",
                    borderRadius: 4,
                  }}
                >
                  {t.name}
                </button>
              );
            })
          )}
        </div>
      </div>

      {pageError && (
        <div
          className="p-3 text-sm"
          style={{
            color: "var(--color-primary)",
            backgroundColor: "var(--color-surface)",
            borderRadius: 4,
          }}
        >
          {pageError}
        </div>
      )}

      {!selected ? (
        <div
          className="py-12 text-center text-sm"
          style={{
            color: "var(--color-text-muted)",
            backgroundColor: "var(--color-surface)",
            borderRadius: 4,
          }}
        >
          대회를 선택해 주세요.
        </div>
      ) : loading ? (
        <div
          className="py-12 text-center text-sm"
          style={{ color: "var(--color-text-muted)" }}
        >
          불러오는 중...
        </div>
      ) : (
        <>
          {/* 상단 요약 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "일자 수", value: summary.dateCount },
              { label: "일자·역할 그룹", value: summary.groupCount },
              { label: "책임자 지정", value: summary.chiefCount },
              { label: "총 선정 인원", value: summary.totalSelected },
            ].map((s) => (
              <div
                key={s.label}
                className="p-4"
                style={{
                  backgroundColor: "var(--color-surface)",
                  border: "1px solid var(--color-border)",
                  borderRadius: 4,
                }}
              >
                <div
                  className="text-[11px] font-bold uppercase tracking-wider"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  {s.label}
                </div>
                <div
                  className="mt-1 text-xl font-black"
                  style={{ color: "var(--color-text-primary)" }}
                >
                  {s.value}
                </div>
              </div>
            ))}
          </div>

          {/* 그룹 카드 */}
          {groups.length === 0 ? (
            <div
              className="py-12 text-center text-sm"
              style={{
                color: "var(--color-text-muted)",
                backgroundColor: "var(--color-surface)",
                borderRadius: 4,
              }}
            >
              선정된 인원이 없습니다. 공고 상세에서 신청자를 선정해 주세요.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {groups.map((g) => {
                const need = needFor(g.date, g.role);
                const ann = announcementFor(g.date, g.role);
                return (
                  <div
                    key={`${g.date}|${g.role}`}
                    className="p-4"
                    style={{
                      backgroundColor: "var(--color-surface)",
                      border: "1px solid var(--color-border)",
                      borderRadius: 4,
                    }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <div
                          className="text-sm font-black"
                          style={{ color: "var(--color-text-primary)" }}
                        >
                          {g.date}
                        </div>
                        <div
                          className="text-[11px] font-semibold"
                          style={{ color: "var(--color-text-muted)" }}
                        >
                          {ROLE_LABELS[g.role] ?? g.role}
                        </div>
                      </div>
                      <div
                        className="text-right text-xs"
                        style={{ color: "var(--color-text-muted)" }}
                      >
                        <div>
                          <span
                            className="text-base font-black"
                            style={{ color: "var(--color-text-primary)" }}
                          >
                            {g.items.length}
                          </span>
                          <span className="mx-1">/</span>
                          <span>{need}</span>
                        </div>
                        <div>선정</div>
                      </div>
                    </div>

                    {/* 책임자 표시 */}
                    <div
                      className="text-xs mb-2 flex items-center gap-1"
                      style={{ color: "var(--color-text-muted)" }}
                    >
                      <span
                        className="material-symbols-outlined text-base"
                        style={
                          g.chief
                            ? {
                                color: "var(--color-primary)",
                                fontVariationSettings: "'FILL' 1",
                              }
                            : undefined
                        }
                      >
                        {g.chief ? "star" : "star_border"}
                      </span>
                      {g.chief ? (
                        <span
                          style={{ color: "var(--color-text-primary)" }}
                        >
                          책임자: {g.chief.referee_name}
                        </span>
                      ) : (
                        <span>책임자 미지정</span>
                      )}
                    </div>

                    {/* 선정 인원 이름 나열 (최대 5명) */}
                    <ul className="text-xs space-y-0.5">
                      {g.items.slice(0, 5).map((p) => (
                        <li
                          key={String(p.id)}
                          style={{ color: "var(--color-text-secondary)" }}
                        >
                          • {p.referee_name}
                          {p.is_chief && (
                            <span
                              className="ml-1"
                              style={{ color: "var(--color-primary)" }}
                            >
                              (책임)
                            </span>
                          )}
                        </li>
                      ))}
                      {g.items.length > 5 && (
                        <li
                          style={{ color: "var(--color-text-muted)" }}
                        >
                          … 외 {g.items.length - 5}명
                        </li>
                      )}
                    </ul>

                    {/* 상세로 이동 */}
                    {ann && (
                      <Link
                        href={`/referee/admin/announcements/${ann.id}`}
                        className="mt-3 inline-flex items-center gap-1 text-xs font-bold"
                        style={{
                          color: "var(--color-primary)",
                        }}
                      >
                        공고 상세
                        <span className="material-symbols-outlined text-sm">
                          chevron_right
                        </span>
                      </Link>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
