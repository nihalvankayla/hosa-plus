import { useEffect, useMemo, useState } from 'react'
import { SQT1_EVENTS } from '../data/events.js'
import { useAuth } from '../contexts/AuthContext.jsx'
import { askGemini } from '../lib/gemini.js'

const QUESTION_COUNT = 10

function Testing() {
  const { user } = useAuth()
  const [started, setStarted] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selected, setSelected] = useState(null)
  const [correct, setCorrect] = useState(0)
  const [selectedEventId, setSelectedEventId] = useState('')
  const [questions, setQuestions] = useState([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState('')
  const [dailyRecord, setDailyRecord] = useState(null)

  const selectedEvent = useMemo(
    () => SQT1_EVENTS.find((event) => event.id === selectedEventId) || null,
    [selectedEventId],
  )

  const storageKey = useMemo(() => {
    const userKey = user?.id || user?.email || 'guest'
    return `hosa-plus-ai-test-${userKey}`
  }, [user])

  const todayKey = getTodayKey()
  const current = questions[currentIndex]
  const progress = useMemo(
    () => (questions.length ? ((currentIndex + (selected !== null ? 1 : 0)) / questions.length) * 100 : 0),
    [currentIndex, questions.length, selected],
  )
  const generatedToday = dailyRecord?.date === todayKey
  const selectedTodaysEvent = generatedToday && dailyRecord?.eventId === selectedEventId
  const canUseSavedTest = selectedTodaysEvent && dailyRecord?.questions?.length === QUESTION_COUNT

  useEffect(() => {
    const record = readDailyRecord(storageKey)
    setDailyRecord(record)
    if (record?.date === todayKey && Array.isArray(record.questions)) {
      setQuestions(record.questions)
      setSelectedEventId(record.eventId || '')
    }
  }, [storageKey, todayKey])

  function choose(option) {
    if (selected !== null || !current) return
    setSelected(option)
    if (option === current.answer) setCorrect((value) => value + 1)
  }

  function next() {
    if (currentIndex === questions.length - 1) {
      setStarted(false)
      setCurrentIndex(0)
      setSelected(null)
      return
    }
    setCurrentIndex((value) => value + 1)
    setSelected(null)
  }

  async function generateTest() {
    if (isGenerating) return

    setError('')

    if (!selectedEvent) {
      setError('Choose your HOSA SQT event first so the AI can generate questions for that event.')
      return
    }

    if (canUseSavedTest) {
      beginTest(dailyRecord.questions)
      return
    }

    if (generatedToday) {
      setError('You have already generated your AI test for today. Come back tomorrow for a fresh set.')
      return
    }

    setIsGenerating(true)
    try {
      const response = await askGemini(
        buildQuestionPrompt(selectedEvent.name),
        [
          'You write difficult HOSA SQT practice questions for high school competitors.',
          'Keep output short to conserve API credits: return compact JSON only, no markdown, no explanations outside JSON.',
          'Each question must have exactly 4 answer options, one correct answer copied exactly from options, and a brief explanation.',
        ].join(' '),
      )
      const nextQuestions = normalizeQuestions(parseQuestionJson(response))
      if (nextQuestions.length !== QUESTION_COUNT) {
        throw new Error('The AI response did not include exactly 10 valid questions.')
      }

      const record = {
        date: todayKey,
        eventId: selectedEvent.id,
        eventName: selectedEvent.name,
        questions: nextQuestions,
      }
      window.localStorage.setItem(storageKey, JSON.stringify(record))
      setDailyRecord(record)
      beginTest(nextQuestions)
    } catch (generationError) {
      setError(generationError.message || 'Could not generate a test right now. Try again later.')
    } finally {
      setIsGenerating(false)
    }
  }

  function beginTest(nextQuestions = questions) {
    if (!nextQuestions.length) return
    setQuestions(nextQuestions)
    setStarted(true)
    setCorrect(0)
    setCurrentIndex(0)
    setSelected(null)
  }

  return (
    <div id="v-quiz" className="view active">
      <div className="ph">
        <div>
          <div className="ph-eye">SQT - Assessment</div>
          <div className="ph-title">Testing</div>
          <div className="ph-sub">Configure your test, then compete at your level</div>
        </div>
      </div>

      {!started ? (
        <div className="test-cfg">
          <div className="test-cfg-eyebrow">AI Practice Engine</div>
          <div className="test-cfg-title">Practice Testing</div>
          <div className="test-cfg-sub">
            Generate one hard 10-question test per day for your selected HOSA SQT event.
          </div>

          <div className="test-cfg-section">
            <div className="test-cfg-label">Event</div>
            <p className="side-copy" style={{ margin: '0 0 10px' }}>
              Select your event first. The AI will generate all 10 questions specifically for that event.
            </p>
            <div className="event-pills">
              {SQT1_EVENTS.map((event) => (
                <button
                  key={event.id}
                  className={`event-pill ${event.id === selectedEventId ? 'active' : ''}`}
                  type="button"
                  onClick={() => {
                    setSelectedEventId(event.id)
                    setError('')
                  }}
                  disabled={isGenerating}
                >
                  {event.name}
                </button>
              ))}
            </div>
          </div>

          <div className="test-cfg-section">
            <div className="test-cfg-label">Question Count</div>
            <div className="count-row">
              <button className="count-opt active" type="button">10</button>
            </div>
          </div>

          <div className="test-cfg-section">
            <div className="test-cfg-label">Timer</div>
            <div className="timer-row">
              <button className="timer-opt active" type="button"><span>&gt;</span> Untimed</button>
            </div>
          </div>

          {generatedToday && (
            <p className="side-copy" style={{ margin: '0 0 12px' }}>
              Today&apos;s AI test has already been generated{dailyRecord?.eventName ? ` for ${dailyRecord.eventName}` : ''}.
              {selectedTodaysEvent ? ' You can retake it below.' : ' Pick that event again to retake it, or come back tomorrow for a new event.'}
            </p>
          )}

          {error && (
            <p className="side-copy" style={{ margin: '0 0 12px', color: 'var(--maroon)' }}>
              {error}
            </p>
          )}

          <button className="test-begin-btn" type="button" onClick={generateTest} disabled={isGenerating || !selectedEvent || (generatedToday && !canUseSavedTest)}>
            {isGenerating ? 'Generating AI Test...' : canUseSavedTest ? 'Begin Today\'s Test ->' : selectedEvent ? `Generate ${selectedEvent.name} Test ->` : 'Select an Event First'}
          </button>
        </div>
      ) : (
        <div className="quiz5-wrap" style={{ position: 'relative' }}>
          <div className="quiz5-session-saved">AI Generated</div>
          <div className="quiz5-topbar">
            <div className="quiz5-counter">Q {String(currentIndex + 1).padStart(2, '0')} / {questions.length}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--green)' }}>{correct} correct</span>
              <div className="quiz5-timer-live">UNTIMED</div>
            </div>
          </div>
          <div className="quiz5-progress"><div className="quiz5-prog-fill" style={{ width: `${progress}%` }} /></div>
          <div className="quiz5-q">{current?.question}</div>
          <div>
            {current?.options.map((option) => {
              const isCorrect = option === current.answer
              const isSelected = option === selected
              const stateClass = selected === null ? '' : isCorrect ? 'correct' : isSelected ? 'wrong' : ''
              return (
                <button key={option} className={`quiz5-opt ${stateClass}`} type="button" onClick={() => choose(option)}>
                  <span>{option}</span>
                </button>
              )
            })}
          </div>
          {selected !== null && (
            <>
              <div id="quiz5-explain" style={{ display: 'block' }}>{current.explanation}</div>
              <button className="btn btn-p btn-sm" type="button" onClick={next} style={{ marginTop: 8 }}>
                {currentIndex === questions.length - 1 ? 'Finish Test ->' : 'Next Question ->'}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}

function buildQuestionPrompt(eventName) {
  return [
    `Generate exactly ${QUESTION_COUNT} hard practice questions for the HOSA SQT event "${eventName}".`,
    'Use realistic competition-level wording and avoid easy definition-only questions unless the term is unusually subtle.',
    'Return a JSON array only. Each item must be {"question":"...","options":["A","B","C","D"],"answer":"...","explanation":"..."}',
    'Keep each question under 35 words and each explanation under 18 words to reduce token usage.',
  ].join(' ')
}

function parseQuestionJson(text) {
  const cleaned = text.trim().replace(/^```(?:json)?/i, '').replace(/```$/i, '').trim()
  try {
    return JSON.parse(cleaned)
  } catch {
    const start = cleaned.indexOf('[')
    const end = cleaned.lastIndexOf(']')
    if (start === -1 || end === -1) throw new Error('The AI response was not valid JSON.')
    return JSON.parse(cleaned.slice(start, end + 1))
  }
}

function normalizeQuestions(items) {
  if (!Array.isArray(items)) return []

  return items
    .map((item, index) => {
      const options = Array.isArray(item?.options) ? item.options.map(String).filter(Boolean).slice(0, 4) : []
      const answer = String(item?.answer || '')
      return {
        question: String(item?.question || `Question ${index + 1}`).trim(),
        options,
        answer,
        explanation: String(item?.explanation || 'Review the source material for this concept.').trim(),
      }
    })
    .filter((item) => item.question && item.options.length === 4 && item.options.includes(item.answer))
    .slice(0, QUESTION_COUNT)
}

function readDailyRecord(storageKey) {
  try {
    return JSON.parse(window.localStorage.getItem(storageKey) || 'null')
  } catch {
    return null
  }
}

function getTodayKey() {
  return new Date().toLocaleDateString('en-CA')
}

export default Testing
