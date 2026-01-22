import { BigNumber } from 'bignumber.js'

import { DcaTokenConfig, History } from '@/app/dca-v3/type'

const cloneData = (data: any) => {
  return JSON.parse(JSON.stringify(data))
}

class DcaUtil {
  static calculateTradingV2(item: History, config: DcaTokenConfig): { item: History; config: DcaTokenConfig } {
    try {
      let configClone = cloneData(config) as DcaTokenConfig
      let DCARecord = cloneData(item) as History
      let isFirstTrade = false
      const token = item.arrToken.find((i) => i.tokenSymbol === configClone.tokenInput)!

      const priceToken = token.price.toString()

      if (BigNumber(priceToken).lt(configClone.maxPrice)) {
        const priceAvg = this.calculatePriceAvg(configClone.amountUSDToBuy || '0', configClone.amountETHToBuy || '0')
        const priceRatio = this.calculateBuyPriceRatio(priceToken, config.minPrice, config.maxPrice)
        const buyAmountUSD = this.calculateBuyAmountUSD(priceRatio, config.stepSize)
        const buyAmountETH = this.calculateBuyAmountETH(buyAmountUSD, priceToken, configClone.slippageTolerance)
        const priceHistoryRatio = this.calculatePriceHistoryRatio(priceToken, configClone.priceBuyHistory)

        if (BigNumber(buyAmountUSD).gt((config.initialCapital as string) || '0')) {
          return {
            item: DCARecord,
            config: configClone,
          }
        }

        if (BigNumber(configClone?.priceBuyHistory || '0').eq(0)) {
          isFirstTrade = true
        }

        if (isFirstTrade) {
          const { DCARecord: DCARecordFinal, config: configCloneFinal } = this.updateDataToBuy(priceToken, configClone, buyAmountUSD, buyAmountETH)

          configClone = configCloneFinal
          DCARecord = { ...DCARecord, ...DCARecordFinal }
        } else {
          // trường hợp không phải là giao dịch đầu tiên
          //tỷ lệ giá hiện tại > tỷ lệ giá thay đổi
          if (BigNumber(priceHistoryRatio).gt(BigNumber(configClone.ratioPriceChange).dividedBy(100))) {
            // giá hiện tại < giá lịch sửa và tỷ lệ giá hiện tại > tỷ lệ giá  thay đổi
            if (BigNumber(priceToken).lt(configClone.priceBuyHistory)) {
              const { DCARecord: DCARecordFinal, config: configCloneFinal } = this.updateDataToBuy(
                priceToken,
                configClone,
                buyAmountUSD,
                buyAmountETH
              )

              configClone = configCloneFinal
              DCARecord = { ...DCARecord, ...DCARecordFinal }
            } else {
              // giá hiện tại > giá lịch sử
              if (BigNumber(priceToken).gt(configClone.priceBuyHistory)) {
                const priceRateWithAvg = this.calculatePriceRateWithAvg(priceToken, priceAvg)

                // giá hiện tại > giá trung bình đã mua và tỷ lệ giá hiện tại > tỷ lệ giá thay đổi
                if (BigNumber(priceAvg).gt(priceToken) && BigNumber(priceRateWithAvg).gt(BigNumber(configClone.ratioPriceChange).dividedBy(100))) {
                  const { DCARecord: DCARecordFinal, config: configCloneFinal } = this.updateDataToBuy(
                    priceToken,
                    configClone,
                    buyAmountUSD,
                    buyAmountETH
                  )

                  configClone = configCloneFinal
                  DCARecord = { ...DCARecord, ...DCARecordFinal }
                }

                // giá hiện tại < giá trung bình đã mua và tỷ lệ giá hiện tại > tỷ lệ giá thay đổi
                if (
                  BigNumber(configClone.amountUSDToBuy || '0').gt(BigNumber(configClone.stepSize)) &&
                  BigNumber(priceAvg || '0').gt(0) &&
                  BigNumber(configClone.amountETHToBuy || '0').gt(0) &&
                  BigNumber(priceToken).gt(priceAvg) &&
                  BigNumber(priceRateWithAvg).gt(BigNumber(configClone.ratioPriceChange).dividedBy(100))
                ) {
                  const priceRateSell = this.calculateSellPriceRatio(priceToken, config.minPrice, config.maxPrice)
                  const sellAmountUSDBefore = this.calculateSellBeforeAmountUSD(priceRateSell, config.stepSize)
                  let sellAmountETH = this.calculateSellAmountETH(priceToken, priceRateSell, config.stepSize)

                  //  nếu bán nhiều hơn số đã mua thì bán bằng số đã mua
                  if (BigNumber(sellAmountETH).gt(configClone.amountETHToBuy)) {
                    sellAmountETH = configClone.amountETHToBuy
                  }

                  const sellAmountUSDAfter = this.calculateSellAfterAmountUSD(sellAmountUSDBefore, config.slippageTolerance)

                  configClone.initialCapital = BigNumber(configClone.initialCapital as string)
                    .plus(sellAmountUSDAfter)
                    .toString()
                  configClone.amountETHToBuy = BigNumber(configClone.amountETHToBuy || '0')
                    .minus(sellAmountETH)
                    .toString()
                  configClone.amountUSDToBuy = BigNumber(configClone.amountUSDToBuy || '0')
                    .minus(sellAmountUSDAfter)
                    .toString()
                  configClone.priceBuyHistory = priceToken

                  DCARecord.isSell = true
                }
              }
            }
          }
        }
        configClone.priceBuyHistory = priceToken
      }

      return {
        item: DCARecord,
        config: configClone,
      }
    } catch (error) {
      return {
        item,
        config,
      }
    }
  }

