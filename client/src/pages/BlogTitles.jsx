import React, { useState } from 'react'
import { Sparkles, Edit, Hash, LoaderCircle } from 'lucide-react'
import { useAuth } from '@clerk/clerk-react'
import ReactMarkdown from 'react-markdown'
import api from '../lib/api'

const BlogTitles = () => {
  const blogCategories = ['General', 'Technology', 'Business', 'Health', 'Education', 'Travel', 'Food']

  const { getToken } = useAuth()
  const [selectedCategory, setSelectedCategory] = useState(blogCategories[0])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [resultData, setResultData] = useState(null)

  const onSubmitHandler = async (e) => {
    e.preventDefault()
    if (!input) return

    try {
      setLoading(true)
      setResultData(null)
      const token = await getToken()

      const { data } = await api.post(
        '/api/ai/generate-blog-title',
        { prompt: `Topic: ${input}, Category: ${selectedCategory}` },
        { headers: { Authorization: `Bearer ${token}` } }
      )

      if (data.success) {
        setResultData(data.data)
      } else {
        alert('Error: ' + data.message)
      }
    } catch (err) {
      alert(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='grid h-full grid-cols-1 items-start gap-4 overflow-y-auto p-4 text-slate-700 sm:p-6 xl:grid-cols-2'>
      <form onSubmit={onSubmitHandler} className='w-full rounded-lg border border-gray-200 bg-white p-4 xl:max-w-none'>
        <div className="flex items-center gap-3">
          <Sparkles className='w-6 text-[#8E37EB]' />
          <h1 className='text-xl font-semibold'>AI Title Generator</h1>
        </div>

        <p className='mt-6 text-sm font-medium'>Keyword</p>
        <input onChange={(e) => setInput(e.target.value)} value={input} type="text" className='mt-2 w-full rounded-sm border border-gray-300 p-2 px-3 text-sm outline-none' placeholder='The future of artificial intelligence is...' required />

        <p className='mt-6 text-sm font-medium'>Category</p>
        <div className='mt-3 flex flex-wrap gap-3'>
          {blogCategories.map((item) => (
            <span onClick={() => setSelectedCategory(item)} className={`cursor-pointer rounded-full border px-4 py-1 text-xs ${selectedCategory === item ? 'bg-purple-50 text-purple-700' : 'border-gray-300 text-gray-500'}`} key={item}>
              {item}
            </span>
          ))}
        </div>

        <button disabled={loading} className='mt-6 flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-linear-to-r from-[#C341F6] to-[#8E37EB] px-4 py-2 text-sm text-white disabled:opacity-50'>
          {loading ? <LoaderCircle className='w-5 animate-spin' /> : <Hash className='w-5' />}
          {loading ? "Generating..." : "Generate Title"}
        </button>
      </form>

      <div className='flex min-h-[400px] w-full flex-col rounded-lg border border-gray-200 bg-white p-4 xl:max-w-none'>
        <div className='flex items-center gap-3'>
          <Edit className='h-5 w-5 text-[#4A7AFF]' />
          <h1 className='text-xl font-semibold'>Generated Titles</h1>
        </div>

        <div className='flex flex-1 items-center justify-center p-4'>
          {loading && (
            <div className='flex flex-col items-center gap-3 text-gray-500'>
              <LoaderCircle className='h-10 w-10 animate-spin text-[#8E37EB]' />
              <p>Drafting titles...</p>
            </div>
          )}

          {!loading && resultData && (
            <div className="prose prose-sm max-h-[500px] w-full overflow-y-auto p-2 sm:p-4">
              <ReactMarkdown>{resultData}</ReactMarkdown>
            </div>
          )}

          {!loading && !resultData && (
            <div className='flex flex-col items-center gap-5 text-center text-sm text-gray-400'>
              <Edit className='h-9 w-9' />
              <p>Enter a topic and click Generate Title to get started</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default BlogTitles
