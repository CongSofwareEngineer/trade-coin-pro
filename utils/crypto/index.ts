import * as enc from 'crypto-js/enc-hex'
import PBKDF2 from 'crypto-js/pbkdf2'
import AES from 'crypto-js/aes'
import encUtf8Package from 'crypto-js/enc-utf8'
import CryptoJS from 'crypto-js'

const getIV = () => enc.parse(process.env.KEY_CRYPTO_IV_ENCODE!)

const encUtf8 = (pinCode?: string) => {
  if (!pinCode) {
    pinCode = process.env.KEY_CRYPTO_IV_ENCODE
  }

  return PBKDF2(pinCode!, encUtf8Package.parse(process.env.KEY_CRYPTO_IV_ENCODE!), {
    keySize: 256 / 32, // AES-256
    iterations: 1000,
    hasher: CryptoJS.algo.SHA256,
  })
}

export const encryptData = (value: string, pinCode?: string) => {
  try {
    if (typeof value !== 'string') {
      value = JSON.stringify(value)
    }

    return AES.encrypt(value, encUtf8(pinCode), {
      iv: getIV(),
    }).toString()
  } catch (error) {
    console.log({ errorencryptData: error })

    return ''
  }
}

export const decryptData = (value: string, pinCode?: string) => {
  try {
    const bytes = AES.decrypt(value, encUtf8(pinCode), {
      iv: getIV(),
    })
    const decrypted = bytes.toString(encUtf8Package)

    return decrypted
  } catch (error) {
    console.log({ error })

    return ''
  }
}
