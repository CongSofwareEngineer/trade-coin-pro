// ================== Types & Config ==================
import { BigNumber } from 'bignumber.js'

import { PoolToken } from './types/app'
import { DATA_V4 } from './DATA_V4'

type TokenSymbol = string

interface Token {
  symbol?: TokenSymbol
  price?: number
  perETH?: string
  perETHChangePercentage?: string
  changeByPoint?: string
  pointBeforeCheck?: string
  pointAfterCheck?: string
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
  originalAmount: string
  price1Point?: { [key: string]: string }
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

const updatePointBeforeCheck = (arrToken: PoolToken['arrToken'] = [], arrTokenPre: PoolToken['arrToken'] = []) => {
  arrToken.forEach((token, index) => {
    const tokenPre = arrTokenPre[index]

    token.pointBeforeCheck = BigNumber(tokenPre.pointAfterCheck!).plus(token.changeByPoint!).toFixed()
    arrToken[index] = token
  })

  return arrToken
}

const updatePointAfterCheckBeforeSwap = (arrToken: PoolToken['arrToken'] = [], arrTokenPre: PoolToken['arrToken'] = []) => {
  arrToken.forEach((token, index) => {
    const tokenPre = arrTokenPre[index]

    token.pointAfterCheck = BigNumber(tokenPre.pointAfterCheck!).plus(token.changeByPoint!).toFixed()

    arrToken[index] = token
  })

  return arrToken
}

const updatePointAfterCheckInSwap = (arrToken: PoolToken['arrToken'] = [], tokenOutput: Token) => {
  arrToken!.forEach((token, index) => {
    if (tokenOutput.symbol === token.symbol) {
      token.pointAfterCheck = '1000'
    }
    arrToken[index] = token
  })

  arrToken!.forEach((token, index) => {
    if (tokenOutput.symbol !== token.symbol) {
      if (BigNumber(token.pointAfterCheck!).isLessThan(1000)) {
        token.pointAfterCheck = '1000'
      }
    }
    arrToken[index] = token
  })

  return arrToken
}

const updatePerETHOriginal = (
  arrToken: PoolToken['arrToken'] = [],
  arrTokenPre: PoolToken['arrToken'] = [],
  tokenInput: Token,
  volatilityPercentage: string,
  perETHOriginal: SwapState
) => {
  let currentAmountMoreThanRest = 0
  let preAmountMoreThanRest = 0
  const resetPoint = BigNumber(1000).plus(BigNumber(1000).multipliedBy(volatilityPercentage).dividedBy(100).multipliedBy(10)).toFixed() //2000 + 30% = 2600

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
      if (token.symbol === 'ETH' || token.symbol === 'BTC') {
        if (token.symbol === 'BTC' && tokenInput.symbol !== token.symbol) {
          perETHOriginal[token.symbol!] = token.perETH!
        }
      } else {
        if (tokenInput.symbol !== token.symbol) {
          perETHOriginal[token.symbol!] = token.perETH!
        }
      }
    })
  }

  return perETHOriginal
}

