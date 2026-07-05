import { formatEUR } from '../lib/format';

function StatTile({ label, value, sub }) {
  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/60 p-4">
      <div className="text-xs font-medium text-slate-400 dark:text-slate-500 mb-1">{label}</div>
      <div className="text-xl font-semibold text-slate-800 dark:text-slate-100 tabular-nums">{value}</div>
      {sub && <div className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{sub}</div>}
    </div>
  );
}

export default function MetricsPanel({ result, inputs }) {
  const { metrics, depletionAge, emergencyFund } = result;
  const isShortfall = metrics.status === 'shortfall';
  const efShortfall = emergencyFund.status === 'shortfall';

  const lowestValue =
    depletionAge !== null ? (
      <span className="text-[#d03b3b]">{`Runs out at ${depletionAge}`}</span>
    ) : (
      formatEUR(metrics.lowestAfterSemiRetirement)
    );

  return (
    <div className="mb-6">
      <div className="flex flex-wrap gap-2 mb-4">
        <div
          className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium ${
            isShortfall
              ? 'bg-[#d03b3b]/10 text-[#d03b3b]'
              : 'bg-[#0ca30c]/10 text-[#0ca30c]'
          }`}
        >
          <span aria-hidden="true">{isShortfall ? '⚠' : '✓'}</span>
          {isShortfall ? 'Shortfall — plan needs adjustment' : 'On track'}
        </div>
        {emergencyFund.applicable && (
          <div
            className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium ${
              efShortfall ? 'bg-[#d03b3b]/10 text-[#d03b3b]' : 'bg-[#0ca30c]/10 text-[#0ca30c]'
            }`}
          >
            <span aria-hidden="true">{efShortfall ? '⚠' : '✓'}</span>
            {efShortfall
              ? `Emergency fund short by ${formatEUR(emergencyFund.shortfallAmount)} at age ${emergencyFund.shortfallAge}`
              : 'Emergency fund covers all one-off events'}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatTile
          label={`Portfolio at semi-retirement (age ${inputs.semiRetirementAge})`}
          value={formatEUR(metrics.portfolioAtSemiRetirement)}
        />
        <StatTile label="Lowest point after semi-retirement" value={lowestValue} />
        <StatTile
          label={`Portfolio at pension age (${inputs.pensionStartAge})`}
          value={formatEUR(metrics.portfolioAtPension)}
        />
        <StatTile label="Portfolio at age 90" value={formatEUR(metrics.portfolioAt90)} />
      </div>
    </div>
  );
}
