import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { getTopicLabel, loadStudyDeckSummaries } from '../data/studyContent.js'

function Study() {
  const [decks, setDecks] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    async function loadDecks() {
      const deckSummaries = await loadStudyDeckSummaries()
      if (isMounted) {
        setDecks(deckSummaries)
        setIsLoading(false)
      }
    }

    loadDecks()

    return () => {
      isMounted = false
    }
  }, [])

  const readyDecks = decks.filter((deck) => deck.ready)
  const featuredDeck = readyDecks.find((deck) => deck.id === 'medical-terminology') || readyDecks[0]
  const totalCards = decks.reduce((total, deck) => total + deck.cardCount, 0)
  const totalQuizzes = decks.reduce((total, deck) => total + deck.quizCount, 0)
  const readiness = getReadinessScore(featuredDeck)
  const primaryTopics = useMemo(() => buildTopicPreview(featuredDeck), [featuredDeck])

  return (
    <div id="v-studysuite" className="view active study-command">
      <section className="prep-hero">
        <div>
          <div className="ph-eye">SQT PREP</div>
          <h1>{featuredDeck ? featuredDeck.name : 'Study Suite'}</h1>
          <p>
            Today&apos;s training block is built around weak cards, due review, new learning, and a short exit check.
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
        <CoachTile label="Today" value="18 cards" copy="Weak first, due reviews next, then new material." tone="navy" />
        <CoachTile label="Weak Focus" value={primaryTopics[0] ? getTopicLabel(primaryTopics[0]) : 'Core Terms'} copy="Start here before free practice." tone="maroon" />
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
              <RoadmapStep label="Warmup" count="3" copy="Easy due cards to wake up recall." />
              <RoadmapStep label="Weak Drill" count="All" copy="Review Again cards stay first." />
              <RoadmapStep label="Core Review" count="Due" copy="Spaced repetition cards only." />
              <RoadmapStep label="New Learning" count="10" copy="Small controlled dose." />
              <RoadmapStep label="Exit Check" count="3" copy="Quiz questions to confirm transfer." />
            </div>
          </section>

          <section className="card" style={{ marginTop: 14 }}>
            <div className="card-hd">
              <div className="card-title">Event Library</div>
              <span className="ctag">{isLoading ? 'Loading' : `${decks.length} SQT events`}</span>
            </div>
            <div className="deck-grid prep-deck-grid">
              {decks.map((event) => (
                <Link className="deck-card prep-deck-card" key={event.id} to={`/study/${event.id}`}>
                  <div className="deck-card-top">
                    <span className="deck-icon">▧</span>
                    <span className="ctag">{event.ready ? 'Ready' : 'Starter'}</span>
                  </div>
                  <div className="deck-name">{event.name}</div>
                  <div className="deck-meta">
                    {event.cardCount} cards - {event.topicCount} topics - {event.quizCount} quiz items
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
