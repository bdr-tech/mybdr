"use client";

import { Button } from "@/components/ui/button";

const inputCls =
  "w-full rounded-[16px] border-none bg-[var(--color-border)] px-4 py-3 text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/50";
const labelCls = "mb-1 block text-sm text-[var(--color-text-muted)]";

export interface RegistrationSettingsData {
  categories: Record<string, string[]>;
  divCaps: Record<string, number>;
  divFees: Record<string, number>;
  allowWaitingList: boolean;
  waitingListCap: string;
  entryFee: string;
  bankName: string;
  bankAccount: string;
  bankHolder: string;
  feeNotes: string;
}

interface Props {
  data: RegistrationSettingsData;
  onChange: (updates: Partial<RegistrationSettingsData>) => void;
}

export function RegistrationSettingsForm({ data, onChange }: Props) {
  const { categories, divCaps, divFees } = data;

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">접수 설정</h2>

      {/* 부문/디비전 관리 */}
      <div>
        <label className={labelCls}>부문 / 디비전</label>
        <p className="mb-2 text-xs text-[var(--color-text-muted)]">
          부문(일반부, 대학부 등)을 추가하고, 각 부문 아래 디비전(D3, D4 등)을 설정합니다.
        </p>

        {Object.entries(categories).map(([cat, divs]) => (
          <div key={cat} className="mb-3 rounded-[12px] border border-[var(--color-border)] p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="font-medium">{cat}</span>
              <button
                type="button"
                onClick={() => {
                  const nextCats = { ...categories };
                  const nextCaps = { ...divCaps };
                  const nextFees = { ...divFees };
                  divs.forEach((d) => {
                    delete nextCaps[d];
                    delete nextFees[d];
                  });
                  delete nextCats[cat];
                  onChange({ categories: nextCats, divCaps: nextCaps, divFees: nextFees });
                }}
                className="text-xs text-[var(--color-error)] hover:underline"
              >
                부문 삭제
              </button>
            </div>

            <div className="space-y-2">
              {divs.map((div) => (
                <div key={div} className="flex items-center gap-2 text-sm">
                  <span className="min-w-[60px] font-medium">{div}</span>
                  <input
                    type="number"
                    placeholder="정원"
                    value={divCaps[div] ?? ""}
                    onChange={(e) => {
                      const val = e.target.value ? Number(e.target.value) : undefined;
                      const next = { ...divCaps };
                      if (val) next[div] = val;
                      else delete next[div];
                      onChange({ divCaps: next });
                    }}
                    className="w-20 rounded-[8px] border border-[var(--color-border)] px-2 py-1 text-sm"
                  />
                  <span className="text-xs text-[var(--color-text-muted)]">팀</span>
                  <input
                    type="number"
                    placeholder="참가비"
                    value={divFees[div] ?? ""}
                    onChange={(e) => {
                      const val = e.target.value ? Number(e.target.value) : undefined;
                      const next = { ...divFees };
                      if (val) next[div] = val;
                      else delete next[div];
                      onChange({ divFees: next });
                    }}
                    className="w-24 rounded-[8px] border border-[var(--color-border)] px-2 py-1 text-sm"
                  />
                  <span className="text-xs text-[var(--color-text-muted)]">원</span>
                  <button
                    type="button"
                    onClick={() => {
                      const nextDivs = divs.filter((d) => d !== div);
                      const nextCats = { ...categories, [cat]: nextDivs };
                      const nextCaps = { ...divCaps };
                      delete nextCaps[div];
                      const nextFees = { ...divFees };
                      delete nextFees[div];
                      if (nextDivs.length === 0) delete nextCats[cat];
                      onChange({ categories: nextCats, divCaps: nextCaps, divFees: nextFees });
                    }}
                    className="text-xs text-[var(--color-error)]"
                  >
                    ×
                  </button>
                </div>
              ))}

              {/* 디비전 추가 */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const input = (e.target as HTMLFormElement).elements.namedItem("newDiv") as HTMLInputElement;
                  const val = input.value.trim();
                  if (!val || divs.includes(val)) return;
                  onChange({ categories: { ...categories, [cat]: [...divs, val] } });
                  input.value = "";
                }}
                className="flex gap-2"
              >
                <input
                  name="newDiv"
                  placeholder="디비전 추가 (예: D3)"
                  className="flex-1 rounded-[8px] border border-[var(--color-border)] px-2 py-1 text-sm"
                />
                <button type="submit" className="text-xs font-medium text-[var(--color-accent)] hover:underline">
                  추가
                </button>
              </form>
            </div>
          </div>
        ))}

        {/* 부문 추가 */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const input = (e.target as HTMLFormElement).elements.namedItem("newCat") as HTMLInputElement;
            const val = input.value.trim();
            if (!val || categories[val]) return;
            onChange({ categories: { ...categories, [val]: [] } });
            input.value = "";
          }}
          className="flex gap-2"
        >
          <input name="newCat" placeholder="부문 추가 (예: 일반부)" className={`flex-1 ${inputCls}`} />
          <Button type="submit" variant="secondary" className="whitespace-nowrap">
            부문 추가
          </Button>
        </form>
      </div>

      {/* 기본 참가비 */}
      <div>
        <label className={labelCls}>기본 참가비 (원)</label>
        <input
          type="number"
          className={inputCls}
          value={data.entryFee}
          min={0}
          step={1000}
          onChange={(e) => onChange({ entryFee: e.target.value })}
          placeholder="0 (무료)"
        />
        <p className="mt-1 text-xs text-[var(--color-text-muted)]">디비전별 참가비를 설정하면 기본 참가비 대신 적용됩니다.</p>
      </div>

      {/* 대기접수 */}
      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          id="allow_waiting"
          checked={data.allowWaitingList}
          onChange={(e) => onChange({ allowWaitingList: e.target.checked })}
          className="accent-[var(--color-primary)]"
        />
        <label htmlFor="allow_waiting" className="text-sm">
          대기접수 허용
        </label>
      </div>
      {data.allowWaitingList && (
        <div>
          <label className={labelCls}>디비전당 대기 최대 수</label>
          <input
            type="number"
            className={inputCls}
            value={data.waitingListCap}
            min={1}
            onChange={(e) => onChange({ waitingListCap: e.target.value })}
            placeholder="제한 없음"
          />
        </div>
      )}

      {/* 입금 정보 */}
      <h3 className="pt-2 text-sm font-semibold text-[var(--color-text-muted)]">참가비 입금 정보</h3>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelCls}>은행명</label>
          <input
            className={inputCls}
            value={data.bankName}
            onChange={(e) => onChange({ bankName: e.target.value })}
            placeholder="국민은행"
          />
        </div>
        <div>
          <label className={labelCls}>계좌번호</label>
          <input
            className={inputCls}
            value={data.bankAccount}
            onChange={(e) => onChange({ bankAccount: e.target.value })}
            placeholder="000-0000-0000"
          />
        </div>
      </div>
      <div>
        <label className={labelCls}>예금주</label>
        <input
          className={inputCls}
          value={data.bankHolder}
          onChange={(e) => onChange({ bankHolder: e.target.value })}
          placeholder="예금주명"
        />
      </div>
      <div>
        <label className={labelCls}>참가비 안내사항</label>
        <textarea
          className={inputCls}
          rows={3}
          value={data.feeNotes}
          onChange={(e) => onChange({ feeNotes: e.target.value })}
          placeholder="환불 정책 등"
        />
      </div>
    </div>
  );
}
