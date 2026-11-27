'use client'
import { cn } from '@/utils/functions'

type Props = {
  page: number
  pageCount: number
  total: number
  pageSize: number
  onChange: (page: number) => void
}

/** Page numbers with ellipses: 1 … 4 5 6 … 20, always showing first, last and neighbours. */
const buildPages = (page: number, pageCount: number): (number | 'gap')[] => {
  if (pageCount <= 7) return Array.from({ length: pageCount }, (_, index) => index + 1)

  const pages = new Set([1, pageCount, page, page - 1, page + 1])

  if (page <= 3) [2, 3, 4].forEach((item) => pages.add(item))
  if (page >= pageCount - 2) [pageCount - 3, pageCount - 2, pageCount - 1].forEach((item) => pages.add(item))

  const sorted = Array.from(pages)
    .filter((item) => item >= 1 && item <= pageCount)
    .sort((a, b) => a - b)

  return sorted.reduce<(number | 'gap')[]>((result, item, index) => {
    if (index > 0 && item - (sorted[index - 1] as number) > 1) result.push('gap')
    result.push(item)

    return result
  }, [])
}

const Pagination = ({ page, pageCount, total, pageSize, onChange }: Props) => {
  if (pageCount <= 1) return null

  const from = (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, total)

  const arrowClass =
    'px-3 py-1.5 bg-gray-700 hover:bg-gray-600 border border-gray-600 rounded-lg text-[12px] text-gray-300 transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-gray-700'

  return (
    <div className='flex flex-col md:flex-row items-center justify-between gap-4 border-t border-gray-700 pt-5'>
      <span className='text-[12px] text-gray-400'>
        {from}–{to} trên {total}
      </span>

      <div className='flex items-center gap-1.5'>
        <button className={arrowClass} disabled={page <= 1} type='button' onClick={() => onChange(page - 1)}>
          ‹ Trước
        </button>

        {buildPages(page, pageCount).map((item, index) =>
          item === 'gap' ? (
            <span key={`gap-${index}`} className='px-1 text-gray-500'>
              …
            </span>
          ) : (
            <button
              key={item}
              aria-current={item === page ? 'page' : undefined}
              className={cn(
                'min-w-[36px] px-2.5 py-1.5 border rounded-lg text-xs transition-colors',
                item === page ? 'bg-blue-600 border-blue-500 text-white' : 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'
              )}
              type='button'
              onClick={() => onChange(item)}
            >
              {item}
            </button>
          )
        )}

        <button className={arrowClass} disabled={page >= pageCount} type='button' onClick={() => onChange(page + 1)}>
          Sau ›
        </button>
      </div>
    </div>
  )
}

export default Pagination
