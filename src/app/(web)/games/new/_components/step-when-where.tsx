"use client";

import type { WizardFormData, RecentVenue } from "./game-wizard";

const DURATION_OPTIONS = [1, 2, 3, 4];

interface StepWhenWhereProps {
  data: WizardFormData;
  updateData: <K extends keyof WizardFormData>(key: K, value: WizardFormData[K]) => void;
  errors: Record<string, string>;
  recentVenues: RecentVenue[];
  venuesLoading: boolean;
  onApplyVenue: (v: RecentVenue) => void;
  onOpenPostcode: () => void;
}

export function StepWhenWhere({
  data,
  updateData,
  errors,
  recentVenues,
  venuesLoading,
  onApplyVenue,
  onOpenPostcode,
}: StepWhenWhereProps) {
  // Minimum date: today
  const today = new Date();
  const minDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  return (
    <div aria-live="polite">
      <h2 className="mb-2 text-2xl font-bold text-[#111827]">언제, 어디서 뛰나요?</h2>
      <p className="mb-6 text-sm text-[#9CA3AF]">날짜와 장소를 선택해주세요.</p>

      {/* Date & Time */}
      <div className="mb-6">
        <label className="mb-2 block text-sm font-medium text-[#6B7280]">
          일시 <span className="text-[#F4A261]">*</span>
        </label>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <input
              type="date"
              value={data.scheduledDate}
              min={minDate}
              onChange={(e) => updateData("scheduledDate", e.target.value)}
              className={`w-full rounded-[16px] border bg-white px-4 py-3 text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#0066FF]/50 ${
                errors.scheduledAt ? "border-red-400" : "border-[#E8ECF0]"
              }`}
              aria-label="경기 날짜"
            />
          </div>
          <div>
            <input
              type="time"
              value={data.scheduledTime}
              onChange={(e) => updateData("scheduledTime", e.target.value)}
              className={`w-full rounded-[16px] border bg-white px-4 py-3 text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#0066FF]/50 ${
                errors.scheduledAt ? "border-red-400" : "border-[#E8ECF0]"
              }`}
              aria-label="경기 시작 시각"
            />
          </div>
        </div>
        {errors.scheduledAt && (
          <p role="alert" className="mt-1 text-xs text-red-400">
            {errors.scheduledAt}
          </p>
        )}
      </div>

      {/* Duration pills */}
      <div className="mb-6">
        <label className="mb-2 block text-sm font-medium text-[#6B7280]">경기 시간</label>
        <div className="flex gap-2">
          {DURATION_OPTIONS.map((h) => (
            <button
              key={h}
              type="button"
              onClick={() => updateData("durationHours", h)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-colors min-h-[40px] ${
                data.durationHours === h
                  ? "bg-[#F4A261]/20 text-[#F4A261] border border-[#F4A261]"
                  : "bg-[#F5F7FA] text-[#9CA3AF] border border-transparent hover:bg-[#E8ECF0]"
              }`}
            >
              {h}시간
            </button>
          ))}
        </div>
      </div>

      <div className="mb-4 h-px bg-[#E8ECF0]" />

      {/* Venue */}
      <div className="mb-4">
        <div className="mb-3 flex items-center justify-between">
          <label className="text-sm font-medium text-[#6B7280]">장소</label>
          <button
            type="button"
            onClick={onOpenPostcode}
            className="flex items-center gap-1.5 rounded-[12px] bg-[#FEE500] px-3 py-1.5 text-sm font-medium text-[#3C1E1E] transition-opacity hover:opacity-90"
          >
            🔍 주소 검색
          </button>
        </div>

        <input
          type="text"
          value={data.venueName}
          onChange={(e) => updateData("venueName", e.target.value)}
          placeholder="장소명 / 체육관 이름"
          className="w-full rounded-[16px] border border-[#E8ECF0] bg-white px-4 py-3 text-[#111827] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#0066FF]/50"
          aria-label="장소명"
        />

        {data.venueAddress && (
          <p className="mt-2 text-xs text-[#9CA3AF]">
            📍 {data.venueAddress}
          </p>
        )}
      </div>

      {/* Recent venues chips */}
      {venuesLoading ? (
        <div className="flex gap-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-8 w-28 animate-pulse rounded-full bg-[#E8ECF0]" />
          ))}
        </div>
      ) : recentVenues.length > 0 ? (
        <div className="mb-4">
          <p className="mb-2 text-xs text-[#9CA3AF]">최근 장소</p>
          <div className="flex flex-nowrap gap-2 overflow-x-auto pb-1">
            {recentVenues.map((v, i) => {
              const isActive =
                v.venue_name === data.venueName &&
                v.city === data.city &&
                v.district === data.district;
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => onApplyVenue(v)}
                  className={`flex-shrink-0 rounded-full border px-3 py-1.5 text-xs transition-colors ${
                    isActive
                      ? "bg-[#F4A261]/10 border-[#F4A261] text-[#F4A261]"
                      : "bg-white border-[#E8ECF0] text-[#111827] hover:border-[#F4A261]/50"
                  }`}
                >
                  {v.venue_name || v.district || v.city}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      {/* Hidden fields for city/district (auto-filled by postcode or venue) */}
      {(data.city || data.district) && (
        <div className="mt-3 grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs text-[#9CA3AF]">시/도</label>
            <input
              type="text"
              value={data.city}
              onChange={(e) => updateData("city", e.target.value)}
              className="w-full rounded-[12px] border border-[#E8ECF0] bg-[#F5F7FA] px-3 py-2 text-sm text-[#6B7280]"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-[#9CA3AF]">구/동</label>
            <input
              type="text"
              value={data.district}
              onChange={(e) => updateData("district", e.target.value)}
              className="w-full rounded-[12px] border border-[#E8ECF0] bg-[#F5F7FA] px-3 py-2 text-sm text-[#6B7280]"
            />
          </div>
        </div>
      )}
    </div>
  );
}
