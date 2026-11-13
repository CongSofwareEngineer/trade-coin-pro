// ================== Types & Config ==================
import { BigNumber } from 'bignumber.js'

import { DATA_V4 } from './DATA_V4'

type TokenSymbol = string

interface Token {
  symbol?: TokenSymbol
  price?: number
  perETH?: string
  perETHChangePercentage?: string
  //v4
  changeByPoint?: string
  pointBeforeCheck?: string
  pointAfterCheck?: string
}

interface SwapState {
  [key: string]: string
}

interface Item {
  time?: string
  arrToken: Token[]
  isSwap?: boolean
  inputSwap?: TokenSymbol
  outputSwap?: TokenSymbol
  amountSwap?: string
}

interface UserConfig {
  amountStart: string
  //symbol token bỏ vào lúc đầu (trước tên là outputStart)
  inputStart: TokenSymbol
  volatilityPercentage: string
  affiliate: string
}

interface State {
  amountInput: string
  outputSwap: TokenSymbol
  outputSwapTemp: TokenSymbol
  ETHLastSwap: SwapState
  ETHLastSwapTemp: SwapState
  perETHOriginal: SwapState
  ETHOriginalAmount: string
  //v4: giá tương ứng 1 point của từng token, lấy từ giá đầu kỳ / 1000
  price1Point: SwapState
}

// ================== Utility Functions ==================
export const deepClone = <T>(obj: T): T => JSON.parse(JSON.stringify(obj))

//symbol token luôn uppercase, dùng chung cho mọi so sánh / key
const uppercase = (value?: string | number) => {
  if (!value) return ''

  return String(value).trim().toUpperCase()
}

//đồng nhất mọi symbol token về uppercase ngay khi nhận data
const normalizeSymbol = (listData: Item[]) => {
  listData.forEach((item) => {
    item.arrToken?.forEach((token) => {
      token.symbol = uppercase(token.symbol)
    })
  })

  return listData
}

const SYMBOL_ETH = ['ETH', 'WETH', 'CBETH']
const SYMBOL_BTC = ['BTC', 'WBTC', 'CBBTC']

//ETH/WETH/CBETH coi là ETH, BTC/WBTC/CBBTC coi là BTC
export const isSymbolETHOrBTC = (symbol?: string, type: 'eth' | 'btc' = 'eth') => {
  if (type === 'eth') return SYMBOL_ETH.includes(uppercase(symbol))

  return SYMBOL_BTC.includes(uppercase(symbol))
}

const getTokenETH = (arrToken: Token[] = []) => {
  return arrToken.find((token) => isSymbolETHOrBTC(token.symbol!, 'eth'))
}

const getTokenBTC = (arrToken: Token[] = []) => {
  return arrToken.find((token) => isSymbolETHOrBTC(token.symbol!, 'btc'))
}

const getTokenBySymbol = (arrToken: Token[] = [], symbol: TokenSymbol) => {
  return arrToken.find((token) => uppercase(token.symbol) === uppercase(symbol))
}

//token có perETHChangePercentage nhỏ nhất => token sẽ swap ra
const getTokenMinChangePercentage = (arrToken: Token[] = []): Token => {
  const minChangePercentage = arrToken.reduce((min, token) => {
    return BigNumber(min).lt(token.perETHChangePercentage!) ? min : token.perETHChangePercentage!
  }, arrToken[0].perETHChangePercentage!)

  return arrToken.find((token) => BigNumber(minChangePercentage).isEqualTo(token.perETHChangePercentage!))!
}

// ================== Point (v4) ==================

const updatePointBeforeCheck = (arrToken: Token[] = [], arrTokenPre: Token[] = []) => {
  arrToken.forEach((token, index) => {
    const tokenPre = arrTokenPre[index]

    token.pointBeforeCheck = BigNumber(tokenPre.pointAfterCheck!).plus(token.changeByPoint!).toFixed()
    arrToken[index] = token
  })

  return arrToken
}

