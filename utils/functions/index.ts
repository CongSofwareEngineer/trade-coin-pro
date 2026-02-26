export const lowercase = (value?: string) => {
  if (!value) return ''

  return value.toLowerCase()
}

export function cloneData<T>(data: T): T {
  return JSON.parse(JSON.stringify(data))
}
