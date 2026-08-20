import React, { useMemo, useState } from 'react';
import { useCountUp } from '../../hooks/useCountUp';

interface SampleRow {
  name: string;
  cls: string;
  marks: number;
  attendance: number;
  result: 'Pass' | 'Fail';
}

const SAMPLE: SampleRow[] = [
  { name: 'Aamir Khan', cls: '10-A', marks: 78, attendance: 92, result: 'Pass' },
  { name: 'Sara Ahmed', cls: '10-B', marks: 34, attendance: 61, result: 'Fail' },
  { name: 'Rohan Verma', cls: '10-A', marks: 55, attendance: 88, result: 'Pass' },
  { name: 'Priya Nair', cls: '10-C', marks: 29, attendance: 70, result: 'Fail' },
  { name: 'Imran Ali', cls: '10-B', marks: 91, attendance: 95, result: 'Pass' },
  { name: 'Meera Iyer', cls: '10-A', marks: 38, attendance: 55, result: 'Fail' },
  { name: 'Kabir Singh', cls: '10-C', marks: 63, attendance: 84, result: 'Pass' },
  { name: 'Divya Rao', cls: '10-B', marks: 47, attendance: 76, result: 'Pass' }
];

const SCENARIO_TOTAL = 2500;
const SCENARIO_FILTERED = 342;

export function InteractiveDemo() {
  const [applied, setApplied] = useState(false);

  const visibleRows = useMemo(() => (applied ? SAMPLE.filter((r) => r.marks < 40) : SAMPLE), [applied]);
  const animatedCount = useCountUp(applied ? SCENARIO_FILTERED : SCENARIO_TOTAL, 500);

  return (
    <section className="max-w-3xl mx-auto mt-20 px-4">
      <h2 className="font-display text-xl text-ink-900 text-center mb-2">See it in action</h2>
      <p className="text-center text-sm text-ink-600/60 mb-8 max-w-md mx-auto">
        A student results file with 2,500 records and 18 fields. Select what matters, apply a filter, and watch the
        report shrink to exactly what you need.
      </p>

      <div className="rounded-2xl border border-ink-200 bg-white overflow-hidden shadow-panel">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 border-b border-ink-100 bg-paper-50">
          <div>
            <p className="text-xs text-ink-600/60">Student_Results.xlsx · 18 fields selected down to 5</p>
            <p className="font-display text-2xl font-semibold text-ink-900 tabular-nums">
              {animatedCount.toLocaleString()} <span className="text-sm font-sans font-normal text-ink-600/60">records</span>
            </p>
          </div>
          <button
            onClick={() => setApplied((a) => !a)}
            className={[
              'focus-ring shrink-0 rounded-full px-4 py-2 text-xs font-medium transition-colors active:scale-95',
              applied ? 'bg-signal-500 text-white hover:bg-signal-600' : 'bg-ink-900 text-white hover:bg-ink-800'
            ].join(' ')}
          >
            {applied ? '✓ Filter applied: Marks < 40' : 'Apply filter: Marks < 40'}
          </button>
        </div>

        <div className="overflow-x-auto thin-scroll">
          <table className="w-full text-sm">
            <thead className="bg-ink-900 text-paper-50">
              <tr>
                {['Student Name', 'Class', 'Marks', 'Attendance', 'Result'].map((h) => (
                  <th key={h} className="text-left font-medium px-3 py-2 whitespace-nowrap text-xs">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visibleRows.map((r) => (
                <tr key={r.name} className="border-b border-ink-100 last:border-0 animate-fade-in">
                  <td className="px-3 py-2 text-ink-900">{r.name}</td>
                  <td className="px-3 py-2 text-ink-600/80">{r.cls}</td>
                  <td className={['px-3 py-2 font-mono', r.marks < 40 ? 'text-rose-500 font-semibold' : 'text-ink-900'].join(' ')}>
                    {r.marks}
                  </td>
                  <td className="px-3 py-2 text-ink-600/80">{r.attendance}%</td>
                  <td className="px-3 py-2">
                    <span
                      className={[
                        'text-[11px] font-medium rounded-full px-2 py-0.5',
                        r.result === 'Pass' ? 'bg-signal-100 text-signal-600' : 'bg-rose-100 text-rose-500'
                      ].join(' ')}
                    >
                      {r.result}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-3 bg-paper-50 border-t border-ink-100 text-xs text-ink-600/50">
          Sample preview shown above · full dataset behaves identically at any size
        </div>
      </div>
    </section>
  );
}
