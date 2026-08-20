import React, { useRef } from 'react';
import type { DatasetSchema } from '../../types/dataset';
import type { DesignConfig, ReportConfig } from '../../types/report';
import { PDF_TEMPLATES } from '../../export/pdfTemplates';
import { TemplateThumbnail } from './TemplateThumbnail';
import { useToast } from '../../hooks/useToast';

interface Props {
  schema: DatasetSchema;
  config: ReportConfig;
  update: (updater: (prev: ReportConfig) => ReportConfig) => void;
}

const MAX_LOGO_BYTES = 2 * 1024 * 1024;

export function DesignPanel({ schema, config, update }: Props) {
  const design = config.design;
  const numericColumns = schema.columns.filter((c) => c.dataType === 'number');

  const setDesign = (patch: Partial<DesignConfig>) => {
    update((prev) => ({ ...prev, design: { ...prev.design, ...patch } }));
  };

  const toggleCurrencyColumn = (key: string) => {
    setDesign({
      currencyColumns: design.currencyColumns.includes(key)
        ? design.currencyColumns.filter((k) => k !== key)
        : [...design.currencyColumns, key]
    });
  };

  return (
    <div className="space-y-5">
      <Field label="Report title">
        <input value={design.title} onChange={(e) => setDesign({ title: e.target.value })} className="focus-ring w-full rounded-md border border-ink-200 px-2.5 py-2 text-sm" />
      </Field>
      <Field label="Subtitle">
        <input value={design.subtitle} onChange={(e) => setDesign({ subtitle: e.target.value })} placeholder="Optional" className="focus-ring w-full rounded-md border border-ink-200 px-2.5 py-2 text-sm" />
      </Field>
      <Field label="Organization">
        <input value={design.organization} onChange={(e) => setDesign({ organization: e.target.value })} placeholder="Optional" className="focus-ring w-full rounded-md border border-ink-200 px-2.5 py-2 text-sm" />
      </Field>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={design.showGeneratedDate} onChange={(e) => setDesign({ showGeneratedDate: e.target.checked })} className="focus-ring h-4 w-4 accent-signal-500" />
        Show generated date
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={design.showSummary} onChange={(e) => setDesign({ showSummary: e.target.checked })} className="focus-ring h-4 w-4 accent-signal-500" />
        Show summary section in export
      </label>

      <Field label="Number format">
        <div className="flex gap-2">
          {([['comma', true, '1,000'], ['plain', false, '1000']] as const).map(([id, val, sample]) => (
            <button key={id} onClick={() => setDesign({ thousandsSeparator: val })}
              className={['flex-1 rounded-md border px-2 py-1.5 text-xs font-mono',
                design.thousandsSeparator === val ? 'border-signal-500 bg-signal-100 text-signal-600' : 'border-ink-200 hover:bg-paper-100'].join(' ')}>
              {sample}
            </button>
          ))}
        </div>
      </Field>

      <Field label="Date format">
        <select value={design.dateFormat} onChange={(e) => setDesign({ dateFormat: e.target.value as DesignConfig['dateFormat'] })} className="focus-ring w-full rounded-md border border-ink-200 px-2.5 py-2 text-sm">
          <option value="DD MMM YYYY">17 Aug 2026</option>
          <option value="MM/DD/YYYY">08/17/2026</option>
          <option value="YYYY-MM-DD">2026-08-17</option>
        </select>
      </Field>

      <Field label="Currency symbol">
        <input value={design.currencySymbol} onChange={(e) => setDesign({ currencySymbol: e.target.value })} className="focus-ring w-24 rounded-md border border-ink-200 px-2.5 py-2 text-sm" maxLength={3} />
      </Field>

      {numericColumns.length > 0 && (
        <Field label="Currency columns">
          <div className="space-y-1.5">
            {numericColumns.map((c) => (
              <label key={c.key} className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={design.currencyColumns.includes(c.key)} onChange={() => toggleCurrencyColumn(c.key)} className="focus-ring h-4 w-4 accent-signal-500" />
                {c.originalName}
              </label>
            ))}
          </div>
        </Field>
      )}

      <Field label="Table density (preview + PDF)">
        <div className="flex gap-2">
          {(['comfortable', 'compact'] as const).map((d) => (
            <button key={d} onClick={() => setDesign({ density: d })}
              className={['flex-1 rounded-md border px-2 py-1.5 text-xs capitalize',
                design.density === d ? 'border-signal-500 bg-signal-100 text-signal-600' : 'border-ink-200 hover:bg-paper-100'].join(' ')}>
              {d}
            </button>
          ))}
        </div>
      </Field>
    </div>
  );
}

