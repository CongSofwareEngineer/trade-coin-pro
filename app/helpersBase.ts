import { BigNumber } from 'bignumber.js'

import { RebalanceConfig, RebalanceResult, RebalanceState, Version } from './type'

import { PoolToken, Token } from '@/types/app'
import { cloneData } from '@/utils/functions'

/**
 * Logic rebalance dùng chung cho mọi version.
 * Phần khác nhau giữa các version nằm ở các hook: initFirstToken / initToken /
 * beforeCheckSwap / onSwapExtra / afterCheckSwap / formatPrice.
 */
abstract class RebalanceHelper {
  abstract readonly version: Version

  protected config: RebalanceConfig
  protected arrData: PoolToken[] = []
  protected state: RebalanceState

  constructor(config: RebalanceConfig) {
    this.config = config
    this.state = this.getStateDefault()
  }

  // ================== Public API ==================

  //v5 override: cộng offset vào giá khi đọc file
  formatPrice(price: number) {
    return price
  }

  run(arrDataBase: PoolToken[]): RebalanceResult {
    this.arrData = cloneData(arrDataBase)
    this.state = this.getStateDefault()

    this.initData()
    this.calculateData()

    return {
      arrData: this.arrData,
      arrSwap: this.arrData.filter((e) => e.isSwap),
      state: this.state,
    }
  }

  getState() {
    return cloneData(this.state)
  }

  // ================== State ==================

  protected getStateDefault(): RebalanceState {
    const outputStart = this.config.outputStart.toLocaleUpperCase().trim()

    return {
      amountInput: String(this.config.amountStart),
      outputSwap: outputStart,
      outputSwapTemp: outputStart,
      ETHLastSwap: {},
      ETHLastSwapTemp: {},
      perETHOriginal: {},
      ETHOriginalAmount: '0',
      price1Point: {},
    }
  }

  protected log(...args: any[]) {
    console.log(`[${this.version}]`, ...args)
  }

  // ================== Init data ==================

  protected initData() {
    for (let index = 0; index < this.arrData.length; index++) {
      try {
        const poolToken = this.arrData[index]
        const tokenETH = poolToken.arrToken!.find((e) => {
          return e.symbol === 'ETH'
        })!

        if (index === 0) {
          this.initFirstItem(poolToken, tokenETH)
        } else {
          this.initItem(poolToken, this.arrData[index - 1], tokenETH)
        }
      } catch (error) {
        console.log({ errorIndexInitData: index, error })

        return
      }
    }
  }

  protected initFirstItem(poolToken: PoolToken, tokenETH: Token) {
    const isETH = this.config.outputStart === 'ETH'

    poolToken.arrToken!.forEach((token, index) => {
      if (token.symbol === 'ETH') {
        token.perETH = '1'
        token.perETHChangePercentage = '0'
      } else {
        token.perETH = BigNumber(token!.price!).dividedBy(tokenETH!.price!).toFixed()
        token.perETHChangePercentage = '0'
      }

      this.state.ETHLastSwap[token.symbol!] = token.perETH!
      this.state.ETHLastSwapTemp[token.symbol!] = token.perETH!
      this.state.perETHOriginal[token.symbol!] = token.perETH!

      if (token.symbol === this.config.outputStart) {
        this.state.ETHOriginalAmount = isETH
          ? String(this.config.amountStart)
          : BigNumber(this.config.amountStart).multipliedBy(token!.price!).dividedBy(tokenETH!.price!).toFixed()
      }

      this.initFirstToken(token)
      poolToken.arrToken![index] = token
    })
  }

  protected initItem(poolToken: PoolToken, poolTokenPre: PoolToken, tokenETH: Token) {
    poolToken.arrToken!.forEach((token, index) => {
      const tokenPre = poolTokenPre.arrToken![index]

      if (token.symbol === 'ETH') {
        token.perETH = '1'
        token.perETHChangePercentage = BigNumber(BigNumber(token!.price!).minus(tokenPre?.price!)).dividedBy(tokenPre!.price!).toFixed()
      } else {
        token.perETH = BigNumber(token!.price!).dividedBy(tokenETH!.price!).toFixed()
        token.perETHChangePercentage = BigNumber(BigNumber(token.perETH!).minus(tokenPre.perETH!)).dividedBy(tokenPre.perETH!).toFixed()
      }

      this.initToken(token, tokenPre)
      poolToken.arrToken![index] = token
    })
  }

