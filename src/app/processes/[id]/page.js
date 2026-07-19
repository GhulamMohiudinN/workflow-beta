"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { processAPI } from "../../api/processAPI";
import { userAPI } from "../../api/userAPI";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  FiArrowLeft,
  FiLayers,
  FiClock,
  FiDollarSign,
  FiTag,
  FiZap,
  FiAlertCircle,
  FiDownload,
  FiCopy,
  FiSettings,
  FiEdit2,
  FiUsers,
  FiInfo,
  FiPlus,
  FiMinus,
  FiMaximize,
  FiMinimize,
  FiChevronDown,
  FiChevronUp,
  FiEye,
  FiUser,
  FiCalendar,
  FiFileText,
  FiLink,
  FiCheckCircle,
  FiMoreVertical,
} from "react-icons/fi";
import { RxDragHandleDots1 } from "react-icons/rx";

function SortableItem({
  activity,
  onClick,
  getStatusColor,
  getStatusText,
  showTimeframe,
  showTags,
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: activity.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="relative flex items-start gap-4"
    >
      <div className="relative z-10">
        <div
          className={`w-12 h-12 rounded-full flex items-center justify-center shadow-md cursor-pointer transition-all hover:scale-105 ${activity.status === "completed" ? "bg-emerald-500" : activity.status === "in-progress" || activity.status === "inprogress" ? "bg-cyan-600" : "bg-slate-300"}`}
          onClick={() => onClick(activity)}
        >
          {activity.status === "completed" ? (
            <FiCheckCircle className="h-6 w-6 text-white" />
          ) : (
            <span className="text-white font-semibold">
              {activity.sequenceNo}
            </span>
          )}
        </div>
      </div>
      <div
        className="flex-1 bg-white border border-slate-200 rounded-xl p-4 cursor-pointer hover:shadow-md transition-all hover:border-cyan-200"
        onClick={() => onClick(activity)}
      >
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-gray-900">{activity.name}</h3>
              <span
                className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(activity.status)}`}
              >
                {getStatusText(activity.status)}
              </span>
              {activity.automation && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-100 text-cyan-700 flex items-center gap-1">
                  <FiZap className="h-3 w-3" />
                  AI Auto
                </span>
              )}
            </div>
            <p className="text-sm text-gray-600">{activity.description}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              {...attributes}
              {...listeners}
              className="p-1 text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing"
              title="Drag to reorder"
            >
              <div className="flex flex-col space-y-0.5">
                <RxDragHandleDots1 className="h-6 w-6 text-gray-400 hover:text-cyan-600" />
              </div>
            </button>
            <FiEye className="h-5 w-5 text-gray-400 hover:text-cyan-600" />
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-4 mt-3 pt-3 border-t border-gray-100">
          <div className="flex items-center gap-1.5 text-sm text-gray-600">
            <FiUser className="h-4 w-4" />
            <span>{activity.assignee}</span>
          </div>
          <div className="flex items-center gap-1.5 text-sm text-gray-600">
            <FiClock className="h-4 w-4" />
            <span>{activity.timeEstimate}</span>
          </div>
          {showTimeframe && (
            <div className="flex items-center gap-1.5 text-sm text-gray-600">
              <FiDollarSign className="h-4 w-4" />
              <span>${activity.cost}</span>
            </div>
          )}
          {showTags &&
            activity.tags.map((tag) => (
              <div
                key={tag}
                className="flex items-center gap-1.5 text-xs bg-gray-100 px-2 py-1 rounded-full"
              >
                <FiTag className="h-3 w-3" />
                <span>{tag}</span>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}

export default function ProcessDetailPage() {
  const { id } = useParams();
  const [process, setProcess] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [users, setUsers] = useState([]);
  const [showTimeframe, setShowTimeframe] = useState(false);
  const [showTags, setShowTags] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [expandedSections, setExpandedSections] = useState({
    summary: true,
    changeLog: true,
    documents: true,
    costs: true,
    systems: true,
  });
  const [viewMode, setViewMode] = useState("timeline"); // timeline, list, grid

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      setProcess((prevProcess) => {
        const oldIndex = prevProcess.activities.findIndex(
          (activity) => activity.id === active.id,
        );
        const newIndex = prevProcess.activities.findIndex(
          (activity) => activity.id === over.id,
        );

        const newActivities = arrayMove(
          prevProcess.activities,
          oldIndex,
          newIndex,
        );

        const updatedActivities = newActivities.map((activity, index) => ({
          ...activity,
          sequenceNo: index + 1,
        }));

        return {
          ...prevProcess,
          activities: updatedActivities,
          steps: updatedActivities.length,
        };
      });
    }
  };

  const formatDate = useCallback((dateString) => {
    if (!dateString) return "Never";
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  }, []);

  const getCategoryColor = useCallback((category) => {
    const colors = {
      Onboarding: "bg-cyan-600",
      HR: "bg-violet-500",
      Finance: "bg-emerald-500",
      IT: "bg-sky-600",
      Marketing: "bg-rose-500",
      Sales: "bg-indigo-500",
      Operations: "bg-teal-600",
      "Customer Support": "bg-red-500",
      Legal: "bg-slate-500",
    };
    return colors[category] || "bg-gray-500";
  }, []);

  const transformProcessData = useCallback((apiData, users = []) => {
    if (!apiData) return null;

    const activities = (apiData.steps || []).map((step, index) => {
      let assigneeName = "Unassigned";
      if (typeof step.assignee === "string") {
        const user = users.find(
          (u) => u._id === step.assignee || u.id === step.assignee,
        );
        assigneeName = user ? user.name : step.assignee;
      } else if (step.assignee?.name) {
        assigneeName = step.assignee.name;
      }
      const assigneeAvatar = assigneeName
        ? assigneeName.substring(0, 2).toUpperCase()
        : "UN";

      return {
        id: step._id || step.id || `step-${index}`,
        name: step.title || `Step ${index + 1}`,
        description: step.description || "",
        type: "activity",
        assignee: assigneeName,
        assigneeAvatar,
        timeEstimate: step.timeEstimate || "TBD",
        cost: Math.floor(Math.random() * 100) + 20, 
        tags: step.tags || [],
        automation: false,
        notes: step.notes || "",
        faq: step.description || "",
        status: step.status || "pending",
        dueDate: step.dueDate || new Date().toISOString().split("T")[0],
        sequenceNo: step.sequenceNo || index + 1,
        stepId: step._id || step.id,
      };
    });

    return {
      id: apiData._id || apiData.id,
      name: apiData.name || "Process",
      description: apiData.description || "",
      steps: apiData.steps?.length || 0,
      activities: activities,
      assignees: Array.isArray(apiData.assignees)
        ? apiData.assignees
        : Array.isArray(apiData.assignedTo)
          ? apiData.assignedTo
          : [],
      status: apiData.status || "draft",
      lastUpdated: formatDate(apiData.updatedAt),
      completion: (() => {
        const allSteps = apiData.steps || [];
        if (!allSteps.length) return 0;
        const done = allSteps.filter((s) => s.status === "completed").length;
        return Math.round((done / allSteps.length) * 100);
      })(),
      color: getCategoryColor(apiData.category),
      category: apiData.category || "",

      processExpert: (() => {
        const trail = apiData.auditTrail || [];
        const creator = trail[0];
        return (
          creator?.actorId?.name ||
          creator?.actorName ||
          users.find((u) => u._id === String(creator?.actorId))?.name ||
          "System"
        );
      })(),
      processOwner: (() => {
        const assignees = Array.isArray(apiData.assignees)
          ? apiData.assignees
          : Array.isArray(apiData.assignedTo)
            ? apiData.assignedTo
            : [];
        if (assignees.length) {
          const first = assignees[0];
          if (typeof first === "object" && first?.name) return first.name;
          const match = users.find((u) => u._id === first || u.id === first);
          return match?.name || String(first);
        }
        const stepAssignee = (apiData.steps || []).find(
          (s) => s.assignee,
        )?.assignee;
        if (stepAssignee) {
          if (typeof stepAssignee === "object" && stepAssignee?.name)
            return stepAssignee.name;
          const match = users.find(
            (u) => u._id === stepAssignee || u.id === stepAssignee,
          );
          return match?.name || "Unassigned";
        }
        return "Unassigned";
      })(),
      objective: apiData.description || "Process objective",
      nextReviewDate:
        apiData.settings?.nextReviewDate ||
        new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0],
      background: apiData.description || "Process background",
      searchKeywords: apiData.category || "process",
      leanTags: apiData.settings?.tags || ["Standard Work"],
      cycleCost: apiData.settings?.cycleCost || 0,
      annualVolume: apiData.settings?.annualVolume || 0,
      totalAnnualCost:
        (apiData.settings?.cycleCost || 0) *
        (apiData.settings?.annualVolume || 0),
      systems: apiData.settings?.systems || [],
      documents: apiData.settings?.documents || [],
      changeLog: apiData.settings?.changeLog || [],
    };
  }, [formatDate, getCategoryColor]);

  // Fetch process data from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        if (!id) {
          setError("Process ID not found");
          return;
        }

        const [userResult, processResult] = await Promise.all([
          userAPI.getWorkspaceUsers({ limit: 100 }),
          processAPI.getProcess(id),
        ]);

        if (userResult.success) {
          setUsers(userResult.users || []);
        }

        if (processResult.success && processResult.data) {
          const transformedData = transformProcessData(
            processResult.data,
            userResult.users || [],
          );
          setProcess(transformedData);
        } else {
          setError(processResult.error || "Failed to load process details");
          setProcess(null);
        }
      } catch (err) {
        console.error("Error fetching process:", err);
        setError("An unexpected error occurred. Please try again.");
        setProcess(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id, transformProcessData]);

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const zoomIn = () => {
    if (zoomLevel < 150) setZoomLevel((prev) => prev + 10);
  };

  const zoomOut = () => {
    if (zoomLevel > 70) setZoomLevel((prev) => prev - 10);
  };

  const resetZoom = () => setZoomLevel(100);

  const getStatusColor = (status) => {
    switch (status) {
      case "completed":
        return "bg-emerald-100 text-emerald-800";
      case "in-progress":
      case "inprogress":
        return "bg-cyan-100 text-cyan-800";
      case "pending":
      case "draft":
        return "bg-amber-100 text-amber-800";
      default:
        return "bg-slate-100 text-slate-800";
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "completed":
        return "Completed";
      case "in-progress":
        return "In Progress";
      case "pending":
        return "Pending";
      default:
        return status;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading process details...</p>
        </div>
      </div>
    );
  }

  if (error || !process) {
    return (
      <div className="text-center py-12">
        <div className="bg-red-50 rounded-full p-6 w-fit mx-auto mb-4">
          <FiAlertCircle className="h-12 w-12 text-red-500" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          {error || "Process not found"}
        </h3>
        <p className="text-sm text-gray-600 mb-6">
          {error
            ? "Unable to load the process details. Please try again."
            : "The process you're looking for doesn't exist."}
        </p>
        <Link
          href="/processes"
          className="text-cyan-700 hover:underline font-medium"
        >
          Back to Processes
        </Link>
      </div>
    );
  }

  return (
    <div className="-m-4 min-h-[calc(100vh-9rem)] bg-linear-to-br from-slate-50 via-cyan-50 to-emerald-50 p-4 sm:-m-6 sm:p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center">
          <Link
            href="/processes"
            className="mr-4 flex items-center text-gray-600 transition-colors hover:text-gray-900"
          >
            <span className="mr-2 flex h-8 w-8 items-center justify-center rounded-full bg-blue-200 p-1.5">
              <FiArrowLeft className="h-4 w-4" />
            </span>
          </Link>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div
                className={`${process.color} h-12 w-12 rounded-xl flex items-center justify-center shadow-lg`}
              >
                <FiLayers className="h-6 w-6 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                    {process.name}
                  </h1>
                  <span
                    className={`px-3 py-1 text-sm rounded-full font-medium ${
                      process.status === "completed"
                        ? "bg-emerald-100 text-emerald-800"
                        : process.status === "inprogress"
                          ? "bg-cyan-100 text-cyan-800"
                          : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {process.status}
                  </span>
                  {process.category && (
                    <span className="px-3 py-1 bg-teal-100 text-teal-700 text-sm rounded-full font-medium flex items-center gap-1">
                      <FiTag className="h-3.5 w-3.5" />
                      {process.category}
                    </span>
                  )}
                </div>
                <p className="text-gray-500 text-sm mt-0.5">
                  {process.description}
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href={`/processes/${process.id}/edit`}
            className="px-5 py-2.5 bg-cyan-700 text-white rounded-lg hover:bg-cyan-800 transition-all flex items-center gap-2 shadow-md shadow-cyan-700/20 hover:shadow-lg"
          >
            <FiEdit2 className="h-4 w-4" />
            Edit Process
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {/* Assigned Members */}
        <div className="bg-white/90 rounded-xl border border-cyan-100 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <FiUsers className="h-5 w-5 text-cyan-700" />
            <span className="text-xs text-gray-400">Assigned</span>
          </div>
          {process.assignees?.length ? (
            <>
              <p className="text-xl  font-bold">{process.category} Team</p>
              <p className="text-xs text-gray-500 mt-1">Team members</p>
            </>
          ) : (
            <>
              <p className="text-lg font-bold text-gray-400 mt-1">Unassigned</p>
              <p className="text-xs text-gray-400 mt-1">No members yet</p>
            </>
          )}
        </div>
        <div className="bg-white/90 rounded-xl border border-cyan-100 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <FiLayers className="h-5 w-5 text-teal-700" />
            <span className="text-xs text-gray-400">Steps</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{process.steps}</p>
          <p className="text-xs text-gray-500 mt-1">Total Activities</p>
        </div>
        <div className="bg-white/90 rounded-xl border border-cyan-100 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <FiClock className="h-5 w-5 text-emerald-700" />
            <span className="text-xs text-gray-400">Progress</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {process.completion}%
          </p>
          <div className="h-1.5 bg-gray-200 rounded-full mt-2">
            <div
              className="h-full bg-emerald-500 rounded-full"
              style={{ width: `${process.completion}%` }}
            ></div>
          </div>
        </div>
        <div className="bg-white/90 rounded-xl border border-cyan-100 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <FiCalendar className="h-5 w-5 text-slate-600" />
            <span className="text-xs text-gray-400">Updated</span>
          </div>
          <p className="text-lg font-bold text-gray-900">
            {process.lastUpdated}
          </p>
          <p className="text-xs text-gray-500 mt-1">Last modified</p>
        </div>
      </div>

      {/* Control Bar */}
      <div className="bg-white/90 rounded-xl border border-cyan-100 shadow-sm mb-6 p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode("timeline")}
                className={`px-3 py-1.5 rounded-md text-sm transition-all ${viewMode === "timeline" ? "bg-cyan-700 text-white shadow-sm" : "text-gray-600 hover:bg-gray-200"}`}
              >
                Timeline
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`px-3 py-1.5 rounded-md text-sm transition-all ${viewMode === "list" ? "bg-cyan-700 text-white shadow-sm" : "text-gray-600 hover:bg-gray-200"}`}
              >
                List View
              </button>
            </div>
            <div className="h-6 w-px bg-gray-300"></div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowTimeframe(!showTimeframe)}
                className={`px-3 py-1.5 rounded-lg text-sm flex items-center gap-1.5 transition-all ${showTimeframe ? "bg-cyan-100 text-cyan-700" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
              >
                <FiDollarSign className="h-4 w-4" />
                Show Costs
              </button>
              <button
                onClick={() => setShowTags(!showTags)}
                className={`px-3 py-1.5 rounded-lg text-sm flex items-center gap-1.5 transition-all ${showTags ? "bg-cyan-100 text-cyan-700" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
              >
                <FiTag className="h-4 w-4" />
                Show Tags
              </button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
              <button
                onClick={zoomOut}
                className="p-1.5 hover:bg-white rounded-md transition-colors"
                title="Zoom Out"
              >
                <FiMinus className="h-4 w-4" />
              </button>
              <button
                onClick={resetZoom}
                className="px-2 py-1 text-sm font-medium hover:bg-white rounded-md transition-colors"
              >
                {zoomLevel}%
              </button>
              <button
                onClick={zoomIn}
                className="p-1.5 hover:bg-white rounded-md transition-colors"
                title="Zoom In"
              >
                <FiPlus className="h-4 w-4" />
              </button>
            </div>
            <div className="h-6 w-px bg-gray-300"></div>
            <button
              className="p-2 text-gray-400 hover:text-cyan-700 transition-colors"
              title="Download Map"
            >
              <FiDownload className="h-5 w-5" />
            </button>
            <button
              className="p-2 text-gray-400 hover:text-cyan-700 transition-colors"
              title="Copy Process"
            >
              <FiCopy className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left: Activities */}
        <div className="lg:col-span-2">
          <div className="bg-white/90 rounded-xl border border-cyan-100 shadow-sm overflow-hidden">
            <div className="border-b border-slate-200 px-6 py-4 bg-gradient-to-r from-slate-50 to-white">
              <h2 className="text-lg font-semibold text-gray-900">
                Process Activities
              </h2>
              <p className="text-sm text-gray-500 mt-0.5">
                Click any activity to view detailed information
              </p>
            </div>
            <div
              className="p-6 transition-all duration-300"
              style={{
                transform: `scale(${zoomLevel / 100})`,
                transformOrigin: "top left",
              }}
            >
              {viewMode === "timeline" ? (
                // Timeline View
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={process.activities.map((activity) => activity.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="relative">
                      <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-slate-200"></div>
                      <div className="space-y-6">
                        {process.activities.map((activity) => (
                          <SortableItem
                            key={activity.id}
                            activity={activity}
                            onClick={setSelectedActivity}
                            getStatusColor={getStatusColor}
                            getStatusText={getStatusText}
                            showTimeframe={showTimeframe}
                            showTags={showTags}
                          />
                        ))}
                      </div>
                    </div>
                  </SortableContext>
                </DndContext>
              ) : (
                // Grid View
                <div className="grid md:grid-cols-2 gap-4">
                  {process.activities.map((activity) => (
                    <div
                      key={activity.id}
                      className="bg-white border border-slate-200 rounded-xl p-4 cursor-pointer hover:shadow-md transition-all hover:border-cyan-200"
                      onClick={() => setSelectedActivity(activity)}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-8 h-8 rounded-lg flex items-center justify-center ${activity.status === "completed" ? "bg-emerald-100" : activity.status === "in-progress" || activity.status === "inprogress" ? "bg-cyan-100" : "bg-slate-100"}`}
                          >
                            <span className="text-xs font-semibold">
                              {activity.id}
                            </span>
                          </div>
                          <h3 className="font-semibold text-gray-900">
                            {activity.name}
                          </h3>
                        </div>
                        {activity.automation && (
                          <FiZap className="h-4 w-4 text-cyan-600" />
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                        {activity.description}
                      </p>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <FiUser className="h-3 w-3" />
                          <span>{activity.assignee}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <FiClock className="h-3 w-3" />
                          <span>{activity.timeEstimate}</span>
                        </div>
                      </div>
                      <div className="mt-2 pt-2 border-t border-gray-100">
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(activity.status)}`}
                        >
                          {getStatusText(activity.status)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Process Attributes */}
        <div className="space-y-4">
          {/* Summary Section */}
          <div className="bg-white/90 rounded-xl border border-cyan-100 shadow-sm overflow-hidden">
            <button
              onClick={() => toggleSection("summary")}
              className="w-full px-5 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <FiInfo className="h-5 w-5 text-cyan-700" />
                Summary
              </h3>
              {expandedSections.summary ? <FiChevronUp /> : <FiChevronDown />}
            </button>
            {expandedSections.summary && (
              <div className="px-5 pb-4 space-y-4">
                {/* Process Expert & Owner — avatar + name */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-gray-400 text-[10px] uppercase tracking-wide font-semibold mb-1.5">
                      Process Expert
                    </p>
                    <div className="flex items-center gap-2">
                      {process.processExpert &&
                      process.processExpert !== "System" ? (
                        <MiniAvatar name={process.processExpert} />
                      ) : (
                        <div className="h-7 w-7 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center flex-shrink-0">
                          <FiUser className="h-3.5 w-3.5 text-gray-500" />
                        </div>
                      )}
                      <p className="font-semibold text-gray-900 text-sm truncate">
                        {process.processExpert}
                      </p>
                    </div>
                  </div>
                  <div>
                    <p className="text-gray-400 text-[10px] uppercase tracking-wide font-semibold mb-1.5">
                      Process Owner
                    </p>
                    <div className="flex items-center gap-2">
                      {process.processOwner !== "Unassigned" ? (
                        <MiniAvatar name={process.processOwner} />
                      ) : (
                        <div className="h-7 w-7 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center flex-shrink-0">
                          <FiUser className="h-3.5 w-3.5 text-gray-400" />
                        </div>
                      )}
                      <p
                        className={`font-semibold text-sm truncate ${
                          process.processOwner === "Unassigned"
                            ? "text-gray-400 italic"
                            : "text-gray-900"
                        }`}
                      >
                        {process.processOwner}
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <p className="text-gray-400 text-[10px] uppercase tracking-wide font-semibold mb-1">
                    Objective
                  </p>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {process.objective}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400 text-[10px] uppercase tracking-wide font-semibold mb-1">
                    Next Review Date
                  </p>
                  <p className="text-sm font-medium text-gray-900">
                    {process.nextReviewDate}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400 text-[10px] uppercase tracking-wide font-semibold mb-1">
                    Background
                  </p>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {process.background}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400 text-[10px] uppercase tracking-wide font-semibold mb-1">
                    Keywords
                  </p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {process.searchKeywords.split(", ").map((kw) => (
                      <span
                        key={kw}
                        className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full"
                      >
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Change Log */}
          <div className="bg-white/90 rounded-xl border border-cyan-100 shadow-sm overflow-hidden">
            <button
              onClick={() => toggleSection("changeLog")}
              className="w-full px-5 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <h3 className="font-semibold text-gray-900">Change Log</h3>
              {expandedSections.changeLog ? <FiChevronUp /> : <FiChevronDown />}
            </button>
            {expandedSections.changeLog && (
              <div className="px-5 pb-4 space-y-3">
                {process.changeLog.map((log, idx) => (
                  <div key={idx} className="border-l-2 border-cyan-600 pl-3">
                    <p className="text-sm font-medium text-gray-900">
                      {log.status}
                    </p>
                    <p className="text-xs text-gray-500">
                      {log.user} • {log.date}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      {log.description}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Documents */}
          <div className="bg-white/90 rounded-xl border border-cyan-100 shadow-sm overflow-hidden">
            <button
              onClick={() => toggleSection("documents")}
              className="w-full px-5 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <FiFileText className="h-5 w-5 text-cyan-700" />
                Documents ({process.documents.length})
              </h3>
              {expandedSections.documents ? <FiChevronUp /> : <FiChevronDown />}
            </button>
            {expandedSections.documents && (
              <div className="px-5 pb-4 space-y-2">
                {process.documents.map((doc, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {doc.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {doc.type} • {doc.size} • {doc.date}
                      </p>
                    </div>
                    <button className="text-cyan-700 hover:text-cyan-800 text-sm flex items-center gap-1">
                      <FiEye className="h-4 w-4" />
                      View
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Cycle Costs */}
          {/* <div className="bg-white/90 rounded-xl border border-cyan-100 shadow-sm overflow-hidden">
            <button
              onClick={() => toggleSection("costs")}
              className="w-full px-5 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <FiDollarSign className="h-5 w-5 text-emerald-600" />
                Cycle Costs
              </h3>
              {expandedSections.costs ? <FiChevronUp /> : <FiChevronDown />}
            </button>
            {expandedSections.costs && (
              <div className="px-5 pb-4 space-y-2">
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600">Cost per Cycle</span>
                  <span className="font-semibold text-gray-900">
                    ${process.cycleCost}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600">Annual Volume</span>
                  <span className="font-semibold text-gray-900">
                    {process.annualVolume.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-gray-700 font-medium">
                    Total Annual Cost
                  </span>
                  <span className="font-bold text-gray-900 text-lg">
                    ${process.totalAnnualCost.toLocaleString()}
                  </span>
                </div>
              </div>
            )}
          </div> */}

          {/* Systems & Tags */}
          {/* <div className="bg-white/90 rounded-xl border border-cyan-100 shadow-sm overflow-hidden">
            <button
              onClick={() => toggleSection("systems")}
              className="w-full px-5 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <h3 className="font-semibold text-gray-900">Systems & Tags</h3>
              {expandedSections.systems ? <FiChevronUp /> : <FiChevronDown />}
            </button>
            {expandedSections.systems && (
              <div className="px-5 pb-4 space-y-4">
                <div>
                  <p className="text-sm text-gray-600 mb-2">
                    Connected Systems
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {process.systems.map((system) => (
                      <span
                        key={system}
                        className="px-3 py-1.5 bg-cyan-50 text-cyan-700 text-sm rounded-lg flex items-center gap-1"
                      >
                        <FiLink className="h-3 w-3" />
                        {system}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-2">Lean Tags</p>
                  <div className="flex flex-wrap gap-2">
                    {process.leanTags.map((tag) => (
                      <span
                        key={tag}
                        className="px-3 py-1.5 bg-teal-50 text-teal-700 text-sm rounded-lg"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div> */}
        </div>
      </div>

      {/* Activity Detail Modal */}
      {selectedActivity && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedActivity(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center ${getStatusColor(selectedActivity.status)}`}
                >
                  {selectedActivity.type === "decision" ? (
                    <FiAlertCircle />
                  ) : (
                    <FiLayers />
                  )}
                </div>
                <h3 className="text-xl font-semibold text-gray-900">
                  {selectedActivity.name}
                </h3>
              </div>
              <button
                onClick={() => setSelectedActivity(null)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>
            <div className="p-6 space-y-5">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Description
                </label>
                <p className="text-gray-800 mt-1">
                  {selectedActivity.description}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Assigned To
                  </label>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="w-8 h-8 rounded-full bg-cyan-100 flex items-center justify-center">
                      <span className="text-xs font-semibold text-cyan-700">
                        {selectedActivity.assigneeAvatar ||
                          selectedActivity.assignee.charAt(0)}
                      </span>
                    </div>
                    <p className="font-medium text-gray-900">
                      {selectedActivity.assignee}
                    </p>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Time Estimate
                  </label>
                  <div className="flex items-center gap-2 mt-1">
                    <FiClock className="h-4 w-4 text-gray-400" />
                    <p className="font-medium text-gray-900">
                      {selectedActivity.timeEstimate}
                    </p>
                  </div>
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Due Date
                </label>
                <div className="flex items-center gap-2 mt-1">
                  <FiCalendar className="h-4 w-4 text-gray-400" />
                  <p className="text-gray-800">
                    {selectedActivity.dueDate || "Not set"}
                  </p>
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Notes
                </label>
                <p className="text-gray-700 bg-gray-50 p-3 rounded-lg mt-1">
                  {selectedActivity.notes || "No additional notes"}
                </p>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  FAQ / Help
                </label>
                <p className="text-gray-700 bg-cyan-50 p-3 rounded-lg mt-1">
                  {selectedActivity.faq || "No FAQs available"}
                </p>
              </div>
              {selectedActivity.automation && (
                <div className="bg-gradient-to-r from-cyan-50 to-emerald-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <FiZap className="h-5 w-5 text-cyan-700" />
                    <p className="font-semibold text-cyan-900">
                      AI Automation Available
                    </p>
                  </div>
                  <p className="text-sm text-cyan-700">
                    This step can be automated using AI to reduce manual effort
                    by up to 80%.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared mini components
// ─────────────────────────────────────────────────────────────────────────────

function MiniAvatar({ name = "" }) {
  const palette = [
    "bg-cyan-600",
    "bg-teal-600",
    "bg-emerald-500",
    "bg-rose-500",
    "bg-indigo-500",
    "bg-violet-500",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++)
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  const bg = palette[Math.abs(hash) % palette.length];

  return (
    <div
      title={name}
      className={`h-7 w-7 rounded-full ${bg} border-2 border-white flex items-center justify-center flex-shrink-0`}
    >
      <span className="text-[10px] font-bold text-white leading-none">
        {name.charAt(0).toUpperCase()}
      </span>
    </div>
  );
}
