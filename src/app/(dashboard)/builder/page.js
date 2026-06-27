"use client";

import { useState, useEffect, useMemo } from "react";
import { 
  DndContext, 
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  useDraggable
} from "@dnd-kit/core";
import { 
  FiZap, 
  FiSave, 
  FiSearch, 
  FiMaximize2, 
  FiMousePointer, 
  FiLayers,
  FiClock,
  FiPlus,
  FiActivity,
  FiChevronDown,
  FiX,
  FiMaximize,
  FiRefreshCw,
  FiZoomIn,
  FiZoomOut

} from "react-icons/fi";
import { processAPI } from "../../api/processAPI";
import { userAPI } from "../../api/userAPI";
import toast from "react-hot-toast";

// ─── Sortable Node Component (Horizontal) ──────────────────────────────────────

function StepNode({ step, isSelected, onClick }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging
  } = useDraggable({ id: step.id });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    zIndex: isDragging ? 100 : 20,
  } : {
    zIndex: 20
  };

  const isStart = step.sequenceNo === 1;
  const isEnd = step.isLast || false;
  let typeLabel = "ACTION";
  let typeIcon = <FiZap className="w-3.5 h-3.5 text-blue-600" />;
  let borderColor = isSelected 
    ? "border-2 border-blue-600 shadow-lg shadow-blue-500/10" 
    : "border border-slate-200 shadow-md shadow-slate-100/50";

  if (isStart) {
    typeLabel = "TRIGGER";
    typeIcon = <FiZap className="w-3.5 h-3.5 text-blue-600" />;
  } else if (isEnd) {
    typeLabel = "ACTION"; // Keep it matching standard style
  }

  return (
    <div
      ref={setNodeRef}
      style={{
        position: 'absolute',
        left: step.position?.x || 0,
        top: step.position?.y || 0,
        ...style
      }}
      className="absolute"
    >
      <div 
        onClick={(e) => {
          e.stopPropagation();
          onClick(step);
        }}
        className={`canvas-node w-[260px] bg-white ${borderColor} rounded-xl p-5 transition-all cursor-pointer group relative overflow-hidden`}
      >
        <div {...attributes} {...listeners} className="absolute top-0 left-0 w-full h-8 cursor-grab active:cursor-grabbing z-50" />
        <div className="flex items-center justify-between mb-3 mt-1">
          <span className="text-[10px] font-black uppercase tracking-wider text-blue-600">{typeLabel}</span>
          {typeIcon}
        </div>
        <h4 className="font-bold text-slate-800 text-sm mb-1 leading-snug">
          {step.title || "Untitled Step"}
        </h4>
        <p className="text-[11px] text-slate-500 font-medium truncate mb-2">
          Source: {step.assignee && typeof step.assignee === 'object' ? step.assignee.name : (step.assignee && step.assignee !== "Unassigned" ? step.assignee : "WorkflowPro")}
        </p>
        
        {step.estimateTime && (
          <div className="flex items-center gap-1.5 mt-3 pt-2 border-t border-slate-100">
            <FiClock className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-[10px] font-semibold text-slate-500">
              {step.estimateTime}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function ConnectionLine({ from, to }) {
  if (!from || !to) return null;
  const x1 = (from.position?.x || 0) + 260;
  const y1 = (from.position?.y || 0) + 60;
  const x2 = (to.position?.x || 0);
  const y2 = (to.position?.y || 0) + 60;

  const dx = Math.abs(x1 - x2) * 0.4;
  const path = `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;

  const midX = (x1 + x2) / 2;
  const midY = (y1 + y2) / 2;

  return (
    <g>
      <path d={path} stroke="#cbd5e1" strokeWidth="2" fill="none" className="transition-all duration-300" />
      <circle cx={midX} cy={midY} r="5" fill="white" stroke="#94a3b8" strokeWidth="2" />
    </g>
  );
}

export default function ProcessBuilderPage() {
  const [processes, setProcesses] = useState([]);
  const [selectedProcessId, setSelectedProcessId] = useState("");
  const [selectedProcess, setSelectedProcess] = useState(null);
  const [steps, setSteps] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeId, setActiveId] = useState(null);
  const [zoomScale, setZoomScale] = useState(1);
  const [selectedStepId, setSelectedStepId] = useState(null);
  const [workspaceUsers, setWorkspaceUsers] = useState([]);
  const [isAssigneeDropdownOpen, setIsAssigneeDropdownOpen] = useState(false);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });
  const [isInternalFullscreen, setIsInternalFullscreen] = useState(false);
  const [isMatrixOpen, setIsMatrixOpen] = useState(false);

  const selectedStep = useMemo(() => steps.find(s => s.id === selectedStepId), [selectedStepId, steps]);

  const updateStep = (id, updates) => {
    setSteps(prev => {
      const next = prev.map(s => s.id === id ? { ...s, ...updates } : s);
      if (updates.sequenceNo !== undefined) {
        return [...next].sort((a, b) => (Number(a.sequenceNo) || 0) - (Number(b.sequenceNo) || 0));
      }
      return next;
    });
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 15 } })
  );

  const handleZoomIn = () => setZoomScale(prev => Math.min(prev + 0.1, 2.0));
  const handleZoomOut = () => setZoomScale(prev => Math.max(prev - 0.1, 0.2));

  const handleCanvasMouseDown = (e) => {
    if (e.target.closest('.canvas-node')) return;
    setIsPanning(true);
    setLastMousePos({ x: e.clientX, y: e.clientY });
  };

  const handleCanvasMouseMove = (e) => {
    if (!isPanning) return;
    const dx = e.clientX - lastMousePos.x;
    const dy = e.clientY - lastMousePos.y;
    setPanOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }));
    setLastMousePos({ x: e.clientX, y: e.clientY });
  };

  const handleCanvasMouseUp = () => setIsPanning(false);
  
  const toggleFullScreen = () => {
    const editorEl = document.getElementById('canvas-root');
    if (!document.fullscreenElement) {
      editorEl.requestFullscreen().then(() => setIsInternalFullscreen(true)).catch(err => {
        toast.error(`Fullscreen failed: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  useEffect(() => {
    const handleFsChange = () => { if (!document.fullscreenElement) setIsInternalFullscreen(false); };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  const fitToView = () => {
    if (steps.length === 0) return;
    const padding = 100;
    const nodeWidth = 260;
    const nodeHeight = 150;

    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    steps.forEach(s => {
      const x = s.position?.x || 0;
      const y = s.position?.y || 0;
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x + nodeWidth);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y + nodeHeight);
    });

    const graphWidth = maxX - minX + (padding * 2);
    const graphHeight = maxY - minY + (padding * 2);
    const container = document.getElementById('canvas-root');
    const containerWidth = container?.clientWidth || window.innerWidth;
    const containerHeight = container?.clientHeight || window.innerHeight;

    const scaleX = containerWidth / graphWidth;
    const scaleY = containerHeight / graphHeight;
    const newScale = Math.max(0.2, Math.min(1, Math.min(scaleX, scaleY)));

    setZoomScale(newScale);
    setPanOffset({
      x: -(minX * newScale) + (containerWidth - (maxX - minX) * newScale) / 2,
      y: -(minY * newScale) + (containerHeight - (maxY - minY) * newScale) / 2
    });
  };

  const addStep = () => {
    const nextOrder = steps.length + 1;
    const lastStep = steps[steps.length - 1];
    const newStep = {
      id: `step-${Date.now()}`,
      title: "New Logic Segment",
      description: "Define operation...",
      assignee: "Unassigned",
      sequenceNo: nextOrder,
      position: lastStep 
        ? { x: (lastStep.position?.x || 0) + 320, y: (lastStep.position?.y || 0) + (Math.random() > 0.5 ? 100 : -100) } 
        : { x: 100, y: 300 }
    };
    setSteps(prev => [...prev, newStep]);
    setSelectedStepId(newStep.id);
  };

  useEffect(() => {
    const fetchProcesses = async () => {
      const result = await processAPI.getWorkspaceProcesses();
      if (result.success) setProcesses(result.data);
    };
    const fetchUsers = async () => {
      const result = await userAPI.getWorkspaceUsers();
      if (result.success) setWorkspaceUsers(result.users);
    };
    fetchProcesses();
    fetchUsers();
  }, []);

  useEffect(() => {
    if (!selectedProcessId) return;
    const loadDetails = async () => {
      setIsLoading(true);
      const result = await processAPI.getProcess(selectedProcessId);
      if (result.success) {
        const proc = result.data;
        setSelectedProcess(proc);
        const formattedSteps = (proc.steps || []).map((s, idx) => ({
          ...s,
          id: s._id || `step-${idx}-${Date.now()}`,
          sequenceNo: s.sequenceNo || s.order || idx + 1,
          position: s.position || { x: 100 + (idx * 320), y: 150 + (idx % 2 === 0 ? 0 : 80) },
          estimateTime: s.timeEstimate || s.estimateTime || s.dueDate || ""
        })).sort((a,b) => a.sequenceNo - b.sequenceNo);
        setSteps(formattedSteps);
        setPanOffset({ x: 0, y: 0 });
      }
      setIsLoading(false);
    };
    loadDetails();
  }, [selectedProcessId]);

  const handleDragStart = (e) => setActiveId(e.active.id);

  const handleDragEnd = (e) => {
    const { active, delta } = e;
    setActiveId(null);
    setSteps((items) => items.map(s => {
      if (s.id === active.id) {
        return {
          ...s,
          position: {
            x: (s.position?.x || 0) + delta.x,
            y: (s.position?.y || 0) + delta.y
          }
        };
      }
      return s;
    }));
  };

  const saveSequence = async () => {
    if (!selectedProcessId) return;
    setIsSaving(true);
    try {
      const updatedData = {
        ...selectedProcess,
        steps: steps.map(s => ({ 
          ...s, 
          sequenceNo: s.sequenceNo,
          assignee: s.assignee && typeof s.assignee === 'object' ? s.assignee._id : (s.assignee === "Unassigned" ? null : s.assignee),
          timeEstimate: s.estimateTime
        }))
      };
      const result = await processAPI.updateProcess(selectedProcessId, updatedData);
      if (result.success) toast.success("Process logic saved successfully!");
      else toast.error(result.error || "Save failed");
    } catch (e) { toast.error("Sync error"); }
    finally { setIsSaving(false); }
  };

  const activeStep = useMemo(() => steps.find(s => s.id === activeId), [activeId, steps]);

  return (
    <div id="canvas-root" className={`flex flex-col bg-[#f6f8fb] ${isInternalFullscreen ? 'fixed inset-0 z-[999]' : '-m-8 h-[calc(100vh-4rem)] overflow-hidden font-sans'}`}>
      {!isInternalFullscreen && (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 relative z-20">
          <div>
            <h1 className="text-2xl font-black text-[var(--color-text)]">
              Process Builder
            </h1>
            <p className="mt-1 text-sm font-medium text-[var(--color-muted)]">
              Design, map, and synchronize operational process sequences visually.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Process Dropdown Selector */}
            <div className="relative min-w-[240px]">
              <button 
                onClick={() => setIsMatrixOpen(!isMatrixOpen)} 
                className="w-full flex items-center justify-between px-4 py-2.5 bg-white text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 transition-all font-semibold text-xs uppercase tracking-wider outline-none whitespace-nowrap shadow-xs"
              >
                <span className="flex items-center gap-2 text-slate-600">
                  <FiLayers className="w-4 h-4 text-blue-600" />
                  <span className="truncate max-w-[140px]">{selectedProcess?.name || "Select Process"}</span>
                </span>
                <FiChevronDown className={`ml-3 text-slate-400 transition-transform duration-300 ${isMatrixOpen ? 'rotate-180' : ''}`} />
              </button>
              {isMatrixOpen && (
                <div className="absolute top-full right-0 w-[280px] mt-2 bg-white border border-slate-200 rounded-xl shadow-lg z-[200] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="max-h-[300px] overflow-y-auto p-1">
                    {processes.length > 0 ? processes.map(p => (
                      <div 
                        key={p._id} 
                        onClick={() => { setSelectedProcessId(p._id); setIsMatrixOpen(false); }} 
                        className={`px-4 py-2.5 text-xs font-semibold uppercase tracking-wider cursor-pointer transition-all rounded-lg hover:bg-blue-50 hover:text-blue-600 ${selectedProcessId === p._id ? 'text-blue-600 bg-blue-50/50' : 'text-slate-600'}`}
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

            <button 
              onClick={addStep} 
              className="flex items-center gap-2 px-4 py-2.5 bg-white text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 transition-all font-semibold text-xs uppercase tracking-wider shadow-xs"
            >
              <FiPlus className="w-4 h-4 text-blue-600" />
              Add Step
            </button>

            <button 
              onClick={saveSequence} 
              disabled={!selectedProcessId || isSaving} 
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all font-bold text-xs uppercase tracking-wider shadow-md shadow-blue-600/10 disabled:opacity-50"
            >
              {isSaving ? <FiActivity className="animate-spin" /> : <FiSave className="w-4 h-4" />}
              Sync Architecture
            </button>
          </div>
        </div>
      )}

      <div className={`flex-1 relative bg-white ${isInternalFullscreen ? '' : 'rounded-3xl border border-slate-200 shadow-[inset_0_0_80px_rgba(0,0,0,0.02)]'} overflow-hidden transition-all duration-700 mx-6 mb-6`}>
        {isInternalFullscreen && (
          <button onClick={toggleFullScreen} className="absolute top-8 left-1/2 -translate-x-1/2 w-12 h-12 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-500 hover:text-blue-600 transition-all z-[60] shadow-2xl">
            <FiX className="w-5 h-5" />
          </button>
        )}

        {/* Grid pattern background */}
        <div className="absolute inset-0 opacity-[0.6] pointer-events-none" style={{ backgroundImage: `radial-gradient(#cbd5e1 1.5px, transparent 1.5px)`, backgroundSize: `24px 24px` }} />

        {/* Left top Process Map Overlay */}
        {selectedProcessId && (
          <div className="absolute left-8 top-8 z-30">
            <button className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all font-bold text-xs uppercase tracking-wider shadow-lg shadow-blue-600/20">
              <FiLayers className="w-4 h-4" />
              Process Map
            </button>
          </div>
        )}

        {/* Bottom center controls capsule */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-white border border-slate-200 rounded-full px-6 py-2.5 shadow-lg flex items-center gap-6 z-30">
          <div className="flex items-center gap-3">
            <button onClick={handleZoomOut} title="Zoom Out" className="text-slate-500 hover:text-blue-600 transition-colors">
              <FiZoomOut size={16} />
            </button>
            <span className="text-xs font-semibold text-slate-700 min-w-[36px] text-center">
              {Math.round(zoomScale * 100)}%
            </span>
            <button onClick={handleZoomIn} title="Zoom In" className="text-slate-500 hover:text-blue-600 transition-colors">
              <FiZoomIn size={16} />
            </button>
          </div>

          <div className="w-px h-4 bg-slate-200" />

          <button onClick={fitToView} className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-blue-600 transition-colors">
            <FiRefreshCw size={14} />
            <span>Reset View</span>
          </button>

          <div className="w-px h-4 bg-slate-200" />

          <button onClick={toggleFullScreen} title="Toggle Fullscreen" className="text-slate-500 hover:text-blue-600 transition-colors">
            <FiMaximize size={15} />
          </button>
        </div>

        <div 
          className="absolute inset-0 overflow-hidden cursor-grab active:cursor-grabbing" 
          onMouseDown={handleCanvasMouseDown}
          onMouseMove={handleCanvasMouseMove}
          onMouseUp={handleCanvasMouseUp}
          onMouseLeave={handleCanvasMouseUp}
          onClick={() => setSelectedStepId(null)}
        >
          <div 
            className="w-full h-full relative transition-transform duration-100 ease-linear origin-center"
            style={{ transform: `scale(${zoomScale}) translate(${panOffset.x / zoomScale}px, ${panOffset.y / zoomScale}px)` }}
          >
          {!selectedProcessId ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center animate-in fade-in duration-1000">
              <div className="w-40 h-40 bg-slate-50 rounded-[3rem] flex items-center justify-center mb-10 border border-slate-200 relative">
                 <div className="absolute inset-0 bg-blue-500/10 rounded-[3.5rem] blur-3xl opacity-20" />
                 <FiLayers className="w-16 h-16 text-slate-300" />
              </div>
              <h3 className="text-3xl font-black text-slate-800 uppercase tracking-tighter italic">Process <span className="text-blue-600">Arena</span></h3>
              <p className="max-w-xs text-slate-400 mt-4 text-[10px] font-black uppercase tracking-[0.4em] leading-relaxed">Select a workflow pattern from the header to begin layout configuration.</p>
            </div>
          ) : (
            <>
              <svg className="absolute inset-0 w-full h-full pointer-events-none">
                {steps.map((step, idx) => <ConnectionLine key={`conn-${step.id}`} from={step} to={steps[idx + 1]} />)}
              </svg>
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
                <div className="relative w-full h-full">
                  {steps.map((step, index) => <StepNode key={step.id} step={{...step, isLast: index === steps.length - 1}} isSelected={selectedStepId === step.id} onClick={(s) => setSelectedStepId(s.id)} />)}
                </div>
                <DragOverlay dropAnimation={null}>
                  {activeId ? ( 
                    <div className="w-[260px] bg-white border border-blue-600 rounded-xl p-5 shadow-2xl opacity-95">
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-blue-600">Reconfiguring...</span>
                      </div>
                      <h4 className="font-bold text-slate-800 text-sm leading-snug">{steps.find(s => s.id === activeId)?.title}</h4>
                    </div> 
                  ) : null}
                </DragOverlay>
              </DndContext>
            </>
          )}
          </div>
        </div>

        {/* Sidebar Panel (Node Settings) */}
        {selectedStep && (
          <div className={`absolute inset-y-0 right-0 w-[380px] bg-white border-l border-slate-200 shadow-[-10px_0_30px_rgba(0,0,0,0.03)] z-[100] transform transition-transform duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] ${selectedStepId ? 'translate-x-0' : 'translate-x-full'}`}>
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-800 leading-none">Node Settings</h2>
                <button onClick={() => setSelectedStepId(null)} className="w-8 h-8 rounded-lg bg-slate-50 hover:bg-slate-100 flex items-center justify-center transition-all border border-slate-100 text-slate-400 hover:text-slate-600">
                  <FiX size={16} />
                </button>
              </div>

              {/* Body Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-none">
                {/* Node Title */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Node Title</label>
                  <input 
                    type="text" 
                    value={selectedStep.title || ""} 
                    onChange={(e) => updateStep(selectedStep.id, { title: e.target.value })} 
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:border-blue-500 outline-none transition-all font-semibold" 
                    placeholder="Title..." 
                  />
                </div>

                {/* Assignee / API Endpoint look */}
                <div className="space-y-2 relative">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Logic Assignee</label>
                  <button 
                    onClick={() => setIsAssigneeDropdownOpen(!isAssigneeDropdownOpen)} 
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm text-slate-700 outline-none flex items-center justify-between hover:border-slate-300 transition-all font-semibold"
                  >
                    <span className="flex items-center gap-2">
                      <FiSearch className="text-slate-400 w-4 h-4" />
                      <span className="truncate">{selectedStep.assignee && typeof selectedStep.assignee === 'object' ? selectedStep.assignee.name : (selectedStep.assignee || "Unassigned")}</span>
                    </span>
                    <FiChevronDown className={`text-slate-400 transition-transform duration-300 ${isAssigneeDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {isAssigneeDropdownOpen && (
                    <div className="absolute bottom-full left-0 w-full mb-2 bg-white border border-slate-200 rounded-xl shadow-lg z-[100] max-h-[180px] overflow-y-auto scrollbar-none p-1">
                      <div 
                        onClick={() => { updateStep(selectedStep.id, { assignee: "Unassigned" }); setIsAssigneeDropdownOpen(false); }} 
                        className="px-4 py-2 text-xs text-blue-600 font-bold hover:bg-slate-50 rounded-lg cursor-pointer transition-all border-b border-slate-100 mb-1"
                      >
                        Unassigned Core
                      </div>
                      {workspaceUsers.map(user => ( 
                        <div 
                          key={user._id} 
                          onClick={() => { updateStep(selectedStep.id, { assignee: user }); setIsAssigneeDropdownOpen(false); }} 
                          className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-50 hover:text-slate-900 rounded-lg cursor-pointer transition-all mb-1 last:mb-0"
                        >
                          {user.name}
                        </div> 
                      ))}
                    </div>
                  )}
                  {/* Secondary URL-like label beneath */}
                  <p className="text-[10px] text-slate-400 font-mono mt-1">
                    {selectedStep.assignee && typeof selectedStep.assignee === 'object' ? `workflow://assignee/${selectedStep.assignee.email || selectedStep.assignee._id}` : 'workflow://assignee/unassigned'}
                  </p>
                </div>

                {/* Retry Policy (High fidelity UI match) */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Retry Policy</label>
                  <div className="flex bg-slate-50 border border-slate-200 p-1 rounded-lg">
                    <button className="flex-1 py-1.5 text-xs font-bold text-blue-600 bg-white border border-slate-200/50 rounded-md shadow-xs transition-all">
                      3 Attempts
                    </button>
                    <button className="flex-1 py-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors">
                      Custom
                    </button>
                  </div>
                </div>

                {/* Output Mappings (High fidelity UI match) */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Output Mappings</label>
                    <button className="text-[10px] font-bold text-blue-600 hover:text-blue-700 transition-colors">+ ADD MAPPING</button>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-100 rounded-lg">
                      <span className="text-xs font-mono text-slate-600">$enrichment_score</span>
                      <span className="text-[10px] font-semibold bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">Integer</span>
                    </div>
                    <div className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-100 rounded-lg">
                      <span className="text-xs font-mono text-slate-600">$company_name</span>
                      <span className="text-[10px] font-semibold bg-green-50 text-green-600 px-2 py-0.5 rounded-full">String</span>
                    </div>
                  </div>
                </div>

                {/* Estimate Time */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Estimate Time</label>
                  <div className="relative">
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                      <FiClock size={14} />
                    </div>
                    <input 
                      type="text" 
                      value={selectedStep.estimateTime || ""} 
                      onChange={(e) => updateStep(selectedStep.id, { estimateTime: e.target.value })} 
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:border-blue-500 outline-none transition-all font-semibold" 
                      placeholder="e.g. 1 day"
                    />
                  </div>
                </div>

                {/* Description / Evidence Textarea */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Evidence</label>
                  <textarea 
                    rows={3} 
                    value={selectedStep.description || ""} 
                    onChange={(e) => updateStep(selectedStep.id, { description: e.target.value })} 
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:border-blue-500 outline-none transition-all font-medium resize-none leading-relaxed" 
                    placeholder="Provide evidence description for this node configuration..." 
                  />
                </div>
              </div>

              {/* Footer Buttons */}
              <div className="p-6 border-t border-slate-100 bg-slate-50/50 space-y-2">
                <button className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-sm tracking-wide shadow-md shadow-blue-500/10 transition-all">
                  Validate
                </button>
                <button 
                  onClick={() => { setSelectedStepId(null); saveSequence(); }} 
                  className="w-full py-3 bg-white hover:bg-slate-50 text-blue-600 border border-blue-200 hover:border-blue-300 rounded-lg font-bold text-sm tracking-wide transition-all"
                >
                  Save Node Config
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
