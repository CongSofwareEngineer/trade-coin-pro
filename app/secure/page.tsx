'use client'
import { useState } from 'react'

import SecureApi from '@/services/SecureApi'

type TabType = 'encode' | 'decode'

function SecurePage() {
  const [activeTab, setActiveTab] = useState<TabType>('encode')
  const [encodePassword, setEncodePassword] = useState('')
  const [decodePassword, setDecodePassword] = useState('')
  const [encodeInput, setEncodeInput] = useState('')
  const [decodeInput, setDecodeInput] = useState('')
  const [encodeOutput, setEncodeOutput] = useState('')
  const [decodeOutput, setDecodeOutput] = useState('')
  const [encodeError, setEncodeError] = useState('')
  const [decodeError, setDecodeError] = useState('')
  const [showEncodePassword, setShowEncodePassword] = useState(false)
  const [showDecodePassword, setShowDecodePassword] = useState(false)

  const handleEncode = async () => {
    try {
      setEncodeError('')
      if (!encodeInput.trim()) {
        setEncodeError('Please enter data to encode')

        return
      }

      const result = await SecureApi.encrypt(encodeInput, encodePassword)

      if (result.error) {
        setEncodeError('Failed to encode data')

        return
      }

      setEncodeOutput(result.data)
    } catch (error) {
      setEncodeError('Failed to encode data')
      console.error(error)
    }
  }

  const handleDecode = async () => {
    try {
      setDecodeError('')
      if (!decodeInput.trim()) {
        setDecodeError('Please enter data to decode')

        return
      }

      const result = await SecureApi.decrypt(decodeInput, decodePassword)

      if (result.error || !result.data) {
        setDecodeError('Failed to decode data. Please check your password and input.')
        setDecodeOutput('')

        return
      }

      setDecodeOutput(result.data)
    } catch (error) {
      setDecodeError('Failed to decode data. Please check your password and input.')
      console.error(error)
    }
  }

  const handleClearEncode = () => {
    setEncodeInput('')
    setEncodeOutput('')
    setEncodePassword('')
    setEncodeError('')
  }

  const handleClearDecode = () => {
    setDecodeInput('')
    setDecodeOutput('')
    setDecodePassword('')
    setDecodeError('')
  }

  const handleCopyToClipboard = (text: string) => {
    // Remove last 4 characters before copying
    const textToCopy = text.length > 4 ? text.slice(0, -4) : text

    navigator.clipboard.writeText(textToCopy)
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 text-white'>
      <div className='container mx-auto px-6 py-8'>
        <div className='max-w-4xl mx-auto'>
          {/* Header */}
          <div className='mb-8'>
            <h1 className='text-3xl font-bold mb-2 flex items-center gap-3'>
              <div className='w-3 h-3 bg-blue-500 rounded-full' />
              Data Encryption Tool
            </h1>
            <p className='text-gray-400'>Securely encode and decode your data with password protection</p>
          </div>

          {/* Tab Navigation */}
          <div className='bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700/50 shadow-2xl overflow-hidden'>
            <div className='flex border-b border-gray-700/50'>
              <button
                className={`flex-1 py-4 px-6 font-semibold transition-all duration-200 ${
                  activeTab === 'encode' ? 'bg-blue-600 text-white' : 'bg-gray-800/30 text-gray-400 hover:bg-gray-700/30 hover:text-gray-300'
                }`}
                onClick={() => setActiveTab('encode')}
              >
                <div className='flex items-center justify-center gap-2'>
                  <svg className='w-5 h-5' fill='none' stroke='currentColor' strokeWidth={2} viewBox='0 0 24 24'>
                    <path
                      d='M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z'
                      strokeLinecap='round'
                      strokeLinejoin='round'
                    />
                  </svg>
                  Encode Data
                </div>
              </button>
              <button
                className={`flex-1 py-4 px-6 font-semibold transition-all duration-200 ${
                  activeTab === 'decode' ? 'bg-blue-600 text-white' : 'bg-gray-800/30 text-gray-400 hover:bg-gray-700/30 hover:text-gray-300'
                }`}
                onClick={() => setActiveTab('decode')}
              >
                <div className='flex items-center justify-center gap-2'>
                  <svg className='w-5 h-5' fill='none' stroke='currentColor' strokeWidth={2} viewBox='0 0 24 24'>
                    <path
                      d='M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z'
                      strokeLinecap='round'
                      strokeLinejoin='round'
                    />
                  </svg>
                  Decode Data
                </div>
              </button>
            </div>

            {/* Tab Content */}
            <div className='p-6'>
              {activeTab === 'encode' ? (
                <div className='space-y-6'>
                  {/* Password Input */}
                  <div>
                    <label className='block text-sm font-medium text-gray-300 mb-2' htmlFor='encode-password'>
                      Password
                    </label>
                    <div className='relative'>
                      <input
                        className='w-full bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-3 pr-12 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all'
                        id='encode-password'
                        placeholder='Enter your password'
                        type={showEncodePassword ? 'text' : 'password'}
                        value={encodePassword}
                        onChange={(e) => setEncodePassword(e.target.value)}
                      />
                      <button
                        className='absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300 transition-colors'
                        type='button'
                        onClick={() => setShowEncodePassword(!showEncodePassword)}
                      >
                        {showEncodePassword ? (
                          <svg className='w-5 h-5' fill='none' stroke='currentColor' strokeWidth={2} viewBox='0 0 24 24'>
                            <path
                              d='M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21'
                              strokeLinecap='round'
                              strokeLinejoin='round'
                            />
                          </svg>
                        ) : (
                          <svg className='w-5 h-5' fill='none' stroke='currentColor' strokeWidth={2} viewBox='0 0 24 24'>
                            <path d='M15 12a3 3 0 11-6 0 3 3 0 016 0z' strokeLinecap='round' strokeLinejoin='round' />
                            <path
                              d='M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z'
                              strokeLinecap='round'
                              strokeLinejoin='round'
                            />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Input Data */}
                  <div>
                    <label className='block text-sm font-medium text-gray-300 mb-2' htmlFor='encode-input'>
                      Data to Encode
                    </label>
                    <textarea
                      className='w-full bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none'
                      id='encode-input'
                      placeholder='Enter the data you want to encode...'
                      rows={6}
                      value={encodeInput}
                      onChange={(e) => setEncodeInput(e.target.value)}
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className='flex gap-3'>
                    <button
                      className='flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2'
                      onClick={handleEncode}
                    >
                      <svg className='w-5 h-5' fill='none' stroke='currentColor' strokeWidth={2} viewBox='0 0 24 24'>
                        <path d='M13 10V3L4 14h7v7l9-11h-7z' strokeLinecap='round' strokeLinejoin='round' />
                      </svg>
                      Encode
                    </button>
                    <button
                      className='bg-gray-700 hover:bg-gray-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200'
                      onClick={handleClearEncode}
                    >
                      Clear
                    </button>
                  </div>

                  {/* Error Message */}
                  {encodeError && <div className='bg-red-500/10 border border-red-500/50 rounded-lg p-4 text-red-400 text-sm'>{encodeError}</div>}

                  {/* Output Data */}
                  {encodeOutput && (
                    <div>
                      <div className='flex items-center justify-between mb-2'>
                        <span className='block text-sm font-medium text-gray-300'>Encoded Data</span>
                        <button
                          className='text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1'
                          onClick={() => handleCopyToClipboard(encodeOutput)}
                        >
                          <svg className='w-4 h-4' fill='none' stroke='currentColor' strokeWidth={2} viewBox='0 0 24 24'>
                            <path
                              d='M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z'
                              strokeLinecap='round'
                              strokeLinejoin='round'
                            />
                          </svg>
                          Copy
                        </button>
                      </div>
                      <div className='bg-green-500/10 border border-green-500/50 rounded-lg px-4 py-3 text-green-400 font-mono text-sm break-all max-h-48 overflow-y-auto'>
                        {encodeOutput}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className='space-y-6'>
                  {/* Password Input */}
                  <div>
                    <label className='block text-sm font-medium text-gray-300 mb-2' htmlFor='decode-password'>
                      Password
                    </label>
                    <div className='relative'>
                      <input
                        className='w-full bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-3 pr-12 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all'
                        id='decode-password'
                        placeholder='Enter your password'
                        type={showDecodePassword ? 'text' : 'password'}
                        value={decodePassword}
                        onChange={(e) => setDecodePassword(e.target.value)}
                      />
                      <button
                        className='absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300 transition-colors'
                        type='button'
                        onClick={() => setShowDecodePassword(!showDecodePassword)}
                      >
                        {showDecodePassword ? (
                          <svg className='w-5 h-5' fill='none' stroke='currentColor' strokeWidth={2} viewBox='0 0 24 24'>
                            <path
                              d='M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21'
                              strokeLinecap='round'
                              strokeLinejoin='round'
                            />
                          </svg>
                        ) : (
                          <svg className='w-5 h-5' fill='none' stroke='currentColor' strokeWidth={2} viewBox='0 0 24 24'>
                            <path d='M15 12a3 3 0 11-6 0 3 3 0 016 0z' strokeLinecap='round' strokeLinejoin='round' />
                            <path
                              d='M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z'
                              strokeLinecap='round'
                              strokeLinejoin='round'
                            />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Input Data */}
                  <div>
                    <label className='block text-sm font-medium text-gray-300 mb-2' htmlFor='decode-input'>
                      Data to Decode
                    </label>
                    <textarea
                      className='w-full bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none'
                      id='decode-input'
                      placeholder='Enter the encoded data...'
                      rows={6}
                      value={decodeInput}
                      onChange={(e) => setDecodeInput(e.target.value)}
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className='flex gap-3'>
                    <button
                      className='flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2'
                      onClick={handleDecode}
                    >
                      <svg className='w-5 h-5' fill='none' stroke='currentColor' strokeWidth={2} viewBox='0 0 24 24'>
                        <path d='M13 10V3L4 14h7v7l9-11h-7z' strokeLinecap='round' strokeLinejoin='round' />
                      </svg>
                      Decode
                    </button>
                    <button
                      className='bg-gray-700 hover:bg-gray-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200'
                      onClick={handleClearDecode}
                    >
                      Clear
                    </button>
                  </div>

                  {/* Error Message */}
                  {decodeError && <div className='bg-red-500/10 border border-red-500/50 rounded-lg p-4 text-red-400 text-sm'>{decodeError}</div>}

                  {/* Output Data */}
                  {decodeOutput && (
                    <div>
                      <div className='flex items-center justify-between mb-2'>
                        <span className='block text-sm font-medium text-gray-300'>Decoded Data</span>
                        <button
                          className='text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1'
                          onClick={() => handleCopyToClipboard(decodeOutput)}
                        >
                          <svg className='w-4 h-4' fill='none' stroke='currentColor' strokeWidth={2} viewBox='0 0 24 24'>
                            <path
                              d='M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z'
                              strokeLinecap='round'
                              strokeLinejoin='round'
                            />
                          </svg>
                          Copy
                        </button>
                      </div>
                      <div className='bg-green-500/10 border border-green-500/50 rounded-lg px-4 py-3 text-green-400 font-mono text-sm break-all max-h-48 overflow-y-auto'>
                        {decodeOutput}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SecurePage
