import React from 'react'
import { assets } from '../assets/assets'

const Footer = () => {
  return (
    <footer className="mt-20 w-full px-6 pt-8 text-gray-500 md:px-16 lg:px-24 xl:px-32">
      <div className="flex w-full flex-col justify-between gap-10 border-b border-gray-500/30 pb-6 md:flex-row">
        <div className="md:max-w-96">
          <img src={assets.logo} alt="logo" className='w-32 sm:w-44' />
          <p className="mt-6 text-sm">
            Experience the power of AI with QuickAi. <br /> Transform your content creation with our suite of premium AI tools. Write articles, generate images, and enhance your workflow.
          </p>
        </div>

        <div className="flex flex-1 flex-col items-start gap-10 sm:flex-row md:justify-end lg:gap-20">
          <div>
            <h2 className="mb-5 font-semibold text-gray-800">Company</h2>
            <ul className="space-y-2 text-sm">
              <li><a href="#">Home</a></li>
              <li><a href="#">About us</a></li>
              <li><a href="#">Contact us</a></li>
              <li><a href="#">Privacy policy</a></li>
            </ul>
          </div>

          <div>
            <h2 className="mb-5 font-semibold text-gray-800">Subscribe to our newsletter</h2>
            <div className="space-y-2 text-sm">
              <p>The latest news, articles, and resources, sent to your inbox weekly.</p>
              <div className="flex flex-col gap-2 pt-4 sm:flex-row sm:items-center">
                <input className="h-9 w-full rounded border border-gray-500/30 px-2 outline-none placeholder-gray-500 ring-indigo-600 focus:ring-2 sm:max-w-64" type="email" placeholder="Enter your email" />
                <button className="h-9 w-full rounded bg-primary text-white sm:w-24">Subscribe</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <p className="pb-5 pt-4 text-center text-xs md:text-sm">
        Copyright 2025 © QuickAi. All Right Reserved.
      </p>
    </footer>
  )
}

export default Footer
