export function fmtK(v) {
  if (v == null) return '—';
  if (Math.abs(v) >= 1000000) return '$' + (v / 1000000).toFixed(1) + 'M';
  if (Math.abs(v) >= 1000) return '$' + (v / 1000).toFixed(1) + 'K';
  return '$' + v.toFixed(0);
}

export function fmt$(v) {
  if (v == null) return '—';
  return '$' + Number(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function fmtN(v) {
  if (v == null) return '—';
  return Number(v).toLocaleString('en-US');
}

export function fmtPct(v) {
  if (v == null) return '—';
  return v.toFixed(1) + '%';
}

export const COLORS = {
  Star: '#6ee7b7',
  'Plow Horse': '#9f7cef',
  Puzzle: '#7cb9ef',
  Dog: '#ef7c7c',
  Entrees: '#7c3aed',
  'NA Drinks': '#3a7be0',
  Sides: '#10b981',
  Sweets: '#f472b6',
  'Kids Meal': '#fbbf24',
  'Alc Drinks': '#6366f1',
  Retail: '#94a3b8',
  inhouse: '#9f7cef',
  delivery: '#ef7ccf',
  loyalty: '#7c9fef',
};

export const CHART_COLOR = '#9f7cef';

export function meBadgeClass(q) {
  if (q === 'Star') return 'me-Star';
  if (q === 'Plow Horse') return 'me-Plow';
  if (q === 'Puzzle') return 'me-Puzzle';
  if (q === 'Dog') return 'me-Dog';
  return '';
}

export function rateTagClass(v) {
  if (v == null) return null;
  if (v >= 30) return 'rate-high';
  if (v >= 15) return 'rate-medium';
  return 'rate-low';
}
