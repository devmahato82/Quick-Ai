import React, { useState, useEffect } from 'react'
import { useAuth, useUser } from '@clerk/clerk-react'
import { Heart } from 'lucide-react'
import api from '../lib/api'

const Community = () => {
  const [creations, setCreations] = useState([])
  const [updatingId, setUpdatingId] = useState(null)
  const { user } = useUser()
  const { getToken } = useAuth()

  const fetchCreations = async () => {
    const token = await getToken()
    const { data } = await api.get('/api/ai/community-creations?limit=30', {
      headers: { Authorization: `Bearer ${token}` }
    })

    if (data.success) {
      setCreations(data.data || [])
    }
  }

  useEffect(() => {
    if (user) {
      fetchCreations()
    }
  }, [user])

  const onLikeToggle = async (creationId) => {
    if (!user || updatingId === creationId) return

    try {
      setUpdatingId(creationId)
      const token = await getToken()
      const { data } = await api.post(`/api/ai/community-creations/${creationId}/like`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (data.success) {
        setCreations((current) => current.map((creation) => (
          creation.id === creationId
            ? { ...creation, likes: data.data.likes || [] }
            : creation
        )))
      }
    } catch (error) {
      console.error(error)
    } finally {
      setUpdatingId(null)
    }
  }

  return (
    <div className='flex h-full flex-col gap-4 p-4 sm:p-6'>
      <h1 className='text-lg font-semibold text-slate-700'>Creations</h1>

      <div className='h-full w-full overflow-y-auto rounded-xl bg-white p-3 sm:p-4'>
        {creations.length > 0 ? (
          <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3'>
            {creations.map((creation, index) => (
              <div key={index} className='group relative overflow-hidden rounded-lg'>
                <img src={creation.content} alt="" className='aspect-square w-full rounded-lg object-cover' />

                <div className='absolute inset-0 flex items-end justify-between gap-2 rounded-lg bg-linear-to-b from-transparent via-transparent to-black/80 p-3 text-white opacity-100 sm:opacity-0 sm:transition-opacity sm:duration-300 sm:group-hover:opacity-100'>
                  <p className='max-w-[75%] break-words text-sm'>{creation.prompt}</p>
                  <div className='flex shrink-0 items-center gap-1'>
                    <p>{creation.likes?.length || 0}</p>
                    <button
                      type="button"
                      onClick={() => onLikeToggle(creation.id)}
                      disabled={updatingId === creation.id}
                      className='disabled:opacity-60'
                    >
                      <Heart className={`h-5 min-w-5 cursor-pointer hover:scale-110 ${creation.likes?.includes(user.id) ? 'fill-red-500 text-red-600' : 'text-white'}`} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className='p-6 text-slate-500'>
            No public creations yet. Turn on `Make this image Public` before generating an image and it will appear here.
          </div>
        )}
      </div>
    </div>
  )
}

export default Community
