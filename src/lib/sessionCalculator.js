import { supabase } from './supabaseClient'

const SESSION_FETCH_TIMEOUT_MS = 900

// Fetches today's study session for a user and event
// Returns cards sorted by priority: review-again first, then due today, then new
export async function getTodaysSession(userId, eventId, allCards) {
  const localProgressMap = getLocalProgressMap(userId, eventId)

  // Get this user's progress on all cards for this event from Supabase
  const { data: progressData, error } = await withTimeout(
    supabase
      .from('card_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('event_id', eventId),
    SESSION_FETCH_TIMEOUT_MS,
  ).catch((fetchError) => ({
    data: null,
    error: fetchError,
  }))

  if (error) {
    console.warn('Using local flashcard session because progress could not be fetched:', error)
    return buildSessionFromProgress(allCards, localProgressMap)
  }

  // Build a map of card_id -> progress for quick lookup
  const progressMap = { ...localProgressMap }
  if (progressData) {
    progressData.forEach(p => {
      progressMap[p.card_id] = getNewerProgress(progressMap[p.card_id], p)
    })
  }

  saveLocalProgressMap(userId, eventId, progressMap)
  return buildSessionFromProgress(allCards, progressMap)
}

function buildSessionFromProgress(allCards, progressMap) {
  const today = new Date().toISOString().split('T')[0]

  const reviewAgain = []
  const dueToday = []
  const newCards = []

  allCards.forEach(card => {
    const progress = progressMap[card.id]

    // Card has never been seen before
    if (!progress || progress.rating === 'new') {
      newCards.push(card)
      return
    }

    // Card was rated review-again - always comes back
    if (progress.rating === 'review-again') {
      reviewAgain.push(card)
      return
    }

    // Card is due today or overdue
    if (progress.next_review_date <= today) {
      dueToday.push(card)
    }
  })

  // Cap new cards at 10 per session so user isn't overwhelmed
  const cappedNewCards = newCards.slice(0, 10)

  return {
    reviewAgain,
    dueToday,
    newCards: cappedNewCards,
    totalDue: reviewAgain.length + dueToday.length + cappedNewCards.length,
    progressMap,
  }
}

// Saves a card rating to Supabase and calculates next review date
export async function saveCardRating(userId, cardId, eventId, rating, timesSeen) {
  const intervals = {
    'got-it': [4, 10, 21, 45, 60],
    'almost': [2, 2, 4, 7],
    'review-again': [0],
  }

  const localProgressMap = getLocalProgressMap(userId, eventId)
  const localProgress = localProgressMap[cardId]
  const previousTimesSeen = localProgress?.times_seen || timesSeen || 0
  const previousTimesCorrect = localProgress?.times_correct || 0
  const days = intervals[rating][Math.min(previousTimesSeen, intervals[rating].length - 1)]
  const nextDate = new Date()
  nextDate.setDate(nextDate.getDate() + days)
  const nextReviewDate = nextDate.toISOString().split('T')[0]

  const progressRecord = {
    user_id: userId,
    card_id: cardId,
    event_id: eventId,
    rating: rating,
    next_review_date: nextReviewDate,
    times_seen: previousTimesSeen + 1,
    times_correct: previousTimesCorrect + (rating !== 'review-again' ? 1 : 0),
    last_seen: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  localProgressMap[cardId] = progressRecord
  saveLocalProgressMap(userId, eventId, localProgressMap)

  supabase
    .from('card_progress')
    .upsert(progressRecord, {
      onConflict: 'user_id,card_id',
    })
    .then(({ error }) => {
      if (error) console.error('Error saving rating:', error)
    })
    .catch((error) => console.error('Error saving rating:', error))
}

function withTimeout(promise, timeoutMs) {
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Session progress request timed out')), timeoutMs)
    }),
  ])
}

function getLocalProgressMap(userId, eventId) {
  if (typeof window === 'undefined') return {}

  try {
    return JSON.parse(window.localStorage.getItem(getProgressKey(userId, eventId)) || '{}')
  } catch {
    return {}
  }
}

function saveLocalProgressMap(userId, eventId, progressMap) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(getProgressKey(userId, eventId), JSON.stringify(progressMap))
}

function getProgressKey(userId, eventId) {
  return `hosa-plus-card-progress:${userId}:${eventId}`
}

function getNewerProgress(localProgress, remoteProgress) {
  if (!localProgress) return remoteProgress
  if (!remoteProgress) return localProgress

  const localDate = new Date(localProgress.updated_at || localProgress.last_seen || 0).getTime()
  const remoteDate = new Date(remoteProgress.updated_at || remoteProgress.last_seen || 0).getTime()
  return remoteDate > localDate ? remoteProgress : localProgress
}

export function getStudyUserId() {
  if (typeof window === 'undefined') return 'local-study-user'

  const existingId = window.localStorage.getItem('hosa-plus-study-user-id')
  if (existingId) return existingId

  const newId = typeof crypto?.randomUUID === 'function' ? `local-${crypto.randomUUID()}` : `local-${Date.now()}`
  window.localStorage.setItem('hosa-plus-study-user-id', newId)
  return newId
}

