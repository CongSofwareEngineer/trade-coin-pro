import { useQuery } from '@tanstack/react-query'

import fetcher from '@/configs/fetcher'
import { QUERY_KEY } from '@/constants/reactQuery'

const getData = async (): Promise<{
  price: number
  [key: string]: unknown
}> => {
  const id = 1027 // id ETH trên coinmarketcap
  const res = await fetcher({
    url: `https://www.binance.com/bapi/composite/v1/public/promo/cmc/cryptocurrency/quotes/latest?id=${id}`,
  })

  return res?.data?.body?.data[id]?.quote?.USD
}

const useTokenPrice = () => {
  const { data, isLoading, refetch, isFetching } = useQuery<{
    price: number
    [key: string]: unknown
  } | null>({
    queryKey: [QUERY_KEY.TokenPrice],
    queryFn: getData,
  })

  return {
    isLoading: isLoading || isFetching,
    data,
    refetch,
  }
}

export default useTokenPrice
