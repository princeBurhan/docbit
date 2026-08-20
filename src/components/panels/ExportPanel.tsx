import React, { useState } from 'react';
import type { ProcessedReport } from '../../types/processed';
import type { ReportConfig } from '../../types/report';
import type { DatasetSchema, RawDataset } from '../../types/dataset';
import { exportCsv, exportExcel, exportJson, exportPdf, validateBeforeExport, checkPdfEligibility, type ExportFormat } from '../../export';
import { useToast } from '../../hooks/useToast';
import { DesignPanel } from './DesignPanel';

interface Props {
  raw: RawDataset;
  schema: DatasetSchema;
  report: ProcessedReport;
  config: ReportConfig;
  update: (updater: (prev: ReportConfig) => ReportConfig) => void;
}

const DATA_FORMATS: { id: ExportFormat; label: string; desc: string; ext: string }[] = [
  { id: 'excel', label: 'Excel', desc: '.xlsx workbook, ready to reopen and adjust', ext: 'XLSX' },
  { id: 'csv', label: 'CSV', desc: 'Plain comma-separated values', ext: 'CSV' },
  { id: 'json', label: 'JSON', desc: 'Structured records for developers', ext: 'JSON' }
];

const PREP_STEPS = ['Dataset validated', 'Filters applied', 'Sorting applied', 'Calculations completed', 'Report prepared'];

