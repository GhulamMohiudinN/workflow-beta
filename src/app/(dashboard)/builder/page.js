"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  ReactFlow,
  Background,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  MarkerType,
  Panel,
  useReactFlow,
  ReactFlowProvider,
  Handle,
  Position,
  useViewport,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import {
  FiZap,
  FiSave,
  FiSearch,
  FiLayers,
  FiClock,
  FiPlus,
  FiActivity,
  FiChevronDown,
  FiX,
  FiCode,
} from "react-icons/fi";
import { processAPI } from "../../api/processAPI";
import { userAPI } from "../../api/userAPI";
import toast from "react-hot-toast";

// ─── Node type constants ─────────────────────────────────────────────────────
const NODE_TYPES_CONFIG = {
  trigger: { label: "TRIGGER", color: "#2563eb", bg: "#eff6ff", border: "#bfdbfe" },
  action:  { label: "ACTION",  color: "#0891b2", bg: "#ecfeff", border: "#a5f3fc" },
  function:{ label: "FUNCTION",color: "#7c3aed", bg: "#f5f3ff", border: "#ddd6fe" },
};

// ─── Shared invisible handle style ───────────────────────────────────────────
const handleStyle = {
  width: 10,
  height: 10,
  background: "#94a3b8",
  border: "2px solid #fff",
  borderRadius: "50%",
};

// ─── Custom Trigger Node ────────────────────────────────────────────────────
function TriggerNode({ data, selected }) {
  const cfg = NODE_TYPES_CONFIG.trigger;
  return (
    <div
      style={{
        background: cfg.bg,
        border: `${selected ? "2px" : "1px"} solid ${selected ? cfg.color : cfg.border}`,
        boxShadow: selected ? `0 0 0 3px ${cfg.color}22` : "0 4px 14px rgba(0,0,0,0.07)",
      }}
      className="w-[220px] rounded-xl p-4 cursor-pointer transition-all"
    >
      {/* Trigger has only an output handle (right side) */}
      <Handle type="source" position={Position.Right} style={handleStyle} />

      <div className="flex items-center justify-between mb-2">
        <span style={{ color: cfg.color }} className="text-[10px] font-black uppercase tracking-widest">
          {cfg.label}
        </span>
        <FiZap size={13} style={{ color: cfg.color }} />
      </div>
      <p className="font-bold text-slate-800 text-sm leading-snug mb-1 truncate">{data.title || "Untitled"}</p>
      <p className="text-[11px] text-slate-500 truncate">Source: {data.assigneeName || "WorkflowPro"}</p>
      {data.estimateTime && (
        <div className="flex items-center gap-1 mt-2 pt-2 border-t border-slate-100">
          <FiClock size={11} className="text-slate-400" />
          <span className="text-[10px] text-slate-500 font-semibold">{data.estimateTime}</span>
        </div>
      )}
    </div>
  );
}

// ─── Custom Action Node ──────────────────────────────────────────────────────
function ActionNode({ data, selected }) {
  const cfg = NODE_TYPES_CONFIG.action;
  return (
    <div
      style={{
        background: cfg.bg,
        border: `${selected ? "2px" : "1px"} solid ${selected ? cfg.color : cfg.border}`,
        boxShadow: selected ? `0 0 0 3px ${cfg.color}22` : "0 4px 14px rgba(0,0,0,0.07)",
      }}
      className="w-[220px] rounded-xl p-4 cursor-pointer transition-all"
    >
      {/* Input handle (left) + output handle (right) */}
      <Handle type="target" position={Position.Left} style={handleStyle} />
      <Handle type="source" position={Position.Right} style={handleStyle} />

      <div className="flex items-center justify-between mb-2">
        <span style={{ color: cfg.color }} className="text-[10px] font-black uppercase tracking-widest">
          {cfg.label}
        </span>
        <FiZap size={13} style={{ color: cfg.color }} />
      </div>
      <p className="font-bold text-slate-800 text-sm leading-snug mb-1 truncate">{data.title || "Untitled"}</p>
      <p className="text-[11px] text-slate-500 truncate">Source: {data.assigneeName || "WorkflowPro"}</p>
      {data.estimateTime && (
        <div className="flex items-center gap-1 mt-2 pt-2 border-t border-slate-100">
          <FiClock size={11} className="text-slate-400" />
          <span className="text-[10px] text-slate-500 font-semibold">{data.estimateTime}</span>
        </div>
      )}
    </div>
  );
}

