export const lowercase = (value?: string) => {
  if (!value) return ''

  return value.toLowerCase()
}

export function cloneData<T>(data: T): T {
  return JSON.parse(JSON.stringify(data))
}

export const formatTime = (value?: string | number | Date | null) => {
  if (!value) return ''

  const date = new Date(value)

  if (isNaN(date.getTime())) return ''

  const pad = (num: number) => num.toString().padStart(2, '0')
  const day = `${pad(date.getUTCDate())}/${pad(date.getUTCMonth() + 1)}/${date.getUTCFullYear()}`
  const time = `${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}:${pad(date.getUTCSeconds())}`

  return `${day} ${time}`
}
