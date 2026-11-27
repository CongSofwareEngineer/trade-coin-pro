'use client'
import { ReactNode } from 'react'

type Props = {
  title: string
  children: ReactNode
  className?: string
  onClose: () => void
}

//modal viết tay như /trade-info, không dùng lib ngoài
const Modal = ({ title, children, className = 'max-w-2xl', onClose }: Props) => {
  return (
    <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'>
      <div className={`bg-gray-800 rounded-lg shadow-xl border border-gray-700 w-full ${className} max-h-[90vh] flex flex-col`}>
        <div className='flex justify-between items-center p-6 border-b border-gray-700'>
          <h2 className='text-xl font-semibold text-white'>{title}</h2>
          <button className='text-gray-400 hover:text-white transition-colors' type='button' onClick={onClose}>
            <svg className='w-6 h-6' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path d='M6 18L18 6M6 6l12 12' strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} />
            </svg>
          </button>
        </div>

        <div className='p-6 overflow-y-auto custom-scrollbar'>{children}</div>
      </div>
    </div>
  )
}

export default Modal
