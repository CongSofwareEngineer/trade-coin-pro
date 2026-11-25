export const BINANCE_API_URL = 'https://api.binance.com'

export const BINANCE_ENDPOINT = {
  Klines: `${BINANCE_API_URL}/api/v3/klines`,
}

export const COIN_METRICS_API_URL = 'https://community-api.coinmetrics.io'

export const BGEOMETRICS_API_URL = 'https://bitcoin-data.com'

export const MVRV_ENDPOINT = {
  CoinMetrics: `${COIN_METRICS_API_URL}/v4/timeseries/asset-metrics?assets=btc&metrics=CapMVRVCur&frequency=1d&page_size=1&paging_from=end`,
  BGeometrics: `${BGEOMETRICS_API_URL}/v1/mvrv/last`,
  Proxy: '/api/mvrv',
}
