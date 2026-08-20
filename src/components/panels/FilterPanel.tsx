import React from 'react';
import type { DatasetSchema } from '../../types/dataset';
import type { FilterCondition, ReportConfig } from '../../types/report';
import { operatorsForType } from '../../engine/filters';
import { makeId } from '../../utils/id';

interface Props {
  schema: DatasetSchema;
  config: ReportConfig;
  update: (updater: (prev: ReportConfig) => ReportConfig) => void;
}

export function FilterPanel({ schema, config, update }: Props) {
  const columns = schema.columns;
  const group = config.filterGroup;

  const addCondition = () => {
    const first = columns[0];
    if (!first) return;
    const cond: FilterCondition = {
      id: makeId('cond'),
      columnKey: first.key,
      operator: operatorsForType(first.dataType)[0].value as FilterCondition['operator'],
      value: '',
      value2: ''
    };
    update((prev) => ({ ...prev, filterGroup: { ...prev.filterGroup, conditions: [...prev.filterGroup.conditions, cond] } }));
  };

  const updateCondition = (id: string, patch: Partial<FilterCondition>) => {
    update((prev) => ({
      ...prev,
      filterGroup: {
        ...prev.filterGroup,
        conditions: prev.filterGroup.conditions.map((c) => (c.id === id ? { ...c, ...patch } : c))
      }
    }));
  };

  const removeCondition = (id: string) => {
    update((prev) => ({
      ...prev,
      filterGroup: { ...prev.filterGroup, conditions: prev.filterGroup.conditions.filter((c) => c.id !== id) }
    }));
  };

  const setLogic = (logic: 'AND' | 'OR') => {
    update((prev) => ({ ...prev, filterGroup: { ...prev.filterGroup, logic } }));
  };

  if (columns.length === 0) {
    return <p className="text-sm text-ink-600/60">No columns available to filter on.</p>;
  }

  return (
    <div className="space-y-4">
      {group.conditions.length > 1 && (
        <div className="flex items-center gap-2 text-xs">
          <span className="text-ink-600/60">Match</span>
          {(['AND', 'OR'] as const).map((l) => (
            <button
              key={l}
              onClick={() => setLogic(l)}
              className={[
                'px-2.5 py-1 rounded-md font-medium focus-ring',
                group.logic === l ? 'bg-ink-900 text-white' : 'bg-paper-100 text-ink-600 hover:bg-paper-200'
              ].join(' ')}
            >
              {l}
            </button>
          ))}
          <span className="text-ink-600/60">of the conditions below</span>
        </div>
      )}

      {group.conditions.length === 0 ? (
        <div className="rounded-lg border border-dashed border-ink-200 px-4 py-6 text-center">
          <p className="text-sm text-ink-900 font-medium">No filters yet</p>
          <p className="text-xs text-ink-600/60 mt-1 mb-3">Add a filter to show only the records you need.</p>
          <button
            onClick={addCondition}
            className="focus-ring inline-flex items-center rounded-md bg-ink-900 text-white text-xs font-medium px-3 py-1.5 hover:bg-ink-800"
          >
            + Add filter
          </button>
        </div>
      ) : (
        <>
          <ul className="space-y-2.5">
            {group.conditions.map((cond) => {
              const col = columns.find((c) => c.key === cond.columnKey) ?? columns[0];
              const ops = operatorsForType(col.dataType);
              const needsValue = !['empty', 'nempty'].includes(cond.operator);
              const needsSecondValue = ['between', 'dateBetween'].includes(cond.operator);
              const isDate = col.dataType === 'date';
              return (
                <li key={cond.id} className="rounded-lg border border-ink-200 bg-white p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <select
                      value={cond.columnKey}
                      onChange={(e) => {
                        const newCol = columns.find((c) => c.key === e.target.value);
                        const newOps = operatorsForType(newCol?.dataType ?? 'string');
                        updateCondition(cond.id, {
                          columnKey: e.target.value,
                          operator: newOps[0].value as FilterCondition['operator']
                        });
                      }}
                      className="focus-ring flex-1 min-w-0 rounded-md border border-ink-200 px-2 py-1.5 text-xs"
                    >
                      {columns.map((c) => (
                        <option key={c.key} value={c.key}>
                          {c.originalName}
                        </option>
                      ))}
                    </select>
                    <button onClick={() => removeCondition(cond.id)} className="focus-ring text-ink-600/50 hover:text-rose-500 shrink-0">
                      ✕
                    </button>
                  </div>
                  <select
                    value={cond.operator}
                    onChange={(e) => updateCondition(cond.id, { operator: e.target.value as FilterCondition['operator'] })}
                    className="focus-ring w-full rounded-md border border-ink-200 px-2 py-1.5 text-xs"
                  >
                    {ops.map((op) => (
                      <option key={op.value} value={op.value}>
                        {op.label}
                      </option>
                    ))}
                  </select>
                  {needsValue && (
                    <div className="flex items-center gap-2">
                      <input
                        type={isDate ? 'date' : col.dataType === 'number' ? 'number' : 'text'}
                        value={cond.value}
                        onChange={(e) => updateCondition(cond.id, { value: e.target.value })}
                        placeholder="Value"
                        className="focus-ring flex-1 min-w-0 rounded-md border border-ink-200 px-2 py-1.5 text-xs"
                      />
                      {needsSecondValue && (
                        <>
                          <span className="text-ink-600/40 text-xs">and</span>
                          <input
                            type={isDate ? 'date' : 'number'}
                            value={cond.value2}
                            onChange={(e) => updateCondition(cond.id, { value2: e.target.value })}
                            placeholder="Value"
                            className="focus-ring flex-1 min-w-0 rounded-md border border-ink-200 px-2 py-1.5 text-xs"
                          />
                        </>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
          <button
            onClick={addCondition}
            className="focus-ring w-full rounded-md border border-dashed border-ink-200 py-2 text-xs font-medium text-ink-600 hover:bg-paper-100"
          >
            + Add condition
          </button>
        </>
      )}
    </div>
  );
}
