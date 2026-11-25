import { useMemo } from 'react'
import { BigNumber } from 'bignumber.js'

import LoadingSpinner from '../LoadingSpinner'

import useFundingRate, { fundingRateZone } from '@/hooks/tank-query/useFundingRate'
import { FUNDING_RATE_LIMIT, FUNDING_RATE_ZONES } from '@/constants/app'
import LineChart from '@/components/LineChart'

const ZONE_CLASS: Record<string, { text: string; bg: string }> = {
  Negative: { text: '!text-green-400', bg: 'bg-green-600 text-green-100' },
  Low: { text: '!text-lime-400', bg: 'bg-lime-600 text-lime-100' },
  Neutral: { text: '!text-yellow-400', bg: 'bg-yellow-600 text-yellow-100' },
  High: { text: '!text-orange-400', bg: 'bg-orange-600 text-orange-100' },
  Extreme: { text: '!text-red-400', bg: 'bg-red-600 text-red-100' },
}

const formatRate = (value?: number) => {
  if (value === undefined || value === null) return '-'

  return `${BigNumber(value).decimalPlaces(4).toFormat()}%`
}

const formatTime = (value?: number) => {
  if (!value) return '-'

  return new Date(value).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
}

const ValueCell = ({ title, value }: { title: string; value?: number }) => {
  const zoneClass = ZONE_CLASS[fundingRateZone(value)?.key || ''] || ZONE_CLASS.Neutral

  return (
    <div>
      <div className='text-gray-400 text-xs'>{title}</div>
      <div className={`font-bold ${zoneClass.text}`}>{formatRate(value)}</div>
    </div>
  )
}

const MarketFundingRate = () => {
  const { data, zone, isLoading, refetch } = useFundingRate()

  const zoneClass = ZONE_CLASS[zone?.key || ''] || ZONE_CLASS.Neutral

  const chart = useMemo(() => {
    if (!data?.points?.length) return null

    return {
      values: data.points.map((item) => item.rate),
      labels: data.points.map((item) => formatTime(item.timestamp)),
    }
  }, [data?.points])

  return (
    <div className='bg-gray-800 rounded-lg shadow-lg border border-gray-700 p-4 mb-6'>
      <div className='flex flex-wrap items-center justify-between gap-3 mb-3'>
        <div>
          <h2 className='text-xl font-bold text-white'>
            Funding Rate <span className='text-sm text-gray-400'>(Phí giữ vị thế perp)</span>
          </h2>
          <div className='text-xs text-gray-400'>
            {data?.symbol || 'BTCUSDT'} · 1 kỳ = 8h · {FUNDING_RATE_LIMIT} kỳ gần nhất{data?.source ? ` · nguồn ${data.source}` : ''}
          </div>
        </div>
        <button
          className='px-3 py-2 text-sm text-gray-300 bg-gray-700 border border-gray-600 rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed'
          disabled={isLoading}
          onClick={() => refetch()}
        >
          {isLoading ? 'Loading...' : 'Reload funding'}
        </button>
      </div>

      {isLoading && (
        <div className='text-sm text-gray-400 flex items-center gap-2'>
          <LoadingSpinner />
          <span>Loading funding rate...</span>
        </div>
      )}

      {!isLoading && !data && <div className='text-sm text-gray-400'>No data</div>}

      {!isLoading && data && (
        <div className='flex flex-wrap gap-4'>
          <div className='flex-1 min-w-[220px] bg-gray-700/40 rounded-lg border border-gray-600 p-4'>
            <div className='flex items-start justify-between gap-2'>
              <div>
                <div className='text-gray-400 text-xs'>Kỳ hiện tại</div>
                <div className={`font-bold text-3xl ${zoneClass.text}`}>{formatRate(data.now.rate)}</div>
                <div className='text-xs text-gray-400 mt-1'>Kỳ tới: {formatTime(data.now.nextFundingTime)}</div>
              </div>
              {zone && <span className={`px-2 py-1 rounded-full text-xs font-medium ${zoneClass.bg}`}>{zone.key}</span>}
            </div>

            {zone && (
              <div className={`mt-3 text-sm font-semibold ${zoneClass.text}`}>
                {zone.icon} {zone.label}
              </div>
            )}

            <div className='mt-4 flex flex-wrap gap-4 text-sm'>
              <ValueCell title='TB 7 ngày' value={data.average7} />
              <ValueCell title='TB 30 ngày' value={data.average30} />
              <div>
                <div className='text-gray-400 text-xs'>APR ước tính</div>
                <div className={`font-bold ${data.apr >= 0 ? '!text-orange-400' : '!text-green-400'}`}>
                  {data.apr > 0 ? '+' : ''}
                  {BigNumber(data.apr).decimalPlaces(2).toFormat()}%
                </div>
              </div>
              <div>
                <div className='text-gray-400 text-xs'>Số kỳ âm</div>
                <div className='font-bold !text-green-400'>
                  {data.totalNegative}/{data.points.length}
                </div>
              </div>
            </div>

            <div className='mt-4 text-xs text-gray-400'>
              Mark ${BigNumber(data.now.markPrice).decimalPlaces(2).toFormat()} · Index ${BigNumber(data.now.indexPrice).decimalPlaces(2).toFormat()}
            </div>
          </div>

          <div className='flex-[2] min-w-[300px] bg-gray-700/40 rounded-lg border border-gray-600 p-4'>
            <div className='flex items-center justify-between text-xs text-gray-400 mb-2'>
              <span>Lịch sử {data.points.length} kỳ</span>
              <span>Dương = long trả phí, âm = short trả phí</span>
            </div>

            {chart && (
              <LineChart
                color='#e5e7eb'
                data={chart.values}
                formatValue={(value) => `${formatRate(value)} — ${fundingRateZone(value)?.key || ''}`}
                gridValues={[0, 0.01]}
                height={180}
                labels={chart.labels}
              />
            )}

            <div className='mt-3 text-xs text-gray-400 flex flex-wrap gap-x-4'>
              {FUNDING_RATE_ZONES.map((item, index) => (
                <div key={item.key}>
                  {item.icon} {item.key} — {item.max === Infinity ? `>= ${FUNDING_RATE_ZONES[index - 1].max}%` : `< ${item.max}%`}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default MarketFundingRate
