import { MVRV_HISTORY_DAYS } from '@/constants/app'
import { MVRV_ENDPOINT } from '@/constants/api'
import fetcher from '@/configs/fetcher'

// Lịch sử MVRV để vẽ chart 90 ngày. Chỉ CoinMetrics có, BGeometrics chỉ trả giá trị cuối
const getHistoryFromCoinMetrics = async (days: number) => {
  const res = await fetcher({ url: `${MVRV_ENDPOINT.CoinMetricsHistory}&page_size=${days}` })
  const list: any[] = res?.data || []

  return list
    .filter((item: any) => !!item?.time && !!item?.CapMVRVCur)
    .map((item: any) => ({
      date: item.time.slice(0, 10),
      mvrv: Number(item.CapMVRVCur),
      timestamp: new Date(item.time).getTime(),
    }))
}

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

export async function GET(request: Request) {
  try {
    const daysQuery = Number(new URL(request.url).searchParams.get('days'))
    const days = daysQuery > 0 ? daysQuery : MVRV_HISTORY_DAYS

    let data = null
    let history: any[] = []

    try {
      history = await getHistoryFromCoinMetrics(days)
    } catch (error) {
      console.error('CoinMetrics history error', error)
    }

    // History đã có record cuối → khỏi gọi lại endpoint page_size=1
    if (history.length > 0) {
      const rowLast = history[history.length - 1]

      data = {
        date: rowLast.date,
        mvrv: rowLast.mvrv,
        source: 'CoinMetrics',
      }
    }

    if (!data) {
      try {
        data = await getFromCoinMetrics()
      } catch (error) {
        console.error('CoinMetrics error', error)
      }
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
        data: {
          ...data,
          history,
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
