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
  amountUSD: string
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
}
