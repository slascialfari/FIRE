import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useDarkMode } from '../hooks/useDarkMode';
import { useElementWidth } from '../hooks/useElementWidth';
import { formatEUR, formatEURCompact } from '../lib/format';
import { CHART_CHROME, PHASE_COLORS, pick } from '../lib/theme';

const PHASE_KEYS = Object.keys(PHASE_COLORS);
const MIN_PX_PER_TRANSITION_LABEL = 30;

function buildChartData(rows) {
  return rows.map((row, i) => {
    const point = { age: row.age, year: row.year, phase: row.phase, value: row.portfolioStart };
    PHASE_KEYS.forEach((key) => {
      const isOwn = row.phase === key;
      const isBoundaryFromPrev = i > 0 && rows[i - 1].phase === key && row.phase !== key;
      point[key] = isOwn || isBoundaryFromPrev ? row.portfolioStart : null;
    });
    return point;
  });
}

function CustomTooltip({ active, payload, label, isDark }) {
  if (!active || !payload || !payload.length) return null;
  const point = payload[0].payload;
  const color = pick(PHASE_COLORS[point.phase], isDark);
  return (
    <div
      className="rounded-lg border px-3 py-2 text-xs shadow-sm"
      style={{
        background: pick(CHART_CHROME.surface, isDark),
        borderColor: pick(CHART_CHROME.gridline, isDark),
        color: pick(CHART_CHROME.primaryInk, isDark),
      }}
    >
      <div className="font-medium mb-1">
        Age {label} · {point.year}
      </div>
      <div className="flex items-center gap-1.5 mb-0.5">
        <span className="inline-block h-2 w-2 rounded-full" style={{ background: color }} />
        <span style={{ color: pick(CHART_CHROME.secondaryInk, isDark) }}>{PHASE_COLORS[point.phase].label}</span>
      </div>
      <div className="font-semibold tabular-nums">{formatEUR(point.value)}</div>
    </div>
  );
}

export default function PortfolioChart({ result, inputs }) {
  const isDark = useDarkMode();
  const [containerRef, containerWidth] = useElementWidth();
  const data = buildChartData(result.rows);
  const transitions = [
    { age: inputs.semiRetirementAge, label: 'Semi-retirement' },
    { age: inputs.fullRetirementAge, label: 'Full retirement' },
    { age: inputs.pensionStartAge, label: 'Pension' },
  ].filter((t, i, arr) => arr.findIndex((x) => x.age === t.age) === i);

  const ageSpan = data.length > 1 ? data[data.length - 1].age - data[0].age : 1;
  const smallestGap = transitions
    .map((t) => t.age)
    .sort((a, b) => a - b)
    .reduce((acc, age, i, arr) => (i === 0 ? acc : Math.min(acc, age - arr[i - 1])), Infinity);
  const pxPerAge = containerWidth ? (containerWidth - 80) / ageSpan : 0;
  const showTransitionLabels = smallestGap === Infinity || pxPerAge * smallestGap >= MIN_PX_PER_TRANSITION_LABEL;

  const gridline = pick(CHART_CHROME.gridline, isDark);
  const muted = pick(CHART_CHROME.mutedInk, isDark);
  const baseline = pick(CHART_CHROME.baseline, isDark);

  return (
    <div ref={containerRef}>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Portfolio value over time</h3>
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1 mb-2">
        {PHASE_KEYS.map((key) => (
          <span key={key} className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <span
              className="inline-block h-2.5 w-2.5 rounded-full"
              style={{ background: pick(PHASE_COLORS[key], isDark) }}
            />
            {PHASE_COLORS[key].label}
          </span>
        ))}
      </div>
      <ResponsiveContainer width="100%" height={340}>
        <LineChart data={data} margin={{ top: 26, right: 16, bottom: 0, left: 0 }}>
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
            <ReferenceLine
              key={t.label}
              x={t.age}
              stroke={muted}
              strokeDasharray="3 3"
              label={showTransitionLabels ? { value: t.age, position: 'top', fill: muted, fontSize: 11 } : undefined}
            />
          ))}
          {PHASE_KEYS.map((key) => (
            <Line
              key={key}
              type="linear"
              dataKey={key}
              stroke={pick(PHASE_COLORS[key], isDark)}
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
              connectNulls={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
