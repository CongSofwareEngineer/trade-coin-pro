import { useQuery } from '@tanstack/react-query'
import { BigNumber } from 'bignumber.js'

import { QUERY_KEY } from '@/constants/reactQuery'
import { CYCLE_INTERVAL, CYCLE_WEEKS, SYMBOL_STABLE_DEFAULT, TOKEN_CYCLE_DEFAULT } from '@/constants/app'
import { BINANCE_ENDPOINT } from '@/constants/api'
import fetcher from '@/configs/fetcher'

export type CyclePoint = {
  time: number
  close: number
  high: number
  low: number
}

export type CycleHighInfo = {
  symbol: string
  interval: string
  totalCandles: number
  isEnoughData: boolean
  high: number
  highTime: number
  highIndex: number
  low: number
  lowTime: number
  lastClose: number
  fromHighPercent: number
  fromLowPercent: number
  points: CyclePoint[]
}

const getData = async ({ queryKey }: { queryKey: any }): Promise<CycleHighInfo | null> => {
  const [, symbol, interval, weeks] = queryKey

  if (!symbol) return null

  try {
    const res = await fetcher({ url: `${BINANCE_ENDPOINT.KlinesProxy}?symbol=${symbol}&interval=${interval}&limit=${weeks}` })
    const klines: any[] = res?.data || []

    if (klines.length === 0) return null

    // kline: [openTime, open, high, low, close, volume, ...]
    const points: CyclePoint[] = klines
      .filter((item: any) => !!item?.[0] && !!item?.[4])
      .map((item: any) => ({
        time: Number(item[0]),
        close: Number(item[4]),
        high: Number(item[2]),
        low: Number(item[3]),
      }))

    if (points.length === 0) return null

    let highIndex = 0
    let lowIndex = 0

    points.forEach((item: CyclePoint, index: number) => {
      if (BigNumber(item.high).gt(points[highIndex].high)) highIndex = index
      if (BigNumber(item.low).lt(points[lowIndex].low)) lowIndex = index
    })

    const high = BigNumber(points[highIndex].high)
    const low = BigNumber(points[lowIndex].low)
    const lastClose = BigNumber(points[points.length - 1].close)

    return {
      symbol,
      interval,
      totalCandles: points.length,
      isEnoughData: points.length >= weeks,
      high: high.decimalPlaces(2).toNumber(),
      highTime: points[highIndex].time,
      highIndex,
      low: low.decimalPlaces(2).toNumber(),
      lowTime: points[lowIndex].time,
      lastClose: lastClose.decimalPlaces(2).toNumber(),
      fromHighPercent: lastClose.minus(high).dividedBy(high).multipliedBy(100).decimalPlaces(2).toNumber(),
      fromLowPercent: lastClose.minus(low).dividedBy(low).multipliedBy(100).decimalPlaces(2).toNumber(),
      points,
    }
  } catch (error) {
    console.error(error)

    return null
  }
}

const useCycleHigh = (tokenInput?: string) => {
  const symbol = `${(tokenInput || TOKEN_CYCLE_DEFAULT).toUpperCase()}${SYMBOL_STABLE_DEFAULT}`

  const { data, isLoading, refetch } = useQuery({
    queryKey: [QUERY_KEY.CycleHigh, symbol, CYCLE_INTERVAL, CYCLE_WEEKS],
    queryFn: getData,
    refetchOnWindowFocus: false,
  })

  return {
    symbol,
    data: data || null,
    isLoading,
    refetch,
  }
}

export default useCycleHigh
