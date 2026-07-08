import Link from "next/link";
import { FiMessageSquare } from "react-icons/fi";
import { Badge } from "../../../components/Badge";
import { SectionCard } from "./SectionCard";

export const TeamOverview = ({ members = [] }) => (
  <SectionCard
    title="Team Overview"
    action={
      <Badge variant="primary" size="sm">
        12 Online
      </Badge>
    }
  >
    {members.length > 0 ? (
      <div className="space-y-3">
        {members.slice(0, 3).map((member) => (
          <div
            key={member._id || member.id || member.email}
            className="flex items-center justify-between"
          >
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--color-secondary)] text-xs font-bold text-white">
                {member.name?.charAt(0)?.toUpperCase() || "U"}
              </div>
              <div className="min-w-0">
                <p className="truncate text-xs font-black text-[var(--color-text)]">
                  {member.name || member.email || "Team member"}
                </p>
                <p className="truncate text-[10px] font-semibold text-[var(--color-muted)]">
                  {member.role || "Member"}
                </p>
              </div>
            </div>
            {/* <FiMessageSquare size={14} className="text-[var(--color-muted)]" /> */}
          </div>
        ))}
        <Link
          href="/users"
          className="block pt-2 text-center text-xs font-bold text-[var(--color-primary)]"
        >
          View All Members
        </Link>
      </div>
    ) : (
      <div className="py-4 text-center text-xs font-semibold text-[var(--color-muted)]">
        No other members yet
      </div>
    )}
  </SectionCard>
);
