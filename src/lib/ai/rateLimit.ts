const UNLIMITED_LIMIT = Number.MAX_SAFE_INTEGER

export interface RateLimitState {
  allowed: boolean
  remaining: number
  limit: number
}

export async function getRateLimitState(userId: string): Promise<RateLimitState> {
  void userId
  return { allowed: true, remaining: UNLIMITED_LIMIT, limit: UNLIMITED_LIMIT }
}

export async function consumeAIQuestion(userId: string): Promise<RateLimitState> {
  void userId
  return { allowed: true, remaining: UNLIMITED_LIMIT, limit: UNLIMITED_LIMIT }
}

