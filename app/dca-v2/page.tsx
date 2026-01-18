'use client'
import React, { useState } from 'react'
import { read, utils } from 'xlsx'
import { BigNumber } from 'bignumber.js'

import { History, DcaTokenConfig, Token, Result } from './type'
import DcaHelper from './hepers'

import { deepClone } from '@/index'

const DCA = () => {
  const [dcaConfig, setDcaConfig] = useState<DcaTokenConfig>({
    stepSize: '100',
    slippageTolerance: 0.5,
    maxPrice: '4500',
    minPrice: '3000',
    amountETHToBuy: '0',
    priceBuyHistory: '0',
    tokenInput: 'ETH',
    amountUSDToBuy: '0',
    minTokenRemain: '0.001',
    ratioPriceChange: '1',
    capital: '5000',
    minUSDToSwap: '10',
  })

  console.log({ dcaConfig })

  const [isUpload, setIsUpload] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [listPriceTokens, setListPriceTokens] = useState<Token[]>([])
  const [fileImport, setFileImport] = useState<any>(null)
  const [result, setResult] = useState<Result>({} as Result)

  const updateData = (data: Partial<DcaTokenConfig>) => {
    setDcaConfig((prev) => ({ ...prev, ...data }))
  }

  const checkData = async (data: History[] = []) => {
    let arrClone = deepClone(data) as History[]
    let configClone = deepClone(dcaConfig) as DcaTokenConfig
    let configInit = deepClone(dcaConfig) as DcaTokenConfig
    let isStop = false
    let indexStop = -1
    let minPrice = arrClone[0].arrToken[0].price.toString()
    let maxPrice = arrClone[0].arrToken[0].price.toString()
    const arrSwap: { index: number; isBuy: boolean }[] = []
    let amountSwapped = 0
    let amountSold = 0
    let totalFee = 0

    arrClone.map(async (item, index) => {
      if (!isStop) {
        if (BigNumber(minPrice).gt(item.arrToken[0].price)) {
          minPrice = item.arrToken[0].price.toString()
        }

        if (BigNumber(maxPrice).lt(item.arrToken[0].price)) {
          maxPrice = item.arrToken[0].price.toString()
        }
        const res = DcaHelper.execute(deepClone(configClone) as DcaTokenConfig, item.arrToken[0].price.toString())

        if (res) {
          const { config, item } = res

          console.log({ item, type: item.isBuy ? 'buy' : 'sell' })

          isStop = config.isStop || false
          arrClone[index] = item
          configClone = deepClone(config)
          arrClone[index].isStop = config.isStop
          if (config.isStop) {
            indexStop = index
          }
          if (item.isBuy) {
            amountSwapped++
            arrSwap.push({ index: index + 1, isBuy: true })
            totalFee += 0.15
          }
          if (item.isSell) {
            amountSold++
            arrSwap.push({ index: index + 1, isBuy: false })
            totalFee += 0.15
          }
        }
      }
    })

    setTimeout(() => {
      console.log({ configClone, arrClone })

      const arrBuy = arrClone.filter((i) => i.isBuy)
      const priceAverage = BigNumber(configClone.amountUSDToBuy || '1').dividedBy(Number(configClone.amountETHToBuy) || '1')
      const priceLasted = arrClone[arrClone.length - 1]?.arrToken?.[0]?.price || '0'
      const ratioAprByPrice = BigNumber(priceLasted).dividedBy(priceAverage).minus(1).toFixed(4)
      const usdByPriceAverage = BigNumber(BigNumber(priceAverage).multipliedBy(configClone.amountETHToBuy)).toFixed()
      const usdETHToSell = BigNumber(priceLasted).multipliedBy(configClone.amountETHToBuy).toFixed()
      const capitalAfterSell = BigNumber(configClone.capital).plus(usdETHToSell)
      const apr = BigNumber(BigNumber(capitalAfterSell).minus(configInit.capital)).dividedBy(configInit.capital).multipliedBy(100).toFixed(4)
      const aprByPrice = apr

      const result = {
        initialCapital: configInit.capital,
        priceLasted,
        minPrice,
        maxPrice,
        total: arrClone.length,
        amountSwapped,
        amountSold,
        totalAmountUSD: configClone.amountUSDToBuy,
        totalETHBought: configClone.amountETHToBuy,
        priceAverage: priceAverage.toFixed(4),
        totalFee,
        arrSwap,
        ratioApr: '0',
        ratioAprByPrice,
        aprByPrice,
      }

      setResult(result as any)

      console.log({
        minPrice,
        arrClone,
        arrBuy,
        indexStop,
        configClone,
        amountETHToBuy: configClone.amountETHToBuy,
        result,
      })
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
    <div className='min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 text-white'>
      <div className='container mx-auto px-6 py-8'>
        <div className='grid lg:grid-cols-2 gap-8'>
          {/* Configuration Panel */}
          <div className='bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50 shadow-2xl'>
            <h2 className='text-xl font-semibold mb-6 flex items-center gap-2'>
              <div className='w-2 h-2 bg-blue-500 rounded-full' />
              DCA V2 Configuration
            </h2>

            {/* File Upload Section */}
            <div className='mb-6'>
              <div className='block text-sm font-medium text-gray-300 mb-3'>Upload Price Data File</div>
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
                        setResult({} as Result)
                        setIsUpload(false)
                        setFileImport('')
                        setListPriceTokens([])
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
                <div className='block text-sm font-medium text-gray-300 mb-2'>Số USDT ban đầu</div>
                <input
                  className='w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200'
                  placeholder='Nhập số tiền ban đầu...'
                  value={dcaConfig.capital}
                  onChange={(e) => updateData({ capital: e.target.value as any })}
                />
                <p className='text-xs text-gray-500 mt-1'>Tổng vốn đầu tư ban đầu (USDT)</p>
              </div>

              <div>
                <div className='block text-sm font-medium text-gray-300 mb-2'>Token muốn mua</div>
                <input
                  className='w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200'
                  placeholder='e.g., ETH, BTC, BNB...'
                  value={dcaConfig.tokenInput}
                  onChange={(e) => updateData({ tokenInput: e.target.value as any })}
                />
                <p className='text-xs text-gray-500 mt-1'>Ký hiệu token cần DCA</p>
              </div>

              <div>
                <div className='block text-sm font-medium text-gray-300 mb-2'>Số tiền (USDT) bỏ ra để mua mỗi lần</div>
                <input
                  className='w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200'
                  placeholder='100'
                  type='number'
                  value={dcaConfig.stepSize}
                  onChange={(e) => updateData({ stepSize: e.target.value as any })}
                />
                <p className='text-xs text-gray-500 mt-1'>Kích thước lệnh DCA mỗi lần</p>
              </div>

              <div>
                <div className='block text-sm font-medium text-gray-300 mb-2'>% trượt giá</div>
                <input
                  className='w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200'
                  placeholder='0.5'
                  step='0.1'
                  type='number'
                  value={dcaConfig.slippageTolerance}
                  onChange={(e) => updateData({ slippageTolerance: e.target.value as any })}
                />
                <p className='text-xs text-gray-500 mt-1'>Độ trượt giá chấp nhận được (%)</p>
              </div>

              <div>
                <div className='block text-sm font-medium text-gray-300 mb-2'>Giá bắt đầu DCA</div>
                <input
                  className='w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200'
                  placeholder='4500'
                  type='number'
                  value={dcaConfig.maxPrice}
                  onChange={(e) => updateData({ maxPrice: e.target.value as any })}
                />
                <p className='text-xs text-gray-500 mt-1'>Mức giá tối đa để bắt đầu DCA</p>
              </div>

              <div>
                <div className='block text-sm font-medium text-gray-300 mb-2'>Giá thấp nhất</div>
                <input
                  className='w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200'
                  placeholder='3000'
                  type='number'
                  value={dcaConfig.minPrice}
                  onChange={(e) => updateData({ minPrice: e.target.value as any })}
                />
                <p className='text-xs text-gray-500 mt-1'>Giá sàn để dừng DCA</p>
              </div>

              <div className='grid grid-cols-2 gap-4'>
                <div>
                  <div className='block text-sm font-medium text-gray-300 mb-2'>% giá thay đổi</div>
                  <input
                    className='w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200'
                    placeholder='1'
                    type='number'
                    value={dcaConfig.ratioPriceChange}
                    onChange={(e) => updateData({ ratioPriceChange: e.target.value as any })}
                  />
                </div>
                <div>
                  <div className='block text-sm font-medium text-gray-300 mb-2'>Min USD Swap</div>
                  <input
                    className='w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200'
                    placeholder='10'
                    type='number'
                    value={dcaConfig.minUSDToSwap}
                    onChange={(e) => updateData({ minUSDToSwap: e.target.value as any })}
                  />
                </div>
              </div>

              <div>
                <div className='block text-sm font-medium text-gray-300 mb-2'>Token tối thiểu còn lại</div>
                <input
                  className='w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200'
                  placeholder='0.001'
                  type='number'
                  value={dcaConfig.minTokenRemain}
                  onChange={(e) => updateData({ minTokenRemain: e.target.value as any })}
                />
              </div>
            </div>
          </div>

          {/* Results Panel */}
          <div className='bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50 shadow-2xl'>
            <h2 className='text-xl font-semibold mb-6 flex items-center gap-2'>
              <div className='w-2 h-2 bg-green-500 rounded-full' />
              Kết quả DCA V2
            </h2>

            {Object.keys(result).length > 0 ? (
              <div className='custom-scrollbar overflow-y-auto space-y-4'>
                {/* Summary Cards */}
                <div className='grid gap-4'>
                  {/* Capital & Profit */}
                  <div className='bg-gradient-to-r from-green-900/30 to-emerald-900/30 border border-green-700/50 rounded-xl p-4'>
                    <h3 className='text-lg font-semibold text-green-400 mb-3'>💰 Tổng quan tài chính</h3>
                    <div className='space-y-2'>
                      <div className='flex justify-between items-center'>
                        <span className='text-gray-300'>Tổng vốn ban đầu:</span>
                        <span className='text-green-400 font-mono font-semibold'>{BigNumber(result.initialCapital).toFixed(4)} USDT</span>
                      </div>
                      <div className='flex justify-between items-center'>
                        <span className='text-gray-300'>Lợi nhuận:</span>
                        <div className='text-right'>
                          <div className='text-green-400 font-mono font-semibold'>
                            {BigNumber(BigNumber(result.aprByPrice).dividedBy(100).multipliedBy(dcaConfig.capital)).toFixed()} USDT
                          </div>
                          <div className='text-sm text-green-300'>({result.aprByPrice}%)</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Trading Statistics */}
                  <div className='bg-gradient-to-r from-blue-900/30 to-indigo-900/30 border border-blue-700/50 rounded-xl p-4'>
                    <h3 className='text-lg font-semibold text-blue-400 mb-3'>📊 Thống kê giao dịch</h3>
                    <div className='grid grid-cols-2 gap-4'>
                      <div>
                        <div className='text-xs text-gray-400'>Tổng số lấy giá</div>
                        <div className='text-white font-mono font-semibold'>{result.total}</div>
                      </div>
                      <div>
                        <div className='text-xs text-gray-400'>Số lần đã mua</div>
                        <div className='text-blue-400 font-mono font-semibold'>{result.amountSwapped}</div>
                      </div>
                      <div>
                        <div className='text-xs text-gray-400'>Số lần đã bán</div>
                        <div className='text-green-400 font-mono font-semibold'>{result.amountSold}</div>
                      </div>
                      <div>
                        <div className='text-xs text-gray-400'>Tổng USDT đã mua</div>
                        <div className='text-yellow-400 font-mono font-semibold'>{BigNumber(result.totalAmountUSD).toFixed(2)}</div>
                      </div>
                      <div>
                        <div className='text-xs text-gray-400'>Tổng {dcaConfig.tokenInput} đã mua</div>
                        <div className='text-purple-400 font-mono font-semibold'>{BigNumber(result.totalETHBought).decimalPlaces(6).toFixed()}</div>
                      </div>
                    </div>
                  </div>

                  {/* Price Analysis */}
                  <div className='bg-gradient-to-r from-purple-900/30 to-pink-900/30 border border-purple-700/50 rounded-xl p-4'>
                    <h3 className='text-lg font-semibold text-purple-400 mb-3'>📈 Phân tích giá</h3>
                    <div className='space-y-2'>
                      <div className='flex justify-between items-center'>
                        <span className='text-gray-300'>Giá thấp nhất:</span>
                        <span className='text-red-400 font-mono'>{BigNumber(result.minPrice).toFixed(4)} USDT</span>
                      </div>
                      <div className='flex justify-between items-center'>
                        <span className='text-gray-300'>Giá cao nhất:</span>
                        <span className='text-green-400 font-mono'>{BigNumber(result.maxPrice).toFixed(4)} USDT</span>
                      </div>
                      <div className='flex justify-between items-center'>
                        <span className='text-gray-300'>Giá cuối cùng:</span>
                        <span className='text-cyan-400 font-mono'>{BigNumber(result.priceLasted).toFixed(4)} USDT</span>
                      </div>
                      <div className='flex justify-between items-center'>
                        <span className='text-gray-300'>Giá trung bình:</span>
                        <span className='text-yellow-400 font-mono font-semibold'>
                          {BigNumber(result.priceAverage).decimalPlaces(4).toFixed()} USDT
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Fees */}
                  <div className='bg-gradient-to-r from-red-900/30 to-orange-900/30 border border-red-700/50 rounded-xl p-4'>
                    <h3 className='text-lg font-semibold text-red-400 mb-3'>💸 Chi phí giao dịch</h3>
                    <div className='flex justify-between items-center'>
                      <span className='text-gray-300'>Tổng fee ước tính:</span>
                      <span className='text-red-400 font-mono font-semibold'>{BigNumber(result.totalFee).decimalPlaces(4).toFixed()} USDT</span>
                    </div>
                  </div>

                  {/* Swap Details */}
                  {result.arrSwap && result.arrSwap.length > 0 && (
                    <div className='bg-gradient-to-r from-gray-800/50 to-gray-700/50 border border-gray-600/50 rounded-xl p-4'>
                      <h3 className='text-lg font-semibold text-gray-300 mb-3'>🔄 Chi tiết các lần giao dịch</h3>
                      <div className='text-xs text-gray-400 mb-2'>Dòng đã swap ({result.arrSwap.length} lần):</div>
                      <div className='bg-gray-900/50 rounded-lg p-3 max-h-32 overflow-y-auto custom-scrollbar'>
                        <div className='flex flex-wrap gap-1'>
                          {result.arrSwap.map((swap, index) => (
                            <span
                              key={index}
                              className={`px-2 py-1 rounded text-xs font-medium ${
                                swap.isBuy ? 'bg-blue-700/50 text-blue-300' : 'bg-red-700/50 text-red-300'
                              }`}
                            >
                              #{swap.index.toString()}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className='text-center py-12'>
                <div className='w-16 h-16 mx-auto mb-4 bg-gray-700/50 rounded-full flex items-center justify-center'>
                  <svg className='w-8 h-8 text-gray-500' fill='none' stroke='currentColor' strokeWidth={1.5} viewBox='0 0 24 24'>
                    <path
                      d='M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z'
                      strokeLinecap='round'
                      strokeLinejoin='round'
                    />
                  </svg>
                </div>
                <h3 className='text-lg font-medium text-gray-400 mb-2'>Chưa có dữ liệu</h3>
                <p className='text-sm text-gray-500'>Upload file dữ liệu để xem kết quả phân tích DCA V2</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default DCA
