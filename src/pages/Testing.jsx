import { useMemo, useState } from 'react'
import { quizQuestions } from '../data/hosaDashboardData.js'

const events = ['Medical Terminology', 'Behavioral Health', 'Emergency Prep', 'Pharmacology']

function Testing() {
  const [started, setStarted] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selected, setSelected] = useState(null)
  const [correct, setCorrect] = useState(0)

  const current = quizQuestions[currentIndex]
  const progress = useMemo(() => ((currentIndex + (selected !== null ? 1 : 0)) / quizQuestions.length) * 100, [currentIndex, selected])

  function choose(option) {
    if (selected !== null) return
    setSelected(option)
    if (option === current.answer) setCorrect((value) => value + 1)
  }

  function next() {
    if (currentIndex === quizQuestions.length - 1) {
      setStarted(false)
      setCurrentIndex(0)
      setSelected(null)
      return
    }
    setCurrentIndex((value) => value + 1)
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
          <div className="test-cfg-eyebrow">Practice Engine</div>
          <div className="test-cfg-title">Practice Testing</div>
          <div className="test-cfg-sub">Mirrors real HOSA competition format. Select your parameters below.</div>

          <div className="test-cfg-section">
            <div className="test-cfg-label">Event</div>
            <div className="event-pills">
              {events.map((event, index) => (
                <button key={event} className={`event-pill ${index === 0 ? 'active' : ''}`} type="button">{event}</button>
              ))}
            </div>
          </div>

          <div className="test-cfg-section">
            <div className="test-cfg-label">Question Count</div>
            <div className="count-row">
              {[10, 25, 50, 100].map((count, index) => (
                <button key={count} className={`count-opt ${index === 0 ? 'active' : ''}`} type="button">{count}</button>
              ))}
            </div>
          </div>

          <div className="test-cfg-section">
            <div className="test-cfg-label">Timer</div>
            <div className="timer-row">
              <button className="timer-opt active" type="button"><span>▶</span> Untimed</button>
              <button className="timer-opt" type="button"><span>◷</span> Timed <span style={{ fontSize: 10, marginLeft: 4, opacity: 0.7 }}>30s/question</span></button>
              <button className="timer-opt" type="button"><span>!</span> Exam Mode</button>
            </div>
          </div>

          <button className="test-begin-btn" type="button" onClick={() => {
            setStarted(true)
            setCorrect(0)
            setCurrentIndex(0)
            setSelected(null)
          }}>
            Begin Test {'->'}
          </button>
        </div>
      ) : (
        <div className="quiz5-wrap" style={{ position: 'relative' }}>
          <div className="quiz5-session-saved">✓ Saved</div>
          <div className="quiz5-topbar">
            <div className="quiz5-counter">Q {String(currentIndex + 1).padStart(2, '0')} / {quizQuestions.length}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--green)' }}>{correct} correct</span>
              <div className="quiz5-timer-live">UNTIMED</div>
            </div>
          </div>
          <div className="quiz5-progress"><div className="quiz5-prog-fill" style={{ width: `${progress}%` }} /></div>
          <div className="quiz5-q">{current.question}</div>
          <div>
            {current.options.map((option) => {
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
                {currentIndex === quizQuestions.length - 1 ? 'Finish Test ->' : 'Next Question ->'}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}

export default Testing
