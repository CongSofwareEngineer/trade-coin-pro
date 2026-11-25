import { useMemo } from 'react'
import { BigNumber } from 'bignumber.js'

import LoadingSpinner from '../LoadingSpinner'

import useCycleHigh from '@/hooks/tank-query/useCycleHigh'
import { CYCLE_WEEKS } from '@/constants/app'
import LineChart from '@/components/LineChart'

type Props = {
  tokenInput?: string
}

const formatPrice = (value?: number) => {
  if (!value) return '-'

  return `$${BigNumber(value).decimalPlaces(2).toFormat()}`
}

const formatDate = (value?: number) => {
  if (!value) return '-'

  return new Date(value).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

const MarketCycleHigh = ({ tokenInput }: Props) => {
  const { data, isLoading, refetch, symbol } = useCycleHigh(tokenInput)

  const chart = useMemo(() => {
    if (!data?.points?.length) return null

    return {
      values: data.points.map((item) => item.close),
      labels: data.points.map((item) => formatDate(item.time)),
    }
  }, [data?.points])

  // Khoảng cách từ đỉnh chu kỳ: âm = đang dưới đỉnh
  const isNearHigh = (data?.fromHighPercent || 0) > -10

  return (
    <div className='bg-gray-800 rounded-lg shadow-lg border border-gray-700 p-4 mb-6'>
      <div className='flex flex-wrap items-center justify-between gap-3 mb-3'>
        <div>
          <h2 className='text-xl font-bold text-white'>
            Đỉnh chu kỳ 4 năm <span className='text-sm text-gray-400'>({symbol})</span>
          </h2>
          <div className='text-xs text-gray-400'>
            Nến tuần (1W), {CYCLE_WEEKS} tuần gần nhất ~ {BigNumber(CYCLE_WEEKS).dividedBy(52).decimalPlaces(1).toString()} năm
          </div>
        </div>
        <button
          className='px-3 py-2 text-sm text-gray-300 bg-gray-700 border border-gray-600 rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed'
          disabled={isLoading}
          onClick={() => refetch()}
        >
          {isLoading ? 'Loading...' : 'Reload cycle'}
        </button>
      </div>

      {isLoading && (
        <div className='text-sm text-gray-400 flex items-center gap-2'>
          <LoadingSpinner />
          <span>Loading cycle high...</span>
        </div>
      )}

      {!isLoading && !data && <div className='text-sm text-gray-400'>No data</div>}

      {!isLoading && data && (
        <div className='flex flex-wrap gap-4'>
          <div className='flex-1 min-w-[220px] bg-gray-700/40 rounded-lg border border-gray-600 p-4'>
            <div className='flex items-center justify-between gap-2'>
              <div>
                <div className='text-gray-400 text-xs'>Giá cao nhất (ATH chu kỳ)</div>
                <div className='text-yellow-400 font-bold text-2xl'>{formatPrice(data.high)}</div>
                <div className='text-xs text-gray-400 mt-1'>Tuần {formatDate(data.highTime)}</div>
              </div>
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium ${isNearHigh ? 'bg-red-600 text-red-100' : 'bg-green-600 text-green-100'}`}
              >
                {isNearHigh ? 'GẦN ĐỈNH' : 'XA ĐỈNH'}
              </span>
            </div>

            <div className='mt-3 flex flex-wrap gap-4 text-sm'>
              <div>
                <div className='text-gray-400 text-xs'>Giá hiện tại</div>
                <div className='text-white font-bold'>{formatPrice(data.lastClose)}</div>
              </div>
              <div>
                <div className='text-gray-400 text-xs'>So với đỉnh</div>
                <div className={`font-bold ${data.fromHighPercent < 0 ? 'text-red-400' : 'text-green-400'}`}>
                  {data.fromHighPercent > 0 ? '+' : ''}
                  {data.fromHighPercent}%
                </div>
              </div>
            </div>

            <div className='mt-3 flex flex-wrap gap-4 text-sm'>
              <div>
                <div className='text-gray-400 text-xs'>Giá thấp nhất chu kỳ</div>
                <div className='text-white font-bold'>{formatPrice(data.low)}</div>
                <div className='text-[10px] text-gray-500'>Tuần {formatDate(data.lowTime)}</div>
              </div>
              <div>
                <div className='text-gray-400 text-xs'>So với đáy</div>
                <div className={`font-bold ${data.fromLowPercent < 0 ? 'text-red-400' : 'text-green-400'}`}>
                  {data.fromLowPercent > 0 ? '+' : ''}
                  {data.fromLowPercent}%
                </div>
              </div>
            </div>

            {!data.isEnoughData && (
              <div className='mt-2 text-xs text-yellow-400'>
                Chỉ có {data.totalCandles} nến tuần, chưa đủ {CYCLE_WEEKS} tuần
              </div>
            )}
          </div>

          <div className='flex-[2] min-w-[300px] bg-gray-700/40 rounded-lg border border-gray-600 p-4'>
            <div className='flex items-center justify-between text-xs text-gray-400 mb-2'>
              <span>Giá đóng tuần ({data.totalCandles} tuần)</span>
              <span className='text-yellow-400'>Vạch vàng = đỉnh chu kỳ</span>
            </div>

            {chart && (
              <LineChart
                color='#60a5fa'
                data={chart.values}
                formatValue={(value) => formatPrice(value)}
                gridValues={[data.high, data.low]}
                height={180}
                highlightIndex={data.highIndex}
                highlightLabel={formatPrice(data.high)}
                labels={chart.labels}
              />
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default MarketCycleHigh
