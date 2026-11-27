import { googleFetch } from './auth'

import { ECONOMY_MAX_DOC_TEXT_LENGTH, ECONOMY_MAX_TITLE_LENGTH, getEconomyDocId, GOOGLE_DOCS_API_URL } from '@/constants/economy'
import { DocBlock, DocTextRun, KnowledgeSection } from '@/types/economy'

// Server only. Reached through /api/economy/knowledge so the service account key stays server side.

const docUrl = (suffix = '') => `${GOOGLE_DOCS_API_URL}/${getEconomyDocId()}${suffix}`

const HEADING_LEVEL: Record<string, number> = {
  TITLE: 1,
  HEADING_1: 1,
  HEADING_2: 2,
  HEADING_3: 3,
  HEADING_4: 4,
  HEADING_5: 5,
  HEADING_6: 6,
}

/** Headings at these levels open a new section in the UI; deeper ones stay inside the body. */
const SECTION_LEVELS = [1, 2]

const slugify = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase()
    .slice(0, 60)

const toRuns = (elements: any[], inlineObjects: Record<string, any>): DocTextRun[] => {
  const runs: DocTextRun[] = []

  elements?.forEach((element) => {
    if (element?.inlineObjectElement) {
      const embedded = inlineObjects?.[element.inlineObjectElement.inlineObjectId]?.inlineObjectProperties?.embeddedObject
      const title = embedded?.title || embedded?.description

      runs.push({ text: title ? `[${title}]` : '[hình ảnh]', italic: true })

      return
    }

    const content = element?.textRun?.content

    if (typeof content !== 'string') return

    const text = content.replace(/\n$/, '')

    if (!text) return

    const style = element.textRun.textStyle || {}

    runs.push({
      text,
      bold: style.bold || undefined,
      italic: style.italic || undefined,
      underline: style.underline || undefined,
      code: style.weightedFontFamily?.fontFamily?.toLowerCase().includes('mono') || undefined,
      link: style.link?.url || undefined,
    })
  })

  return runs
}

const runsText = (runs: DocTextRun[]) => runs.map((run) => run.text).join('')

const isOrderedList = (lists: Record<string, any>, listId?: string, nestingLevel = 0) => {
  const level = lists?.[listId || '']?.listProperties?.nestingLevels?.[nestingLevel]

  return Boolean(level?.glyphType && level.glyphType !== 'GLYPH_TYPE_UNSPECIFIED')
}

type ParsedBlock = { block: DocBlock; startIndex: number; endIndex: number }

const parseContent = (content: any[], lists: Record<string, any>, inlineObjects: Record<string, any>): ParsedBlock[] => {
  const parsed: ParsedBlock[] = []

  content?.forEach((element) => {
    const startIndex = Number(element?.startIndex ?? 0)
    const endIndex = Number(element?.endIndex ?? 0)

    if (element?.table) {
      const rows: DocTextRun[][][] = (element.table.tableRows || []).map((row: any) =>
        (row.tableCells || []).map((cell: any) =>
          (cell.content || []).flatMap((cellElement: any) => toRuns(cellElement?.paragraph?.elements || [], inlineObjects))
        )
      )

      if (rows.length > 0) parsed.push({ block: { type: 'table', rows }, startIndex, endIndex })

      return
    }

    const paragraph = element?.paragraph

    if (!paragraph) return

    const runs = toRuns(paragraph.elements || [], inlineObjects)

    if (runs.length === 0) return

    const namedStyle = paragraph.paragraphStyle?.namedStyleType || 'NORMAL_TEXT'
    const level = HEADING_LEVEL[namedStyle]

    if (paragraph.bullet) {
      const nestingLevel = Number(paragraph.bullet.nestingLevel || 0)

      parsed.push({
        block: { type: 'listItem', level: nestingLevel, ordered: isOrderedList(lists, paragraph.bullet.listId, nestingLevel), runs },
        startIndex,
        endIndex,
      })

      return
    }

    if (level) {
      parsed.push({ block: { type: 'heading', level, runs }, startIndex, endIndex })

      return
    }

    if (namedStyle === 'SUBTITLE') {
      parsed.push({ block: { type: 'quote', runs }, startIndex, endIndex })

      return
    }

    parsed.push({ block: { type: 'paragraph', runs }, startIndex, endIndex })
  })

  return parsed
}

