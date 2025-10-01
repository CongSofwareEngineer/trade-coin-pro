import { useQuery } from '@tanstack/react-query'

import fetcher from '@/configs/fetcher'
import { QUERY_KEY } from '@/constants/reactQuery'
import { UserConfig } from '@/app/trade-info/type'

const getData = async (): Promise<any> => {
  const res = await fetcher({
    url: 'https://bot-dca-token.onrender.com/api/user/list?page=1&limit=10',
  })

  return res?.data || []
}

const useUserConfig = () => {
  const { data, isLoading, refetch, isFetching } = useQuery<{
    pagination: any
    users: UserConfig[]
  } | null>({
    queryKey: [QUERY_KEY.UserConfig],
    queryFn: getData,
  })

  return {
    isLoading: isLoading || isFetching,
    data,
    refetch,
  }
}

export default useUserConfig
