export interface Token {
  symbol?: string
  price?: number
  perETH?: string
  perETHChangePercentage?: string
  amountSwap?: number
}

export type PoolToken = {
  time?: string
  arrToken?: Token[]
  isSwap?: boolean
  inputSwap?: string
  outputSwap?: string
  estETH?: string
  [key: string]: unknown
}

export type ETHLastSwapTemp = {
  [key: string]: string
}
