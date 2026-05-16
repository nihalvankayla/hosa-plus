import { projectInfo } from '../data/projectInfo.js'

function Resources() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">
          Resources
        </p>
        <h1 className="mt-2 text-3xl font-bold text-slate-900">Helpful Links</h1>
      </div>

      <div className="grid gap-4">
        {projectInfo.resources.map((resource) => (
          <a
            key={resource.title}
            href={resource.url}
            target="_blank"
            rel="noreferrer"
            className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition hover:border-teal-300 hover:shadow-md"
          >
            <h2 className="text-lg font-semibold text-slate-900">{resource.title}</h2>
            <p className="mt-2 text-slate-600">{resource.description}</p>
            <p className="mt-3 text-sm font-medium text-teal-700">{resource.url}</p>
          </a>
        ))}
      </div>
    </div>
  )
}

export default Resources
