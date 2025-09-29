import { BigNumber } from 'bignumber.js'

import { DATA_FAKE } from './dataDake'

export interface Token {
  symbol?: string
  price?: number
  perETH?: string
  perETHChangePercentage?: string
}

//demo trên file là symbol.
// ETHLastSwap={
//   'ETH': '0',
//   'BTC': '0',
// }
interface ETHLastSwap {
  [key: string]: string
}

//demo trên file là symbol.
// ETHLastSwapTemp={
//   'ETH': '0',
//   'BTC': '0',
// }

interface ETHLastSwapTemp {
  [key: string]: string
}

//demo trên file là symbol.
//OutputSwap=OutputSwapTemp = input token được set ban đầu
type OutputSwap = string
type OutputSwapTemp = string

//demo trên file là symbol.
// PerETHOriginal={
//   ETH:token.perETH,
//   BTC': token.perETH
// }
type PerETHOriginal = {
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
  inputStart?: string
}

interface ConfigTemp {
  amountInput: string
  outputSwap: OutputSwap
  outputSwapTemp: OutputSwapTemp
  ETHLastSwap: ETHLastSwap
  ETHLastSwapTemp: ETHLastSwapTemp
  perETHOriginal: PerETHOriginal
}

interface PramCheckValidSwap {
  item: Item
  userConfig: UserConfig
  configTemp: ConfigTemp
  index?: number
}
export const clone = (params: any) => {
  return JSON.parse(JSON.stringify(params))
}

export const getTokenInput = (outputSwap: OutputSwap, arrToken: Token[]) => {
  return arrToken.find((token) => token.symbol === outputSwap)
}

const getTokenMinChangePercentage = (arrToken: Token[]): Token => {
  const minChangePercentage = arrToken!.reduce((min, token) => {
    return BigNumber(min).lt(token.perETHChangePercentage!) ? min : token.perETHChangePercentage!
  }, arrToken![0].perETHChangePercentage!)

  const token = arrToken!.find((token) => {
    return BigNumber(minChangePercentage).isEqualTo(token.perETHChangePercentage!)
  })!

  return token
}

export const getTokenOut = (arrToken: Token[]): Token => {
  const minChangePercentage = arrToken!.reduce((min, token) => {
    return BigNumber(min).lt(token.perETHChangePercentage!) ? min : token.perETHChangePercentage!
  }, arrToken![0].perETHChangePercentage!)

  const token = arrToken!.find((token) => {
    return BigNumber(minChangePercentage).isEqualTo(token.perETHChangePercentage!)
  })!

  return token
}

