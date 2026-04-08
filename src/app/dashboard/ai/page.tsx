import { AIChatPanel } from '@/components/ai/AIChatPanel'

export default function AIHelperPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-[var(--sb-muted)]">
          Tutor mode
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-[var(--foreground)] sm:text-3xl">
          AI study helper
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--sb-muted)]">
          Answers are generated on the server with Groq. Add{' '}
          <code className="rounded-md bg-white/5 px-1.5 py-0.5 font-mono text-xs text-[var(--foreground)] ring-1 ring-white/10">
            GROQ_API_KEY
          </code>{' '}
          in your environment to enable this feature.
        </p>
      </div>
      <AIChatPanel />
    </div>
  )
}
