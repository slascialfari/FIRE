// Standard NL reference assumptions used to suggest starting values for the
// daycare and illness calculators. These are rough, editable starting points —
// not personalized or actuarial advice.

// Kinderopvang (childcare), 2026 figures:
// - Average dagopvang (0-4yo daycare) hourly rate ~€10.46, vs. the max hourly
//   rate eligible for kinderopvangtoeslag of €11.23.
// - A typical full daycare day is billed around 10 contracted hours.
// - Reimbursement (kinderopvangtoeslag) commonly runs 70-95% of eligible costs
//   depending on combined household income; 80% is used here as a typical
//   middle-of-the-road assumption.
// Sources: belastingdienst.nl (maximum uurtarief kinderopvangtoeslag 2026),
// oudersvannu.nl / bijkinderstad.nl (average market hourly rates 2026).
export const DAYCARE_ASSUMPTIONS = {
  hourlyRate: 10.46,
  hoursPerDay: 10,
  weeksPerMonth: 4.33,
  typicalReimbursementPct: 80,
};

export function estimateDaycareMonthly({ daysPerWeek, partnerSharePct }) {
  const grossMonthly =
    DAYCARE_ASSUMPTIONS.hourlyRate * DAYCARE_ASSUMPTIONS.hoursPerDay * daysPerWeek * DAYCARE_ASSUMPTIONS.weeksPerMonth;
  const netMonthly = grossMonthly * (1 - DAYCARE_ASSUMPTIONS.typicalReimbursementPct / 100);
  const yourShare = netMonthly * (1 - (partnerSharePct || 0) / 100);
  return { grossMonthly, netMonthly, yourShare };
}

// Illness archetypes: a handful of conditions that show up often in NL health
// statistics for men, each with a rough monthly out-of-pocket cost (built on
// the fixed mandatory deductible — "eigen risico" — of €385/year (~€32/month)
// plus condition-typical extras: physio co-pays, non-reimbursed therapy,
// ongoing monitoring/medication contributions) and a typical duration.
// These are starting points for the simulator, not medical or financial advice.
// Sources: zorginstituutnederland.nl (eigen risico 2026 = €385/yr); general
// prevalence context from Dutch public-health literature (cardiovascular
// disease as the leading cause of disease-years for older Dutch men; back/
// joint problems, metabolic conditions, and burnout are among the most
// commonly reported chronic complaints).
export const ILLNESS_TYPES = [
  {
    id: 'back_joint',
    label: 'Back / joint problems',
    note: 'Most commonly reported chronic physical complaint — ongoing physio, often only partly reimbursed',
    monthly: 120,
    durationYears: 5,
  },
  {
    id: 'cardiovascular',
    label: 'Cardiovascular event',
    note: 'Leading cause of disease-years for older Dutch men — rehab, monitoring, medication',
    monthly: 150,
    durationYears: 2,
  },
  {
    id: 'burnout',
    label: 'Burnout / mental health',
    note: 'Common cause of extended leave — therapy sessions beyond basic insurance cover',
    monthly: 100,
    durationYears: 1,
  },
  {
    id: 'metabolic',
    label: 'Diabetes / metabolic condition',
    note: 'Chronic — ongoing medication and monitoring contribution',
    monthly: 80,
    durationYears: 15,
  },
  {
    id: 'cancer',
    label: 'Cancer treatment',
    note: 'Lower base rate but highest typical cost — treatment, travel, non-reimbursed extras',
    monthly: 300,
    durationYears: 1.5,
  },
];
