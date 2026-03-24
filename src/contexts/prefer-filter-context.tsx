"use client";

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import { usePathname } from "next/navigation";

// Context 타입 정의
interface PreferFilterContextType {
  preferFilter: boolean;       // true: 선호 필터 ON, false: 전체 보기
  isLoggedIn: boolean;         // 로그인 여부 (비로그인이면 preferFilter 항상 false)
  togglePreferFilter: () => void;  // ON <-> OFF 전환 (현재 페이지에서만 일시적)
  setLoggedIn: (v: boolean, preferEnabled?: boolean) => void; // 로그인 상태 + DB 선호 기본값 전달
  updatePreferDefault: (v: boolean) => void; // 선호 설정 저장 후 기본값 갱신용
}

// 기본값 (SSR 시 사용) -- false로 시작하여 hydration mismatch 방지
const PreferFilterContext = createContext<PreferFilterContextType>({
  preferFilter: false,
  isLoggedIn: false,
  togglePreferFilter: () => {},
  setLoggedIn: (_v: boolean, _preferEnabled?: boolean) => {},
  updatePreferDefault: () => {},
});

// Context 값을 읽는 커스텀 훅
export function usePreferFilter() {
  return useContext(PreferFilterContext);
}

/**
 * PreferFilterProvider
 *
 * 전역 선호 필터 상태를 관리하는 Provider.
 * - 로그인 유저: DB에 선호 설정이 있으면 preferFilter = true, 없으면 false
 * - 비로그인 유저: preferFilter = false (고정, 전환 불가)
 * - 페이지 이동 시 DB 기본값으로 복귀 (무조건 true가 아님)
 * - 상단 버튼으로 현재 페이지에서 일시적 토글 가능
 */
export function PreferFilterProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname(); // 현재 URL 경로를 감시
  const [isLoggedIn, setLoggedInState] = useState(false);
  // DB에서 가져온 선호 필터 기본값 (선호 설정이 있으면 true)
  const [preferDefault, setPreferDefault] = useState(false);
  const [preferFilter, setPreferFilter] = useState(false);

  // 페이지 이동 시 preferFilter를 DB 기본값으로 리셋 (무조건 true가 아님)
  // 상단 버튼으로 끈 것은 현재 페이지에서만 일시적 → 다른 페이지로 이동하면 기본값 복귀
  useEffect(() => {
    if (isLoggedIn) {
      setPreferFilter(preferDefault);
    }
  }, [pathname, isLoggedIn, preferDefault]);

  // 로그인 상태 + DB 선호 기본값을 함께 설정
  // preferEnabled: DB에 선호 설정(디비전 등)이 하나라도 있으면 true
  const setLoggedIn = useCallback((v: boolean, preferEnabled?: boolean) => {
    setLoggedInState(v);
    // DB에서 가져온 값을 기본값으로 저장 (전달되지 않으면 false)
    const defaultVal = v && (preferEnabled ?? false);
    setPreferDefault(defaultVal);
    setPreferFilter(defaultVal);
  }, []);

  // ON <-> OFF 전환 -- sessionStorage 저장 없이 state만 변경 (페이지 이동 시 리셋)
  const togglePreferFilter = useCallback(() => {
    if (!isLoggedIn) return; // 비로그인은 전환 불가
    setPreferFilter((prev) => !prev);
  }, [isLoggedIn]);

  // 선호 설정 저장 후 기본값을 갱신하는 함수
  // preference-form에서 저장 완료 시 호출하여 페이지 이동 시 새 기본값 적용
  const updatePreferDefault = useCallback((v: boolean) => {
    setPreferDefault(v);
    setPreferFilter(v);
  }, []);

  return (
    <PreferFilterContext.Provider value={{ preferFilter, isLoggedIn, togglePreferFilter, setLoggedIn, updatePreferDefault }}>
      {children}
    </PreferFilterContext.Provider>
  );
}
