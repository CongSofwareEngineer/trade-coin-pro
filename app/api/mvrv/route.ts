import { MVRV_ENDPOINT } from '@/constants/api'
import fetcher from '@/configs/fetcher'

// Nguồn chính: Coin Metrics Community API (free, 10 req / 6s)
const getFromCoinMetrics = async () => {
  const res = await fetcher({ url: MVRV_ENDPOINT.CoinMetrics })
  const list: any[] = res?.data || []
  const row = list[list.length - 1]

  if (!row?.time || !row?.CapMVRVCur) return null

  return {
    date: row.time.slice(0, 10),
    mvrv: Number(row.CapMVRVCur),
    source: 'CoinMetrics',
  }
}

// Nguồn dự phòng: BGeometrics (free, ~8 req/giờ — đừng gọi liên tục)
const getFromBGeometrics = async () => {
  const res = await fetcher({ url: MVRV_ENDPOINT.BGeometrics })
  const row: any = res?.data || null

  if (!row?.d || !row?.mvrv) return null

  return {
    date: row.d,
    mvrv: Number(row.mvrv),
    source: 'BGeometrics',
  }
}

export async function GET() {
  try {
    let data = null

    try {
      data = await getFromCoinMetrics()
    } catch (error) {
      console.error('CoinMetrics error', error)
    }

    if (!data) {
      try {
        data = await getFromBGeometrics()
      } catch (error) {
        console.error('BGeometrics error', error)
      }
    }

    if (!data) {
      return new Response(
        JSON.stringify({
          error: 'Can not get MVRV',
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
