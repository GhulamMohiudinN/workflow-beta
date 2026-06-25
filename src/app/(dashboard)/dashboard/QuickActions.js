import Link from "next/link";
import {
  FiChevronRight,
  FiPlayCircle,
  FiSettings,
  FiUserPlus,
} from "react-icons/fi";
import { SectionCard } from "./SectionCard";

export const QuickActions = () => {
  const actions = [
    {
      href: "/processes",
      title: "Start Process",
      subtitle: "Deploy workflow template",
      icon: FiPlayCircle,
    },
    {
      href: "/users/add",
      title: "Invite Members",
      subtitle: "Add people to team",
      icon: FiUserPlus,
    },
    {
      href: "/company",
      title: "Configure Settings",
      subtitle: "Global workspace controls",
      icon: FiSettings,
    },
  ];

  return (
    <SectionCard title="Quick Actions">
      <div className="space-y-3">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.title}
              href={action.href}
              className="flex items-center justify-between rounded-lg p-2.5 transition hover:bg-[var(--color-surface-hover)]"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--color-bg)] text-[var(--color-muted)]">
                  <Icon size={16} />
                </div>
                <div>
                  <p className="text-xs font-black text-[var(--color-text)]">
                    {action.title}
                  </p>
                  <p className="text-[10px] font-semibold text-[var(--color-muted)]">
                    {action.subtitle}
                  </p>
                </div>
              </div>
              <FiChevronRight size={15} className="text-[var(--color-faint)]" />
            </Link>
          );
        })}
      </div>
    </SectionCard>
  );
};
