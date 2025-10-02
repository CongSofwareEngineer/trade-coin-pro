import { NextRequest } from 'next/server'

import fetcher from '@/configs/fetcher'

export async function POST(req: NextRequest) {
  try {
    console.log({ req: req.url, host: req.nextUrl.origin })
    let urlFinal = req.url
    const url = new URL(req.url)
    const idToken = url.searchParams.get('idToken') || '1027' // id ETH trên coinmarketcap

    urlFinal = urlFinal.replace(`${url.origin}/api/token/`, 'https://www.binance.com/bapi/composite/v1/public/promo/cmc/cryptocurrency/quotes/')

    console.log({ urlFinal })

    const res = await fetcher({
      url: urlFinal,
    })

    return new Response(
      JSON.stringify({
        data: res?.data?.body?.data[idToken]?.quote?.USD,
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
