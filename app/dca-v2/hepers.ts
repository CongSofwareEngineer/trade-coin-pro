import { BigNumber } from 'bignumber.js'

import { DcaTokenConfig, History } from './type'

import { deepClone } from '@/index'

class DcaHelper {
  static execute(config: DcaTokenConfig, priceToken: string) {
    priceToken = BigNumber(priceToken).decimalPlaces(6, BigNumber.ROUND_DOWN).toString()
    let configClone = deepClone(config) as DcaTokenConfig
    let DCARecord = {} as History

    DCARecord.price = priceToken

    try {
      const isFirstTrade = BigNumber(configClone?.priceBuyHistory || '0').eq(0)

      if (BigNumber(priceToken).gte(configClone.maxPrice) || BigNumber(configClone.priceBuyHistory).isNaN()) {
        return null
      }

      // TH1. Logic MUA   chưa có lệnh -> mua
      if (isFirstTrade) {
        return this.buyToken(configClone, priceToken, 'TH1')
      } else {
        const priceHistory = BigNumber(configClone?.priceBuyHistory || '0').toString()
        const hasEth = BigNumber(configClone.amountETHToBuy || '0').gt(0)
        const avgPrice = hasEth ? BigNumber(configClone.amountUSDToBuy).dividedBy(configClone.amountETHToBuy).toString() : '0'
        const ratioPriceByHistory = this.getRatioPrice(priceHistory, priceToken)

        const isValidRatioPriceByHistory = BigNumber(ratioPriceByHistory).gt(configClone.ratioPriceChange)
        const isValidCapital = BigNumber(configClone.capital).gt(configClone.minUSDToSwap)
        const isValidEthToSell = BigNumber(configClone.amountETHToBuy || '0').gte(configClone.minTokenRemain)

        if (isValidRatioPriceByHistory) {
          // TH2. Khi giá < giá trung bình  => mua
          if (BigNumber(priceToken).lt(avgPrice) && isValidCapital) {
            return this.buyToken(configClone, priceToken, 'TH2')
          } else {
            //TH3: Khi giá < giá lịch sử và  giá >= giá trung bình  => mua
            if (BigNumber(priceToken).lt(priceHistory) && isValidCapital) {
              return this.buyToken(configClone, priceToken, 'TH3', true)
            } else {
              // TH4. Khi giá > giá trung bình và giá > giá lịch sử  => bán
              if (BigNumber(priceToken).gt(avgPrice) && isValidEthToSell) {
                return this.sellToken(configClone, priceToken, 'TH4')
              }
            }
          }
        }
      }

      return {
        item: DCARecord,
        config: configClone,
      }
    } catch (error) {
      console.log({ error })

      return {
        item: DCARecord,
        config: configClone,
      }
    }
  }

  static buyToken(config: DcaTokenConfig, priceToken: string, th: 'TH1' | 'TH2' | 'TH3' | 'TH4', isBuyPriceUpperAvg: boolean = false) {
    priceToken = BigNumber(priceToken).decimalPlaces(6, BigNumber.ROUND_DOWN).toString()
    let configClone = deepClone(config) as DcaTokenConfig
    let DCARecord = {} as History

    DCARecord.price = priceToken
    DCARecord.th = th

    let priceRatio = this.calculatePriceRatio(priceToken, configClone.minPrice, configClone.maxPrice)

    if (BigNumber(priceRatio).gte(0.5) && isBuyPriceUpperAvg) {
      priceRatio = '0.5' //max 50%
    }

    let buyAmountUSD = this.calculateUSDToBuy(priceRatio, configClone.stepSize)

    if (BigNumber(buyAmountUSD).gt(configClone.capital)) {
      buyAmountUSD = configClone.capital
    }

    if (BigNumber(buyAmountUSD).lt(configClone.minUSDToSwap)) {
      return {
        item: DCARecord,
        config: configClone,
      }
    }

    const buyAmountETH = this.calculateEthAfterBuy(buyAmountUSD, priceToken, configClone.slippageTolerance.toString())

    const { DCARecord: DCARecordFinal, config: configCloneFinal } = this.updateDataToBuy(configClone, buyAmountUSD, buyAmountETH)

    configClone = configCloneFinal
    DCARecord = { ...DCARecord, ...DCARecordFinal }
    DCARecord.isBuy = true
    configClone.priceBuyHistory = priceToken

    return {
      item: DCARecord,
      config: configClone,
    }
  }

