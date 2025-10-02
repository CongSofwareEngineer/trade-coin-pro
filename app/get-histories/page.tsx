'use client'
import React, { useEffect, useState } from 'react'

import fetcher from '@/configs/fetcher'

const GetHistories = () => {
  const [data, setData] = useState<any[]>([])
  const [timestampStart, setTimestampStart] = useState<number>(0)
  const [timestampEnd, setTimestampEnd] = useState<number>(Date.now())

  useEffect(() => {
    const getData = async () => {}

    getData()
  }, [])

  const checkData = async () => {
    try {
      setData([])
      const res = await fetcher({
        method: 'POST',
        url: `/api/token/historical?id=1027&time_start=${timestampStart}&interval=4h&count=4000`,
      })

      let arr: any[] = (res?.data?.body?.data?.quotes || []).map((item: any) => {
        return {
          price: item.quote.USD.price,
          time: item.quote.USD.timestamp,
        }
      })

      arr = arr.filter((item: any) => {
        const timeCurrent = new Date(item.time || Date.now()).getTime() / 1000

        console.log({ timeCurrent, item })

        return timeCurrent <= timestampEnd
      })

      setData(arr)

      console.log('====================================')
      console.log({ arr })
      console.log('====================================')
    } catch (error) {
      console.log('Error fetching data:', error)
    }
  }

  const getData = async () => {
    const res = await fetcher({
      url: `/api/token/latest?id=1027`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    })
  }

  return (
    <div className='flex flex-col gap-2'>
      <div>Start TimestampStart (in seconds):</div>
      <input
        className='border border-gray-300 rounded p-2'
        placeholder='Search...'
        type='text'
        value={timestampStart}
        onChange={(e) => setTimestampStart(Number(e.target.value))}
      />
      <div>End Timestamp (in seconds):</div>
      <input
        className='border border-gray-300 rounded p-2'
        placeholder='Search...'
        type='text'
        value={timestampEnd}
        onChange={(e) => setTimestampEnd(Number(e.target.value))}
      />

      <div>
        <button className='bg-blue-500 text-white px-4 py-2 rounded' onClick={getData}>
          get data
        </button>
      </div>
      {data.map((item, index) => (
        <div key={index}>{item.price}</div>
      ))}
    </div>
  )
}

export default GetHistories
