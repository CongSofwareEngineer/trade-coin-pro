import { useQuery } from '@tanstack/react-query'

import fetcher from '@/configs/fetcher'
import { QUERY_KEY } from '@/constants/reactQuery'

interface TradeHistoryItem {
  _id: string
  idUser: string
  idToken: string
  isBuy: boolean
  price: string
  infoSwap: {
    from: string
    to: string
    amountIn: number
    amountOut: number
  }
  buyAmountUSD: string
  createdAt: string
}

interface TradeHistoryPagination {
  currentPage: number
  totalPages: number
  totalTrades: number
  hasNextPage: boolean
  hasPrevPage: boolean
}

interface TradeHistoryResponse {
  history: TradeHistoryItem[]
  pagination: TradeHistoryPagination
}

interface UseTradeHistoryParams {
  idUser?: string
  page?: number
  limit?: number
}

const getData = async ({ queryKey }: { queryKey: any }): Promise<TradeHistoryResponse | null> => {
  const [, idUser, page, limit] = queryKey

  if (!idUser) return null

  const res = await fetcher({
    url: `https://bot-dca-token.onrender.com/api/dca/dca-history/${idUser}?page=${page}&limit=${limit}`,
  })

  return res?.data || null
}

export const useTradeHistory = ({ idUser, page = 1, limit = 20 }: UseTradeHistoryParams) => {
  const { data, isLoading, refetch, error, isError } = useQuery({
    queryKey: [QUERY_KEY.ListTradeHistory, idUser, page, limit],
    queryFn: getData,
    enabled: !!idUser,
    placeholderData: (previousData) => previousData, // Giữ dữ liệu cũ khi chuyển trang
  })

  return {
    isLoading,
    data,
    refetch,
    error,
    isError,
    // Helper properties để dễ sử dụng
    history: data?.history || [],
    pagination: data?.pagination,
    totalTrades: data?.pagination?.totalTrades || 0,
    totalPages: data?.pagination?.totalPages || 0,
    currentPage: data?.pagination?.currentPage || page,
    hasNextPage: data?.pagination?.hasNextPage || false,
    hasPrevPage: data?.pagination?.hasPrevPage || false,
  }
}
