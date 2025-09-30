'use client'
import React, { useState } from 'react'
import { read, utils } from 'xlsx'
import { BigNumber } from 'bignumber.js'

import { History, DcaTokenConfig, Token } from './type'

import { deepClone } from '@/index'
const LOCAL_STORAGE_KEY = {
  TOKEN_INPUT: 'token_input',
}
const DCA = () => {
  const [dcaConfig, setDcaConfig] = useState<DcaTokenConfig>({
    stepSize: '50',
    slippageTolerance: 0.5,
    maxPrice: '3500',
    minPrice: '2000',
    initialCapital: '5000',
    isStop: false,
    // ratioPriceDrop: 4, //5%

    // priceBuyHistory: '3500',
    tokenInput: 'ETH',
    amountUSD: '0',
  })

  console.log({ dcaConfig })

  const [isUpload, setIsUpload] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [listPriceTokens, setListPriceTokens] = useState<Token[]>([])
  const [fileImport, setFileImport] = useState<any>(null)
  const [result, setResult] = useState<any>({})

  const updateData = (data: Partial<DcaTokenConfig>) => {
    setDcaConfig((prev) => ({ ...prev, ...data }))
  }

  // const checkToBuy = (item: History, config: DcaTokenConfig) => {
  //   let itemFinal = deepClone(item as History)
  //   let configFinal = deepClone(config as DcaTokenConfig)
  //   let isStop = false
  //   let amountETH = '0'
  //   const token = item.arrToken.find((i) => i.tokenSymbol === config.tokenInput)!

  //   const ratioPriceDrop = BigNumber(1).minus(BigNumber(token.price).dividedBy(configFinal.priceBuyHistory)).abs().toNumber()

  //   const amountUSD = BigNumber(ratioPriceDrop).multipliedBy(configFinal.stepSize).toFixed()

  //   amountETH = BigNumber(amountUSD).dividedBy(token.price).toFixed()

  //   if (BigNumber(token.price).isLessThanOrEqualTo(configFinal.maxPrice)) {
  //     console.log({ ratioPriceDrop, amountUSD, amountETH, configFinal, token })

  //     if (BigNumber(token.price).isLessThan(configFinal.priceBuyHistory)) {
  //       if (BigNumber(config.initialCapital).isLessThan(config.amountUSD)) {
  //         isStop = true
  //         itemFinal.isBuy = true
  //         itemFinal.buyAmount = amountUSD
  //         itemFinal.buyAmountETH = amountETH
  //         configFinal.amountUSD = BigNumber(configFinal.amountUSD || 0)
  //           .plus(amountUSD)
  //           .toFixed()
  //       } else {
  //         if (ratioPriceDrop >= configFinal.ratioPriceDrop / 100) {
  //           itemFinal.isBuy = true
  //           itemFinal.buyAmount = amountUSD
  //           itemFinal.buyAmountETH = amountETH
  //           configFinal.amountUSD = BigNumber(configFinal.amountUSD || 0)
  //             .plus(amountUSD)
  //             .toFixed()
  //         }
  //       }
  //     }
  //     configFinal.priceBuyHistory = token.price.toString()
  //   }

  //   return { item: itemFinal, config: configFinal, isStop }
  // }

  const checkToBuyByPrice = (item: History, config: DcaTokenConfig) => {
    let itemFinal = deepClone(item as History)
    let configFinal = deepClone(config as DcaTokenConfig)
    let isStop = false
    let amountETH = '0'
    const token = item.arrToken.find((i) => i.tokenSymbol === config.tokenInput)!

    const rangePrice = BigNumber(config.maxPrice).minus(config.minPrice)

    const ratePriceDrop = BigNumber(1).minus(BigNumber(token.price).dividedBy(rangePrice)).multipliedBy(config.stepSize).abs().toFixed()
    let amountUSD = BigNumber(ratePriceDrop).multipliedBy(config.stepSize).dividedBy(100).toFixed()

    amountETH = BigNumber(amountUSD)
      .dividedBy(token.price)
      .multipliedBy(BigNumber(100 - config.slippageTolerance).dividedBy(100))
      .toFixed()

    //nếu số tền còn lại < số tiền mua thì dừng lại
    if (BigNumber(token.price).isLessThanOrEqualTo(configFinal.maxPrice)) {
      if (BigNumber(config.initialCapital).isLessThan(config.amountUSD)) {
        amountUSD = BigNumber(config.initialCapital).minus(config.amountUSD).toFixed()
        amountETH = BigNumber(amountUSD)
          .dividedBy(token.price)
          .multipliedBy(BigNumber(100 - config.slippageTolerance).dividedBy(100))
          .toFixed()

        console.log('step 3')

        isStop = true

        itemFinal.isBuy = true
        itemFinal.buyAmount = amountUSD
        itemFinal.buyAmountETH = amountETH
        configFinal.amountUSD = BigNumber(configFinal.amountUSD || 0)
          .plus(amountUSD)
          .toFixed()
      } else {
        itemFinal.isBuy = true
        itemFinal.buyAmountETH = amountETH
        itemFinal.buyAmount = amountUSD

        configFinal.amountUSD = BigNumber(configFinal.amountUSD || 0)
          .plus(amountUSD)
          .toFixed()
      }
    }

    return { item: itemFinal, config: configFinal, isStop }
  }

  const checkData = (data: History[] = []) => {
    let arrClone = deepClone(data) as History[]
    let configClone = deepClone(dcaConfig) as DcaTokenConfig
    let isStop = false
    let indexStop = -1
    let amountETHToBuy = '0'
    let minPrice = arrClone[0].arrToken[0].price.toString()
    let maxPrice = arrClone[0].arrToken[0].price.toString()

    let amountSwapped = 0

    arrClone.forEach((item, index) => {
      if (!isStop) {
        if (BigNumber(minPrice).gt(item.arrToken[0].price)) {
          minPrice = item.arrToken[0].price.toString()
        }

        if (BigNumber(maxPrice).lt(item.arrToken[0].price)) {
          maxPrice = item.arrToken[0].price.toString()
        }
        const res = checkToBuyByPrice(item, configClone)

        isStop = res.isStop
        arrClone[index] = res.item
        configClone = res.config
        arrClone[index].isStop = res.isStop
        if (res.isStop) {
          indexStop = index
        }
        if (res.item.isBuy) {
          amountETHToBuy = BigNumber(amountETHToBuy).plus(res.item.buyAmountETH!).toFixed()
          amountSwapped++
        }
      }
    })
    const arrBuy = arrClone.filter((i) => i.isBuy)
    const result = {
      minPrice,
      maxPrice,
      total: arrClone.length,
      amountSwapped,
      totalAmountUSD: configClone.amountUSD,
      totalETHBought: amountETHToBuy,
      priceAverage: BigNumber(configClone.amountUSD).dividedBy(amountETHToBuy).toFixed(4),
    }

    setResult(result)

    console.log({ minPrice, arrClone, arrBuy, indexStop, configClone, amountETHToBuy, result })
  }

  const importData = async (file: File) => {
    try {
      const formatData = (data: any[] = []): History[] => {
        return data.map((item) => {
          return {
            arrToken: [
              {
                price: item[dcaConfig.tokenInput],
                tokenSymbol: dcaConfig.tokenInput,
              },
            ],
          }
        })
      }

      setIsUploading(true)
      const reader = new FileReader()

      reader.onload = async (item) => {
        const dataFile = item.target?.result as string

        const wb = read(dataFile)
        const ws = wb.Sheets[wb.SheetNames[0]] // get the first worksheet
        let data: any[] = utils.sheet_to_json(ws) // generate objects

        data = formatData(data)
        console.log({ data })
        checkData(data)

        // data.shift()
        // data.pop()

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
                  setResult({})
                  setIsUpload(false)
                  setFileImport('')
                  setListPriceTokens([])
                }}
              >
                Clear
              </div>
            )}
          </div>
        </div>
        <div>
          <div>Số USDT ban đầu:</div>
          <input
            className='w-full border-[1px] !border-gray-500 rounded-[4px] p-2'
            value={dcaConfig.initialCapital}
            onChange={(e) => updateData({ initialCapital: e.target.value as any })}
          />
        </div>
        <div>
          <div>Token muốn mua </div>
          <input
            className='w-full border-[1px] !border-gray-500 rounded-[4px] p-2'
            value={dcaConfig.tokenInput}
            onChange={(e) => updateData({ tokenInput: e.target.value as any })}
          />
        </div>
        <div>
          <div>Số tiền (USDT) bỏ ra để mua mỗi lần </div>
          <input
            className='w-full border-[1px] !border-gray-500 rounded-[4px] p-2'
            value={dcaConfig.stepSize}
            onChange={(e) => updateData({ stepSize: e.target.value as any })}
          />
        </div>

        {/* <div>
          <div>% giá giảm </div>
          <input
            className='w-full border-[1px] !border-gray-500 rounded-[4px] p-2'
            value={dcaConfig.ratioPriceDrop}
            onChange={(e) => updateData({ ratioPriceDrop: e.target.value as any })}
          />
        </div> */}
        {/* 
        <div>
          <div>% giá tăng </div>
          <input
            className='w-full border-[1px] !border-gray-500 rounded-[4px] p-2'
            value={dcaConfig.ratioPriceUp}
            onChange={(e) => updateData({ ratioPriceUp: e.target.value as any })}
          />
        </div> */}

        <div>
          <div>% trượt giá </div>
          <input
            className='w-full border-[1px] !border-gray-500 rounded-[4px] p-2'
            value={dcaConfig.slippageTolerance}
            onChange={(e) => updateData({ slippageTolerance: e.target.value as any })}
          />
        </div>

        <div>
          <div>Giá bắt đầu DCA:</div>
          <input
            className='w-full border-[1px] !border-gray-500 rounded-[4px] p-2'
            value={dcaConfig.maxPrice}
            onChange={(e) =>
              updateData({
                maxPrice: e.target.value as any,
                // priceBuyHistory: e.target.value as any,
              })
            }
          />
        </div>
        <div>
          <div>Giá thấp nhất:</div>
          <input
            className='w-full border-[1px] !border-gray-500 rounded-[4px] p-2'
            value={dcaConfig.minPrice}
            onChange={(e) => updateData({ minPrice: e.target.value as any })}
          />
        </div>
      </div>
      <div className='flex flex-col gap-5 w-full'>
        {Object.keys(result).length > 0 && (
          <>
            <div>Kết quả:</div>
            <div className='flex flex-col gap-3'>
              <div>Tổng số lấy giá: {result.total} </div>
              <div>Số lần đã mua: {result.amountSwapped} </div>
              <div>Tổng số tiền đã mua (USDT): {BigNumber(result.totalAmountUSD).toFixed(2)} </div>
              <div>
                Tổng số {dcaConfig.tokenInput} đã mua: {BigNumber(result.totalETHBought).decimalPlaces(6).toFixed()}{' '}
              </div>
              <div>Giá thấp nhất khi lấy giá: {BigNumber(result.minPrice).toFixed(4)} USDT</div>
              <div>Giá cao nhất khi lấy giá: {BigNumber(result.maxPrice).toFixed(4)} USDT</div>
              <div
                style={{
                  fontWeight: 'bold',
                  marginTop: 20,
                }}
              >
                Giá trung bình: {BigNumber(result.priceAverage).decimalPlaces(4).toFixed()} USDT
              </div>
            </div>
          </>
        )}
      </div>
    </section>
  )
}

export default DCA
