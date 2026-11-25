import { useQuery } from '@tanstack/react-query'
import { BigNumber } from 'bignumber.js'

import { QUERY_KEY } from '@/constants/reactQuery'
import { LOCAL_STORE_KEY } from '@/constants/storage'
import { MVRV_CACHE_TIME, MVRV_HISTORY_DAYS, MVRV_ZONES } from '@/constants/app'
import { MVRV_ENDPOINT } from '@/constants/api'
import { getDataLocal, removeDataLocal, saveDataLocal } from '@/services/Storage'
import fetcher from '@/configs/fetcher'

export type MvrvPoint = {
  date: string
  mvrv: number
  timestamp: number
}

export type MvrvInfo = {
  date: string
  mvrv: number
  source: string
  updatedAt: number
  high: number
  low: number
  changeDay: number
  changeWeek: number
  history: MvrvPoint[]
}

export const mvrvZone = (mvrv?: number) => {
  if (!mvrv) return null

  return MVRV_ZONES.find((zone) => mvrv < zone.max) || MVRV_ZONES[MVRV_ZONES.length - 1]
}

const getCache = (): MvrvInfo | null => {
  try {
    const cache = getDataLocal(LOCAL_STORE_KEY.MvrvData)

    // Cache cũ (trước khi có chart) không có history → coi như hết hạn để gọi lại
    if (!cache?.updatedAt || !cache?.mvrv || !cache?.history?.length) return null

    // API bị limit nên chỉ gọi lại sau MVRV_CACHE_TIME (30 phút)
    if (Date.now() - cache.updatedAt > MVRV_CACHE_TIME) return null

    return cache
  } catch (error) {
    console.error(error)

    return null
  }
}

const percentChange = (now: number, before?: number) => {
  if (!before) return 0

  return BigNumber(now).minus(before).dividedBy(before).multipliedBy(100).decimalPlaces(2).toNumber()
}

const getData = async (): Promise<MvrvInfo | null> => {
  const cache = getCache()

  if (cache) return cache

  try {
    const res = await fetcher({ url: `${MVRV_ENDPOINT.Proxy}?days=${MVRV_HISTORY_DAYS}` })
    const data = res?.data || null

    if (!data?.mvrv) return null

    const history: MvrvPoint[] = data.history || []
    const values = history.map((item: MvrvPoint) => item.mvrv)
    const mvrv = Number(data.mvrv)

    const dataFinal: MvrvInfo = {
      date: data.date,
      mvrv,
      source: data.source || '',
      updatedAt: Date.now(),
      high: values.length > 0 ? Math.max(...values) : mvrv,
      low: values.length > 0 ? Math.min(...values) : mvrv,
      changeDay: percentChange(mvrv, history[history.length - 2]?.mvrv),
      changeWeek: percentChange(mvrv, history[history.length - 8]?.mvrv),
      history,
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
