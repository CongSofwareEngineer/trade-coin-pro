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

const sellToken = (item: History, config: DcaTokenConfig, amountUSD: string) => {
  let itemFinal = deepClone(item as History)
  let configFinal = deepClone(config as DcaTokenConfig)

  itemFinal.isSell = true

  configFinal.amountETHToBuy = '0'
  configFinal.amountUSDToBuy = '0'

  //hoàn vốn ban đầu
  configFinal.initialCapital = BigNumber(configFinal.initialCapital || 0)
    .plus(amountUSD)
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
  let amountETHToBuy = '0'
  let amountUSDToBuy = '0'
  let isFirstBuy = false

  //lấy token cần mua
  const token = item.arrToken.find((i) => i.tokenSymbol === configFinal.tokenInput)!

  //nếu giá hiện tại   <= giá max để dca thì mua
  if (BigNumber(token.price).isLessThan(configFinal.maxPrice) && BigNumber(configFinal.initialCapital).gt(configFinal.amountUSDToBuy)) {
    //set gía mua lần đầu  với lần lấy giá đầu tiên
    if (!configFinal.priceBuyHistory || BigNumber(configFinal.priceBuyHistory).isEqualTo(0)) {
      configFinal.priceBuyHistory = token.price.toString()
      isFirstBuy = true
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
    if (BigNumber(configFinal.initialCapital).isLessThanOrEqualTo(BigNumber(amountUSDToBuy).plus(configFinal.amountUSDToBuy || 0))) {
      amountUSDToBuy = BigNumber(BigNumber(amountUSDToBuy).plus(configFinal.amountUSDToBuy || 0))
        .minus(configFinal.initialCapital)
        .toFixed()

      amountETHToBuy = BigNumber(amountUSDToBuy)
        .dividedBy(token.price)
        .multipliedBy(BigNumber(100 - configFinal.slippageTolerance).dividedBy(100))
        .toFixed()
    }

    if (isFirstBuy) {
      const { config, item } = buyToken(itemFinal, configFinal, amountUSDToBuy, amountETHToBuy)

      itemFinal = item
      configFinal = config
    } else {
      if (BigNumber(token.price).isLessThan(configFinal.priceBuyHistory)) {
        const { config, item } = buyToken(itemFinal, configFinal, amountUSDToBuy, amountETHToBuy)

        itemFinal = item
        configFinal = config
      }

      if (BigNumber(token.price).gt(configFinal.priceBuyHistory)) {
        let priceAverage = '0'

        //nếu đã mua ETh thì mới tính giá trung bình
        if (BigNumber(configFinal.amountETHToBuy).gt(0)) {
          priceAverage = BigNumber(configFinal.amountUSDToBuy).dividedBy(configFinal.amountETHToBuy).toFixed()
        }

        //nếu giá token nhỏ hơn giá trung bình
        if (BigNumber(token.price).isLessThan(priceAverage)) {
          const { config, item } = buyToken(itemFinal, configFinal, amountUSDToBuy, amountETHToBuy)

          itemFinal = item
          configFinal = config
        }

        //nếu giá token lớn hơn giá trung bình
        if (BigNumber(token.price).gt(priceAverage) && BigNumber(priceAverage).gt(0)) {
          const ratioPriceUp = BigNumber(1).minus(ratePriceDrop).toFixed()

          let amountUSDToSell = BigNumber(ratioPriceUp).multipliedBy(configFinal.stepSize).toFixed()

          //quy đổi sang ETH với trượt giá
          let amountETHToSell = BigNumber(amountUSDToSell).dividedBy(token.price).toFixed()

          amountUSDToSell = BigNumber(amountETHToSell)
            .multipliedBy(token.price)
            .multipliedBy(BigNumber(100 - configFinal.slippageTolerance).dividedBy(100))
            .toFixed()

          //nếu số tiền bán > số tiền đang có thì bán hết số tiền đang có
          if (BigNumber(configFinal.amountETHToBuy).isLessThanOrEqualTo(BigNumber(amountETHToSell).plus(configFinal.amountUSDToBuy || 0))) {
            amountETHToSell = configFinal.amountETHToBuy

            amountUSDToSell = BigNumber(amountETHToSell)
              .multipliedBy(token.price)
              .multipliedBy(BigNumber(100 - configFinal.slippageTolerance).dividedBy(100))
              .toFixed()
          }
          configFinal.initialCapital = BigNumber(configFinal.initialCapital || 0)
            .plus(amountUSDToSell)
            .toFixed()

          configFinal.amountETHToBuy = BigNumber(configFinal.amountETHToBuy || 0)
            .minus(amountETHToSell)
            .toFixed()
          configFinal.amountUSDToBuy = BigNumber(configFinal.amountUSDToBuy || 0)
            .minus(amountUSDToSell)
            .toFixed()

          itemFinal.isSell = true
          itemFinal.buyAmount = amountUSDToSell
          itemFinal.buyAmountETH = amountETHToSell
        }
      }
    }

    configFinal.priceBuyHistory = token.price.toString()
  }

  return { item: itemFinal, config: configFinal }
}
