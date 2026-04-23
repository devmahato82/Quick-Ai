import React from 'react'
import { PricingTable } from '@clerk/clerk-react' 

const Plan = () => {
  return (
    <div className='mx-w-2xl mx-auto z-20 my-30'>
        <div className='text-center '>
            <h2 className='text-slate-700 text-[42px]'>Choose your Plan</h2>
            <p className='text-gray-500 max-w-lg mx-auto'>Start for free and scale as you grow. Find the perfect plan for your content creation needs</p>

        </div>

        <div className='mt-14 ml-100 mr-100 max-sm:px-4 '>
            <PricingTable />
        </div>

    </div>
  )
}

export default Plan