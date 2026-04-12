import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export const Button = ({ className, variant = 'primary', children, ...props }) => {
  const baseStyles = "inline-flex items-center justify-center font-medium transition-all duration-200 focus:ring-2 focus:ring-accent focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none"
  
  const variants = {
    primary: "btn-primary",
    secondary: "btn-secondary",
    outline: "border-2 border-border text-secondary hover:border-primary hover:text-primary",
    ghost: "bg-transparent text-primary hover:bg-accent/5",
    danger: "bg-error text-white hover:bg-red-700",
  }

  const sizes = {
    sm: "px-3 py-1.5 text-sm rounded-md",
    md: "px-6 py-2.5 rounded-lg",
    lg: "px-8 py-3 text-lg rounded-xl",
  }

  return (
    <button 
      className={cn(baseStyles, variants[variant], sizes[props.size || 'md'], className)}
      {...props}
    >
      {children}
    </button>
  )
}

export const Badge = ({ children, status, className }) => {
  const statuses = {
    pending: "badge-pending",
    accepted: "badge-accepted",
    rejected: "badge-rejected",
    cancelled: "badge-cancelled",
    approved: "bg-success text-white", // For jobs
    active: "bg-success text-white",
    closed: "bg-muted text-white",
  }

  return (
    <span className={cn("badge", statuses[status] || "bg-accent/10 text-accent", className)}>
      {children}
    </span>
  )
}

export const Card = ({ children, className }) => (
  <div className={cn("card", className)}>
    {children}
  </div>
)

export const Input = ({ label, error, className, ...props }) => (
  <div className="space-y-1.5 w-full">
    {label && <label className="text-sm font-semibold text-primary/80">{label}</label>}
    <input 
      className={cn("input", error && "border-error focus:ring-error/20", className)} 
      {...props} 
    />
    {error && <p className="text-xs text-error font-medium">{error}</p>}
  </div>
)
