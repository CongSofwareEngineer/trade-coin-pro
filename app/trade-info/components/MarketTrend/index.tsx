import { useMemo } from 'react'
import { BigNumber } from 'bignumber.js'

import LoadingSpinner from '../LoadingSpinner'

import useMA200, { MA200Info } from '@/hooks/tank-query/useMA200'
import { MA_PERIOD } from '@/constants/app'

type Props = {
  tokenInput?: string
}

const formatPrice = (value?: number) => {
  if (!value) return '-'

  return `$${BigNumber(value).decimalPlaces(4).toFormat()}`
}

const MaCard = ({ title, subTitle, data }: { title: string; subTitle: string; data: MA200Info | null }) => {
  if (!data) {
    return (
      <div className='flex-1 min-w-[220px] bg-gray-700/40 rounded-lg border border-gray-600 p-4'>
        <div className='text-sm font-semibold text-white'>{title}</div>
        <div className='text-xs text-gray-400 mt-2'>No data</div>
      </div>
    )
  }

  const isUp = data.isUpTrend

  return (
    <div className='flex-1 min-w-[220px] bg-gray-700/40 rounded-lg border border-gray-600 p-4'>
      <div className='flex items-center justify-between gap-2'>
        <div>
          <div className='text-sm font-semibold text-white'>{title}</div>
          <div className='text-xs text-gray-400'>{subTitle}</div>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${isUp ? 'bg-green-600 text-green-100' : 'bg-red-600 text-red-100'}`}>
          {isUp ? 'UPTREND' : 'DOWNTREND'}
        </span>
      </div>

      <div className='mt-3 flex flex-wrap gap-4 text-sm'>
        <div>
          <div className='text-gray-400 text-xs'>MA{MA_PERIOD}</div>
          <div className='text-white font-bold'>{formatPrice(data.ma200)}</div>
        </div>
        <div>
          <div className='text-gray-400 text-xs'>Close</div>
          <div className='text-white font-bold'>{formatPrice(data.lastClose)}</div>
        </div>
        <div>
          <div className='text-gray-400 text-xs'>vs MA{MA_PERIOD}</div>
          <div className={`font-bold ${isUp ? 'text-green-400' : 'text-red-400'}`}>
            {data.diffPercent > 0 ? '+' : ''}
            {data.diffPercent}%
          </div>
        </div>
      </div>

      {!data.isEnoughData && (
        <div className='mt-2 text-xs text-yellow-400'>
          Only {data.totalCandles} candles, MA is not full {MA_PERIOD}
        </div>
      )}
    </div>
  )
}

const MarketTrend = ({ tokenInput }: Props) => {
  const { daily, weekly, isLoading, refetch, symbol } = useMA200(tokenInput)

  const trend = useMemo(() => {
    if (!daily || !weekly) return null

    if (daily.isUpTrend && weekly.isUpTrend) return { label: 'BULL — price above MA200 on both 1D and 1W', className: 'text-green-400' }

    if (!daily.isUpTrend && !weekly.isUpTrend) return { label: 'BEAR — price below MA200 on both 1D and 1W', className: 'text-red-400' }

    return { label: 'SIDEWAYS — 1D and 1W disagree, wait for confirmation', className: 'text-yellow-400' }
  }, [daily, weekly])

  if (!tokenInput) return null

  return (
    <div className='bg-gray-800 rounded-lg shadow-lg border border-gray-700 p-4 mb-6'>
      <div className='flex flex-wrap items-center justify-between gap-3 mb-3'>
        <div>
          <h2 className='text-xl font-bold text-white'>
            Market Trend MA{MA_PERIOD} <span className='text-sm text-gray-400'>({symbol})</span>
          </h2>
          {trend && <div className={`text-sm font-semibold ${trend.className}`}>{trend.label}</div>}
        </div>
        <button
          className='px-3 py-2 text-sm text-gray-300 bg-gray-700 border border-gray-600 rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed'
          disabled={isLoading}
          onClick={() => refetch()}
        >
          {isLoading ? 'Loading...' : 'Reload MA'}
        </button>
      </div>

      {isLoading ? (
        <div className='text-sm text-gray-400 flex items-center gap-2'>
          <LoadingSpinner />
          <span>Loading MA{MA_PERIOD}...</span>
        </div>
      ) : (
        <div className='flex flex-wrap gap-4'>
          <MaCard data={daily} subTitle='Candle 1 day' title='Daily (1D)' />
          <MaCard data={weekly} subTitle='Candle 1 week' title='Weekly (1W)' />
        </div>
      )}
    </div>
  )
}

export default MarketTrend
