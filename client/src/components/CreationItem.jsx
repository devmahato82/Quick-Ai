import React, { useState } from 'react'
import Markdown from 'react-markdown'

const CreationItem = ({ item }) => {
  const imageTypes = ['image', 'remove-bg', 'remove-obj']
  const [expanded, setExpanded] = useState(false)

  return (
    <div onClick={() => setExpanded(!expanded)} className='w-full max-w-5xl cursor-pointer rounded-lg border border-gray-200 bg-white p-4 text-sm'>
      <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
        <div className='min-w-0'>
          <h2 className='break-words'>{item.prompt}</h2>
          <p className='text-slate-500'>{item.type} - {new Date(item.created_at).toLocaleDateString()}</p>
        </div>
        <button className='w-fit rounded-full border border-[#BFDBFE] bg-[#EFF6FF] px-4 py-1 text-[#1E40AF]'>{item.type}</button>
      </div>

      {expanded && (
        <div>
          {imageTypes.includes(item.type) ? (
            <div>
              <img src={item.content} alt="image" className='mt-3 w-full max-w-md' />
            </div>
          ) : (
            <div className='mt-3 max-h-96 overflow-y-auto text-sm text-slate-700'>
              <div className='reset-tw'>
                <Markdown>{item.content}</Markdown>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default CreationItem
