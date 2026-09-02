/**
 * Single source of truth for GPS freshness thresholds. Every place that
 * needs to know "how old is too old" (the status calculator, attention
 * items, any future settings screen) reads from here -- never a literal
 * number scattered in a component.
 */
export const GPS_STATUS_THRESHOLDS = {
  /** A fix this old or newer is LIVE. */
  liveMaxAgeMs: 5 * 60 * 1000,
  /** A fix older than `liveMaxAgeMs` but at most this old is DELAYED. Older still is OFFLINE. */
  delayedMaxAgeMs: 20 * 60 * 1000,
} as const;
