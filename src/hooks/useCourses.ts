'use client'

import { useCallback, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Course } from '@/types/database.types'

interface UseCoursesReturn {
  courses: Course[]
  loading: boolean
  error: Error | null
  refetch: () => void
}

export function useCourses(): UseCoursesReturn {
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchCourses = useCallback(async () => {
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

    const { data, error: queryError } = await supabase
      .from('courses')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (queryError) setError(new Error(queryError.message))
    else setCourses(data ?? [])
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchCourses()
  }, [fetchCourses])

  return { courses, loading, error, refetch: fetchCourses }
}
