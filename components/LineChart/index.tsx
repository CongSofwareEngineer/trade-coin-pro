import { MouseEvent, useId, useMemo, useState } from 'react'
import { BigNumber } from 'bignumber.js'

export type ChartBand = {
  from: number
  to: number
  color: string
}

type Props = {
  data: number[]
  labels?: string[]
  bands?: ChartBand[]
  color?: string
  height?: number
  min?: number
  max?: number
  gridValues?: number[]
  highlightIndex?: number
  highlightLabel?: string
  formatValue?: (value: number) => string
}

const VIEW_WIDTH = 1000

const LineChart = ({
  data,
  labels = [],
  bands = [],
  color = '#60a5fa',
  height = 160,
  min,
  max,
  gridValues = [],
  highlightIndex,
  highlightLabel,
  formatValue = (value: number) => BigNumber(value).decimalPlaces(2).toFormat(),
}: Props) => {
  const gradientId = useId()
  const [indexHover, setIndexHover] = useState<number | null>(null)

  const chart = useMemo(() => {
    if (data.length === 0) return null

    const minValue = min !== undefined ? min : Math.min(...data)
    const maxValue = max !== undefined ? max : Math.max(...data)
    const range = maxValue - minValue || 1

    const toX = (index: number) => (data.length === 1 ? 0 : (index / (data.length - 1)) * VIEW_WIDTH)
    const toY = (value: number) => height - ((value - minValue) / range) * height

    const points = data.map((value, index) => `${toX(index).toFixed(2)},${toY(value).toFixed(2)}`)

    return {
      minValue,
      maxValue,
      toX,
      toY,
      line: `M${points.join(' L')}`,
      area: `M0,${height} L${points.join(' L')} L${VIEW_WIDTH},${height} Z`,
    }
  }, [data, min, max, height])

  if (!chart) return <div className='text-xs text-gray-400'>No chart data</div>

  const handleMove = (event: MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect()
    const ratio = (event.clientX - rect.left) / (rect.width || 1)
    const index = Math.round(ratio * (data.length - 1))

    setIndexHover(Math.min(Math.max(index, 0), data.length - 1))
  }

  const percentOf = (index: number) => (data.length === 1 ? 0 : (index / (data.length - 1)) * 100)

  return (
    <div className='w-full'>
      <div className='relative w-full' onMouseLeave={() => setIndexHover(null)} onMouseMove={handleMove}>
        <svg className='w-full block' height={height} preserveAspectRatio='none' viewBox={`0 0 ${VIEW_WIDTH} ${height}`} width='100%'>
          <defs>
            <linearGradient id={gradientId} x1='0' x2='0' y1='0' y2='1'>
              <stop offset='0%' stopColor={color} stopOpacity='0.35' />
              <stop offset='100%' stopColor={color} stopOpacity='0' />
            </linearGradient>
          </defs>

          {bands.map((band) => {
            const yTop = chart.toY(Math.min(band.to, chart.maxValue))
            const yBottom = chart.toY(Math.max(band.from, chart.minValue))

            if (yBottom <= yTop) return null

            return (
              <rect key={`${band.from}-${band.to}`} fill={band.color} fillOpacity='0.12' height={yBottom - yTop} width={VIEW_WIDTH} x='0' y={yTop} />
            )
          })}

          {gridValues.map((value) => (
            <line
              key={value}
              stroke='#4b5563'
              strokeDasharray='6 6'
              strokeOpacity='0.6'
              vectorEffect='non-scaling-stroke'
              x1='0'
              x2={VIEW_WIDTH}
              y1={chart.toY(value)}
              y2={chart.toY(value)}
            />
          ))}

          <path d={chart.area} fill={`url(#${gradientId})`} />
          <path d={chart.line} fill='none' stroke={color} strokeWidth='2' vectorEffect='non-scaling-stroke' />

          {highlightIndex !== undefined && !!data[highlightIndex] && (
            <line
              stroke='#facc15'
              strokeDasharray='4 4'
              vectorEffect='non-scaling-stroke'
              x1={chart.toX(highlightIndex)}
              x2={chart.toX(highlightIndex)}
              y1='0'
              y2={height}
            />
          )}

          {indexHover !== null && (
            <line
              stroke='#e5e7eb'
              strokeOpacity='0.6'
              vectorEffect='non-scaling-stroke'
              x1={chart.toX(indexHover)}
              x2={chart.toX(indexHover)}
              y1='0'
              y2={height}
            />
          )}
        </svg>

        {highlightIndex !== undefined && !!highlightLabel && (
          <div
            className='absolute top-0 text-[10px] text-yellow-400 bg-gray-900/80 px-1 rounded whitespace-nowrap -translate-x-1/2'
            style={{ left: `${percentOf(highlightIndex)}%` }}
          >
            {highlightLabel}
          </div>
        )}

        {indexHover !== null && (
          <div
            className='absolute bottom-full mb-1 text-[11px] text-white bg-gray-900 border border-gray-600 rounded px-2 py-1 whitespace-nowrap -translate-x-1/2 pointer-events-none'
            style={{ left: `${percentOf(indexHover)}%` }}
          >
            <div className='font-bold'>{formatValue(data[indexHover])}</div>
            {!!labels[indexHover] && <div className='text-gray-400'>{labels[indexHover]}</div>}
          </div>
        )}
      </div>

      <div className='mt-1 flex justify-between text-[10px] text-gray-500'>
        <span>{labels[0] || ''}</span>
        <span>{labels[labels.length - 1] || ''}</span>
      </div>
    </div>
  )
}

export default LineChart
