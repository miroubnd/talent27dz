import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { Navbar } from '../../components/layout'
import { Card, Button, Input } from '../../components/ui'
import { ChevronLeft, Send, Sparkles } from 'lucide-react'

const PostJob = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    requirements: '',
    salary_range: '',
    location: '',
    job_type: 'full-time',
    sector: '',
    deadline: '',
    skills: ''
  })

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { error } = await supabase
        .from('jobs')
        .insert([{
          ...formData,
          employer_id: user.id,
          skills: formData.skills.split(',').map(s => s.trim()),
          status: 'pending' // Requires Admin Approval
        }])

      if (error) throw error

      alert('Job post submitted for approval!')
      navigate('/dashboard/employer')
    } catch (err) {
      alert(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-surface-dark">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <button 
          onClick={() => navigate('/dashboard/employer')}
          className="flex items-center text-secondary hover:text-primary mb-8"
        >
          <ChevronLeft size={20} className="mr-1" /> Back to Dashboard
        </button>

        <header className="mb-10">
           <h1 className="text-3xl font-bold text-primary">Post a New Job</h1>
           <p className="text-secondary mt-1 text-lg">Your post will be reviewed by our team before going live.</p>
        </header>

        <form onSubmit={handleSubmit} className="space-y-8">
           <Card className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 <div className="md:col-span-2">
                    <Input label="Job Title" name="title" required placeholder="e.g. Senior Frontend Developer" onChange={handleChange} />
                 </div>
                 
                 <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-primary/80">Job Type</label>
                    <select name="job_type" className="input" onChange={handleChange} required>
                       <option value="full-time">Full-time</option>
                       <option value="part-time">Part-time</option>
                       <option value="remote">Remote</option>
                       <option value="freelance">Freelance</option>
                       <option value="internship">Internship</option>
                    </select>
                 </div>

                 <Input label="Location" name="location" required placeholder="e.g. Algiers" onChange={handleChange} />
                 <Input label="Sector" name="sector" required placeholder="e.g. IT, Energy" onChange={handleChange} />
                 <Input label="Salary Range" name="salary_range" placeholder="e.g. 150k - 200k DZD" onChange={handleChange} />
                 <Input label="Application Deadline" name="deadline" type="date" required onChange={handleChange} />
                 
                 <div className="md:col-span-2">
                    <Input 
                      label="Skills (Comma separated)" 
                      name="skills" 
                      placeholder="e.g. React, Tailwind, PostgreSQL" 
                      onChange={handleChange} 
                    />
                 </div>

                 <div className="md:col-span-2">
                    <label className="text-sm font-semibold text-primary/80">Job Description</label>
                    <textarea 
                      name="description" 
                      className="input mt-1 min-h-[150px]" 
                      required 
                      onChange={handleChange}
                    ></textarea>
                 </div>

                 <div className="md:col-span-2">
                    <label className="text-sm font-semibold text-primary/80">Requirements</label>
                    <textarea 
                      name="requirements" 
                      className="input mt-1 min-h-[150px]" 
                      required 
                      onChange={handleChange}
                    ></textarea>
                 </div>
              </div>

              <div className="mt-12 flex justify-end">
                 <Button type="submit" className="h-12 px-12 text-lg" loading={loading}>
                    <Send size={20} className="mr-2" /> {loading ? 'Submitting...' : 'Post Job'}
                 </Button>
              </div>
           </Card>

           <div className="bg-accent/10 border border-accent/20 rounded-xl p-6 flex items-start gap-4">
              <Sparkles className="text-accent shrink-0" />
              <div>
                 <p className="text-sm font-bold text-accent uppercase tracking-wider">Note</p>
                 <p className="text-sm text-primary/80 mt-1">Our moderation team typically reviews and approves job posts within 24 hours. You will receive a notification once it is live.</p>
              </div>
           </div>
        </form>
      </main>
    </div>
  )
}

export default PostJob
