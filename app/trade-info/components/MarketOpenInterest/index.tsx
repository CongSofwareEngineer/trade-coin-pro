import { useMemo } from 'react'
import { BigNumber } from 'bignumber.js'

import LoadingSpinner from '../LoadingSpinner'

import useOpenInterest, { longShortZone } from '@/hooks/tank-query/useOpenInterest'
import { OPEN_INTEREST_LIMIT } from '@/constants/app'
import LineChart from '@/components/LineChart'

const formatAmount = (value?: number) => {
  if (value === undefined || value === null) return '-'

  return BigNumber(value).decimalPlaces(0).toFormat()
}

const formatUsd = (value?: number) => {
  if (!value) return '-'

  return `$${BigNumber(value).dividedBy(1_000_000_000).decimalPlaces(2).toFormat()}B`
}

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
  HeavyShort: { text: '!text-red-400', bg: 'bg-red-600 text-red-100' },
  Short: { text: '!text-orange-400', bg: 'bg-orange-600 text-orange-100' },
  Balanced: { text: '!text-yellow-400', bg: 'bg-yellow-600 text-yellow-100' },
  Long: { text: '!text-lime-400', bg: 'bg-lime-600 text-lime-100' },
  HeavyLong: { text: '!text-green-400', bg: 'bg-green-600 text-green-100' },
}

