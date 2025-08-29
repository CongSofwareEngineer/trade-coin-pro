import { LOCAL_STORE_KEY } from '@/constants/storage'

export const saveDataLocal = (key: LOCAL_STORE_KEY, data: any) => {
  localStorage.setItem(key, JSON.stringify(data))
}

export const getDataLocal = (key: LOCAL_STORE_KEY) => {
  if (typeof window !== 'undefined') {
    return JSON.parse(localStorage.getItem(key) as string)
  } else {
    return false
  }
}

export const removeDataLocal = (key: LOCAL_STORE_KEY) => {
  localStorage.removeItem(key)
}

export const removeAllDataLocal = () => {
  localStorage.clear()
}
