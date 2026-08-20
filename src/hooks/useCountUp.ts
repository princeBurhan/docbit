import { useEffect, useRef, useState } from 'react';

/**
 * Animates a number toward `target` over a short duration. Used for dataset
 * stats so counts feel alive without being theatrical — capped at ~450ms.
 */
export function useCountUp(target: number, durationMs = 450): number {
  const [value, setValue] = useState(target);
  const valueRef = useRef(target);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    valueRef.current = value;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  useEffect(() => {
    const from = valueRef.current;
    if (from === target) return;
    const start = performance.now();

    const tick = (now: number) => {
      const elapsed = now - start;
      const t = Math.min(1, elapsed / durationMs);
      const eased = 1 - Math.pow(1 - t, 3); // ease-out cubic
      const current = Math.round(from + (target - from) * eased);
      setValue(current);
      valueRef.current = current;
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      }
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, durationMs]);

  return value;
}
