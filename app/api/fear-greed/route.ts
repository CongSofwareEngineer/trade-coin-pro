import { FEAR_GREED_LIMIT } from '@/constants/app'
import { FEAR_GREED_ENDPOINT } from '@/constants/api'
import fetcher from '@/configs/fetcher'

// Nguồn: Alternative.me Fear & Greed Index (free, update 1 lần / ngày)
export async function GET(request: Request) {
  try {
    const limitQuery = new URL(request.url).searchParams.get('limit')
    const limit = Number(limitQuery) > 0 ? Number(limitQuery) : FEAR_GREED_LIMIT

    const res = await fetcher({ url: `${FEAR_GREED_ENDPOINT.Alternative}?limit=${limit}&format=json` })
    const list: any[] = res?.data || []

    const data = list
      .filter((item: any) => !!item?.timestamp && item?.value !== undefined)
      .map((item: any) => ({
        value: Number(item.value),
        classification: item.value_classification || '',
        timestamp: Number(item.timestamp) * 1000,
      }))

    if (data.length === 0) {
      return new Response(
        JSON.stringify({
          error: 'Can not get Fear & Greed',
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
