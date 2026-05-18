import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import FlashcardDeck from '../components/study/FlashcardDeck.jsx'
import { SQT1_EVENTS } from '../data/events.js'
import { getTodaysSession } from '../lib/sessionCalculator.js'

const cardModules = {
  'behavioral-health': () => import('../data/flashcards/behavioral-health'),
  'biomedical-equipment': () => import('../data/flashcards/biomedical-equipment'),
  'dental-terminology': () => import('../data/flashcards/dental-terminology'),
  'health-informatics': () => import('../data/flashcards/health-informatics'),
  'healthcare-administration': () => import('../data/flashcards/healthcare-administration'),
  'human-growth-development': () => import('../data/flashcards/human-growth-development'),
  'medical-law-ethics': () => import('../data/flashcards/medical-law-ethics'),
  'medical-math': () => import('../data/flashcards/medical-math'),
  'medical-reading': () => import('../data/flashcards/medical-reading'),
  'medical-spelling': () => import('../data/flashcards/medical-spelling'),
  'medical-terminology': () => import('../data/flashcards/medical-terminology'),
  'nutrition': () => import('../data/flashcards/nutrition'),
  'pathophysiology': () => import('../data/flashcards/pathophysiology'),
  'pharmacology': () => import('../data/flashcards/pharmacology'),
  'world-health-disparities': () => import('../data/flashcards/world-health-disparities'),
}

