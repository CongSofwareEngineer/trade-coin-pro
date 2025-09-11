'use client'
import { useEffect, useRef, useState } from 'react'
import { read, utils } from 'xlsx'
import { BigNumber } from 'bignumber.js'

import { deepClone } from '..'

import { ETHLastSwapTemp, PoolToken, Token } from '@/types/app'

const amountMaxReceived = 2000000000000000

const KEY_STORAGE = {
  perETHOriginal: 'perETHOriginal',
  ETHLastSwapTemp: 'ETHLastSwapTemp',
  ETHLastSwap: 'ETHLastSwap',
  amountInput: 'amountInput',
  outputSwapTemp: 'outputSwapTemp',
  outputSwap: 'outputSwap',
}
const saveDataLocal = (key: string, value: any) => {
  localStorage.setItem(key, JSON.stringify(value))
}

const getDataLocal = (key: string) => {
  const data = localStorage.getItem(key)

  return data ? JSON.parse(data) : null
}

export default function Home() {
  const arrCloneRef = useRef<PoolToken[]>([])
  const arrCloneDefaultRef = useRef<PoolToken[]>([])
  const indexCurrentRef = useRef(0)
  const [arrData, setArrData] = useState<PoolToken[]>([])
  const [amountStart, setAmountStart] = useState<number>(2)
  const [outputStart, setOutputStart] = useState<string>('BNB')
  const [volatilityPercentage, setVolatilityPercentage] = useState<number>(0.3)
  const [affiliate, setAffiliate] = useState<number>(0.4)
  const [isUpload, setIsUpload] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [fileImport, setFileImport] = useState<any>(null)
  const [startData, setStartData] = useState(false)
  const [arrSwapFilter, setArrSwapFilter] = useState<PoolToken[]>([])
  const [showIsSwap, setShowIsSwap] = useState(false)

  const getTokenMinChangePercentage = (poolToken: PoolToken): Token => {
    const minChangePercentage = poolToken.arrToken!.reduce((min, token) => {
      return BigNumber(min).lt(token.perETHChangePercentage!) ? min : token.perETHChangePercentage!
    }, poolToken.arrToken![0].perETHChangePercentage!)

    const token = poolToken.arrToken!.find((token) => {
      return BigNumber(minChangePercentage).isEqualTo(token.perETHChangePercentage!)
    })!

    return token
  }

  // const getEstETH = (token: Token, amount: string) => {
  //   const poolToken = arrCloneRef.current[indexCurrentRef.current]

  //   // if (outputStart !== 'ETH') {
  //   //   const tokenOutput = poolToken.arrToken!.find((e) => {
  //   //     return e.outPutSwap === token.outPutSwap
  //   //   })!

  //   //   return BigNumber(amount).multipliedBy(poolToken.eth?.price!).dividedBy(tokenOutput.price!).toFixed()
  //   // }

  //   return amount
  // }

  const checkToSwap = async (tokenOutput: Token) => {
    let isSwap = false
    let isStopAll = false

    let amountInput = getDataLocal(KEY_STORAGE.amountInput) as string
    let ETHLastSwap = getDataLocal(KEY_STORAGE.ETHLastSwap) as ETHLastSwapTemp
    let ETHLastSwapTemp = getDataLocal(KEY_STORAGE.ETHLastSwapTemp) as ETHLastSwapTemp
    let perETHOriginal = getDataLocal(KEY_STORAGE.perETHOriginal) as ETHLastSwapTemp
    let outputSwap = getDataLocal(KEY_STORAGE.outputSwap) as string
    let outputSwapTemp = getDataLocal(KEY_STORAGE.outputSwapTemp) as string

    const poolToken = arrCloneRef.current[indexCurrentRef.current]
    // const tokenInputDefault = poolToken.arrToken!.find((e) => {
    //   return e.symbol === outputStart
    // })

    // const tokenETH = poolToken.arrToken!.find((e) => {
    //   return e.symbol === 'ETH'
    // })

    const tokenInput: Token = poolToken.arrToken!.find((e) => {
      if (e.symbol === outputSwap) {
        return e
      }
    })!
    const tokenInputStart: Token = poolToken.arrToken!.find((e) => {
      if (e.symbol === outputStart) {
        return e
      }
    })!

    const ETHOriginalAmount = amountStart

    if (
      outputSwapTemp !== tokenOutput.symbol &&
      Number(tokenOutput.perETHChangePercentage!) < BigNumber(BigNumber(volatilityPercentage).dividedBy(100)).multipliedBy(-1).toNumber()
    ) {
      console.log(`=================== Item ${indexCurrentRef.current + 1} ==================`)

      console.log('step 1')

      if (tokenOutput!.symbol === 'ETH') {
        const indexBTC = poolToken.arrToken!.findIndex((e) => {
          return e.symbol === 'BTC'
        })

        if (indexBTC !== -1) {
          console.log(`update ETHLastSwapTemp BTC = ${poolToken.arrToken![indexBTC].perETH}`)
          ETHLastSwapTemp[poolToken.arrToken![indexBTC]!.symbol!] = poolToken.arrToken![indexBTC].perETH!
        }
      } else {
        console.log(`update ETHLastSwapTemp ${tokenOutput.symbol} = ${tokenOutput.perETH}`)
        ETHLastSwapTemp[tokenOutput.symbol!] = tokenOutput.perETH!
      }

      console.log(`update outputSwapTemp = ${tokenOutput.symbol}`)

      outputSwapTemp = tokenOutput.symbol!
      console.log({ outputSwap, tokenOutput, tokenInput, amountInput })

      if (outputSwap !== tokenOutput.symbol) {
        const amountOutCheck = BigNumber(amountInput!).multipliedBy(tokenInput?.price!).dividedBy(tokenInputStart?.price!).toFixed()

        //(SwapInputTokenAmount * (1 - AFFILIATE_FEE_PERENT))* SwapInputTokenPrice) / ETHPrice của giờ đó
        const amountOut = BigNumber(amountInput!)
          .multipliedBy(BigNumber(1).minus(BigNumber(affiliate).dividedBy(100)))
          .multipliedBy(tokenInput?.price!)
          .dividedBy(tokenOutput.price!)
          .toFixed()

        console.log('step 2')
        console.log({ amountOutCheck, ETHOriginalAmount, amountOut })

        if (tokenOutput?.symbol === 'ETH' || tokenOutput?.symbol === 'BTC') {
          const tokenBTC = poolToken.arrToken!.find((token) => {
            if (token.symbol === 'BTC') {
              return token
            }
          })

          console.log('step 3 token ETH or BTC')
          console.log({ ETHLastSwap: deepClone(ETHLastSwap), tokenBTC })

          if (BigNumber(tokenBTC?.perETH!).gt(ETHLastSwap[tokenBTC!.symbol!])) {
            console.log('step 4')
            console.log({ ETHLastSwapTemp: deepClone(ETHLastSwapTemp), perETHOriginal: deepClone(perETHOriginal), tokenOutput })

            // (SwapInputTokenAmount * SwapInputTokenPrice) / ETHPrice của giờ đó
            // So sánh con số này với ETHOriginalAmount
            //(SwapInputTokenAmount * SwapInputTokenPrice)/ ETHPrice của giờ đó => đem so sánh với ETHOriginalAmount
            if (BigNumber(amountOutCheck).gte(ETHOriginalAmount)) {
              console.log('step 4.1')

              if (BigNumber(ETHLastSwapTemp[tokenBTC!.symbol!]).gte(perETHOriginal[tokenBTC!.symbol!])) {
                amountInput = amountOut
                outputSwap = tokenOutput?.symbol!
                isSwap = true
                arrCloneRef.current[indexCurrentRef.current].outputSwap = tokenOutput.symbol!
              }
            }
          }

          console.log(`update ETHLastSwap ${tokenInput!.symbol} = ${ETHLastSwapTemp[tokenInput!.symbol!]}`)
          console.log(`update ETHLastSwap ${tokenBTC!.symbol} = ${ETHLastSwapTemp[tokenBTC!.symbol!]}`)
          ETHLastSwap[tokenInput!.symbol!] = ETHLastSwapTemp[tokenInput!.symbol!]
          ETHLastSwap[tokenBTC!.symbol!] = ETHLastSwapTemp[tokenBTC!.symbol!]
        } else {
          console.log('step 5 token other')
          console.log({ ETHLastSwap: deepClone(ETHLastSwap), tokenOutput })
          if (BigNumber(tokenOutput?.perETH!).gte(ETHLastSwap[tokenOutput?.symbol!]!)) {
            console.log('step 6')
            console.log({ ETHLastSwapTemp: deepClone(ETHLastSwapTemp), perETHOriginal: deepClone(perETHOriginal), tokenOutput })

            // (SwapInputTokenAmount * SwapInputTokenPrice) / ETHPrice của giờ đó
            // So sánh con số này với ETHOriginalAmount
            //(SwapInputTokenAmount * SwapInputTokenPrice)/ ETHPrice của giờ đó => đem so sánh với ETHOriginalAmount
            if (BigNumber(amountOutCheck).gte(ETHOriginalAmount)) {
              console.log('step 6.1')
              if (BigNumber(ETHLastSwapTemp[tokenOutput!.symbol!]).gte(perETHOriginal[tokenOutput!.symbol!])) {
                outputSwap = tokenOutput?.symbol!
                amountInput = amountOut
                isSwap = true
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

  const calculateData = async () => {
    try {
      const poolTrade = arrCloneRef.current[indexCurrentRef.current]

      if (indexCurrentRef.current > 0) {
        const tokenMinChangePercentage = getTokenMinChangePercentage(poolTrade)

        const res = await checkToSwap(tokenMinChangePercentage)

        saveDataLocal(KEY_STORAGE.amountInput, res.amountInput)
        saveDataLocal(KEY_STORAGE.perETHOriginal, res.perETHOriginal)
        saveDataLocal(KEY_STORAGE.ETHLastSwapTemp, res.ETHLastSwapTemp)
        saveDataLocal(KEY_STORAGE.ETHLastSwap, res.ETHLastSwap)
        saveDataLocal(KEY_STORAGE.outputSwapTemp, res.outputSwapTemp)
        saveDataLocal(KEY_STORAGE.outputSwap, res.outputSwap)
        poolTrade.isSwap = res.isSwap
      }

      arrCloneRef.current[indexCurrentRef.current] = poolTrade
      if (indexCurrentRef.current < arrCloneRef.current.length - 1) {
        indexCurrentRef.current++

        await calculateData()
      } else {
        return
      }
    } catch (error) {
      console.log({ errorIndexcalculateData: indexCurrentRef.current, error })
    }
  }

  const initData = (index = 0) => {
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
            token.perETHChangePercentage = BigNumber(BigNumber(token!.price!).minus(tokenPre?.price!)).dividedBy(tokenPre!.price!).toFixed()
          } else {
            token.perETH = BigNumber(token!.price!).dividedBy(tokenETH!.price!).toFixed()

            token.perETHChangePercentage = BigNumber(BigNumber(token.perETH!).minus(tokenPre.perETH!)).dividedBy(tokenPre.perETH!).toFixed()
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
          if (token.symbol === outputStart) {
            // if (isETH) {
            //   perETHOriginal[token.symbol!] = token.perETH
            // } else {
            //   perETHOriginal[token.symbol!] = BigNumber(amountStart).multipliedBy(token!.price!).dividedBy(tokenETH!.price!).toFixed()
            // }
            perETHOriginal[token.symbol!] = amountStart
          } else {
            perETHOriginal[token.symbol!] = 0
          }

          saveDataLocal(KEY_STORAGE.ETHLastSwap, ETHLastSwap)
          saveDataLocal(KEY_STORAGE.ETHLastSwapTemp, ETHLastSwapTemp)
          saveDataLocal(KEY_STORAGE.perETHOriginal, perETHOriginal)

          poolTrade.arrToken![index] = token
        })
      }

      arrCloneRef.current[index] = poolTrade
      if (index < arrCloneRef.current.length - 1) {
        initData(index + 1)
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

  console.log({ amountStart, outputStart })

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
    initData()
    setTimeout(async () => {
      await calculateData()
      setArrData(arrCloneRef.current)
      filterSwap()
      console.log({ arrFinal: arrCloneRef.current, amountInput: getDataLocal(KEY_STORAGE.amountInput) })
    }, 500)
  }

  const formatData = (data: any[] = []): PoolToken[] => {
    console.log({ data })

    function excelDateToJSDate(serial: number) {
      try {
        const excelEpoch = new Date(Date.UTC(1899, 11, 30)) // dùng UTC để cố định
        const utcDays = Math.floor(serial)
        const msInDay = 24 * 60 * 60 * 1000

        // số mili-giây thêm vào (bao gồm cả phần ngày + phần giờ)
        const date = new Date(excelEpoch.getTime() + serial * msInDay)

        return date.toISOString()
      } catch (error) {
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
            // outPutSwap: key,
            // address: '0x' + key,
          })
        }
      })

      return poolToken
    })

    return arrData
  }

  useEffect(() => {
    console.log({ arrData })
    if (isUpload) {
      rollUpData()

      // try {
      //   callData(DATA_FAKE as any, userConfig, configTemp)
      // } catch (error) {
      //   console.log({ error })
      // }
    }
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
      reader.onerror = (error) => {}
      reader.readAsArrayBuffer(file)

      // const wb = read(ab)
    } catch (error) {
      console.log({ error })
    }
  }

  return (
    <section className='w-full h-full grid md:grid-cols-2 grid-cols-1 gap-10 p-5'>
      <div className='flex flex-col gap-5 w-full'>
        <div>
          <div>Upload file:</div>
          <div
            className='flex px-2 cursor-pointer border-[1px] !border-gray-500 rounded-[4px] items-center p-0'
            style={{
              opacity: isUploading ? 0.5 : 1,
            }}
          >
            <input
              accept='.xlsx,.xls'
              className='w-full cursor-pointer  p-2'
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
            {isUploading && (
              <div className='animate-spin'>
                <svg className='w-6 h-6' fill='none' stroke='currentColor' strokeWidth={1.5} viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg'>
                  <path
                    d='M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99'
                    strokeLinecap='round'
                    strokeLinejoin='round'
                  />
                </svg>
              </div>
            )}
            {isUpload && (
              <div
                style={{
                  opacity: isUploading ? 0.5 : 1,
                }}
                onClick={() => {
                  setFileImport('')
                  setIsUpload(false)
                  arrCloneRef.current = []
                  arrCloneDefaultRef.current = []
                  setArrData([])
                }}
              >
                Clear
              </div>
            )}
          </div>
        </div>
        <div>
          <div>ETHOriginalAmount (số Token đầu vào mà user bỏ vào):</div>
          <input
            className='w-full border-[1px] !border-gray-500 rounded-[4px] p-2'
            value={amountStart}
            onChange={(e) => setAmountStart(e.target.value as any)}
          />
        </div>
        <div>
          <div>Out token ban đầu</div>
          <input
            className='w-full border-[1px] !border-gray-500 rounded-[4px] p-2'
            value={outputStart}
            onChange={(e) => setOutputStart(e.target.value as any)}
          />
        </div>
        <div>
          <div>VolatilityPercentage (Con số % trung bình giá ETH sẽ giảm mà user dự đoán):</div>
          <input
            className='w-full border-[1px] !border-gray-500 rounded-[4px] p-2'
            value={volatilityPercentage}
            onChange={(e) => setVolatilityPercentage(e.target.value as any)}
          />
        </div>
        <div>
          <div>Fee transaction (BNB) :</div>
          <input
            className='w-full border-[1px] !border-gray-500 rounded-[4px] p-2'
            value={affiliate}
            onChange={(e) => setAffiliate(e.target.value as any)}
          />
        </div>
        <div className='flex justify-between gap-5'>
          <button
            className='cursor-pointer hover:bg-gray-800 rounded-[4px] p-2'
            onClick={() => {
              setStartData(!startData)
            }}
          >
            <div>Get to check swap</div>
          </button>
          <button
            className='cursor-pointer hover:bg-gray-800 rounded-[4px] p-2'
            onClick={() => {
              setShowIsSwap(!showIsSwap)
            }}
          >
            <div>{showIsSwap ? `Show full (${arrData.length})` : `Show is swap (${arrSwapFilter.length})`} </div>
          </button>
        </div>
        {/* <ShowCode /> */}
        <div className=' gap-3 flex-wrap'>
          {arrData.map((e, index) => {
            if (!e?.isSwap) {
              return null
            }

            return (
              <div key={index} className=' px-2 rounded-[4px]'>
                {index + 1}
              </div>
            )
          })}
        </div>
      </div>

      <div className='flex flex-col gap-4 w-full'>
        <div>Danh sách kết quả</div>
        {arrData.map((item, index) => {
          if (!item.isSwap && showIsSwap) {
            return null
          }

          return (
            <div key={index} className='w-full flex flex-col gap-2'>
              <div>
                Item {index + 1} - Time {item.time}.
              </div>
              <div>
                est {outputStart} : {item[`est${outputStart}`]?.toString()}.
              </div>
              <div>output Token :{item.outputSwap}.</div>

              <div>List token</div>
              <div className='flex flex-col gap-3'>
                {item.arrToken?.map((token, index) => {
                  return (
                    <div key={index} className='w-full pl-4 flex flex-col '>
                      {Object.entries(token).map(([key, value]) => {
                        if (key === 'outPutSwap' || key === 'address') {
                          return null
                        }

                        return (
                          <div key={key}>
                            {key}: {value}
                          </div>
                        )
                      })}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
