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
    <div className="rounded-xl border border-gray-200 bg-white">
      {/* Tab bar */}
      <div className="flex border-b border-gray-200 px-4">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              tab === t
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent text-gray-500 hover:text-gray-700'
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
              <p className="py-10 text-center text-sm text-gray-400">
                No assignments for this course yet.
              </p>
            ) : (
              <div className="divide-y divide-gray-50">
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
          <p className="py-10 text-center text-sm text-gray-400">
            Notes for this course will appear here.
          </p>
        )}
      </div>
    </div>
  )
}
