"use client";

import { useState, useEffect, useRef, useCallback } from "react";

// API에서 반환하는 장소 검색 결과 타입
interface PlaceResult {
  place_id: string;
  name: string;     // 장소명 (예: "강남스포츠문화센터")
  address: string;  // 주소 (예: "서울특별시 강남구")
}

// 부모 컴포넌트에 전달할 선택 결과
export interface PlaceSelection {
  name: string;     // 장소명
  address: string;  // 주소
}

interface PlaceAutocompleteProps {
  /** 현재 입력값 (부모가 제어) */
  value: string;
  /** 값이 변경될 때 호출 (타이핑 중) */
  onChange: (value: string) => void;
  /** 드롭다운에서 장소를 선택했을 때 호출 */
  onSelect: (place: PlaceSelection) => void;
  /** input placeholder */
  placeholder?: string;
  /** 추가 CSS 클래스 */
  className?: string;
}

/**
 * PlaceAutocomplete - Google Places 검색 자동완성 컴포넌트
 *
 * 왜 서버 proxy를 거치는가:
 * - API 키를 클라이언트에 노출하지 않기 위해
 * - /api/web/place-search?query=... 엔드포인트를 통해 서버에서 Google API 호출
 *
 * 디바운스 300ms 적용:
 * - 타이핑할 때마다 API를 호출하면 비용이 많이 들기 때문에
 * - 300ms 동안 추가 입력이 없을 때만 검색 실행
 */
export function PlaceAutocomplete({
  value,
  onChange,
  onSelect,
  placeholder = "장소 검색 (예: 강남스포츠센터)",
  className = "",
}: PlaceAutocompleteProps) {
  const [results, setResults] = useState<PlaceResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  // 선택된 상태인지 추적 (선택 직후에는 검색하지 않음)
  const justSelected = useRef(false);
  // 디바운스 타이머 참조
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // 드롭다운 외부 클릭 감지용
  const containerRef = useRef<HTMLDivElement>(null);

  // 디바운스된 검색 함수
  const searchPlaces = useCallback(async (query: string) => {
    if (query.length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`/api/web/place-search?query=${encodeURIComponent(query)}`);
      const data = await res.json();
      const items = (data.results ?? []) as PlaceResult[];
      setResults(items);
      // 결과가 있으면 드롭다운 열기
      setIsOpen(items.length > 0);
    } catch {
      setResults([]);
      setIsOpen(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // value가 변경될 때 디바운스 검색 트리거
  useEffect(() => {
    // 선택 직후에는 검색하지 않음 (무한 루프 방지)
    if (justSelected.current) {
      justSelected.current = false;
      return;
    }

    // 이전 타이머 취소
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    // 300ms 후 검색 실행 (디바운스)
    debounceTimer.current = setTimeout(() => {
      searchPlaces(value);
    }, 300);

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [value, searchPlaces]);

  // 드롭다운 외부 클릭 시 닫기
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 장소 선택 핸들러
  function handleSelect(place: PlaceResult) {
    justSelected.current = true;
    // 부모에 선택 결과 전달
    onSelect({
      name: place.name,
      address: place.address,
    });
    // 입력값을 장소명으로 설정
    onChange(place.name);
    // 드롭다운 닫기
    setIsOpen(false);
    setResults([]);
  }

  return (
    <div ref={containerRef} className="relative">
      {/* 검색 입력 필드 */}
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => {
            // 포커스 시 결과가 있으면 다시 열기
            if (results.length > 0) setIsOpen(true);
          }}
          placeholder={placeholder}
          className={className}
          autoComplete="off"
        />
        {/* 검색 아이콘 또는 로딩 스피너 (우측) */}
        <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
          {isLoading ? (
            // 로딩 스피너: 작은 회전 원
            <span
              className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
              style={{ color: "var(--color-text-muted)" }}
            />
          ) : (
            <span
              className="material-symbols-outlined text-base"
              style={{ color: "var(--color-text-muted)" }}
            >
              search
            </span>
          )}
        </span>
      </div>

      {/* 검색 결과 드롭다운 */}
      {isOpen && results.length > 0 && (
        <ul
          className="absolute z-50 mt-1 w-full rounded-lg border overflow-hidden shadow-lg"
          style={{
            backgroundColor: "var(--color-card)",
            borderColor: "var(--color-border)",
          }}
        >
          {results.map((place) => (
            <li key={place.place_id}>
              <button
                type="button"
                onClick={() => handleSelect(place)}
                className="w-full text-left px-4 py-3 flex items-start gap-3 transition-colors hover:bg-[var(--color-surface)]"
              >
                {/* 장소 아이콘 */}
                <span
                  className="material-symbols-outlined text-lg mt-0.5 shrink-0"
                  style={{ color: "var(--color-primary)" }}
                >
                  location_on
                </span>
                <div className="min-w-0 flex-1">
                  {/* 장소명 (굵게) */}
                  <p
                    className="text-sm font-medium truncate"
                    style={{ color: "var(--color-text-primary)" }}
                  >
                    {place.name}
                  </p>
                  {/* 주소 (연하게) */}
                  {place.address && (
                    <p
                      className="text-xs truncate mt-0.5"
                      style={{ color: "var(--color-text-muted)" }}
                    >
                      {place.address}
                    </p>
                  )}
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
