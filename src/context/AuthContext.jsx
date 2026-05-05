import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext({})

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    const fetchProfileData = async (userId) => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()
      
      if (!error && isMounted) {
        setProfile(data)
      }
      return data
    }

    const initializeAuth = async () => {
      // 1. Get initial session
      const { data: { session } } = await supabase.auth.getSession()
      
      if (isMounted) {
        const currentUser = session?.user ?? null
        setUser(currentUser)
        
        if (currentUser) {
          await fetchProfileData(currentUser.id)
        }
        
        setLoading(false)
      }

      // 2. Listen for auth changes
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          if (!isMounted) return

          const currentUser = session?.user ?? null
          setUser(currentUser)

          if (currentUser) {
            await fetchProfileData(currentUser.id)
          } else {
            setProfile(null)
          }

          setLoading(false)
        }
      )

      return subscription
    }

    const authInitPromise = initializeAuth()

    return () => {
      isMounted = false
      authInitPromise.then(subscription => subscription?.unsubscribe())
    }
  }, [])

  // Exposed helper so other components can refresh the profile manually
  const fetchProfile = async (userId) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    if (!error) setProfile(data)
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
