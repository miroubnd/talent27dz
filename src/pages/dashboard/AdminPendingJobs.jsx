import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { Navbar } from '../../components/layout'
import { Card, Badge, Button } from '../../components/ui'
import {
  Briefcase,
  Building2,
  Calendar,
  Check,
  ChevronLeft,
  MapPin,
  RefreshCw,
  Shield,
  X,
} from 'lucide-react'

const AdminPendingJobs = () => {
  const [pendingJobs, setPendingJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [actionId, setActionId] = useState(null)
  const [message, setMessage] = useState({ type: '', text: '' })
  const [selectedId, setSelectedId] = useState(null)

  const fetchPendingJobs = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('jobs')
      .select('*, profiles(*)')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })

    if (error) {
      setMessage({ type: 'error', text: error.message })
      setPendingJobs([])
    } else {
      setPendingJobs(data || [])
      setMessage({ type: '', text: '' })
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchPendingJobs()
  }, [fetchPendingJobs])

  const setJobStatus = async (jobId, employerProfile, status) => {
    const job = pendingJobs.find((j) => j.id === jobId)
    const jobTitle = job?.title || 'Your job post'

    setActionId(jobId)
    setMessage({ type: '', text: '' })

    const { error } = await supabase.from('jobs').update({ status }).eq('id', jobId)

    if (error) {
      setMessage({ type: 'error', text: error.message })
      setActionId(null)
      return
    }

    await supabase.from('notifications').insert([
      {
        user_id: employerProfile.id,
        message: `Your job post "${jobTitle}" has been ${status}.`,
      },
    ])

    const destEmail = employerProfile.contact_email || employerProfile.email
    if (destEmail) {
      const subject =
        status === 'approved'
          ? 'Your job post has been approved — TalentDZ'
          : 'Your job post was not approved — TalentDZ'
      const content =
        status === 'approved'
          ? `Your job post "${jobTitle}" has been approved and is now live on TalentDZ.`
          : `Your job post "${jobTitle}" has been reviewed and was not approved at this time.`

      const { error: fnError } = await supabase.functions.invoke('send-email', {
        body: { to: destEmail, subject, content },
      })
      if (fnError) {
        console.warn('send-email function:', fnError.message)
      }
    }

    setPendingJobs((prev) => prev.filter((j) => j.id !== jobId))
    if (selectedId === jobId) setSelectedId(null)
    setMessage({
      type: 'success',
      text: status === 'approved' ? 'Job approved and employer notified.' : 'Job rejected and employer notified.',
    })
    setActionId(null)
  }

  const selected = pendingJobs.find((j) => j.id === selectedId) || null

  return (
    <div className="min-h-screen bg-surface-dark">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link
              to="/dashboard/admin"
              className="mb-3 inline-flex items-center text-sm font-medium text-secondary hover:text-primary"
            >
              <ChevronLeft size={18} className="mr-1" />
              Back to admin panel
            </Link>
            <h1 className="text-3xl font-bold text-primary flex items-center gap-2">
              <Shield className="text-accent" size={28} />
              Pending job postings
            </h1>
            <p className="text-secondary mt-1 max-w-2xl">
              Review employer submissions, approve listings to go live, or reject with notification to the company.
            </p>
          </div>
          <Button variant="outline" onClick={() => fetchPendingJobs()} disabled={loading} className="shrink-0">
            <RefreshCw size={16} className={`mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {message.text && (
          <div
            className={`mb-6 rounded-lg border px-4 py-3 text-sm ${
              message.type === 'error'
                ? 'border-error/30 bg-error/5 text-error'
                : 'border-success/20 bg-success/5 text-success'
            }`}
          >
            {message.text}
          </div>
        )}

        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card className="border-l-4 border-l-primary p-5">
            <p className="text-xs font-bold uppercase tracking-wider text-secondary">Queue</p>
            <p className="mt-1 text-2xl font-bold text-primary">{pendingJobs.length}</p>
            <p className="text-sm text-secondary">Awaiting your decision</p>
          </Card>
          <Card className="border-l-4 border-l-accent p-5">
            <p className="text-xs font-bold uppercase tracking-wider text-secondary">Role</p>
            <p className="mt-1 text-lg font-bold text-primary">Super admin</p>
            <p className="text-sm text-secondary">Moderation only</p>
          </Card>
          <Card className="border-l-4 border-l-success p-5">
            <p className="text-xs font-bold uppercase tracking-wider text-secondary">Tip</p>
            <p className="mt-1 text-sm text-secondary">
              Reject unclear or duplicate posts; approved jobs appear in the marketplace immediately.
            </p>
          </Card>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-28 animate-pulse rounded-xl border border-border bg-white/60" />
            ))}
          </div>
        ) : pendingJobs.length === 0 ? (
          <Card className="p-16 text-center">
            <Briefcase className="mx-auto mb-4 text-muted" size={48} />
            <h2 className="text-xl font-bold text-primary">No pending jobs</h2>
            <p className="mt-2 text-secondary">All submissions are reviewed. New posts will appear here.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
            <div className="space-y-4 lg:col-span-2">
              {pendingJobs.map((job) => (
                <button
                  key={job.id}
                  type="button"
                  onClick={() => setSelectedId(job.id)}
                  className={`w-full rounded-xl border p-4 text-left transition-all ${
                    selectedId === job.id
                      ? 'border-accent bg-accent/5 shadow-md ring-1 ring-accent/20'
                      : 'border-border bg-white hover:border-primary/30'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-bold text-primary">{job.title}</p>
                      <p className="mt-1 flex items-center text-sm text-secondary">
                        <Building2 size={14} className="mr-1 shrink-0" />
                        {job.profiles?.company_name || 'Company'}
                      </p>
                    </div>
                    <Badge status="pending">Pending</Badge>
                  </div>
                  <p className="mt-2 flex items-center text-xs text-secondary">
                    <Calendar size={12} className="mr-1" />
                    {new Date(job.created_at).toLocaleString()}
                  </p>
                </button>
              ))}
            </div>

            <Card className="p-6 lg:col-span-3">
              {selected ? (
                <>
                  <div className="mb-6 flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h2 className="text-2xl font-bold text-primary">{selected.title}</h2>
                      <p className="mt-2 text-secondary">{selected.profiles?.company_name}</p>
                      <div className="mt-3 flex flex-wrap gap-3 text-sm text-secondary">
                        {selected.location && (
                          <span className="flex items-center">
                            <MapPin size={14} className="mr-1" />
                            {selected.location}
                          </span>
                        )}
                        {selected.salary_range && (
                          <span className="font-medium text-primary">{selected.salary_range}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex shrink-0 flex-wrap gap-2">
                      <Button
                        variant="primary"
                        size="sm"
                        className="bg-success hover:bg-green-700"
                        disabled={actionId === selected.id}
                        onClick={() => setJobStatus(selected.id, selected.profiles, 'approved')}
                      >
                        <Check size={16} className="mr-2" />
                        Approve
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        disabled={actionId === selected.id}
                        onClick={() => setJobStatus(selected.id, selected.profiles, 'rejected')}
                      >
                        <X size={16} className="mr-2" />
                        Reject
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-primary">Description</h3>
                      <p className="mt-2 whitespace-pre-wrap text-sm text-secondary">{selected.description}</p>
                    </div>
                    {selected.requirements && (
                      <div>
                        <h3 className="text-xs font-bold uppercase tracking-wider text-primary">Requirements</h3>
                        <p className="mt-2 whitespace-pre-wrap text-sm text-secondary">{selected.requirements}</p>
                      </div>
                    )}
                    {Array.isArray(selected.skills) && selected.skills.length > 0 && (
                      <div>
                        <h3 className="text-xs font-bold uppercase tracking-wider text-primary">Skills</h3>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {selected.skills.map((s) => (
                            <span
                              key={s}
                              className="rounded-full bg-surface-dark px-3 py-1 text-xs font-medium text-primary"
                            >
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex min-h-[280px] flex-col items-center justify-center text-center text-secondary">
                  <Briefcase className="mb-3 text-muted" size={40} />
                  <p className="font-medium text-primary">Select a job</p>
                  <p className="mt-1 max-w-sm text-sm">Choose a listing on the left to read the full post and approve or reject.</p>
                </div>
              )}
            </Card>
          </div>
        )}
      </main>
    </div>
  )
}

export default AdminPendingJobs
