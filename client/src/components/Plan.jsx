import React from 'react'
import { PricingTable } from '@clerk/clerk-react'

const Plan = () => {
  return (
    <div className='mx-auto my-20 w-full max-w-6xl px-4 sm:px-6 lg:px-8'>
      <div className='text-center'>
        <h2 className='text-3xl text-slate-700 sm:text-[42px]'>Choose your Plan</h2>
        <p className='mx-auto max-w-lg text-gray-500'>Start for free and scale as you grow. Find the perfect plan for your content creation needs</p>
      </div>

      <div className='mt-10 overflow-x-auto rounded-2xl bg-white/60 p-1 sm:mt-14'>
        <PricingTable />
      </div>
    </div>
  )
}

export default Plan
