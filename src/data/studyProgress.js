// This is the shape of data stored in Supabase for each card per user
// Not actual data — just documentation of the structure
export const CARD_PROGRESS_SHAPE = {
  user_id: 'uuid',
  card_id: 'bh-001',
  event_id: 'behavioral-health',
  rating: 'got-it', // 'got-it' | 'almost' | 'review-again' | 'new'
  next_review_date: '2026-05-18', // calculated based on rating
  times_seen: 0,
  times_correct: 0,
  last_seen: null,
}

// Spaced repetition intervals in days
export const REVIEW_INTERVALS = {
  'got-it': [1, 4, 10, 21, 60],
  'almost': [1, 2, 4, 7],
  'review-again': [0], // always next session
}

export function getNextReviewDate(rating, timesSeen) {
  const intervals = REVIEW_INTERVALS[rating]
  const days = intervals[Math.min(timesSeen, intervals.length - 1)]
  const date = new Date()
  date.setDate(date.getDate() + days)
  return date.toISOString().split('T')[0]
}
