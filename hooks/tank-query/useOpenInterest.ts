import { useQuery } from '@tanstack/react-query'
import { BigNumber } from 'bignumber.js'

import { QUERY_KEY } from '@/constants/reactQuery'
import { LONG_SHORT_ZONES, OPEN_INTEREST_CACHE_TIME, OPEN_INTEREST_LIMIT, OPEN_INTEREST_PERIOD, SYMBOL_FUTURES_DEFAULT } from '@/constants/app'
import { OPEN_INTEREST_ENDPOINT } from '@/constants/api'
import fetcher from '@/configs/fetcher'

export type OpenInterestPoint = {
  amount: number
  value: number
  timestamp: number
}

export type LongShortPoint = {
  long: number
  short: number
  ratio: number
  timestamp: number
}

export type LongShortInfo = {
  long: number
  short: number
  ratio: number
  isLongHeavy: boolean
  points: LongShortPoint[]
}

export type OpenInterestInfo = {
  symbol: string
  period: string
  source: string
  now: OpenInterestPoint
  high: number
  low: number
  average7: number
  changeDay: number
  changeWeek: number
  fromHighPercent: number
  points: OpenInterestPoint[]
  longShort: LongShortInfo | null
}

export const longShortZone = (long?: number) => {
  if (long === undefined || long === null) return null

  return LONG_SHORT_ZONES.find((zone) => long < zone.max) || LONG_SHORT_ZONES[LONG_SHORT_ZONES.length - 1]
}

const percentChange = (now: number, before?: number) => {
  if (!before) return 0

  return BigNumber(now).minus(before).dividedBy(before).multipliedBy(100).decimalPlaces(2).toNumber()
}

const getData = async ({ queryKey }: { queryKey: any }): Promise<OpenInterestInfo | null> => {
  const [, symbol, period, limit] = queryKey

  if (!symbol) return null

  try {
    const res = await fetcher({ url: `${OPEN_INTEREST_ENDPOINT.Proxy}?symbol=${symbol}&period=${period}&limit=${limit}` })
    const data: any = res?.data || null

    if (!data?.now) return null

    const points: OpenInterestPoint[] = data.history || []
    const pointsLongShort: LongShortPoint[] = data.longShort || []
    const rowLongShort = pointsLongShort[pointsLongShort.length - 1] || null
    const amounts = points.map((item) => item.amount)
    const high = amounts.length > 0 ? Math.max(...amounts) : data.now.amount
    const low = amounts.length > 0 ? Math.min(...amounts) : data.now.amount

    const average7 =
      points.length === 0
        ? 0
        : points
            .slice(-7)
            .reduce((total, item) => total.plus(item.amount), BigNumber(0))
            .dividedBy(points.slice(-7).length)
            .decimalPlaces(2)
            .toNumber()

    return {
      symbol: data.symbol || symbol,
      period: data.period || period,
      source: data.source || '',
      now: data.now,
      high,
      low,
      average7,
      changeDay: percentChange(data.now.amount, points[points.length - 2]?.amount),
      changeWeek: percentChange(data.now.amount, points[points.length - 8]?.amount),
      fromHighPercent: percentChange(data.now.amount, high),
      points,
      longShort: rowLongShort
        ? {
            long: BigNumber(rowLongShort.long).decimalPlaces(2).toNumber(),
            short: BigNumber(rowLongShort.short).decimalPlaces(2).toNumber(),
            ratio: BigNumber(rowLongShort.ratio).decimalPlaces(2).toNumber(),
            isLongHeavy: BigNumber(rowLongShort.long).gt(rowLongShort.short),
            points: pointsLongShort,
          }
        : null,
    }
  } catch (error) {
    console.error(error)

    return null
  }
}

const useOpenInterest = (symbol: string = SYMBOL_FUTURES_DEFAULT, period: string = OPEN_INTEREST_PERIOD, limit: number = OPEN_INTEREST_LIMIT) => {
  const { data, isLoading, refetch } = useQuery({
    queryKey: [QUERY_KEY.OpenInterest, symbol, period, limit],
    queryFn: getData,
    staleTime: OPEN_INTEREST_CACHE_TIME,
    refetchOnWindowFocus: false,
    enabled: !!symbol,
  })

  return {
    data: data || null,
    isLoading,
    refetch,
  }
}

export default useOpenInterest
