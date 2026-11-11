import { BigNumber } from 'bignumber.js'

import { Version } from './type'
import RebalanceHelper from './helpersBase'

import { PoolToken, Token } from '@/types/app'
import { uppercase } from '@/utils/functions'

/**
 * v4 = v1 + hệ thống point:
 * - price1Point = price đầu kỳ / 1000, changeByPoint = biến động giá quy ra point
 * - pointBeforeCheck / pointAfterCheck cộng dồn theo từng nến
 * - swap xong: token output về 1000, token khác đang < 1000 kéo lên 1000
 * - perETHOriginal được reset khi có >= 2 token vượt resetPoint
 */
class RebalanceV4 extends RebalanceHelper {
  readonly version: Version = 'v4'

  protected initFirstToken(token: Token) {
    token.changeByPoint = '0'
    token.pointAfterCheck = '1000'
    token.pointBeforeCheck = '1000'

    this.state.price1Point[uppercase(token.symbol)] = BigNumber(token.price!).dividedBy(1000).toFixed()
  }

  protected initToken(token: Token, tokenPre: Token) {
    const price1Point = this.state.price1Point[uppercase(token.symbol)]

    // ・ETHChangeByPoint: bằng (ETHPrice giờ đó / ETHPrice1Point) -  (ETHPrice giờ trước đó / ETHPrice1Point)
    token.changeByPoint = BigNumber(BigNumber(token!.price!).dividedBy(price1Point))
      .minus(BigNumber(tokenPre!.price!).dividedBy(price1Point))
      .toFixed()
  }

  protected beforeCheckSwap(poolToken: PoolToken, poolTokenPre: PoolToken) {
    poolToken.arrToken = this.updatePointBeforeCheck(poolToken.arrToken, poolTokenPre.arrToken)
    poolToken.arrToken = this.updatePointAfterCheckBeforeSwap(poolToken.arrToken, poolTokenPre.arrToken)
  }

  protected onSwapExtra(poolToken: PoolToken, tokenOutput: Token) {
    poolToken.arrToken = this.updatePointAfterCheckInSwap(poolToken.arrToken, tokenOutput)
  }

  protected afterCheckSwap(poolToken: PoolToken, poolTokenPre: PoolToken, tokenInput: Token) {
    this.state.perETHOriginal = this.updatePerETHOriginal(poolToken.arrToken, poolTokenPre.arrToken, tokenInput)
  }

  // ================== Point ==================

  protected updatePointBeforeCheck(arrToken: PoolToken['arrToken'] = [], arrTokenPre: PoolToken['arrToken'] = []) {
    arrToken.forEach((token, index) => {
      const tokenPre = arrTokenPre[index]

      token.pointBeforeCheck = BigNumber(tokenPre.pointAfterCheck!).plus(token.changeByPoint!).toFixed()
      arrToken[index] = token
    })

    return arrToken
  }

  protected updatePointAfterCheckBeforeSwap(arrToken: PoolToken['arrToken'] = [], arrTokenPre: PoolToken['arrToken'] = []) {
    arrToken.forEach((token, index) => {
      const tokenPre = arrTokenPre[index]

      token.pointAfterCheck = BigNumber(tokenPre.pointAfterCheck!).plus(token.changeByPoint!).toFixed()
      arrToken[index] = token
    })

    return arrToken
  }

  protected updatePointAfterCheckInSwap(arrToken: PoolToken['arrToken'] = [], tokenOutput: Token) {
    const symbolOutput = uppercase(tokenOutput.symbol)

    arrToken.forEach((token, index) => {
      if (symbolOutput === uppercase(token.symbol)) {
        token.pointAfterCheck = '1000'
      }
      arrToken[index] = token
    })

    arrToken.forEach((token, index) => {
      if (symbolOutput !== uppercase(token.symbol)) {
        if (BigNumber(token.pointAfterCheck!).isLessThan(1000)) {
          token.pointAfterCheck = '1000'
        }
      }
      arrToken[index] = token
    })

    return arrToken
  }

  protected updatePerETHOriginal(arrToken: PoolToken['arrToken'] = [], arrTokenPre: PoolToken['arrToken'] = [], tokenInput: Token) {
    const perETHOriginal = this.state.perETHOriginal
    const resetPoint = BigNumber(1000).plus(BigNumber(1000).multipliedBy(this.config.volatilityPercentage).dividedBy(100).multipliedBy(10)).toFixed() //2000 + 30% = 2600

    const symbolInput = uppercase(tokenInput?.symbol)

    let currentAmountMoreThanRest = 0
    let preAmountMoreThanRest = 0
    let isChangeETHAndBTC = false

    arrTokenPre.forEach((token) => {
      if (BigNumber(token.pointAfterCheck!).isGreaterThan(resetPoint)) {
        preAmountMoreThanRest++
      }
    })

    arrToken.forEach((token) => {
      if (BigNumber(token.pointAfterCheck!).isGreaterThan(resetPoint)) {
        currentAmountMoreThanRest++
      }
    })

    if (currentAmountMoreThanRest >= 2 && preAmountMoreThanRest <= 1) {
      arrToken.forEach((token) => {
        const symbol = uppercase(token.symbol)

        if (symbol === 'ETH' || symbol === 'BTC') {
          if (symbolInput !== symbol) {
            isChangeETHAndBTC = true
          }
        } else {
          if (symbolInput !== symbol) {
            perETHOriginal[symbol] = token.perETH!
          }
        }
      })
    }

    if (isChangeETHAndBTC) {
      arrToken.forEach((token) => {
        const symbol = uppercase(token.symbol)

        if (symbol === 'ETH' || symbol === 'BTC') {
          perETHOriginal[symbol] = token.perETH!
        }
      })
    }

    return perETHOriginal
  }
}

export default RebalanceV4
