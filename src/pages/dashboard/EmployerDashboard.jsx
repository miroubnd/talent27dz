import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { Navbar } from '../../components/layout'
import { Card, Button, Input } from '../../components/ui'
import { uploadFile } from '../../lib/storage'
import { Briefcase, Building2, Globe, Upload, Users, X } from 'lucide-react'

const EmployerDashboard = () => {
  const { user, profile, refreshProfile } = useAuth()
  const [jobs, setJobs] = useState([])
  const [applications, setApplications] = useState([])
  const [loadingData, setLoadingData] = useState(true)
  const [savingBranding, setSavingBranding] = useState(false)
  const [postingJob, setPostingJob] = useState(false)
  const [editingJobId, setEditingJobId] = useState(null)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState('success')
  const [viewingCoverLetter, setViewingCoverLetter] = useState(null)

  const [brandingForm, setBrandingForm] = useState({
    company_name: '',
    website: '',
    contact_email: '',
    location: '',
    bio: '',
  })
  const [logoFile, setLogoFile] = useState(null)

  const [jobForm, setJobForm] = useState({
    title: '',
    description: '',
    requirements: '',
    salary_range: '',
    location: '',
    job_type: 'full-time',
    sector: '',
    deadline: '',
    skills: '',
  })

  useEffect(() => {
    if (!user?.id) return
    setBrandingForm({
      company_name: profile?.company_name || '',
      website: profile?.website || localStorage.getItem(`company_website_${user.id}`) || '',
      contact_email: profile?.contact_email || '',
      location: profile?.location || '',
      bio: profile?.bio || '',
    })
    fetchDashboardData()
  }, [user?.id, profile?.company_name, profile?.contact_email, profile?.location, profile?.bio, profile?.website])

  const fetchDashboardData = async () => {
    setLoadingData(true)

    const { data: jobsData } = await supabase
      .from('jobs')
      .select('*')
      .eq('employer_id', user.id)
      .order('created_at', { ascending: false })

    const { data: applicationsData } = await supabase
      .from('applications')
      .select('id, status, cv_url, cover_letter, candidate_id, job_id, jobs!inner(id, title, employer_id), profiles(full_name, contact_email)')
      .eq('jobs.employer_id', user.id)
      .order('created_at', { ascending: false })

    if (jobsData) setJobs(jobsData)
    if (applicationsData) setApplications(applicationsData)
    setLoadingData(false)
  }

  const handleBrandingChange = (e) => {
    setBrandingForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleJobChange = (e) => {
    setJobForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const publishMessage = (type, text) => {
    setMessageType(type)
    setMessage(text)
  }

  const handleBrandingSave = async (e) => {
    e.preventDefault()
    setSavingBranding(true)

    try {
      let logoUrl = profile?.logo_url || ''
      if (logoFile) {
        try {
          logoUrl = await uploadFile('logos', logoFile, `company-${user.id}`)
        } catch (storageErr) {
          throw new Error(`Logo upload failed: ${storageErr.message}`)
        }
      }

      const payload = {
        company_name: brandingForm.company_name.trim(),
        contact_email: brandingForm.contact_email.trim(),
        location: brandingForm.location.trim(),
        bio: brandingForm.bio.trim(),
        logo_url: logoUrl,
        website: brandingForm.website.trim(),
      }

      let { error } = await supabase
        .from('profiles')
        .update(payload)
        .eq('id', user.id)

      if (error?.message?.toLowerCase().includes('website')) {
        const { website, ...fallbackPayload } = payload
        const fallbackResult = await supabase
          .from('profiles')
          .update(fallbackPayload)
          .eq('id', user.id)
        error = fallbackResult.error
      }

      if (error) throw error

      localStorage.setItem(`company_website_${user.id}`, brandingForm.website.trim())
      await refreshProfile()
      setLogoFile(null)
      publishMessage('success', 'Company branding updated successfully.')
    } catch (err) {
      publishMessage('error', err.message || 'Unable to save company branding.')
    } finally {
      setSavingBranding(false)
    }
  }

  const handleEditJob = (job) => {
    setEditingJobId(job.id)
    setJobForm({
      title: job.title || '',
      description: job.description || '',
      requirements: job.requirements || '',
      skills: job.skills ? job.skills.join(', ') : '',
      salary_range: job.salary_range || '',
      location: job.location || '',
      job_type: job.job_type || 'full-time',
      sector: job.sector || '',
      deadline: job.deadline || '',
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleJobPost = async (e) => {
    e.preventDefault()
    setPostingJob(true)

    try {
      const skillsArray = jobForm.skills
        .split(',')
        .map((skill) => skill.trim())
        .filter(Boolean)

      const payload = {
        employer_id: user.id,
        title: jobForm.title.trim(),
        description: jobForm.description.trim(),
        requirements: jobForm.requirements.trim() || jobForm.description.trim(),
        skills: skillsArray,
        salary_range: jobForm.salary_range.trim() || null,
        location: jobForm.location.trim() || null,
        job_type: jobForm.job_type,
        sector: jobForm.sector.trim() || null,
        deadline: jobForm.deadline || null,
        status: 'pending',
      }

      if (editingJobId) {
        const { error } = await supabase.from('jobs').update(payload).eq('id', editingJobId)
        if (error) throw error
        setEditingJobId(null)
        setJobForm({ title: '', description: '', requirements: '', skills: '', salary_range: '', location: '', job_type: 'full-time', sector: '', deadline: '' })
        publishMessage('success', 'Job updated successfully and sent for admin approval.')
      } else {
        const { error } = await supabase.from('jobs').insert([payload])
        if (error) throw error
        setJobForm({ title: '', description: '', requirements: '', skills: '', salary_range: '', location: '', job_type: 'full-time', sector: '', deadline: '' })
        publishMessage('success', 'Job posted successfully and sent for admin approval.')
      }

      await fetchDashboardData()
    } catch (err) {
      publishMessage('error', err.message || 'Unable to post this job right now.')
    } finally {
      setPostingJob(false)
    }
  }

  const handleStatusUpdate = async (applicationId, status) => {
    const { error } = await supabase
      .from('applications')
      .update({ status })
      .eq('id', applicationId)

    if (error) {
      publishMessage('error', error.message || 'Status update failed.')
      return
    }

    setApplications((prev) => prev.map((row) => (row.id === applicationId ? { ...row, status } : row)))
    publishMessage('success', `Application marked as ${status}.`)

    const application = applications.find(app => app.id === applicationId)
    if (application) {
      await supabase.from('notifications').insert([{
        user_id: application.candidate_id,
        message: `Your application for "${application.jobs?.title}" has been updated to: ${status}.`
      }])
      
      if (application.profiles?.contact_email) {
        await supabase.functions.invoke('send-email', {
          body: {
            to: application.profiles.contact_email,
            subject: `Application Update: ${application.jobs?.title}`,
            content: `Your application status for the position of ${application.jobs?.title} has been updated to: ${status}.`
          }
        }).catch(err => console.log('Email send error:', err))
      }
    }
  }

  const handleDownloadCv = async (cvUrl) => {
    if (!cvUrl) return

    let path = cvUrl
    if (cvUrl.startsWith('http')) {
      const parts = cvUrl.split('/')
      path = parts[parts.length - 1]
    }

    const { data, error } = await supabase.storage.from('cv_uploads').createSignedUrl(path, 300)
    if (error || !data?.signedUrl) {
      if (cvUrl.startsWith('http')) {
        window.open(cvUrl, '_blank', 'noopener,noreferrer')
      } else {
        publishMessage('error', 'Unable to generate CV download link.')
      }
      return
    }
    window.open(data.signedUrl, '_blank', 'noopener,noreferrer')
  }

  const stats = useMemo(() => {
    return {
      activeJobs: jobs.filter((job) => job.status === 'approved').length,
      totalApplicants: applications.length,
    }
  }, [jobs, applications])

  const statusUi = {
    pending: 'bg-warning/10 text-warning border-warning/20',
    approved: 'bg-success/10 text-success border-success/20',
    rejected: 'bg-error/10 text-error border-error/20',
    closed: 'bg-muted/20 text-muted border-muted/30',
  }

  return (
    <div className="min-h-screen bg-surface-dark">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <header className="mb-10">
          <div>
            <h1 className="text-3xl font-bold text-primary">TalentDZ Employer Dashboard</h1>
            <p className="text-secondary mt-1">Manage company branding, jobs, and applicants in one place.</p>
          </div>
        </header>

        {message && (
          <div className={`mb-6 rounded-lg border p-3 text-sm ${messageType === 'error' ? 'border-error/30 bg-error/5 text-error' : 'border-success/20 bg-success/5 text-success'}`}>
            {message}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          <Card className="p-6 border-l-4 border-l-primary">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-secondary uppercase tracking-wider">Total Active Jobs</p>
                <p className="text-3xl font-bold text-primary mt-1">{stats.activeJobs}</p>
              </div>
              <Briefcase className="text-primary/10 w-12 h-12" />
            </div>
          </Card>
          <Card className="p-6 border-l-4 border-l-accent">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-secondary uppercase tracking-wider">Total Applicants Received</p>
                <p className="text-3xl font-bold text-primary mt-1">{stats.totalApplicants}</p>
              </div>
              <Users className="text-accent/10 w-12 h-12" />
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-8">
          <Card className="p-6">
            <h2 className="text-xl font-bold text-primary mb-4">Company Branding</h2>
            <form onSubmit={handleBrandingSave} className="space-y-4">
              <Input label="Company Name" name="company_name" value={brandingForm.company_name} onChange={handleBrandingChange} required />
              <Input label="Website" name="website" value={brandingForm.website} onChange={handleBrandingChange} placeholder="https://company.dz" />
              <Input label="Contact Email" name="contact_email" type="email" value={brandingForm.contact_email} onChange={handleBrandingChange} required />
              <Input label="Location" name="location" value={brandingForm.location} onChange={handleBrandingChange} />
              <div>
                <label className="text-sm font-semibold text-primary/80">Company Description</label>
                <textarea
                  name="bio"
                  value={brandingForm.bio}
                  onChange={handleBrandingChange}
                  className="input mt-1 min-h-[100px]"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-primary/80">Company Logo</label>
                <label className="mt-1 flex items-center justify-center gap-2 border-2 border-dashed border-border rounded-lg px-4 py-3 cursor-pointer hover:border-accent hover:bg-accent/5 transition-colors">
                  <Upload size={16} />
                  <span className="text-sm text-secondary">{logoFile ? logoFile.name : 'Upload a new logo'}</span>
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => setLogoFile(e.target.files?.[0] || null)} />
                </label>
              </div>
              <Button type="submit" loading={savingBranding} disabled={savingBranding}>
                Save Company Details
              </Button>
            </form>
          </Card>

          <Card className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-primary">{editingJobId ? 'Edit Job' : 'Post a Job'}</h2>
              {editingJobId && (
                <Button variant="outline" size="sm" onClick={() => { setEditingJobId(null); setJobForm({ title: '', description: '', requirements: '', skills: '', salary_range: '', location: '', job_type: 'full-time', sector: '', deadline: '' }) }}>
                  Cancel
                </Button>
              )}
            </div>
            <form onSubmit={handleJobPost} className="space-y-4">
              <Input label="Title" name="title" value={jobForm.title} onChange={handleJobChange} required />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="Location" name="location" value={jobForm.location} onChange={handleJobChange} required />
                <Input label="Sector" name="sector" value={jobForm.sector} onChange={handleJobChange} required />
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-primary/80">Job Type</label>
                  <select name="job_type" className="input" value={jobForm.job_type} onChange={handleJobChange} required>
                    <option value="full-time">Full-time</option>
                    <option value="part-time">Part-time</option>
                    <option value="remote">Remote</option>
                    <option value="freelance">Freelance</option>
                    <option value="internship">Internship</option>
                  </select>
                </div>
                <Input label="Deadline" name="deadline" type="date" value={jobForm.deadline} onChange={handleJobChange} required />
              </div>
              <div>
                <label className="text-sm font-semibold text-primary/80">Description</label>
                <textarea
                  name="description"
                  value={jobForm.description}
                  onChange={handleJobChange}
                  className="input mt-1 min-h-[120px]"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-primary/80">Requirements</label>
                <textarea
                  name="requirements"
                  value={jobForm.requirements}
                  onChange={handleJobChange}
                  className="input mt-1 min-h-[120px]"
                  required
                />
              </div>
              <Input label="Skills Required (comma separated)" name="skills" value={jobForm.skills} onChange={handleJobChange} placeholder="React, Node.js, SQL" />
              <Input label="Salary Range" name="salary_range" value={jobForm.salary_range} onChange={handleJobChange} placeholder="120k - 180k DZD" />
              <Button type="submit" loading={postingJob} disabled={postingJob}>
                {editingJobId ? 'Update Job Listing' : 'Add Job Listing'}
              </Button>
            </form>
          </Card>
        </div>

        <Card>
          <div className="p-6 border-b border-border">
            <h2 className="text-xl font-bold text-primary">Applicant Tracking System (ATS)</h2>
            <p className="text-secondary text-sm mt-1">Review and manage incoming applications from your job posts.</p>
          </div>
          {loadingData ? (
            <div className="space-y-4 p-6">
              {[1, 2, 3].map((i) => <div key={i} className="h-16 bg-surface-dark animate-pulse rounded-xl border border-border"></div>)}
            </div>
          ) : applications.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-surface-dark border-b border-border">
                    <th className="px-6 py-4 text-xs font-bold text-primary uppercase">Candidate</th>
                    <th className="px-6 py-4 text-xs font-bold text-primary uppercase">Job Title</th>
                    <th className="px-6 py-4 text-xs font-bold text-primary uppercase">CV</th>
                    <th className="px-6 py-4 text-xs font-bold text-primary uppercase">Cover Letter</th>
                    <th className="px-6 py-4 text-xs font-bold text-primary uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {applications.map((application) => (
                    <tr key={application.id} className="hover:bg-surface-dark/50 transition-colors">
                      <td className="px-6 py-4 font-medium text-primary">{application.profiles?.full_name || 'Candidate'}</td>
                      <td className="px-6 py-4 text-secondary">{application.jobs?.title}</td>
                      <td className="px-6 py-4">
                        <Button variant="outline" size="sm" onClick={() => handleDownloadCv(application.cv_url)}>
                          Download CV
                        </Button>
                      </td>
                      <td className="px-6 py-4">
                        {application.cover_letter ? (
                          <Button variant="outline" size="sm" onClick={() => setViewingCoverLetter(application)}>
                            View
                          </Button>
                        ) : <span className="text-sm text-secondary">None</span>}
                      </td>
                      <td className="px-6 py-4">
                        {application.status === 'pending' ? (
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={() => handleStatusUpdate(application.id, 'accepted')}
                              className="px-3 py-1.5 bg-green-500/10 hover:bg-green-500/20 text-green-600 font-semibold text-xs rounded-lg transition-colors border border-green-500/20"
                            >
                              Accept
                            </button>
                            <button 
                              onClick={() => handleStatusUpdate(application.id, 'rejected')}
                              className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-600 font-semibold text-xs rounded-lg transition-colors border border-red-500/20"
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-3">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${
                              application.status === 'accepted' ? 'bg-green-500/10 text-green-600 border-green-500/20' : 'bg-red-500/10 text-red-600 border-red-500/20'
                            }`}>
                              {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                            </span>
                            <button 
                              onClick={() => handleStatusUpdate(application.id, 'pending')}
                              className="text-[10px] text-secondary hover:text-primary transition-colors underline"
                              title="Revert back to pending"
                            >
                              Undo
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-12 text-center">
              <p className="text-primary font-semibold">No applicants yet</p>
              <p className="text-secondary text-sm mt-2">Applications will appear here as soon as candidates apply.</p>
            </div>
          )}
        </Card>

        <Card className="mt-8">
          <div className="p-6 border-b border-border">
            <h2 className="text-xl font-bold text-primary">Posted Jobs Status</h2>
            <p className="text-secondary text-sm mt-1">
              Track every listing lifecycle: pending (waiting for super admin), approved (live), and rejected.
            </p>
          </div>
          {loadingData ? (
            <div className="space-y-4 p-6">
              {[1, 2, 3].map((i) => <div key={i} className="h-14 bg-surface-dark animate-pulse rounded-xl border border-border"></div>)}
            </div>
          ) : jobs.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-surface-dark border-b border-border">
                    <th className="px-6 py-4 text-xs font-bold text-primary uppercase">Job Title</th>
                    <th className="px-6 py-4 text-xs font-bold text-primary uppercase">Created</th>
                    <th className="px-6 py-4 text-xs font-bold text-primary uppercase">Applicants</th>
                    <th className="px-6 py-4 text-xs font-bold text-primary uppercase">Status</th>
                    <th className="px-6 py-4 text-xs font-bold text-primary uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {jobs.map((job) => {
                    const applicantsCount = applications.filter((app) => app.job_id === job.id).length
                    const normalizedStatus = statusUi[job.status] ? job.status : 'closed'
                    return (
                      <tr key={job.id} className="hover:bg-surface-dark/50 transition-colors">
                        <td className="px-6 py-4 font-medium text-primary">{job.title}</td>
                        <td className="px-6 py-4 text-secondary text-sm">{new Date(job.created_at).toLocaleDateString()}</td>
                        <td className="px-6 py-4 text-secondary text-sm">{applicantsCount}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold uppercase ${statusUi[normalizedStatus]}`}>
                            {job.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <Button variant="outline" size="sm" onClick={() => handleEditJob(job)}>Edit</Button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-12 text-center">
              <p className="text-primary font-semibold">No posted jobs yet</p>
              <p className="text-secondary text-sm mt-2">Create your first job post to start tracking its status.</p>
            </div>
          )}
        </Card>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="p-4 flex items-center gap-3">
            <Building2 className="text-primary" size={20} />
            <p className="text-sm text-secondary">Keep your brand up to date so candidates trust your company profile.</p>
          </Card>
          <Card className="p-4 flex items-center gap-3">
            <Globe className="text-accent" size={20} />
            <p className="text-sm text-secondary">Website, contact info, and logo improve applicant conversion quality.</p>
          </Card>
        </div>
      </main>

      {/* Cover Letter Modal */}
      {viewingCoverLetter && (
        <div className="fixed inset-0 z-50 bg-primary/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[80vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <div>
                <h3 className="text-xl font-bold text-primary">Cover Letter</h3>
                <p className="text-sm text-secondary mt-1">From {viewingCoverLetter.profiles?.full_name}</p>
              </div>
              <button 
                onClick={() => setViewingCoverLetter(null)}
                className="p-2 text-secondary hover:text-primary hover:bg-surface-dark rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6 overflow-y-auto whitespace-pre-wrap text-primary leading-relaxed text-sm">
              {viewingCoverLetter.cover_letter}
            </div>
            <div className="p-4 border-t border-border flex justify-end bg-surface-dark rounded-b-xl">
              <Button onClick={() => setViewingCoverLetter(null)}>Close</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default EmployerDashboard
