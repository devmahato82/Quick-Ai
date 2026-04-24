import React from 'react'
import { assets } from '../assets/assets'
import { useNavigate } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { useClerk, UserButton, useUser } from '@clerk/clerk-react'

const Navbar = () => {
  const navigate = useNavigate()
  const { user } = useUser()
  const { openSignIn } = useClerk()

  return (
    <div className='fixed top-0 z-50 flex w-full items-center justify-between gap-3 px-4 py-3 backdrop-blur-2xl sm:px-6 lg:px-20 xl:px-32'>
      <img src={assets.logo} alt="logo" className='w-32 cursor-pointer sm:w-44' onClick={() => navigate('/')} />

      {user ? (
        <UserButton />
      ) : (
        <button onClick={openSignIn} className='flex shrink-0 items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm text-white sm:px-8'>
          Get Started
          <ArrowRight className='h-4 w-4' />
        </button>
      )}
    </div>
  )
}

export default Navbar
