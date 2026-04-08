'use client'

import { useCallback, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Assignment } from '@/types/database.types'

interface AssignmentFilters {
  courseId?: string
  completed?: boolean
}

interface UseAssignmentsReturn {
  assignments: Assignment[]
  loading: boolean
  error: Error | null
  refetch: () => void
}

export function useAssignments(
  filters: AssignmentFilters = {}
): UseAssignmentsReturn {
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchAssignments = useCallback(async () => {
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

    let query = supabase
      .from('assignments')
      .select('*')
      .eq('user_id', user.id)
      .order('due_date', { ascending: true, nullsFirst: false })

    if (filters.courseId) query = query.eq('course_id', filters.courseId)
    if (filters.completed !== undefined)
      query = query.eq('completed', filters.completed)

    const { data, error: queryError } = await query
    if (queryError) setError(new Error(queryError.message))
    else setAssignments(data ?? [])
    setLoading(false)
  }, [filters.courseId, filters.completed]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchAssignments()
  }, [fetchAssignments])

  return { assignments, loading, error, refetch: fetchAssignments }
}
