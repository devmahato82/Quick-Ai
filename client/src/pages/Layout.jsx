import React, { useState } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { assets } from '../assets/assets'
import { Menu, X } from 'lucide-react'
import Sidebar from '../components/Sidebar'
import { SignIn, useUser } from '@clerk/clerk-react'

const Layout = () => {
  const navigate = useNavigate()
  const [sidebar, setSidebar] = useState(false)
  const { user } = useUser()

  return user ? (
    <div className='flex min-h-dvh flex-col'>
      <nav className='flex min-h-14 w-full shrink-0 items-center justify-between border-b border-gray-200 bg-white px-4 sm:px-6 lg:px-8'>
        <img className='w-32 cursor-pointer sm:w-44' src={assets.logo} alt="logo" onClick={() => navigate('/')} />
        {sidebar ? (
          <X onClick={() => setSidebar(false)} className='h-6 w-6 text-gray-600 sm:hidden' />
        ) : (
          <Menu onClick={() => setSidebar(true)} className='h-6 w-6 text-gray-600 sm:hidden' />
        )}
      </nav>

      <div className='relative flex min-h-0 flex-1 w-full overflow-hidden'>
        {sidebar && (
          <button
            type="button"
            aria-label='Close sidebar'
            className='absolute inset-0 z-20 bg-slate-900/30 sm:hidden'
            onClick={() => setSidebar(false)}
          />
        )}

        <Sidebar sidebar={sidebar} setSidebar={setSidebar} />

        <div className='flex-1 overflow-y-auto bg-[#F4F7FB]'>
          <Outlet />
        </div>
      </div>
    </div>
  ) : (
    <div className='flex min-h-dvh items-center justify-center p-4'>
      <SignIn />
    </div>
  )
}

export default Layout