  static sellToken(config: DcaTokenConfig, priceToken: string, th: 'TH1' | 'TH2' | 'TH3' | 'TH4') {
    priceToken = BigNumber(priceToken).decimalPlaces(6, BigNumber.ROUND_DOWN).toString()
    let configClone = deepClone(config) as DcaTokenConfig
    let DCARecord = {} as History

    DCARecord.price = priceToken
    DCARecord.th = th

    const hasEth = BigNumber(configClone.amountETHToBuy || '0').gt(0)
    const avgPrice = hasEth ? BigNumber(configClone.amountUSDToBuy).dividedBy(configClone.amountETHToBuy).toString() : '0'

    const sellResult = this.updateDataToSell(configClone, priceToken, avgPrice)

    if (!sellResult) {
      return {
        item: DCARecord,
        config: configClone,
      }
    }

    const { DCARecord: DCARecordFinal, config: configCloneFinal } = sellResult

    configClone = configCloneFinal
    DCARecord = { ...DCARecord, ...DCARecordFinal }
    DCARecord.avgPrice = avgPrice
    DCARecord.ethRemain = configClone.amountETHToBuy
    DCARecord.isSell = true
    configClone.priceBuyHistory = priceToken

    return {
      item: DCARecord,
      config: configClone,
    }
  }

  static getRatioPrice(priceHistory: string, priceToken: string) {
    const rate = BigNumber(priceToken).dividedBy(priceHistory).multipliedBy(100)

    return BigNumber(BigNumber(100).minus(rate)).abs().toString()
  }

  static calculatePriceRatio(price: string, minPrice: string, maxPrice: string, isSell: boolean = false): string {
    if (BigNumber(price).gte(minPrice)) {
      let ratio = BigNumber(BigNumber(price).minus(minPrice)).dividedBy(BigNumber(maxPrice).minus(minPrice))

      if (!isSell) {
        ratio = BigNumber(1).minus(ratio)
      }
      if (ratio.lte(0.35)) {
        ratio = ratio.multipliedBy(ratio).div(0.35)
      }

      return ratio.decimalPlaces(4, BigNumber.ROUND_DOWN).toString()
    } else {
      const ratio = BigNumber(BigNumber(minPrice).minus(price)).dividedBy(BigNumber(maxPrice).minus(minPrice))

      return BigNumber(1).plus(ratio).decimalPlaces(4, BigNumber.ROUND_DOWN).toString()
    }
  }

  static calculateUSDToBuy(priceRatio: string, baseAmount: string = '100'): string {
    return BigNumber(priceRatio).multipliedBy(baseAmount).decimalPlaces(6, BigNumber.ROUND_DOWN).toString()
  }

  static calculateEthAfterBuy(amountUSD: string, priceToken: string, slippage: string = '0'): string {
    const amountETH = BigNumber(amountUSD).dividedBy(priceToken).toString()
    const rate = BigNumber(1).minus(BigNumber(slippage).dividedBy(100)).toString()

    return BigNumber(amountETH).multipliedBy(rate).decimalPlaces(18, BigNumber.ROUND_DOWN).toString()
  }

