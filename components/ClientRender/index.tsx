'use client'
import dynamic from 'next/dynamic'
import { PropsWithChildren } from 'react'

const MyModal = dynamic(() => import('../MyModal'))
const MyDrawer = dynamic(() => import('../MyDrawer'))

//mount 1 lần cho cả app, modal / drawer mở qua hook useModal
const ClientRender = ({ children }: PropsWithChildren) => {
  return (
    <>
      {children}

      <MyModal />
      <MyDrawer />
    </>
  )
}

export default ClientRender
