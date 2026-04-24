# 🚀 TalentDZ

TalentDZ is a full-stack job marketplace platform designed to connect **job seekers**, **companies**, and **administrators** in a centralized and efficient recruitment ecosystem.

The platform enables companies to publish job offers, candidates to apply, and administrators to manage the system with full control.

---

## 🎯 Project Objectives

- Simplify the recruitment process
- Centralize job opportunities in Algeria
- Provide structured candidate management
- Improve communication between employers and applicants
- Offer role-based dashboards for different users

---

## 👥 User Roles

### 🧑 Job Seeker
- Create and manage profile (CV, skills, photo)
- Browse job listings
- Apply to job offers
- Track application status
- Receive notifications (email + in-app)

---

### 🏢 Company / Employer
- Manage company profile (logo, description, contact info)
- Post job offers
- Review applicants
- Accept / reject candidates
- Manage recruitment pipeline

---

### 🛠️ Super Admin
- Manage all users and roles
- Moderate job postings
- Monitor platform activity
- Maintain system integrity

---

## 💡 Key Features

- Authentication system (JWT)
- Role-based access control
- Job posting & application system
- Advanced filtering & search
- Notifications system (email + in-app)
- CV upload system
- Responsive UI design

---

## 🧱 Tech Stack

### Frontend
- React.js (or Next.js)
- TailwindCSS


### Backend
- Supabase
  - PostgreSQL Database
  - Authentication
  - Storage
  - Realtime subscriptions
  - Email Service
 
## 🏗️ Project Architecture

```bash id="tdzpro02"
TalentDZ/
│
├── src/                      # Frontend (React / Next.js)
│   ├── app/                  # Pages / Routes
│   │   ├── auth/             # Login / Register
│   │   ├── dashboard/        # Candidate / Employer / Admin
│   │   ├── jobs/             # Job listing & details
│   │   └── profile/          # User profile
│
│   ├── components/           # Reusable UI
│   ├── features/             # Business logic (core)
│   │   ├── auth/
│   │   ├── profiles/         # Table A
│   │   ├── jobs/             # Table B
│   │   └── applications/     # Table C
│
│   ├── lib/                  # Supabase client & config
│   ├── hooks/                # Custom hooks
│   └── utils/                # Helpers
│
├── supabase/                 # Backend (BaaS)
│   ├── migrations/           # Database schema (SQL)
│   └── policies/             # Security (RLS)
│
├── public/                   # Static files (avatars, CVs, logos)
├── .env.local
└── README.md