export function ExportPanel({ raw, schema, report, config, update }: Props) {
  const [busy, setBusy] = useState<ExportFormat | null>(null);
  const [prepStep, setPrepStep] = useState(-1);
  const [justCompleted, setJustCompleted] = useState<ExportFormat | null>(null);
  const toast = useToast();
  const validation = validateBeforeExport(report, config.design);
  const pdfEligibility = checkPdfEligibility(report);

  const relevantSteps = PREP_STEPS.filter((s) => {
    if (s === 'Filters applied' && report.stats.activeFilterCount === 0) return false;
    if (s === 'Sorting applied' && !report.stats.isSorted) return false;
    if (s === 'Calculations completed' && report.summaries.length === 0) return false;
    return true;
  });

  const runExport = async (format: ExportFormat) => {
    if (!validation.ok) {
      toast.push(validation.problems[0], 'error');
      return;
    }
    if (format === 'pdf' && !pdfEligibility.eligible) {
      toast.push(pdfEligibility.reason ?? "This report isn't a fit for PDF export.", 'error');
      return;
    }
    setBusy(format);
    setJustCompleted(null);
    setPrepStep(0);

    // Reveal each real, already-computed validation step in quick succession —
    // no artificial multi-second delay, just enough for the eye to track it.
    for (let i = 0; i < relevantSteps.length; i++) {
      // eslint-disable-next-line no-await-in-loop
      await new Promise((r) => setTimeout(r, 70));
      setPrepStep(i + 1);
    }

    try {
      if (format === 'pdf') exportPdf(report, config.design);
      else if (format === 'excel') exportExcel(report, config.design);
      else if (format === 'csv') exportCsv(report, config.design);
      else exportJson(report, config.design);
      setJustCompleted(format);
      toast.push(`${format === 'pdf' ? 'PDF' : format === 'excel' ? 'Excel' : format.toUpperCase()} export ready.`, 'success');
    } catch {
      toast.push("We couldn't generate that export. Please try again.", 'error');
    } finally {
      setBusy(null);
      setPrepStep(-1);
    }
  };

  return (
    <div className="space-y-6">
      <section>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-600/60 mb-2.5">Report design</h3>
        <DesignPanel schema={schema} config={config} update={update} />
      </section>

      <div className="border-t border-ink-100" />

      <section>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-600/60 mb-2.5">Your report is ready</h3>
        <div className="rounded-lg border border-ink-200 bg-white p-3.5 space-y-1.5 text-sm">
          <SummaryRow label="Source" value={`${raw.rows.length.toLocaleString()} rows`} />
          <SummaryRow label="Excluded" value={`${report.stats.excludedRowCount.toLocaleString()} rows`} />
          <SummaryRow label="Final" value={`${report.stats.finalRowCount.toLocaleString()} rows`} strong />
          <SummaryRow label="Columns" value={`${report.stats.selectedColumnCount} / ${report.stats.totalColumnCount}`} />
          <SummaryRow label="Filters" value={String(report.stats.activeFilterCount)} />
          <SummaryRow label="Calculations" value={String(report.summaries.length)} />
          {report.stats.isGrouped && <SummaryRow label="Groups" value={String(report.groups?.length ?? 0)} />}
        </div>
      </section>

      {!validation.ok && (
        <div className="rounded-lg border border-rose-500/25 bg-rose-100 px-3.5 py-3">
          <p className="text-xs font-semibold text-rose-500 mb-1">Fix these before exporting</p>
          <ul className="text-xs text-rose-500/90 space-y-0.5 list-disc list-inside">
            {validation.problems.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        </div>
      )}

      {busy && (
        <div className="rounded-lg border border-ink-200 bg-paper-100 px-3.5 py-3 animate-fade-in">
          <p className="text-xs font-semibold text-ink-900 mb-2">Preparing report</p>
          <ul className="space-y-1.5">
            {relevantSteps.map((step, i) => (
              <li key={step} className="flex items-center gap-2 text-xs">
                <span
                  className={[
                    'flex h-4 w-4 items-center justify-center rounded-full shrink-0 transition-colors',
                    i < prepStep ? 'bg-signal-500 text-white' : 'bg-paper-200'
                  ].join(' ')}
                >
                  {i < prepStep && (
                    <svg width="9" height="9" viewBox="0 0 16 16" fill="none">
                      <path d="M3 8.5L6.2 12L13 4" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </span>
                <span className={i < prepStep ? 'text-ink-900' : 'text-ink-400'}>{step}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <section>
        <p className="text-xs font-semibold uppercase tracking-wide text-ink-600/60 mb-2">Professional report</p>
        <button
          onClick={() => runExport('pdf')}
          disabled={!validation.ok || !pdfEligibility.eligible || busy !== null}
          title={pdfEligibility.eligible ? undefined : pdfEligibility.reason ?? undefined}
          className="focus-ring w-full flex items-center gap-3 rounded-xl border-2 border-ink-900 bg-ink-900 text-white px-4 py-3.5 text-left hover:bg-ink-800 disabled:opacity-50 disabled:hover:bg-ink-900 transition-colors active:scale-[0.99] disabled:active:scale-100"
        >
          <span className="h-9 w-9 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.6">
              <path d="M7 3h7l5 5v13a1 1 0 01-1 1H7a1 1 0 01-1-1V4a1 1 0 011-1z" strokeLinejoin="round" />
              <path d="M14 3v5h5" strokeLinejoin="round" />
              <path d="M9 13h6M9 16.5h6" strokeLinecap="round" />
            </svg>
          </span>
          <span className="flex-1 min-w-0">
            <span className="block text-sm font-semibold">Export as PDF</span>
            <span className="block text-xs text-white/60">Printable, presentation-ready report</span>
          </span>
          {busy === 'pdf' ? (
            <div className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin shrink-0" />
          ) : justCompleted === 'pdf' ? (
            <CheckBadge />
          ) : (
            <span className="text-white/50 shrink-0">↓</span>
          )}
        </button>
        {!pdfEligibility.eligible && (
          <p className="text-xs text-amber-500 bg-amber-100 rounded-lg px-3 py-2 mt-2 leading-relaxed">
            {pdfEligibility.reason}
          </p>
        )}
      </section>

      <section>
        <p className="text-xs font-semibold uppercase tracking-wide text-ink-600/60 mb-2">Data exports</p>
        <div className="space-y-2">
          {DATA_FORMATS.map((f) => (
            <button
              key={f.id}
              onClick={() => runExport(f.id)}
              disabled={!validation.ok || busy !== null}
              className="focus-ring w-full flex items-center gap-3 rounded-lg border border-ink-200 bg-white px-3.5 py-3 text-left hover:border-signal-500/50 hover:bg-signal-100/30 disabled:opacity-50 transition-colors active:scale-[0.99]"
            >
              <span className="h-8 w-8 rounded-md bg-paper-100 flex items-center justify-center shrink-0 text-[10px] font-mono font-semibold text-ink-600">
                {f.ext}
              </span>
              <span className="flex-1 min-w-0">
                <span className="block text-sm font-medium text-ink-900">{f.label}</span>
                <span className="block text-xs text-ink-600/60">{f.desc}</span>
              </span>
              {busy === f.id ? (
                <div className="h-4 w-4 rounded-full border-2 border-ink-200 border-t-signal-500 animate-spin shrink-0" />
              ) : justCompleted === f.id ? (
                <CheckBadge dark />
              ) : (
                <span className="text-ink-600/40 shrink-0">↓</span>
              )}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}

function CheckBadge({ dark }: { dark?: boolean }) {
  return (
    <span
      className={[
        'flex h-5 w-5 items-center justify-center rounded-full shrink-0 animate-fade-in',
        dark ? 'bg-signal-500 text-white' : 'bg-signal-400 text-ink-950'
      ].join(' ')}
    >
      <svg width="11" height="11" viewBox="0 0 16 16" fill="none">
        <path d="M3 8.5L6.2 12L13 4" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}

function SummaryRow({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-ink-600/60">{label}</span>
      <span className={strong ? 'font-semibold text-ink-900' : 'text-ink-900'}>{value}</span>
    </div>
  );
}
