import { BigNumber } from 'bignumber.js'

import { RebalanceConfig, RebalanceResult, RebalanceSummary, Version } from './type'
import RebalanceHelper from './helpersBase'
import RebalanceV1 from './helpersV1'
import RebalanceV4 from './helpersV4'
import RebalanceV5 from './helpersV5'

export const getRebalanceHelper = (version: Version, config: RebalanceConfig): RebalanceHelper => {
  if (version === 'v4') return new RebalanceV4(config)

  if (version === 'v5') return new RebalanceV5(config)

  return new RebalanceV1(config)
}

/**
 * USD value of the input token at the start vs the output token at the end.
 * startValueUsd = amountStart * input token price at the first item
 * endValueUsd   = final amountInput * output token price at the row of the last swap
 *                 (no swap at all → price at the first item, the amount never changed)
 */
export const getRebalanceSummary = (res: RebalanceResult, config: RebalanceConfig): RebalanceSummary | null => {
  const poolTokenFirst = res.arrData[0]
  const poolTokenLastSwap = res.arrSwap[res.arrSwap.length - 1] || poolTokenFirst

  if (!poolTokenFirst) return null

  const symbolStart = String(config.outputStart).toLocaleUpperCase().trim()
  const symbolEnd = res.state.outputSwap
  const priceStart = poolTokenFirst.arrToken?.find((e) => e.symbol === symbolStart)?.price
  const priceEnd = poolTokenLastSwap.arrToken?.find((e) => e.symbol === symbolEnd)?.price

  if (!priceStart || !priceEnd) return null

  const startAmount = String(config.amountStart)
  const endAmount = res.state.amountInput
  const startValueUsd = BigNumber(startAmount).multipliedBy(priceStart).toFixed()
  const endValueUsd = BigNumber(endAmount).multipliedBy(priceEnd).toFixed()
  const profitUsd = BigNumber(endValueUsd).minus(startValueUsd).toFixed()
  const profitPercentage = BigNumber(startValueUsd).gt(0) ? BigNumber(profitUsd).dividedBy(startValueUsd).multipliedBy(100).toFixed() : '0'

  return {
    symbolStart,
    symbolEnd,
    startAmount,
    endAmount,
    priceStartUsd: String(priceStart),
    priceEndUsd: String(priceEnd),
    startValueUsd,
    endValueUsd,
    profitUsd,
    profitPercentage,
  }
}

export { RebalanceHelper, RebalanceV1, RebalanceV4, RebalanceV5 }
