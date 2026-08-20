import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

export type ToastKind = 'info' | 'success' | 'error';

interface Toast {
  id: string;
  kind: ToastKind;
  message: string;
}

interface ToastContextValue {
  push: (message: string, kind?: ToastKind) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

const AUTO_DISMISS_MS = 3000;
const SWIPE_DISMISS_THRESHOLD = 80;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const counter = useRef(0);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback((message: string, kind: ToastKind = 'info') => {
    counter.current += 1;
    const id = `toast_${counter.current}`;
    setToasts((prev) => [...prev, { id, kind, message }]);
  }, []);

  return (
    <ToastContext.Provider value={{ push }}>
      {children}
      <div
        className="fixed z-[100] flex flex-col gap-2 items-end"
        style={{
          bottom: 'calc(var(--safe-bottom) + 16px)',
          right: 'calc(var(--safe-right) + 16px)',
          left: 'calc(var(--safe-left) + 16px)'
        }}
        aria-live="polite"
      >
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onDismiss={() => dismiss(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  const [dragX, setDragX] = useState(0);
  const [dismissing, setDismissing] = useState(false);
  const [entered, setEntered] = useState(false);
  const dragStartX = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const armTimer = useCallback(() => {
    clearTimer();
    timerRef.current = setTimeout(() => {
      setDismissing(true);
      setTimeout(onDismiss, 160);
    }, AUTO_DISMISS_MS);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onDismiss]);

  // Arm the auto-dismiss timer and trigger the entrance transition once on mount.
  useEffect(() => {
    const raf = requestAnimationFrame(() => setEntered(true));
    armTimer();
    return () => {
      cancelAnimationFrame(raf);
      clearTimer();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    dragStartX.current = e.clientX;
    clearTimer(); // pause auto-dismiss while the user is interacting
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (dragStartX.current === null) return;
    setDragX(e.clientX - dragStartX.current);
  };

  const onPointerUp = () => {
    if (dragStartX.current === null) return;
    dragStartX.current = null;
    if (Math.abs(dragX) > SWIPE_DISMISS_THRESHOLD) {
      setDismissing(true);
      setTimeout(onDismiss, 140);
    } else {
      setDragX(0);
      armTimer(); // resume the countdown from a fresh 3 seconds
    }
  };

  const opacity = dismissing ? 0 : !entered ? 0 : Math.max(0.15, 1 - Math.abs(dragX) / 220);
  const baseX = dismissing ? (dragX >= 0 ? 260 : -260) : !entered ? 12 : dragX;
  const baseY = !entered && !dismissing ? 6 : 0;

  return (
    <div
      role="status"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      className={[
        'max-w-sm w-full sm:w-auto rounded-lg px-4 py-3 text-sm shadow-panel border ml-auto cursor-grab active:cursor-grabbing select-none',
        toast.kind === 'error'
          ? 'bg-rose-100 border-rose-500/30 text-rose-500'
          : toast.kind === 'success'
          ? 'bg-signal-100 border-signal-500/30 text-signal-600'
          : 'bg-ink-900 border-ink-700 text-paper-50'
      ].join(' ')}
      style={{
        transform: `translate(${baseX}px, ${baseY}px)`,
        opacity,
        transition: dragStartX.current === null ? 'transform 0.18s ease-out, opacity 0.18s ease-out' : 'none',
        touchAction: 'pan-y'
      }}
    >
      {toast.message}
    </div>
  );
}
