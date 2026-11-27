'use client'
import { FormEvent, useMemo, useState } from 'react'

import { ECONOMY_MAX_CELL_LENGTH } from '@/constants/economy'
import useMedia from '@/hooks/useMedia'
import EconomyApi from '@/services/EconomyApi'
import { DiscussionField, DiscussionItem } from '@/types/economy'
import { contentFields, isAutoDateField, isLongField, titleField } from '@/utils/economy'

const INPUT_CLASS = 'w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500'

const todayText = () => new Date().toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', day: '2-digit', month: '2-digit', year: 'numeric' })

type Props = {
  fields: DiscussionField[]
  /** Undefined means "create", an item means "edit that row" */
  item?: DiscussionItem
  refetch: () => void
  onCancel: () => void
  onSuccess: () => void
}

/**
 * The fields come from the sheet's own header row, so adding a column in Google Sheets
 * adds the matching field here with no code change.
 */
const DiscussionForm = ({ fields, item, refetch, onCancel, onSuccess }: Props) => {
  const { isMobile } = useMedia()

  // Only the id column and the bookkeeping timestamps are left to the server
  const editableFields = useMemo(() => fields.filter((field) => field.role !== 'id' && !isAutoDateField(field)), [fields])

  // Without a title column, the first content column is the one that may not be empty
  const headline = useMemo(() => titleField(editableFields) || contentFields(editableFields)[0], [editableFields])

  const initialValues = useMemo(
    () =>
      editableFields.reduce<Record<string, string>>((result, field) => {
        // A new row starts with today in the owner's own date column
        const fallback = !item && field.role === 'date' ? todayText() : ''

        return { ...result, [field.key]: item?.values[field.key] || fallback }
      }, {}),
    [editableFields, item]
  )

  const [values, setValues] = useState(initialValues)
  const [error, setError] = useState('')
  const [isPending, setIsPending] = useState(false)

  // Decided once: switching an input to a textarea mid typing would drop focus
  const longKeys = useMemo(
    () => editableFields.filter((field) => isLongField(field, initialValues[field.key])).map((field) => field.key),
    [editableFields, initialValues]
  )

  const handleChange = (key: string, value: string) => setValues((previous) => ({ ...previous, [key]: value }))

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()

    if (headline && !values[headline.key]?.trim()) {
      setError(`Vui lòng nhập ${headline.key}`)

      return
    }

    setError('')
    setIsPending(true)

    try {
      if (item) await EconomyApi.updateDiscussion(item.row, values)
      else await EconomyApi.createDiscussion(values)

      refetch()
      onSuccess()
    } catch (err) {
      console.error(err)
      setError(err instanceof Error ? err.message : 'Không lưu được dữ liệu')
    } finally {
      setIsPending(false)
    }
  }

  return (
    <form className='flex w-full flex-col gap-4' onSubmit={handleSubmit}>
      {item && <p className='text-xs uppercase text-gray-500'>Dòng {item.row}</p>}

      {editableFields.length === 0 && (
        <p className='text-sm text-gray-400'>Sheet chưa có dòng tiêu đề. Khi bạn thêm chủ đề đầu tiên, hệ thống sẽ tự tạo các cột mặc định.</p>
      )}

      {editableFields.map((field) => (
        <div key={field.key} className='flex flex-col gap-2'>
          <label className='block text-sm font-medium text-gray-300' htmlFor={`economy-${field.index}`}>
            {field.key}
            {field.key === headline?.key && <span className='text-red-400'> *</span>}
          </label>

          {longKeys.includes(field.key) ? (
            <>
              <textarea
                className={`${INPUT_CLASS} resize-y custom-scrollbar`}
                id={`economy-${field.index}`}
                maxLength={ECONOMY_MAX_CELL_LENGTH}
                rows={isMobile ? 5 : 6}
                value={values[field.key] || ''}
                onChange={(event) => handleChange(field.key, event.target.value)}
              />
              <span className='self-end text-[11px] text-gray-500'>
                {(values[field.key] || '').length}/{ECONOMY_MAX_CELL_LENGTH}
              </span>
            </>
          ) : (
            <input
              className={INPUT_CLASS}
              id={`economy-${field.index}`}
              maxLength={ECONOMY_MAX_CELL_LENGTH}
              type='text'
              value={values[field.key] || ''}
              onChange={(event) => handleChange(field.key, event.target.value)}
            />
          )}
        </div>
      ))}

      {error && <p className='text-sm text-red-400'>{error}</p>}

      <div className='flex items-center justify-end gap-3 pt-1'>
        <button
          className='px-4 py-2 bg-gray-700 hover:bg-gray-600 border border-gray-600 rounded-lg text-sm text-white transition-colors disabled:opacity-40'
          disabled={isPending}
          type='button'
          onClick={onCancel}
        >
          Huỷ
        </button>
        <button
          className='px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm text-white transition-colors disabled:opacity-40'
          disabled={isPending}
          type='submit'
        >
          {isPending ? 'Đang lưu...' : 'Lưu'}
        </button>
      </div>
    </form>
  )
}

export default DiscussionForm
