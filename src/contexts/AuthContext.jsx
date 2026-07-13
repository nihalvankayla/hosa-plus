import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabaseClient.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true

    supabase.auth.getSession().then(({ data }) => {
      if (!alive) return
      setSession(data.session)
      setLoading(false)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
      setLoading(false)
    })

    return () => {
      alive = false
      listener.subscription.unsubscribe()
    }
  }, [])

  // Auto-ensure profile row exists in database for directory and sync features
  useEffect(() => {
    if (session?.user) {
      const user = session.user
      const ensureProfile = async () => {
        try {
          // Use standard select instead of maybeSingle to avoid any potential schema/library compatibility issues
          const { data, error } = await supabase
            .from('profiles')
            .select('id, name')
            .eq('id', user.id)

          if (error) {
            console.warn('Error querying profile:', error.message)
            return
          }

          const hasProfile = data && data.length > 0

          if (!hasProfile) {
            console.log('No profile found. Creating profile for:', user.email)
            const initialData = {
              fullName: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Student',
              email: user.email,
              chatHistory: [],
              customFlashcards: {},
              plannerTasks: [],
              lastActive: new Date().toISOString()
            }
            const { error: insertError } = await supabase
              .from('profiles')
              .insert({
                id: user.id,
                name: JSON.stringify(initialData)
              })
            
            if (insertError) {
              console.warn('Error inserting profile:', insertError.message)
            } else {
              console.log('Profile created successfully for:', user.email)
            }
          } else {
            // Profile row exists, verify if we need to update email or lastActive
            const profileRow = data[0]
            let parsed = {}
            try { parsed = JSON.parse(profileRow.name) || {} } catch (e) {}

            const now = new Date().toISOString()
            const lastActiveTime = parsed.lastActive ? new Date(parsed.lastActive) : new Date(0)
            const minutesSinceActive = (new Date(now) - lastActiveTime) / 60000

            // Update if email is missing or last active was more than 5 minutes ago
            if (!parsed.email || parsed.email !== user.email || minutesSinceActive > 5) {
              const updatedData = {
                ...parsed,
                email: user.email,
                fullName: parsed.fullName || user.user_metadata?.full_name || 'Student',
                lastActive: now
              }
              const { error: updateError } = await supabase
                .from('profiles')
                .update({ name: JSON.stringify(updatedData) })
                .eq('id', user.id)
              
              if (updateError) {
                console.warn('Error updating profile active status:', updateError.message)
              }
            }
          }
        } catch (err) {
          console.error('Failed to ensure profile exists:', err)
        }
      }
      ensureProfile()
    }
  }, [session])

  const value = useMemo(
    () => ({
      session,
      user: session?.user ?? null,
      loading,
      signOut: () => supabase.auth.signOut(),
    }),
    [loading, session],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider')
  }
  return context
}
