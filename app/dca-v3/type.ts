export interface Result {
  initialCapital: string
  priceLasted: string
  minPrice: string
  maxPrice: string
  total: string
  amountSwapped: string
  amountSold: string
  totalAmountUSD: string
  totalETHBought: string
  priceAverage: string
  totalFee: string
  arrSwap: { index: number; isBuy: boolean }[]
  ratioApr: string
  ratioAprByPrice: string
  aprByPrice: string
}
export interface DcaTokenConfig {
  stepSize: string
  slippageTolerance: string
  maxPrice: string
  minPrice: string
  initialCapital: string
  capital: string
  tokenInput: string
  amountStable: string
  amountToken: string
  ratioPriceChange: string
  minUsdToSwap: string
  createdAt: string
  isPause: boolean
  poolVersion: string
  lastHistoryPrice: string
  inventoryThreshold: string
  [key: string]: unknown
}

export interface Token {
  tokenSymbol: string
  price: number
}

export interface History {
  arrToken: Token[]
  isBuy?: boolean
  isStop?: boolean
  buyAmount?: string
  buyAmountETH?: string
  isSell?: boolean
  price?: string
  [key: string]: unknown
}
