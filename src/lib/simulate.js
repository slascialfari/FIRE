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
  // label, age, oneoff, monthly, growthPct, durationYears, incomeReductionPct,
  // fundingSource: 'main'|'emergencyFund'|'expenses' }.
  // 'life' and 'shock' events are funded from whichever bucket their fundingSource
  // points to: Main portfolio directly, the Emergency fund, or the Expenses fund —
  // the latter two absorb what they can, with the rest overflowing to Main.
  // 'opportunity' events (inheritance) inject a lump sum straight into the portfolio.
  lifeEvents: [],

  // Emergency fund: a cash buffer tracked independently of the portfolio, for
  // events routed to it (see fundingSource above).
  emergencyFundMode: 'build', // 'lump' | 'build'
  emergencyFundLumpSum: 15000,
  emergencyFundTarget: 15000,
  emergencyFundMonthlyContribution: 150,
  emergencyFundReturnRate: 1, // % real — kept low since it should stay liquid

  // Expenses fund: a second cash-like buffer for mid-term, non-emergency costs
  // (e.g. a wedding or a child's costs) — invested more like a low-volatility
  // money-market fund, so a slightly higher return than the emergency fund but
  // still conservative. Also tracked independently of the main portfolio.
  expensesFundMode: 'build', // 'lump' | 'build'
  expensesFundLumpSum: 10000,
  expensesFundTarget: 10000,
  expensesFundMonthlyContribution: 100,
  expensesFundReturnRate: 2, // % real — low-volatility, money-market-like
};

// Every dropped event's cost at a given age, bucketed by its chosen funding
// source. Job loss is sized against `incomeWork`, the phase's ordinary
// (event-independent) work income. Opportunity events are handled separately
// as direct portfolio injections (see opportunityInjectionAt).
function eventCostsBySource(age, events, incomeWork) {
  const buckets = { main: 0, emergencyFund: 0, expenses: 0 };
  events.forEach((e) => {
    if (e.category === 'opportunity') return;
    const endAge = e.age + (Number(e.durationYears) || 0);
    let cost = 0;
    if (e.presetId === 'jobloss') {
      if (age >= e.age && age < endAge) {
        cost = incomeWork * ((Number(e.incomeReductionPct) || 0) / 100);
      }
    } else {
      if (Math.round(e.age) === age) cost += (Number(e.oneoff) || 0) / 12;
      if (e.monthly && age >= e.age && age < endAge) {
        const growth = e.category === 'life' ? Math.pow(1 + (Number(e.growthPct) || 0) / 100, age - e.age) : 1;
        cost += Number(e.monthly) * growth;
      }
    }
    const bucket = e.fundingSource === 'expenses' || e.fundingSource === 'emergencyFund' ? e.fundingSource : 'main';
    buckets[bucket] += cost;
  });
  return buckets;
}

