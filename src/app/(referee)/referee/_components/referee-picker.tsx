"use client";

import { useEffect, useMemo, useRef, useState } from "react";

/**
 * RefereePicker — 풀 기반 심판 선택 공통 컴포넌트.
 *
 * 이유: 배정 관리 페이지에서 "경기 일자에 선정된 풀" 중에서만 심판을 고를 수 있게
 *      해야 함. 일반 <select>로는 검색/책임자 뱃지/이미 배정됨 비활성화를 표현하기
 *      어려워, 검색+드롭다운 조합의 공통 컴포넌트를 분리.
 *
 * UX 규칙:
 *   - 검색 input에 포커스하거나 타이핑하면 드롭다운이 열린다.
 *   - ESC 키 또는 바깥 클릭으로 닫힌다.
 *   - excludeRefereeIds에 있는 심판은 "이미 배정됨" 뱃지 + 비활성화 처리.
 *   - 책임자(is_chief=true)는 ⭐ 이모지(Material Symbols star)로 표시.
 *   - 빈 결과 시 안내 메시지.
 *
 * 디자인: var(--color-*) + Material Symbols + border-radius 4px.
 */

// 풀 한 건(드롭다운 아이템) 타입. pool id + referee id + 표시용 메타.
export type RefereePickerPool = {
  id: string; // pool id (BigInt은 JSON으로 오므로 string)
  referee_id: string;
  name: string;
  level?: string;
  is_chief?: boolean;
};

// 컴포넌트 props
export type RefereePickerProps = {
  pools: RefereePickerPool[]; // 선택 후보 (일자별 선정 풀)
  excludeRefereeIds?: string[]; // 이미 배정된 심판 referee_id (드롭다운 비활성화)
  onSelect: (pool: {
    id: string;
    referee_id: string;
    name: string;
  }) => void; // 선택 시 콜백 (pool id + referee id + 이름)
  value?: string; // 현재 선택된 pool id (수정 모드)
  placeholder?: string;
};

export default function RefereePicker({
  pools,
  excludeRefereeIds = [],
  onSelect,
  value,
  placeholder = "심판 이름으로 검색",
}: RefereePickerProps) {
  // 검색어(필터링 기준) — input에 표시되는 텍스트를 겸함
  const [query, setQuery] = useState("");
  // 드롭다운 open 상태
  const [open, setOpen] = useState(false);
  // 루트 div ref — 외부 클릭 감지용
  const rootRef = useRef<HTMLDivElement | null>(null);

  // 이미 선택된 pool이 있으면 해당 이름을 input 기본값으로 (수정모드 진입 시)
  // 이유: 부모가 value로 pool id를 넘기면, 첫 렌더에서 이름을 띄워 주는 게 자연스럽다.
  useEffect(() => {
    if (value) {
      const found = pools.find((p) => p.id === value);
      if (found) setQuery(found.name);
    }
  }, [value, pools]);

  // 외부 클릭 감지: 루트 밖을 클릭하면 드롭다운 닫기
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  // ESC로 닫기
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  // 필터링 — 이름에 검색어가 포함되는 풀만.
  // 대소문자 무시, 공백 트림.
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return pools;
    return pools.filter((p) => p.name.toLowerCase().includes(q));
  }, [pools, query]);

  // 비활성화 판정용 Set — excludeRefereeIds를 O(1) 조회로 변환
  const excludedSet = useMemo(
    () => new Set(excludeRefereeIds),
    [excludeRefereeIds]
  );

  // 선택 핸들러 — 부모 콜백 호출 후 닫기
  const handleSelect = (pool: RefereePickerPool) => {
    onSelect({ id: pool.id, referee_id: pool.referee_id, name: pool.name });
    setQuery(pool.name);
    setOpen(false);
  };

  return (
    <div className="relative" ref={rootRef}>
      {/* 검색 입력 — search 아이콘 + 실시간 필터링 */}
      <div
        className="flex items-center gap-2 px-3 py-2"
        style={{
          backgroundColor: "var(--color-surface)",
          border: "1px solid var(--color-border)",
          borderRadius: 4,
        }}
      >
        <span
          className="material-symbols-outlined text-lg"
          style={{ color: "var(--color-text-muted)" }}
        >
          search
        </span>
        <input
          type="text"
          value={query}
          placeholder={placeholder}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true); // 타이핑 시작 시 드롭다운 열기
          }}
          onFocus={() => setOpen(true)}
          className="flex-1 bg-transparent text-sm outline-none"
          style={{ color: "var(--color-text-primary)" }}
        />
        {/* 닫기/지우기 버튼 — 입력값이 있을 때만 */}
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setOpen(true);
            }}
            className="material-symbols-outlined text-base"
            style={{ color: "var(--color-text-muted)" }}
            title="지우기"
          >
            close
          </button>
        )}
      </div>

      {/* 드롭다운 리스트 — open 상태일 때만 */}
      {open && (
        <div
          className="absolute z-40 mt-1 w-full max-h-72 overflow-y-auto"
          style={{
            backgroundColor: "var(--color-background)",
            border: "1px solid var(--color-border)",
            borderRadius: 4,
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
          }}
        >
          {filtered.length === 0 ? (
            <div
              className="py-6 text-center text-xs"
              style={{ color: "var(--color-text-muted)" }}
            >
              해당하는 심판이 없습니다
            </div>
          ) : (
            <ul className="py-1">
              {filtered.map((p) => {
                const disabled = excludedSet.has(p.referee_id);
                return (
                  <li key={p.id}>
                    <button
                      type="button"
                      disabled={disabled}
                      onClick={() => handleSelect(p)}
                      className="w-full text-left flex items-center gap-2 px-3 py-2 text-sm"
                      style={{
                        // 비활성화는 어둡게 + 커서 금지, 활성화는 호버 가능
                        backgroundColor:
                          value === p.id
                            ? "color-mix(in srgb, var(--color-primary) 10%, transparent)"
                            : "transparent",
                        color: disabled
                          ? "var(--color-text-muted)"
                          : "var(--color-text-primary)",
                        opacity: disabled ? 0.6 : 1,
                        cursor: disabled ? "not-allowed" : "pointer",
                      }}
                    >
                      {/* 책임자 ⭐ 아이콘 (is_chief) */}
                      {p.is_chief && (
                        <span
                          className="material-symbols-outlined text-base"
                          style={{ color: "var(--color-primary)" }}
                          title="책임자"
                        >
                          star
                        </span>
                      )}
                      <span className="font-semibold flex-1 truncate">
                        {p.name}
                      </span>
                      {/* 등급 뱃지 */}
                      {p.level && (
                        <span
                          className="px-1.5 py-0.5 text-[10px] font-bold"
                          style={{
                            backgroundColor:
                              "color-mix(in srgb, var(--color-text-muted) 15%, transparent)",
                            color: "var(--color-text-secondary)",
                            borderRadius: 4,
                          }}
                        >
                          {p.level}
                        </span>
                      )}
                      {/* 이미 배정됨 뱃지 */}
                      {disabled && (
                        <span
                          className="px-1.5 py-0.5 text-[10px] font-bold"
                          style={{
                            backgroundColor:
                              "color-mix(in srgb, var(--color-primary) 15%, transparent)",
                            color: "var(--color-primary)",
                            borderRadius: 4,
                          }}
                        >
                          이미 배정됨
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
