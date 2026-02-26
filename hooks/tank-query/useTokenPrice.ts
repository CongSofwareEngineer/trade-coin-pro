import { useQuery } from '@tanstack/react-query'

import { QUERY_KEY } from '@/constants/reactQuery'
import fetcher from '@/configs/fetcher'

const getData = async (
  tokenInput: string
): Promise<{
  price: number
  [key: string]: unknown
}> => {
  const res = await fetcher({
    url: `/dca/price?version=v3&tokenInput=${tokenInput}`,
  })

  return res?.data?.data
}

const useTokenPrice = (tokenInput?: string) => {
  const { data, isLoading, refetch } = useQuery<{
    price: number
    [key: string]: unknown
  } | null>({
    queryKey: [QUERY_KEY.TokenPrice, tokenInput],
    queryFn: () => getData(tokenInput || 'ETH'),
    enabled: !!tokenInput,
  })

  return {
    isLoading,
    data,
    refetch,
  }
}

export default useTokenPrice
