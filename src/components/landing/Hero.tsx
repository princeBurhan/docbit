import React from 'react';

export function Hero() {
  return (
    <div className="max-w-3xl mx-auto text-center pt-8 sm:pt-14 px-4">
      <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-signal-600 bg-signal-100 rounded-full px-3 py-1 mb-5">
        Free · No account needed · Processed locally
      </span>
      <h1 className="font-display text-[2.05rem] leading-[1.14] sm:text-5xl sm:leading-[1.08] text-ink-900 font-semibold tracking-tight text-balance">
        Turn your data into the report you actually need.
      </h1>
      <p className="mt-4 text-ink-600/80 text-base sm:text-lg max-w-xl mx-auto">
        Upload an Excel, CSV, or JSON file, select the information that matters, filter and analyze it, then export a
        clean, professional report.
      </p>
    </div>
  );
}
