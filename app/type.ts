import { ETHLastSwapTemp, PoolToken } from '@/types/app'

export type Version = 'v1' | 'v4' | 'v5'

//config user nhập trên UI
export interface RebalanceConfig {
  amountStart: string | number
  outputStart: string
  volatilityPercentage: string | number
  affiliate: string | number
}

//state chạy strategy, trước đây nằm trong localStorage (KEY_STORAGE)
export interface RebalanceState {
  amountInput: string
  outputSwap: string
  outputSwapTemp: string
  ETHLastSwap: ETHLastSwapTemp
  ETHLastSwapTemp: ETHLastSwapTemp
  perETHOriginal: ETHLastSwapTemp
  ETHOriginalAmount: string
  //v4
  price1Point: ETHLastSwapTemp
}

export interface RebalanceResult {
  arrData: PoolToken[]
  arrSwap: PoolToken[]
  state: RebalanceState
}

//tổng kết kết quả chạy: vào bao nhiêu, ra bao nhiêu, chênh lệch giá trị USD
export interface RebalanceSummary {
  symbolStart: string
  symbolEnd: string
  startAmount: string
  endAmount: string
  priceStartUsd: string
  priceEndUsd: string
  startValueUsd: string
  endValueUsd: string
  profitUsd: string
  profitPercentage: string
}
