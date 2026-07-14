import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import Logo from '@/components/common/Logo'
import { api } from '@/api/client'

// supabase-js exchanges the OAuth redirect (code/hash in the URL) for a
// session automatically on load; this page just waits for it to land.
export default function AuthCallback() {
  const { session, loading } = useAuth()
  const navigate = useNavigate()
  const [timedOut, setTimedOut] = useState(false)

  useEffect(() => {
    if (!loading && session) {
      api.profile.getOnboardingStatus()
        .then(({ onboarding_completed }) => {
          navigate(onboarding_completed ? '/dashboard' : '/onboarding', { replace: true })
        })
        .catch(() => navigate('/onboarding', { replace: true }))
    }
  }, [session, loading, navigate])

  useEffect(() => {
    const timer = setTimeout(() => setTimedOut(true), 8000)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="app-bg flex flex-col items-center justify-center px-6">
      <div className="flex flex-col items-center gap-6">
        <Logo className="w-12 h-12 opacity-90" />
        {timedOut ? (
          <div className="text-center">
            <p className="text-sm text-white/50 font-light mb-2">
              We couldn't complete the sign-in.
            </p>
            <Link to="/login" className="text-primary/70 hover:text-primary transition-colors text-sm underline-offset-2 hover:underline">
              Back to sign in
            </Link>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-white/40 text-sm font-light">
            <Loader2 className="w-4 h-4 animate-spin" />
            Signing you in...
          </div>
        )}
      </div>
    </div>
  )
}