/** Turns a section's blocks back into the plain text the edit form shows. */
const blocksToText = (blocks: DocBlock[]) =>
  blocks
    .map((block) => {
      if (block.type === 'table') return block.rows.map((row) => row.map((cell) => runsText(cell)).join(' | ')).join('\n')
      if (block.type === 'listItem') return `${'  '.repeat(block.level)}- ${runsText(block.runs)}`
      if (block.type === 'heading') return `${'#'.repeat(Math.min(block.level + 1, 6))} ${runsText(block.runs)}`

      return runsText(block.runs)
    })
    .join('\n')

export const readKnowledge = async () => {
  const result = await googleFetch(docUrl('?includeTabsContent=true'))

  // Tabbed documents keep their content under tabs[]; older ones expose `body` directly
  const firstTab = (result?.tabs || []).slice().sort((a: any, b: any) => (a?.tabProperties?.index || 0) - (b?.tabProperties?.index || 0))[0]
  const documentTab = firstTab?.documentTab
  const body = documentTab?.body || result?.body
  const lists = documentTab?.lists || result?.lists || {}
  const inlineObjects = documentTab?.inlineObjects || result?.inlineObjects || {}
  const content: any[] = body?.content || []

  const parsed = parseContent(content, lists, inlineObjects)
  const bodyEnd = Number(content[content.length - 1]?.endIndex ?? 1)

  const intro: DocBlock[] = []
  const sections: KnowledgeSection[] = []

  parsed.forEach((item) => {
    const { block } = item

    if (block.type === 'heading' && SECTION_LEVELS.includes(block.level)) {
      const title = runsText(block.runs)

      sections.push({
        id: `${slugify(title) || 'section'}-${item.startIndex}`,
        title,
        level: block.level,
        blocks: [],
        startIndex: item.startIndex,
        endIndex: item.endIndex,
        text: '',
      })

      return
    }

    const current = sections[sections.length - 1]

    if (!current) {
      intro.push(block)

      return
    }

    current.blocks.push(block)
    current.endIndex = item.endIndex
  })

  // A section owns every index up to the next heading, blank paragraphs included
  sections.forEach((section, index) => {
    section.endIndex = sections[index + 1]?.startIndex ?? bodyEnd
    section.text = blocksToText(section.blocks)
  })

  return {
    title: String(result?.title || ''),
    revisionId: String(result?.revisionId || ''),
    tabId: firstTab?.tabProperties?.tabId as string | undefined,
    intro,
    sections,
    bodyEnd,
  }
}

type LineMeta = { text: string; isBullet: boolean }

const parseLines = (text: string): LineMeta[] =>
  text
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((raw) => {
      const bulletMatch = raw.match(/^\s*[-*•]\s+(.*)$/)

      if (bulletMatch) return { text: bulletMatch[1].trim(), isBullet: true }

      return { text: raw.trim(), isBullet: false }
    })
    // Drop the empty lines at both ends but keep the ones in between as paragraph spacing
    .filter((line, index, all) => line.text.length > 0 || (index > 0 && index < all.length - 1))

const locationOf = (index: number, tabId?: string) => (tabId ? { index, tabId } : { index })
const rangeOf = (startIndex: number, endIndex: number, tabId?: string) => (tabId ? { startIndex, endIndex, tabId } : { startIndex, endIndex })

/**
 * Builds the requests that write one section (heading + body) starting at `index`.
 * `prefix` is a newline when appending after existing text, `trailingNewline` is false
 * when the paragraph that follows already supplies the closing newline.
 */
const buildSectionRequests = ({
  index,
  prefix,
  title,
  level,
  lines,
  trailingNewline,
  tabId,
}: {
  index: number
  prefix: string
  title: string
  level: number
  lines: LineMeta[]
  trailingNewline: boolean
  tabId?: string
}) => {
  const bodyText = lines.map((line) => line.text).join('\n')
  const text = `${prefix}${title}\n${bodyText}${trailingNewline ? '\n' : ''}`

  const titleStart = index + prefix.length
  const titleEnd = titleStart + title.length + 1
  const bodyStart = titleEnd
  // Without a trailing newline the following newline closes the last paragraph, so add 1
  const bodyEnd = index + text.length + (trailingNewline ? 0 : 1)

  const requests: any[] = [
    { insertText: { location: locationOf(index, tabId), text } },
    {
      updateParagraphStyle: {
        range: rangeOf(titleStart, titleEnd, tabId),
        paragraphStyle: { namedStyleType: `HEADING_${Math.min(Math.max(level, 1), 6)}` },
        fields: 'namedStyleType',
      },
    },
    // Inserted text inherits the style of its neighbour — reset it so an edit never arrives bold
    { updateTextStyle: { range: rangeOf(titleStart, bodyEnd, tabId), textStyle: {}, fields: 'bold,italic,underline,link,foregroundColor' } },
  ]

  if (bodyText.length > 0) {
    requests.push({
      updateParagraphStyle: {
        range: rangeOf(bodyStart, bodyEnd, tabId),
        paragraphStyle: { namedStyleType: 'NORMAL_TEXT' },
        fields: 'namedStyleType',
      },
    })
    requests.push({ deleteParagraphBullets: { range: rangeOf(bodyStart, bodyEnd, tabId) } })

    // Re-apply bullets for the "- " lines, one request per contiguous group
    let offset = bodyStart
    let groupStart = -1

    lines.forEach((line, lineIndex) => {
      const lineStart = offset

      offset += line.text.length + 1

      if (line.isBullet && groupStart < 0) groupStart = lineStart

      const isLast = lineIndex === lines.length - 1

      if (groupStart >= 0 && (!line.isBullet || isLast)) {
        const groupEnd = line.isBullet ? offset : lineStart

        requests.push({
          createParagraphBullets: { range: rangeOf(groupStart, Math.min(groupEnd, bodyEnd), tabId), bulletPreset: 'BULLET_DISC_CIRCLE_SQUARE' },
        })
        groupStart = -1
      }
    })
  }

  return requests
}

