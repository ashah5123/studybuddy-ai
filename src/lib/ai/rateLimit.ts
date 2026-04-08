import { createClient } from '@/lib/supabase/server'

const FREE_DAILY_LIMIT = 10

export interface RateLimitState {
  allowed: boolean
  remaining: number
  limit: number
}

async function getUserTier(userId: string): Promise<'free' | 'pro'> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('profiles')
    .select('subscription_tier')
    .eq('id', userId)
    .single()

  return data?.subscription_tier === 'pro' ? 'pro' : 'free'
}

function limitForTier(tier: 'free' | 'pro'): number {
  if (tier === 'pro') return 10_000
  return FREE_DAILY_LIMIT
}

export async function getRateLimitState(userId: string): Promise<RateLimitState> {
  const supabase = await createClient()
  const tier = await getUserTier(userId)
  const limit = limitForTier(tier)

  const today = new Date().toISOString().slice(0, 10)
  const { data } = await supabase
    .from('usage_tracking')
    .select('ai_questions_count')
    .eq('user_id', userId)
    .eq('date', today)
    .single()

  const used = data?.ai_questions_count ?? 0
  const remaining = Math.max(0, limit - used)
  return { allowed: used < limit, remaining, limit }
}

export async function consumeAIQuestion(userId: string): Promise<RateLimitState> {
  const supabase = await createClient()
  const tier = await getUserTier(userId)
  const limit = limitForTier(tier)
  const today = new Date().toISOString().slice(0, 10)

  const { data: existing } = await supabase
    .from('usage_tracking')
    .select('id, ai_questions_count')
    .eq('user_id', userId)
    .eq('date', today)
    .single()

  const current = existing?.ai_questions_count ?? 0
  if (current >= limit) {
    return { allowed: false, remaining: 0, limit }
  }

  if (existing?.id) {
    await supabase
      .from('usage_tracking')
      .update({ ai_questions_count: current + 1 })
      .eq('id', existing.id)
  } else {
    await supabase.from('usage_tracking').insert({
      user_id: userId,
      date: today,
      ai_questions_count: 1,
    })
  }

  return { allowed: true, remaining: Math.max(0, limit - (current + 1)), limit }
}

