class SecureApi {
  static baseUrl: string = '/api/secure'

  /**
   * Encrypt data with password
   * @param data - Data to encrypt
   * @param password - Password for encryption (optional, will use default if not provided)
   * @returns Encrypted data
   */
  static async encrypt(data: string, password?: string): Promise<{ data: string; error?: any }> {
    try {
      const response = await fetch(`${this.baseUrl}/encrypt`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data,
          password,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to encrypt data')
      }

      return result
    } catch (error) {
      console.error('Encrypt error:', error)

      return {
        data: '',
        error,
      }
    }
  }

  /**
   * Decrypt data with password
   * @param data - Encrypted data to decrypt
   * @param password - Password for decryption (optional, will use default if not provided)
   * @returns Decrypted data
   */
  static async decrypt(data: string, password?: string): Promise<{ data: string; error?: any }> {
    try {
      const response = await fetch(`${this.baseUrl}/decrypt`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data,
          password,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to decrypt data')
      }

      return result
    } catch (error) {
      console.error('Decrypt error:', error)

      return {
        data: '',
        error,
      }
    }
  }
}

export default SecureApi
