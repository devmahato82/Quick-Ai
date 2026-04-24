import React, { useState } from 'react'
import { Sparkles, Image, LoaderCircle } from 'lucide-react'
import { useAuth } from '@clerk/clerk-react'
import api from '../lib/api'

const looksLikeBase64Image = (value) => (
  typeof value === 'string'
  && value.length > 100
  && /^[A-Za-z0-9+/=\r\n]+$/.test(value.trim())
)

const normalizeImageSrc = (value) => {
  if (!value) return ''

  if (typeof value === 'string') {
    const trimmed = value.trim()

    if (!trimmed) return ''
    if (trimmed.startsWith('data:image/')) return trimmed
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('blob:') || trimmed.startsWith('/')) {
      return trimmed
    }

    if (trimmed.startsWith('base64,')) {
      return `data:image/png;base64,${trimmed.slice('base64,'.length)}`
    }

    if (trimmed.startsWith('image/')) {
      return `data:${trimmed}`
    }

    if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
      try {
        return normalizeImageSrc(JSON.parse(trimmed))
      } catch {
        return ''
      }
    }

    if (looksLikeBase64Image(trimmed)) {
      return `data:image/png;base64,${trimmed.replace(/\s+/g, '')}`
    }

    return trimmed
  }

  if (Array.isArray(value)) {
    return value.map(normalizeImageSrc).find(Boolean) || ''
  }

  if (typeof value === 'object') {
    return normalizeImageSrc(
      value.src
      || value.url
      || value.image_url
      || value.b64_json
      || value.base64
      || value.data
      || value.output
    )
  }

  return ''
}

const GenerateImages = () => {
  const imageStyle = ['Realistic', 'Ghibli Style', 'Anime Style', 'Cartoon style', 'Fantasy style', '3D style', 'Portrait style']

  const { getToken } = useAuth()
  const [selectedStyle, setSelectedStyle] = useState(imageStyle[0])
  const [input, setInput] = useState('')
  const [publish, setPublish] = useState(false)
  const [loading, setLoading] = useState(false)
  const [resultData, setResultData] = useState(null)
  const [imageError, setImageError] = useState('')

  const onSubmitHandler = async (e) => {
    e.preventDefault()
    try {
      setLoading(true)
      setResultData(null)
      setImageError('')
      const token = await getToken()

      const { data } = await api.post(
        '/api/ai/generate-image',
        {
          prompt: input,
          style: selectedStyle,
          publish
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      )

      if (data.success) {
        const imageSrc = normalizeImageSrc(data.data)

        if (!imageSrc) {
          setImageError('Generated image came back in an unsupported format.')
          return
        }

        setResultData(imageSrc)
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
          <Sparkles className='w-6 text-[#00AD25]' />
          <h1 className='text-xl font-semibold'>AI Image Generator</h1>
        </div>

        <p className='mt-6 text-sm font-medium'>Describe Your Image</p>
        <textarea onChange={(e) => setInput(e.target.value)} value={input} rows={4} className='mt-2 w-full rounded-sm border border-gray-300 p-2 px-3 text-sm outline-none' placeholder='Describe what you want to see in the image ...' required />

        <p className='mt-6 text-sm font-medium'>Style</p>
        <div className='mt-3 flex flex-wrap gap-3'>
          {imageStyle.map((item) => (
            <span
              onClick={() => setSelectedStyle(item)}
              className={`cursor-pointer rounded-full border px-4 py-1 text-xs ${selectedStyle === item ? 'bg-green-50 text-green-700' : 'border-gray-300 text-gray-500'}`}
              key={item}
            >
              {item}
            </span>
          ))}
        </div>

        <div className='my-6 flex items-center gap-2'>
          <label className='relative cursor-pointer'>
            <input type="checkbox" onChange={(e) => setPublish(e.target.checked)} checked={publish} className='peer sr-only' />
            <div className='h-5 w-9 rounded-full bg-slate-300 transition peer-checked:bg-green-500'></div>
            <span className='absolute left-1 top-1 h-3 w-3 rounded-full bg-white transition peer-checked:translate-x-4'></span>
          </label>
          <p className='text-sm'>Make this image Public</p>
        </div>

        <button disabled={loading} className='mt-6 flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-linear-to-r from-[#00AD25] to-[#04ff50] px-4 py-2 text-sm text-white disabled:opacity-50'>
          {loading ? <LoaderCircle className='w-5 animate-spin' /> : <Image className='w-5' />}
          {loading ? "Generating..." : "Generate Images"}
        </button>
      </form>

      <div className='flex min-h-[400px] w-full flex-col rounded-lg border border-gray-200 bg-white p-4 xl:max-w-none'>
        <div className='flex items-center gap-3'>
          <Image className='h-5 w-5 text-[#00AD25]' />
          <h1 className='text-xl font-semibold'>Generated Images</h1>
        </div>

        <div className='flex flex-1 items-center justify-center p-4'>
          {loading && (
            <div className='flex flex-col items-center gap-3 text-gray-500'>
              <LoaderCircle className='h-10 w-10 animate-spin text-[#00AD25]' />
              <p>Generating your image...</p>
            </div>
          )}

          {!loading && resultData && (
            <img
              src={resultData}
              alt="AI Generated"
              className="h-auto max-h-[520px] w-full rounded-lg object-contain shadow-md"
              onError={() => {
                setResultData(null)
                setImageError('The generated image source could not be displayed.')
              }}
            />
          )}

          {!loading && !resultData && imageError && (
            <div className='flex flex-col items-center gap-3 text-center text-sm text-red-500'>
              <Image className='h-9 w-9' />
              <p>{imageError}</p>
            </div>
          )}

          {!loading && !resultData && !imageError && (
            <div className='flex flex-col items-center gap-5 text-center text-sm text-gray-400'>
              <Image className='h-9 w-9' />
              <p>Enter a description and click Generate Image to get started</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default GenerateImages
