import React, { useState } from 'react'
import { Sparkles, Scissors, LoaderCircle } from 'lucide-react'
import { useAuth } from '@clerk/clerk-react';
import api from '../lib/api';

const RemoveObject = () => {

    const { getToken } = useAuth();
    const [input, setInput] = useState(null)
    const [object, setObject] = useState('')
    const [loading, setLoading] = useState(false);
    const [resultData, setResultData] = useState(null);

    const onSubmitHandler = async(e) => {
      e.preventDefault();
      if (!input || !object) return;

      try {
        setLoading(true);
        setResultData(null);
        const token = await getToken();

        const formData = new FormData();
        formData.append('image', input);
        formData.append('prompt', object);

        const { data } = await api.post('/api/ai/remove-object', formData, {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        });

        if (data.success) {
          setResultData(data.data);
        } else {
          alert('Error: ' + data.message);
        }

      } catch (err) {
        alert(err.message);
      } finally {
        setLoading(false);
      }
    }

  return (
    <div className='h-full overflow-y-scroll p-6 flex items-start flex-wrap gap-4 text-slate-700'>
      {/* left col */}

      <form onSubmit={onSubmitHandler} className='w-full max-w-lg p-4 bg-white rounded-lg border border-gray-200'>

        <div className="flex items-center gap-3">
          <Sparkles className='w-6 text-[#4A7AFF]'/>
          <h1 className='text-xl font-semibold'>Object Remover</h1>
        </div>

        <p className='mt-6 text-sm font-medium'>Upload Image</p>

        <input onChange={(e) => setInput(e.target.files[0])} type="file" accept='image/*' className='w-full p-2 px-3 mt-2 outline-none text-sm rounded-sm border border-gray-300 text-gray-600' required />

        <p className='mt-6 text-sm font-medium'>Describe object name to remove</p>

        <textarea onChange={(e) => setObject(e.target.value)} value={object} rows={4} className='w-full p-2 px-3 mt-2 outline-none text-sm rounded-sm border border-gray-300' placeholder='e.g., watch or spoon, only single object name' required />

      
        <button disabled={loading} className='w-full flex justify-center items-center gap-2 bg-linear-to-r from-[#417DF6] to-[#8E37EB] text-white px-4 py-2 mt-6 text-sm rounded-lg cursor-pointer disabled:opacity-50'>
          {loading ? <LoaderCircle className='w-5 animate-spin' /> : <Scissors className='w-5 '/>}
          {loading ? "Processing..." : "Remove Object"}
        </button>

      </form>

      {/* right col */}

      <div className='w-full max-w-lg p-4 bg-white rounded-lg flex flex-col border border-gray-200 min-h-[400px]'>
        <div className='flex item-center gap-3'>
          <Scissors className='w-5 h-5 text-[#4A7AFF]' />
          <h1 className='text-xl font-semibold'> Processed Image</h1>

        </div>
        <div className='flex-1 flex justify-center items-center p-4'>
            {loading && (
              <div className='flex flex-col items-center gap-3 text-gray-500'>
                 <LoaderCircle className='w-10 h-10 animate-spin text-[#417DF6]' />
                 <p>Removing object...</p>
              </div>
           )}
           {!loading && resultData && (
              <img src={resultData} alt="Removed Object Result" className="w-full h-auto rounded-lg shadow-md" />
           )}
           {!loading && !resultData && (
              <div className='text-sm flex flex-col items-center gap-5 text-gray-400'>
                <Scissors className='w-9 h-9' />
                <p>Upload an image and click Remove Object to get started</p>
              </div>
           )}
        </div>

      </div>
       
    </div>
  )
}

export default RemoveObject;
