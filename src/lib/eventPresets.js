export const CATEGORIES = {
  life: { id: 'life', label: 'Life events', colorKey: 'life' },
  shock: { id: 'shock', label: 'Shit happens', colorKey: 'shock' },
  opportunity: { id: 'opportunity', label: 'Opportunities', colorKey: 'opportunity' },
};

// fields: which settings this preset exposes, in display order.
// defaults: starting values when a new event is dropped on the timeline.
export const PRESETS = [
  {
    id: 'wedding',
    category: 'life',
    label: 'Wedding',
    emoji: '💍',
    fields: ['oneoff'],
    defaults: { oneoff: 15000, monthly: 0, growthPct: 0, durationYears: 0, incomeReductionPct: 0, fundingSource: 'main' },
  },
  {
    id: 'child',
    category: 'life',
    label: 'New child',
    emoji: '👶',
    fields: ['oneoff', 'monthly', 'growthPct', 'durationYears'],
    defaults: {
      oneoff: 3000,
      monthly: 500,
      growthPct: 3,
      durationYears: 18,
      incomeReductionPct: 0,
      fundingSource: 'main',
      // Calculator inputs (see nlAssumptions.js) — remembered so the daycare
      // calculator re-opens with whatever the user last set.
      daycareDaysPerWeek: 3,
      partnerSharePct: 50,
    },
  },
  {
    id: 'house',
    category: 'life',
    label: 'New house',
    emoji: '🏠',
    fields: ['oneoff', 'monthly', 'durationYears'],
    defaults: { oneoff: 20000, monthly: 300, growthPct: 0, durationYears: 40, incomeReductionPct: 0, fundingSource: 'main' },
  },
  {
    id: 'car',
    category: 'shock',
    label: 'Car breaks down',
    emoji: '🚗',
    fields: ['oneoff'],
    defaults: { oneoff: 4000, monthly: 0, growthPct: 0, durationYears: 0, incomeReductionPct: 0, fundingSource: 'emergencyFund' },
  },
  {
    id: 'illness',
    category: 'shock',
    label: 'Illness',
    emoji: '🤒',
    fields: ['monthly', 'durationYears'],
    defaults: { oneoff: 0, monthly: 400, growthPct: 0, durationYears: 3, incomeReductionPct: 0, fundingSource: 'emergencyFund' },
  },
  {
    id: 'jobloss',
    category: 'shock',
    label: 'Job loss',
    emoji: '💼',
    fields: ['incomeReductionPct', 'durationYears'],
    defaults: { oneoff: 0, monthly: 0, growthPct: 0, durationYears: 1, incomeReductionPct: 100, fundingSource: 'emergencyFund' },
  },
  {
    id: 'inheritance',
    category: 'opportunity',
    label: 'Inheritance',
    emoji: '💰',
    // No fundingSource here — a windfall isn't "supported by" anything, it's
    // split across where it goes (see mainSharePct/emergencyFundSharePct/
    // expensesFundSharePct below; whatever's left over is treated as spent).
    fields: ['oneoff', 'mainSharePct', 'emergencyFundSharePct', 'expensesFundSharePct'],
    defaults: {
      oneoff: 25000,
      monthly: 0,
      growthPct: 0,
      durationYears: 0,
      incomeReductionPct: 0,
      mainSharePct: 70,
      emergencyFundSharePct: 15,
      expensesFundSharePct: 15,
    },
  },
];

// Shown as a "Supported by" selector on life/shock events (opportunities are pure
// inflows and don't need one). The chosen fund only steps in for whatever the
// phase's own income can't cover; it absorbs what it can from there, with
// anything left over overflowing to the main portfolio.
export const FUNDING_SOURCES = [
  { value: 'emergencyFund', label: 'Emergency fund' },
  { value: 'main', label: 'Main portfolio' },
  { value: 'expenses', label: 'Expenses fund' },
];

export const PRESET_BY_ID = Object.fromEntries(PRESETS.map((p) => [p.id, p]));

export const FIELD_META = {
  oneoff: { label: 'One-off €', prefix: '€', step: 500 },
  monthly: { label: '€ / month', prefix: '€', step: 25 },
  growthPct: { label: 'Cost growth %/yr', prefix: '', step: 0.5, suffix: '%' },
  durationYears: { label: 'Duration (yrs)', prefix: '', step: 1, suffix: 'yrs' },
  incomeReductionPct: { label: '% income lost', prefix: '', step: 5, suffix: '%' },
  mainSharePct: { label: 'To main portfolio %', prefix: '', step: 5, suffix: '%' },
  emergencyFundSharePct: { label: 'To emergency fund %', prefix: '', step: 5, suffix: '%' },
  expensesFundSharePct: { label: 'To expenses fund %', prefix: '', step: 5, suffix: '%' },
};

export function createEventFromPreset(preset, age) {
  return {
    id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
    category: preset.category,
    presetId: preset.id,
    label: preset.label,
    emoji: preset.emoji,
    age,
    ...preset.defaults,
  };
}
