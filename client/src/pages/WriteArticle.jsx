import { Edit, Hash, Sparkles, LoaderCircle } from 'lucide-react'
import React, { useState } from 'react'
import { useAuth } from '@clerk/clerk-react'
import ReactMarkdown from 'react-markdown'
import api from '../lib/api'

const WriteArticle = () => {

  const articleLength = [
    {length: 800, text: 'Short (500-800 words)'},
    {length: 1200, text: 'Medium (800-1200 words)'},
    {length: 1600, text: 'Long (1200+ words)'}
  ]

  const { getToken } = useAuth()
  const [selectedLength, setSelectedLength] = useState(articleLength[0])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [resultData, setResultData] = useState(null)

  const onSubmitHandler = async(e) => {
    e.preventDefault();
    if (!input) return;

    try {
      setLoading(true);
      setResultData(null);
      const token = await getToken();

      const { data } = await api.post('/api/ai/generate-article', 
        { prompt: input, length: selectedLength.length },
        { headers: { Authorization: `Bearer ${token}` } }
      );

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
          <h1 className='text-xl font-semibold'>Article Configuration</h1>
        </div>
        <p className='mt-6 text-sm font-medium'>Article Topic</p>
        <input onChange={(e) => setInput(e.target.value)} value={input} type="text" className='w-full p-2 px-3 mt-2 outline-none text-sm rounded-sm border border-gray-300' placeholder='The future of artificial intelligence is...' required />

        <p className='mt-6 text-sm font-medium'>Article Length</p>

        <div className='mt-3 flex gap-3 flex-wrap sm:max-w-9/11'>
          {
            articleLength.map((item, index)=>(
              <span onClick={() => setSelectedLength(item)} className={` text-xs px-4 py-1 border rounded-full cursor-pointer ${selectedLength.text ===item.text ? 'bg-blue-50 text-blue-700' : 'text-gray-500 border-gray-300'}`} key={index}>{item.text}</span>
            ) )
          }
        </div>

        <button disabled={loading} className='w-full flex justify-center items-center gap-2 bg-linear-to-r from-[#226BFF] to-[#65ADFF] text-white px-4 py-2 mt-6 text-sm rounded-lg cursor-pointer disabled:opacity-50'>
          {loading ? <LoaderCircle className='w-5 animate-spin' /> : <Edit className='w-5 '/>}
          {loading ? "Generating..." : "Generate Article"}
        </button>

      </form>

      {/* right col */}

      <div className='w-full max-w-lg p-4 bg-white rounded-lg flex flex-col border border-gray-200 min-h-[400px] '>
        <div className='flex item-center gap-3'>
          <Edit className='w-5 h-5 text-[#8E37EB]' />
          <h1 className='text-xl font-semibold'> Generated Article </h1>
        </div>
        
        <div className='flex-1 flex justify-center items-center p-4'>
           {loading && (
              <div className='flex flex-col items-center gap-3 text-gray-500'>
                 <LoaderCircle className='w-10 h-10 animate-spin text-[#226BFF]' />
                 <p>Drafting your article...</p>
              </div>
           )}
           {!loading && resultData && (
              <div className="prose prose-sm w-full p-4 overflow-y-auto max-h-[500px]">
                  <ReactMarkdown>{resultData}</ReactMarkdown>
              </div>
           )}
           {!loading && !resultData && (
              <div className='text-sm flex flex-col items-center gap-5 text-gray-400'>
                <Edit className='w-9 h-9' />
                <p>Enter a topic and click Generate Article to get started</p>
              </div>
           )}
        </div>

      </div>
       
    </div>
  )
}

export default WriteArticle;
