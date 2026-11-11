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

  const date = new Date(value)

  if (isNaN(date.getTime())) return ''

  const pad = (num: number) => num.toString().padStart(2, '0')
  const day = `${pad(date.getUTCDate())}/${pad(date.getUTCMonth() + 1)}/${date.getUTCFullYear()}`
  const time = `${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}:${pad(date.getUTCSeconds())}`

  return `${day} ${time}`
}
