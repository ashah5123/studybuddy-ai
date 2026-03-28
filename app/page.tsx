import Link from 'next/link'
import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

// ────────────────────────────────────────────────────────────
// Shared icon primitives
// ────────────────────────────────────────────────────────────

function BookIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </svg>
  )
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M20 6 9 17l-5-5" />
    </svg>
  )
}

function ChevronDownIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="m6 9 6 6 6-6" />
    </svg>
  )
}

// ────────────────────────────────────────────────────────────
// Navbar
// ────────────────────────────────────────────────────────────

function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="flex size-8 items-center justify-center rounded-lg bg-indigo-600 transition-opacity group-hover:opacity-90">
            <BookIcon className="size-4 text-white" />
          </div>
          <span className="text-lg font-semibold tracking-tight">StudyBuddy</span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          <Link href="#features" className="text-sm text-muted-foreground transition-colors hover:text-foreground">Features</Link>
          <Link href="#pricing" className="text-sm text-muted-foreground transition-colors hover:text-foreground">Pricing</Link>
          <Link href="#faq" className="text-sm text-muted-foreground transition-colors hover:text-foreground">FAQ</Link>
        </nav>

        <div className="flex items-center gap-3">
          <Link href="/login" className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), 'hidden sm:inline-flex')}>
            Log in
          </Link>
          <Link href="/signup" className={cn(buttonVariants({ size: 'sm' }), 'bg-indigo-600 text-white hover:bg-indigo-700 h-9 px-4')}>
            Get started
          </Link>
        </div>
      </div>
    </header>
  )
}

// ────────────────────────────────────────────────────────────
// Hero
// ────────────────────────────────────────────────────────────

