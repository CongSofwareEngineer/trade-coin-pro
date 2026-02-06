import { NextRequest } from 'next/server'

import { lowercase } from '@/utils/functions'
import { encryptData } from '@/utils/crypto'

const ALLOWED_ORIGINS = ['http://localhost:3000', 'https://trade-coin-pro.vercel.app']

export async function POST(req: NextRequest) {
  try {
    // Check origin/referer
    const origin = req.headers.get('origin') || req.headers.get('referer')
    const isAllowed = ALLOWED_ORIGINS.some((allowedOrigin) => {
      if (origin) {
        return origin.startsWith(allowedOrigin) || origin.includes('localhost')
      }

      return false
    })

    if (!isAllowed) {
      return new Response(
        JSON.stringify({
          error: 'Forbidden: Domain not allowed',
        }),
        {
          status: 403,
        }
      )
    }

    const body = await req.json()
    let password = body.password

    const passwordDefault = process.env.DEFAULT_CRYPTO_PASSWORD || ''

    if (!password) {
      password = passwordDefault
    } else {
      if (password !== passwordDefault) {
        if (password.includes(passwordDefault)) {
          password = lowercase(password)
          password = password.replace(lowercase(passwordDefault), passwordDefault)
        } else {
          password = lowercase(password)
        }
      }
    }
    const encrypted = encryptData(body.data, password)

    return new Response(
      JSON.stringify({
        data: encrypted,
      }),
      {
        status: 200,
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({
        error,
      }),
      {
        status: 500,
      }
    )
  }
}
