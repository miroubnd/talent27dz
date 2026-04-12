import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { Navbar } from '../../components/layout'
import { Card, Badge, Button, Input } from '../../components/ui'
import { Briefcase, Calendar, ExternalLink, User } from 'lucide-react'

const CandidateDashboard = () => {
  const { user, profile } = useAuth()
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchApplications()
  }, [])

  const fetchApplications = async () => {
    const { data } = await supabase
      .from('applications')
      .select('*, jobs(title, profiles(company_name))')
      .eq('candidate_id', user.id)
      .order('created_at', { ascending: false })

    if (data) setApplications(data)
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-surface-dark">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Sidebar Profile Info */}
          <div className="lg:col-span-1">
            <Card className="p-6">
              <div className="text-center mb-6">
                <img 
                  src={profile?.avatar_url || `https://ui-avatars.com/api/?name=${profile?.full_name}`}
                  className="w-24 h-24 rounded-full border-4 border-surface-dark mx-auto mb-4 object-cover"
                  alt="avatar"
                />
                <h2 className="text-xl font-bold text-primary">{profile?.full_name}</h2>
                <p className="text-sm text-secondary">Candidate</p>
              </div>
              
              <div className="space-y-4 border-t border-border pt-6">
                <div className="flex items-center text-sm text-primary">
                  <User size={16} className="mr-2 text-accent" />
                  {user?.email}
                </div>
                {profile?.cv_url && (
                  <a 
                    href={profile.cv_url} 
                    target="_blank" 
                    rel="noreferrer"
                    className="flex items-center text-sm text-accent font-bold hover:underline"
                  >
                    <ExternalLink size={16} className="mr-2" /> View My Resume
                  </a>
                )}
                <Button variant="outline" size="sm" className="w-full mt-4">Edit Profile</Button>
              </div>
            </Card>
          </div>

          {/* Main Content: Applications */}
          <div className="lg:col-span-3">
             <header className="mb-8 flex justify-between items-center">
                <div>
                  <h1 className="text-3xl font-bold text-primary">My Applications</h1>
                  <p className="text-secondary mt-1">Track the status of your job applications.</p>
                </div>
                <div className="bg-white px-4 py-2 rounded-lg border border-border flex items-center shadow-sm">
                   <div className="text-center px-4 border-r border-border">
                      <p className="text-xs text-secondary mb-1">Total</p>
                      <p className="font-bold text-primary">{applications.length}</p>
                   </div>
                   <div className="text-center px-4">
                      <p className="text-xs text-secondary mb-1">Pending</p>
                      <p className="font-bold text-accent">{applications.filter(a => a.status === 'pending').length}</p>
                   </div>
                </div>
             </header>

             {loading ? (
               <div className="space-y-4">
                 {[1,2,3].map(i => <div key={i} className="h-24 bg-white/50 animate-pulse rounded-xl border border-border"></div>)}
               </div>
             ) : applications.length > 0 ? (
               <Card>
                 <div className="overflow-x-auto">
                   <table className="w-full text-left">
                     <thead>
                       <tr className="bg-surface-dark border-b border-border">
                         <th className="px-6 py-4 text-xs font-bold text-primary uppercase">Job Title & Company</th>
                         <th className="px-6 py-4 text-xs font-bold text-primary uppercase">Applied Date</th>
                         <th className="px-6 py-4 text-xs font-bold text-primary uppercase">Status</th>
                         <th className="px-6 py-4 text-xs font-bold text-primary uppercase text-right">Actions</th>
                       </tr>
                     </thead>
                     <tbody className="divide-y divide-border">
                       {applications.map((app) => (
                         <tr key={app.id} className="hover:bg-surface-dark/50 transition-colors">
                           <td className="px-6 py-6">
                              <p className="font-bold text-primary">{app.jobs?.title}</p>
                              <p className="text-xs text-secondary">{app.jobs?.profiles?.company_name}</p>
                           </td>
                           <td className="px-6 py-6">
                              <p className="text-sm text-secondary flex items-center">
                                <Calendar size={14} className="mr-1.5" />
                                {new Date(app.created_at).toLocaleDateString()}
                              </p>
                           </td>
                           <td className="px-6 py-6">
                              <Badge status={app.status}>{app.status}</Badge>
                           </td>
                           <td className="px-6 py-6 text-right">
                              <Button variant="ghost" size="sm" onClick={() => navigate(`/jobs/${app.job_id}`)}>
                                View Job
                              </Button>
                           </td>
                         </tr>
                       ))}
                     </tbody>
                   </table>
                 </div>
               </Card>
             ) : (
               <div className="text-center py-24 bg-white rounded-xl border border-border">
                 <Briefcase size={48} className="mx-auto text-muted mb-4" />
                 <h3 className="text-xl font-bold text-primary">No applications yet</h3>
                 <p className="text-secondary mt-2">Start exploring jobs and apply for roles that match your skills.</p>
                 <Button className="mt-6" onClick={() => navigate('/jobs')}>Explore Jobs</Button>
               </div>
             )}
          </div>

        </div>
      </main>
    </div>
  )
}

export default CandidateDashboard
