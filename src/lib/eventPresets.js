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
    defaults: { oneoff: 15000, monthly: 0, growthPct: 0, durationYears: 0, incomeReductionPct: 0 },
  },
  {
    id: 'child',
    category: 'life',
    label: 'New child',
    emoji: '👶',
    fields: ['oneoff', 'monthly', 'growthPct', 'durationYears'],
    defaults: { oneoff: 3000, monthly: 500, growthPct: 3, durationYears: 18, incomeReductionPct: 0 },
  },
  {
    id: 'house',
    category: 'life',
    label: 'New house',
    emoji: '🏠',
    fields: ['oneoff', 'monthly', 'durationYears'],
    defaults: { oneoff: 20000, monthly: 300, growthPct: 0, durationYears: 40, incomeReductionPct: 0 },
  },
  {
    id: 'car',
    category: 'shock',
    label: 'Car breaks down',
    emoji: '🚗',
    fields: ['oneoff'],
    defaults: { oneoff: 4000, monthly: 0, growthPct: 0, durationYears: 0, incomeReductionPct: 0 },
  },
  {
    id: 'illness',
    category: 'shock',
    label: 'Illness',
    emoji: '🤒',
    fields: ['monthly', 'durationYears'],
    defaults: { oneoff: 0, monthly: 400, growthPct: 0, durationYears: 3, incomeReductionPct: 0 },
  },
  {
    id: 'jobloss',
    category: 'shock',
    label: 'Job loss',
    emoji: '💼',
    fields: ['incomeReductionPct', 'durationYears'],
    defaults: { oneoff: 0, monthly: 0, growthPct: 0, durationYears: 1, incomeReductionPct: 100 },
  },
  {
    id: 'inheritance',
    category: 'opportunity',
    label: 'Inheritance',
    emoji: '💰',
    fields: ['oneoff'],
    defaults: { oneoff: 25000, monthly: 0, growthPct: 0, durationYears: 0, incomeReductionPct: 0 },
  },
];

export const PRESET_BY_ID = Object.fromEntries(PRESETS.map((p) => [p.id, p]));

export const FIELD_META = {
  oneoff: { label: 'One-off €', prefix: '€', step: 500 },
  monthly: { label: '€ / month', prefix: '€', step: 25 },
  growthPct: { label: 'Cost growth %/yr', prefix: '', step: 0.5, suffix: '%' },
  durationYears: { label: 'Duration (yrs)', prefix: '', step: 1, suffix: 'yrs' },
  incomeReductionPct: { label: '% income lost', prefix: '', step: 5, suffix: '%' },
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
