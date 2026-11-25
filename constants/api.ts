export const BINANCE_API_URL = 'https://api.binance.com'

export const BINANCE_ENDPOINT = {
  Klines: `${BINANCE_API_URL}/api/v3/klines`,
  // Browser chỉ được gọi proxy, api.binance.com bị CORS
  KlinesProxy: '/api/klines',
}

export const COIN_METRICS_API_URL = 'https://community-api.coinmetrics.io'

export const BGEOMETRICS_API_URL = 'https://bitcoin-data.com'

export const ALTERNATIVE_API_URL = 'https://api.alternative.me'

export const MVRV_ENDPOINT = {
  CoinMetrics: `${COIN_METRICS_API_URL}/v4/timeseries/asset-metrics?assets=btc&metrics=CapMVRVCur&frequency=1d&page_size=1&paging_from=end`,
  // Lấy lịch sử để vẽ chart, page_size truyền động theo MVRV_HISTORY_DAYS
  CoinMetricsHistory: `${COIN_METRICS_API_URL}/v4/timeseries/asset-metrics?assets=btc&metrics=CapMVRVCur&frequency=1d&paging_from=end`,
  BGeometrics: `${BGEOMETRICS_API_URL}/v1/mvrv/last`,
  Proxy: '/api/mvrv',
}

export const FEAR_GREED_ENDPOINT = {
  Alternative: `${ALTERNATIVE_API_URL}/fng/`,
  Proxy: '/api/fear-greed',
}

export const BINANCE_FUTURES_API_URL = 'https://fapi.binance.com'

export const BLOCKCHAIN_API_URL = 'https://api.blockchain.info'

export const FUNDING_RATE_ENDPOINT = {
  PremiumIndex: `${BINANCE_FUTURES_API_URL}/fapi/v1/premiumIndex`,
  History: `${BINANCE_FUTURES_API_URL}/fapi/v1/fundingRate`,
  Proxy: '/api/funding-rate',
}

export const OPEN_INTEREST_ENDPOINT = {
  Current: `${BINANCE_FUTURES_API_URL}/fapi/v1/openInterest`,
  History: `${BINANCE_FUTURES_API_URL}/futures/data/openInterestHist`,
  LongShort: `${BINANCE_FUTURES_API_URL}/futures/data/globalLongShortAccountRatio`,
  Proxy: '/api/open-interest',
}

export const NEW_WALLET_ENDPOINT = {
  Blockchain: `${BLOCKCHAIN_API_URL}/charts/n-unique-addresses`,
  Proxy: '/api/new-wallets',
}

export const BYBIT_API_URL = 'https://api.bybit.com'

// Dự phòng khi Binance chặn IP server (Vercel US trả 451 "restricted location")
export const BYBIT_ENDPOINT = {
  Klines: `${BYBIT_API_URL}/v5/market/kline`,
  Tickers: `${BYBIT_API_URL}/v5/market/tickers`,
  FundingHistory: `${BYBIT_API_URL}/v5/market/funding/history`,
  AccountRatio: `${BYBIT_API_URL}/v5/market/account-ratio`,
  OpenInterest: `${BYBIT_API_URL}/v5/market/open-interest`,
}

// interval Binance → interval Bybit
export const BYBIT_INTERVAL_MAP: Record<string, string> = {
  '1m': '1',
  '5m': '5',
  '15m': '15',
  '30m': '30',
  '1h': '60',
  '2h': '120',
  '4h': '240',
  '6h': '360',
  '12h': '720',
  '1d': 'D',
  '1w': 'W',
  '1M': 'M',
}

// period openInterestHist Binance → intervalTime Bybit
export const BYBIT_OI_INTERVAL_MAP: Record<string, string> = {
  '5m': '5min',
  '15m': '15min',
  '30m': '30min',
  '1h': '1h',
  '2h': '4h',
  '4h': '4h',
  '6h': '4h',
  '12h': '4h',
  '1d': '1d',
}
