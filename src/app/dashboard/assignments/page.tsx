'use client'

import { useMemo, useState } from 'react'
import { Plus } from 'lucide-react'
import { useAssignments } from '@/hooks/useAssignments'
import { useCourses } from '@/hooks/useCourses'
import { AssignmentItem } from '@/components/assignments/AssignmentItem'
import { CreateAssignmentDialog } from '@/components/assignments/CreateAssignmentDialog'
import type { Assignment } from '@/types/database.types'

type TabKey = 'all' | 'pending' | 'completed' | 'overdue'

const TABS: { key: TabKey; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'completed', label: 'Completed' },
  { key: 'overdue', label: 'Overdue' },
]

function filterAssignments(assignments: Assignment[], tab: TabKey): Assignment[] {
  const now = Date.now()
  switch (tab) {
    case 'pending':
      return assignments.filter((a) => !a.completed)
    case 'completed':
      return assignments.filter((a) => a.completed)
    case 'overdue':
      return assignments.filter(
        (a) => !a.completed && a.due_date && new Date(a.due_date).getTime() < now
      )
    default:
      return assignments
  }
}

function SkeletonItem() {
  return (
    <div className="flex items-center gap-3 py-3 animate-pulse">
      <div className="h-5 w-5 rounded-full bg-gray-200 shrink-0" />
      <div className="flex-1 space-y-1.5">
        <div className="h-4 w-2/3 rounded bg-gray-200" />
        <div className="h-3 w-1/4 rounded bg-gray-200" />
      </div>
    </div>
  )
}

export default function AssignmentsPage() {
  const { assignments, loading, error, refetch } = useAssignments()
  const { courses } = useCourses()
  const [tab, setTab] = useState<TabKey>('all')
  const [search, setSearch] = useState('')
  const [createOpen, setCreateOpen] = useState(false)

  const filtered = useMemo(() => {
    let result = filterAssignments(assignments, tab)
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter((a) => a.title.toLowerCase().includes(q))
    }
    return result
  }, [assignments, tab, search])

  const tabCounts = useMemo(() => {
    // eslint-disable-next-line react-hooks/purity -- tab badge counts vs "now"
    const now = Date.now()
    return {
      all: assignments.length,
      pending: assignments.filter((a) => !a.completed).length,
      completed: assignments.filter((a) => a.completed).length,
      overdue: assignments.filter(
        (a) => !a.completed && a.due_date && new Date(a.due_date).getTime() < now
      ).length,
    }
  }, [assignments])

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--sb-muted)]">
            Due dates
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-[var(--foreground)] sm:text-3xl">
            Assignments
          </h1>
          <p className="mt-2 text-sm text-[var(--sb-muted)]">
            {assignments.length} total · {tabCounts.pending} pending
          </p>
        </div>
        <button
          onClick={() => setCreateOpen(true)}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-indigo-500/25 transition-all hover:brightness-105"
        >
          <Plus className="h-4 w-4" />
          New Assignment
        </button>
      </div>

      {/* Search + tabs */}
      <div className="sb-panel overflow-hidden">
        <div className="border-b border-slate-100 px-4">
          <div className="flex gap-1">
            {TABS.map(({ key, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => setTab(key)}
                className={`flex items-center gap-1.5 border-b-2 px-3 py-3 text-sm font-medium transition-colors ${
                  tab === key
                    ? 'border-indigo-600 text-indigo-700'
                    : 'border-transparent text-slate-500 hover:text-slate-800  '
                }`}
              >
                {label}
                <span
                  className={`rounded-full px-1.5 py-0.5 text-xs font-semibold tabular-nums ${
                    tab === key ? 'bg-indigo-100 text-indigo-800' : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {tabCounts[key]}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="p-4">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search assignments…"
            className="sb-input"
          />
        </div>

        {/* Error */}
        {error && (
          <div className="mx-4 mb-4 rounded-xl border border-red-200/90 bg-red-50 p-3 text-sm text-red-800">
            {error.message}
          </div>
        )}

        {/* List */}
        <div className="divide-y divide-slate-50 px-4 pb-4">
          {loading && [1, 2, 3].map((i) => <SkeletonItem key={i} />)}

          {!loading && filtered.length === 0 && (
            <p className="py-12 text-center text-sm text-slate-500">
              {search ? 'No assignments match your search.' : 'No assignments here.'}
            </p>
          )}

          {!loading &&
            filtered.map((a) => (
              <AssignmentItem key={a.id} assignment={a} onDeleted={refetch} />
            ))}
        </div>
      </div>

      <CreateAssignmentDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={refetch}
        courses={courses}
      />
    </div>
  )
}
