import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { Navbar } from '../../components/layout'
import { Card, Badge, Button } from '../../components/ui'
import { Users, Briefcase, Check, X, Shield, Search } from 'lucide-react'

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
      .select('*, profiles(company_name)')
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

  const approveJob = async (jobId, employerId, status = 'approved') => {
    const { error } = await supabase
      .from('jobs')
      .update({ status })
      .eq('id', jobId)

    if (!error) {
      // Notify employer
      await supabase
        .from('notifications')
        .insert([{
          user_id: employerId,
          message: `Your job post for "${pendingJobs.find(j => j.id === jobId).title}" has been ${status}.`,
          type: 'job_moderation'
        }])

      setPendingJobs(prev => prev.filter(j => j.id !== jobId))
    }
  }

  return (
    <div className="min-h-screen bg-surface-dark">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <header className="mb-10 flex items-center justify-between">
           <div>
              <h1 className="text-3xl font-bold text-primary flex items-center">
                <Shield className="mr-3 text-accent" /> Admin Panel
              </h1>
              <p className="text-secondary mt-1">Platform-wide moderation and management.</p>
           </div>
           <div className="flex bg-white p-1 rounded-xl border border-border shadow-sm">
              <button 
                onClick={() => setActiveTab('pending_jobs')}
                className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'pending_jobs' ? 'bg-primary text-white shadow-md' : 'text-secondary hover:text-primary'}`}
              >
                Jobs ({pendingJobs.length})
              </button>
              <button 
                onClick={() => setActiveTab('users')}
                className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'users' ? 'bg-primary text-white shadow-md' : 'text-secondary hover:text-primary'}`}
              >
                Users ({allUsers.length})
              </button>
           </div>
        </header>

        {activeTab === 'pending_jobs' ? (
          <div className="space-y-6">
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
                            onClick={() => approveJob(job.id, job.employer_id, 'approved')}
                           >
                              <Check size={16} className="mr-2" /> Approve
                           </Button>
                           <Button 
                            variant="danger" 
                            size="sm"
                            onClick={() => approveJob(job.id, job.employer_id, 'rejected')}
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
        ) : (
          <Card>
             <div className="overflow-x-auto">
                <table className="w-full text-left">
                   <thead>
                      <tr className="bg-surface-dark border-b border-border">
                         <th className="px-6 py-4 text-xs font-bold text-primary uppercase">Name / Company</th>
                         <th className="px-6 py-4 text-xs font-bold text-primary uppercase">Role</th>
                         <th className="px-6 py-4 text-xs font-bold text-primary uppercase">Join Date</th>
                         <th className="px-6 py-4 text-xs font-bold text-primary uppercase text-right">Actions</th>
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
                           <td className="px-6 py-6 text-right">
                              <Button variant="outline" size="sm">Manage</Button>
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
