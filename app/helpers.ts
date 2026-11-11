import { BigNumber } from 'bignumber.js'

import { RebalanceConfig, RebalanceResult, RebalanceSummary, Version } from './type'
import RebalanceHelper from './helpersBase'
import RebalanceV1 from './helpersV1'
import RebalanceV4 from './helpersV4'
import RebalanceV5 from './helpersV5'

import { uppercase } from '@/utils/functions'

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
 *
 * Mỗi dòng: holding hiện tại (SwapOutputTokenAmount) * giá đồng đó / giá input token tại dòng đó
 * → maxUnrealizedGain = MAX(các số trên) - amount input ban đầu
 * → maxUnrealizedLoss = MIN(các số trên) - amount input ban đầu
 * → endInputTokenBalance = số quy đổi của dòng CUỐI CÙNG
 */
export const getRebalanceSummary = (res: RebalanceResult, config: RebalanceConfig): RebalanceSummary | null => {
  const poolTokenFirst = res.arrData[0]
  const poolTokenLast = res.arrData[res.arrData.length - 1] || poolTokenFirst
  const poolTokenLastSwap = res.arrSwap[res.arrSwap.length - 1] || poolTokenFirst

  if (!poolTokenFirst) return null

  const symbolStart = uppercase(config.outputStart)
  const symbolEnd = uppercase(res.state.outputSwap)
  const priceStart = poolTokenFirst.arrToken?.find((e) => uppercase(e.symbol) === symbolStart)?.price
  const priceEnd = poolTokenLastSwap.arrToken?.find((e) => uppercase(e.symbol) === symbolEnd)?.price
  const priceStartLastRow = poolTokenLast.arrToken?.find((e) => uppercase(e.symbol) === symbolStart)?.price

  if (!priceStart || !priceEnd) return null

  const startAmount = String(config.amountStart)
  const endAmount = res.state.amountInput
  const startValueUsd = BigNumber(startAmount).multipliedBy(priceStart).toFixed()
  const endValueUsd = BigNumber(endAmount).multipliedBy(priceEnd).toFixed()
  const profitUsd = BigNumber(endValueUsd).minus(startValueUsd).toFixed()
  const profitPercentage = BigNumber(startValueUsd).gt(0) ? BigNumber(profitUsd).dividedBy(startValueUsd).multipliedBy(100).toFixed() : '0'
  const declinePercentage =
    priceStartLastRow && BigNumber(priceStart).gt(0) ? BigNumber(priceStart).minus(priceStartLastRow).dividedBy(priceStart).toFixed() : '0'

  //quy đổi holding của từng dòng về input token: amount * giá đồng đang giữ / giá input token tại dòng đó
  let amountHold = startAmount
  let symbolHold = symbolStart
  let maxAmountInput = ''
  let minAmountInput = ''
  let endInputTokenBalance = startAmount

  res.arrData.forEach((poolToken) => {
    const symbolSwap = uppercase(poolToken.outputSwap as string)

    if (poolToken.isSwap && symbolSwap && poolToken[`est_${symbolSwap}`]) {
      amountHold = String(poolToken[`est_${symbolSwap}`])
      symbolHold = symbolSwap
    }

    const priceHold = poolToken.arrToken?.find((e) => uppercase(e.symbol) === symbolHold)?.price
    const priceInput = poolToken.arrToken?.find((e) => uppercase(e.symbol) === symbolStart)?.price

    if (!priceHold || !priceInput) return

    const amountInputToken = BigNumber(amountHold).multipliedBy(priceHold).dividedBy(priceInput).toFixed()

    if (!maxAmountInput || BigNumber(amountInputToken).gt(maxAmountInput)) maxAmountInput = amountInputToken
    if (!minAmountInput || BigNumber(amountInputToken).lt(minAmountInput)) minAmountInput = amountInputToken

    endInputTokenBalance = amountInputToken
  })

  const maxUnrealizedGain = BigNumber(maxAmountInput || startAmount)
    .minus(startAmount)
    .toFixed()
  const maxUnrealizedLoss = BigNumber(minAmountInput || startAmount)
    .minus(startAmount)
    .toFixed()
  const maxUnrealizedGainPercentage = BigNumber(startAmount).gt(0)
    ? BigNumber(maxUnrealizedGain).dividedBy(startAmount).multipliedBy(100).toFixed()
    : '0'
  const maxUnrealizedLossPercentage = BigNumber(startAmount).gt(0)
    ? BigNumber(maxUnrealizedLoss).dividedBy(startAmount).multipliedBy(100).toFixed()
    : '0'
  const priceChangePercentage =
    priceStartLastRow && BigNumber(priceStart).gt(0)
      ? BigNumber(priceStartLastRow).minus(priceStart).dividedBy(priceStart).multipliedBy(100).toFixed()
      : '0'
  const trend: RebalanceSummary['trend'] = BigNumber(priceChangePercentage).gt(0) ? 'up' : BigNumber(priceChangePercentage).lt(0) ? 'down' : 'flat'

  return {
    symbolStart,
    symbolEnd,
    startAmount,
    endAmount,
    priceStartUsd: String(priceStart),
    priceEndUsd: String(priceEnd),
    priceEndInputUsd: String(priceStartLastRow || priceStart),
    declinePercentage,
    startValueUsd,
    endValueUsd,
    profitUsd,
    profitPercentage,
    timeStart: poolTokenFirst.time || '',
    timeEnd: poolTokenLast.time || '',
    priceChangePercentage,
    trend,
    maxUnrealizedGain,
    maxUnrealizedGainPercentage,
    maxUnrealizedLoss,
    maxUnrealizedLossPercentage,
    endInputTokenBalance,
    totalSwaps: res.arrSwap.length,
  }
}

export { RebalanceHelper, RebalanceV1, RebalanceV4, RebalanceV5 }
