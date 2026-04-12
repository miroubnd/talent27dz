import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { Navbar } from '../../components/layout'
import { Card, Badge, Button } from '../../components/ui'
import { ChevronLeft, Download, Mail, Check, X, Clock } from 'lucide-react'

const ApplicantsView = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [job, setJob] = useState(null)
  const [applicants, setApplicants] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [id])

  const fetchData = async () => {
    // Fetch job details
    const { data: jobData } = await supabase
      .from('jobs')
      .select('title')
      .eq('id', id)
      .single()
    setJob(jobData)

    // Fetch applicants with profile data
    const { data: appData } = await supabase
      .from('applications')
      .select('*, profiles(*)')
      .eq('job_id', id)
      .order('created_at', { ascending: false })

    if (appData) setApplicants(appData)
    setLoading(false)
  }

  const updateStatus = async (appId, candidateId, newStatus) => {
    const { error } = await supabase
      .from('applications')
      .update({ status: newStatus })
      .eq('id', appId)

    if (!error) {
      // Trigger notification
      await supabase
        .from('notifications')
        .insert([{
          user_id: candidateId,
          message: `Your application for "${job.title}" has been ${newStatus}.`,
          type: 'application_update'
        }])

      setApplicants(prev => prev.map(a => a.id === appId ? { ...a, status: newStatus } : a))
    }
  }

  return (
    <div className="min-h-screen bg-surface-dark">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <button 
          onClick={() => navigate('/dashboard/employer')}
          className="flex items-center text-secondary hover:text-primary mb-8"
        >
          <ChevronLeft size={20} className="mr-1" /> Back to Dashboard
        </button>

        <header className="mb-10">
           <h1 className="text-3xl font-bold text-primary">Applicants</h1>
           <p className="text-secondary mt-1">Reviewing candidates for <span className="text-primary font-bold">"{job?.title}"</span></p>
        </header>

        {loading ? (
          <div className="space-y-4">
            {[1,2,3].map(i => <div key={i} className="h-24 bg-white/50 animate-pulse rounded-xl border border-border"></div>)}
          </div>
        ) : applicants.length > 0 ? (
          <div className="space-y-6">
            {applicants.map((app) => (
              <Card key={app.id} className="p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                   <div className="flex items-center">
                      <img 
                        src={app.profiles?.avatar_url || `https://ui-avatars.com/api/?name=${app.profiles?.full_name}`}
                        className="w-16 h-16 rounded-full border border-border mr-4"
                        alt="avatar"
                      />
                      <div>
                         <h3 className="text-xl font-bold text-primary">{app.profiles?.full_name}</h3>
                         <div className="flex items-center text-secondary text-sm">
                            <Mail size={14} className="mr-1.5" /> {app.profiles?.email || 'N/A'}
                         </div>
                         <p className="text-xs text-secondary mt-1">Applied on {new Date(app.created_at).toLocaleDateString()}</p>
                      </div>
                   </div>

                   <div className="flex flex-col items-end gap-3">
                      <div className="flex items-center gap-2">
                         <span className="text-xs text-secondary font-medium mr-2">Status:</span>
                         <Badge status={app.status}>{app.status}</Badge>
                      </div>
                      
                      <div className="flex gap-2">
                        <a href={app.cv_url} target="_blank" rel="noreferrer">
                          <Button variant="outline" size="sm">
                             <Download size={16} className="mr-2" /> Download CV
                          </Button>
                        </a>
                        
                        {app.status === 'pending' && (
                          <>
                            <Button 
                              variant="primary" 
                              size="sm" 
                              className="bg-success hover:bg-green-700"
                              onClick={() => updateStatus(app.id, app.candidate_id, 'accepted')}
                            >
                               <Check size={16} className="mr-2" /> Accept
                            </Button>
                            <Button 
                              variant="danger" 
                              size="sm"
                              onClick={() => updateStatus(app.id, app.candidate_id, 'rejected')}
                            >
                               <X size={16} className="mr-2" /> Reject
                            </Button>
                          </>
                        )}
                      </div>
                   </div>
                </div>

                {app.cover_letter && (
                  <div className="mt-8 p-4 bg-surface-dark rounded-lg border border-border">
                     <p className="text-xs font-bold text-primary uppercase tracking-wider mb-2 flex items-center">
                       <Clock size={12} className="mr-1.5" /> Cover Letter
                     </p>
                     <p className="text-sm text-secondary whitespace-pre-wrap">{app.cover_letter}</p>
                  </div>
                )}
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-12 text-center text-secondary">
             No applications received for this job yet.
          </Card>
        )}
      </main>
    </div>
  )
}

export default ApplicantsView
