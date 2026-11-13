export const lowercase = (value?: string) => {
  if (!value) return ''

  return value.toLowerCase()
}

//symbol token luôn uppercase, dùng chung cho mọi so sánh / key
export const uppercase = (value?: string | number) => {
  if (!value) return ''

  return String(value).trim().toUpperCase()
}

export function cloneData<T>(data: T): T {
  return JSON.parse(JSON.stringify(data))
}

export const formatTime = (value?: string | number | Date | null) => {
  if (!value) return ''

  const pad = (num: number) => num.toString().padStart(2, '0')

  // chuỗi dd/mm/yyyy phải tự parse, new Date() hiểu nhầm thành mm/dd/yyyy
  const matchDMY = typeof value === 'string' ? value.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:[\s,T]+(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/) : null

  const date = matchDMY
    ? new Date(
        Date.UTC(
          Number(matchDMY[3]),
          Number(matchDMY[2]) - 1,
          Number(matchDMY[1]),
          Number(matchDMY[4] || 0),
          Number(matchDMY[5] || 0),
          Number(matchDMY[6] || 0)
        )
      )
    : new Date(value)

  if (isNaN(date.getTime())) return ''

  const day = `${pad(date.getUTCDate())}/${pad(date.getUTCMonth() + 1)}/${date.getUTCFullYear()}`
  const time = `${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}`

  return `${day} ${time}`
}

const SYMBOL_ETH = ['ETH', 'WETH', 'CBETH']
const SYMBOL_BTC = ['BTC', 'WBTC', 'CBBTC']

//ETH/WETH/CBETH coi là ETH, BTC/WBTC/CBBTC coi là BTC
export const isSymbolETHOrBTC = (symbol?: string, type: 'eth' | 'btc' = 'eth') => {
  if (type === 'eth') return SYMBOL_ETH.includes(uppercase(symbol))

  return SYMBOL_BTC.includes(uppercase(symbol))
}

//so sánh 2 symbol, cùng họ ETH hoặc cùng họ BTC vẫn tính là một
export const isSameSymbol = (symbolA?: string, symbolB?: string) => {
  const a = uppercase(symbolA)
  const b = uppercase(symbolB)

  if (!a || !b) return false

  if (a === b) return true

  if (isSymbolETHOrBTC(a, 'eth') && isSymbolETHOrBTC(b, 'eth')) return true

  return isSymbolETHOrBTC(a, 'btc') && isSymbolETHOrBTC(b, 'btc')
}
