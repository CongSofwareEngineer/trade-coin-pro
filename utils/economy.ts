import { ECONOMY_AUTO_DATE_PATTERN, ECONOMY_LONG_TEXT_LENGTH, ECONOMY_STATUS_TONE } from '@/constants/economy'
import { DiscussionField, DiscussionFieldRole, DiscussionItem } from '@/types/economy'

/** First column playing this role, or undefined when the sheet has no such column. */
export const fieldByRole = (fields: DiscussionField[], role: DiscussionFieldRole) => fields.find((field) => field.role === role)

export const fieldsByRole = (fields: DiscussionField[], role: DiscussionFieldRole) => fields.filter((field) => field.role === role)

/** A date column the server maintains itself ("Ngày tạo", "Cập nhật") rather than the owner. */
export const isAutoDateField = (field: DiscussionField) => field.role === 'date' && ECONOMY_AUTO_DATE_PATTERN.test(field.key)

/**
 * The column used as the card headline. Undefined when the sheet has no title-like
 * column, in which case the card falls back to its date / row number.
 */
export const titleField = (fields: DiscussionField[]) => fieldByRole(fields, 'title')

const META_ROLES: DiscussionFieldRole[] = ['id', 'date', 'author', 'tags', 'status', 'link']

/**
 * Columns rendered as the card body. Falls back to "everything that is not metadata"
 * so a sheet with no recognisable content column still shows its text.
 */
export const contentFields = (fields: DiscussionField[]) => {
  const byRole = fieldsByRole(fields, 'content')

  if (byRole.length > 0) return byRole

  const headline = titleField(fields)

  return fields.filter((field) => !META_ROLES.includes(field.role) && field.key !== headline?.key)
}

export const valueOf = (item: DiscussionItem, field?: DiscussionField) => (field ? item.values[field.key] || '' : '')

/** The line shown where a title would go when the sheet has no title column. */
export const headlineOf = (fields: DiscussionField[], item: DiscussionItem) => {
  const headline = titleField(fields)

  if (headline) return valueOf(item, headline)

  const dateField = fields.find((field) => field.role === 'date' && !isAutoDateField(field)) || fieldByRole(fields, 'date')

  return valueOf(item, dateField)
}

export const splitTags = (value: string) =>
  value
    .split(/[,;|/]+/)
    .map((tag) => tag.trim())
    .filter(Boolean)

export const statusTone = (value: string) =>
  ECONOMY_STATUS_TONE.find((tone) => tone.pattern.test(value))?.className || 'border-cyan-300/40 bg-cyan-400/10 text-cyan-200'

export const matchesKeyword = (item: DiscussionItem, keyword: string) => {
  if (!keyword.trim()) return true

  const needle = keyword.trim().toLowerCase()

  return Object.values(item.values).some((value) => value.toLowerCase().includes(needle))
}

/** All distinct tag values across the sheet, for the filter chips. */
export const collectTags = (fields: DiscussionField[], items: DiscussionItem[]) => {
  const tagFields = fieldsByRole(fields, 'tags')

  if (tagFields.length === 0) return []

  const tags = new Set<string>()

  items.forEach((item) => tagFields.forEach((field) => splitTags(valueOf(item, field)).forEach((tag) => tags.add(tag))))

  return Array.from(tags).sort((a, b) => a.localeCompare(b, 'vi'))
}

export const hasTag = (fields: DiscussionField[], item: DiscussionItem, tag: string) =>
  fieldsByRole(fields, 'tags').some((field) => splitTags(valueOf(item, field)).includes(tag))

/**
 * Picks a textarea over a single line input. Checks the value too, so a multi line
 * cell is never flattened by being edited through an <input>.
 */
export const isLongField = (field: DiscussionField, value = '') =>
  field.role === 'content' || value.includes('\n') || value.length > ECONOMY_LONG_TEXT_LENGTH
