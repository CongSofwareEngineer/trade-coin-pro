import { NextRequest } from 'next/server'

import { OPEN_INTEREST_LIMIT, OPEN_INTEREST_PERIOD, SYMBOL_FUTURES_DEFAULT } from '@/constants/app'
import { OPEN_INTEREST_ENDPOINT } from '@/constants/api'
import BybitApi from '@/utils/bybit'
import fetcher from '@/configs/fetcher'

// Proxy Open Interest Binance Futures: browser không gọi fapi.binance.com trực tiếp (CORS)
const getFromBinance = async (symbol: string, period: string, limit: number) => {
  const [resNow, resHistory, resLongShort] = await Promise.all([
    fetcher({ url: `${OPEN_INTEREST_ENDPOINT.Current}?symbol=${symbol}` }),
    fetcher({ url: `${OPEN_INTEREST_ENDPOINT.History}?symbol=${symbol}&period=${period}&limit=${limit}` }),
    fetcher({ url: `${OPEN_INTEREST_ENDPOINT.LongShort}?symbol=${symbol}&period=${period}&limit=${limit}` }),
  ])

  const rowNow: any = resNow?.data || null
  const list: any[] = Array.isArray(resHistory?.data) ? resHistory?.data : []
  const listLongShort: any[] = Array.isArray(resLongShort?.data) ? resLongShort?.data : []

  // Binance chặn theo vùng (Vercel US) trả { code, msg } → không có openInterest
  if (!rowNow?.openInterest) return null

  const history = list
    .filter((item: any) => !!item?.timestamp && item?.sumOpenInterest !== undefined)
    .map((item: any) => ({
      amount: Number(item.sumOpenInterest),
      value: Number(item.sumOpenInterestValue || 0),
      timestamp: Number(item.timestamp),
    }))

  // Tỉ lệ tài khoản long / short, Binance trả dạng 0..1 → FE dùng %
  const longShort = listLongShort
    .filter((item: any) => !!item?.timestamp && item?.longAccount !== undefined)
    .map((item: any) => ({
      long: Number(item.longAccount) * 100,
      short: Number(item.shortAccount) * 100,
      ratio: Number(item.longShortRatio || 0),
      timestamp: Number(item.timestamp),
    }))

  const amountNow = Number(rowNow.openInterest)
  const rowLast = history[history.length - 1]
  const priceNow = rowLast?.amount ? rowLast.value / rowLast.amount : 0

  return {
    now: {
      amount: amountNow,
      value: priceNow > 0 ? amountNow * priceNow : 0,
      timestamp: Number(rowNow.time || 0),
    },
    history,
    longShort,
  }
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const symbol = url.searchParams.get('symbol') || SYMBOL_FUTURES_DEFAULT
    const period = url.searchParams.get('period') || OPEN_INTEREST_PERIOD
    const limit = Number(url.searchParams.get('limit')) > 0 ? Number(url.searchParams.get('limit')) : OPEN_INTEREST_LIMIT

    let data = null
    let source = 'Binance'

    try {
      data = await getFromBinance(symbol, period, limit)
    } catch (error) {
      console.error('Binance open interest error', error)
    }

    if (!data) {
      try {
        data = await BybitApi.getOpenInterest(symbol, period, limit)
        source = 'Bybit'
      } catch (error) {
        console.error('Bybit open interest error', error)
      }
    }

    if (!data) {
      return new Response(
        JSON.stringify({
          error: 'Can not get open interest',
        }),
        {
          status: 500,
        }
      )
    }

    return new Response(
      JSON.stringify({
        data: {
          symbol,
          period,
          source,
          ...data,
        },
      }),
      {
        status: 200,
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({
        error,
      }),
      {
        status: 500,
      }
    )
  }
}
