"use client";

// 수동 입력(부문/디비전 추가) 제거 → 모달에서 선택한 결과만 표시하는 폼
// useState 불필요 (수동 입력 state가 없으므로)

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

      {/* 부문/디비전 관리 — 모달에서 추가한 결과만 표시 */}
      <div>
        <label className={labelCls}>부문 / 디비전</label>
        <p className="mb-2 text-xs text-[var(--color-text-muted)]">
          부문(일반부, 대학부 등)을 추가하고, 각 부문 아래 디비전(D3, D4 등)을 설정합니다.
        </p>

        {/* 비어있을 때 안내 영역 */}
        {Object.keys(categories).length === 0 && (
          <div
            className="flex flex-col items-center justify-center rounded-md border-2 border-dashed py-12 text-center"
            style={{ borderColor: "var(--color-border)" }}
          >
            <span
              className="material-symbols-outlined text-4xl mb-3"
              style={{ color: "var(--color-text-disabled)" }}
            >
              add_circle
            </span>
            <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
              상단의 <strong>[종별 추가]</strong> 버튼을 눌러
              <br />
              종별을 추가하세요
            </p>
          </div>
        )}

        {/* 종별 카드 목록 — 토스 스타일 */}
        {Object.entries(categories).map(([cat, divs]) => (
          <div
            key={cat}
            className="mb-3 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] p-4"
          >
            {/* 종별 헤더 */}
            <div className="mb-3 flex items-center justify-between">
              <span className="text-lg font-bold text-[var(--color-text-primary)]">{cat}</span>
              <button
                type="button"
                onClick={() => {
                  // 종별 삭제: 해당 종별의 모든 디비전 정원/참가비도 함께 제거
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
                삭제
              </button>
            </div>

            {/* 디비전이 없을 때 안내 */}
            {divs.length === 0 && (
              <p className="py-4 text-center text-xs text-[var(--color-text-muted)]">
                디비전이 없습니다
              </p>
            )}

            {/* 디비전 행 목록 */}
            <div className="space-y-2">
              {divs.map((div) => (
                <div
                  key={div}
                  className="flex items-center gap-3 rounded-lg bg-[var(--color-bg-secondary)] px-3 py-2"
                >
                  {/* 디비전 코드 */}
                  <span className="min-w-[56px] text-base font-bold text-[var(--color-primary)]">
                    {div}
                  </span>

                  {/* 팀수 입력 */}
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      placeholder="—"
                      value={divCaps[div] ?? ""}
                      onChange={(e) => {
                        const val = e.target.value ? Number(e.target.value) : undefined;
                        const next = { ...divCaps };
                        if (val) next[div] = val;
                        else delete next[div];
                        onChange({ divCaps: next });
                      }}
                      className="w-16 rounded-lg border border-[var(--color-border)] bg-transparent px-2 py-1 text-center text-sm"
                    />
                    <span className="text-xs text-[var(--color-text-muted)]">팀</span>
                  </div>

                  {/* 디비전 삭제 버튼 — 오른쪽 끝 */}
                  <button
                    type="button"
                    onClick={() => {
                      // 디비전 삭제: 정원/참가비도 함께 제거, 디비전 0개면 종별도 제거
                      const nextDivs = divs.filter((d) => d !== div);
                      const nextCats = { ...categories, [cat]: nextDivs };
                      const nextCaps = { ...divCaps };
                      delete nextCaps[div];
                      const nextFees = { ...divFees };
                      delete nextFees[div];
                      if (nextDivs.length === 0) delete nextCats[cat];
                      onChange({ categories: nextCats, divCaps: nextCaps, divFees: nextFees });
                    }}
                    className="ml-auto text-sm text-[var(--color-error)] hover:text-[var(--color-error-hover)]"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
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
        <p className="mt-1 text-xs text-[var(--color-text-muted)]">
          디비전별 참가비를 설정하면 기본 참가비 대신 적용됩니다.
        </p>
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
