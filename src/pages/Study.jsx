import Flashcards from '../components/study/Flashcards.jsx'

function Study() {
  return (
    <PageShell
      eyebrow="Study Suite"
      title="Flashcard Review"
      description="Practice focused HOSA topics with a lightweight flip-card deck."
    >
      <Flashcards />
    </PageShell>
  )
}

function PageShell({ eyebrow, title, description, children }) {
  return (
    <div className="space-y-5">
      <header>
        <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-[#095786]">
          {eyebrow}
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-[-0.02em] text-[#0d1a24]">
          {title}
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[#3a5267]">{description}</p>
      </header>
      {children}
    </div>
  )
}

export default Study
