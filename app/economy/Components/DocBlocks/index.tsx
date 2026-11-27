import { Fragment, ReactNode } from 'react'

import { DocBlock, DocTextRun } from '@/types/economy'
import { cn } from '@/utils/functions'

// Plain, readable headings: this page is for reading, not for show
const HEADING_CLASS: Record<number, string> = {
  1: 'text-xl md:text-2xl font-semibold text-white',
  2: 'text-lg md:text-xl font-semibold text-white',
  3: 'text-base font-semibold text-white',
  4: 'text-base font-semibold text-gray-200',
  5: 'text-[15px] font-semibold text-gray-200',
  6: 'text-[15px] font-semibold text-gray-300',
}

const renderRuns = (runs: DocTextRun[]): ReactNode =>
  runs.map((run, index) => {
    const content = (
      <span
        className={cn(
          run.bold && 'font-semibold text-white',
          run.italic && 'italic',
          run.underline && 'underline underline-offset-4',
          run.code && 'px-1.5 py-0.5 bg-gray-700 rounded text-[0.9em] text-blue-300'
        )}
      >
        {run.text}
      </span>
    )

    if (run.link) {
      return (
        <a
          key={index}
          className='text-blue-400 underline underline-offset-4 hover:text-blue-300'
          href={run.link}
          rel='noopener noreferrer'
          target='_blank'
        >
          {content}
        </a>
      )
    }

    return <Fragment key={index}>{content}</Fragment>
  })

type ListItemBlock = Extract<DocBlock, { type: 'listItem' }>

type BlockGroup = { kind: 'list'; ordered: boolean; items: ListItemBlock[] } | { kind: 'block'; block: DocBlock }

/** Groups consecutive list items so they render inside one <ul> / <ol>. */
const groupBlocks = (blocks: DocBlock[]) => {
  const groups: BlockGroup[] = []

  blocks.forEach((block) => {
    const last = groups[groups.length - 1]

    if (block.type === 'listItem') {
      if (last?.kind === 'list' && last.ordered === block.ordered) {
        last.items.push(block)

        return
      }

      groups.push({ kind: 'list', ordered: block.ordered, items: [block] })

      return
    }

    groups.push({ kind: 'block', block })
  })

  return groups
}

const DocBlocks = ({ blocks, className }: { blocks: DocBlock[]; className?: string }) => {
  if (blocks.length === 0) return null

  return (
    <div className={cn('flex max-w-[72ch] flex-col gap-4 text-[15px] md:text-base', className)}>
      {groupBlocks(blocks).map((group, index) => {
        if (group.kind === 'list') {
          const ListTag = group.ordered ? 'ol' : 'ul'

          return (
            <ListTag
              key={index}
              className={cn('flex flex-col gap-2 pl-5 leading-[1.75] text-gray-300', group.ordered ? 'list-decimal' : 'list-disc')}
            >
              {group.items.map((item, itemIndex) => (
                <li key={itemIndex} className='marker:text-blue-400' style={{ marginLeft: item.level * 16 }}>
                  {renderRuns(item.runs)}
                </li>
              ))}
            </ListTag>
          )
        }

        const { block } = group

        if (block.type === 'heading') {
          return (
            <h4 key={index} className={cn('pt-2', HEADING_CLASS[block.level] || HEADING_CLASS[4])}>
              {renderRuns(block.runs)}
            </h4>
          )
        }

        if (block.type === 'quote') {
          return (
            <blockquote key={index} className='border-l-2 border-blue-500 pl-4 italic leading-[1.75] text-gray-400'>
              {renderRuns(block.runs)}
            </blockquote>
          )
        }

        if (block.type === 'table') {
          const [headRow, ...bodyRows] = block.rows

          return (
            <div key={index} className='bg-gray-800 border border-gray-700 rounded-lg overflow-x-auto custom-scrollbar'>
              <table className='w-full text-left text-sm'>
                <thead className='bg-gray-700'>
                  <tr>
                    {headRow?.map((cell, cellIndex) => (
                      <th key={cellIndex} className='p-4 font-semibold text-white'>
                        {renderRuns(cell)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {bodyRows.map((row, rowIndex) => (
                    <tr key={rowIndex} className='border-b border-gray-700 hover:bg-gray-700/20'>
                      {row.map((cell, cellIndex) => (
                        <td key={cellIndex} className='p-4 align-top text-gray-300'>
                          {renderRuns(cell)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        }

        return (
          <p key={index} className='leading-[1.75] text-gray-300'>
            {renderRuns(block.runs)}
          </p>
        )
      })}
    </div>
  )
}

export default DocBlocks
