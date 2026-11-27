import crypto from 'node:crypto'

import { GOOGLE_OAUTH_TOKEN_URL, GOOGLE_SCOPES, GOOGLE_TIMEOUT_MS, GOOGLE_TOKEN_TTL } from '@/constants/economy'

// Server only: uses the service account key, never import this from the browser
let cachedToken: { token: string; expiresAt: number } | null = null

export const isGoogleConfigured = () => Boolean(process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL && process.env.GOOGLE_PRIVATE_KEY)

const base64url = (input: Buffer | string) => Buffer.from(input).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')

/**
 * Chuẩn hoá PEM lấy từ env. Vercel / docker giữ nguyên cặp nháy khi paste cả dòng
 * `GOOGLE_PRIVATE_KEY="-----BEGIN...\n"`, và newline thường bị lưu thành "\n" literal,
 * cả 2 làm OpenSSL báo `DECODER routines::unsupported`.
 */
const readPrivateKey = () => {
  const raw = (process.env.GOOGLE_PRIVATE_KEY || '').trim()

  // Bỏ cặp nháy bọc ngoài nếu có
  const unquoted = raw.replace(/^(['"])([\s\S]*)\1$/, '$2')

  const key = unquoted.replace(/\\n/g, '\n').trim()

  if (!key.includes('-----BEGIN')) throw new Error('GOOGLE_PRIVATE_KEY không phải PEM, thiếu dòng -----BEGIN PRIVATE KEY-----')

  // PEM phải kết thúc bằng newline, không có thì OpenSSL parse lỗi
  return key.endsWith('\n') ? key : `${key}\n`
}

/** Service account JWT, RS256 signed. Replaces google-auth-library so no new dependency is needed. */
const buildAssertion = () => {
  const issuedAt = Math.floor(Date.now() / 1000)

  const header = base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))
  const claim = base64url(
    JSON.stringify({
      iss: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      scope: GOOGLE_SCOPES,
      aud: GOOGLE_OAUTH_TOKEN_URL,
      iat: issuedAt,
      exp: issuedAt + GOOGLE_TOKEN_TTL,
    })
  )

  const payload = `${header}.${claim}`
  const signature = base64url(crypto.sign('RSA-SHA256', Buffer.from(payload), readPrivateKey()))

  return `${payload}.${signature}`
}

/** One token is reused until it is close to expiring, so a page load is one Google call less. */
export const getAccessToken = async () => {
  if (!isGoogleConfigured()) throw new Error('GOOGLE_SERVICE_ACCOUNT_EMAIL / GOOGLE_PRIVATE_KEY are not set')

  if (cachedToken && cachedToken.expiresAt > Date.now()) return cachedToken.token

  const response = await fetch(GOOGLE_OAUTH_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: buildAssertion() }).toString(),
    signal: AbortSignal.timeout(GOOGLE_TIMEOUT_MS),
    cache: 'no-store',
  })

  const result = await response.json().catch(() => null)

  if (!response.ok || !result?.access_token) throw new Error(result?.error_description || result?.error || 'Google access token is empty')

  // Refresh a minute early so a token never expires mid request
  cachedToken = { token: String(result.access_token), expiresAt: Date.now() + (Number(result.expires_in || 3600) - 60) * 1000 }

  return cachedToken.token
}

/** Single place every Sheets / Docs call goes through: auth header, timeout, error shape. */
export const googleFetch = async (url: string, init: RequestInit = {}) => {
  const token = await getAccessToken()

  const response = await fetch(url, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init.headers, Authorization: `Bearer ${token}` },
    signal: AbortSignal.timeout(GOOGLE_TIMEOUT_MS),
    cache: 'no-store',
  })

  const result = await response.json().catch(() => null)

  if (!response.ok) {
    throw new Error(result?.error?.message || `Google API request failed (${response.status})`)
  }

  return result
}
