import { BigNumber } from 'bignumber.js'

import { Token } from '@/types/app'

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

interface PramCheckValidSwap {
  amountInput: string //là amountInput user set ban đầu
  listToken: Token[]
  outputSwap: OutputSwap
  outputSwapTemp: OutputSwapTemp
  volatilityPercentage: string
  ETHLastSwap: ETHLastSwap
  ETHLastSwapTemp: ETHLastSwapTemp
  affiliate: string
  amountMaxReceived: string
  perETHOriginal: PerETHOriginal //được lấy mặc định lần đầu tiên khi load và không  thay đổi
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

  if (BigNumber(minChangePercentage).isEqualTo(listToken[0].perETHChangePercentage!)) {
    token = listToken[0]
  }

  return token!
}

export const updateETHLastSwapTemp = async (ETHLastSwapTemp: ETHLastSwapTemp, token: Token) => {
  ETHLastSwapTemp[token!.outPutSwap!] = token?.perETH!
}

export const updateOutputSwapTemp = async (value: OutputSwapTemp) => {}
export const updateOutputSwap = async (outputSwap: OutputSwap, value: OutputSwapTemp) => {
  outputSwap = value
}
export const updateAmountInput = async (value: OutputSwapTemp) => {}
export const updateItemIsSwap = async () => {}

export const checkValidSwap = async ({
  amountInput,
  listToken,
  outputSwap,
  outputSwapTemp,
  volatilityPercentage,
  ETHLastSwap,
  ETHLastSwapTemp,
  affiliate,
  amountMaxReceived,
  perETHOriginal,
}: PramCheckValidSwap) => {
  const tokenOutput = getTokenOut(listToken)
  const tokenInput = getTokenInput(outputSwap, listToken)

  //demo trên file là symbol.
  const tokenBTC = listToken.find((t) => t.outPutSwap === 'BTC')
  const tokenETH = listToken.find((t) => t.outPutSwap === 'ETH')

  //demo trên file là symbol.
  if (
    outputSwapTemp == tokenOutput.outPutSwap &&
    Number(tokenOutput.perETHChangePercentage!) < BigNumber(BigNumber(volatilityPercentage).dividedBy(100)).multipliedBy(-1).toNumber()
  ) {
    if (tokenOutput.outPutSwap === 'ETH') {
      //update ETHLastSwapTemp
      await updateETHLastSwapTemp(ETHLastSwapTemp, tokenBTC!)
    } else {
      await updateETHLastSwapTemp(ETHLastSwapTemp, tokenOutput!)
    }

    //demo trên file là symbol.
    await updateOutputSwapTemp(tokenOutput.outPutSwap)

    //demo trên file là symbol.
    if (outputSwap !== tokenOutput.outPutSwap) {
      //(SwapInputTokenAmount * SwapInputTokenPrice/ ETHPrice của giờ đó
      const amount1 = BigNumber(amountInput).multipliedBy(tokenInput?.price!).dividedBy(tokenETH?.price!).toFixed()

      //(SwapInputTokenAmount * (1 - AFFILIATE_FEE_PERENT))* SwapInputTokenPrice) / ETHPrice của giờ đó
      const amount2 = BigNumber(amountInput)
        .multipliedBy(BigNumber(1).minus(BigNumber(affiliate).dividedBy(100)))
        .multipliedBy(tokenInput?.price!)
        .dividedBy(tokenOutput.price!)
        .toFixed()

      // So sánh khi vượt qua amountMaxReceived
      if (BigNumber(amount2).gte(amountMaxReceived)) {
        await updateAmountInput(amount1)
        await updateItemIsSwap()
        // dừng lại toàn bộ hệ thống
      } else {
        //demo dựa trên file là symbol = utPutSwap.
        //utPutSwap=symbol token
        //perETH = BigNumber(token!.price!).dividedBy(eth!.price!).toFixed()
        //demo:ETHLastSwap= perETH (token đó)
        if (tokenOutput.outPutSwap === 'ETH' || tokenInput?.outPutSwap === 'BTC') {
          if (BigNumber(tokenBTC?.perETH!).gt(ETHLastSwap[tokenBTC!.outPutSwap!])) {
            if (BigNumber(amount1).gte(amountInput)) {
              if (BigNumber(ETHLastSwapTemp[tokenBTC!.outPutSwap!]).gte(perETHOriginal[tokenBTC!.outPutSwap!])) {
                await updateAmountInput(amount1)
                await updateOutputSwap(outputSwap, tokenBTC!.outPutSwap!)
                await updateItemIsSwap()
              }
            }
          }
          await updateETHLastSwapTemp(ETHLastSwapTemp, tokenOutput!)
          await updateETHLastSwapTemp(ETHLastSwapTemp, tokenBTC!)
        } else {
          //demo dựa trên file là symbol = utPutSwap.
          //utPutSwap=symbol token
          //perETH = BigNumber(token!.price!).dividedBy(eth!.price!).toFixed()
          //demo:ETHLastSwap= perETH (token đó)
          if (BigNumber(tokenOutput?.perETH!).gt(ETHLastSwap[tokenOutput!.outPutSwap!])) {
            if (BigNumber(amount1).gte(amountInput)) {
              if (BigNumber(ETHLastSwapTemp[tokenBTC!.outPutSwap!]).gte(perETHOriginal[tokenOutput!.outPutSwap!])) {
                await updateAmountInput(amount1)
                await updateOutputSwap(outputSwap, tokenOutput!.outPutSwap!)
                await updateItemIsSwap()
              }
            }
          }
          await updateETHLastSwapTemp(ETHLastSwapTemp, tokenOutput!)
        }
      }
    }
  }

  return false
}
