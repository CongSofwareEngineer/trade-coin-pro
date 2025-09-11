// ================== Types & Config ==================
import { BigNumber } from 'bignumber.js'

import { DATA_FAKE } from './dataDake'

type TokenSymbol = string

interface Token {
  symbol?: TokenSymbol
  price?: number
  perETH?: string
  perETHChangePercentage?: string
}

interface SwapState {
  [key: string]: string
}

interface Item {
  time: string
  arrToken: Token[]
  isSwap?: boolean
}

interface UserConfig {
  volatilityPercentage: string
  affiliate: string
  amountInput: string
  amountMaxReceived: string
  inputStart?: TokenSymbol
}

interface ConfigTemp {
  amountInput: string
  outputSwap: TokenSymbol
  outputSwapTemp: TokenSymbol
  ETHLastSwap: SwapState
  ETHLastSwapTemp: SwapState
  perETHOriginal: SwapState
}

// ================== Utility Functions ==================
export const deepClone = <T>(obj: T): T => JSON.parse(JSON.stringify(obj))

function getTokenInput(outputSwap: TokenSymbol, arrToken: Token[]): Token | undefined {
  return arrToken.find((token) => token.symbol === outputSwap)
}

function getTokenOut(arrToken: Token[]): Token {
  const minChange = arrToken.reduce((min, token) => {
    return BigNumber(min).lt(token.perETHChangePercentage!) ? min : token.perETHChangePercentage!
  }, arrToken[0].perETHChangePercentage!)

  return arrToken.find((token) => BigNumber(minChange).isEqualTo(token.perETHChangePercentage!))!
}

// ================== Swap Logic ==================
function checkValidSwap({ item, userConfig, configTemp }: { item: Item; userConfig: UserConfig; configTemp: ConfigTemp }): {
  isSwap: boolean
  isStopAll: boolean
  amountInput: string
  outputSwap: TokenSymbol
  outputSwapTemp: TokenSymbol
  ETHLastSwap: SwapState
  ETHLastSwapTemp: SwapState
} {
  let isSwap = false
  let isStopAll = false
  let amountInput = configTemp.amountInput
  let ETHLastSwap = deepClone(configTemp.ETHLastSwap)
  let ETHLastSwapTemp = deepClone(configTemp.ETHLastSwapTemp)
  let perETHOriginal = deepClone(configTemp.perETHOriginal)
  let outputSwap = configTemp.outputSwap
  let outputSwapTemp = configTemp.outputSwapTemp

  const tokenOutput = getTokenOut(item.arrToken)
  const tokenInput = getTokenInput(outputSwap, item.arrToken)
  const tokenBTC = item.arrToken.find((t) => t.symbol === 'BTC')
  const tokenETH = item.arrToken.find((t) => t.symbol === 'ETH')

  const volatilityThreshold = BigNumber(userConfig.volatilityPercentage).dividedBy(100).multipliedBy(-1).toNumber()

  if (outputSwapTemp !== tokenOutput.symbol && Number(tokenOutput.perETHChangePercentage!) < volatilityThreshold) {
    if (tokenOutput.symbol === 'ETH' && tokenBTC) {
      ETHLastSwapTemp[tokenBTC.symbol!] = tokenBTC.perETH!
    } else {
      ETHLastSwapTemp[tokenOutput.symbol!] = tokenOutput.perETH!
    }
    outputSwapTemp = tokenOutput.symbol!
    if (outputSwap !== tokenOutput.symbol) {
      const amountOutCheck = BigNumber(amountInput).multipliedBy(tokenInput?.price!).dividedBy(tokenETH?.price!).toFixed()
      const amountOut = BigNumber(amountInput)
        .multipliedBy(BigNumber(1).minus(BigNumber(userConfig.affiliate).dividedBy(100)))
        .multipliedBy(tokenInput?.price!)
        .dividedBy(tokenOutput.price!)
        .toFixed()

      if (BigNumber(amountOut).gte(userConfig.amountMaxReceived)) {
        amountInput = amountOut
        isSwap = true
        isStopAll = true
      } else {
        if (tokenOutput.symbol === 'ETH' || tokenOutput.symbol === 'BTC') {
          if (tokenBTC && BigNumber(tokenBTC.perETH!).gt(ETHLastSwap[tokenBTC.symbol!])) {
            if (BigNumber(amountOutCheck).gte(userConfig.amountInput)) {
              if (BigNumber(ETHLastSwapTemp[tokenBTC.symbol!]).gte(perETHOriginal[tokenBTC.symbol!])) {
                amountInput = amountOut
                outputSwap = tokenOutput.symbol!
                isSwap = true
              }
            }
          }
          if (tokenInput) ETHLastSwap[tokenInput.symbol!] = ETHLastSwapTemp[tokenInput.symbol!]
          if (tokenBTC) ETHLastSwap[tokenBTC.symbol!] = ETHLastSwapTemp[tokenBTC.symbol!]
        } else {
          if (BigNumber(tokenOutput.perETH!).gt(ETHLastSwap[tokenOutput.symbol!])) {
            if (BigNumber(amountOutCheck).gte(userConfig.amountInput)) {
              if (BigNumber(ETHLastSwapTemp[tokenOutput.symbol!]).gte(perETHOriginal[tokenOutput.symbol!])) {
                amountInput = amountOut
                outputSwap = tokenOutput.symbol!
                isSwap = true
              }
            }
          }
          ETHLastSwap[tokenOutput.symbol!] = ETHLastSwapTemp[tokenOutput.symbol!]
        }
      }
    }
  }

  return {
    isSwap,
    isStopAll,
    amountInput,
    outputSwap,
    outputSwapTemp,
    ETHLastSwap,
    ETHLastSwapTemp,
  }
}

