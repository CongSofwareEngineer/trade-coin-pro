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
  stepSize: string // Maximum amount to invest per trade in USD
  slippageTolerance: number // Acceptable slippage percentage
  maxPrice: string // Upper price limit for token purchase
  minPrice: string // Lower price limit for token purchase
  isStop?: boolean // Flag to indicate if DCA is paused
  isBuy?: boolean // Flag to indicate if DCA is paused
  // ratioPriceDrop: number // Percentage drop in price to trigger additional investment
  priceBuyHistory: string
  tokenInput: string
  amountUSDToBuy: string
  amountETHToBuy: string
  capital: string
  minTokenRemain: string
  minUSDToSwap: string
  ratioPriceChange: string
  th?: string
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
