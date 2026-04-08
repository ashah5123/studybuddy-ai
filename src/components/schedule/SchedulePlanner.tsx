'use client'

import { useMemo, useState } from 'react'
import {
  addMonths,
  eachDayOfInterval,
  endOfDay,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from 'date-fns'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { useCourses } from '@/hooks/useCourses'
import { useScheduleEvents } from '@/hooks/useScheduleEvents'
import { ScheduleEventDialog } from '@/components/schedule/ScheduleEventDialog'
import type { ScheduleEvent } from '@/types/database.types'

const WEEK_STARTS_ON = 0 as const
const WEEK_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function overlapsDay(ev: ScheduleEvent, day: Date): boolean {
  const d0 = startOfDay(day)
  const d1 = endOfDay(day)
  const s = new Date(ev.starts_at).getTime()
  const e = new Date(ev.ends_at).getTime()
  return s <= d1.getTime() && e >= d0.getTime()
}

function eventsForDay(events: ScheduleEvent[], day: Date): ScheduleEvent[] {
  return events
    .filter((ev) => overlapsDay(ev, day))
    .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime())
}

export function SchedulePlanner() {
  const [viewDate, setViewDate] = useState(() => new Date())
  const [selectedDay, setSelectedDay] = useState(() => new Date())
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<ScheduleEvent | null>(null)
  const [anchorDay, setAnchorDay] = useState(() => new Date())

  const { events, loading, error, refetch } = useScheduleEvents(viewDate)
  const { courses } = useCourses()

  const monthStart = startOfMonth(viewDate)
  const monthEnd = endOfMonth(viewDate)
  const gridStart = startOfWeek(monthStart, { weekStartsOn: WEEK_STARTS_ON })
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: WEEK_STARTS_ON })
  const gridDays = eachDayOfInterval({ start: gridStart, end: gridEnd })

  const selectedDayEvents = useMemo(
    () => eventsForDay(events, selectedDay),
    [events, selectedDay]
  )

  function goPrevMonth() {
    setViewDate((d) => addMonths(d, -1))
  }

  function goNextMonth() {
    setViewDate((d) => addMonths(d, 1))
  }

  function openCreate(day: Date) {
    setAnchorDay(day)
    setSelectedDay(day)
    setEditing(null)
    setDialogOpen(true)
  }

  function openEdit(ev: ScheduleEvent) {
    setEditing(ev)
    setAnchorDay(new Date(ev.starts_at))
    setSelectedDay(new Date(ev.starts_at))
    setDialogOpen(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={goPrevMonth}
            className="rounded-xl border border-slate-200 bg-white p-2 text-slate-600 shadow-sm hover:bg-slate-50"
            aria-label="Previous month"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <h2 className="min-w-[200px] text-center text-lg font-semibold text-slate-900 tabular-nums sm:text-xl">
            {format(viewDate, 'MMMM yyyy')}
          </h2>
          <button
            type="button"
            onClick={goNextMonth}
            className="rounded-xl border border-slate-200 bg-white p-2 text-slate-600 shadow-sm hover:bg-slate-50"
            aria-label="Next month"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => setViewDate(new Date())}
            className="ml-1 rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs font-semibold text-indigo-800 hover:bg-indigo-100"
          >
            Today
          </button>
        </div>
        <button
          type="button"
          onClick={() => openCreate(selectedDay)}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-indigo-500/25 transition-all hover:brightness-105"
        >
          <Plus className="h-4 w-4" />
          Add block
        </button>
      </div>

      {error && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error.message}
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="sb-panel overflow-hidden p-3 sm:p-4">
          <div className="mb-2 grid grid-cols-7 gap-1 text-center text-[11px] font-semibold uppercase tracking-wide text-slate-500 sm:text-xs">
            {WEEK_LABELS.map((d) => (
              <div key={d} className="py-2">
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {gridDays.map((day) => {
              const inMonth = isSameMonth(day, viewDate)
              const dayEvents = eventsForDay(events, day)
              const isSelected = isSameDay(day, selectedDay)
              const showToday = isToday(day)

              return (
                <div
                  key={day.toISOString()}
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelectedDay(day)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      setSelectedDay(day)
                    }
                  }}
                  className={`group flex min-h-[88px] flex-col rounded-xl border p-1.5 text-left transition-colors sm:min-h-[100px] sm:p-2 ${
                    inMonth
                      ? 'cursor-pointer border-slate-100 bg-white hover:border-indigo-200/80 hover:bg-indigo-50/40'
                      : 'cursor-pointer border-transparent bg-slate-50/60 text-slate-400 hover:bg-slate-100/80'
                  } ${isSelected ? 'ring-2 ring-indigo-400 ring-offset-1' : ''} `}
                >
                  <div className="mb-1 flex items-start justify-between gap-1">
                    <span
                      className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs font-semibold tabular-nums sm:h-8 sm:w-8 sm:text-sm ${
                        showToday
                          ? 'bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-sm'
                          : inMonth
                            ? 'text-slate-800'
                            : 'text-slate-400'
                      }`}
                    >
                      {format(day, 'd')}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedDay(day)
                        openCreate(day)
                      }}
                      className="rounded-md p-0.5 text-slate-400 opacity-0 transition-opacity hover:bg-white/80 hover:text-indigo-600 group-hover:opacity-100"
                      aria-label={`Add block on ${format(day, 'MMM d')}`}
                    >
                      <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    </button>
                  </div>
                  <div className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-hidden">
                    {dayEvents.slice(0, 3).map((ev) => (
                      <button
                        key={ev.id}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedDay(day)
                          openEdit(ev)
                        }}
                        className="truncate rounded-md px-1 py-0.5 text-left text-[10px] font-medium text-white shadow-sm sm:text-[11px]"
                        style={{ backgroundColor: ev.color }}
                        title={ev.title}
                      >
                        {ev.title}
                      </button>
                    ))}
                    {dayEvents.length > 3 && (
                      <span className="text-[10px] font-medium text-slate-500">
                        +{dayEvents.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {loading && (
            <p className="mt-3 text-center text-xs text-slate-500">Loading schedule…</p>
          )}
        </div>

        <div className="sb-panel flex flex-col p-4 sm:p-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-indigo-600/90">
            Selected day
          </p>
          <h3 className="mt-1 text-lg font-bold text-slate-900">
            {format(selectedDay, 'EEEE, MMM d')}
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            Click a day on the grid to add a block, or tap a colored label to edit.
          </p>

          <div className="mt-4 flex-1 space-y-2 overflow-y-auto">
            {selectedDayEvents.length === 0 ? (
              <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50/80 px-4 py-8 text-center text-sm text-slate-500">
                Nothing scheduled — add a study block or class.
              </p>
            ) : (
              selectedDayEvents.map((ev) => (
                <button
                  key={ev.id}
                  type="button"
                  onClick={() => openEdit(ev)}
                  className="w-full rounded-xl border border-slate-100 bg-white p-3 text-left shadow-sm transition-colors hover:border-indigo-200 hover:bg-indigo-50/50"
                >
                  <div className="flex items-start gap-3">
                    <span
                      className="mt-0.5 h-10 w-1.5 shrink-0 rounded-full"
                      style={{ backgroundColor: ev.color }}
                      aria-hidden
                    />
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-slate-900">{ev.title}</p>
                      <p className="text-xs text-slate-500">
                        {format(new Date(ev.starts_at), 'p')} –{' '}
                        {format(new Date(ev.ends_at), 'p')}
                      </p>
                      {ev.description && (
                        <p className="mt-1 line-clamp-2 text-sm text-slate-600">{ev.description}</p>
                      )}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      </div>

      <ScheduleEventDialog
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false)
          setEditing(null)
        }}
        anchorDay={anchorDay}
        editing={editing}
        courses={courses}
        onSaved={() => void refetch()}
      />
    </div>
  )
}