function StudyEvent() {
  const { eventId } = useParams()
  const [activeTab, setActiveTab] = useState('flashcards')
  const [isLoading, setIsLoading] = useState(true)
  const [session, setSession] = useState(null)
  const [quizQuestions, setQuizQuestions] = useState([])

  const event = SQT1_EVENTS.find((item) => item.id === eventId)

  const sessionCards = useMemo(() => {
    if (!session) return []
    return [...session.reviewAgain, ...session.dueToday, ...session.newCards]
  }, [session])

  useEffect(() => {
    let isMounted = true

    async function loadEventStudyData() {
      setIsLoading(true)

      const loadCards = cardModules[eventId]
      if (!loadCards) {
        setSession({ reviewAgain: [], dueToday: [], newCards: [], totalDue: 0 })
        setQuizQuestions([])
        setIsLoading(false)
        return
      }

      const userId = 'placeholder-user'
      const cardData = await loadCards()
      const todaysSession = await getTodaysSession(userId, eventId, cardData.flashcards)

      if (isMounted) {
        setSession(todaysSession)
        setQuizQuestions(cardData.quizQuestions)
        setIsLoading(false)
      }
    }

    loadEventStudyData()

    return () => {
      isMounted = false
    }
  }, [eventId])

  if (isLoading) {
    return <LoadingSpinner />
  }

  if (!event) {
    return (
      <section className="rounded-[14px] border border-[rgba(9,87,134,0.11)] bg-white/75 p-6 shadow-[0_2px_12px_rgba(9,87,134,0.07)]">
        <h1 className="text-2xl font-semibold text-[#0d1a24]">Event not found</h1>
        <p className="mt-2 text-sm text-[#3a5267]">Choose a valid HOSA SQT1 event to study.</p>
      </section>
    )
  }

  return (
    <div className="space-y-5">
      {/* Page heading */}
      <header>
        <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-[#095786]">
          SQT1 Study Session
        </p>
        <h1 className="mt-1 text-3xl font-semibold tracking-[-0.02em] text-[#0d1a24]">
          {event.name}
        </h1>
        <p className="mt-2 text-sm leading-6 text-[#3a5267]">{event.category}</p>
      </header>

      {/* Session stats */}
      <div className="grid gap-3 sm:grid-cols-3">
        <StatPill
          label="Review Again"
          value={session.reviewAgain.length}
          className="border-[rgba(174,0,0,0.14)] bg-[rgba(174,0,0,0.06)] text-[#ae0000]"
        />
        <StatPill
          label="Due Today"
          value={session.dueToday.length}
          className="border-[rgba(9,87,134,0.15)] bg-[rgba(9,87,134,0.07)] text-[#095786]"
        />
        <StatPill
          label="New Cards"
          value={session.newCards.length}
          className="border-slate-200 bg-white/80 text-slate-600"
        />
      </div>

      {/* Study tabs */}
      <div className="flex flex-wrap gap-2">
        <TabButton active={activeTab === 'flashcards'} onClick={() => setActiveTab('flashcards')}>
          Flashcards
        </TabButton>
        <TabButton active={activeTab === 'quiz'} onClick={() => setActiveTab('quiz')}>
          Quiz
        </TabButton>
      </div>

      {activeTab === 'flashcards' && (
        <FlashcardDeck cards={sessionCards} eventId={eventId} userId="placeholder-user" />
      )}

      {activeTab === 'quiz' && <QuizEngine questions={quizQuestions} />}
    </div>
  )
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

function StatPill({ label, value, className }) {
  return (
    <div className={`rounded-[9px] border px-4 py-3 shadow-sm ${className}`}>
      <div className="font-mono text-2xl font-semibold leading-none">{value}</div>
      <div className="mt-1 font-mono text-[9px] uppercase tracking-[0.16em] opacity-70">{label}</div>
    </div>
  )
}

function TabButton({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
        active ? 'text-white' : 'bg-white/80 text-[#3a5267] hover:bg-white'
      }`}
      style={active ? { backgroundColor: 'var(--navy)' } : undefined}
    >
      {children}
    </button>
  )
}

function QuizEngine({ questions }) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedIndex, setSelectedIndex] = useState(null)

  const currentQuestion = questions[currentIndex]

  if (questions.length === 0) {
    return (
      <section className="rounded-[14px] border border-[rgba(9,87,134,0.11)] bg-white/75 p-6 text-center shadow-[0_2px_12px_rgba(9,87,134,0.07)]">
        <p className="text-sm font-medium text-[#3a5267]">Quiz content coming soon.</p>
      </section>
    )
  }

  function chooseAnswer(optionIndex) {
    setSelectedIndex(optionIndex)
  }

  function goNext() {
    setCurrentIndex((currentIndex + 1) % questions.length)
    setSelectedIndex(null)
  }

  return (
    <section className="max-w-3xl rounded-[14px] border border-[rgba(9,87,134,0.11)] bg-white/75 p-5 shadow-[0_2px_12px_rgba(9,87,134,0.07)]">
      {/* Quiz progress */}
      <div className="mb-4 flex items-center justify-between gap-3">
        <span className="font-mono text-[11px] text-[#7a93a8]">
          Question {currentIndex + 1} / {questions.length}
        </span>
        <span className="font-mono text-[11px] text-[#095786]">Practice mode</span>
      </div>

      <h2 className="mb-4 text-[15px] font-medium leading-7 text-[#0d1a24]">
        {currentQuestion.question}
      </h2>

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
              className={`flex w-full items-start gap-3 rounded-[9px] border px-4 py-3 text-left text-sm transition ${
                showCorrect
                  ? 'border-green-300 bg-green-100 text-green-800'
                  : showWrong
                    ? 'border-[rgba(174,0,0,0.14)] bg-[rgba(174,0,0,0.06)] text-[#ae0000]'
                    : 'border-[rgba(9,87,134,0.13)] bg-white text-[#0d1a24] hover:bg-[rgba(9,87,134,0.07)]'
              }`}
            >
              <span className="font-mono text-[10px] text-[#7a93a8]">{index + 1}</span>
              {option}
            </button>
          )
        })}
      </div>

      {selectedIndex !== null && (
        <div className="mt-4 rounded-[9px] border border-[rgba(9,87,134,0.15)] bg-[rgba(9,87,134,0.07)] p-4 text-sm leading-6 text-[#3a5267]">
          {currentQuestion.explanation}
        </div>
      )}

      <button
        type="button"
        onClick={goNext}
        disabled={selectedIndex === null}
        className="mt-4 rounded-full px-5 py-2 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-50"
        style={{ backgroundColor: 'var(--navy)' }}
      >
        Next question
      </button>
    </section>
  )
}

export default StudyEvent
