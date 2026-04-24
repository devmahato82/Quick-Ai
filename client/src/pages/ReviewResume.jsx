import React, { useState } from 'react'
import { Sparkles, LoaderCircle, FileText, Eraser } from 'lucide-react'
import { useAuth } from '@clerk/clerk-react'
import ReactMarkdown from 'react-markdown'
import api from '../lib/api'

const ReviewResume = () => {
  const { getToken } = useAuth()
  const [input, setInput] = useState(null)
  const [loading, setLoading] = useState(false)
  const [resultData, setResultData] = useState(null)

  const onSubmitHandler = async (e) => {
    e.preventDefault()
    if (!input) return

    try {
      setLoading(true)
      setResultData(null)
      const token = await getToken()

      const formData = new FormData()
      formData.append('pdf', input)

      const { data } = await api.post('/api/ai/review-resume', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      })

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
          <Sparkles className='w-6 text-[#00DA83]' />
          <h1 className='text-xl font-semibold'>Review Resume</h1>
        </div>

        <p className='mt-6 text-sm font-medium'>Upload Resume</p>
        <input onChange={(e) => setInput(e.target.files[0])} type="file" accept='application/pdf' className='mt-2 w-full rounded-sm border border-gray-300 p-2 px-3 text-sm text-gray-600 outline-none' required />
        <p className='mt-1 text-sm font-light text-gray-500'>Supports PDF resume only.</p>

        <button disabled={loading} className='mt-6 flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-linear-to-r from-[#00AD83] to-[#009BB3] px-4 py-2 text-sm text-white disabled:opacity-50'>
          {loading ? <LoaderCircle className='w-5 animate-spin' /> : <FileText className='w-5' />}
          {loading ? "Analyzing..." : "Review Resume"}
        </button>
      </form>

      <div className='flex min-h-[400px] w-full flex-col rounded-lg border border-gray-200 bg-white p-4 xl:max-w-none'>
        <div className='flex items-center gap-3'>
          <FileText className='h-5 w-5 text-[#00AD83]' />
          <h1 className='text-xl font-semibold'>Analysis Results</h1>
        </div>

        <div className='flex flex-1 items-center justify-center p-4'>
          {loading && (
            <div className='flex flex-col items-center gap-3 text-gray-500'>
              <LoaderCircle className='h-10 w-10 animate-spin text-[#00AD83]' />
              <p>Analyzing resume via AI...</p>
            </div>
          )}

          {!loading && resultData && (
            <div className="prose prose-sm max-h-[500px] w-full overflow-y-auto p-2 sm:p-4">
              <ReactMarkdown>{resultData}</ReactMarkdown>
            </div>
          )}

          {!loading && !resultData && (
            <div className='flex flex-col items-center gap-5 text-center text-sm text-gray-400'>
              <Eraser className='h-9 w-9' />
              <p>Upload a pdf and click Review resume to get started</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ReviewResume
