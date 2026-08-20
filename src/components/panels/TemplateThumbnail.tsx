import React from 'react';
import type { PdfComposition, PdfTemplate } from '../../export/pdfTemplates';

interface Props {
  template: PdfTemplate;
  orientation: 'portrait' | 'landscape';
  active: boolean;
  onSelect: () => void;
  locked: boolean;
}

function rgb(c: [number, number, number]): string {
  return `rgb(${c[0]}, ${c[1]}, ${c[2]})`;
}

export function TemplateThumbnail({ template, orientation, active, onSelect, locked }: Props) {
  const c: PdfComposition = orientation === 'landscape' ? template.landscape : template.portrait;
  const isLandscape = orientation === 'landscape';
  const W = isLandscape ? 132 : 96;
  const H = isLandscape ? 96 : 132;

  const sx = (v: number) => (v / 72) * 20;
  const innerX = sx(c.margin.left);
  const innerW = W - sx(c.margin.left) - sx(c.margin.right);
  const innerY = sx(c.margin.top);
  const accent = rgb(c.accentRule.color);
  const headFill = rgb(c.table.headFill);
  const headText = (0.299 * c.table.headFill[0] + 0.587 * c.table.headFill[1] + 0.114 * c.table.headFill[2]) / 255 > 0.6 ? '#0F172A' : '#FFFFFF';
  const alt = rgb(c.table.alternateRowFill);
  const isCentered = c.title.align === 'center';
  const logoLeft = c.logo.placement === 'top-left' || c.logo.placement === 'inline-left';
  const logoRight = c.logo.placement === 'top-right';
  const summaryInHeader = c.summary.placement === 'header-band';
  const showSummaryBelow = c.summary.placement === 'below-table' || c.summary.placement === 'footer-band';

  const y = innerY + 2;
  const titleH = 5;
  const subH = 3;
  const metaH = 2.5;
  const logoSize = 5;
  const logoX = logoLeft ? innerX : logoRight ? innerX + innerW - logoSize : 0;
  const ty = y + titleH + subH + metaH + (summaryInHeader ? 11 : 8);

  return (
    <button
      onClick={onSelect}
      disabled={locked}
      title={locked ? `${template.name} \u2014 coming with paid plans` : template.description}
      className={[
        'relative rounded-lg border p-1.5 text-left transition-all',
        locked
          ? 'border-ink-100 bg-paper-100/60 cursor-not-allowed opacity-70'
          : active
          ? 'border-signal-500 bg-signal-100/60 ring-1 ring-signal-500/30'
          : 'border-ink-200 bg-white hover:border-ink-600/30'
      ].join(' ')}
    >
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="block mx-auto">
        <rect x={0} y={0} width={W} height={H} fill="#FFFFFF" rx={3} />
        {c.logo.placement !== 'none' && (
          <rect x={logoX} y={innerY} width={logoSize} height={logoSize} rx={1} fill={accent} opacity={0.85} />
        )}
        <rect
          x={isCentered ? innerX + innerW / 2 - 18 : innerX + (c.logo.placement === 'inline-left' ? logoSize + 2 : 0)}
          y={y} width={36} height={titleH} rx={0.8} fill={rgb(c.title.color)} opacity={0.85}
        />
        <rect x={isCentered ? innerX + innerW / 2 - 12 : innerX} y={y + titleH + 1} width={24} height={subH} rx={0.6} fill={rgb(c.subtitle.color)} opacity={0.5} />
        <rect x={isCentered ? innerX + innerW / 2 - 10 : innerX} y={y + titleH + subH + 2} width={20} height={metaH} rx={0.5} fill={rgb(c.meta.color)} opacity={0.4} />
        <line x1={innerX} y1={y + titleH + subH + metaH + 5} x2={innerX + innerW} y2={y + titleH + subH + metaH + 5} stroke={accent} strokeWidth={0.8} />
        {summaryInHeader && (
          <g opacity={0.6}>
            <rect x={innerX} y={y + titleH + subH + metaH + 7} width={14} height={2} rx={0.4} fill={rgb(c.summary.labelColor)} />
            <rect x={innerX + 16} y={y + titleH + subH + metaH + 7} width={10} height={2} rx={0.4} fill={rgb(c.summary.valueColor)} />
          </g>
        )}
        <rect x={innerX} y={ty} width={innerW} height={5} rx={0.8} fill={headFill} />
        {c.table.style === 'grid' && [0.25, 0.5, 0.75].map((f) => (
          <line key={f} x1={innerX + innerW * f} y1={ty} x2={innerX + innerW * f} y2={ty + 5} stroke={headText} strokeWidth={0.3} opacity={0.4} />
        ))}
        {(() => {
          const rh = 3.4;
          const rowCount = Math.min(Math.floor((H - ty - 14) / rh), 14);
          return Array.from({ length: rowCount }).map((_, i) => (
            <rect key={i} x={innerX} y={ty + 5 + i * rh} width={innerW} height={rh - 0.4}
              fill={c.table.style === 'striped' && i % 2 === 1 ? alt : '#FFFFFF'}
              stroke={c.table.style === 'grid' ? '#E5E7EB' : 'none'} strokeWidth={0.2}
              opacity={c.table.style === 'plain' ? 1 : 0.9}
            />
          ));
        })()}
        {showSummaryBelow && (
          <g opacity={0.7}>
            <rect x={innerX} y={H - sx(c.margin.bottom) - 6} width={16} height={2} rx={0.4} fill={rgb(c.summary.labelColor)} />
            <rect x={innerX + 18} y={H - sx(c.margin.bottom) - 6} width={12} height={2} rx={0.4} fill={rgb(c.summary.valueColor)} />
          </g>
        )}
        <line x1={innerX} y1={H - sx(c.margin.bottom) + 1} x2={innerX + innerW} y2={H - sx(c.margin.bottom) + 1} stroke="#E5E7EB" strokeWidth={0.4} />
        <rect x={innerX} y={H - sx(c.margin.bottom) + 3} width={18} height={1.6} rx={0.3} fill={rgb(c.footer.color)} opacity={0.6} />
        {c.footer.pageNumbers && <rect x={innerX + innerW - 10} y={H - sx(c.margin.bottom) + 3} width={10} height={1.6} rx={0.3} fill={rgb(c.footer.color)} opacity={0.6} />}
      </svg>
      <div className="mt-1.5 flex items-center gap-1.5">
        <span className="text-[11px] font-medium text-ink-900 truncate">{template.name}</span>
        {locked && (
          <span className="text-[8px] font-semibold uppercase tracking-wide bg-amber-100 text-amber-500 rounded-full px-1.5 py-0.5">Premium</span>
        )}
        {active && !locked && <span className="text-signal-500 text-[11px] ml-auto">\u2713</span>}
      </div>
    </button>
  );
}
