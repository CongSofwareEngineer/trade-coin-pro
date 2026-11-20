import { BigNumber } from 'bignumber.js'

import { DcaTokenConfig, History } from './type'

import {} from '@/index'
import { cloneData } from '@/utils/functions'

const DECIMAL_DEFAULT = 6
const DECIMAL_RATIO_DEFAULT = 4
// TH2: giá < avgPrice nhưng > giá mua gần nhất → chỉ mua 50% số tiền tính ra
const TH2_BUY_RATIO_ABOVE_LAST_PRICE = '0.5'
// Decimals on-chain trên Base (ETH 18, cbBTC 8) — giống TOKEN[chainId] bên server
const TOKEN_DECIMALS: Record<string, number> = {
  ETH: 18,
  BTC: 8,
}

class DcaHelper {
  static executeTrading(config: DcaTokenConfig, priceToken: string) {
    try {
      const configClone = cloneData(config) as DcaTokenConfig
      const DCARecord = { price: priceToken } as History
      const isFirstTrade = BigNumber(configClone?.lastHistoryPrice || '0').eq(0)
      // Giá ≥ maxPrice → chỉ được bán, không mua (bỏ qua TH1–TH5)
      const isSellOnly = this.isAboveMaxPrice(configClone, priceToken)

      // TH1. Logic MUA   chưa có lệnh -> mua
      if (isFirstTrade) {
        if (isSellOnly) return null

        return this.buyToken(configClone, priceToken, 'TH1')
      }

      const tradeResult = this.tryExecuteTradingCases(configClone, priceToken, isSellOnly)

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

  // Decimals on-chain của token — fallback DECIMAL_DEFAULT nếu không tìm thấy
  private static getTokenDecimals(config: DcaTokenConfig): number {
    return TOKEN_DECIMALS[config.tokenInput] ?? DECIMAL_DEFAULT
  }

  private static getPositionStats(config: DcaTokenConfig): { hasToken: boolean; avgPrice: string } {
    const hasToken = BigNumber(config.amountToken || '0')
      .decimalPlaces(this.getTokenDecimals(config), BigNumber.ROUND_DOWN)
      .gt(0)
    const avgPrice = hasToken
      ? BigNumber(config.amountStable).dividedBy(config.amountToken).decimalPlaces(DECIMAL_DEFAULT, BigNumber.ROUND_DOWN).toString()
      : '0'

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

  private static isAboveMaxPrice(config: DcaTokenConfig, priceToken: string): boolean {
    return BigNumber(priceToken).gte(config.maxPrice)
  }

  private static shouldByTokenTH2(priceToken: string, derived: { avgPrice: string; isValidCapital: boolean }) {
    return BigNumber(priceToken).lt(derived.avgPrice) && derived.isValidCapital
  }

  private static shouldByTokenTH3(priceToken: string, derived: { priceHistory: string; isValidCapital: boolean }) {
    return BigNumber(priceToken).lt(derived.priceHistory) && derived.isValidCapital
  }

  private static shouldByTokenTH4(priceToken: string, derived: { avgPrice: string; isValidSell: boolean; isValidCapital: boolean }) {
    return BigNumber(priceToken).gt(derived.avgPrice) && !derived.isValidSell && derived.isValidCapital
  }

  private static shouldByTokenTH5(
    priceToken: string,
    derived: { avgPrice: string; isValidSell: boolean; isValidCapital: boolean },
    ratioPriceChangeSetting: string
  ) {
    const ratioPriceByAvg = this.getRatioPrice(derived.avgPrice, priceToken)

    return BigNumber(priceToken).gt(derived.avgPrice) && derived.isValidCapital && BigNumber(ratioPriceByAvg).lt(ratioPriceChangeSetting)
  }

  private static shouldSellToken(priceToken: string, derived: { avgPrice: string; isValidSell: boolean }) {
    return BigNumber(priceToken).gt(derived.avgPrice) && derived.isValidSell
  }

  private static tryExecuteTradingCases(config: DcaTokenConfig, priceToken: string, isSellOnly: boolean = false) {
    const derived = this.getTradingV3DerivedValues(config, priceToken)

    if (!derived.isValidRatioPriceByHistory) {
      return null
    }

    // Giá ≥ maxPrice → chỉ xét bán (TH6), không mua
    if (isSellOnly) {
      if (this.shouldSellToken(priceToken, derived)) return this.sellToken(config, priceToken, 'TH6')

      return null
    }

    // TH2. Khi giá < giá trung bình  => mua
    // Nếu giá vẫn > giá mua gần nhất (lastHistoryPrice) → chỉ mua TH2_BUY_RATIO_ABOVE_LAST_PRICE (50%) số tiền tính ra
    if (this.shouldByTokenTH2(priceToken, derived)) {
      const isAboveLastPrice = BigNumber(priceToken).gt(derived.priceHistory)
      const buyRatio = isAboveLastPrice ? TH2_BUY_RATIO_ABOVE_LAST_PRICE : undefined

      return this.buyToken(config, priceToken, 'TH2', false, buyRatio)
    }

    // TH3: Khi giá < giá lịch sử (ưu tiên sau TH2) => mua
    if (this.shouldByTokenTH3(priceToken, derived)) {
      return this.buyToken(config, priceToken, 'TH3')
    }

    // TH4: Khi giá > giá trung bình và số vốn mua  < 30% số vốn ban đầu   => mua
    if (this.shouldByTokenTH4(priceToken, derived)) {
      return this.buyToken(config, priceToken, 'TH4')
    }

    // TH5: Khi giá > giá trung bình và ko lớn hơn % giao động giá đã set  => mua
    if (this.shouldByTokenTH5(priceToken, derived, config.ratioPriceChange)) {
      console.log('shouldByTokenTH5')

      return this.buyToken(config, priceToken, 'TH5')
    }

    // TH6. Khi giá > giá trung bình và giá > giá lịch sử  => bán
    if (this.shouldSellToken(priceToken, derived)) {
      return this.sellToken(config, priceToken, 'TH6')
    }

    return null
  }

  private static buyToken(config: DcaTokenConfig, priceToken: string, th: string, isBuyPriceUpperAvg: boolean = false, buyRatio?: string) {
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

    // Giảm số tiền mua theo tỉ lệ (vd TH2 khi giá > giá mua gần nhất → 50%), trước khi cap theo capital
    if (buyRatio) {
      buyAmountUSD = BigNumber(buyAmountUSD).multipliedBy(buyRatio).decimalPlaces(DECIMAL_DEFAULT, BigNumber.ROUND_DOWN).toString()
      DCARecord.infoSwap = { ...(DCARecord.infoSwap as any), buyRatio }
    }

    if (BigNumber(buyAmountUSD).gt(configClone.capital)) {
      buyAmountUSD = configClone.capital
    }

    if (BigNumber(buyAmountUSD).lt(configClone.minUsdToSwap)) {
      return {
        item: DCARecord,
        config: configClone,
      }
    }

    const buyAmountToken = this.getAmountTokenAfterBuy(buyAmountUSD, config, priceToken)

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

  private static sellToken(config: DcaTokenConfig, priceToken: string, th: string) {
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

  private static getRatioPrice(priceHistory: string, priceToken: string) {
    const rate = BigNumber(priceToken).dividedBy(priceHistory).multipliedBy(100)

    return BigNumber(BigNumber(100).minus(rate)).abs().toString()
  }

  private static getRatioPriceBuy(price: string, minPrice: string, maxPrice: string, isSell: boolean = false): string {
    if (BigNumber(price).gte(minPrice)) {
      let ratio = BigNumber(BigNumber(price).minus(minPrice)).dividedBy(BigNumber(maxPrice).minus(minPrice))

      if (!isSell) {
        ratio = BigNumber(1).minus(ratio)
      }

      return ratio.decimalPlaces(DECIMAL_RATIO_DEFAULT, BigNumber.ROUND_DOWN).toString()
    } else {
      const ratio = BigNumber(BigNumber(minPrice).minus(price)).dividedBy(BigNumber(maxPrice).minus(minPrice))

      return BigNumber(1).plus(ratio).decimalPlaces(DECIMAL_RATIO_DEFAULT, BigNumber.ROUND_DOWN).toString()
    }
  }

  private static calculateUSDToBuy(priceRatio: string, baseAmount: string = '100'): string {
    return BigNumber(priceRatio).multipliedBy(baseAmount).decimalPlaces(DECIMAL_DEFAULT, BigNumber.ROUND_DOWN).toString()
  }

  private static getAmountTokenAfterBuy(amountUSD: string, config: DcaTokenConfig, price: string): string {
    const amountETH = BigNumber(amountUSD).dividedBy(price).toString()
    const rate = BigNumber(1).minus(BigNumber(config.slippageTolerance).dividedBy(100)).toString()

    return BigNumber(amountETH).multipliedBy(rate).decimalPlaces(this.getTokenDecimals(config), BigNumber.ROUND_DOWN).toString()
  }

  private static updateDataToBuy(config: DcaTokenConfig, buyAmountUSD: string, buyAmountToken: string) {
    const configClone = cloneData(config) as DcaTokenConfig
    const tokenDecimals = this.getTokenDecimals(config)

    configClone.capital = BigNumber(configClone.capital).minus(buyAmountUSD).decimalPlaces(DECIMAL_DEFAULT, BigNumber.ROUND_DOWN).toString()
    configClone.amountToken = BigNumber(configClone.amountToken || '0')
      .plus(buyAmountToken)
      .decimalPlaces(tokenDecimals, BigNumber.ROUND_DOWN)
      .toString()
    configClone.amountStable = BigNumber(configClone.amountStable || '0')
      .plus(buyAmountUSD)
      .decimalPlaces(DECIMAL_DEFAULT, BigNumber.ROUND_DOWN)
      .toString()

    const DCARecord = {
      isBuy: true,
      infoSwap: {
        from: 'USD',
        to: config.tokenInput,
        amountIn: BigNumber(buyAmountUSD).decimalPlaces(DECIMAL_DEFAULT, BigNumber.ROUND_DOWN).toNumber(),
        amountOut: BigNumber(buyAmountToken).decimalPlaces(tokenDecimals, BigNumber.ROUND_DOWN).toNumber(),
      },
    }

    return { config: configClone, DCARecord }
  }

  private static updateDataToSell(config: DcaTokenConfig, priceToken: string, avgPrice: string) {
    const configClone = cloneData(config) as DcaTokenConfig
    const tokenDecimals = this.getTokenDecimals(config)
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

    const usdReceivedForSell = BigNumber(configClone.stepSize).multipliedBy(priceRationByAvg).decimalPlaces(DECIMAL_DEFAULT, BigNumber.ROUND_DOWN)

    let amountTokenToSell = BigNumber(usdReceivedForSell).dividedBy(priceToken).decimalPlaces(tokenDecimals, BigNumber.ROUND_DOWN)

    if (BigNumber(amountTokenToSell).gt(config.amountToken)) {
      amountTokenToSell = BigNumber(config.amountToken)
    }

    amountTokenToSell = BigNumber(amountTokenToSell).decimalPlaces(tokenDecimals, BigNumber.ROUND_DOWN)

    // Simulation: không swap thật → dùng số USD ước tính sau slippage làm số thực nhận
    const amountRealEstimate = BigNumber(amountTokenToSell)
      .multipliedBy(priceToken)
      .multipliedBy(BigNumber(1).minus(BigNumber(config.slippageTolerance).dividedBy(100)))
      .decimalPlaces(DECIMAL_DEFAULT, BigNumber.ROUND_DOWN)

    if (BigNumber(amountRealEstimate).lt(config.minUsdToSwap)) {
      return null
    }
    // Gốc USD được rút ra khỏi tổng vốn dựa trên AvgPrice
    const costBasisRemoved = BigNumber(amountTokenToSell).multipliedBy(avgPrice).decimalPlaces(DECIMAL_DEFAULT, BigNumber.ROUND_DOWN)

    configClone.capital = BigNumber(configClone.capital).plus(amountRealEstimate).decimalPlaces(DECIMAL_DEFAULT, BigNumber.ROUND_DOWN).toString()
    configClone.amountToken = BigNumber(configClone.amountToken || '0')
      .minus(amountTokenToSell)
      .decimalPlaces(tokenDecimals, BigNumber.ROUND_DOWN)
      .toString()
    configClone.amountStable = BigNumber(configClone.amountStable || '0')
      .minus(costBasisRemoved)
      .decimalPlaces(DECIMAL_DEFAULT, BigNumber.ROUND_DOWN)
      .toString()

    const DCARecord = {
      isSell: true,
      infoSwap: {
        from: config.tokenInput,
        to: 'USD',
        amountIn: BigNumber(amountTokenToSell).decimalPlaces(tokenDecimals, BigNumber.ROUND_DOWN).toNumber(),
        amountOut: BigNumber(amountRealEstimate).decimalPlaces(DECIMAL_DEFAULT, BigNumber.ROUND_DOWN).toNumber(), // Số USD thực nhận sau trượt giá và phí
      },
    }

    return { config: configClone, DCARecord }
  }
}

export default DcaHelper
