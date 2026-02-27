import { BigNumber } from 'bignumber.js'

import { DcaTokenConfig, History } from './type'

import {} from '@/index'
import { cloneData } from '@/utils/functions'

class DcaHelper {
  static executeTrading(config: DcaTokenConfig, priceToken: string) {
    try {
      const configClone = cloneData(config) as DcaTokenConfig
      const DCARecord = { price: priceToken } as History
      const isFirstTrade = BigNumber(configClone?.lastHistoryPrice || '0').eq(0)

      if (this.isInvalidPriceToTrade(configClone, priceToken)) {
        return null
      }

      // TH1. Logic MUA   chưa có lệnh -> mua
      if (isFirstTrade) {
        return this.buyToken(configClone, priceToken, 'TH1')
      }

      const tradeResult = this.tryExecuteTradingCases(configClone, priceToken)

      if (tradeResult) {
        return tradeResult
      }

      return {
        item: DCARecord,
        config: configClone,
      }
    } catch (error) {
      console.log({ error })

      return null
    }
  }

  private static getPositionStats(config: DcaTokenConfig): { hasToken: boolean; avgPrice: string } {
    const hasToken = BigNumber(config.amountToken || '0')
      .decimalPlaces(6, BigNumber.ROUND_DOWN)
      .gt(0)
    const avgPrice = hasToken ? BigNumber(config.amountStable).dividedBy(config.amountToken).toString() : '0'

    return { hasToken, avgPrice }
  }

  private static getTradingV3DerivedValues(config: DcaTokenConfig, priceToken: string) {
    const priceHistory = BigNumber(config?.lastHistoryPrice || '0').toString()
    const { hasToken, avgPrice } = this.getPositionStats(config)
    const ratioPriceByHistory = this.getRatioPrice(priceHistory, priceToken)

    const isValidRatioPriceByHistory = BigNumber(ratioPriceByHistory).gt(config.ratioPriceChange)
    const isValidCapital = BigNumber(config.capital).gt(0)
    const ratioStableBought = BigNumber(config.amountStable || '0')
      .dividedBy(config.initialCapital)
      .multipliedBy(100)
    const inventoryThreshold = config.inventoryThreshold ?? '30'
    const isValidSell = BigNumber(ratioStableBought).gte(inventoryThreshold)

    return {
      priceHistory,
      hasToken,
      avgPrice,
      ratioPriceByHistory,
      isValidRatioPriceByHistory,
      isValidCapital,
      isValidSell,
    }
  }

  private static isInvalidPriceToTrade(config: DcaTokenConfig, priceToken: string): boolean {
    return BigNumber(priceToken).gte(config.maxPrice) || BigNumber(config.lastHistoryPrice).isNaN() || config.lastHistoryPrice === 'NaN'
  }

  private static shouldByTokenTH2(priceToken: string, derived: { avgPrice: string; isValidCapital: boolean }) {
    return BigNumber(priceToken).lt(derived.avgPrice) && derived.isValidCapital
  }

  private static shouldByTokenTH3(priceToken: string, derived: { priceHistory: string; isValidCapital: boolean }) {
    return BigNumber(priceToken).lt(derived.priceHistory) && derived.isValidCapital
  }

  private static shouldByTokenTH4(priceToken: string, derived: { avgPrice: string; isValidSell: boolean; isValidCapital: boolean }) {
    // return BigNumber(priceToken).gt(derived.avgPrice) && !derived.isValidSell && derived.isValidCapital
    return false
  }

  private static shouldSellToken(priceToken: string, derived: { avgPrice: string; isValidSell: boolean }) {
    return BigNumber(priceToken).gt(derived.avgPrice) && derived.isValidSell
  }

