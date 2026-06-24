import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import FlashcardDeck from '../components/study/FlashcardDeck.jsx'
import { SQT1_EVENTS } from '../data/events.js'
import { getTopicLabel, getTopicSummaries, loadStudyDeck } from '../data/studyContent.js'
import { getTodaysSession, saveCardRating, getStudyUserId } from '../lib/sessionCalculator.js'
import { useAuth } from '../contexts/AuthContext.jsx'
import { saveUserDataToAccount, loadUserDataFromAccount } from '../lib/userDataSync.js'

const TABS = ['Smart Study', 'Weak Drill', 'Topic Practice', 'Cram Mode', 'Quiz', 'Progress', 'Manage Cards']

export default function StudyEvent() {
  const { eventId } = useParams()
  const [activeTab, setActiveTab] = useState('Smart Study')
  const [selectedTopic, setSelectedTopic] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [session, setSession] = useState(null)
  const [cards, setCards] = useState([])
  const [quizQuestions, setQuizQuestions] = useState([])

  const event = SQT1_EVENTS.find(e => e.id === eventId)
  const userId = useMemo(() => getStudyUserId(), [])
  const topicSummaries = useMemo(() => getTopicSummaries(cards), [cards])
  const activeTopic = selectedTopic || topicSummaries[0]?.topic || ''

  const sessionCards = useMemo(() => {
    if (!session) return []
    return [
      ...session.dueToday.slice(0, 3).map(c => ({ ...c, sessionStage: 'Warmup' })),
      ...session.reviewAgain.map(c => ({ ...c, sessionStage: 'Weak Drill' })),
      ...session.dueToday.slice(3).map(c => ({ ...c, sessionStage: 'Core Review' })),
      ...session.newCards.map(c => ({ ...c, sessionStage: 'New Learning' })),
    ]
  }, [session])

  const weakCards    = session?.reviewAgain || []
  const topicCards   = cards.filter(c => c.topic === activeTopic)
  const hardCards    = cards.filter(c => c.difficulty === 'hard')
  const progressRows = buildProgressRows(cards, session)
  const weakestTopic = progressRows[0]
  const readiness    = getReadiness(progressRows, sessionCards.length)

  const reloadDeck = async () => {
    const { flashcards, quizQuestions: qs } = await loadStudyDeck(eventId)
    const todaysSession = await getTodaysSession(userId, eventId, flashcards)
    setCards(flashcards)
    setQuizQuestions(qs)
    setSession(todaysSession)
    const summaries = getTopicSummaries(flashcards)
    if (summaries.length > 0) {
      if (!selectedTopic || !summaries.some(s => s.topic === selectedTopic)) {
        setSelectedTopic(summaries[0].topic)
      }
    } else {
      setSelectedTopic('')
    }
  }

  useEffect(() => {
    let alive = true
    async function load() {
      setIsLoading(true)
      if (typeof window !== 'undefined')
        localStorage.setItem('hosa-plus-active-event-id', eventId)
      const { flashcards, quizQuestions: qs } = await loadStudyDeck(eventId)
      const todaysSession = await getTodaysSession(userId, eventId, flashcards)
      if (alive) {
        setCards(flashcards)
        setQuizQuestions(qs)
        setSession(todaysSession)
        setSelectedTopic(getTopicSummaries(flashcards)[0]?.topic || '')
        setIsLoading(false)
      }
    }
    load()
    return () => { alive = false }
  }, [eventId, userId])

  // Sync profile data from Supabase in the background when user logs in/changes
  const { user } = useAuth()
  useEffect(() => {
    if (user?.id) {
      loadUserDataFromAccount(user.id).then(userData => {
        if (userData?.customFlashcards) {
          reloadDeck()
        }
      })
    }
  }, [user?.id, eventId])

  if (isLoading) return <LoadingSpinner />

  if (!event) {
    return (
      <div className="card" style={{ maxWidth: 480, margin: '40px auto', textAlign: 'center' }}>
        <h2 style={{ color: 'var(--t1)', marginBottom: 10 }}>Event not found</h2>
        <p style={{ color: 'var(--t2)', marginBottom: 20 }}>Choose a valid HOSA SQT event to study.</p>
        <Link className="btn btn-p" to="/study">Back to Study Suite</Link>
      </div>
    )
  }

  return (
    <div id="v-study" className="view active event-prep">

      {/* -- Hero panel -- */}
      <section className="event-hero">
        <div className="event-hero-left">
          <p className="ph-eye">Event Prep</p>
          <h1 className="event-hero-title">{event.name}</h1>
          <p className="event-hero-sub">{getCoachSentence(weakestTopic, sessionCards.length)}</p>
          <div className="event-hero-actions">
            <button className="btn btn-p" onClick={() => setActiveTab('Smart Study')}>
              Start Smart Study
            </button>
            <button className="btn btn-o" onClick={() => setActiveTab('Topic Practice')}>
              Drill Weak Topic
            </button>
            <Link className="btn btn-b" to="/study">All Events</Link>
          </div>
        </div>
        <div className="event-readiness-dial">
          <span className="dial-value">{readiness}%</span>
          <strong className="dial-label">{getReadinessLabel(readiness)}</strong>
          <p className="dial-sub">Event readiness</p>
        </div>
      </section>

      {/* -- Stats grid -- */}
      <div className="event-stats-grid">
        <StatCard
          label="Review Again"
          value={session.reviewAgain.length}
          sub="Highest priority"
          tone="maroon"
        />
        <StatCard
          label="Due Today"
          value={session.dueToday.length}
          sub="Spaced repetition"
          tone="navy"
        />
        <StatCard
          label="New Cards"
          value={session.newCards.length}
          sub="Capped load"
          tone="green"
        />
        <StatCard
          label="Weakest Topic"
          value={weakestTopic ? getTopicLabel(weakestTopic.topic) : 'None yet'}
          sub="Drill after Smart Study"
          tone="neutral"
          small
        />
      </div>

      {/* -- Tab bar -- */}
      <div className="event-tab-bar">
        {TABS.map(tab => (
          <button
            key={tab}
            type="button"
            className={`event-tab${activeTab === tab ? ' active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* -- Tab content -- */}
      <div className="event-tab-content">
        {activeTab === 'Smart Study' && (
          <>
            <SessionBlueprint session={session} quizCount={quizQuestions.length} />
            <FlashcardDeck
              key={`${eventId}-smart-${sessionCards.map(c => c.id).join('-')}`}
              cards={sessionCards}
              eventId={eventId}
              userId={userId}
              sessionLabel="Smart Study"
              emptyCopy="No cards due right now. Use Cram Mode or Topic Practice for extra reps."
              onGoToQuiz={() => setActiveTab('Quiz')}
            />
          </>
        )}

        {activeTab === 'Weak Drill' && (
          <FlashcardDeck
            key={`${eventId}-weak-${weakCards.length || hardCards.length}`}
            cards={weakCards.length ? weakCards : hardCards.slice(0, 10)}
            eventId={eventId}
            userId={userId}
            sessionLabel={weakCards.length ? 'Weak Drill' : 'Hard Card Drill'}
            emptyCopy="No weak cards yet - missed cards collect here after you rate them Review Again."
          />
        )}

        {activeTab === 'Topic Practice' && (
          <TopicPractice
            activeTopic={activeTopic}
            eventId={eventId}
            userId={userId}
            topicCards={topicCards}
            topicSummaries={topicSummaries}
            progressRows={progressRows}
            onSelectTopic={setSelectedTopic}
          />
        )}

        {activeTab === 'Cram Mode' && (
          <div>
            <div className="cram-header">
              <div>
                <p className="mini-label">Rapid Review</p>
                <h2>Cram Mode</h2>
                <p style={{ color: 'var(--t2)', fontSize: 13, marginTop: 4 }}>
                  No schedule changes - fast recognition reps for the night before competition.
                </p>
              </div>
              <span className="ctag maroon">{cards.length} card pool</span>
            </div>
            <FlashcardDeck
              key={`${eventId}-cram`}
              cards={cards}
              eventId={eventId}
              userId={userId}
              sessionLabel="Cram Mode"
              isCram
              emptyCopy="This event deck is coming soon."
            />
          </div>
        )}

        {activeTab === 'Quiz' && (
          <QuizEngine
            questions={quizQuestions}
            cards={cards}
            eventId={eventId}
            userId={userId}
            onOpenWeakDrill={() => setActiveTab('Weak Drill')}
          />
        )}

        {activeTab === 'Progress' && (
          <ProgressPanel
            cards={cards}
            session={session}
            sessionCards={sessionCards}
            progressRows={progressRows}
            weakestTopic={weakestTopic}
          />
        )}

        {activeTab === 'Manage Cards' && (
          <ManageCardsPanel
            eventId={eventId}
            cards={cards}
            onReload={reloadDeck}
          />
        )}
      </div>
    </div>
  )
}

/* -----------------------------------------
   Sub-panels
----------------------------------------- */

function StatCard({ label, value, sub, tone, small }) {
  return (
    <div className={`event-stat-card tone-bg-${tone}`}>
      <p className="event-stat-label">{label}</p>
      <strong className={`event-stat-value${small ? ' small' : ''}`}>{value}</strong>
      <p className="event-stat-sub">{sub}</p>
    </div>
  )
}

function SessionBlueprint({ session, quizCount }) {
  const phases = [
    { label: 'Warmup', value: Math.min(3, session.dueToday.length), copy: 'Low-friction recall to get moving.' },
    { label: 'Weak Drill', value: session.reviewAgain.length, copy: 'Missed cards stay front-loaded.' },
    { label: 'Core Review', value: Math.max(0, session.dueToday.length - 3), copy: 'Only cards due by schedule.' },
    { label: 'New Learning', value: session.newCards.length, copy: 'Capped so it stays learnable.' },
    { label: 'Exit Check', value: Math.min(3, quizCount), copy: 'Transfer recall into test format.' },
  ]

  return (
    <div className="session-blueprint">
      <div>
        <p className="mini-label">Today&apos;s Method</p>
        <h2>Guided Prep Block</h2>
      </div>
      <div className="blueprint-steps">
        {phases.map((phase) => (
          <div className="blueprint-step" key={phase.label}>
            <span>{phase.value}</span>
            <strong>{phase.label}</strong>
            <p>{phase.copy}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function TopicPractice({ activeTopic, eventId, userId, topicCards, topicSummaries, progressRows, onSelectTopic }) {
  const activeProgress = progressRows.find(r => r.topic === activeTopic)
  const trapCards = topicCards.filter(c => c.difficulty === 'hard').slice(0, 3)

  return (
    <div className="fc-deck-layout">
      <div>
        <div className="topic-header">
          <div>
            <p className="mini-label">Topic Practice</p>
            <h2>{getTopicLabel(activeTopic)}</h2>
            <p className="event-hero-sub">
              {activeProgress?.readyPercent || 0}% ready · {topicCards.length} cards
            </p>
          </div>
          <div className="topic-chip-row">
            {topicSummaries.map(t => (
              <button
                key={t.topic}
                type="button"
                className={`topic-chip${activeTopic === t.topic ? ' active' : ''}`}
                onClick={() => onSelectTopic(t.topic)}
              >
                {getTopicLabel(t.topic)} ({t.count})
              </button>
            ))}
          </div>
        </div>
        <FlashcardDeck
          key={`${eventId}-topic-${activeTopic}`}
          cards={topicCards}
          eventId={eventId}
          userId={userId}
          sessionLabel={`${getTopicLabel(activeTopic)} Practice`}
          emptyCopy="This topic doesn't have cards yet."
        />
      </div>
      <aside className="card" style={{ alignSelf: 'start' }}>
        <div className="card-hd">
          <div className="card-title">Common Traps</div>
          <span className="ctag">Coach</span>
        </div>
        {(trapCards.length ? trapCards : topicCards.slice(0, 3)).map(card => (
          <div className="trap-row" key={card.id}>
            <strong>{card.term}</strong>
            <p>{card.competitionNote}</p>
          </div>
        ))}
      </aside>
    </div>
  )
}

function ProgressPanel({ cards, session, sessionCards, progressRows, weakestTopic }) {
  return (
    <div className="fc-deck-layout">
      <div className="card">
        <div className="card-hd">
          <div className="card-title">Readiness Intelligence</div>
          <span className="ctag">{cards.length} cards</span>
        </div>
        <div className="metric-stack">
          {progressRows.map(row => (
            <div key={row.topic}>
              <div className="metric-row-top">
                <span>{getTopicLabel(row.topic)}</span>
                <span>{getReadinessLabel(row.readyPercent)} - {row.readyPercent}%</span>
              </div>
              <div className="metric-track">
                <div
                  className={`metric-fill ${row.readyPercent < 45 ? 'critical' : row.readyPercent < 70 ? 'warn' : 'healthy'}`}
                  style={{ width: `${row.readyPercent}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
      <aside className="card" style={{ alignSelf: 'start' }}>
        <div className="card-hd">
          <div className="card-title">What To Do Next</div>
          <span className="ctag maroon">Action</span>
        </div>
        <div>
          <NextStep title="1. Run Smart Study" copy={`${sessionCards.length} cards in today's block.`} />
          <NextStep title="2. Drill Weak Topic" copy={weakestTopic ? `${getTopicLabel(weakestTopic.topic)} is lowest.` : 'No weak topic yet.'} />
          <NextStep title="3. Exit Quiz" copy="Missed questions feed the weak queue." />
        </div>
        <div className="divider-soft" />
        <QueueRow label="Weak Queue" value={session.reviewAgain.length} tone="maroon" />
        <QueueRow label="Daily Load"  value={sessionCards.length}         tone="navy"   />
        <QueueRow label="Cram Pool"   value={cards.length}                tone="green"  />
      </aside>
    </div>
  )
}

function QuizEngine({ questions, cards, eventId, userId, onOpenWeakDrill }) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedIndex, setSelectedIndex] = useState(null)
  const [score, setScore] = useState({ correct: 0, answered: 0, missed: 0 })

  const q = questions[currentIndex]
  const relatedCard = cards.find(c => c.id === q?.relatedCardId)

  if (questions.length === 0) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: 40, color: 'var(--t2)' }}>
        Quiz content coming soon.
      </div>
    )
  }

  function choose(i) {
    if (selectedIndex !== null) return
    const isCorrect = i === q.answerIndex
    setSelectedIndex(i)
    setScore(s => ({ correct: s.correct + (isCorrect ? 1 : 0), answered: s.answered + 1, missed: s.missed + (isCorrect ? 0 : 1) }))
    if (!isCorrect && q.relatedCardId) saveCardRating(userId, q.relatedCardId, eventId, 'review-again', 0)
  }

  function next() { setCurrentIndex((currentIndex + 1) % questions.length); setSelectedIndex(null) }

  return (
    <div className="quiz-card">
      <div className="quiz-topline">
        <span>Question {currentIndex + 1} / {questions.length}</span>
        <strong>Score {score.correct} / {score.answered}</strong>
      </div>
      <h2>{q.question}</h2>
      <div className="choice-grid" style={{ marginTop: 16 }}>
        {q.options.map((opt, i) => {
          const showCorrect = selectedIndex !== null && i === q.answerIndex
          const showWrong   = selectedIndex !== null && i === selectedIndex && i !== q.answerIndex
          return (
            <button
              key={opt}
              type="button"
              onClick={() => choose(i)}
              disabled={selectedIndex !== null}
              className={`quiz-choice ${showCorrect ? 'correct' : showWrong ? 'wrong' : ''}`}
            >
              <span>{i + 1}</span>
              {opt}
            </button>
          )
        })}
      </div>
      {selectedIndex !== null && (
        <div className="quiz-explanation">
          <strong>{selectedIndex === q.answerIndex ? 'Confirmed ' : 'Added to Weak Drill'}</strong>
          <p>{q.explanation}</p>
          {relatedCard && <p>Related: {relatedCard.term} · {getTopicLabel(relatedCard.topic)}</p>}
        </div>
      )}
      <div className="fc-actions" style={{ marginTop: 16 }}>
        <button type="button" onClick={next} disabled={selectedIndex === null} className="btn btn-p">
          Next Question
        </button>
        {score.missed > 0 && (
          <button type="button" onClick={onOpenWeakDrill} className="btn btn-o">
            Review Missed
          </button>
        )}
      </div>
    </div>
  )
}

