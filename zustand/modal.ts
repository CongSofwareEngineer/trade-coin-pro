import { ReactNode } from 'react'
import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

export type Modal = {
  addModal?: boolean
  callBackAfter?: () => any
  showBtnClose?: boolean
  children?: ReactNode
  title?: ReactNode
  classNames?: {
    container?: string
    body?: string
    header?: string
    backdrop?: string
  }
  overClickClose?: boolean
  placement?: 'center' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
}

interface ModalState {
  listModals: Modal[]
  openModal: (nextModalAdmin: Modal) => void
  closeModal: (isIconClose?: boolean) => void
}
export const modal = create<ModalState>()(
  devtools(
    (set, get) => ({
      listModals: [],
      openModal: (param: Modal) => {
        const listModals = get().listModals
        const newModal = {
          showBtnClose: true,
          overClickClose: true,
          ...param,
        }

        if (param.addModal) {
          listModals.push(newModal)
        } else {
          listModals[listModals.length === 0 ? 0 : listModals.length - 1] = newModal
        }
        set({ listModals })
        document.body.style.overflow = 'hidden'
      },
      closeModal: () => {
        const listModals = get().listModals
        const modal = listModals.pop()

        modal?.callBackAfter && modal?.callBackAfter()

        set({ listModals })
        if (listModals.length === 0) {
          document.body.style.removeProperty('overflow')
        }
      },
    }),
    {
      name: 'modal-zustand',
      enabled: process.env.NEXT_PUBLIC_APP_ENV !== 'production',
    }
  )
)
