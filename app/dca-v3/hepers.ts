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

  //set gía mua lần đầu  với lần lấy giá đầu tiên
  if (!configFinal.priceBuyHistory || BigNumber(configFinal.priceBuyHistory).isEqualTo(0)) {
    configFinal.priceBuyHistory = token.price.toString()
  }

  //tính % giá giảm
  const ratePriceDrop = getRatePriceDrop(token.price, configFinal.minPrice, configFinal.maxPrice)

  //số tiền usd mua theo % giá giảm
  amountUSDToBuy = BigNumber(ratePriceDrop).multipliedBy(configFinal.stepSize).toFixed()

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

    itemFinal = buyToken(itemFinal, configFinal, amountUSDToBuy, amountETHToBuy).item
    configFinal = buyToken(itemFinal, configFinal, amountUSDToBuy, amountETHToBuy).config
  }

  //nếu giá hiện tại   <= giá max để dca thì mua
  if (BigNumber(token.price).isLessThan(configFinal.maxPrice)) {
    if (BigNumber(token.price).isLessThanOrEqualTo(configFinal.priceBuyHistory)) {
      itemFinal = buyToken(itemFinal, configFinal, amountUSDToBuy, amountETHToBuy).item
      configFinal = buyToken(itemFinal, configFinal, amountUSDToBuy, amountETHToBuy).config
    } else {
      const ratioPriceUp = BigNumber(token.price).dividedBy(configFinal.priceBuyHistory).minus(1).toFixed()
      const ratioPriceUpConfig = BigNumber(configFinal.ratioPriceUp).dividedBy(100).toFixed()

      //lên giá tăng và tăng > % giá tăng đã cấu hình thì bán hết
      if (BigNumber(ratioPriceUp).isGreaterThan(ratioPriceUpConfig) && BigNumber(configFinal.amountETHToBuy).isGreaterThan(0)) {
        console.log('bán token')

        const priceAverage = BigNumber(configFinal.amountUSDToBuy || '1').dividedBy(Number(configFinal.amountETHToBuy) || '1')

        const amountSellToUSD = BigNumber(configFinal.amountETHToBuy || '0')
          .multipliedBy(token.price)
          .multipliedBy(BigNumber(100 - configFinal.slippageTolerance).dividedBy(100))
          .toFixed()

        if (BigNumber(priceAverage).isLessThan(token.price)) {
          itemFinal.isBuy = true

          configFinal.amountUSDToBuy = '0'
          configFinal.amountETHToBuy = '0'
          configFinal.initialCapital = BigNumber(configFinal.initialCapital || 0)
            .plus(amountSellToUSD)
            .toFixed()
        }
      }
    }
    configFinal.priceBuyHistory = token.price.toString()
  }

  return { item: itemFinal, config: configFinal, isStop }
}
