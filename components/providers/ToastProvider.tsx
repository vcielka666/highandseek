'use client'

import { Toaster } from 'sonner'

export default function ToastProvider() {
  return (
    <Toaster
      position="top-center"
      toastOptions={{
        style: {
          background: 'rgba(5,5,8,0.95)',
          border: '0.5px solid rgba(0,212,200,0.25)',
          color: '#e8f0ef',
          fontFamily: 'var(--font-dm-mono)',
          fontSize: '12px',
          letterSpacing: '0.5px',
          backdropFilter: 'blur(8px)',
        },
      }}
      icons={{
        success: '✦',
        error: '✖',
        loading: '◌',
      }}
    />
  )
}
