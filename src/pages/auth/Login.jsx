import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { Button, Input, Card } from '../../components/ui'

const Login = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { data: authData, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      let dashboardPath = '/'
      
      // Fetch profile to get role for routing
      if (authData?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', authData.user.id)
          .single()
          
        if (profile) {
          const roleMap = {
            candidate: '/dashboard/candidate',
            employer: '/dashboard/employer',
            admin: '/dashboard/admin'
          }
          dashboardPath = roleMap[profile.role] || '/'
        }
      }

      const from = location.state?.from?.pathname
      navigate(from && from !== '/' ? from : dashboardPath, { replace: true })
    }
  }

  return (
    <div className="min-h-screen bg-surface-dark flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8">
        <div className="text-center mb-8">
          <Link to="/" className="text-3xl font-bold text-primary">
            Talent<span className="text-accent underline decoration-2 underline-offset-8">DZ</span>
          </Link>
          <h1 className="mt-8 text-2xl font-bold text-primary">Welcome Back</h1>
          <p className="text-secondary mt-2">Sign in to your account</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-error/10 border border-error/20 text-error text-sm rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <Input 
            label="Email Address"
            type="email"
            placeholder="name@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input 
            label="Password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <Button 
            type="submit" 
            className="w-full" 
            loading={loading}
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>

        <p className="mt-8 text-center text-sm text-secondary">
          Don't have an account?{' '}
          <Link to="/register" className="text-accent font-bold hover:underline">
            Register for free
          </Link>
        </p>
      </Card>
    </div>
  )
}

export default Login
