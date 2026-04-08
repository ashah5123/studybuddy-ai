'use client'

import { useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/types/database.types'

interface UseUserReturn {
  user: User | null
  profile: Profile | null
  loading: boolean
  error: Error | null
}

export function useUser(): UseUserReturn {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const supabase = createClient()

    async function loadUser(authUser: User | null) {
      setUser(authUser)

      if (!authUser) {
        setProfile(null)
        return
      }

      const { data, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single()

      if (profileError) {
        setError(new Error(profileError.message))
      } else {
        setProfile(data)
      }
    }

    // Initial load
    supabase.auth.getUser().then(({ data: { user: authUser }, error: authError }) => {
      if (authError) {
        setError(new Error(authError.message))
        setLoading(false)
        return
      }
      loadUser(authUser).finally(() => setLoading(false))
    })

    // Keep in sync with auth state changes (tab focus, token refresh, etc.)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      loadUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  return { user, profile, loading, error }
}
