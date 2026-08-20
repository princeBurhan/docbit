import React, { useEffect } from 'react';
import { Header } from '../components/Header';
import { Link } from '../router/router';

export default function WorkspacePage() {
  useEffect(() => {
    document.title = 'Workspace — Coming Soon | DocBit';
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-paper-50">
      <Header />

      <main className="flex-1 px-4 sm:px-8 pb-20">
        <div className="max-w-2xl mx-auto text-center pt-12 sm:pt-16">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-signal-600 bg-signal-100 rounded-full px-3 py-1 mb-5">
            On the roadmap
          </span>
          <h1 className="font-display text-[2rem] leading-[1.15] sm:text-4xl sm:leading-[1.1] text-ink-900 font-semibold tracking-tight">
            Your data workspace is coming.
          </h1>
          <p className="mt-4 text-ink-600/80 text-base max-w-lg mx-auto">
            A personal place to keep your reports, projects, files, history, and settings — all organized in one
            workspace.
          </p>
        </div>

        <WorkspaceVisual />

        <div className="max-w-4xl mx-auto mt-16 grid grid-cols-1 sm:grid-cols-2 gap-8">
          <RoadmapColumn
            title="Personal Workspace"
            items={['Generation History', 'Projects', 'Storage', 'Billing', 'Settings']}
          />
          <RoadmapColumn
            title="Inside a Project"
            items={['Recent Activity', 'Data Files', 'Members', 'Permissions', 'Project Settings']}
          />
        </div>

        <div className="max-w-2xl mx-auto mt-12 rounded-2xl border border-ink-200 bg-white p-5 sm:p-6">
          <h3 className="text-sm font-semibold text-ink-900 mb-3">Future member permissions</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <PermissionCard
              title="Edit & Download"
              desc="Full collaborators can adjust the report configuration and export new versions."
            />
            <PermissionCard title="Download Only" desc="Viewers can access finished reports without changing the setup." />
          </div>
          <p className="text-xs text-ink-600/50 mt-4">
            Files shared in a workspace will be limited to appropriate data formats. None of this exists yet — this
            page is a preview of what's planned.
          </p>
        </div>

        <div className="max-w-md mx-auto mt-14 text-center">
          <p className="text-sm text-ink-600/70 mb-3">
            The free report generator already works today — no account required.
          </p>
          <Link
            to="/"
            className="focus-ring inline-flex items-center justify-center rounded-lg bg-ink-900 text-white px-5 py-2.5 text-sm font-medium hover:bg-ink-800 transition-colors"
          >
            Start generating a report
          </Link>
        </div>
      </main>
    </div>
  );
}

function WorkspaceVisual() {
  return (
    <div className="relative max-w-3xl mx-auto mt-14 h-[280px] sm:h-[340px]" style={{ perspective: '1400px' }}>
      <div
        className="absolute inset-0 rounded-3xl bg-gradient-to-br from-ink-900 via-ink-800 to-signal-600/40"
        style={{ transform: 'none' }}
      />
      <div className="absolute inset-0 overflow-hidden rounded-3xl">
        <div className="absolute -inset-10 opacity-30 [background-image:radial-gradient(circle_at_1px_1px,#ffffff_1px,transparent_0)] [background-size:22px_22px]" />
      </div>

      {/* Floating panels — flattened on small screens for readability */}
      <FloatingCard
        className="left-[6%] top-[14%] sm:left-[8%] sm:top-[16%] animate-float-slow"
        rotate="sm:-rotate-3"
        title="Generation History"
        rows={['Q3_Sales_Report.pdf', 'Attendance_Aug.xlsx', 'Invoices_Outstanding.csv']}
      />
      <FloatingCard
        className="right-[4%] top-[8%] sm:right-[6%] sm:top-[10%] animate-float-slow-delayed"
        rotate="sm:rotate-2"
        title="Recent Projects"
        rows={['Lab Billing 2026', 'Class 10 Results', 'Vendor Reconciliation']}
      />
      <FloatingCard
        className="left-[16%] bottom-[6%] sm:left-[20%] sm:bottom-[8%] animate-float-slower"
        rotate="sm:rotate-1"
        title="Storage"
        rows={['2.1 GB used', '48 files', '6 projects']}
      />
      <FloatingCard
        className="right-[10%] bottom-[2%] sm:right-[14%] sm:bottom-[4%] animate-float-slow"
        rotate="sm:-rotate-2"
        title="Members"
        rows={['A. Rahman · Edit & Download', 'P. Singh · Download Only']}
      />
    </div>
  );
}

function FloatingCard({
  className,
  rotate,
  title,
  rows
}: {
  className: string;
  rotate: string;
  title: string;
  rows: string[];
}) {
  return (
    <div
      className={[
        'absolute w-44 sm:w-52 rounded-xl bg-white/95 backdrop-blur border border-white/60 shadow-panel px-3.5 py-3 transition-transform hover:scale-[1.03] hover:-translate-y-1',
        rotate,
        className
      ].join(' ')}
    >
      <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-600/50 mb-1.5">{title}</p>
      <ul className="space-y-1">
        {rows.map((r) => (
          <li key={r} className="text-[11px] text-ink-800 truncate flex items-center gap-1.5">
            <span className="h-1 w-1 rounded-full bg-signal-500 shrink-0" />
            {r}
          </li>
        ))}
      </ul>
    </div>
  );
}

function RoadmapColumn({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-2xl border border-ink-200 bg-white p-5">
      <h3 className="text-sm font-semibold text-ink-900 mb-3">{title}</h3>
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item} className="flex items-center gap-2.5 text-sm text-ink-600/80">
            <span className="h-1.5 w-1.5 rounded-full bg-ink-200 shrink-0" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function PermissionCard({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="rounded-lg bg-paper-100 p-3.5">
      <p className="text-xs font-semibold text-ink-900 mb-1">{title}</p>
      <p className="text-xs text-ink-600/70 leading-relaxed">{desc}</p>
    </div>
  );
}
