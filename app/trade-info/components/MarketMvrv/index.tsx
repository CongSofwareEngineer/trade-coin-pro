import { useMemo } from 'react'
import { BigNumber } from 'bignumber.js'

import LoadingSpinner from '../LoadingSpinner'

import useMVRV, { mvrvZone } from '@/hooks/tank-query/useMVRV'
import { MVRV_CACHE_TIME, MVRV_HISTORY_DAYS, MVRV_ZONES } from '@/constants/app'
import LineChart from '@/components/LineChart'

const MVRV_MAX_SCALE = 4

const CHART_BANDS = MVRV_ZONES.map((zone, index) => ({
  from: index === 0 ? 0 : MVRV_ZONES[index - 1].max,
  to: zone.max === Infinity ? MVRV_MAX_SCALE : zone.max,
  color: zone.color,
}))

const CHART_GRID = MVRV_ZONES.filter((zone) => zone.max !== Infinity).map((zone) => zone.max)

const formatDate = (value?: number) => {
  if (!value) return '-'

  return new Date(value).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

const ChangeCell = ({ title, value }: { title: string; value: number }) => (
  <div>
    <div className='text-gray-400 text-xs'>{title}</div>
    <div className={`font-bold ${value >= 0 ? '!text-green-400' : '!text-red-400'}`}>
      {value > 0 ? '+' : ''}
      {BigNumber(value).decimalPlaces(2).toFormat()}%
    </div>
  </div>
)

const ZONE_CLASS: Record<string, { text: string; bg: string }> = {
  Bottom: { text: 'text-green-400', bg: 'bg-green-600 text-green-100' },
  Low: { text: 'text-green-400', bg: 'bg-green-600 text-green-100' },
  Neutral: { text: 'text-yellow-400', bg: 'bg-yellow-600 text-yellow-100' },
  Hot: { text: 'text-orange-400', bg: 'bg-orange-600 text-orange-100' },
  Top: { text: 'text-red-400', bg: 'bg-red-600 text-red-100' },
}

const formatTime = (value?: number) => {
  if (!value) return '-'

  return new Date(value).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
}

const MarketMvrv = () => {
  const { data, zone, isLoading, refetchForce } = useMVRV()

  const zoneClass = ZONE_CLASS[zone?.key || ''] || ZONE_CLASS.Neutral

  const chart = useMemo(() => {
    if (!data?.history?.length) return null

    return {
      values: data.history.map((item) => item.mvrv),
      labels: data.history.map((item) => formatDate(item.timestamp)),
    }
  }, [data?.history])

  const markerPercent = useMemo(() => {
    if (!data?.mvrv) return 0

    const percent = BigNumber(data.mvrv).dividedBy(MVRV_MAX_SCALE).multipliedBy(100)

    if (percent.gt(100)) return 100
    if (percent.lt(0)) return 0

    return percent.decimalPlaces(2).toNumber()
  }, [data?.mvrv])

  return (
    <div className='bg-gray-800 rounded-lg shadow-lg border border-gray-700 p-4 mb-6'>
      <div className='flex flex-wrap items-center justify-between gap-3 mb-3'>
        <div>
          <h2 className='text-xl font-bold text-white'>
            MVRV <span className='text-sm text-gray-400'>(BTC toàn mạng)</span>
          </h2>
          <div className='text-xs text-gray-400'>
            Cache {MVRV_CACHE_TIME / 60000} phút, API bị limit nên không gọi liên tục · chart {MVRV_HISTORY_DAYS} ngày
          </div>
        </div>
        <button
          className='px-3 py-2 text-sm text-gray-300 bg-gray-700 border border-gray-600 rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed'
          disabled={isLoading}
          onClick={() => refetchForce()}
        >
          {isLoading ? 'Loading...' : 'Reload MVRV'}
        </button>
      </div>

      {isLoading && (
        <div className='text-sm text-gray-400 flex items-center gap-2'>
          <LoadingSpinner />
          <span>Loading MVRV...</span>
        </div>
      )}

      {!isLoading && !data && <div className='text-sm text-gray-400'>No data</div>}

      {!isLoading && data && (
        <div className='flex flex-wrap gap-4'>
          <div className='flex-1 min-w-[220px] bg-gray-700/40 rounded-lg border border-gray-600 p-4'>
            <div className='flex items-center justify-between gap-2'>
              <div>
                <div className='text-gray-400 text-xs'>MVRV</div>
                <div className='text-white font-bold text-2xl'>{BigNumber(data.mvrv).decimalPlaces(2).toFormat()}</div>
              </div>
              {zone && <span className={`px-2 py-1 rounded-full text-xs font-medium ${zoneClass.bg}`}>{zone.key.toUpperCase()}</span>}
            </div>

            {zone && (
              <div className={`mt-3 text-sm font-semibold ${zoneClass.text}`}>
                {zone.icon} {zone.label}
              </div>
            )}

            <div className='mt-3 h-[8px] w-full rounded-full bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 relative'>
              <div className='absolute top-[-4px] w-[4px] h-[16px] bg-white rounded-full' style={{ left: `${markerPercent}%` }} />
            </div>
            <div className='mt-1 flex justify-between text-[10px] text-gray-500'>
              <span>0</span>
              <span>1</span>
              <span>2.4</span>
              <span>3.5</span>
              <span>{MVRV_MAX_SCALE}+</span>
            </div>
          </div>

          <div className='flex-1 min-w-[220px] bg-gray-700/40 rounded-lg border border-gray-600 p-4'>
            <div className='flex flex-wrap gap-4 text-sm'>
              <div>
                <div className='text-gray-400 text-xs'>Data date</div>
                <div className='text-white font-bold'>{data.date || '-'}</div>
              </div>
              <div>
                <div className='text-gray-400 text-xs'>Source</div>
                <div className='text-white font-bold'>{data.source || '-'}</div>
              </div>
              <div>
                <div className='text-gray-400 text-xs'>Updated</div>
                <div className='text-white font-bold'>{formatTime(data.updatedAt)}</div>
              </div>
              <div>
                <div className='text-gray-400 text-xs'>Next call</div>
                <div className='text-white font-bold'>{formatTime(data.updatedAt + MVRV_CACHE_TIME)}</div>
              </div>
            </div>

            <div className='mt-3 text-xs text-gray-400'>
              {MVRV_ZONES.map((item) => (
                <div key={item.key} className='mb-1'>
                  {item.icon} {item.key} — {item.max === Infinity ? `> ${MVRV_ZONES[MVRV_ZONES.length - 2].max}` : `< ${item.max}`}
                </div>
              ))}
            </div>
          </div>

          <div className='w-full bg-gray-700/40 rounded-lg border border-gray-600 p-4'>
            <div className='flex flex-wrap items-center justify-between gap-2 text-xs text-gray-400 mb-2'>
              <span>Lịch sử {data.history.length} ngày gần nhất</span>
              <span>
                Cao nhất {BigNumber(data.high).decimalPlaces(2).toFormat()} · thấp nhất {BigNumber(data.low).decimalPlaces(2).toFormat()}
              </span>
            </div>

            {chart ? (
              <>
                <LineChart
                  bands={CHART_BANDS}
                  color='#e5e7eb'
                  data={chart.values}
                  formatValue={(value) => `${BigNumber(value).decimalPlaces(2).toFormat()} — ${mvrvZone(value)?.key || ''}`}
                  gridValues={CHART_GRID}
                  height={180}
                  labels={chart.labels}
                />

                <div className='mt-3 flex flex-wrap gap-4 text-sm'>
                  <ChangeCell title='So hôm qua' value={data.changeDay} />
                  <ChangeCell title='So tuần trước' value={data.changeWeek} />
                </div>
              </>
            ) : (
              <div className='text-xs text-gray-400'>Không lấy được lịch sử MVRV (nguồn dự phòng chỉ trả giá trị cuối)</div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default MarketMvrv
