import { useQuery } from '@tanstack/react-query'
import { BigNumber } from 'bignumber.js'

import { QUERY_KEY } from '@/constants/reactQuery'
import { MA_INTERVAL, MA_PERIOD, SYMBOL_STABLE_DEFAULT } from '@/constants/app'
import { BINANCE_ENDPOINT } from '@/constants/api'
import fetcher from '@/configs/fetcher'

export type MA200Info = {
  interval: string
  ma200: number
  lastClose: number
  diffPercent: number
  isUpTrend: boolean
  isEnoughData: boolean
  totalCandles: number
}

const getData = async ({ queryKey }: { queryKey: any }): Promise<MA200Info | null> => {
  const [, symbol, interval] = queryKey

  if (!symbol) return null

  try {
    const res = await fetcher({ url: `${BINANCE_ENDPOINT.KlinesProxy}?symbol=${symbol}&interval=${interval}&limit=${MA_PERIOD}` })
    const klines: any[] = res?.data || []

    if (klines.length === 0) return null

    // kline: [openTime, open, high, low, close, volume, ...]
    const closes = klines.map((item: any) => item?.[4]).filter((item: any) => !!item)

    if (closes.length === 0) return null

    const closesMa = closes.slice(-MA_PERIOD)
    const ma200 = closesMa.reduce((total: any, close: any) => total.plus(close), BigNumber(0)).dividedBy(closesMa.length)
    const lastClose = BigNumber(closes[closes.length - 1])
    const diffPercent = lastClose.minus(ma200).dividedBy(ma200).multipliedBy(100)

    return {
      interval,
      ma200: ma200.decimalPlaces(4).toNumber(),
      lastClose: lastClose.decimalPlaces(4).toNumber(),
      diffPercent: diffPercent.decimalPlaces(2).toNumber(),
      isUpTrend: lastClose.gt(ma200),
      isEnoughData: closesMa.length >= MA_PERIOD,
      totalCandles: closesMa.length,
    }
  } catch (error) {
    console.error(error)

    return null
  }
}

const useMA200 = (tokenInput?: string) => {
  const symbol = tokenInput ? `${tokenInput.toUpperCase()}${SYMBOL_STABLE_DEFAULT}` : ''

  const {
    data: daily,
    isLoading: isLoadingDaily,
    refetch: refetchDaily,
  } = useQuery({
    queryKey: [QUERY_KEY.MA200, symbol, MA_INTERVAL.Daily],
    queryFn: getData,
    enabled: !!symbol,
  })

  const {
    data: weekly,
    isLoading: isLoadingWeekly,
    refetch: refetchWeekly,
  } = useQuery({
    queryKey: [QUERY_KEY.MA200, symbol, MA_INTERVAL.Weekly],
    queryFn: getData,
    enabled: !!symbol,
  })

  const refetch = () => {
    refetchDaily()
    refetchWeekly()
  }

  return {
    symbol,
    daily: daily || null,
    weekly: weekly || null,
    isLoading: isLoadingDaily || isLoadingWeekly,
    refetch,
  }
}

export default useMA200
