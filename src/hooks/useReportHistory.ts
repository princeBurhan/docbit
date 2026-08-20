import { useCallback, useMemo, useRef, useState } from 'react';
import type { ReportConfig } from '../types/report';

const MAX_HISTORY = 50;

export function useReportHistory(initial: ReportConfig) {
  const [config, setConfigState] = useState<ReportConfig>(initial);
  const past = useRef<ReportConfig[]>([]);
  const future = useRef<ReportConfig[]>([]);
  const [, forceRender] = useState(0);

  const update = useCallback((updater: (prev: ReportConfig) => ReportConfig, opts?: { skipHistory?: boolean }) => {
    setConfigState((prev) => {
      const next = updater(prev);
      if (next === prev) return prev;
      if (!opts?.skipHistory) {
        past.current.push(prev);
        if (past.current.length > MAX_HISTORY) past.current.shift();
        future.current = [];
      }
      return next;
    });
  }, []);

  const replaceAll = useCallback((next: ReportConfig) => {
    past.current = [];
    future.current = [];
    setConfigState(next);
  }, []);

  const undo = useCallback(() => {
    if (past.current.length === 0) return;
    setConfigState((current) => {
      const prev = past.current.pop()!;
      future.current.push(current);
      return prev;
    });
    forceRender((n) => n + 1);
  }, []);

  const redo = useCallback(() => {
    if (future.current.length === 0) return;
    setConfigState((current) => {
      const next = future.current.pop()!;
      past.current.push(current);
      return next;
    });
    forceRender((n) => n + 1);
  }, []);

  const canUndo = past.current.length > 0;
  const canRedo = future.current.length > 0;

  return useMemo(
    () => ({ config, update, replaceAll, undo, redo, canUndo, canRedo }),
    [config, update, replaceAll, undo, redo, canUndo, canRedo]
  );
}