  // ================== Swap ==================

  protected getTokenMinChangePercentage(poolToken: PoolToken): Token {
    const minChangePercentage = poolToken.arrToken!.reduce((min, token) => {
      return BigNumber(min).lt(token.perETHChangePercentage!) ? min : token.perETHChangePercentage!
    }, poolToken.arrToken![0].perETHChangePercentage!)

    const token = poolToken.arrToken!.find((token) => {
      return BigNumber(minChangePercentage).isEqualTo(token.perETHChangePercentage!)
    })!

    return token
  }

  protected calculateData() {
    for (let index = 1; index < this.arrData.length; index++) {
      try {
        this.arrData[index].isSwap = false
        this.checkToSwap(index)
      } catch (error) {
        console.log({ errorIndexcalculateData: index, error })

        return
      }
    }
  }

  protected checkToSwap(index: number) {
    const poolToken = this.arrData[index]
    const poolTokenPre = this.arrData[index - 1]
    const tokenOutput = this.getTokenMinChangePercentage(poolToken)
    const tokenETH = poolToken.arrToken!.find((e) => {
      return e.symbol === 'ETH'
    })
    const tokenBTC = poolToken.arrToken!.find((e) => {
      return e.symbol === 'BTC'
    })
    const tokenInput: Token = poolToken.arrToken!.find((e) => {
      return e.symbol === this.state.outputSwap
    })!
    const limitChangePercentage = BigNumber(BigNumber(this.config.volatilityPercentage).dividedBy(100)).multipliedBy(-1).toNumber()

    //v4: update pointBeforeCheck, pointAfterCheck before swap
    this.beforeCheckSwap(poolToken, poolTokenPre)

    if (this.state.outputSwapTemp !== tokenOutput.symbol && Number(tokenOutput.perETHChangePercentage!) < limitChangePercentage) {
      this.log(`=================== Item ${index + 1} ==================`)

      this.log('step 1')
      if (tokenOutput!.symbol === 'ETH') {
        this.log(`update ETHLastSwapTemp BTC = ${tokenBTC!.perETH}`)
        this.state.ETHLastSwapTemp[tokenBTC!.symbol!] = tokenBTC!.perETH!
      } else {
        this.log(`update ETHLastSwapTemp ${tokenOutput.symbol} = ${tokenOutput.perETH}`)
        this.state.ETHLastSwapTemp[tokenOutput.symbol!] = tokenOutput.perETH!
      }

      this.log(`update outputSwapTemp = ${tokenOutput.symbol}`)
      this.state.outputSwapTemp = tokenOutput.symbol!
      this.log({
        outputSwap: this.state.outputSwap,
        tokenOutput,
        tokenInput,
        amountInput: this.state.amountInput,
        ETHOriginalAmount: this.state.ETHOriginalAmount,
      })

      if (this.state.outputSwap !== tokenOutput.symbol && tokenInput.symbol !== tokenOutput.symbol) {
        //(SwapInputTokenAmount * SwapInputTokenPrice) / ETHPrice
        const amountOutCheck = BigNumber(this.state.amountInput!).multipliedBy(tokenInput?.price!).dividedBy(tokenETH?.price!).toFixed()

        //(SwapInputTokenAmount * (1 - AFFILIATE_FEE_PERENT))* SwapInputTokenPrice) / ETHPrice của giờ đó
        const amountAfterSwap = BigNumber(this.state.amountInput!)
          .multipliedBy(BigNumber(1).minus(BigNumber(this.config.affiliate).dividedBy(100)))
          .multipliedBy(tokenInput?.price!)
          .dividedBy(tokenOutput!.price!)
          .toFixed()

        this.log('step 2')
        this.log({ amountOutCheck, amountAfterSwap })

        if (tokenOutput?.symbol === 'ETH' || tokenOutput?.symbol === 'BTC') {
          this.log('step 3 so sánh perETH BTC vs ETHLastSwap BTC ')
          this.log({ ETHLastSwap: cloneData(this.state.ETHLastSwap), tokenBTC })

          if (BigNumber(tokenBTC?.perETH!).gt(this.state.ETHLastSwap[tokenBTC!.symbol!])) {
            this.log('step 4')
            this.log({ ETHLastSwapTemp: cloneData(this.state.ETHLastSwapTemp), perETHOriginal: cloneData(this.state.perETHOriginal), tokenOutput })
            this.log(' so sánh amount vs ETHOriginalAmount')

            //(SwapInputTokenAmount * SwapInputTokenPrice)/ ETHPrice của giờ đó => đem so sánh với ETHOriginalAmount
            if (BigNumber(amountOutCheck).gte(this.state.ETHOriginalAmount)) {
              this.log('step 4.1')
              this.log('so sánh perETH BTC vs perETHOriginal BTC')

              if (BigNumber(tokenBTC?.perETH!).gte(this.state.perETHOriginal[tokenBTC!.symbol!])) {
                this.onSwap(poolToken, tokenOutput, amountAfterSwap)
              }
            }
          }

          this.log(`update ETHLastSwap ${tokenBTC!.symbol} = ${this.state.ETHLastSwapTemp[tokenBTC!.symbol!]}`)
          this.state.ETHLastSwap[tokenBTC!.symbol!] = this.state.ETHLastSwapTemp[tokenBTC!.symbol!]
        } else {
          this.log('step 5 token other')
          this.log('so sánh perETH token vs ETHLastSwap token')
          this.log({ ETHLastSwap: cloneData(this.state.ETHLastSwap), tokenOutput })

          if (BigNumber(tokenOutput?.perETH!).gte(this.state.ETHLastSwap[tokenOutput?.symbol!]!)) {
            this.log('step 6')
            this.log({ ETHLastSwapTemp: cloneData(this.state.ETHLastSwapTemp), perETHOriginal: cloneData(this.state.perETHOriginal), tokenOutput })
            this.log(' so sánh amount vs ETHOriginalAmount')

            //(SwapInputTokenAmount * SwapInputTokenPrice)/ ETHPrice của giờ đó => đem so sánh với ETHOriginalAmount
            if (BigNumber(amountOutCheck).gte(this.state.ETHOriginalAmount)) {
              this.log('step 6.1')
              this.log('so sánh perETH token vs perETHOriginal token')

              if (BigNumber(tokenOutput!.perETH!).gte(this.state.perETHOriginal[tokenOutput!.symbol!])) {
                this.onSwap(poolToken, tokenOutput, amountAfterSwap)
              }
            }
          }

          this.log(`update ETHLastSwap ${tokenOutput!.symbol} = ${this.state.ETHLastSwapTemp[tokenOutput!.symbol!]}`)
          this.state.ETHLastSwap[tokenOutput!.symbol!] = this.state.ETHLastSwapTemp[tokenOutput!.symbol!]
        }
      }
    }

    //v4: reset perETHOriginal theo point
    this.afterCheckSwap(poolToken, poolTokenPre, tokenInput)
  }

  protected onSwap(poolToken: PoolToken, tokenOutput: Token, amountAfterSwap: string) {
    this.onSwapExtra(poolToken, tokenOutput)

    this.state.amountInput = amountAfterSwap
    this.state.outputSwap = tokenOutput.symbol!

    poolToken.isSwap = true
    poolToken[`est_${tokenOutput.symbol!}`] = amountAfterSwap
    poolToken.outputSwap = tokenOutput.symbol!
  }

  // ================== Hooks cho từng version ==================

  protected initFirstToken(_token: Token) {}

  protected initToken(_token: Token, _tokenPre: Token) {}

  protected beforeCheckSwap(_poolToken: PoolToken, _poolTokenPre: PoolToken) {}

  protected onSwapExtra(_poolToken: PoolToken, _tokenOutput: Token) {}

  protected afterCheckSwap(_poolToken: PoolToken, _poolTokenPre: PoolToken, _tokenInput: Token) {}
}

export default RebalanceHelper
