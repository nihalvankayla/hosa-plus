import Charts from '../components/charts/Charts.jsx'
import DashboardCards from '../components/dashboard/DashboardCards.jsx'
import Planner from '../components/planner/Planner.jsx'
import QuizSection from '../components/quiz/QuizSection.jsx'
import Flashcards from '../components/study/Flashcards.jsx'

function Dashboard() {
  return (
    <div className="space-y-5">
      <DashboardCards />

      <section className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <Flashcards />
        <QuizSection />
      </section>

      <section className="grid gap-5 2xl:grid-cols-[1fr_1fr]">
        <Planner />
        <Charts />
      </section>
    </div>
  )
}

export default Dashboard
