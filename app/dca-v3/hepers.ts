import { BigNumber } from 'bignumber.js'

import { DcaTokenConfig, History } from './type'

import { deepClone } from '@/index'

export const checkToBuyByPrice = (item: History, config: DcaTokenConfig) => {
  let itemFinal = deepClone(item as History)
  let configFinal = deepClone(config as DcaTokenConfig)
  let isStop = false
  let amountETH = '0'

  //lấy token cần mua
  const token = item.arrToken.find((i) => i.tokenSymbol === configFinal.tokenInput)!

  //set gía mua lần đầu  với lần lấy giá đầu tiên
  if (!configFinal.priceBuyHistory || BigNumber(configFinal.priceBuyHistory).isEqualTo(0)) {
    configFinal.priceBuyHistory = token.price.toString()
  }

  //nếu giá hiện tại   <= giá max để dca thì mua
  if (BigNumber(token.price).isLessThan(configFinal.maxPrice)) {
    if (BigNumber(token.price).isLessThanOrEqualTo(configFinal.priceBuyHistory)) {
      //so sánh giá hiện tại với khoảng giá min và max để tính % giá giảm
      let ratePriceDrop = BigNumber(1)
        .minus(BigNumber(BigNumber(token.price).minus(configFinal.minPrice)).dividedBy(configFinal.minPrice))
        .abs()
        .toFixed()

      //nếu giá hiện tại < minPrice thì mua với số tiền = stepSize + % giá giảm(so voi khoảng giá min)
      if (BigNumber(token.price).isLessThan(configFinal.minPrice)) {
        ratePriceDrop = BigNumber(configFinal.minPrice).dividedBy(token.price).toFixed()
      }

      //số tiền usd mua theo % giá giảm
      let amountUSD = BigNumber(ratePriceDrop).multipliedBy(configFinal.stepSize).toFixed()

      //quy đổi sang ETH với trượt giá
      amountETH = BigNumber(amountUSD)
        .dividedBy(token.price)
        .multipliedBy(BigNumber(100 - configFinal.slippageTolerance).dividedBy(100))
        .toFixed()

      //nếu số tiền mua > số tiền còn lại thì mua hết số tiền còn lại và dừng dca
      if (BigNumber(configFinal.initialCapital).isLessThan(configFinal.amountUSD)) {
        amountUSD = BigNumber(configFinal.initialCapital).minus(configFinal.amountUSD).toFixed()
        amountETH = BigNumber(amountUSD)
          .dividedBy(token.price)
          .multipliedBy(BigNumber(100 - configFinal.slippageTolerance).dividedBy(100))
          .toFixed()

        isStop = true

        itemFinal.isSwap = true
        itemFinal.buyAmount = amountUSD

        configFinal.amountETHBought = BigNumber(configFinal.amountETHBought || 0)
          .plus(amountETH)
          .toFixed()

        configFinal.amountUSD = BigNumber(configFinal.amountUSD || 0)
          .plus(amountUSD)
          .toFixed()
      } else {
        itemFinal.isSwap = true
        itemFinal.buyAmount = amountUSD
        configFinal.amountETHBought = BigNumber(configFinal.amountETHBought || 0)
          .plus(amountETH)
          .toFixed()

        configFinal.amountUSD = BigNumber(configFinal.amountUSD || 0)
          .plus(amountUSD)
          .toFixed()
      }
    } else {
      const ratioPriceUp = BigNumber(token.price).dividedBy(configFinal.priceBuyHistory).minus(1).toFixed()
      const ratioPriceUpConfig = BigNumber(configFinal.ratioPriceUp).dividedBy(100).toFixed()

      //lên giá tăng và tăng > % giá tăng đã cấu hình thì bán hết
      if (BigNumber(ratioPriceUp).isGreaterThan(ratioPriceUpConfig) && BigNumber(configFinal.amountETHBought).isGreaterThan(0)) {
        console.log('bán token')

        const priceAverage = BigNumber(configFinal.amountUSD || '1')
          .dividedBy(Number(configFinal.amountETHBought) || '1')
          .toFixed(4)
        const amountSellToUSD = BigNumber(configFinal.amountETHBought)
          .multipliedBy(token.price)
          .multipliedBy(BigNumber(100 - configFinal.slippageTolerance).dividedBy(100))
          .toFixed()

        if (BigNumber(priceAverage).isGreaterThan(BigNumber(amountSellToUSD))) {
          itemFinal.isSwap = true
          configFinal.amountETHBought = '0'
          configFinal.amountUSD = '0'
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
