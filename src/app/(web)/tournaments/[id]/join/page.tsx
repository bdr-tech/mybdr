"use client";

/**
 * TournamentJoin (Phase 7-1) — v2 시안 박제
 *
 * 시안: Dev/design/BDR v2/screens/TournamentEnroll.jsx
 * 원칙:
 *  - API/Prisma 0 변경 (GET/POST /api/web/tournaments/[id]/join 그대로)
 *  - 보존 9건: 팀선택 / 대표자 / 디비전 / 유니폼 / 선수 / 카테고리 / 입금계좌 / 완료화면 / 대기번호
 *  - 5-step (hasCategories=true) / 4-step (false) adaptive
 *  - 서류 step: "준비 중" 박제 (display only)
 *  - 결제 step: 기존 입금 안내 흐름 유지 (토스 미연결)
 *  - 우측 sticky aside: 포스터 + D-카운터 + 환불 정책
 *
 * 시안 스타일 톤: eyebrow + 32px 거대 헤더 / .card .btn .badge 글로벌 클래스 사용 /
 *               accent 변수 / ff-display + ff-mono 타이포 / 28px/220px 워터마크 폰트
 */

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";

import { EnrollStepper, type StepDef } from "./_v2/enroll-stepper";
import { EnrollAside } from "./_v2/enroll-aside";
import { EnrollPoster } from "./_v2/enroll-poster";
import { EnrollStepDocs } from "./_v2/enroll-step-docs";

/* ------------------------------------------------------------------ */
/*  Types — 기존과 동일                                                  */
/* ------------------------------------------------------------------ */

interface TeamMember {
  id: number;
  user_id: number;
  jersey_number: number | null;
  position: string | null;
  role: string;
  user: {
    id: number;
    name: string | null;
    nickname: string | null;
    position: string | null;
    height: number | null;
    birth_date: string | null;
  };
}

interface MyTeam {
  id: number;
  name: string;
  primary_color: string | null;
  secondary_color: string | null;
  team_members: TeamMember[];
}

interface DivisionCount {
  division: string | null;
  _count: { id: number };
}

interface TournamentInfo {
  id: string;
  name: string;
  status: string;
  categories: Record<string, string[]> | null;
  div_caps: Record<string, number> | null;
  div_fees: Record<string, number> | null;
  allow_waiting_list: boolean | null;
  entry_fee: number | null;
  bank_name: string | null;
  bank_account: string | null;
  bank_holder: string | null;
  fee_notes: string | null;
  roster_min: number | null;
  roster_max: number | null;
  // v2 헤더 보조 정보 (기존 라우트 응답에 없을 수 있음 → 옵셔널)
  registration_end_at?: string | null;
  edition_label?: string | null;
}

interface JoinData {
  tournament: TournamentInfo;
  is_registration_open: boolean;
  my_teams: MyTeam[];
  existing_entries: { team_id: number; status: string }[];
  division_counts: DivisionCount[];
  user_info: { name: string | null; phone: string | null };
}

interface PlayerEntry {
  userId: number;
  name: string;
  jerseyNumber: number | null;
  position: string | null;
  birthDate: string;
  isElite: boolean;
  selected: boolean;
}

/* ------------------------------------------------------------------ */
/*  유틸                                                                */
/* ------------------------------------------------------------------ */

function formatWon(n: number | null | undefined): string {
  if (!n) return "무료";
  return `₩${Number(n).toLocaleString()}`;
}

// 디비전별 컬러 시안 (시안 OPEN/AMATEUR/ROOKIE 톤) — DB에 없으므로 인덱스 매핑
const DIV_COLORS = ["#0F5FCC", "#10B981", "#F59E0B", "#8B5CF6", "#EF4444"];

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */

