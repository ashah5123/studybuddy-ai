'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'
import { signUp, signInWithGoogle } from '@/lib/auth/actions'
import { signupSchema, type SignupInput } from '@/lib/validations/auth'

export default function SignupPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const [confirmation, setConfirmation] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupInput>({
    resolver: zodResolver(signupSchema),
  })

  async function onSubmit(data: SignupInput) {
    setServerError(null)
    const result = await signUp(data.email, data.password, data.fullName)
    if (result?.error) {
      setServerError(result.error)
    } else if (result?.needsConfirmation) {
      setConfirmation(true)
    }
  }

  async function handleGoogleSignUp() {
    setServerError(null)
    setGoogleLoading(true)
    const result = await signInWithGoogle()
    if (result.error) {
      setServerError(result.error)
      setGoogleLoading(false)
    } else if (result.url) {
      window.location.href = result.url
    }
  }

  if (confirmation) {
    return (
      <div className="flex flex-col items-center gap-5 py-2 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10 ring-1 ring-emerald-500/20">
          <CheckCircle2 className="h-8 w-8 text-emerald-300" />
        </div>
        <div>
          <h2 className="text-xl font-bold tracking-tight text-[var(--foreground)]">
            Check your email
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-[var(--sb-muted)]">
            We sent a confirmation link. Open it to activate your account.
          </p>
        </div>
        <Link
          href="/login"
          className="text-sm font-semibold text-[var(--sb-accent)] transition-colors hover:text-[var(--sb-accent-muted)]"
        >
          Back to sign in
        </Link>
      </div>
    )
  }

  return (
    <>
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold tracking-tight text-[var(--foreground)]">
          Create your account
        </h1>
        <p className="mt-2 text-sm text-[var(--sb-muted)]">
          Track courses, assignments, and AI help in one place
        </p>
      </div>

      {serverError && (
        <div
          className="mb-5 flex items-start gap-2.5 rounded-xl border border-rose-500/25 bg-rose-500/10 px-3.5 py-3 text-sm text-rose-200 shadow-sm"
          role="alert"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-300" />
          <span>{serverError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <div>
          <label htmlFor="fullName" className="sb-label">
            Full name
          </label>
          <input
            {...register('fullName')}
            id="fullName"
            type="text"
            autoComplete="name"
            placeholder="Alex Johnson"
            aria-invalid={!!errors.fullName}
            aria-describedby={errors.fullName ? 'fullName-error' : undefined}
            className={`sb-input ${errors.fullName ? 'sb-input-error' : ''}`}
          />
          {errors.fullName && (
            <p id="fullName-error" className="mt-1.5 text-xs font-medium text-red-600">
              {errors.fullName.message}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="email" className="sb-label">
            Email address
          </label>
          <input
            {...register('email')}
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? 'email-error' : undefined}
            className={`sb-input ${errors.email ? 'sb-input-error' : ''}`}
          />
          {errors.email && (
            <p id="email-error" className="mt-1.5 text-xs font-medium text-red-600">
              {errors.email.message}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="password" className="sb-label">
            Password
          </label>
          <div className="relative">
            <input
              {...register('password')}
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="At least 8 characters"
              aria-invalid={!!errors.password}
              aria-describedby={errors.password ? 'password-error' : undefined}
              className={`sb-input pr-11 ${errors.password ? 'sb-input-error' : ''}`}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-[rgba(148,163,184,0.85)] transition-colors hover:bg-white/10 hover:text-[var(--foreground)]"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.password && (
            <p id="password-error" className="mt-1.5 text-xs font-medium text-red-600">
              {errors.password.message}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="confirmPassword" className="sb-label">
            Confirm password
          </label>
          <div className="relative">
            <input
              {...register('confirmPassword')}
              id="confirmPassword"
              type={showConfirm ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="Repeat your password"
              aria-invalid={!!errors.confirmPassword}
              aria-describedby={errors.confirmPassword ? 'confirmPassword-error' : undefined}
              className={`sb-input pr-11 ${errors.confirmPassword ? 'sb-input-error' : ''}`}
            />
            <button
              type="button"
              onClick={() => setShowConfirm((v) => !v)}
              aria-label={showConfirm ? 'Hide password' : 'Show password'}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-[rgba(148,163,184,0.85)] transition-colors hover:bg-white/10 hover:text-[var(--foreground)]"
            >
              {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.confirmPassword && (
            <p id="confirmPassword-error" className="mt-1.5 text-xs font-medium text-red-600">
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

        <button type="submit" disabled={isSubmitting} className="sb-btn-primary">
          {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {isSubmitting ? 'Creating account…' : 'Create account'}
        </button>
      </form>

      <div className="my-6 flex items-center gap-3">
        <div className="h-px flex-1 bg-white/10" />
        <span className="text-xs font-medium uppercase tracking-wide text-[rgba(148,163,184,0.85)]">
          or
        </span>
        <div className="h-px flex-1 bg-white/10" />
      </div>

      <button
        type="button"
        onClick={handleGoogleSignUp}
        disabled={googleLoading || isSubmitting}
        className="sb-btn-secondary"
      >
        {googleLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
        )}
        {googleLoading ? 'Redirecting…' : 'Continue with Google'}
      </button>

      <p className="mt-8 text-center text-sm text-[var(--sb-muted)]">
        Already have an account?{' '}
        <Link
          href="/login"
          className="font-semibold text-[var(--sb-accent)] transition-colors hover:text-[var(--sb-accent-muted)]"
        >
          Sign in
        </Link>
      </p>
    </>
  )
}
