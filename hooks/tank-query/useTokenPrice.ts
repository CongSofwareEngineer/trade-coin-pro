import { useQuery } from '@tanstack/react-query'

import { QUERY_KEY } from '@/constants/reactQuery'
import fetcher from '@/configs/fetcher'

const getData = async (): Promise<{
  price: number
  [key: string]: unknown
}> => {
  const id = 1027 // id ETH trên coinmarketcap
  const res = await fetcher({
    url: `/api/token/latest?id=${id}`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  })

  return res?.data
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
