import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Mail, Lock, Loader2 } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import Logo from '@/components/common/Logo'
import GoogleButton from '@/components/common/GoogleButton'
import { api } from '@/api/client'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const { signIn, signInWithGoogle } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error } = await signIn(email, password)

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    try {
      const { onboarding_completed } = await api.profile.getOnboardingStatus()
      navigate(onboarding_completed ? '/dashboard' : '/onboarding')
    } catch {
      navigate('/onboarding')
    }
  }

  const handleGoogle = async () => {
    setError('')
    setGoogleLoading(true)
    const { error } = await signInWithGoogle()
    if (error) {
      setError(error.message)
      setGoogleLoading(false)
    }
    // On success the browser redirects to Google, so no further action here.
  }

  return (
    <div className="app-bg flex flex-col items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-sm"
      >
        <div className="flex flex-col items-center gap-4 mb-10">
          <Logo className="w-12 h-12 opacity-90" />
          <div className="text-center">
            <p className="text-[0.65rem] font-normal tracking-[1.2em] text-primary uppercase mb-1">D A W N</p>
            <h1 className="text-2xl font-extralight tracking-tight text-white">Welcome back.</h1>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="w-full pl-11 pr-5 py-4 bg-white/[0.04] border border-white/10 rounded-2xl text-sm font-light text-white placeholder:text-white/25 focus:outline-none focus:border-primary/40 focus:bg-white/[0.07] transition-all"
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              className="w-full pl-11 pr-5 py-4 bg-white/[0.04] border border-white/10 rounded-2xl text-sm font-light text-white placeholder:text-white/25 focus:outline-none focus:border-primary/40 focus:bg-white/[0.07] transition-all"
            />
          </div>

          <div className="flex justify-end -mt-1">
            <Link
              to="/forgot-password"
              className="text-xs text-white/30 hover:text-primary/80 transition-colors font-light"
            >
              Forgot password?
            </Link>
          </div>

          {error && (
            <p className="text-xs text-red-400/80 text-center font-light">{error}</p>
          )}

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading || googleLoading}
            className="dawn-button mt-2 flex items-center justify-center gap-2 disabled:opacity-40"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            SIGN IN
          </motion.button>
        </form>

        <div className="flex items-center gap-3 my-6">
          <div className="h-px flex-1 bg-white/10" />
          <span className="text-[0.65rem] uppercase tracking-widest text-white/25 font-light">or</span>
          <div className="h-px flex-1 bg-white/10" />
        </div>

        <GoogleButton onClick={handleGoogle} disabled={loading || googleLoading} />

        <p className="text-center text-xs text-white/30 mt-8 font-light">
          Don't have an account?{' '}
          <Link
            to="/signup"
            className="text-primary/70 hover:text-primary transition-colors underline-offset-2 hover:underline"
          >
            Sign up
          </Link>
        </p>
      </motion.div>
    </div>
  )
}
