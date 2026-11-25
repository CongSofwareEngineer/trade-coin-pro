import { useMemo } from 'react'
import { BigNumber } from 'bignumber.js'

import LoadingSpinner from '../LoadingSpinner'

import useNewWallet from '@/hooks/tank-query/useNewWallet'
import { NEW_WALLET_LIMIT } from '@/constants/app'
import LineChart from '@/components/LineChart'

const formatCount = (value?: number) => {
  if (value === undefined || value === null) return '-'

  return BigNumber(value).decimalPlaces(0).toFormat()
}

const formatDate = (value?: number) => {
  if (!value) return '-'

  return new Date(value).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

const ValueCell = ({ title, value }: { title: string; value?: number }) => (
  <div>
    <div className='text-gray-400 text-xs'>{title}</div>
    <div className='font-bold text-gray-100'>{formatCount(value)}</div>
  </div>
)

const ChangeCell = ({ title, value }: { title: string; value: number }) => (
  <div>
    <div className='text-gray-400 text-xs'>{title}</div>
    <div className={`font-bold ${value >= 0 ? '!text-green-400' : '!text-red-400'}`}>
      {value > 0 ? '+' : ''}
      {BigNumber(value).decimalPlaces(2).toFormat()}%
    </div>
  </div>
)

const MarketNewWallet = () => {
  const { data, isLoading, refetch } = useNewWallet()

  const chart = useMemo(() => {
    if (!data?.points?.length) return null

    return {
      values: data.points.map((item) => item.value),
      labels: data.points.map((item) => formatDate(item.timestamp)),
    }
  }, [data?.points])

  return (
    <div className='bg-gray-800 rounded-lg shadow-lg border border-gray-700 p-4 mb-6'>
      <div className='flex flex-wrap items-center justify-between gap-3 mb-3'>
        <div>
          <h2 className='text-xl font-bold text-white'>
            Ví mới hoạt động <span className='text-sm text-gray-400'>(BTC unique addresses / ngày)</span>
          </h2>
          <div className='text-xs text-gray-400'>
            Nguồn blockchain.com, update 1 lần/ngày, {NEW_WALLET_LIMIT} ngày gần nhất — số địa chỉ ví hoạt động mỗi ngày
          </div>
        </div>
        <button
          className='px-3 py-2 text-sm text-gray-300 bg-gray-700 border border-gray-600 rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed'
          disabled={isLoading}
          onClick={() => refetch()}
        >
          {isLoading ? 'Loading...' : 'Reload ví mới'}
        </button>
      </div>

      {isLoading && (
        <div className='text-sm text-gray-400 flex items-center gap-2'>
          <LoadingSpinner />
          <span>Loading ví mới...</span>
        </div>
      )}

      {!isLoading && !data && <div className='text-sm text-gray-400'>No data</div>}

      {!isLoading && data && (
        <div className='flex flex-wrap gap-4'>
          <div className='flex-1 min-w-[220px] bg-gray-700/40 rounded-lg border border-gray-600 p-4'>
            <div className='flex items-start justify-between gap-2'>
              <div>
                <div className='text-gray-400 text-xs'>Hôm nay</div>
                <div className={`font-bold text-3xl ${data.isUpTrend ? '!text-green-400' : '!text-red-400'}`}>{formatCount(data.now.value)}</div>
                <div className='text-xs text-gray-400 mt-1'>{formatDate(data.now.timestamp)}</div>
              </div>
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium ${data.isUpTrend ? 'bg-green-600 text-green-100' : 'bg-red-600 text-red-100'}`}
              >
                {data.isUpTrend ? 'Trên TB30' : 'Dưới TB30'}
              </span>
            </div>

            <div className={`mt-3 text-sm font-semibold ${data.isUpTrend ? '!text-green-400' : '!text-red-400'}`}>
              {data.isUpTrend ? '🟢 Dòng ví mới đang tăng — nhu cầu on-chain tốt' : '🔴 Dòng ví mới đang giảm — nhu cầu on-chain yếu'}
            </div>

            <div className='mt-4 flex flex-wrap gap-4 text-sm'>
              <ValueCell title='Hôm qua' value={data.yesterday?.value} />
              <ValueCell title='Tuần trước' value={data.lastWeek?.value} />
              <ValueCell title='TB 7 ngày' value={data.average7} />
              <ValueCell title='TB 30 ngày' value={data.average30} />
              <ChangeCell title='So hôm qua' value={data.changeDay} />
              <ChangeCell title='So tuần trước' value={data.changeWeek} />
            </div>
          </div>

          <div className='flex-[2] min-w-[300px] bg-gray-700/40 rounded-lg border border-gray-600 p-4'>
            <div className='flex items-center justify-between text-xs text-gray-400 mb-2'>
              <span>Lịch sử {data.points.length} ngày</span>
              <span>
                Cao nhất {formatCount(data.high)} · thấp nhất {formatCount(data.low)}
              </span>
            </div>

            {chart && (
              <LineChart
                color='#60a5fa'
                data={chart.values}
                formatValue={(value) => `${formatCount(value)} ví`}
                gridValues={[data.average30]}
                height={180}
                labels={chart.labels}
              />
            )}

            <div className='mt-3 text-xs text-gray-400'>Vạch gạch ngang = trung bình 30 ngày ({formatCount(data.average30)})</div>
          </div>
        </div>
      )}
    </div>
  )
}

export default MarketNewWallet
