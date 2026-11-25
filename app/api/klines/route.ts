import { NextRequest } from 'next/server'

import { MA_INTERVAL, MA_PERIOD, SYMBOL_STABLE_DEFAULT, TOKEN_CYCLE_DEFAULT } from '@/constants/app'
import { BINANCE_ENDPOINT } from '@/constants/api'
import fetcher from '@/configs/fetcher'

// Proxy nến Binance: browser gọi /api/klines để tránh CORS, không call api.binance.com trực tiếp
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const symbol = url.searchParams.get('symbol') || `${TOKEN_CYCLE_DEFAULT}${SYMBOL_STABLE_DEFAULT}`
    const interval = url.searchParams.get('interval') || MA_INTERVAL.Daily
    const limit = Number(url.searchParams.get('limit')) > 0 ? Number(url.searchParams.get('limit')) : MA_PERIOD

    const res = await fetcher({ url: `${BINANCE_ENDPOINT.Klines}?symbol=${symbol}&interval=${interval}&limit=${limit}` })
    const klines: any[] = res?.data || []

    if (klines.length === 0) {
      return new Response(
        JSON.stringify({
          error: 'Can not get klines',
        }),
        {
          status: 500,
        }
      )
    }

    return new Response(
      JSON.stringify({
        data: klines,
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
