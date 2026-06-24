import { SQT1_EVENTS } from './events.js'
import { getGeneratedStudyDeck } from './generatedStudyDecks.js'

export const cardModules = {
  'behavioral-health': () => import('./flashcards/behavioral-health.js'),
  'biomedical-equipment': () => import('./flashcards/biomedical-equipment.js'),
  'dental-terminology': () => import('./flashcards/dental-terminology.js'),
  'health-informatics': () => import('./flashcards/health-informatics.js'),
  'healthcare-administration': () => import('./flashcards/healthcare-administration.js'),
  'human-growth-development': () => import('./flashcards/human-growth-development.js'),
  'medical-law-ethics': () => import('./flashcards/medical-law-ethics.js'),
  'medical-math': () => import('./flashcards/medical-math.js'),
  'medical-reading': () => import('./flashcards/medical-reading.js'),
  'medical-spelling': () => import('./flashcards/medical-spelling.js'),
  'medical-terminology': () => import('./flashcards/medical-terminology.js'),
  nutrition: () => import('./flashcards/nutrition.js'),
  pathophysiology: () => import('./flashcards/pathophysiology.js'),
  pharmacology: () => import('./flashcards/pharmacology.js'),
  'world-health-disparities': () => import('./flashcards/world-health-disparities.js'),
}

export async function loadStudyDeck(eventId) {
  let customCards = []
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem(`hosa-plus-custom-flashcards:${eventId}`)
    if (saved) {
      try {
        customCards = JSON.parse(saved)
      } catch (e) {
        console.error('Failed to parse custom flashcards:', e)
      }
    }
  }

  const normalizedCards = normalizeCards(customCards, eventId)

  // Generate quiz questions dynamically from these custom cards
  const quizQuestions = normalizedCards.map((card) => {
    const answer = card.definition
    
    // Distractors from other custom cards
    const otherDefs = normalizedCards
      .filter(c => c.id !== card.id)
      .map(c => c.definition)
    
    // Shuffle distractors
    const shuffledDistractors = otherDefs.sort(() => 0.5 - Math.random()).slice(0, 3)
    
    // Fallback generic distractors if not enough cards
    while (shuffledDistractors.length < 3) {
      shuffledDistractors.push(`Alternative clinical interpretation definition ${shuffledDistractors.length + 1}`)
    }

    const choices = [answer, ...shuffledDistractors]
    const shuffledChoices = choices.sort(() => 0.5 - Math.random())
    const answerIndex = shuffledChoices.indexOf(answer)

    return {
      id: `quiz-${card.id}`,
      question: `What is the clinical definition of: "${card.term}"?`,
      options: shuffledChoices,
      answerIndex,
      explanation: `The definition for "${card.term}" is: "${card.definition}".`,
      relatedCardId: card.id
    }
  })

  return {
    flashcards: normalizedCards,
    quizQuestions,
  }
}

export async function loadStudyDeckSummaries() {
  const summaries = await Promise.all(
    SQT1_EVENTS.map(async (event) => {
      const { flashcards, quizQuestions } = await loadStudyDeck(event.id)
      return {
        ...event,
        cardCount: flashcards.length,
        quizCount: quizQuestions.length,
        topicCount: getTopicSummaries(flashcards).length,
        ready: flashcards.length > 0,
      }
    }),
  )

  return summaries
}

export function normalizeCards(cards, eventId) {
  return cards.map((card) => ({
    ...card,
    eventId,
    topic: card.topic || inferTopic(card),
    keywords: card.keywords || inferKeywords(card.definition),
    breakdown: card.breakdown || inferBreakdown(card.term),
    memoryHint: card.memoryHint || inferMemoryHint(card),
    competitionNote: card.competitionNote || inferCompetitionNote(card),
  }))
}

export function getTopicSummaries(cards) {
  const topicMap = new Map()

  cards.forEach((card) => {
    const topic = card.topic || inferTopic(card)
    const current = topicMap.get(topic) || { topic, count: 0, hard: 0 }
    current.count += 1
    if (card.difficulty === 'hard') current.hard += 1
    topicMap.set(topic, current)
  })

  return [...topicMap.values()].sort((a, b) => b.count - a.count)
}

export function getTopicLabel(topic) {
  return topic
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

function inferTopic(card) {
  const text = `${card.term} ${card.definition} ${card.example || ''}`.toLowerCase()

  if (matches(text, ['cardio', 'heart', 'blood vessel', 'circulation', 'ischemia', 'embolism'])) return 'cardiovascular'
  if (matches(text, ['breath', 'lung', 'pulmonary', 'oxygen', 'dyspnea', 'tachypnea'])) return 'respiratory'
  if (matches(text, ['glucose', 'diabetes', 'hormone', 'endocrine'])) return 'endocrine'
  if (matches(text, ['blood', 'hemoglobin', 'hemat', 'sepsis', 'infection'])) return 'blood-and-immune'
  if (matches(text, ['tissue', 'cell', 'organ', 'necrosis', 'atrophy', 'hypertrophy'])) return 'pathology'
  if (matches(text, ['surgical', 'procedure', 'scope', 'ectomy', 'plasty'])) return 'procedures'
  if (matches(text, ['prefix', 'root word', 'suffix'])) return 'word-parts'

  return 'core-terms'
}

function inferKeywords(definition) {
  return definition
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter((word, index, words) => word.length > 4 && words.indexOf(word) === index)
    .slice(0, 6)
}

function matches(text, needles) {
  return needles.some((needle) => text.includes(needle))
}

function inferBreakdown(term) {
  const text = term.toLowerCase()
  const parts = []

  if (text.includes('tachy')) parts.push('tachy = fast')
  if (text.includes('brady')) parts.push('brady = slow')
  if (text.includes('card')) parts.push('cardi/cardio = heart')
  if (text.includes('hemo') || text.includes('hemat')) parts.push('hemo/hemat = blood')
  if (text.includes('pneumo') || text.includes('pulmo')) parts.push('pneumo/pulmo = lung')
  if (text.includes('itis')) parts.push('-itis = inflammation')
  if (text.includes('ectomy')) parts.push('-ectomy = surgical removal')
  if (text.includes('ology')) parts.push('-ology = study of')
  if (text.includes('hyper')) parts.push('hyper- = high or excessive')
  if (text.includes('hypo')) parts.push('hypo- = low or deficient')

  return parts.length ? parts : ['Connect the term to its topic, definition keywords, and clinical example.']
}

function inferMemoryHint(card) {
  const topic = getTopicLabel(card.topic || inferTopic(card))
  const keyword = (card.keywords || inferKeywords(card.definition))[0]
  return keyword ? `Anchor this to ${topic}: listen for "${keyword}" in the definition.` : `Anchor this to ${topic} and say the definition before flipping.`
}

function inferCompetitionNote(card) {
  if (card.difficulty === 'hard') return 'High-yield: expect this to appear in close answer choices or scenario wording.'
  if (card.difficulty === 'medium') return 'Watch for similar terms. Say the exact definition before choosing an answer.'
  return 'Use this as a speed card. You should recognize it instantly under timed conditions.'
}
