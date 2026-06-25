import Link from "next/link";
import {
  FiActivity,
  FiAlertTriangle,
  FiFileText,
  FiGitBranch,
  FiStar,
  FiUsers,
} from "react-icons/fi";
import { SectionCard } from "./SectionCard";

const activityMeta = {
  invite_member: {
    icon: FiUsers,
    className: "bg-green-50 text-green-600",
  },
  create_process: {
    icon: FiFileText,
    className: "bg-blue-50 text-blue-600",
  },
  update_process: {
    icon: FiFileText,
    className: "bg-blue-50 text-blue-600",
  },
  process_updated: {
    icon: FiFileText,
    className: "bg-blue-50 text-blue-600",
  },
  complete_task: {
    icon: FiStar,
    className: "bg-purple-50 text-purple-600",
  },
  workspace_invitation: {
    icon: FiGitBranch,
    className: "bg-slate-100 text-slate-600",
  },
  alert: {
    icon: FiAlertTriangle,
    className: "bg-orange-50 text-orange-600",
  },
};

const renderActivityMessage = (message = "") => {
  const quotedMatch = message.match(/"([^"]+)"/);
  if (quotedMatch) {
    const [quotedText, label] = quotedMatch;
    const [before, after] = message.split(quotedText);

    return (
      <>
        {before}
        <span className="font-bold text-[var(--color-primary)]">{label}</span>
        {after}
      </>
    );
  }

  const knownLabels = [
    "Q4 Marketing Workflow",
    "Design System",
    "Data Pipeline Alpha",
  ];
  const label = knownLabels.find((item) => message.includes(item));

  if (!label) return message;

  const [before, after] = message.split(label);
  return (
    <>
      {before}
      <span className="font-bold text-[var(--color-primary)]">{label}</span>
      {after}
    </>
  );
};

const getActivityMeta = (activity) => {
  const action = activity.action || "";
  const message = activity.message?.toLowerCase() || "";

  if (activityMeta[action]) return activityMeta[action];
  if (message.includes("updated process")) return activityMeta.update_process;
  if (message.includes("created process")) return activityMeta.create_process;
  if (message.includes("invited")) return activityMeta.invite_member;
  if (message.includes("accepted") || message.includes("invitation")) {
    return activityMeta.workspace_invitation;
  }
  if (message.includes("alert") || message.includes("security")) {
    return activityMeta.alert;
  }

  return {
    icon: FiActivity,
    className: "bg-slate-100 text-slate-600",
  };
};

export const ActivityFeed = ({ activities = [], formatTimeAgo }) => (
  <SectionCard
    title="Recent Activity"
    action={
      <Link
        href="/activity-logs"
        className="text-xs font-bold text-[var(--color-primary)] hover:text-[var(--color-primary-hover)]"
      >
        View All
      </Link>
    }
    className="h-full min-h-[380px]"
    contentClassName="px-4 py-5 sm:px-5"
  >
    {activities.length > 0 ? (
      <div className="space-y-6">
        {activities.map((activity) => {
          const meta = getActivityMeta(activity);
          const Icon = meta.icon;

          return (
            <div key={activity._id || activity.message} className="flex gap-4">
              <div
                className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${meta.className}`}
              >
                <Icon size={15} />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold leading-5 text-[var(--color-text)]">
                  {renderActivityMessage(activity.message)}
                </p>
                <p className="mt-0.5 text-xs font-semibold text-[var(--color-muted)]">
                  {formatTimeAgo?.(activity.createdAt) ||
                    activity.time ||
                    "Just now"}
                  {activity.userName ? ` - ${activity.userName}` : ""}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    ) : (
      <div className="py-12 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-bg)] text-[var(--color-muted)]">
          <FiActivity size={22} />
        </div>
        <p className="text-sm font-bold text-[var(--color-text)]">
          No recent activity
        </p>
        <p className="mt-1 text-xs text-[var(--color-muted)]">
          Workspace events will appear here.
        </p>
      </div>
    )}
  </SectionCard>
);
