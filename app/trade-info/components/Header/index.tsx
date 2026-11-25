import LoadingSpinner from '../LoadingSpinner'
import { UserConfig } from '../../type'

type Props = {
  users: UserConfig[]
  userConfigCurrent?: UserConfig
  isLoading: boolean
  isLoadingTradeHistory: boolean
  totalTrades: number
  totalPages: number
  currentPage: number
  hasHistory: boolean
  onSelectUser: (user: UserConfig) => void
  onOpenSettings: () => void
  onRefresh: () => void
}

const Header = ({
  users,
  userConfigCurrent,
  isLoading,
  isLoadingTradeHistory,
  totalTrades,
  totalPages,
  currentPage,
  hasHistory,
  onSelectUser,
  onOpenSettings,
  onRefresh,
}: Props) => {
  return (
    <div className='bg-gray-800 rounded-lg shadow-lg border border-gray-700 p-6 mb-6'>
      <div className='flex justify-between items-center mb-4'>
        <h1 className='text-lg font-semibold text-white'>Trade History</h1>
        <div className='flex gap-3'>
          <button
            className='px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors shadow-lg flex items-center gap-2'
            onClick={onOpenSettings}
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
            disabled={isLoading}
            onClick={onRefresh}
          >
            <svg className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path
                d='M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15'
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
              />
            </svg>
            {isLoading ? 'Loading...' : 'Refresh Data'}
          </button>
        </div>
      </div>

      {/* Version Selector */}
      <div className='flex flex-wrap gap-3'>
        {users?.map((item: any) => {
          return (
            <button
              key={item._id}
              className={`px-4 cursor-pointer py-2 rounded-lg border-2 font-medium transition-all ${
                userConfigCurrent?._id === item._id
                  ? 'bg-blue-500 border-blue-500 text-white shadow-md'
                  : 'bg-gray-700 border-gray-600 text-gray-200 hover:border-blue-400 hover:text-blue-400 hover:bg-gray-600'
              }`}
              onClick={() => onSelectUser(item)}
            >
              TOKEN {item.tokenInput}
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
      ) : hasHistory ? (
        <div className='mt-4 text-sm text-gray-400'>
          Total Trades: <span className='font-semibold text-white'>{totalTrades}</span> | Page:{' '}
          <span className='font-semibold text-white'>{currentPage}</span> of <span className='font-semibold text-white'>{totalPages}</span>
        </div>
      ) : null}
    </div>
  )
}

export default Header
