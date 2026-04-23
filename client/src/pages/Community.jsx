import React, { useState, useEffect } from 'react'
import { useAuth, useUser} from '@clerk/clerk-react'
import axios from 'axios'
import { Heart } from 'lucide-react'

const Community = () => {

  const [creations, setCreations] = useState([])
  const [updatingId, setUpdatingId] = useState(null)
  const {user} = useUser()
  const { getToken } = useAuth()

  const fetchCreations = async () =>{
    const token = await getToken()
    const { data } = await axios.get('http://localhost:3000/api/ai/community-creations?limit=30', {
      headers: { Authorization: `Bearer ${token}` }
    })

    if (data.success) {
      setCreations(data.data || [])
    }
  }

  useEffect(()=>{
    if(user){
      fetchCreations()
    }
  },[user])

  const onLikeToggle = async (creationId) => {
    if (!user || updatingId === creationId) return

    try {
      setUpdatingId(creationId)
      const token = await getToken()
      const { data } = await axios.post(`http://localhost:3000/api/ai/community-creations/${creationId}/like`, {}, {
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
    <div className='flex-1 h-full flex flex-col gap-4 p-6'>
        Creations 
        <div className='bg-white h-full w-full rounded-xl overflow-y-scroll'>
          {creations.length > 0 ? (
            creations.map((creation, index)=> (
              <div key={index} className='relative group inline-block pl-3 pt-3 w-full sm:max-w-1/2 lg:max-w-1/3'>
                  <img src={creation.content} alt="" className='w-full h-full object-cover rounded-lg'/>

                  <div className='absolute bottom-0 top-0 right-0 left-3 flex gap-2 items-end justify-end group-hover:justify-between p-3 group-hover:bg-linear-to-b from-transparent to-black/80 text-white rounded-lg'>
                    <p className='text-sm hidden group-hover:block'>{creation.prompt}</p>
                    <div className='flex gap-1 items-center'>
                      <p>{creation.likes?.length || 0}</p>
                      <button
                        type="button"
                        onClick={() => onLikeToggle(creation.id)}
                        disabled={updatingId === creation.id}
                        className='disabled:opacity-60'
                      >
                        <Heart className={`min-w-5 h-5 hover:scale-110 cursor-pointer ${creation.likes?.includes(user.id) ? 'fill-red-500 text-red-600' : 'text-white'}`}/>
                      </button>
                    </div>
                  </div>
              </div>

            ))
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
