import { supabase } from './supabaseClient'

// Fetches today's study session for a user and event
// Returns cards sorted by priority: review-again first, then due today, then new
export async function getTodaysSession(userId, eventId, allCards) {

  // Get this user's progress on all cards for this event from Supabase
  const { data: progressData, error } = await supabase
    .from('card_progress')
    .select('*')
    .eq('user_id', userId)
    .eq('event_id', eventId)

  if (error) {
    console.error('Error fetching progress:', error)
    return { reviewAgain: [], dueToday: [], newCards: [] }
  }

  // Build a map of card_id -> progress for quick lookup
  const progressMap = {}
  progressData.forEach(p => {
    progressMap[p.card_id] = p
  })

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

    // Card was rated review-again — always comes back
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
    totalDue: reviewAgain.length + dueToday.length + cappedNewCards.length
  }
}

// Saves a card rating to Supabase and calculates next review date
export async function saveCardRating(userId, cardId, eventId, rating, timesSeen) {

  const intervals = {
    'got-it': [1, 4, 10, 21, 60],
    'almost': [1, 2, 4, 7],
    'review-again': [0],
  }

  const days = intervals[rating][Math.min(timesSeen, intervals[rating].length - 1)]
  const nextDate = new Date()
  nextDate.setDate(nextDate.getDate() + days)
  const nextReviewDate = nextDate.toISOString().split('T')[0]

  const { error } = await supabase
    .from('card_progress')
    .upsert({
      user_id: userId,
      card_id: cardId,
      event_id: eventId,
      rating: rating,
      next_review_date: nextReviewDate,
      times_seen: timesSeen + 1,
      times_correct: rating !== 'review-again' ? 1 : 0,
      last_seen: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'user_id,card_id',
    })

  if (error) console.error('Error saving rating:', error)
}
