export const ROOM_PRICES = Object.freeze({
  single: 9500,
  double: 11500,
  triple: 12750
});

export const EXTENSION_MODES = Object.freeze([
  'stay_extend',
  'room_upgrade',
  'both'
]);

export const ROOM_UPGRADE_RULES = Object.freeze({
  single: ['double', 'triple'],
  double: ['triple'],
  triple: []
});

export const EXTENSION_DATE_LIMITS = Object.freeze({
  minCheckIn: '2026-06-09',
  maxCheckIn: '2026-06-10',
  minCheckOut: '2026-06-10',
  maxCheckOut: '2026-06-11'
});
