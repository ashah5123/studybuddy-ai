'use client'

import { useState } from 'react'
import { AssignmentItem } from '@/components/assignments/AssignmentItem'
import type { Assignment } from '@/types/database.types'

const TABS = ['Assignments', 'Notes'] as const
type Tab = (typeof TABS)[number]

interface CourseDetailTabsProps {
  assignments: Assignment[]
}

export function CourseDetailTabs({ assignments }: CourseDetailTabsProps) {
  const [tab, setTab] = useState<Tab>('Assignments')
  // Local state to reflect optimistic toggles without a full refetch
  const [localAssignments, setLocalAssignments] = useState(assignments)

  function handleToggle(id: string, completed: boolean) {
    setLocalAssignments((prev) =>
      prev.map((a) => (a.id === id ? { ...a, completed } : a))
    )
  }

  return (
    <div className="rounded-xl border border-[var(--sb-border)] bg-[var(--sb-item-bg)]">
      {/* Tab bar */}
      <div className="flex border-b border-[var(--sb-border)] px-4">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              tab === t
                ? 'border-[var(--sb-accent-muted)] text-[var(--foreground)]'
                : 'border-transparent text-[var(--sb-muted)] hover:text-[var(--foreground)]'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="p-4">
        {tab === 'Assignments' && (
          <>
            {localAssignments.length === 0 ? (
              <p className="py-10 text-center text-sm text-[var(--sb-muted)]">
                No assignments for this course yet.
              </p>
            ) : (
              <div className="divide-y divide-[var(--sb-border)]">
                {localAssignments.map((a) => (
                  <AssignmentItem
                    key={a.id}
                    assignment={a}
                    onToggle={(completed) => handleToggle(a.id, completed)}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {tab === 'Notes' && (
          <p className="py-10 text-center text-sm text-[var(--sb-muted)]">
            Notes for this course will appear here.
          </p>
        )}
      </div>
    </div>
  )
}