export const checkValidSwap = ({ item, userConfig, configTemp, index }: PramCheckValidSwap) => {
  let isSwap = false
  let isStopAll = false

  let amountInput = configTemp.amountInput
  let ETHLastSwap = clone(configTemp.ETHLastSwap)
  let ETHLastSwapTemp = clone(configTemp.ETHLastSwapTemp)
  let perETHOriginal = clone(configTemp.perETHOriginal)

  let outputSwap = clone(configTemp.outputSwap)
  let outputSwapTemp = clone(configTemp.outputSwapTemp)

  const tokenOutput = getTokenOut(item.arrToken)
  const tokenInput = getTokenInput(outputSwap, item.arrToken)

  //demo trên file là outPutSwap=symbol.
  const tokenBTC = item.arrToken.find((t) => t.symbol === 'BTC')
  const tokenETH = item.arrToken.find((t) => t.symbol === 'ETH')

  if (
    outputSwapTemp !== tokenOutput.symbol &&
    Number(tokenOutput.perETHChangePercentage!) < BigNumber(BigNumber(userConfig.volatilityPercentage).dividedBy(100)).multipliedBy(-1).toNumber()
  ) {
    if (tokenOutput.symbol === 'ETH') {
      ETHLastSwapTemp[tokenBTC!.symbol!] = tokenBTC!.perETH!
    } else {
      ETHLastSwapTemp[tokenOutput.symbol!] = tokenOutput.perETH!
    }

    //demo trên file là outPutSwap = symbol.
    outputSwapTemp = tokenOutput.symbol!
    //demo trên file là outPutSwap = symbol.
    if (outputSwap !== tokenOutput.symbol) {
      const amountOutCheck = BigNumber(amountInput).multipliedBy(tokenInput?.price!).dividedBy(tokenETH?.price!).toFixed()

      const amountOut = BigNumber(amountInput)
        .multipliedBy(BigNumber(1).minus(BigNumber(userConfig.affiliate).dividedBy(100)))
        .multipliedBy(tokenInput?.price!)
        .dividedBy(tokenOutput.price!)
        .toFixed()

      // So sánh khi vượt qua amountMaxReceived
      if (BigNumber(amountOut).gte(userConfig.amountMaxReceived)) {
        amountInput = amountOut
        isSwap = true
        isStopAll = true
        // dừng lại toàn bộ hệ thống
      } else {
        //demo dựa trên file là symbol = outPutSwap.
        //outPutSwap=symbol token
        //perETH =  token!.price / eth!.price
        //demo:ETHLastSwap= perETH (token đó)
        if (tokenOutput.symbol === 'ETH' || tokenOutput?.symbol === 'BTC') {
          if (BigNumber(tokenBTC?.perETH!).gt(ETHLastSwap[tokenBTC!.symbol!])) {
            if (BigNumber(amountOutCheck).gte(userConfig.amountInput)) {
              if (BigNumber(ETHLastSwapTemp[tokenBTC!.symbol!]).gte(perETHOriginal[tokenBTC!.symbol!])) {
                //tiến hành swap
                amountInput = amountOut
                outputSwap = tokenOutput!.symbol!
                isSwap = true
              }
            }
          }
          ETHLastSwap[tokenInput!.symbol!] = ETHLastSwapTemp[tokenInput!.symbol!]
          ETHLastSwap[tokenBTC!.symbol!] = ETHLastSwapTemp[tokenBTC!.symbol!]
        } else {
          //demo dựa trên file là symbol = outPutSwap.
          //outPutSwap=symbol token
          //perETH = token!.price / eth!.price
          //demo:ETHLastSwap= perETH (token đó)
          if (BigNumber(tokenOutput?.perETH!).gt(ETHLastSwap[tokenOutput!.symbol!])) {
            if (BigNumber(amountOutCheck).gte(userConfig.amountInput!)) {
              if (BigNumber(ETHLastSwapTemp[tokenOutput!.symbol!]).gte(perETHOriginal[tokenOutput!.symbol!])) {
                //tiến hành swap
                amountInput = amountOut
                outputSwap = tokenOutput!.symbol!
                isSwap = true
              }
            }
          }
          ETHLastSwap[tokenOutput!.symbol!] = ETHLastSwapTemp[tokenOutput!.symbol!]
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

export const formatData = (listData: Item[], userConfig: UserConfig, configTem: ConfigTemp) => {
  const arrFormat = listData.map((item, index) => {
    const tokenETH = item.arrToken!.find((e) => {
      return e.symbol === 'ETH'
    })

    if (index > 0) {
      const listDataPrev = listData[index - 1]
      const tokenETH = item.arrToken!.find((e) => {
        return e.symbol === 'ETH'
      })

      item.arrToken.forEach((token, index) => {
        const tokenPre = listDataPrev.arrToken[index]

        if (token!.symbol! === 'ETH') {
          token.perETHChangePercentage = BigNumber(BigNumber(token!.price!).minus(tokenPre?.price!)).dividedBy(tokenPre!.price!).toFixed()
          token.perETH = '1'
        } else {
          token.perETH = BigNumber(token!.price!).dividedBy(tokenETH!.price!).toFixed()
          token.perETHChangePercentage = BigNumber(BigNumber(token.perETH!).minus(tokenPre!.perETH!)).dividedBy(tokenPre!.perETH!).toFixed()
        }
        item.arrToken[index] = token
      })
    } else {
      item.arrToken.forEach((token, index) => {
        if (token!.symbol! === 'ETH') {
          token.perETHChangePercentage = '0'
          token.perETH = '1'
        } else {
          token.perETH = BigNumber(token!.price!).dividedBy(tokenETH!.price!).toFixed()
          token.perETHChangePercentage = '0'
        }

        configTem.ETHLastSwap[token!.symbol!] = token.perETH!
        configTem.ETHLastSwapTemp[token.symbol!] = token.perETH!
        configTem.perETHOriginal[token.symbol!] = token.perETH!

        item.arrToken[index] = token
      })
    }

    return item
  })

  return {
    arrFormat,
    configTem,
  }
}

export const callData = (listDataBase: Item[], userConfig: UserConfig, configTemp: ConfigTemp) => {
  const data = formatData(listDataBase, userConfig, configTemp)

  const listData = data.arrFormat
  let configTempCurrent = JSON.parse(JSON.stringify(data.configTem))

  console.log({ userConfig, listData, configTempCurrent })

  listData.forEach((item, index) => {
    // Clone configTemp cho từng lần check
    const res = checkValidSwap({ index, item, userConfig, configTemp: JSON.parse(JSON.stringify(configTempCurrent)) })

    // Cập nhật lại configTempCurrent cho lần tiếp theo
    configTempCurrent.ETHLastSwap = res.ETHLastSwap
    configTempCurrent.ETHLastSwapTemp = res.ETHLastSwapTemp
    configTempCurrent.amountInput = res.amountInput
    configTempCurrent.outputSwap = res.outputSwap
    configTempCurrent.outputSwapTemp = res.outputSwapTemp
    if (res.isSwap) {
      listData[index].isSwap = true
    }
  })
  let amountSwap = 0
  const arrSwap: number[] = []

  listData.forEach((item, index) => {
    if (item.isSwap) {
      amountSwap++
      arrSwap.push(index + 1)
    }
  })
  console.log({ amountSwap, arrSwap, listData })
}

export const userConfig: UserConfig = {
  volatilityPercentage: '0.3', //10%
  affiliate: '0.1', //0.3%
  amountInput: '1', //1 ETH
  amountMaxReceived: '2000000000000000', //2 ETH
  inputStart: 'ETH', //demo file là symbol = outPutSwap
}

export const configTemp: ConfigTemp = {
  amountInput: userConfig.amountInput,
  outputSwap: userConfig.inputStart!, //demo file là symbol = outPutSwap
  outputSwapTemp: userConfig.inputStart!, //demo file là symbol = outPutSwap

  //demo file là symbol = outPutSwap

  //perETH của lần đầu tiên
  ETHLastSwap: {
    ETH: '0',
    BTC: '0',
    BNB: '0',
  },
  //perETH của lần đầu tiên
  ETHLastSwapTemp: {
    ETH: '0',
    BTC: '0',
    BNB: '0',
  },
  //perETH của lần đầu tiên
  perETHOriginal: {
    ETH: '1',
    BTC: '0.05',
    BNB: '0.15',
  },
}

callData(DATA_FAKE, userConfig, configTemp)
