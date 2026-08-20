import React, { useState } from 'react';

export function HowItWorks() {
  const steps: [string, string][] = [
    ['Upload', 'Drop in your Excel, CSV, or JSON file.'],
    ['Configure', 'Pick your header row, columns, filters and sorting.'],
    ['Preview', 'See your exact report update instantly.'],
    ['Export', 'Download as PDF, Excel, CSV, or JSON.']
  ];
  return (
    <section className="max-w-3xl mx-auto mt-20 px-4">
      <h2 className="font-display text-xl text-ink-900 text-center mb-8">How it works</h2>
      <ol className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {steps.map(([title, desc], i) => (
          <li key={title} className="rounded-xl bg-white border border-ink-200 p-4">
            <span className="text-xs font-mono text-signal-600">{String(i + 1).padStart(2, '0')}</span>
            <h3 className="text-sm font-semibold text-ink-900 mt-1.5">{title}</h3>
            <p className="text-xs text-ink-600/70 mt-1 leading-relaxed">{desc}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

const PROBLEMS: { q: string; a: string }[] = [
  { q: 'Large Excel file?', a: 'You may only need five columns out of thousands of records.' },
  { q: 'Need a class report?', a: 'Filter students by class, attendance, marks, or result.' },
  { q: 'Outstanding payments?', a: 'Select customer, invoice, amount, and due date.' },
  { q: 'Low on inventory?', a: 'Filter low-stock products and export the result.' },
  { q: 'Reconciling transactions?', a: 'Filter by date range and sum totals by account.' },
  { q: 'Tracking sales performance?', a: 'Group deals by salesperson and calculate revenue.' }
];

export function ProblemCards() {
  return (
    <section className="max-w-4xl mx-auto mt-20 px-4">
      <h2 className="font-display text-xl text-ink-900 text-center mb-2">Built for the report you're actually trying to make</h2>
      <p className="text-center text-sm text-ink-600/60 mb-8 max-w-lg mx-auto">
        Not abstract "data intelligence" — real workflows people run every week.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {PROBLEMS.map((p) => (
          <div key={p.q} className="rounded-xl border border-ink-200 bg-white p-4 hover:border-signal-500/40 transition-colors">
            <h3 className="text-sm font-semibold text-ink-900 mb-1.5">{p.q}</h3>
            <p className="text-xs text-ink-600/70 leading-relaxed">{p.a}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

const USE_CASES: { title: string; example: string }[] = [
  { title: 'Medical labs', example: 'Upload patient & test records, filter by test type, export a billing report.' },
  { title: 'Schools', example: 'Select Student, Class, Attendance and Marks, filter by class, sort by marks.' },
  { title: 'Retail & e-commerce', example: 'Group orders by product, sum revenue, filter by payment status.' },
  { title: 'HR & payroll', example: 'Filter employees by department, calculate total salary by team.' },
  { title: 'Finance', example: 'Filter transactions by date range, sum outstanding payments by client.' },
  { title: 'Logistics', example: 'Group shipments by driver, filter by delivery status, export by route.' }
];

export function UseCases() {
  return (
    <section className="max-w-4xl mx-auto mt-20 px-4">
      <h2 className="font-display text-xl text-ink-900 text-center mb-8">Built for real business data</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {USE_CASES.map((u) => (
          <div key={u.title} className="rounded-xl border border-ink-200 bg-white p-4">
            <h3 className="text-sm font-semibold text-ink-900 mb-1.5">{u.title}</h3>
            <p className="text-xs text-ink-600/70 leading-relaxed">{u.example}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

const FAQS: { q: string; a: string }[] = [
  {
    q: 'Is DocBit really free?',
    a: 'Yes. Uploading files, building a report, and exporting it as PDF, Excel, CSV, or JSON is completely free — no account, no paywall, no usage limits on the core workflow.'
  },
  {
    q: 'Does my data leave my device?',
    a: 'Whenever technically possible, DocBit reads and processes your file entirely in your browser. Your file is not uploaded to a server as part of the core reporting workflow.'
  },
  {
    q: 'What file types are supported?',
    a: 'Excel (.xlsx and .xls), CSV (.csv), and JSON (.json) files, up to about 100 MB — a practical ceiling for reliable in-browser processing.'
  },
  {
    q: 'Will DocBit change my original file?',
    a: 'No. Your uploaded data is never modified. Every choice you make — hiding a column, excluding rows, filtering — only affects the report configuration. You can always reset to the original.'
  },
  {
    q: "What if my spreadsheet doesn't start with a header row?",
    a: 'DocBit automatically guesses the most likely header row, but you can pick a different one manually — title rows and metadata above it are ignored automatically.'
  }
];

export function FAQ() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section className="max-w-2xl mx-auto mt-20 mb-24 px-4">
      <h2 className="font-display text-xl text-ink-900 text-center mb-8">Frequently asked questions</h2>
      <div className="rounded-xl border border-ink-200 bg-white divide-y divide-ink-100">
        {FAQS.map((f, i) => {
          const expanded = open === i;
          return (
            <div key={f.q}>
              <button
                onClick={() => setOpen(expanded ? null : i)}
                className="focus-ring w-full flex items-center justify-between gap-3 text-left px-4 py-3.5"
                aria-expanded={expanded}
              >
                <span className="text-sm font-medium text-ink-900">{f.q}</span>
                <span className={['text-ink-400 transition-transform shrink-0', expanded ? 'rotate-45' : ''].join(' ')}>+</span>
              </button>
              {expanded && <p className="px-4 pb-4 text-xs text-ink-600/70 leading-relaxed animate-fade-in">{f.a}</p>}
            </div>
          );
        })}
      </div>
    </section>
  );
}