  private static tryExecuteTradingCases(config: DcaTokenConfig, priceToken: string) {
    const derived = this.getTradingV3DerivedValues(config, priceToken)

    if (!derived.isValidRatioPriceByHistory) {
      return null
    }

    // TH2. Khi giá < giá trung bình  => mua
    if (this.shouldByTokenTH2(priceToken, derived)) {
      return this.buyToken(config, priceToken, 'TH2')
    }

    // TH3: Khi giá < giá lịch sử (ưu tiên sau TH2) => mua
    if (this.shouldByTokenTH3(priceToken, derived)) {
      return this.buyToken(config, priceToken, 'TH3')
    }

    // TH4: Khi giá > giá trung bình và số vốn mua  < 30% số vốn ban đầu   => mua
    if (this.shouldByTokenTH4(priceToken, derived)) {
      return this.buyToken(config, priceToken, 'TH4')
    }

    // TH5. Khi giá > giá trung bình và giá > giá lịch sử  => bán
    if (this.shouldSellToken(priceToken, derived)) {
      return this.sellToken(config, priceToken, 'TH5')
    }

    return null
  }

  static buyToken(config: DcaTokenConfig, priceToken: string, th: string, isBuyPriceUpperAvg: boolean = false) {
    let configClone = cloneData(config) as DcaTokenConfig
    let DCARecord = {} as History

    DCARecord.price = priceToken
    DCARecord.infoSwap = {
      TH: th.toString(),
    } as any

    let priceRatio = this.getRatioPriceBuy(priceToken, configClone.minPrice, configClone.maxPrice)

    if (BigNumber(priceRatio).gte(0.5) && isBuyPriceUpperAvg) {
      priceRatio = '0.5' //max 50%
    }

    let buyAmountUSD = this.calculateUSDToBuy(priceRatio, configClone.stepSize)

    if (BigNumber(buyAmountUSD).gt(configClone.capital)) {
      buyAmountUSD = configClone.capital
    }

    if (BigNumber(buyAmountUSD).lt(configClone.minUsdToSwap)) {
      return {
        item: DCARecord,
        config: configClone,
      }
    }

    const buyAmountToken = this.getAmountTokenAfterBuy(buyAmountUSD, config)

    const { DCARecord: DCARecordFinal, config: configCloneFinal } = this.updateDataToBuy(configClone, buyAmountUSD, buyAmountToken)

    configClone = configCloneFinal
    DCARecord = { ...DCARecord, ...DCARecordFinal }
    DCARecord.isBuy = true
    DCARecord.TH = th
    configClone.lastHistoryPrice = priceToken

    return {
      item: DCARecord,
      config: configClone,
    }
  }

  static sellToken(config: DcaTokenConfig, priceToken: string, th: string) {
    let configClone = cloneData(config) as DcaTokenConfig
    let DCARecord = {} as History

    DCARecord.price = priceToken

    const { avgPrice } = this.getPositionStats(configClone)

    const sellResult = this.updateDataToSell(configClone, priceToken, avgPrice)

    if (!sellResult) {
      return {
        item: DCARecord,
        config: configClone,
      }
    }

    DCARecord.infoSwap = {
      TH: th.toString(),
    } as any
    const { DCARecord: DCARecordFinal, config: configCloneFinal } = sellResult

    configClone = configCloneFinal
    DCARecord = { ...DCARecord, ...DCARecordFinal }
    DCARecord.isSell = true
    DCARecord['TH'] = th
    configClone.lastHistoryPrice = priceToken

    return {
      item: DCARecord,
      config: configClone,
    }
  }

  static getRatioPrice(priceHistory: string, priceToken: string) {
    const rate = BigNumber(priceToken).dividedBy(priceHistory).multipliedBy(100)

    return BigNumber(BigNumber(100).minus(rate)).abs().toString()
  }

