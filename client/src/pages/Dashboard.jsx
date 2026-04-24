import React, { useEffect, useState } from 'react'
import { Gem, Sparkles } from 'lucide-react'
import { Protect, useAuth } from '@clerk/clerk-react'
import CreationItem from '../components/CreationItem'
import api from '../lib/api'

const Dashboard = () => {
  const [creations, setCreations] = useState([])
  const [totalCreations, setTotalCreations] = useState(0)
  const { getToken } = useAuth()

  const getDashboardData = async () => {
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
    <div className='h-full overflow-y-auto p-4 sm:p-6'>
      <div className='flex flex-wrap justify-start gap-4'>
        <div className='flex w-full items-center justify-between rounded-xl border border-gray-200 bg-white p-4 sm:w-72 sm:px-6'>
          <div className='text-slate-600'>
            <p className='text-sm'>Total Creations</p>
            <h2 className='text-xl font-semibold'>{totalCreations}</h2>
          </div>
          <div className='flex h-10 w-10 items-center justify-center rounded-lg bg-linear-to-br from-[#3588F2] to-[#0BB0D7] text-white'>
            <Sparkles className='w-5 text-white' />
          </div>
        </div>

        <div className='flex w-full items-center justify-between rounded-xl border border-gray-200 bg-white p-4 sm:w-72 sm:px-6'>
          <div className='text-slate-600'>
            <p className='text-sm'>Active Plan</p>
            <h2 className='text-xl font-semibold'>
              <Protect plan='premium' fallback="Free">Premium</Protect> Plan
            </h2>
          </div>
          <div className='flex h-10 w-10 items-center justify-center rounded-lg bg-linear-to-br from-[#FF61C5] to-[#09E53E] text-white'>
            <Gem className='w-5 text-white' />
          </div>
        </div>
      </div>

      <div className='space-y-3'>
        <p className='mb-4 mt-6'>Recent Creations</p>
        {creations.length > 0 ? (
          creations.map((item) => <CreationItem key={item.id} item={item} />)
        ) : (
          <div className='w-full max-w-5xl rounded-lg border border-gray-200 bg-white p-4 text-sm text-slate-500'>
            No creations yet. Start with any AI tool and your recent work will appear here.
          </div>
        )}
      </div>
    </div>
  )
}

export default Dashboard
