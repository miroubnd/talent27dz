import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useJobs } from '../../hooks/useJobs'
import { Navbar } from '../../components/layout'
import { Button, Input, Card, Badge } from '../../components/ui'
import { MapPin, Briefcase, DollarSign, Search, Filter } from 'lucide-react'

const JobMarketplace = () => {
  const [filters, setFilters] = useState({
    location: '',
    job_type: '',
    sector: '',
  })
  const { jobs, loading } = useJobs(filters)
  const navigate = useNavigate()

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value })
  }

  return (
    <div className="min-h-screen bg-surface-dark">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <header className="mb-12">
          <h1 className="text-4xl font-bold text-primary">Explore Opportunities</h1>
          <p className="text-secondary mt-2 text-lg">Find the perfect match for your skills in Algeria's growing market.</p>
        </header>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          <aside className="w-full lg:w-64 space-y-8">
            <Card className="p-6">
              <div className="flex items-center text-primary font-bold mb-6">
                <Filter size={18} className="mr-2" />
                Filters
              </div>
              
              <div className="space-y-6">
                <Input 
                  label="Location" 
                  name="location" 
                  placeholder="e.g. Algiers" 
                  value={filters.location}
                  onChange={handleFilterChange}
                />

                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-primary/80">Job Type</label>
                  <select 
                    name="job_type"
                    className="input"
                    value={filters.job_type}
                    onChange={handleFilterChange}
                  >
                    <option value="">All Types</option>
                    <option value="full-time">Full-time</option>
                    <option value="part-time">Part-time</option>
                    <option value="remote">Remote</option>
                    <option value="freelance">Freelance</option>
                    <option value="internship">Internship</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-primary/80">Sector</label>
                  <select 
                    name="sector"
                    className="input"
                    value={filters.sector}
                    onChange={handleFilterChange}
                  >
                    <option value="">All Sectors</option>
                    <option value="IT">IT & Tech</option>
                    <option value="Finance">Finance</option>
                    <option value="Engineering">Engineering</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Energy">Energy</option>
                  </select>
                </div>

                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => setFilters({ location: '', job_type: '', sector: '' })}
                >
                  Clear All
                </Button>
              </div>
            </Card>
          </aside>

          {/* Job Grid */}
          <div className="flex-1">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <div key={i} className="h-64 bg-white/50 animate-pulse rounded-xl border border-border"></div>
                ))}
              </div>
            ) : jobs.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {jobs.map((job) => (
                  <Card key={job.id} className="p-6 hover:shadow-lg transition-shadow border-t-4 border-t-accent/20">
                    <div className="flex items-start justify-between mb-4">
                      <img 
                        src={job.profiles?.logo_url || `https://ui-avatars.com/api/?name=${job.profiles?.company_name}&background=1B2A4A&color=fff`}
                        alt={job.profiles?.company_name}
                        className="w-12 h-12 rounded-lg border border-border object-contain bg-white"
                      />
                      <Badge status={job.job_type}>{job.job_type}</Badge>
                    </div>

                    <h3 className="text-lg font-bold text-primary mb-1 line-clamp-1">{job.title}</h3>
                    <p className="text-sm text-secondary font-medium mb-4">{job.profiles?.company_name}</p>

                    <div className="space-y-2 mb-6">
                      <div className="flex items-center text-xs text-secondary">
                        <MapPin size={14} className="mr-2 text-accent" />
                        {job.location}
                      </div>
                      <div className="flex items-center text-xs text-secondary">
                        <DollarSign size={14} className="mr-2 text-accent" />
                        {job.salary_range || 'Competitive'}
                      </div>
                    </div>

                    <Button 
                      className="w-full" 
                      onClick={() => navigate(`/jobs/${job.id}`)}
                    >
                      View Details
                    </Button>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-24 bg-white rounded-xl border border-border">
                <Search size={48} className="mx-auto text-muted mb-4" />
                <h3 className="text-xl font-bold text-primary">No jobs found</h3>
                <p className="text-secondary mt-2">Try adjusting your filters to find more opportunities.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

export default JobMarketplace
