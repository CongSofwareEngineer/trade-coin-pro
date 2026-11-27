import { useLayoutEffect, useState } from 'react'

const useMedia = (maxWidth = 768) => {
  const [isMobile, setIsMobile] = useState(true)

  useLayoutEffect(() => {
    let mounted = true
    const mql = window.matchMedia(`(max-width: ${maxWidth}px)`)
    const onChange = () => {
      if (!mounted) {
        return
      }
      setIsMobile(!!mql.matches)
    }

    mql.addEventListener('change', onChange)
    setIsMobile(mql.matches)

    return () => {
      mounted = false
      mql.removeEventListener('change', onChange)
    }
  }, [maxWidth])

  return {
    isMobile: isMobile || false,
  }
}

export default useMedia
