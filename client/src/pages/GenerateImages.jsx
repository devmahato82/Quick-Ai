import React, { useState } from 'react'
import { Sparkles, Image, LoaderCircle } from 'lucide-react'
import { useAuth } from '@clerk/clerk-react';
import api from '../lib/api';

const looksLikeBase64Image = (value) => (
  typeof value === 'string'
  && value.length > 100
  && /^[A-Za-z0-9+/=\r\n]+$/.test(value.trim())
);

const normalizeImageSrc = (value) => {
  if (!value) return '';

  if (typeof value === 'string') {
    const trimmed = value.trim();

    if (!trimmed) return '';
    if (trimmed.startsWith('data:image/')) return trimmed;
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('blob:') || trimmed.startsWith('/')) {
      return trimmed;
    }

    if (trimmed.startsWith('base64,')) {
      return `data:image/png;base64,${trimmed.slice('base64,'.length)}`;
    }

    if (trimmed.startsWith('image/')) {
      return `data:${trimmed}`;
    }

    if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
      try {
        return normalizeImageSrc(JSON.parse(trimmed));
      } catch {
        return '';
      }
    }

    if (looksLikeBase64Image(trimmed)) {
      return `data:image/png;base64,${trimmed.replace(/\s+/g, '')}`;
    }

    return trimmed;
  }

  if (Array.isArray(value)) {
    return value.map(normalizeImageSrc).find(Boolean) || '';
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
    );
  }

  return '';
};

const GenerateImages = () => {

  const imageStyle = ['Realistic', 'Ghibli Style', 'Anime Style', 'Cartoon style', 'Fantasy style', '3D style', 'Portrait style']
  
    const { getToken } = useAuth();
    const [selectedStyle, setSelectedStyle] = useState(imageStyle[0])
    const [input, setInput] = useState('')
    const [publish, setPublish] = useState(false)
    const [loading, setLoading] = useState(false);
    const [resultData, setResultData] = useState(null);
    const [imageError, setImageError] = useState('');

    const onSubmitHandler = async(e) => {
      e.preventDefault();
      try {
        setLoading(true);
        setResultData(null);
        setImageError('');
        const token = await getToken();

        const { data } = await api.post('/api/ai/generate-image', 
          {
            prompt: input,
            style: selectedStyle,
            publish
          },
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );

        if (data.success) {
          const imageSrc = normalizeImageSrc(data.data);

          if (!imageSrc) {
            setImageError('Generated image came back in an unsupported format.');
            return;
          }

          setResultData(imageSrc);
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
          <Sparkles className='w-6 text-[#00AD25]'/>
          <h1 className='text-xl font-semibold'>AI Image Generator</h1>
        </div>
        
        <p className='mt-6 text-sm font-medium'>Describe Your Image</p>

        <textarea onChange={(e) => setInput(e.target.value)} value={input} rows={4} className='w-full p-2 px-3 mt-2 outline-none text-sm rounded-sm border border-gray-300' placeholder='Describe what you want to see in the image ...' required />

        <p className='mt-6 text-sm font-medium'>Style</p>

        <div className='mt-3 flex gap-3 flex-wrap sm:max-w-9/11'>
          {
            imageStyle.map((item)=>(
              <span onClick={() => setSelectedStyle(item)}
              className={` text-xs px-4 py-1 border rounded-full cursor-pointer ${selectedStyle === item ? 'bg-green-50 text-green-700' : 'text-gray-500 border-gray-300'}`} key={item}>{item}
              </span>
            ) )
          }
        </div>
        <div className='my-6 flex items-center gap-2'>
            <label className='relative cursor-pointer'>
              <input type="checkbox" onChange={(e) => setPublish(e.target.checked)} checked={publish} className='sr-only peer'/>

              <div className='w-9 h-5 bg-slate-300 rounded-full peer-checked:bg-green-500 transition'></div>

              <span className='absolute left-1 top-1 w-3 h-3 bg-white rounded-full transition peer-checked:translate-x-4'></span>
            </label>
            <p className='text-sm'>Make this image Public</p>
        </div>

        <button disabled={loading} className='w-full flex justify-center items-center gap-2 bg-linear-to-r from-[#00AD25] to-[#04ff50] text-white px-4 py-2 mt-6 text-sm rounded-lg cursor-pointer disabled:opacity-50'>
          {loading ? <LoaderCircle className='w-5 animate-spin' /> : <Image className='w-5 '/>}
          {loading ? "Generating..." : "Generate Images"}
        </button>

      </form>

      {/* right col */}

      <div className='w-full max-w-lg p-4 bg-white rounded-lg flex flex-col border border-gray-200 min-h-[400px]'>
        <div className='flex item-center gap-3'>
          <Image className='w-5 h-5 text-[#00AD25]' />
          <h1 className='text-xl font-semibold'> Generated Images </h1>

        </div>
        <div className='flex-1 flex justify-center items-center p-4'>
           {loading && (
              <div className='flex flex-col items-center gap-3 text-gray-500'>
                 <LoaderCircle className='w-10 h-10 animate-spin text-[#00AD25]' />
                 <p>Generating your image...</p>
              </div>
           )}
           {!loading && resultData && (
              <img
                src={resultData}
                alt="AI Generated"
                className="w-full h-auto rounded-lg shadow-md"
                onError={() => {
                  setResultData(null);
                  setImageError('The generated image source could not be displayed.');
                }}
              />
           )}
           {!loading && !resultData && imageError && (
              <div className='text-sm flex flex-col items-center gap-3 text-red-500 text-center'>
                <Image className='w-9 h-9 ' />
                <p>{imageError}</p>
              </div>
           )}
           {!loading && !resultData && (
              !imageError &&
              <div className='text-sm flex flex-col items-center gap-5 text-gray-400'>
                <Image className='w-9 h-9 ' />
                <p>Enter a description and click Generate Image to get started</p>
              </div>
           )}
        </div>

      </div>
       
    </div>
  )
}

export default GenerateImages;
