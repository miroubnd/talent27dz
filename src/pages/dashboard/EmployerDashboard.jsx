import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { Navbar } from '../../components/layout'
import { Card, Badge, Button } from '../../components/ui'
import { Plus, Users, Eye, MoreVertical, Briefcase, MapPin } from 'lucide-react'

const EmployerDashboard = () => {
  const { user, profile } = useAuth()
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    fetchJobs()
  }, [])

  const fetchJobs = async () => {
    // Fetch jobs and count applicants for each
    const { data } = await supabase
      .from('jobs')
      .select('*, applications(count)')
      .eq('employer_id', user.id)
      .order('created_at', { ascending: false })

    if (data) setJobs(data)
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-surface-dark">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <header className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold text-primary">Employer Dashboard</h1>
            <p className="text-secondary mt-1">Manage your job postings and review talent.</p>
          </div>
          <Button onClick={() => navigate('/jobs/new')} className="h-12 shadow-lg hover:translate-y-[-2px]">
            <Plus size={20} className="mr-2" /> Post New Job
          </Button>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
           <Card className="p-6 border-l-4 border-l-primary">
              <div className="flex items-center justify-between">
                 <div>
                   <p className="text-sm font-bold text-secondary uppercase tracking-wider">Total Jobs</p>
                   <p className="text-3xl font-bold text-primary mt-1">{jobs.length}</p>
                 </div>
                 <Briefcase className="text-primary/10 w-12 h-12" />
              </div>
           </Card>
           <Card className="p-6 border-l-4 border-l-accent">
              <div className="flex items-center justify-between">
                 <div>
                   <p className="text-sm font-bold text-secondary uppercase tracking-wider">Total Applicants</p>
                   <p className="text-3xl font-bold text-primary mt-1">
                      {jobs.reduce((acc, job) => acc + (job.applications?.[0]?.count || 0), 0)}
                   </p>
                 </div>
                 <Users className="text-accent/10 w-12 h-12" />
              </div>
           </Card>
           <Card className="p-6 border-l-4 border-l-success">
              <div className="flex items-center justify-between">
                 <div>
                   <p className="text-sm font-bold text-secondary uppercase tracking-wider">Active Posts</p>
                   <p className="text-3xl font-bold text-primary mt-1">{jobs.filter(j => j.status === 'approved').length}</p>
                 </div>
                 <div className="w-12 h-12 rounded-full bg-success/5 flex items-center justify-center">
                    <div className="w-3 h-3 bg-success rounded-full animate-pulse"></div>
                 </div>
              </div>
           </Card>
        </div>

        {/* Content */}
        {loading ? (
          <div className="space-y-4">
             {[1,2,3].map(i => <div key={i} className="h-24 bg-white/50 animate-pulse rounded-xl border border-border"></div>)}
          </div>
        ) : jobs.length > 0 ? (
          <Card>
            <div className="overflow-x-auto">
               <table className="w-full text-left">
                  <thead>
                     <tr className="bg-surface-dark border-b border-border">
                        <th className="px-6 py-4 text-xs font-bold text-primary uppercase">Job Title & Location</th>
                        <th className="px-6 py-4 text-xs font-bold text-primary uppercase text-center">Applicants</th>
                        <th className="px-6 py-4 text-xs font-bold text-primary uppercase">Status</th>
                        <th className="px-6 py-4 text-xs font-bold text-primary uppercase text-right">Actions</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {jobs.map((job) => (
                      <tr key={job.id} className="hover:bg-surface-dark/50 transition-colors">
                        <td className="px-6 py-6 font-bold text-primary">
                           <div className="flex flex-col">
                              <span>{job.title}</span>
                              <span className="text-xs text-secondary font-normal mt-1 flex items-center">
                                <MapPin size={12} className="mr-1" /> {job.location}
                              </span>
                           </div>
                        </td>
                        <td className="px-6 py-6 text-center">
                           <span className="px-3 py-1 bg-surface-dark rounded-full font-bold text-primary">
                              {job.applications?.[0]?.count || 0}
                           </span>
                        </td>
                        <td className="px-6 py-6">
                           <Badge status={job.status}>{job.status}</Badge>
                        </td>
                        <td className="px-6 py-6 text-right">
                           <div className="flex items-center justify-end space-x-2">
                             <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => navigate(`/dashboard/employer/applicants/${job.id}`)}
                             >
                                <Eye size={16} className="mr-2" /> View Applicants
                             </Button>
                             <button className="p-2 text-secondary hover:text-primary hover:bg-surface-dark rounded-lg transition-colors">
                                <MoreVertical size={20} />
                             </button>
                           </div>
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
             <h3 className="text-xl font-bold text-primary">No job posts yet</h3>
             <p className="text-secondary mt-2">Hire Algeria's best talent by posting your first job opening.</p>
             <Button className="mt-6" onClick={() => navigate('/jobs/new')}>Post First Job</Button>
          </div>
        )}
      </main>
    </div>
  )
}

export default EmployerDashboard
