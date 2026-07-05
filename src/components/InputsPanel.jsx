import {
  DateField,
  NumberField,
  SectionCard,
  SelectField,
  SliderNumberField,
  ToggleField,
} from './controls';
import LifeEventsPanel from './LifeEventsPanel';
import { suggestedVoluntaryTopup } from '../lib/simulate';
import { formatEUR } from '../lib/format';

const pct = (v) => `${v}%`;
const age = (v) => `${v}`;
const years = (v) => `${v} yrs`;

export default function InputsPanel({ inputs, setField, currentAge, onReset, onShare }) {
  const suggestedTopup = suggestedVoluntaryTopup(inputs, currentAge);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100">Your inputs</h2>
        <div className="flex gap-2">
          <button
            onClick={onShare}
            className="text-xs font-medium px-2.5 py-1.5 rounded-md border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
          >
            Copy share link
          </button>
          <button
            onClick={onReset}
            className="text-xs font-medium px-2.5 py-1.5 rounded-md border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
          >
            Reset to defaults
          </button>
        </div>
      </div>

      <SectionCard title="Personal & today">
        <DateField
          label="Date of birth"
          hint={`Current age: ${currentAge}`}
          value={inputs.dob}
          onChange={(v) => setField('dob', v)}
        />
        <NumberField
          label="Current net monthly income"
          prefix="€"
          value={inputs.netMonthlyIncome}
          onChange={(v) => setField('netMonthlyIncome', v)}
          step={50}
        />
        <SliderNumberField
          label="Salary growth"
          hint="Real annual growth while working, on top of inflation — applies to income and contribution. Set to 0% to keep pace with inflation only; set higher if raises should outrun rising expenses."
          value={inputs.salaryGrowthRate}
          onChange={(v) => setField('salaryGrowthRate', v)}
          min={0}
          max={5}
          step={0.1}
          format={pct}
        />
        <NumberField
          label="Current portfolio value"
          hint="Invested assets (ETFs etc.) — excludes the pension pot"
          prefix="€"
          value={inputs.portfolioValue}
          onChange={(v) => setField('portfolioValue', v)}
          step={1000}
        />
        <NumberField
          label="Current monthly contribution"
          hint="Added to the portfolio each month while working"
          prefix="€"
          value={inputs.monthlyContribution}
          onChange={(v) => setField('monthlyContribution', v)}
          step={50}
        />
        <NumberField
          label="Current monthly expenses"
          hint="What the whole plan needs to cover — kept separate from income"
          prefix="€"
          value={inputs.monthlyExpenses}
          onChange={(v) => setField('monthlyExpenses', v)}
          step={50}
        />
        <SliderNumberField
          label="Yearly expense growth"
          hint="Extra lifestyle-cost growth on top of inflation, until semi-retirement — not a replacement for inflation. After semi-retirement, the spending-shape curve below takes over instead of continuing to compound."
          value={inputs.expenseGrowthRate}
          onChange={(v) => setField('expenseGrowthRate', v)}
          min={0}
          max={5}
          step={0.1}
          format={pct}
        />
      </SectionCard>

      <SectionCard
        title="Retirement plan structure"
        description="Set semi-retirement age equal to full-retirement age to skip phased retirement entirely."
      >
        <SliderNumberField
          label="Semi-retirement age"
          value={inputs.semiRetirementAge}
          onChange={(v) => setField('semiRetirementAge', v)}
          min={Math.max(18, currentAge)}
          max={inputs.fullRetirementAge}
          format={age}
        />
        <SliderNumberField
          label="Full retirement age"
          value={inputs.fullRetirementAge}
          onChange={(v) => setField('fullRetirementAge', v)}
          min={inputs.semiRetirementAge}
          max={inputs.pensionStartAge}
          format={age}
        />
        <SliderNumberField
          label="Pension start age"
          value={inputs.pensionStartAge}
          onChange={(v) => setField('pensionStartAge', v)}
          min={inputs.fullRetirementAge}
          max={80}
          format={age}
        />
        <SliderNumberField
          label="Work income during semi-retirement"
          hint="% of target expenses still covered by continued work; the rest is drawn from the portfolio"
          value={inputs.workIncomePct}
          onChange={(v) => setField('workIncomePct', v)}
          min={0}
          max={100}
          format={pct}
        />
      </SectionCard>

      <SectionCard
        title="Spending shape in retirement"
        description={
          "Real spending typically doesn't keep compounding forever — research on the \"retirement spending smile\" " +
          '(Blanchett, 2014) finds it eases through the Go-Go and Slow-Go years, then rises again late in life for ' +
          'healthcare. Percentages below are relative to your spending level at semi-retirement (100%).'
        }
      >
        <SliderNumberField
          label="Go-Go years"
          hint="Active early retirement — often higher discretionary spending (travel, hobbies)"
          value={inputs.goGoYears}
          onChange={(v) => setField('goGoYears', v)}
          min={0}
          max={20}
          format={years}
        />
        <SliderNumberField
          label="Go-Go spending"
          value={inputs.goGoMultiplier}
          onChange={(v) => setField('goGoMultiplier', v)}
          min={80}
          max={130}
          format={pct}
        />
        <SliderNumberField
          label="Slow-Go years"
          hint="Less active — spending typically eases off"
          value={inputs.slowGoYears}
          onChange={(v) => setField('slowGoYears', v)}
          min={0}
          max={20}
          format={years}
        />
        <SliderNumberField
          label="Slow-Go spending"
          value={inputs.slowGoMultiplier}
          onChange={(v) => setField('slowGoMultiplier', v)}
          min={50}
          max={120}
          format={pct}
        />
        <SliderNumberField
          label="No-Go rise"
          hint="Years to rise toward late-life spending (healthcare, care costs)"
          value={inputs.noGoRiseYears}
          onChange={(v) => setField('noGoRiseYears', v)}
          min={0}
          max={20}
          format={years}
        />
        <SliderNumberField
          label="No-Go spending"
          value={inputs.noGoMultiplier}
          onChange={(v) => setField('noGoMultiplier', v)}
          min={50}
          max={150}
          format={pct}
        />
      </SectionCard>

      <SectionCard
        title="Life events"
        description="One-off shocks or recurring costs (a child, a home repair, …) that add to target expenses for the years they apply."
      >
        <LifeEventsPanel
          events={inputs.lifeEvents}
          setEvents={(events) => setField('lifeEvents', events)}
          currentAge={currentAge}
        />
      </SectionCard>

      <SectionCard
        title="Emergency fund"
        description="A cash buffer tracked separately from the portfolio, checked only against one-off events above (recurring costs are funded the normal way)."
      >
        <SelectField
          label="Funding approach"
          value={inputs.emergencyFundMode}
          onChange={(v) => setField('emergencyFundMode', v)}
          options={[
            { value: 'build', label: 'Build up over time' },
            { value: 'lump', label: 'Fixed lump sum today' },
          ]}
        />
        {inputs.emergencyFundMode === 'lump' ? (
          <NumberField
            label="Current emergency fund balance"
            prefix="€"
            value={inputs.emergencyFundLumpSum}
            onChange={(v) => setField('emergencyFundLumpSum', v)}
            step={500}
          />
        ) : (
          <>
            <NumberField
              label="Target size"
              prefix="€"
              value={inputs.emergencyFundTarget}
              onChange={(v) => setField('emergencyFundTarget', v)}
              step={500}
            />
            <NumberField
              label="Monthly top-up"
              hint="Stops once the target size is reached"
              prefix="€"
              value={inputs.emergencyFundMonthlyContribution}
              onChange={(v) => setField('emergencyFundMonthlyContribution', v)}
              step={25}
            />
          </>
        )}
        <SliderNumberField
          label="Return on cash"
          hint="Real annual return — kept low since it should stay liquid"
          value={inputs.emergencyFundReturnRate}
          onChange={(v) => setField('emergencyFundReturnRate', v)}
          min={0}
          max={5}
          step={0.1}
          format={pct}
        />
      </SectionCard>

      <SectionCard title="Pension">
        <SelectField
          label="Contribution base"
          hint="Employer/state pension contribution is a % of this income"
          value={inputs.pensionContributionBase}
          onChange={(v) => setField('pensionContributionBase', v)}
          options={[
            { value: 'net', label: 'Net income' },
            { value: 'gross', label: 'Gross income' },
          ]}
        />
        {inputs.pensionContributionBase === 'gross' && (
          <NumberField
            label="Current gross monthly income"
            prefix="€"
            value={inputs.grossMonthlyIncome}
            onChange={(v) => setField('grossMonthlyIncome', v)}
            step={50}
          />
        )}
        <SliderNumberField
          label="Pension contribution rate"
          value={inputs.pensionContributionPct}
          onChange={(v) => setField('pensionContributionPct', v)}
          min={0}
          max={30}
          step={0.5}
          format={pct}
        />
        <ToggleField
          label="Estimate pension for me"
          hint="Off: enter the projected monthly pension from your pension fund statement. On: estimate it from contributions."
          checked={inputs.pensionEstimateMode}
          onChange={(v) => setField('pensionEstimateMode', v)}
        />
        {!inputs.pensionEstimateMode ? (
          <NumberField
            label="Projected net monthly pension at pension age"
            hint='E.g. from "Mijn Pensioenoverzicht" (NL) or your pension fund statement'
            prefix="€"
            value={inputs.projectedPensionMonthly}
            onChange={(v) => setField('projectedPensionMonthly', v)}
            step={50}
          />
        ) : (
          <SliderNumberField
            label="Pension fund growth rate"
            hint="Real annual growth rate applied to the pension pot until pension age"
            value={inputs.pensionFundGrowthRate}
            onChange={(v) => setField('pensionFundGrowthRate', v)}
            min={0}
            max={8}
            step={0.1}
            format={pct}
          />
        )}
        <NumberField
          label="Voluntary pension top-up"
          hint="€/year paid extra between leaving full-time work and pension age, to keep pension accrual from shrinking — counted as part of your monthly expenses below"
          prefix="€"
          value={inputs.voluntaryTopupAnnual}
          onChange={(v) => setField('voluntaryTopupAnnual', v)}
          step={500}
        />
        <div className="-mt-3 mb-4 text-xs text-slate-500 dark:text-slate-400">
          Suggested, to fully replace your pre-retirement pension contribution:{' '}
          <span className="font-medium text-slate-700 dark:text-slate-300">{formatEUR(suggestedTopup)}/year</span>
          {inputs.voluntaryTopupAnnual !== Math.round(suggestedTopup) && (
            <button
              onClick={() => setField('voluntaryTopupAnnual', Math.round(suggestedTopup))}
              className="ml-2 font-medium text-blue-600 dark:text-blue-400 hover:underline"
            >
              Use this
            </button>
          )}
          {!inputs.pensionEstimateMode && (
            <p className="mt-1">
              Note: with "Estimate pension for me" off, your projected pension is a fixed figure — the top-up is still
              a real expense here, but won't change that number.
            </p>
          )}
        </div>
      </SectionCard>

      <SectionCard
        title="Market assumptions"
        description="All figures are real returns — i.e. already above inflation. The whole model is in today's euros."
      >
        <SliderNumberField
          label="Return while working (accumulation)"
          value={inputs.accumulationReturn}
          onChange={(v) => setField('accumulationReturn', v)}
          min={0}
          max={10}
          step={0.1}
          format={pct}
        />
        <SliderNumberField
          label="Return during drawdown/retirement"
          value={inputs.drawdownReturn}
          onChange={(v) => setField('drawdownReturn', v)}
          min={0}
          max={10}
          step={0.1}
          format={pct}
        />
      </SectionCard>
    </div>
  );
}
