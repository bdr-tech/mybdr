"use client";

import { useState } from "react";
import { PlaceAutocomplete, type PlaceSelection } from "@/components/shared/place-autocomplete";

const inputCls =
  "w-full rounded-xl border-none bg-[var(--color-surface)] px-4 py-3 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30";
const labelCls = "mb-1 block text-xs font-medium text-[var(--color-text-muted)]";

// 경기장 정보 타입 (복수 경기장 지원)
export interface PlaceInfo {
  name: string;
  address: string;
}

export interface ScheduleFormData {
  startDate: string;
  endDate: string;
  registrationStartAt: string;
  registrationEndAt: string;
  venueName: string;
  venueAddress: string;
  city: string;
  places: PlaceInfo[];
}

interface Props {
  data: ScheduleFormData;
  onChange: (field: keyof ScheduleFormData, value: string | PlaceInfo[]) => void;
}

export function ScheduleForm({ data, onChange }: Props) {
  const places = data.places ?? [];
  // 검색 입력 상태 (PlaceAutocomplete에 전달)
  const [searchValue, setSearchValue] = useState("");

  // Google Places 검색 결과 → 경기장 추가
  function handlePlaceSelect(place: PlaceSelection) {
    // 첫 번째 경기장이면 기존 필드에도 채움 (하위 호환)
    if (places.length === 0) {
      onChange("venueName", place.name);
      onChange("venueAddress", place.address);
      const cityMatch = place.address.match(/^(?:대한민국\s+)?(서울|부산|대구|인천|광주|대전|울산|세종|경기|강원|충북|충남|전북|전남|경북|경남|제주)/);
      if (cityMatch) onChange("city", cityMatch[1]);
    }
    const newPlaces = [...places, { name: place.name, address: place.address }];
    onChange("places", newPlaces);
    setSearchValue(""); // 검색창 초기화
  }

  // 경기장 삭제
  function removePlace(index: number) {
    const newPlaces = places.filter((_, i) => i !== index);
    onChange("places", newPlaces);
    if (index === 0) {
      if (newPlaces.length > 0) {
        onChange("venueName", newPlaces[0].name);
        onChange("venueAddress", newPlaces[0].address);
      } else {
        onChange("venueName", "");
        onChange("venueAddress", "");
        onChange("city", "");
      }
    }
  }

  return (
    <div className="space-y-4">
      {/* 대회 기간 */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelCls}>대회 시작일</label>
          <input type="date" className={inputCls} value={data.startDate} onChange={(e) => onChange("startDate", e.target.value)} />
        </div>
        <div>
          <label className={labelCls}>대회 종료일</label>
          <input type="date" className={inputCls} value={data.endDate} onChange={(e) => onChange("endDate", e.target.value)} />
        </div>
      </div>

      {/* 접수 기간 */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelCls}>참가 접수 시작</label>
          <input type="datetime-local" className={inputCls} value={data.registrationStartAt} onChange={(e) => onChange("registrationStartAt", e.target.value)} />
        </div>
        <div>
          <label className={labelCls}>참가 접수 마감</label>
          <input type="datetime-local" className={inputCls} value={data.registrationEndAt} onChange={(e) => onChange("registrationEndAt", e.target.value)} />
        </div>
      </div>

      {/* 경기장 검색 */}
      <div>
        <label className={labelCls}>
          <span className="material-symbols-outlined align-middle text-sm mr-1">search</span>
          경기장 검색
        </label>
        <PlaceAutocomplete
          value={searchValue}
          onChange={setSearchValue}
          onSelect={handlePlaceSelect}
          placeholder="경기장 이름 검색 (예: 잠실체육관)"
          className={inputCls}
        />
      </div>

      {/* 등록된 경기장 목록 */}
      {places.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium" style={{ color: "var(--color-text-muted)" }}>
            등록된 경기장 ({places.length}개)
          </p>
          {places.map((place, i) => (
            <div
              key={i}
              className="flex items-center gap-3 rounded-xl p-3"
              style={{ backgroundColor: "var(--color-surface)" }}
            >
              <span className="material-symbols-outlined text-lg" style={{ color: "var(--color-primary)" }}>location_on</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: "var(--color-text-primary)" }}>{place.name}</p>
                <p className="text-xs truncate" style={{ color: "var(--color-text-muted)" }}>{place.address}</p>
              </div>
              <button
                type="button"
                onClick={() => removePlace(i)}
                className="flex h-7 w-7 items-center justify-center rounded-lg transition-colors hover:bg-[var(--color-error)]/10"
                style={{ color: "var(--color-error)" }}
              >
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* 도시 (자동 입력 또는 직접) */}
      <div>
        <label className={labelCls}>도시</label>
        <input
          className={inputCls}
          value={data.city}
          onChange={(e) => onChange("city", e.target.value)}
          placeholder="서울, 부산 등 (검색 시 자동 입력)"
        />
      </div>
    </div>
  );
}
