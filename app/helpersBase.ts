import { BigNumber } from 'bignumber.js'

import { RebalanceConfig, RebalanceResult, RebalanceState, Version } from './type'

import { PoolToken, Token } from '@/types/app'
import { cloneData, isSameSymbol, isSymbolETHOrBTC, uppercase } from '@/utils/functions'

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
    this.normalizeSymbol()
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

  // ================== Symbol ==================

  //đồng nhất mọi symbol token về uppercase ngay khi nhận data
  protected normalizeSymbol() {
    this.arrData.forEach((poolToken) => {
      poolToken.arrToken?.forEach((token) => {
        token.symbol = uppercase(token.symbol)
      })
    })
  }

  // ================== State ==================

  protected getStateDefault(): RebalanceState {
    const inputStart = uppercase(this.config.inputStart)

    return {
      amountInput: String(this.config.amountStart),
      outputSwap: inputStart,
      outputSwapTemp: inputStart,
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
          return isSymbolETHOrBTC(e.symbol, 'eth')
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
    const inputStart = uppercase(this.config.inputStart)
    const isETH = isSymbolETHOrBTC(inputStart, 'eth')

    poolToken.arrToken!.forEach((token, index) => {
      const symbol = uppercase(token.symbol)

      if (isSymbolETHOrBTC(symbol, 'eth')) {
        token.perETH = '1'
        token.perETHChangePercentage = '0'
      } else {
        token.perETH = BigNumber(token!.price!).dividedBy(tokenETH!.price!).toFixed()
        token.perETHChangePercentage = '0'
      }

      this.state.ETHLastSwap[symbol] = token.perETH!
      this.state.ETHLastSwapTemp[symbol] = token.perETH!
      this.state.perETHOriginal[symbol] = token.perETH!

      if (isSameSymbol(symbol, inputStart)) {
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

      if (isSymbolETHOrBTC(token.symbol, 'eth')) {
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
      return isSymbolETHOrBTC(e.symbol, 'eth')
    })
    const tokenBTC = poolToken.arrToken!.find((e) => {
      return isSymbolETHOrBTC(e.symbol, 'btc')
    })
    const tokenInput: Token = poolToken.arrToken!.find((e) => {
      return isSameSymbol(e.symbol, this.state.outputSwap)
    })!
    const symbolOutput = uppercase(tokenOutput.symbol)
    const symbolInput = uppercase(tokenInput?.symbol)
    const symbolBTC = uppercase(tokenBTC?.symbol)

    const limitChangePercentage = BigNumber(BigNumber(this.config.volatilityPercentage).dividedBy(100)).multipliedBy(-1).toNumber()

    //v4: update pointBeforeCheck, pointAfterCheck before swap
    this.beforeCheckSwap(poolToken, poolTokenPre)

    if (this.state.outputSwapTemp !== symbolOutput && Number(tokenOutput.perETHChangePercentage!) < limitChangePercentage) {
      this.log(`=================== Item ${index + 1} ==================`)

      this.log('step 1')
      if (isSymbolETHOrBTC(symbolOutput, 'eth')) {
        this.log(`update ETHLastSwapTemp BTC = ${tokenBTC!.perETH}`)
        this.state.ETHLastSwapTemp[symbolBTC] = tokenBTC!.perETH!
      } else {
        this.log(`update ETHLastSwapTemp ${symbolOutput} = ${tokenOutput.perETH}`)
        this.state.ETHLastSwapTemp[symbolOutput] = tokenOutput.perETH!
      }

      this.log(`update outputSwapTemp = ${symbolOutput}`)
      this.state.outputSwapTemp = symbolOutput
      this.log({
        outputSwap: this.state.outputSwap,
        tokenOutput,
        tokenInput,
        amountInput: this.state.amountInput,
        ETHOriginalAmount: this.state.ETHOriginalAmount,
      })

      if (this.state.outputSwap !== symbolOutput && symbolInput !== symbolOutput) {
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

        if (isSymbolETHOrBTC(symbolOutput, 'eth') || isSymbolETHOrBTC(symbolOutput, 'btc')) {
          this.log('step 3 so sánh perETH BTC vs ETHLastSwap BTC ')
          this.log({ ETHLastSwap: cloneData(this.state.ETHLastSwap), tokenBTC })

          if (BigNumber(tokenBTC?.perETH!).gt(this.state.ETHLastSwap[symbolBTC])) {
            this.log('step 4')
            this.log({ ETHLastSwapTemp: cloneData(this.state.ETHLastSwapTemp), perETHOriginal: cloneData(this.state.perETHOriginal), tokenOutput })
            this.log(' so sánh amount vs ETHOriginalAmount')

            //(SwapInputTokenAmount * SwapInputTokenPrice)/ ETHPrice của giờ đó => đem so sánh với ETHOriginalAmount
            if (BigNumber(amountOutCheck).gte(this.state.ETHOriginalAmount)) {
              this.log('step 4.1')
              this.log('so sánh perETH BTC vs perETHOriginal BTC')

              if (BigNumber(tokenBTC?.perETH!).gte(this.state.perETHOriginal[symbolBTC])) {
                this.onSwap(poolToken, tokenOutput, amountAfterSwap)
              }
            }
          }

          this.log(`update ETHLastSwap ${symbolBTC} = ${this.state.ETHLastSwapTemp[symbolBTC]}`)
          this.state.ETHLastSwap[symbolBTC] = this.state.ETHLastSwapTemp[symbolBTC]
        } else {
          this.log('step 5 token other')
          this.log('so sánh perETH token vs ETHLastSwap token')
          this.log({ ETHLastSwap: cloneData(this.state.ETHLastSwap), tokenOutput })

          if (BigNumber(tokenOutput?.perETH!).gte(this.state.ETHLastSwap[symbolOutput]!)) {
            this.log('step 6')
            this.log({ ETHLastSwapTemp: cloneData(this.state.ETHLastSwapTemp), perETHOriginal: cloneData(this.state.perETHOriginal), tokenOutput })
            this.log(' so sánh amount vs ETHOriginalAmount')

            //(SwapInputTokenAmount * SwapInputTokenPrice)/ ETHPrice của giờ đó => đem so sánh với ETHOriginalAmount
            if (BigNumber(amountOutCheck).gte(this.state.ETHOriginalAmount)) {
              this.log('step 6.1')
              this.log('so sánh perETH token vs perETHOriginal token')

              if (BigNumber(tokenOutput!.perETH!).gte(this.state.perETHOriginal[symbolOutput])) {
                this.onSwap(poolToken, tokenOutput, amountAfterSwap)
              }
            }
          }

          this.log(`update ETHLastSwap ${symbolOutput} = ${this.state.ETHLastSwapTemp[symbolOutput]}`)
          this.state.ETHLastSwap[symbolOutput] = this.state.ETHLastSwapTemp[symbolOutput]
        }
      }
    }

    //v4: reset perETHOriginal theo point
    this.afterCheckSwap(poolToken, poolTokenPre, tokenInput)
  }

  protected onSwap(poolToken: PoolToken, tokenOutput: Token, amountAfterSwap: string) {
    this.onSwapExtra(poolToken, tokenOutput)

    const symbolOutput = uppercase(tokenOutput.symbol)
    const symbolInput = this.state.outputSwap

    this.state.amountInput = amountAfterSwap
    this.state.outputSwap = symbolOutput

    poolToken.isSwap = true
    poolToken[`est_${symbolOutput}`] = amountAfterSwap
    poolToken.inputSwap = symbolInput
    poolToken.outputSwap = symbolOutput
  }

  // ================== Hooks cho từng version ==================

  protected initFirstToken(_token: Token) {}

  protected initToken(_token: Token, _tokenPre: Token) {}

  protected beforeCheckSwap(_poolToken: PoolToken, _poolTokenPre: PoolToken) {}

  protected onSwapExtra(_poolToken: PoolToken, _tokenOutput: Token) {}

  protected afterCheckSwap(_poolToken: PoolToken, _poolTokenPre: PoolToken, _tokenInput: Token) {}
}

export default RebalanceHelper