  /**
   * Tính  cập nhật dữ liệu sau khi mua
   * @param  priceToken - Giá token hiện tại
   * @param config - Cấu hình DCA của user
   * @param buyAmountUSD - Số đô đã mua
   * @param buyAmountETH - Số ETH đã mua
   */
  static updateDataToBuy(priceToken: string, config: DcaTokenConfig, buyAmountUSD: string, buyAmountETH: string) {
    const configClone = cloneData(config) as DcaTokenConfig

    configClone.initialCapital = BigNumber(configClone.initialCapital as string)
      .minus(buyAmountUSD)
      .toString()
    configClone.amountETHToBuy = BigNumber(configClone.amountETHToBuy || '0')
      .plus(buyAmountETH)
      .toString()
    configClone.amountUSDToBuy = BigNumber(configClone.amountUSDToBuy || '0')
      .plus(buyAmountUSD)
      .toString()

    const DCARecord = {
      isBuy: true,
      infoSwap: {
        from: 'USD',
        to: 'ETH',
        amountIn: Number(buyAmountUSD),
        amountOut: Number(buyAmountETH),
      },
    }

    return { config: configClone, DCARecord }
  }

  /**
   * Tính  cập nhật dữ liệu sau khi mua
   * @param  priceToken - Giá token hiện tại
   * @param config - Cấu hình DCA của user
   * @param buyAmountUSD - Số đô đã mua
   * @param buyAmountETH - Số ETH đã mua
   */
  static updateDataToSell(priceToken: string, config: DcaTokenConfig, buyAmountUSD: string, buyAmountETH: string) {
    const configClone = cloneData(config) as DcaTokenConfig

    configClone.initialCapital = BigNumber(configClone.initialCapital as string)
      .minus(buyAmountUSD)
      .toString()
    configClone.amountETHToBuy = BigNumber(configClone.amountETHToBuy || '0')
      .plus(buyAmountETH)
      .toString()
    configClone.amountUSDToBuy = BigNumber(configClone.amountUSDToBuy || '0')
      .plus(buyAmountUSD)
      .toString()

    return configClone
  }

