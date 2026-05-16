import InfoCard from '../components/InfoCard.jsx'
import { projectInfo } from '../data/projectInfo.js'

function About() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">
          About
        </p>
        <h1 className="mt-2 text-3xl font-bold text-slate-900">Project Goals</h1>
      </div>

      <InfoCard title="Goals">
        <ul className="list-disc space-y-2 pl-5">
          {projectInfo.goals.map((goal) => (
            <li key={goal}>{goal}</li>
          ))}
        </ul>
      </InfoCard>
    </div>
  )
}

export default About
