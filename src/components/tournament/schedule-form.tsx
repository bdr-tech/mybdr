"use client";

const inputCls =
  "w-full rounded-[16px] border-none bg-[var(--color-border)] px-4 py-3 text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/50";
const labelCls = "mb-1 block text-sm text-[var(--color-text-muted)]";

export interface ScheduleFormData {
  startDate: string;
  endDate: string;
  registrationStartAt: string;
  registrationEndAt: string;
  venueName: string;
  venueAddress: string;
  city: string;
}

interface Props {
  data: ScheduleFormData;
  onChange: (field: keyof ScheduleFormData, value: string) => void;
}

export function ScheduleForm({ data, onChange }: Props) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">일정 / 장소</h2>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelCls}>대회 시작일</label>
          <input
            type="date"
            className={inputCls}
            value={data.startDate}
            onChange={(e) => onChange("startDate", e.target.value)}
          />
        </div>
        <div>
          <label className={labelCls}>대회 종료일</label>
          <input
            type="date"
            className={inputCls}
            value={data.endDate}
            onChange={(e) => onChange("endDate", e.target.value)}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelCls}>참가 접수 시작</label>
          <input
            type="date"
            className={inputCls}
            value={data.registrationStartAt}
            onChange={(e) => onChange("registrationStartAt", e.target.value)}
          />
        </div>
        <div>
          <label className={labelCls}>참가 접수 마감</label>
          <input
            type="date"
            className={inputCls}
            value={data.registrationEndAt}
            onChange={(e) => onChange("registrationEndAt", e.target.value)}
          />
        </div>
      </div>

      <div>
        <label className={labelCls}>경기장 이름</label>
        <input
          className={inputCls}
          value={data.venueName}
          onChange={(e) => onChange("venueName", e.target.value)}
          placeholder="경기장 이름"
        />
      </div>
      <div>
        <label className={labelCls}>주소</label>
        <input
          className={inputCls}
          value={data.venueAddress}
          onChange={(e) => onChange("venueAddress", e.target.value)}
          placeholder="상세 주소"
        />
      </div>
      <div>
        <label className={labelCls}>도시</label>
        <input
          className={inputCls}
          value={data.city}
          onChange={(e) => onChange("city", e.target.value)}
          placeholder="서울, 부산 등"
        />
      </div>
    </div>
  );
}