const MarketOpenInterest = () => {
  const { data, isLoading, refetch } = useOpenInterest()

  const isHot = !!data && BigNumber(data.fromHighPercent).gt(-5)
  const zoneLongShort = longShortZone(data?.longShort?.long)
  const zoneClass = ZONE_CLASS[zoneLongShort?.key || ''] || ZONE_CLASS.Balanced

  const chart = useMemo(() => {
    if (!data?.points?.length) return null

    return {
      values: data.points.map((item) => item.amount),
      labels: data.points.map((item) => formatDate(item.timestamp)),
    }
  }, [data?.points])

  return (
    <div className='bg-gray-800 rounded-lg shadow-lg border border-gray-700 p-4 mb-6'>
      <div className='flex flex-wrap items-center justify-between gap-3 mb-3'>
        <div>
          <h2 className='text-xl font-bold text-white'>
            Open Interest <span className='text-sm text-gray-400'>(Tổng vị thế mở perp)</span>
          </h2>
          <div className='text-xs text-gray-400'>
            {data?.symbol || 'BTCUSDT'} · nến {data?.period || '1d'} · {OPEN_INTEREST_LIMIT} ngày gần nhất
            {data?.source ? ` · nguồn ${data.source}` : ''}
          </div>
        </div>
        <button
          className='px-3 py-2 text-sm text-gray-300 bg-gray-700 border border-gray-600 rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed'
          disabled={isLoading}
          onClick={() => refetch()}
        >
          {isLoading ? 'Loading...' : 'Reload OI'}
        </button>
      </div>

      {isLoading && (
        <div className='text-sm text-gray-400 flex items-center gap-2'>
          <LoadingSpinner />
          <span>Loading open interest...</span>
        </div>
      )}

      {!isLoading && !data && <div className='text-sm text-gray-400'>No data</div>}

      {!isLoading && data && (
        <div className='flex flex-wrap gap-4'>
          <div className='flex-1 min-w-[220px] bg-gray-700/40 rounded-lg border border-gray-600 p-4'>
            <div className='flex items-start justify-between gap-2'>
              <div>
                <div className='text-gray-400 text-xs'>Hiện tại</div>
                <div className={`font-bold text-3xl ${isHot ? '!text-orange-400' : '!text-gray-100'}`}>{formatAmount(data.now.amount)} BTC</div>
                <div className='text-xs text-gray-400 mt-1'>{formatUsd(data.now.value)}</div>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${isHot ? 'bg-orange-600 text-orange-100' : 'bg-gray-600 text-gray-100'}`}>
                {isHot ? 'Gần đỉnh' : 'Đã hạ nhiệt'}
              </span>
            </div>

            <div className={`mt-3 text-sm font-semibold ${isHot ? '!text-orange-400' : '!text-gray-300'}`}>
              {isHot ? '🟠 Đòn bẩy cao — rủi ro thanh lý mạnh' : '🟡 Đòn bẩy đã giảm so với đỉnh 30 ngày'}
            </div>

            <div className='mt-4 flex flex-wrap gap-4 text-sm'>
              <ChangeCell title='So hôm qua' value={data.changeDay} />
              <ChangeCell title='So tuần trước' value={data.changeWeek} />
              <ChangeCell title='So đỉnh 30d' value={data.fromHighPercent} />
              <div>
                <div className='text-gray-400 text-xs'>TB 7 ngày</div>
                <div className='font-bold text-gray-100'>{formatAmount(data.average7)}</div>
              </div>
            </div>
          </div>

          <div className='flex-[2] min-w-[300px] bg-gray-700/40 rounded-lg border border-gray-600 p-4'>
            <div className='flex items-center justify-between text-xs text-gray-400 mb-2'>
              <span>Lịch sử {data.points.length} ngày</span>
              <span>
                Đỉnh {formatAmount(data.high)} · đáy {formatAmount(data.low)} BTC
              </span>
            </div>

            {chart && (
              <LineChart
                color='#f97316'
                data={chart.values}
                formatValue={(value) => `${formatAmount(value)} BTC`}
                gridValues={[data.average7]}
                height={180}
                labels={chart.labels}
              />
            )}

            <div className='mt-3 text-xs text-gray-400'>OI tăng + funding dương = long dồn đòn bẩy. OI giảm mạnh = vừa có đợt thanh lý.</div>
          </div>

          <div className='w-full bg-gray-700/40 rounded-lg border border-gray-600 p-4'>
            {data.longShort ? (
              <>
                <div className='flex flex-wrap items-center justify-between gap-2 mb-2'>
                  <div className='text-sm text-gray-300'>
                    Tỉ lệ tài khoản Long / Short <span className='text-xs text-gray-400'>(nến {data.period})</span>
                  </div>
                  {zoneLongShort && <span className={`px-2 py-1 rounded-full text-xs font-medium ${zoneClass.bg}`}>{zoneLongShort.key}</span>}
                </div>

                <div className='flex h-[20px] w-full rounded-full overflow-hidden border border-gray-600'>
                  <div className='bg-green-600 flex items-center justify-center text-[10px]' style={{ width: `${data.longShort.long}%` }}>
                    {data.longShort.long >= 15 ? `Long ${data.longShort.long}%` : ''}
                  </div>
                  <div className='bg-red-600 flex items-center justify-center text-[10px]' style={{ width: `${data.longShort.short}%` }}>
                    {data.longShort.short >= 15 ? `Short ${data.longShort.short}%` : ''}
                  </div>
                </div>

                {zoneLongShort && (
                  <div className={`mt-3 text-sm font-semibold ${zoneClass.text}`}>
                    {zoneLongShort.icon} {zoneLongShort.label}
                  </div>
                )}

                <div className='mt-3 flex flex-wrap gap-4 text-sm'>
                  <div>
                    <div className='text-gray-400 text-xs'>Long</div>
                    <div className='font-bold !text-green-400'>{data.longShort.long}%</div>
                  </div>
                  <div>
                    <div className='text-gray-400 text-xs'>Short</div>
                    <div className='font-bold !text-red-400'>{data.longShort.short}%</div>
                  </div>
                  <div>
                    <div className='text-gray-400 text-xs'>Long / Short</div>
                    <div className={`font-bold ${data.longShort.isLongHeavy ? '!text-green-400' : '!text-red-400'}`}>{data.longShort.ratio}</div>
                  </div>
                  <div>
                    <div className='text-gray-400 text-xs'>Nhận định</div>
                    <div className={`font-bold ${zoneClass.text}`}>{data.longShort.isLongHeavy ? 'Long đang nhiều hơn' : 'Short đang nhiều hơn'}</div>
                  </div>
                </div>

                <div className='mt-3 text-xs text-gray-400'>
                  Long quá đông + funding cao = đám đông kẹt lệnh long, dễ bị quét. Short quá đông = dễ có short squeeze.
                </div>
              </>
            ) : (
              <div className='text-xs text-gray-400'>Không lấy được tỉ lệ long / short</div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default MarketOpenInterest
