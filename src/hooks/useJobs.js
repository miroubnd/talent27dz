import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export const useJobs = (filters = {}) => {
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchJobs()
  }, [JSON.stringify(filters)])

  const fetchJobs = async () => {
    setLoading(true)
    let query = supabase
      .from('jobs')
      .select('*, profiles(company_name, logo_url)')
      .eq('status', 'approved')

    if (filters.sector) query = query.eq('sector', filters.sector)
    if (filters.location) query = query.ilike('location', `%${filters.location}%`)
    if (filters.title) query = query.ilike('title', `%${filters.title}%`)
    if (filters.job_type) query = query.eq('job_type', filters.job_type)
    
    const { data } = await query.order('created_at', { ascending: false })

    if (data) setJobs(data)
    setLoading(false)
  }

  return { jobs, loading, refetch: fetchJobs }
}
