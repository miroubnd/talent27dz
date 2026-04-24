import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext({})

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true
    const loadingFallback = setTimeout(() => {
      if (isMounted) setLoading(false)
    }, 4000)

    // Check active sessions and sets the user
    const getSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        if (error) {
          console.error('Session error:', error)
          return
        }
        if (!isMounted) return
        setUser(session?.user ?? null)
        if (session?.user) {
          await fetchProfile(session.user.id)
        }
      } catch (err) {
        console.error('Unexpected error fetching session:', err)
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    getSession()

    // Listen for changes on auth state (sign in, sign out, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) return

      setUser(session?.user ?? null)
      if (session?.user) {
        void fetchProfile(session.user.id)
      } else {
        setProfile(null)
      }
      setLoading(false)
    })

    return () => {
      isMounted = false
      clearTimeout(loadingFallback)
      subscription.unsubscribe()
    }
  }, [])

  const fetchProfile = async (userId) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (!error) {
      setProfile(data)
    }
  }

  const refreshProfile = async () => {
    if (!user?.id) return
    await fetchProfile(user.id)
  }

  const refreshUser = async () => {
    const { data, error } = await supabase.auth.getUser()
    if (!error) {
      setUser(data?.user ?? null)
    }
  }

  const signOut = () => supabase.auth.signOut()

  return (
    <AuthContext.Provider value={{ user, profile, loading, signOut, refreshProfile, refreshUser }}>
      {!loading && children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
