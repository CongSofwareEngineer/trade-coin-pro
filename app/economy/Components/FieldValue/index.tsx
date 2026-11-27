'use client'
import { DiscussionField, DiscussionItem } from '@/types/economy'
import { splitTags, statusTone, valueOf } from '@/utils/economy'
import { cn } from '@/utils/functions'

const BULLET = /^\s*[-*•]\s+/

type Line = { text: string; isBullet: boolean }

/** Cells in this sheet are written as "- item" lines, so render them as a real list. */
const parseLines = (value: string): Line[] =>
  value
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((raw) => ({ text: raw.replace(BULLET, '').trim(), isBullet: BULLET.test(raw) }))
    .filter((line) => line.text.length > 0)

type Group = { kind: 'list'; items: string[] } | { kind: 'text'; text: string }

const groupLines = (lines: Line[]) =>
  lines.reduce<Group[]>((groups, line) => {
    const last = groups[groups.length - 1]

    if (line.isBullet) {
      if (last?.kind === 'list') last.items.push(line.text)
      else groups.push({ kind: 'list', items: [line.text] })

      return groups
    }

    groups.push({ kind: 'text', text: line.text })

    return groups
  }, [])

type Props = {
  item: DiscussionItem
  field: DiscussionField
  activeTag?: string
  onTagClick?: (tag: string) => void
  /** Cut the value down to a couple of lines, for the collapsed table row */
  clamp?: boolean
}

/** One cell, rendered the way its column's role deserves. Shared by the table and the mobile list. */
const FieldValue = ({ item, field, activeTag = '', onTagClick, clamp }: Props) => {
  const value = valueOf(item, field)

  if (!value) return <span className='text-gray-600'>—</span>

  if (field.role === 'status') {
    return <span className={cn('inline-block px-2.5 py-1 border rounded-full text-[11px] uppercase', statusTone(value))}>{value}</span>
  }

  if (field.role === 'tags') {
    return (
      <span className='flex flex-wrap gap-1.5'>
        {splitTags(value).map((tag) => (
          <button
            key={tag}
            className={cn(
              'px-2 py-0.5 border rounded-full text-[11px] transition-colors',
              activeTag === tag ? 'bg-blue-600 border-blue-500 text-white' : 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'
            )}
            type='button'
            onClick={() => onTagClick?.(activeTag === tag ? '' : tag)}
          >
            #{tag}
          </button>
        ))}
      </span>
    )
  }

  if (field.role === 'link' && /^https?:\/\//.test(value)) {
    return (
      <a className='break-all text-blue-400 underline underline-offset-4 hover:text-blue-300' href={value} rel='noopener noreferrer' target='_blank'>
        {value.replace(/^https?:\/\//, '')}
      </a>
    )
  }

  const groups = groupLines(parseLines(value))

  return (
    // line-clamp sets its own display, so it must not be combined with flex
    <div className={cn('leading-relaxed', clamp ? 'line-clamp-2' : 'flex flex-col gap-2')}>
      {groups.map((group, index) =>
        group.kind === 'list' ? (
          <ul key={index} className='flex flex-col gap-1.5 list-disc pl-5'>
            {group.items.map((text, itemIndex) => (
              <li key={itemIndex} className='marker:text-blue-400'>
                {text}
              </li>
            ))}
          </ul>
        ) : (
          <p key={index}>{group.text}</p>
        )
      )}
    </div>
  )
}

export default FieldValue
