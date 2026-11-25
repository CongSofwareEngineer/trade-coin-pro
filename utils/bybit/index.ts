import { BYBIT_ENDPOINT, BYBIT_INTERVAL_MAP, BYBIT_OI_INTERVAL_MAP } from '@/constants/api'
import fetcher from '@/configs/fetcher'

// Nguồn dự phòng cho Binance Futures / Spot khi server bị chặn theo vùng (Vercel US → 451).
// Bybit trả list mới nhất trước, Binance cũ nhất trước → luôn reverse về tăng dần theo thời gian.
class BybitApi {
  static async getKlines(symbol: string, interval: string, limit: number) {
    const intervalBybit = BYBIT_INTERVAL_MAP[interval] || 'D'

    const res = await fetcher({ url: `${BYBIT_ENDPOINT.Klines}?category=spot&symbol=${symbol}&interval=${intervalBybit}&limit=${limit}` })
    const list: any[] = res?.data?.result?.list || []

    if (list.length === 0) return []

    // Bybit kline: [start, open, high, low, close, volume, turnover] — cùng thứ tự index 0..5 với Binance
    return [...list].reverse()
  }

  static async getFundingRate(symbol: string, limit: number) {
    const [resNow, resHistory] = await Promise.all([
      fetcher({ url: `${BYBIT_ENDPOINT.Tickers}?category=linear&symbol=${symbol}` }),
      fetcher({ url: `${BYBIT_ENDPOINT.FundingHistory}?category=linear&symbol=${symbol}&limit=${Math.min(limit, 200)}` }),
    ])

    const rowNow: any = resNow?.data?.result?.list?.[0] || null
    const list: any[] = resHistory?.data?.result?.list || []

    if (!rowNow?.fundingRate) return null

    const history = [...list]
      .reverse()
      .filter((item: any) => !!item?.fundingRateTimestamp && item?.fundingRate !== undefined)
      .map((item: any) => ({
        rate: Number(item.fundingRate) * 100,
        markPrice: 0,
        timestamp: Number(item.fundingRateTimestamp),
      }))

    return {
      now: {
        rate: Number(rowNow.fundingRate) * 100,
        interestRate: 0,
        markPrice: Number(rowNow.markPrice || 0),
        indexPrice: Number(rowNow.indexPrice || 0),
        nextFundingTime: Number(rowNow.nextFundingTime || 0),
        timestamp: Date.now(),
      },
      history,
    }
  }

  static async getOpenInterest(symbol: string, period: string, limit: number) {
    const intervalBybit = BYBIT_OI_INTERVAL_MAP[period] || '1d'

    const [resNow, resHistory, resLongShort] = await Promise.all([
      fetcher({ url: `${BYBIT_ENDPOINT.Tickers}?category=linear&symbol=${symbol}` }),
      fetcher({
        url: `${BYBIT_ENDPOINT.OpenInterest}?category=linear&symbol=${symbol}&intervalTime=${intervalBybit}&limit=${Math.min(limit, 200)}`,
      }),
      fetcher({ url: `${BYBIT_ENDPOINT.AccountRatio}?category=linear&symbol=${symbol}&period=${period}&limit=${Math.min(limit, 200)}` }),
    ])

    const rowNow: any = resNow?.data?.result?.list?.[0] || null
    const list: any[] = resHistory?.data?.result?.list || []
    const listLongShort: any[] = resLongShort?.data?.result?.list || []

    if (!rowNow?.openInterest) return null

    const markPrice = Number(rowNow.markPrice || 0)

    // Bybit không trả notional theo từng mốc → quy đổi bằng mark price hiện tại
    const history = [...list]
      .reverse()
      .filter((item: any) => !!item?.timestamp && item?.openInterest !== undefined)
      .map((item: any) => ({
        amount: Number(item.openInterest),
        value: Number(item.openInterest) * markPrice,
        timestamp: Number(item.timestamp),
      }))

    const longShort = [...listLongShort]
      .reverse()
      .filter((item: any) => !!item?.timestamp && item?.buyRatio !== undefined)
      .map((item: any) => ({
        long: Number(item.buyRatio) * 100,
        short: Number(item.sellRatio) * 100,
        ratio: Number(item.sellRatio) > 0 ? Number(item.buyRatio) / Number(item.sellRatio) : 0,
        timestamp: Number(item.timestamp),
      }))

    return {
      now: {
        amount: Number(rowNow.openInterest),
        value: Number(rowNow.openInterestValue || 0),
        timestamp: Date.now(),
      },
      history,
      longShort,
    }
  }
}

export default BybitApi
