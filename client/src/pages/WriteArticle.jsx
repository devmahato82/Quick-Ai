import { Edit, LoaderCircle, Sparkles } from 'lucide-react'
import React, { useState } from 'react'
import { useAuth } from '@clerk/clerk-react'
import ReactMarkdown from 'react-markdown'
import api from '../lib/api'

const WriteArticle = () => {
  const articleLength = [
    { length: 800, text: 'Short (500-800 words)' },
    { length: 1200, text: 'Medium (800-1200 words)' },
    { length: 1600, text: 'Long (1200+ words)' }
  ]

  const { getToken } = useAuth()
  const [selectedLength, setSelectedLength] = useState(articleLength[0])
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
        '/api/ai/generate-article',
        { prompt: input, length: selectedLength.length },
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
          <Sparkles className='w-6 text-[#4A7AFF]' />
          <h1 className='text-xl font-semibold'>Article Configuration</h1>
        </div>

        <p className='mt-6 text-sm font-medium'>Article Topic</p>
        <input onChange={(e) => setInput(e.target.value)} value={input} type="text" className='mt-2 w-full rounded-sm border border-gray-300 p-2 px-3 text-sm outline-none' placeholder='The future of artificial intelligence is...' required />

        <p className='mt-6 text-sm font-medium'>Article Length</p>
        <div className='mt-3 flex flex-wrap gap-3'>
          {articleLength.map((item, index) => (
            <span onClick={() => setSelectedLength(item)} className={`cursor-pointer rounded-full border px-4 py-1 text-xs ${selectedLength.text === item.text ? 'bg-blue-50 text-blue-700' : 'border-gray-300 text-gray-500'}`} key={index}>
              {item.text}
            </span>
          ))}
        </div>

        <button disabled={loading} className='mt-6 flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-linear-to-r from-[#226BFF] to-[#65ADFF] px-4 py-2 text-sm text-white disabled:opacity-50'>
          {loading ? <LoaderCircle className='w-5 animate-spin' /> : <Edit className='w-5' />}
          {loading ? "Generating..." : "Generate Article"}
        </button>
      </form>

      <div className='flex min-h-[400px] w-full flex-col rounded-lg border border-gray-200 bg-white p-4 xl:max-w-none'>
        <div className='flex items-center gap-3'>
          <Edit className='h-5 w-5 text-[#8E37EB]' />
          <h1 className='text-xl font-semibold'>Generated Article</h1>
        </div>

        <div className='flex flex-1 items-center justify-center p-4'>
          {loading && (
            <div className='flex flex-col items-center gap-3 text-gray-500'>
              <LoaderCircle className='h-10 w-10 animate-spin text-[#226BFF]' />
              <p>Drafting your article...</p>
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
              <p>Enter a topic and click Generate Article to get started</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default WriteArticle
