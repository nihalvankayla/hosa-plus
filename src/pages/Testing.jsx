import QuizSection from '../components/quiz/QuizSection.jsx'

function Testing() {
  return (
    <div className="space-y-5">
      <header>
        <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-[#095786]">
          Testing
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-[-0.02em] text-[#0d1a24]">
          Practice Quiz
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[#3a5267]">
          Answer one question at a time, then review the explanation before moving on.
        </p>
      </header>
      <QuizSection />
    </div>
  )
}

export default Testing
