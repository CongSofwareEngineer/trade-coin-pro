import { NextRequest } from 'next/server'

import { FUNDING_RATE_LIMIT, SYMBOL_FUTURES_DEFAULT } from '@/constants/app'
import { FUNDING_RATE_ENDPOINT } from '@/constants/api'
import BybitApi from '@/utils/bybit'
import fetcher from '@/configs/fetcher'

// Binance + Bybit chặn IP datacenter US (Vercel mặc định iad1 → 451/403) → chạy function ở Singapore
export const preferredRegion = 'sin1'

// Proxy funding rate Binance Futures: browser không gọi fapi.binance.com trực tiếp (CORS)
const getFromBinance = async (symbol: string, limit: number) => {
  const [resNow, resHistory] = await Promise.all([
    fetcher({ url: `${FUNDING_RATE_ENDPOINT.PremiumIndex}?symbol=${symbol}` }),
    fetcher({ url: `${FUNDING_RATE_ENDPOINT.History}?symbol=${symbol}&limit=${limit}` }),
  ])

  const rowNow: any = resNow?.data || null
  const list: any[] = Array.isArray(resHistory?.data) ? resHistory?.data : []

  // Binance chặn theo vùng (Vercel US) trả { code, msg } → không có lastFundingRate
  if (!rowNow?.lastFundingRate) return null

  // Binance trả rate dạng tỉ lệ (0.0001 = 0.01%), FE dùng %
  const history = list
    .filter((item: any) => !!item?.fundingTime && item?.fundingRate !== undefined)
    .map((item: any) => ({
      rate: Number(item.fundingRate) * 100,
      markPrice: Number(item.markPrice || 0),
      timestamp: Number(item.fundingTime),
    }))

  return {
    now: {
      rate: Number(rowNow.lastFundingRate) * 100,
      interestRate: Number(rowNow.interestRate || 0) * 100,
      markPrice: Number(rowNow.markPrice || 0),
      indexPrice: Number(rowNow.indexPrice || 0),
      nextFundingTime: Number(rowNow.nextFundingTime || 0),
      timestamp: Number(rowNow.time || 0),
    },
    history,
  }
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const symbol = url.searchParams.get('symbol') || SYMBOL_FUTURES_DEFAULT
    const limit = Number(url.searchParams.get('limit')) > 0 ? Number(url.searchParams.get('limit')) : FUNDING_RATE_LIMIT

    let data = null
    let source = 'Binance'

    try {
      data = await getFromBinance(symbol, limit)
    } catch (error) {
      console.error('Binance funding rate error', error)
    }

    if (!data) {
      try {
        data = await BybitApi.getFundingRate(symbol, limit)
        source = 'Bybit'
      } catch (error) {
        console.error('Bybit funding rate error', error)
      }
    }

    if (!data) {
      return new Response(
        JSON.stringify({
          error: 'Can not get funding rate',
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
