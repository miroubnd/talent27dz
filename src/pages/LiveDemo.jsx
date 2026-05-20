import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Card } from '../components/ui'
import { Building2, UserRound, ShieldAlert, ArrowRight, GraduationCap, Loader2, Home } from 'lucide-react'

const LiveDemo = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(null) // 'employer', 'candidate', 'admin', or null
  const [error, setError] = useState('')

  const handleAcademicLogin = async (role) => {
    let email = "";
    let password = ""; // Use my unified password

    if (role === 'employer') {
      email = "t_ismail@estin.dz";
      password = "1234567890";
    } else if (role === 'candidate') {
      email = "tayebabderahim27@gmail.com";
      password = "1234567890";
    } else if (role === 'admin') {
      email = "ita27rmp100@gmail.com";
      password = "1234567890";
    }

    setLoading(role)
    setError('')

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (!error) {
      // Determine target dashboard based on role to bypass the general '/dashboard' -> '/' redirect loop
      const roleMap = {
        candidate: '/dashboard/candidate',
        employer: '/dashboard/employer',
        admin: '/dashboard/admin/pending-jobs',
      }
      const dashboardPath = roleMap[role] || '/dashboard'
      navigate(dashboardPath)
    } else {
      console.error("Evaluation login failed:", error.message)
      setError(error.message)
      setLoading(null)
    }
  };

  const roles = [
    {
      id: 'employer',
      title: 'Access as Employer',
      description: 'Review job applications, post new job listings, and manage company profile.',
      email: 't_ismail@estin.dz',
      icon: Building2,
      color: 'from-blue-600/10 to-indigo-600/10 hover:border-blue-500/40',
      iconBg: 'bg-blue-100 text-blue-600',
    },
    {
      id: 'candidate',
      title: 'Access as Candidate',
      description: 'Search and apply for jobs, update profile cv, and track application status.',
      email: 'tayebabderahim27@gmail.com',
      icon: UserRound,
      color: 'from-emerald-600/10 to-teal-600/10 hover:border-emerald-500/40',
      iconBg: 'bg-emerald-100 text-emerald-600',
    },
    {
      id: 'admin',
      title: 'Access as Super Admin',
      description: 'Moderate pending job listings, approve employers, and oversee platform metrics.',
      email: 'ita27rmp100@gmail.com',
      icon: ShieldAlert,
      color: 'from-amber-600/10 to-orange-600/10 hover:border-amber-500/40',
      iconBg: 'bg-amber-100 text-amber-600',
    }
  ]

  return (
    <div className="min-h-screen bg-surface-dark flex flex-col justify-between selection:bg-accent/30 relative overflow-hidden">
      {/* Background ambient light */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[400px] bg-accent/5 blur-[130px] rounded-full -z-10"></div>
      
      {/* Top Header/Navbar placeholder */}
      <div className="py-6 px-8 max-w-7xl mx-auto w-full flex justify-between items-center z-10">
        <Link to="/" className="text-2xl font-bold text-primary flex items-center">
          Talent<span className="text-accent underline decoration-2 underline-offset-8">DZ</span>
        </Link>
        <Link 
          to="/" 
          className="flex items-center gap-2 text-sm font-semibold text-secondary hover:text-primary transition-colors py-2 px-4 rounded-lg hover:bg-white/50 border border-transparent hover:border-border"
        >
          <Home className="w-4 h-4" />
          Back to Home
        </Link>
      </div>

      {/* Main Content */}
      <div className="flex-grow flex items-center justify-center p-4 md:p-8 z-10">
        <Card className="w-full max-w-2xl p-8 md:p-10 border border-accent/20 shadow-xl relative overflow-hidden bg-white/80 backdrop-blur-md">
          {/* Decorative Corner Badge */}
          <div className="absolute -top-1 -right-1 w-28 h-28 bg-accent/10 rounded-full blur-2xl -z-10"></div>
          
          <div className="text-center mb-8 relative">
            <div className="mx-auto w-14 h-14 bg-accent/10 rounded-2xl flex items-center justify-center mb-4 border border-accent/30 text-accent animate-pulse">
              <GraduationCap size={28} />
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-primary tracking-tight leading-tight">
              TalentDZ Academic Evaluation Sandbox
            </h1>
            <p className="text-secondary mt-3 text-sm md:text-base max-w-lg mx-auto leading-relaxed">
              This sandbox is strictly dedicated to the SI module teachers at{' '}
              <span className="font-semibold text-primary">ESTIN Béjaïa</span> for fast evaluation. Click on a role card below to sign in automatically and bypass manual credentials.
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-error/10 border border-error/20 text-error text-sm rounded-lg flex items-center gap-2 animate-in fade-in duration-200">
              <span className="w-1.5 h-1.5 rounded-full bg-error animate-ping"></span>
              {error}
            </div>
          )}

          {/* Action buttons (represented as styled cards) */}
          <div className="space-y-4">
            {roles.map((role) => {
              const Icon = role.icon
              const isRoleLoading = loading === role.id
              const isDisabled = loading !== null && !isRoleLoading

              return (
                <button
                  key={role.id}
                  onClick={() => handleAcademicLogin(role.id)}
                  disabled={isDisabled}
                  className={`w-full text-left p-5 rounded-xl border border-border bg-gradient-to-r ${role.color} transition-all duration-300 flex items-center justify-between group shadow-sm hover:shadow-md hover:-translate-y-0.5 disabled:opacity-50 disabled:pointer-events-none disabled:transform-none`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-lg ${role.iconBg} transition-transform group-hover:scale-110 duration-300`}>
                      {isRoleLoading ? (
                        <Loader2 className="w-6 h-6 animate-spin" />
                      ) : (
                        <Icon className="w-6 h-6" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold text-primary text-base md:text-lg flex items-center gap-2">
                        {role.title}
                      </h3>
                      <p className="text-xs text-secondary mt-0.5 line-clamp-1 md:line-clamp-none">
                        {role.description}
                      </p>
                    </div>
                  </div>
                  <div className="text-secondary group-hover:text-primary transition-colors ml-4 shrink-0">
                    <ArrowRight className="w-5 h-5 transform group-hover:translate-x-1 transition-transform" />
                  </div>
                </button>
              )
            })}
          </div>
        </Card>
      </div>

      {/* Footer */}
      <div className="py-6 text-center text-xs text-secondary border-t border-border bg-white/40">
        <p>© 2026 TalentDZ. Built for ESTIN Béjaïa Academic Evaluation.</p>
      </div>
    </div>
  )
}

export default LiveDemo
