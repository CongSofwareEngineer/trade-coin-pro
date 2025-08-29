'use client'
import React, { useEffect, useRef, useState } from 'react'

import { ETHLastSwapTemp, PoolToken, Token } from '@/types/app'

const HomeScreen2 = () => {
  const perETHOriginalRef = useRef<ETHLastSwapTemp>({})
  const ETHLastSwapTempRef = useRef<ETHLastSwapTemp>({})
  const ETHLastSwapRef = useRef<ETHLastSwapTemp>({})
  const arrCloneRef = useRef<PoolToken[]>([])
  const arrCloneDefaultRef = useRef<PoolToken[]>([])
  const amountInputRef = useRef<string>('0')
  const outputSwapTempRef = useRef<string>('ETH')
  const outputSwapRef = useRef<string>('')
  const indexCurrentRef = useRef(0)
  const [arrData, setArrData] = useState<PoolToken[]>([])
  const [amountStart, setAmountStart] = useState<number>(1)
  const [amountMaxReceived, setAmountMaxReceived] = useState<number>(2000)
  const [volatilityPercentage, setVolatilityPercentage] = useState<number>(0.42)
  const [affiliate, setAffiliate] = useState<number>(0.1)
  const [isUpload, setIsUpload] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [fileImport, setFileImport] = useState<any>(null)
  const [startData, setStartData] = useState(false)
  const [arrSwapFilter, setArrSwapFilter] = useState<PoolToken[]>([])
  const [showIsSwap, setShowIsSwap] = useState(false)

  const updateToken = (token: Token) => {
    const poolToken = arrCloneRef.current[indexCurrentRef.current]

    if (poolToken.eth?.outPutSwap === token.outPutSwap) {
      poolToken.eth = token
    } else {
      poolToken.arrToken!.forEach((e, index) => {
        if (e.outPutSwap === token.outPutSwap) {
          poolToken.arrToken![index] = token
        }
      })
    }

    arrCloneRef.current[indexCurrentRef.current] = poolToken
  }

  const getTokenMinChangePercentage = (poolToken: PoolToken): Token => {
    let minChangePercentage = poolToken.eth!.perETHChangePercentage!

    poolToken.arrToken!.forEach((token) => {
      // if (Number(minChangePercentage) > Number(token.perETHChangePercentage!)) {
      if (BigNumber(minChangePercentage).gt(token.perETHChangePercentage!)) {
        minChangePercentage = token.perETHChangePercentage!
      }
    })

    let token = poolToken.arrToken!.find((token) => {
      return BigNumber(minChangePercentage).isEqualTo(token.perETHChangePercentage!)
    })

    if (BigNumber(minChangePercentage).isEqualTo(poolToken.eth!.perETHChangePercentage!)) {
      token = poolToken.eth
    }

    return token!
  }
  const filterSwap = () => {
    const arrSwap = arrCloneRef.current.filter((e) => {
      return e.isSwap
    })

    setArrSwapFilter(arrSwap)

    console.log({ arrSwap })
  }

  const rollUpData = async () => {
    amountInputRef.current = amountStart + ''
    if (arrCloneDefaultRef.current.length === 0) {
      arrCloneRef.current = arrCloneDefaultRef.current = JSON.parse(JSON.stringify(arrData))
    } else {
      arrCloneRef.current = JSON.parse(JSON.stringify(arrCloneDefaultRef.current))
    }
    indexCurrentRef.current = 0
    initData()
    setTimeout(async () => {
      await calculateData()
      setArrData(arrCloneRef.current)
      filterSwap()
      console.log({ arrFinal: arrCloneRef.current })
    }, 500)
  }

  useEffect(() => {
    console.log({ arrData })
    isUpload && rollUpData()
  }, [startData])

  return <div>HomeScreen2</div>
}

export default HomeScreen2
