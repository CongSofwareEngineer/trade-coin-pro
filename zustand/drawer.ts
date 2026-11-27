import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

import { ZUSTAND } from '@/constants/zustand'

export type Drawer = {
  callBackAfter?: () => any
  placement?: 'top' | 'bottom' | 'left' | 'right'
  className?: string
  title?: React.ReactNode
  isOpen?: boolean
  children?: React.ReactNode
}

interface DrawerState {
  [ZUSTAND.Drawer]: Drawer
  openDrawer: (nextDrawerAdmin: Drawer) => void
  closeDrawer: (isIconClose?: boolean) => void
}
export const drawer = create<DrawerState>()(
  devtools(
    (set, get) => ({
      [ZUSTAND.Drawer]: {
        isOpen: false,
      },
      openDrawer: (param: Drawer) => {
        set({
          [ZUSTAND.Drawer]: {
            placement: 'bottom',

            ...param,
            isOpen: true,
          },
        })
      },
      closeDrawer: () => {
        const drawer = get()[ZUSTAND.Drawer]

        drawer.callBackAfter && drawer.callBackAfter()
        const init = {
          [ZUSTAND.Drawer]: {
            ...drawer,
            children: null,
            isOpen: false,
          },
        }

        set(init as any)
      },
    }),
    {
      name: 'modal-zustand',
      enabled: process.env.NEXT_PUBLIC_APP_ENV !== 'production',
    }
  )
)
