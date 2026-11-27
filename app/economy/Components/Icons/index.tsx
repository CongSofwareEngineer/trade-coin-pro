export const SearchIcon = ({ className = 'w-4 h-4' }: { className?: string }) => (
  <svg className={className} fill='none' stroke='currentColor' viewBox='0 0 24 24'>
    <path d='M21 21l-4.35-4.35M17 10a7 7 0 11-14 0 7 7 0 0114 0z' strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} />
  </svg>
)

export const EditIcon = ({ className = 'w-4 h-4' }: { className?: string }) => (
  <svg className={className} fill='none' stroke='currentColor' viewBox='0 0 24 24'>
    <path
      d='M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z'
      strokeLinecap='round'
      strokeLinejoin='round'
      strokeWidth={2}
    />
  </svg>
)
