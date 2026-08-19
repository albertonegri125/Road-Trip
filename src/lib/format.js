// src/lib/format.js
// Shared display formatters for trip stops — used by BuilderPage and TripDetailPage
// so both render segments identically instead of drifting apart.

export function fmtDur(min, lang) {
  const h = Math.floor(min / 60), m = min % 60
  return h > 0 ? `${h}h ${m}${lang === 'it' ? 'min' : 'm'}` : `${m}${lang === 'it' ? 'min' : 'm'}`
}

// The starting stop has 0 nights by design (day 1 is the first day of driving, not a
// night spent before departing) — `?? 1` only covers missing/undefined data, never masks
// a real 0.
export function nightsLabel(nights, isIt) {
  const n = nights ?? 1
  if (n <= 0) return isIt ? 'Partenza' : 'Departure'
  return `${n} ${n > 1 ? (isIt ? 'notti' : 'nights') : (isIt ? 'notte' : 'night')}`
}
