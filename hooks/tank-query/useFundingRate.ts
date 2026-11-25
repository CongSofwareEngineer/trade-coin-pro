import { useQuery } from '@tanstack/react-query'
import { BigNumber } from 'bignumber.js'

import { QUERY_KEY } from '@/constants/reactQuery'
import { FUNDING_RATE_CACHE_TIME, FUNDING_RATE_LIMIT, FUNDING_RATE_PERIOD_PER_DAY, FUNDING_RATE_ZONES, SYMBOL_FUTURES_DEFAULT } from '@/constants/app'
import { FUNDING_RATE_ENDPOINT } from '@/constants/api'
import fetcher from '@/configs/fetcher'

export type FundingRatePoint = {
  rate: number
  markPrice: number
  timestamp: number
}

export type FundingRateNow = FundingRatePoint & {
  interestRate: number
  indexPrice: number
  nextFundingTime: number
}

export type FundingRateInfo = {
  symbol: string
  source: string
  now: FundingRateNow
  average7: number
  average30: number
  apr: number
  totalNegative: number
  points: FundingRatePoint[]
}

export const fundingRateZone = (value?: number) => {
  if (value === undefined || value === null) return null

  return FUNDING_RATE_ZONES.find((zone) => value < zone.max) || FUNDING_RATE_ZONES[FUNDING_RATE_ZONES.length - 1]
}

const average = (list: FundingRatePoint[]) => {
  if (list.length === 0) return 0

  return list
    .reduce((total, item) => total.plus(item.rate), BigNumber(0))
    .dividedBy(list.length)
    .decimalPlaces(5)
    .toNumber()
}

const getData = async ({ queryKey }: { queryKey: any }): Promise<FundingRateInfo | null> => {
  const [, symbol, limit] = queryKey

  if (!symbol) return null

  try {
    const res = await fetcher({ url: `${FUNDING_RATE_ENDPOINT.Proxy}?symbol=${symbol}&limit=${limit}` })
    const data: any = res?.data || null

    if (!data?.now) return null

    const points: FundingRatePoint[] = data.history || []

    // 1 kỳ = 8h → APR = rate * 3 * 365
    const apr = BigNumber(data.now.rate).multipliedBy(FUNDING_RATE_PERIOD_PER_DAY).multipliedBy(365).decimalPlaces(2).toNumber()

    return {
      symbol: data.symbol || symbol,
      source: data.source || '',
      now: data.now,
      average7: average(points.slice(-7 * FUNDING_RATE_PERIOD_PER_DAY)),
      average30: average(points.slice(-30 * FUNDING_RATE_PERIOD_PER_DAY)),
      apr,
      totalNegative: points.filter((item) => BigNumber(item.rate).lt(0)).length,
      points,
    }
  } catch (error) {
    console.error(error)

    return null
  }
}

const useFundingRate = (symbol: string = SYMBOL_FUTURES_DEFAULT, limit: number = FUNDING_RATE_LIMIT) => {
  const { data, isLoading, refetch } = useQuery({
    queryKey: [QUERY_KEY.FundingRate, symbol, limit],
    queryFn: getData,
    staleTime: FUNDING_RATE_CACHE_TIME,
    refetchOnWindowFocus: false,
    enabled: !!symbol,
  })

  return {
    data: data || null,
    zone: fundingRateZone(data?.now?.rate),
    isLoading,
    refetch,
  }
}

export default useFundingRate
