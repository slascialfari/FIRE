export const DEFAULT_INPUTS = {
  dob: '1987-02-08',
  netMonthlyIncome: 3500,
  salaryGrowthRate: 1, // % per year, ON TOP OF inflation — applies to income & contribution while working
  portfolioValue: 50000,
  monthlyContribution: 1000,
  monthlyExpenses: 2500,
  expenseGrowthRate: 1.5, // % per year, compounding across the whole projection — set this to include inflation if you like

  pensionContributionBase: 'net', // 'net' | 'gross'
  grossMonthlyIncome: 4600,
  pensionContributionPct: 15, // % of the chosen income base, contributed monthly to the pension pot
  pensionEstimateMode: false, // false = user enters projected pension directly; true = estimate from contributions
  projectedPensionMonthly: 1200, // used when pensionEstimateMode is false
  pensionFundGrowthRate: 3, // % real, used only when pensionEstimateMode is true
  voluntaryTopupAnnual: 0,

  accumulationReturn: 5, // % real annual return while working
  drawdownReturn: 3.5, // % real annual return during any drawdown phase

  semiRetirementAge: 55,
  fullRetirementAge: 60,
  pensionStartAge: 68,

  workIncomePct: 50, // % of target expenses still covered by work during semi-retirement

  // Life events, dropped on the timeline. Each event's shape comes from a preset
  // (see eventPresets.js): { id, category: 'life'|'shock'|'opportunity', presetId,
  // label, age, oneoff, monthly, growthPct, durationYears, incomeReductionPct }.
  // 'life' events (wedding, child, house) are ordinary planned costs funded the
  // normal way. 'shock' events (car, illness, job loss) are tested against the
  // emergency fund first. 'opportunity' events (inheritance) inject a lump sum
  // straight into the portfolio.
  lifeEvents: [],

  // Emergency fund: a cash buffer tracked independently of the portfolio, checked
  // against "shock" events only (planned life events and opportunities don't touch
  // it — they're funded/received the normal way above).
  emergencyFundMode: 'build', // 'lump' | 'build'
  emergencyFundLumpSum: 15000,
  emergencyFundTarget: 15000,
  emergencyFundMonthlyContribution: 150,
  emergencyFundReturnRate: 1, // % real — kept low since it should stay liquid
};

// 'life' category: planned costs (wedding, child, house) — a one-off in its trigger
// year (spread across that year's 12 months) plus an optional recurring monthly
// cost for a duration, which can itself grow over time (e.g. a child's costs rising
// as they age). Returns a monthly € figure for the given age.
function lifeEventCostAt(age, events) {
  return events
    .filter((e) => e.category === 'life')
    .reduce((sum, e) => {
      let cost = 0;
      if (Math.round(e.age) === age) cost += (Number(e.oneoff) || 0) / 12;
      const endAge = e.age + (Number(e.durationYears) || 0);
      if (e.monthly && age >= e.age && age < endAge) {
        const growth = Math.pow(1 + (Number(e.growthPct) || 0) / 100, age - e.age);
        cost += Number(e.monthly) * growth;
      }
      return sum + cost;
    }, 0);
}

// 'shock' category (car, illness, job loss) — tested against the emergency fund
// before falling through to the portfolio. Job loss is sized against `incomeWork`,
// the phase's ordinary work-income figure, and reported separately so the caller
// can decide how to fold it in without double-counting.
function shockEventCostAt(age, events, incomeWork) {
  let total = 0;
  let jobLossAmount = 0;
  events
    .filter((e) => e.category === 'shock')
    .forEach((e) => {
      const endAge = e.age + (Number(e.durationYears) || 0);
      if (e.presetId === 'jobloss') {
        if (age >= e.age && age < endAge) {
          const amount = incomeWork * ((Number(e.incomeReductionPct) || 0) / 100);
          jobLossAmount += amount;
          total += amount;
        }
        return;
      }
      if (Math.round(e.age) === age) total += (Number(e.oneoff) || 0) / 12;
      if (e.monthly && age >= e.age && age < endAge) total += Number(e.monthly);
    });
  return { total, jobLossAmount };
}

