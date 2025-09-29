'use client'
import React, { useRef, useState } from 'react'
import { read, utils } from 'xlsx'
import { BigNumber } from 'bignumber.js'

import { saveDataLocal } from '../page'

import { History, DcaTokenConfig, Token } from './type'

import { clone } from '@/index'
const LOCAL_STORAGE_KEY = {
  TOKEN_INPUT: 'token_input',
}
const DCA = () => {
  const arrCloneRef = useRef<History[]>([])
  const indexCurrentRef = useRef(0)

  const [dcaConfig, setDcaConfig] = useState<DcaTokenConfig>({
    stepSize: '50',
    slippageTolerance: 0.5,
    maxPrice: '3500',
    minPrice: '2000',
    initialCapital: '5000',
    isStop: false,
    ratioPriceDrop: 3, //5%
    ratioPriceUp: 3, //3%

    priceBuyHistory: '3500',
    tokenInput: 'ETH',
    maxAmountPriceUp: 5,
    amountBuyToken: '0',
  })

  const [isUpload, setIsUpload] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [listPriceTokens, setListPriceTokens] = useState<Token[]>([])
  const [fileImport, setFileImport] = useState<any>(null)
  const [tokenInput, setTokenInput] = useState<string>('')

  const updateData = (data: Partial<DcaTokenConfig>) => {
    setDcaConfig((prev) => ({ ...prev, ...data }))
  }

  const checkToBuy = (item: History, config: DcaTokenConfig) => {
    let itemFinal = clone(item) as History
    let configFinal = clone(config) as DcaTokenConfig
    let isBuy = false
    let isStop = false
    let amountETH = '0'
    const token = item.arrToken.find((i) => i.tokenSymbol === config.tokenInput)!
    const priceBuyHistory = config.priceBuyHistory

    //(giá hiện tại - giá swap gần nhât)/ giá swap gần nhất * 100
    const ratioPrice = BigNumber(BigNumber(token.price).minus(priceBuyHistory)).dividedBy(priceBuyHistory).multipliedBy(100)
    const rangePrice = BigNumber(config.maxPrice).minus(config.minPrice)

    const ratePriceDrop = BigNumber(1).minus(BigNumber(token.price).dividedBy(rangePrice)).multipliedBy(config.stepSize).abs().toFixed()
    const amountBuy = BigNumber(ratePriceDrop).multipliedBy(dcaConfig.stepSize).dividedBy(100).toFixed()

    amountETH = BigNumber(amountBuy).dividedBy(token.price).toFixed()

    if (typeof configFinal.amountBuyPriceUp === 'undefined') {
      configFinal.amountBuyPriceUp = 0
    }
    if (typeof configFinal.amountBuyPriceDown === 'undefined') {
      configFinal.amountBuyPriceDown = 0
    }

    if (Number(configFinal.priceBuyHistory) === 0) {
      configFinal.priceBuyHistory = token.price.toString()
    }

    // số tiền còn lại trong ví
    const amountBalance = BigNumber(dcaConfig.initialCapital).minus(amountBuy)

    // console.log('step 2')

    //nếu số tền còn lại < số tiền mua thì dừng lại
    if (amountBalance.isLessThan(dcaConfig.stepSize)) {
      console.log('step 3')

      isStop = true
      configFinal.priceBuyHistory = token.price.toString()

      itemFinal.isBuy = true
      itemFinal.buyAmount = amountBuy
      itemFinal.buyAmountETH = amountETH
      configFinal.amountBuyToken = BigNumber(configFinal.amountBuyToken || 0)
        .plus(amountBuy)
        .toFixed()

      return { item: itemFinal, config: configFinal, isStop, amountETH }
    } else {
      // console.log('step 4')

      if (ratioPrice.isLessThanOrEqualTo(0)) {
        // console.log('step 5')

        //nếu % giá hiện tại giảm
        // lưu lại số lần mua giá giảm
        configFinal.amountBuyPriceDown += 1

        //giảm bao nhiêu % so với config mới mua thêm
        if (ratioPrice.abs().gt(config.ratioPriceDrop)) {
          // console.log('step 6')
          // configFinal.priceBuyHistory = token.price.toString()
          // isBuy = true
          // itemFinal.isBuy = true
          // itemFinal.buyAmountETH = amountETH
          // itemFinal.buyAmount = amountBuy
          // configFinal.amountBuyToken = BigNumber(configFinal.amountBuyToken || 0)
          //   .plus(amountBuy)
          //   .toFixed()
        }
      } else {
        // console.log('step 7')

        //nếu giá hiện tại > giá mua ban đầu - 5% thì mua thêm
        configFinal.amountBuyPriceUp += 1
      }

      if (!isBuy) {
        // console.log('step 8')

        if (configFinal.amountBuyPriceUp > configFinal.maxAmountPriceUp) {
          console.log('step 9')

          itemFinal.isBuy = true
          itemFinal.buyAmount = amountBuy

          configFinal.amountBuyPriceUp = 0
          configFinal.amountBuyPriceDown = 0
          itemFinal.buyAmountETH = amountETH
          configFinal.priceBuyHistory = token.price.toString()
          configFinal.amountBuyToken = BigNumber(configFinal.amountBuyToken || 0)
            .plus(amountBuy)
            .toFixed()
        }
      }
    }

    return { item: itemFinal, config: configFinal, isStop, amountETH }
  }

  const checkData = (data: History[] = []) => {
    let arrClone = clone(data) as History[]
    let configClone = clone(dcaConfig) as DcaTokenConfig
    let isStop = false
    let indexStop = -1
    let amountETHToBuy = '0'
    let minPrice = arrClone[0].arrToken[0].price.toString()

    arrClone.forEach((item, index) => {
      if (!isStop) {
        if (BigNumber(minPrice).gt(item.arrToken[0].price)) {
          minPrice = item.arrToken[0].price.toString()
        }
        const res = checkToBuy(item, configClone)

        isStop = res.isStop
        arrClone[index] = res.item
        configClone = res.config
        arrClone[index].isStop = res.isStop
        if (res.isStop) {
          indexStop = index
        }
        if (res.item.isBuy) {
          amountETHToBuy = BigNumber(amountETHToBuy).plus(res.amountETH).toFixed()
        }
      }
    })
    const arrBuy = arrClone.filter((i) => i.isBuy)

    console.log({ minPrice, arrClone, arrBuy, indexStop, configClone, amountETHToBuy })
  }

  const importData = async (file: File) => {
    try {
      const formatData = (data: any[] = []): History[] => {
        return data.map((item) => {
          return {
            arrToken: [
              {
                price: item['ETH'],
                tokenSymbol: 'ETH',
              },
            ],
          }
        })
      }

      setIsUploading(true)
      saveDataLocal(LOCAL_STORAGE_KEY.TOKEN_INPUT, tokenInput)
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
        setListPriceTokens(data)

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
                  setIsUpload(false)
                  setFileImport(null)
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
          <div>Số tiền (USDT) bỏ ra để mua mỗi lần </div>
          <input
            className='w-full border-[1px] !border-gray-500 rounded-[4px] p-2'
            value={dcaConfig.stepSize}
            onChange={(e) => updateData({ stepSize: e.target.value as any })}
          />
        </div>

        <div>
          <div>% giá giảm </div>
          <input
            className='w-full border-[1px] !border-gray-500 rounded-[4px] p-2'
            value={dcaConfig.ratioPriceDrop}
            onChange={(e) => updateData({ ratioPriceDrop: e.target.value as any })}
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
          <div>% trượ giá </div>
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
            onChange={(e) => updateData({ maxPrice: e.target.value as any })}
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
    </section>
  )
}

export default DCA
