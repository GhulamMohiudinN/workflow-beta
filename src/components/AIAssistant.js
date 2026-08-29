"use client";

/**
 * Floating AI assistant — bottom-right on every authenticated page.
 * Talks to Gemini via the backend proxy (/ai/chat) using function calling.
 * Actions the model can trigger are executed locally (navigation, or an
 * existing authenticated API call) — the backend never performs them itself.
 */

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FiCpu, FiX, FiSend } from "react-icons/fi";
import { aiAPI } from "../app/api/aiAPI";
import { adminAPI } from "../app/api/admin";
import { irisReportingAPI } from "../app/api/irisReportingAPI";

const PAGE_LABELS = {
  "/dashboard": "Dashboard", "/processes": "Processes", "/templates": "Templates",
  "/builder": "Process Builder", "/users": "Users", "/users/add": "Add Team Member",
  "/settings": "Settings", "/activity-logs": "Activity Logs", "/reports": "Reports",
  "/iris-reporting": "IRIS Reporting", "/invoicing": "Invoicing", "/company": "Company",
};

const WELCOME = "Hi — I can navigate the app, filter obligations, generate a report, invite a team member, or answer a quick status question. What do you need?";

export default function AIAssistant() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([{ role: "assistant", text: WELCOME }]);
  const [contents, setContents] = useState([]); // raw Gemini conversation turns
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, open]);

  const say = (text) => setMessages((prev) => [...prev, { role: "assistant", text }]);

  // ── Execute a tool call the model requested, and decide whether a follow-up
  //    round-trip is needed for the model to phrase a natural final reply ──
  const runTool = async (functionCall, workingContents) => {
    const { name, args = {} } = functionCall;

    if (name === "navigate") {
      router.push(args.path);
      say(`Opening ${PAGE_LABELS[args.path] || args.path}…`);
      return null; // no follow-up needed
    }

    if (name === "filter_obligations") {
      const params = new URLSearchParams({ tab: "Obligations", filter: args.status || "all" });
      if (args.search) params.set("search", args.search);
      router.push(`/iris-reporting?${params.toString()}`);
      say(`Showing ${(args.status || "all").replace("_", " ")} obligations…`);
      return null;
    }

    if (name === "generate_report") {
      router.push(`/iris-reporting?tab=Report+Pack&autoSelect=${args.filter || "all"}`);
      say(`Building a report from ${(args.filter || "all").replace("_", " ")} obligations…`);
      return null;
    }

    if (name === "add_team_member") {
      try {
        await adminAPI.inviteTeamMember({ name: args.name, email: args.email, role: args.role || "editor" });
        return { name, response: { success: true, message: `Invited ${args.name} (${args.email}) as ${args.role || "editor"}.` } };
      } catch (err) {
        const message = err.response?.data?.message || err.message || "Failed to invite team member";
        return { name, response: { success: false, message } };
      }
    }

    if (name === "get_status_summary") {
      const res = await irisReportingAPI.getOverview();
      if (!res.success) return { name, response: { success: false, message: "Could not load current status" } };
      return { name, response: { success: true, summary: res.data?.summary || {} } };
    }

    return null;
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    setMessages((prev) => [...prev, { role: "user", text }]);
    setLoading(true);

    let working = [...contents, { role: "user", parts: [{ text }] }];
    setContents(working);

    const res = await aiAPI.chat(working);
    if (!res.success) {
      say(res.error || "Something went wrong talking to the assistant.");
      setLoading(false);
      return;
    }

    if (res.text) say(res.text);

    if (res.functionCall) {
      const modelTurn = { role: "model", parts: [{ functionCall: res.functionCall }] };
      working = [...working, modelTurn];

      const toolResult = await runTool(res.functionCall, working);

      if (toolResult) {
        working = [...working, { role: "function", parts: [{ functionResponse: toolResult }] }];
        setContents(working);

        const followUp = await aiAPI.chat(working);
        if (followUp.success && followUp.text) say(followUp.text);
      } else {
        setContents(working);
      }
    }

    setLoading(false);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Open AI assistant"
        className="fixed bottom-5 right-5 z-[400] flex h-12 w-12 items-center justify-center rounded-full bg-blue-700 text-white shadow-lg hover:bg-blue-800 transition-colors"
      >
        {open ? <FiX size={20} /> : <FiCpu size={20} />}
      </button>

      {open && (
        <div className="fixed bottom-20 right-5 z-[400] flex h-[480px] w-[360px] max-w-[calc(100vw-2.5rem)] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
          <div className="flex items-center gap-2 border-b border-slate-200 bg-slate-50 px-4 py-3">
            <FiCpu className="text-blue-700" size={16} />
            <p className="text-sm font-black text-slate-900">Assistant</p>
          </div>

          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] rounded-xl px-3 py-2 text-xs leading-relaxed ${
                  m.role === "user" ? "bg-blue-700 text-white" : "bg-slate-100 text-slate-800"
                }`}>
                  {m.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="rounded-xl bg-slate-100 px-3 py-2">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-slate-400 inline-block mr-1" />
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-slate-400 inline-block mr-1" style={{ animationDelay: "0.15s" }} />
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-slate-400 inline-block" style={{ animationDelay: "0.3s" }} />
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 border-t border-slate-200 p-3">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleSend(); }}
              placeholder="Ask me to do something…"
              disabled={loading}
              className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs focus:border-blue-500 outline-none disabled:opacity-50"
            />
            <button type="button" onClick={handleSend} disabled={loading || !input.trim()}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-700 text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-40 transition-colors">
              <FiSend size={13} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
