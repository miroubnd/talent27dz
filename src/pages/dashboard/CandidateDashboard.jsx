import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { Navbar } from '../../components/layout'
import { Card, Badge, Button, Input } from '../../components/ui'
import { uploadFile } from '../../lib/storage'
import { Briefcase, Calendar, ExternalLink, User, Tag, Plus, X, Search, MapPin, DollarSign, Filter, Pencil, Save, Loader2, FileText } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const CandidateDashboard = () => {
  const { user, profile, refreshProfile, refreshUser } = useAuth()
  const navigate = useNavigate()
  const [applications, setApplications] = useState([])
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('applications') // 'applications' | 'marketplace'
  
  // Skills state
  const [skills, setSkills] = useState([])
  const [newSkill, setNewSkill] = useState('')
  const [isUpdatingSkills, setIsUpdatingSkills] = useState(false)

  // Filters state
  const [categoryFilter, setCategoryFilter] = useState('')
  const [salaryFilter, setSalaryFilter] = useState('')
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false)
  const [isSavingProfile, setIsSavingProfile] = useState(false)
  const [profileMessage, setProfileMessage] = useState('')
  const [profileError, setProfileError] = useState('')
  const [avatarPreview, setAvatarPreview] = useState('')
  const [cvViewUrl, setCvViewUrl] = useState('')
  const [editForm, setEditForm] = useState({
    full_name: '',
    email: '',
  })
  const [editFiles, setEditFiles] = useState({
    avatar: null,
    cv: null,
  })

  useEffect(() => {
    if (user) {
      fetchApplications()
      fetchJobs()
      if (profile?.specializations) {
        setSkills(Array.isArray(profile.specializations) ? profile.specializations : [])
      }
    }
  }, [user, profile])

  useEffect(() => {
    setEditForm({
      full_name: profile?.full_name || '',
      email: user?.email || '',
    })
  }, [profile?.full_name, user?.email])

  useEffect(() => {
    if (!profile?.avatar_url) {
      setAvatarPreview('')
      return
    }
    resolveStorageAsset('avatars', profile.avatar_url).then((url) => setAvatarPreview(url || ''))
  }, [profile?.avatar_url])

  useEffect(() => {
    if (!profile?.cv_url) {
      setCvViewUrl('')
      return
    }
    resolveStorageAsset('cvs', profile.cv_url).then((url) => setCvViewUrl(url || ''))
  }, [profile?.cv_url])

  const resolveStorageAsset = async (bucket, value) => {
    if (!value) return ''
    if (value.startsWith('http')) return value

    const { data: signed, error: signedError } = await supabase.storage
      .from(bucket)
      .createSignedUrl(value, 3600)

    if (!signedError && signed?.signedUrl) return signed.signedUrl

    const { data } = supabase.storage.from(bucket).getPublicUrl(value)
    return data?.publicUrl || ''
  }

  const fetchApplications = async () => {
    // RLS ensures the user only sees their own applications
    const { data } = await supabase
      .from('applications')
      .select('*, jobs(title, salary_range, location, profiles(company_name))')
      .eq('candidate_id', user.id)
      .order('created_at', { ascending: false })

    if (data) setApplications(data)
    setLoading(false)
  }

  const fetchJobs = async () => {
    const { data } = await supabase
      .from('jobs')
      .select('*, profiles(company_name)')
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
    
    if (data) setJobs(data)
  }

  const handleAddSkill = async (e) => {
    e.preventDefault()
    if (!newSkill.trim() || skills.length >= 3) return
    
    const updatedSkills = [...skills, newSkill.trim()]
    setSkills(updatedSkills)
    setNewSkill('')
    
    await saveSkills(updatedSkills)
  }

  const handleRemoveSkill = async (skillToRemove) => {
    const updatedSkills = skills.filter(s => s !== skillToRemove)
    setSkills(updatedSkills)
    await saveSkills(updatedSkills)
  }

  const saveSkills = async (updatedSkills) => {
    setIsUpdatingSkills(true)
    await supabase
      .from('profiles')
      .update({ specializations: updatedSkills })
      .eq('id', user.id)
    setIsUpdatingSkills(false)
  }

  const handleApply = (jobId) => {
    // Navigating to JobDetails where application happens
    navigate(`/jobs/${jobId}`)
  }

  const handleEditFormChange = (e) => {
    setEditForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleEditFileChange = (e, type) => {
    setEditFiles((prev) => ({ ...prev, [type]: e.target.files?.[0] || null }))
  }

  const openCv = async () => {
    if (!profile?.cv_url) return
    const target = cvViewUrl || (await resolveStorageAsset('cvs', profile.cv_url))
    if (target) {
      window.open(target, '_blank', 'noopener,noreferrer')
    }
  }

  const handleProfileUpdate = async (e) => {
    e.preventDefault()
    setIsSavingProfile(true)
    setProfileMessage('')
    setProfileError('')

    try {
      const normalizedName = editForm.full_name.trim()
      const normalizedEmail = editForm.email.trim()
      const hasNameChange = normalizedName !== (profile?.full_name || '')
      const hasEmailChange = normalizedEmail !== (user?.email || '')
      const hasAvatarChange = Boolean(editFiles.avatar)
      const hasCvChange = Boolean(editFiles.cv)

      if (!hasNameChange && !hasEmailChange && !hasAvatarChange && !hasCvChange) {
        setProfileMessage('No changes to save.')
        setIsEditProfileOpen(false)
        return
      }

      let avatarUrl = profile?.avatar_url || ''
      let cvUrl = profile?.cv_url || ''

      if (editFiles.avatar) {
        avatarUrl = await uploadFile('avatars', editFiles.avatar, `${user.id}-avatar`)
      }
      if (editFiles.cv) {
        cvUrl = await uploadFile('cvs', editFiles.cv, `${user.id}-cv`)
      }

      const { error: profileUpdateError } = await supabase
        .from('profiles')
        .update({
          full_name: normalizedName,
          avatar_url: avatarUrl,
          cv_url: cvUrl,
        })
        .eq('id', user.id)

      if (profileUpdateError) throw profileUpdateError

      if (hasEmailChange) {
        const { error: emailError } = await supabase.auth.updateUser({
          email: normalizedEmail,
        })
        if (emailError) throw emailError
      }

      await refreshProfile()
      await refreshUser()

      if (avatarUrl) {
        const resolvedAvatar = await resolveStorageAsset('avatars', avatarUrl)
        setAvatarPreview(resolvedAvatar || avatarUrl)
      }
      if (cvUrl) {
        const resolvedCv = await resolveStorageAsset('cvs', cvUrl)
        setCvViewUrl(resolvedCv || cvUrl)
      }

      setEditFiles({ avatar: null, cv: null })
      setProfileMessage('Profile updated successfully.')
      setIsEditProfileOpen(false)
    } catch (err) {
      setProfileError(err.message || 'Unable to update profile.')
    } finally {
      setIsSavingProfile(false)
    }
  }

  const filteredJobs = jobs.filter(job => {
    const matchCategory = categoryFilter ? (job.sector?.toLowerCase() || '').includes(categoryFilter.toLowerCase()) : true
    const matchSalary = salaryFilter ? (job.salary_range?.toLowerCase() || '').includes(salaryFilter.toLowerCase()) : true
    return matchCategory && matchSalary
  })

  return (
    <div className="min-h-screen bg-[#0A101D] text-white selection:bg-accent/30 font-sans">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Left Sidebar: Profile & Skills */}
          <div className="lg:col-span-1 space-y-6">
            {/* Profile Overview Card */}
            <div className="bg-[#131E33] border border-[#253655] rounded-xl shadow-xl p-6 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-accent to-accent/50"></div>
              
              <div className="text-center mb-6">
                <div className="relative inline-block">
                  <img 
                    src={avatarPreview || `https://ui-avatars.com/api/?name=${profile?.full_name}&background=1B2A4A&color=C9A84C`}
                    className="w-24 h-24 rounded-full border-2 border-accent mx-auto mb-4 object-cover shadow-[0_0_15px_rgba(201,168,76,0.3)]"
                    alt="avatar"
                  />
                </div>
                <h2 className="text-2xl font-bold text-white">{profile?.full_name}</h2>
                <p className="text-sm text-accent tracking-wide">{profile?.sector || 'Professional Candidate'}</p>
              </div>
              
              <div className="space-y-4 border-t border-[#253655] pt-6">
                <div className="flex items-center text-sm text-gray-300">
                  <User size={16} className="mr-3 text-accent" />
                  <span className="truncate">{user?.email}</span>
                </div>
                {profile?.cv_url && (
                  <button
                    onClick={openCv}
                    className="flex items-center text-sm text-accent font-semibold hover:text-white transition-colors"
                  >
                    <ExternalLink size={16} className="mr-3" /> View CV
                  </button>
                )}
                <button
                  onClick={() => {
                    setProfileMessage('')
                    setProfileError('')
                    setIsEditProfileOpen(true)
                  }}
                  className="w-full mt-4 py-2 bg-transparent border border-[#253655] text-white rounded-lg hover:bg-[#1B2A4A] transition-colors text-sm font-medium inline-flex items-center justify-center gap-2"
                >
                  <Pencil size={14} /> Edit Profile
                </button>
                {profileMessage && <p className="text-xs text-green-400">{profileMessage}</p>}
              </div>
            </div>

            {/* Skill Tags Section */}
            <div className="bg-[#131E33] border border-[#253655] rounded-xl shadow-xl p-6 relative overflow-hidden">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center">
                <Tag size={18} className="mr-2 text-accent" />
                Specialized Fields
              </h3>
              <p className="text-xs text-gray-400 mb-4">Add up to 3 key skills or fields.</p>
              
              <div className="flex flex-wrap gap-2 mb-4">
                {(skills || []).map((skill, index) => (
                  <div key={index} className="flex items-center bg-[#1B2A4A] border border-accent/30 text-accent px-3 py-1 rounded-full text-sm">
                    {skill}
                    <button 
                      onClick={() => handleRemoveSkill(skill)}
                      className="ml-2 hover:text-white transition-colors"
                      disabled={isUpdatingSkills}
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>

              {skills.length < 3 && (
                <form onSubmit={handleAddSkill} className="flex gap-2">
                  <input
                    type="text"
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    placeholder="e.g. React.js"
                    className="flex-1 bg-[#0A101D] border border-[#253655] rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-accent"
                    disabled={isUpdatingSkills}
                  />
                  <button 
                    type="submit"
                    className="bg-accent/10 text-accent border border-accent/20 rounded-lg p-1.5 hover:bg-accent/20 transition-colors"
                    disabled={isUpdatingSkills || !newSkill.trim()}
                  >
                    <Plus size={18} />
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-3">
            
            {/* Tabs */}
            <div className="flex space-x-1 bg-[#131E33] p-1 rounded-xl border border-[#253655] mb-8 inline-flex">
              <button
                onClick={() => setActiveTab('applications')}
                className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  activeTab === 'applications' 
                    ? 'bg-accent text-[#0A101D] shadow-lg' 
                    : 'text-gray-400 hover:text-white hover:bg-[#1B2A4A]'
                }`}
              >
                My Applications
              </button>
              <button
                onClick={() => setActiveTab('marketplace')}
                className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  activeTab === 'marketplace' 
                    ? 'bg-accent text-[#0A101D] shadow-lg' 
                    : 'text-gray-400 hover:text-white hover:bg-[#1B2A4A]'
                }`}
              >
                Job Marketplace
              </button>
            </div>

            {/* Tab Content: My Applications */}
            {activeTab === 'applications' && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <header className="mb-6 flex justify-between items-end">
                  <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">Application History</h1>
                    <p className="text-gray-400 mt-1">Track and manage your submitted applications.</p>
                  </div>
                  <div className="bg-[#131E33] px-4 py-2 rounded-lg border border-[#253655] flex items-center shadow-lg">
                     <div className="text-center px-4 border-r border-[#253655]">
                        <p className="text-xs text-gray-400 mb-0.5">Total</p>
                        <p className="font-bold text-white">{applications.length}</p>
                     </div>
                     <div className="text-center px-4">
                        <p className="text-xs text-gray-400 mb-0.5">Pending</p>
                        <p className="font-bold text-accent">{applications.filter(a => a.status === 'pending').length}</p>
                     </div>
                  </div>
                </header>

                {loading ? (
                  <div className="space-y-4">
                    {[1,2,3].map(i => <div key={i} className="h-24 bg-[#131E33] animate-pulse rounded-xl border border-[#253655]"></div>)}
                  </div>
                ) : applications.length > 0 ? (
                  <div className="bg-[#131E33] rounded-xl border border-[#253655] overflow-hidden shadow-xl">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="bg-[#0A101D] border-b border-[#253655]">
                            <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Job Details</th>
                            <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Date Applied</th>
                            <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#253655]">
                          {applications.map((app) => (
                            <tr key={app.id} className="hover:bg-[#1B2A4A]/50 transition-colors">
                              <td className="px-6 py-5">
                                 <p className="font-bold text-white text-base">{app.jobs?.title}</p>
                                 <p className="text-sm text-accent">{app.jobs?.profiles?.company_name}</p>
                              </td>
                              <td className="px-6 py-5">
                                 <p className="text-sm text-gray-300 flex items-center">
                                   <Calendar size={14} className="mr-2 text-gray-500" />
                                   {new Date(app.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                                 </p>
                              </td>
                              <td className="px-6 py-5">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                                  (app.status || 'pending') === 'accepted' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                                  (app.status || 'pending') === 'rejected' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                                  'bg-accent/10 text-accent border-accent/20'
                                }`}>
                                  {(app.status || 'pending').charAt(0).toUpperCase() + (app.status || 'pending').slice(1)}
                                </span>
                              </td>
                              <td className="px-6 py-5 text-right">
                                 <button 
                                  onClick={() => navigate(`/jobs/${app.job_id}`)}
                                  className="text-sm font-medium text-gray-400 hover:text-white transition-colors"
                                 >
                                   View Job &rarr;
                                 </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-20 bg-[#131E33] rounded-xl border border-[#253655] shadow-xl">
                    <div className="w-16 h-16 bg-[#1B2A4A] rounded-full flex items-center justify-center mx-auto mb-4">
                      <Briefcase size={28} className="text-accent" />
                    </div>
                    <h3 className="text-xl font-bold text-white">No applications yet</h3>
                    <p className="text-gray-400 mt-2 mb-6 max-w-sm mx-auto">You haven't applied to any jobs. Discover opportunities in the marketplace.</p>
                    <button 
                      onClick={() => setActiveTab('marketplace')}
                      className="px-6 py-2.5 bg-accent text-[#0A101D] font-bold rounded-lg hover:bg-accent-light transition-colors"
                    >
                      Browse Jobs
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Tab Content: Job Marketplace */}
            {activeTab === 'marketplace' && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <header className="mb-6 flex flex-col md:flex-row md:justify-between md:items-end gap-4">
                  <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">Job Marketplace</h1>
                    <p className="text-gray-400 mt-1">Discover and apply to top roles.</p>
                  </div>
                  
                  {/* Filters */}
                  <div className="flex gap-3">
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Filter size={14} className="text-gray-400" />
                      </div>
                      <input 
                        type="text" 
                        placeholder="Filter category..."
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        className="pl-9 pr-4 py-2 bg-[#131E33] border border-[#253655] rounded-lg text-sm text-white focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                      />
                    </div>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <DollarSign size={14} className="text-gray-400" />
                      </div>
                      <input 
                        type="text" 
                        placeholder="Filter salary..."
                        value={salaryFilter}
                        onChange={(e) => setSalaryFilter(e.target.value)}
                        className="pl-9 pr-4 py-2 bg-[#131E33] border border-[#253655] rounded-lg text-sm text-white focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                      />
                    </div>
                  </div>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {filteredJobs.map(job => (
                    <div key={job.id} className="bg-[#131E33] border border-[#253655] rounded-xl p-6 hover:border-accent/50 transition-all shadow-lg group relative overflow-hidden">
                      {/* Glow effect on hover */}
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80%] h-[200px] bg-accent/20 blur-[80px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                      
                      <div className="flex justify-between items-start mb-4 relative z-10">
                        <div>
                          <h3 className="text-lg font-bold text-white mb-1">{job.title}</h3>
                          <p className="text-sm text-accent">{job.profiles?.company_name}</p>
                        </div>
                        {job.job_type && (
                          <span className="px-2.5 py-1 bg-[#1B2A4A] text-gray-300 text-xs rounded-md border border-[#253655]">
                            {job.job_type}
                          </span>
                        )}
                      </div>
                      
                      <div className="space-y-2 mb-6 relative z-10">
                        <div className="flex items-center text-sm text-gray-400">
                          <MapPin size={14} className="mr-2 text-gray-500" />
                          {job.location || 'Remote / Unspecified'}
                        </div>
                        <div className="flex items-center text-sm text-gray-400">
                          <DollarSign size={14} className="mr-2 text-gray-500" />
                          {job.salary_range || 'Competitive'}
                        </div>
                        <div className="flex items-center text-sm text-gray-400">
                          <Briefcase size={14} className="mr-2 text-gray-500" />
                          {job.sector || 'Various'}
                        </div>
                      </div>

                      <div className="flex gap-3 relative z-10">
                        <button 
                          onClick={() => navigate(`/jobs/${job.id}`)}
                          className="flex-1 py-2 bg-transparent border border-[#253655] text-white rounded-lg hover:bg-[#1B2A4A] transition-colors text-sm font-medium"
                        >
                          View Details
                        </button>
                        <button 
                          onClick={() => handleApply(job.id)}
                          className="flex-1 py-2 bg-accent text-[#0A101D] font-bold rounded-lg hover:bg-[#D4B96F] transition-colors text-sm"
                        >
                          Apply Now
                        </button>
                      </div>
                    </div>
                  ))}

                  {filteredJobs.length === 0 && (
                    <div className="col-span-full text-center py-12 text-gray-400 bg-[#131E33] rounded-xl border border-[#253655]">
                      No jobs found matching your criteria.
                    </div>
                  )}
                </div>
              </div>
            )}
            
          </div>
        </div>
      </main>

      {isEditProfileOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm px-4 py-6 overflow-y-auto">
          <div className="max-w-xl mx-auto bg-[#131E33] border border-[#253655] rounded-xl shadow-2xl p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold text-white">Edit Profile</h2>
              <button
                onClick={() => setIsEditProfileOpen(false)}
                className="p-2 text-gray-400 hover:text-white hover:bg-[#1B2A4A] rounded-lg"
              >
                <X size={16} />
              </button>
            </div>

            {profileError && (
              <div className="mb-4 p-3 rounded-lg border border-red-500/30 bg-red-500/10 text-sm text-red-300">
                {profileError}
              </div>
            )}

            <form onSubmit={handleProfileUpdate} className="space-y-4">
              <Input
                label="Full Name"
                name="full_name"
                value={editForm.full_name}
                onChange={handleEditFormChange}
                required
                className="bg-[#0A101D] border-[#253655] text-white"
              />
              <Input
                label="Email Address"
                name="email"
                type="email"
                value={editForm.email}
                onChange={handleEditFormChange}
                required
                className="bg-[#0A101D] border-[#253655] text-white"
              />

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-white/80">Avatar (Upload/Replace)</label>
                <label className="flex items-center justify-center gap-2 w-full px-4 py-3 border-2 border-dashed border-[#253655] rounded-lg cursor-pointer hover:border-accent hover:bg-[#1B2A4A] transition-colors">
                  <User size={16} className="text-accent" />
                  <span className="text-sm text-gray-300">{editFiles.avatar ? editFiles.avatar.name : 'Choose avatar image'}</span>
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => handleEditFileChange(e, 'avatar')} />
                </label>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-white/80">CV / Resume (Upload/Replace)</label>
                <label className="flex items-center justify-center gap-2 w-full px-4 py-3 border-2 border-dashed border-[#253655] rounded-lg cursor-pointer hover:border-accent hover:bg-[#1B2A4A] transition-colors">
                  <FileText size={16} className="text-accent" />
                  <span className="text-sm text-gray-300">{editFiles.cv ? editFiles.cv.name : 'Choose CV file (PDF preferred)'}</span>
                  <input type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={(e) => handleEditFileChange(e, 'cv')} />
                </label>
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => setIsEditProfileOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSavingProfile}>
                  {isSavingProfile ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save size={16} className="mr-2" />}
                  {isSavingProfile ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default CandidateDashboard

