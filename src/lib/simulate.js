export const DEFAULT_INPUTS = {
  dob: '1987-02-08',
  netMonthlyIncome: 3500,
  salaryGrowthRate: 1, // % per year, ON TOP OF inflation — applies to income & contribution while working
  portfolioValue: 50000,
  monthlyContribution: 1000,
  monthlyExpenses: 2500,
  expenseGrowthRate: 1.5, // % per year, ON TOP OF inflation (model is otherwise in real/today's-euro terms)

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

  // Spending shape in retirement (the "retirement spending smile" — Blanchett 2014):
  // real spending typically eases through the Go-Go/Slow-Go years then rises again
  // late in life for healthcare, rather than compounding forever. Percentages are
  // relative to the spending level at semi-retirement (100%).
  goGoYears: 10,
  goGoMultiplier: 105,
  slowGoYears: 10,
  slowGoMultiplier: 85,
  noGoRiseYears: 10,
  noGoMultiplier: 100,

  // Life events: one-off ("shock") or recurring (e.g. a child) additions to target
  // expenses. Each: { id, label, type: 'oneoff' | 'recurring', startAge, endAge, amount }.
  // amount is a total € for 'oneoff', €/month for 'recurring'.
  lifeEvents: [],

  // Emergency fund: a cash buffer tracked independently of the portfolio, checked
  // against one-off life events only (recurring events are ordinary expenses, not
  // emergencies, and are funded the normal way above).
  emergencyFundMode: 'build', // 'lump' | 'build'
  emergencyFundLumpSum: 15000,
  emergencyFundTarget: 15000,
  emergencyFundMonthlyContribution: 150,
  emergencyFundReturnRate: 1, // % real — kept low since it should stay liquid
};

function lerp(a, b, t) {
  return a + (b - a) * Math.min(Math.max(t, 0), 1);
}

// Multiplier on the semi-retirement-age spending level: rises through the Go-Go
// years, eases through Slow-Go, then rises again toward No-Go (healthcare costs).
function smileMultiplier(age, inputs) {
  if (age <= inputs.semiRetirementAge) return 1;
  const goGoEnd = inputs.semiRetirementAge + Math.max(inputs.goGoYears, 0.001);
  const slowGoEnd = goGoEnd + Math.max(inputs.slowGoYears, 0.001);
  const noGoEnd = slowGoEnd + Math.max(inputs.noGoRiseYears, 0.001);
  const goGo = inputs.goGoMultiplier / 100;
  const slowGo = inputs.slowGoMultiplier / 100;
  const noGo = inputs.noGoMultiplier / 100;

  if (age <= goGoEnd) return lerp(1, goGo, (age - inputs.semiRetirementAge) / (goGoEnd - inputs.semiRetirementAge));
  if (age <= slowGoEnd) return lerp(goGo, slowGo, (age - goGoEnd) / (slowGoEnd - goGoEnd));
  if (age <= noGoEnd) return lerp(slowGo, noGo, (age - slowGoEnd) / (noGoEnd - slowGoEnd));
  return noGo;
}

function recurringEventAdjustment(age, events) {
  return events
    .filter((e) => e.type === 'recurring' && age >= e.startAge && age <= e.endAge)
    .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
}

function oneoffEventCostAt(age, events) {
  return events
    .filter((e) => e.type === 'oneoff' && Math.round(e.startAge) === age)
    .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
}

