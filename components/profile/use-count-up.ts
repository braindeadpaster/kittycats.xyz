"use client";

import { useEffect, useState } from "react";

/**
 * Counts 0 -> target once on mount (≈1s, ease-out).
 * Returns the current display value (rounded).
 */
export function useCountUp(target: number, duration = 1000): number {
  const safeTarget = Number.isFinite(target) ? Math.max(0, Math.floor(target)) : 0;
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (safeTarget <= 0) {
      setValue(0);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(Math.round(eased * safeTarget));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // Animate once on mount / when target first becomes known.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [safeTarget]);

  return value;
}
