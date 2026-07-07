import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceDot,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useDarkMode } from '../hooks/useDarkMode';
import { formatEUR, formatEURCompact } from '../lib/format';
import { CHART_CHROME, INCOME_COLORS, pick } from '../lib/theme';

function CustomTooltip({ active, payload, label, isDark }) {
  if (!active || !payload || !payload.length) return null;
  const point = payload[0].payload;
  return (
    <div
      className="rounded-lg border px-3 py-2 text-xs shadow-sm"
      style={{
        background: pick(CHART_CHROME.surface, isDark),
        borderColor: pick(CHART_CHROME.gridline, isDark),
        color: pick(CHART_CHROME.primaryInk, isDark),
      }}
    >
      <div className="font-medium mb-1">Age {label}</div>
      <div className="font-semibold tabular-nums">{formatEUR(point.balance)}</div>
      {point.shockCostMonthly > 1 && (
        <div className="mt-1 text-[#d03b3b]">
          Shock cost this year: {formatEUR(point.shockCostMonthly * 12)}
          {point.shockResidualMonthly > 1
            ? ` — fund short by ${formatEUR(point.shockResidualMonthly * 12)}`
            : ' — fully covered'}
        </div>
      )}
    </div>
  );
}

export default function EmergencyFundChart({ result, events }) {
  const isDark = useDarkMode();
  const rows = result.rows;
  const data = rows.map((row) => ({
    age: row.age,
    balance: row.emergencyFundBalance,
    shockCostMonthly: row.shockCostMonthly,
    shockResidualMonthly: row.shockResidualMonthly,
  }));

  const surface = pick(CHART_CHROME.surface, isDark);
  const gridline = pick(CHART_CHROME.gridline, isDark);
  const muted = pick(CHART_CHROME.mutedInk, isDark);
  const baseline = pick(CHART_CHROME.baseline, isDark);
  const efColor = pick(INCOME_COLORS.emergencyFund, isDark);

  const shockEvents = (events || []).filter((e) => e.category === 'shock');

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Emergency fund</h3>
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1 mb-2 text-xs text-slate-500 dark:text-slate-400">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: efColor }} />
          Fund balance
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-[#0ca30c]" />
          Shock fully covered
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-[#d03b3b]" />
          Shock overflowed to portfolio
        </span>
      </div>
      <ResponsiveContainer width="100%" height={180}>
        <AreaChart data={data} margin={{ top: 10, right: 16, bottom: 0, left: 0 }}>
          <CartesianGrid vertical={false} stroke={gridline} strokeWidth={1} />
          <XAxis
            dataKey="age"
            stroke={baseline}
            tick={{ fill: muted, fontSize: 12 }}
            tickLine={false}
            axisLine={{ stroke: baseline }}
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
          <Area
            type="linear"
            dataKey="balance"
            stroke={efColor}
            strokeWidth={2}
            fill={efColor}
            fillOpacity={0.15}
            isAnimationActive={false}
          />
          {shockEvents.map((ev) => {
            const row = rows.find((r) => r.age === Math.round(ev.age));
            if (!row) return null;
            const covered = row.shockResidualMonthly <= 1;
            return (
              <ReferenceDot
                key={ev.id}
                x={row.age}
                y={row.emergencyFundBalance}
                r={5}
                fill={covered ? '#0ca30c' : '#d03b3b'}
                stroke={surface}
                strokeWidth={2}
                isFront
              />
            );
          })}
        </AreaChart>
      </ResponsiveContainer>
      {shockEvents.length === 0 && (
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
          Drop a "Shit happens" event on the timeline above to see how the fund absorbs it.
        </p>
      )}
    </div>
  );
}
