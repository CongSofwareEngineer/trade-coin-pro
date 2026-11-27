'use client'
import { FormEvent, useState } from 'react'

import { ECONOMY_MAX_DOC_TEXT_LENGTH, ECONOMY_MAX_TITLE_LENGTH } from '@/constants/economy'
import useMedia from '@/hooks/useMedia'
import EconomyApi from '@/services/EconomyApi'
import { KnowledgeSection } from '@/types/economy'

const INPUT_CLASS = 'w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500'

type Props = {
  /** Undefined means "append a new section" */
  section?: KnowledgeSection
  /** Revision read when the form was opened — Docs rejects the write if the doc moved on */
  revisionId?: string
  refetch: () => void
  onCancel: () => void
  onSuccess: () => void
}

const KnowledgeForm = ({ section, revisionId, refetch, onCancel, onSuccess }: Props) => {
  const { isMobile } = useMedia()

  const [title, setTitle] = useState(section?.title || '')
  const [text, setText] = useState(section?.text || '')
  const [level, setLevel] = useState(section?.level || 2)
  const [error, setError] = useState('')
  const [isPending, setIsPending] = useState(false)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()

    if (!title.trim()) {
      setError('Vui lòng nhập Tiêu đề mục')

      return
    }

    setError('')
    setIsPending(true)

    try {
      if (section) {
        await EconomyApi.updateSection({ startIndex: section.startIndex, endIndex: section.endIndex, title: title.trim(), text, level, revisionId })
      } else {
        await EconomyApi.createSection({ title: title.trim(), text, level, revisionId })
      }

      refetch()
      onSuccess()
    } catch (err) {
      console.error(err)
      const message = err instanceof Error ? err.message : ''

      // Docs rejects the write when the revision moved on — tell the user to refresh
      setError(/revision/i.test(message) ? 'Tài liệu vừa được người khác sửa. Hãy tải lại rồi thử lại.' : message || 'Không lưu được dữ liệu')
    } finally {
      setIsPending(false)
    }
  }

  return (
    <form className='flex w-full flex-col gap-4' onSubmit={handleSubmit}>
      <div className='flex flex-col gap-2'>
        <label className='block text-sm font-medium text-gray-300' htmlFor='knowledge-title'>
          Tiêu đề mục<span className='text-red-400'> *</span>
        </label>
        <input
          className={INPUT_CLASS}
          id='knowledge-title'
          maxLength={ECONOMY_MAX_TITLE_LENGTH}
          placeholder='Ví dụ: Lạm phát là gì'
          type='text'
          value={title}
          onChange={(event) => setTitle(event.target.value)}
        />
      </div>

      <div className='flex flex-col gap-2'>
        <label className='block text-sm font-medium text-gray-300' htmlFor='knowledge-level'>
          Cấp tiêu đề
        </label>
        <select className={INPUT_CLASS} id='knowledge-level' value={level} onChange={(event) => setLevel(Number(event.target.value))}>
          <option value={1}>Cấp 1 (mục lớn)</option>
          <option value={2}>Cấp 2 (mục con)</option>
        </select>
      </div>

      <div className='flex flex-col gap-2'>
        <label className='block text-sm font-medium text-gray-300' htmlFor='knowledge-body'>
          Nội dung
        </label>
        <textarea
          className={`${INPUT_CLASS} resize-y custom-scrollbar`}
          id='knowledge-body'
          maxLength={ECONOMY_MAX_DOC_TEXT_LENGTH}
          placeholder='Mỗi dòng là một đoạn. Bắt đầu dòng bằng "- " để tạo gạch đầu dòng.'
          rows={isMobile ? 8 : 12}
          value={text}
          onChange={(event) => setText(event.target.value)}
        />
        <span className='self-end text-[11px] text-gray-500'>
          {text.length}/{ECONOMY_MAX_DOC_TEXT_LENGTH}
        </span>
      </div>

      <p className='text-xs text-gray-500'>Mỗi dòng là một đoạn văn. Dòng bắt đầu bằng &quot;- &quot; sẽ thành danh sách gạch đầu dòng.</p>

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

export default KnowledgeForm
