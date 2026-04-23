import React, { useState } from 'react'
import { Sparkles, Edit, Hash, LoaderCircle } from 'lucide-react'
import { useAuth } from '@clerk/clerk-react'
import ReactMarkdown from 'react-markdown'
import api from '../lib/api'

const BlogTitles = () => {

  const blogCategories = [ 'General', 'Technology' , 'Business', 'Health', 'Education', 'Travel', 'Food']
  
    const { getToken } = useAuth()
    const [selectedCategory, setSelectedCategory] = useState(blogCategories[0])
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

        const { data } = await api.post('/api/ai/generate-blog-title', 
          { prompt: `Topic: ${input}, Category: ${selectedCategory}` },
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
          <Sparkles className='w-6 text-[#8E37EB]'/>
          <h1 className='text-xl font-semibold'>AI Title Generator</h1>
        </div>
        <p className='mt-6 text-sm font-medium'>Keyword</p>
        <input onChange={(e) => setInput(e.target.value)} value={input} type="text" className='w-full p-2 px-3 mt-2 outline-none text-sm rounded-sm border border-gray-300' placeholder='The future of artificial intelligence is...' required />

        <p className='mt-6 text-sm font-medium'>Category</p>

        <div className='mt-3 flex gap-3 flex-wrap sm:max-w-9/11'>
          {
            blogCategories.map((item)=>(
              <span onClick={() => setSelectedCategory(item)} className={` text-xs px-4 py-1 border rounded-full cursor-pointer ${selectedCategory === item ? 'bg-purple-50 text-purple-700' : 'text-gray-500 border-gray-300'}`} key={item}>{item}</span>
            ) )
          }
        </div>

        <button disabled={loading} className='w-full flex justify-center items-center gap-2 bg-linear-to-r from-[#C341F6] to-[#8E37EB] text-white px-4 py-2 mt-6 text-sm rounded-lg cursor-pointer disabled:opacity-50'>
          {loading ? <LoaderCircle className='w-5 animate-spin' /> : <Hash className='w-5 '/>}
          {loading ? "Generating..." : "Generate Title"}
        </button>

      </form>

      {/* right col */}

      <div className='w-full max-w-lg p-4 bg-white rounded-lg flex flex-col border border-gray-200 min-h-[400px]'>
        <div className='flex item-center gap-3'>
          <Edit className='w-5 h-5 text-[#4A7AFF]' />
          <h1 className='text-xl font-semibold'> Generated Titles </h1>

        </div>
        
        <div className='flex-1 flex justify-center items-center p-4'>
           {loading && (
              <div className='flex flex-col items-center gap-3 text-gray-500'>
                 <LoaderCircle className='w-10 h-10 animate-spin text-[#8E37EB]' />
                 <p>Drafting titles...</p>
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
                <p>Enter a topic and click Generate Title to get started</p>
              </div>
           )}
        </div>

      </div>
       
    </div>
  )
}

export default BlogTitles;
