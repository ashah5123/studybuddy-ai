'use client'

import { useCallback, useEffect, useState } from 'react'
import { endOfMonth, startOfMonth } from 'date-fns'
import { createClient } from '@/lib/supabase/client'
import type { ScheduleEvent } from '@/types/database.types'

interface UseScheduleEventsReturn {
  events: ScheduleEvent[]
  loading: boolean
  error: Error | null
  refetch: () => void
}

/** Loads events that overlap the visible month (for multi-day blocks). */
export function useScheduleEvents(viewDate: Date): UseScheduleEventsReturn {
  const [events, setEvents] = useState<ScheduleEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchEvents = useCallback(async () => {
    setLoading(true)
    setError(null)
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      setLoading(false)
      return
    }

    const rangeStart = startOfMonth(viewDate)
    const rangeEnd = endOfMonth(viewDate)

    const { data, error: queryError } = await supabase
      .from('schedule_events')
      .select('*')
      .eq('user_id', user.id)
      .gte('ends_at', rangeStart.toISOString())
      .lte('starts_at', rangeEnd.toISOString())
      .order('starts_at', { ascending: true })

    if (queryError) setError(new Error(queryError.message))
    else setEvents((data as ScheduleEvent[]) ?? [])
    setLoading(false)
  }, [viewDate])

  useEffect(() => {
    queueMicrotask(() => {
      void fetchEvents()
    })
  }, [fetchEvents])

  return { events, loading, error, refetch: fetchEvents }
}
