import React from 'react'
import Header from '../components/common/Header'
import Profile from '../components/settings/Profile'
import GoogleDriveConnect from '../components/settings/GoogleDriveConnect'

function Settings() {
  return (
    <div className='flex-1 overflow-auto relative z-10'>
      <Header title='Settings'/>
      <main className='max-w-4xl mx-auto py-6 px-4 lg:px-8'>
        <Profile />
        <GoogleDriveConnect />
      </main>
    </div>
  )
}

export default Settings;
