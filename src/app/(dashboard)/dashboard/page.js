"use client";
export const dynamic = "force-dynamic";
import Link from "next/link";
import { socket } from "../../utils/socket";
import { useState, useEffect } from "react";
import api from "../../api/axios";
import workspaceAPI from "../../api/workspaceAPI";
import { userAPI } from "../../api/userAPI";
import {
  FiUsers,
  FiLayers,
  FiTrendingUp,
  FiClock,
  FiUserPlus,
  FiActivity,
  FiCheckCircle,
  FiAlertCircle,
  FiPlus,
  FiChevronRight,
  FiBarChart2,
  FiCalendar,
  FiEye,
  FiEdit,
  FiSettings,
  FiRefreshCw,
} from "react-icons/fi";

const formatTimeAgo = (dateString) => {
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

const getActivityIcon = (action) => {
  switch (action) {
    case "invite_member":
      return <FiUserPlus className="h-5 w-5 text-blue-600" />;
    case "create_process":
      return <FiLayers className="h-5 w-5 text-purple-600" />;
    case "update_process":
      return <FiEdit className="h-5 w-5 text-amber-600" />;
    case "complete_task":
      return <FiCheckCircle className="h-5 w-5 text-green-600" />;
    default:
      return <FiActivity className="h-5 w-5 text-gray-600" />;
  }
};

const getActivityBgColor = (action) => {
  switch (action) {
    case "invite_member":
      return "bg-blue-100";
    case "create_process":
      return "bg-purple-100";
    case "update_process":
      return "bg-amber-100";
    case "complete_task":
      return "bg-green-100";
    default:
      return "bg-gray-100";
  }
};

export default function DashboardPage() {
  const [workspace, setWorkspace] = useState(null);
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [recentMembers, setRecentMembers] = useState([]);

  useEffect(() => {
    const initDashboard = async () => {
      try {
        setLoading(true);
        const storedUser = localStorage.getItem("user");
        const storedRole = localStorage.getItem("role");
        const storedWorkspace = localStorage.getItem("workspace");

        if (storedUser && storedRole && storedWorkspace) {
          setUser(JSON.parse(storedUser));
          setRole(storedRole);
          setWorkspace(JSON.parse(storedWorkspace));
        }

        // Fetch Overview Data
        const overviewData = await workspaceAPI.getWorkspaceOverview();
        console.info("Dashboard overview payload:", overviewData);
        if (overviewData?.success || overviewData?.isSuccess) {
          setOverview(overviewData);
        } else {
          throw new Error(
            overviewData?.error ||
              overviewData?.message ||
              "Failed to fetch overview data",
          );
        }

        // Fetch Recent Non-Admin Members (Senior level dynamic retrieval)
        try {
          const usersData = await userAPI.getWorkspaceUsers({ limit: 10 });
          const allUsers =
            usersData?.users || usersData?.members || usersData?.data || [];

          let parsedUser = {};
          if (storedUser) parsedUser = JSON.parse(storedUser);

          const filteredMembers = allUsers
            .filter(
              (u) =>
                u.role !== "admin" &&
                u.role !== "superadmin" &&
                u._id !== parsedUser._id,
            )
            .slice(0, 2);

          setRecentMembers(filteredMembers);
        } catch (err) {
          console.error("Failed to load workspace members for side panel", err);
        }
      } catch (err) {
        console.error("Dashboard Initialization Error:", err);
        setError("Unable to load latest dashboard metrics. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    initDashboard();
  }, []);

  const getRoleColor = (role) => {
    switch (role) {
      case "admin":
        return "bg-red-100 text-red-800";
      case "editor":
        return "bg-blue-100 text-blue-800";
      case "viewer":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="py-12 flex flex-col items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mb-4"></div>
        <p className="text-gray-500 font-medium">Preparing your workspace...</p>
      </div>
    );
  }

  if (error && !overview) {
    return (
      <div className="py-12 px-4 max-w-lg mx-auto text-center">
        <div className="bg-red-50 p-6 rounded-2xl border border-red-100">
          <FiAlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Something went wrong
          </h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <FiRefreshCw className="mr-2" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  const workspaceName = workspace?.name || "Your Workspace";

  return (
    <div className="py-6">
      {/* Welcome Banner */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Welcome to {workspaceName}
            </h1>
            <p className="text-gray-600 mt-2">
              Manage your team, create processes, and optimize workflows
            </p>
          </div>
          {role !== "viewer" && (
            <div className="mt-4 md:mt-0 flex space-x-3">
              <Link
                href="/users/add"
                className="inline-flex items-center px-4 py-3 bg-linear-to-r from-amber-500 to-amber-600 text-white rounded-lg hover:from-amber-600 hover:to-amber-700 transition-all duration-200 shadow-lg shadow-amber-500/25"
              >
                <FiUserPlus className="mr-2 h-5 w-5" />
                Add Team Member
              </Link>
              <Link
                href="/processes"
                className=" inline-flex items-center px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:border-amber-300 hover:text-amber-600 transition-all duration-200"
              >
                <FiPlus className="mr-2 h-5 w-5" />
                New Process
              </Link>
            </div>
          )}
        </div>
      </div>

      {overview?.fallback && (
        <div className="mb-8 rounded-2xl border border-amber-100 bg-amber-50 px-6 py-4 text-sm text-amber-800">
          Limited dashboard metrics are shown because your current role does not
          have permission to access the standard workspace overview endpoint.
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-2xl border border-amber-100 p-6 shadow-sm hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Team Members</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {overview?.members?.total || 0}
              </p>
            </div>
            <div className="bg-amber-100 p-3 rounded-lg">
              <FiUsers className="h-6 w-6 text-amber-600" />
            </div>
          </div>
          <div className="mt-4">
            <Link
              href="/users"
              className="inline-flex items-center text-sm text-amber-600 hover:text-amber-700 font-medium"
            >
              View all members
              <FiChevronRight className="ml-1 h-4 w-4" />
            </Link>
          </div>
        </div>

        <div className=" bg-white rounded-2xl border border-amber-100 p-6 shadow-sm hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Active Processes
              </p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {overview?.processes?.active?.total || 0}
              </p>
            </div>
            <div className="bg-blue-100 p-3 rounded-lg">
              <FiLayers className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-4">
            <Link
              href="/processes"
              className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              View processes
              <FiChevronRight className="ml-1 h-4 w-4" />
            </Link>
          </div>
        </div>

        <div className=" bg-white rounded-2xl border border-amber-100 p-6 shadow-sm hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending Tasks</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {overview?.processes?.pending?.total || 0}
              </p>
            </div>
            <div className="bg-yellow-100 p-3 rounded-lg">
              <FiClock className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center text-sm text-yellow-600 font-medium">
              <FiAlertCircle className="h-4 w-4 mr-1" />
              <span>Awaiting action</span>
            </div>
          </div>
        </div>

        <div className=" bg-white rounded-2xl border border-amber-100 p-6 shadow-sm hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Completed Processes
              </p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {overview?.processes?.completed?.total || 0}
              </p>
            </div>
            <div className="bg-green-100 p-3 rounded-lg">
              <FiCheckCircle className="h-6 w-6 text-green-600" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center text-sm text-green-600 font-medium">
              <FiTrendingUp className="h-4 w-4 mr-1" />
              <span>Track progress</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Activity */}
        <div className="lg:col-span-2 shadow-sm bg-white rounded-2xl border border-amber-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-amber-100 flex justify-between items-center bg-white">
            <h2 className="text-lg font-semibold text-gray-900">
              Recent Activity
            </h2>
            <Link
              href="/activity-logs"
              className="text-sm text-amber-600 hover:text-amber-700 font-medium"
            >
              View all logs
            </Link>
          </div>
          <div className="p-6">
            {overview?.recentActivities?.length > 0 ? (
              <div className="space-y-6">
                {overview.recentActivities.map((activity) => (
                  <div
                    key={activity._id}
                    className="flex items-start space-x-4"
                  >
                    <div
                      className={`p-2.5 rounded-xl ${getActivityBgColor(activity.action)}`}
                    >
                      {getActivityIcon(activity.action)}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-800 leading-tight">
                        {activity.message}
                      </p>
                      <div className="flex items-center mt-1.5 space-x-2">
                        <span className="text-xs text-gray-400">
                          {formatTimeAgo(activity.createdAt)}
                        </span>
                        {activity.userName && (
                          <>
                            <span className="text-gray-300">•</span>
                            <span className="text-xs text-amber-600 font-medium">
                              {activity.userName}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="bg-gray-50 rounded-full h-16 w-16 flex items-center justify-center mx-auto mb-4">
                  <FiActivity className="h-8 w-8 text-gray-400" />
                </div>
                <p className="text-gray-500 font-medium">
                  No recent activity found
                </p>
                <p className="text-sm text-gray-400 mt-1">
                  Activities will appear here as you work
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Side Panel: Team & Quick Actions */}
        <div className="space-y-6">
          {/* Team Overview */}
          <div className="bg-white rounded-2xl border border-amber-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-amber-100 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900">
                Team Members
              </h2>
              <Link
                href="/users"
                className="text-sm text-amber-600 hover:text-amber-700 font-medium"
              >
                See All
              </Link>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {recentMembers.length > 0 ? (
                  recentMembers.map((member) => {
                    return (
                      <div
                        key={member._id || member.id}
                        className="flex items-center justify-between p-2 rounded-xl transition-all duration-200 hover:bg-gray-50 group"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="shrink-0 relative">
                            {member.profilePicture ? (
                              <img
                                src={member.profilePicture}
                                alt={member.name}
                                className="h-10 w-10 rounded-full object-cover ring-2 ring-white shadow-sm"
                              />
                            ) : (
                              <div className="h-10 w-10 rounded-full bg-linear-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white font-bold text-sm shadow-sm group-hover:shadow-md transition-shadow">
                                {member.name?.charAt(0).toUpperCase()}
                              </div>
                            )}
                            <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 bg-green-500 border-2 border-white rounded-full"></div>
                          </div>

                          <div className="overflow-hidden">
                            <p className="text-sm font-semibold text-gray-900 truncate max-w-[120px]">
                              {member.name}
                            </p>
                            <span
                              className={`text-[10px] uppercase font-bold tracking-tight px-2 py-0.5 rounded-md inline-block mt-0.5 ${getRoleColor(
                                member.role,
                              )}`}
                            >
                              {member.role}
                            </span>
                          </div>
                        </div>

                        <FiChevronRight className="h-4 w-4 text-gray-300" />
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-4 bg-gray-50 rounded-xl">
                    <p className="text-xs text-gray-500">
                      No other members yet
                    </p>
                  </div>
                )}

                <Link
                  href="/users/add"
                  className="flex items-center justify-center w-full p-3 border-2 border-dashed border-gray-200 rounded-xl text-gray-500 hover:text-amber-600 hover:border-amber-300 hover:bg-amber-50/30 transition-all duration-200 group"
                >
                  <FiPlus className="mr-2 h-4 w-4 group-hover:scale-110 transition-transform" />
                  <span className="text-sm font-medium">
                    Invite team member
                  </span>
                </Link>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-3xl p-7 text-gray-900 shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 -mr-12 -mt-12 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl group-hover:bg-amber-500/20 transition-all duration-500"></div>

            <h3 className="text-lg font-bold mb-5 flex items-center">
              <FiSettings className="mr-2 text-amber-400 animate-pulse-slow" />
              Quick Actions
            </h3>

            <div className="space-y-3 relative z-10">
              <Link
                href="/users/add"
                className="flex items-center justify-between p-3.5  backdrop-blur-md rounded-2xl transition-all duration-300 border hover:border-amber-600 border-amber-200"
              >
                <div className="flex items-center">
                  <div className="h-9 w-9 rounded-xl bg-amber-500/20 flex items-center justify-center mr-3">
                    <FiUserPlus className="h-4.5 w-4.5 text-amber-400" />
                  </div>
                  <span className="text-sm font-medium">Invite member</span>
                </div>
                <FiChevronRight className="h-4 w-4 opacity-50" />
              </Link>

              <Link
                href="/processes"
                className="flex items-center justify-between p-3.5 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-2xl transition-all duration-300 border hover:border-amber-600 border-amber-200"
              >
                <div className="flex items-center">
                  <div className="h-9 w-9 rounded-xl bg-blue-500/20 flex items-center justify-center mr-3">
                    <FiLayers className="h-4.5 w-4.5 text-blue-400" />
                  </div>
                  <span className="text-sm font-medium">Start process</span>
                </div>
                <FiChevronRight className="h-4 w-4 opacity-50" />
              </Link>

              <Link
                href="/company"
                className="flex items-center justify-between p-3.5 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-2xl transition-all duration-300 border hover:border-amber-600 border-amber-200 "
              >
                <div className="flex items-center">
                  <div className="h-9 w-9 rounded-xl bg-purple-500/20 flex items-center justify-center mr-3">
                    <FiSettings className="h-4.5 w-4.5 text-purple-400" />
                  </div>
                  <span className="text-sm font-medium">Settings</span>
                </div>
                <FiChevronRight className="h-4 w-4 opacity-50" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