interface PdfProps {
  config: ReportConfig;
  update: (updater: (prev: ReportConfig) => ReportConfig) => void;
}

export function PdfDesignPanel({ config, update }: PdfProps) {
  const design = config.design;
  const logoInputRef = useRef<HTMLInputElement>(null);
  const toast = useToast();

  const setDesign = (patch: Partial<DesignConfig>) => {
    update((prev) => ({ ...prev, design: { ...prev.design, ...patch } }));
  };

  const setBranding = (patch: Partial<DesignConfig['branding']>) => {
    update((prev) => ({ ...prev, design: { ...prev.design, branding: { ...prev.design.branding, ...patch } } }));
  };

  const handleLogoFile = (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.push('Please choose an image file (PNG, JPEG, or WEBP) for your logo.', 'error'); return; }
    if (file.size > MAX_LOGO_BYTES) { toast.push('That logo is a bit large \u2014 please use an image under 2 MB.', 'error'); return; }
    const reader = new FileReader();
    reader.onload = () => { if (typeof reader.result === 'string') { setBranding({ logoDataUrl: reader.result, enabled: true }); toast.push('Logo added. It stays in your browser and is only applied to your PDF export.', 'success'); } };
    reader.onerror = () => toast.push("We couldn't read that image. Please try another file.", 'error');
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-5">
      <Field label="Orientation">
        <div className="flex gap-2">
          {(['portrait', 'landscape'] as const).map((o) => (
            <button key={o} onClick={() => setDesign({ orientation: o })}
              className={['flex-1 rounded-md border px-2 py-1.5 text-xs capitalize',
                design.orientation === o ? 'border-signal-500 bg-signal-100 text-signal-600' : 'border-ink-200 hover:bg-paper-100'].join(' ')}>
              {o}
            </button>
          ))}
        </div>
        <p className="text-[11px] text-ink-600/50 mt-1.5">
          {design.orientation === 'portrait'
            ? 'Portrait \u2014 fewer columns, formal reports, student & patient summaries.'
            : 'Landscape \u2014 wide datasets, sales, inventory, financial, operational tables.'}
        </p>
      </Field>

      <Field label="Templates">
        <div className="grid grid-cols-2 gap-2">
          {PDF_TEMPLATES.map((t) => (
            <TemplateThumbnail key={t.id} template={t} orientation={design.orientation}
              active={design.pdfTemplateId === t.id}
              onSelect={() => t.tier !== 'premium' && setDesign({ pdfTemplateId: t.id })}
              locked={t.tier === 'premium'} />
          ))}
        </div>
        <p className="text-[11px] text-ink-600/50 mt-2">5 free templates \u00b7 2 premium (coming soon). Each is a distinct layout \u2014 not just a color change.</p>
      </Field>

      <Field label="Branding">
        <div className="rounded-lg border border-ink-200 bg-white p-3 space-y-3">
          <label className="flex items-center justify-between gap-2 text-sm">
            <span className="text-ink-900">Apply my branding to PDF exports</span>
            <input type="checkbox" checked={design.branding.enabled} onChange={(e) => setBranding({ enabled: e.target.checked })} className="focus-ring h-4 w-4 accent-signal-500 shrink-0" />
          </label>
          {design.branding.enabled && (
            <div className="space-y-3 animate-fade-in">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-md border border-ink-200 bg-paper-100 flex items-center justify-center overflow-hidden shrink-0">
                  {design.branding.logoDataUrl ? <img src={design.branding.logoDataUrl} alt="Logo preview" className="h-full w-full object-contain" /> : <span className="text-[9px] text-ink-400 text-center px-1">No logo</span>}
                </div>
                <div className="flex-1 min-w-0">
                  <input ref={logoInputRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(e) => handleLogoFile(e.target.files?.[0])} />
                  <button onClick={() => logoInputRef.current?.click()} className="focus-ring text-xs font-medium rounded-md border border-ink-200 px-2.5 py-1.5 hover:bg-paper-100">{design.branding.logoDataUrl ? 'Replace logo' : 'Upload logo'}</button>
                  {design.branding.logoDataUrl && <button onClick={() => setBranding({ logoDataUrl: null })} className="focus-ring text-xs text-ink-600/50 hover:text-rose-500 ml-2">Remove</button>}
                  <p className="text-[10px] text-ink-600/50 mt-1">Stays in your browser \u2014 used only in your export.</p>
                </div>
              </div>
              <label className="block">
                <span className="block text-[11px] text-ink-600/60 mb-1">Accent color</span>
                <div className="flex items-center gap-2">
                  <input type="color" value={design.branding.accentColor} onChange={(e) => setBranding({ accentColor: e.target.value })} className="focus-ring h-8 w-10 rounded border border-ink-200 cursor-pointer bg-white" />
                  <input value={design.branding.accentColor} onChange={(e) => setBranding({ accentColor: e.target.value })} className="focus-ring flex-1 rounded-md border border-ink-200 px-2.5 py-1.5 text-xs font-mono" />
                </div>
              </label>
              <label className="block">
                <span className="block text-[11px] text-ink-600/60 mb-1">Footer text</span>
                <input value={design.branding.footerText} onChange={(e) => setBranding({ footerText: e.target.value })} placeholder="e.g. Confidential \u2014 Acme Diagnostics" className="focus-ring w-full rounded-md border border-ink-200 px-2.5 py-1.5 text-xs" />
              </label>
              <label className="block">
                <span className="block text-[11px] text-ink-600/60 mb-1">Contact / website (optional)</span>
                <input value={design.branding.contactInfo} onChange={(e) => setBranding({ contactInfo: e.target.value })} placeholder="e.g. www.example.com \u00b7 +1 555 0100" className="focus-ring w-full rounded-md border border-ink-200 px-2.5 py-1.5 text-xs" />
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={design.branding.showPageNumbers} onChange={(e) => setBranding({ showPageNumbers: e.target.checked })} className="focus-ring h-4 w-4 accent-signal-500" />
                Show page numbers
              </label>
              <div className="rounded-md overflow-hidden border border-ink-200">
                <div className="flex items-center justify-between px-3 py-2" style={{ backgroundColor: design.branding.accentColor }}>
                  <span className="text-xs font-semibold" style={{ color: bestTextColorHex(design.branding.accentColor) }}>{design.title || 'Untitled Report'}</span>
                  {design.branding.logoDataUrl && <img src={design.branding.logoDataUrl} alt="" className="h-5 w-5 object-contain" />}
                </div>
                <div className="px-3 py-1.5 bg-white text-[10px] text-ink-600/50">
                  {design.branding.footerText || 'Generated with DocBit'}{design.branding.contactInfo ? ` \u00b7 ${design.branding.contactInfo}` : ''}{design.branding.showPageNumbers ? ' \u00b7 Page 1' : ''}
                </div>
              </div>
            </div>
          )}
        </div>
      </Field>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (<div><span className="block text-xs font-semibold uppercase tracking-wide text-ink-600/60 mb-1.5">{label}</span>{children}</div>);
}

function bestTextColorHex(hex: string): string {
  const clean = hex.replace('#', '');
  const full = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean;
  const num = parseInt(full, 16);
  if (isNaN(num) || full.length !== 6) return '#FFFFFF';
  const r = (num >> 16) & 255, g = (num >> 8) & 255, b = num & 255;
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.6 ? '#0F172A' : '#FFFFFF';
}
