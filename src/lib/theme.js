import { PHASES } from './simulate';

// Categorical slots pulled from the validated reference palette (see dataviz skill,
// references/palette.md). Assigned in a fixed order, reused consistently across charts.
export const PHASE_COLORS = {
  [PHASES.WORKING]: { light: '#2a78d6', dark: '#3987e5', label: 'Working' },
  [PHASES.SEMI_RETIREMENT]: { light: '#eda100', dark: '#c98500', label: 'Semi-retirement' },
  [PHASES.FULL_RETIREMENT_PRE_PENSION]: {
    light: '#eb6834',
    dark: '#d95926',
    label: 'Full retirement (pre-pension)',
  },
  [PHASES.PENSION]: { light: '#008300', dark: '#008300', label: 'Pension active' },
};

export const INCOME_COLORS = {
  work: { light: '#2a78d6', dark: '#3987e5', label: 'Work income' },
  portfolio: { light: '#4a3aa7', dark: '#9085e9', label: 'Portfolio withdrawals' },
  emergencyFund: { light: '#eda100', dark: '#c98500', label: 'Emergency fund' },
  expensesFund: { light: '#eb6834', dark: '#d95926', label: 'Expenses fund' },
  pension: { light: '#008300', dark: '#008300', label: 'Pension income' },
  gap: { light: '#d03b3b', dark: '#d03b3b', label: 'Unfunded gap' },
};

// Event categories, used by the life-events timeline and the emergency-fund chart.
// Magenta for "life" keeps it visually distinct from work-income/working-phase blue
// used elsewhere on the dashboard.
export const EVENT_CATEGORY_COLORS = {
  life: { light: '#e87ba4', dark: '#d55181', label: 'Life events' },
  shock: { light: '#e34948', dark: '#e66767', label: 'Shit happens' },
  opportunity: { light: '#008300', dark: '#008300', label: 'Opportunities' },
};

export const CHART_CHROME = {
  surface: { light: '#fcfcfb', dark: '#1a1a19' },
  primaryInk: { light: '#0b0b0b', dark: '#ffffff' },
  secondaryInk: { light: '#52514e', dark: '#c3c2b7' },
  mutedInk: { light: '#898781', dark: '#898781' },
  gridline: { light: '#e1e0d9', dark: '#2c2c2a' },
  baseline: { light: '#c3c2b7', dark: '#383835' },
};

export function pick(token, isDark) {
  return isDark ? token.dark : token.light;
}
