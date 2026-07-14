import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Lock, Loader2 } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import Logo from '@/components/common/Logo'

export default function ResetPassword() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const [loading, setLoading] = useState(false)
  const { updatePassword } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)
    const { error } = await updatePassword(password)

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      setDone(true)
      setTimeout(() => navigate('/dashboard'), 1500)
    }
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
            <h1 className="text-2xl font-extralight tracking-tight text-white">Set a new password.</h1>
          </div>
        </div>

        {done ? (
          <p className="text-sm text-primary/80 text-center font-light">
            Password updated. Redirecting...
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <input
                type="password"
                placeholder="New password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full pl-11 pr-5 py-4 bg-white/[0.04] border border-white/10 rounded-2xl text-sm font-light text-white placeholder:text-white/25 focus:outline-none focus:border-primary/40 focus:bg-white/[0.07] transition-all"
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <input
                type="password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                className="w-full pl-11 pr-5 py-4 bg-white/[0.04] border border-white/10 rounded-2xl text-sm font-light text-white placeholder:text-white/25 focus:outline-none focus:border-primary/40 focus:bg-white/[0.07] transition-all"
              />
            </div>

            {error && (
              <p className="text-xs text-red-400/80 text-center font-light">{error}</p>
            )}

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="dawn-button mt-2 flex items-center justify-center gap-2 disabled:opacity-40"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              UPDATE PASSWORD
            </motion.button>
          </form>
        )}
      </motion.div>
    </div>
  )
}
