"use client";

import { useState, useEffect, useMemo } from "react";
import { 
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  useDraggable,
  defaultDropAnimationSideEffects
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { 
  FiZap, 
  FiSave, 
  FiSearch, 
  FiMaximize2, 
  FiMinimize2, 
  FiMousePointer, 
  FiLayers,
  FiPlay,
  FiCheckCircle,
  FiMinus,
  FiMaximize,
  FiUser,
  FiClock,
  FiGrid,
  FiChevronDown,
  FiPlus,
  FiActivity,
  FiArrowRight,
  FiX,
  FiCalendar,
  FiAlertCircle,
  FiChevronRight
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
  let typeLabel = "STEP";
  let typeIcon = <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />;
  let tagColor = "text-blue-400";
  let borderColor = isSelected ? "border-amber-500" : "border-white/5";

  if (isStart) {
    typeLabel = "START";
    typeIcon = <FiPlay className="w-2.5 h-2.5 text-green-500 fill-green-500/20" />;
    tagColor = "text-green-500";
    if (!isSelected) borderColor = "border-green-500/30";
  } else if (isEnd) {
    typeLabel = "END";
    typeIcon = <FiCheckCircle className="w-2.5 h-2.5 text-purple-500" />;
    tagColor = "text-purple-500";
    if (!isSelected) borderColor = "border-purple-500/30";
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
        className={`canvas-node w-[260px] bg-[#141416] border-2 ${borderColor} ${isSelected ? 'ring-4 ring-amber-500/10' : 'hover:border-white/20'} rounded-2xl p-5 shadow-2xl transition-all cursor-pointer group relative overflow-hidden`}
      >
        <div {...attributes} {...listeners} className="absolute top-0 left-0 w-full h-8 cursor-grab active:cursor-grabbing z-50" />
        <div className="flex items-center gap-2 mb-4 mt-2">
          {typeIcon}
          <span className={`text-[10px] font-black uppercase tracking-widest ${tagColor}`}>{typeLabel}</span>
        </div>
        <h4 className="font-bold text-gray-100 text-lg mb-6 group-hover:text-amber-400 transition-colors leading-snug">
          {step.title || "Untitled Step"}
        </h4>
        <div className="flex items-center justify-between pt-4 border-t border-white/5">
           <div className="flex items-center gap-2.5">
             <div className="w-2 h-2 rounded-full bg-gray-600" />
             <span className="text-[11px] font-medium text-gray-400 truncate max-w-[120px]">
                {step.assignee && typeof step.assignee === 'object' ? step.assignee.name : (step.assignee || "Unassigned")}
             </span>
           </div>
           {step.estimateTime && (
             <div className="flex items-center gap-1.5 px-2 py-0.5 bg-blue-500/5 rounded-md border border-blue-500/20">
               <FiClock className="w-2.5 h-2.5 text-blue-400" />
               <span className="text-[9px] font-black text-blue-400 uppercase tracking-tighter">
                 {step.estimateTime}
               </span>
             </div>
           )}
        </div>
      </div>
    </div>
  );
}

function ConnectionLine({ from, to }) {
  if (!from || !to) return null;
  const x1 = (from.position?.x || 0) + 260;
  const y1 = (from.position?.y || 0) + 70;
  const x2 = (to.position?.x || 0);
  const y2 = (to.position?.y || 0) + 70;

  const dx = Math.abs(x1 - x2) * 0.4;
  const path = `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;

  return (
    <g>
      <path d={path} stroke="white" strokeWidth="2" fill="none" strokeOpacity="0.1" markerEnd="url(#arrowhead)" className="transition-all duration-300" />
      <circle cx={x2} cy={y2} r="3" fill="white" fillOpacity="0.2" />
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
      if (result.success) toast.success("Neural architecture saved!");
      else toast.error(result.error || "Save failed");
    } catch (e) { toast.error("Sync error"); }
    finally { setIsSaving(false); }
  };

  const activeStep = useMemo(() => steps.find(s => s.id === activeId), [activeId, steps]);

  return (
    <div id="canvas-root" className={`flex bg-[#0a0a0b] ${isInternalFullscreen ? 'fixed inset-0 z-[999]' : '-m-8 h-screen overflow-hidden font-sans'}`}>
      {!isInternalFullscreen && <div className="hidden lg:block w-0" />} 

      <div className="flex flex-col flex-1 p-8 overflow-hidden relative">
        {!isInternalFullscreen && (
          <div className="flex flex-col lg:flex-row items-center justify-between gap-6 mb-8 relative z-20 animate-in slide-in-from-top-4 duration-500">
            <div className="flex items-center gap-6">
               <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-amber-700 rounded-3xl flex items-center justify-center shadow-[0_0_40px_rgba(245,158,11,0.4)] border border-amber-400/20 transition-transform hover:scale-105">
                  <FiZap className="w-8 h-8 text-white" />
               </div>
               <div>
                  <h1 className="text-3xl font-black text-white tracking-tight uppercase italic leading-none">Matrix <span className="text-amber-500">Architect</span></h1>
                  <div className="flex items-center gap-3 mt-2">
                     <div className="flex items-center gap-2 px-3 py-1 bg-amber-500/10 rounded-lg border border-amber-500/30">
                        <div className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_10px_rgb(245,158,11)]" />
                        <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest leading-none">Logic Core Active</span>
                     </div>
                  </div>
               </div>
            </div>

            <div className="flex items-center gap-3 bg-[#111113]/80 p-2 rounded-2xl border border-white/5 backdrop-blur-3xl shadow-2xl">
              <div className="relative min-w-[240px]">
                <button 
                  onClick={() => setIsMatrixOpen(!isMatrixOpen)} 
                  className="w-full flex items-center justify-between px-6 py-3 bg-white/5 text-gray-300 rounded-xl hover:bg-white/10 transition-all font-bold text-[10px] uppercase tracking-widest border border-white/5 outline-none whitespace-nowrap"
                >
                  <FiGrid className="w-4 h-4 text-amber-500 mr-3" />
                  <span className="truncate max-w-[140px]">{selectedProcess?.name || "Select Matrix"}</span>
                  <FiChevronDown className={`ml-3 transition-transform duration-300 ${isMatrixOpen ? 'rotate-180' : ''}`} />
                </button>
                {isMatrixOpen && (
                  <div className="absolute top-full right-0 w-[280px] mt-3 bg-[#111113] border border-white/10 rounded-2xl shadow-[0_30px_60px_rgba(0,0,0,0.8)] z-[200] overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300 backdrop-blur-2xl">
                    <div className="max-h-[300px] overflow-y-auto scrollbar-none p-2">
                      {processes.length > 0 ? processes.map(p => (
                        <div key={p._id} onClick={() => { setSelectedProcessId(p._id); setIsMatrixOpen(false); }} className={`px-5 py-3.5 text-[10px] font-black uppercase tracking-widest cursor-pointer transition-all rounded-xl hover:bg-amber-500/10 hover:text-amber-500 border-b border-white/5 last:border-0 ${selectedProcessId === p._id ? 'text-amber-500 bg-amber-500/5' : 'text-gray-400'}`}>
                          {p.name}
                        </div>
                      )) : (
                        <div className="px-5 py-8 text-[10px] text-gray-600 font-bold uppercase tracking-widest text-center italic">No patterns found</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
              <div className="w-[1px] h-8 bg-white/5 mx-1" />
              <button onClick={addStep} className="flex items-center gap-2 px-6 py-3 bg-white/5 text-gray-300 rounded-xl hover:bg-white/10 transition-all font-bold text-[10px] uppercase tracking-widest border border-white/5">
                <FiPlus className="w-4 h-4 text-blue-500" />
                Add Segment
              </button>
              <button onClick={saveSequence} disabled={!selectedProcessId || isSaving} className="flex items-center gap-2 px-8 py-3 bg-amber-600 text-white rounded-xl hover:bg-amber-500 transition-all font-black text-[10px] uppercase tracking-widest shadow-lg shadow-amber-600/20 disabled:opacity-30 ml-2">
                {isSaving ? <FiActivity className="animate-spin" /> : <FiSave className="w-4 h-4" />}
                Sync Architecture
              </button>
            </div>
          </div>
        )}

        <div className={`flex-1 relative bg-[#070708] ${isInternalFullscreen ? '' : 'rounded-[4rem] border border-white/5 shadow-[inset_0_0_150px_rgba(0,0,0,0.9)]'} overflow-hidden transition-all duration-700`}>
          {isInternalFullscreen && (
            <button onClick={toggleFullScreen} className="absolute top-8 left-1/2 -translate-x-1/2 w-12 h-12 bg-[#1a1c1e] border border-white/10 rounded-full flex items-center justify-center text-gray-400 hover:text-white transition-all z-[60] shadow-2xl">
              <FiX className="w-5 h-5" />
            </button>
          )}

          <div className="absolute inset-0 opacity-[0.04] pointer-events-none" style={{ backgroundImage: `linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)`, backgroundSize: `60px 60px` }} />
          <div className="absolute inset-0 opacity-[0.08] pointer-events-none" style={{ backgroundImage: `radial-gradient(#fff 1px, transparent 1px)`, backgroundSize: `12px 12px` }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1400px] h-[700px] bg-amber-500/[0.04] rounded-full blur-[150px] pointer-events-none" />
          
          <div className="absolute left-8 top-1/2 -translate-y-1/2 flex flex-col gap-4 z-30">
            <button className="w-12 h-12 bg-[#111113] border border-white/10 rounded-2xl flex items-center justify-center text-gray-500 hover:text-amber-500 transition-all shadow-3xl hover:border-amber-500/30"><FiMousePointer className="w-5 h-5" /></button>
            <div className="flex flex-col gap-1 p-1 bg-[#111113] border border-white/10 rounded-2xl shadow-3xl">
              <button onClick={handleZoomIn} title="Zoom In" className="w-10 h-10 flex items-center justify-center text-gray-500 hover:text-white transition-all"><FiPlus className="w-4 h-4" /></button>
              <button onClick={handleZoomOut} title="Zoom Out" className="w-10 h-10 flex items-center justify-center text-gray-500 hover:text-white transition-all"><FiMinus className="w-4 h-4" /></button>
            </div>
            <button onClick={fitToView} title="Fit to Screen" className="w-12 h-12 bg-[#111113] border border-white/10 rounded-2xl flex items-center justify-center text-blue-500 bg-blue-500/5 hover:bg-blue-500/10 transition-all shadow-3xl hover:border-blue-500/30"><FiMaximize className="w-5 h-5" /></button>
            <button onClick={toggleFullScreen} title="Toggle Fullscreen" className="w-12 h-12 bg-[#111113] border border-white/10 rounded-2xl flex items-center justify-center text-gray-400 hover:text-amber-500 transition-all shadow-3xl hover:border-amber-500/30"><FiMaximize2 className="w-5 h-5" /></button>
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
                <div className="w-40 h-40 bg-gradient-to-t from-white/0 to-white/[0.02] rounded-[3rem] flex items-center justify-center mb-10 border border-white/5 relative">
                   <div className="absolute inset-0 bg-blue-500/10 rounded-[3.5rem] blur-3xl opacity-20" />
                   <FiLayers className="w-16 h-16 text-white/5" />
                </div>
                <h3 className="text-4xl font-black text-white uppercase tracking-tighter italic">Neural <span className="text-amber-500">Arena</span></h3>
                <p className="max-w-xs text-gray-600 mt-6 text-[10px] font-black uppercase tracking-[0.4em] leading-relaxed">Select specialized pattern matrix from the header to initialize logic mapping.</p>
              </div>
            ) : (
              <>
                <svg className="absolute inset-0 w-full h-full pointer-events-none">
                  <defs><marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto"><polygon points="0 0, 10 3.5, 0 7" fill="white" fillOpacity="0.12" /></marker></defs>
                  {steps.map((step, idx) => <ConnectionLine key={`conn-${step.id}`} from={step} to={steps[idx + 1]} />)}
                </svg>
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
                  <div className="relative w-full h-full">
                    {steps.map((step, index) => <StepNode key={step.id} step={{...step, isLast: index === steps.length - 1}} isSelected={selectedStepId === step.id} onClick={(s) => setSelectedStepId(s.id)} />)}
                  </div>
                  <DragOverlay dropAnimation={null}>{activeId ? ( <div className="w-[260px] bg-[#141416]/90 backdrop-blur-2xl border-2 border-amber-500/50 rounded-2xl p-5 shadow-[0_0_60px_rgba(245,158,11,0.2)] opacity-95"><div className="flex items-center gap-2 mb-4"><div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" /><span className="text-[10px] font-black uppercase tracking-widest text-amber-500">Reconfiguring...</span></div><h4 className="font-bold text-white text-lg leading-snug">{steps.find(s => s.id === activeId)?.title}</h4></div> ) : null}</DragOverlay>
                </DndContext>
              </>
            )}
            </div>
          </div>

          {selectedProcessId && !isLoading && (
            <div className="absolute right-12 bottom-12 bg-[#0d0d0f]/90 backdrop-blur-3xl border border-white/5 rounded-[2rem] p-6 shadow-3xl min-w-[240px] transition-all z-40">
               <div className="flex items-center justify-between mb-5 pb-3 border-b border-white/5">
                  <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Diagnostic Intel</span>
                  <FiActivity className="text-amber-500 w-4 h-4 animate-pulse" />
               </div>
               <div className="space-y-6">
                  <div className="flex items-center justify-between">
                     <div className="flex flex-col"><span className="text-[9px] text-gray-600 font-black uppercase tracking-tighter">Mapped Nodes</span><span className="text-2xl font-black text-white mt-1 italic leading-none">{steps.length}</span></div>
                     <div className="flex flex-col items-end"><span className="text-[9px] text-gray-600 font-black uppercase tracking-tighter">Exec Time</span><span className="text-lg font-black text-amber-500 mt-1 italic leading-none">14.5h</span></div>
                  </div>
                  <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden relative shadow-inner"><div className="absolute top-0 left-0 h-full w-[85%] bg-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.6)] rounded-full" /></div>
               </div>
            </div>
          )}

          {/* Sidebar Panel - Absolute to current container */}
          {selectedStep && (
            <div className={`absolute inset-y-0 right-0 w-[380px] bg-[#070708] border-l border-white/5 shadow-[-30px_0_60px_rgba(0,0,0,0.8)] z-[100] transform transition-transform duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] ${selectedStepId ? 'translate-x-0' : 'translate-x-full'}`}>
              <div className="flex flex-col h-full bg-gradient-to-b from-[#0d0d0f] to-[#070708]">
                <div className="p-6 border-b border-white/5 flex items-center justify-between">
                  <div>
                    <span className="text-[9px] font-black text-amber-500 uppercase tracking-[0.3em] mb-1 block">Logic Node Editor</span>
                    <h2 className="text-xl font-black text-white italic leading-none truncate max-w-[200px] uppercase tracking-tighter">{selectedStep.title || "Untitled Step"}</h2>
                  </div>
                  <button onClick={() => setSelectedStepId(null)} className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all border border-white/5 group"><FiX className="text-gray-500 group-hover:text-white group-hover:scale-110 transition-all" /></button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-none">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="col-span-2 space-y-3">
                      <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Step Designation</label>
                      <input type="text" value={selectedStep.title || ""} onChange={(e) => updateStep(selectedStep.id, { title: e.target.value })} className="w-full bg-black/60 border border-white/10 rounded-xl px-5 py-3.5 text-sm text-gray-100 outline-none focus:border-amber-500/50 transition-all font-bold placeholder:text-gray-700" placeholder="Operational title..." />
                    </div>
                    <div className="space-y-3">
                      <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Seq No</label>
                      <input type="number" value={selectedStep.sequenceNo || ""} onChange={(e) => updateStep(selectedStep.id, { sequenceNo: e.target.value })} className="w-full bg-amber-500/5 border border-amber-500/20 rounded-xl px-5 py-3.5 text-sm text-amber-500 outline-none focus:border-amber-500/50 transition-all font-black text-center" />
                    </div>
                  </div>

                  <div className="space-y-3">
                     <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Operational Directive</label>
                     <textarea rows={4} value={selectedStep.description || ""} onChange={(e) => updateStep(selectedStep.id, { description: e.target.value })} className="w-full bg-black/60 border border-white/10 rounded-xl px-5 py-4 text-sm text-gray-300 outline-none focus:border-amber-500/50 transition-all font-medium resize-none leading-relaxed placeholder:text-gray-700 font-sans" placeholder="Specify logic parameters..." />
                  </div>

                  <div className="space-y-3 relative">
                     <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Logic Assignee</label>
                     <button onClick={() => setIsAssigneeDropdownOpen(!isAssigneeDropdownOpen)} className="w-full bg-black/60 border border-white/10 rounded-xl p-4 text-sm text-gray-200 outline-none flex items-center justify-between hover:border-amber-500/30 transition-all group relative">
                       <div className="flex items-center gap-3 text-gray-400 group-hover:text-white transition-colors">
                         <FiUser className="w-4 h-4 text-amber-500/50" />
                         <span className="truncate font-bold tracking-tight text-xs">{typeof selectedStep.assignee === 'object' ? selectedStep.assignee.name : (selectedStep.assignee || "Unassigned")}</span>
                       </div>
                       <FiChevronDown className={`text-gray-500 transition-transform duration-500 ${isAssigneeDropdownOpen ? 'rotate-180 text-amber-500' : ''}`} />
                     </button>
                     {isAssigneeDropdownOpen && (
                       <div className="absolute bottom-full left-0 w-full mb-2 bg-[#111113] border border-white/10 rounded-xl shadow-3xl z-[100] max-h-[180px] overflow-y-auto scrollbar-none backdrop-blur-2xl p-1.5">
                         <div onClick={() => { updateStep(selectedStep.id, { assignee: "Unassigned" }); setIsAssigneeDropdownOpen(false); }} className="px-4 py-3 text-[9px] text-amber-500 font-black uppercase tracking-widest hover:bg-amber-500/10 rounded-lg cursor-pointer transition-all border-b border-white/5 mb-1">Unassigned Core</div>
                         {workspaceUsers.map(user => ( <div key={user._id} onClick={() => { updateStep(selectedStep.id, { assignee: user }); setIsAssigneeDropdownOpen(false); }} className="px-4 py-3 text-[9px] text-gray-400 font-black uppercase tracking-widest hover:bg-white/5 hover:text-white rounded-lg cursor-pointer transition-all mb-1 last:mb-0 border-b border-white/5 last:border-0">{user.name}</div> ))}
                       </div>
                     )}
                  </div>

                  <div className="space-y-3">
                    <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Estimate Time</label>
                    <div className="relative group">
                      <div className="absolute left-5 top-1/2 -translate-y-1/2 w-7 h-7 bg-blue-500/10 rounded-lg flex items-center justify-center border border-blue-500/20 group-hover:bg-blue-500/20 transition-all">
                        <FiClock className="text-blue-500 w-3.5 h-3.5" />
                      </div>
                      <input 
                        type="text" 
                        value={selectedStep.estimateTime || ""} 
                        onChange={(e) => updateStep(selectedStep.id, { estimateTime: e.target.value })} 
                        className="w-full bg-black/60 border border-white/10 rounded-xl pl-16 pr-5 py-4 text-xs text-white outline-none focus:border-blue-500/50 transition-all font-bold placeholder:text-gray-700" 
                        placeholder="e.g. 1 day 3 hours"
                      />
                    </div>
                  </div>
                </div>

                <div className="p-6 border-t border-white/5 bg-black/20 text-center">
                   <p className="text-[7px] text-gray-600 font-bold uppercase tracking-[0.4em] italic leading-tight">Neural Sync Active</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
