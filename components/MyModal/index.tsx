'use client'
import { CloseIcon } from '../Icons'

import useModal from '@/hooks/useModal'
import { cn } from '@/utils/functions'
import { Modal } from '@/zustand/modal'

const MyModal = () => {
  const { listModals, closeModal } = useModal()

  const onClick = (event: any, modal: Modal) => {
    if (event.target === event.currentTarget) {
      if (modal.overClickClose) {
        closeModal()
      }
    }
  }

  const getPosition = (modal: Modal) => {
    switch (modal.placement || 'center') {
      case 'center':
        return {
          alignItems: 'center',
          justifyContent: 'center',
        }

      case 'top-left':
        return {}

      case 'top-right':
        return { alignItems: 'end' }

      case 'bottom-left':
        return { justifyContent: 'end' }

      default:
        return { alignItems: 'end', justifyContent: 'end' }
    }
  }

  const getPositionBody = (modal: Modal) => {
    switch (modal.placement || 'center') {
      case 'center':
        return {}

      case 'top-left':
        return {
          top: 20,
          left: 20,
        }

      case 'top-right':
        return {
          top: 20,
          right: 20,
        }

      case 'bottom-left':
        return {
          bottom: 20,
          left: 20,
        }

      default:
        return { bottom: 20, right: 20 }
    }
  }

  return (
    <>
      {listModals.map((modal, index) => (
        <div
          key={`modal-${index}`}
          className={cn(
            'fixed inset-0 z-[9999] flex flex-col items-center justify-center w-[100dvw] h-[100dvh] bg-black/50',
            modal?.classNames?.backdrop
          )}
          style={{
            backdropFilter: 'blur(5px)',
            ...getPosition(modal),
          }}
          onClick={(e) => onClick(e, modal)}
        >
          <div
            className={cn(
              'relative flex flex-col w-[90dvw] md:w-[500px] max-w-none max-h-[calc(100dvh-100px)] overflow-y-auto overscroll-contain custom-scrollbar p-5 bg-gray-800 border border-gray-700 rounded-lg shadow-2xl animate-zoom',
              modal.classNames?.container
            )}
            style={getPositionBody(modal)}
          >
            {modal.showBtnClose && (
              <div className='absolute z-10 right-4 top-4 flex justify-end'>
                <button
                  className='text-gray-400 hover:text-white transition-colors'
                  type='button'
                  onClick={() => {
                    closeModal()
                    if (modal?.callBackAfter) {
                      modal?.callBackAfter()
                    }
                  }}
                >
                  <CloseIcon className='size-5 cursor-pointer' />
                </button>
              </div>
            )}
            {modal.title && <div className='mb-3 pr-8 w-full text-lg font-semibold text-white'>{modal.title}</div>}
            <div className={cn('flex flex-1 w-full overflow-auto', modal.classNames?.body)}>{modal.children}</div>
          </div>
        </div>
      ))}
    </>
  )
}

export default MyModal