function formatData(listData: Item[], configTem: ConfigTemp) {
  const arrFormat = listData.map((item, index) => {
    const tokenETH = item.arrToken.find((e) => e.symbol === 'ETH')

    if (index > 0) {
      const prev = listData[index - 1]

      item.arrToken.forEach((token, idx) => {
        const tokenPre = prev.arrToken[idx]

        if (token.symbol === 'ETH') {
          token.perETHChangePercentage = BigNumber(token.price!).minus(tokenPre.price!).dividedBy(tokenPre.price!).toFixed()
          token.perETH = '1'
        } else {
          token.perETH = BigNumber(token.price!).dividedBy(tokenETH!.price!).toFixed()
          token.perETHChangePercentage = BigNumber(token.perETH!).minus(tokenPre.perETH!).dividedBy(tokenPre.perETH!).toFixed()
        }
        item.arrToken[idx] = token
      })
    } else {
      const tokenETH = item.arrToken.find((e) => e.symbol === 'ETH')

      item.arrToken.forEach((token, idx) => {
        if (token.symbol === 'ETH') {
          token.perETHChangePercentage = '0'
          token.perETH = '1'
        } else {
          token.perETH = BigNumber(token.price!).dividedBy(tokenETH!.price!).toFixed()
          token.perETHChangePercentage = '0'
        }
        configTem.ETHLastSwap[token.symbol!] = token.perETH!
        configTem.ETHLastSwapTemp[token.symbol!] = token.perETH!
        configTem.perETHOriginal[token.symbol!] = token.perETH!
        item.arrToken[idx] = token
      })
    }

    return item
  })

  return { arrFormat, configTem }
}

function callData(listDataBase: Item[], userConfig: UserConfig, configTemp: ConfigTemp) {
  const { arrFormat, configTem } = formatData(listDataBase, configTemp)
  const listData = arrFormat
  let configTempCurrent = deepClone(configTem)

  listData.forEach((item, index) => {
    const res = checkValidSwap({ item, userConfig, configTemp: deepClone(configTempCurrent) })

    configTempCurrent.ETHLastSwap = res.ETHLastSwap
    configTempCurrent.ETHLastSwapTemp = res.ETHLastSwapTemp
    configTempCurrent.amountInput = res.amountInput
    configTempCurrent.outputSwap = res.outputSwap
    configTempCurrent.outputSwapTemp = res.outputSwapTemp
    if (res.isSwap) {
      listData[index].isSwap = true
    }
  })
  // Trả về kết quả swap
  const arrSwap = listData.map((item, idx) => (item.isSwap ? idx + 1 : null)).filter(Boolean)

  return { amountSwap: arrSwap.length, arrSwap }
}

// ================== Default Config ==================
const userConfig: UserConfig = {
  volatilityPercentage: '0.3',
  affiliate: '0.1',
  amountInput: '1',
  amountMaxReceived: '2000000000000000',
  inputStart: 'ETH',
}

const configTemp: ConfigTemp = {
  amountInput: userConfig.amountInput,
  outputSwap: userConfig.inputStart!,
  outputSwapTemp: userConfig.inputStart!,
  ETHLastSwap: { ETH: '0', BTC: '0', BNB: '0' },
  ETHLastSwapTemp: { ETH: '0', BTC: '0', BNB: '0' },
  perETHOriginal: { ETH: '1', BTC: '0.05', BNB: '0.15' },
}

// ================== Run Swap ==================
const result = callData(DATA_FAKE, userConfig, configTemp)

console.log({ result })

// Bạn có thể xuất result ra UI hoặc log nếu cần