// 'opportunity' category (inheritance, windfalls) — a lump sum injected straight
// into the portfolio at the trigger age, not routed through target expenses.
function opportunityInjectionAt(age, events) {
  return events
    .filter((e) => e.category === 'opportunity' && Math.round(e.age) === age)
    .reduce((sum, e) => sum + (Number(e.oneoff) || 0), 0);
}

export const END_AGE = 100;
const DEPLETION_EPSILON = 0.5; // ignore sub-cent noise when flagging a shortfall

export function getCurrentAge(dobString) {
  const dob = new Date(dobString);
  if (Number.isNaN(dob.getTime())) return 0;
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
  return Math.max(0, age);
}

// What the pension contribution would be if still working at the pre-retirement
// rate right up to semi-retirement (accounting for salary growth up to that point).
// Paying this as the voluntary top-up keeps the pension pot accruing as if nothing
// had changed, rather than shrinking once regular employment income stops.
export function suggestedVoluntaryTopup(inputs, currentAge) {
  const base = inputs.pensionContributionBase === 'gross' ? inputs.grossMonthlyIncome : inputs.netMonthlyIncome;
  const salaryGrowthFactor = Math.pow(1 + inputs.salaryGrowthRate / 100, Math.max(inputs.semiRetirementAge - currentAge, 0));
  const monthlyContributionAtSemiRetirement = base * salaryGrowthFactor * (inputs.pensionContributionPct / 100);
  return monthlyContributionAtSemiRetirement * 12;
}

// Approximates the pension pot's value at pension age from monthly contributions,
// then converts it to a monthly "pension" by treating it like a perpetuity drawn
// down at the retirement return rate (so the pot itself is never actually depleted).
function estimatePension(inputs, currentAge) {
  const base = inputs.pensionContributionBase === 'gross' ? inputs.grossMonthlyIncome : inputs.netMonthlyIncome;
  const monthlyRate = Math.pow(1 + inputs.pensionFundGrowthRate / 100, 1 / 12) - 1;

  let pot = 0;
  for (let age = currentAge; age < inputs.pensionStartAge; age++) {
    const salaryGrowthFactor = Math.pow(1 + inputs.salaryGrowthRate / 100, age - currentAge);
    const monthlyContribution =
      age < inputs.semiRetirementAge
        ? base * salaryGrowthFactor * (inputs.pensionContributionPct / 100)
        : (inputs.voluntaryTopupAnnual || 0) / 12;
    for (let m = 0; m < 12; m++) {
      pot = pot * (1 + monthlyRate) + monthlyContribution;
    }
  }
  const monthlyPension = (pot * (inputs.drawdownReturn / 100)) / 12;
  return { pot, monthlyPension };
}

export const PHASES = {
  WORKING: 'working',
  SEMI_RETIREMENT: 'semi_retirement',
  FULL_RETIREMENT_PRE_PENSION: 'full_retirement_pre_pension',
  PENSION: 'pension',
};

