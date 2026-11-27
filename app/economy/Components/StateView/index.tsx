'use client'
import { ReactNode } from 'react'

export const LoadingState = () => (
  <div className='flex flex-col gap-4'>
    <p className='flex items-center justify-center gap-3 text-sm text-gray-400'>
      <span className='w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse' />
      Đang đồng bộ dữ liệu...
    </p>
    {[0, 1, 2].map((item) => (
      <div key={item} className='h-32 w-full bg-gray-800 border border-gray-700 rounded-lg animate-pulse' />
    ))}
  </div>
)

export const ErrorState = ({ message, onRetry }: { message?: string; onRetry: () => void }) => (
  <div className='flex flex-col items-center gap-4 bg-gray-800 border border-red-500/40 rounded-lg p-8 text-center'>
    <p className='text-xl font-semibold text-red-400'>Không tải được dữ liệu</p>
    {message && <p className='max-w-xl text-sm text-gray-400'>{message}</p>}
    <button
      className='px-4 py-2 bg-gray-700 hover:bg-gray-600 border border-gray-600 rounded-lg text-sm text-white transition-colors'
      type='button'
      onClick={onRetry}
    >
      Thử lại
    </button>
  </div>
)

export const NoticeState = ({ children }: { children: ReactNode }) => (
  <div className='bg-gray-800 border border-yellow-500/40 rounded-lg p-6 text-sm leading-relaxed text-yellow-200'>{children}</div>
)

export const EmptyState = ({ message, action }: { message: ReactNode; action?: ReactNode }) => (
  <div className='flex flex-col items-center gap-4 bg-gray-800 border border-gray-700 rounded-lg p-10 text-center'>
    <span aria-hidden className='text-3xl text-gray-500'>
      ∅
    </span>
    <p className='max-w-md text-sm text-gray-400'>{message}</p>
    {action}
  </div>
)
