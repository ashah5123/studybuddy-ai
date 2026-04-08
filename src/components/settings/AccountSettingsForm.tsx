'use client'

import { useState } from 'react'
import {
  updateAccountEmail,
  updateAccountPassword,
  updateAccountProfile,
} from '@/lib/auth/actions'

type Props = {
  initialEmail: string
  initialFullName: string
  initialBio: string
}

export function AccountSettingsForm({ initialEmail, initialFullName, initialBio }: Props) {
  const [fullName, setFullName] = useState(initialFullName)
  const [bio, setBio] = useState(initialBio)
  const [email, setEmail] = useState(initialEmail)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [savingProfile, setSavingProfile] = useState(false)
  const [savingEmail, setSavingEmail] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)

  const [profileMsg, setProfileMsg] = useState<string | null>(null)
  const [emailMsg, setEmailMsg] = useState<string | null>(null)
  const [passwordMsg, setPasswordMsg] = useState<string | null>(null)

  async function handleProfileSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSavingProfile(true)
    setProfileMsg(null)
    const res = await updateAccountProfile({ fullName, bio })
    setSavingProfile(false)
    setProfileMsg(res.success ? res.message ?? 'Saved.' : res.error)
  }

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSavingEmail(true)
    setEmailMsg(null)
    const res = await updateAccountEmail(email)
    setSavingEmail(false)
    setEmailMsg(res.success ? res.message ?? 'Updated.' : res.error)
  }

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSavingPassword(true)
    setPasswordMsg(null)
    const res = await updateAccountPassword(password, confirmPassword)
    setSavingPassword(false)
    setPasswordMsg(res.success ? res.message ?? 'Updated.' : res.error)
    if (res.success) {
      setPassword('')
      setConfirmPassword('')
    }
  }

  return (
    <div className="space-y-5">
      <form onSubmit={handleProfileSubmit} className="sb-panel space-y-4 p-5">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">About yourself</h2>
          <p className="mt-1 text-sm text-slate-600">
            Update your name and a short bio shown across your account.
          </p>
        </div>

        <div>
          <label htmlFor="full-name" className="mb-1 block text-xs font-medium text-slate-600">
            Full name
          </label>
          <input
            id="full-name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="sb-input w-full"
            maxLength={120}
            required
          />
        </div>

        <div>
          <label htmlFor="bio" className="mb-1 block text-xs font-medium text-slate-600">
            Bio / about
          </label>
          <textarea
            id="bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            className="sb-input min-h-[96px] w-full resize-y"
            maxLength={500}
            placeholder="Tell us a bit about your goals, major, or study style..."
          />
          <p className="mt-1 text-xs text-slate-500">{bio.length}/500</p>
        </div>

        {profileMsg && (
          <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
            {profileMsg}
          </p>
        )}

        <button
          type="submit"
          disabled={savingProfile}
          className="rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-indigo-500/25 transition-all hover:brightness-105 disabled:opacity-50"
        >
          {savingProfile ? 'Saving…' : 'Save profile'}
        </button>
      </form>

      <form onSubmit={handleEmailSubmit} className="sb-panel space-y-4 p-5">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Change email</h2>
          <p className="mt-1 text-sm text-slate-600">
            You may need to confirm the new address from your inbox.
          </p>
        </div>

        <div>
          <label htmlFor="email" className="mb-1 block text-xs font-medium text-slate-600">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="sb-input w-full"
            required
          />
        </div>

        {emailMsg && (
          <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
            {emailMsg}
          </p>
        )}

        <button
          type="submit"
          disabled={savingEmail}
          className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50"
        >
          {savingEmail ? 'Updating…' : 'Update email'}
        </button>
      </form>

      <form onSubmit={handlePasswordSubmit} className="sb-panel space-y-4 p-5">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Change password</h2>
          <p className="mt-1 text-sm text-slate-600">
            Use at least 8 characters for better security.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="new-password" className="mb-1 block text-xs font-medium text-slate-600">
              New password
            </label>
            <input
              id="new-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="sb-input w-full"
              minLength={8}
              required
            />
          </div>
          <div>
            <label
              htmlFor="confirm-password"
              className="mb-1 block text-xs font-medium text-slate-600"
            >
              Confirm password
            </label>
            <input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="sb-input w-full"
              minLength={8}
              required
            />
          </div>
        </div>

        {passwordMsg && (
          <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
            {passwordMsg}
          </p>
        )}

        <button
          type="submit"
          disabled={savingPassword}
          className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50"
        >
          {savingPassword ? 'Updating…' : 'Update password'}
        </button>
      </form>
    </div>
  )
}