const batchUpdate = async (requests: any[], revisionId?: string) => {
  const body: Record<string, unknown> = { requests }

  // Rejects the write when somebody edited the doc after it was read
  if (revisionId) body.writeControl = { requiredRevisionId: revisionId }

  return googleFetch(docUrl(':batchUpdate'), { method: 'POST', body: JSON.stringify(body) })
}

const normalizeInput = (title: string, text: string) => {
  const safeTitle = String(title || '')
    .replace(/[\r\n]+/g, ' ')
    .trim()
    .slice(0, ECONOMY_MAX_TITLE_LENGTH)

  if (!safeTitle) throw new Error('Tiêu đề không được để trống')

  return { safeTitle, lines: parseLines(String(text || '').slice(0, ECONOMY_MAX_DOC_TEXT_LENGTH)) }
}

export const appendKnowledgeSection = async ({
  title,
  text,
  level = 2,
  revisionId,
}: {
  title: string
  text: string
  level?: number
  revisionId?: string
}) => {
  const { safeTitle, lines } = normalizeInput(title, text)
  const doc = await readKnowledge()
  const insertAt = Math.max(doc.bodyEnd - 1, 1)

  const requests = buildSectionRequests({
    index: insertAt,
    // Starts its own paragraph instead of gluing onto the last line of the doc
    prefix: insertAt > 1 ? '\n' : '',
    title: safeTitle,
    level,
    lines,
    trailingNewline: false,
    tabId: doc.tabId,
  })

  await batchUpdate(requests, revisionId || doc.revisionId)
}

export const updateKnowledgeSection = async ({
  startIndex,
  endIndex,
  title,
  text,
  level = 2,
  revisionId,
}: {
  startIndex: number
  endIndex: number
  title: string
  text: string
  level?: number
  revisionId?: string
}) => {
  const { safeTitle, lines } = normalizeInput(title, text)
  const doc = await readKnowledge()

  const section = doc.sections.find((item) => item.startIndex === startIndex)

  if (!section) throw new Error('Mục này không còn tồn tại, hãy tải lại trang')

  // The very last newline of the document cannot be deleted
  const deleteEnd = Math.min(endIndex || section.endIndex, doc.bodyEnd - 1)
  const keepsClosingNewline = deleteEnd < (endIndex || section.endIndex)

  const requests: any[] = []

  if (deleteEnd > startIndex) requests.push({ deleteContentRange: { range: rangeOf(startIndex, deleteEnd, doc.tabId) } })

  requests.push(
    ...buildSectionRequests({
      index: startIndex,
      prefix: '',
      title: safeTitle,
      level,
      lines,
      trailingNewline: !keepsClosingNewline,
      tabId: doc.tabId,
    })
  )

  await batchUpdate(requests, revisionId || doc.revisionId)
}

export const deleteKnowledgeSection = async ({ startIndex, endIndex, revisionId }: { startIndex: number; endIndex: number; revisionId?: string }) => {
  const doc = await readKnowledge()
  const section = doc.sections.find((item) => item.startIndex === startIndex)

  if (!section) throw new Error('Mục này không còn tồn tại, hãy tải lại trang')

  const deleteEnd = Math.min(endIndex || section.endIndex, doc.bodyEnd - 1)

  if (deleteEnd <= startIndex) return

  await batchUpdate([{ deleteContentRange: { range: rangeOf(startIndex, deleteEnd, doc.tabId) } }], revisionId || doc.revisionId)
}
