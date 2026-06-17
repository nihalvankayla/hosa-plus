import { useMemo, useState } from 'react'
import { saveCardRating } from '../../lib/sessionCalculator'
import { getTopicLabel } from '../../data/studyContent'

const modes = ['Classic', 'Typing', 'Multiple Choice']
const ratingButtons = [
  { rating: 'got-it',       label: 'Got It',      cls: 'btn-p' },
  { rating: 'almost',       label: 'Almost',      cls: 'btn-b' },
  { rating: 'review-again', label: 'Review Again',cls: 'btn-o' },
]

export default function FlashcardDeck({
  cards = [],
  eventId,
  userId,
  sessionLabel = 'Smart Study',
  emptyCopy = 'Content coming soon - check back shortly.',
  isCram = false,
  onGoToQuiz,
}) {
  const availableModes = isCram ? ['Classic', 'Multiple Choice'] : modes
  const [mode, setMode] = useState(availableModes[0])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [typedAnswer, setTypedAnswer] = useState('')
  const [hasSubmittedTyping, setHasSubmittedTyping] = useState(false)
  const [selectedChoice, setSelectedChoice] = useState('')
  const [isChoiceLocked, setIsChoiceLocked] = useState(false)
  const [completedCount, setCompletedCount] = useState(0)
  const [summary, setSummary] = useState({ 'got-it': 0, almost: 0, 'review-again': 0 })

  const currentCard = cards[currentIndex]
  const choices = useMemo(
    () => (currentCard ? buildChoices(currentCard, cards) : []),
    [currentCard, cards],
  )

  if (cards.length === 0) {
    return (
      <div className="deck-empty-state">
        <p className="mini-label">No cards</p>
        <p>{emptyCopy}</p>
      </div>
    )
  }

  if (completedCount >= cards.length) {
    return (
      <SessionSummary
        summary={summary}
        cards={cards}
        sessionLabel={sessionLabel}
        isCram={isCram}
        onGoToQuiz={onGoToQuiz}
        onStudyAgain={() => {
          setCurrentIndex(0)
          setCompletedCount(0)
          setSummary({ 'got-it': 0, almost: 0, 'review-again': 0 })
          resetCardState()
        }}
      />
    )
  }

  function resetCardState() {
    setIsFlipped(false)
    setTypedAnswer('')
    setHasSubmittedTyping(false)
    setSelectedChoice('')
    setIsChoiceLocked(false)
  }

  async function rateCard(rating) {
    if (!isCram) await saveCardRating(userId, currentCard.id, eventId, rating, completedCount)
    setSummary(prev => ({ ...prev, [rating]: prev[rating] + 1 }))
    setCompletedCount(completedCount + 1)
    setCurrentIndex((currentIndex + 1) % cards.length)
    setMode(getNextMode(rating, currentCard, availableModes, completedCount))
    resetCardState()
  }

  async function chooseAnswer(option) {
    if (isChoiceLocked) return
    const isCorrect = option === currentCard.definition
    setSelectedChoice(option)
    setIsChoiceLocked(true)
    setTimeout(async () => { await rateCard(isCorrect ? 'got-it' : 'review-again') }, 900)
  }

  const progressPercent = Math.round((completedCount / cards.length) * 100)

  return (
    <div className="fc-deck-layout">
      {/* -- Left: main study area -- */}
      <div className="fc-deck-main">
        {/* Progress bar */}
        <div className="fc-prog-bar">
          <div className="fc-prog-track">
            <div className="fc-prog-fill" style={{ width: `${progressPercent}%` }} />
          </div>
          <span className="fc-prog-lbl">{completedCount + 1} / {cards.length}</span>
        </div>

        {/* Mode selector tabs */}
        <div className="fc-mode-tabs">
          {availableModes.map(m => (
            <button
              key={m}
              type="button"
              className={`fc-mode-tab${mode === m ? ' active' : ''}`}
              onClick={() => { setMode(m); resetCardState() }}
            >
              {m}
            </button>
          ))}
        </div>

        {/* Card area */}
        {mode === 'Classic' && (
          <ClassicMode card={currentCard} isFlipped={isFlipped}
            onFlip={() => setIsFlipped(!isFlipped)} onRate={rateCard} />
        )}
        {mode === 'Typing' && (
          <TypingMode
            card={currentCard}
            typedAnswer={typedAnswer}
            hasSubmitted={hasSubmittedTyping}
            onAnswerChange={setTypedAnswer}
            onSubmit={() => setHasSubmittedTyping(true)}
            onRate={rateCard}
          />
        )}
        {mode === 'Multiple Choice' && (
          <MultipleChoiceMode
            card={currentCard}
            choices={choices}
            selectedChoice={selectedChoice}
            isLocked={isChoiceLocked}
            onChoose={chooseAnswer}
          />
        )}
      </div>

      {/* -- Right: session sidebar -- */}
      <aside className="fc-deck-aside card">
        <div className="card-hd">
          <div className="card-title">Session</div>
          <span className="ctag">{progressPercent}%</span>
        </div>

        {/* Current card info */}
        <div className="fc-aside-card">
          <strong>{currentCard.term}</strong>
          <span>{getTopicLabel(currentCard.topic)} · {currentCard.difficulty}</span>
        </div>

        {/* Score tally */}
        <div className="fc-aside-scores">
          <div className="fc-score-row">
            <span>Got It</span>
            <strong className="tone-green">{summary['got-it']}</strong>
          </div>
          <div className="fc-score-row">
            <span>Almost</span>
            <strong className="tone-navy">{summary.almost}</strong>
          </div>
          <div className="fc-score-row">
            <span>Review Again</span>
            <strong className="tone-maroon">{summary['review-again']}</strong>
          </div>
        </div>

        <div className="divider-soft" />

        {/* Stage label if in smart study */}
        {currentCard.sessionStage && (
          <div className="fc-aside-stage">
            <p className="mini-label">Current phase</p>
            <span className="fc-stage-badge">{currentCard.sessionStage}</span>
          </div>
        )}

        <div className="divider-soft" />
        <p className="mini-label">Mode</p>
        <p className="side-copy">
          {mode} · {isCram ? 'No schedule save' : 'Spaced repetition on'}
        </p>
      </aside>
    </div>
  )
}