  static updateDataToSell(config: DcaTokenConfig, priceToken: string, avgPrice: string) {
    const configClone = deepClone(config) as DcaTokenConfig

    const rateSlippage = BigNumber(BigNumber(100).minus(config.slippageTolerance)).div(100)
    // let sellIntensity = BigNumber(BigNumber(priceToken).minus(avgPrice)).div(BigNumber(config.maxPrice).minus(avgPrice))
    let sellIntensity = BigNumber(this.calculatePriceRatio(priceToken, configClone.minPrice, configClone.maxPrice, true))
    let priceRationByAvg = BigNumber(this.getRatioPrice(avgPrice, priceToken))

    priceRationByAvg = BigNumber(priceRationByAvg).dividedBy(100)

    // 2. TỐI ƯU NHẤT: Chiến thuật "Thăm dò & Quyết liệt"
    // if (sellIntensity.lt(0.3)) {
    //   // Vùng thăm dò: Bán rất ít  để giữ hàng
    //   sellIntensity = sellIntensity.multipliedBy(sellIntensity).div(0.3)
    //   if (sellIntensity.gte(0.2)) {
    //     sellIntensity = BigNumber(0.2)
    //   }
    // } else {
    //   if (sellIntensity.lte(0.7)) {
    //     sellIntensity = sellIntensity.multipliedBy(0.6)
    //     if (sellIntensity.lte(0.2)) {
    //       sellIntensity = BigNumber(0.2)
    //     }
    //   }
    // }
    // if (BigNumber(sellIntensity).gte(0.5)) {
    //   // upper price less than avg price 5%
    //   if (BigNumber(priceRationByAvg).lte(0.05)) {
    //     sellIntensity = BigNumber(0.3) //max 30% of stepSize
    //   } else {
    //     sellIntensity = BigNumber(0.5) //max 50% of stepSize
    //   }
    // }

    if (BigNumber(priceRationByAvg).lte(0.051)) {
      return null
    }

    priceRationByAvg = priceRationByAvg.multipliedBy(2)

    if (BigNumber(priceRationByAvg).gte(0.5)) {
      priceRationByAvg = BigNumber(0.5)
    }

    // if (BigNumber(priceToken).lte(configClone.minPrice)) {
    //   if (BigNumber(sellIntensity).gte(0.3)) {
    //     sellIntensity = BigNumber(0.3) //max 30% of stepSize
    //   }
    // }

    let amountEthToSell = BigNumber(BigNumber(configClone.stepSize).dividedBy(priceToken))
      .multipliedBy(priceRationByAvg)
      .decimalPlaces(18, BigNumber.ROUND_DOWN)

    if (BigNumber(amountEthToSell).gt(configClone.amountETHToBuy)) {
      amountEthToSell = BigNumber(configClone.amountETHToBuy)
    }
    const usdReceived = BigNumber(amountEthToSell).multipliedBy(priceToken).decimalPlaces(6, BigNumber.ROUND_DOWN)

    if (usdReceived.lt(configClone.minUSDToSwap)) {
      return null
    }

    const actualUSDReceived = BigNumber(amountEthToSell).multipliedBy(priceToken).multipliedBy(rateSlippage).decimalPlaces(6, BigNumber.ROUND_DOWN)

    // Gốc USD được rút ra khỏi tổng vốn dựa trên AvgPrice
    const costBasisRemoved = BigNumber(amountEthToSell).multipliedBy(avgPrice).decimalPlaces(6, BigNumber.ROUND_DOWN)

    configClone.capital = BigNumber(configClone.capital).plus(actualUSDReceived).decimalPlaces(6, BigNumber.ROUND_DOWN).toString()
    configClone.amountETHToBuy = BigNumber(configClone.amountETHToBuy || '0')
      .minus(amountEthToSell)
      .decimalPlaces(18, BigNumber.ROUND_DOWN)
      .toString()
    configClone.amountUSDToBuy = BigNumber(configClone.amountUSDToBuy || '0')
      .minus(costBasisRemoved)
      .decimalPlaces(6, BigNumber.ROUND_DOWN)
      .toString()

    const DCARecord: Partial<History> = {
      price: priceToken,
      buyAmount: BigNumber(amountEthToSell).decimalPlaces(6, BigNumber.ROUND_DOWN).toString(),
      buyAmountETH: BigNumber(actualUSDReceived).decimalPlaces(6, BigNumber.ROUND_DOWN).toString(),
    }

    return { config: configClone, DCARecord }
  }

  static updateDataToBuy(config: DcaTokenConfig, buyAmountUSD: string, buyAmountETH: string) {
    const configClone = deepClone(config) as DcaTokenConfig

    configClone.capital = BigNumber(configClone.capital).minus(buyAmountUSD).decimalPlaces(6, BigNumber.ROUND_DOWN).toString()
    configClone.amountETHToBuy = BigNumber(configClone.amountETHToBuy || '0')
      .plus(buyAmountETH)
      .decimalPlaces(18, BigNumber.ROUND_DOWN)
      .toString()
    configClone.amountUSDToBuy = BigNumber(configClone.amountUSDToBuy || '0')
      .plus(buyAmountUSD)
      .decimalPlaces(6, BigNumber.ROUND_DOWN)
      .toString()

    const DCARecord: Partial<History> = {
      buyAmount: BigNumber(buyAmountUSD).decimalPlaces(6, BigNumber.ROUND_DOWN).toString(),
      buyAmountETH: BigNumber(buyAmountETH).decimalPlaces(6, BigNumber.ROUND_DOWN).toString(),
    }

    return { config: configClone, DCARecord }
  }
}

export default DcaHelper
