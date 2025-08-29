import { Editor } from '@monaco-editor/react'
import React from 'react'

const ShowCode = () => {
  return (
    <Editor
      defaultLanguage='typescript'
      defaultValue={`

const getTokenMinChangePercentage = (poolToken: PoolToken): Token => {
  let minChangePercentage = poolToken.eth!.perETHChangePercentage!

  poolToken.arrToken!.forEach((token) => {
    if (minChangePercentage > token.perETHChangePercentage!) {
      minChangePercentage = token.perETHChangePercentage! 
    }
  })

  if (minChangePercentage === poolToken.eth!.perETHChangePercentage!) {
    return poolToken.eth!
  }

  const token = poolToken.arrToken!.find((token) => {
    if (minChangePercentage === token.perETHChangePercentage!) {
      minChangePercentage = token.perETHChangePercentage!
    }
  })

  return token!
}

const checkToSwap = async (token: Token) => {
  const poolToken = arrData[indexCurrent]

  //Nếu số MIN đó nhỏ hơn âm của VolatilityPercentage thì làm tiếp bước kế tiếp
  if (Number(token.perETHChangePercentage!) < BigNumber(volatilityPercentage).multipliedBy(-1).toNumber()) {
    ///get deBridge to get input swap
    //........
    const amountOut = amountStart - 1
    //-----

    //SwapInputToken và SwapOutputToken giống nhau thì không làm gì cả, chờ qua giờ kế tiếp
    if (BigNumber(amountStart).isEqualTo(BigNumber(amountOut).toFixed())) {
      return
    } else {
      // (SwapInputTokenAmount * (1 - AFFILIATE_FEE_PERENT))* SwapInputTokenPrice) / ETHPrice của giờ đó
      const amountValid = BigNumber(amountStart)
        .multipliedBy(BigNumber(1).minus(affiliate.toFixed()))
        .multipliedBy(token.price!)
        .dividedBy(poolToken.eth?.price!)
        .toFixed()

      if (BigNumber(amountValid).gte(amountMaxReceived)) {
        //go to swap and finish
        setIsEnd(true)
      } else {
        if (token?.outPutSwap === 'ETH' || token?.outPutSwap === 'BTC') {
          const tokenBTC = poolToken.arrToken!.find((token) => {
            if (token.symbol === 'BTC') {
              return token
            }
          })

          //・Nếu SwapOutputToken là "ETH" hoặc là "BTC" => so sánh BTCperETH với BTCperETHLastSwap.
          if (BigNumber(tokenBTC?.perETH!).gt(tokenBTC?.perETHLastSwap!)) {
            //(SwapInputTokenAmount * SwapInputTokenPrice) / ETHPrice của giờ đó
            if (BigNumber(tokenBTC?.balance!).multipliedBy(tokenBTC?.price!).dividedBy(poolToken.eth?.price!).gte(amountStart)) {
              //go to swap and finish
              //  tokenBTC?.perETHLastSwap=amount swap
            } else {
              return
            }
          } else {
            return
          }
        } else {
          if (BigNumber(token?.perETH!).gte(token?.perETHLastSwap!)) {
            //(SwapInputTokenAmount * SwapInputTokenPrice) / ETHPrice của giờ đó
            if (BigNumber(token?.balance!).multipliedBy(token?.price!).dividedBy(poolToken.eth?.price!).gte(amountStart)) {
              //go to swap and finish
              //  tokenBTC?.perETHLastSwap=amount swap
            } else {
              return
            }
          } else {
            return
          }
        }
      }
    }
  }

  arrData[indexCurrent] = poolToken

  setArrData(arrData)
}

const calculateData = async (indexInterval = 0) => {
  const arrClone: PoolToken[] = JSON.parse(JSON.stringify(arrData))
  const poolTrade = arrClone[indexInterval]

  if (indexInterval > 0) {
    const poolTradePre = arrClone[indexInterval - 1]

    //get perETHChangePercentage
    poolTrade.eth!.perETHChangePercentage = BigNumber(poolTradePre.eth?.price!)
      .minus(poolTrade.eth!.price!)
      .dividedBy(poolTrade.eth!.price!)
      .toFixed()

    //get perETHChangePercentage in List token
    poolTrade.arrToken!.forEach((token, index) => {
      const tokenPre = poolTradePre.arrToken![index]

      token.perETH = BigNumber(token!.price!).dividedBy(poolTrade.eth!.price!).toFixed()
      token.perETHChangePercentage = BigNumber(token.perETH!).minus(tokenPre.perETH!).dividedBy(token.perETH!).toFixed()
      poolTrade.arrToken![index] = token
    })

    const tokenMinChangePercentage = getTokenMinChangePercentage(poolTrade)

    await checkToSwap(tokenMinChangePercentage)
  } else {
    poolTrade.arrToken!.forEach((token, index) => {
      token.perETH = BigNumber(token!.price!).dividedBy(poolTrade.eth!.price!).toFixed()
      token.perETHChangePercentage = '0'
      poolTrade.arrToken![index] = token
    })
    poolTrade.eth!.perETHChangePercentage = '0'
  }

  arrData[indexInterval] = poolTrade
  setArrData(arrData)
}


        `}
      height='90vh'
      language='typescript'
    />
  )
}

export default ShowCode
