import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { uploadFile } from '../../lib/storage'
import { Button, Input, Card } from '../../components/ui'
import { User, Building2, ChevronLeft, Upload, CheckCircle2, Loader2 } from 'lucide-react'

const Register = () => {
  const [step, setStep] = useState(1)
  const [role, setRole] = useState('') // candidate or employer
  const [loading, setLoading] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    company_name: '',
    registration_number: '',
    location: '',
    sector: '',
    contact_email: '',
    bio: '',
  })

  const [files, setFiles] = useState({
    avatar: null,
    cv: null,
    logo: null,
  })

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleFileChange = (e, type) => {
    setFiles({ ...files, [type]: e.target.files[0] })
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // 1. Auth Signup
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
      })

      if (authError) throw authError

      const userId = authData.user.id

      // 2. Upload Files
      let avatarUrl = ''
      let cvUrl = ''
      let logoUrl = ''

      try {
        if (role === 'candidate') {
          if (files.avatar || files.cv) {
            setIsUploading(true)
            if (files.avatar) avatarUrl = await uploadFile('avatars', files.avatar, userId)
            if (files.cv) cvUrl = await uploadFile('cv_uploads', files.cv, userId)
          }
        } else {
          if (files.logo) {
            setIsUploading(true)
            logoUrl = await uploadFile('logos', files.logo, userId)
          }
        }
      } catch (uploadErr) {
        console.error('File upload failed during registration:', uploadErr)
        // We continue anyway so the profile is created, preventing a "ghost user"
        // Users can re-upload files from their dashboard.
      } finally {
        setIsUploading(false)
      }

      // 3. Create Profile
      const profileData = {
        id: userId,
        role,
        ...(role === 'candidate' ? {
          full_name: formData.full_name,
          avatar_url: avatarUrl,
          cv_url: cvUrl,
          specializations: [], // Admin can enforce selection later
        } : {
          company_name: formData.company_name,
          registration_number: formData.registration_number,
          location: formData.location,
          sector: formData.sector,
          contact_email: formData.contact_email,
          bio: formData.bio,
          logo_url: logoUrl,
        })
      }

      const { error: profileError } = await supabase
        .from('profiles')
        .insert([profileData])

      if (profileError) throw profileError

      navigate(
        role === 'candidate' ? '/dashboard/candidate' : '/dashboard/employer',
        { replace: true },
      )
    } catch (err) {
      setError(err.message)
      setLoading(false)
      setIsUploading(false)
    }
  }

  return (
    <div className="min-h-screen bg-surface-dark flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <Link to="/" className="text-3xl font-bold text-primary">
            Talent<span className="text-accent underline decoration-2 underline-offset-8">DZ</span>
          </Link>
          <div className="mt-8 flex items-center justify-center space-x-4">
             <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${step >= 1 ? 'border-accent bg-accent text-white' : 'border-border'}`}>1</div>
             <div className={`w-12 h-0.5 ${step >= 2 ? 'bg-accent' : 'bg-border'}`}></div>
             <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${step >= 2 ? 'border-accent bg-accent text-white' : 'border-border'}`}>2</div>
          </div>
          <h1 className="mt-6 text-2xl font-bold text-primary">
            {step === 1 ? 'Join TalentDZ' : `Setup your ${role} account`}
          </h1>
          <p className="text-secondary mt-2">
            {step === 1 ? 'Select your role to get started' : 'Provide your professional details'}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-error/10 border border-error/20 text-error text-sm rounded-lg">
            {error}
          </div>
        )}

        {/* Step 1: Role Selection */}
        {step === 1 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <button
              onClick={() => { setRole('candidate'); setStep(2); }}
              className="flex flex-col items-center p-8 border-2 border-border rounded-xl hover:border-accent hover:bg-accent/5 transition-all group"
            >
              <div className="w-16 h-16 bg-surface-dark rounded-full flex items-center justify-center mb-4 group-hover:bg-accent/10">
                <User size={32} className="text-primary group-hover:text-accent" />
              </div>
              <h3 className="font-bold text-primary text-xl">Candidate</h3>
              <p className="text-center text-secondary text-sm mt-2">I want to find my dream job in Algeria's top companies</p>
            </button>

            <button
              onClick={() => { setRole('employer'); setStep(2); }}
              className="flex flex-col items-center p-8 border-2 border-border rounded-xl hover:border-accent hover:bg-accent/5 transition-all group"
            >
              <div className="w-16 h-16 bg-surface-dark rounded-full flex items-center justify-center mb-4 group-hover:bg-accent/10">
                <Building2 size={32} className="text-primary group-hover:text-accent" />
              </div>
              <h3 className="font-bold text-primary text-xl">Employer</h3>
              <p className="text-center text-secondary text-sm mt-2">I want to hire elite Algerian talent for my organization</p>
            </button>
          </div>
        )}

        {/* Step 2: Form */}
        {step === 2 && (
          <form onSubmit={handleRegister} className="space-y-6">
            <button 
              type="button" 
              onClick={() => setStep(1)}
              className="flex items-center text-sm text-secondary hover:text-primary mb-4"
            >
              <ChevronLeft size={16} className="mr-1" /> Back to role selection
            </button>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input label="Email Address" type="email" name="email" required onChange={handleInputChange} />
              <Input label="Password" type="password" name="password" required onChange={handleInputChange} />
              
              {role === 'candidate' ? (
                <>
                  <Input label="Full Name" name="full_name" required onChange={handleInputChange} />
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-primary/80">Avatar Photo</label>
                    <div className="relative group">
                       <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'avatar')} className="hidden" id="avatar" />
                       <label htmlFor="avatar" className="flex items-center justify-center w-full px-4 py-2 border-2 border-dashed border-border rounded-lg cursor-pointer group-hover:border-accent group-hover:bg-accent/5">
                         <Upload size={18} className="mr-2 text-secondary group-hover:text-accent" />
                         <span className="text-sm text-secondary group-hover:text-accent">{files.avatar ? files.avatar.name : 'Choose Image'}</span>
                       </label>
                    </div>
                  </div>
                  <div className="md:col-span-2 space-y-1.5">
                    <label className="text-sm font-semibold text-primary/80">Resume (PDF)</label>
                    <div className="relative group">
                       <input type="file" accept=".pdf" required onChange={(e) => handleFileChange(e, 'cv')} className="hidden" id="cv" />
                       <label htmlFor="cv" className="flex items-center justify-center w-full px-4 py-12 border-2 border-dashed border-border rounded-lg cursor-pointer group-hover:border-accent group-hover:bg-accent/5">
                         <div className="text-center">
                            <Upload size={32} className="mx-auto mb-2 text-secondary group-hover:text-accent" />
                            <p className="text-sm font-medium text-primary">Click to upload CV</p>
                            <p className="text-xs text-secondary mt-1">{files.cv ? files.cv.name : 'Support only PDF format'}</p>
                         </div>
                       </label>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <Input label="Company Name" name="company_name" required onChange={handleInputChange} />
                  <Input label="Registration Number" name="registration_number" required onChange={handleInputChange} />
                  <Input label="Location" name="location" placeholder="e.g. Algiers, Algeria" required onChange={handleInputChange} />
                  <Input label="Sector" name="sector" placeholder="e.g. IT, Energy" required onChange={handleInputChange} />
                  <Input label="Contact Email" type="email" name="contact_email" required onChange={handleInputChange} />
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-primary/80">Company Logo</label>
                    <div className="relative group">
                       <input type="file" accept="image/*" required onChange={(e) => handleFileChange(e, 'logo')} className="hidden" id="logo" />
                       <label htmlFor="logo" className="flex items-center justify-center w-full px-4 py-2 border-2 border-dashed border-border rounded-lg cursor-pointer group-hover:border-accent group-hover:bg-accent/5">
                         <Upload size={18} className="mr-2 text-secondary group-hover:text-accent" />
                         <span className="text-sm text-secondary group-hover:text-accent">{files.logo ? files.logo.name : 'Choose Logo Image'}</span>
                       </label>
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-sm font-semibold text-primary/80">Company Bio</label>
                    <textarea 
                      name="bio"
                      className="input mt-1 min-h-[100px]"
                      placeholder="Tell candidates about your company..."
                      onChange={handleInputChange}
                    ></textarea>
                  </div>
                </>
              )}
            </div>

            <Button type="submit" className="w-full h-12 text-lg" disabled={loading || isUploading}>
              {loading || isUploading ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : null}
              {isUploading ? 'Uploading...' : loading ? 'Creating account...' : 'Complete Registration'}
            </Button>
          </form>
        )}

        <p className="mt-8 text-center text-sm text-secondary">
          Already have an account?{' '}
          <Link to="/login" className="text-accent font-bold hover:underline">
            Sign in
          </Link>
        </p>
      </Card>
    </div>
  )
}

export default Register