// ─── Custom Function Node ────────────────────────────────────────────────────
function FunctionNode({ data, selected }) {
  const cfg = NODE_TYPES_CONFIG.function;
  return (
    <div
      style={{
        background: cfg.bg,
        border: `${selected ? "2px" : "1px"} solid ${selected ? cfg.color : cfg.border}`,
        boxShadow: selected ? `0 0 0 3px ${cfg.color}22` : "0 4px 14px rgba(0,0,0,0.07)",
      }}
      className="w-[220px] rounded-xl p-4 cursor-pointer transition-all"
    >
      {/* Input handle (left) + output handle (right) */}
      <Handle type="target" position={Position.Left} style={handleStyle} />
      <Handle type="source" position={Position.Right} style={handleStyle} />

      <div className="flex items-center justify-between mb-2">
        <span style={{ color: cfg.color }} className="text-[10px] font-black uppercase tracking-widest">
          {cfg.label}
        </span>
        <FiCode size={13} style={{ color: cfg.color }} />
      </div>
      <p className="font-bold text-slate-800 text-sm leading-snug mb-1 truncate">{data.title || "Untitled"}</p>
      <p className="text-[11px] text-slate-500 truncate">Source: {data.assigneeName || "WorkflowPro"}</p>
      {data.estimateTime && (
        <div className="flex items-center gap-1 mt-2 pt-2 border-t border-slate-100">
          <FiClock size={11} className="text-slate-400" />
          <span className="text-[10px] text-slate-500 font-semibold">{data.estimateTime}</span>
        </div>
      )}
    </div>
  );
}

// Register node types outside component to avoid re-render recreation
const nodeTypes = {
  trigger: TriggerNode,
  action: ActionNode,
  function: FunctionNode,
};

// ─── Helper: build React Flow nodes + edges from steps array ────────────────
function buildNodesAndEdges(steps) {
  const sorted = [...steps].sort((a, b) => (Number(a.sequenceNo) || 0) - (Number(b.sequenceNo) || 0));

  const nodes = sorted.map((step, idx) => {
    // First step is always trigger, rest keep their nodeType
    let nodeType = step.nodeType || "action";
    if (idx === 0) nodeType = "trigger";

    const assigneeName =
      step.assignee && typeof step.assignee === "object"
        ? step.assignee.name
        : step.assignee && step.assignee !== "Unassigned"
        ? step.assignee
        : "WorkflowPro";

    return {
      id: step.id,
      type: nodeType,
      // Lay out horizontally by default if no saved position
      position: step.position || { x: 120 + idx * 300, y: 150 },
      data: {
        title: step.title || "Untitled Step",
        assigneeName,
        estimateTime: step.estimateTime || step.timeEstimate || "",
        sequenceNo: step.sequenceNo || idx + 1,
        nodeType,
        stepId: step.id,
      },
      // Prevent React Flow from rendering its default border/background
      style: { padding: 0, background: "transparent", border: "none" },
    };
  });

  const edges = sorted.slice(0, -1).map((step, idx) => ({
    id: `e-${step.id}-${sorted[idx + 1].id}`,
    source: step.id,
    target: sorted[idx + 1].id,
    type: "smoothstep",
    animated: false,
    style: { stroke: "#94a3b8", strokeWidth: 2 },
    markerEnd: {
      type: MarkerType.ArrowClosed,
      width: 16,
      height: 16,
      color: "#94a3b8",
    },
  }));

  return { nodes, edges };
}

