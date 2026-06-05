import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import FlashcardDeck from '../components/study/FlashcardDeck.jsx'
import { SQT1_EVENTS } from '../data/events.js'
import { getTopicLabel, getTopicSummaries, loadStudyDeck } from '../data/studyContent.js'
import { getTodaysSession, saveCardRating } from '../lib/sessionCalculator.js'

const tabs = ['Smart Study', 'Weak Drill', 'Topic Practice', 'Cram Mode', 'Quiz', 'Progress']

function StudyEvent() {
  const { eventId } = useParams()
  const [activeTab, setActiveTab] = useState('Smart Study')
  const [selectedTopic, setSelectedTopic] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [session, setSession] = useState(null)
  const [cards, setCards] = useState([])
  const [quizQuestions, setQuizQuestions] = useState([])

  const event = SQT1_EVENTS.find((item) => item.id === eventId)
  const userId = useMemo(() => getStudyUserId(), [])
  const topicSummaries = useMemo(() => getTopicSummaries(cards), [cards])
  const activeTopic = selectedTopic || topicSummaries[0]?.topic || ''

  const sessionCards = useMemo(() => {
    if (!session) return []
    return [...session.reviewAgain, ...session.dueToday, ...session.newCards]
  }, [session])

  const weakCards = session?.reviewAgain || []
  const topicCards = cards.filter((card) => card.topic === activeTopic)
  const hardCards = cards.filter((card) => card.difficulty === 'hard')
  const progressRows = buildProgressRows(cards, session)
  const weakestTopic = progressRows[0]
  const readiness = getReadiness(progressRows, sessionCards.length)

  useEffect(() => {
    let isMounted = true

    async function loadEventStudyData() {
      setIsLoading(true)

      const { flashcards, quizQuestions } = await loadStudyDeck(eventId)
      const todaysSession = await getTodaysSession(userId, eventId, flashcards)

      if (isMounted) {
        setCards(flashcards)
        setQuizQuestions(quizQuestions)
        setSession(todaysSession)
        setSelectedTopic(getTopicSummaries(flashcards)[0]?.topic || '')
        setIsLoading(false)
      }
    }

    loadEventStudyData()

    return () => {
      isMounted = false
    }
  }, [eventId, userId])

  if (isLoading) return <LoadingSpinner />

  if (!event) {
    return (
      <section className="card">
        <h1 className="text-2xl font-semibold text-[#0d1a24]">Event not found</h1>
        <p className="mt-2 text-sm text-[#3a5267]">Choose a valid HOSA SQT event to study.</p>
        <Link className="btn btn-p" to="/study">Back to Study Suite</Link>
      </section>
    )
  }

  return (
    <div id="v-study" className="view active event-prep">
      <section className="event-coach-panel">
        <div>
          <div className="ph-eye">EVENT PREP</div>
          <h1>{event.name}</h1>
          <p>{getCoachSentence(weakestTopic, sessionCards.length)}</p>
          <div className="prep-actions">
            <button type="button" className="btn btn-p" onClick={() => setActiveTab('Smart Study')}>Start Smart Study</button>
            <button type="button" className="btn btn-o" onClick={() => setActiveTab('Topic Practice')}>Drill Weak Topic</button>
            <Link className="btn btn-b" to="/study">All Events</Link>
          </div>
        </div>
        <div className="readiness-dial compact">
          <span>{readiness}%</span>
          <strong>{getReadinessLabel(readiness)}</strong>
          <p>Event readiness</p>
        </div>
      </section>

      <div className="coach-grid">
        <CoachTile label="Review Again" value={session.reviewAgain.length} copy="Highest priority until passed." tone="maroon" />
        <CoachTile label="Due Today" value={session.dueToday.length} copy="Scheduled by spaced repetition." tone="navy" />
        <CoachTile label="New Cards" value={session.newCards.length} copy="Capped to prevent overload." tone="green" />
        <CoachTile label="Weakest Topic" value={weakestTopic ? getTopicLabel(weakestTopic.topic) : 'None'} copy="Use Topic Practice after Smart Study." tone="neutral" />
      </div>

      <div className="session-stage-strip">
        <Stage label="Warmup" active={activeTab === 'Smart Study'} />
        <Stage label="Weak Drill" active={weakCards.length > 0} />
        <Stage label="Core Review" active={session.dueToday.length > 0} />
        <Stage label="New Learning" active={session.newCards.length > 0} />
        <Stage label="Exit Check" active={activeTab === 'Quiz'} />
      </div>

      <div className="deck-tabs prep-tabs">
        {tabs.map((tab) => (
          <TabButton key={tab} active={activeTab === tab} onClick={() => setActiveTab(tab)}>
            {tab}
          </TabButton>
        ))}
      </div>

      {activeTab === 'Smart Study' && (
        <FlashcardDeck
          key={`${eventId}-smart-${sessionCards.map((card) => card.id).join('-')}`}
          cards={sessionCards}
          eventId={eventId}
          userId={userId}
          sessionLabel="Smart Study"
          emptyCopy="No cards are due right now. Use Cram Mode or Topic Practice if you still want reps."
        />
      )}

      {activeTab === 'Weak Drill' && (
        <FlashcardDeck
          key={`${eventId}-weak-${weakCards.length ? 'weak' : 'hard'}-${weakCards.length || hardCards.length}`}
          cards={weakCards.length ? weakCards : hardCards.slice(0, 10)}
          eventId={eventId}
          userId={userId}
          sessionLabel={weakCards.length ? 'Weak Drill' : 'Hard Card Drill'}
          emptyCopy="No weak cards yet. Missed cards will collect here after you rate them Review Again."
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
        <section>
          <div className="cram-header">
            <div>
              <div className="mini-label">Rapid Review</div>
              <h2>Cram Mode</h2>
              <p>No schedule changes. Fast recognition reps for the night before competition.</p>
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
        </section>
      )}

      {activeTab === 'Quiz' && (
        <QuizEngine questions={quizQuestions} cards={cards} eventId={eventId} userId={userId} onOpenWeakDrill={() => setActiveTab('Weak Drill')} />
      )}

      {activeTab === 'Progress' && (
        <ProgressPanel cards={cards} session={session} sessionCards={sessionCards} progressRows={progressRows} weakestTopic={weakestTopic} />
      )}
    </div>
  )
}