/* -----------------------------------------
   Micro-components
----------------------------------------- */
function NextStep({ title, copy }) {
  return (
    <div className="next-step">
      <strong>{title}</strong>
      <p>{copy}</p>
    </div>
  )
}

function QueueRow({ label, value, tone }) {
  return (
    <div className="queue-row">
      <span>{label}</span>
      <strong className={`tone-${tone}`}>{value}</strong>
    </div>
  )
}

function LoadingSpinner() {
  return (
    <div style={{ display: 'flex', minHeight: 320, alignItems: 'center', justifyContent: 'center' }}>
      <div style={{
        width: 36, height: 36, borderRadius: '50%',
        border: '3px solid var(--beige2)',
        borderTopColor: 'var(--navy)',
        animation: 'spin 0.7s linear infinite',
      }} />
    </div>
  )
}

/* -----------------------------------------
   Helpers
----------------------------------------- */
function buildProgressRows(cards, session) {
  if (!session) return []
  const dueIds = new Set([
    ...session.reviewAgain.map(c => c.id),
    ...session.dueToday.map(c => c.id),
    ...session.newCards.map(c => c.id),
  ])
  return getTopicSummaries(cards)
    .map(t => {
      const tc = cards.filter(c => c.topic === t.topic)
      const due = tc.filter(c => dueIds.has(c.id)).length
      const readyPercent = tc.length ? Math.round(((tc.length - due) / tc.length) * 100) : 0
      return { ...t, dueCount: due, readyPercent }
    })
    .sort((a, b) => a.readyPercent - b.readyPercent)
}

