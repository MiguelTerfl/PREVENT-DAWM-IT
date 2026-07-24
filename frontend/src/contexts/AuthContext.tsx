import React, { createContext, useContext, useEffect, useState } from 'react'
import { Session, User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { api } from '@/api/client'

interface AuthContextValue {
  session: Session | null
  user: User | null
  loading: boolean
  role: string | null
  displayName: string | null
  preventId: string | null
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>
  signInWithGoogle: () => Promise<{ error: Error | null }>
  resetPassword: (email: string) => Promise<{ error: Error | null }>
  updatePassword: (password: string) => Promise<{ error: Error | null }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [role, setRole] = useState<string | null>(null)
  const [displayName, setDisplayName] = useState<string | null>(null)
  const [preventId, setPreventId] = useState<string | null>(null)

  useEffect(() => {
    let active = true;

    const fetchProfile = async (sessionToken: string | undefined) => {
      if (!sessionToken) {
        setRole(null)
        setDisplayName(null)
        setPreventId(null)
        setLoading(false)
        return
      }
      try {
        const profile = await api.profile.getMe()
        if (active) {
          setRole(profile.role)
          setDisplayName(profile.display_name)
          setPreventId(profile.prevent_id)
        }
      } catch (err) {
        console.error("AuthContext: Failed to fetch user profile details:", err)
        if (active) {
          setRole("patient") // Safe fallback
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    supabase.auth.getSession().then(({ data }) => {
      if (active) {
        setSession(data.session)
        if (data.session) {
          fetchProfile(data.session.access_token)
        } else {
          setLoading(false)
        }
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (active) {
        setSession(session)
        if (session) {
          fetchProfile(session.access_token)
        } else {
          setRole(null)
          setDisplayName(null)
          setPreventId(null)
          setLoading(false)
        }
      }
    })

    return () => {
      active = false;
      subscription.unsubscribe()
    }
  }, [])

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error }
  }

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({ email, password })
    return { error }
  }

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
    return { error }
  }

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    return { error }
  }

  const updatePassword = async (password: string) => {
    const { error } = await supabase.auth.updateUser({ password })
    return { error }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider value={{ session, user: session?.user ?? null, loading, role, displayName, preventId, signIn, signUp, signInWithGoogle, resetPassword, updatePassword, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}