  static getRatioPriceBuy(price: string, minPrice: string, maxPrice: string, isSell: boolean = false): string {
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

  static getAmountTokenAfterBuy(amountUSD: string, config: DcaTokenConfig): string {
    const amountETH = BigNumber(amountUSD).dividedBy('2300').toString()
    const rate = BigNumber(1).minus(BigNumber(config.slippageTolerance).dividedBy(100)).toString()

    return BigNumber(amountETH).multipliedBy(rate).decimalPlaces(18, BigNumber.ROUND_DOWN).toString()
  }

  static updateDataToBuy(config: DcaTokenConfig, buyAmountUSD: string, buyAmountToken: string) {
    const configClone = cloneData(config) as DcaTokenConfig

    configClone.capital = BigNumber(configClone.capital).minus(buyAmountUSD).decimalPlaces(6, BigNumber.ROUND_DOWN).toString()
    configClone.amountToken = BigNumber(configClone.amountToken || '0')
      .plus(buyAmountToken)
      .decimalPlaces(18, BigNumber.ROUND_DOWN)
      .toString()
    configClone.amountStable = BigNumber(configClone.amountStable || '0')
      .plus(buyAmountUSD)
      .decimalPlaces(6, BigNumber.ROUND_DOWN)
      .toString()

    const DCARecord = {
      isBuy: true,
      infoSwap: {
        from: 'USD',
        to: config.tokenInput,
        amountIn: BigNumber(buyAmountUSD).decimalPlaces(6, BigNumber.ROUND_DOWN).toNumber(),
        amountOut: BigNumber(buyAmountToken).decimalPlaces(6, BigNumber.ROUND_DOWN).toNumber(),
      },
    }

    return { config: configClone, DCARecord }
  }

  static updateDataToSell(config: DcaTokenConfig, priceToken: string, avgPrice: string) {
    const configClone = cloneData(config) as DcaTokenConfig
    const ratioPriceChangeConfig = BigNumber(configClone.ratioPriceChange).dividedBy(100).toString()

    let priceRationByAvg = BigNumber(this.getRatioPrice(avgPrice, priceToken))

    priceRationByAvg = BigNumber(priceRationByAvg).dividedBy(100)

    //<= config
    if (BigNumber(priceRationByAvg).lte(ratioPriceChangeConfig)) {
      return null
    }

    //<=10,1%
    if (priceRationByAvg.lte(0.11)) {
      priceRationByAvg = BigNumber(0.11)
    }

    if (BigNumber(priceRationByAvg).gte(0.5)) {
      priceRationByAvg = BigNumber(0.5)
    }

    let amountTokenToSell = BigNumber(BigNumber(configClone.stepSize).dividedBy(priceToken))
      .multipliedBy(priceRationByAvg)
      .decimalPlaces(18, BigNumber.ROUND_DOWN)

    if (BigNumber(amountTokenToSell).gt(config.amountToken)) {
      amountTokenToSell = BigNumber(config.amountToken)
    }

    amountTokenToSell = BigNumber(amountTokenToSell).decimalPlaces(6, BigNumber.ROUND_DOWN)
    const amountRealEstimate = BigNumber(amountTokenToSell)
      .multipliedBy(priceToken)
      .multipliedBy(BigNumber(1).minus(BigNumber(config.slippageTolerance).dividedBy(100)))
      .decimalPlaces(6, BigNumber.ROUND_DOWN)

    if (BigNumber(amountRealEstimate).lt(config.minUsdToSwap)) {
      return null
    }
    // Gốc USD được rút ra khỏi tổng vốn dựa trên AvgPrice
    const costBasisRemoved = BigNumber(amountTokenToSell).multipliedBy(avgPrice).decimalPlaces(6, BigNumber.ROUND_DOWN)

    configClone.capital = BigNumber(configClone.capital).plus(amountRealEstimate).decimalPlaces(6, BigNumber.ROUND_DOWN).toString()
    configClone.amountToken = BigNumber(configClone.amountToken || '0')
      .minus(amountTokenToSell)
      .decimalPlaces(18, BigNumber.ROUND_DOWN)
      .toString()
    configClone.amountStable = BigNumber(configClone.amountStable || '0')
      .minus(costBasisRemoved)
      .decimalPlaces(6, BigNumber.ROUND_DOWN)
      .toString()

    const DCARecord = {
      isSell: true,
      infoSwap: {
        from: config.tokenInput,
        to: 'USD',
        amountIn: BigNumber(amountTokenToSell).decimalPlaces(6, BigNumber.ROUND_DOWN).toNumber(),
        amountOut: BigNumber(amountRealEstimate).decimalPlaces(6, BigNumber.ROUND_DOWN).toNumber(), // Số USD thực nhận sau trượt giá và phí
      },
    }

    return { config: configClone, DCARecord }
  }
}

export default DcaHelper
