import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const PROTECTED_PREFIXES = [
  '/dashboard',
  '/ask',
  '/quiz',
  '/notebook',
  '/analytics',
  '/settings',
  '/upgrade',
  '/billing',
]

const AUTH_ROUTES = ['/login', '/signup']
const PUBLIC_ROUTES = ['/', '/callback', '/terms', '/privacy']

const FREE_DAILY_LIMIT = 5

function isProtected(pathname: string): boolean {
  return PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(prefix + '/')
  )
}

function isAuthRoute(pathname: string): boolean {
  return AUTH_ROUTES.includes(pathname)
}

function isPublic(pathname: string): boolean {
  return PUBLIC_ROUTES.includes(pathname) || isAuthRoute(pathname)
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  if (!user && (isProtected(pathname) || !isPublic(pathname))) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/login'
    return NextResponse.redirect(loginUrl)
  }

  if (user && isAuthRoute(pathname)) {
    const askUrl = request.nextUrl.clone()
    askUrl.pathname = '/ask'
    return NextResponse.redirect(askUrl)
  }

  // Enforce daily question limit for free users at the edge,
  // specifically on the ask API endpoint (defense-in-depth alongside route handler check)
  if (user && pathname === '/api/ask' && request.method === 'POST') {
    const { data: profile } = await supabase
      .from('users')
      .select('plan, questions_today')
      .eq('id', user.id)
      .single()

    if (
      profile?.plan === 'free' &&
      (profile.questions_today ?? 0) >= FREE_DAILY_LIMIT
    ) {
      return NextResponse.json(
        { error: 'quota_exceeded', questionsToday: profile.questions_today },
        { status: 429 }
      )
    }
  }

  return supabaseResponse
}
