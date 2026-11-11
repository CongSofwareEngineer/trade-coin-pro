'use client'
import { useEffect, useRef, useState } from 'react'
import { read, utils } from 'xlsx'
import { BigNumber } from 'bignumber.js'

import { RebalanceSummary, Version } from './type'
import { getRebalanceHelper, getRebalanceSummary } from './helpers'

import { PoolToken } from '@/types/app'
import { cloneData, formatTime, uppercase } from '@/utils/functions'

const DECIMAL = 8

export default function Home() {
  const arrCloneDefaultRef = useRef<PoolToken[]>([])
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
  const [version] = useState<Version>('v4')
  const [summary, setSummary] = useState<RebalanceSummary | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  const getHelper = () => {
    return getRebalanceHelper(version, { amountStart, outputStart, volatilityPercentage, affiliate })
  }

  const rollUpData = () => {
    if (arrCloneDefaultRef.current.length === 0) {
      arrCloneDefaultRef.current = cloneData(arrData)
    }

    const helper = getHelper()
    const res = helper.run(arrCloneDefaultRef.current)

    setArrData(res.arrData)
    setArrSwapFilter(res.arrSwap)
    setSummary(getRebalanceSummary(res, { amountStart, outputStart, volatilityPercentage, affiliate }))

    console.log({ version, arrFinal: res.arrData, arrSwap: res.arrSwap, state: res.state })
  }

  const formatData = (data: any[] = []): PoolToken[] => {
    const helper = getHelper()

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
            symbol: uppercase(key),
            price: helper.formatPrice(value as number),
          })
        }
      })

      return poolToken
    })

    console.log({ arrData })

    return arrData
  }

  useEffect(() => {
    if (!isUpload) return

    const runAnalyze = async () => {
      setIsAnalyzing(true)
      // nhường 1 frame để spinner kịp render trước khi chạy logic đồng bộ
      await new Promise((resolve) => setTimeout(resolve, 50))

      try {
        rollUpData()
      } catch (error) {
        console.log({ error })
      }

      setIsAnalyzing(false)
    }

    runAnalyze()
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

  const formatNumberToShow = (value: any, decimal: number = 8) => {
    if (BigNumber(value).isNaN()) {
      return '-'
    }

    return BigNumber(value).decimalPlaces(decimal, BigNumber.ROUND_DOWN).toFormat()
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 text-white'>
      <div className='container mx-auto px-6 py-8'>
        <div className='grid lg:grid-cols-2 gap-8 [&>*]:min-w-0'>
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
                        arrCloneDefaultRef.current = []
                        setArrData([])
                        setSummary(null)
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
                <div className='block text-sm font-medium text-gray-300 mb-2'>Input Token</div>
                <input
                  className='w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200'
                  placeholder='e.g., ETH, BTC, BNB...'
                  value={outputStart}
                  onChange={(e) => setOutputStart(uppercase(e.target.value))}
                />
                <p className='text-xs text-gray-500 mt-1'>Starting input token symbol</p>
              </div>

              <div>
                <div className='block text-sm font-medium text-gray-300 mb-2'>Volatility Percentage (%)</div>
                <input
                  className='w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200'
                  placeholder='0.3'
                  step='0.01'
                  type='number'
                  value={volatilityPercentage}
                  onChange={(e) => setVolatilityPercentage(e.target.value as any)}
                />
                <p className='text-xs text-gray-500 mt-1'> Expected Input Token Price Decline Percentage</p>
              </div>

              <div>
                <div className='block text-sm font-medium text-gray-300 mb-2'>Transaction fee/Gas fee (%)</div>
                <input
                  className='w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200'
                  placeholder='0.15'
                  step='0.01'
                  type='number'
                  value={affiliate}
                  onChange={(e) => setAffiliate(e.target.value as any)}
                />
                <p className='text-xs text-gray-500 mt-1'>Affiliate fee percentage/Suggest of Gas fee </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className='mt-8'>
              <button
                className='w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium py-3 px-6 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:from-blue-600 disabled:hover:to-blue-700'
                disabled={isAnalyzing || !isUpload}
                onClick={() => setStartData(!startData)}
              >
                {isAnalyzing ? (
                  <>
                    <svg className='w-5 h-5 animate-spin' fill='none' stroke='currentColor' strokeWidth={2} viewBox='0 0 24 24'>
                      <path
                        d='M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99'
                        strokeLinecap='round'
                        strokeLinejoin='round'
                      />
                    </svg>
                    Analyzing...
                  </>
                ) : (
                  <>🚀 Analyze Swaps</>
                )}
              </button>
            </div>

            {/* Swap Indicators */}
            {arrSwapFilter.length > 0 && (
              <div className='mt-6 p-4 bg-green-900/30 border border-green-700/50 rounded-lg'>
                <h3 className='text-sm font-medium text-green-400 mb-2'>Successful Swaps Found ({arrSwapFilter.length})</h3>
                <div className='flex flex-wrap gap-2 max-h-[120px] overflow-y-auto custom-scrollbar'>
                  {arrData.map((e, index) => {
                    if (!e?.isSwap) return null

                    return (
                      <span key={index} className='px-2 py-1 bg-green-700/50 text-green-300 rounded text-xs font-medium'>
                        <span className='font-bold '>#{index + 1}</span>
                        <span className='text-[10px]'>{e.outputSwap ? ` : ${e.inputSwap || '?'} → ${e.outputSwap}` : ''}</span>
                      </span>
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

            {/* Summary: start amount / end amount / PnL in USD */}
            {summary && (
              <div className='mb-6 p-4 bg-gray-900/50 border border-gray-600/50 rounded-xl'>
                <h3 className='text-sm font-medium text-gray-300 mb-3'>Summary</h3>

                <div className='grid grid-cols-2 gap-4'>
                  <div>
                    <span className='text-xs text-gray-400'>Start Amount</span>
                    <div className='text-lg font-mono text-white'>
                      {formatNumberToShow(summary.startAmount, 6)} <span className='text-sm text-gray-400'>{summary.symbolStart}</span>
                    </div>
                    <span className='font-bold text-xs   font-mono text-gray-400'>
                      Price: ${formatNumberToShow(summary.priceStartUsd)}
                      {/* <span className={`ml-1 ${BigNumber(summary.declinePercentage).gt(0) ? 'text-red-400' : 'text-green-400'}`}>
                        ({BigNumber(summary.declinePercentage).gt(0) ? '⬇︎' : '⬆︎'}%:{' '}
                        {formatNumberToShow(BigNumber(summary.declinePercentage).abs().toFixed(), 4)})
                      </span> */}
                    </span>

                    <div className='text-sm mt-1 font-mono text-gray-400'>${formatNumberToShow(summary.startValueUsd)}</div>
                  </div>
                  <div>
                    <span className='text-xs text-gray-400'>End Amount</span>
                    <div className='text-lg font-mono text-white'>
                      {formatNumberToShow(summary.endAmount, 6)} <span className='text-sm text-gray-400'>{summary.symbolEnd}</span>
                    </div>
                    <span className='font-bold text-xs font-mono text-gray-400'>Price: ${formatNumberToShow(summary.priceEndUsd)}</span>

                    <div className='text-sm  mt-1 font-mono text-gray-400'>${formatNumberToShow(summary.endValueUsd)}</div>
                  </div>
                </div>

                <div className='mt-4 pt-4 border-t border-gray-700/50 overflow-x-auto custom-scrollbar'>
                  <table className='w-full text-sm border-collapse'>
                    <tbody className='[&>tr>td]:border [&>tr>td]:border-gray-600/50 [&>tr>td]:px-3 [&>tr>td]:py-2'>
                      <tr>
                        <td className='text-gray-300 whitespace-nowrap'>Time (期間)</td>
                        <td className='font-mono text-white whitespace-nowrap'>
                          {formatTime(summary.timeStart) || '-'} ~ {formatTime(summary.timeEnd) || '-'}
                        </td>
                      </tr>
                      <tr>
                        <td className='text-gray-300 whitespace-nowrap'>Start Price of Input Token (開始価格)</td>
                        <td className='font-mono text-white'>${formatNumberToShow(summary.priceStartUsd, 4)}</td>
                      </tr>
                      <tr>
                        <td className='text-gray-300 whitespace-nowrap'>End Price of Input Token (終了価格)</td>
                        <td className='font-mono text-white'>${formatNumberToShow(summary.priceEndInputUsd, 4)}</td>
                      </tr>
                      <tr>
                        <td className='text-gray-300 whitespace-nowrap'>Price Change (％チェンジ)</td>
                        <td className={`font-mono ${BigNumber(summary.priceChangePercentage).gte(0) ? 'text-green-400' : 'text-red-400'}`}>
                          {BigNumber(summary.priceChangePercentage).gte(0) ? '⬆︎' : '⬇︎'}{' '}
                          {BigNumber(summary.priceChangePercentage).gt(0) ? '+' : ''}
                          {formatNumberToShow(summary.priceChangePercentage, 4)}%
                        </td>
                      </tr>
                      <tr>
                        <td className='text-gray-300 whitespace-nowrap'>Start Amount of Input Token (期初数量)</td>
                        <td className='font-mono text-white'>{formatNumberToShow(summary.startAmount, 2)}</td>
                      </tr>
                      <tr>
                        <td className='text-gray-300 whitespace-nowrap'>Max Unrealized Gain (最大含み益)</td>
                        <td className='font-mono text-green-400'>
                          {BigNumber(summary.maxUnrealizedGain).gte(0) ? '+' : ''}
                          {formatNumberToShow(summary.maxUnrealizedGain, 6)} / {BigNumber(summary.maxUnrealizedGainPercentage).gte(0) ? '+' : ''}
                          {formatNumberToShow(summary.maxUnrealizedGainPercentage, 4)}%
                        </td>
                      </tr>
                      <tr>
                        <td className='text-gray-300 whitespace-nowrap'>Max Unrealized Loss (最大含み損)</td>
                        <td className='font-mono text-red-400'>
                          {BigNumber(summary.maxUnrealizedLoss).gte(0) ? '+' : ''}
                          {formatNumberToShow(summary.maxUnrealizedLoss, 6)} / {BigNumber(summary.maxUnrealizedLossPercentage).gte(0) ? '+' : ''}
                          {formatNumberToShow(summary.maxUnrealizedLossPercentage, 4)}%
                        </td>
                      </tr>
                      <tr>
                        <td className='text-gray-300 whitespace-nowrap'>End Input Token Balance (期末数量)</td>
                        <td className='font-mono text-white'>{formatNumberToShow(summary.endInputTokenBalance, 4)}</td>
                      </tr>
                      <tr>
                        <td className='text-gray-300 whitespace-nowrap'>Number of Swaps (取引数回)</td>
                        <td className='font-mono text-white'>{summary.totalSwaps}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <p className='text-[11px] text-gray-500 mt-2'>
                  Mỗi dòng giá: SwapOutputTokenAmount × giá đồng đó ÷ giá {summary.symbolStart} tại dòng đó. Max/Min của các số đó trừ đi amount input
                  ban đầu = Max Unrealized Gain / Loss.
                </p>

                {/* View Tabs */}
                <div className='flex gap-1 mt-4 p-1 bg-gray-800/70 border border-gray-700/50 rounded-lg'>
                  {[
                    { key: false, label: `📊 All (${arrData.length})` },
                    { key: true, label: `✨ Swaps (${arrSwapFilter.length})` },
                  ].map((tab) => (
                    <button
                      key={String(tab.key)}
                      className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all duration-200 ${
                        showIsSwap === tab.key ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                      }`}
                      onClick={() => setShowIsSwap(tab.key)}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

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
                              SWAP{item.outputSwap ? `: ${item.inputSwap || '?'} → ${item.outputSwap}` : ''}
                            </span>
                          )}
                        </div>
                        <div className='text-sm text-gray-400'>{formatTime(item.time) || 'N/A'}</div>
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
                                <span className='font-semibold text-white flex items-center gap-2'>
                                  {token.symbol}
                                  {item.isSwap && uppercase(token.symbol) === uppercase(item.outputSwap) && (
                                    <span className='px-2 py-[2px] bg-green-900/50 border border-green-700/50 text-green-300 rounded text-[10px] font-medium'>
                                      SWAP TO
                                    </span>
                                  )}
                                  {item.isSwap && uppercase(token.symbol) === uppercase(item.inputSwap) && (
                                    <span className='px-2 py-[2px] bg-orange-900/50 border border-orange-700/50 text-orange-300 rounded text-[10px] font-medium'>
                                      SWAP FROM
                                    </span>
                                  )}
                                </span>
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
                                {version !== 'v1' && token.changeByPoint && (
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
