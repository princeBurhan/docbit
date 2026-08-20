import React, { useRef } from 'react';
import type { DatasetSchema } from '../../types/dataset';
import type { DesignConfig, ReportConfig } from '../../types/report';
import { PDF_TEMPLATES } from '../../export/pdfTemplates';
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
  const logoInputRef = useRef<HTMLInputElement>(null);
  const toast = useToast();

  const setDesign = (patch: Partial<DesignConfig>) => {
    update((prev) => ({ ...prev, design: { ...prev.design, ...patch } }));
  };

  const setBranding = (patch: Partial<DesignConfig['branding']>) => {
    update((prev) => ({ ...prev, design: { ...prev.design, branding: { ...prev.design.branding, ...patch } } }));
  };

  const toggleCurrencyColumn = (key: string) => {
    setDesign({
      currencyColumns: design.currencyColumns.includes(key)
        ? design.currencyColumns.filter((k) => k !== key)
        : [...design.currencyColumns, key]
    });
  };

  const handleLogoFile = (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.push('Please choose an image file (PNG, JPEG, or WEBP) for your logo.', 'error');
      return;
    }
    if (file.size > MAX_LOGO_BYTES) {
      toast.push('That logo is a bit large — please use an image under 2 MB.', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setBranding({ logoDataUrl: reader.result, enabled: true });
        toast.push('Logo added. It stays in your browser and is only applied to your PDF export.', 'success');
      }
    };
    reader.onerror = () => toast.push("We couldn't read that image. Please try another file.", 'error');
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-5">
      <Field label="Report title">
        <input
          value={design.title}
          onChange={(e) => setDesign({ title: e.target.value })}
          className="focus-ring w-full rounded-md border border-ink-200 px-2.5 py-2 text-sm"
        />
      </Field>
      <Field label="Subtitle">
        <input
          value={design.subtitle}
          onChange={(e) => setDesign({ subtitle: e.target.value })}
          placeholder="Optional"
          className="focus-ring w-full rounded-md border border-ink-200 px-2.5 py-2 text-sm"
        />
      </Field>
      <Field label="Organization">
        <input
          value={design.organization}
          onChange={(e) => setDesign({ organization: e.target.value })}
          placeholder="Optional"
          className="focus-ring w-full rounded-md border border-ink-200 px-2.5 py-2 text-sm"
        />
      </Field>

      <Field label="PDF template">
        <div className="grid grid-cols-2 gap-2">
          {PDF_TEMPLATES.map((t) => {
            const locked = t.tier === 'premium';
            const active = design.pdfTemplateId === t.id;
            return (
              <button
                key={t.id}
                onClick={() => !locked && setDesign({ pdfTemplateId: t.id })}
                disabled={locked}
                title={locked ? `${t.name} — coming with paid plans` : t.description}
                className={[
                  'relative rounded-lg border p-2.5 text-left transition-colors',
                  locked
                    ? 'border-ink-100 bg-paper-100/60 cursor-not-allowed opacity-70'
                    : active
                    ? 'border-signal-500 bg-signal-100/60'
                    : 'border-ink-200 bg-white hover:border-ink-600/30'
                ].join(' ')}
              >
                <span className="flex h-6 w-full rounded overflow-hidden mb-1.5">
                  <span className="flex-1" style={{ backgroundColor: t.swatch[0] }} />
                  <span className="w-2" style={{ backgroundColor: t.swatch[1] }} />
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="text-xs font-medium text-ink-900">{t.name}</span>
                  {locked && (
                    <span className="text-[9px] font-semibold uppercase tracking-wide bg-amber-100 text-amber-500 rounded-full px-1.5 py-0.5">
                      Premium
                    </span>
                  )}
                  {active && !locked && <span className="text-signal-500 text-xs ml-auto">✓</span>}
                </span>
              </button>
            );
          })}
        </div>
        <p className="text-[11px] text-ink-600/50 mt-2">
          Free templates now — premium branded &amp; fully-custom templates arrive with paid plans.
        </p>
      </Field>

      <Field label="Custom branding">
        <div className="rounded-lg border border-ink-200 bg-white p-3 space-y-3">
          <label className="flex items-center justify-between gap-2 text-sm">
            <span className="text-ink-900">Apply my branding to PDF exports</span>
            <input
              type="checkbox"
              checked={design.branding.enabled}
              onChange={(e) => setBranding({ enabled: e.target.checked })}
              className="focus-ring h-4 w-4 accent-signal-500 shrink-0"
            />
          </label>

          {design.branding.enabled && (
            <div className="space-y-3 animate-fade-in">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-md border border-ink-200 bg-paper-100 flex items-center justify-center overflow-hidden shrink-0">
                  {design.branding.logoDataUrl ? (
                    <img src={design.branding.logoDataUrl} alt="Logo preview" className="h-full w-full object-contain" />
                  ) : (
                    <span className="text-[9px] text-ink-400 text-center px-1">No logo</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="hidden"
                    onChange={(e) => handleLogoFile(e.target.files?.[0])}
                  />
                  <button
                    onClick={() => logoInputRef.current?.click()}
                    className="focus-ring text-xs font-medium rounded-md border border-ink-200 px-2.5 py-1.5 hover:bg-paper-100"
                  >
                    {design.branding.logoDataUrl ? 'Replace logo' : 'Upload logo'}
                  </button>
                  {design.branding.logoDataUrl && (
                    <button
                      onClick={() => setBranding({ logoDataUrl: null })}
                      className="focus-ring text-xs text-ink-600/50 hover:text-rose-500 ml-2"
                    >
                      Remove
                    </button>
                  )}
                  <p className="text-[10px] text-ink-600/50 mt-1">Stays in your browser — used only in your export.</p>
                </div>
              </div>

              <label className="block">
                <span className="block text-[11px] text-ink-600/60 mb-1">Accent color</span>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={design.branding.accentColor}
                    onChange={(e) => setBranding({ accentColor: e.target.value })}
                    className="focus-ring h-8 w-10 rounded border border-ink-200 cursor-pointer bg-white"
                  />
                  <input
                    value={design.branding.accentColor}
                    onChange={(e) => setBranding({ accentColor: e.target.value })}
                    className="focus-ring flex-1 rounded-md border border-ink-200 px-2.5 py-1.5 text-xs font-mono"
                  />
                </div>
              </label>

              <label className="block">
                <span className="block text-[11px] text-ink-600/60 mb-1">Footer text</span>
                <input
                  value={design.branding.footerText}
                  onChange={(e) => setBranding({ footerText: e.target.value })}
                  placeholder="e.g. Confidential — Acme Diagnostics"
                  className="focus-ring w-full rounded-md border border-ink-200 px-2.5 py-1.5 text-xs"
                />
              </label>

              {/* Live preview strip — instant feedback without regenerating the PDF */}
              <div className="rounded-md overflow-hidden border border-ink-200">
                <div
                  className="flex items-center justify-between px-3 py-2"
                  style={{ backgroundColor: design.branding.accentColor }}
                >
                  <span
                    className="text-xs font-semibold"
                    style={{ color: bestTextColorHex(design.branding.accentColor) }}
                  >
                    {design.title || 'Untitled Report'}
                  </span>
                  {design.branding.logoDataUrl && (
                    <img src={design.branding.logoDataUrl} alt="" className="h-5 w-5 object-contain" />
                  )}
                </div>
                <div className="px-3 py-1.5 bg-white text-[10px] text-ink-600/50">
                  {design.branding.footerText || 'Generated with DocBit'}
                </div>
              </div>
            </div>
          )}
        </div>
      </Field>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={design.showGeneratedDate}
          onChange={(e) => setDesign({ showGeneratedDate: e.target.checked })}
          className="focus-ring h-4 w-4 accent-signal-500"
        />
        Show generated date
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={design.showSummary}
          onChange={(e) => setDesign({ showSummary: e.target.checked })}
          className="focus-ring h-4 w-4 accent-signal-500"
        />
        Show summary section in export
      </label>

      <Field label="Number format">
        <div className="flex gap-2">
          {[
            ['comma', true, '1,000'],
            ['plain', false, '1000']
          ].map(([id, val, sample]) => (
            <button
              key={id as string}
              onClick={() => setDesign({ thousandsSeparator: val as boolean })}
              className={[
                'flex-1 rounded-md border px-2 py-1.5 text-xs font-mono',
                design.thousandsSeparator === val ? 'border-signal-500 bg-signal-100 text-signal-600' : 'border-ink-200 hover:bg-paper-100'
              ].join(' ')}
            >
              {sample}
            </button>
          ))}
        </div>
      </Field>

      <Field label="Date format">
        <select
          value={design.dateFormat}
          onChange={(e) => setDesign({ dateFormat: e.target.value as DesignConfig['dateFormat'] })}
          className="focus-ring w-full rounded-md border border-ink-200 px-2.5 py-2 text-sm"
        >
          <option value="DD MMM YYYY">17 Aug 2026</option>
          <option value="MM/DD/YYYY">08/17/2026</option>
          <option value="YYYY-MM-DD">2026-08-17</option>
        </select>
      </Field>

      <Field label="Currency symbol">
        <input
          value={design.currencySymbol}
          onChange={(e) => setDesign({ currencySymbol: e.target.value })}
          className="focus-ring w-24 rounded-md border border-ink-200 px-2.5 py-2 text-sm"
          maxLength={3}
        />
      </Field>

      {numericColumns.length > 0 && (
        <Field label="Currency columns">
          <div className="space-y-1.5">
            {numericColumns.map((c) => (
              <label key={c.key} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={design.currencyColumns.includes(c.key)}
                  onChange={() => toggleCurrencyColumn(c.key)}
                  className="focus-ring h-4 w-4 accent-signal-500"
                />
                {c.originalName}
              </label>
            ))}
          </div>
        </Field>
      )}

      <Field label="Table density">
        <div className="flex gap-2">
          {(['comfortable', 'compact'] as const).map((d) => (
            <button
              key={d}
              onClick={() => setDesign({ density: d })}
              className={[
                'flex-1 rounded-md border px-2 py-1.5 text-xs capitalize',
                design.density === d ? 'border-signal-500 bg-signal-100 text-signal-600' : 'border-ink-200 hover:bg-paper-100'
              ].join(' ')}
            >
              {d}
            </button>
          ))}
        </div>
      </Field>

      <Field label="Page orientation (PDF)">
        <div className="flex gap-2">
          {(['portrait', 'landscape'] as const).map((o) => (
            <button
              key={o}
              onClick={() => setDesign({ orientation: o })}
              className={[
                'flex-1 rounded-md border px-2 py-1.5 text-xs capitalize',
                design.orientation === o ? 'border-signal-500 bg-signal-100 text-signal-600' : 'border-ink-200 hover:bg-paper-100'
              ].join(' ')}
            >
              {o}
            </button>
          ))}
        </div>
      </Field>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <span className="block text-xs font-semibold uppercase tracking-wide text-ink-600/60 mb-1.5">{label}</span>
      {children}
    </div>
  );
}

function bestTextColorHex(hex: string): string {
  const clean = hex.replace('#', '');
  const full = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean;
  const num = parseInt(full, 16);
  if (isNaN(num) || full.length !== 6) return '#FFFFFF';
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? '#0F172A' : '#FFFFFF';
}