const updatePointAfterCheckBeforeSwap = (arrToken: Token[] = [], arrTokenPre: Token[] = []) => {
  arrToken.forEach((token, index) => {
    const tokenPre = arrTokenPre[index]

    token.pointAfterCheck = BigNumber(tokenPre.pointAfterCheck!).plus(token.changeByPoint!).toFixed()
    arrToken[index] = token
  })

  return arrToken
}

//swap xong: token output về 1000, token khác đang < 1000 kéo lên 1000
const updatePointAfterCheckInSwap = (arrToken: Token[] = [], tokenOutput: Token) => {
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

//reset perETHOriginal khi có >= 2 token vượt resetPoint
const updatePerETHOriginal = (
  arrToken: Token[] = [],
  arrTokenPre: Token[] = [],
  tokenInput: Token,
  userConfig: UserConfig,
  perETHOriginal: SwapState
) => {
  const resetPoint = BigNumber(1000).plus(BigNumber(1000).multipliedBy(userConfig.volatilityPercentage).dividedBy(100).multipliedBy(10)).toFixed() //2000 + 30% = 2600

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

      if (isSymbolETHOrBTC(symbol, 'eth') || isSymbolETHOrBTC(symbol, 'btc')) {
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

      if (isSymbolETHOrBTC(symbol, 'eth') || isSymbolETHOrBTC(symbol, 'btc')) {
        perETHOriginal[symbol] = token.perETH!
      }
    })
  }

  return perETHOriginal
}

// ================== Init data ==================

const initFirstItem = (item: Item, userConfig: UserConfig, state: State) => {
  const tokenETH = getTokenETH(item.arrToken)!
  const inputStart = uppercase(userConfig.inputStart)
  const isETH = isSymbolETHOrBTC(inputStart, 'eth')

  item.arrToken.forEach((token, index) => {
    const symbol = uppercase(token.symbol)

    token.perETH = isSymbolETHOrBTC(symbol, 'eth') ? '1' : BigNumber(token!.price!).dividedBy(tokenETH!.price!).toFixed()
    token.perETHChangePercentage = '0'

    state.ETHLastSwap[symbol] = token.perETH!
    state.ETHLastSwapTemp[symbol] = token.perETH!
    state.perETHOriginal[symbol] = token.perETH!

    if (symbol === inputStart) {
      state.ETHOriginalAmount = isETH
        ? userConfig.amountStart
        : BigNumber(userConfig.amountStart).multipliedBy(token!.price!).dividedBy(tokenETH!.price!).toFixed()
    }

    //v4: point đầu kỳ = 1000, price1Point = giá đầu kỳ / 1000
    token.changeByPoint = '0'
    token.pointAfterCheck = '1000'
    token.pointBeforeCheck = '1000'
    state.price1Point[symbol] = BigNumber(token.price!).dividedBy(1000).toFixed()

    item.arrToken[index] = token
  })

  return { item, state }
}

const initItem = (item: Item, itemPre: Item, state: State) => {
  const tokenETH = getTokenETH(item.arrToken)!

  item.arrToken.forEach((token, index) => {
    const tokenPre = itemPre.arrToken[index]
    const symbol = uppercase(token.symbol)
    const price1Point = state.price1Point[symbol]

    if (isSymbolETHOrBTC(symbol, 'eth')) {
      token.perETH = '1'
      token.perETHChangePercentage = BigNumber(BigNumber(token!.price!).minus(tokenPre?.price!)).dividedBy(tokenPre!.price!).toFixed()
    } else {
      token.perETH = BigNumber(token!.price!).dividedBy(tokenETH!.price!).toFixed()
      token.perETHChangePercentage = BigNumber(BigNumber(token.perETH!).minus(tokenPre.perETH!)).dividedBy(tokenPre.perETH!).toFixed()
    }

    // ・ETHChangeByPoint: bằng (ETHPrice giờ đó / ETHPrice1Point) -  (ETHPrice giờ trước đó / ETHPrice1Point)
    token.changeByPoint = BigNumber(BigNumber(token!.price!).dividedBy(price1Point))
      .minus(BigNumber(tokenPre!.price!).dividedBy(price1Point))
      .toFixed()

    item.arrToken[index] = token
  })

  return item
}