function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-indigo-50/70 via-background to-background pb-20 pt-20 dark:from-indigo-950/25 dark:via-background dark:to-background">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-0 h-[600px] w-[900px] -translate-x-1/2 rounded-full bg-gradient-to-b from-indigo-400/10 to-transparent blur-3xl dark:from-indigo-600/15" />
      </div>

      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-6 inline-flex items-center rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 dark:border-indigo-800 dark:bg-indigo-950/60">
            <span className="text-xs font-medium text-indigo-700 dark:text-indigo-300">✦ Used by 10,000+ students every day</span>
          </div>

          <h1 className="text-balance text-5xl font-bold tracking-tight text-foreground sm:text-6xl lg:text-7xl">
            Get unstuck on{' '}
            <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent dark:from-indigo-400 dark:to-violet-400">
              any homework
            </span>{' '}
            in seconds
          </h1>

          <p className="mt-6 text-balance text-lg text-muted-foreground sm:text-xl">
            Your personal tutor that teaches you step by step&nbsp;—&nbsp;not just hands you the answer.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/signup" className={cn(buttonVariants({ size: 'lg' }), 'h-12 bg-indigo-600 px-8 text-base text-white hover:bg-indigo-700')}>
              Start for free
            </Link>
            <Link href="#how-it-works" className={cn(buttonVariants({ variant: 'outline', size: 'lg' }), 'h-12 px-8 text-base')}>
              See how it works
            </Link>
          </div>

          <p className="mt-4 text-xs text-muted-foreground">No credit card required · 5 free questions per day</p>
        </div>

        {/* Mock UI */}
        <div className="relative mx-auto mt-16 max-w-5xl">
          <div className="pointer-events-none absolute -inset-4 -z-10 rounded-3xl bg-gradient-to-r from-indigo-500/15 to-violet-500/15 blur-2xl" />
          <div className="overflow-hidden rounded-2xl border border-border/80 shadow-2xl dark:shadow-black/40">
            {/* Browser chrome */}
            <div className="flex items-center gap-3 border-b border-border bg-muted/80 px-4 py-3">
              <div className="flex gap-1.5">
                <div className="size-3 rounded-full bg-rose-400/80" />
                <div className="size-3 rounded-full bg-amber-400/80" />
                <div className="size-3 rounded-full bg-emerald-400/80" />
              </div>
              <div className="flex-1">
                <div className="mx-auto flex h-6 max-w-52 items-center justify-center rounded-md bg-background/70 px-3">
                  <span className="text-xs text-muted-foreground">studybuddy.app/ask</span>
                </div>
              </div>
            </div>

            {/* App content */}
            <div className="grid bg-background sm:grid-cols-[1fr_1.3fr]">
              {/* Left panel — question input */}
              <div className="border-b border-border p-5 sm:border-b-0 sm:border-r">
                <div className="mb-3 flex flex-wrap gap-1.5">
                  {['Math', 'Science', 'Coding'].map((s) => (
                    <span key={s} className={cn('rounded-full px-3 py-1 text-xs font-medium', s === 'Math' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-300' : 'bg-muted text-muted-foreground')}>
                      {s}
                    </span>
                  ))}
                  <span className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">+ more</span>
                </div>

                <div className="rounded-xl border border-border bg-muted/30 p-3 text-sm leading-relaxed text-foreground/80">
                  Solve the quadratic equation: x² − 5x + 6 = 0. Show all working.
                </div>

                <div className="mt-3 flex items-center gap-2">
                  <div className="flex h-8 cursor-default items-center gap-1.5 rounded-lg border border-border px-2.5 text-xs text-muted-foreground">
                    <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66L9.41 17.41a2 2 0 0 1-2.83-2.83l8.49-8.49" /></svg>
                    Attach photo
                  </div>
                  <div className="ml-auto flex h-8 cursor-default items-center rounded-lg bg-indigo-600 px-3 text-xs font-medium text-white">
                    Ask →
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-2 rounded-lg bg-amber-50 p-2 dark:bg-amber-950/30">
                  <span className="text-sm">🔥</span>
                  <span className="text-xs font-medium text-amber-700 dark:text-amber-400">7-day streak</span>
                  <span className="ml-auto text-xs text-muted-foreground">Keep it up!</span>
                </div>
              </div>

              {/* Right panel — answer */}
              <div className="p-5">
                <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Step-by-step explanation</p>
                <div className="space-y-3 text-sm">
                  {[
                    { n: 1, title: 'Identify the standard form', body: 'This is in ax² + bx + c = 0, where a=1, b=−5, c=6.', code: null },
                    { n: 2, title: 'Factor the quadratic', body: 'Find two numbers that multiply to 6 and add to −5. Those are −2 and −3.', code: '(x − 2)(x − 3) = 0' },
                    { n: 3, title: 'Apply zero-product property', body: 'Set each factor equal to zero and solve independently.', code: 'x = 2   |   x = 3' },
                  ].map(({ n, title, body, code }) => (
                    <div key={n} className="flex gap-3">
                      <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-300">{n}</span>
                      <div className="min-w-0">
                        <p className="font-medium">{title}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">{body}</p>
                        {code && <div className="mt-1.5 rounded bg-muted px-2 py-1 font-mono text-xs">{code}</div>}
                      </div>
                    </div>
                  ))}

                  <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-2.5 dark:border-emerald-800 dark:bg-emerald-950/30">
                    <div className="flex items-center gap-1.5">
                      <CheckIcon className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">x = 2 and x = 3</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 p-2.5">
                    <span className="text-xs text-foreground/70">Ready to test yourself?</span>
                    <span className="ml-auto cursor-default rounded-md bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-300">Take quiz →</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ────────────────────────────────────────────────────────────
// How it works
// ────────────────────────────────────────────────────────────

const STEPS = [
  {
    num: '01',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="size-7">
        <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
      </svg>
    ),
    title: 'Ask your question or upload a photo',
    body: 'Type your question or snap a photo of any printed problem — diagrams, equations, or entire worksheets.',
  },
  {
    num: '02',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="size-7">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" />
      </svg>
    ),
    title: 'Get a clear, step-by-step explanation',
    body: 'Every answer breaks the concept down into numbered steps tailored to your subject and grade level.',
  },
  {
    num: '03',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="size-7">
        <path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
      </svg>
    ),
    title: 'Take a quiz to lock in the concept',
    body: 'After every explanation, a short quiz checks that you actually understood it — not just read it.',
  },
]

