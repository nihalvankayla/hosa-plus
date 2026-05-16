import InfoCard from '../components/InfoCard.jsx'
import { projectInfo } from '../data/projectInfo.js'

function Home() {
  return (
    <div className="space-y-8">
      <section className="rounded-lg bg-teal-700 px-6 py-12 text-white shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wide text-teal-100">
          HOSA Project Starter
        </p>
        <h1 className="mt-3 max-w-3xl text-4xl font-bold sm:text-5xl">
          {projectInfo.name}
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-teal-50">{projectInfo.tagline}</p>
      </section>

      <div className="grid gap-5 md:grid-cols-2">
        <InfoCard title="Project Overview">
          <p>{projectInfo.overview}</p>
        </InfoCard>

        <InfoCard title="What To Edit First">
          <p>
            Update <span className="font-semibold">src/data/projectInfo.js</span> with
            your real topic, goals, and links.
          </p>
        </InfoCard>
      </div>
    </div>
  )
}

export default Home
