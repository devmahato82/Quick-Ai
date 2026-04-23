import React, { useState } from 'react'
import { Sparkles, LoaderCircle, FileText, Eraser } from 'lucide-react'
import axios from 'axios';
import { useAuth } from '@clerk/clerk-react';
import ReactMarkdown from 'react-markdown';


const ReviewResume = () => {

    const { getToken } = useAuth();
    const [input, setInput] = useState(null)
    const [loading, setLoading] = useState(false);
    const [resultData, setResultData] = useState(null);

    const onSubmitHandler = async(e) => {
      e.preventDefault();
      if (!input) return;

      try {
        setLoading(true);
        setResultData(null);
        const token = await getToken();

        const formData = new FormData();
        formData.append('pdf', input);

        const { data } = await axios.post('http://localhost:3000/api/ai/review-resume', formData, {
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
          <Sparkles className='w-6 text-[#00DA83]'/>
          <h1 className='text-xl font-semibold'>Review Resume</h1>
        </div>

        <p className='mt-6 text-sm font-medium'>Upload Resume</p>

        <input onChange={(e) => setInput(e.target.files[0])} type="file" accept='application/pdf' className='w-full p-2 px-3 mt-2 outline-none text-sm rounded-sm border border-gray-300 text-gray-600' required />

        <p className='text-sm text-gray-500 font-light mt-1 '>Supports PDF resume only. </p>
      
        <button disabled={loading} className='w-full flex justify-center items-center gap-2 bg-linear-to-r from-[#00AD83] to-[#009BB3] text-white px-4 py-2 mt-6 text-sm rounded-lg cursor-pointer disabled:opacity-50'>
          {loading ? <LoaderCircle className='w-5 animate-spin' /> : <FileText className='w-5 '/>}
          {loading ? "Analyzing..." : "Review Resume"}
        </button>

      </form>

      {/* right col */}

      <div className='w-full max-w-lg p-4 bg-white rounded-lg flex flex-col border border-gray-200 min-h-[400px]'>

        <div className='flex item-center gap-3'>
          <FileText className='w-5 h-5 text-[#00AD83]' />
          <h1 className='text-xl font-semibold'>Analysis Results</h1>
        </div>

        <div className='flex-1 flex justify-center items-center p-4'>
           {loading && (
              <div className='flex flex-col items-center gap-3 text-gray-500'>
                 <LoaderCircle className='w-10 h-10 animate-spin text-[#00AD83]' />
                 <p>Analyzing resume via AI...</p>
              </div>
           )}
           {!loading && resultData && (
              <div className="prose prose-sm w-full p-4 overflow-y-auto max-h-[500px]">
                  <ReactMarkdown>{resultData}</ReactMarkdown>
              </div>
           )}
           {!loading && !resultData && (
              <div className='text-sm flex flex-col items-center gap-5 text-gray-400'>
                <Eraser className='w-9 h-9' />
                <p>Upload a pdf and click Review resume to get started</p>
              </div>
           )}
        </div>

      </div>
       
    </div>
  )
}

export default ReviewResume;