const END_AGE = 100;
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
  const retirementBaselineExpense =
    inputs.monthlyExpenses * Math.pow(1 + inputs.expenseGrowthRate / 100, Math.max(inputs.semiRetirementAge - currentAge, 0));

  const rows = [];
  let portfolio = inputs.portfolioValue;
  let depletionAge = null;

  let emergencyFund = inputs.emergencyFundMode === 'lump' ? inputs.emergencyFundLumpSum : 0;
  let emergencyFundShortfallAge = null;
  let emergencyFundShortfallAmount = 0;

  for (let age = currentAge; age <= END_AGE; age++) {
    const yearsElapsed = age - currentAge;
    const baseExpenseMonthly =
      age <= inputs.semiRetirementAge
        ? inputs.monthlyExpenses * Math.pow(1 + inputs.expenseGrowthRate / 100, yearsElapsed)
        : retirementBaselineExpense * smileMultiplier(age, inputs);
    // The voluntary pension top-up is a real monthly cost, so it's folded into target
    // expenses (and therefore the income chart) rather than being a hidden withdrawal.
    const topupMonthly =
      age >= inputs.semiRetirementAge && age < inputs.pensionStartAge ? (inputs.voluntaryTopupAnnual || 0) / 12 : 0;
    const livingExpenseMonthly = Math.max(0, baseExpenseMonthly + recurringEventAdjustment(age, lifeEvents));
    const targetExpenseMonthly = livingExpenseMonthly + topupMonthly;
    const targetExpenseAnnual = targetExpenseMonthly * 12;
    const topupAnnual = topupMonthly * 12;

    // Emergency fund is tracked independently of the portfolio: it grows/tops up on
    // its own schedule and is tested only against one-off ("shock") events, so it
    // never changes the main funding waterfall below.
    const oneoffCost = oneoffEventCostAt(age, lifeEvents);
    emergencyFund *= 1 + inputs.emergencyFundReturnRate / 100;
    if (inputs.emergencyFundMode === 'build' && emergencyFund < inputs.emergencyFundTarget) {
      emergencyFund = Math.min(inputs.emergencyFundTarget, emergencyFund + inputs.emergencyFundMonthlyContribution * 12);
    }
    if (oneoffCost > 0) {
      if (emergencyFund < oneoffCost && emergencyFundShortfallAge === null) {
        emergencyFundShortfallAge = age;
        emergencyFundShortfallAmount = oneoffCost - emergencyFund;
      }
      emergencyFund = Math.max(0, emergencyFund - oneoffCost);
    }

    let phase;
    let rate;
    let incomeWork = 0;
    let incomePension = 0;
    let contributionAnnual = 0;
    let withdrawalRequestedAnnual = 0;

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
      const livingPortfolioShareAnnual = livingExpenseMonthly * 12 - incomeWork * 12;
      withdrawalRequestedAnnual = livingPortfolioShareAnnual + topupAnnual;
    } else if (age < inputs.pensionStartAge) {
      phase = PHASES.FULL_RETIREMENT_PRE_PENSION;
      rate = inputs.drawdownReturn / 100;
      withdrawalRequestedAnnual = livingExpenseMonthly * 12 + topupAnnual;
    } else {
      phase = PHASES.PENSION;
      rate = inputs.drawdownReturn / 100;
      incomePension = Math.min(projectedPensionMonthly, targetExpenseMonthly);
      const portfolioShareMonthly = Math.max(0, targetExpenseMonthly - projectedPensionMonthly);
      withdrawalRequestedAnnual = portfolioShareMonthly * 12;
    }

    const portfolioStart = portfolio;
    const grown = portfolio * (1 + rate);

    let portfolioEnd;
    let actualWithdrawalTotal;
    if (phase === PHASES.WORKING) {
      portfolioEnd = grown + contributionAnnual;
      actualWithdrawalTotal = 0;
    } else {
      const uncapped = grown - withdrawalRequestedAnnual;
      if (uncapped < 0) {
        actualWithdrawalTotal = Math.max(0, grown);
        portfolioEnd = 0;
        if (age >= inputs.semiRetirementAge && depletionAge === null) {
          depletionAge = age;
        }
      } else {
        actualWithdrawalTotal = withdrawalRequestedAnnual;
        portfolioEnd = uncapped;
      }
    }

    // The top-up is now part of target expenses (see above), so any shortfall in
    // funding it shows up honestly as part of the unfunded gap below, rather than
    // being silently absorbed.
    const incomePortfolio = phase === PHASES.WORKING ? 0 : actualWithdrawalTotal / 12;

    const unfundedGap = Math.max(0, targetExpenseMonthly - incomeWork - incomePortfolio - incomePension);

    rows.push({
      age,
      year: currentYear + yearsElapsed,
      phase,
      portfolioStart,
      portfolioEnd,
      targetExpenseMonthly,
      incomeWork,
      incomePortfolio,
      incomePension,
      unfundedGap,
      emergencyFundBalance: emergencyFund,
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
  const hasOneoffEvents = lifeEvents.some((e) => e.type === 'oneoff');

  return {
    currentAge,
    rows,
    depletionAge,
    estimatedPensionMonthly: inputs.pensionEstimateMode ? projectedPensionMonthly : null,
    estimatedPot,
    emergencyFund: {
      applicable: hasOneoffEvents,
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
