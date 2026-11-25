export const CHAIN_ID_DEFAULT = 56

export const SYMBOL_STABLE_DEFAULT = 'USDT'

export const MA_PERIOD = 200

export const MA_INTERVAL = {
  Daily: '1d',
  Weekly: '1w',
}

export const MVRV_CACHE_TIME = 30 * 60 * 1000

export const MVRV_ZONES = [
  { key: 'Bottom', max: 1, icon: '🟢', label: 'Dưới giá vốn toàn mạng — vùng đáy lịch sử' },
  { key: 'Low', max: 1.5, icon: '🟢', label: 'Thấp — vùng tích lũy' },
  { key: 'Neutral', max: 2.4, icon: '🟡', label: 'Trung tính' },
  { key: 'Hot', max: 3.5, icon: '🟠', label: 'Cao — bắt đầu nóng' },
  { key: 'Top', max: Infinity, icon: '🔴', label: 'Rất cao — vùng đỉnh lịch sử' },
]
