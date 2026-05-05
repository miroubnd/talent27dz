import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { Navbar } from '../../components/layout'
import { Card, Badge, Button } from '../../components/ui'
import { Link } from 'react-router-dom'
import { Users, Briefcase, Check, X, Shield, Search, ExternalLink } from 'lucide-react'

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('pending_jobs')
  const [pendingJobs, setPendingJobs] = useState([])
  const [allUsers, setAllUsers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPendingJobs()
    fetchUsers()
  }, [])

  const fetchPendingJobs = async () => {
    const { data } = await supabase
      .from('jobs')
      .select('*, profiles(*)')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
    if (data) setPendingJobs(data)
  }

  const fetchUsers = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })
    if (data) setAllUsers(data)
    setLoading(false)
  }



  const approveJob = async (jobId, employerProfile, status = 'approved') => {
    const { error } = await supabase
      .from('jobs')
      .update({ status })
      .eq('id', jobId)

    if (!error) {
      const jobTitle = pendingJobs.find(j => j.id === jobId)?.title
      // Notify employer
      await supabase
        .from('notifications')
        .insert([{
          user_id: employerProfile.id,
          message: `Your job post for "${jobTitle}" has been ${status}.`,
        }])
      
      if (employerProfile.contact_email || employerProfile.email) {
        const destEmail = employerProfile.contact_email || employerProfile.email
        const subject = status === 'approved' ? "Your job post has been approved — TalentDZ" : "Your job post was not approved — TalentDZ"
        const content = status === 'approved' 
          ? `Your job post ${jobTitle} has been approved and is now live on TalentDZ.`
          : `Your job post ${jobTitle} has been reviewed and was not approved at this time.`

        await supabase.functions.invoke('send-email', {
          body: {
            to: destEmail,
            subject,
            content
          }
        })
      }

      setPendingJobs(prev => prev.filter(j => j.id !== jobId))
    }
  }

  return (
    <div className="min-h-screen bg-surface-dark">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <header className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
           <div>
              <h1 className="text-3xl font-bold text-primary flex items-center">
                <Shield className="mr-3 text-accent" /> Admin Panel
              </h1>
              <p className="text-secondary mt-1">Platform-wide moderation and management.</p>
           </div>
           <div className="flex flex-wrap bg-white p-1 rounded-xl border border-border shadow-sm">
              <button 
                onClick={() => setActiveTab('pending_jobs')}
                className={`px-4 md:px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'pending_jobs' ? 'bg-primary text-white shadow-md' : 'text-secondary hover:text-primary'}`}
              >
                Jobs ({pendingJobs.length})
              </button>
              <button 
                onClick={() => setActiveTab('users')}
                className={`px-4 md:px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'users' ? 'bg-primary text-white shadow-md' : 'text-secondary hover:text-primary'}`}
              >
                Users ({allUsers.length})
              </button>
           </div>
        </header>

        {activeTab === 'pending_jobs' && (
          <div className="space-y-6">
             <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-white px-4 py-3">
               <p className="text-sm text-secondary">Use the dedicated workspace for a larger review layout.</p>
               <Link
                 to="/dashboard/admin/pending-jobs"
                 className="inline-flex items-center text-sm font-bold text-accent hover:underline"
               >
                 Open pending jobs page <ExternalLink size={14} className="ml-1" />
               </Link>
             </div>
             {loading ? (
                <div className="h-64 bg-white/50 animate-pulse rounded-xl border border-border"></div>
             ) : pendingJobs.length > 0 ? (
                pendingJobs.map((job) => (
                  <Card key={job.id} className="p-6">
                     <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex-1">
                           <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-xl font-bold text-primary">{job.title}</h3>
                              <Badge status="pending">Pending</Badge>
                           </div>
                           <p className="text-secondary font-medium">{job.profiles?.company_name}</p>
                           <p className="text-xs text-secondary mt-2 line-clamp-2">{job.description}</p>
                        </div>
                        <div className="flex gap-2">
                           <Button 
                            variant="primary" 
                            size="sm" 
                            className="bg-success hover:bg-green-700"
                            onClick={() => approveJob(job.id, job.profiles, 'approved')}
                           >
                              <Check size={16} className="mr-2" /> Approve
                           </Button>
                           <Button 
                            variant="danger" 
                            size="sm"
                            onClick={() => approveJob(job.id, job.profiles, 'rejected')}
                           >
                              <X size={16} className="mr-2" /> Reject
                           </Button>
                        </div>
                     </div>
                  </Card>
                ))
             ) : (
                <div className="text-center py-24 bg-white rounded-xl border border-border">
                   <Briefcase size={48} className="mx-auto text-muted mb-4" />
                   <h3 className="text-xl font-bold text-primary">No pending jobs</h3>
                   <p className="text-secondary mt-2">All job postings are currently up to date.</p>
                </div>
             )}
          </div>
        )}
        
        {activeTab === 'users' && (
          <Card>
             <div className="overflow-x-auto">
                <table className="w-full text-left">
                   <thead>
                      <tr className="bg-surface-dark border-b border-border">
                         <th className="px-6 py-4 text-xs font-bold text-primary uppercase">Name / Company</th>
                         <th className="px-6 py-4 text-xs font-bold text-primary uppercase">Role</th>
                         <th className="px-6 py-4 text-xs font-bold text-primary uppercase">Join Date</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-border">
                      {allUsers.map((user) => (
                        <tr key={user.id} className="hover:bg-surface-dark/5 transition-colors">
                           <td className="px-6 py-6 font-bold text-primary">
                              {user.full_name || user.company_name}
                           </td>
                           <td className="px-6 py-6">
                              <Badge status={user.role === 'admin' ? 'active' : 'pending'}>{user.role}</Badge>
                           </td>
                           <td className="px-6 py-6 text-sm text-secondary">
                              {new Date(user.created_at).toLocaleDateString()}
                           </td>
                        </tr>
                      ))}
                   </tbody>
                </table>
             </div>
          </Card>
        )}


      </main>
    </div>
  )
}

export default AdminDashboard
