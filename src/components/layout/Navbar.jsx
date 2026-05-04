import { useEffect, useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useNotifications } from '../../hooks/useNotifications'
import { supabase } from '../../lib/supabase'
import { Bell, LogOut, User, PlusCircle, LayoutDashboard, Menu, X, ClipboardList } from 'lucide-react'
import { Button } from '../ui'

const Navbar = () => {
  const { user, profile, signOut } = useAuth()
  const { notifications, unreadCount, markAllAsRead } = useNotifications()
  const [showNotifications, setShowNotifications] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [profileImageUrl, setProfileImageUrl] = useState('')
  const navigate = useNavigate()
  const location = useLocation()

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error('Sign out failed:', error)
    } finally {
      setShowMobileMenu(false)
      navigate('/login', { replace: true })
    }
  }

  const isActive = (path) => location.pathname === path

  const navLinks = {
    candidate: [
      { name: 'Dashboard', path: '/dashboard/candidate', icon: LayoutDashboard },
    ],
    employer: [
      { name: 'Dashboard', path: '/dashboard/employer', icon: LayoutDashboard },
      { name: 'Post a Job', path: '/post-job', icon: PlusCircle },
    ],
    admin: [
      { name: 'Pending jobs', path: '/dashboard/admin/pending-jobs', icon: ClipboardList },
      { name: 'Admin panel', path: '/dashboard/admin', icon: LayoutDashboard },
    ]
  }

  const links = profile?.role ? navLinks[profile.role] || [] : []

  useEffect(() => {
    const resolveAvatar = async () => {
      const rawValue = profile?.avatar_url || profile?.logo_url || ''
      if (!rawValue) {
        setProfileImageUrl('')
        return
      }
      if (rawValue.startsWith('http')) {
        setProfileImageUrl(rawValue)
        return
      }

      const bucket = profile?.role === 'candidate' ? 'avatars' : 'logos'
      const { data: signed, error } = await supabase.storage
        .from(bucket)
        .createSignedUrl(rawValue, 3600)

      if (!error && signed?.signedUrl) {
        setProfileImageUrl(signed.signedUrl)
        return
      }

      const { data } = supabase.storage.from(bucket).getPublicUrl(rawValue)
      setProfileImageUrl(data?.publicUrl || '')
    }

    resolveAvatar()
  }, [profile?.avatar_url, profile?.logo_url, profile?.role])

  return (
    <nav className="bg-white border-b border-border sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="text-2xl font-bold text-primary flex items-center">
              Talent<span className="text-accent underline decoration-2 underline-offset-8">DZ</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {links.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`flex items-center text-sm font-medium transition-colors ${
                  isActive(link.path) 
                  ? 'text-primary border-b-2 border-accent h-full mt-2 pt-2' 
                  : 'text-secondary hover:text-primary'
                }`}
              >
                <link.icon className="w-4 h-4 mr-1.5" />
                {link.name}
              </Link>
            ))}

            {user ? (
              <div className="flex items-center space-x-4 ml-4 border-l pl-8 border-border">
                {/* Notifications */}
                <div className="relative">
                  <button 
                    onClick={() => {
                      setShowNotifications(!showNotifications);
                      if (!showNotifications) markAllAsRead();
                    }}
                    className="p-2 text-secondary hover:text-primary relative hover:bg-surface-dark rounded-full transition-colors"
                  >
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1 right-1 bg-accent text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full font-bold">
                        {unreadCount}
                      </span>
                    )}
                  </button>

                  {showNotifications && (
                    <div className="absolute right-0 mt-3 w-80 bg-white shadow-xl rounded-xl border border-border overflow-hidden ring-1 ring-black/5 animate-in fade-in slide-in-from-top-2">
                      <div className="p-4 border-b border-border bg-surface-dark flex justify-between items-center">
                        <h3 className="font-bold text-primary">Notifications</h3>
                        <button onClick={() => setShowNotifications(false)} className="text-secondary hover:text-primary"><X size={16}/></button>
                      </div>
                      <div className="max-h-96 overflow-y-auto">
                        {notifications.length > 0 ? (
                          notifications.map((n) => (
                            <div 
                              key={n.id} 
                              className={`p-4 border-b border-border hover:bg-surface-dark transition-colors ${!n.is_read ? 'bg-accent/5' : ''}`}
                            >
                              <p className="text-sm text-primary">{n.message}</p>
                              <p className="text-[10px] text-secondary mt-1">
                                {new Date(n.created_at).toLocaleDateString()}
                              </p>
                            </div>
                          ))
                        ) : (
                          <div className="p-8 text-center text-secondary text-sm">No notifications</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Profile */}
                <div className="flex items-center">
                   <div className="mr-3 text-right">
                      <p className="text-xs font-bold text-primary">{profile?.full_name || profile?.company_name}</p>
                      <p className="text-[10px] text-secondary capitalize">{profile?.role}</p>
                   </div>
                   <img 
                    src={profileImageUrl || `https://ui-avatars.com/api/?name=${profile?.full_name || profile?.company_name}&background=1B2A4A&color=fff`}
                    className="w-9 h-9 rounded-full border border-border" 
                    alt="avatar"
                   />
                </div>

                <button 
                  onClick={handleSignOut}
                  className="p-2 text-secondary hover:text-error hover:bg-error/5 rounded-full transition-colors"
                  title="Sign Out"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link to="/login" className="text-sm font-medium text-primary hover:text-accent">Login</Link>
                <Button onClick={() => navigate('/register')}>Join Now</Button>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button 
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="p-2 text-secondary"
            >
              {showMobileMenu ? <X /> : <Menu />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {showMobileMenu && (
        <div className="md:hidden bg-white border-b border-border px-4 py-4 space-y-4 animate-in slide-in-from-top-2">
           {links.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className="flex items-center p-2 text-secondary hover:text-primary hover:bg-surface-dark rounded-lg"
                onClick={() => setShowMobileMenu(false)}
              >
                <link.icon className="w-5 h-5 mr-3" />
                {link.name}
              </Link>
            ))}
            {!user && (
              <div className="flex flex-col space-y-2 pt-4 border-t border-border">
                <Button variant="secondary" onClick={() => { setShowMobileMenu(false); navigate('/login'); }}>Login</Button>
                <Button onClick={() => { setShowMobileMenu(false); navigate('/register'); }}>Register</Button>
              </div>
            )}
            {user && (
              <div className="pt-4 border-t border-border space-y-4">
                <div className="flex items-center p-2 bg-surface-dark rounded-lg border border-border">
                   <img 
                    src={profileImageUrl || `https://ui-avatars.com/api/?name=${profile?.full_name || profile?.company_name || 'User'}&background=1B2A4A&color=fff`}
                    className="w-10 h-10 rounded-full border border-border mr-3" 
                    alt="avatar"
                   />
                   <div className="text-left">
                      <p className="text-sm font-bold text-primary">{profile?.full_name || profile?.company_name || 'Loading profile...'}</p>
                      <p className="text-[10px] text-secondary capitalize">{profile?.role}</p>
                   </div>
                </div>
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-error/10 text-error font-semibold hover:bg-error/20 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </div>
            )}
        </div>
      )}
    </nav>
  )
}

export default Navbar