export function runSimulation(inputs) {
  const currentAge = getCurrentAge(inputs.dob);
  const currentYear = new Date().getFullYear();

  let projectedPensionMonthly = inputs.projectedPensionMonthly;
  let estimatedPot = null;
  if (inputs.pensionEstimateMode) {
    const est = estimatePension(inputs, currentAge);
    projectedPensionMonthly = est.monthlyPension;
    estimatedPot = est.pot;
  }

  const lifeEvents = inputs.lifeEvents || [];

  const rows = [];
  let portfolio = inputs.portfolioValue;
  let depletionAge = null;

  let emergencyFund = inputs.emergencyFundMode === 'lump' ? inputs.emergencyFundLumpSum : 0;
  let emergencyFundShortfallAge = null;
  let emergencyFundShortfallAmount = 0;

  for (let age = currentAge; age <= END_AGE; age++) {
    const yearsElapsed = age - currentAge;
    // A single flat rate, compounding across the whole projection — no separate
    // retirement-phase curve. Set it to include inflation if that's how you think about it.
    const baseExpenseMonthly = inputs.monthlyExpenses * Math.pow(1 + inputs.expenseGrowthRate / 100, yearsElapsed);
    // "Life" events (wedding, child, house) are ordinary planned costs, added to the
    // living-expense baseline and funded the normal way — same as any other expense.
    const livingExpenseMonthly = Math.max(0, baseExpenseMonthly + lifeEventCostAt(age, lifeEvents));

    // The voluntary pension top-up is a real monthly cost, folded into target
    // expenses (and therefore the income chart) rather than being a hidden withdrawal.
    const topupMonthly =
      age >= inputs.semiRetirementAge && age < inputs.pensionStartAge ? (inputs.voluntaryTopupAnnual || 0) / 12 : 0;
    const topupAnnual = topupMonthly * 12;

    // Phase & the phase's ordinary (pre-shock) work income — computed before shock
    // costs so job-loss events can be sized against it without circularity.
    let phase;
    let rate;
    let incomeWork = 0;
    let incomePension = 0;
    let contributionAnnual = 0;
    let nonShockWithdrawalRequestedAnnual = 0;

    if (age < inputs.semiRetirementAge) {
      phase = PHASES.WORKING;
      rate = inputs.accumulationReturn / 100;
      const salaryGrowthFactor = Math.pow(1 + inputs.salaryGrowthRate / 100, yearsElapsed);
      contributionAnnual = inputs.monthlyContribution * 12 * salaryGrowthFactor;
      incomeWork = inputs.netMonthlyIncome * salaryGrowthFactor;
    } else if (age < inputs.fullRetirementAge) {
      phase = PHASES.SEMI_RETIREMENT;
      rate = inputs.drawdownReturn / 100;
      incomeWork = livingExpenseMonthly * (inputs.workIncomePct / 100);
      nonShockWithdrawalRequestedAnnual = livingExpenseMonthly * 12 - incomeWork * 12;
    } else if (age < inputs.pensionStartAge) {
      phase = PHASES.FULL_RETIREMENT_PRE_PENSION;
      rate = inputs.drawdownReturn / 100;
      nonShockWithdrawalRequestedAnnual = livingExpenseMonthly * 12;
    } else {
      phase = PHASES.PENSION;
      rate = inputs.drawdownReturn / 100;
      incomePension = Math.min(projectedPensionMonthly, livingExpenseMonthly);
      nonShockWithdrawalRequestedAnnual = Math.max(0, livingExpenseMonthly - projectedPensionMonthly) * 12;
    }

    // "Shock" events (car, illness, job loss) are tested against the emergency fund
    // first; whatever the fund can't cover falls through to the portfolio below.
    const { total: shockCostMonthly } = shockEventCostAt(age, lifeEvents, incomeWork);
    const shockCostAnnual = shockCostMonthly * 12;

    emergencyFund *= 1 + inputs.emergencyFundReturnRate / 100;
    if (inputs.emergencyFundMode === 'build' && emergencyFund < inputs.emergencyFundTarget) {
      emergencyFund = Math.min(inputs.emergencyFundTarget, emergencyFund + inputs.emergencyFundMonthlyContribution * 12);
    }
    const emergencyFundCoveredAnnual = Math.min(emergencyFund, shockCostAnnual);
    emergencyFund -= emergencyFundCoveredAnnual;
    const residualShockAnnual = shockCostAnnual - emergencyFundCoveredAnnual;
    if (residualShockAnnual > DEPLETION_EPSILON && emergencyFundShortfallAge === null) {
      emergencyFundShortfallAge = age;
      emergencyFundShortfallAmount = residualShockAnnual;
    }

    // Target expenses show the full, honest cost — including shocks the emergency
    // fund happens to cover — so nothing is hidden from the headline number.
    const targetExpenseMonthly = livingExpenseMonthly + shockCostMonthly + topupMonthly;

    const portfolioStart = portfolio;
    const afterGrowth = portfolioStart * (1 + rate);
    const afterContribution = phase === PHASES.WORKING ? afterGrowth + contributionAnnual : afterGrowth;
    const requestedOutflowAnnual =
      (phase === PHASES.WORKING ? 0 : nonShockWithdrawalRequestedAnnual) + topupAnnual + residualShockAnnual;

    let portfolioEnd;
    let actualOutflowAnnual;
    const uncapped = afterContribution - requestedOutflowAnnual;
    if (uncapped < 0) {
      actualOutflowAnnual = Math.max(0, afterContribution);
      portfolioEnd = 0;
      if (age >= inputs.semiRetirementAge && depletionAge === null) {
        depletionAge = age;
      }
    } else {
      actualOutflowAnnual = requestedOutflowAnnual;
      portfolioEnd = uncapped;
    }

    // "Opportunity" events (inheritance, windfalls) inject straight into the
    // portfolio, arriving after this year's growth/contribution/withdrawal.
    portfolioEnd += opportunityInjectionAt(age, lifeEvents);

    const incomePortfolio = actualOutflowAnnual / 12;
    const incomeEmergencyFund = emergencyFundCoveredAnnual / 12;

    const unfundedGap = Math.max(0, targetExpenseMonthly - incomeWork - incomePortfolio - incomeEmergencyFund - incomePension);

    rows.push({
      age,
      year: currentYear + yearsElapsed,
      phase,
      portfolioStart,
      portfolioEnd,
      targetExpenseMonthly,
      incomeWork,
      incomePortfolio,
      incomeEmergencyFund,
      incomePension,
      unfundedGap,
      emergencyFundBalance: emergencyFund,
      shockCostMonthly,
      shockResidualMonthly: residualShockAnnual / 12,
    });

    portfolio = portfolioEnd;
  }

  const rowAtAge = (age) => rows.find((r) => r.age === age);
  const valueAtOrNow = (age) => {
    const row = rowAtAge(age);
    if (row) return row.portfolioStart;
    return age <= currentAge ? rows[0].portfolioStart : null;
  };

  const rowsFromSemiRetirement = rows.filter((r) => r.age >= inputs.semiRetirementAge);
  const lowestAfterSemiRetirement = rowsFromSemiRetirement.length
    ? rowsFromSemiRetirement.reduce((min, r) => (r.portfolioEnd < min.portfolioEnd ? r : min), rowsFromSemiRetirement[0])
        .portfolioEnd
    : null;

  const hasShortfall = depletionAge !== null || rows.some((r) => r.unfundedGap > DEPLETION_EPSILON / 12);
  const hasShockEvents = lifeEvents.some((e) => e.category === 'shock');

  return {
    currentAge,
    rows,
    depletionAge,
    estimatedPensionMonthly: inputs.pensionEstimateMode ? projectedPensionMonthly : null,
    estimatedPot,
    emergencyFund: {
      applicable: hasShockEvents,
      finalBalance: rows.length ? rows[rows.length - 1].emergencyFundBalance : emergencyFund,
      shortfallAge: emergencyFundShortfallAge,
      shortfallAmount: emergencyFundShortfallAmount,
      status: emergencyFundShortfallAge === null ? 'covered' : 'shortfall',
    },
    metrics: {
      portfolioAtSemiRetirement: valueAtOrNow(inputs.semiRetirementAge),
      lowestAfterSemiRetirement,
      portfolioAtPension: valueAtOrNow(inputs.pensionStartAge),
      portfolioAt90: rowAtAge(90) ? rowAtAge(90).portfolioStart : null,
      status: hasShortfall ? 'shortfall' : 'on_track',
    },
  };
}
