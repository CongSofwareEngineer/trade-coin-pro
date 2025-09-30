'use client'
import React, { useState } from 'react'
import { read, utils } from 'xlsx'
import { BigNumber } from 'bignumber.js'

import { History, DcaTokenConfig, Token } from './type'

import { deepClone } from '@/index'

const DCA = () => {
  const [dcaConfig, setDcaConfig] = useState<DcaTokenConfig>({
    stepSize: '50',
    slippageTolerance: 0.5,
    maxPrice: '3000',
    minPrice: '1500',
    initialCapital: '5000',
    isStop: false,
    amountETHBought: '0',
    ratioPriceUp: '3', //5%
    priceBuyHistory: '0',
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

  const checkToBuyByPrice = (item: History, config: DcaTokenConfig) => {
    let itemFinal = deepClone(item as History)
    let configFinal = deepClone(config as DcaTokenConfig)
    let isStop = false
    let amountETH = '0'

    //lấy token cần mua
    const token = item.arrToken.find((i) => i.tokenSymbol === config.tokenInput)!

    //set gía mua lần đầu  với lần lấy giá đầu tiên
    if (BigNumber(config.priceBuyHistory).isEqualTo(0)) {
      configFinal.priceBuyHistory = token.price.toString()
    }

    //nếu giá hiện tại   <= giá max để dca thì mua
    if (BigNumber(token.price).isLessThan(configFinal.maxPrice)) {
      //nếu giá hiện tại < giá mua lần trước thì mua
      if (BigNumber(token.price).isLessThanOrEqualTo(configFinal.priceBuyHistory)) {
        //lấy khoảng giá giữa max và min để tính số tiền mua theo giá hiện tại
        const rangePrice = BigNumber(config.maxPrice).minus(config.minPrice)

        //so sánh giá hiện tại với khoảng giá min và max để tính % giá giảm
        let ratePriceDrop = BigNumber(1).minus(BigNumber(token.price).dividedBy(rangePrice)).multipliedBy(config.stepSize).abs().toFixed()

        //nếu giá hiện tại < minPrice thì mua với số tiền = stepSize + % giá giảm(so voi khoảng giá min)
        if (BigNumber(token.price).isLessThan(config.minPrice)) {
          ratePriceDrop = BigNumber(rangePrice).dividedBy(token.price).multipliedBy(config.stepSize).toFixed()
        }

        //số tiền usd mua theo % giá giảm
        let amountUSD = BigNumber(ratePriceDrop).multipliedBy(config.stepSize).dividedBy(100).toFixed()

        //quy đổi sang ETH với trượt giá
        amountETH = BigNumber(amountUSD)
          .dividedBy(token.price)
          .multipliedBy(BigNumber(100 - config.slippageTolerance).dividedBy(100))
          .toFixed()

        //nếu số tiền mua > số tiền còn lại thì mua hết số tiền còn lại và dừng dca
        if (BigNumber(config.initialCapital).isLessThan(config.amountUSD)) {
          amountUSD = BigNumber(config.initialCapital).minus(config.amountUSD).toFixed()
          amountETH = BigNumber(amountUSD)
            .dividedBy(token.price)
            .multipliedBy(BigNumber(100 - config.slippageTolerance).dividedBy(100))
            .toFixed()

          console.log('step 3')

          isStop = true

          itemFinal.isSwap = true
          itemFinal.buyAmount = amountUSD

          configFinal.amountETHBought = BigNumber(configFinal.amountETHBought || 0)
            .plus(amountETH)
            .toFixed()

          configFinal.amountUSD = BigNumber(configFinal.amountUSD || 0)
            .plus(amountUSD)
            .toFixed()
        } else {
          itemFinal.isSwap = true
          configFinal.amountETHBought = BigNumber(configFinal.amountETHBought || 0)
            .plus(amountETH)
            .toFixed()
          itemFinal.buyAmount = amountUSD

          configFinal.amountUSD = BigNumber(configFinal.amountUSD || 0)
            .plus(amountUSD)
            .toFixed()
        }
      } else {
        const ratioPriceUp = BigNumber(token.price).dividedBy(config.priceBuyHistory).minus(1).toFixed()
        const ratioPriceUpConfig = BigNumber(config.ratioPriceUp).dividedBy(100).toFixed()

        //lên giá tăng và tăng > % giá tăng đã cấu hình thì bán hết
        if (BigNumber(ratioPriceUp).isGreaterThan(ratioPriceUpConfig) && BigNumber(configFinal.amountETHBought).isGreaterThan(0)) {
          const amountSellToUSD = BigNumber(configFinal.amountETHBought)
            .multipliedBy(token.price)
            .multipliedBy(BigNumber(100 - config.slippageTolerance).dividedBy(100))
            .toFixed()

          itemFinal.isSwap = true
          configFinal.amountETHBought = '0'
          configFinal.amountUSD = '0'
          configFinal.initialCapital = BigNumber(configFinal.initialCapital || 0)
            .plus(amountSellToUSD)
            .toFixed()
        }

        config.priceBuyHistory = token.price.toString()
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
    let totalFee = 0

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
        if (res.item.isSwap) {
          amountSwapped++
          totalFee += 0.1
        }
      }
    })
    const arrSwap = arrClone.filter((i) => i.isSwap)
    const result = {
      priceLasted: arrClone[arrClone.length - 1].arrToken[0].price,
      minPrice,
      maxPrice,
      total: arrClone.length,
      amountSwapped,
      totalAmountUSD: configClone.amountUSD,
      totalETHBought: configClone.amountETHBought,
      priceAverage: BigNumber(configClone.amountUSD || '1')
        .dividedBy(Number(configClone.amountETHBought) || '1')
        .toFixed(4),
      initialCapital: configClone.initialCapital,
      totalFee,
    }

    setResult(result)

    console.log({ minPrice, arrClone, arrSwap, indexStop, configClone, amountETHToBuy, result })
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
            </div>
          </>
        )}
      </div>
    </section>
  )
}

export default DCA
