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
 * Quy giá trị USD của token input lúc bắt đầu và token output lúc kết thúc để xem chênh lệch.
 * startValueUsd = amountStart * giá token input ở item đầu
 * endValueUsd   = amountInput cuối * giá token output ở item cuối
 */
export const getRebalanceSummary = (res: RebalanceResult, config: RebalanceConfig): RebalanceSummary | null => {
  const poolTokenFirst = res.arrData[0]
  const poolTokenLast = res.arrData[res.arrData.length - 1]

  if (!poolTokenFirst || !poolTokenLast) return null

  const symbolStart = String(config.outputStart).toLocaleUpperCase().trim()
  const symbolEnd = res.state.outputSwap
  const priceStart = poolTokenFirst.arrToken?.find((e) => e.symbol === symbolStart)?.price
  const priceEnd = poolTokenLast.arrToken?.find((e) => e.symbol === symbolEnd)?.price

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
    startValueUsd,
    endValueUsd,
    profitUsd,
    profitPercentage,
  }
}

export { RebalanceHelper, RebalanceV1, RebalanceV4, RebalanceV5 }