const initData = (listData: Item[], userConfig: UserConfig, state: State) => {
  for (let index = 0; index < listData.length; index++) {
    try {
      if (index === 0) {
        const res = initFirstItem(listData[index], userConfig, state)

        listData[index] = res.item
        state = res.state
      } else {
        listData[index] = initItem(listData[index], listData[index - 1], state)
      }
    } catch (error) {
      console.log({ errorIndexInitData: index, error })

      return { listData, state }
    }
  }

  return { listData, state }
}

// ================== Swap Logic ==================

const onSwap = (item: Item, tokenOutput: Token, amountAfterSwap: string, state: State) => {
  const symbolOutput = uppercase(tokenOutput.symbol)
  const symbolInput = state.outputSwap

  //v4: token output về 1000 sau khi swap
  item.arrToken = updatePointAfterCheckInSwap(item.arrToken, tokenOutput)

  state.amountInput = amountAfterSwap
  state.outputSwap = symbolOutput

  item.isSwap = true
  item.inputSwap = symbolInput
  item.outputSwap = symbolOutput
  item.amountSwap = amountAfterSwap

  return { item, state }
}

const checkToSwap = (item: Item, itemPre: Item, userConfig: UserConfig, state: State) => {
  const tokenOutput = getTokenMinChangePercentage(item.arrToken)
  const tokenETH = getTokenETH(item.arrToken)
  const tokenBTC = getTokenBTC(item.arrToken)
  const tokenInput = getTokenBySymbol(item.arrToken, state.outputSwap)!

  const symbolOutput = uppercase(tokenOutput.symbol)
  const symbolInput = uppercase(tokenInput?.symbol)
  const symbolBTC = uppercase(tokenBTC?.symbol)

  const limitChangePercentage = BigNumber(BigNumber(userConfig.volatilityPercentage).dividedBy(100)).multipliedBy(-1).toNumber()

  //v4: update pointBeforeCheck, pointAfterCheck before swap
  item.arrToken = updatePointBeforeCheck(item.arrToken, itemPre.arrToken)
  item.arrToken = updatePointAfterCheckBeforeSwap(item.arrToken, itemPre.arrToken)

  if (state.outputSwapTemp !== symbolOutput && Number(tokenOutput.perETHChangePercentage!) < limitChangePercentage) {
    if (isSymbolETHOrBTC(symbolOutput, 'eth')) {
      state.ETHLastSwapTemp[symbolBTC] = tokenBTC!.perETH!
    } else {
      state.ETHLastSwapTemp[symbolOutput] = tokenOutput.perETH!
    }

    state.outputSwapTemp = symbolOutput

    if (state.outputSwap !== symbolOutput && symbolInput !== symbolOutput) {
      //(SwapInputTokenAmount * SwapInputTokenPrice) / ETHPrice
      const amountOutCheck = BigNumber(state.amountInput!).multipliedBy(tokenInput?.price!).dividedBy(tokenETH?.price!).toFixed()

      //(SwapInputTokenAmount * (1 - AFFILIATE_FEE_PERENT))* SwapInputTokenPrice) / ETHPrice của giờ đó
      const amountAfterSwap = BigNumber(state.amountInput!)
        .multipliedBy(BigNumber(1).minus(BigNumber(userConfig.affiliate).dividedBy(100)))
        .multipliedBy(tokenInput?.price!)
        .dividedBy(tokenOutput!.price!)
        .toFixed()

      if (isSymbolETHOrBTC(symbolOutput, 'eth') || isSymbolETHOrBTC(symbolOutput, 'btc')) {
        if (BigNumber(tokenBTC?.perETH!).gt(state.ETHLastSwap[symbolBTC])) {
          //(SwapInputTokenAmount * SwapInputTokenPrice)/ ETHPrice của giờ đó => đem so sánh với ETHOriginalAmount
          if (BigNumber(amountOutCheck).gte(state.ETHOriginalAmount)) {
            if (BigNumber(tokenBTC?.perETH!).gte(state.perETHOriginal[symbolBTC])) {
              const res = onSwap(item, tokenOutput, amountAfterSwap, state)

              item = res.item
              state = res.state
            }
          }
        }

        state.ETHLastSwap[symbolBTC] = state.ETHLastSwapTemp[symbolBTC]
      } else {
        if (BigNumber(tokenOutput?.perETH!).gte(state.ETHLastSwap[symbolOutput]!)) {
          //(SwapInputTokenAmount * SwapInputTokenPrice)/ ETHPrice của giờ đó => đem so sánh với ETHOriginalAmount
          if (BigNumber(amountOutCheck).gte(state.ETHOriginalAmount)) {
            if (BigNumber(tokenOutput!.perETH!).gte(state.perETHOriginal[symbolOutput])) {
              const res = onSwap(item, tokenOutput, amountAfterSwap, state)

              item = res.item
              state = res.state
            }
          }
        }

        state.ETHLastSwap[symbolOutput] = state.ETHLastSwapTemp[symbolOutput]
      }
    }
  }

  //v4: reset perETHOriginal theo point
  state.perETHOriginal = updatePerETHOriginal(item.arrToken, itemPre.arrToken, tokenInput, userConfig, state.perETHOriginal)

  return { item, state }
}

