import React, { useMemo, useState } from 'react';
import type { RawDataset } from '../types/dataset';
import type { ReportConfig, ReportSection } from '../types/report';
import type { ProcessedReport } from '../types/processed';
import { buildSchema } from '../engine/headerDetection';
import { cellEditKey } from '../engine/edits';
import { TopBar } from './TopBar';
import { StatusBar } from './StatusBar';
import { PreviewTable } from './PreviewTable';
import { SideNav } from './SideNav';
import { MobileSheet } from './MobileSheet';
import { DataPanel } from './panels/DataPanel';
import { ColumnsPanel } from './panels/ColumnsPanel';
import { FilterPanel } from './panels/FilterPanel';
import { SortPanel } from './panels/SortPanel';
import { GroupPanel } from './panels/GroupPanel';
import { CalculatePanel } from './panels/CalculatePanel';
import { ExportPanel } from './panels/ExportPanel';
import { NAV_ITEMS, type NavCounts } from './navItems';

interface Props {
  raw: RawDataset;
  config: ReportConfig;
  report: ProcessedReport;
  update: (updater: (prev: ReportConfig) => ReportConfig) => void;
  updateData: (updater: (prev: ReportConfig) => ReportConfig) => void;
  onHeaderRowChange: (index: number) => void;
  onReset: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

export function Workspace({
  raw,
  config,
  report,
  update,
  updateData,
  onHeaderRowChange,
  onReset,
  onUndo,
  onRedo,
  canUndo,
  canRedo
}: Props) {
  const [section, setSection] = useState<ReportSection>('data');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetStartInList, setSheetStartInList] = useState(true);
  const [navCollapsed, setNavCollapsed] = useState(false);
  const [panelCollapsed, setPanelCollapsed] = useState(false);

  const schema = useMemo(() => buildSchema(raw, config.headerRowIndex), [raw, config.headerRowIndex]);

  const counts: NavCounts = useMemo(() => {
    const primarySort = config.sorts[0];
    const primarySortCol = primarySort ? schema.columns.find((c) => c.key === primarySort.columnKey) : null;
    const groupCol = config.group.columnKey ? schema.columns.find((c) => c.key === config.group.columnKey) : null;
    return {
      filters: config.filterGroup.conditions.length,
      sorts: config.sorts.length,
      primarySortLabel: primarySortCol ? `${primarySortCol.originalName} ${primarySort!.direction === 'asc' ? '↑' : '↓'}` : null,
      columns: config.columns.filter((c) => c.visible).length,
      totalColumns: config.columns.length,
      calculations: config.calculations.length,
      groupLabel: groupCol ? groupCol.originalName : null,
      qualityIssues: report.quality.filter((q) => q.severity === 'warning').length,
      hasNumericColumns: schema.columns.some((c) => c.dataType === 'number'),
      hasDateColumns: schema.columns.some((c) => c.dataType === 'date')
    };
  }, [config, schema, report.quality]);

  const selectSection = (target: ReportSection) => {
    setSection(target);
    // A minimized second bar should never hide the panel someone explicitly asked for.
    setPanelCollapsed(false);
  };

  const openSection = (target: ReportSection) => {
    selectSection(target);
    if (window.innerWidth < 768) {
      setSheetStartInList(false); // jump straight to this section's controls
      setSheetOpen(true);
    }
  };

  const openBuilderList = () => {
    setSheetStartInList(true); // FAB always opens the full options list first
    setSheetOpen(true);
  };

  const handleEditCell = (sourceIndex: number, columnKey: string, rawValue: string) => {
    // Cell edits are the only interaction that should create an undo state.
    updateData((prev) => ({
      ...prev,
      cellEdits: { ...prev.cellEdits, [cellEditKey(sourceIndex, columnKey)]: rawValue }
    }));
  };

  const renderPanel = (target: ReportSection) => {
    switch (target) {
      case 'data':
        return <DataPanel raw={raw} schema={schema} config={config} report={report} onHeaderRowChange={onHeaderRowChange} update={update} />;
      case 'columns':
        return <ColumnsPanel schema={schema} config={config} update={update} />;
      case 'filter':
        return <FilterPanel schema={schema} config={config} update={update} />;
      case 'sort':
        return <SortPanel schema={schema} config={config} update={update} />;
      case 'group':
        return <GroupPanel schema={schema} config={config} update={update} />;
      case 'calculate':
        return <CalculatePanel schema={schema} config={config} report={report} update={update} />;
      case 'export':
        return <ExportPanel raw={raw} schema={schema} report={report} config={config} update={update} />;
      default:
        return null;
    }
  };

  const fabBadge = counts.filters + counts.sorts + counts.calculations + (counts.groupLabel ? 1 : 0);
  const activeLabel = NAV_ITEMS.find((n) => n.id === section)?.label ?? 'Configure';

  return (
    <div className="h-full flex flex-col">
      <TopBar
        dataset={raw}
        onUndo={onUndo}
        onRedo={onRedo}
        canUndo={canUndo}
        canRedo={canRedo}
        onExport={() => openSection('export')}
      />
      <StatusBar raw={raw} report={report} config={config} />

      <div className="flex-1 flex min-h-0">
        <SideNav
          active={section}
          onChange={selectSection}
          counts={counts}
          onReset={onReset}
          collapsed={navCollapsed}
          onToggleCollapsed={() => setNavCollapsed((c) => !c)}
        />

        <div
          className={[
            'hidden md:flex md:flex-col shrink-0 border-r border-ink-200 bg-paper-50 overflow-hidden transition-[width] duration-200 ease-out',
            panelCollapsed ? 'w-11' : 'w-80'
          ].join(' ')}
        >
          {panelCollapsed ? (
            <div className="flex flex-col items-center pt-2">
              <button
                onClick={() => setPanelCollapsed(false)}
                title={`Restore ${activeLabel}`}
                aria-label={`Restore ${activeLabel} panel`}
                className="focus-ring h-8 w-8 rounded-md flex items-center justify-center text-ink-600 hover:bg-paper-100 hover:text-signal-600 transition-colors"
              >
                <ChevronIcon direction="right" />
              </button>
            </div>
          ) : (
            <div className="flex flex-col h-full w-80">
              <div className="flex items-center justify-between px-4 pt-3 pb-1 shrink-0">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-ink-600/50">{activeLabel}</span>
                <button
                  onClick={() => setPanelCollapsed(true)}
                  title="Minimize"
                  aria-label={`Minimize ${activeLabel} panel`}
                  className="focus-ring h-6 w-6 rounded-md flex items-center justify-center text-ink-600/60 hover:bg-paper-100 hover:text-signal-600 transition-colors"
                >
                  <ChevronIcon direction="left" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto thin-scroll px-4 pb-4">{renderPanel(section)}</div>
            </div>
          )}
        </div>

        <main className="flex-1 min-w-0 flex flex-col bg-white">
          <PreviewTable
            report={report}
            design={config.design}
            hasRawDataset={!!raw}
            cellEdits={config.cellEdits}
            onEditCell={handleEditCell}
          />
        </main>
      </div>

      <MobileSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        onOpenList={openBuilderList}
        startInList={sheetStartInList}
        active={section}
        onChangeSection={selectSection}
        counts={counts}
        fabBadge={fabBadge}
        onReset={onReset}
      >
        {renderPanel(section)}
      </MobileSheet>
    </div>
  );
}

function ChevronIcon({ direction }: { direction: 'left' | 'right' }) {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
      <path
        d={direction === 'left' ? 'M10 3L5 8l5 5' : 'M6 3l5 5-5 5'}
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
