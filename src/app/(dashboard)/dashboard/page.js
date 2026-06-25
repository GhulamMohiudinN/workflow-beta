"use client";

import { useEffect, useState } from "react";
import {
  FiAlertCircle,
  FiCheckCircle,
  FiCloud,
  FiRefreshCw,
  FiUsers,
  FiZap,
} from "react-icons/fi";
import workspaceAPI from "../../api/workspaceAPI";
import { userAPI } from "../../api/userAPI";
import {
  ActivityFeed } from "../dashboard/ActivityFeed";
import { Button } from "../../../components/Button";
import { DashboardActions } from "./DashboardActions";
import { DashboardMetricCard } from "./DashboardMetricCard";
import { QuickActions } from "./QuickActions";
import { TeamOverview } from "./TeamOverview";

const formatTimeAgo = (dateString) => {
  if (!dateString) return "Just now";

  const now = new Date();
  const past = new Date(dateString);
  const diffInMs = now - past;
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInMinutes < 1) return "Just now";
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  if (diffInHours < 24) return `${diffInHours}h ago`;
  if (diffInDays === 1) return "Yesterday";

  return past.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

const safeCount = (value) => value || 0;

export default function DashboardPage() {
  const [workspace, setWorkspace] = useState(null);
  const [role, setRole] = useState(null);
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [recentMembers, setRecentMembers] = useState([]);

  useEffect(() => {
    const initDashboard = async () => {
      try {
        setLoading(true);
        setError(null);

        const storedUser = localStorage.getItem("user");
        const storedRole = localStorage.getItem("role");
        const storedWorkspace = localStorage.getItem("workspace");

        setRole(storedRole);
        if (storedWorkspace) setWorkspace(JSON.parse(storedWorkspace));

        const overviewData = await workspaceAPI.getWorkspaceOverview();
        if (overviewData?.success || overviewData?.isSuccess) {
          setOverview(overviewData);
        } else {
          throw new Error(
            overviewData?.error ||
              overviewData?.message ||
              "Failed to fetch overview data",
          );
        }

        try {
          const usersData = await userAPI.getWorkspaceUsers({ limit: 10 });
          const allUsers =
            usersData?.users || usersData?.members || usersData?.data || [];
          const currentUser = storedUser ? JSON.parse(storedUser) : {};

          setRecentMembers(
            allUsers
              .filter(
                (member) =>
                  member.role !== "admin" &&
                  member.role !== "superadmin" &&
                  member._id !== currentUser._id,
              )
              .slice(0, 3),
          );
        } catch (memberError) {
          console.error("Failed to load workspace members", memberError);
        }
      } catch (dashboardError) {
        console.error("Dashboard initialization error:", dashboardError);
        setError("Unable to load latest dashboard metrics. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    initDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center">
        <div className="mb-4 h-11 w-11 animate-spin rounded-full border-2 border-[var(--color-border)] border-t-[var(--color-primary)]" />
        <p className="text-sm font-semibold text-[var(--color-muted)]">
          Preparing your command center...
        </p>
      </div>
    );
  }

  if (error && !overview) {
    return (
      <div className="mx-auto max-w-lg py-12 text-center">
        <div className="app-card p-8">
          <FiAlertCircle className="mx-auto mb-4 h-11 w-11 text-red-500" />
          <h2 className="text-xl font-black text-[var(--color-text)]">
            Something went wrong
          </h2>
          <p className="mt-2 text-sm text-[var(--color-muted)]">{error}</p>
          <Button
            onClick={() => window.location.reload()}
            className="mt-6"
            icon={FiRefreshCw}
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const membersTotal = safeCount(overview?.members?.total);
  const activeProcesses = safeCount(overview?.processes?.active?.total);
  const pendingTasks = safeCount(overview?.processes?.pending?.total);
  const workspaceName = workspace?.name || "Alex";

  const activities =
    overview?.recentActivities?.length > 0
      ? overview.recentActivities
      : [
          {
            _id: "fallback-1",
            action: "create_process",
            message: "Jordan Smith published a new version of Q4 Marketing Workflow.",
            time: "2 minutes ago",
          },
          {
            _id: "fallback-2",
            action: "invite_member",
            message: "Sarah Chen joined the Design System team.",
            time: "45 minutes ago",
          },
          {
            _id: "fallback-3",
            action: "complete_task",
            message: "Automated task completed optimization on Data Pipeline Alpha.",
            time: "2 hours ago",
          },
        ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-black text-[var(--color-text)]">
            Command Center Overview
          </h1>
          <p className="mt-1 text-sm font-medium text-[var(--color-muted)]">
            Good morning, {workspaceName}. Here is what is happening in your
            workspace today.
          </p>
        </div>
        <DashboardActions role={role} />
      </div>

      {overview?.fallback && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
          Limited metrics are shown because your role cannot access the full
          workspace overview endpoint.
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <DashboardMetricCard
          title="Total Members"
          value={membersTotal.toLocaleString()}
          detail="+2% this month"
          icon={FiUsers}
          tone="primary"
          chart="line"
          chartValues={[14, 30, 42, 34, 27, 38, 50, 43]}
        />
        <DashboardMetricCard
          title="Active Workflows"
          value={activeProcesses}
          detail={`${pendingTasks} pending tasks`}
          icon={FiZap}
          tone="secondary"
          chart="progress"
          progress={Math.min(100, Math.max(16, activeProcesses * 8 + 42))}
        />
        <DashboardMetricCard
          title="System Uptime"
          value="99.98%"
          detail="Operational"
          icon={FiCheckCircle}
          tone="success"
          chart="bars"
          chartValues={[42, 66, 58, 76, 70, 84]}
        />
        <DashboardMetricCard
          title="Resource Load"
          value={`${Math.min(100, pendingTasks * 7 + 35)}%`}
          detail="Capacity"
          icon={FiCloud}
          tone="warning"
          chart="line"
          chartValues={[42, 48, 39, 34, 40, 31, 45]}
        />
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        <ActivityFeed activities={activities} formatTimeAgo={formatTimeAgo} />
        <div className="space-y-5">
          <QuickActions />
          <TeamOverview members={recentMembers} />
        </div>
      </div>
    </div>
  );
}
