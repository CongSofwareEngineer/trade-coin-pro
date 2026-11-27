import { NextRequest } from 'next/server'

import { getEconomySheetUrl } from '@/constants/economy'
import { isGoogleConfigured } from '@/services/Google/auth'
import { createDiscussion, deleteDiscussion, readDiscussions, updateDiscussion } from '@/services/Google/sheets'
import { guardApi, jsonResponse } from '@/utils/apiGuard'

// Proxy in front of the Google Sheets API: the service account key never leaves the server
// and only the allowed domains may call it.
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const failed = (error: unknown) => {
  console.error('[economy/discussions]', error)

  return jsonResponse({ error: error instanceof Error ? error.message : 'Unexpected error' }, 500)
}

const readValues = (body: any) => {
  const values = body?.values

  if (!values || typeof values !== 'object' || Array.isArray(values)) throw new Error('Thiếu dữ liệu gửi lên')

  return Object.entries(values).reduce<Record<string, string>>((result, [key, value]) => {
    result[key] = String(value ?? '')

    return result
  }, {})
}

export async function GET(req: NextRequest) {
  const blocked = guardApi(req)

  if (blocked) return blocked

  if (!isGoogleConfigured()) {
    return jsonResponse({ data: { fields: [], items: [], sheetUrl: getEconomySheetUrl(), canWrite: false }, notConfigured: true })
  }

  try {
    const { fields, items } = await readDiscussions()

    return jsonResponse({ data: { fields, items, sheetUrl: getEconomySheetUrl(), canWrite: true } })
  } catch (error) {
    return failed(error)
  }
}

export async function POST(req: NextRequest) {
  const blocked = guardApi(req)

  if (blocked) return blocked

  try {
    const body = await req.json()

    await createDiscussion(readValues(body))

    return jsonResponse({ data: true }, 201)
  } catch (error) {
    return failed(error)
  }
}

export async function PUT(req: NextRequest) {
  const blocked = guardApi(req)

  if (blocked) return blocked

  try {
    const body = await req.json()
    const row = Number(body?.row)

    if (!Number.isInteger(row)) return jsonResponse({ error: 'Thiếu dòng cần sửa' }, 400)

    await updateDiscussion(row, readValues(body))

    return jsonResponse({ data: true })
  } catch (error) {
    return failed(error)
  }
}

export async function DELETE(req: NextRequest) {
  const blocked = guardApi(req)

  if (blocked) return blocked

  try {
    const body = await req.json()
    const row = Number(body?.row)

    if (!Number.isInteger(row)) return jsonResponse({ error: 'Thiếu dòng cần xoá' }, 400)

    await deleteDiscussion(row)

    return jsonResponse({ data: true })
  } catch (error) {
    return failed(error)
  }
}
