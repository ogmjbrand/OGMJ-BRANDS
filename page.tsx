'use client'
import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function Home() {
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      window.location.href = data.user ? '/dashboard' : '/auth'
    })
  }, [])
  return (
    <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center">
      <div className="animate-spin w-8 h-8 border-2 border-yellow-500 border-t-transparent rounded-full" />
    </div>
  )
}
