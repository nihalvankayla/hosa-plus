import { supabase } from './supabaseClient.js'

// Save user data (chat history, custom flashcards, planner tasks) to Supabase
export async function saveUserDataToAccount(userId, chatHistory, customFlashcards, plannerTasks) {
  if (!userId) return

  // Retrieve current profile row first to make sure we don't overwrite other fields (like role)
  let existingProfile = {}
  try {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    if (data) {
      existingProfile = data
    }
  } catch (e) {
    // Row might not exist yet
  }

  // Build the payload
  const currentNameData = existingProfile.name ? safeJsonParse(existingProfile.name) : {}
  
  const mergedData = {
    ...currentNameData,
    chatHistory: chatHistory !== undefined ? chatHistory : currentNameData.chatHistory || [],
    customFlashcards: customFlashcards !== undefined ? customFlashcards : currentNameData.customFlashcards || {},
    plannerTasks: plannerTasks !== undefined ? plannerTasks : currentNameData.plannerTasks || [],
  }

  const payload = {
    id: userId,
    name: JSON.stringify(mergedData),
    updated_at: new Date().toISOString()
  }

  // Keep local storage updated as a backup/cache
  if (typeof window !== 'undefined') {
    if (chatHistory !== undefined) {
      localStorage.setItem(`hosa-plus-aihub-chat:${userId}`, JSON.stringify(chatHistory))
    }
    if (customFlashcards !== undefined) {
      Object.keys(customFlashcards).forEach(eventId => {
        localStorage.setItem(`hosa-plus-custom-flashcards:${eventId}`, JSON.stringify(customFlashcards[eventId]))
      })
    }
    if (plannerTasks !== undefined) {
      localStorage.setItem(`hosa-plus-planner:${userId}`, JSON.stringify(plannerTasks))
    }
  }

  try {
    const { error } = await supabase
      .from('profiles')
      .upsert(payload, { onConflict: 'id' })
    if (error) {
      console.error('Error syncing user data to Supabase:', error)
    }
  } catch (err) {
    console.error('Supabase upsert failed:', err)
  }
}

// Load user data (chat history & custom flashcards map) from Supabase
export async function loadUserDataFromAccount(userId) {
  if (!userId) return null

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('name')
      .eq('id', userId)
      .single()

    if (error) {
      if (error.code !== 'PGRST116') { // PGRST116 is zero rows returned
        console.error('Error loading user data from Supabase:', error)
      }
      return null
    }

    if (data?.name) {
      const parsed = safeJsonParse(data.name)
      if (parsed) {
        // Sync back to local storage cache for performance
        if (typeof window !== 'undefined') {
          if (parsed.chatHistory) {
            localStorage.setItem(`hosa-plus-aihub-chat:${userId}`, JSON.stringify(parsed.chatHistory))
          }
          if (parsed.customFlashcards) {
            Object.keys(parsed.customFlashcards).forEach(eventId => {
              localStorage.setItem(`hosa-plus-custom-flashcards:${eventId}`, JSON.stringify(parsed.customFlashcards[eventId]))
            })
          }
          if (parsed.plannerTasks) {
            localStorage.setItem(`hosa-plus-planner:${userId}`, JSON.stringify(parsed.plannerTasks))
          }
        }
        return parsed
      }
    }
  } catch (err) {
    console.error('Failed to fetch user profile:', err)
  }
  return null
}

function safeJsonParse(str) {
  try {
    return JSON.parse(str)
  } catch (e) {
    return null
  }
}
