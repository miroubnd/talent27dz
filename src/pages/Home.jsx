import { Link, useNavigate } from 'react-router-dom'
import { Navbar } from '../components/layout'
import { Button, Card } from '../components/ui'
import { CheckCircle2, TrendingUp, Users, ShieldCheck, ArrowRight, Zap, Globe, Award } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const Home = () => {
  const navigate = useNavigate()
  const { user } = useAuth()

  return (
    <div className="min-h-screen bg-surface-dark selection:bg-accent/30">
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-24 lg:pt-32 lg:pb-40">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-accent/5 blur-[120px] rounded-full -z-10"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl lg:text-7xl font-bold text-primary tracking-tight leading-tight mb-8">
            Connecting Elite Talent with <br className="hidden lg:block" />
            <span className="text-accent underline decoration-4 underline-offset-[12px]">Top Algerian Companies</span>
          </h1>
          <p className="max-w-2xl mx-auto text-xl text-secondary mb-12">
            TalentDZ is the premium marketplace for specialized professionals and visionary employers looking to build the future of Algeria.
          </p>
          {!user && (
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="lg" className="w-full sm:w-auto px-10 h-14 text-lg shadow-xl" onClick={() => navigate('/dashboard/candidate')}>
                Find Your Next Job <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <Button variant="secondary" size="lg" className="w-full sm:w-auto px-10 h-14 text-lg" onClick={() => navigate('/register')}>
                Post a Job Opening
              </Button>
            </div>
          )}

          <div className="mt-20 grid grid-cols-2 lg:grid-cols-4 gap-8 max-w-4xl mx-auto">
             <div className="text-center">
                <p className="text-3xl font-bold text-primary">2,500+</p>
                <p className="text-sm text-secondary">Active Jobs</p>
             </div>
             <div className="text-center">
                <p className="text-3xl font-bold text-primary">15k+</p>
                <p className="text-sm text-secondary">Vetted Talents</p>
             </div>
             <div className="text-center">
                <p className="text-3xl font-bold text-primary">500+</p>
                <p className="text-sm text-secondary">Top Companies</p>
             </div>
             <div className="text-center">
                <p className="text-3xl font-bold text-primary">98%</p>
                <p className="text-sm text-secondary">Success Rate</p>
             </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-white border-y border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-primary">Why Choose TalentDZ?</h2>
            <p className="text-secondary mt-2">Built for the professional Algerian ecosystem.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
             <FeatureItem 
              icon={<ShieldCheck className="text-accent" size={32} />}
              title="Verified Employers"
              description="Every company on our platform undergoes a strict verification process for your safety."
             />
             <FeatureItem 
              icon={<Zap className="text-accent" size={32} />}
              title="Fast Hiring"
              description="Direct communication between candidates and hiring managers for rapid decision making."
             />
             <FeatureItem 
              icon={<Award className="text-accent" size={32} />}
              title="Premium Interface"
              description="A clean, ad-free experience focused entirely on your professional growth."
             />
          </div>
        </div>
      </section>

      {/* Role Tabs Section */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
           <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-8">
                 <h2 className="text-4xl font-bold text-primary">Engineered for Candidates <br /> Designed for Employers</h2>
                 <p className="text-lg text-secondary">
                    Whether you're an engineer looking for a multi-national role or a startup founder scaling your operations, TalentDZ provides the tools you need.
                 </p>
                 <ul className="space-y-4">
                    <li className="flex items-center text-primary font-medium">
                       <CheckCircle2 className="text-success mr-3" size={20} /> Advanced filtering by sector and location
                    </li>
                    <li className="flex items-center text-primary font-medium">
                       <CheckCircle2 className="text-success mr-3" size={20} /> Real-time notifications on application state
                    </li>
                    <li className="flex items-center text-primary font-medium">
                       <CheckCircle2 className="text-success mr-3" size={20} /> Secure PDF storage for specialized CVs
                    </li>
                 </ul>
                 <Button variant="outline" className="mt-4" onClick={() => navigate('/register')}>Create Free Account</Button>
              </div>
              <div className="relative">
                 <Card className="p-8 shadow-2xl rotate-2 bg-primary text-white border-none">
                    <div className="flex items-center mb-6">
                       <div className="w-12 h-12 bg-accent rounded-lg flex items-center justify-center mr-4">
                          <TrendingUp className="text-primary" />
                       </div>
                       <h3 className="font-bold text-xl">High Matching Score</h3>
                    </div>
                    <p className="text-primary-light mb-8">
                       Our specialized algorithm ensures that candidates match perfectly with the company's culture and technical requirements.
                    </p>
                    <div className="space-y-3 opacity-60">
                       <div className="h-2 bg-white/20 rounded-full w-full"></div>
                       <div className="h-2 bg-white/20 rounded-full w-[80%]"></div>
                       <div className="h-2 bg-white/20 rounded-full w-[60%]"></div>
                    </div>
                 </Card>
                 <Card className="p-6 absolute -bottom-10 -left-10 shadow-xl w-64 bg-accent text-primary hidden md:block">
                    <p className="text-xs font-bold uppercase tracking-wider mb-2">New Match!</p>
                    <p className="text-sm font-medium italic">"Found my dream engineering job in Algiers within 2 weeks using TalentDZ."</p>
                 </Card>
              </div>
           </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-primary text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-8">
           <div className="text-2xl font-bold">
              Talent<span className="text-accent">DZ</span>
           </div>
           <div className="flex gap-8 text-sm text-primary-light">
              <a href="#" className="hover:text-accent">Terms</a>
              <a href="#" className="hover:text-accent">Privacy</a>
              <a href="#" className="hover:text-accent">Contact</a>
           </div>
           <p className="text-sm text-primary-light">© 2026 TalentDZ. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}

const FeatureItem = ({ icon, title, description }) => (
  <div className="text-left group cursor-default">
    <div className="w-16 h-16 bg-surface-dark rounded-2xl flex items-center justify-center mb-6 border border-border group-hover:bg-accent/10 group-hover:border-accent/40 transition-all duration-300">
      {icon}
    </div>
    <h3 className="text-xl font-bold text-primary mb-3">{title}</h3>
    <p className="text-secondary leading-relaxed">{description}</p>
  </div>
)

const Badge = ({ children, className }) => (
  <span className={`inline-block font-bold text-xs uppercase tracking-widest rounded-full ${className}`}>
    {children}
  </span>
)

export default Home