function HowItWorks() {
  return (
    <section id="how-it-works" className="scroll-mt-20 bg-background py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <Badge variant="outline" className="mb-4">How it works</Badge>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">From confused to confident in three steps</h2>
          <p className="mt-4 text-muted-foreground">No fluff, no copy-paste answers. Just genuine understanding.</p>
        </div>

        <div className="relative grid gap-8 md:grid-cols-3">
          {/* Connecting line */}
          <div className="pointer-events-none absolute left-0 right-0 top-10 hidden h-px bg-gradient-to-r from-transparent via-border to-transparent md:block" />

          {STEPS.map(({ num, icon, title, body }) => (
            <div key={num} className="relative flex flex-col items-center text-center">
              <div className="relative mb-6 flex size-20 items-center justify-center rounded-2xl border border-border bg-background shadow-sm">
                <div className="text-indigo-600 dark:text-indigo-400">{icon}</div>
                <span className="absolute -right-2 -top-2 flex size-6 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-bold text-white">{num}</span>
              </div>
              <h3 className="text-lg font-semibold">{title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ────────────────────────────────────────────────────────────
// Subjects
// ────────────────────────────────────────────────────────────

const SUBJECTS = [
  {
    label: 'Math',
    color: 'bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400',
    ring: 'hover:ring-blue-200 dark:hover:ring-blue-800',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="size-8">
        <line x1="19" y1="5" x2="5" y2="19" /><circle cx="6.5" cy="6.5" r="2.5" /><circle cx="17.5" cy="17.5" r="2.5" />
      </svg>
    ),
    desc: 'Algebra, Calculus, Geometry & more',
  },
  {
    label: 'Science',
    color: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400',
    ring: 'hover:ring-emerald-200 dark:hover:ring-emerald-800',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="size-8">
        <path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v11m0 0a6 6 0 0 0 6 6m-6-6h10m-10 0v-1m10 1a6 6 0 0 1-6 6m6-6v-1" />
      </svg>
    ),
    desc: 'Biology, Chemistry, Physics',
  },
  {
    label: 'Coding',
    color: 'bg-violet-50 text-violet-600 dark:bg-violet-950/40 dark:text-violet-400',
    ring: 'hover:ring-violet-200 dark:hover:ring-violet-800',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="size-8">
        <polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" />
      </svg>
    ),
    desc: 'Python, JavaScript, Java & more',
  },
  {
    label: 'History',
    color: 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400',
    ring: 'hover:ring-amber-200 dark:hover:ring-amber-800',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="size-8">
        <path d="M12 8v4l3 3m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" />
      </svg>
    ),
    desc: 'World History, US History, Civics',
  },
  {
    label: 'English',
    color: 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400',
    ring: 'hover:ring-rose-200 dark:hover:ring-rose-800',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="size-8">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      </svg>
    ),
    desc: 'Literature, Grammar, Essay writing',
  },
  {
    label: 'And more',
    color: 'bg-slate-50 text-slate-600 dark:bg-slate-800/40 dark:text-slate-400',
    ring: 'hover:ring-slate-200 dark:hover:ring-slate-700',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="size-8">
        <circle cx="12" cy="12" r="10" /><path d="M12 8v4" /><path d="M12 16h.01" />
      </svg>
    ),
    desc: 'Economics, Psychology, Music & more',
  },
]

function Subjects() {
  return (
    <section className="bg-muted/30 py-24 dark:bg-muted/10">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <Badge variant="outline" className="mb-4">Subjects</Badge>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Whatever you&apos;re studying, we&apos;ve got you</h2>
          <p className="mt-4 text-muted-foreground">Every subject gets a tutor personality built specifically for how that subject is taught.</p>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {SUBJECTS.map(({ label, color, ring, icon, desc }) => (
            <Card key={label} className={cn('cursor-default transition-all duration-200 hover:shadow-md hover:ring-2', ring)}>
              <CardContent className="flex flex-col items-center gap-3 py-6 text-center">
                <div className={cn('flex size-14 items-center justify-center rounded-2xl', color)}>{icon}</div>
                <div>
                  <p className="font-semibold">{label}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{desc}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}

// ────────────────────────────────────────────────────────────
// Features
// ────────────────────────────────────────────────────────────

const FEATURES = [
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="size-6">
        <rect width="18" height="18" x="3" y="3" rx="2" ry="2" /><circle cx="9" cy="9" r="2" /><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
      </svg>
    ),
    title: 'Photo upload',
    body: 'Stuck on a printed problem or diagram? Snap a photo and get an instant, detailed explanation.',
    accent: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-400',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="size-6">
        <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
      </svg>
    ),
    title: 'Step-by-step explanations',
    body: 'Every answer walks you through the reasoning so you understand the concept, not just the answer.',
    accent: 'bg-violet-100 text-violet-600 dark:bg-violet-900/50 dark:text-violet-400',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="size-6">
        <path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
      </svg>
    ),
    title: 'Auto-generated quizzes',
    body: 'After every explanation, get a tailored 3-question quiz to test whether you actually understood it.',
    accent: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/50 dark:text-emerald-400',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="size-6">
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
      </svg>
    ),
    title: 'Study streak tracking',
    body: 'Build a daily study habit. Your streak grows every day you ask at least one question.',
    accent: 'bg-amber-100 text-amber-600 dark:bg-amber-900/50 dark:text-amber-400',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="size-6">
        <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
      </svg>
    ),
    title: 'Smart question history',
    body: 'Every past question is saved and searchable. If you ask something similar, you get the answer instantly.',
    accent: 'bg-rose-100 text-rose-600 dark:bg-rose-900/50 dark:text-rose-400',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="size-6">
        <circle cx="12" cy="12" r="10" /><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
      </svg>
    ),
    title: 'Works for every subject',
    body: 'Math, Science, Coding, History, English — each subject has a tutor voice crafted for how it&apos;s taught.',
    accent: 'bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400',
  },
]

