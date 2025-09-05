import { BigNumber } from 'bignumber.js'

import { DATA_FAKE } from './dataDake'

export interface Token {
  symbol?: string
  address?: string
  price?: number
  perETH?: string
  perETHChangePercentage?: string
  isNative?: boolean
  decimals?: number
  amountSwap?: number
  balance?: number
  outPutSwap?: string
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
  listToken: Token[]
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
}

export const getTokenInput = (outputSwap: OutputSwap, listToken: Token[]) => {
  return listToken.find((token) => token.outPutSwap === outputSwap)
}

export const getTokenOut = (listToken: Token[]): Token => {
  let minChangePercentage = listToken[0].perETHChangePercentage!

  listToken.forEach((token) => {
    if (BigNumber(minChangePercentage).gt(token.perETHChangePercentage!)) {
      minChangePercentage = token.perETHChangePercentage!
    }
  })

  let token = listToken.find((token) => {
    return BigNumber(minChangePercentage).isEqualTo(token.perETHChangePercentage!)
  })

  return token!
}

export const checkValidSwap = ({ item, userConfig, configTemp }: PramCheckValidSwap) => {
  let isSwap = false
  let isStopAll = false

  let amountInput = configTemp.amountInput
  let ETHLastSwap = configTemp.ETHLastSwap
  let ETHLastSwapTemp = configTemp.ETHLastSwapTemp
  let perETHOriginal = configTemp.perETHOriginal

  let outputSwap = configTemp.outputSwap
  let outputSwapTemp = configTemp.outputSwapTemp

  const tokenOutput = getTokenOut(item.listToken)
  const tokenInput = getTokenInput(outputSwap, item.listToken)

  //demo trên file là outPutSwap=symbol.
  const tokenBTC = item.listToken.find((t) => t.outPutSwap === 'BTC')
  const tokenETH = item.listToken.find((t) => t.outPutSwap === 'ETH')

  //demo trên file là outPutSwap=symbol.
  if (
    outputSwapTemp !== tokenOutput.outPutSwap &&
    Number(tokenOutput.perETHChangePercentage!) < BigNumber(BigNumber(userConfig.volatilityPercentage).dividedBy(100)).multipliedBy(-1).toNumber()
  ) {
    if (tokenOutput.outPutSwap === 'ETH') {
      ETHLastSwapTemp[tokenBTC!.outPutSwap!] = tokenBTC!.perETH!
    } else {
      ETHLastSwapTemp[tokenOutput.outPutSwap!] = tokenOutput.perETH!
    }

    //demo trên file là outPutSwap = symbol.
    outputSwapTemp = tokenOutput.outPutSwap!

    //demo trên file là outPutSwap = symbol.
    if (outputSwap !== tokenOutput.outPutSwap) {
      //(SwapInputTokenAmount * SwapInputTokenPrice/ ETHPrice của giờ đó
      //amountOutCheck
      const amountOutCheck = BigNumber(amountInput).multipliedBy(tokenInput?.price!).dividedBy(tokenETH?.price!).toFixed()

      //(SwapInputTokenAmount * (1 - AFFILIATE_FEE_PERENT))* SwapInputTokenPrice) / ETHPrice của giờ đó
      //amountOut
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
        if (tokenOutput.outPutSwap === 'ETH' || tokenOutput?.outPutSwap === 'BTC') {
          if (BigNumber(tokenBTC?.perETH!).gt(ETHLastSwap[tokenBTC!.outPutSwap!])) {
            if (BigNumber(amountOutCheck).gte(userConfig.amountInput)) {
              if (BigNumber(ETHLastSwapTemp[tokenBTC!.outPutSwap!]).gte(perETHOriginal[tokenBTC!.outPutSwap!])) {
                //tiến hành swap
                amountInput = amountOut
                outputSwap = tokenOutput!.outPutSwap!
                isSwap = true
              }
            }
          }
          ETHLastSwap[tokenInput!.outPutSwap!] = ETHLastSwapTemp[tokenInput!.outPutSwap!]
          ETHLastSwap[tokenBTC!.outPutSwap!] = ETHLastSwapTemp[tokenBTC!.outPutSwap!]
        } else {
          //demo dựa trên file là symbol = outPutSwap.
          //outPutSwap=symbol token
          //perETH = token!.price / eth!.price
          //demo:ETHLastSwap= perETH (token đó)
          if (BigNumber(tokenOutput?.perETH!).gt(ETHLastSwap[tokenOutput!.outPutSwap!])) {
            if (BigNumber(amountOutCheck).gte(userConfig.inputStart!)) {
              if (BigNumber(ETHLastSwapTemp[tokenOutput!.outPutSwap!]).gte(perETHOriginal[tokenOutput!.outPutSwap!])) {
                //tiến hành swap
                amountInput = amountOut
                outputSwap = tokenOutput!.outPutSwap!
                isSwap = true
              }
            }
          }
          ETHLastSwap[tokenOutput!.outPutSwap!] = ETHLastSwapTemp[tokenOutput!.outPutSwap!]
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
    if (index > 0) {
      const listDataPrev = listData[index - 1]
      const tokenETH = item.listToken!.find((e) => {
        return e.symbol === 'ETH'
      })

      item.listToken.forEach((token, index) => {
        const tokenPrev = listDataPrev.listToken[index]

        if (token!.outPutSwap! === 'ETH') {
          token.perETHChangePercentage = BigNumber(BigNumber(token!.price!).minus(tokenPrev?.price!)).dividedBy(tokenPrev!.price!).toFixed()
          token.perETH = '1'
        } else {
          token.perETH = BigNumber(token!.price!).dividedBy(tokenETH!.price!).toFixed()
          token.perETHChangePercentage = BigNumber(BigNumber(token.perETH!).minus(tokenPrev!.perETH!)).dividedBy(tokenPrev!.perETH!).toFixed()

          item.listToken[index] = token
        }
      })
    } else {
      const tokenETH = item.listToken!.find((e) => {
        return e.symbol === 'ETH'
      })

      item.listToken.forEach((token, index) => {
        if (token!.outPutSwap! === 'ETH') {
          token.perETHChangePercentage = '0'
          token.perETH = '1'
        } else {
          token.perETH = BigNumber(token!.price!).dividedBy(tokenETH!.price!).toFixed()
          token.perETHChangePercentage = '0'
        }

        configTem.ETHLastSwap[token!.symbol!] = token.perETH!
        configTem.ETHLastSwapTemp[token.symbol!] = token.perETH!
        configTem.perETHOriginal[token.symbol!] = token.perETH!

        item.listToken[index] = token
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

  const configTempClone = data.configTem

  console.log({ userConfig, listData })

  listData.forEach((item, index) => {
    const res = checkValidSwap({ item, userConfig, configTemp: configTempClone })

    console.log({ res })

    configTempClone.ETHLastSwap = res.ETHLastSwap
    configTempClone.ETHLastSwapTemp = res.ETHLastSwapTemp
    configTempClone.amountInput = res.amountInput
    configTempClone.outputSwap = res.outputSwap
    configTempClone.outputSwapTemp = res.outputSwapTemp
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
  console.log({ amountSwap, arrSwap })
}

export const userConfig: UserConfig = {
  volatilityPercentage: '0.481', //10%
  affiliate: '0.18', //0.3%
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

callData(DATA_FAKE as any, userConfig, configTemp)

// //data fake input
// const DATA_FAKE_INPUT: Item[] = [
//   {
//     time: 45858.333333333336,
//     listToken: [
//       {
//         price: 4601.036284,
//         outPutSwap: 'ETH',
//         symbol: 'ETH',
//       },
//       {
//         symbol: 'BNB',
//         price: 863.7056334,
//         outPutSwap: 'BNB',
//       },
//       {
//         symbol: 'BTC',
//         price: 111798.0016,
//         outPutSwap: 'BTC',
//       },
//     ],
//   },
// ]

// //tokens: BNB, ETH, BTC
// const ListItem: Item[] = [
//   {
//     time: 45858.333333333336,
//     isSwap: false,
//     listToken: [
//       {
//         symbol: 'ETH',
//         price: 2000,
//         outPutSwap: 'ETH',
//         perETH: '1',
//         address: '0xETH',
//       },
//       {
//         symbol: 'BTC',
//         price: 40000,
//         outPutSwap: 'BTC',
//         address: '0xBTC',
//         perETH: '0.05',
//       },
//       {
//         symbol: 'BNB',
//         price: 300,
//         outPutSwap: 'BNB',
//         perETH: '0.15',
//         address: '0xBNB',
//       },
//     ],
//   },

//   {
//     time: 45858.333333333336,
//     isSwap: false,
//     listToken: [
//       {
//         symbol: 'ETH',
//         price: 2000,
//         outPutSwap: 'ETH',
//         perETH: '1',
//         address: '0xETH',
//       },
//       {
//         symbol: 'BTC',
//         price: 40000,
//         outPutSwap: 'BTC',
//         perETH: '0.05',
//         address: '0xBTC',
//       },
//       {
//         symbol: 'BNB',
//         price: 300,
//         outPutSwap: 'BNB',
//         perETH: '0.15',
//         address: '0xBNB',
//       },
//     ],
//   },
// ]

// const configTemp: ConfigTemp = {
//   amountInput: userConfig.amountInput,
//   outputSwap: userConfig.inputStart!, //demo file là symbol = outPutSwap
//   outputSwapTemp: userConfig.inputStart!, //demo file là symbol = outPutSwap

//   //demo file là symbol = outPutSwap

//   //perETH của lần đầu tiên
//   ETHLastSwap: {
//     ETH: '0',
//     BTC: '0',
//     BNB: '0',
//   },
//   //perETH của lần đầu tiên
//   ETHLastSwapTemp: {
//     ETH: '0',
//     BTC: '0',
//     BNB: '0',
//   },
//   //perETH của lần đầu tiên
//   perETHOriginal: {
//     ETH: '1',
//     BTC: '0.05',
//     BNB: '0.15',
//   },
// }

// // callData(DATA_FAKE_INPUT, userConfig, configTemp)

// // TEST
// const listToken = [
//   {
//     price: 4570.443523,
//     perETH: 1, // giá token / giá eth
//     perETHChangePercentage: -0.0066491023134039688,
//     outPutSwap: 'ETH', // token có % giảm nhiều nhất
//   },
//   {
//     price: 111370.6301,
//     perETH: 24.36757604366966816144, // giá token / giá eth
//     perETHChangePercentage: 0.00284530962540310489, //
//     outPutSwap: 'BTC', // token có % giảm nhiều nhất
//   },
//   {
//     price: 860.3339751,
//     perETH: 0.18823861858712656058, // giá token / giá eth
//     perETHChangePercentage: 0.00276376658562398642,
//     outPutSwap: 'BNB', // token có % giảm nhiều nhất
//   },
// ]
// const userConfig0 = {
//   volatilityPercentage: '0.3', // 0.3%
//   affiliate: '0.1', // 0.1%
//   amountInput: '1', // 1 ETH
//   amountMaxReceived: '2000000000000000', // MAX ETH
//   inputStart: 'ETH', // token đầu vào
// }
// const configTemp0 = {
//   amountInput: 1, // amount token đang có
//   outputSwap: 'ETH', // token giảm nhiều nhất
//   outputSwapTemp: 'ETH',
//   ETHLastSwap: {
//     ETH: '1',
//     BTC: '24.36757604366966816144',
//     BNB: '0.18823861858712656058',
//   },
//   ETHLastSwapTemp: {
//     // tokenPerETH
//     ETH: '1',
//     BTC: '24.36757604366966816144',
//     BNB: '0.18823861858712656058',
//   },
//   perETHOriginal: {
//     // tokenPerETH lần đầu tiên
//     ETH: '1',
//     BTC: '24.36757604366966816144',
//     BNB: '0.18823861858712656058',
//   },
// }

// const r = checkValidSwap({
//   item: { listToken },
//   userConfig: userConfig0,
//   configTemp: configTemp0,
// })

// console.log('r', r)
