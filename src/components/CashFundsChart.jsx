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
      className="rounded-lg border px-3 py-2 text-xs shadow-sm min-w-[190px]"
      style={{
        background: pick(CHART_CHROME.surface, isDark),
        borderColor: pick(CHART_CHROME.gridline, isDark),
        color: pick(CHART_CHROME.primaryInk, isDark),
      }}
    >
      <div className="font-medium mb-1.5">Age {label}</div>
      <div className="flex items-center justify-between gap-3 mb-0.5">
        <span style={{ color: pick(CHART_CHROME.secondaryInk, isDark) }}>Emergency fund</span>
        <span className="font-semibold tabular-nums">{formatEUR(point.emergencyFundBalance)}</span>
      </div>
      <div className="flex items-center justify-between gap-3 mb-1">
        <span style={{ color: pick(CHART_CHROME.secondaryInk, isDark) }}>Expenses fund</span>
        <span className="font-semibold tabular-nums">{formatEUR(point.expensesFundBalance)}</span>
      </div>
      {point.emergencyFundCostMonthly > 1 && (
        <div className="text-[#d03b3b]">
          Emergency fund cost: {formatEUR(point.emergencyFundCostMonthly * 12)}
          {point.emergencyFundResidualMonthly > 1
            ? ` — short by ${formatEUR(point.emergencyFundResidualMonthly * 12)}`
            : ' — fully covered'}
        </div>
      )}
      {point.expensesFundCostMonthly > 1 && (
        <div className="text-[#d03b3b]">
          Expenses fund cost: {formatEUR(point.expensesFundCostMonthly * 12)}
          {point.expensesFundResidualMonthly > 1
            ? ` — short by ${formatEUR(point.expensesFundResidualMonthly * 12)}`
            : ' — fully covered'}
        </div>
      )}
    </div>
  );
}

export default function CashFundsChart({ result, events }) {
  const isDark = useDarkMode();
  const rows = result.rows;
  const data = rows.map((row) => ({
    age: row.age,
    emergencyFundBalance: row.emergencyFundBalance,
    expensesFundBalance: row.expensesFundBalance,
    emergencyFundCostMonthly: row.emergencyFundCostMonthly,
    emergencyFundResidualMonthly: row.emergencyFundResidualMonthly,
    expensesFundCostMonthly: row.expensesFundCostMonthly,
    expensesFundResidualMonthly: row.expensesFundResidualMonthly,
  }));

  const surface = pick(CHART_CHROME.surface, isDark);
  const gridline = pick(CHART_CHROME.gridline, isDark);
  const muted = pick(CHART_CHROME.mutedInk, isDark);
  const baseline = pick(CHART_CHROME.baseline, isDark);
  const efColor = pick(INCOME_COLORS.emergencyFund, isDark);
  const expColor = pick(INCOME_COLORS.expensesFund, isDark);

  const fundedEvents = (events || []).filter((e) => e.fundingSource === 'emergencyFund' || e.fundingSource === 'expenses');

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Cash funds</h3>
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1 mb-2 text-xs text-slate-500 dark:text-slate-400">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: efColor }} />
          Emergency fund
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: expColor }} />
          Expenses fund
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-[#0ca30c]" />
          Event fully covered
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-[#d03b3b]" />
          Overflowed to main portfolio
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
            dataKey="emergencyFundBalance"
            stroke={efColor}
            strokeWidth={2}
            fill={efColor}
            fillOpacity={0.15}
            isAnimationActive={false}
          />
          <Area
            type="linear"
            dataKey="expensesFundBalance"
            stroke={expColor}
            strokeWidth={2}
            fill={expColor}
            fillOpacity={0.15}
            isAnimationActive={false}
          />
          {fundedEvents.map((ev) => {
            const row = rows.find((r) => r.age === Math.round(ev.age));
            if (!row) return null;
            const isEmergency = ev.fundingSource === 'emergencyFund';
            const covered = isEmergency ? row.emergencyFundResidualMonthly <= 1 : row.expensesFundResidualMonthly <= 1;
            const y = isEmergency ? row.emergencyFundBalance : row.expensesFundBalance;
            return (
              <ReferenceDot
                key={ev.id}
                x={row.age}
                y={y}
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
      {fundedEvents.length === 0 && (
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
          Drop an event and set its Supported by to the emergency or expenses fund to see how it's absorbed here.
        </p>
      )}
    </div>
  );
}
