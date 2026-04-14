"use client";

import { useState, useEffect } from "react";

// 이전 대회 복사 모달
// 내 대회 목록을 불러와서 선택하면 설정을 현재 폼에 복사
// 날짜는 복사하지 않음 (새 대회이므로)

interface TournamentSummary {
  id: string;
  name: string;
  status: string;
  city: string | null;
  format: string | null;
}

// 복사할 데이터 형태 (위자드에서 사용하는 필드들)
export interface CopyData {
  // 기본 정보
  format?: string;
  description?: string;
  organizer?: string;
  host?: string;
  sponsors?: string;
  gender?: string;
  // 경기장
  venueName?: string;
  venueAddress?: string;
  city?: string;
  places?: { name: string; address: string }[];
  // 경기 설정
  gameTime?: string;
  gameBall?: string;
  gameMethod?: string;
  // 접수 설정
  categories?: Record<string, string[]>;
  divCaps?: Record<string, number>;
  divFees?: Record<string, number>;
  entryFee?: string;
  bankName?: string;
  bankAccount?: string;
  bankHolder?: string;
  feeNotes?: string;
  // 팀 설정
  maxTeams?: string;
  teamSize?: string;
  rosterMin?: string;
  rosterMax?: string;
  // 디자인
  primaryColor?: string;
  secondaryColor?: string;
  // 기타
  rules?: string;
  prizeInfo?: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onApply: (data: CopyData) => void;
}

export function TournamentCopyModal({ open, onClose, onApply }: Props) {
  const [tournaments, setTournaments] = useState<TournamentSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [copying, setCopying] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);

  // 내 대회 목록 불러오기
  useEffect(() => {
    if (!open) return;
    setLoading(true);
    fetch("/api/web/my-tournaments")
      .then((res) => (res.ok ? res.json() : { tournaments: [] }))
      .then((data) => {
        // API 응답 형태에 따라 배열 추출
        const list = data.tournaments ?? data.data?.tournaments ?? data ?? [];
        setTournaments(Array.isArray(list) ? list : []);
      })
      .catch(() => setTournaments([]))
      .finally(() => setLoading(false));
  }, [open]);

  // 선택한 대회의 상세 정보를 가져와서 복사
  async function handleCopy() {
    if (!selected) return;
    setCopying(true);
    try {
      const res = await fetch(`/api/web/tournaments/${selected}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      const t = data.data ?? data;

      // 날짜를 제외한 설정만 복사
      const copyData: CopyData = {
        format: t.format ?? undefined,
        description: t.description ?? undefined,
        organizer: t.organizer ?? undefined,
        host: t.host ?? undefined,
        sponsors: t.sponsors ?? undefined,
        gender: t.gender ?? undefined,
        venueName: t.venue_name ?? t.venueName ?? undefined,
        venueAddress: t.venue_address ?? t.venueAddress ?? undefined,
        city: t.city ?? undefined,
        places: t.places ?? undefined,
        gameTime: t.game_time ?? t.gameTime ?? undefined,
        gameBall: t.game_ball ?? t.gameBall ?? undefined,
        gameMethod: t.game_method ?? t.gameMethod ?? undefined,
        categories: t.categories ?? undefined,
        divCaps: t.div_caps ?? t.divCaps ?? undefined,
        divFees: t.div_fees ?? t.divFees ?? undefined,
        entryFee: t.entry_fee?.toString() ?? t.entryFee?.toString() ?? undefined,
        bankName: t.bank_name ?? t.bankName ?? undefined,
        bankAccount: t.bank_account ?? t.bankAccount ?? undefined,
        bankHolder: t.bank_holder ?? t.bankHolder ?? undefined,
        feeNotes: t.fee_notes ?? t.feeNotes ?? undefined,
        maxTeams: t.max_teams?.toString() ?? t.maxTeams?.toString() ?? undefined,
        teamSize: t.team_size?.toString() ?? t.teamSize?.toString() ?? undefined,
        rosterMin: t.roster_min?.toString() ?? t.rosterMin?.toString() ?? undefined,
        rosterMax: t.roster_max?.toString() ?? t.rosterMax?.toString() ?? undefined,
        primaryColor: t.primary_color ?? t.primaryColor ?? undefined,
        secondaryColor: t.secondary_color ?? t.secondaryColor ?? undefined,
        rules: t.rules ?? undefined,
        prizeInfo: t.prize_info ?? t.prizeInfo ?? undefined,
      };

      onApply(copyData);
      onClose();
    } catch {
      // 실패 시 무시
    } finally {
      setCopying(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-md rounded-[16px] bg-[var(--color-card)] p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-[var(--color-text-primary)]">
            <span className="material-symbols-outlined align-middle mr-1">content_copy</span>
            이전 대회에서 복사
          </h3>
          <button onClick={onClose} className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <p className="mb-3 text-xs text-[var(--color-text-muted)]">
          선택한 대회의 설정(장소, 경기설정, 종별, 참가비 등)을 복사합니다. 날짜는 복사되지 않습니다.
        </p>

        {loading ? (
          <div className="py-8 text-center text-sm text-[var(--color-text-muted)]">불러오는 중...</div>
        ) : tournaments.length === 0 ? (
          <div className="py-8 text-center text-sm text-[var(--color-text-muted)]">이전 대회가 없습니다.</div>
        ) : (
          <div className="max-h-[300px] space-y-2 overflow-y-auto">
            {tournaments.map((t) => (
              <div
                key={t.id}
                onClick={() => setSelected(t.id)}
                className={`cursor-pointer rounded-[8px] border p-3 transition-colors ${
                  selected === t.id
                    ? "border-[var(--color-accent)] bg-[var(--color-accent)]/5"
                    : "border-[var(--color-border)] hover:border-[var(--color-accent)]/50"
                }`}
              >
                <p className="font-medium text-[var(--color-text-primary)]">{t.name}</p>
                <p className="text-xs text-[var(--color-text-muted)]">
                  {t.city ?? "지역 미정"} · {t.format ?? "미설정"} · {t.status}
                </p>
              </div>
            ))}
          </div>
        )}

        <div className="mt-4 flex justify-end gap-2 border-t border-[var(--color-border)] pt-3">
          <button
            onClick={onClose}
            className="rounded-[4px] px-4 py-2 text-sm text-[var(--color-text-muted)] hover:bg-[var(--color-border)]"
          >
            취소
          </button>
          <button
            onClick={handleCopy}
            disabled={!selected || copying}
            className="rounded-[4px] bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-[var(--color-on-accent)] hover:bg-[var(--color-accent-hover)] disabled:opacity-50"
          >
            {copying ? "복사 중..." : "복사 적용"}
          </button>
        </div>
      </div>
    </div>
  );
}
