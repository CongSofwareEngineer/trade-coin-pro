'use client'
import React, { useEffect, useState } from 'react'

import UniScreen from './client'

function UniPage() {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)

    return () => {
      setIsClient(false)
    }
  }, [])

  return isClient ? <UniScreen /> : <></>
}

export default UniPage