// 'opportunity' category (inheritance, windfalls) — a lump sum split across the
// main portfolio, emergency fund, and expenses fund by the event's own share
// percentages; whatever isn't allocated (the shares needn't sum to 100%) is
// treated as spent, with no lasting effect. Not routed through target expenses.
function opportunityInjectionAt(age, events) {
  const totals = { main: 0, emergencyFund: 0, expenses: 0 };
  events
    .filter((e) => e.category === 'opportunity' && Math.round(e.age) === age)
    .forEach((e) => {
      const amount = Number(e.oneoff) || 0;
      const mainPct = Math.max(0, Number(e.mainSharePct) || 0);
      const efPct = Math.max(0, Number(e.emergencyFundSharePct) || 0);
      const expPct = Math.max(0, Number(e.expensesFundSharePct) || 0);
      const totalPct = mainPct + efPct + expPct;
      // If the shares add up to more than 100%, scale them down proportionally
      // so the windfall is never over-allocated; under 100% just leaves a
      // "spent" remainder, which is fine.
      const scale = totalPct > 100 ? 100 / totalPct : 1;
      totals.main += amount * ((mainPct * scale) / 100);
      totals.emergencyFund += amount * ((efPct * scale) / 100);
      totals.expenses += amount * ((expPct * scale) / 100);
    });
  return totals;
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

  let expensesFund = inputs.expensesFundMode === 'lump' ? inputs.expensesFundLumpSum : 0;
  let expensesFundShortfallAge = null;
  let expensesFundShortfallAmount = 0;

  for (let age = currentAge; age <= END_AGE; age++) {
    const yearsElapsed = age - currentAge;
    // A single flat rate, compounding across the whole projection — no separate
    // retirement-phase curve. Set it to include inflation if that's how you think about it.
    const baseExpenseMonthly = inputs.monthlyExpenses * Math.pow(1 + inputs.expenseGrowthRate / 100, yearsElapsed);

    // The voluntary pension top-up is a real monthly cost, folded into target
    // expenses (and therefore the income chart) rather than being a hidden withdrawal.
    const topupMonthly =
      age >= inputs.semiRetirementAge && age < inputs.pensionStartAge ? (inputs.voluntaryTopupAnnual || 0) / 12 : 0;
    const topupAnnual = topupMonthly * 12;

    // Phase & the phase's ordinary work income — based on the base expense line
    // only. Dropped events are funded separately below, wherever their chosen
    // funding source points, regardless of phase.
    let phase;
    let rate;
    let incomeWork = 0;
    let incomePension = 0;
    let contributionAnnual = 0;
    let nonEventWithdrawalRequestedAnnual = 0;

    if (age < inputs.semiRetirementAge) {
      phase = PHASES.WORKING;
      rate = inputs.accumulationReturn / 100;
      const salaryGrowthFactor = Math.pow(1 + inputs.salaryGrowthRate / 100, yearsElapsed);
      contributionAnnual = inputs.monthlyContribution * 12 * salaryGrowthFactor;
      incomeWork = inputs.netMonthlyIncome * salaryGrowthFactor;
    } else if (age < inputs.fullRetirementAge) {
      phase = PHASES.SEMI_RETIREMENT;
      rate = inputs.drawdownReturn / 100;
      incomeWork = baseExpenseMonthly * (inputs.workIncomePct / 100);
      nonEventWithdrawalRequestedAnnual = baseExpenseMonthly * 12 - incomeWork * 12;
    } else if (age < inputs.pensionStartAge) {
      phase = PHASES.FULL_RETIREMENT_PRE_PENSION;
      rate = inputs.drawdownReturn / 100;
      nonEventWithdrawalRequestedAnnual = baseExpenseMonthly * 12;
    } else {
      phase = PHASES.PENSION;
      rate = inputs.drawdownReturn / 100;
      incomePension = Math.min(projectedPensionMonthly, baseExpenseMonthly);
      nonEventWithdrawalRequestedAnnual = Math.max(0, baseExpenseMonthly - projectedPensionMonthly) * 12;
    }

    // A chosen fund ("Supported by") only steps in for whatever regular income
    // can't cover — it's not the exclusive source. Income headroom is whatever's
    // left of this phase's own income (salary while working, pension once it
    // starts) after covering the baseline living expenses; that headroom absorbs
    // event costs first, and only the remainder is routed to the chosen fund.
    const incomeHeadroomMonthly =
      phase === PHASES.PENSION
        ? Math.max(0, projectedPensionMonthly - baseExpenseMonthly)
        : Math.max(0, incomeWork - baseExpenseMonthly);

    const rawCosts = eventCostsBySource(age, lifeEvents, incomeWork);
    const totalEventCostMonthly = rawCosts.main + rawCosts.emergencyFund + rawCosts.expenses;
    const headroomUsedMonthly = Math.min(incomeHeadroomMonthly, totalEventCostMonthly);
    const remainingScale = totalEventCostMonthly > 0 ? (totalEventCostMonthly - headroomUsedMonthly) / totalEventCostMonthly : 0;
    const costs = {
      main: rawCosts.main * remainingScale,
      emergencyFund: rawCosts.emergencyFund * remainingScale,
      expenses: rawCosts.expenses * remainingScale,
    };
    // The income headroom used shows up as extra work/pension income covering
    // the events, so the chart's funding sources still total to target expenses.
    if (phase === PHASES.PENSION) {
      incomePension += headroomUsedMonthly;
    } else {
      incomeWork += headroomUsedMonthly;
    }

    const emergencyFundCostAnnual = costs.emergencyFund * 12;
    emergencyFund *= 1 + inputs.emergencyFundReturnRate / 100;
    if (inputs.emergencyFundMode === 'build' && emergencyFund < inputs.emergencyFundTarget) {
      emergencyFund = Math.min(inputs.emergencyFundTarget, emergencyFund + inputs.emergencyFundMonthlyContribution * 12);
    }
    const emergencyFundCoveredAnnual = Math.min(emergencyFund, emergencyFundCostAnnual);
    emergencyFund -= emergencyFundCoveredAnnual;
    const emergencyFundResidualAnnual = emergencyFundCostAnnual - emergencyFundCoveredAnnual;
    if (emergencyFundResidualAnnual > DEPLETION_EPSILON && emergencyFundShortfallAge === null) {
      emergencyFundShortfallAge = age;
      emergencyFundShortfallAmount = emergencyFundResidualAnnual;
    }

    const expensesFundCostAnnual = costs.expenses * 12;
    expensesFund *= 1 + inputs.expensesFundReturnRate / 100;
    if (inputs.expensesFundMode === 'build' && expensesFund < inputs.expensesFundTarget) {
      expensesFund = Math.min(inputs.expensesFundTarget, expensesFund + inputs.expensesFundMonthlyContribution * 12);
    }
    const expensesFundCoveredAnnual = Math.min(expensesFund, expensesFundCostAnnual);
    expensesFund -= expensesFundCoveredAnnual;
    const expensesFundResidualAnnual = expensesFundCostAnnual - expensesFundCoveredAnnual;
    if (expensesFundResidualAnnual > DEPLETION_EPSILON && expensesFundShortfallAge === null) {
      expensesFundShortfallAge = age;
      expensesFundShortfallAmount = expensesFundResidualAnnual;
    }

    // Target expenses show the full, honest cost — including anything income
    // headroom or the emergency/expenses funds happen to cover — so nothing is
    // hidden from the headline number.
    const targetExpenseMonthly = baseExpenseMonthly + totalEventCostMonthly + topupMonthly;

    const portfolioStart = portfolio;
    const afterGrowth = portfolioStart * (1 + rate);
    const afterContribution = phase === PHASES.WORKING ? afterGrowth + contributionAnnual : afterGrowth;
    const requestedOutflowAnnual =
      (phase === PHASES.WORKING ? 0 : nonEventWithdrawalRequestedAnnual) +
      topupAnnual +
      costs.main * 12 +
      emergencyFundResidualAnnual +
      expensesFundResidualAnnual;

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

    // "Opportunity" events (inheritance, windfalls) split across the main
    // portfolio, emergency fund, and expenses fund by their own share
    // percentages, arriving after this year's growth/contribution/withdrawal.
    const opportunityInjection = opportunityInjectionAt(age, lifeEvents);
    portfolioEnd += opportunityInjection.main;
    emergencyFund += opportunityInjection.emergencyFund;
    expensesFund += opportunityInjection.expenses;

    const incomePortfolio = actualOutflowAnnual / 12;
    const incomeEmergencyFund = emergencyFundCoveredAnnual / 12;
    const incomeExpensesFund = expensesFundCoveredAnnual / 12;

    const unfundedGap = Math.max(
      0,
      targetExpenseMonthly - incomeWork - incomePortfolio - incomeEmergencyFund - incomeExpensesFund - incomePension,
    );

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
      incomeExpensesFund,
      incomePension,
      unfundedGap,
      emergencyFundBalance: emergencyFund,
      expensesFundBalance: expensesFund,
      emergencyFundCostMonthly: costs.emergencyFund,
      emergencyFundResidualMonthly: emergencyFundResidualAnnual / 12,
      expensesFundCostMonthly: costs.expenses,
      expensesFundResidualMonthly: expensesFundResidualAnnual / 12,
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
  const hasEmergencyFundEvents = lifeEvents.some((e) => (e.fundingSource || 'main') === 'emergencyFund');
  const hasExpensesFundEvents = lifeEvents.some((e) => (e.fundingSource || 'main') === 'expenses');

  return {
    currentAge,
    rows,
    depletionAge,
    estimatedPensionMonthly: inputs.pensionEstimateMode ? projectedPensionMonthly : null,
    estimatedPot,
    emergencyFund: {
      applicable: hasEmergencyFundEvents,
      finalBalance: rows.length ? rows[rows.length - 1].emergencyFundBalance : emergencyFund,
      shortfallAge: emergencyFundShortfallAge,
      shortfallAmount: emergencyFundShortfallAmount,
      status: emergencyFundShortfallAge === null ? 'covered' : 'shortfall',
    },
    expensesFund: {
      applicable: hasExpensesFundEvents,
      finalBalance: rows.length ? rows[rows.length - 1].expensesFundBalance : expensesFund,
      shortfallAge: expensesFundShortfallAge,
      shortfallAmount: expensesFundShortfallAmount,
      status: expensesFundShortfallAge === null ? 'covered' : 'shortfall',
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
