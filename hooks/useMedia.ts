'use client'
import { useEffect, useState } from 'react'

import { BREAKPOINT_MOBILE } from '@/constants/app'

//bảng của /economy không vừa màn hình hẹp, dưới mốc này đổi sang dạng list
const useMedia = (breakpoint: number = BREAKPOINT_MOBILE) => {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const query = window.matchMedia(`(max-width: ${breakpoint - 1}px)`)

    const update = () => setIsMobile(query.matches)

    update()
    query.addEventListener('change', update)

    return () => query.removeEventListener('change', update)
  }, [breakpoint])

  return { isMobile }
}

export default useMedia
