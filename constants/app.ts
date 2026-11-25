export const CHAIN_ID_DEFAULT = 56

export const SYMBOL_STABLE_DEFAULT = 'USDT'

export const MA_PERIOD = 200

export const MA_INTERVAL = {
  Daily: '1d',
  Weekly: '1w',
}

export const MVRV_CACHE_TIME = 30 * 60 * 1000

export const MVRV_ZONES = [
  { key: 'Bottom', max: 1, icon: '🟢', color: '#22c55e', label: 'Dưới giá vốn toàn mạng — vùng đáy lịch sử' },
  { key: 'Low', max: 1.5, icon: '🟢', color: '#84cc16', label: 'Thấp — vùng tích lũy' },
  { key: 'Neutral', max: 2.4, icon: '🟡', color: '#eab308', label: 'Trung tính' },
  { key: 'Hot', max: 3.5, icon: '🟠', color: '#f97316', label: 'Cao — bắt đầu nóng' },
  { key: 'Top', max: Infinity, icon: '🔴', color: '#ef4444', label: 'Rất cao — vùng đỉnh lịch sử' },
]

export const TOKEN_CYCLE_DEFAULT = 'BTC'

export const CYCLE_INTERVAL = '1w'

// 200 nến tuần ~ 3.8 năm, dùng làm chu kỳ 4 năm hiện tại
export const CYCLE_WEEKS = 200

export const FEAR_GREED_LIMIT = 90

export const FEAR_GREED_CACHE_TIME = 30 * 60 * 1000

export const FEAR_GREED_ZONES = [
  { key: 'ExtremeFear', max: 25, icon: '🟢', color: '#22c55e', label: 'Sợ hãi tột độ — vùng thị trường bán tháo' },
  { key: 'Fear', max: 45, icon: '🟩', color: '#84cc16', label: 'Sợ hãi — tâm lý yếu' },
  { key: 'Neutral', max: 56, icon: '🟡', color: '#eab308', label: 'Trung tính' },
  { key: 'Greed', max: 76, icon: '🟠', color: '#f97316', label: 'Tham lam — tâm lý nóng' },
  { key: 'ExtremeGreed', max: Infinity, icon: '🔴', color: '#ef4444', label: 'Tham lam tột độ — cẩn thận vùng đỉnh' },
]
