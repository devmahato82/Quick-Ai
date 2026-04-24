import { Protect, useClerk, useUser } from '@clerk/clerk-react'
import { Eraser, FileText, Hash, House, Image, LogOut, Scissors, SquarePen, Users } from 'lucide-react'
import React from 'react'
import { NavLink } from 'react-router-dom'

const navItems = [
  { to: '/ai', label: 'Dashboard', Icon: House },
  { to: '/ai/write-article', label: 'Write Article', Icon: SquarePen },
  { to: '/ai/blog-titles', label: 'Blog Titles', Icon: Hash },
  { to: '/ai/generate-images', label: 'Generate Images', Icon: Image },
  { to: '/ai/remove-background', label: 'Remove Background', Icon: Eraser },
  { to: '/ai/remove-object', label: 'Remove Object', Icon: Scissors },
  { to: '/ai/review-resume', label: 'Review Resume', Icon: FileText },
  { to: '/ai/community', label: 'Community', Icon: Users },
]

const Sidebar = ({ sidebar, setSidebar }) => {
  const { user } = useUser()
  const { signOut, openUserProfile } = useClerk()

  return (
    <aside className={`absolute inset-y-0 left-0 z-30 flex w-72 max-w-[82vw] flex-col justify-between border-r border-gray-200 bg-white transition-all duration-300 ease-in-out ${sidebar ? 'translate-x-0' : '-translate-x-full'} sm:static sm:w-60 sm:max-w-none sm:translate-x-0`}>
      <div className='my-7 w-full'>
        <img src={user.imageUrl} alt="User avatar" className='mx-auto h-14 w-14 rounded-full object-cover' />
        <h1 className='mt-1 break-words px-4 text-center font-medium'>{user.fullName}</h1>

        <div className='mt-5 px-4 text-sm font-medium text-gray-600 sm:px-6'>
          {navItems.map(({ to, label, Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/ai'}
              onClick={() => setSidebar(false)}
              className={({ isActive }) => `mb-1 flex items-center gap-3 rounded px-3.5 py-2.5 ${isActive ? 'bg-linear-to-r from-[#3C81F6] to-[#9234EA] text-white' : 'hover:bg-slate-50'}`}
            >
              {({ isActive }) => (
                <>
                  <Icon className={`h-4 w-4 ${isActive ? 'text-white' : ''}`} />
                  {label}
                </>
              )}
            </NavLink>
          ))}
        </div>
      </div>

      <div className='flex w-full items-center justify-between border-t border-gray-200 p-4 sm:px-7'>
        <div onClick={openUserProfile} className='flex min-w-0 cursor-pointer items-center gap-2'>
          <img src={user.imageUrl} className='h-8 w-8 rounded-full object-cover' alt="" />
          <div className='min-w-0'>
            <h1 className='truncate text-sm font-medium'>{user.fullName}</h1>
            <p className='text-xs text-gray-500'>
              <Protect plan='premium' fallback="Free">Premium</Protect>
              Plan
            </p>
          </div>
        </div>
        <LogOut onClick={signOut} className='cursor-pointer text-gray-400 transition hover:text-gray-700' />
      </div>
    </aside>
  )
}

export default Sidebar
