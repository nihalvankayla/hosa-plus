import { useMemo, useState } from 'react'
import { saveCardRating } from '../../lib/sessionCalculator'

const modes = ['Classic', 'Typing', 'Multiple Choice']
const ratingButtons = [
  { rating: 'got-it', label: 'Got It', color: 'bg-green-600 hover:bg-green-700' },
  { rating: 'almost', label: 'Almost', color: 'bg-yellow-500 hover:bg-yellow-600' },
  { rating: 'review-again', label: 'Review Again', color: 'bg-red-600 hover:bg-red-700' },
]

function FlashcardDeck({ cards = [], eventId, userId }) {
  const [mode, setMode] = useState('Classic')
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [typedAnswer, setTypedAnswer] = useState('')
  const [hasSubmittedTyping, setHasSubmittedTyping] = useState(false)
  const [selectedChoice, setSelectedChoice] = useState('')
  const [isChoiceLocked, setIsChoiceLocked] = useState(false)
  const [completedCount, setCompletedCount] = useState(0)
  const [summary, setSummary] = useState({
    'got-it': 0,
    almost: 0,
    'review-again': 0,
  })

  const currentCard = cards[currentIndex]

  const choices = useMemo(() => {
    if (!currentCard) return []
    return buildChoices(currentCard, cards)
  }, [currentCard, cards])

  if (cards.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <p className="text-sm font-medium text-slate-600">
          Content coming soon — check back shortly
        </p>
      </div>
    )
  }

  if (completedCount >= cards.length) {
    return (
      <SessionSummary
        summary={summary}
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
    await saveCardRating(userId, currentCard.id, eventId, rating, completedCount)

    setSummary((previousSummary) => ({
      ...previousSummary,
      [rating]: previousSummary[rating] + 1,
    }))

    setCompletedCount(completedCount + 1)
    setCurrentIndex((currentIndex + 1) % cards.length)
    resetCardState()
  }

  async function chooseAnswer(option) {
    if (isChoiceLocked) return

    const isCorrect = option === currentCard.definition
    setSelectedChoice(option)
    setIsChoiceLocked(true)

    setTimeout(async () => {
      await rateCard(isCorrect ? 'got-it' : 'review-again')
    }, 1500)
  }

  const progressPercent = Math.round((completedCount / cards.length) * 100)

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      {/* Progress bar */}
      <div className="mb-5">
        <div className="mb-2 flex items-center justify-between text-sm text-slate-600">
          <span>
            Card {completedCount + 1} of {cards.length}
          </span>
          <span>{progressPercent}% complete</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${progressPercent}%`, backgroundColor: 'var(--navy)' }}
          />
        </div>
      </div>

      {/* Mode tabs */}
      <div className="mb-5 flex flex-wrap gap-2">
        {modes.map((studyMode) => (
          <button
            key={studyMode}
            type="button"
            onClick={() => {
              setMode(studyMode)
              resetCardState()
            }}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              mode === studyMode
                ? 'text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
            style={mode === studyMode ? { backgroundColor: 'var(--navy)' } : undefined}
          >
            {studyMode}
          </button>
        ))}
      </div>

      {mode === 'Classic' && (
        <ClassicMode
          card={currentCard}
          isFlipped={isFlipped}
          onFlip={() => setIsFlipped(!isFlipped)}
          onRate={rateCard}
        />
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
    </section>
  )
}

function ClassicMode({ card, isFlipped, onFlip, onRate }) {
  return (
    <div>
      <button
        type="button"
        onClick={onFlip}
        className="min-h-72 w-full rounded-2xl border border-slate-200 bg-slate-50 p-8 text-left transition hover:border-slate-300"
      >
        {!isFlipped ? (
          <div className="flex min-h-56 flex-col justify-center text-center">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
              Term
            </p>
            <h2 className="text-4xl font-bold text-slate-900">{card.term}</h2>
            <p className="mt-6 text-sm text-slate-500">Click to flip</p>
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
  const keywordResults = getKeywordResults(card.definition, typedAnswer)

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
          Define
        </p>
        <h2 className="text-3xl font-bold text-slate-900">{card.term}</h2>
      </div>

      <div>
        <label htmlFor="typed-definition" className="mb-2 block text-sm font-medium text-slate-700">
          Type the definition
        </label>
        <textarea
          id="typed-definition"
          value={typedAnswer}
          onChange={(event) => onAnswerChange(event.target.value)}
          disabled={hasSubmitted}
          rows="4"
          className="w-full rounded-xl border border-slate-200 p-4 text-sm outline-none transition focus:border-slate-400 disabled:bg-slate-50"
          placeholder="Write what you remember..."
        />
      </div>

      {!hasSubmitted && (
        <button
          type="button"
          onClick={onSubmit}
          className="rounded-full px-5 py-2 text-sm font-semibold text-white"
          style={{ backgroundColor: 'var(--navy)' }}
        >
          Submit
        </button>
      )}

      {hasSubmitted && (
        <div className="space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="mb-2 text-sm font-semibold text-slate-900">Correct definition</p>
            <p className="text-sm leading-6 text-slate-600">{card.definition}</p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="mb-3 text-sm font-semibold text-slate-900">Keyword check</p>
            <div className="flex flex-wrap gap-2">
              {keywordResults.map((keyword) => (
                <span
                  key={keyword.word}
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    keyword.matched
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-700'
                  }`}
                >
                  {keyword.word}
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

