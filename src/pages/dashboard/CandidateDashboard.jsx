import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { Navbar } from '../../components/layout'
import { Card, Badge, Button, Input } from '../../components/ui'
import { Briefcase, Calendar, ExternalLink, User, Tag, Plus, X, Search, MapPin, DollarSign, Filter } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const CandidateDashboard = () => {
  const { user, profile } = useAuth()
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

  useEffect(() => {
    if (user) {
      fetchApplications()
      fetchJobs()
      if (profile?.specializations) {
        setSkills(Array.isArray(profile.specializations) ? profile.specializations : [])
      }
    }
  }, [user, profile])

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
                    src={profile?.avatar_url || `https://ui-avatars.com/api/?name=${profile?.full_name}&background=1B2A4A&color=C9A84C`}
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
                  <a 
                    href={profile.cv_url} 
                    target="_blank" 
                    rel="noreferrer"
                    className="flex items-center text-sm text-accent font-semibold hover:text-white transition-colors"
                  >
                    <ExternalLink size={16} className="mr-3" /> View Uploaded CV
                  </a>
                )}
                <button className="w-full mt-4 py-2 bg-transparent border border-[#253655] text-white rounded-lg hover:bg-[#1B2A4A] transition-colors text-sm font-medium">
                  Edit Profile
                </button>
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
    </div>
  )
}

export default CandidateDashboard