  /**
   * Tính %  tỷ giá so với giá trung bình đã mua
   * @param price - Giá token hiện tại
   * @param priceAvg -  Giá trung bình đã mua
   */
  static calculatePriceRateWithAvg(price: string, priceAvg: string): string {
    return BigNumber(BigNumber(priceAvg).minus(price).abs()).dividedBy(priceAvg).toString()
  }

  /**
   * Tính % tỷ giá so với min và max để MUA :  amount / price
   * @param price - Giá token hiện tại
   * @param amount - Số đô đã dùng để mua
   */
  static calculatePriceAvg(price: string, amount: string): string {
    try {
      return BigNumber(price).dividedBy(amount).toString()
    } catch (error) {
      return '0'
    }
  }

  /**
   * Tính % tỷ giá so với min và max để MUA
   * Công thức: 1 - (price - min) / (max - min)
   * Giá càng thấp (gần min) → % càng cao
   */
  static calculateBuyPriceRatio(price: string, minPrice: string, maxPrice: string): string {
    return BigNumber(1)
      .minus(BigNumber(BigNumber(price).minus(minPrice)).dividedBy(BigNumber(maxPrice).minus(minPrice)))
      .toString()
  }

  /**
   * Tính %  tỷ giá so với giá lich sử
   * @param price - Giá token hiện tại
   * @param priceHistory -  Giá lịch sử
   */
  static calculatePriceHistoryRatio(price: string, priceHistory: string): string {
    return BigNumber(1)
      .minus(BigNumber(BigNumber(price).minus(priceHistory)).dividedBy(priceHistory))
      .abs()
      .toString()
  }

  /**
   * Tính % tỷ giá so với min và max để BÁN
   * Công thức: (price - min) / (max - min)
   * Giá càng cao (gần max) → % càng cao
   */
  static calculateSellPriceRatio(price: string, minPrice: string, maxPrice: string): string {
    return BigNumber(BigNumber(price).minus(minPrice)).dividedBy(BigNumber(maxPrice).minus(minPrice)).toString()
  }

  /**
   * Tính số USD cần mua dựa trên % tỷ giá
   * @param priceRatio - % tỷ giá từ hàm calculateBuyPriceRatio
   * @param baseAmount - Số đô cố định (mặc định 100 USD)
   */
  static calculateBuyAmountUSD(priceRatio: string, baseAmount: string = '100'): string {
    return BigNumber(priceRatio).multipliedBy(baseAmount).toString()
  }

  static calculateBuyAmountETH(amountUSD: string, priceToken: string, slippage: number = 0): string {
    const amountETH = BigNumber(amountUSD).dividedBy(priceToken).toFixed()
    const rate = BigNumber(1).minus(BigNumber(slippage).dividedBy(100)).toString()

    return BigNumber(amountETH).multipliedBy(rate).toFixed()
  }

  /**
   * Tính số USD cần mua dựa trên % tỷ giá
   * @param priceToken - Giá token hiện tại
   * @param priceRatio - % tỷ giá từ hàm calculateBuyPriceRatio
   * @param baseAmount - Số đô cố định (mặc định 100 USD)
   */
  static calculateSellBeforeAmountUSD(rate: string, baseAmount: string = '100'): string {
    return BigNumber(rate).multipliedBy(baseAmount).toString()
  }

  static calculateSellAfterAmountUSD(amount: string, slippage = 0): string {
    return BigNumber(amount)
      .multipliedBy(BigNumber(1).minus(BigNumber(slippage).dividedBy(100)))
      .toString()
  }

  /**
   * Tính số USD cần mua dựa trên % tỷ giá
   * @param priceToken - Giá token hiện tại
   * @param priceRatio - % tỷ giá từ hàm calculateBuyPriceRatio
   * @param baseAmount - Số đô cố định (mặc định 100 USD)
   */
  static calculateSellAmountETH(priceToken: string, priceRatio: string, baseAmount: string = '100'): string {
    return BigNumber(priceRatio).multipliedBy(baseAmount).dividedBy(priceToken).toString()
  }
}
export default DcaUtil
