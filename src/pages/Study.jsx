import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { getTopicLabel, loadStudyDeckSummaries, loadStudyDeck } from '../data/studyContent.js'
import { getTodaysSession, getStudyUserId } from '../lib/sessionCalculator.js'

function Study() {
  const [decks, setDecks] = useState([])
  const [activeEventId, setActiveEventId] = useState('')
  const [featuredSession, setFeaturedSession] = useState(null)
  const [featuredQuizQuestions, setFeaturedQuizQuestions] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    async function loadDecks() {
      const deckSummaries = await loadStudyDeckSummaries()
      if (isMounted) {
        setDecks(deckSummaries)

        const activeId = window.localStorage.getItem('hosa-plus-active-event-id') || 'medical-terminology'
        setActiveEventId(activeId)

        const readyDecks = deckSummaries.filter((deck) => deck.ready)
        const selectedDeck = readyDecks.find((deck) => deck.id === activeId) || readyDecks[0]

        if (selectedDeck) {
          const { flashcards, quizQuestions } = await loadStudyDeck(selectedDeck.id)
          const userId = getStudyUserId()
          const sessionData = await getTodaysSession(userId, selectedDeck.id, flashcards)
          if (isMounted) {
            setFeaturedQuizQuestions(quizQuestions)
            setFeaturedSession(sessionData)
          }
        }
        setIsLoading(false)
      }
    }

    loadDecks()

    return () => {
      isMounted = false
    }
  }, [])

  const handleEventChange = async (eventId) => {
    setIsLoading(true)
    setActiveEventId(eventId)
    window.localStorage.setItem('hosa-plus-active-event-id', eventId)

    const { flashcards, quizQuestions } = await loadStudyDeck(eventId)
    const userId = getStudyUserId()
    const sessionData = await getTodaysSession(userId, eventId, flashcards)

    setFeaturedQuizQuestions(quizQuestions)
    setFeaturedSession(sessionData)
    setIsLoading(false)
  }


  const readyDecks = useMemo(() => decks.filter((deck) => deck.ready), [decks])
  
  const featuredDeck = useMemo(() => {
    return readyDecks.find((deck) => deck.id === activeEventId) || readyDecks[0]
  }, [readyDecks, activeEventId])

  const totalCards = useMemo(() => decks.reduce((total, deck) => total + deck.cardCount, 0), [decks])
  const totalQuizzes = useMemo(() => decks.reduce((total, deck) => total + deck.quizCount, 0), [decks])

  const readiness = useMemo(() => {
    if (!featuredDeck) return 0
    return getReadinessScore(featuredDeck)
  }, [featuredDeck])

  const primaryTopics = useMemo(() => buildTopicPreview(featuredDeck), [featuredDeck])

  const sessionCardsCount = useMemo(() => {
    if (!featuredSession) return 0
    return featuredSession.reviewAgain.length + featuredSession.dueToday.length + featuredSession.newCards.length
  }, [featuredSession])

  return (
    <div id="v-studysuite" className="view active study-command">
      <section className="prep-hero">
        <div>
          <div className="ph-eye">SQT PREP // TARGET EVENT</div>
          <div className="event-picker-container">
            <h1 style={{ margin: 0 }}>{featuredDeck ? featuredDeck.name : 'Study Suite'}</h1>
            {readyDecks.length > 0 && (
              <select
                value={activeEventId}
                onChange={(e) => handleEventChange(e.target.value)}
                className="featured-event-select"
              >
                {readyDecks.map((deck) => (
                  <option key={deck.id} value={deck.id}>
                    Focus: {deck.name}
                  </option>
                ))}
              </select>
            )}
          </div>
          <p>
            {featuredDeck 
              ? `Today's training block for ${featuredDeck.name} features ${sessionCardsCount} cards, including ${featuredSession?.reviewAgain.length || 0} weak cards and ${featuredSession?.newCards.length || 0} new terms.`
              : "Today's training block is built around weak cards, due review, new learning, and a short exit check."}
          </p>
          <div className="prep-actions">
            <Link className="btn btn-p" to={featuredDeck ? `/study/${featuredDeck.id}` : '/study'}>
              Start Today&apos;s Session
            </Link>
            <Link className="btn btn-o" to={featuredDeck ? `/study/${featuredDeck.id}` : '/study'}>
              Open Event Dashboard
            </Link>
          </div>
        </div>
        <div className="readiness-dial">
          <span>{readiness}%</span>
          <strong>Readiness</strong>
          <p>{getReadinessLabel(readiness)}</p>
        </div>
      </section>

      <div className="coach-grid">
        <CoachTile 
          label="Today" 
          value={`${sessionCardsCount} cards`} 
          copy={featuredSession ? `${featuredSession.reviewAgain.length} weak first, then ${featuredSession.dueToday.length} spaced reviews, plus ${featuredSession.newCards.length} new.` : "Weak first, due reviews next, then new material."} 
          tone="navy" 
        />
        <CoachTile label="Weak Focus" value={primaryTopics[0] ? getTopicLabel(primaryTopics[0]) : 'Core Terms'} copy="Start here before free practice." tone="maroon" />
        <CoachTile label="Exit Check" value={`${featuredQuizQuestions.length || 0} prompts`} copy="Short quiz after study turns recall into test readiness." tone="neutral" />
        <CoachTile label="Library" value={`${readyDecks.length} events`} copy={`${totalCards} cards and ${totalQuizzes} quiz prompts loaded.`} tone="green" />
      </div>

      <div className="study-layout">
        <div>
          <section className="card">
            <div className="card-hd">
              <div className="card-title">Daily Prep Method</div>
              <span className="ctag">Guided</span>
            </div>
            <div className="session-roadmap">
              <RoadmapStep label="Warmup" count={featuredSession ? Math.min(3, featuredSession.dueToday.length) : '3'} copy="Easy due cards to wake up recall." />
              <RoadmapStep label="Weak Drill" count={featuredSession ? featuredSession.reviewAgain.length : 'All'} copy="Review Again cards stay first." />
              <RoadmapStep label="Core Review" count={featuredSession ? Math.max(0, featuredSession.dueToday.length - 3) : 'Due'} copy="Spaced repetition cards only." />
              <RoadmapStep label="New Learning" count={featuredSession ? featuredSession.newCards.length : '10'} copy="Small controlled dose." />
              <RoadmapStep label="Exit Check" count={featuredQuizQuestions.length > 0 ? Math.min(3, featuredQuizQuestions.length) : '3'} copy="Quiz questions to confirm transfer." />
            </div>
          </section>

          <section className="card" style={{ marginTop: 14 }}>
            <div className="card-hd">
              <div className="card-title">Event Library</div>
              <span className="ctag">{isLoading ? 'Loading' : `${readyDecks.length} SQT events`}</span>
            </div>
            <div className="deck-grid prep-deck-grid">
              {decks.map((event) => (
                <Link className="deck-card prep-deck-card" key={event.id} to={`/study/${event.id}`}>
                  <div className="deck-card-top">
                    <span className="deck-icon">?</span>
                    <span className="ctag">{event.ready ? 'Ready' : 'Starter'}</span>
                  </div>
                  <div className="deck-name">{event.name}</div>
                  <div className="deck-meta">
                    {event.cardCount} cards · {event.topicCount} topics · {event.quizCount} quiz items
                  </div>
                  <div className="mini-progress">
                    <span style={{ width: `${getReadinessScore(event)}%` }} />
                  </div>
                </Link>
              ))}
            </div>
          </section>
        </div>

        <aside className="card prep-aside">
          <div className="card-hd">
            <div className="card-title">Coach Recommendation</div>
            <span className="ctag maroon">Next</span>
          </div>
          {featuredDeck ? (
            <>
              <div className="featured-deck-name">{featuredDeck.name}</div>
              <p className="coach-copy">Run Smart Study first. Then drill the weakest topic and finish with a quiz check.</p>
              <div className="divider-soft" />
              <div className="mini-label">Priority topics</div>
              <div className="topic-chip-row">
                {primaryTopics.map((topic) => (
                  <span className="topic-chip" key={topic}>{getTopicLabel(topic)}</span>
                ))}
              </div>
              <Link className="btn btn-p full-btn" to={`/study/${featuredDeck.id}`}>Begin Prep Block</Link>
            </>
          ) : (
            <p className="side-copy">Decks are loading.</p>
          )}
        </aside>
      </div>
    </div>
  )
}

function buildTopicPreview(deck) {
  if (!deck?.ready) return []
  if (deck.id === 'medical-terminology') return ['cardiovascular', 'respiratory', 'pathology', 'blood-and-immune']
  return ['core-terms', 'safety', 'quality'].slice(0, Math.max(1, deck.topicCount))
}

function getReadinessScore(deck) {
  if (!deck) return 0
  return Math.min(92, Math.max(38, Math.round(deck.cardCount * 3 + deck.quizCount * 2 + deck.topicCount * 4)))
}

function getReadinessLabel(score) {
  if (score >= 80) return 'Competition Ready'
  if (score >= 60) return 'Improving'
  return 'Needs Work'
}

function CoachTile({ label, value, copy, tone }) {
  return (
    <div className={`coach-tile ${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
      <p>{copy}</p>
    </div>
  )
}

function RoadmapStep({ label, count, copy }) {
  return (
    <div className="roadmap-step">
      <span>{count}</span>
      <strong>{label}</strong>
      <p>{copy}</p>
    </div>
  )
}

export default Study
