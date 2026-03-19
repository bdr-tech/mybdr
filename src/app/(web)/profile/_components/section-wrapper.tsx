import { type ReactNode } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

interface SectionWrapperProps {
  title: string;
  href?: string;
  children: ReactNode;
  emptyText?: string;
  isEmpty?: boolean;
}

export function SectionWrapper({ title, href, children, emptyText, isEmpty }: SectionWrapperProps) {
  return (
    <div className="rounded-[20px] border border-[#E8ECF0] bg-[#FFFFFF] p-4 sm:p-5 shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
      <div className="mb-3 flex items-center justify-between">
        <h2
          className="text-base font-bold uppercase tracking-wide text-[#111827]"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          {title}
        </h2>
        {href && !isEmpty && (
          <Link
            href={href}
            className="flex items-center gap-0.5 text-xs font-medium text-[#F4A261] transition-colors hover:text-[#E8914F]"
          >
            자세히 보기
            <ChevronRight size={14} />
          </Link>
        )}
      </div>
      {isEmpty ? (
        <p className="py-4 text-center text-sm text-[#6B7280]">{emptyText ?? "데이터가 없습니다."}</p>
      ) : (
        children
      )}
    </div>
  );
}
