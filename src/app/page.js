"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import FullScreenLoader from "./(component)/FullScreenLoader";
import "./landing.css";

export default function Home() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleGetStarted = () => {
    setLoading(true);
    router.push("/signup");
  };

  return (
    <div className="landing-body">
      <FullScreenLoader loading={loading} />

      {/* ── Nav ───────────────────────────────────────────────────── */}
      <nav>
        <div className="container">
          <div className="nav-inner">
            <div className="logo">
              <div className="logo-mark">
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
                </svg>
              </div>
              <span className="logo-name">WorkflowPro</span>
            </div>
            <div className="nav-links">
              <a href="#how-it-works">How it works</a>
              <a href="#features">Features</a>
              <a href="#for-teams">For teams</a>
            </div>
            <div className="nav-cta">
              <Link href="/login" className="nav-login">Sign in</Link>
              <button 
                onClick={handleGetStarted} 
                className="btn-primary" 
                style={{ padding: "10px 22px", fontSize: "14px" }}
              >
                Get started free
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* ── Hero ──────────────────────────────────────────────────── */}
      <section className="hero">
        <div className="hero-grid-bg"></div>
        <div className="hero-glow"></div>
        <div className="container">
          <div className="hero-inner">

            <div className="hero-left">
              <div className="hero-eyebrow">
                <span></span>
                Process Management Platform
              </div>
              <h1 className="hero-h1">
                Build, assign,<br/>and track your<br/><em>business processes</em>
              </h1>
              <p className="hero-sub">
                Create structured workflows, assign each step to the right team member, and track progress in real time — all inside your company&apos;s private workspace.
              </p>
              <div className="hero-actions">
                <button onClick={handleGetStarted} className="btn-primary">
                  Create your workspace
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6"/>
                  </svg>
                </button>
                <Link href="/login" className="btn-outline">Sign in to your account</Link>
              </div>
              <p className="hero-note">No credit card required &nbsp;·&nbsp; Free to get started</p>
            </div>

            <div className="hero-right">
              {/* Product UI mockup — showing the real dashboard */}
              <div className="ui-mockup">
                <div className="mockup-topbar">
                  <div className="mockup-dots">
                    <span></span><span></span><span></span>
                  </div>
                  <div className="mockup-tabs">
                    <div className="mockup-tab active">Dashboard</div>
                    <div className="mockup-tab">Processes</div>
                    <div className="mockup-tab">Users</div>
                  </div>
                  <div style={{ width: "60px" }}></div>
                </div>
                <div className="mockup-body">
                  <div className="mockup-sidebar">
                    <div className="mockup-sidebar-item active">
                      <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
                    </div>
                    <div className="mockup-sidebar-item">
                      <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2"/></svg>
                    </div>
                    <div className="mockup-sidebar-item">
                      <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0"/></svg>
                    </div>
                    <div className="mockup-sidebar-item">
                      <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path strokeLinecap="round" strokeLinejoin="round" d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/></svg>
                    </div>
                  </div>
                  <div className="mockup-content">
                    <div className="mockup-title">Company Overview</div>
                    <div className="mockup-metrics">
                      <div className="mockup-metric">
                        <div className="mockup-metric-val blue">8</div>
                        <div className="mockup-metric-label">Active Workflows</div>
                      </div>
                      <div className="mockup-metric">
                        <div className="mockup-metric-val">12</div>
                        <div className="mockup-metric-label">Team Members</div>
                      </div>
                      <div className="mockup-metric">
                        <div className="mockup-metric-val green">24</div>
                        <div className="mockup-metric-label">Tasks Done</div>
                      </div>
                    </div>
                    <div className="mockup-section-title">Active Processes</div>
                    <div className="mockup-process-list">
                      <div className="mockup-process-item">
                        <div className="mockup-process-dot" style={{ background: "var(--success)" }}></div>
                        <div className="mockup-process-info">
                          <div className="mockup-process-name">Employee Onboarding</div>
                          <div className="mockup-process-sub">Step 3 of 6 · Assigned to Sarah</div>
                          <div className="mockup-progress"><div className="mockup-progress-fill" style={{ width: "50%" }}></div></div>
                        </div>
                        <div className="mockup-process-badge badge-active">Active</div>
                      </div>
                      <div className="mockup-process-item">
                        <div className="mockup-process-dot" style={{ background: "var(--amber)" }}></div>
                        <div className="mockup-process-info">
                          <div className="mockup-process-name">Purchase Approval</div>
                          <div className="mockup-process-sub">Step 1 of 4 · Awaiting review</div>
                          <div className="mockup-progress"><div className="mockup-progress-fill" style={{ width: "25%", background: "var(--amber)" }}></div></div>
                        </div>
                        <div className="mockup-process-badge badge-pending">Pending</div>
                      </div>
                      <div className="mockup-process-item">
                        <div className="mockup-process-dot" style={{ background: "var(--primary)" }}></div>
                        <div className="mockup-process-info">
                          <div className="mockup-process-name">Quality Review</div>
                          <div className="mockup-process-sub">Step 5 of 5 · Final check</div>
                          <div className="mockup-progress"><div className="mockup-progress-fill" style={{ width: "90%" }}></div></div>
                        </div>
                        <div className="mockup-process-badge badge-done">Review</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── Trust bar ─────────────────────────────────────────────── */}
      <div className="trust-bar">
        <div className="container">
          <div className="trust-inner">
            <div className="trust-item">
              <div className="trust-icon">🔒</div>
              Company data isolation
            </div>
            <div className="trust-item">
              <div className="trust-icon">👥</div>
              Multi-tenant workspaces
            </div>
            <div className="trust-item">
              <div className="trust-icon">⚡</div>
              Real-time status updates
            </div>
            <div className="trust-item">
              <div className="trust-icon">📋</div>
              Role-based access control
            </div>
            <div className="trust-item">
              <div className="trust-icon">🗂️</div>
              Process templates library
            </div>
          </div>
        </div>
      </div>

      {/* ── How it works ───────────────────────────────────────────── */}
      <section className="how-it-works" id="how-it-works">
        <div className="container">
          <div className="section-header">
            <span className="section-label">How it works</span>
            <h2>Your workspace, up and running<br/>in four steps</h2>
            <p>WorkflowPro is built around the way real teams actually operate — not an abstract project board, but a structured process system with clear ownership.</p>
          </div>
          <div className="steps-grid">
            <div className="step-card">
              <div className="step-number">01</div>
              <div className="step-icon">
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="var(--primary)" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
                </svg>
              </div>
              <h3>Create your company workspace</h3>
              <p>Register your company, set up your profile, and get a fully isolated workspace that belongs only to your organisation.</p>
            </div>
            <div className="step-card">
              <div className="step-number">02</div>
              <div className="step-icon">
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="var(--primary)" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/>
                </svg>
              </div>
              <h3>Invite your team members</h3>
              <p>Add your team by email. Each member gets their own account, sees only what&apos;s assigned to them, and stays connected to your workspace.</p>
            </div>
            <div className="step-card">
              <div className="step-number">03</div>
              <div className="step-icon">
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="var(--primary)" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/>
                </svg>
              </div>
              <h3>Build your processes</h3>
              <p>Use the visual process builder to map out every step of your workflow. Assign each step to a specific team member or role.</p>
            </div>
            <div className="step-card">
              <div className="step-number">04</div>
              <div className="step-icon">
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="var(--primary)" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                </svg>
              </div>
              <h3>Track completion in real time</h3>
              <p>Team members mark their steps done. You see exactly what&apos;s active, what&apos;s pending, and what&apos;s complete — no chasing required.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ───────────────────────────────────────────────── */}
      <section className="features" id="features">
        <div className="container">

          {/* Feature 1: Process Builder */}
          <div className="feature-section">
            <div className="features-grid">
              <div className="feature-visual">
                <div className="builder-visual">
                  <div className="builder-header">
                    <div className="builder-title">Employee Onboarding — Process Map</div>
                    <div className="builder-btn">+ Add Step</div>
                  </div>
                  <div className="builder-canvas">
                    <div className="builder-step active">
                      <div className="builder-step-num">1</div>
                      <div className="builder-step-info">
                        <div className="builder-step-name">Send offer letter</div>
                        <div className="builder-step-assign">Assigned · HR Manager</div>
                      </div>
                      <div className="builder-step-status badge-done">Done</div>
                    </div>
                    <div className="builder-connector"></div>
                    <div className="builder-step">
                      <div className="builder-step-num">2</div>
                      <div className="builder-step-info">
                        <div className="builder-step-name">Collect signed documents</div>
                        <div className="builder-step-assign">Assigned · Sarah K.</div>
                      </div>
                      <div className="builder-step-status badge-active">Active</div>
                    </div>
                    <div className="builder-connector"></div>
                    <div className="builder-step">
                      <div className="builder-step-num">3</div>
                      <div className="builder-step-info">
                        <div className="builder-step-name">Set up workstation & accounts</div>
                        <div className="builder-step-assign">Assigned · IT Team</div>
                      </div>
                      <div className="builder-step-status badge-pending">Pending</div>
                    </div>
                    <div className="builder-connector"></div>
                    <div className="builder-step">
                      <div className="builder-step-num">4</div>
                      <div className="builder-step-info">
                        <div className="builder-step-name">First-day orientation</div>
                        <div className="builder-step-assign">Assigned · Team Lead</div>
                      </div>
                      <div className="builder-step-status badge-pending">Pending</div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="feature-content">
                <span className="section-label">Process Builder</span>
                <h2>Map every step of how your work gets done</h2>
                <p>Break any business operation into clear, ordered steps. Each step gets a title, instructions, and an owner — so there&apos;s never any ambiguity about what needs to happen next or who is responsible for it.</p>
                <ul className="feature-list">
                  <li>
                    <div className="feature-list-icon">
                      <svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="var(--success)" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                    </div>
                    Visual step-by-step process map
                  </li>
                  <li>
                    <div className="feature-list-icon">
                      <svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="var(--success)" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                    </div>
                    Assign each step to a specific team member or role
                  </li>
                  <li>
                    <div className="feature-list-icon">
                      <svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="var(--success)" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                    </div>
                    Add instructions and evidence requirements per step
                  </li>
                  <li>
                    <div className="feature-list-icon">
                      <svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="var(--success)" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                    </div>
                    Edit, reorder, and update steps as your process evolves
                  </li>
                  <li>
                    <div className="feature-list-icon">
                      <svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="var(--success)" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                    </div>
                    Start from a pre-built template or build from scratch
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Feature 2: Team Management */}
          <div className="feature-section" style={{ paddingTop: "80px" }}>
            <div className="features-grid flip">
              <div className="feature-visual">
                <div className="team-visual">
                  <div className="team-header">
                    <div className="team-title">Team Members · Acme Logistics</div>
                    <div className="team-invite-btn">+ Invite member</div>
                  </div>
                  <div className="team-list">
                    <div className="team-member">
                      <div className="team-avatar" style={{ background: "#E6EEFB", color: "var(--primary)" }}>SK</div>
                      <div className="team-info">
                        <div className="team-name">Sarah Kim</div>
                        <div className="team-role">HR Manager</div>
                      </div>
                      <div className="team-tasks"><span>3</span> tasks active</div>
                    </div>
                    <div className="team-member">
                      <div className="team-avatar" style={{ background: "#E7F7ED", color: "var(--success)" }}>MR</div>
                      <div className="team-info">
                        <div className="team-name">Marcus Reid</div>
                        <div className="team-role">Operations Lead</div>
                      </div>
                      <div className="team-tasks"><span>5</span> tasks active</div>
                    </div>
                    <div className="team-member">
                      <div className="team-avatar" style={{ background: "#FEF3E2", color: "var(--amber)" }}>PT</div>
                      <div className="team-info">
                        <div className="team-name">Priya Thomas</div>
                        <div className="team-role">Compliance Officer</div>
                      </div>
                      <div className="team-tasks"><span>2</span> tasks active</div>
                    </div>
                    <div className="team-member">
                      <div className="team-avatar" style={{ background: "#F7F8FA", color: "var(--gray-600)" }}>JW</div>
                      <div className="team-info">
                        <div className="team-name">James Wilson</div>
                        <div className="team-role">IT Administrator</div>
                      </div>
                      <div className="team-tasks"><span>1</span> task active</div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="feature-content">
                <span className="section-label">Team Management</span>
                <h2>Your whole team, in one workspace</h2>
                <p>Invite team members, manage their access, and see exactly what everyone is working on — all from a single dashboard. Every user belongs to your company&apos;s isolated workspace.</p>
                <ul className="feature-list">
                  <li>
                    <div className="feature-list-icon">
                      <svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="var(--success)" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                    </div>
                    Invite team members by email
                  </li>
                  <li>
                    <div className="feature-list-icon">
                      <svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="var(--success)" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                    </div>
                    Role-based access — Admin, Editor, Viewer
                  </li>
                  <li>
                    <div className="feature-list-icon">
                      <svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="var(--success)" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                    </div>
                    See each member&apos;s active tasks at a glance
                  </li>
                  <li>
                    <div className="feature-list-icon">
                      <svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="var(--success)" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                    </div>
                    Real-time updates — no manual refresh needed
                  </li>
                </ul>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ── Stats ──────────────────────────────────────────────────── */}
      <section className="stats-section">
        <div className="stats-bg"></div>
        <div className="container">
          <div className="stats-inner">
            <div className="stats-label">Built for real operational work</div>
            <h2 className="stats-heading">Everything your processes need.<br/>Nothing they don&apos;t.</h2>
            <p className="stats-sub">WorkflowPro is designed around one idea: structured work, clearly owned, reliably tracked.</p>
            <div className="stats-grid">
              <div className="stat-item">
                <div className="stat-number"><span>∞</span></div>
                <div className="stat-desc">Processes per workspace — build as many as your operation requires</div>
              </div>
              <div className="stat-item">
                <div className="stat-number">100<span>%</span></div>
                <div className="stat-desc">Data isolation — your company&apos;s data is never mixed with another&apos;s</div>
              </div>
              <div className="stat-item">
                <div className="stat-number">1</div>
                <div className="stat-desc">Place for your entire team&apos;s process knowledge, assignments, and status</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── For teams section ──────────────────────────────────────── */}
      <section className="workflow-section" id="for-teams">
        <div className="container">
          <div className="workflow-inner">
            <div className="workflow-left">
              <span className="section-label">For team members</span>
              <h2>Your team always knows what to do next</h2>
              <p>When a team member logs in, they see exactly what&apos;s assigned to them — no searching, no guessing. They mark tasks done as they go, and the admin sees progress update in real time.</p>
              <div className="workflow-steps">
                <div className="wf-step completed">
                  <div className="wf-step-left">
                    <div className="wf-step-num">
                      <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
                      </svg>
                    </div>
                    <div className="wf-line"></div>
                  </div>
                  <div className="wf-step-content">
                    <div className="wf-step-title">1. Receive assignments instantly</div>
                    <div className="wf-step-desc">Log in to see a focused view of steps assigned directly to you, with no abstract kanban noise.</div>
                  </div>
                </div>
                <div className="wf-step completed">
                  <div className="wf-step-left">
                    <div className="wf-step-num">2</div>
                    <div className="wf-line"></div>
                  </div>
                  <div className="wf-step-content">
                    <div className="wf-step-title">2. Follow clear instructions</div>
                    <div className="wf-step-desc">Read exact requirements, fill needed evidence or data, and mark your step as completed.</div>
                  </div>
                </div>
                <div className="wf-step">
                  <div className="wf-step-left">
                    <div className="wf-step-num">3</div>
                    <div className="wf-line"></div>
                  </div>
                  <div className="wf-step-content">
                    <div className="wf-step-title">3. Hand over automatically</div>
                    <div className="wf-step-desc">Once done, the next team member is automatically assigned and notified, keeping progress flowing.</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="workflow-right">
              <div className="user-panel-mockup">
                <div className="user-panel-header">
                  <div className="user-panel-name">Sarah Kim&apos;s Tasks</div>
                  <div className="user-panel-badge">3 Tasks Active</div>
                </div>
                <div className="user-tasks">
                  <div className="user-task">
                    <div className="user-task-top">
                      <div className="user-task-name">Collect signed documents</div>
                      <div className="user-task-action">Complete Step</div>
                    </div>
                    <div className="user-task-process">Employee Onboarding · Step 2 of 6</div>
                    <div className="user-task-progress">
                      <div className="user-task-progress-fill" style={{ width: "33%", background: "var(--primary)" }}></div>
                    </div>
                    <div className="user-task-footer">
                      <div className="user-task-assignee">Assigned to you</div>
                    </div>
                  </div>
                  <div className="user-task">
                    <div className="user-task-top">
                      <div className="user-task-name">Review budget proposal</div>
                      <div className="user-task-action">Complete Step</div>
                    </div>
                    <div className="user-task-process">Q3 Planning · Step 4 of 5</div>
                    <div className="user-task-progress">
                      <div className="user-task-progress-fill" style={{ width: "80%", background: "var(--primary)" }}></div>
                    </div>
                    <div className="user-task-footer">
                      <div className="user-task-assignee">Assigned to you</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────────── */}
      <section className="cta-section">
        <div className="cta-glow"></div>
        <div className="cta-inner">
          <h2>Ready to transform your operations?</h2>
          <p>Join teams worldwide managing their workflows with precision, clarity, and security.</p>
          <div className="cta-buttons">
            <button onClick={handleGetStarted} className="btn-primary">
              Create your workspace
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6"/>
              </svg>
            </button>
            <Link href="/login" className="btn-outline">Sign in to your account</Link>
          </div>
          <div className="cta-note">No credit card required · Free to get started</div>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────────── */}
      <footer>
        <div className="container">
          <div className="footer-top">
            <div className="footer-brand">
              <div className="footer-logo">
                <div className="footer-logo-mark">
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
                  </svg>
                </div>
                <span className="footer-logo-name">WorkflowPro</span>
              </div>
              <p>Enterprise workflow management platform powered by AI and MongoDB.</p>
            </div>
            <div className="footer-col">
              <h4>Product</h4>
              <ul>
                <li><a href="#how-it-works">How it works</a></li>
                <li><a href="#features">Features</a></li>
                <li><a href="#for-teams">For teams</a></li>
              </ul>
            </div>
            <div className="footer-col">
              <h4>Company</h4>
              <ul>
                <li><a href="#">About</a></li>
                <li><a href="#">Blog</a></li>
                <li><a href="#">Careers</a></li>
                <li><a href="#">Contact</a></li>
              </ul>
            </div>
            <div className="footer-col">
              <h4>Legal</h4>
              <ul>
                <li><a href="#">Privacy Policy</a></li>
                <li><a href="#">Terms of Service</a></li>
                <li><a href="#">Security</a></li>
                <li><a href="#">Compliance</a></li>
              </ul>
            </div>
          </div>
          <div className="footer-bottom">
            <p>© {new Date().getFullYear()} WorkflowPro. All rights reserved.</p>
            <p>Built with MongoDB · Enterprise-ready · SOC 2 Type II Certified</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
