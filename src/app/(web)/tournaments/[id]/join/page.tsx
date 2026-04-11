"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
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
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */

export default function TournamentJoinPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<JoinData | null>(null);

  // Step 1: 팀 선택
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

  // Step 4: 완료 상태
  const [result, setResult] = useState<{
    id: number;
    status: string;
    waiting_number: number | null;
    message: string;
  } | null>(null);

  // 데이터 로드
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

  // 팀 선택 시 멤버 로드
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
          }))
        );
      }
    },
    [data]
  );

  // 디비전 잔여석 계산
  const getDivisionRemaining = useCallback(
    (division: string) => {
      if (!data) return null;
      const caps = data.tournament.div_caps;
      if (!caps || !caps[division]) return null;
      const cap = caps[division];
      const count = data.division_counts.find((d) => d.division === division)?._count.id ?? 0;
      return { cap, count, remaining: cap - count };
    },
    [data]
  );

  // 제출
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
        setStep(5); // 완료 화면
      }
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  /* ---------------------------------------------------------------- */
  /*  Render                                                           */
  /* ---------------------------------------------------------------- */

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--color-accent)] border-t-transparent" />
      </div>
    );
  }

  if (error && !data) {
    return (
      <Card className="mx-auto max-w-lg text-center">
        <p className="text-[var(--color-error)]">{error}</p>
        <Button variant="ghost" className="mt-4" onClick={() => router.back()}>
          돌아가기
        </Button>
      </Card>
    );
  }

  if (!data) return null;

  const { tournament } = data;
  const categories = (tournament.categories ?? {}) as Record<string, string[]>;
  const hasCategories = Object.keys(categories).length > 0;

  // 스텝 인디케이터
  const steps = hasCategories
    ? ["팀 선택", "부문/디비전", "선수 등록", "확인"]
    : ["팀 선택", "선수 등록", "확인"];

  const totalSteps = steps.length;
  const displayStep = hasCategories ? step : (step === 1 ? 1 : step === 3 ? 2 : step === 4 ? 3 : step);

  return (
    <div className="mx-auto max-w-2xl">
      {/* 헤더 */}
      <div className="mb-6">
        <h1
          className="text-2xl font-extrabold uppercase tracking-wide"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          참가신청
        </h1>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">{tournament.name}</p>
      </div>

      {/* 접수 불가 */}
      {!data.is_registration_open && step < 5 && (
        <Card className="mb-4 border-[var(--color-error)]/30 bg-[var(--color-error)]/5">
          <p className="text-sm font-medium text-[var(--color-error)]">현재 접수 기간이 아닙니다.</p>
        </Card>
      )}

      {/* 스텝 인디케이터 */}
      {step < 5 && (
        <div className="mb-6 flex items-center gap-2">
          {steps.map((label, i) => {
            const stepNum = i + 1;
            const isActive = displayStep === stepNum;
            const isDone = displayStep > stepNum;
            return (
              <div key={label} className="flex items-center gap-2">
                {i > 0 && <div className={`h-0.5 w-6 ${isDone ? "bg-[var(--color-accent)]" : "bg-[var(--color-border)]"}`} />}
                <div
                  className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                    isActive
                      ? "bg-[var(--color-accent)] text-[var(--color-on-accent)]"
                      : isDone
                        ? "bg-[color-mix(in_srgb,var(--color-accent)_20%,transparent)] text-[var(--color-accent)]"
                        : "bg-[var(--color-border)] text-[var(--color-text-muted)]"
                  }`}
                >
                  {isDone ? "✓" : stepNum}
                </div>
                <span className={`hidden text-xs sm:inline ${isActive ? "font-bold text-[var(--color-text-primary)]" : "text-[var(--color-text-muted)]"}`}>
                  {label}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* 에러 */}
      {error && (
        <Card className="mb-4 border-[var(--color-error)]/30 bg-[var(--color-error)]/5">
          <p className="text-sm text-[var(--color-error)]">{error}</p>
        </Card>
      )}

      {/* Step 1: 팀 선택 */}
      {step === 1 && (
        <div className="space-y-4">
          <Card>
            <h2 className="mb-4 text-lg font-bold">참가 팀 선택</h2>
            {data.my_teams.length === 0 ? (
              <div className="text-center text-sm text-[var(--color-text-muted)]">
                <p>주장으로 등록된 팀이 없습니다.</p>
                <Button variant="ghost" className="mt-2" onClick={() => router.push("/teams")}>
                  팀 만들기
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {data.my_teams.map((team) => {
                  const alreadyApplied = data.existing_entries.some((e) => e.team_id === team.id);
                  return (
                    <button
                      key={team.id}
                      disabled={alreadyApplied}
                      onClick={() => handleTeamSelect(team.id)}
                      className={`w-full rounded-[12px] border-2 p-4 text-left transition-all ${
                        selectedTeamId === team.id
                          ? "border-[var(--color-accent)] bg-[var(--color-surface-bright)]"
                          : alreadyApplied
                            ? "border-[var(--color-border)] bg-[var(--color-surface)] opacity-50"
                            : "border-[var(--color-border)] hover:border-[color-mix(in_srgb,var(--color-accent)_50%,transparent)]"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="h-10 w-10 rounded-full border-2"
                          style={{
                            backgroundColor: team.primary_color ?? "#1B3C87",
                            borderColor: team.secondary_color ?? "#FFF",
                          }}
                        />
                        <div>
                          <p className="font-bold">{team.name}</p>
                          <p className="text-xs text-[var(--color-text-muted)]">
                            {team.team_members.length}명
                            {alreadyApplied && " · 이미 신청됨"}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </Card>

          {/* 대표자 정보 */}
          {selectedTeamId && (
            <Card>
              <h3 className="mb-3 text-sm font-bold text-[var(--color-text-muted)]">대표자 정보</h3>
              <div className="space-y-3">
                <div>
                  <label className="mb-1 block text-xs text-[var(--color-text-muted)]">이름</label>
                  <input
                    type="text"
                    value={managerName}
                    onChange={(e) => setManagerName(e.target.value)}
                    className="w-full rounded-[10px] border border-[var(--color-border)] px-3 py-2.5 text-sm focus:border-[var(--color-accent)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-[var(--color-text-muted)]">연락처</label>
                  <input
                    type="tel"
                    value={managerPhone}
                    onChange={(e) => setManagerPhone(e.target.value)}
                    className="w-full rounded-[10px] border border-[var(--color-border)] px-3 py-2.5 text-sm focus:border-[var(--color-accent)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
                  />
                </div>
              </div>
            </Card>
          )}

          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => router.back()}>
              취소
            </Button>
            <Button
              disabled={!selectedTeamId || !managerName || !managerPhone || !data.is_registration_open}
              onClick={() => setStep(hasCategories ? 2 : 3)}
            >
              다음
            </Button>
          </div>
        </div>
      )}

      {/* Step 2: 부문/디비전 선택 */}
      {step === 2 && hasCategories && (
        <div className="space-y-4">
          <Card>
            <h2 className="mb-4 text-lg font-bold">부문 / 디비전 선택</h2>

            {/* 부문 선택 */}
            <div className="mb-4">
              <label className="mb-2 block text-sm font-medium">부문</label>
              <div className="flex flex-wrap gap-2">
                {Object.keys(categories).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => {
                      setSelectedCategory(cat);
                      setSelectedDivision("");
                    }}
                    className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                      selectedCategory === cat
                        ? "bg-[var(--color-accent)] text-[var(--color-on-accent)]"
                        : "border border-[var(--color-border)] text-[var(--color-text-muted)] hover:bg-[var(--color-surface-bright)]"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* 디비전 선택 */}
            {selectedCategory && categories[selectedCategory] && (
              <div>
                <label className="mb-2 block text-sm font-medium">디비전</label>
                <div className="space-y-2">
                  {categories[selectedCategory].map((div) => {
                    const info = getDivisionRemaining(div);
                    const divFees = (tournament.div_fees ?? {}) as Record<string, number>;
                    const fee = divFees[div] ?? tournament.entry_fee;
                    const isFull = info ? info.remaining <= 0 : false;

                    return (
                      <button
                        key={div}
                        onClick={() => setSelectedDivision(div)}
                        disabled={isFull && !tournament.allow_waiting_list}
                        className={`w-full rounded-[12px] border-2 p-4 text-left transition-all ${
                          selectedDivision === div
                            ? "border-[var(--color-accent)] bg-[var(--color-surface-bright)]"
                            : isFull
                              ? "border-[var(--color-border)] bg-[var(--color-surface)]"
                              : "border-[var(--color-border)] hover:border-[color-mix(in_srgb,var(--color-accent)_50%,transparent)]"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold">{div}</span>
                          <div className="flex items-center gap-2">
                            {fee && <span className="text-sm text-[var(--color-text-muted)]">{Number(fee).toLocaleString()}원</span>}
                            {info && (
                              <Badge variant={isFull ? "warning" : "info"}>
                                {isFull
                                  ? tournament.allow_waiting_list
                                    ? "대기접수"
                                    : "마감"
                                  : `${info.count}/${info.cap}팀`}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </Card>

          <div className="flex justify-between">
            <Button variant="ghost" onClick={() => setStep(1)}>
              이전
            </Button>
            <Button disabled={!selectedDivision && !!selectedCategory} onClick={() => setStep(3)}>
              다음
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: 유니폼/선수 등록 */}
      {step === 3 && (
        <div className="space-y-4">
          {/* 유니폼 색상 */}
          <Card>
            <h2 className="mb-4 text-lg font-bold">유니폼 색상</h2>
            <div className="flex gap-6">
              <div className="flex items-center gap-3">
                <label className="text-sm text-[var(--color-text-muted)]">홈</label>
                <input
                  type="color"
                  value={uniformHome}
                  onChange={(e) => setUniformHome(e.target.value)}
                  className="h-10 w-14 cursor-pointer rounded-[8px] border border-[var(--color-border)]"
                />
              </div>
              <div className="flex items-center gap-3">
                <label className="text-sm text-[var(--color-text-muted)]">어웨이</label>
                <input
                  type="color"
                  value={uniformAway}
                  onChange={(e) => setUniformAway(e.target.value)}
                  className="h-10 w-14 cursor-pointer rounded-[8px] border border-[var(--color-border)]"
                />
              </div>
            </div>
          </Card>

          {/* 선수 명단 */}
          <Card>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold">선수 명단</h2>
              <span className="text-sm text-[var(--color-text-muted)]">
                {players.filter((p) => p.selected).length}명 선택
                {tournament.roster_min && ` (최소 ${tournament.roster_min}명)`}
              </span>
            </div>

            {players.length === 0 ? (
              <p className="text-center text-sm text-[var(--color-text-muted)]">팀 멤버가 없습니다.</p>
            ) : (
              <div className="space-y-2">
                {players.map((player, idx) => (
                  <div
                    key={player.userId}
                    className={`flex items-center gap-3 rounded-[12px] border p-3 transition-all ${
                      player.selected ? "border-[color-mix(in_srgb,var(--color-accent)_30%,transparent)] bg-[color-mix(in_srgb,var(--color-surface-bright)_50%,transparent)]" : "border-[var(--color-border)]"
                    }`}
                  >
                    {/* 체크박스 */}
                    <input
                      type="checkbox"
                      checked={player.selected}
                      onChange={() => {
                        setPlayers((prev) =>
                          prev.map((p, i) =>
                            i === idx ? { ...p, selected: !p.selected } : p
                          )
                        );
                      }}
                      className="h-5 w-5 rounded border-[var(--color-border)] accent-[var(--color-accent)]"
                    />

                    {/* 이름 */}
                    <span className="min-w-[80px] text-sm font-medium">{player.name}</span>

                    {/* 등번호 */}
                    <input
                      type="number"
                      min={0}
                      max={99}
                      value={player.jerseyNumber ?? ""}
                      placeholder="#"
                      onChange={(e) => {
                        const val = e.target.value ? parseInt(e.target.value) : null;
                        setPlayers((prev) =>
                          prev.map((p, i) =>
                            i === idx ? { ...p, jerseyNumber: val } : p
                          )
                        );
                      }}
                      className="w-14 rounded-[8px] border border-[var(--color-border)] px-2 py-1.5 text-center text-sm"
                    />

                    {/* 포지션 */}
                    <select
                      value={player.position ?? ""}
                      onChange={(e) => {
                        setPlayers((prev) =>
                          prev.map((p, i) =>
                            i === idx ? { ...p, position: e.target.value || null } : p
                          )
                        );
                      }}
                      className="rounded-[8px] border border-[var(--color-border)] px-2 py-1.5 text-sm"
                    >
                      <option value="">포지션</option>
                      <option value="PG">PG</option>
                      <option value="SG">SG</option>
                      <option value="SF">SF</option>
                      <option value="PF">PF</option>
                      <option value="C">C</option>
                    </select>

                    {/* 선출 */}
                    <label className="flex items-center gap-1 text-xs text-[var(--color-text-muted)]">
                      <input
                        type="checkbox"
                        checked={player.isElite}
                        onChange={() => {
                          setPlayers((prev) =>
                            prev.map((p, i) =>
                              i === idx ? { ...p, isElite: !p.isElite } : p
                            )
                          );
                        }}
                        className="h-4 w-4 accent-[var(--color-primary)]"
                      />
                      선출
                    </label>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <div className="flex justify-between">
            <Button variant="ghost" onClick={() => setStep(hasCategories ? 2 : 1)}>
              이전
            </Button>
            <Button
              disabled={players.filter((p) => p.selected).length < (tournament.roster_min ?? 1)}
              onClick={() => {
                setError(null);
                setStep(4);
              }}
            >
              다음
            </Button>
          </div>
        </div>
      )}

      {/* Step 4: 확인 및 제출 */}
      {step === 4 && (
        <div className="space-y-4">
          <Card>
            <h2 className="mb-4 text-lg font-bold">신청 내용 확인</h2>

            <div className="space-y-3 text-sm">
              {/* 팀 */}
              <div className="flex justify-between border-b border-[var(--color-border)] pb-2">
                <span className="text-[var(--color-text-muted)]">참가팀</span>
                <span className="font-medium">
                  {data.my_teams.find((t) => t.id === selectedTeamId)?.name}
                </span>
              </div>

              {/* 대표자 */}
              <div className="flex justify-between border-b border-[var(--color-border)] pb-2">
                <span className="text-[var(--color-text-muted)]">대표자</span>
                <span className="font-medium">{managerName} ({managerPhone})</span>
              </div>

              {/* 부문/디비전 */}
              {selectedCategory && (
                <div className="flex justify-between border-b border-[var(--color-border)] pb-2">
                  <span className="text-[var(--color-text-muted)]">부문 / 디비전</span>
                  <span className="font-medium">
                    {selectedCategory} · {selectedDivision}
                  </span>
                </div>
              )}

              {/* 유니폼 */}
              <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-2">
                <span className="text-[var(--color-text-muted)]">유니폼</span>
                <div className="flex gap-2">
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-[var(--color-text-muted)]">홈</span>
                    <div className="h-6 w-6 rounded-full border" style={{ backgroundColor: uniformHome }} />
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-[var(--color-text-muted)]">어웨이</span>
                    <div className="h-6 w-6 rounded-full border" style={{ backgroundColor: uniformAway }} />
                  </div>
                </div>
              </div>

              {/* 선수 */}
              <div className="border-b border-[var(--color-border)] pb-2">
                <div className="mb-2 flex justify-between">
                  <span className="text-[var(--color-text-muted)]">선수 명단</span>
                  <span className="font-medium">{players.filter((p) => p.selected).length}명</span>
                </div>
                <div className="space-y-1">
                  {players
                    .filter((p) => p.selected)
                    .map((p) => (
                      <div key={p.userId} className="flex justify-between text-xs">
                        <span>
                          {p.jerseyNumber !== null ? `#${p.jerseyNumber} ` : ""}
                          {p.name}
                          {p.isElite && (
                            <span className="ml-1 rounded bg-[color-mix(in_srgb,var(--color-primary)_10%,transparent)] px-1 text-[var(--color-primary)]">선출</span>
                          )}
                        </span>
                        <span className="text-[var(--color-text-muted)]">{p.position ?? "-"}</span>
                      </div>
                    ))}
                </div>
              </div>

              {/* 참가비 */}
              {(tournament.entry_fee || selectedDivision) && (
                <div className="pt-1">
                  <div className="flex justify-between">
                    <span className="text-[var(--color-text-muted)]">참가비</span>
                    <span className="text-lg font-bold text-[var(--color-primary)]">
                      {(() => {
                        const divFees = (tournament.div_fees ?? {}) as Record<string, number>;
                        const fee = selectedDivision ? (divFees[selectedDivision] ?? tournament.entry_fee) : tournament.entry_fee;
                        return fee ? `${Number(fee).toLocaleString()}원` : "무료";
                      })()}
                    </span>
                  </div>
                  {tournament.bank_name && (
                    <div className="mt-2 rounded-[10px] bg-[var(--color-surface)] p-3">
                      <p className="text-xs text-[var(--color-text-muted)]">입금 계좌</p>
                      <p className="mt-1 font-medium">
                        {tournament.bank_name} {tournament.bank_account}
                      </p>
                      <p className="text-xs text-[var(--color-text-muted)]">{tournament.bank_holder}</p>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(
                            `${tournament.bank_name} ${tournament.bank_account}`
                          );
                        }}
                        className="mt-1 text-xs text-[var(--color-accent)] underline"
                      >
                        계좌번호 복사
                      </button>
                    </div>
                  )}
                  {tournament.fee_notes && (
                    <p className="mt-2 text-xs text-[var(--color-text-muted)]">{tournament.fee_notes}</p>
                  )}
                </div>
              )}
            </div>
          </Card>

          <div className="flex justify-between">
            <Button variant="ghost" onClick={() => setStep(3)}>
              이전
            </Button>
            <Button
              variant="cta"
              loading={submitting}
              disabled={!data.is_registration_open}
              onClick={handleSubmit}
            >
              참가신청
            </Button>
          </div>
        </div>
      )}

      {/* Step 5: 완료 */}
      {step === 5 && result && (
        <Card className="text-center">
          <div className="mb-4 flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-success)]/20">
              <svg className="h-8 w-8 text-[var(--color-success)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6 9 17l-5-5" />
              </svg>
            </div>
          </div>

          <h2 className="text-xl font-bold">{result.message}</h2>
          <p className="mt-2 text-sm text-[var(--color-text-muted)]">
            {result.status === "waiting"
              ? `대기 순번: ${result.waiting_number}번`
              : result.status === "approved"
                ? "참가가 확정되었습니다."
                : "주최자 승인 후 참가가 확정됩니다."}
          </p>

          {/* 입금 안내 */}
          {tournament.bank_name && (
            <div className="mx-auto mt-4 max-w-xs rounded-[10px] bg-[var(--color-surface)] p-4 text-left">
              <p className="text-xs font-bold text-[var(--color-text-muted)]">참가비 입금 안내</p>
              <p className="mt-1 text-sm font-medium">
                {tournament.bank_name} {tournament.bank_account}
              </p>
              <p className="text-xs text-[var(--color-text-muted)]">{tournament.bank_holder}</p>
  </div>
          )}

          <div className="mt-6 flex justify-center gap-3">
            <Button variant="ghost" onClick={() => router.push(`/tournaments/${id}`)}>
              대회 페이지로
            </Button>
            <Button onClick={() => router.push("/profile")}>
              내 신청 확인
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