function getReadiness(progressRows, dailyLoad) {
  if (!progressRows.length) return 0
  const avg = progressRows.reduce((s, r) => s + r.readyPercent, 0) / progressRows.length
  return Math.max(12, Math.round(avg - Math.min(18, dailyLoad)))
}

function getCoachSentence(weakest, load) {
  if (!weakest) return 'Build your first session and the coach will start prioritising weak areas.'
  return `${getTopicLabel(weakest.topic)} is your pressure point. Clear ${load} daily cards, then drill that topic.`
}

function getReadinessLabel(score) {
  if (score >= 80) return 'Competition Ready'
  if (score >= 60) return 'Improving'
  return 'Needs Work'
}

function ManageCardsPanel({ eventId, cards, onReload }) {
  const { user } = useAuth()
  const [term, setTerm] = useState('')
  const [definition, setDefinition] = useState('')
  const [topic, setTopic] = useState('core-terms')
  const [customTopic, setCustomTopic] = useState('')
  const [difficulty, setDifficulty] = useState('medium')
  const [search, setSearch] = useState('')

  const syncAllCardsToAccount = (updatedEventCards) => {
    if (!user?.id) return

    // Build the full map of eventId -> cards from localStorage
    const fullMap = {}
    SQT1_EVENTS.forEach(e => {
      const saved = localStorage.getItem(`hosa-plus-custom-flashcards:${e.id}`)
      if (saved) {
        try {
          fullMap[e.id] = JSON.parse(saved)
        } catch (err) {
          console.error(err)
        }
      }
    })

    // Override with current updates
    fullMap[eventId] = updatedEventCards

    // Save map to Supabase
    saveUserDataToAccount(user.id, undefined, fullMap)
  }

  const handleAdd = (e) => {
    e.preventDefault()
    if (!term.trim() || !definition.trim()) return

    const selectedTopic = topic === 'custom' ? (customTopic.trim() || 'core-terms') : topic
    const cleanTopic = selectedTopic.toLowerCase().replace(/\s+/g, '-')

    const newCard = {
      id: `custom-card-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      term: term.trim(),
      definition: definition.trim(),
      topic: cleanTopic,
      difficulty,
      eventId
    }

    const saved = localStorage.getItem(`hosa-plus-custom-flashcards:${eventId}`)
    let existing = []
    if (saved) {
      try {
        existing = JSON.parse(saved)
      } catch (e) {
        console.error(e)
      }
    }

    const updated = [...existing, newCard]
    localStorage.setItem(`hosa-plus-custom-flashcards:${eventId}`, JSON.stringify(updated))
    
    // Sync to Supabase in the background
    syncAllCardsToAccount(updated)

    onReload()

    // Reset inputs
    setTerm('')
    setDefinition('')
    setCustomTopic('')
  }

  const handleDelete = (id) => {
    const updated = cards.filter(c => c.id !== id)
    localStorage.setItem(`hosa-plus-custom-flashcards:${eventId}`, JSON.stringify(updated))
    
    // Sync to Supabase in the background
    syncAllCardsToAccount(updated)

    onReload()
  }

  const filteredCards = cards.filter(c => 
    c.term.toLowerCase().includes(search.toLowerCase()) || 
    c.definition.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="fc-deck-layout">
      <div className="card">
        <div className="card-hd">
          <div className="card-title">Add Custom Flashcard</div>
          <span className="ctag green">Create</span>
        </div>
        <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 12 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 'bold', marginBottom: 4, color: 'var(--t1)' }}>Term</label>
            <input
              type="text"
              placeholder="e.g. Myocardial Infarction"
              value={term}
              onChange={e => setTerm(e.target.value)}
              required
              style={{ width: '100%', padding: '8px 12px', border: '1px solid #dde5f5', borderRadius: 6, fontSize: 13, background: 'var(--bg)', color: 'var(--t1)' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 'bold', marginBottom: 4, color: 'var(--t1)' }}>Definition</label>
            <textarea
              placeholder="e.g. Obstruction of blood flow to the heart muscle, causing tissue necrosis..."
              value={definition}
              onChange={e => setDefinition(e.target.value)}
              required
              rows={3}
              style={{ width: '100%', padding: '8px 12px', border: '1px solid #dde5f5', borderRadius: 6, fontSize: 13, fontFamily: 'inherit', background: 'var(--bg)', color: 'var(--t1)' }}
            />
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 'bold', marginBottom: 4, color: 'var(--t1)' }}>Topic</label>
              <select
                value={topic}
                onChange={e => setTopic(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #dde5f5', borderRadius: 6, fontSize: 13, background: 'var(--bg)', color: 'var(--t1)' }}
              >
                <option value="core-terms">Core Terms</option>
                <option value="cardiovascular">Cardiovascular</option>
                <option value="respiratory">Respiratory</option>
                <option value="pharmacology">Pharmacology</option>
                <option value="pathology">Pathology</option>
                <option value="custom">-- Custom Topic --</option>
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 'bold', marginBottom: 4, color: 'var(--t1)' }}>Difficulty</label>
              <select
                value={difficulty}
                onChange={e => setDifficulty(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #dde5f5', borderRadius: 6, fontSize: 13, background: 'var(--bg)', color: 'var(--t1)' }}
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
          </div>
          {topic === 'custom' && (
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 'bold', marginBottom: 4, color: 'var(--t1)' }}>Custom Topic Name</label>
              <input
                type="text"
                placeholder="e.g. Neurology"
                value={customTopic}
                onChange={e => setCustomTopic(e.target.value)}
                required
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #dde5f5', borderRadius: 6, fontSize: 13, background: 'var(--bg)', color: 'var(--t1)' }}
              />
            </div>
          )}
          <button type="submit" className="btn btn-p" style={{ marginTop: 6, width: '100%' }}>
            Add Flashcard
          </button>
        </form>
      </div>

      <aside className="card" style={{ flex: 1, minWidth: 280 }}>
        <div className="card-hd">
          <div className="card-title">Existing Flashcards</div>
          <span className="ctag tone-bg-navy">{cards.length} cards</span>
        </div>
        <div style={{ marginTop: 12, marginBottom: 12 }}>
          <input
            type="text"
            placeholder="Search custom cards..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ width: '100%', padding: '6px 10px', border: '1px solid #dde5f5', borderRadius: 6, fontSize: 12, background: 'var(--bg)', color: 'var(--t1)' }}
          />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 400, overflowY: 'auto', paddingRight: 4 }}>
          {filteredCards.length === 0 ? (
            <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--t2)', padding: 20 }}>
              No custom cards found. Create some on the left!
            </div>
          ) : (
            filteredCards.map(card => (
              <div key={card.id} style={{ padding: 10, background: 'var(--card-bg-sub, #f8faff)', borderRadius: 6, border: '1px solid #dde5f5', position: 'relative' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <strong style={{ fontSize: 13, color: 'var(--t1)' }}>{card.term}</strong>
                  <button 
                    onClick={() => handleDelete(card.id)} 
                    style={{ background: 'none', border: 'none', color: '#ff4d4d', cursor: 'pointer', fontSize: 14, padding: 0 }}
                    title="Delete card"
                  >
                    &times;
                  </button>
                </div>
                <p style={{ fontSize: 12, color: 'var(--t2)', marginTop: 4, lineBreak: 'anywhere' }}>{card.definition}</p>
                <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                  <span className="ctag" style={{ fontSize: 9 }}>{getTopicLabel(card.topic)}</span>
                  <span className={`ctag ${card.difficulty === 'hard' ? 'maroon' : card.difficulty === 'easy' ? 'green' : 'navy'}`} style={{ fontSize: 9 }}>{card.difficulty}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </aside>
    </div>
  )
}
