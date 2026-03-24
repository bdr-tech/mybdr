"use client";

import { useState, useCallback } from "react";
// lucide-react 제거 → Material Symbols Outlined 사용
import { REGIONS, PROVINCES } from "@/lib/constants/regions";

export interface Region {
  city: string;
  district: string;
}

interface RegionPickerProps {
  value: Region[];
  onChange: (regions: Region[]) => void;
  max?: number;
  className?: string;
}

const inp =
  "w-full rounded-[16px] border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-3 text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/20 text-sm";

export function RegionPicker({ value, onChange, max = 3, className = "" }: RegionPickerProps) {
  const [locating, setLocating] = useState(false);
  const [locError, setLocError] = useState("");

  const updateRegion = useCallback(
    (index: number, field: keyof Region, val: string) => {
      const updated = [...value];
      if (field === "city") {
        updated[index] = { city: val, district: "" };
      } else {
        updated[index] = { ...updated[index], district: val };
      }
      onChange(updated);
    },
    [value, onChange],
  );

  const addRegion = useCallback(() => {
    if (value.length < max) {
      onChange([...value, { city: "", district: "" }]);
    }
  }, [value, onChange, max]);

  const removeRegion = useCallback(
    (index: number) => {
      const updated = value.filter((_, i) => i !== index);
      onChange(updated.length === 0 ? [{ city: "", district: "" }] : updated);
    },
    [value, onChange],
  );

  const handleGeolocate = useCallback(async () => {
    if (!navigator.geolocation) {
      setLocError("이 브라우저는 위치 서비스를 지원하지 않습니다.");
      return;
    }

    setLocating(true);
    setLocError("");

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: false,
          timeout: 10000,
          maximumAge: 300000,
        });
      });

      const { latitude, longitude } = position.coords;

      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=ko&zoom=10`,
        { headers: { "User-Agent": "MyBDR-App" } },
      );

      if (!res.ok) throw new Error("위치 정보를 가져올 수 없습니다.");

      const data = await res.json();
      const addr = data.address ?? {};

      // Nominatim 한국 주소에서 시/도, 시/군/구 추출
      const rawProvince: string = addr.province || addr.state || addr.city || "";
      const rawDistrict: string =
        addr.city_district || addr.county || addr.town || addr.city || addr.suburb || "";

      // 시/도 매칭 (약칭으로도 매칭)
      const matchedProvince = PROVINCES.find(
        (p) => rawProvince.includes(p) || rawProvince.replace(/(특별시|광역시|특별자치시|특별자치도|도)$/, "") === p,
      );

      if (!matchedProvince) {
        setLocError("현재 위치의 지역을 찾을 수 없습니다.");
        return;
      }

      // 시/군/구 매칭
      const districts = REGIONS[matchedProvince] ?? [];
      const matchedDistrict = districts.find(
        (d) => rawDistrict.includes(d.replace(/(시|군|구)$/, "")) || rawDistrict === d,
      ) ?? "";

      // 첫 번째 빈 슬롯에 넣거나, 첫 번째 슬롯에 덮어쓰기
      const updated = [...value];
      const emptyIdx = updated.findIndex((r) => !r.city);
      const targetIdx = emptyIdx >= 0 ? emptyIdx : 0;
      updated[targetIdx] = { city: matchedProvince, district: matchedDistrict };
      onChange(updated);
    } catch (err) {
      if (err instanceof GeolocationPositionError) {
        const messages: Record<number, string> = {
          1: "위치 접근이 거부되었습니다. 브라우저 설정을 확인해주세요.",
          2: "위치 정보를 가져올 수 없습니다.",
          3: "위치 요청 시간이 초과되었습니다.",
        };
        setLocError(messages[err.code] ?? "위치를 가져올 수 없습니다.");
      } else {
        setLocError("위치 정보를 가져오는 중 오류가 발생했습니다.");
      }
    } finally {
      setLocating(false);
    }
  }, [value, onChange]);

  return (
    <div className={className}>
      <div className="mb-2 flex items-center justify-between">
        <label className="block text-sm text-[var(--color-text-muted)]">
          활동 지역 <span className="text-xs text-[var(--color-text-muted)]">(최대 {max}곳)</span>
        </label>
        <button
          type="button"
          onClick={handleGeolocate}
          disabled={locating}
          className="flex items-center gap-1 rounded-[10px] border border-[var(--color-accent)]/30 px-2.5 py-1.5 text-xs font-medium text-[var(--color-accent)] transition-colors hover:bg-[var(--color-elevated)] disabled:opacity-50"
        >
          <span className={`material-symbols-outlined text-xs ${locating ? "animate-pulse" : ""}`}>navigation</span>
          {locating ? "찾는 중..." : "현재 위치로 선택"}
        </button>
      </div>

      {locError && (
        <p className="mb-2 text-xs text-[var(--color-error)]">{locError}</p>
      )}

      <div className="space-y-3">
        {value.map((region, i) => {
          const districts = region.city ? (REGIONS[region.city] ?? []) : [];
          return (
            <div key={i} className="flex items-start gap-2">
              <span className="material-symbols-outlined mt-3.5 flex-shrink-0 text-base text-[var(--color-text-muted)]">location_on</span>
              <div className="grid flex-1 grid-cols-2 gap-2">
                <select
                  className={inp}
                  value={region.city}
                  onChange={(e) => updateRegion(i, "city", e.target.value)}
                >
                  <option value="">시/도 선택</option>
                  {PROVINCES.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
                <select
                  className={inp}
                  value={region.district}
                  onChange={(e) => updateRegion(i, "district", e.target.value)}
                  disabled={!region.city}
                >
                  <option value="">시/군/구 선택</option>
                  {districts.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
              {value.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeRegion(i)}
                  className="mt-3 flex-shrink-0 rounded-full p-1 text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-error)]/10 hover:text-[var(--color-error)]"
                >
                  <span className="material-symbols-outlined text-base">close</span>
                </button>
              )}
            </div>
          );
        })}
      </div>

      {value.length < max && (
        <button
          type="button"
          onClick={addRegion}
          className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-[12px] border border-dashed border-[var(--color-text-muted)] py-2.5 text-xs font-medium text-[var(--color-text-muted)] transition-colors hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
        >
          <span className="material-symbols-outlined text-sm">add</span>
          활동 지역 추가
        </button>
      )}
    </div>
  );
}