// ================== Swap Logic ==================
function checkValidSwapV4({ item, itemPre, userConfig, configTemp }: { item: Item; itemPre: Item; userConfig: UserConfig; configTemp: ConfigTemp }) {
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

  //update pointBeforeCheck, pointAfterCheck before swap
  item.arrToken = updatePointBeforeCheck(item.arrToken, itemPre.arrToken)
  item.arrToken = updatePointAfterCheckBeforeSwap(item.arrToken, itemPre.arrToken)

  if (
    outputSwapTemp !== tokenOutput.symbol &&
    Number(tokenOutput.perETHChangePercentage!) < BigNumber(BigNumber(userConfig.volatilityPercentage).dividedBy(100)).multipliedBy(-1).toNumber()
  ) {
    if (tokenOutput!.symbol === 'ETH') {
      ETHLastSwapTemp[tokenBTC!.symbol!] = tokenBTC!.perETH!
    } else {
      ETHLastSwapTemp[tokenOutput.symbol!] = tokenOutput.perETH!
    }
    outputSwapTemp = tokenOutput.symbol!

    if (outputSwap !== tokenOutput.symbol && tokenInput!.symbol !== tokenOutput.symbol) {
      //(SwapInputTokenAmount * SwapInputTokenPrice) / ETHPrice
      const amountOutCheck = BigNumber(amountInput!).multipliedBy(tokenInput?.price!).dividedBy(tokenETH?.price!).toFixed()

      //(SwapInputTokenAmount * (1 - AFFILIATE_FEE_PERENT))* SwapInputTokenPrice) / ETHPrice của giờ đó
      const amountAfterSwap = BigNumber(amountInput!)
        .multipliedBy(BigNumber(1).minus(BigNumber(userConfig.affiliate).dividedBy(100)))
        .multipliedBy(tokenInput?.price!)
        .dividedBy(tokenOutput!.price!)
        .toFixed()

      if (tokenOutput?.symbol === 'ETH' || tokenOutput?.symbol === 'BTC') {
        if (BigNumber(tokenBTC?.perETH!).gt(ETHLastSwap[tokenBTC!.symbol!])) {
          //(SwapInputTokenAmount * SwapInputTokenPrice)/ ETHPrice của giờ đó => đem so sánh với ETHOriginalAmount
          if (BigNumber(amountOutCheck).gte(configTemp.originalAmount)) {
            if (BigNumber(tokenBTC?.perETH!).gte(perETHOriginal[tokenBTC!.symbol!])) {
              item.arrToken = updatePointAfterCheckInSwap(item.arrToken, tokenOutput)
              amountInput = amountAfterSwap
              outputSwap = tokenOutput?.symbol!
              isSwap = true
            }
          }
        }
        //update ETHLastSwapTemp BTC
        ETHLastSwap[tokenBTC!.symbol!] = ETHLastSwapTemp[tokenBTC!.symbol!]
      } else {
        if (BigNumber(tokenOutput?.perETH!).gte(ETHLastSwap[tokenOutput?.symbol!]!)) {
          //(SwapInputTokenAmount * SwapInputTokenPrice)/ ETHPrice của giờ đó => đem so sánh với ETHOriginalAmount
          if (BigNumber(amountOutCheck).gte(configTemp.originalAmount)) {
            if (BigNumber(tokenOutput!.perETH!).gte(perETHOriginal[tokenOutput!.symbol!])) {
              item.arrToken = updatePointAfterCheckInSwap(item.arrToken, tokenOutput)
              outputSwap = tokenOutput?.symbol!
              amountInput = amountAfterSwap
              isSwap = true
            }
          }
        }

        //update  ETHLastSwapTemp tokenOutput
        ETHLastSwap[tokenOutput!.symbol!] = ETHLastSwapTemp[tokenOutput!.symbol!]
      }
    }
  }
  perETHOriginal = updatePerETHOriginal(item.arrToken, itemPre.arrToken, tokenInput!, userConfig.volatilityPercentage, perETHOriginal)

  return {
    isSwap,
    isStopAll,
    amountInput,
    outputSwap,
    outputSwapTemp,
    ETHLastSwap,
    ETHLastSwapTemp,
    perETHOriginal,
    arrToken: item.arrToken,
  }
}

