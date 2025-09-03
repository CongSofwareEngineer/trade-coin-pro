export interface Token {
  symbol?: string
  address?: string
  price?: number
  perETH?: string
  perETHChangePercentage?: string
  isNative?: boolean
  decimals?: number
  amountSwap?: number
  balance?: number
  outPutSwap?: string
}

export interface PoolToken {
  time?: string
  eth?: Token
  arrToken?: Token[]
  isSwap?: boolean
  inputSwap?: string
  outputSwap?: string
  estETH?: string
}

export type ETHLastSwapTemp = {
  [key: string]: string
}
