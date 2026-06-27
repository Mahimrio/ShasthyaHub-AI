'use client'

import { WifiOff } from 'lucide-react'

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 p-6">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
          <WifiOff className="h-8 w-8 text-gray-400" />
        </div>
        <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">
          You are offline
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          Please check your internet connection and try again.
          Previous analyses are saved and will be available when you reconnect.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-2.5 bg-sky-600 text-white rounded-xl text-sm font-medium hover:bg-sky-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    </div>
  )
}
