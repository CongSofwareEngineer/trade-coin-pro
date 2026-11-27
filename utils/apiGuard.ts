import { NextRequest } from 'next/server'

// Only these origins may reach the Google proxy routes. Anything else gets a 403,
// so the service account can never be driven from another site.
export const ALLOWED_ORIGINS = ['https://trade-coin-pro.vercel.app', 'https://tradecoinpro.com', 'http://localhost:3000']

const isLocal = (origin: string) => /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)

const readOrigin = (req: NextRequest) => {
  const origin = req.headers.get('origin')

  if (origin) return origin

  // Same-origin GETs from the browser often send only a referer
  const referer = req.headers.get('referer')

  if (!referer) return ''

  try {
    return new URL(referer).origin
  } catch {
    return ''
  }
}

export const isAllowedOrigin = (req: NextRequest) => {
  const origin = readOrigin(req)

  // No origin and no referer: a server render or a direct curl, not a cross-site call
  if (!origin) return req.headers.get('sec-fetch-site') !== 'cross-site'

  if (isLocal(origin) && process.env.NEXT_PUBLIC_APP_ENV !== 'production') return true

  return ALLOWED_ORIGINS.includes(origin) || origin === req.nextUrl.origin
}

export const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } })

export const forbidden = () => jsonResponse({ error: 'Forbidden: domain not allowed' }, 403)

/** Returns null when the request may proceed, otherwise the response to send back. */
export const guardApi = (req: NextRequest) => (isAllowedOrigin(req) ? null : forbidden())
