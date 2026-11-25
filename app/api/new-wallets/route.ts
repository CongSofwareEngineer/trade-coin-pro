import { NextRequest } from 'next/server'

import { NEW_WALLET_LIMIT } from '@/constants/app'
import { NEW_WALLET_ENDPOINT } from '@/constants/api'
import fetcher from '@/configs/fetcher'

// Nguồn: blockchain.com charts (free). Metric unique addresses / ngày — proxy cho lượng ví mới hoạt động
export async function GET(req: NextRequest) {
  try {
    const daysQuery = Number(new URL(req.url).searchParams.get('days'))
    const days = daysQuery > 0 ? daysQuery : NEW_WALLET_LIMIT

    const res = await fetcher({ url: `${NEW_WALLET_ENDPOINT.Blockchain}?timespan=${days}days&format=json` })
    const list: any[] = res?.data?.values || []

    const data = list
      .filter((item: any) => !!item?.x && item?.y !== undefined)
      .map((item: any) => ({
        value: Number(item.y),
        timestamp: Number(item.x) * 1000,
      }))

    if (data.length === 0) {
      return new Response(
        JSON.stringify({
          error: 'Can not get new wallets',
        }),
        {
          status: 500,
        }
      )
    }

    return new Response(
      JSON.stringify({
        data,
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
