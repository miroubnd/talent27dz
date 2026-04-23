import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { uploadFile } from '../../lib/storage'
import { Navbar } from '../../components/layout'
import { Button, Card, Badge, Input } from '../../components/ui'
import { MapPin, Briefcase, DollarSign, Calendar, Building2, ChevronLeft, Send, FileText } from 'lucide-react'

const JobDetails = () => {
  const { id } = useParams()
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const [job, setJob] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showApplyModal, setShowApplyModal] = useState(false)
  const [applying, setApplying] = useState(false)
  
  const [applyForm, setApplyForm] = useState({
    cover_letter: '',
    cv: null
  })

  useEffect(() => {
    fetchJob()
  }, [id])

  const fetchJob = async () => {
    const { data } = await supabase
      .from('jobs')
      .select('*, profiles(*)')
      .eq('id', id)
      .single()

    if (data) setJob(data)
    setLoading(false)
  }

  const handleApply = async (e) => {
    e.preventDefault()
    setApplying(true)

    try {
      let cvUrl = profile.cv_url
      if (applyForm.cv) {
        cvUrl = await uploadFile('cvs', applyForm.cv, `${user.id}-app`)
      }

      // 1. Create Application
      const { error: appError } = await supabase
        .from('applications')
        .insert([{
          job_id: id,
          candidate_id: user.id,
          cover_letter: applyForm.cover_letter,
          cv_url: cvUrl,
          status: 'pending'
        }])

      if (appError) throw appError

      // 2. Create Notification for Employer
      await supabase
        .from('notifications')
        .insert([{
          user_id: job.employer_id,
          message: `New application received for "${job.title}" from ${profile.full_name}`,
        }])

      // 3. Send Email Notification
      await supabase.functions.invoke('send-email', {
        body: {
          to: job.profiles.contact_email,
          subject: `New application received for ${job.title}`,
          content: `${profile.full_name} has applied for your job post ${job.title}.`
        }
      })

      alert('Application submitted successfully!')
      setShowApplyModal(false)
    } catch (err) {
      alert(err.message)
    } finally {
      setApplying(false)
    }
  }

  if (loading) return <div className="min-h-screen bg-surface-dark"><Navbar /><div className="p-24 text-center">Loading...</div></div>
  if (!job) return <div className="min-h-screen bg-surface-dark"><Navbar /><div className="p-24 text-center">Job not found</div></div>

  return (
    <div className="min-h-screen bg-surface-dark">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center text-secondary hover:text-primary mb-8"
        >
          <ChevronLeft size={20} className="mr-1" /> Back to listings
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-8">
            <Card className="p-8">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div className="flex items-center">
                  <img 
                    src={job.profiles?.logo_url || `https://ui-avatars.com/api/?name=${job.profiles?.company_name}`}
                    className="w-16 h-16 rounded-xl border border-border mr-4 object-contain bg-white"
                    alt="logo"
                  />
                  <div>
                    <h1 className="text-3xl font-bold text-primary">{job.title}</h1>
                    <p className="text-lg text-secondary">{job.profiles?.company_name}</p>
                  </div>
                </div>
                <Badge status={job.job_type}>{job.job_type}</Badge>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-6 border-y border-border mb-8">
                <div>
                  <p className="text-xs text-secondary mb-1">Location</p>
                  <p className="text-sm font-bold flex items-center"><MapPin size={14} className="mr-1 text-accent" /> {job.location}</p>
                </div>
                <div>
                  <p className="text-xs text-secondary mb-1">Salary</p>
                  <p className="text-sm font-bold flex items-center"><DollarSign size={14} className="mr-1 text-accent" /> {job.salary_range || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-secondary mb-1">Sector</p>
                  <p className="text-sm font-bold flex items-center"><Briefcase size={14} className="mr-1 text-accent" /> {job.sector || 'General'}</p>
                </div>
                <div>
                  <p className="text-xs text-secondary mb-1">Deadline</p>
                  <p className="text-sm font-bold flex items-center"><Calendar size={14} className="mr-1 text-accent" /> {job.deadline ? new Date(job.deadline).toLocaleDateString() : 'N/A'}</p>
                </div>
              </div>

              <div className="prose prose-navy max-w-none">
                <h3 className="text-xl font-bold mb-4">Description</h3>
                <p className="text-secondary whitespace-pre-wrap mb-8">{job.description}</p>
                
                <h3 className="text-xl font-bold mb-4">Requirements</h3>
                <p className="text-secondary whitespace-pre-wrap mb-8">{job.requirements}</p>

                {job.skills && job.skills.length > 0 && (
                  <>
                    <h3 className="text-xl font-bold mb-4">Skills</h3>
                    <div className="flex flex-wrap gap-2">
                      {job.skills.map((skill, i) => (
                        <span key={i} className="px-3 py-1 bg-surface-dark border border-border rounded-full text-xs font-medium text-secondary">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </Card>
          </div>

          {/* Sidebar Action */}
          <div className="space-y-6">
            <Card className="p-6 sticky top-24">
              {profile?.role === 'candidate' ? (
                <div className="space-y-4">
                  <h3 className="font-bold text-primary">Interested in this role?</h3>
                  <p className="text-sm text-secondary">Make sure your profile is up to date before applying.</p>
                  <Button className="w-full h-12" onClick={() => setShowApplyModal(true)}>
                    Apply Now
                  </Button>
                </div>
              ) : profile?.role === 'employer' ? (
                <div className="text-center p-4">
                  <p className="text-sm text-secondary italic">Employers cannot apply for jobs.</p>
                </div>
              ) : !user ? (
                <div className="space-y-4">
                  <p className="text-sm text-secondary">Please sign in to apply.</p>
                  <Button className="w-full" onClick={() => navigate('/login')}>Sign In to Apply</Button>
                </div>
              ) : null}
            </Card>

            <Card className="p-6">
              <h3 className="font-bold text-primary mb-4">About the Company</h3>
              <p className="text-sm text-secondary line-clamp-4 mb-4">{job.profiles?.bio || 'No company bio provided.'}</p>
              <div className="space-y-2">
                <p className="text-xs text-secondary">📍 {job.profiles?.location}</p>
                <p className="text-xs text-secondary">✉️ {job.profiles?.contact_email}</p>
              </div>
            </Card>
          </div>
        </div>
      </main>

      {/* Apply Modal */}
      {showApplyModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-primary/40 backdrop-blur-sm animate-in fade-in duration-200">
          <Card className="w-full max-w-lg p-8 shadow-2xl scale-in-center">
            <h2 className="text-2xl font-bold text-primary mb-2">Apply for {job.title}</h2>
            <p className="text-secondary text-sm mb-8">Share why you're a great fit for this position.</p>

            <form onSubmit={handleApply} className="space-y-6">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-primary/80">Cover Letter (Optional)</label>
                <textarea 
                  className="input min-h-[150px]"
                  placeholder="Tell the employer more about yourself..."
                  value={applyForm.cover_letter}
                  onChange={(e) => setApplyForm({ ...applyForm, cover_letter: e.target.value })}
                ></textarea>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-primary/80">Resume / CV</label>
                <div className="p-4 border border-border rounded-lg bg-surface-dark flex items-center justify-between">
                  <div className="flex items-center">
                    <FileText className="text-accent mr-3" />
                    <div>
                      <p className="text-xs font-bold text-primary">Current CV on Profile</p>
                      <p className="text-[10px] text-secondary">Auto-attached from your profile</p>
                    </div>
                  </div>
                  <input 
                    type="file" 
                    id="new-cv" 
                    className="hidden" 
                    accept=".pdf"
                    onChange={(e) => setApplyForm({ ...applyForm, cv: e.target.files[0] })}
                  />
                  <label htmlFor="new-cv" className="text-xs text-accent font-bold cursor-pointer hover:underline">
                    {applyForm.cv ? applyForm.cv.name : 'Replace with new'}
                  </label>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <Button variant="outline" className="flex-1" onClick={() => setShowApplyModal(false)}>Cancel</Button>
                <Button type="submit" className="flex-1" loading={applying}>
                  <Send size={18} className="mr-2" /> {applying ? 'Sending...' : 'Submit Application'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  )
}

export default JobDetails