const calculateData = (listData: Item[], userConfig: UserConfig, state: State) => {
  for (let index = 1; index < listData.length; index++) {
    try {
      listData[index].isSwap = false

      const res = checkToSwap(listData[index], listData[index - 1], userConfig, state)

      listData[index] = res.item
      state = res.state
    } catch (error) {
      console.log({ errorIndexCalculateData: index, error })

      return { listData, state }
    }
  }

  return { listData, state }
}

// ================== Run ==================

const getStateDefault = (userConfig: UserConfig): State => {
  const inputStart = uppercase(userConfig.inputStart)

  return {
    amountInput: userConfig.amountStart,
    outputSwap: inputStart,
    outputSwapTemp: inputStart,
    ETHLastSwap: {},
    ETHLastSwapTemp: {},
    perETHOriginal: {},
    ETHOriginalAmount: '0',
    price1Point: {},
  }
}

const runV4 = (listDataBase: Item[], userConfig: UserConfig) => {
  let listData = normalizeSymbol(deepClone(listDataBase))
  let state = getStateDefault(userConfig)

  const resInit = initData(listData, userConfig, state)

  listData = resInit.listData
  state = resInit.state

  const resCalculate = calculateData(listData, userConfig, state)

  listData = resCalculate.listData
  state = resCalculate.state

  const arrSwap = listData.map((item, index) => (item.isSwap ? index + 1 : null)).filter(Boolean)

  return { amountSwap: arrSwap.length, arrSwap, listData, state }
}

// ================== Default Config ==================
const userConfig: UserConfig = {
  amountStart: '1',
  inputStart: 'ETH',
  volatilityPercentage: '0.3',
  affiliate: '0.15',
}

const result = runV4(DATA_V4 as Item[], userConfig)

console.log({
  amountSwap: result.amountSwap,
  arrSwap: result.arrSwap,
  swaps: result.listData
    .filter((item) => item.isSwap)
    .map((item) => ({ time: item.time, input: item.inputSwap, output: item.outputSwap, amount: item.amountSwap })),
  state: result.state,
})
