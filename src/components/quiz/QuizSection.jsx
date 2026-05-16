import { useState } from 'react'
import { quizQuestions } from '../../data/hosaDashboardData.js'

function QuizSection({ questions = quizQuestions }) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState('')
  const [score, setScore] = useState(0)
  const [isFinished, setIsFinished] = useState(false)

  const question = questions[currentIndex]
  const isLocked = selectedAnswer.length > 0

  function chooseAnswer(option) {
    if (isLocked) return
    setSelectedAnswer(option)
    if (option === question.answer) {
      setScore(score + 1)
    }
  }

  function goNext() {
    if (currentIndex === questions.length - 1) {
      setIsFinished(true)
      return
    }

    setCurrentIndex(currentIndex + 1)
    setSelectedAnswer('')
  }

  function restartQuiz() {
    setCurrentIndex(0)
    setSelectedAnswer('')
    setScore(0)
    setIsFinished(false)
  }

  if (isFinished) {
    return (
      <section className="max-w-[700px] rounded-[14px] border border-[rgba(9,87,134,0.11)] bg-white/75 p-8 text-center shadow-[0_2px_12px_rgba(9,87,134,0.07)] backdrop-blur">
        <div className="font-mono text-[44px] font-medium text-[#095786]">
          {score}/{questions.length}
        </div>
        <p className="mb-5 mt-2 text-[13px] text-[#7a93a8]">Final score</p>
        <button
          type="button"
          onClick={restartQuiz}
          className="rounded-full bg-gradient-to-br from-[#095786] to-[#0d6fa8] px-5 py-2 text-[11.5px] font-semibold text-white shadow-[0_2px_10px_rgba(9,87,134,0.22)]"
        >
          Restart quiz
        </button>
      </section>
    )
  }

  return (
    <section className="max-w-[700px] rounded-[14px] border border-[rgba(9,87,134,0.11)] bg-white/75 p-5 shadow-[0_2px_12px_rgba(9,87,134,0.07)] backdrop-blur">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <span className="font-mono text-[11px] text-[#7a93a8]">
          Question {currentIndex + 1} / {questions.length}
        </span>
        <span className="font-mono text-[11px] text-[#059669]">Live score {score}</span>
        <span className="font-mono text-[11px] text-[#7a93a8]">02:00 practice pace</span>
      </div>

      <h2 className="mb-4 text-[15px] font-medium leading-7 text-[#0d1a24]">{question.question}</h2>

      <div className="space-y-2">
        {question.options.map((option, index) => (
          <QuizOption
            key={option}
            option={option}
            index={index}
            answer={question.answer}
            selectedAnswer={selectedAnswer}
            onChoose={chooseAnswer}
          />
        ))}
      </div>

      {isLocked && (
        <div className="my-4 rounded-[9px] border border-[rgba(9,87,134,0.15)] bg-[rgba(9,87,134,0.07)] p-4 text-[12.5px] leading-7 text-[#3a5267]">
          {question.explanation}
        </div>
      )}

      <button
        type="button"
        onClick={goNext}
        disabled={!isLocked}
        className="mt-2 rounded-full bg-gradient-to-br from-[#095786] to-[#0d6fa8] px-5 py-2 text-[11.5px] font-semibold text-white shadow-[0_2px_10px_rgba(9,87,134,0.22)] transition disabled:cursor-not-allowed disabled:opacity-45"
      >
        {currentIndex === questions.length - 1 ? 'Finish quiz' : 'Next question'}
      </button>
    </section>
  )
}

function QuizOption({ option, index, answer, selectedAnswer, onChoose }) {
  const isSelected = selectedAnswer === option
  const isCorrect = option === answer
  const showCorrect = selectedAnswer && isCorrect
  const showWrong = isSelected && !isCorrect
  const letters = ['A', 'B', 'C', 'D']

  const stateClass = showCorrect
    ? 'border-[rgba(5,150,105,0.25)] bg-[rgba(5,150,105,0.08)] text-[#065f46]'
    : showWrong
      ? 'border-[rgba(174,0,0,0.14)] bg-[rgba(174,0,0,0.06)] text-[#ae0000]'
      : 'border-[rgba(9,87,134,0.13)] bg-white/75 text-[#0d1a24] hover:border-[rgba(9,87,134,0.15)] hover:bg-[rgba(9,87,134,0.07)]'

  return (
    <button
      type="button"
      onClick={() => onChoose(option)}
      className={`flex w-full items-start gap-2.5 rounded-[9px] border px-3.5 py-3 text-left text-[13px] transition ${stateClass}`}
    >
      <span className="mt-0.5 min-w-4 font-mono text-[10px] font-medium text-[#7a93a8]">
        {letters[index]}
      </span>
      <span>{option}</span>
    </button>
  )
}

export default QuizSection
