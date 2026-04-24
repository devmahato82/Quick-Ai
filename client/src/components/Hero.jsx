import React from 'react'
import { useNavigate } from 'react-router-dom'
import { assets } from '../assets/assets'

const Hero = () => {
  const navigate = useNavigate()

  return (
    <div className='relative flex min-h-dvh w-full flex-col justify-center bg-[url(/gradientBackground.png)] bg-cover bg-no-repeat px-4 pb-16 pt-28 sm:px-6 lg:px-20 xl:px-32'>
      <div className='mb-6 text-center'>
        <h1 className='mx-auto text-3xl leading-[1.2] font-semibold sm:text-5xl md:text-6xl 2xl:text-7xl'>
          Create amazing content <br /> with <span className='text-primary'>AI tools</span>
        </h1>
        <p className='mx-auto mt-4 max-w-xs text-sm text-gray-600 sm:max-w-lg sm:text-base'>
          Transform your content creation with our suite of premium AI tools. Write arcticles, generate images, and enhance your workflow.
        </p>
      </div>

      <div className='flex flex-col justify-center gap-4 text-sm sm:flex-row'>
        <button onClick={() => navigate('/ai')} className='w-full rounded-lg bg-primary px-6 py-3 text-white transition active:scale-95 sm:w-auto sm:px-10'>
          Start creating now
        </button>
        <button className='w-full rounded-lg border border-gray-300 bg-white px-6 py-3 transition active:scale-95 sm:w-auto sm:px-10'>
          Watch demo
        </button>
      </div>

      <div className='mx-auto mt-8 flex flex-wrap items-center justify-center gap-3 text-center text-sm text-gray-600 sm:text-base'>
        <img src={assets.user_group} alt="" className='h-8' />
        Trusted by 10k+ people
      </div>
    </div>
  )
}

export default Hero
