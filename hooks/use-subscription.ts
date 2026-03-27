'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Plan } from '@/types'

export function useSubscription(userId: string | undefined) {
  const [plan, setPlan] = useState<Plan>('free')
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    if (!userId) {
      setLoading(false)
      return
    }

    supabase
      .from('profiles')
      .select('plan')
      .eq('id', userId)
      .single()
      .then(({ data }) => {
        setPlan((data?.plan as Plan) ?? 'free')
        setLoading(false)
      })
  }, [userId])

  return { plan, loading, isPro: plan === 'pro' }
}