/* -- Classic flashcard -- */
function ClassicMode({ card, isFlipped, onFlip, onRate }) {
  return (
    <div className="fc-wrap">
      <button type="button" onClick={onFlip} className="fc-card">
        {!isFlipped ? <CardFront card={card} /> : <CardBack card={card} />}
      </button>
      {isFlipped && <RatingButtons onRate={onRate} />}
    </div>
  )
}

function CardFront({ card }) {
  return (
    <div className="fc-face">
      <div className="fc-chips">
        <span className="topic-chip">{getTopicLabel(card.topic)}</span>
        <span className={`difficulty-chip ${card.difficulty}`}>{card.difficulty}</span>
      </div>
      <p className="fc-kicker">Active Recall</p>
      <h2 className="fc-term">{card.term}</h2>
      {card.memoryHint && <p className="fc-hint-text">{card.memoryHint}</p>}
      <span className="flip-hint">Tap after you can recall it</span>
    </div>
  )
}

function CardBack({ card }) {
  return (
    <div className="fc-face fc-face-back">
      <div className="fc-chips">
        <span className="topic-chip">{getTopicLabel(card.topic)}</span>
        <span className={`difficulty-chip ${card.difficulty}`}>{card.difficulty}</span>
      </div>
      <p className="fc-kicker">Definition</p>
      <p className="fc-def main">{card.definition}</p>
      {(card.breakdown?.length > 0 || card.competitionNote) && (
        <div className="card-learning-grid">
          {card.breakdown?.length > 0 && (
            <div className="info-block">
              <p className="mini-label">Breakdown</p>
              <ul>{card.breakdown.map(item => <li key={item}>{item}</li>)}</ul>
            </div>
          )}
          {card.competitionNote && (
            <div className="info-block">
              <p className="mini-label">Competition Note</p>
              <p>{card.competitionNote}</p>
            </div>
          )}
        </div>
      )}
      {card.example && (
        <div className="fc-example">
          <p className="mini-label">Example</p>
          <p>{card.example}</p>
        </div>
      )}
    </div>
  )
}

/* -- Typing mode -- */
function TypingMode({ card, typedAnswer, hasSubmitted, onAnswerChange, onSubmit, onRate }) {
  const keywordResults = getKeywordResults(card, typedAnswer)
  return (
    <div className="fc-wrap">
      <div className="fc-card static">
        <div className="fc-face">
          <div className="fc-chips">
            <span className="topic-chip">{getTopicLabel(card.topic)}</span>
            <span className={`difficulty-chip ${card.difficulty}`}>{card.difficulty}</span>
          </div>
          <p className="fc-kicker">Type Recall</p>
          <h2 className="fc-term">{card.term}</h2>
          {card.memoryHint && <p className="fc-hint-text">{card.memoryHint}</p>}
        </div>
      </div>
      <label htmlFor="typed-definition" className="form-label" style={{ marginTop: 12 }}>
        Write what you remember
      </label>
      <textarea
        id="typed-definition"
        value={typedAnswer}
        onChange={e => onAnswerChange(e.target.value)}
        disabled={hasSubmitted}
        rows={4}
        className="demo-textarea"
        placeholder="Type the definition..."
      />
      {!hasSubmitted && (
        <button type="button" onClick={onSubmit} className="btn btn-p fc-submit-btn">
          Submit
        </button>
      )}
      {hasSubmitted && (
        <div className="typing-result">
          <div className="card">
            <p className="mini-label">Correct definition</p>
            <p className="side-copy">{card.definition}</p>
          </div>
          <div className="card">
            <p className="mini-label">Keyword check</p>
            <div className="keyword-row">
              {keywordResults.map(kw => (
                <span key={kw.word} className={`keyword-chip ${kw.matched ? 'matched' : 'missed'}`}>
                  {kw.word}
                </span>
              ))}
            </div>
          </div>
          <RatingButtons onRate={onRate} />
        </div>
      )}
    </div>
  )
}

