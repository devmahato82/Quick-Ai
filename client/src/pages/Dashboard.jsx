import React, { useEffect, useState } from 'react'
import { Gem, Sparkles } from 'lucide-react'
import { Protect, useAuth } from '@clerk/clerk-react'
import CreationItem from '../components/CreationItem'
import api from '../lib/api'

const Dashboard = () => {

  const [creations, setCreations] = useState([])
  const [totalCreations, setTotalCreations] = useState(0)
  const { getToken } = useAuth()

  const getDashboardData = async () =>{
    const token = await getToken()
    const { data } = await api.get('/api/ai/creations?limit=10', {
      headers: { Authorization: `Bearer ${token}` }
    })

    if (data.success) {
      setCreations(data.data.creations || [])
      setTotalCreations(data.data.total || 0)
    }
  }

  useEffect(() => {
    getDashboardData()
  }, [])
 

  return (
    <div className='h-full overflow-y-scroll p-6'>
        <div className='flex justify-start gap-4 flex-wrap'>

          {/*Total Creation Card*/}
          <div className='flex justify-between items-center w-72 p-4 px-6 bg-white rounded-xl border border-gray-200'>
            <div className='text-slate-600'>
              <p className='text-sm'>Total Creations</p>
              <h2 className='text-xl font-semibold'>{totalCreations}</h2>
            </div>
            <div className='w-10 h-10 rounded-lg bg-linear-to-br from-[#3588F2] to-[#0BB0D7] text-white flex justify-center items-center'>
              <Sparkles className='w-5 text-white' />
            </div>

          </div>


          {/*Active Plan Card*/}
          <div className='flex justify-between items-center w-72 p-4 px-6 bg-white rounded-xl border border-gray-200'>
            <div className='text-slate-600'>
              <p className='text-sm'>Active Plan</p>
              <h2 className='text-xl font-semibold'>
                <Protect plan='premium' fallback="Free">Premium</Protect> Plan
              </h2>
            </div>
            <div className='w-10 h-10 rounded-lg bg-linear-to-br from-[#FF61C5] to-[#09E53EE] text-white flex justify-center items-center'>
              <Gem className='w-5 text-white' />
            </div>

          </div>

        </div>
          
        <div className='space-y-3'>
          <p className='mt-6 mb-4'>Recent Creations</p>
          {creations.length > 0 ? (
            creations.map((item )=> <CreationItem key={item.id} item={item} /> )
          ) : (
            <div className='p-4 max-w-5xl text-sm bg-white border border-gray-200 rounded-lg text-slate-500'>
              No creations yet. Start with any AI tool and your recent work will appear here.
            </div>
          )}
        </div>

        
    </div>
  )
}

export default Dashboard;
