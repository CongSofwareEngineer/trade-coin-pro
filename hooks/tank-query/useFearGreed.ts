import { useQuery } from '@tanstack/react-query'
import { BigNumber } from 'bignumber.js'

import { QUERY_KEY } from '@/constants/reactQuery'
import { FEAR_GREED_CACHE_TIME, FEAR_GREED_LIMIT, FEAR_GREED_ZONES } from '@/constants/app'
import { FEAR_GREED_ENDPOINT } from '@/constants/api'
import fetcher from '@/configs/fetcher'

export type FearGreedPoint = {
  value: number
  classification: string
  timestamp: number
}

export type FearGreedInfo = {
  now: FearGreedPoint
  yesterday: FearGreedPoint | null
  lastWeek: FearGreedPoint | null
  average7: number
  average30: number
  points: FearGreedPoint[]
}

export const fearGreedZone = (value?: number) => {
  if (value === undefined || value === null) return null

  return FEAR_GREED_ZONES.find((zone) => value < zone.max) || FEAR_GREED_ZONES[FEAR_GREED_ZONES.length - 1]
}

const average = (list: FearGreedPoint[]) => {
  if (list.length === 0) return 0

  return list
    .reduce((total, item) => total.plus(item.value), BigNumber(0))
    .dividedBy(list.length)
    .decimalPlaces(1)
    .toNumber()
}

const getData = async ({ queryKey }: { queryKey: any }): Promise<FearGreedInfo | null> => {
  const [, limit] = queryKey

  try {
    const res = await fetcher({ url: `${FEAR_GREED_ENDPOINT.Proxy}?limit=${limit}` })
    const list: FearGreedPoint[] = res?.data || []

    if (list.length === 0) return null

    // API trả mới nhất trước, đảo lại để vẽ chart theo thời gian tăng dần
    const points = [...list].reverse()
    const now = points[points.length - 1]

    return {
      now,
      yesterday: points[points.length - 2] || null,
      lastWeek: points[points.length - 8] || null,
      average7: average(points.slice(-7)),
      average30: average(points.slice(-30)),
      points,
    }
  } catch (error) {
    console.error(error)

    return null
  }
}

const useFearGreed = (limit: number = FEAR_GREED_LIMIT) => {
  const { data, isLoading, refetch } = useQuery({
    queryKey: [QUERY_KEY.FearGreed, limit],
    queryFn: getData,
    staleTime: FEAR_GREED_CACHE_TIME,
    refetchOnWindowFocus: false,
  })

  return {
    data: data || null,
    zone: fearGreedZone(data?.now?.value),
    isLoading,
    refetch,
  }
}

export default useFearGreed
