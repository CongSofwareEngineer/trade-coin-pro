import useMedia from './useMedia'

import { Modal, modal as modalZustand } from '@/zustand/modal'
import { Drawer, drawer as drawerZustand } from '@/zustand/drawer'
type ModalProps = (Modal | Drawer) & {
  requiredModal?: boolean
  requiredDrawer?: boolean
}
const useModal = () => {
  const { isMobile } = useMedia()
  const { closeModal: closeModalModal, openModal: openModalModal, listModals } = modalZustand((state) => state)
  const { closeDrawer: closeModalDrawer, openDrawer: openModalDrawer } = drawerZustand((state) => state)

  const openModal = (config: ModalProps) => {
    if (config?.requiredModal) {
      openModalModal({
        ...(config as any),
        isOpen: true,
      })

      return
    }
    if (config?.requiredDrawer) {
      openModalDrawer({
        placement: 'bottom',
        ...(config as any),
        isOpen: true,
      })

      return
    }
    if (isMobile) {
      openModalDrawer({
        placement: 'bottom',
        ...(config as any),
        isOpen: true,
      })
    } else {
      openModalModal({
        ...(config as any),
        isOpen: true,
      })
    }
  }

  const closeModal = (type?: 'modal' | 'drawer') => {
    if (type === 'modal') {
      closeModalModal()

      return
    }
    if (type === 'drawer') {
      closeModalDrawer()

      return
    }
    if (isMobile) {
      closeModalDrawer()
    } else {
      closeModalModal()
    }
  }

  return { listModals, openModal, closeModal }
}

export default useModal
