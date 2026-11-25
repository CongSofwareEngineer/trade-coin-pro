import { BigNumber } from 'bignumber.js'

import { PortfolioStatsInfo, UserConfig } from '../../type'

type Props = {
  userConfigCurrent: UserConfig
  portfolioStats: PortfolioStatsInfo
  priceNow?: number
}

const PortfolioStats = ({ userConfigCurrent, portfolioStats, priceNow }: Props) => {
  return (
    <div className='bg-gray-800 rounded-lg shadow-lg border border-gray-700 p-4 mb-6'>
      <div className='flex flex-wrap items-center justify-between gap-4'>
        <div>
          {' '}
          <h2 className='text-xl font-bold text-white'>Portfolio</h2>
          <span className='  text-white'>
            Price {userConfigCurrent.tokenInput} now:{' '}
            {BigNumber(priceNow || '0')
              .decimalPlaces(4)
              .toFormat()}{' '}
            <span className={`${portfolioStats.ratioPriceChange > 0 ? 'text-green-500' : 'text-red-600'} text-sm`}>
              {portfolioStats.ratioPriceChange}%
            </span>
          </span>
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
  )
}

export default PortfolioStats
