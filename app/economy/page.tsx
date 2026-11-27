'use client'
import { useState } from 'react'

import DiscussionTab from './Components/DiscussionTab'
import KnowledgeTab from './Components/KnowledgeTab'

import { ECONOMY_TAB } from '@/constants/economy'
import { cn } from '@/utils/functions'

const TABS = [
  { key: ECONOMY_TAB.Discussion, label: 'Thảo luận' },
  { key: ECONOMY_TAB.Knowledge, label: 'Kiến thức' },
]

const EconomyPage = () => {
  const [activeTab, setActiveTab] = useState<ECONOMY_TAB>(ECONOMY_TAB.Discussion)

  return (
    <div className='min-h-screen bg-gray-900 p-6 md:p-12 flex justify-center'>
      <div className='w-full max-w-7xl flex flex-col gap-6'>
        <div className='flex flex-wrap items-center gap-4'>
          <h1 className='text-2xl font-bold text-white'>Kinh tế</h1>

          <div className='flex gap-1 bg-gray-800 border border-gray-700 rounded-lg p-1' role='tablist'>
            {TABS.map((tab) => {
              const isActive = activeTab === tab.key

              return (
                <button
                  key={tab.key}
                  aria-selected={isActive}
                  className={cn(
                    'px-3 py-1.5 rounded-md text-xs uppercase transition-colors',
                    isActive ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
                  )}
                  role='tab'
                  type='button'
                  onClick={() => setActiveTab(tab.key)}
                >
                  {tab.label}
                </button>
              )
            })}
          </div>
        </div>

        <div role='tabpanel'>{activeTab === ECONOMY_TAB.Knowledge ? <KnowledgeTab /> : <DiscussionTab />}</div>
      </div>
    </div>
  )
}

export default EconomyPage
