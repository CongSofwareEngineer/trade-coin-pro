'use client'
import FieldValue from '../FieldValue'

import { EditIcon } from '@/components/Icons'
import { DiscussionField, DiscussionItem } from '@/types/economy'
import { cn } from '@/utils/functions'

type Props = {
  fields: DiscussionField[]
  items: DiscussionItem[]
  canWrite: boolean
  expandedRows: number[]
  activeTag: string
  onToggleRow: (row: number) => void
  onTagClick: (tag: string) => void
  onEdit: (item: DiscussionItem) => void
  onDelete: (item: DiscussionItem) => void
}

/** Date columns stay on one line; everything else may wrap. */
const columnWidth = (field: DiscussionField) => {
  if (field.role === 'date') return 'w-36 whitespace-nowrap'
  if (field.role === 'status' || field.role === 'id') return 'w-32'
  if (field.role === 'author') return 'w-40'

  return 'min-w-[16rem]'
}

const DiscussionTable = ({ fields, items, canWrite, expandedRows, activeTag, onToggleRow, onTagClick, onEdit, onDelete }: Props) => {
  const headerClass = 'whitespace-nowrap p-4 text-left font-semibold text-white'
  const actionClass = 'flex items-center justify-center w-8 h-8 bg-gray-700 hover:bg-gray-600 border border-gray-600 rounded-lg transition-colors'

  return (
    <div className='bg-gray-800 rounded-lg shadow-lg border border-gray-700 overflow-hidden'>
      <div className='overflow-x-auto custom-scrollbar'>
        <table className='w-full text-sm'>
          <thead className='bg-gray-700 text-white'>
            <tr>
              <th className={cn(headerClass, 'w-10')}>
                <span className='sr-only'>Chi tiết</span>
              </th>
              {fields.map((field) => (
                <th key={field.key} className={cn(headerClass, columnWidth(field))}>
                  {field.key}
                </th>
              ))}
              {canWrite && <th className={cn(headerClass, 'w-px text-right')}>Thao tác</th>}
            </tr>
          </thead>

          <tbody>
            {items.map((item) => {
              const isOpen = expandedRows.includes(item.row)

              return (
                <tr key={item.row} className={cn('border-b border-gray-700 align-top', isOpen ? 'bg-gray-700/40' : 'hover:bg-gray-700/20')}>
                  <td className='px-3 py-3'>
                    <button
                      aria-expanded={isOpen}
                      aria-label={isOpen ? 'Thu gọn chi tiết' : 'Mở chi tiết'}
                      className='flex items-center justify-center w-6 h-6 rounded text-gray-400 hover:text-blue-400 transition-colors'
                      type='button'
                      onClick={() => onToggleRow(item.row)}
                    >
                      <span className={cn('transition-transform duration-200', isOpen && 'rotate-90')}>›</span>
                    </button>
                  </td>

                  {fields.map((field) => (
                    <td key={field.key} className={cn('p-4 text-gray-300', field.role === 'date' && 'text-gray-400')}>
                      <FieldValue activeTag={activeTag} clamp={!isOpen} field={field} item={item} onTagClick={onTagClick} />
                    </td>
                  ))}

                  {canWrite && (
                    <td className='p-4'>
                      <div className='flex items-center justify-end gap-2'>
                        <button aria-label='Sửa' className={actionClass} type='button' onClick={() => onEdit(item)}>
                          <EditIcon />
                        </button>
                        <button
                          className='px-3 py-1.5 bg-gray-700 hover:bg-red-600 border border-gray-600 rounded-lg text-[11px] uppercase text-gray-300 transition-colors'
                          type='button'
                          onClick={() => onDelete(item)}
                        >
                          Xoá
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default DiscussionTable