/* -- Multiple choice -- */
function MultipleChoiceMode({ card, choices, selectedChoice, isLocked, onChoose }) {
  return (
    <div className="fc-wrap">
      <div className="fc-card static">
        <div className="fc-face">
          <div className="fc-chips">
            <span className="topic-chip">{getTopicLabel(card.topic)}</span>
            <span className={`difficulty-chip ${card.difficulty}`}>{card.difficulty}</span>
          </div>
          <p className="fc-kicker">Choose The Definition</p>
          <h2 className="fc-term">{card.term}</h2>
        </div>
      </div>
      <div className="choice-grid">
        {choices.map(choice => {
          const isCorrect = choice === card.definition
          const isSelected = choice === selectedChoice
          const state = isLocked && isCorrect ? 'correct' : isLocked && isSelected ? 'wrong' : ''
          return (
            <button
              key={choice}
              type="button"
              onClick={() => onChoose(choice)}
              disabled={isLocked}
              className={`choice-btn ${state}`}
            >
              {choice}
            </button>
          )
        })}
      </div>
    </div>
  )
}

/* -- Rating buttons -- */
function RatingButtons({ onRate }) {
  return (
    <div className="fc-actions">
      {ratingButtons.map(b => (
        <button key={b.rating} type="button" onClick={() => onRate(b.rating)} className={`btn ${b.cls}`}>
          {b.label}
        </button>
      ))}
    </div>
  )
}

/* -- Session summary -- */
function SessionSummary({ summary, cards, sessionLabel, isCram, onStudyAgain, onGoToQuiz }) {
  const weakTopics = getWeakTopics(cards)
  return (
    <div className="session-summary-wrap card">
      <p className="mini-label">Session Complete</p>
      <h2 style={{ fontSize: 28, margin: '8px 0 20px', color: 'var(--t1)' }}>{sessionLabel} done</h2>
      <div className="summary-grid">
        <SummaryStat label="Got It"       value={summary['got-it']}        color="tone-green"  />
        <SummaryStat label="Almost"       value={summary.almost}            color="tone-navy"   />
        <SummaryStat label="Review Again" value={summary['review-again']}   color="tone-maroon" />
      </div>
      <p className="side-copy" style={{ margin: '0 0 16px' }}>
        {isCram
          ? 'Cram mode - no schedule changes saved.'
          : `Cards due next cycle: ${summary['got-it'] + summary.almost}`}
      </p>
      {weakTopics.length > 0 && (
        <div className="topic-chip-row" style={{ marginBottom: 16 }}>
          {weakTopics.map(t => <span className="topic-chip" key={t}>{getTopicLabel(t)}</span>)}
        </div>
      )}
      <div className="fc-actions">
        {onGoToQuiz
          ? <button type="button" onClick={onGoToQuiz} className="btn btn-p">Take Exit Quiz</button>
          : <button type="button" onClick={onStudyAgain} className="btn btn-p">Study Again</button>}
        {onGoToQuiz && <button type="button" onClick={onStudyAgain} className="btn btn-b">Study Again</button>}
        <a href="/study" className="btn btn-b">Back to Events</a>
      </div>
    </div>
  )
}

function SummaryStat({ label, value, color }) {
  return (
    <div className="summary-stat">
      <p className={color}>{value}</p>
      <span>{label}</span>
    </div>
  )
}

/* -- Helpers -- */
function getKeywordResults(card, typedAnswer) {
  const lower = typedAnswer.toLowerCase()
  const keywords = card.keywords || card.definition
    .toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/)
    .filter((w, i, arr) => w.length > 4 && arr.indexOf(w) === i)
  return keywords.map(word => ({ word, matched: lower.includes(word) }))
}

function getWeakTopics(cards) {
  const hard = cards.filter(c => c.difficulty === 'hard').map(c => c.topic).filter(Boolean)
  return [...new Set(hard)].slice(0, 4)
}

function buildChoices(currentCard, cards) {
  const wrong = cards
    .filter(c => c.id !== currentCard.id)
    .map(c => c.definition)
    .sort(() => Math.random() - 0.5)
    .slice(0, 3)
  const fallback = [
    'A temporary change in mood that does not affect daily life',
    'A physical symptom that only appears during exercise',
    'A process used only to diagnose infectious disease',
  ]
  const options = [currentCard.definition, ...wrong]
  while (options.length < 4) options.push(fallback[options.length - 1])
  return options.sort(() => Math.random() - 0.5)
}

function getNextMode(rating, card, availableModes, completedCount) {
  if (availableModes.length === 1) return availableModes[0]
  if (!availableModes.includes('Typing')) return availableModes[(completedCount + 1) % availableModes.length]
  if (rating === 'review-again') return completedCount % 2 === 0 ? 'Typing' : 'Multiple Choice'
  if (rating === 'almost') return 'Typing'
  if (card?.difficulty === 'hard') return 'Multiple Choice'
  return 'Classic'
}
