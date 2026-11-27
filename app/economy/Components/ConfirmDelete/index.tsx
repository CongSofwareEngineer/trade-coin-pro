'use client'
import { ReactNode, useState } from 'react'

type Props = {
  /** What is about to be removed, shown so the user can recognise it */
  subject: ReactNode
  onConfirm: () => Promise<unknown>
  refetch: () => void
  onCancel: () => void
  onSuccess: () => void
}

const ConfirmDelete = ({ subject, onConfirm, refetch, onCancel, onSuccess }: Props) => {
  const [error, setError] = useState('')
  const [isPending, setIsPending] = useState(false)

  const handleConfirm = async () => {
    setError('')
    setIsPending(true)

    try {
      await onConfirm()
      refetch()
      onSuccess()
    } catch (err) {
      console.error(err)
      setError(err instanceof Error ? err.message : 'Không xoá được')
    } finally {
      setIsPending(false)
    }
  }

  return (
    <div className='flex w-full flex-col gap-4'>
      <p className='text-sm text-gray-400'>Mục này sẽ bị xoá khỏi file gốc trên Google. Bạn chắc chắn?</p>

      {subject && <p className='bg-gray-700 border border-gray-600 rounded-lg p-3 text-sm text-white whitespace-pre-line'>{subject}</p>}

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
          className='px-4 py-2 bg-red-600 hover:bg-red-500 rounded-lg text-sm text-white transition-colors disabled:opacity-40'
          disabled={isPending}
          type='button'
          onClick={handleConfirm}
        >
          {isPending ? 'Đang xoá...' : 'Xoá'}
        </button>
      </div>
    </div>
  )
}

export default ConfirmDelete
