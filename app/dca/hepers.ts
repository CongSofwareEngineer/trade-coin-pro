import { BigNumber } from 'bignumber.js'

import { DcaTokenConfig, History } from './type'

import { deepClone } from '@/index'

const buyToken = (item: History, config: DcaTokenConfig, amountUSD: string, amountETH: string) => {
  let itemFinal = deepClone(item as History)
  let configFinal = deepClone(config as DcaTokenConfig)

  // console.log({ amountUSD, amountETH })

  itemFinal.isBuy = true
  itemFinal.buyAmount = amountUSD
  itemFinal.buyAmountETH = amountETH

  configFinal.amountUSDToBuy = BigNumber(configFinal.amountUSDToBuy || 0)
    .plus(amountUSD)
    .toFixed()

  configFinal.amountETHToBuy = BigNumber(configFinal.amountETHToBuy || 0)
    .plus(amountETH)
    .toFixed()

  return { item: itemFinal, config: configFinal }
}

const getRatePriceDrop = (currentPrice: number, minPrice: string, maxPrice: string) => {
  const rangePrice = BigNumber(maxPrice).minus(minPrice)
  let ratePriceDrop = BigNumber(1)
    .minus(BigNumber(BigNumber(currentPrice).minus(minPrice)).dividedBy(rangePrice))
    .abs()
    .toFixed()

  //nếu giá hiện tại < minPrice thì mua với số tiền = stepSize + % giá giảm(so voi khoảng giá min)
  if (BigNumber(currentPrice).isLessThan(minPrice)) {
    ratePriceDrop = BigNumber(ratePriceDrop).plus(1).toFixed()
  }

  return ratePriceDrop
}

export const checkToBuyByPrice = (item: History, config: DcaTokenConfig) => {
  let itemFinal = deepClone(item as History)
  let configFinal = deepClone(config as DcaTokenConfig)
  let isStop = false
  let amountETHToBuy = '0'
  let amountUSDToBuy = '0'
  //lấy token cần mua
  const token = item.arrToken.find((i) => i.tokenSymbol === configFinal.tokenInput)!

  //nếu giá hiện tại < giá mua lần trước và <= giá max để dca thì mua
  if (BigNumber(token.price).isLessThan(configFinal.maxPrice)) {
    //set gía mua lần đầu  với lần lấy giá đầu tiên
    if (!configFinal.priceBuyHistory || BigNumber(configFinal.priceBuyHistory).isEqualTo(0)) {
      configFinal.priceBuyHistory = token.price.toString()
    }

    //tính % giá giảm
    const ratePriceDropByRangeConfig = getRatePriceDrop(token.price, configFinal.minPrice, configFinal.maxPrice)
    const ratePriceDrop = BigNumber(BigNumber(token.price).minus(configFinal.priceBuyHistory).dividedBy(configFinal.priceBuyHistory)).abs().toNumber()

    //số tiền usd mua theo % giá giảm
    amountUSDToBuy = BigNumber(ratePriceDropByRangeConfig).multipliedBy(configFinal.stepSize).toFixed()

    //quy đổi sang ETH với trượt giá
    amountETHToBuy = BigNumber(amountUSDToBuy)
      .dividedBy(token.price)
      .multipliedBy(BigNumber(100 - configFinal.slippageTolerance).dividedBy(100))
      .toFixed()

    //nếu số tiền mua > số tiền còn lại thì mua hết số tiền còn lại và dừng dca
    if (BigNumber(configFinal.initialCapital).isLessThan(configFinal.amountUSDToBuy)) {
      amountUSDToBuy = BigNumber(configFinal.initialCapital).minus(configFinal.amountUSDToBuy).toFixed()
      amountETHToBuy = BigNumber(amountUSDToBuy)
        .dividedBy(token.price)
        .multipliedBy(BigNumber(100 - configFinal.slippageTolerance).dividedBy(100))
        .toFixed()

      isStop = true

      const { item: itemAfterBuy, config: configAfterBuy } = buyToken(itemFinal, configFinal, amountUSDToBuy, amountETHToBuy)

      itemFinal = itemAfterBuy
      configFinal = configAfterBuy
    }

    if (BigNumber(token.price).isLessThanOrEqualTo(configFinal.priceBuyHistory)) {
      if (
        ratePriceDrop >=
        BigNumber(configFinal.ratioPriceByHistory || 3)
          .dividedBy(100)
          .toNumber()
      ) {
        const { item: itemAfterBuy, config: configAfterBuy } = buyToken(itemFinal, configFinal, amountUSDToBuy, amountETHToBuy)

        itemFinal = itemAfterBuy
        configFinal = configAfterBuy
      }
    } else {
      const priceAverage = BigNumber(configFinal.amountUSDToBuy).dividedBy(configFinal.amountETHToBuy).toString()
      const ratioPriceDrop = BigNumber(priceAverage).minus(token.price).dividedBy(priceAverage).abs().toNumber()

      if (
        BigNumber(token.price).isLessThan(priceAverage) &&
        ratioPriceDrop >=
          BigNumber(configFinal.ratioPriceByHistory || 3)
            .dividedBy(100)
            .toNumber()
      ) {
        const { item: itemAfterBuy, config: configAfterBuy } = buyToken(itemFinal, configFinal, amountUSDToBuy, amountETHToBuy)

        itemFinal = itemAfterBuy
        configFinal = configAfterBuy
      }
    }

    configFinal.priceBuyHistory = token.price.toString()
  }

  return { item: itemFinal, config: configFinal, isStop }
}
