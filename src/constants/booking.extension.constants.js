export const ROOM_PRICES = Object.freeze({
  single: 9500,
  double: 10000,
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
  minCheckIn: '2026-03-23',
  maxCheckIn: '2026-03-26',
  minCheckOut: '2026-03-24',
  maxCheckOut: '2026-03-27'
});
