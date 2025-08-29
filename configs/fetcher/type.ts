export type IFetch = {
  url: string
  baseUrl?: string
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  query?: any
  body?: any
  formData?: any
  auth?: string | boolean
  throwError?: boolean
  showError?: boolean
  fromBacoor?: boolean
  headers?: Record<string, any>
} & Omit<RequestInit, 'body' | 'headers'>

export type ReturnData<T> = {
  statusCode: number
  data: T | null
  message: any
}

export type GetListResult<T> = {
  items: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export type PaginationQuery = {
  limit: number
  page: number
}