export default function TournamentJoinPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  // step 은 1-based — 시안과 동일. 5-step / 4-step adaptive
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<JoinData | null>(null);

  // Step 1: 팀 선택 + 대표자
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);
  const [managerName, setManagerName] = useState("");
  const [managerPhone, setManagerPhone] = useState("");

  // Step 2: 부문/디비전
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedDivision, setSelectedDivision] = useState("");

  // Step 3: 유니폼/선수
  const [uniformHome, setUniformHome] = useState("#E31B23");
  const [uniformAway, setUniformAway] = useState("#FFFFFF");
  const [players, setPlayers] = useState<PlayerEntry[]>([]);

  // Step 5+: 결제 동의 (시안 박제 — 약관 2종)
  const [agreeRules, setAgreeRules] = useState(true);
  const [agreeMedia, setAgreeMedia] = useState(true);

  // 완료(별도 화면) 상태 — step="done" 으로 전환
  const [done, setDone] = useState(false);
  const [result, setResult] = useState<{
    id: number;
    status: string;
    waiting_number: number | null;
    message: string;
  } | null>(null);

  // 데이터 로드 — 기존과 동일
  useEffect(() => {
    fetch(`/api/web/tournaments/${id}/join`)
      .then((r) => r.json())
      .then((json) => {
        if (json.error) {
          setError(json.error);
        } else {
          setData(json);
          if (json.user_info) {
            setManagerName(json.user_info.name ?? "");
            setManagerPhone(json.user_info.phone ?? "");
          }
        }
        setLoading(false);
      })
      .catch(() => {
        setError("데이터를 불러오는 데 실패했습니다.");
        setLoading(false);
      });
  }, [id]);

  // 팀 선택 시 멤버 로드 — 기존 로직 그대로
  const handleTeamSelect = useCallback(
    (teamId: number) => {
      setSelectedTeamId(teamId);
      const team = data?.my_teams.find((t) => t.id === teamId);
      if (team) {
        setUniformHome(team.primary_color ?? "#E31B23");
        setUniformAway(team.secondary_color ?? "#FFFFFF");
        setPlayers(
          team.team_members.map((m) => ({
            userId: m.user_id,
            name: m.user.name ?? m.user.nickname ?? `선수 ${m.user_id}`,
            jerseyNumber: m.jersey_number,
            position: m.position ?? m.user.position ?? null,
            birthDate: m.user.birth_date
              ? new Date(m.user.birth_date).toISOString().slice(2, 10).replace(/-/g, "")
              : "",
            isElite: false,
            selected: true,
          })),
        );
      }
    },
    [data],
  );

  // 디비전 잔여석 계산 — 기존과 동일
  const getDivisionRemaining = useCallback(
    (division: string) => {
      if (!data) return null;
      const caps = data.tournament.div_caps;
      if (!caps || !caps[division]) return null;
      const cap = caps[division];
      const count =
        data.division_counts.find((d) => d.division === division)?._count.id ?? 0;
      return { cap, count, remaining: cap - count };
    },
    [data],
  );

  // 제출 — 기존과 동일 (POST 그대로)
  const handleSubmit = async () => {
    if (!selectedTeamId || !data) return;

    const selectedPlayers = players.filter((p) => p.selected);
    const rosterMin = data.tournament.roster_min ?? 5;
    if (selectedPlayers.length < rosterMin) {
      setError(`최소 ${rosterMin}명의 선수를 선택해야 합니다.`);
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/web/tournaments/${id}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teamId: selectedTeamId,
          category: selectedCategory || undefined,
          division: selectedDivision || undefined,
          uniformHome,
          uniformAway,
          managerName,
          managerPhone,
          players: selectedPlayers.map((p) => ({
            userId: p.userId,
            jerseyNumber: p.jerseyNumber,
            position: p.position,
            playerName: p.name,
            birthDate: p.birthDate,
            isElite: p.isElite,
          })),
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        setError(json.error ?? "참가신청에 실패했습니다.");
      } else {
        setResult(json);
        setDone(true);
      }
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  /* ---------------------------------------------------------------- */
  /*  Loading / Error 가드                                              */
  /* ---------------------------------------------------------------- */

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          minHeight: "50vh",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          className="h-8 w-8 animate-spin rounded-full border-4 border-t-transparent"
          style={{ borderColor: "var(--accent)", borderTopColor: "transparent" }}
        />
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="page" style={{ maxWidth: 560, margin: "40px auto" }}>
        <div className="card" style={{ padding: 28, textAlign: "center" }}>
          <p style={{ color: "var(--err)", fontWeight: 600 }}>{error}</p>
          <button
            type="button"
            className="btn"
            style={{ marginTop: 16 }}
            onClick={() => router.back()}
          >
            돌아가기
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { tournament } = data;
  const categories = (tournament.categories ?? {}) as Record<string, string[]>;
  const hasCategories = Object.keys(categories).length > 0;

  /* ---------------------------------------------------------------- */
  /*  Step 정의 (5-step / 4-step adaptive)                              */
  /* ---------------------------------------------------------------- */
  // hasCategories=true: 1.대회확인 / 2.디비전 / 3.로스터 / 4.서류 / 5.결제
  // hasCategories=false: 1.대회확인 / 2.로스터 / 3.서류 / 4.결제
  const steps: StepDef[] = hasCategories
    ? [
        { n: 1, l: "대회 확인" },
        { n: 2, l: "디비전" },
        { n: 3, l: "로스터" },
        { n: 4, l: "서류" },
        { n: 5, l: "결제" },
      ]
    : [
        { n: 1, l: "대회 확인" },
        { n: 2, l: "로스터" },
        { n: 3, l: "서류" },
        { n: 4, l: "결제" },
      ];

  const lastStep = steps[steps.length - 1].n;
  // 단계 → 화면 분기를 위한 매핑 (4-step 모드 보정)
  const stage: "info" | "division" | "roster" | "docs" | "pay" = (() => {
    if (hasCategories) {
      if (step === 1) return "info";
      if (step === 2) return "division";
      if (step === 3) return "roster";
      if (step === 4) return "docs";
      return "pay";
    }
    if (step === 1) return "info";
    if (step === 2) return "roster";
    if (step === 3) return "docs";
    return "pay";
  })();

  /* ---------------------------------------------------------------- */
  /*  공통 파생값                                                        */
  /* ---------------------------------------------------------------- */

  const selectedTeam = data.my_teams.find((t) => t.id === selectedTeamId) ?? null;
  const selectedRosterCount = players.filter((p) => p.selected).length;

  // 시안 디비전 인덱스 컬러 매핑
  const divisionList: Array<{ key: string; label: string; color: string; fee: number | null; cap: number | null; count: number; isFull: boolean; }> =
    selectedCategory && categories[selectedCategory]
      ? categories[selectedCategory].map((divKey, idx) => {
          const info = getDivisionRemaining(divKey);
          const divFees = (tournament.div_fees ?? {}) as Record<string, number>;
          const fee = divFees[divKey] ?? tournament.entry_fee ?? null;
          return {
            key: divKey,
            label: divKey,
            color: DIV_COLORS[idx % DIV_COLORS.length],
            fee,
            cap: info?.cap ?? null,
            count: info?.count ?? 0,
            isFull: info ? info.remaining <= 0 : false,
          };
        })
      : [];

  const selDivMeta = divisionList.find((d) => d.key === selectedDivision) ?? null;
  const feeForSelected = (() => {
    if (!selectedDivision) return tournament.entry_fee;
    const divFees = (tournament.div_fees ?? {}) as Record<string, number>;
    return divFees[selectedDivision] ?? tournament.entry_fee;
  })();

  // 마감일
  const registrationEndAt = tournament.registration_end_at
    ? new Date(tournament.registration_end_at)
    : null;

  /* ---------------------------------------------------------------- */
  /*  완료 화면 (별도)                                                   */
  /* ---------------------------------------------------------------- */
  if (done && result) {
    return (
      <div className="page" style={{ maxWidth: 720, margin: "40px auto" }}>
        <div className="card" style={{ padding: "40px 32px", textAlign: "center" }}>
          {/* 성공 체크 */}
          <div
            style={{
              width: 64,
              height: 64,
              margin: "0 auto 18px",
              borderRadius: "50%",
              background: "color-mix(in oklab, var(--ok) 18%, transparent)",
              display: "grid",
              placeItems: "center",
            }}
          >
            <span
              style={{
                color: "var(--ok)",
                fontSize: 32,
                fontFamily: "var(--ff-display)",
                fontWeight: 900,
              }}
            >
              ✓
            </span>
          </div>
          <h2
            style={{
              margin: 0,
              fontSize: 22,
              fontWeight: 800,
              letterSpacing: "-0.01em",
            }}
          >
            {result.message}
          </h2>
          <p style={{ marginTop: 8, fontSize: 13, color: "var(--ink-mute)" }}>
            {result.status === "waiting"
              ? `대기 순번: ${result.waiting_number}번`
              : result.status === "approved"
                ? "참가가 확정되었습니다."
                : "주최자 승인 후 참가가 확정됩니다."}
          </p>

          {/* 입금 안내 — 기존 흐름 유지 */}
          {tournament.bank_name && (
            <div
              style={{
                margin: "20px auto 0",
                maxWidth: 360,
                padding: "16px 18px",
                background: "var(--bg-alt)",
                borderRadius: 6,
                textAlign: "left",
              }}
            >
              <p
                style={{
                  margin: 0,
                  fontSize: 11,
                  fontWeight: 800,
                  letterSpacing: ".1em",
                  color: "var(--ink-dim)",
                }}
              >
                참가비 입금 안내
              </p>
              <p
                style={{
                  margin: "6px 0 2px",
                  fontSize: 14,
                  fontWeight: 700,
                  fontFamily: "var(--ff-mono)",
                }}
              >
                {tournament.bank_name} {tournament.bank_account}
              </p>
              <p style={{ margin: 0, fontSize: 12, color: "var(--ink-mute)" }}>
                예금주 {tournament.bank_holder}
              </p>
            </div>
          )}

          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: 10,
              marginTop: 24,
            }}
          >
            <button
              type="button"
              className="btn"
              onClick={() => router.push(`/tournaments/${id}`)}
            >
              대회 페이지로
            </button>
            <button
              type="button"
              className="btn btn--primary"
              onClick={() => router.push("/profile")}
            >
              내 신청 확인
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ---------------------------------------------------------------- */
  /*  Render                                                           */
  /* ---------------------------------------------------------------- */
  return (
    <div className="page" style={{ maxWidth: 1200, margin: "0 auto", padding: "24px 16px 80px" }}>
      {/* breadcrumb — 시안 L51~55 */}
      <div
        style={{
          display: "flex",
          gap: 6,
          fontSize: 12,
          color: "var(--ink-mute)",
          marginBottom: 12,
        }}
      >
        <a
          onClick={() => router.push("/")}
          style={{ cursor: "pointer" }}
        >
          홈
        </a>
        <span>›</span>
        <a
          onClick={() => router.push("/tournaments")}
          style={{ cursor: "pointer" }}
        >
          대회
        </a>
        <span>›</span>
        <a
          onClick={() => router.push(`/tournaments/${id}`)}
          style={{ cursor: "pointer" }}
        >
          {tournament.name}
        </a>
        <span>›</span>
        <span style={{ color: "var(--ink)" }}>접수</span>
      </div>

      {/* 헤더 — eyebrow + 32px h1 + 마감 안내 */}
      <div style={{ marginBottom: 24 }}>
        <div className="eyebrow">TOURNAMENT ENROLLMENT · 대회 접수</div>
        <h1
          style={{
            margin: "6px 0 0",
            fontSize: 32,
            fontWeight: 800,
            letterSpacing: "-0.02em",
          }}
        >
          {tournament.name}
        </h1>
        {registrationEndAt && (
          <p
            style={{
              margin: "4px 0 0",
              color: "var(--ink-mute)",
              fontSize: 13,
            }}
          >
            접수마감{" "}
            <b style={{ color: "var(--err)" }}>
              {(() => {
                const diff = Math.ceil(
                  (registrationEndAt.getTime() - Date.now()) /
                    (1000 * 60 * 60 * 24),
                );
                const m = String(registrationEndAt.getMonth() + 1).padStart(2, "0");
                const d = String(registrationEndAt.getDate()).padStart(2, "0");
                const hh = String(registrationEndAt.getHours()).padStart(2, "0");
                const mm = String(registrationEndAt.getMinutes()).padStart(2, "0");
                return diff > 0
                  ? `D-${diff} (${m}/${d} ${hh}:${mm})`
                  : `마감 (${m}/${d} ${hh}:${mm})`;
              })()}
            </b>
          </p>
        )}
      </div>

      {/* 접수 불가 안내 */}
      {!data.is_registration_open && (
        <div
          className="card"
          style={{
            padding: "12px 16px",
            marginBottom: 16,
            background: "color-mix(in oklab, var(--err) 6%, transparent)",
            borderColor: "color-mix(in oklab, var(--err) 30%, var(--border))",
          }}
        >
          <p style={{ margin: 0, fontSize: 13, color: "var(--err)", fontWeight: 600 }}>
            현재 접수 기간이 아닙니다. (안내용 화면)
          </p>
        </div>
      )}

      {/* Stepper */}
      <EnrollStepper steps={steps} current={step} />

      {/* 에러 */}
      {error && (
        <div
          className="card"
          style={{
            padding: "12px 16px",
            marginBottom: 16,
            background: "color-mix(in oklab, var(--err) 6%, transparent)",
            borderColor: "color-mix(in oklab, var(--err) 30%, var(--border))",
          }}
        >
          <p style={{ margin: 0, fontSize: 13, color: "var(--err)" }}>{error}</p>
        </div>
      )}

      {/* 2단 레이아웃: main + 우측 sticky aside */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0,1fr) 320px",
          gap: 20,
          alignItems: "flex-start",
        }}
      >
        {/* ---------------------------- main card --------------------------- */}
        <div className="card" style={{ padding: "28px 32px" }}>
          {/* ============= STAGE: info (대회 정보 확인) ============= */}
          {stage === "info" && (
            <div>
              <h2 style={{ margin: "0 0 16px", fontSize: 18, fontWeight: 700 }}>
                대회 정보 확인
              </h2>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "200px 1fr",
                  gap: 20,
                  alignItems: "flex-start",
                  marginBottom: 20,
                }}
              >
                <EnrollPoster
                  title={tournament.name}
                  edition={tournament.edition_label ?? null}
                  height={240}
                  radius={6}
                />
                <div>
                  <h3
                    style={{
                      margin: "0 0 12px",
                      fontSize: 14,
                      fontWeight: 700,
                      color: "var(--ink-soft)",
                    }}
                  >
                    참가 팀 선택
                  </h3>
                  {data.my_teams.length === 0 ? (
                    <div
                      style={{
                        textAlign: "center",
                        fontSize: 13,
                        color: "var(--ink-mute)",
                        padding: "20px 0",
                      }}
                    >
                      <p style={{ margin: 0 }}>주장으로 등록된 팀이 없습니다.</p>
                      <button
                        type="button"
                        className="btn btn--sm"
                        style={{ marginTop: 10 }}
                        onClick={() => router.push("/teams")}
                      >
                        팀 만들기
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {data.my_teams.map((team) => {
                        const alreadyApplied = data.existing_entries.some(
                          (e) => e.team_id === team.id,
                        );
                        const isSelected = selectedTeamId === team.id;
                        return (
                          <button
                            key={team.id}
                            type="button"
                            disabled={alreadyApplied}
                            onClick={() => handleTeamSelect(team.id)}
                            style={{
                              textAlign: "left",
                              padding: "12px 14px",
                              background: isSelected
                                ? "color-mix(in oklab, var(--accent) 8%, var(--bg))"
                                : "transparent",
                              border: isSelected
                                ? "2px solid var(--accent)"
                                : "1px solid var(--border)",
                              borderRadius: 6,
                              cursor: alreadyApplied ? "not-allowed" : "pointer",
                              opacity: alreadyApplied ? 0.5 : 1,
                              display: "grid",
                              gridTemplateColumns: "32px 1fr",
                              gap: 12,
                              alignItems: "center",
                            }}
                          >
                            <div
                              style={{
                                width: 32,
                                height: 32,
                                borderRadius: "50%",
                                border: "2px solid #fff",
                                background: team.primary_color ?? "var(--cafe-blue, #1B3C87)",
                              }}
                            />
                            <div>
                              <div style={{ fontWeight: 700, fontSize: 13 }}>
                                {team.name}
                              </div>
                              <div
                                style={{
                                  fontSize: 11,
                                  color: "var(--ink-dim)",
                                  fontFamily: "var(--ff-mono)",
                                }}
                              >
                                {team.team_members.length}명
                                {alreadyApplied && " · 이미 신청됨"}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* 대표자 정보 — 선택 후 노출 */}
                  {selectedTeamId && (
                    <div style={{ marginTop: 16 }}>
                      <h3
                        style={{
                          margin: "0 0 8px",
                          fontSize: 13,
                          fontWeight: 700,
                          color: "var(--ink-soft)",
                        }}
                      >
                        대표자 정보
                      </h3>
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        <input
                          type="text"
                          placeholder="이름"
                          value={managerName}
                          onChange={(e) => setManagerName(e.target.value)}
                          style={{
                            width: "100%",
                            padding: "9px 12px",
                            fontSize: 13,
                            borderRadius: 4,
                            border: "1px solid var(--border)",
                            background: "var(--bg)",
                            color: "var(--ink)",
                          }}
                        />
                        <input
                          type="tel"
                          placeholder="연락처"
                          value={managerPhone}
                          onChange={(e) => setManagerPhone(e.target.value)}
                          style={{
                            width: "100%",
                            padding: "9px 12px",
                            fontSize: 13,
                            borderRadius: 4,
                            border: "1px solid var(--border)",
                            background: "var(--bg)",
                            color: "var(--ink)",
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* 참가 자격 안내 — 시안 좌측 콜아웃 박제 */}
              <div
                style={{
                  padding: "14px 16px",
                  background: "var(--bg-alt)",
                  borderRadius: 6,
                  fontSize: 13,
                  color: "var(--ink-soft)",
                  lineHeight: 1.7,
                  borderLeft: "3px solid var(--accent)",
                }}
              >
                <b>참가 자격 공통</b>
                <br />
                · 팀 등록 완료 · 로스터 최소 {tournament.roster_min ?? 5}명 이상
                <br />
                · 모든 팀원 만 16세 이상
                <br />
                · 다른 아마추어 대회와 일정 중복 없음
              </div>
            </div>
          )}

          {/* ============= STAGE: division (디비전 선택) ============= */}
          {stage === "division" && (
            <div>
              <h2 style={{ margin: "0 0 4px", fontSize: 18, fontWeight: 700 }}>
                디비전 선택
              </h2>
              <p
                style={{
                  margin: "0 0 20px",
                  fontSize: 13,
                  color: "var(--ink-mute)",
                }}
              >
                팀 실력과 구성원에 맞는 디비전을 선택해주세요. 등록 후 변경 불가.
              </p>

              {/* 부문 chip */}
              <div style={{ marginBottom: 16 }}>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: "var(--ink-dim)",
                    marginBottom: 8,
                    letterSpacing: ".08em",
                  }}
                >
                  부문
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {Object.keys(categories).map((cat) => {
                    const isOn = selectedCategory === cat;
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => {
                          setSelectedCategory(cat);
                          setSelectedDivision("");
                        }}
                        className={isOn ? "btn btn--primary btn--sm" : "btn btn--sm"}
                      >
                        {cat}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 디비전 카드 리스트 — 시안 L117~140 */}
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {divisionList.length === 0 && (
                  <div
                    style={{
                      padding: 16,
                      fontSize: 13,
                      color: "var(--ink-mute)",
                    }}
                  >
                    부문을 먼저 선택해주세요.
                  </div>
                )}
                {divisionList.map((d) => {
                  const isSel = selectedDivision === d.key;
                  const blocked = d.isFull && !tournament.allow_waiting_list;
                  return (
                    <button
                      key={d.key}
                      type="button"
                      disabled={blocked}
                      onClick={() => setSelectedDivision(d.key)}
                      style={{
                        textAlign: "left",
                        padding: "18px 20px",
                        background: isSel
                          ? "var(--bg-alt)"
                          : "transparent",
                        border: isSel
                          ? `2px solid ${d.color}`
                          : "1px solid var(--border)",
                        borderRadius: 6,
                        cursor: blocked ? "not-allowed" : "pointer",
                        opacity: blocked ? 0.55 : 1,
                        display: "grid",
                        gridTemplateColumns: "80px 1fr auto",
                        gap: 16,
                        alignItems: "center",
                      }}
                    >
                      {/* 80×80 컬러 타일 */}
                      <div
                        style={{
                          width: 80,
                          height: 80,
                          background: d.color,
                          color: "#fff",
                          display: "grid",
                          placeItems: "center",
                          fontFamily: "var(--ff-display)",
                          fontWeight: 900,
                          fontSize: 16,
                          letterSpacing: ".04em",
                          borderRadius: 6,
                          textAlign: "center",
                          lineHeight: 1.05,
                          padding: 4,
                          overflow: "hidden",
                          wordBreak: "keep-all",
                        }}
                      >
                        {d.label.slice(0, 4)}
                      </div>
                      <div>
                        <div
                          style={{
                            display: "flex",
                            gap: 8,
                            alignItems: "baseline",
                            marginBottom: 4,
                          }}
                        >
                          <div
                            style={{
                              fontFamily: "var(--ff-display)",
                              fontSize: 18,
                              fontWeight: 800,
                              letterSpacing: "-0.01em",
                            }}
                          >
                            {d.label}
                          </div>
                          {d.isFull && (
                            <span className="badge badge--ghost" style={{ fontSize: 10 }}>
                              {tournament.allow_waiting_list ? "대기접수" : "마감"}
                            </span>
                          )}
                        </div>
                        <div
                          style={{
                            fontSize: 11,
                            color: "var(--ink-dim)",
                            fontFamily: "var(--ff-mono)",
                          }}
                        >
                          {d.cap !== null ? `팀 접수 ${d.count}/${d.cap}` : "정원 미정"}
                        </div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div
                          style={{
                            fontFamily: "var(--ff-display)",
                            fontSize: 22,
                            fontWeight: 900,
                            color: d.color,
                          }}
                        >
                          {d.fee ? `₩${d.fee.toLocaleString()}` : "무료"}
                        </div>
                        <div style={{ fontSize: 11, color: "var(--ink-dim)" }}>
                          / 팀
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ============= STAGE: roster (로스터 + 유니폼) ============= */}
          {stage === "roster" && (
            <div>
              <h2 style={{ margin: "0 0 4px", fontSize: 18, fontWeight: 700 }}>
                로스터 등록
              </h2>
              <p
                style={{
                  margin: "0 0 16px",
                  fontSize: 13,
                  color: "var(--ink-mute)",
                }}
              >
                출전 선수를 선택해주세요. ({selectedRosterCount}명 선택
                {tournament.roster_min && ` · 최소 ${tournament.roster_min}명`}
                {tournament.roster_max && ` · 최대 ${tournament.roster_max}명`})
              </p>

              {/* 팀 요약 바 — 시안 L148~155 */}
              {selectedTeam && (
                <div
                  style={{
                    display: "flex",
                    gap: 10,
                    marginBottom: 14,
                    padding: "10px 14px",
                    background: "var(--bg-alt)",
                    borderRadius: 6,
                    alignItems: "center",
                  }}
                >
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 4,
                      background: selectedTeam.primary_color ?? "var(--cafe-blue, #1B3C87)",
                    }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 800 }}>{selectedTeam.name}</div>
                    <div
                      style={{
                        fontSize: 11,
                        color: "var(--ink-dim)",
                        fontFamily: "var(--ff-mono)",
                      }}
                    >
                      전체 {players.length}명 · 선택 {selectedRosterCount}명
                    </div>
                  </div>
                </div>
              )}

              {/* 유니폼 색상 — 기존 보존 */}
              <div
                style={{
                  display: "flex",
                  gap: 16,
                  marginBottom: 16,
                  padding: "10px 14px",
                  background: "var(--bg)",
                  border: "1px solid var(--border)",
                  borderRadius: 6,
                  alignItems: "center",
                }}
              >
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: "var(--ink-soft)",
                  }}
                >
                  유니폼
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 11, color: "var(--ink-dim)" }}>홈</span>
                  <input
                    type="color"
                    value={uniformHome}
                    onChange={(e) => setUniformHome(e.target.value)}
                    style={{
                      width: 36,
                      height: 28,
                      padding: 0,
                      border: "1px solid var(--border)",
                      borderRadius: 4,
                      cursor: "pointer",
                    }}
                  />
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 11, color: "var(--ink-dim)" }}>어웨이</span>
                  <input
                    type="color"
                    value={uniformAway}
                    onChange={(e) => setUniformAway(e.target.value)}
                    style={{
                      width: 36,
                      height: 28,
                      padding: 0,
                      border: "1px solid var(--border)",
                      borderRadius: 4,
                      cursor: "pointer",
                    }}
                  />
                </div>
              </div>

              {players.length === 0 ? (
                <p
                  style={{
                    textAlign: "center",
                    fontSize: 13,
                    color: "var(--ink-mute)",
                    padding: "20px 0",
                  }}
                >
                  팀 멤버가 없습니다. 먼저 팀을 선택하세요.
                </p>
              ) : (
                // 시안 2-column grid + 카드형 토글 + 등번호/포지션/선출 인풋 보존
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(2, 1fr)",
                    gap: 8,
                  }}
                >
                  {players.map((p, idx) => {
                    const sel = p.selected;
                    return (
                      <div
                        key={p.userId}
                        style={{
                          padding: "12px 14px",
                          background: sel
                            ? "color-mix(in oklab, var(--accent) 8%, var(--bg))"
                            : "transparent",
                          border: sel
                            ? "2px solid var(--accent)"
                            : "1px solid var(--border)",
                          borderRadius: 6,
                          display: "flex",
                          flexDirection: "column",
                          gap: 8,
                        }}
                      >
                        <label
                          style={{
                            display: "grid",
                            gridTemplateColumns: "20px 1fr",
                            gap: 10,
                            alignItems: "center",
                            cursor: "pointer",
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={sel}
                            onChange={() => {
                              setPlayers((prev) =>
                                prev.map((pp, i) =>
                                  i === idx ? { ...pp, selected: !pp.selected } : pp,
                                ),
                              );
                            }}
                            style={{ accentColor: "var(--accent)" }}
                          />
                          <div>
                            <div style={{ fontWeight: 700, fontSize: 13 }}>
                              {p.name}
                            </div>
                            <div
                              style={{
                                fontSize: 10,
                                color: "var(--ink-dim)",
                                fontFamily: "var(--ff-mono)",
                              }}
                            >
                              #{p.jerseyNumber ?? "—"} · {p.position ?? "—"}
                            </div>
                          </div>
                        </label>
                        {/* 인풋 — 기존 보존 */}
                        <div
                          style={{
                            display: "flex",
                            gap: 6,
                            alignItems: "center",
                            paddingLeft: 30,
                          }}
                        >
                          <input
                            type="number"
                            min={0}
                            max={99}
                            value={p.jerseyNumber ?? ""}
                            placeholder="등#"
                            onChange={(e) => {
                              const v = e.target.value
                                ? parseInt(e.target.value)
                                : null;
                              setPlayers((prev) =>
                                prev.map((pp, i) =>
                                  i === idx ? { ...pp, jerseyNumber: v } : pp,
                                ),
                              );
                            }}
                            style={{
                              width: 50,
                              padding: "4px 6px",
                              fontSize: 11,
                              border: "1px solid var(--border)",
                              borderRadius: 4,
                              background: "var(--bg)",
                              color: "var(--ink)",
                              textAlign: "center",
                            }}
                          />
                          <select
                            value={p.position ?? ""}
                            onChange={(e) => {
                              setPlayers((prev) =>
                                prev.map((pp, i) =>
                                  i === idx
                                    ? { ...pp, position: e.target.value || null }
                                    : pp,
                                ),
                              );
                            }}
                            style={{
                              padding: "4px 6px",
                              fontSize: 11,
                              border: "1px solid var(--border)",
                              borderRadius: 4,
                              background: "var(--bg)",
                              color: "var(--ink)",
                            }}
                          >
                            <option value="">포지션</option>
                            <option value="PG">PG</option>
                            <option value="SG">SG</option>
                            <option value="SF">SF</option>
                            <option value="PF">PF</option>
                            <option value="C">C</option>
                          </select>
                          <label
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 4,
                              fontSize: 10,
                              color: "var(--ink-mute)",
                              fontFamily: "var(--ff-mono)",
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={p.isElite}
                              onChange={() => {
                                setPlayers((prev) =>
                                  prev.map((pp, i) =>
                                    i === idx ? { ...pp, isElite: !pp.isElite } : pp,
                                  ),
                                );
                              }}
                              style={{ accentColor: "var(--accent)" }}
                            />
                            선출
                          </label>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* 최소 인원 경고 — 시안 L180 */}
              {tournament.roster_min &&
                selectedRosterCount < tournament.roster_min && (
                  <div
                    style={{
                      marginTop: 12,
                      padding: "10px 14px",
                      background: "color-mix(in oklab, var(--err) 8%, transparent)",
                      color: "var(--err)",
                      borderRadius: 4,
                      fontSize: 12,
                      fontWeight: 600,
                    }}
                  >
                    ⚠️ 최소 {tournament.roster_min}명을 선택해야 접수가 가능합니다.
                  </div>
                )}
            </div>
          )}

          {/* ============= STAGE: docs (서류 — "준비 중" 박제) ============= */}
          {stage === "docs" && <EnrollStepDocs />}

          {/* ============= STAGE: pay (결제 — 입금 안내 + 약관 + 제출) ============= */}
          {stage === "pay" && (
            <div>
              <h2 style={{ margin: "0 0 4px", fontSize: 18, fontWeight: 700 }}>
                결제 · 신청 확인
              </h2>
              <p
                style={{
                  margin: "0 0 20px",
                  fontSize: 13,
                  color: "var(--ink-mute)",
                }}
              >
                참가비 결제는 입금 후 운영팀이 확인합니다. (PG 결제는 추후 도입)
              </p>

              {/* 신청 요약 카드 — 시안 결제 영수증 박제 */}
              <div
                style={{
                  padding: "20px 22px",
                  background: "var(--bg-alt)",
                  borderRadius: 6,
                  marginBottom: 16,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                    fontSize: 13,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "var(--ink-mute)" }}>참가팀</span>
                    <span style={{ fontWeight: 700 }}>
                      {selectedTeam?.name ?? "—"}
                    </span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "var(--ink-mute)" }}>대표자</span>
                    <span style={{ fontWeight: 700 }}>
                      {managerName} ({managerPhone})
                    </span>
                  </div>
                  {selectedCategory && (
                    <div
                      style={{ display: "flex", justifyContent: "space-between" }}
                    >
                      <span style={{ color: "var(--ink-mute)" }}>부문 / 디비전</span>
                      <span style={{ fontWeight: 700 }}>
                        {selectedCategory} · {selectedDivision || "—"}
                      </span>
                    </div>
                  )}
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "var(--ink-mute)" }}>로스터</span>
                    <span
                      style={{
                        fontWeight: 700,
                        fontFamily: "var(--ff-mono)",
                      }}
                    >
                      {selectedRosterCount}명
                    </span>
                  </div>
                  <div
                    style={{
                      borderTop: "1px dashed var(--border)",
                      paddingTop: 10,
                      marginTop: 6,
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "baseline",
                    }}
                  >
                    <span style={{ fontWeight: 700 }}>총 참가비</span>
                    <span
                      style={{
                        fontFamily: "var(--ff-display)",
                        fontSize: 24,
                        fontWeight: 900,
                        color: "var(--accent)",
                      }}
                    >
                      {formatWon(feeForSelected ?? null)}
                    </span>
                  </div>
                </div>
              </div>

              {/* 입금 안내 — 기존 흐름 유지 */}
              {tournament.bank_name && (
                <div
                  style={{
                    padding: "14px 16px",
                    background: "var(--bg)",
                    border: "1px solid var(--border)",
                    borderRadius: 6,
                    marginBottom: 16,
                  }}
                >
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 800,
                      letterSpacing: ".1em",
                      color: "var(--ink-dim)",
                      marginBottom: 6,
                    }}
                  >
                    입금 계좌
                  </div>
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 700,
                      fontFamily: "var(--ff-mono)",
                    }}
                  >
                    {tournament.bank_name} {tournament.bank_account}
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: "var(--ink-mute)",
                      marginTop: 2,
                    }}
                  >
                    예금주 {tournament.bank_holder}
                  </div>
                  <button
                    type="button"
                    className="btn btn--sm"
                    style={{ marginTop: 10 }}
                    onClick={() => {
                      navigator.clipboard.writeText(
                        `${tournament.bank_name ?? ""} ${tournament.bank_account ?? ""}`,
                      );
                    }}
                  >
                    계좌번호 복사
                  </button>
                  {tournament.fee_notes && (
                    <p
                      style={{
                        marginTop: 10,
                        fontSize: 12,
                        color: "var(--ink-mute)",
                      }}
                    >
                      {tournament.fee_notes}
                    </p>
                  )}
                </div>
              )}

              {/* 약관 — 시안 박제 */}
              <label
                style={{
                  display: "flex",
                  gap: 8,
                  alignItems: "flex-start",
                  fontSize: 13,
                  marginBottom: 8,
                  cursor: "pointer",
                }}
              >
                <input
                  type="checkbox"
                  checked={agreeRules}
                  onChange={(e) => setAgreeRules(e.target.checked)}
                  style={{ marginTop: 3, accentColor: "var(--accent)" }}
                />
                <span>대회 규정·환불 정책에 동의합니다</span>
              </label>
              <label
                style={{
                  display: "flex",
                  gap: 8,
                  alignItems: "flex-start",
                  fontSize: 13,
                  cursor: "pointer",
                }}
              >
                <input
                  type="checkbox"
                  checked={agreeMedia}
                  onChange={(e) => setAgreeMedia(e.target.checked)}
                  style={{ marginTop: 3, accentColor: "var(--accent)" }}
                />
                <span>경기 촬영·중계·사진 공개에 동의합니다</span>
              </label>
            </div>
          )}

          {/* ---------- 하단 네비게이션 ---------- */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginTop: 28,
              paddingTop: 20,
              borderTop: "1px solid var(--border)",
            }}
          >
            <button
              type="button"
              className="btn"
              onClick={() => {
                if (step > 1) setStep(step - 1);
                else router.back();
              }}
            >
              {step > 1 ? "← 이전" : "취소"}
            </button>

            {step < lastStep && (
              <button
                type="button"
                className="btn btn--primary"
                disabled={(() => {
                  // stage별 다음 버튼 활성 조건
                  if (stage === "info") {
                    return (
                      !selectedTeamId ||
                      !managerName ||
                      !managerPhone ||
                      !data.is_registration_open
                    );
                  }
                  if (stage === "division") {
                    return !selectedCategory || !selectedDivision;
                  }
                  if (stage === "roster") {
                    return (
                      selectedRosterCount < (tournament.roster_min ?? 1)
                    );
                  }
                  // docs는 자유 통과 ("준비 중" 박제)
                  return false;
                })()}
                onClick={() => {
                  setError(null);
                  setStep(step + 1);
                }}
              >
                다음 →
              </button>
            )}
            {step === lastStep && (
              <button
                type="button"
                className="btn btn--primary btn--lg"
                disabled={
                  submitting ||
                  !data.is_registration_open ||
                  !agreeRules ||
                  !agreeMedia
                }
                onClick={handleSubmit}
              >
                {submitting
                  ? "제출 중…"
                  : `참가신청 · ${formatWon(feeForSelected ?? null)}`}
              </button>
            )}
          </div>
        </div>

        {/* ---------------------------- aside ----------------------------- */}
        <EnrollAside
          tournamentName={tournament.name}
          edition={tournament.edition_label ?? null}
          selectedDivisionLabel={selDivMeta?.label ?? null}
          selectedDivisionColor={selDivMeta?.color ?? null}
          teamName={selectedTeam?.name ?? null}
          rosterCount={selectedRosterCount}
          feeText={formatWon(feeForSelected ?? null)}
          registrationEndAt={registrationEndAt}
        />
      </div>
    </div>
  );
}
