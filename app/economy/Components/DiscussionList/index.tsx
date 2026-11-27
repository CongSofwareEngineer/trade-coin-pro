'use client'
import FieldValue from '../FieldValue'

import { EditIcon } from '@/components/Icons'
import { DiscussionField, DiscussionItem } from '@/types/economy'
import { isAutoDateField, valueOf } from '@/utils/economy'
import { cn } from '@/utils/functions'

type Props = {
  fields: DiscussionField[]
  items: DiscussionItem[]
  canWrite: boolean
  activeTag: string
  onTagClick: (tag: string) => void
  onEdit: (item: DiscussionItem) => void
  onDelete: (item: DiscussionItem) => void
}

/**
 * Mobile view: no columns and no sideways scrolling. Each record is one block,
 * every column stacked as a bold label over its value.
 */
const DiscussionList = ({ fields, items, canWrite, activeTag, onTagClick, onEdit, onDelete }: Props) => {
  // The owner's own date column becomes the heading of the block
  const headerField = fields.find((field) => field.role === 'date' && !isAutoDateField(field))
  const bodyFields = fields.filter((field) => field.key !== headerField?.key && field.role !== 'id')

  return (
    <ul className='flex flex-col gap-4'>
      {items.map((item) => (
        <li key={item.row} className='flex flex-col gap-4 bg-gray-800 border border-gray-700 rounded-lg p-5'>
          <div className='flex items-center gap-3 border-b border-gray-700 pb-3'>
            <div className='flex flex-1 flex-col gap-0.5'>
              <span className='text-[11px] uppercase text-gray-500'>Dòng {item.row}</span>
              <span className='text-lg font-bold text-white'>{valueOf(item, headerField) || '—'}</span>
            </div>

            {canWrite && (
              <div className='flex shrink-0 items-center gap-2'>
                <button
                  aria-label='Sửa'
                  className='flex items-center justify-center w-9 h-9 bg-gray-700 hover:bg-gray-600 border border-gray-600 rounded-lg transition-colors'
                  type='button'
                  onClick={() => onEdit(item)}
                >
                  <EditIcon />
                </button>
                <button
                  className='px-3 py-2 bg-gray-700 hover:bg-red-600 border border-gray-600 rounded-lg text-[11px] uppercase text-gray-300 transition-colors'
                  type='button'
                  onClick={() => onDelete(item)}
                >
                  Xoá
                </button>
              </div>
            )}
          </div>

          <dl className='flex flex-col gap-4'>
            {bodyFields.map((field) => (
              <div key={field.key} className='flex flex-col gap-1.5'>
                <dt className='text-[11px] font-bold uppercase text-blue-400'>{field.key}</dt>
                <dd className={cn('text-[15px] text-gray-300', field.role === 'date' && 'text-gray-400')}>
                  <FieldValue activeTag={activeTag} field={field} item={item} onTagClick={onTagClick} />
                </dd>
              </div>
            ))}
          </dl>
        </li>
      ))}
    </ul>
  )
}

export default DiscussionList
