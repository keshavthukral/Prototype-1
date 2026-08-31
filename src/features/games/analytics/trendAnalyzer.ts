/**
 * Trend Analyzer — Personal history comparison over the previous 7 days.
 *
 * Compares today's performance against the patient's own recent history.
 * Uses neutral language: "higher_than_recent", "near_recent", "lower_than_recent".
 * Does NOT make diagnostic conclusions.
 */

import type { DailyPerformance } from './dailyAnalyzer'

// ─── Types ──────────────────────────────────────────────────────

export type TrendDirection = 'higher_than_recent' | 'near_recent' | 'lower_than_recent' | 'insufficient_history'

export interface MetricTrend {
  today: number | null
  recentAverage: number | null
  difference: number | null
  trend: TrendDirection
}

export interface PersonalTrendReport {
  date: string
  memory: {
    immediateRecall: MetricTrend
    delayedRecall: MetricTrend
    spatial: MetricTrend
    sequence: MetricTrend
    association: MetricTrend
    responseTime: MetricTrend
  }
  attention: {
    pattern: MetricTrend
    visualSearch: MetricTrend
    matching: MetricTrend
    ruleSwitch: MetricTrend
    selectiveAttention: MetricTrend
    workingMemory: MetricTrend
    responseTime: MetricTrend
  }
}

// ─── Helpers ────────────────────────────────────────────────────

const MIN_HISTORY_DAYS = 3

/**
 * Calculate the trend for a single metric.
 * Compares today's value against the recent average (previous 7 days).
 */
function calculateTrend(
  today: number | null,
  recentValues: (number | null)[],
): MetricTrend {
  if (today === null) {
    return { today: null, recentAverage: null, difference: null, trend: 'insufficient_history' }
  }

  const validRecent = recentValues.filter((v): v is number => v !== null)
  if (validRecent.length < MIN_HISTORY_DAYS) {
    return { today, recentAverage: null, difference: null, trend: 'insufficient_history' }
  }

  const recentAverage = Math.round(
    validRecent.reduce((sum, v) => sum + v, 0) / validRecent.length,
  )
  const difference = Math.round(today - recentAverage)

  // Use a threshold of ±5% to determine trend
  let trend: TrendDirection
  if (difference > 5) {
    trend = 'higher_than_recent'
  } else if (difference < -5) {
    trend = 'lower_than_recent'
  } else {
    trend = 'near_recent'
  }

  return { today, recentAverage, difference, trend }
}

// ─── Public API ─────────────────────────────────────────────────

/**
 * Build a personal trend report comparing today's performance
 * against the previous 7 completed activity days.
 *
 * @param today - Today's performance data
 * @param recentDays - Array of recent DailyPerformance (newest first, up to 7)
 */
export function buildPersonalTrendReport(
  today: DailyPerformance,
  recentDays: DailyPerformance[],
): PersonalTrendReport {
  // Take previous 7 days (exclude today if present)
  const previous = recentDays
    .filter((d) => d.date !== today.date)
    .slice(0, 7)

  return {
    date: today.date,

    memory: {
      immediateRecall: calculateTrend(
        today.memory.immediateRecallAccuracy,
        previous.map((d) => d.memory.immediateRecallAccuracy),
      ),
      delayedRecall: calculateTrend(
        today.memory.delayedRecallAccuracy,
        previous.map((d) => d.memory.delayedRecallAccuracy),
      ),
      spatial: calculateTrend(
        today.memory.spatialAccuracy,
        previous.map((d) => d.memory.spatialAccuracy),
      ),
      sequence: calculateTrend(
        today.memory.sequenceAccuracy,
        previous.map((d) => d.memory.sequenceAccuracy),
      ),
      association: calculateTrend(
        today.memory.associationAccuracy,
        previous.map((d) => d.memory.associationAccuracy),
      ),
      responseTime: calculateTrend(
        today.memory.responseTime,
        previous.map((d) => d.memory.responseTime),
      ),
    },

    attention: {
      pattern: calculateTrend(
        today.attention.patternAccuracy,
        previous.map((d) => d.attention.patternAccuracy),
      ),
      visualSearch: calculateTrend(
        today.attention.visualSearchAccuracy,
        previous.map((d) => d.attention.visualSearchAccuracy),
      ),
      matching: calculateTrend(
        today.attention.matchingAccuracy,
        previous.map((d) => d.attention.matchingAccuracy),
      ),
      ruleSwitch: calculateTrend(
        today.attention.ruleSwitchAccuracy,
        previous.map((d) => d.attention.ruleSwitchAccuracy),
      ),
      selectiveAttention: calculateTrend(
        today.attention.selectiveAttentionAccuracy,
        previous.map((d) => d.attention.selectiveAttentionAccuracy),
      ),
      workingMemory: calculateTrend(
        today.attention.workingMemoryAccuracy,
        previous.map((d) => d.attention.workingMemoryAccuracy),
      ),
      responseTime: calculateTrend(
        today.attention.responseTime,
        previous.map((d) => d.attention.responseTime),
      ),
    },
  }
}

/**
 * Format a trend direction as a neutral, patient-friendly label.
 * Used by caregiver reports.
 */
export function formatTrendLabel(trend: TrendDirection): string {
  switch (trend) {
    case 'higher_than_recent':
      return 'Above recent activity'
    case 'near_recent':
      return 'Stable'
    case 'lower_than_recent':
      return 'Below recent activity'
    case 'insufficient_history':
      return 'Needs more activity days'
  }
}

/**
 * Format a trend direction as a neutral, patient-friendly label for Assamese.
 */
export function formatTrendLabelAs(trend: TrendDirection): string {
  switch (trend) {
    case 'higher_than_recent':
      return 'শেহতীয়া কাৰ্যকলাপৰ চেয়ে বেছি'
    case 'near_recent':
      return 'স্থিৰ'
    case 'lower_than_recent':
      return 'শেহতীয়া কাৰ্যকলাপৰ তুলনাত কম'
    case 'insufficient_history':
      return 'অধিক কাৰ্যকলাপৰ দিন লাগে'
  }
}
