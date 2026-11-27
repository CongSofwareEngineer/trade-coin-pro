import { googleFetch } from './auth'

import {
  ECONOMY_DEFAULT_HEADERS,
  ECONOMY_FIELD_ROLES,
  ECONOMY_FIRST_DATA_ROW,
  ECONOMY_MAX_CELL_LENGTH,
  ECONOMY_SHEET_READ_RANGE,
  getEconomySheetId,
  GOOGLE_SHEETS_API_URL,
} from '@/constants/economy'
import { DiscussionField, DiscussionItem } from '@/types/economy'
import { isAutoDateField } from '@/utils/economy'

// Server only. Every export here is reached through /api/economy/* so the key stays off the client.

const sheetUrl = (suffix: string) => `${GOOGLE_SHEETS_API_URL}/${getEconomySheetId()}${suffix}`

const columnLetter = (index: number) => {
  let rest = index
  let letter = ''

  do {
    letter = String.fromCharCode(65 + (rest % 26)) + letter
    rest = Math.floor(rest / 26) - 1
  } while (rest >= 0)

  return letter
}

let cachedSheet: { sheetId: number; title: string } | null = null

/** First visible tab of the spreadsheet — the one the page reads and writes. */
const getFirstSheet = async () => {
  if (cachedSheet) return cachedSheet

  const result = await googleFetch(sheetUrl('?fields=sheets.properties(sheetId,title,index,hidden)'))
  const sheets: any[] = result?.sheets || []
  const target = sheets.find((item) => !item?.properties?.hidden) || sheets[0]

  if (!target) throw new Error('Spreadsheet has no sheet')

  cachedSheet = { sheetId: Number(target.properties.sheetId), title: String(target.properties.title) }

  return cachedSheet
}

const roleOf = (header: string) => ECONOMY_FIELD_ROLES.find((item) => item.pattern.test(header))?.role || 'other'

/**
 * Builds the field list from the header row, so renaming or adding a column in the
 * sheet changes the UI and the forms without a code change.
 */
const buildFields = (headerRow: string[]): DiscussionField[] => {
  const seen = new Set<string>()

  return headerRow
    .map((raw, index) => ({ raw: String(raw ?? '').trim(), index }))
    .filter((item) => item.raw.length > 0)
    .map((item) => {
      // Two columns with the same header would collide inside `values`
      let key = item.raw

      while (seen.has(key)) key = `${key} (${item.index + 1})`
      seen.add(key)

      return { key, index: item.index, role: roleOf(item.raw) }
    })
}

const readRange = async (range: string) => {
  const { title } = await getFirstSheet()
  const encoded = encodeURIComponent(`${title}!${range}`)
  const result = await googleFetch(sheetUrl(`/values/${encoded}?majorDimension=ROWS&valueRenderOption=FORMATTED_VALUE`))

  return (result?.values || []) as string[][]
}

export const readDiscussions = async () => {
  const rows = await readRange(ECONOMY_SHEET_READ_RANGE)
  const headerRow = rows[0] || []
  const fields = buildFields(headerRow)

  const items: DiscussionItem[] = rows.slice(1).reduce<DiscussionItem[]>((list, row, offset) => {
    const values: Record<string, string> = {}
    let hasValue = false

    fields.forEach((field) => {
      const cell = String(row?.[field.index] ?? '').trim()

      values[field.key] = cell
      if (cell) hasValue = true
    })

    // Blank rows in the middle of the sheet are spacing, not records
    if (hasValue) list.push({ row: ECONOMY_FIRST_DATA_ROW + offset, values })

    return list
  }, [])

  return { fields, items }
}

/** Writes the default header row the first time, so an empty sheet still gets a usable form. */
export const ensureHeaders = async () => {
  const { fields } = await readDiscussions()

  if (fields.length > 0) return fields

  const { title } = await getFirstSheet()
  const range = encodeURIComponent(`${title}!A1`)

  await googleFetch(sheetUrl(`/values/${range}?valueInputOption=RAW&includeValuesInResponse=false`), {
    method: 'PUT',
    body: JSON.stringify({ values: [[...ECONOMY_DEFAULT_HEADERS]] }),
  })

  return buildFields([...ECONOMY_DEFAULT_HEADERS])
}

const sanitize = (value: unknown) => String(value ?? '').slice(0, ECONOMY_MAX_CELL_LENGTH)

const nowText = () =>
  new Date().toLocaleString('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    hour12: false,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

/**
 * Lays the submitted values out in sheet column order.
 *
 * Only bookkeeping date columns ("Ngày tạo", "Cập nhật") are filled in here. A plain
 * date column is the owner's own data, so it is edited through the form and left alone.
 */
const buildRow = (fields: DiscussionField[], values: Record<string, string>, isCreate: boolean, previous?: string[]) => {
  const width = Math.max(...fields.map((field) => field.index), 0) + 1
  const row: string[] = Array.from({ length: width }, (_, index) => sanitize(previous?.[index] ?? ''))

  fields.forEach((field) => {
    const submitted = values[field.key]

    if (submitted !== undefined) {
      row[field.index] = sanitize(submitted)

      return
    }

    if (!isAutoDateField(field)) return

    // "Cập nhật" moves on every write, "Ngày tạo" is stamped once
    if (/cập\s*nhật|cap\s*nhat|updated|sửa|sua\b|modified/i.test(field.key)) row[field.index] = nowText()
    else if (isCreate && !row[field.index]) row[field.index] = nowText()
  })

  return row
}

export const createDiscussion = async (values: Record<string, string>) => {
  const fields = await ensureHeaders()
  const { title } = await getFirstSheet()
  const range = encodeURIComponent(`${title}!A1`)
  const row = buildRow(fields, values, true)

  // RAW keeps user text as text — a leading "=" can never run as a sheet formula.
  // INSERT_ROWS appends below the data instead of overwriting anything.
  await googleFetch(sheetUrl(`/values/${range}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`), {
    method: 'POST',
    body: JSON.stringify({ values: [row] }),
  })

  return { fields, row }
}

export const updateDiscussion = async (rowNumber: number, values: Record<string, string>) => {
  if (!Number.isInteger(rowNumber) || rowNumber < ECONOMY_FIRST_DATA_ROW) throw new Error('Invalid row')

  const { fields } = await readDiscussions()

  if (fields.length === 0) throw new Error('Sheet has no header row')

  const { title } = await getFirstSheet()
  const existing = (await readRange(`A${rowNumber}:Z${rowNumber}`))[0] || []

  if (existing.every((cell) => !String(cell ?? '').trim())) throw new Error('Row no longer exists')

  const row = buildRow(fields, values, false, existing)
  const lastColumn = columnLetter(row.length - 1)
  const range = encodeURIComponent(`${title}!A${rowNumber}:${lastColumn}${rowNumber}`)

  await googleFetch(sheetUrl(`/values/${range}?valueInputOption=RAW`), {
    method: 'PUT',
    body: JSON.stringify({ values: [row] }),
  })

  return { fields, row }
}

export const deleteDiscussion = async (rowNumber: number) => {
  if (!Number.isInteger(rowNumber) || rowNumber < ECONOMY_FIRST_DATA_ROW) throw new Error('Invalid row')

  const { sheetId } = await getFirstSheet()

  await googleFetch(sheetUrl(':batchUpdate'), {
    method: 'POST',
    body: JSON.stringify({
      requests: [{ deleteDimension: { range: { sheetId, dimension: 'ROWS', startIndex: rowNumber - 1, endIndex: rowNumber } } }],
    }),
  })
}
