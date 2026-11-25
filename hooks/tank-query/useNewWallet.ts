import { useQuery } from '@tanstack/react-query'
import { BigNumber } from 'bignumber.js'

import { QUERY_KEY } from '@/constants/reactQuery'
import { NEW_WALLET_CACHE_TIME, NEW_WALLET_LIMIT } from '@/constants/app'
import { NEW_WALLET_ENDPOINT } from '@/constants/api'
import fetcher from '@/configs/fetcher'

export type NewWalletPoint = {
  value: number
  timestamp: number
}

export type NewWalletInfo = {
  now: NewWalletPoint
  yesterday: NewWalletPoint | null
  lastWeek: NewWalletPoint | null
  average7: number
  average30: number
  high: number
  low: number
  changeDay: number
  changeWeek: number
  isUpTrend: boolean
  points: NewWalletPoint[]
}

const average = (list: NewWalletPoint[]) => {
  if (list.length === 0) return 0

  return list
    .reduce((total, item) => total.plus(item.value), BigNumber(0))
    .dividedBy(list.length)
    .decimalPlaces(0)
    .toNumber()
}

const percentChange = (now: number, before?: number) => {
  if (!before) return 0

  return BigNumber(now).minus(before).dividedBy(before).multipliedBy(100).decimalPlaces(2).toNumber()
}

const getData = async ({ queryKey }: { queryKey: any }): Promise<NewWalletInfo | null> => {
  const [, days] = queryKey

  try {
    const res = await fetcher({ url: `${NEW_WALLET_ENDPOINT.Proxy}?days=${days}` })
    const points: NewWalletPoint[] = res?.data || []

    if (points.length === 0) return null

    const now = points[points.length - 1]
    const values = points.map((item) => item.value)
    const average30 = average(points.slice(-30))

    return {
      now,
      yesterday: points[points.length - 2] || null,
      lastWeek: points[points.length - 8] || null,
      average7: average(points.slice(-7)),
      average30,
      high: Math.max(...values),
      low: Math.min(...values),
      changeDay: percentChange(now.value, points[points.length - 2]?.value),
      changeWeek: percentChange(now.value, points[points.length - 8]?.value),
      isUpTrend: BigNumber(now.value).gt(average30),
      points,
    }
  } catch (error) {
    console.error(error)

    return null
  }
}

const useNewWallet = (days: number = NEW_WALLET_LIMIT) => {
  const { data, isLoading, refetch } = useQuery({
    queryKey: [QUERY_KEY.NewWallet, days],
    queryFn: getData,
    staleTime: NEW_WALLET_CACHE_TIME,
    refetchOnWindowFocus: false,
  })

  return {
    data: data || null,
    isLoading,
    refetch,
  }
}

export default useNewWallet
