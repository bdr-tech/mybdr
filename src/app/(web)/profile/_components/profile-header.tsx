import Image from "next/image";
import Link from "next/link";
import { Settings } from "lucide-react";

interface ProfileHeaderProps {
  nickname: string | null;
  email: string;
  profileImageUrl: string | null;
}

export function ProfileHeader({ nickname, email, profileImageUrl }: ProfileHeaderProps) {
  const displayName = nickname ?? "사용자";
  const initial = displayName.trim()[0]?.toUpperCase() || "U";

  return (
    <div className="relative rounded-[20px] border border-[#E8ECF0] bg-[#FFFFFF] p-5 shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
      <Link
        href="/profile/edit"
        className="absolute right-4 top-4 rounded-full p-1.5 text-[#9CA3AF] transition-colors hover:bg-[#F9FAFB] hover:text-[#1B3C87]"
      >
        <Settings size={18} />
      </Link>
      <div className="flex items-center gap-4">
        {profileImageUrl ? (
          <Image
            src={profileImageUrl}
            alt={displayName}
            width={72}
            height={72}
            className="h-[72px] w-[72px] flex-shrink-0 rounded-full object-cover ring-2 ring-[#F4A261]/40"
          />
        ) : (
          <div className="flex h-[72px] w-[72px] flex-shrink-0 items-center justify-center rounded-full bg-[#1B3C87] text-2xl font-bold text-white ring-2 ring-[#1B3C87]/30">
            {initial}
          </div>
        )}
        <div className="min-w-0 flex-1 pr-6">
          <h1
            className="truncate text-2xl font-extrabold uppercase tracking-wide text-[#111827] sm:text-3xl"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            {displayName}
          </h1>
          <p className="truncate text-sm text-[#6B7280]">{email}</p>
        </div>
      </div>
    </div>
  );
}
