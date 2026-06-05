import { useMemo, useState } from 'react'
import { saveCardRating } from '../../lib/sessionCalculator'
import { getTopicLabel } from '../../data/studyContent'

const modes = ['Classic', 'Typing', 'Multiple Choice']
const ratingButtons = [
  { rating: 'got-it', label: 'Got It' },
  { rating: 'almost', label: 'Almost' },
  { rating: 'review-again', label: 'Review Again' },
]

function FlashcardDeck({ cards = [], eventId, userId, sessionLabel = 'Smart Study', emptyCopy = 'Content coming soon - check back shortly', isCram = false }) {
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
  const choices = useMemo(() => (currentCard ? buildChoices(currentCard, cards) : []), [currentCard, cards])

  if (cards.length === 0) {
    return (
      <div className="card empty-state">
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
    if (!isCram) {
      await saveCardRating(userId, currentCard.id, eventId, rating, completedCount)
    }
    setSummary((previous) => ({ ...previous, [rating]: previous[rating] + 1 }))
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
    setTimeout(async () => {
      await rateCard(isCorrect ? 'got-it' : 'review-again')
    }, 900)
  }

  const progressPercent = Math.round((completedCount / cards.length) * 100)

  return (
    <section className="study-layout">
      <div>
        <div className="session-brief">
          <div>
            <div className="mini-label">{sessionLabel}</div>
            <h2>{getSessionHeadline(sessionLabel)}</h2>
          </div>
          <div className="session-brief-meta">
            <span>{cards.length} cards</span>
            <span>{isCram ? 'No schedule changes' : 'Saves progress'}</span>
          </div>
        </div>
        <div className="prog-row">
          <div className="ptrack" style={{ flex: 1 }}><div className="pfill" style={{ width: `${progressPercent}%` }} /></div>
          <div className="prog-lbl">{completedCount + 1} / {cards.length}</div>
        </div>

        <div className="deck-tabs">
          {availableModes.map((studyMode) => (
            <button
              key={studyMode}
              type="button"
              onClick={() => {
                setMode(studyMode)
                resetCardState()
              }}
              className={`deck-tab ${mode === studyMode ? 'active' : ''}`}
            >
              {studyMode}
            </button>
          ))}
        </div>

        {mode === 'Classic' && <ClassicMode card={currentCard} isFlipped={isFlipped} onFlip={() => setIsFlipped(!isFlipped)} onRate={rateCard} />}
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

      <aside className="card">
        <div className="card-hd"><div className="card-title">Session Control</div><span className="ctag">{progressPercent}%</span></div>
        <div className="mini-label">{sessionLabel}</div>
        <div className="current-card-mini">
          <strong>{currentCard.term}</strong>
          <span>{getTopicLabel(currentCard.topic)} - {currentCard.difficulty}</span>
        </div>
        <div className="queue-row"><span>Got It</span><strong className="tone-green">{summary['got-it']}</strong></div>
        <div className="queue-row"><span>Almost</span><strong className="tone-navy">{summary.almost}</strong></div>
        <div className="queue-row"><span>Review Again</span><strong className="tone-maroon">{summary['review-again']}</strong></div>
        <div className="divider-soft" />
        <div className="mini-label">Current Mode</div>
        <p className="side-copy">
          {mode} study {isCram ? 'without changing your spaced repetition schedule.' : 'with spaced repetition save-back enabled.'}
        </p>
      </aside>
    </section>
  )
}

function ClassicMode({ card, isFlipped, onFlip, onRate }) {
  return (
    <div className="fc-wrap">
      <button type="button" onClick={onFlip} className="fc-card">
        {!isFlipped ? (
          <div className="fc-face">
            <div className="card-chip-row">
              <span className="topic-chip">{getTopicLabel(card.topic)}</span>
              <span className={`difficulty-chip ${card.difficulty}`}>{card.difficulty}</span>
            </div>
            <p className="fc-kicker">Active Recall</p>
            <h2 className="fc-term">{card.term}</h2>
            <p className="fc-def">{card.memoryHint}</p>
            <span className="flip-hint">Click after you can say it without looking</span>
          </div>
        ) : (
          <CardBack card={card} />
        )}
      </button>
      {isFlipped && <RatingButtons onRate={onRate} />}
    </div>
  )
}

function TypingMode({ card, typedAnswer, hasSubmitted, onAnswerChange, onSubmit, onRate }) {
  const keywordResults = getKeywordResults(card, typedAnswer)

  return (
    <div className="fc-wrap">
      <div className="fc-card static">
        <div className="card-chip-row">
          <span className="topic-chip">{getTopicLabel(card.topic)}</span>
          <span className={`difficulty-chip ${card.difficulty}`}>{card.difficulty}</span>
        </div>
        <p className="fc-kicker">Type Recall</p>
        <h2 className="fc-term">{card.term}</h2>
        <p className="fc-def">{card.memoryHint}</p>
      </div>
      <label htmlFor="typed-definition" className="form-label">Type the definition</label>
      <textarea
        id="typed-definition"
        value={typedAnswer}
        onChange={(event) => onAnswerChange(event.target.value)}
        disabled={hasSubmitted}
        rows="4"
        className="demo-textarea"
        placeholder="Write what you remember..."
      />
      {!hasSubmitted && <button type="button" onClick={onSubmit} className="btn btn-p">Submit</button>}
      {hasSubmitted && (
        <div className="typing-result">
          <div className="card"><p className="mini-label">Correct definition</p><p className="side-copy">{card.definition}</p></div>
          <div className="card">
            <p className="mini-label">Keyword check</p>
            <div className="keyword-row">
              {keywordResults.map((keyword) => (
                <span key={keyword.word} className={`keyword-chip ${keyword.matched ? 'matched' : 'missed'}`}>{keyword.word}</span>
              ))}
            </div>
          </div>
          <RatingButtons onRate={onRate} />
        </div>
      )}
    </div>
  )
}

function MultipleChoiceMode({ card, choices, selectedChoice, isLocked, onChoose }) {
  return (
    <div className="fc-wrap">
      <div className="fc-card static">
        <div className="card-chip-row">
          <span className="topic-chip">{getTopicLabel(card.topic)}</span>
          <span className={`difficulty-chip ${card.difficulty}`}>{card.difficulty}</span>
        </div>
        <p className="fc-kicker">Choose The Definition</p>
        <h2 className="fc-term">{card.term}</h2>
      </div>
      <div className="choice-grid">
        {choices.map((choice) => {
          const isCorrect = choice === card.definition
          const isSelected = choice === selectedChoice
          const state = isLocked && isCorrect ? 'correct' : isLocked && isSelected ? 'wrong' : ''
          return (
            <button key={choice} type="button" onClick={() => onChoose(choice)} disabled={isLocked} className={`choice-btn ${state}`}>
              {choice}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function CardBack({ card }) {
  return (
    <div className="fc-face">
      <div className="card-chip-row">
        <span className="topic-chip">{getTopicLabel(card.topic)}</span>
        <span className={`difficulty-chip ${card.difficulty}`}>{card.difficulty}</span>
      </div>
      <p className="fc-kicker">Definition</p>
      <p className="fc-def main">{card.definition}</p>
      <div className="card-learning-grid">
        <InfoBlock title="Breakdown" items={card.breakdown || []} />
        <InfoBlock title="Competition Note" copy={card.competitionNote} />
      </div>
      {card.example && (
        <div className="fc-example">
          <p className="mini-label">Example</p>
          <p>{card.example}</p>
        </div>
      )}
    </div>
  )
}

function InfoBlock({ title, items, copy }) {
  return (
    <div className="info-block">
      <p className="mini-label">{title}</p>
      {items ? (
        <ul>
          {items.map((item) => <li key={item}>{item}</li>)}
        </ul>
      ) : (
        <p>{copy}</p>
      )}
    </div>
  )
}

function RatingButtons({ onRate }) {
  return (
    <div className="fc-actions">
      {ratingButtons.map((button) => (
        <button
          key={button.rating}
          type="button"
          onClick={() => onRate(button.rating)}
          className={`btn ${button.rating === 'got-it' ? 'btn-p' : button.rating === 'almost' ? 'btn-b' : 'btn-o'}`}
        >
          {button.label}
        </button>
      ))}
    </div>
  )
}

function SessionSummary({ summary, cards, sessionLabel, isCram, onStudyAgain }) {
  const weakTopics = getWeakTopics(cards)

  return (
    <section className="card session-summary">
      <p className="mini-label">Session complete</p>
      <h2>{sessionLabel} complete</h2>
      <div className="summary-grid">
        <SummaryStat label="Got It" value={summary['got-it']} color="tone-green" />
        <SummaryStat label="Almost" value={summary.almost} color="tone-navy" />
        <SummaryStat label="Review Again" value={summary['review-again']} color="tone-maroon" />
      </div>
      <p className="side-copy">
        {isCram ? 'Cram mode did not change your review schedule.' : `Cards due in the next cycle: ${summary['got-it'] + summary.almost}`}
      </p>
      {weakTopics.length > 0 && (
        <div className="topic-chip-row summary-topics">
          {weakTopics.map((topic) => <span className="topic-chip" key={topic}>{getTopicLabel(topic)}</span>)}
        </div>
      )}
      <div className="fc-actions">
        <button type="button" onClick={onStudyAgain} className="btn btn-p">Study Again</button>
        <a href="/study" className="btn btn-o">Back to Events</a>
      </div>
    </section>
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

function getKeywordResults(card, typedAnswer) {
  const answerWords = typedAnswer.toLowerCase()
  const keywords = card.keywords || card.definition
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter((word, index, words) => word.length > 4 && words.indexOf(word) === index)

  return keywords.map((word) => ({ word, matched: answerWords.includes(word) }))
}

function getWeakTopics(cards) {
  const hardTopics = cards
    .filter((card) => card.difficulty === 'hard')
    .map((card) => card.topic)
    .filter(Boolean)

  return [...new Set(hardTopics)].slice(0, 4)
}

function buildChoices(currentCard, cards) {
  const wrongChoices = cards
    .filter((card) => card.id !== currentCard.id)
    .map((card) => card.definition)
    .sort(() => Math.random() - 0.5)
    .slice(0, 3)

  const fallbackChoices = [
    'A temporary change in mood that does not affect daily life',
    'A physical symptom that only appears during exercise',
    'A process used only to diagnose infectious disease',
  ]

  const options = [currentCard.definition, ...wrongChoices]
  while (options.length < 4) options.push(fallbackChoices[options.length - 1])
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

function getSessionHeadline(sessionLabel) {
  if (sessionLabel.includes('Cram')) return 'Fast recognition reps'
  if (sessionLabel.includes('Weak') || sessionLabel.includes('Hard')) return 'Fix the pressure points'
  if (sessionLabel.includes('Practice')) return 'Build topic fluency'
  return "Clear today's prep block"
}

export default FlashcardDeck
