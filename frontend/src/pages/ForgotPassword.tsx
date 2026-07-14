import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Mail, Loader2, ArrowLeft } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import Logo from '@/components/common/Logo'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const { resetPassword } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error } = await resetPassword(email)

    if (error) {
      setError(error.message)
    } else {
      setSent(true)
    }
    setLoading(false)
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
            <h1 className="text-2xl font-extralight tracking-tight text-white">Reset your password.</h1>
            <p className="text-xs text-white/40 font-light mt-2">
              We'll send a recovery link to your email.
            </p>
          </div>
        </div>

        {sent ? (
          <p className="text-sm text-primary/80 text-center font-light">
            Check your inbox for a link to reset your password.
          </p>
        ) : (
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
              SEND RESET LINK
            </motion.button>
          </form>
        )}

        <p className="text-center text-xs text-white/30 mt-8 font-light">
          <Link
            to="/login"
            className="inline-flex items-center gap-1 text-primary/70 hover:text-primary transition-colors underline-offset-2 hover:underline"
          >
            <ArrowLeft className="w-3 h-3" />
            Back to sign in
          </Link>
        </p>
      </motion.div>
    </div>
  )
}
