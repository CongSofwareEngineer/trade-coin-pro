import { useQuery } from '@tanstack/react-query'

import { QUERY_KEY } from '@/constants/reactQuery'
import { LOCAL_STORE_KEY } from '@/constants/storage'
import { MVRV_CACHE_TIME, MVRV_ZONES } from '@/constants/app'
import { MVRV_ENDPOINT } from '@/constants/api'
import { getDataLocal, removeDataLocal, saveDataLocal } from '@/services/Storage'
import fetcher from '@/configs/fetcher'

export type MvrvInfo = {
  date: string
  mvrv: number
  source: string
  updatedAt: number
}

export const mvrvZone = (mvrv?: number) => {
  if (!mvrv) return null

  return MVRV_ZONES.find((zone) => mvrv < zone.max) || MVRV_ZONES[MVRV_ZONES.length - 1]
}

const getCache = (): MvrvInfo | null => {
  try {
    const cache = getDataLocal(LOCAL_STORE_KEY.MvrvData)

    if (!cache?.updatedAt || !cache?.mvrv) return null

    // API bị limit nên chỉ gọi lại sau MVRV_CACHE_TIME (30 phút)
    if (Date.now() - cache.updatedAt > MVRV_CACHE_TIME) return null

    return cache
  } catch (error) {
    console.error(error)

    return null
  }
}

const getData = async (): Promise<MvrvInfo | null> => {
  const cache = getCache()

  if (cache) return cache

  try {
    const res = await fetcher({ url: MVRV_ENDPOINT.Proxy })
    const data = res?.data || null

    if (!data?.mvrv) return null

    const dataFinal: MvrvInfo = {
      date: data.date,
      mvrv: Number(data.mvrv),
      source: data.source || '',
      updatedAt: Date.now(),
    }

    saveDataLocal(LOCAL_STORE_KEY.MvrvData, dataFinal)

    return dataFinal
  } catch (error) {
    console.error(error)

    return null
  }
}

const useMVRV = () => {
  const { data, isLoading, refetch } = useQuery({
    queryKey: [QUERY_KEY.Mvrv],
    queryFn: getData,
    staleTime: MVRV_CACHE_TIME,
    refetchOnWindowFocus: false,
  })

  const refetchForce = () => {
    removeDataLocal(LOCAL_STORE_KEY.MvrvData)

    return refetch()
  }

  return {
    data: data || null,
    zone: mvrvZone(data?.mvrv),
    isLoading,
    refetch,
    refetchForce,
  }
}

export default useMVRV
