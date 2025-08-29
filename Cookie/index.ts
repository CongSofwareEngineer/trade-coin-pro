'use server'
import { cookies } from 'next/headers'

import { COOKIE_KEYS } from '@/constants/cookie'

// Define the type for the cookie value
type CookieValue = any

export async function hasCookie(key: COOKIE_KEYS): Promise<boolean> {
  try {
    const ck = await cookies()

    return ck.has(key)
  } catch (error) {
    console.error(error)

    return false
  }
}

export async function getCookie<T = CookieValue>(key: COOKIE_KEYS): Promise<T | null> {
  try {
    const ck = await cookies()
    const data = ck.get(key)?.value || null

    return data ? (JSON.parse(data) as T) : null
  } catch (error) {
    console.error(error)

    return null
  }
}

export async function setCookie(key: COOKIE_KEYS, value: CookieValue): Promise<boolean> {
  try {
    const ck = await cookies()

    ck.set(key, JSON.stringify(value), {
      //expires 5 years
      maxAge: 60 * 60 * 24 * 365 * 5, // 5 years in seconds
      secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
    })

    return true
  } catch (error) {
    console.error(error)

    return false
  }
}

export async function deleteCookie(key: COOKIE_KEYS | COOKIE_KEYS[]): Promise<boolean> {
  try {
    const ck = await cookies()

    if (typeof key === 'string') {
      ck.delete(key)
    } else {
      key.forEach((k) => {
        ck.delete(k)
      })
    }

    return true
  } catch (error) {
    console.error(error)

    return false
  }
}

export async function getAllCookies(): Promise<Record<string, string> | null> {
  try {
    const ck = await cookies()

    const allCookies = ck.getAll()

    return allCookies.reduce(
      (acc, cookie) => {
        acc[cookie.name] = cookie.value

        return acc
      },
      {} as Record<string, string>
    )
  } catch (error) {
    console.error(error)

    return null
  }
}
