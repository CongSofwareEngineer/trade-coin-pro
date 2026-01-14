'use client'
import React, { useEffect, useState } from 'react'
import { BigNumber } from 'bignumber.js'

import { UserConfig } from './type'

import useUserConfig from '@/hooks/tank-query/useUserConfig'
import { useTradeHistory } from '@/hooks/tank-query/useTradeHistory'
import useTokenPrice from '@/hooks/tank-query/useTokenPrice'

function TradeInfoPage() {
  const [userConfigCurrent, setUserConfigCurrent] = useState<UserConfig>()
  const [currentPage, setCurrentPage] = useState(1)
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false)
  const [settingsForm, setSettingsForm] = useState({
    stepSize: '',
    slippageTolerance: '',
    maxPrice: '',
    minPrice: '',
    ratioPriceUp: '',
    ratioPriceDown: '',
  })

  const { data: dataTokenPrice, isLoading: isLoadingTokenPrice, refetch: refetchTokenPrice } = useTokenPrice()
  const { data: dataUserConfig, isLoading: isLoadingUserConfig, refetch: refetchUserConfig } = useUserConfig()
  const {
    history,
    isLoading: isLoadingTradeHistory,
    refetch: refetchTradeHistory,
    totalTrades,
    totalPages,
    hasNextPage,
    hasPrevPage,
  } = useTradeHistory({
    idUser: userConfigCurrent?._id,
    page: currentPage,
    limit: 20,
  })

  useEffect(() => {
    if (Array.isArray(dataUserConfig?.users)) {
      const config = dataUserConfig?.users.find((i) => Number(i.version) === 3)

      setUserConfigCurrent(config)
    }
  }, [dataUserConfig])

  // Reset page when user changes
  useEffect(() => {
    setCurrentPage(1)
  }, [userConfigCurrent?._id])

  useEffect(() => {
    const getData = async () => {
      const res = await fetch('/api/token?idToken=1027', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      const data = await res.json()

      console.log({ data })
    }

    getData()
  }, [])

  // Update settings form when userConfigCurrent changes
  useEffect(() => {
    if (userConfigCurrent) {
      setSettingsForm({
        stepSize: userConfigCurrent.stepSize || '',
        slippageTolerance: userConfigCurrent.slippageTolerance?.toString() || '',
        maxPrice: userConfigCurrent.maxPrice || '',
        minPrice: userConfigCurrent.minPrice || '',
        ratioPriceUp: userConfigCurrent.ratioPriceChange || '',
        ratioPriceDown: userConfigCurrent.ratioPriceChange || '',
      })
    }
  }, [userConfigCurrent])

  const openSettingsModal = () => {
    setIsSettingsModalOpen(true)
  }

  const closeSettingsModal = () => {
    setIsSettingsModalOpen(false)
  }

  const handleSettingsChange = (field: string, value: string) => {
    setSettingsForm((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const saveSettings = async () => {
    // TODO: Implement API call to save settings
    console.log('Saving settings:', settingsForm)
    // You would call your API here to update the user config
    // await updateUserConfig(userConfigCurrent._id, settingsForm)
    closeSettingsModal()
    // Refresh data after saving
    refetchUserConfig()
  }

  // Calculate portfolio stats
  const calculatePortfolioStats = () => {
    if (!userConfigCurrent || !dataTokenPrice?.price) return null

    const tokenPriceNow = dataTokenPrice?.price || 0

    const ethBought = parseFloat(userConfigCurrent.amountETHBuy || '0')
    const usdtSpent = parseFloat(userConfigCurrent.amountUSDBuy || '0')
    const currentCapital = parseFloat(userConfigCurrent.capital || '0')
    const initialCapital = parseFloat(userConfigCurrent.initialCapital || '0')
    const slippageTolerance = parseFloat(userConfigCurrent.slippageTolerance?.toString() || '0')

    // Calculate average price (only if ETH was bought)
    const avgPrice = ethBought > 0 ? usdtSpent / ethBought : 0

    // Get current ETH price from latest trade
    const latestTrade = history?.[0]
    const currentETHPrice = latestTrade ? parseFloat(latestTrade.price) : 0

    // Calculate ETH value at current price

    // Total portfolio value = current capital + ETH value
    const totalPortfolioValue = usdtSpent

    // Profit/loss based on slippageTolerance (as initial capital reference)
    const profitLoss = totalPortfolioValue - initialCapital

    //profit

    const usdtToSell = ethBought * tokenPriceNow * (1 - slippageTolerance / 100)

    const usdtAllAfterSell = BigNumber(usdtToSell).plus(currentCapital).toString()

    const apr = BigNumber(BigNumber(usdtAllAfterSell).minus(initialCapital)).dividedBy(initialCapital).multipliedBy(100).toNumber()

    return {
      ethBought: userConfigCurrent.amountETHBuy,
      usdtSpent: userConfigCurrent.amountUSDBuy,
      currentCapital: userConfigCurrent.capital,
      initialCapital,
      slippageTolerance,
      avgPrice,
      profitLoss,
      profitLossPercentage: apr,
      currentETHPrice,
      totalPortfolioValue,
    }
  }

  const portfolioStats = calculatePortfolioStats()

  console.log({ userConfigCurrent, portfolioStats })

  const refreshData = () => {
    refetchUserConfig()
    refetchTradeHistory()
    refetchTokenPrice()
  }

  const goToPage = (page: number) => {
    setCurrentPage(page)
  }

  const nextPage = () => {
    if (hasNextPage) {
      setCurrentPage(currentPage + 1)
    }
  }

  const prevPage = () => {
    if (hasPrevPage) {
      setCurrentPage(currentPage - 1)
    }
  }

  // Loading component
  const LoadingSpinner = () => (
    <div className='flex items-center justify-center'>
      <div className='animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500' />
    </div>
  )

  const TableSkeleton = () => (
    <div className='bg-gray-800 rounded-lg shadow-lg border border-gray-700 overflow-hidden'>
      <div className='overflow-x-auto'>
        <table className='w-full'>
          <thead className='bg-gray-700 text-white'>
            <tr>
              <th className='text-left p-4 font-semibold'>Time</th>
              <th className='text-left p-4 font-semibold'>Type</th>
              <th className='text-left p-4 font-semibold'>Price (USD)</th>
              <th className='text-left p-4 font-semibold'>From</th>
              <th className='text-left p-4 font-semibold'>To</th>
              <th className='text-left p-4 font-semibold'>Amount In</th>
              <th className='text-left p-4 font-semibold'>Amount Out</th>
              <th className='text-left p-4 font-semibold'>Total USD</th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 5 }).map((_, index) => (
              <tr key={index} className='border-b border-gray-600'>
                <td className='p-4'>
                  <div className='h-4 bg-gray-600 rounded animate-pulse' />
                </td>
                <td className='p-4'>
                  <div className='h-6 w-16 bg-gray-600 rounded-full animate-pulse' />
                </td>
                <td className='p-4'>
                  <div className='h-4 bg-gray-600 rounded animate-pulse' />
                </td>
                <td className='p-4'>
                  <div className='h-4 bg-gray-600 rounded animate-pulse' />
                </td>
                <td className='p-4'>
                  <div className='h-4 bg-gray-600 rounded animate-pulse' />
                </td>
                <td className='p-4'>
                  <div className='h-4 bg-gray-600 rounded animate-pulse' />
                </td>
                <td className='p-4'>
                  <div className='h-4 bg-gray-600 rounded animate-pulse' />
                </td>
                <td className='p-4'>
                  <div className='h-4 bg-gray-600 rounded animate-pulse' />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )

  return (
    <div className='min-h-screen bg-gray-900 p-12 flex justify-center '>
      <div className='min-h-screen w-full container'>
        <div className='max-w-7xl mx-auto'>
          {/* Header */}
          <div className='bg-gray-800 rounded-lg shadow-lg border border-gray-700 p-6 mb-6'>
            <div className='flex justify-between items-center mb-4'>
              <h1 className='text-lg font-semibold text-white'>Trade History</h1>
              <div className='flex gap-3'>
                <button
                  className='px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors shadow-lg flex items-center gap-2'
                  onClick={openSettingsModal}
                >
                  <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path
                      d='M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z'
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                    />
                    <path d='M15 12a3 3 0 11-6 0 3 3 0 016 0z' strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} />
                  </svg>
                  Settings
                </button>
                <button
                  className='px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors shadow-lg'
                  disabled={isLoadingTradeHistory || isLoadingUserConfig}
                  onClick={refreshData}
                >
                  <svg
                    className={`w-4 h-4 ${isLoadingTradeHistory || isLoadingUserConfig ? 'animate-spin' : ''}`}
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      d='M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15'
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                    />
                  </svg>
                  {isLoadingTradeHistory || isLoadingUserConfig ? 'Loading...' : 'Refresh Data'}
                </button>
              </div>
            </div>

            {/* Version Selector */}
            <div className='flex flex-wrap gap-3'>
              {dataUserConfig?.users?.map((item: any) => {
                return (
                  <button
                    key={item._id}
                    className={`px-4 cursor-pointer py-2 rounded-lg border-2 font-medium transition-all ${
                      userConfigCurrent?._id === item._id
                        ? 'bg-blue-500 border-blue-500 text-white shadow-md'
                        : 'bg-gray-700 border-gray-600 text-gray-200 hover:border-blue-400 hover:text-blue-400 hover:bg-gray-600'
                    }`}
                    onClick={() => setUserConfigCurrent(item)}
                  >
                    Version {item.version}
                  </button>
                )
              })}
            </div>

            {/* Stats */}
            {isLoadingTradeHistory ? (
              <div className='mt-4 text-sm text-gray-400 flex items-center gap-2'>
                <LoadingSpinner />
                <span>Loading trade data...</span>
              </div>
            ) : history && history.length > 0 ? (
              <div className='mt-4 text-sm text-gray-400'>
                Total Trades: <span className='font-semibold text-white'>{totalTrades}</span> | Page:{' '}
                <span className='font-semibold text-white'>{currentPage}</span> of <span className='font-semibold text-white'>{totalPages}</span>
              </div>
            ) : null}
          </div>

          {/* Portfolio Stats - Compact */}
          {userConfigCurrent && portfolioStats && !isLoadingTokenPrice && (
            <div className='bg-gray-800 rounded-lg shadow-lg border border-gray-700 p-4 mb-6'>
              <div className='flex flex-wrap items-center justify-between gap-4'>
                <div>
                  {' '}
                  <h2 className='text-xl font-bold text-white'>Portfolio</h2>
                  <div className='  text-white'>
                    Price ETH now:{' '}
                    {BigNumber(dataTokenPrice?.price || '0')
                      .decimalPlaces(4)
                      .toFormat()}{' '}
                  </div>
                </div>

                <div className='flex flex-wrap gap-4 text-sm'>
                  <div className='text-center'>
                    <div className='text-gray-400 text-xs'>Initial Capital</div>
                    <div className='text-white font-bold'>${BigNumber(portfolioStats.initialCapital).decimalPlaces(4).toFormat()}</div>
                  </div>

                  <div className='text-center'>
                    <div className='text-gray-400 text-xs'>USD Buy</div>
                    <div className='text-white font-bold'>${BigNumber(portfolioStats.totalPortfolioValue).decimalPlaces(4).toFormat()}</div>
                  </div>
                  <div className='text-center'>
                    <div className='text-gray-400 text-xs'>P&L</div>
                    <div className={`font-bold ${portfolioStats.profitLossPercentage >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {portfolioStats.profitLossPercentage >= 0 ? '+' : ''}
                      {portfolioStats.profitLossPercentage.toFixed(4)}%
                    </div>
                  </div>
                  {portfolioStats.avgPrice > 0 && (
                    <div className='text-center'>
                      <div className='text-gray-400 text-xs'>Avg Price</div>
                      <div className='text-white font-bold'>${BigNumber(portfolioStats.avgPrice).decimalPlaces(4).toFormat()}</div>
                    </div>
                  )}
                  <div className='text-center'>
                    <div className='text-gray-400 text-xs'>Slippage</div>
                    <div className='text-white font-bold'>{portfolioStats.slippageTolerance}%</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Table */}
          {isLoadingTradeHistory || !userConfigCurrent ? (
            <TableSkeleton />
          ) : history && history.length > 0 ? (
            <div className='bg-gray-800 rounded-lg shadow-lg border border-gray-700 overflow-hidden'>
              <div className='overflow-x-auto'>
                <table className='w-full'>
                  <thead className='bg-gray-700 text-white'>
                    <tr>
                      <th className='text-left p-4 font-semibold'>Time</th>
                      <th className='text-left p-4 font-semibold'>Type</th>
                      <th className='text-left p-4 font-semibold'>Price (USD)</th>
                      <th className='text-left p-4 font-semibold'>From</th>
                      <th className='text-left p-4 font-semibold'>To</th>
                      <th className='text-left p-4 font-semibold'>Amount In</th>
                      <th className='text-left p-4 font-semibold'>Amount Out</th>
                      <th className='text-left p-4 font-semibold'>Total USD</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((item: any, index: number) => {
                      return (
                        <tr
                          key={item._id}
                          className={`border-b border-gray-600 hover:bg-gray-600 transition-colors ${index % 2 === 0 ? 'bg-gray-800' : 'bg-gray-750'}`}
                        >
                          <td className='p-4 text-sm text-gray-100'>
                            {new Date(item.createdAt).toLocaleDateString('vi-VN', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </td>
                          <td className='p-4'>
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${
                                item.isBuy ? 'bg-green-600 text-green-100' : item.isSell ? 'bg-red-600 text-red-100' : ''
                              }`}
                            >
                              {item.isBuy ? 'BUY' : item.isSell ? 'SELL' : ''}
                            </span>
                          </td>
                          <td className='p-4 font-mono text-sm text-gray-100'>
                            $
                            {parseFloat(item.price).toLocaleString('en-US', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </td>
                          <td className='p-4 font-medium text-sm text-gray-300'>{item.infoSwap?.from || '-'}</td>
                          <td className='p-4 font-medium text-sm text-gray-300'>{item.infoSwap?.to || '-'}</td>
                          <td className='p-4 font-mono text-sm text-gray-100'>
                            {item.infoSwap?.amountIn
                              ? parseFloat(item.infoSwap.amountIn.toString()).toLocaleString('en-US', {
                                  minimumFractionDigits: 4,
                                  maximumFractionDigits: 6,
                                })
                              : '-'}
                          </td>
                          <td className='p-4 font-mono text-sm text-gray-100'>
                            {item.infoSwap?.amountOut
                              ? parseFloat(item.infoSwap.amountOut.toString()).toLocaleString('en-US', {
                                  minimumFractionDigits: 6,
                                  maximumFractionDigits: 8,
                                })
                              : '-'}
                          </td>
                          <td className='p-4 font-mono text-sm font-semibold text-yellow-400'>
                            $
                            {parseFloat(item.buyAmountUSD || '0').toLocaleString('en-US', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className='flex items-center justify-between px-6 py-4 bg-gray-700 border-t border-gray-600'>
                  <div className='text-sm text-gray-300'>
                    Showing {(currentPage - 1) * 20 + 1} to {Math.min(currentPage * 20, totalTrades)} of {totalTrades} entries
                  </div>
                  <div className='flex items-center space-x-2'>
                    <button
                      className='px-3 py-2 text-sm font-medium text-gray-300 bg-gray-600 border border-gray-500 rounded-md hover:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed'
                      disabled={!hasPrevPage}
                      onClick={prevPage}
                    >
                      Previous
                    </button>

                    <div className='flex space-x-1'>
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        const page = i + 1

                        return (
                          <button
                            key={page}
                            className={`px-3 py-2 text-sm font-medium rounded-md ${
                              currentPage === page ? 'bg-blue-500 text-white' : 'text-gray-300 bg-gray-600 border border-gray-500 hover:bg-gray-500'
                            }`}
                            onClick={() => goToPage(page)}
                          >
                            {page}
                          </button>
                        )
                      })}
                    </div>

                    <button
                      className='px-3 py-2 text-sm font-medium text-gray-300 bg-gray-600 border border-gray-500 rounded-md hover:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed'
                      disabled={!hasNextPage}
                      onClick={nextPage}
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : !isLoadingTradeHistory ? (
            <div className='bg-gray-800 rounded-lg shadow-lg border border-gray-700 p-12 text-center'>
              <div className='text-gray-400 text-lg'>No trade history available</div>
              <p className='text-gray-500 mt-2'>Start trading to see your history here</p>
            </div>
          ) : null}
        </div>

        {/* Settings Modal */}
        {isSettingsModalOpen && (
          <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
            <div className='bg-gray-800 rounded-lg shadow-xl border border-gray-700 w-full max-w-md mx-4'>
              <div className='flex justify-between items-center p-6 border-b border-gray-700'>
                <h2 className='text-xl font-semibold text-white'>Trading Settings</h2>
                <button className='text-gray-400 hover:text-white transition-colors' onClick={closeSettingsModal}>
                  <svg className='w-6 h-6' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path d='M6 18L18 6M6 6l12 12' strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} />
                  </svg>
                </button>
              </div>

              <div className='p-6 space-y-4'>
                <div>
                  <label className='block text-sm font-medium text-gray-300 mb-2' htmlFor='stepSize'>
                    Step Size (USDT)
                  </label>
                  <input
                    className='w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500'
                    id='stepSize'
                    type='number'
                    value={settingsForm.stepSize}
                    onChange={(e) => handleSettingsChange('stepSize', e.target.value)}
                  />
                </div>

                <div>
                  <label className='block text-sm font-medium text-gray-300 mb-2' htmlFor='slippageTolerance'>
                    Slippage Tolerance (USDT)
                  </label>
                  <input
                    className='w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500'
                    id='slippageTolerance'
                    type='number'
                    value={settingsForm.slippageTolerance}
                    onChange={(e) => handleSettingsChange('slippageTolerance', e.target.value)}
                  />
                </div>

                <div>
                  <label className='block text-sm font-medium text-gray-300 mb-2' htmlFor='maxPrice'>
                    Max Price (USDT)
                  </label>
                  <input
                    className='w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500'
                    id='maxPrice'
                    type='number'
                    value={settingsForm.maxPrice}
                    onChange={(e) => handleSettingsChange('maxPrice', e.target.value)}
                  />
                </div>

                <div>
                  <label className='block text-sm font-medium text-gray-300 mb-2' htmlFor='minPrice'>
                    Min Price (USDT)
                  </label>
                  <input
                    className='w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500'
                    id='minPrice'
                    type='number'
                    value={settingsForm.minPrice}
                    onChange={(e) => handleSettingsChange('minPrice', e.target.value)}
                  />
                </div>

                <div>
                  <label className='block text-sm font-medium text-gray-300 mb-2' htmlFor='ratioPriceUp'>
                    Ratio Price Up
                  </label>
                  <input
                    className='w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500'
                    id='ratioPriceUp'
                    step='0.01'
                    type='number'
                    value={settingsForm.ratioPriceUp}
                    onChange={(e) => handleSettingsChange('ratioPriceUp', e.target.value)}
                  />
                </div>

                <div>
                  <label className='block text-sm font-medium text-gray-300 mb-2' htmlFor='ratioPriceDown'>
                    Ratio Price Down
                  </label>
                  <input
                    className='w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500'
                    id='ratioPriceDown'
                    step='0.01'
                    type='number'
                    value={settingsForm.ratioPriceDown}
                    onChange={(e) => handleSettingsChange('ratioPriceDown', e.target.value)}
                  />
                </div>
              </div>

              <div className='flex justify-end gap-3 p-6 border-t border-gray-700'>
                <button className='px-4 py-2 text-gray-300 bg-gray-600 hover:bg-gray-500 rounded-lg transition-colors' onClick={closeSettingsModal}>
                  Cancel
                </button>
                <button className='px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors' onClick={saveSettings}>
                  Save Settings
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default TradeInfoPage