function Features() {
  return (
    <section id="features" className="scroll-mt-20 bg-background py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <Badge variant="outline" className="mb-4">Features</Badge>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Everything you need to actually learn</h2>
          <p className="mt-4 text-muted-foreground">Built for students who want to understand, not just get through the assignment.</p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ icon, title, body, accent }) => (
            <Card key={title} className="transition-shadow hover:shadow-md">
              <CardHeader>
                <div className={cn('mb-2 flex size-11 items-center justify-center rounded-xl', accent)}>{icon}</div>
                <CardTitle className="text-base">{title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{body}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}

// ────────────────────────────────────────────────────────────
// Testimonials
// ────────────────────────────────────────────────────────────

const TESTIMONIALS = [
  {
    quote: "I went from a C to a B+ in calculus in one month. It actually explains the steps instead of just handing me the answer. My teacher noticed the difference.",
    name: 'Maya R.',
    role: 'Grade 11 · AP Calculus',
    initials: 'MR',
    color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-300',
    stars: 5,
  },
  {
    quote: "I photographed my entire chemistry lab worksheet and got a clear breakdown of every single problem. Worth every penny of the Pro plan, no question.",
    name: 'Aiden K.',
    role: 'College Freshman · Chem 101',
    initials: 'AK',
    color: 'bg-violet-100 text-violet-700 dark:bg-violet-900/60 dark:text-violet-300',
    stars: 5,
  },
  {
    quote: "The quizzes at the end are a total game changer. I actually remember what I studied now instead of just reading through answers and forgetting it all.",
    name: 'Priya S.',
    role: 'Grade 9 · Biology',
    initials: 'PS',
    color: 'bg-rose-100 text-rose-700 dark:bg-rose-900/60 dark:text-rose-300',
    stars: 5,
  },
]

function Stars({ n }: { n: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: n }).map((_, i) => (
        <svg key={i} viewBox="0 0 24 24" className="size-4 fill-amber-400 text-amber-400">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      ))}
    </div>
  )
}

