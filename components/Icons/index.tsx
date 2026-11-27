import { SVGProps } from 'react'

import { cn } from '@/utils/functions'

type IconProps = SVGProps<SVGSVGElement>

export const CloseIcon = ({ ...props }: IconProps) => {
  return (
    <svg
      className={cn('size-6', props.className)}
      fill='none'
      stroke='currentColor'
      strokeWidth={1.5}
      viewBox='0 0 24 24'
      xmlns='http://www.w3.org/2000/svg'
      {...props}
    >
      <path d='m9.75 9.75 4.5 4.5m0-4.5-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z' strokeLinecap='round' strokeLinejoin='round' />
    </svg>
  )
}

export const SearchIcon = ({ ...props }: IconProps) => {
  return (
    <svg className={cn('size-4', props.className)} fill='none' stroke='currentColor' strokeWidth={2} viewBox='0 0 24 24' {...props}>
      <path d='M21 21l-4.35-4.35M17 10a7 7 0 11-14 0 7 7 0 0114 0z' strokeLinecap='round' strokeLinejoin='round' />
    </svg>
  )
}

export const EditIcon = ({ ...props }: IconProps) => {
  return (
    <svg className={cn('size-4', props.className)} fill='none' stroke='currentColor' strokeWidth={2} viewBox='0 0 24 24' {...props}>
      <path
        d='M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </svg>
  )
}
