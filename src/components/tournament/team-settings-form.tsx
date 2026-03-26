"use client";

const inputCls =
  "w-full rounded-[16px] border-none bg-[var(--color-border)] px-4 py-3 text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/50";
const labelCls = "mb-1 block text-sm text-[var(--color-text-muted)]";

export interface TeamSettingsData {
  maxTeams: string;
  teamSize: string;
  rosterMin: string;
  rosterMax: string;
  autoApproveTeams: boolean;
  autoCalcMaxTeams: boolean;
}

interface Props {
  data: TeamSettingsData;
  totalDivCaps: number;
  onChange: (field: keyof TeamSettingsData, value: string | boolean) => void;
}

export function TeamSettingsForm({ data, totalDivCaps, onChange }: Props) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">팀 설정</h2>

      {/* maxTeams 자동 계산 옵션 */}
      {totalDivCaps > 0 && (
        <div className="rounded-[12px] border border-[var(--color-border)] bg-[var(--color-elevated)] p-3">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="auto_calc"
              checked={data.autoCalcMaxTeams}
              onChange={(e) => onChange("autoCalcMaxTeams", e.target.checked)}
              className="accent-[var(--color-accent)]"
            />
            <label htmlFor="auto_calc" className="text-sm">
              디비전 정원 합산으로 자동 계산{" "}
              <span className="font-bold text-[var(--color-accent)]">({totalDivCaps}팀)</span>
            </label>
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelCls}>최대 팀 수</label>
          <input
            type="number"
            className={inputCls}
            value={data.autoCalcMaxTeams && totalDivCaps > 0 ? String(totalDivCaps) : data.maxTeams}
            min={2}
            disabled={data.autoCalcMaxTeams && totalDivCaps > 0}
            onChange={(e) => onChange("maxTeams", e.target.value)}
          />
        </div>
        <div>
          <label className={labelCls}>팀당 선수 수</label>
          <input
            type="number"
            className={inputCls}
            value={data.teamSize}
            min={1}
            onChange={(e) => onChange("teamSize", e.target.value)}
          />
        </div>
        <div>
          <label className={labelCls}>최소 로스터</label>
          <input
            type="number"
            className={inputCls}
            value={data.rosterMin}
            min={1}
            onChange={(e) => onChange("rosterMin", e.target.value)}
          />
        </div>
        <div>
          <label className={labelCls}>최대 로스터</label>
          <input
            type="number"
            className={inputCls}
            value={data.rosterMax}
            min={1}
            onChange={(e) => onChange("rosterMax", e.target.value)}
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          id="auto_approve"
          checked={data.autoApproveTeams}
          onChange={(e) => onChange("autoApproveTeams", e.target.checked)}
          className="accent-[var(--color-primary)]"
        />
        <label htmlFor="auto_approve" className="text-sm">
          팀 자동 승인
        </label>
      </div>
    </div>
  );
}