function Testimonials() {
  return (
    <section className="bg-gradient-to-b from-muted/30 to-background py-24 dark:from-muted/10">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <Badge variant="outline" className="mb-4">Testimonials</Badge>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Students are acing their classes</h2>
          <p className="mt-4 text-muted-foreground">Real feedback from real students. No fabricated results.</p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {TESTIMONIALS.map(({ quote, name, role, initials, color, stars }) => (
            <Card key={name} className="flex flex-col justify-between transition-shadow hover:shadow-md">
              <CardContent className="pt-6">
                <Stars n={stars} />
                <blockquote className="mt-4 text-sm leading-relaxed text-foreground/80">&ldquo;{quote}&rdquo;</blockquote>
              </CardContent>
              <CardFooter className="gap-3">
                <div className={cn('flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold', color)}>
                  {initials}
                </div>
                <div>
                  <p className="text-sm font-semibold">{name}</p>
                  <p className="text-xs text-muted-foreground">{role}</p>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}

// ────────────────────────────────────────────────────────────
// Pricing
// ────────────────────────────────────────────────────────────

const PLANS = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    description: 'Perfect for giving it a try.',
    cta: 'Get started free',
    href: '/signup',
    popular: false,
    features: [
      '5 questions per day',
      'Text-only input',
      'Basic step-by-step explanations',
      '3 subjects',
      '7-day question history',
      'Community support',
    ],
  },
  {
    name: 'Pro',
    price: '$9',
    period: 'per month',
    description: 'For students who are serious about their grades.',
    cta: 'Start Pro free for 7 days',
    href: '/signup?plan=pro',
    popular: true,
    features: [
      'Unlimited questions',
      'Photo & image upload',
      'Auto-generated quizzes',
      'All subjects',
      'Study streak tracking',
      'Full question history & search',
      'Priority support',
    ],
  },
  {
    name: 'Family',
    price: '$19',
    period: 'per month',
    description: 'Pro features for the whole household.',
    cta: 'Get Family plan',
    href: '/signup?plan=family',
    popular: false,
    features: [
      '3 student accounts',
      'All Pro features',
      'Parent dashboard',
      'Weekly progress reports',
      'Per-child subject tracking',
      'Priority support',
    ],
  },
]

function Pricing() {
  return (
    <section id="pricing" className="scroll-mt-20 bg-background py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <Badge variant="outline" className="mb-4">Pricing</Badge>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Simple, honest pricing</h2>
          <p className="mt-4 text-muted-foreground">No hidden fees. Cancel any time. Start free — no credit card required.</p>
        </div>

        <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-3 lg:items-start">
          {PLANS.map(({ name, price, period, description, cta, href, popular, features }) => (
            <div key={name} className={cn('relative flex flex-col', popular && 'lg:-mt-4')}>
              {popular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center rounded-full bg-indigo-600 px-3 py-1 text-xs font-semibold text-white shadow-sm">
                    Most popular
                  </span>
                </div>
              )}
              <Card className={cn('flex h-full flex-col', popular && 'ring-2 ring-indigo-500 dark:ring-indigo-400 shadow-xl')}>
                <CardHeader>
                  <CardTitle className="text-base font-semibold">{name}</CardTitle>
                  <div className="mt-1 flex items-end gap-1">
                    <span className="text-4xl font-bold tracking-tight">{price}</span>
                    <span className="mb-1 text-sm text-muted-foreground">/{period}</span>
                  </div>
                  <CardDescription>{description}</CardDescription>
                </CardHeader>

                <CardContent className="flex flex-1 flex-col gap-6">
                  <Link href={href} className={cn(
                    buttonVariants({ size: 'default' }),
                    'h-10 w-full justify-center text-sm',
                    popular ? 'bg-indigo-600 text-white hover:bg-indigo-700' : ''
                  )}>
                    {cta}
                  </Link>

                  <ul className="space-y-3">
                    {features.map((f) => (
                      <li key={f} className="flex items-start gap-2.5 text-sm">
                        <CheckIcon className="mt-0.5 size-4 shrink-0 text-indigo-600 dark:text-indigo-400" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>

        <p className="mt-10 text-center text-sm text-muted-foreground">
          All plans include end-to-end encryption and are compliant with COPPA and FERPA.
        </p>
      </div>
    </section>
  )
}

// ────────────────────────────────────────────────────────────
// FAQ
// ────────────────────────────────────────────────────────────

const FAQS = [
  {
    q: 'Does it just give me the answer?',
    a: 'No — and that\'s the point. Every response breaks the problem into numbered steps and explains the reasoning behind each one. You could re-solve the problem yourself after reading it.',
  },
  {
    q: 'What subjects does it cover?',
    a: 'Math (algebra through calculus), Science (biology, chemistry, physics), Coding (Python, JavaScript, Java, and more), History, English, and a general category that covers economics, psychology, music theory, and anything else you throw at it.',
  },
  {
    q: 'Can I upload a photo of my homework?',
    a: 'Yes, on Pro and Family plans. You can snap a photo of any printed problem, diagram, or worksheet and get a full explanation. It handles handwritten notes too.',
  },
  {
    q: 'Is there a free tier?',
    a: 'Yes. Free accounts get 5 text questions per day — no credit card required, no expiry. Upgrade to Pro whenever you\'re ready.',
  },
  {
    q: 'How is it different from searching the answer online?',
    a: 'A search engine finds a solved example that may or may not match your exact problem. StudyBuddy reads your specific question, explains the concept at your level, and then quizzes you to make sure it actually stuck.',
  },
  {
    q: 'Is it safe for my kids?',
    a: 'Absolutely. The Family plan includes a parent dashboard where you can see every question asked, monitor usage by subject, and review weekly progress reports. We are fully COPPA and FERPA compliant.',
  },
]

function FAQ() {
  return (
    <section id="faq" className="scroll-mt-20 bg-muted/30 py-24 dark:bg-muted/10">
      <div className="mx-auto max-w-3xl px-6">
        <div className="mb-16 text-center">
          <Badge variant="outline" className="mb-4">FAQ</Badge>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Frequently asked questions</h2>
          <p className="mt-4 text-muted-foreground">Can&apos;t find your answer? <Link href="mailto:hello@studybuddy.app" className="underline underline-offset-4 hover:text-foreground">Email us.</Link></p>
        </div>

        <div className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-background">
          {FAQS.map(({ q, a }) => (
            <details key={q} className="group px-6 py-1">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-5 text-sm font-medium [&::-webkit-details-marker]:hidden">
                {q}
                <ChevronDownIcon className="size-4 shrink-0 text-muted-foreground transition-transform duration-200 group-open:rotate-180" />
              </summary>
              <div className="pb-5 text-sm leading-relaxed text-muted-foreground">{a}</div>
            </details>
          ))}
        </div>
      </div>
    </section>
  )
}

// ────────────────────────────────────────────────────────────
// CTA Banner
// ────────────────────────────────────────────────────────────

function CTABanner() {
  return (
    <section className="bg-indigo-600 py-20 dark:bg-indigo-700">
      <div className="mx-auto max-w-3xl px-6 text-center">
        <h2 className="text-3xl font-bold text-white sm:text-4xl">Start learning for free today</h2>
        <p className="mt-4 text-indigo-100">No credit card. No commitment. 5 free questions every single day.</p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link href="/signup" className={cn(buttonVariants({ size: 'lg' }), 'h-12 bg-white px-8 text-base text-indigo-600 hover:bg-indigo-50')}>
            Get started free
          </Link>
          <Link href="/login" className="text-sm text-indigo-100 underline underline-offset-4 hover:text-white transition-colors">
            Already have an account? Log in →
          </Link>
        </div>
      </div>
    </section>
  )
}

// ────────────────────────────────────────────────────────────
// Footer
// ────────────────────────────────────────────────────────────

const FOOTER_LINKS = {
  Product: [
    { label: 'Features', href: '#features' },
    { label: 'Pricing', href: '#pricing' },
    { label: 'FAQ', href: '#faq' },
    { label: 'Changelog', href: '/changelog' },
  ],
  Company: [
    { label: 'About', href: '/about' },
    { label: 'Blog', href: '/blog' },
    { label: 'Careers', href: '/careers' },
    { label: 'Contact', href: 'mailto:hello@studybuddy.app' },
  ],
  Legal: [
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'Terms of Service', href: '/terms' },
    { label: 'Cookie Policy', href: '/cookies' },
    { label: 'COPPA Compliance', href: '/coppa' },
  ],
}

function Footer() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid gap-12 md:grid-cols-[1.5fr_repeat(3,1fr)]">
          <div>
            <Link href="/" className="flex items-center gap-2.5">
              <div className="flex size-8 items-center justify-center rounded-lg bg-indigo-600">
                <BookIcon className="size-4 text-white" />
              </div>
              <span className="text-lg font-semibold">StudyBuddy</span>
            </Link>
            <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
              Helping students understand their homework — not just complete it.
            </p>
            <p className="mt-6 text-xs text-muted-foreground">
              © {new Date().getFullYear()} StudyBuddy. All rights reserved.
            </p>
          </div>

          {Object.entries(FOOTER_LINKS).map(([group, links]) => (
            <div key={group}>
              <h3 className="mb-4 text-sm font-semibold">{group}</h3>
              <ul className="space-y-3">
                {links.map(({ label, href }) => (
                  <li key={label}>
                    <Link href={href} className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </footer>
  )
}

// ────────────────────────────────────────────────────────────
// Page
// ────────────────────────────────────────────────────────────

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <HowItWorks />
        <Subjects />
        <Features />
        <Testimonials />
        <Pricing />
        <FAQ />
        <CTABanner />
      </main>
      <Footer />
    </>
  )
}
