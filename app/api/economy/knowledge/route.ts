import { NextRequest } from 'next/server'

import { getEconomyDocUrl } from '@/constants/economy'
import { isGoogleConfigured } from '@/services/Google/auth'
import { appendKnowledgeSection, deleteKnowledgeSection, readKnowledge, updateKnowledgeSection } from '@/services/Google/docs'
import { guardApi, jsonResponse } from '@/utils/apiGuard'

// Proxy in front of the Google Docs API — same rules as the discussions route.
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const failed = (error: unknown) => {
  console.error('[economy/knowledge]', error)

  return jsonResponse({ error: error instanceof Error ? error.message : 'Unexpected error' }, 500)
}

export async function GET(req: NextRequest) {
  const blocked = guardApi(req)

  if (blocked) return blocked

  if (!isGoogleConfigured()) {
    return jsonResponse({
      data: { title: '', revisionId: '', intro: [], sections: [], docUrl: getEconomyDocUrl(), canWrite: false },
      notConfigured: true,
    })
  }

  try {
    const { title, revisionId, tabId, intro, sections } = await readKnowledge()

    return jsonResponse({ data: { title, revisionId, tabId, intro, sections, docUrl: getEconomyDocUrl(), canWrite: true } })
  } catch (error) {
    return failed(error)
  }
}

export async function POST(req: NextRequest) {
  const blocked = guardApi(req)

  if (blocked) return blocked

  try {
    const body = await req.json()

    await appendKnowledgeSection({ title: body?.title, text: body?.text, level: Number(body?.level) || 2, revisionId: body?.revisionId })

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
    const startIndex = Number(body?.startIndex)
    const endIndex = Number(body?.endIndex)

    if (!Number.isInteger(startIndex) || !Number.isInteger(endIndex)) return jsonResponse({ error: 'Thiếu vị trí mục cần sửa' }, 400)

    await updateKnowledgeSection({
      startIndex,
      endIndex,
      title: body?.title,
      text: body?.text,
      level: Number(body?.level) || 2,
      revisionId: body?.revisionId,
    })

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
    const startIndex = Number(body?.startIndex)
    const endIndex = Number(body?.endIndex)

    if (!Number.isInteger(startIndex) || !Number.isInteger(endIndex)) return jsonResponse({ error: 'Thiếu vị trí mục cần xoá' }, 400)

    await deleteKnowledgeSection({ startIndex, endIndex, revisionId: body?.revisionId })

    return jsonResponse({ data: true })
  } catch (error) {
    return failed(error)
  }
}
