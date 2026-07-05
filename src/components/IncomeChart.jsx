import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useDarkMode } from '../hooks/useDarkMode';
import { formatEUR, formatEURCompact } from '../lib/format';
import { CHART_CHROME, INCOME_COLORS, pick } from '../lib/theme';

const SERIES = [
  { key: 'work', label: INCOME_COLORS.work.label },
  { key: 'portfolio', label: INCOME_COLORS.portfolio.label },
  { key: 'pension', label: INCOME_COLORS.pension.label },
  { key: 'gap', label: INCOME_COLORS.gap.label },
];

function buildChartData(rows) {
  return rows.map((row) => ({
    age: row.age,
    year: row.year,
    work: row.incomeWork,
    portfolio: row.incomePortfolio,
    pension: row.incomePension,
    gap: row.unfundedGap,
    target: row.targetExpenseMonthly,
  }));
}

function CustomTooltip({ active, payload, label, isDark }) {
  if (!active || !payload || !payload.length) return null;
  const point = payload[0].payload;
  const hasGap = point.gap > 1;
  return (
    <div
      className="rounded-lg border px-3 py-2 text-xs shadow-sm min-w-[180px]"
      style={{
        background: pick(CHART_CHROME.surface, isDark),
        borderColor: pick(CHART_CHROME.gridline, isDark),
        color: pick(CHART_CHROME.primaryInk, isDark),
      }}
    >
      <div className="font-medium mb-1.5">
        Age {label} · {point.year}
      </div>
      {SERIES.filter((s) => s.key !== 'gap' || hasGap).map((s) => (
        <div key={s.key} className="flex items-center justify-between gap-3 mb-0.5">
          <span className="flex items-center gap-1.5" style={{ color: pick(CHART_CHROME.secondaryInk, isDark) }}>
            <span
              className="inline-block h-2 w-2 rounded-full"
              style={{ background: pick(INCOME_COLORS[s.key], isDark) }}
            />
            {s.label}
          </span>
          <span className="font-medium tabular-nums">{formatEUR(point[s.key])}</span>
        </div>
      ))}
      <div
        className="flex items-center justify-between gap-3 mt-1.5 pt-1.5 border-t"
        style={{ borderColor: pick(CHART_CHROME.gridline, isDark) }}
      >
        <span style={{ color: pick(CHART_CHROME.secondaryInk, isDark) }}>Target expenses</span>
        <span className="font-semibold tabular-nums">{formatEUR(point.target)}</span>
      </div>
      {hasGap && <div className="mt-1.5 text-[#d03b3b] font-medium">Shortfall — not fully covered</div>}
    </div>
  );
}

export default function IncomeChart({ result, inputs }) {
  const isDark = useDarkMode();
  const data = buildChartData(result.rows);
  const surface = pick(CHART_CHROME.surface, isDark);
  const gridline = pick(CHART_CHROME.gridline, isDark);
  const muted = pick(CHART_CHROME.mutedInk, isDark);
  const baseline = pick(CHART_CHROME.baseline, isDark);

  const transitions = [
    { age: inputs.semiRetirementAge },
    { age: inputs.fullRetirementAge },
    { age: inputs.pensionStartAge },
  ].filter((t, i, arr) => arr.findIndex((x) => x.age === t.age) === i);

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Monthly income by source</h3>
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1 mb-2">
        {SERIES.map((s) => (
          <span key={s.key} className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <span
              className="inline-block h-2.5 w-2.5 rounded-full"
              style={{ background: pick(INCOME_COLORS[s.key], isDark) }}
            />
            {s.label}
          </span>
        ))}
        <span className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
          <span className="inline-block h-0.5 w-3" style={{ background: muted }} />
          Target expenses
        </span>
      </div>
      <ResponsiveContainer width="100%" height={340}>
        <AreaChart data={data} margin={{ top: 10, right: 16, bottom: 0, left: 0 }}>
          <CartesianGrid vertical={false} stroke={gridline} strokeWidth={1} />
          <XAxis
            dataKey="age"
            stroke={baseline}
            tick={{ fill: muted, fontSize: 12 }}
            tickLine={false}
            axisLine={{ stroke: baseline }}
            label={{ value: 'Age', position: 'insideBottom', offset: -4, fill: muted, fontSize: 12 }}
          />
          <YAxis
            stroke={baseline}
            tick={{ fill: muted, fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={formatEURCompact}
            width={64}
          />
          <Tooltip content={<CustomTooltip isDark={isDark} />} />
          {transitions.map((t) => (
            <ReferenceLine key={t.age} x={t.age} stroke={muted} strokeDasharray="3 3" />
          ))}
          {SERIES.map((s) => (
            <Area
              key={s.key}
              type="linear"
              dataKey={s.key}
              stackId="income"
              stroke={surface}
              strokeWidth={2}
              fill={pick(INCOME_COLORS[s.key], isDark)}
              fillOpacity={0.85}
              isAnimationActive={false}
            />
          ))}
          <Line
            type="linear"
            dataKey="target"
            stroke={muted}
            strokeWidth={1.5}
            strokeDasharray="4 3"
            dot={false}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
