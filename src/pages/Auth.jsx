import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext.jsx'
import { supabase } from '../lib/supabaseClient.js'

function Auth() {
  const { user, loading } = useAuth()
  const [mode, setMode] = useState('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [status, setStatus] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (!loading && user) {
    return <Navigate to="/dashboard" replace />
  }

  const isSignup = mode === 'signup'

  async function handleSubmit(event) {
    event.preventDefault()
    setSubmitting(true)
    setStatus('')

    const { error } = isSignup
      ? await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
            },
          },
        })
      : await supabase.auth.signInWithPassword({ email, password })

    setSubmitting(false)

    if (error) {
      setStatus(error.message)
      return
    }

    setStatus(isSignup ? 'Account created. Check your email if confirmation is enabled.' : 'Signed in.')
  }

  return (
    <main className="min-h-screen bg-[#f5f2eb] px-4 py-8 text-[#15191d]">
      <section className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-5xl items-center gap-8 md:grid-cols-[1fr_390px]">
        <div>
          <div className="font-mono text-xs font-semibold uppercase tracking-[0.16em] text-[#095786]">HOSA+</div>
          <h1 className="mt-4 max-w-2xl text-5xl font-bold leading-[1.02] tracking-normal sm:text-6xl">
            Your chapter command center, now with student accounts.
          </h1>
          <p className="mt-5 max-w-xl text-sm leading-7 text-[#5e6872]">
            Sign in to keep each student&apos;s study progress, planner, and testing practice separate.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-lg border border-[#d9d3c6] bg-white/80 p-6 shadow-[0_16px_50px_rgba(31,38,45,0.12)]"
        >
          <div className="mb-5 flex rounded-md border border-[#d9d3c6] bg-[#faf8f4] p-1">
            <button
              type="button"
              className={`flex-1 rounded px-3 py-2 text-sm font-semibold ${!isSignup ? 'bg-[#095786] text-white' : 'text-[#5e6872]'}`}
              onClick={() => setMode('signin')}
            >
              Log in
            </button>
            <button
              type="button"
              className={`flex-1 rounded px-3 py-2 text-sm font-semibold ${isSignup ? 'bg-[#095786] text-white' : 'text-[#5e6872]'}`}
              onClick={() => setMode('signup')}
            >
              Sign up
            </button>
          </div>

          {isSignup && (
            <label className="mb-4 block">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-[#66717c]">Name</span>
              <input
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                className="w-full rounded-md border border-[#d9d3c6] bg-white px-3 py-3 text-sm outline-none focus:border-[#095786]"
                placeholder="Student name"
                required
              />
            </label>
          )}

          <label className="mb-4 block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-[#66717c]">Email</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-md border border-[#d9d3c6] bg-white px-3 py-3 text-sm outline-none focus:border-[#095786]"
              placeholder="student@school.org"
              required
            />
          </label>

          <label className="mb-5 block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-[#66717c]">Password</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-md border border-[#d9d3c6] bg-white px-3 py-3 text-sm outline-none focus:border-[#095786]"
              placeholder="At least 6 characters"
              minLength={6}
              required
            />
          </label>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-md bg-[#ae0000] px-4 py-3 text-sm font-bold text-white shadow-[0_8px_20px_rgba(174,0,0,0.22)] disabled:opacity-60"
          >
            {submitting ? 'Working...' : isSignup ? 'Create account' : 'Log in'}
          </button>

          {status && <p className="mt-4 text-sm leading-6 text-[#5e6872]">{status}</p>}
        </form>
      </section>
    </main>
  )
}

export default Auth