const formatData = (item: Item, itemPre: Item, configTemp: ConfigTemp) => {
  const tokenETH = item.arrToken.find((e) => e.symbol === 'ETH')
  const isETH = userConfig.inputStart === 'ETH'
  let originalAmount = '0'

  if (!itemPre) {
    item.arrToken.forEach((token, idx) => {
      if (token.symbol === 'ETH') {
        token.perETH = '1'
      } else {
        token.perETH = BigNumber(token!.price!).dividedBy(tokenETH!.price!).toFixed()
      }
      configTemp.ETHLastSwap[token.symbol!] = token.perETH!
      configTemp.ETHLastSwapTemp[token.symbol!] = token.perETH!
      configTemp.perETHOriginal[token.symbol!] = token.perETH!

      if (token.symbol === userConfig.inputStart) {
        if (isETH) {
          originalAmount = userConfig.amountInput
        } else {
          originalAmount = BigNumber(userConfig.amountInput).multipliedBy(token!.price!).dividedBy(tokenETH!.price!).toFixed()
        }
      }

      token.perETHChangePercentage = '0'
      token.changeByPoint = '0'
      token.pointAfterCheck = '1000'
      token.pointBeforeCheck = '1000'
      configTemp.price1Point![token.symbol!] = BigNumber(token.price!).dividedBy(1000).toFixed()
      item.arrToken[idx] = token
    })
    configTemp.originalAmount = originalAmount
  } else {
    item.arrToken.forEach((token, idx) => {
      const tokenPre = itemPre.arrToken[idx]

      if (token.symbol === 'ETH') {
        token.perETHChangePercentage = BigNumber(BigNumber(token!.price!).minus(tokenPre?.price!)).dividedBy(tokenPre!.price!).toFixed()
        token.perETH = '1'
      } else {
        token.perETH = BigNumber(token!.price!).dividedBy(tokenETH!.price!).toFixed()
        token.perETHChangePercentage = BigNumber(BigNumber(token.perETH!).minus(tokenPre.perETH!)).dividedBy(tokenPre.perETH!).toFixed()
      }
      token.changeByPoint = BigNumber(BigNumber(token!.price!).dividedBy(configTemp.price1Point![token.symbol!]))
        .minus(BigNumber(tokenPre!.price!).dividedBy(configTemp.price1Point![token.symbol!]))
        .toFixed()

      item.arrToken[idx] = token
    })
  }

  return { item, configTemp }
}

function callData(listDataBase: Item[], userConfig: UserConfig, configTemp: ConfigTemp) {
  const listData = [...deepClone(listDataBase)]

  listData.forEach((item, index) => {
    let itemPre = listData[index - 1]
    let itemCurrent = item

    if (itemPre) {
      const { item } = formatData(itemCurrent, itemPre, configTemp)

      itemCurrent = item
      const res = checkValidSwapV4({ item: itemCurrent, itemPre, userConfig, configTemp: deepClone(configTemp) })

      configTemp.ETHLastSwap = res.ETHLastSwap
      configTemp.ETHLastSwapTemp = res.ETHLastSwapTemp
      configTemp.amountInput = res.amountInput
      configTemp.outputSwap = res.outputSwap
      configTemp.outputSwapTemp = res.outputSwapTemp
      // Update perETHOriginal
      configTemp.perETHOriginal = res.perETHOriginal
      listData[index].arrToken = res.arrToken

      if (res.isSwap) {
        listData[index].isSwap = true
      }
    } else {
      const { item, configTemp: configTempUpdate } = formatData(itemCurrent, itemPre, configTemp)

      itemCurrent = item
      configTemp = configTempUpdate
      listData[index] = itemCurrent
    }
  })
  // Trả về kết quả swap
  const arrSwap = listData.map((item, idx) => (item.isSwap ? idx + 1 : null)).filter(Boolean)

  return { amountSwap: arrSwap.length, arrSwap }
}

// ================== Default Config ==================
const userConfig: UserConfig = {
  volatilityPercentage: '0.3',
  affiliate: '0.15',
  amountInput: '1',
  amountMaxReceived: '2000000000000000',
  inputStart: 'ETH',
}

const configTemp: Partial<ConfigTemp> = {
  amountInput: userConfig.amountInput,
  outputSwap: userConfig.inputStart!,
  outputSwapTemp: userConfig.inputStart!,
  ETHLastSwap: { ETH: '0', BTC: '0', BNB: '0' },
  ETHLastSwapTemp: { ETH: '0', BTC: '0', BNB: '0' },
  perETHOriginal: { ETH: '1', BTC: '0.05', BNB: '0.15' },
  price1Point: {},
}

// ================== Run Swap ==================
const result = callData(DATA_V4, userConfig, configTemp as any)

console.log({ result })

// Bạn có thể xuất result ra UI hoặc log nếu cần
