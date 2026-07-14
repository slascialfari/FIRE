import { estimateDaycareMonthly, ILLNESS_TYPES } from '../lib/nlAssumptions';
import { formatEUR } from '../lib/format';

const inputClass =
  'w-full px-2 py-1.5 text-sm rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-slate-100 tabular-nums';

export function DaycareCalculator({ event, onUpdate, onApply }) {
  const daysPerWeek = event.daycareDaysPerWeek ?? 3;
  const partnerSharePct = event.partnerSharePct ?? 50;
  const { netMonthly, yourShare } = estimateDaycareMonthly({ daysPerWeek, partnerSharePct });
  const suggested = Math.round(yourShare);

  return (
    <div className="mt-3 rounded-lg border border-dashed border-slate-300 dark:border-slate-600 p-3">
      <div className="text-xs font-medium text-slate-600 dark:text-slate-300 mb-2">
        Daycare cost calculator — NL averages, 2026
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs mb-2">
        <label className="block">
          <span className="block text-slate-400 dark:text-slate-500 mb-1">Daycare days/week</span>
          <input
            type="number"
            min={0}
            max={5}
            value={daysPerWeek}
            onChange={(e) => onUpdate({ daycareDaysPerWeek: Number(e.target.value) })}
            className={inputClass}
          />
        </label>
        <label className="block">
          <span className="block text-slate-400 dark:text-slate-500 mb-1">Share paid by partner</span>
          <input
            type="number"
            min={0}
            max={100}
            value={partnerSharePct}
            onChange={(e) => onUpdate({ partnerSharePct: Number(e.target.value) })}
            className={inputClass}
          />
        </label>
      </div>
      <p className="text-xs text-slate-500 dark:text-slate-400">
        Estimated net cost after a typical ~80% kinderopvangtoeslag: {formatEUR(netMonthly)}/month. Your share after
        the partner split: <span className="font-medium text-slate-700 dark:text-slate-300">{formatEUR(yourShare)}/month</span>.
        {event.monthly !== suggested && (
          <button
            onClick={() => onApply(suggested)}
            className="ml-2 font-medium text-blue-600 dark:text-blue-400 hover:underline"
          >
            Use this
          </button>
        )}
      </p>
      <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
        Rough starting point based on average dagopvang rates and a typical toeslag percentage — actual rates vary by
        location, provider, and household income. Edit the €/month field above if you know your real number.
      </p>
    </div>
  );
}

export function IllnessTypePicker({ onSelect }) {
  return (
    <div className="mt-3 rounded-lg border border-dashed border-slate-300 dark:border-slate-600 p-3">
      <div className="text-xs font-medium text-slate-600 dark:text-slate-300 mb-2">
        Common types (statistically frequent for men, NL) — rough starting points
      </div>
      <div className="flex flex-wrap gap-1.5">
        {ILLNESS_TYPES.map((t) => (
          <button
            key={t.id}
            title={t.note}
            onClick={() => onSelect(t)}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-left hover:bg-slate-50 dark:hover:bg-slate-700"
          >
            <div className="text-xs font-medium text-slate-700 dark:text-slate-200">{t.label}</div>
            <div className="text-[11px] text-slate-400 dark:text-slate-500">
              {formatEUR(t.monthly)}/mo · {t.durationYears}yr
            </div>
          </button>
        ))}
      </div>
      <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-2">
        Built on the fixed mandatory deductible (eigen risico, €385/yr) plus condition-typical extras — a starting
        point, not medical or financial advice. Edit the fields above freely.
      </p>
    </div>
  );
}
