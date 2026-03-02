"use client";

import Link from "next/link";

interface ProfileIncompleteModalProps {
  missingFields: string[];
  onClose: () => void;
}

export function ProfileIncompleteModal({
  missingFields,
  onClose,
}: ProfileIncompleteModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-sm rounded-[20px] bg-white p-6 shadow-xl">
        <div className="mb-4 text-center text-3xl">👤</div>
        <h3 className="mb-2 text-center text-lg font-bold text-[#111827]">
          프로필을 완성해주세요
        </h3>
        <p className="mb-4 text-center text-sm text-[#6B7280]">
          참가 신청을 위해 아래 정보를 입력해야 합니다.
        </p>
        {missingFields.length > 0 && (
          <div className="mb-4 rounded-[12px] bg-[#FFF3CD] px-4 py-3">
            <p className="text-xs font-medium text-[#856404]">미입력 항목</p>
            <p className="mt-1 text-sm text-[#856404]">
              {missingFields.join(", ")}
            </p>
          </div>
        )}
        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 rounded-[12px] border border-[#E8ECF0] py-2.5 text-sm text-[#6B7280] hover:bg-[#F5F7FA]"
          >
            나중에
          </button>
          <Link
            href="/profile/edit"
            className="flex-1 rounded-[12px] bg-[#0066FF] py-2.5 text-center text-sm font-semibold text-white hover:bg-[#0052CC]"
          >
            프로필 완성하기
          </Link>
        </div>
      </div>
    </div>
  );
}
