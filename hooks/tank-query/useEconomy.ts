import { useQuery } from '@tanstack/react-query'

import { QUERY_KEY } from '@/constants/reactQuery'
import { ECONOMY_CACHE_TIME } from '@/constants/economy'
import EconomyApi from '@/services/EconomyApi'

export const useEconomyDiscussions = () => {
  const { data, isLoading, isFetching, isError, error, refetch } = useQuery({
    queryKey: [QUERY_KEY.EconomyDiscussion],
    queryFn: EconomyApi.getDiscussions,
    staleTime: ECONOMY_CACHE_TIME,
    refetchOnWindowFocus: false,
  })

  return { data, isLoading, isFetching, isError, error, refetch }
}

export const useEconomyKnowledge = () => {
  const { data, isLoading, isFetching, isError, error, refetch } = useQuery({
    queryKey: [QUERY_KEY.EconomyKnowledge],
    queryFn: EconomyApi.getKnowledge,
    staleTime: ECONOMY_CACHE_TIME,
    refetchOnWindowFocus: false,
  })

  return { data, isLoading, isFetching, isError, error, refetch }
}
