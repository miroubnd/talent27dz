import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { Navbar } from '../../components/layout'
import { Card, Button, Input } from '../../components/ui'
import { uploadFile } from '../../lib/storage'
import { Briefcase, Building2, Globe, Upload, Users } from 'lucide-react'

const EmployerDashboard = () => {
  const { user, profile, refreshProfile } = useAuth()
  const [jobs, setJobs] = useState([])
  const [applications, setApplications] = useState([])
  const [loadingData, setLoadingData] = useState(true)
  const [savingBranding, setSavingBranding] = useState(false)
  const [postingJob, setPostingJob] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState('success')

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
    skills: '',
    salary_range: '',
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
      .select('id, status, cv_url, candidate_id, job_id, jobs!inner(id, title, employer_id), profiles(full_name)')
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
        logoUrl = await uploadFile('logos', logoFile, `company-${user.id}`)
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
        requirements: jobForm.description.trim(),
        skills: skillsArray,
        salary_range: jobForm.salary_range.trim() || null,
        status: 'pending',
      }

      const { error } = await supabase.from('jobs').insert([payload])
      if (error) throw error

      setJobForm({
        title: '',
        description: '',
        skills: '',
        salary_range: '',
      })
      publishMessage('success', 'Job posted successfully and sent for admin approval.')
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
  }

  const handleDownloadCv = async (cvUrl) => {
    if (!cvUrl) return

    if (cvUrl.startsWith('http')) {
      window.open(cvUrl, '_blank', 'noopener,noreferrer')
      return
    }

    const { data, error } = await supabase.storage.from('cvs').createSignedUrl(cvUrl, 300)
    if (error || !data?.signedUrl) {
      publishMessage('error', 'Unable to generate CV download link.')
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
            <h2 className="text-xl font-bold text-primary mb-4">Post a Job</h2>
            <form onSubmit={handleJobPost} className="space-y-4">
              <Input label="Title" name="title" value={jobForm.title} onChange={handleJobChange} required />
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
              <Input label="Skills Required (comma separated)" name="skills" value={jobForm.skills} onChange={handleJobChange} placeholder="React, Node.js, SQL" />
              <Input label="Salary" name="salary_range" value={jobForm.salary_range} onChange={handleJobChange} placeholder="120k - 180k DZD" />
              <Button type="submit" loading={postingJob} disabled={postingJob}>
                Add Job Listing
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
                        <select
                          className="input max-w-[150px]"
                          value={application.status}
                          onChange={(e) => handleStatusUpdate(application.id, e.target.value)}
                        >
                          <option value="pending">Pending</option>
                          <option value="accepted">Accept</option>
                          <option value="rejected">Reject</option>
                        </select>
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
    </div>
  )
}

export default EmployerDashboard
