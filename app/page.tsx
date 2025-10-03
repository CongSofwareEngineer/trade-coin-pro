'use client'
import { useEffect, useRef, useState } from 'react'
import { read, utils } from 'xlsx'
import { BigNumber } from 'bignumber.js'

import { deepClone } from '..'

import { ETHLastSwapTemp, PoolToken, Token } from '@/types/app'

const DECIMAL = 8

const KEY_STORAGE = {
  perETHOriginal: 'perETHOriginal',
  ETHOriginalAmount: 'ETHOriginalAmount',
  ETHLastSwapTemp: 'ETHLastSwapTemp',
  ETHLastSwap: 'ETHLastSwap',
  amountInput: 'amountInput',
  outputSwapTemp: 'outputSwapTemp',
  outputSwap: 'outputSwap',
  //v4
  price1Point: 'price1Point',
  indexCurrentUpdatePerETHOriginal: 'indexCurrentUpdatePerETHOriginal',
}

export const saveDataLocal = (key: string, value: any) => {
  localStorage.setItem(key, JSON.stringify(value))
}

export const getDataLocal = (key: string) => {
  const data = localStorage.getItem(key)

  return data ? JSON.parse(data) : null
}

export default function Home() {
  const indexCurrentUpdatePerETHOriginalRef = useRef(0)
  const arrCloneRef = useRef<PoolToken[]>([])
  const arrCloneDefaultRef = useRef<PoolToken[]>([])
  const indexCurrentRef = useRef(0)
  const [arrData, setArrData] = useState<PoolToken[]>([])
  const [amountStart, setAmountStart] = useState<number>(1)
  const [outputStart, setOutputStart] = useState<string>('ETH')
  const [volatilityPercentage, setVolatilityPercentage] = useState<number>(0.3)
  const [affiliate, setAffiliate] = useState<number>(0.15)
  const [isUpload, setIsUpload] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [fileImport, setFileImport] = useState<any>(null)
  const [startData, setStartData] = useState(false)
  const [arrSwapFilter, setArrSwapFilter] = useState<PoolToken[]>([])
  const [showIsSwap, setShowIsSwap] = useState(false)
  const [version, setVersion] = useState<'v1' | 'v4'>('v1')

  const getTokenMinChangePercentage = (poolToken: PoolToken): Token => {
    const minChangePercentage = poolToken.arrToken!.reduce((min, token) => {
      return BigNumber(min).lt(token.perETHChangePercentage!) ? min : token.perETHChangePercentage!
    }, poolToken.arrToken![0].perETHChangePercentage!)

    const token = poolToken.arrToken!.find((token) => {
      return BigNumber(minChangePercentage).isEqualTo(token.perETHChangePercentage!)
    })!

    return token
  }

  const checkToSwap = async (tokenOutput: Token) => {
    let isSwap = false
    let isStopAll = false

    let amountInput = getDataLocal(KEY_STORAGE.amountInput) as string
    let ETHLastSwap = getDataLocal(KEY_STORAGE.ETHLastSwap) as ETHLastSwapTemp
    let ETHLastSwapTemp = getDataLocal(KEY_STORAGE.ETHLastSwapTemp) as ETHLastSwapTemp
    let perETHOriginal = getDataLocal(KEY_STORAGE.perETHOriginal) as ETHLastSwapTemp
    let outputSwap = getDataLocal(KEY_STORAGE.outputSwap) as string
    let outputSwapTemp = getDataLocal(KEY_STORAGE.outputSwapTemp) as string
    const ETHOriginalAmount = getDataLocal(KEY_STORAGE.ETHOriginalAmount) as string

    const poolToken = arrCloneRef.current[indexCurrentRef.current]

    const tokenETH = poolToken.arrToken!.find((e) => {
      return e.symbol === 'ETH'
    })
    const tokenBTC = poolToken.arrToken!.find((e) => {
      return e.symbol === 'BTC'
    })

    const tokenInput: Token = poolToken.arrToken!.find((e) => {
      if (e.symbol === outputSwap) {
        return e
      }
    })!

    if (
      // outputSwapTemp !== tokenInput.symbol &&
      outputSwapTemp !== tokenOutput.symbol &&
      Number(tokenOutput.perETHChangePercentage!) < BigNumber(BigNumber(volatilityPercentage).dividedBy(100)).multipliedBy(-1).toNumber()
    ) {
      console.log(`=================== Item ${indexCurrentRef.current + 1} ==================`)

      console.log('step 1')
      if (tokenOutput!.symbol === 'ETH') {
        console.log(`update ETHLastSwapTemp BTC = ${tokenBTC!.perETH}`)
        ETHLastSwapTemp[tokenBTC!.symbol!] = tokenBTC!.perETH!
      } else {
        console.log(`update ETHLastSwapTemp ${tokenOutput.symbol} = ${tokenOutput.perETH}`)
        ETHLastSwapTemp[tokenOutput.symbol!] = tokenOutput.perETH!
      }

      console.log(`update outputSwapTemp = ${tokenOutput.symbol}`)

      outputSwapTemp = tokenOutput.symbol!
      console.log({ outputSwap, tokenOutput, tokenInput, amountInput, ETHOriginalAmount })

      if (outputSwap !== tokenOutput.symbol && tokenInput.symbol !== tokenOutput.symbol) {
        // ;(SwapInputTokenAmount * SwapInputTokenPrice) / ETHPrice
        const amountOutCheck = BigNumber(amountInput!).multipliedBy(tokenInput?.price!).dividedBy(tokenETH?.price!).toFixed()

        //(SwapInputTokenAmount * (1 - AFFILIATE_FEE_PERENT))* SwapInputTokenPrice) / ETHPrice của giờ đó
        const amountAfterSwap = BigNumber(amountInput!)
          .multipliedBy(BigNumber(1).minus(BigNumber(affiliate).dividedBy(100)))
          .multipliedBy(tokenInput?.price!)
          .dividedBy(tokenOutput!.price!)

          .toFixed()

        console.log('step 2')
        console.log({ amountOutCheck, amountAfterSwap })

        if (tokenOutput?.symbol === 'ETH' || tokenOutput?.symbol === 'BTC') {
          console.log('step 3 so sánh perETH BTC vs ETHLastSwap BTC ')
          console.log({ ETHLastSwap: deepClone(ETHLastSwap), tokenBTC })

          if (BigNumber(tokenBTC?.perETH!).gt(ETHLastSwap[tokenBTC!.symbol!])) {
            console.log('step 4')
            console.log({ ETHLastSwapTemp: deepClone(ETHLastSwapTemp), perETHOriginal: deepClone(perETHOriginal), tokenOutput })

            console.log(' so sánh amount vs ETHOriginalAmount')

            //(SwapInputTokenAmount * SwapInputTokenPrice)/ ETHPrice của giờ đó => đem so sánh với ETHOriginalAmount
            if (BigNumber(amountOutCheck).gte(ETHOriginalAmount)) {
              console.log('step 4.1')

              console.log('so sánh perETH BTC vs perETHOriginal BTC')
              if (BigNumber(tokenBTC?.perETH!).gte(perETHOriginal[tokenBTC!.symbol!])) {
                amountInput = amountAfterSwap
                outputSwap = tokenOutput?.symbol!
                isSwap = true
                arrCloneRef.current[indexCurrentRef.current][`est_${tokenOutput.symbol!}`] = amountAfterSwap
                arrCloneRef.current[indexCurrentRef.current].outputSwap = tokenOutput.symbol!
              }
            }
          }

          console.log(`update ETHLastSwap ${tokenBTC!.symbol} = ${ETHLastSwapTemp[tokenBTC!.symbol!]}`)
          ETHLastSwap[tokenBTC!.symbol!] = ETHLastSwapTemp[tokenBTC!.symbol!]
          // ETHLastSwap[tokenETH!.symbol!] = ETHLastSwapTemp[tokenETH!.symbol!]
        } else {
          console.log('step 5 token other')
          console.log('so sánh perETH token vs ETHLastSwap token')

          console.log({ ETHLastSwap: deepClone(ETHLastSwap), tokenOutput })
          if (BigNumber(tokenOutput?.perETH!).gte(ETHLastSwap[tokenOutput?.symbol!]!)) {
            console.log('step 6')
            console.log({ ETHLastSwapTemp: deepClone(ETHLastSwapTemp), perETHOriginal: deepClone(perETHOriginal), tokenOutput })

            console.log(' so sánh amount vs ETHOriginalAmount')
            //(SwapInputTokenAmount * SwapInputTokenPrice)/ ETHPrice của giờ đó => đem so sánh với ETHOriginalAmount
            if (BigNumber(amountOutCheck).gte(ETHOriginalAmount)) {
              console.log('step 6.1')
              console.log('so sánh perETH token vs perETHOriginal token')
              if (BigNumber(tokenOutput!.perETH!).gte(perETHOriginal[tokenOutput!.symbol!])) {
                outputSwap = tokenOutput?.symbol!
                amountInput = amountAfterSwap
                isSwap = true
                arrCloneRef.current[indexCurrentRef.current][`est_${tokenOutput.symbol!}`] = amountAfterSwap
                arrCloneRef.current[indexCurrentRef.current].outputSwap = tokenOutput.symbol!
              }
            }
          }
          console.log(`update ETHLastSwap ${tokenInput!.symbol} = ${ETHLastSwapTemp[tokenInput!.symbol!]}`)

          ETHLastSwap[tokenOutput!.symbol!] = ETHLastSwapTemp[tokenOutput!.symbol!]
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
      perETHOriginal,
    }
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

  const updatePerETHOriginal = (arrToken: PoolToken['arrToken'] = [], arrTokenPre: PoolToken['arrToken'] = [], tokenInput: Token) => {
    const perETHOriginal = getDataLocal(KEY_STORAGE.perETHOriginal) as ETHLastSwapTemp
    let currentAmountMoreThanRest = 0
    let preAmountMoreThanRest = 0
    let isChangeETHAndBTC = false
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
          if (tokenInput.symbol !== token.symbol) {
            isChangeETHAndBTC = true
          }
        } else {
          if (tokenInput.symbol !== token.symbol) {
            perETHOriginal[token.symbol!] = token.perETH!
          }
        }
      })
    }
    if (isChangeETHAndBTC) {
      arrToken.forEach((token) => {
        if (token.symbol === 'ETH' || token.symbol === 'BTC') {
          perETHOriginal[token.symbol!] = token.perETH!
        }
      })
    }

    return perETHOriginal
  }

  const checkToSwapV4 = async (tokenOutput: Token) => {
    let isSwap = false
    let isStopAll = false

    let amountInput = getDataLocal(KEY_STORAGE.amountInput) as string
    let ETHLastSwap = getDataLocal(KEY_STORAGE.ETHLastSwap) as ETHLastSwapTemp
    let ETHLastSwapTemp = getDataLocal(KEY_STORAGE.ETHLastSwapTemp) as ETHLastSwapTemp
    let perETHOriginal = getDataLocal(KEY_STORAGE.perETHOriginal) as ETHLastSwapTemp
    let outputSwap = getDataLocal(KEY_STORAGE.outputSwap) as string
    let outputSwapTemp = getDataLocal(KEY_STORAGE.outputSwapTemp) as string
    const ETHOriginalAmount = getDataLocal(KEY_STORAGE.ETHOriginalAmount) as string
    //v4
    let poolToken = arrCloneRef.current[indexCurrentRef.current]
    let poolTokenPre = arrCloneRef.current[indexCurrentRef.current - 1]

    const tokenETH = poolToken.arrToken!.find((e) => {
      return e.symbol === 'ETH'
    })
    const tokenBTC = poolToken.arrToken!.find((e) => {
      return e.symbol === 'BTC'
    })

    const tokenInput: Token = poolToken.arrToken!.find((e) => {
      if (e.symbol === outputSwap) {
        return e
      }
    })!

    //update pointBeforeCheck, pointAfterCheck before swap
    poolToken.arrToken = updatePointBeforeCheck(poolToken.arrToken, poolTokenPre.arrToken)
    poolToken.arrToken = updatePointAfterCheckBeforeSwap(poolToken.arrToken, poolTokenPre.arrToken)

    if (
      // outputSwapTemp !== tokenInput.symbol &&
      outputSwapTemp !== tokenOutput.symbol &&
      Number(tokenOutput.perETHChangePercentage!) < BigNumber(BigNumber(volatilityPercentage).dividedBy(100)).multipliedBy(-1).toNumber()
    ) {
      console.log(`=================== Item ${indexCurrentRef.current + 1} ==================`)

      console.log('step 1')
      if (tokenOutput!.symbol === 'ETH') {
        console.log(`update ETHLastSwapTemp BTC = ${tokenBTC!.perETH}`)
        ETHLastSwapTemp[tokenBTC!.symbol!] = tokenBTC!.perETH!
      } else {
        console.log(`update ETHLastSwapTemp ${tokenOutput.symbol} = ${tokenOutput.perETH}`)
        ETHLastSwapTemp[tokenOutput.symbol!] = tokenOutput.perETH!
      }

      console.log(`update outputSwapTemp = ${tokenOutput.symbol}`)

      outputSwapTemp = tokenOutput.symbol!
      console.log({ outputSwap, tokenOutput, tokenInput, amountInput, ETHOriginalAmount })
      if (outputSwap !== tokenOutput.symbol && tokenInput.symbol !== tokenOutput.symbol) {
        // ;(SwapInputTokenAmount * SwapInputTokenPrice) / ETHPrice
        const amountOutCheck = BigNumber(amountInput!).multipliedBy(tokenInput?.price!).dividedBy(tokenETH?.price!).toFixed()

        //(SwapInputTokenAmount * (1 - AFFILIATE_FEE_PERENT))* SwapInputTokenPrice) / ETHPrice của giờ đó
        const amountAfterSwap = BigNumber(amountInput!)
          .multipliedBy(BigNumber(1).minus(BigNumber(affiliate).dividedBy(100)))
          .multipliedBy(tokenInput?.price!)
          .dividedBy(tokenOutput!.price!)

          .toFixed()

        console.log('step 2')
        console.log({ amountOutCheck, amountAfterSwap })

        if (tokenOutput?.symbol === 'ETH' || tokenOutput?.symbol === 'BTC') {
          console.log('step 3 so sánh perETH BTC vs ETHLastSwap BTC ')
          console.log({ ETHLastSwap: deepClone(ETHLastSwap), tokenBTC })

          if (BigNumber(tokenBTC?.perETH!).gt(ETHLastSwap[tokenBTC!.symbol!])) {
            console.log('step 4')
            console.log({ ETHLastSwapTemp: deepClone(ETHLastSwapTemp), perETHOriginal: deepClone(perETHOriginal), tokenOutput })

            console.log(' so sánh amount vs ETHOriginalAmount')

            //(SwapInputTokenAmount * SwapInputTokenPrice)/ ETHPrice của giờ đó => đem so sánh với ETHOriginalAmount
            if (BigNumber(amountOutCheck).gte(ETHOriginalAmount)) {
              console.log('step 4.1')
              console.log('so sánh perETH BTC vs perETHOriginal BTC')

              //updatePointBeforeAfterCheckBeforeSwap
              // poolToken.arrToken = updatePointBeforeAfterCheckBeforeSwap(poolToken.arrToken, poolTokenPre.arrToken)
              if (BigNumber(tokenBTC?.perETH!).gte(perETHOriginal[tokenBTC!.symbol!])) {
                // v4
                poolToken.arrToken = updatePointAfterCheckInSwap(poolToken.arrToken, tokenOutput)
                // perETHOriginal = updatePerETHOriginal(poolToken.arrToken, poolTokenPre.arrToken, tokenInput)
                //-----
                amountInput = amountAfterSwap
                outputSwap = tokenOutput?.symbol!
                isSwap = true
                arrCloneRef.current[indexCurrentRef.current][`est_${tokenOutput.symbol!}`] = amountAfterSwap
                arrCloneRef.current[indexCurrentRef.current].outputSwap = tokenOutput.symbol!
              }
            }
          }

          console.log(`update ETHLastSwap ${tokenBTC!.symbol} = ${ETHLastSwapTemp[tokenBTC!.symbol!]}`)
          ETHLastSwap[tokenBTC!.symbol!] = ETHLastSwapTemp[tokenBTC!.symbol!]
          // ETHLastSwap[tokenETH!.symbol!] = ETHLastSwapTemp[tokenETH!.symbol!]
        } else {
          console.log('step 5 token other')
          console.log('so sánh perETH token vs ETHLastSwap token')

          console.log({ ETHLastSwap: deepClone(ETHLastSwap), tokenOutput })
          if (BigNumber(tokenOutput?.perETH!).gte(ETHLastSwap[tokenOutput?.symbol!]!)) {
            console.log('step 6')
            console.log({ ETHLastSwapTemp: deepClone(ETHLastSwapTemp), perETHOriginal: deepClone(perETHOriginal), tokenOutput })

            console.log(' so sánh amount vs ETHOriginalAmount')
            //(SwapInputTokenAmount * SwapInputTokenPrice)/ ETHPrice của giờ đó => đem so sánh với ETHOriginalAmount
            if (BigNumber(amountOutCheck).gte(ETHOriginalAmount)) {
              console.log('step 6.1')
              console.log('so sánh perETH token vs perETHOriginal token')

              //updatePointBeforeAfterCheckBeforeSwap
              // poolToken.arrToken = updatePointBeforeAfterCheckBeforeSwap(poolToken.arrToken, poolTokenPre.arrToken)
              if (BigNumber(tokenOutput!.perETH!).gte(perETHOriginal[tokenOutput!.symbol!])) {
                // v4
                poolToken.arrToken = updatePointAfterCheckInSwap(poolToken.arrToken, tokenOutput)
                // perETHOriginal = updatePerETHOriginal(poolToken.arrToken, poolTokenPre.arrToken, tokenInput)
                //-----
                outputSwap = tokenOutput?.symbol!
                amountInput = amountAfterSwap
                isSwap = true
                arrCloneRef.current[indexCurrentRef.current][`est_${tokenOutput.symbol!}`] = amountAfterSwap
                arrCloneRef.current[indexCurrentRef.current].outputSwap = tokenOutput.symbol!
              }
            }
          }
          console.log(`update ETHLastSwap ${tokenInput!.symbol} = ${ETHLastSwapTemp[tokenInput!.symbol!]}`)

          ETHLastSwap[tokenOutput!.symbol!] = ETHLastSwapTemp[tokenOutput!.symbol!]
        }
      }
    }

    perETHOriginal = updatePerETHOriginal(poolToken.arrToken, poolTokenPre.arrToken, tokenInput)

    return {
      isSwap,
      isStopAll,
      amountInput,
      outputSwap,
      outputSwapTemp,
      ETHLastSwap,
      ETHLastSwapTemp,
      perETHOriginal,
      arrToken: poolToken.arrToken,
    }
  }

  const calculateData = async (isV4 = false) => {
    try {
      const poolTrade = arrCloneRef.current[indexCurrentRef.current]

      indexCurrentUpdatePerETHOriginalRef.current = 0
      if (indexCurrentRef.current > 0) {
        const tokenMinChangePercentage = getTokenMinChangePercentage(poolTrade)

        let res: {
          isSwap: boolean
          isStopAll: boolean
          amountInput: string
          outputSwap: string
          outputSwapTemp: string
          ETHLastSwap: ETHLastSwapTemp
          ETHLastSwapTemp: ETHLastSwapTemp
          //v4
          perETHOriginal: ETHLastSwapTemp
          arrToken: PoolToken['arrToken']
        } = (await checkToSwap(tokenMinChangePercentage)) as any

        if (isV4) {
          res = await checkToSwapV4(tokenMinChangePercentage)
        }

        saveDataLocal(KEY_STORAGE.amountInput, res.amountInput)
        saveDataLocal(KEY_STORAGE.perETHOriginal, res.perETHOriginal)
        saveDataLocal(KEY_STORAGE.ETHLastSwapTemp, res.ETHLastSwapTemp)
        saveDataLocal(KEY_STORAGE.ETHLastSwap, res.ETHLastSwap)
        saveDataLocal(KEY_STORAGE.outputSwapTemp, res.outputSwapTemp)
        saveDataLocal(KEY_STORAGE.outputSwap, res.outputSwap)
        poolTrade.isSwap = res.isSwap

        if (isV4) {
          poolTrade.arrToken = res.arrToken
        }
      }

      arrCloneRef.current[indexCurrentRef.current] = poolTrade
      if (indexCurrentRef.current < arrCloneRef.current.length - 1) {
        indexCurrentRef.current++

        await calculateData(isV4)
      } else {
        return
      }
    } catch (error) {
      console.log({ errorIndexcalculateData: indexCurrentRef.current, error })
    }
  }

  const initData = (index = 0, isV4 = false) => {
    try {
      const poolTrade = arrCloneRef.current[index]
      const isETH = outputStart === 'ETH'

      const tokenETH = poolTrade.arrToken!.find((e) => {
        return e.symbol === 'ETH'
      })

      if (index > 0) {
        const poolTradePre = arrCloneRef.current[index - 1]

        //get perETHChangePercentage in List token
        poolTrade.arrToken!.forEach((token, indexToken) => {
          const tokenPre = poolTradePre.arrToken![indexToken]

          if (token.symbol === 'ETH') {
            token.perETH = '1'
            token.perETHChangePercentage = BigNumber(BigNumber(token!.price!).minus(tokenPre?.price!))
              .dividedBy(tokenPre!.price!)

              .toFixed()
          } else {
            token.perETH = BigNumber(token!.price!).dividedBy(tokenETH!.price!).toFixed()

            token.perETHChangePercentage = BigNumber(BigNumber(token.perETH!).minus(tokenPre.perETH!))
              .dividedBy(tokenPre.perETH!)

              .toFixed()
          }

          if (isV4) {
            const price1Point = getDataLocal(KEY_STORAGE.price1Point) || ({} as ETHLastSwapTemp)

            // ・ETHChangeByPoint: bằng (ETHPrice giờ đó / ETHPrice1Point) -  (ETHPrice giờ trước đó / ETHPrice1Point)
            token.changeByPoint = BigNumber(BigNumber(token!.price!).dividedBy(price1Point[token.symbol!]))
              .minus(BigNumber(tokenPre!.price!).dividedBy(price1Point[token.symbol!]))

              .toFixed()
          }

          poolTrade.arrToken![indexToken] = token
        })
      } else {
        poolTrade.arrToken!.forEach((token, index) => {
          if (token.symbol === 'ETH') {
            token.perETHChangePercentage = '0'
            token.perETH = '1'
          } else {
            token.perETH = BigNumber(token!.price!).dividedBy(tokenETH!.price!).toFixed()
            token.perETHChangePercentage = '0'
          }

          //save to local
          const ETHLastSwap = getDataLocal(KEY_STORAGE.ETHLastSwap) || ({} as ETHLastSwapTemp)
          const ETHLastSwapTemp = getDataLocal(KEY_STORAGE.ETHLastSwapTemp) || ({} as ETHLastSwapTemp)
          const perETHOriginal = getDataLocal(KEY_STORAGE.perETHOriginal) || ({} as ETHLastSwapTemp)

          ETHLastSwap[token!.symbol!] = token.perETH
          ETHLastSwapTemp[token.symbol!] = token.perETH
          perETHOriginal[token.symbol!] = token.perETH

          if (token.symbol === outputStart) {
            if (isETH) {
              saveDataLocal(KEY_STORAGE.ETHOriginalAmount, amountStart + '')
            } else {
              const amount = BigNumber(amountStart).multipliedBy(token!.price!).dividedBy(tokenETH!.price!).toFixed()

              saveDataLocal(KEY_STORAGE.ETHOriginalAmount, amount)
            }
          }

          saveDataLocal(KEY_STORAGE.ETHLastSwap, ETHLastSwap)
          saveDataLocal(KEY_STORAGE.ETHLastSwapTemp, ETHLastSwapTemp)
          saveDataLocal(KEY_STORAGE.perETHOriginal, perETHOriginal)

          //v4
          if (isV4) {
            token.changeByPoint = '0'
            token.pointAfterCheck = '1000'
            token.pointBeforeCheck = '1000'

            const price1Point = getDataLocal(KEY_STORAGE.price1Point) || ({} as ETHLastSwapTemp)

            price1Point[token.symbol!] = BigNumber(token.price!).dividedBy(1000).toNumber()

            saveDataLocal(KEY_STORAGE.price1Point, price1Point)
          }

          poolTrade.arrToken![index] = token
        })
      }

      arrCloneRef.current[index] = poolTrade
      if (index < arrCloneRef.current.length - 1) {
        initData(index + 1, isV4)
      } else {
        return
      }
    } catch (error) {
      console.log({ errorIndexcalculateData: index, error })
    }
  }

  const filterSwap = () => {
    const arrSwap = arrCloneRef.current.filter((e) => {
      return e.isSwap
    })

    setArrSwapFilter(arrSwap)

    console.log({ arrSwap })
  }

  const rollUpData = async () => {
    saveDataLocal(KEY_STORAGE.amountInput, amountStart + '')
    saveDataLocal(KEY_STORAGE.outputSwap, outputStart.toLocaleUpperCase().trim())
    saveDataLocal(KEY_STORAGE.outputSwapTemp, outputStart.toLocaleUpperCase().trim())

    if (arrCloneDefaultRef.current.length === 0) {
      arrCloneRef.current = arrCloneDefaultRef.current = JSON.parse(JSON.stringify(arrData))
    } else {
      arrCloneRef.current = JSON.parse(JSON.stringify(arrCloneDefaultRef.current))
    }
    indexCurrentRef.current = 0
    initData(0, version === 'v4')
    setTimeout(async () => {
      await calculateData(version === 'v4')
      setArrData(arrCloneRef.current)
      filterSwap()
      console.log({ arrFinal: arrCloneRef.current, amountInput: getDataLocal(KEY_STORAGE.amountInput) })
    }, 500)
  }

  const formatData = (data: any[] = []): PoolToken[] => {
    function excelDateToJSDate(serial: number) {
      try {
        const excelEpoch = new Date(Date.UTC(1899, 11, 30)) // dùng UTC để cố định
        const msInDay = 24 * 60 * 60 * 1000

        // số mili-giây thêm vào (bao gồm cả phần ngày + phần giờ)
        const date = new Date(excelEpoch.getTime() + serial * msInDay)

        return date.toISOString()
      } catch {
        return ''
      }
    }

    const arrData: PoolToken[] = data.map((e) => {
      delete e['No.']

      if (e['ETH price']) {
        e['ETH'] = e['ETH price']
        delete e['ETH price']
      }

      if (e['BTC price']) {
        e['BTC'] = e['BTC price']
        delete e['BTC price']
      }

      if (e['BNB price']) {
        e['BNB'] = e['BNB price']
        delete e['BNB price']
      }

      const poolToken: PoolToken = {
        time: excelDateToJSDate((e['Time'] || e['Time.'] || e['time'] || e['TIME']) as number),

        arrToken: [],
      }

      Object.entries(e).forEach(([key, value]) => {
        if (key !== 'TIME' && key !== 'Time' && key !== 'No.' && key !== 'Date' && key !== 'Time.') {
          poolToken.arrToken!.push({
            symbol: key,
            price: value as number,
          })
        }
      })

      return poolToken
    })

    console.log({ arrData })

    return arrData
  }

  useEffect(() => {
    if (isUpload) {
      rollUpData()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startData])

  const importData = async (file: File) => {
    try {
      setIsUploading(true)
      const reader = new FileReader()

      reader.onload = async (item) => {
        const dataFile = item.target?.result as string

        const wb = read(dataFile)
        const ws = wb.Sheets[wb.SheetNames[0]] // get the first worksheet
        let data: any[] = utils.sheet_to_json(ws) // generate objects

        // data.shift()
        // data.pop()
        setArrData(formatData(data))

        setTimeout(() => {
          setIsUpload(true)
          setIsUploading(false)
        }, 500)
      }
      reader.onerror = () => {
        // no-op
      }
      reader.readAsArrayBuffer(file)

      // const wb = read(ab)
    } catch (error) {
      console.log({ error })
    }
  }

  const formatNumberToShow = (value: any) => {
    if (BigNumber(value).isNaN()) {
      return '-'
    }

    return BigNumber(value).decimalPlaces(8, BigNumber.ROUND_DOWN).toFormat()
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 text-white'>
      <div className='container mx-auto px-6 py-8'>
        <div className='grid lg:grid-cols-2 gap-8'>
          {/* Configuration Panel */}
          <div className='bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50 shadow-2xl'>
            <h2 className='text-xl font-semibold mb-6 flex items-center gap-2'>
              <div className='w-2 h-2 bg-blue-500 rounded-full' />
              Configuration
            </h2>

            {/* File Upload Section */}
            <div className='mb-6'>
              <div className='block text-sm font-medium text-gray-300 mb-3'>Upload Data File</div>
              <div className='relative'>
                <div
                  className='flex items-center border-2 border-dashed border-gray-600 rounded-xl p-4 hover:border-blue-500 transition-colors duration-200'
                  style={{ opacity: isUploading ? 0.5 : 1 }}
                >
                  <input
                    accept='.xlsx,.xls'
                    className='flex-1 bg-transparent text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-600 file:text-white hover:file:bg-blue-700 file:cursor-pointer cursor-pointer'
                    disabled={isUploading || isUpload}
                    type='file'
                    value={fileImport}
                    onChange={(e) => {
                      const file = e.target.files?.[0]

                      setFileImport(e.target.value)
                      if (file) {
                        importData(file)
                      }
                    }}
                  />

                  {/* Version selector */}
                  <div className='flex items-center gap-3 ml-4 pl-4 border-l border-gray-600'>
                    <label className='text-xs font-medium text-gray-400' htmlFor='version-select'>
                      Version
                    </label>
                    <select
                      className='bg-gray-700 border border-gray-600 rounded-lg px-3 py-1.5 text-sm text-white cursor-pointer hover:bg-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none'
                      id='version-select'
                      value={version}
                      onChange={(e) => {
                        const v = e.target.value as 'v1' | 'v4'

                        setVersion(v)
                      }}
                    >
                      <option value='v1'>v1</option>
                      <option value='v4'>v4</option>
                    </select>
                  </div>

                  {isUploading && (
                    <div className='ml-4 animate-spin'>
                      <svg className='w-5 h-5 text-blue-500' fill='none' stroke='currentColor' strokeWidth={2} viewBox='0 0 24 24'>
                        <path
                          d='M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99'
                          strokeLinecap='round'
                          strokeLinejoin='round'
                        />
                      </svg>
                    </div>
                  )}

                  {isUpload && (
                    <button
                      className='ml-4 px-3 py-1.5 bg-red-600 hover:bg-red-700 rounded-lg text-sm font-medium transition-colors duration-200'
                      onClick={() => {
                        setFileImport('')
                        setIsUpload(false)
                        arrCloneRef.current = []
                        arrCloneDefaultRef.current = []
                        setArrData([])
                      }}
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Input Fields */}
            <div className='space-y-4'>
              <div>
                <div className='block text-sm font-medium text-gray-300 mb-2'>Initial Token Amount</div>
                <input
                  className='w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200'
                  placeholder='Enter amount...'
                  value={amountStart}
                  onChange={(e) => setAmountStart(e.target.value as any)}
                />
                <p className='text-xs text-gray-500 mt-1'>Amount of tokens user inputs initially</p>
              </div>

              <div>
                <div className='block text-sm font-medium text-gray-300 mb-2'>Output Token</div>
                <input
                  className='w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200'
                  placeholder='e.g., ETH, BTC, BNB...'
                  value={outputStart}
                  onChange={(e) => setOutputStart(e.target.value as any)}
                />
                <p className='text-xs text-gray-500 mt-1'>Starting output token symbol</p>
              </div>

              <div>
                <div className='block text-sm font-medium text-gray-300 mb-2'>Volatility Percentage</div>
                <input
                  className='w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200'
                  placeholder='0.3'
                  step='0.01'
                  type='number'
                  value={volatilityPercentage}
                  onChange={(e) => setVolatilityPercentage(e.target.value as any)}
                />
                <p className='text-xs text-gray-500 mt-1'>Expected ETH price decline percentage</p>
              </div>

              <div>
                <div className='block text-sm font-medium text-gray-300 mb-2'>Transaction Fee (%)</div>
                <input
                  className='w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200'
                  placeholder='0.15'
                  step='0.01'
                  type='number'
                  value={affiliate}
                  onChange={(e) => setAffiliate(e.target.value as any)}
                />
                <p className='text-xs text-gray-500 mt-1'>Affiliate fee percentage</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className='flex gap-4 mt-8'>
              <button
                className='flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium py-3 px-6 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl'
                onClick={() => setStartData(!startData)}
              >
                🚀 Analyze Swaps
              </button>
              <button
                className='flex-1 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-medium py-3 px-6 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl'
                onClick={() => setShowIsSwap(!showIsSwap)}
              >
                {showIsSwap ? `📊 Show All (${arrData.length})` : `✨ Show Swaps (${arrSwapFilter.length})`}
              </button>
            </div>

            {/* Swap Indicators */}
            {arrSwapFilter.length > 0 && (
              <div className='mt-6 p-4 bg-green-900/30 border border-green-700/50 rounded-lg'>
                <h3 className='text-sm font-medium text-green-400 mb-2'>Successful Swaps Found</h3>
                <div className='gap-2'>
                  {arrData.map((e, index) => {
                    if (!e?.isSwap) return null

                    return (
                      <div key={index} className='px-2 py-1 bg-green-700/50 text-green-300 rounded text-xs font-medium'>
                        {index + 1}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Results Panel */}
          <div className='bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50 shadow-2xl'>
            <div className='flex items-center justify-between mb-6'>
              <h2 className='text-xl font-semibold flex items-center gap-2'>
                <div className='w-2 h-2 bg-green-500 rounded-full' />
                Results Analysis
              </h2>
              <div className='px-3 py-1 bg-blue-900/50 border border-blue-700/50 rounded-full text-xs font-medium text-blue-300'>
                Version {version.toUpperCase()}
              </div>
            </div>

            <div className='max-h-[85vh] overflow-y-auto space-y-4 custom-scrollbar'>
              {arrData.length === 0 ? (
                <div className='text-center py-12'>
                  <div className='w-16 h-16 mx-auto mb-4 bg-gray-700 rounded-full flex items-center justify-center'>
                    <svg className='w-8 h-8 text-gray-500' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path
                        d='M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z'
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                      />
                    </svg>
                  </div>
                  <p className='text-gray-400'>No data loaded yet</p>
                  <p className='text-gray-500 text-sm mt-1'>Upload a file to start analyzing</p>
                </div>
              ) : (
                arrData.map((item, index) => {
                  if (!item.isSwap && showIsSwap) return null

                  return (
                    <div
                      key={index}
                      className='bg-gray-700/30 border border-gray-600/50 rounded-xl p-5 hover:bg-gray-700/50 transition-all duration-200'
                    >
                      {/* Item Header */}
                      <div className='flex items-center justify-between mb-4'>
                        <div className='flex items-center gap-3'>
                          <div className={`w-3 h-3 rounded-full ${item.isSwap ? 'bg-green-500' : 'bg-gray-500'}`} />
                          <h3 className='font-semibold text-lg'>Item #{index + 1}</h3>
                          {item.isSwap && (
                            <span className='px-2 py-1 bg-green-900/50 border border-green-700/50 text-green-300 rounded-md text-xs font-medium'>
                              SWAP
                            </span>
                          )}
                        </div>
                        <div className='text-sm text-gray-400'>{item.time ? new Date(item.time).toLocaleString() : 'N/A'}</div>
                      </div>

                      {/* Swap Results */}
                      {Object.entries(item).map(([key, value]) => {
                        if (key?.startsWith('est_')) {
                          let valueFormat: any = BigNumber(value as any)
                            .decimalPlaces(8, BigNumber.ROUND_DOWN)
                            .toString()

                          if (isNaN(valueFormat as any) || valueFormat === 'NaN') {
                            valueFormat = value
                          }

                          const tokenSymbol = key.replace('est_', '')

                          return (
                            <div key={key} className='mb-4 p-3 bg-blue-900/30 border border-blue-700/50 rounded-lg'>
                              <div className='grid grid-cols-2 gap-4'>
                                <div>
                                  <span className='text-sm text-gray-400'>Estimated Amount</span>
                                  <div className='text-lg font-mono text-blue-300'>{valueFormat}</div>
                                </div>
                                <div>
                                  <span className='text-sm text-gray-400'>Output Token</span>
                                  <div className='text-lg font-semibold text-blue-400'>{tokenSymbol}</div>
                                </div>
                              </div>
                            </div>
                          )
                        }

                        return null
                      })}

                      {/* Token Details */}
                      <div className='border-t border-gray-600/50 pt-4'>
                        <h4 className='text-sm font-medium text-gray-300 mb-3'>Token Details</h4>
                        <div className='grid gap-3'>
                          {item.arrToken?.map((token, tokenIndex) => (
                            <div key={tokenIndex} className='bg-gray-800/50 rounded-lg p-3'>
                              <div className='flex items-center justify-between mb-2'>
                                <span className='font-semibold text-white'>{token.symbol}</span>
                                <span className='text-sm text-gray-400'>Price: ${token.price?.toLocaleString()}</span>
                              </div>

                              <div className='grid grid-cols-2 gap-4 text-xs'>
                                <div>
                                  <span className='text-gray-400'>Per ETH:</span>
                                  <span className='ml-2 font-mono text-yellow-400'>{formatNumberToShow(token.perETH)}</span>
                                </div>
                                <div>
                                  <span className='text-gray-400'>Change %:</span>
                                  <span className={`ml-2 font-mono ${Number(token.perETHChangePercentage) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                    {Number(token.perETHChangePercentage) >= 0 ? '+' : ''}
                                    {formatNumberToShow(token.perETHChangePercentage)}%
                                  </span>
                                </div>

                                {/* V4 specific fields */}
                                {version === 'v4' && token.changeByPoint && (
                                  <>
                                    <div>
                                      <span className='text-gray-400'>Point Change:</span>
                                      <span className='ml-2 font-mono text-purple-400'>{formatNumberToShow(token.changeByPoint)}</span>
                                    </div>
                                    <div>
                                      <span className='text-gray-400'>Point After:</span>
                                      <span className='ml-2 font-mono text-cyan-400'>{formatNumberToShow(token.pointAfterCheck)}</span>
                                    </div>
                                  </>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
