"use client";

import { Card } from "@/components/ui/card";
import { useState, useTransition } from "react";
import { clearCacheAction, toggleMaintenanceModeAction } from "@/app/actions/admin-settings";

export default function AdminSettingsPage() {
  const [maintenanceEnabled, setMaintenanceEnabled] = useState(false);
  const [cacheMsg, setCacheMsg] = useState<string | null>(null);
  const [maintenanceMsg, setMaintenanceMsg] = useState<string | null>(null);
  const [isPendingCache, startCacheTransition] = useTransition();
  const [isPendingMaintenance, startMaintenanceTransition] = useTransition();

  function handleCacheClear() {
    setCacheMsg(null);
    startCacheTransition(async () => {
      const res = await clearCacheAction();
      setCacheMsg(res.message);
      setTimeout(() => setCacheMsg(null), 3000);
    });
  }

  function handleMaintenanceToggle() {
    setMaintenanceMsg(null);
    startMaintenanceTransition(async () => {
      const res = await toggleMaintenanceModeAction();
      setMaintenanceEnabled(res.enabled);
      setMaintenanceMsg(res.enabled ? "점검 모드가 활성화되었습니다." : "점검 모드가 해제되었습니다.");
      setTimeout(() => setMaintenanceMsg(null), 3000);
    });
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">시스템 설정</h1>
      <div className="space-y-4">

        {/* 점검 모드 */}
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold">점검 모드</h3>
              <p className="text-sm text-[#6B7280]">사이트를 점검 모드로 전환합니다. 일반 유저 접근이 차단됩니다.</p>
              {maintenanceMsg && (
                <p className={`mt-1 text-sm font-medium ${maintenanceEnabled ? "text-[#F59E0B]" : "text-[#0066FF]"}`}>
                  {maintenanceMsg}
                </p>
              )}
            </div>
            <button
              onClick={handleMaintenanceToggle}
              disabled={isPendingMaintenance}
              className={`min-w-[80px] rounded-full px-4 py-2 text-sm font-semibold transition-colors disabled:opacity-50 ${
                maintenanceEnabled
                  ? "bg-[rgba(239,68,68,0.1)] text-[#EF4444] hover:bg-[rgba(239,68,68,0.2)]"
                  : "bg-[#EF4444] text-white hover:bg-[#DC2626]"
              }`}
            >
              {isPendingMaintenance ? "처리중..." : maintenanceEnabled ? "비활성화" : "활성화"}
            </button>
          </div>
        </Card>

        {/* 캐시 초기화 */}
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold">캐시 초기화</h3>
              <p className="text-sm text-[#6B7280]">전체 페이지 캐시를 초기화합니다. 잠시 응답 속도가 느려질 수 있습니다.</p>
              {cacheMsg && (
                <p className="mt-1 text-sm font-medium text-[#0066FF]">{cacheMsg}</p>
              )}
            </div>
            <button
              onClick={handleCacheClear}
              disabled={isPendingCache}
              className="rounded-full border border-[#E8ECF0] bg-[#F5F7FA] px-4 py-2 text-sm font-semibold text-[#374151] transition-colors hover:bg-[#E8ECF0] disabled:opacity-50"
            >
              {isPendingCache ? "초기화중..." : "실행"}
            </button>
          </div>
        </Card>

      </div>
    </div>
  );
}
