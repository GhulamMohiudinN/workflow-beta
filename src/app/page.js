"use client";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import FullScreenLoader from "./(component)/FullScreenLoader";
import {
  FiArrowRight, FiCheckCircle, FiUsers, FiLayers, FiTrendingUp,
  FiZap, FiShield, FiGlobe, FiBriefcase, FiBarChart2, FiPlayCircle,
  FiChevronRight, FiStar, FiMessageSquare, FiCpu,
} from "react-icons/fi";

import homeOne  from "../assists/homeOne.png";
import homeTwo  from "../assists/homeTwo.png";
import homeThree from "../assists/homeThree.png";
import homeFour  from "../assists/homeFour.png";
import homeFive  from "../assists/homeFive.png";
import homeSix   from "../assists/homeSix.png";
import homeSeven from "../assists/homeSeven.png";

export default function Home() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const features = [
    { icon: <FiLayers  className="h-6 w-6" />, title: "Visual Workflow Builder",    description: "Drag-and-drop interface to create processes step by step" },
    { icon: <FiUsers   className="h-6 w-6" />, title: "Team Management",            description: "Add team members, assign roles, manage permissions" },
    { icon: <FiZap     className="h-6 w-6" />, title: "AI-Powered Automation",      description: "Smart suggestions to optimize and automate workflows" },
    { icon: <FiTrendingUp className="h-6 w-6"/>,title: "Analytics Dashboard",       description: "Monitor performance, bottlenecks, and productivity" },
    { icon: <FiShield  className="h-6 w-6" />, title: "Enterprise Security",        description: "MongoDB encryption, company data isolation" },
    { icon: <FiCpu     className="h-6 w-6" />, title: "Flexible Integrations",      description: "Connect with Slack, Teams, Jira, and more" },
  ];

  const testimonials = [
    { name: "Sarah Chen",      role: "Operations Director, TechFlow Inc", content: "WorkflowPro reduced our process setup time by 70%. The AI suggestions are game-changing." },
    { name: "Marcus Rodriguez",role: "HR Manager, GrowthCorp",            content: "From onboarding to approvals, everything runs smoothly. Team collaboration has never been easier." },
    { name: "Priya Sharma",    role: "CEO, StartupScale",                 content: "The perfect balance of simplicity and power. Our small team manages like an enterprise." },
  ];

  const handleGetStarted = () => router.push("/signup");

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <FullScreenLoader loading={loading} />

      {/* ── Navigation ──────────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-sm border-b border-[var(--color-border)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="bg-[var(--color-primary)] p-2 rounded-lg">
                <FiBriefcase className="h-5 w-5 text-white" />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-black text-[var(--color-text)]">WorkflowPro</span>
                <span className="text-xs text-[var(--color-primary)] font-bold bg-blue-50 px-2 py-0.5 rounded">BETA</span>
              </div>
            </div>
            <button
              onClick={handleGetStarted}
              className="bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white px-5 py-2 rounded-lg font-semibold transition-colors shadow-sm text-sm"
            >
              Get Started Free
            </button>
          </div>
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-linear-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center px-4 py-2 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-sm font-semibold mb-6">
                <FiStar className="h-4 w-4 mr-2" />
                Trusted by 500+ companies worldwide
              </div>
              <h1 className="text-5xl font-black text-[var(--color-text)] leading-tight mb-6">
                Streamline Your Business
                <span className="text-[var(--color-primary)]"> Workflows</span>
                {" "}with AI-Powered Precision
              </h1>
              <p className="text-lg text-[var(--color-muted)] mb-8 leading-relaxed">
                Create, automate, and optimize your company&apos;s processes in one secure platform.
                From team onboarding to complex approval systems — everything managed in your private workspace.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <button
                  onClick={handleGetStarted}
                  className="group flex items-center justify-center bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white px-8 py-4 rounded-lg font-semibold transition-colors shadow-md"
                >
                  Start Free Trial
                  <FiArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </button>
                <button className="flex items-center justify-center border border-[var(--color-border)] text-[var(--color-muted)] px-8 py-4 rounded-lg font-semibold hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition-colors">
                  <FiPlayCircle className="mr-2 h-5 w-5" />
                  Watch Demo
                </button>
              </div>
              <div className="flex items-center text-sm text-[var(--color-muted)]">
                <FiCheckCircle className="h-4 w-4 text-[var(--color-success)] mr-2" />
                No credit card required · 14-day free trial · Cancel anytime
              </div>
            </div>

            <div className="relative">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                <Image src={homeOne} alt="Team collaborating on workflows" className="w-full h-auto" priority />
                <div className="absolute inset-0 bg-linear-to-t from-black/20 to-transparent" />
              </div>
              {/* Floating cards */}
              <div className="absolute -bottom-6 -left-6 bg-white p-4 rounded-xl shadow-lg border border-[var(--color-border)]">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-50 p-2 rounded-lg"><FiBarChart2 className="h-5 w-5 text-[var(--color-primary)]" /></div>
                  <div>
                    <p className="text-sm font-black text-[var(--color-text)]">+45% Efficiency</p>
                    <p className="text-xs text-[var(--color-muted)]">Average improvement</p>
                  </div>
                </div>
              </div>
              <div className="absolute -top-6 -right-6 bg-white p-4 rounded-xl shadow-lg border border-[var(--color-border)]">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-50 p-2 rounded-lg"><FiUsers className="h-5 w-5 text-[var(--color-primary)]" /></div>
                  <div>
                    <p className="text-sm font-black text-[var(--color-text)]">500+ Teams</p>
                    <p className="text-xs text-[var(--color-muted)]">Globally</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Logo cloud ──────────────────────────────────────────────────────── */}
      <div className="bg-white py-12 border-y border-[var(--color-border)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-[var(--color-muted)] text-sm font-semibold mb-8">
            Trusted by innovative companies worldwide
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8 items-center">
            {["TechCorp","GrowthLab","InnovateCo","ScaleUp","FutureSys","ProFlow"].map((c) => (
              <div key={c} className="text-center">
                <div className="h-8 bg-[var(--color-bg-soft)] rounded-lg animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Features ────────────────────────────────────────────────────────── */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-black text-[var(--color-text)] mb-4">Everything You Need for Process Excellence</h2>
            <p className="text-[var(--color-muted)] max-w-2xl mx-auto font-medium">
              From small teams to large enterprises, WorkflowPro provides the tools to manage your entire operation.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
            {features.map((f, i) => (
              <div key={i} className="group p-6 rounded-xl border border-[var(--color-border)] hover:border-[var(--color-primary)] hover:shadow-md transition-all duration-200">
                <div className="bg-blue-50 p-3 rounded-lg w-fit mb-4 group-hover:bg-[var(--color-primary)] transition-colors">
                  <div className="text-[var(--color-primary)] group-hover:text-white transition-colors">{f.icon}</div>
                </div>
                <h3 className="text-lg font-black text-[var(--color-text)] mb-2">{f.title}</h3>
                <p className="text-[var(--color-muted)] font-medium text-sm">{f.description}</p>
              </div>
            ))}
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div><Image src={homeTwo} alt="Workflow visualization" className="rounded-2xl shadow-xl" /></div>
            <div>
              <h3 className="text-2xl font-black text-[var(--color-text)] mb-4">Visualize, Build, Execute</h3>
              <p className="text-[var(--color-muted)] mb-6 font-medium">
                Create complex workflows with our intuitive drag-and-drop builder. Map out every step, assign tasks,
                and set conditions—all without writing a single line of code.
              </p>
              <ul className="space-y-3">
                {["Step-by-step process mapping","Role-based task assignments","Conditional logic and approvals","Real-time progress tracking"].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-sm font-semibold text-[var(--color-text)]">
                    <FiCheckCircle className="h-4 w-4 text-[var(--color-success)] shrink-0" />{item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── How It Works ────────────────────────────────────────────────────── */}
      <section id="how-it-works" className="py-20 bg-linear-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-black text-[var(--color-text)] mb-4">Simple Setup, Powerful Results</h2>
            <p className="text-[var(--color-muted)] max-w-2xl mx-auto font-medium">Get your company running on WorkflowPro in just a few minutes</p>
          </div>
          <div className="grid md:grid-cols-4 gap-8 mb-16">
            {[
              { number: "01", title: "Create Account",   desc: "Sign up with your company email",    icon: <FiBriefcase /> },
              { number: "02", title: "Setup Workspace",  desc: "Configure your company details",     icon: <FiLayers /> },
              { number: "03", title: "Add Your Team",    desc: "Invite members, assign roles",        icon: <FiUsers /> },
              { number: "04", title: "Build Workflows",  desc: "Start creating processes",            icon: <FiZap /> },
            ].map((step) => (
              <div key={step.number} className="text-center">
                <div className="relative mb-6">
                  <div className="w-16 h-16 bg-[var(--color-primary)] rounded-full flex items-center justify-center mx-auto shadow-md">
                    <div className="text-white text-xl font-black">{step.number}</div>
                  </div>
                  <div className="absolute top-1/2 -right-4 w-8 h-0.5 bg-blue-200 hidden md:block" />
                </div>
                <h3 className="text-base font-black text-[var(--color-text)] mb-1">{step.title}</h3>
                <p className="text-[var(--color-muted)] text-sm font-medium">{step.desc}</p>
              </div>
            ))}
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="order-2 lg:order-1">
              <h3 className="text-2xl font-black text-[var(--color-text)] mb-4">AI That Works With You</h3>
              <p className="text-[var(--color-muted)] mb-6 font-medium">
                Our AI analyzes your workflows and suggests optimizations, automations, and improvements.
              </p>
              <div className="space-y-4">
                {[
                  { icon: FiZap,        title: "Smart Automation",     desc: "Identify repetitive tasks to automate" },
                  { icon: FiTrendingUp, title: "Performance Insights", desc: "Spot bottlenecks and improvement areas" },
                ].map(({ icon: I, title, desc }) => (
                  <div key={title} className="flex items-start gap-3">
                    <div className="bg-white p-2 rounded-lg shadow-sm border border-[var(--color-border)]">
                      <I className="h-5 w-5 text-[var(--color-primary)]" />
                    </div>
                    <div>
                      <h4 className="font-black text-[var(--color-text)] text-sm">{title}</h4>
                      <p className="text-xs text-[var(--color-muted)] font-medium">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="order-1 lg:order-2">
              <Image src={homeFive} alt="AI assistant" className="rounded-2xl shadow-xl" />
            </div>
          </div>
        </div>
      </section>

      {/* ── Testimonials ────────────────────────────────────────────────────── */}
      <section id="testimonials" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-black text-[var(--color-text)] mb-4">Loved by Teams Worldwide</h2>
            <p className="text-[var(--color-muted)] max-w-2xl mx-auto font-medium">See how companies of all sizes transform their operations</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 mb-16">
            {testimonials.map((t, i) => (
              <div key={i} className="bg-[var(--color-bg)] p-6 rounded-xl border border-[var(--color-border)]">
                <div className="flex items-center mb-5">
                  <div className="w-11 h-11 bg-blue-50 rounded-full flex items-center justify-center">
                    <FiMessageSquare className="h-5 w-5 text-[var(--color-primary)]" />
                  </div>
                  <div className="ml-3">
                    <h4 className="font-black text-sm text-[var(--color-text)]">{t.name}</h4>
                    <p className="text-xs text-[var(--color-muted)] font-medium">{t.role}</p>
                  </div>
                </div>
                <p className="text-[var(--color-muted)] mb-4 text-sm font-medium">{t.content}</p>
                <div className="flex items-center gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <FiStar key={i} className="h-4 w-4 text-[var(--color-warning)] fill-current" />
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="grid grid-cols-2 gap-4">
                <Image src={homeThree} alt="Team collaboration" className="rounded-xl" />
                <Image src={homeFour}  alt="Remote collaboration" className="rounded-xl mt-8" />
                <Image src={homeSix}   alt="Analytics dashboard" className="rounded-xl" />
                <Image src={homeSeven} alt="Team workflow" className="rounded-xl mt-8" />
              </div>
            </div>
            <div>
              <h3 className="text-2xl font-black text-[var(--color-text)] mb-4">Built for Modern Teams</h3>
              <p className="text-[var(--color-muted)] mb-6 font-medium">
                Whether your team is in the office, remote, or hybrid, WorkflowPro keeps everyone connected.
              </p>
              <ul className="space-y-3 mb-8">
                {["Real-time collaboration","Remote-friendly interface","Mobile-responsive design","Offline capability"].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-sm font-semibold text-[var(--color-text)]">
                    <FiCheckCircle className="h-4 w-4 text-[var(--color-success)] shrink-0" />{item}
                  </li>
                ))}
              </ul>
              <button onClick={handleGetStarted} className="flex items-center text-[var(--color-primary)] hover:text-[var(--color-primary-hover)] font-bold text-sm">
                Start your free trial <FiChevronRight className="ml-1 h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────────────────────── */}
      <section className="py-20 bg-[var(--color-primary)]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-black text-white mb-6">Ready to Transform Your Workflows?</h2>
          <p className="text-blue-100 text-lg mb-8 max-w-2xl mx-auto font-medium">
            Join thousands of companies that trust WorkflowPro to manage their critical processes.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
            <button
              onClick={handleGetStarted}
              className="flex-1 bg-white text-[var(--color-primary)] px-8 py-4 rounded-lg font-black hover:bg-blue-50 transition-colors shadow-lg"
            >
              Start Free Trial
            </button>
            <Link href="/login" className="flex-1 border-2 border-white/60 text-white px-8 py-4 rounded-lg font-semibold hover:bg-white/10 transition-colors text-center">
              Schedule Demo
            </Link>
          </div>
          <p className="text-blue-100/70 text-sm mt-6 font-medium">No credit card required · 14-day free trial · Cancel anytime</p>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────────────── */}
      <footer className="bg-slate-900 text-slate-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-[var(--color-primary)] p-2 rounded-lg"><FiBriefcase className="h-5 w-5 text-white" /></div>
                <span className="text-xl font-black text-white">WorkflowPro</span>
              </div>
              <p className="text-sm font-medium">Enterprise workflow management platform powered by AI and MongoDB.</p>
            </div>
            {[
              { title: "Product",  links: ["Features","How It Works","Pricing","Sign In"] },
              { title: "Company",  links: ["About","Blog","Careers","Contact"] },
              { title: "Legal",    links: ["Privacy Policy","Terms of Service","Security","Compliance"] },
            ].map((col) => (
              <div key={col.title}>
                <h4 className="text-white font-black mb-4 text-sm">{col.title}</h4>
                <ul className="space-y-2 text-sm">
                  {col.links.map((l) => <li key={l}><a href="#" className="hover:text-white transition-colors font-medium">{l}</a></li>)}
                </ul>
              </div>
            ))}
          </div>
          <div className="border-t border-slate-800 mt-8 pt-8 text-sm text-center font-medium">
            <p>© {new Date().getFullYear()} WorkflowPro. All rights reserved.</p>
            <p className="mt-1 text-slate-500">Built with MongoDB · Enterprise-ready · SOC 2 Type II Certified</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
