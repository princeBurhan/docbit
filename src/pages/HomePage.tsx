import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { RawDataset } from '../types/dataset';
import { parseFile, AdapterError } from '../adapters';
import { guessHeaderRow, buildSchema } from '../engine/headerDetection';
import { createDefaultConfig, remapColumnsForNewSchema } from '../engine/config';
import { processReport } from '../engine/pipeline';
import { useReportHistory } from '../hooks/useReportHistory';
import { useToast } from '../hooks/useToast';
import { Header } from '../components/Header';
import { Hero } from '../components/landing/Hero';
import { Dropzone } from '../components/landing/Dropzone';
import { HowItWorks, ProblemCards, UseCases, FAQ } from '../components/landing/MarketingSections';
import { InteractiveDemo } from '../components/landing/InteractiveDemo';
import { Workspace } from '../components/Workspace';
import { ErrorBoundary } from '../components/ErrorBoundary';
import type { DatasetSchema } from '../types/dataset';
import type { ReportConfig } from '../types/report';

const EMPTY_SCHEMA: DatasetSchema = { headerRowIndex: 0, columns: [], dataStartIndex: 0, dataEndIndex: 0, quality: [] };
const EMPTY_CONFIG = createDefaultConfig(EMPTY_SCHEMA);

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

export default function HomePage() {
  const [raw, setRaw] = useState<RawDataset | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [analysisStage, setAnalysisStage] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const toast = useToast();
  const history = useReportHistory(EMPTY_CONFIG);
  const lastDatasetId = useRef<string | null>(null);

  const report = useMemo(() => {
    if (!raw) return null;
    return processReport(raw, history.config);
  }, [raw, history.config]);

  // Undo/Redo is scoped to actual data changes only (live cell edits), never
  // to report configuration — selecting columns, filters, sorting, grouping,
  // calculations, or the header row must not create an undo state.
  const updateConfig = useCallback(
    (updater: (prev: ReportConfig) => ReportConfig) => {
      history.update(updater, { skipHistory: true });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [history.update]
  );

  const updateData = useCallback(
    (updater: (prev: ReportConfig) => ReportConfig) => {
      history.update(updater); // records an undo step
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [history.update]
  );

  const handleFile = async (file: File) => {
    setUploadError(null);
    setIsProcessing(true);
    setAnalysisStage(0); // Reading file
    try {
      await delay(60);
      setAnalysisStage(1); // Understanding structure — held for the real duration of parsing below
      const dataset = await parseFile(file); // real, potentially slow work for large files

      setAnalysisStage(2); // Detecting headers
      await delay(70);
      const headerRowIndex = guessHeaderRow(dataset.rows);

      setAnalysisStage(3); // Analyzing columns
      await delay(70);
      const schema = buildSchema(dataset, headerRowIndex);

      setAnalysisStage(4); // Checking data quality (already computed as part of buildSchema)
      await delay(70);

      setAnalysisStage(5); // Preparing report workspace
      history.replaceAll(createDefaultConfig(schema));
      lastDatasetId.current = dataset.id;
      setRaw(dataset);
      await delay(120);

      toast.push(`${file.name} processed locally in your browser.`, 'success');
    } catch (err) {
      const message =
        err instanceof AdapterError
          ? err.message
          : "We couldn't read this file. It may be corrupted or in an unsupported format.";
      setUploadError(message);
      toast.push(message, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleHeaderRowChange = (index: number) => {
    if (!raw) return;
    // Changing the header row is a configuration choice, not a data edit —
    // it must not create an undo state either.
    updateConfig((prev) => {
      const schema = buildSchema(raw, index);
      return { ...prev, headerRowIndex: index, columns: remapColumnsForNewSchema(prev.columns, schema) };
    });
  };

  const handleReset = () => {
    if (!raw) return;
    const headerRowIndex = guessHeaderRow(raw.rows);
    const schema = buildSchema(raw, headerRowIndex);
    history.replaceAll(createDefaultConfig(schema));
    toast.push('Report configuration reset to the original data.', 'info');
  };

  const handleReplaceFile = () => {
    setRaw(null);
    lastDatasetId.current = null;
    setUploadError(null);
  };

  const inWorkspace = !!raw && !!report;

  useEffect(() => {
    document.title = inWorkspace
      ? `${raw!.meta.fileName} — DocBit`
      : 'DocBit — Custom Data Report Generator | Free Excel, CSV & JSON Reports';
  }, [inWorkspace, raw]);

  return (
    <ErrorBoundary onReset={handleReplaceFile}>
      <div className="h-screen flex flex-col">
        <Header onWordmarkClick={inWorkspace ? handleReplaceFile : undefined} dense={inWorkspace} />

        <div className={inWorkspace ? 'flex-1 min-h-0 overflow-hidden' : 'flex-1 min-h-0 overflow-auto'}>
          {!inWorkspace ? (
            <div className="pb-4">
              <Hero />
              <Dropzone
                onFile={handleFile}
                isProcessing={isProcessing}
                analysisStage={analysisStage}
                error={uploadError}
                onDismissError={() => setUploadError(null)}
              />
              <ProblemCards />
              <HowItWorks />
              <InteractiveDemo />
              <UseCases />
              <FAQ />
              <footer className="max-w-3xl mx-auto mt-4 mb-10 text-center text-xs text-ink-600/50 px-4">
                DocBit is completely free — no account, no paywall. Processing happens locally in your browser.
              </footer>
            </div>
          ) : (
            <Workspace
              raw={raw}
              config={history.config}
              report={report}
              update={updateConfig}
              updateData={updateData}
              onHeaderRowChange={handleHeaderRowChange}
              onReset={handleReset}
              onUndo={history.undo}
              onRedo={history.redo}
              canUndo={history.canUndo}
              canRedo={history.canRedo}
            />
          )}
        </div>
      </div>
    </ErrorBoundary>
  );
}
