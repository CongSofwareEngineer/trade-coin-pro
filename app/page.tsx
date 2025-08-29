'use client'
import { useEffect, useRef, useState } from 'react'
import { read, utils } from 'xlsx'
import { BigNumber } from 'bignumber.js'

import { ETHLastSwapTemp, PoolToken, Token } from '@/types/app'

export default function Home() {
  const perETHOriginalRef = useRef<ETHLastSwapTemp>({})
  const ETHLastSwapTempRef = useRef<ETHLastSwapTemp>({})
  const ETHLastSwapRef = useRef<ETHLastSwapTemp>({})
  const arrCloneRef = useRef<PoolToken[]>([])
  const arrCloneDefaultRef = useRef<PoolToken[]>([])
  const amountInputRef = useRef<string>('0')
  const outputSwapTempRef = useRef<string>('ETH')
  const outputSwapRef = useRef<string>('ETH')
  const indexCurrentRef = useRef(0)
  const [arrData, setArrData] = useState<PoolToken[]>([])
  const [amountStart, setAmountStart] = useState<number>(1)
  const [amountMaxReceived, setAmountMaxReceived] = useState<number>(20000000000000)
  const [volatilityPercentage, setVolatilityPercentage] = useState<number>(0.481)
  const [affiliate, setAffiliate] = useState<number>(0.18)
  const [isUpload, setIsUpload] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [fileImport, setFileImport] = useState<any>(null)
  const [startData, setStartData] = useState(false)
  const [arrSwapFilter, setArrSwapFilter] = useState<PoolToken[]>([])
  const [showIsSwap, setShowIsSwap] = useState(false)

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

  console.log({ ETHLastSwapTempRef: ETHLastSwapTempRef.current })

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

  const getEstETH = (toke: Token) => {
    const poolTrade = arrCloneRef.current[indexCurrentRef.current]
    const estETH = BigNumber(toke.perETH!).multipliedBy(amountInputRef.current).toFixed()

    console.log({ estETH })
  }

  const checkToSwap = async (token: Token) => {
    // console.log('calculateData', indexCurrentRef.current)

    const poolToken = arrCloneRef.current[indexCurrentRef.current]
    const poolTokenPre = arrCloneRef.current[indexCurrentRef.current - 1]

    let tokenInput: Token = poolToken.arrToken!.find((e) => {
      if (e.outPutSwap === outputSwapRef.current) {
        return token
      }
    })!

    let tokenInputPre: Token = poolTokenPre.arrToken!.find((e) => {
      if (e.outPutSwap === outputSwapTempRef.current) {
        return token
      }
    })!

    if (!tokenInput) {
      tokenInput = poolToken.eth!
    }

    if (!tokenInputPre) {
      tokenInputPre = poolTokenPre.eth!
    }

    //Nếu số MIN đó nhỏ hơn âm của VolatilityPercentage thì làm tiếp bước kế tiếp
    console.log(`======================Dòng ${indexCurrentRef.current + 1}======================`)
    console.log({
      tokenInputPre: tokenInputPre,
      tokenInput,
      token,
    })

    if (
      outputSwapTempRef.current !== token.outPutSwap &&
      Number(token.perETHChangePercentage!) < BigNumber(BigNumber(volatilityPercentage).dividedBy(100)).multipliedBy(-1).toNumber()
    ) {
      console.log('So sánh âm volatilityPercentage thành cong')

      //update ETHLastSwapTemp
      if (token!.outPutSwap === 'ETH') {
        const indexBTC = poolToken.arrToken!.findIndex((e) => {
          return e.outPutSwap === 'BTC'
        })

        if (indexBTC !== -1) {
          console.log({
            [`Update_ETHLastSwapTempRef_${poolToken.arrToken![indexBTC]!.outPutSwap!}`]: poolToken.arrToken![indexBTC].perETH!,
          })

          ETHLastSwapTempRef.current[poolToken.arrToken![indexBTC]!.outPutSwap!] = poolToken.arrToken![indexBTC].perETH!
        }
      } else {
        console.log({
          [`Update_ETHLastSwapTempRef_${token!.outPutSwap!}`]: token!.perETH!,
        })
        ETHLastSwapTempRef.current[token!.outPutSwap!] = token!.perETH!
      }

      console.log('update inputSwap (outputSwapTemp)', token.outPutSwap)
      console.log({
        outputSwapTemp: outputSwapTempRef.current,
        outputSwap: outputSwapRef.current,
      })

      outputSwapTempRef.current = token.outPutSwap!

      console.log('So sánh output và input phải khác nhau & SwapOutputToken khác "RỖNG"')
      if (outputSwapRef.current !== token?.outPutSwap) {
        //(SwapInputTokenAmount * SwapInputTokenPrice/ ETHPrice của giờ đó
        const amountOutCheck = BigNumber(amountInputRef.current!)
          // .multipliedBy(BigNumber(1).minus(BigNumber(affiliate).dividedBy(100)))
          .multipliedBy(tokenInput?.price!)
          .dividedBy(poolToken.eth?.price!)
          .toFixed()

        //(SwapInputTokenAmount * (1 - AFFILIATE_FEE_PERENT))* SwapInputTokenPrice) / ETHPrice của giờ đó
        const amountOut = BigNumber(amountInputRef.current!)
          .multipliedBy(BigNumber(1).minus(BigNumber(affiliate).dividedBy(100)))
          .multipliedBy(tokenInput?.price!)
          .dividedBy(token.price!)
          .toFixed()

        console.log({
          amountInputSwap: amountInputRef.current,
          tokenInput,
          amountOut,
          indexCurrentRef: indexCurrentRef.current,
          tokenOutPutSwap: token?.outPutSwap,
        })

        if (BigNumber(amountOut).gte(amountMaxReceived)) {
          console.log('So sánh khi vượt qua amountMaxReceived')

          //go to swap and finish
          amountInputRef.current = amountOut
          // token.perETHLastSwap = token?.perETH
          arrCloneRef.current[indexCurrentRef.current].isSwap = true

          updateToken(token)
          indexCurrentRef.current = arrCloneRef.current.length + 1
        } else {
          if (token?.outPutSwap === 'ETH' || token?.outPutSwap === 'BTC') {
            console.log('So khi đầu ra là ETH hay BTC')
            console.log({
              tokenInput: outputSwapTempRef.current,
              tokenOutput: token.outPutSwap,
            })

            const tokenBTC = poolToken.arrToken!.find((token) => {
              if (token.symbol === 'BTC') {
                return token
              }
            })

            console.log('So sanh perETH và perETHLastSwap')
            console.log({
              perETH: tokenBTC?.perETH,
              perETHLastSwap: ETHLastSwapRef.current[tokenBTC!.outPutSwap!],
              ETHLastSwapTempRef: ETHLastSwapTempRef.current[tokenBTC!.outPutSwap!],
            })

            if (BigNumber(tokenBTC?.perETH!).gt(ETHLastSwapRef.current[tokenBTC!.outPutSwap!])) {
              console.log('Tiến hành để swap  swap')
              console.log({
                amountOutCheck,
                amountStart,
                ETHLastSwapRef: ETHLastSwapRef.current[tokenBTC!.outPutSwap!],
                perETHOriginalRef: perETHOriginalRef.current[tokenBTC!.outPutSwap!],
              })
              //(SwapInputTokenAmount * SwapInputTokenPrice) / ETHPrice của giờ đó
              if (BigNumber(amountOutCheck).gte(amountStart)) {
                if (BigNumber(ETHLastSwapTempRef.current[tokenBTC!.outPutSwap!]).gte(perETHOriginalRef.current[tokenBTC!.outPutSwap!])) {
                  //go to swap and finish
                  amountInputRef.current = amountOut
                  outputSwapRef.current = token?.outPutSwap!
                  // tokenBTC!.perETHLastSwap = token?.perETH
                  arrCloneRef.current[indexCurrentRef.current].isSwap = true
                }

                getEstETH(tokenBTC!)
              }
            }

            console.log(`ETHLastSwap đã update: `, ETHLastSwapTempRef.current[tokenInput!.outPutSwap!])
            ETHLastSwapRef.current[tokenInput!.outPutSwap!] = ETHLastSwapTempRef.current[tokenInput!.outPutSwap!]
            ETHLastSwapRef.current[tokenBTC!.outPutSwap!] = ETHLastSwapTempRef.current[tokenBTC!.outPutSwap!]
            updateToken(tokenBTC!)
          } else {
            console.log({ ETHLastSwapTempRef: ETHLastSwapTempRef.current[token!.outPutSwap!] })
            console.log({ ETHLastSwapRef: ETHLastSwapRef.current[token!.outPutSwap!] })
            console.log({ perETH: token?.perETH })

            console.log('So sanh perETH và perETHLastSwap')
            console.log({
              perETH: token?.perETH,
              perETHLastSwap: ETHLastSwapRef.current[token!.outPutSwap!],
              ETHLastSwapTempRef: ETHLastSwapTempRef.current[token!.outPutSwap!],
            })

            console.log({ ETHLastSwapTempRef: ETHLastSwapTempRef.current[token!.outPutSwap!] })
            console.log({ ETHLastSwapRef: ETHLastSwapRef.current[token!.outPutSwap!] })
            console.log({ perETH: token?.perETH })
            //Nếu SwapOutputToken là BNB, SUI, NEAR,...
            if (BigNumber(token?.perETH!).gte(ETHLastSwapRef.current[token?.outPutSwap!]!)) {
              console.log('Tiến hành để swap  swap')
              console.log({
                amountOutCheck,
                amountStart,
                ETHLastSwapRef: ETHLastSwapRef.current[token!.outPutSwap!],
                perETHOriginalRef: perETHOriginalRef.current[token!.outPutSwap!],
              })
              //(SwapInputTokenAmount * SwapInputTokenPrice) / ETHPrice của giờ đó
              if (BigNumber(amountOutCheck).gte(amountStart)) {
                if (BigNumber(ETHLastSwapTempRef.current[token!.outPutSwap!]).gte(perETHOriginalRef.current[token!.outPutSwap!])) {
                  //go to swap and finish
                  outputSwapRef.current = outputSwapTempRef.current
                  amountInputRef.current = amountOut

                  // token.perETHLastSwap = token?.perETH
                  arrCloneRef.current[indexCurrentRef.current].isSwap = true
                }

                getEstETH(token)
              }
            }

            console.log(`ETHLastSwap đã update: `, ETHLastSwapTempRef.current[token!.outPutSwap!])

            ETHLastSwapRef.current[token!.outPutSwap!] = ETHLastSwapTempRef.current[token!.outPutSwap!]
            updateToken(token)
          }
        }
      }
    } else {
      // outputSwapTempRef.current = 'ETH'
    }
  }

  const calculateData = async () => {
    try {
      const poolTrade = arrCloneRef.current[indexCurrentRef.current]

      if (indexCurrentRef.current > 0) {
        const tokenMinChangePercentage = getTokenMinChangePercentage(poolTrade)

        await checkToSwap(tokenMinChangePercentage)
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

      if (index > 0) {
        const poolTradePre = arrCloneRef.current[index - 1]

        //get perETHChangePercentage
        poolTrade.eth!.perETHChangePercentage = BigNumber(BigNumber(poolTrade.eth!.price!).minus(poolTradePre.eth?.price!))
          .dividedBy(poolTradePre.eth!.price!)

          .toFixed()

        //get perETHChangePercentage in List token
        poolTrade.arrToken!.forEach((token, index) => {
          const tokenPre = poolTradePre.arrToken![index]

          token.perETH = BigNumber(token!.price!).dividedBy(poolTrade.eth!.price!).toFixed()
          token.perETHChangePercentage = BigNumber(BigNumber(token.perETH!).minus(tokenPre.perETH!)).dividedBy(tokenPre.perETH!).toFixed()

          poolTrade.arrToken![index] = token
        })
        // poolTrade.swapInputTokenAmount = poolTradePre.swapInputTokenAmount

        getTokenMinChangePercentage(poolTrade)
      } else {
        poolTrade.arrToken!.forEach((token, index) => {
          token.perETH = BigNumber(token!.price!).dividedBy(poolTrade.eth!.price!).toFixed()
          token.perETHChangePercentage = '0'

          ETHLastSwapRef.current[token!.outPutSwap!] = token.perETH
          ETHLastSwapTempRef.current[token.outPutSwap!] = token.perETH
          perETHOriginalRef.current[token.outPutSwap!] = token.perETH
          poolTrade.arrToken![index] = token
        })
        poolTrade.eth!.perETHChangePercentage = '0'

        ETHLastSwapRef.current[poolTrade.eth!.outPutSwap!] = poolTrade.eth!.perETH!
        ETHLastSwapTempRef.current[poolTrade.eth!.outPutSwap!] = poolTrade.eth!.perETH!
        outputSwapTempRef.current = 'ETH'
        perETHOriginalRef.current[poolTrade.eth!.outPutSwap!] = poolTrade.eth!.perETH!
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
        time: excelDateToJSDate((e['Time'] || e['Time.'] || e['time']) as number),
        eth: {
          perETH: '1',
          price: e.ETH as number,
          outPutSwap: 'ETH',
          address: '0xETH',
        },
        arrToken: [],
      }

      Object.entries(e).forEach(([key, value]) => {
        if (key !== 'ETH' && key !== 'Time' && key !== 'No.' && key !== 'Date' && key !== 'Time.') {
          poolToken.arrToken!.push({
            symbol: key,
            price: value as number,
            outPutSwap: key,
            address: '0x' + key,
          })
        }
      })

      return poolToken
    })

    return arrData
  }

  useEffect(() => {
    console.log({ arrData })
    isUpload && rollUpData()
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
          <div>ETHOriginalAmount (số ETH đầu vào mà user bỏ vào):</div>
          <input
            className='w-full border-[1px] !border-gray-500 rounded-[4px] p-2'
            value={amountStart}
            onChange={(e) => setAmountStart(e.target.value as any)}
          />
        </div>
        <div>
          <div>MaxETHExpected (Số lượng ETH mà user mong muốn sẽ nhận được sau quá trình):</div>
          <input
            className='w-full border-[1px] !border-gray-500 rounded-[4px] p-2'
            value={amountMaxReceived}
            onChange={(e) => setAmountMaxReceived(e.target.value as any)}
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
              <div className='flex flex-col gap-3'>
                <div key={index} className='w-full pl-4 flex flex-col '>
                  {Object.entries(item.eth!).map(([key, value]) => {
                    return (
                      <div key={key}>
                        {key}: {value}
                      </div>
                    )
                  })}
                </div>
              </div>
              <div>List token</div>
              <div className='flex flex-col gap-3'>
                {item.arrToken?.map((token, index) => {
                  return (
                    <div key={index} className='w-full pl-4 flex flex-col '>
                      {Object.entries(token).map(([key, value]) => {
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