function MultipleChoiceMode({ card, choices, selectedChoice, isLocked, onChoose }) {
  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
          Choose the definition
        </p>
        <h2 className="text-3xl font-bold text-slate-900">{card.term}</h2>
      </div>

      <div className="grid gap-3">
        {choices.map((choice) => {
          const isCorrect = choice === card.definition
          const isSelected = choice === selectedChoice
          const showCorrect = isLocked && isCorrect
          const showWrong = isLocked && isSelected && !isCorrect

          return (
            <button
              key={choice}
              type="button"
              onClick={() => onChoose(choice)}
              disabled={isLocked}
              className={`rounded-xl border p-4 text-left text-sm leading-6 transition ${
                showCorrect
                  ? 'border-green-300 bg-green-100 text-green-800'
                  : showWrong
                    ? 'border-red-300 bg-red-100 text-red-800'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
              }`}
            >
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
    <div className="flex min-h-56 flex-col justify-center">
      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
        Definition
      </p>
      <p className="text-xl font-semibold leading-8 text-slate-900">{card.definition}</p>
      {card.example && (
        <div className="mt-6 rounded-xl border border-slate-200 bg-white p-4">
          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
            Example
          </p>
          <p className="text-sm leading-6 text-slate-600">{card.example}</p>
        </div>
      )}
    </div>
  )
}

function RatingButtons({ onRate }) {
  return (
    <div className="mt-5 grid gap-3 sm:grid-cols-3">
      {ratingButtons.map((button) => (
        <button
          key={button.rating}
          type="button"
          onClick={() => onRate(button.rating)}
          className={`rounded-xl px-4 py-3 text-sm font-bold text-white transition ${button.color}`}
        >
          {button.label}
        </button>
      ))}
    </div>
  )
}

function SessionSummary({ summary, onStudyAgain }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
        Session complete
      </p>
      <h2 className="text-3xl font-bold text-slate-900">Nice work</h2>

      <div className="my-8 grid gap-3 sm:grid-cols-3">
        <SummaryStat label="Got It" value={summary['got-it']} color="text-green-700" />
        <SummaryStat label="Almost" value={summary.almost} color="text-yellow-600" />
        <SummaryStat label="Review Again" value={summary['review-again']} color="text-red-700" />
      </div>

      <p className="mb-6 text-sm text-slate-600">
        Cards due tomorrow: {summary['got-it'] + summary.almost}
      </p>

      <div className="flex flex-col justify-center gap-3 sm:flex-row">
        <button
          type="button"
          onClick={onStudyAgain}
          className="rounded-full px-5 py-2 text-sm font-semibold text-white"
          style={{ backgroundColor: 'var(--navy)' }}
        >
          Study Again
        </button>
        <a
          href="/study"
          className="rounded-full border px-5 py-2 text-sm font-semibold"
          style={{ borderColor: 'var(--maroon)', color: 'var(--maroon)' }}
        >
          Back to Events
        </a>
      </div>
    </section>
  )
}

function SummaryStat({ label, value, color }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <p className={`text-3xl font-bold ${color}`}>{value}</p>
      <p className="mt-1 text-sm text-slate-500">{label}</p>
    </div>
  )
}

function getKeywordResults(definition, typedAnswer) {
  const answerWords = typedAnswer.toLowerCase()
  const keywords = definition
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter((word, index, words) => word.length > 4 && words.indexOf(word) === index)

  return keywords.map((word) => ({
    word,
    matched: answerWords.includes(word),
  }))
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

  while (options.length < 4) {
    options.push(fallbackChoices[options.length - 1])
  }

  return options.sort(() => Math.random() - 0.5)
}

export default FlashcardDeck
