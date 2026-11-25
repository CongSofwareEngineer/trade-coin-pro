import { useMemo } from 'react'
import { BigNumber } from 'bignumber.js'

import LoadingSpinner from '../LoadingSpinner'

import useFearGreed, { fearGreedZone } from '@/hooks/tank-query/useFearGreed'
import { FEAR_GREED_LIMIT, FEAR_GREED_ZONES } from '@/constants/app'
import LineChart from '@/components/LineChart'

const ZONE_CLASS: Record<string, { text: string; bg: string }> = {
  ExtremeFear: { text: 'text-green-400', bg: 'bg-green-600 text-green-100' },
  Fear: { text: 'text-lime-400', bg: 'bg-lime-600 text-lime-100' },
  Neutral: { text: 'text-yellow-400', bg: 'bg-yellow-600 text-yellow-100' },
  Greed: { text: 'text-orange-400', bg: 'bg-orange-600 text-orange-100' },
  ExtremeGreed: { text: 'text-red-400', bg: 'bg-red-600 text-red-100' },
}

const CHART_BANDS = FEAR_GREED_ZONES.map((zone, index) => ({
  from: index === 0 ? 0 : FEAR_GREED_ZONES[index - 1].max,
  to: zone.max === Infinity ? 100 : zone.max,
  color: zone.color,
}))

const formatDate = (value?: number) => {
  if (!value) return '-'

  return new Date(value).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

const ValueCell = ({ title, value }: { title: string; value?: number }) => {
  const zone = fearGreedZone(value)
  const zoneClass = ZONE_CLASS[zone?.key || ''] || ZONE_CLASS.Neutral

  return (
    <div>
      <div className='text-gray-400 text-xs'>{title}</div>
      <div className={`font-bold ${zoneClass.text}`}>{value === undefined ? '-' : value}</div>
    </div>
  )
}

const MarketFearGreed = () => {
  const { data, zone, isLoading, refetch } = useFearGreed()

  const zoneClass = ZONE_CLASS[zone?.key || ''] || ZONE_CLASS.Neutral

  const chart = useMemo(() => {
    if (!data?.points?.length) return null

    return {
      values: data.points.map((item) => item.value),
      labels: data.points.map((item) => formatDate(item.timestamp)),
    }
  }, [data?.points])

  const diffYesterday = useMemo(() => {
    if (!data?.now || !data?.yesterday) return null

    return BigNumber(data.now.value).minus(data.yesterday.value).toNumber()
  }, [data?.now, data?.yesterday])

  return (
    <div className='bg-gray-800 rounded-lg shadow-lg border border-gray-700 p-4 mb-6'>
      <div className='flex flex-wrap items-center justify-between gap-3 mb-3'>
        <div>
          <h2 className='text-xl font-bold text-white'>
            Fear &amp; Greed Index <span className='text-sm text-gray-400'>(Sợ hãi / Tham lam)</span>
          </h2>
          <div className='text-xs text-gray-400'>Nguồn Alternative.me, update 1 lần/ngày, {FEAR_GREED_LIMIT} ngày gần nhất</div>
        </div>
        <button
          className='px-3 py-2 text-sm text-gray-300 bg-gray-700 border border-gray-600 rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed'
          disabled={isLoading}
          onClick={() => refetch()}
        >
          {isLoading ? 'Loading...' : 'Reload index'}
        </button>
      </div>

      {isLoading && (
        <div className='text-sm text-gray-400 flex items-center gap-2'>
          <LoadingSpinner />
          <span>Loading Fear &amp; Greed...</span>
        </div>
      )}

      {!isLoading && !data && <div className='text-sm text-gray-400'>No data</div>}

      {!isLoading && data && (
        <div className='flex flex-wrap gap-4'>
          <div className='flex-1 min-w-[220px] bg-gray-700/40 rounded-lg border border-gray-600 p-4'>
            <div className='flex items-center justify-between gap-2'>
              <div>
                <div className='text-gray-400 text-xs'>Hôm nay</div>
                <div className={`font-bold text-4xl ${zoneClass.text}`}>{data.now.value}</div>
                <div className='text-xs text-gray-400 mt-1'>{formatDate(data.now.timestamp)}</div>
              </div>
              {zone && <span className={`px-2 py-1 rounded-full text-xs font-medium ${zoneClass.bg}`}>{data.now.classification || zone.key}</span>}
            </div>

            {zone && (
              <div className={`mt-3 text-sm font-semibold ${zoneClass.text}`}>
                {zone.icon} {zone.label}
              </div>
            )}

            <div className='mt-3 h-[8px] w-full rounded-full bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 relative'>
              <div className='absolute top-[-4px] w-[4px] h-[16px] bg-white rounded-full' style={{ left: `${data.now.value}%` }} />
            </div>
            <div className='mt-1 flex justify-between text-[10px] text-gray-500'>
              <span>0</span>
              <span>25</span>
              <span>45</span>
              <span>56</span>
              <span>76</span>
              <span>100</span>
            </div>

            <div className='mt-4 flex flex-wrap gap-4 text-sm'>
              <ValueCell title='Hôm qua' value={data.yesterday?.value} />
              <ValueCell title='Tuần trước' value={data.lastWeek?.value} />
              <ValueCell title='TB 7 ngày' value={data.average7} />
              <ValueCell title='TB 30 ngày' value={data.average30} />
              {diffYesterday !== null && (
                <div>
                  <div className='text-gray-400 text-xs'>Thay đổi</div>
                  <div className={`font-bold ${diffYesterday >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {diffYesterday > 0 ? '+' : ''}
                    {diffYesterday}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className='flex-[2] min-w-[300px] bg-gray-700/40 rounded-lg border border-gray-600 p-4'>
            <div className='flex items-center justify-between text-xs text-gray-400 mb-2'>
              <span>Lịch sử {data.points.length} ngày</span>
              <span>Dải màu: xanh = sợ hãi, đỏ = tham lam</span>
            </div>

            {chart && (
              <LineChart
                bands={CHART_BANDS}
                color='#e5e7eb'
                data={chart.values}
                formatValue={(value) => `${value} — ${fearGreedZone(value)?.key || ''}`}
                gridValues={[25, 45, 56, 76]}
                height={180}
                labels={chart.labels}
                max={100}
                min={0}
              />
            )}

            <div className='mt-3 text-xs text-gray-400 flex flex-wrap gap-x-4'>
              {FEAR_GREED_ZONES.map((item, index) => (
                <div key={item.key}>
                  {item.icon} {item.key} — {item.max === Infinity ? `>= ${FEAR_GREED_ZONES[index - 1].max}` : `< ${item.max}`}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default MarketFearGreed