// ─── Node Settings Panel ─────────────────────────────────────────────────────
function NodeSettingsPanel({ step, workspaceUsers, onUpdate, onClose, totalSteps }) {
  const [isAssigneeOpen, setIsAssigneeOpen] = useState(false);
  // Local sequence draft so the input feels responsive while typing
  const [seqDraft, setSeqDraft] = useState(String(step.sequenceNo ?? 1));

  // Keep draft in sync if the step changes externally (e.g. after rearrange)
  useEffect(() => {
    setSeqDraft(String(step.sequenceNo ?? 1));
  }, [step.sequenceNo]);

  if (!step) return null;

  const assigneeName =
    step.assignee && typeof step.assignee === "object"
      ? step.assignee.name
      : step.assignee && step.assignee !== "Unassigned"
      ? step.assignee
      : "Unassigned";

  const assigneeUri =
    step.assignee && typeof step.assignee === "object"
      ? `workflow://assignee/${step.assignee.email || step.assignee._id}`
      : "workflow://assignee/unassigned";

  const handleSeqCommit = () => {
    const parsed = parseInt(seqDraft, 10);
    if (!isNaN(parsed) && parsed !== step.sequenceNo) {
      onUpdate(step.id, { sequenceNo: parsed });
    }
  };

  return (
    <div className="absolute inset-y-0 right-0 w-[360px] bg-white border-l border-slate-200 shadow-[-10px_0_30px_rgba(0,0,0,0.04)] z-[100] flex flex-col">
      {/* Header */}
      <div className="p-5 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
        <h2 className="text-base font-bold text-slate-800">Node Settings</h2>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-lg bg-slate-50 hover:bg-slate-100 flex items-center justify-center transition-all border border-slate-100 text-slate-400 hover:text-slate-600"
        >
          <FiX size={15} />
        </button>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        {/* Node Title */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Node Title</label>
          <input
            type="text"
            value={step.title || ""}
            onChange={(e) => onUpdate(step.id, { title: e.target.value })}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:border-blue-500 outline-none transition-all font-semibold"
            placeholder="Node title..."
          />
        </div>

        {/* Sequence No */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Sequence No</label>
            <span className="text-[10px] font-bold text-slate-400">
              of {totalSteps}
            </span>
          </div>
          <div className="relative">
            <input
              type="number"
              min={1}
              max={totalSteps}
              value={seqDraft}
              onChange={(e) => setSeqDraft(e.target.value)}
              onBlur={handleSeqCommit}
              onKeyDown={(e) => { if (e.key === "Enter") { e.target.blur(); } }}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:border-blue-500 outline-none transition-all font-semibold"
              placeholder="1"
            />
            {/* Visual hint: will rearrange if duplicate */}
            {parseInt(seqDraft, 10) !== step.sequenceNo && !isNaN(parseInt(seqDraft, 10)) && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-bold text-amber-500 bg-amber-50 px-1.5 py-0.5 rounded-full border border-amber-200">
                will reorder
              </span>
            )}
          </div>
          <p className="text-[10px] text-slate-400">
            Duplicate numbers automatically push others down.
          </p>
        </div>

        {/* Node Type */}

        {/* Logic Assignee */}
        <div className="space-y-1.5 relative">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Logic Assignee</label>
          <button
            onClick={() => setIsAssigneeOpen((o) => !o)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-700 outline-none flex items-center justify-between hover:border-slate-300 transition-all font-semibold"
          >
            <span className="flex items-center gap-2">
              <FiSearch className="text-slate-400 w-3.5 h-3.5" />
              <span className="truncate">{assigneeName}</span>
            </span>
            <FiChevronDown className={`text-slate-400 transition-transform duration-200 ${isAssigneeOpen ? "rotate-180" : ""}`} />
          </button>
          {isAssigneeOpen && (
            <div className="absolute top-full left-0 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-[200] max-h-[180px] overflow-y-auto p-1">
              <div
                onClick={() => { onUpdate(step.id, { assignee: "Unassigned" }); setIsAssigneeOpen(false); }}
                className="px-3 py-2 text-xs text-blue-600 font-bold hover:bg-slate-50 rounded-lg cursor-pointer border-b border-slate-100 mb-1"
              >
                Unassigned
              </div>
              {workspaceUsers.map((user) => (
                <div
                  key={user._id}
                  onClick={() => { onUpdate(step.id, { assignee: user }); setIsAssigneeOpen(false); }}
                  className="px-3 py-2 text-xs text-slate-600 hover:bg-slate-50 hover:text-slate-900 rounded-lg cursor-pointer mb-0.5"
                >
                  {user.name}
                </div>
              ))}
            </div>
          )}
          <p className="text-[10px] text-slate-400 font-mono mt-1">{assigneeUri}</p>
        </div>

        {/* Estimate Time */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Estimate Time</label>
          <div className="relative">
            <FiClock size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={step.estimateTime || ""}
              onChange={(e) => onUpdate(step.id, { estimateTime: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:border-blue-500 outline-none transition-all font-semibold"
              placeholder="e.g. 1 day"
            />
          </div>
        </div>

        {/* Evidence / Description */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Evidence</label>
          <textarea
            rows={3}
            value={step.description || ""}
            onChange={(e) => onUpdate(step.id, { description: e.target.value })}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:border-blue-500 outline-none transition-all font-medium resize-none leading-relaxed"
            placeholder="Provide evidence or notes for this node..."
          />
        </div>
      </div>

      {/* Footer */}
      <div className="p-5 border-t border-slate-100 bg-slate-50/50">
        <button
          onClick={() => onClose(true)}
          className="w-full py-2.5 bg-white hover:bg-slate-50 text-blue-600 border border-blue-200 hover:border-blue-300 rounded-lg font-bold text-sm tracking-wide transition-all"
        >
          Save Node Config
        </button>
      </div>
    </div>
  );
}

// ─── Custom horizontal zoom controls ────────────────────────────────────────
function HorizontalControls() {
  const { zoomIn, zoomOut, fitView } = useReactFlow();
  const { zoom } = useViewport();

  return (
    <Panel position="bottom-center">
      <div className="flex items-center gap-4 bg-white border border-slate-200 rounded-full px-5 py-2 shadow-md">
        <button
          onClick={() => zoomOut({ duration: 200 })}
          title="Zoom Out"
          className="text-slate-500 hover:text-blue-600 transition-colors text-base leading-none font-semibold w-5 h-5 flex items-center justify-center"
          aria-label="Zoom out"
        >
          −
        </button>
        <span className="text-xs font-semibold text-slate-600 min-w-[36px] text-center tabular-nums">
          {Math.round(zoom * 100)}%
        </span>
        <button
          onClick={() => zoomIn({ duration: 200 })}
          title="Zoom In"
          className="text-slate-500 hover:text-blue-600 transition-colors text-base leading-none font-semibold w-5 h-5 flex items-center justify-center"
          aria-label="Zoom in"
        >
          +
        </button>
        <div className="w-px h-4 bg-slate-200" />
        <button
          onClick={() => fitView({ padding: 0.2, duration: 400 })}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-blue-600 transition-colors whitespace-nowrap"
          aria-label="Reset view"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="1 4 1 10 7 10" /><polyline points="23 20 23 14 17 14" />
            <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4-4.64 4.36A9 9 0 0 1 3.51 15" />
          </svg>
          Reset View
        </button>
      </div>
    </Panel>
  );
}

// ─── Pure sequence rearrangement – no side-effects, fully testable ────────────
/**
 * When a step is assigned a new sequenceNo that already exists:
 *   1. Remove the moving step from the list.
 *   2. Insert it at the desired position (0-indexed = desiredSeq - 1),
 *      clamped to valid bounds.
 *   3. Renumber every step 1…N in the resulting order.
 *
 * This preserves the relative order of all other steps and guarantees
 * the final array has contiguous, unique sequence numbers with no gaps.
 */
function resequenceSteps(steps, movedId, desiredSeq) {
  const clamped = Math.max(1, Math.min(desiredSeq, steps.length));

  // Pull out the step being moved
  const moving   = steps.find((s) => s.id === movedId);
  const rest     = steps.filter((s) => s.id !== movedId);

  // Insert at the desired index (1-based → 0-based)
  const insertAt = clamped - 1;
  const reordered = [
    ...rest.slice(0, insertAt),
    moving,
    ...rest.slice(insertAt),
  ];

  // Renumber 1…N — no gaps, no duplicates
  return reordered.map((s, idx) => ({ ...s, sequenceNo: idx + 1 }));
}

// ─── Inner builder (needs ReactFlowProvider context) ─────────────────────────
function ProcessBuilderInner() {
  const [processes, setProcesses] = useState([]);
  const [selectedProcessId, setSelectedProcessId] = useState("");
  const [selectedProcess, setSelectedProcess] = useState(null);
  const [steps, setSteps] = useState([]);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [workspaceUsers, setWorkspaceUsers] = useState([]);
  const [isMatrixOpen, setIsMatrixOpen] = useState(false);
  const [selectedStepId, setSelectedStepId] = useState(null);

  const { fitView } = useReactFlow();
  // Stable ref so fitView never appears in effect dependency arrays
  const fitViewRef = useRef(fitView);
  useEffect(() => { fitViewRef.current = fitView; }, [fitView]);

  // Derive selected step from steps array
  const selectedStep = useMemo(() => steps.find((s) => s.id === selectedStepId), [selectedStepId, steps]);

  /**
   * updateStep – central mutation point for all node field changes.
   *
   * sequenceNo handling:
   *   - Apply the field update to the target step first.
   *   - If the new sequenceNo collides with any other step's sequenceNo,
   *     run the insertion algorithm to rearrange and renumber everyone.
   *   - If no collision, just sort and renumber to fill any gaps.
   *   - Either way the resulting array is always gap-free and unique.
   */
  const updateStep = useCallback((id, updates) => {
    setSteps((prev) => {
      // 1. Apply the raw field updates to the target step
      const patched = prev.map((s) => (s.id === id ? { ...s, ...updates } : s));

      let next;
      if (updates.sequenceNo !== undefined) {
        const newSeq     = Number(updates.sequenceNo);
        const hasDuplicate = patched.some((s) => s.id !== id && s.sequenceNo === newSeq);

        if (hasDuplicate) {
          // Insertion mode: shift colliding + subsequent steps up by 1
          next = resequenceSteps(patched, id, newSeq);
        } else {
          // No collision – sort + compact to close any gaps
          next = [...patched]
            .sort((a, b) => (Number(a.sequenceNo) || 0) - (Number(b.sequenceNo) || 0))
            .map((s, idx) => ({ ...s, sequenceNo: idx + 1 }));
        }
      } else {
        next = patched;
      }

      const { nodes: newNodes, edges: newEdges } = buildNodesAndEdges(next);
      setNodes(newNodes);
      setEdges(newEdges);
      return next;
    });
  }, [setNodes, setEdges]);

  // Sync node position changes back to steps
  const handleNodesChange = useCallback((changes) => {
    onNodesChange(changes);
    const posChanges = changes.filter((c) => c.type === "position" && !c.dragging && c.position);
    if (posChanges.length) {
      setSteps((prev) =>
        prev.map((s) => {
          const change = posChanges.find((c) => c.id === s.id);
          return change ? { ...s, position: change.position } : s;
        })
      );
    }
  }, [onNodesChange]);

  const onConnect = useCallback((params) => {
    setEdges((eds) =>
      addEdge({ ...params, type: "smoothstep", animated: false, style: { stroke: "#cbd5e1", strokeWidth: 2 }, markerEnd: { type: MarkerType.ArrowClosed, color: "#94a3b8" } }, eds)
    );
  }, [setEdges]);

  const handleNodeClick = useCallback((_evt, node) => {
    setSelectedStepId(node.id);
  }, []);

  const handlePaneClick = useCallback(() => setSelectedStepId(null), []);

  // Add a new step
  const addStep = useCallback((nodeType = "action") => {
    const nextSeq = steps.length + 1;
    const lastStep = steps[steps.length - 1];
    const newStep = {
      id: `step-${Date.now()}`,
      title: nodeType === "function" ? "New Function" : "New Logic Segment",
      description: "",
      assignee: "Unassigned",
      sequenceNo: nextSeq,
      nodeType,
      estimateTime: "",
      position: lastStep
        ? { x: (lastStep.position?.x || 0) + 300, y: lastStep.position?.y || 150 }
        : { x: 100, y: 150 },
    };
    setSteps((prev) => {
      const next = [...prev, newStep];
      const { nodes: nn, edges: ne } = buildNodesAndEdges(next);
      setNodes(nn);
      setEdges(ne);
      return next;
    });
    setSelectedStepId(newStep.id);
  }, [steps, setNodes, setEdges]);

  // Fetch workspace data on mount
  useEffect(() => {
    const fetchInitial = async () => {
      const [procResult, userResult] = await Promise.all([
        processAPI.getWorkspaceProcesses(),
        userAPI.getWorkspaceUsers(),
      ]);
      if (procResult.success) setProcesses(procResult.data);
      if (userResult.success) setWorkspaceUsers(userResult.users);
    };
    fetchInitial();
  }, []);

  // Load process when selected
  useEffect(() => {
    if (!selectedProcessId) return;
    const load = async () => {
      setIsLoading(true);
      setSelectedStepId(null);
      const result = await processAPI.getProcess(selectedProcessId);
      if (result.success) {
        const proc = result.data;
        setSelectedProcess(proc);
        const formatted = (proc.steps || [])
          .map((s, idx) => ({
            ...s,
            id: s._id || `step-${idx}-${Date.now()}`,
            sequenceNo: s.sequenceNo || s.order || idx + 1,
            position: s.position || { x: 100 + idx * 300, y: 150 + (idx % 2 === 0 ? 0 : 80) },
            estimateTime: s.timeEstimate || s.estimateTime || "",
            nodeType: s.nodeType || (idx === 0 ? "trigger" : "action"),
          }))
          .sort((a, b) => a.sequenceNo - b.sequenceNo);
        setSteps(formatted);
        const { nodes: nn, edges: ne } = buildNodesAndEdges(formatted);
        setNodes(nn);
        setEdges(ne);
        setTimeout(() => fitViewRef.current({ padding: 0.2, duration: 400 }), 100);
      } else {
        toast.error("Failed to load process");
      }
      setIsLoading(false);
    };
    load();
  }, [selectedProcessId, setNodes, setEdges, fitView]);

  const saveSequence = useCallback(async (showToast = true) => {
    if (!selectedProcessId) return;
    setIsSaving(true);
    try {
      const updatedData = {
        ...selectedProcess,
        steps: steps.map((s) => ({
          ...s,
          sequenceNo: s.sequenceNo,
          nodeType: s.nodeType,
          assignee:
            s.assignee && typeof s.assignee === "object"
              ? s.assignee._id
              : s.assignee === "Unassigned"
              ? null
              : s.assignee,
          timeEstimate: s.estimateTime,
        })),
      };
      const result = await processAPI.updateProcess(selectedProcessId, updatedData);
      if (result.success) {
        if (showToast) toast.success("Process saved successfully!");
      } else {
        toast.error(result.error || "Save failed");
      }
    } catch {
      toast.error("Sync error");
    } finally {
      setIsSaving(false);
    }
  }, [selectedProcessId, selectedProcess, steps]);

  const handleClosePanel = useCallback((andSave = false) => {
    if (andSave) saveSequence();
    setSelectedStepId(null);
  }, [saveSequence]);

  return (
    <div className="-m-8 h-[calc(100vh-4rem)] flex flex-col bg-[#f6f8fb] overflow-hidden font-sans">
      {/* Top bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-6 py-4 bg-white border-b border-slate-200 z-20 flex-shrink-0">
        <div>
          <h1 className="text-xl font-black text-slate-900">Process Builder</h1>
          <p className="mt-0.5 text-xs font-medium text-slate-500">Design and synchronize operational process sequences visually.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* Process selector */}
          <div className="relative min-w-[220px]">
            <button
              onClick={() => setIsMatrixOpen((o) => !o)}
              className="w-full flex items-center justify-between px-3 py-2 bg-white text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 transition-all font-semibold text-xs shadow-sm"
            >
              <span className="flex items-center gap-2 truncate">
                <FiLayers className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span className="truncate max-w-[140px]">{selectedProcess?.name || "Select Process"}</span>
              </span>
              <FiChevronDown className={`ml-2 text-slate-400 shrink-0 transition-transform duration-200 ${isMatrixOpen ? "rotate-180" : ""}`} />
            </button>
            {isMatrixOpen && (
              <div className="absolute top-full right-0 w-[280px] mt-1.5 bg-white border border-slate-200 rounded-xl shadow-lg z-[200] overflow-hidden">
                <div className="max-h-[280px] overflow-y-auto p-1">
                  {processes.length > 0 ? processes.map((p) => (
                    <div
                      key={p._id}
                      onClick={() => { setSelectedProcessId(p._id); setIsMatrixOpen(false); }}
                      className={`px-4 py-2.5 text-xs font-semibold cursor-pointer transition-all rounded-lg hover:bg-blue-50 hover:text-blue-600 ${selectedProcessId === p._id ? "text-blue-600 bg-blue-50/60" : "text-slate-600"}`}
                    >
                      {p.name}
                    </div>
                  )) : (
                    <div className="px-4 py-6 text-xs text-slate-400 font-medium text-center italic">No processes found</div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Add Action / Function step */}
          <button
            onClick={() => addStep("action")}
            className="flex items-center gap-1.5 px-3 py-2 bg-white text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 transition-all font-semibold text-xs shadow-sm"
          >
            <FiPlus className="w-3.5 h-3.5 text-blue-600" />
            Add Step
          </button>
          {/* Save */}
          <button
            onClick={() => saveSequence(true)}
            disabled={!selectedProcessId || isSaving}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all font-bold text-xs shadow-md shadow-blue-600/20 disabled:opacity-50"
          >
            {isSaving ? <FiActivity className="animate-spin w-3.5 h-3.5" /> : <FiSave className="w-3.5 h-3.5" />}
            Sync Architecture
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 relative overflow-hidden">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/70 z-50">
            <div className="flex flex-col items-center gap-3">
              <div className="h-10 w-10 animate-spin rounded-full border-2 border-blue-100 border-t-blue-600" />
              <p className="text-sm font-semibold text-slate-500">Loading process...</p>
            </div>
          </div>
        )}

        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={handleNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={handleNodeClick}
          onPaneClick={handlePaneClick}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.25 }}
          minZoom={0.2}
          maxZoom={2}
          className="bg-[#f8fafc]"
          proOptions={{ hideAttribution: true }}
          defaultEdgeOptions={{
            type: "smoothstep",
            style: { stroke: "#94a3b8", strokeWidth: 2 },
            markerEnd: { type: MarkerType.ArrowClosed, width: 16, height: 16, color: "#94a3b8" },
          }}
        >
          <Background color="#e2e8f0" gap={24} size={1} />
          <HorizontalControls />
          <MiniMap
            nodeColor={(n) => {
              const cfg = NODE_TYPES_CONFIG[n.type] || NODE_TYPES_CONFIG.action;
              return cfg.color;
            }}
            position="bottom-right"
            zoomable
            pannable
          />

          {/* Process map label */}
          {selectedProcessId && (
            <Panel position="top-left">
              <button className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg font-bold text-xs uppercase tracking-wider shadow-lg shadow-blue-600/20">
                <FiLayers className="w-3.5 h-3.5" />
                Process Map
              </button>
            </Panel>
          )}

          {/* Empty state */}
          {!selectedProcessId && (
            <Panel position="top-center">
              <div className="mt-32 flex flex-col items-center text-center gap-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-slate-100 border border-slate-200">
                  <FiLayers className="w-7 h-7 text-slate-400" />
                </div>
                <p className="text-sm font-semibold text-slate-500">Select a process from the header to begin</p>
              </div>
            </Panel>
          )}
        </ReactFlow>

        {/* Node Settings Slide-in Panel */}
        <div
          className={`absolute inset-y-0 right-0 transition-transform duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] ${selectedStep ? "translate-x-0" : "translate-x-full"}`}
        >
          {selectedStep && (
            <NodeSettingsPanel
              step={selectedStep}
              workspaceUsers={workspaceUsers}
              onUpdate={updateStep}
              onClose={handleClosePanel}
              totalSteps={steps.length}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Default export wrapped in ReactFlowProvider ─────────────────────────────
export default function ProcessBuilderPage() {
  return (
    <ReactFlowProvider>
      <ProcessBuilderInner />
    </ReactFlowProvider>
  );
}
