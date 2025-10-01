export interface Result {
  initialCapital: string
  priceLasted: string
  minPrice: string
  maxPrice: string
  total: string
  amountSwapped: string
  totalAmountUSD: string
  totalETHBought: string
  priceAverage: string
  totalFee: string
  arrSwap: number[]
  ratioApr: string
  ratioAprByPrice: string
  aprByPrice: string
}
export interface DcaTokenConfig {
  stepSize: string // Maximum amount to invest per trade in USD
  slippageTolerance: number // Acceptable slippage percentage
  maxPrice: string // Upper price limit for token purchase
  minPrice: string // Lower price limit for token purchase
  initialCapital: string // Initial capital allocated for DCA in USD
  isStop: boolean // Flag to indicate if DCA is paused
  // ratioPriceDrop: number // Percentage drop in price to trigger additional investment
  priceBuyHistory: string
  tokenInput: string
  amountUSDToBuy: string
  amountETHToBuy: string
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
}
