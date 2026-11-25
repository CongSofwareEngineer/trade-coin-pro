export const CHAIN_ID_DEFAULT = 56

export const SYMBOL_STABLE_DEFAULT = 'USDT'

export const MA_PERIOD = 200

export const MA_INTERVAL = {
  Daily: '1d',
  Weekly: '1w',
}

export const MVRV_CACHE_TIME = 30 * 60 * 1000

export const MVRV_HISTORY_DAYS = 90

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

export const SYMBOL_FUTURES_DEFAULT = 'BTCUSDT'

// 1 kỳ funding = 8h → 90 kỳ ~ 30 ngày
export const FUNDING_RATE_PERIOD_PER_DAY = 3

export const FUNDING_RATE_LIMIT = 90

export const FUNDING_RATE_CACHE_TIME = 5 * 60 * 1000

// Mốc % / 8h. Baseline của Binance là 0.01%
export const FUNDING_RATE_ZONES = [
  { key: 'Negative', max: 0, icon: '🟢', color: '#22c55e', label: 'Âm — short trả phí cho long, tâm lý bearish' },
  { key: 'Low', max: 0.005, icon: '🟩', color: '#84cc16', label: 'Thấp — đòn bẩy long nguội' },
  { key: 'Neutral', max: 0.02, icon: '🟡', color: '#eab308', label: 'Trung tính — quanh baseline 0.01%' },
  { key: 'High', max: 0.05, icon: '🟠', color: '#f97316', label: 'Cao — long đang nóng' },
  { key: 'Extreme', max: Infinity, icon: '🔴', color: '#ef4444', label: 'Rất cao — long quá nóng, dễ long squeeze' },
]

export const OPEN_INTEREST_PERIOD = '1d'

// Binance chỉ giữ 30 ngày openInterestHist
export const OPEN_INTEREST_LIMIT = 30

export const OPEN_INTEREST_CACHE_TIME = 5 * 60 * 1000

// Tỉ lệ tài khoản long / short, ngưỡng nhận định theo % tài khoản long
export const LONG_SHORT_ZONES = [
  { key: 'HeavyShort', max: 40, icon: '🔴', color: '#ef4444', label: 'Short áp đảo — đám đông đang bearish' },
  { key: 'Short', max: 48, icon: '🟠', color: '#f97316', label: 'Nghiêng short' },
  { key: 'Balanced', max: 55, icon: '🟡', color: '#eab308', label: 'Cân bằng long / short' },
  { key: 'Long', max: 65, icon: '🟩', color: '#84cc16', label: 'Nghiêng long' },
  { key: 'HeavyLong', max: Infinity, icon: '🟢', color: '#22c55e', label: 'Long áp đảo — đám đông đang bullish' },
]

export const NEW_WALLET_LIMIT = 90

export const NEW_WALLET_CACHE_TIME = 30 * 60 * 1000
