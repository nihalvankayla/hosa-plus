import { useMemo, useState } from 'react'
import { flashcardDecks } from '../../data/hosaDashboardData.js'

function Flashcards({ decks = flashcardDecks }) {
  const [deckIndex, setDeckIndex] = useState(0)
  const [cardIndex, setCardIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [reviewCount, setReviewCount] = useState(0)
  const [knownCount, setKnownCount] = useState(0)

  const deck = decks[deckIndex]
  const card = deck.cards[cardIndex]

  const progress = useMemo(
    () => Math.round(((cardIndex + 1) / deck.cards.length) * 100),
    [cardIndex, deck.cards.length],
  )

  function chooseDeck(nextDeckIndex) {
    setDeckIndex(nextDeckIndex)
    setCardIndex(0)
    setIsFlipped(false)
  }

  function nextCard(type) {
    if (type === 'review') {
      setReviewCount(reviewCount + 1)
    } else {
      setKnownCount(knownCount + 1)
    }

    setIsFlipped(false)
    setCardIndex((cardIndex + 1) % deck.cards.length)
  }

  return (
    <section className="rounded-[14px] border border-[rgba(9,87,134,0.11)] bg-white/75 p-4 shadow-[0_2px_12px_rgba(9,87,134,0.07)] backdrop-blur">
      <div className="mb-4 flex flex-wrap gap-1.5">
        {decks.map((item, index) => (
          <button
            key={item.name}
            type="button"
            onClick={() => chooseDeck(index)}
            className={`rounded-full border px-3.5 py-1.5 text-[11.5px] font-medium transition ${
              index === deckIndex
                ? 'border-transparent bg-gradient-to-br from-[#095786] to-[#0d6fa8] text-white shadow-[0_2px_8px_rgba(9,87,134,0.20)]'
                : 'border-[rgba(9,87,134,0.13)] bg-white/75 text-[#3a5267] hover:border-[rgba(9,87,134,0.15)] hover:text-[#095786]'
            }`}
          >
            {item.name}
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={() => setIsFlipped(!isFlipped)}
        className="group relative mb-4 min-h-[220px] w-full rounded-[14px] text-left [perspective:1000px]"
      >
        <div
          className={`absolute inset-0 transition-transform duration-500 [transform-style:preserve-3d] ${
            isFlipped ? '[transform:rotateY(180deg)]' : ''
          }`}
        >
          <FlashcardFace eyebrow="Question" text={card.question} hint="Click to reveal answer" />
          <FlashcardFace eyebrow="Answer" text={card.answer} hint="Click to return to question" back />
        </div>
      </button>

      <div className="mb-4 h-2 overflow-hidden rounded-full bg-[#ede7d9]">
        <div
          className="h-full rounded-full bg-gradient-to-r from-[#095786] to-[#0d6fa8] transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => nextCard('review')}
          className="rounded-[9px] border border-[rgba(174,0,0,0.14)] bg-[rgba(174,0,0,0.06)] px-4 py-2.5 text-[11px] font-semibold text-[#ae0000] transition hover:bg-[rgba(174,0,0,0.10)]"
        >
          Need review ({reviewCount})
        </button>
        <button
          type="button"
          onClick={() => nextCard('known')}
          className="rounded-[9px] border border-[rgba(5,150,105,0.22)] bg-[rgba(5,150,105,0.08)] px-4 py-2.5 text-[11px] font-semibold text-[#059669] transition hover:bg-[rgba(5,150,105,0.12)]"
        >
          Know it ({knownCount})
        </button>
      </div>
    </section>
  )
}

function FlashcardFace({ eyebrow, text, hint, back = false }) {
  return (
    <div
      className={`absolute inset-0 flex flex-col justify-center rounded-[14px] border border-[rgba(9,87,134,0.11)] p-6 shadow-[0_2px_12px_rgba(9,87,134,0.07)] [backface-visibility:hidden] ${
        back
          ? 'bg-[linear-gradient(135deg,rgba(9,87,134,0.06),rgba(9,87,134,0.02))] [transform:rotateY(180deg)]'
          : 'bg-white/80'
      }`}
    >
      <div className="mb-3 font-mono text-[8.5px] font-medium uppercase tracking-[0.16em] text-[#095786]">
        {eyebrow}
      </div>
      <p className="text-[15px] font-medium leading-7 text-[#0d1a24]">{text}</p>
      <p className="mt-3 text-[10px] italic text-[#7a93a8]">{hint}</p>
    </div>
  )
}

export default Flashcards
