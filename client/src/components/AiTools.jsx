import React from 'react'
import { AiToolsData } from '../assets/assets'
import { useNavigate } from 'react-router-dom'
import { useUser } from '@clerk/clerk-react'

const AiTools = () => {
  const navigate = useNavigate()
  const { user } = useUser()

  return (
    <div className='my-20 px-4 sm:px-6 lg:px-20 xl:px-32'>
      <div className='text-center'>
        <h2 className='text-3xl font-semibold text-slate-700 sm:text-[42px]'>Powerful AI Tools</h2>
        <p className='mx-auto max-w-lg text-gray-500'>Everything you need to create, enhance, and optimize your content with cutting-edge AI technology</p>
      </div>

      <div className='mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3'>
        {AiToolsData.map((tool, index) => (
          <div
            key={index}
            className='w-full cursor-pointer rounded-lg border border-gray-100 bg-[#FDFDFE] p-6 shadow-lg transition-all duration-300 hover:-translate-y-1 sm:p-8'
            onClick={() => user && navigate(tool.path)}
          >
            <tool.Icon className='h-12 w-12 rounded-xl p-3 text-white' style={{ background: `linear-gradient(to bottom, ${tool.bg.from}, ${tool.bg.to})` }} />
            <h3 className='mb-3 mt-6 text-lg font-semibold'>{tool.title}</h3>
            <p className='max-w-[95%] text-sm text-gray-400'>{tool.description}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

export default AiTools
