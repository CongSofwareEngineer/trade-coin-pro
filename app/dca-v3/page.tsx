'use client'
import React, { useState } from 'react'
import { read, utils } from 'xlsx'
import { BigNumber } from 'bignumber.js'

import { History, DcaTokenConfig, Token } from './type'
import { checkToBuyByPrice } from './hepers'

import { deepClone } from '@/index'

const DCA = () => {
  const [dcaConfig, setDcaConfig] = useState<DcaTokenConfig>({
    stepSize: '50',
    slippageTolerance: 2,
    maxPrice: '3000',
    minPrice: '1500',
    initialCapital: '5000',
    isStop: false,
    amountETHToBuy: '0',
    amountUSDToBuy: '0',
    ratioPriceUp: '3', //5%
    priceBuyHistory: '0',
    tokenInput: 'ETH',
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

  const checkData = (data: History[] = []) => {
    let arrClone = deepClone(data) as History[]
    let configClone = deepClone(dcaConfig) as DcaTokenConfig
    let isStop = false
    let indexStop = false
    let amountETHToBuy = '0'
    let minPrice = arrClone[0].arrToken[0].price.toString()
    let maxPrice = arrClone[0].arrToken[0].price.toString()

    let amountSwapped = 0
    let totalFee = 0
    const arrSwap: Number[] = []

    arrClone.forEach((item, index) => {
      if (!isStop) {
        if (BigNumber(minPrice).gt(item.arrToken[0].price)) {
          minPrice = item.arrToken[0].price.toString()
        }

        if (BigNumber(maxPrice).lt(item.arrToken[0].price)) {
          maxPrice = item.arrToken[0].price.toString()
        }
        const res = checkToBuyByPrice(item, configClone)

        configClone = res.config

        arrClone[index] = res.item

        if (res.item.isBuy) {
          amountSwapped++
          totalFee += 0.15
          arrSwap.push(index + 1)
        }
      }
    })
    setTimeout(() => {
      const arrSell = arrClone.map((e, index) => ({ ...e, index })).filter((i) => i.isSell)
      const arrBuy = arrClone.map((e, index) => ({ ...e, index })).filter((i) => i.isBuy)
      let aprUSD = BigNumber(configClone.initialCapital).minus(dcaConfig.initialCapital || 0)

      const priceAverage = BigNumber(configClone.amountUSDToBuy || '1').dividedBy(Number(configClone.amountETHToBuy) || '1')
      const priceLasted = arrClone[arrClone.length - 1].arrToken[0].price
      const ratioAprByPrice = BigNumber(priceLasted).dividedBy(priceAverage).minus(1).toFixed(4)

      const usdByPriceAverage = BigNumber(BigNumber(priceAverage).multipliedBy(configClone.amountETHToBuy)).toFixed()
      const usdETHToSell = BigNumber(priceLasted).multipliedBy(configClone.amountETHToBuy).toFixed()
      let aprByPrice = BigNumber(BigNumber(usdETHToSell).minus(usdByPriceAverage)).dividedBy(usdByPriceAverage).multipliedBy(100).toFixed(4)

      aprUSD = aprUSD.plus(BigNumber(usdETHToSell).minus(usdByPriceAverage))
      aprByPrice = BigNumber(aprUSD).dividedBy(dcaConfig.initialCapital).multipliedBy(100).toFixed(4)
      console.log('====================================')
      console.log({
        configClone,
        priceLasted: priceLasted.toString(),
        priceAverage: priceAverage.toString(),
        usdETHToSell,
        usdByPriceAverage,
        ratioAprByPrice,
        aprByPrice,
        aprUSD: aprUSD.toFixed(),
        arrBuy,
        arrSell,
      })
      console.log('====================================')

      const result = {
        arrSwap,
        priceLasted,
        minPrice,
        maxPrice,
        total: arrClone.length,
        amountSwapped,
        totalAmountUSD: configClone.amountUSDToBuy,
        totalETHBought: configClone.amountETHToBuy,
        priceAverage: priceAverage.toFixed(),
        initialCapital: configClone.initialCapital,
        totalFee,
        ratioAprByPrice,
        aprByPrice,
      }

      setResult(result)

      console.log({ minPrice, arrClone, indexStop, configClone, amountETHToBuy, result })
    }, 1000)
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

        <div>
          <div>% giá tăng </div>
          <input
            className='w-full border-[1px] !border-gray-500 rounded-[4px] p-2'
            value={dcaConfig.ratioPriceUp}
            onChange={(e) => updateData({ ratioPriceUp: e.target.value as any })}
          />
        </div>

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
            <div className='!text-green-600'>Số USDT ban đầu: {BigNumber(dcaConfig.initialCapital).toFixed(2)} USDT</div>
            {
              <span className='!text-green-600'>
                <span className='mr-2'>Số USDT đã bán lấy lời:</span>
                <span>
                  {BigNumber(result.initialCapital).isLessThan(dcaConfig.initialCapital)
                    ? 0
                    : BigNumber(result.initialCapital).minus(dcaConfig.initialCapital).toFixed(2)}
                </span>

                <span>USDT</span>
              </span>
            }
            <div className=' flex gap-3 !text-green-400'>
              <span>Lợi nhuận:</span>
              <span> {BigNumber(BigNumber(result.aprByPrice).dividedBy(100).multipliedBy(dcaConfig.initialCapital)).toFixed()}</span>
              <span> ( {result.aprByPrice} %)</span>
            </div>

            <div className='flex flex-col gap-3'>
              <div>Tổng số lấy giá: {result.total} </div>
              <div>Số lần đã mua: {result.amountSwapped} </div>
              <div className='!text-green-600'>Tổng số tiền đã mua (USDT): {BigNumber(result.totalAmountUSD).toFixed(2)} </div>

              <div>
                Tổng số {dcaConfig.tokenInput} đã mua: {BigNumber(result.totalETHBought).decimalPlaces(6).toFixed()}{' '}
              </div>

              <div>Giá thấp nhất khi lấy giá: {BigNumber(result.minPrice).toFixed(4)} USDT</div>
              <div>Giá cao nhất khi lấy giá: {BigNumber(result.maxPrice).toFixed(4)} USDT</div>
              <div>Giá cuối cùng của file: {BigNumber(result.priceLasted).toFixed(4)} USDT</div>
              <div className='font-bold mt-6 !text-red-400'>Giá trung bình: {BigNumber(result.priceAverage).decimalPlaces(4).toFixed()} USDT</div>
              <div className='font-bold mt-6 !text-red-400'>Tổng fee: {BigNumber(result.totalFee).decimalPlaces(4).toFixed()} USDT</div>
              <div className='font-bold mt-6 !text-red-400'>
                <div>Dòng đã swap :</div>
                <div>{result.arrSwap?.join(', ')}</div>
              </div>
            </div>
          </>
        )}
      </div>
    </section>
  )
}

export default DCA