function TopicPractice({ activeTopic, eventId, userId, topicCards, topicSummaries, progressRows, onSelectTopic }) {
  const activeProgress = progressRows.find((row) => row.topic === activeTopic)
  const trapCards = topicCards.filter((card) => card.difficulty === 'hard').slice(0, 3)

  return (
    <section className="study-layout">
      <div>
        <div className="topic-dashboard">
          <div>
            <div className="mini-label">Topic Practice</div>
            <h2>{getTopicLabel(activeTopic)}</h2>
            <p>{activeProgress?.readyPercent || 0}% ready - {topicCards.length} cards - {trapCards.length || 1} likely trap areas</p>
          </div>
          <div className="topic-chip-row topic-picker">
            {topicSummaries.map((topic) => (
              <button
                type="button"
                key={topic.topic}
                onClick={() => onSelectTopic(topic.topic)}
                className={`topic-chip ${activeTopic === topic.topic ? 'active' : ''}`}
              >
                {getTopicLabel(topic.topic)} - {topic.count}
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
          emptyCopy="This topic does not have cards yet."
        />
      </div>
      <aside className="card">
        <div className="card-hd"><div className="card-title">Common Traps</div><span className="ctag">Coach</span></div>
        {(trapCards.length ? trapCards : topicCards.slice(0, 3)).map((card) => (
          <div className="trap-row" key={card.id}>
            <strong>{card.term}</strong>
            <p>{card.competitionNote}</p>
          </div>
        ))}
      </aside>
    </section>
  )
}

function ProgressPanel({ cards, session, sessionCards, progressRows, weakestTopic }) {
  return (
    <section className="study-layout">
      <div className="card">
        <div className="card-hd">
          <div className="card-title">Readiness Intelligence</div>
          <span className="ctag">{cards.length} cards</span>
        </div>
        <div className="metric-stack">
          {progressRows.map((row) => (
            <div key={row.topic}>
              <div className="metric-row-top">
                <span>{getTopicLabel(row.topic)}</span>
                <span>{getReadinessLabel(row.readyPercent)} - {row.readyPercent}%</span>
              </div>
              <div className="metric-track">
                <div className={`metric-fill ${row.readyPercent < 45 ? 'critical' : row.readyPercent < 70 ? 'warn' : 'healthy'}`} style={{ width: `${row.readyPercent}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
      <aside className="card">
        <div className="card-hd"><div className="card-title">What To Do Next</div><span className="ctag maroon">Action</span></div>
        <div className="next-step-list">
          <NextStep title="1. Run Smart Study" copy={`${sessionCards.length} cards are in today's training block.`} />
          <NextStep title="2. Drill weak topic" copy={weakestTopic ? `${getTopicLabel(weakestTopic.topic)} is the lowest readiness area.` : 'No weak topic detected yet.'} />
          <NextStep title="3. Exit quiz" copy="Use missed questions to feed the weak queue." />
        </div>
        <div className="divider-soft" />
        <QueueRow label="Weak Queue" value={session.reviewAgain.length} tone="maroon" />
        <QueueRow label="Daily Load" value={sessionCards.length} tone="navy" />
        <QueueRow label="Cram Pool" value={cards.length} tone="green" />
      </aside>
    </section>
  )
}

function QuizEngine({ questions, cards, eventId, userId, onOpenWeakDrill }) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedIndex, setSelectedIndex] = useState(null)
  const [score, setScore] = useState({ correct: 0, answered: 0, missed: 0 })

  const currentQuestion = questions[currentIndex]
  const relatedCard = cards.find((card) => card.id === currentQuestion?.relatedCardId)

  if (questions.length === 0) {
    return (
      <section className="card empty-state">
        <p>Quiz content coming soon.</p>
      </section>
    )
  }

  function chooseAnswer(optionIndex) {
    if (selectedIndex !== null) return
    const isCorrect = optionIndex === currentQuestion.answerIndex
    setSelectedIndex(optionIndex)
    setScore((current) => ({
      correct: current.correct + (isCorrect ? 1 : 0),
      answered: current.answered + 1,
      missed: current.missed + (isCorrect ? 0 : 1),
    }))

    if (!isCorrect && currentQuestion.relatedCardId) {
      saveCardRating(userId, currentQuestion.relatedCardId, eventId, 'review-again', 0)
    }
  }

  function goNext() {
    setCurrentIndex((currentIndex + 1) % questions.length)
    setSelectedIndex(null)
  }

  return (
    <section className="quiz-card">
      <div className="quiz-topline">
        <span>Question {currentIndex + 1} / {questions.length}</span>
        <strong>Score {score.correct} / {score.answered}</strong>
      </div>

      <h2>{currentQuestion.question}</h2>

      <div className="space-y-2">
        {currentQuestion.options.map((option, index) => {
          const isCorrect = index === currentQuestion.answerIndex
          const isSelected = index === selectedIndex
          const showCorrect = selectedIndex !== null && isCorrect
          const showWrong = selectedIndex !== null && isSelected && !isCorrect

          return (
            <button
              key={option}
              type="button"
              onClick={() => chooseAnswer(index)}
              disabled={selectedIndex !== null}
              className={`quiz-choice ${showCorrect ? 'correct' : showWrong ? 'wrong' : ''}`}
            >
              <span>{index + 1}</span>
              {option}
            </button>
          )
        })}
      </div>

      {selectedIndex !== null && (
        <div className="quiz-explanation">
          <strong>{selectedIndex === currentQuestion.answerIndex ? 'Confirmed' : 'Added to weak drill'}</strong>
          <p>{currentQuestion.explanation}</p>
          {relatedCard && <p>Related card: {relatedCard.term} - {getTopicLabel(relatedCard.topic)}</p>}
        </div>
      )}

      <div className="fc-actions">
        <button type="button" onClick={goNext} disabled={selectedIndex === null} className="btn btn-p">Next question</button>
        {score.missed > 0 && <button type="button" onClick={onOpenWeakDrill} className="btn btn-o">Review Missed</button>}
      </div>
    </section>
  )
}

function getStudyUserId() {
  if (typeof window === 'undefined') return 'local-study-user'

  const existingId = window.localStorage.getItem('hosa-plus-study-user-id')
  if (existingId) return existingId

  const newId = typeof crypto?.randomUUID === 'function' ? `local-${crypto.randomUUID()}` : `local-${Date.now()}`
  window.localStorage.setItem('hosa-plus-study-user-id', newId)
  return newId
}

function buildProgressRows(cards, session) {
  const dueIds = new Set([
    ...(session?.reviewAgain || []).map((card) => card.id),
    ...(session?.dueToday || []).map((card) => card.id),
    ...(session?.newCards || []).map((card) => card.id),
  ])

  return getTopicSummaries(cards).map((topic) => {
    const topicCards = cards.filter((card) => card.topic === topic.topic)
    const dueCount = topicCards.filter((card) => dueIds.has(card.id)).length
    const readyPercent = topicCards.length ? Math.round(((topicCards.length - dueCount) / topicCards.length) * 100) : 0
    return { ...topic, dueCount, readyPercent }
  }).sort((a, b) => a.readyPercent - b.readyPercent)
}

function getReadiness(progressRows, dailyLoad) {
  if (progressRows.length === 0) return 0
  const average = progressRows.reduce((total, row) => total + row.readyPercent, 0) / progressRows.length
  return Math.max(12, Math.round(average - Math.min(18, dailyLoad)))
}

function getCoachSentence(weakestTopic, dailyLoad) {
  if (!weakestTopic) return 'Build your first session, then the coach view will start prioritizing weak areas.'
  return `${getTopicLabel(weakestTopic.topic)} is your pressure point. Clear ${dailyLoad} daily cards, then drill that topic.`
}

function getReadinessLabel(score) {
  if (score >= 80) return 'Competition Ready'
  if (score >= 60) return 'Improving'
  return 'Needs Work'
}

function LoadingSpinner() {
  return (
    <div className="flex min-h-80 items-center justify-center">
      <div
        className="size-10 animate-spin rounded-full border-4 border-slate-200 border-t-transparent"
        style={{ borderTopColor: 'var(--navy)' }}
      />
    </div>
  )
}

function TabButton({ active, onClick, children }) {
  return (
    <button type="button" onClick={onClick} className={`deck-tab ${active ? 'active' : ''}`}>
      {children}
    </button>
  )
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

function Stage({ label, active }) {
  return <span className={active ? 'active' : ''}>{label}</span>
}

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

export default StudyEvent
