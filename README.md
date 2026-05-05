# 🚀 TalentDZ

TalentDZ is a full-stack job marketplace platform designed to connect job seekers, companies, and administrators in a centralized and efficient recruitment ecosystem.

The platform enables companies to publish job offers, candidates to apply, and administrators to manage the system with full control.

---
## 🧭 Theme Mapping

The theme of this project is an **online recruitment platform (TalentDZ)** that connects job seekers, companies, and administrators in a centralized system.

- **Table A → `profiles`**  
  Contains user data such as personal information, skills, CVs, and profile pictures for both candidates and companies.

- **Table B → `jobs`**  
  Represents job offers published by companies, including title, description, requirements, and related details.

- **Table C → `applications`**  
  Stores job applications submitted by candidates, including application status, submission date, and relationships between users and job offers.

- **File (Unstructured Data) → `public/` + Supabase Storage**  
  Includes uploaded files such as CVs (PDF), images, and company logos, which are not stored in relational table format.

---

## ⚠️ Repository Information

This repository contains the production-ready version of TalentDZ.

👉 The repository used for Vercel deployment is available here:
https://github.com/miroubnd/talent27dz

---

## 🎯 Project Objectives

* Simplify the recruitment process
* Centralize job opportunities in Algeria
* Provide structured candidate management
* Improve communication between employers and applicants
* Offer role-based dashboards for different users

---

## 👨‍💻 Team

* Ismail Tayeb Abderahim: Frontend + Supabase
* Bouznad Mohamed Morad: Supabase + Deployment
* Mazri Anis: Documentation

---

## 👥 User Roles

### 🧑 Job Seeker

* Create and manage profile (CV, skills, photo)
* Browse job listings
* Apply to job offers
* Track application status
* Receive notifications (email + in-app)

---

### 🏢 Company / Employer

* Manage company profile (logo, description, contact info)
* Post job offers
* Review applicants
* Accept / reject candidates
* Manage recruitment pipeline

---

### 🛠️ Super Admin

* Manage all users and roles
* Moderate job postings
* Monitor platform activity
* Maintain system integrity

---

## 💡 Key Features

* Authentication system (JWT)
* Role-based access control
* Job posting & application system
* Advanced filtering & search
* Notifications system (email + in-app)
* CV upload system
* Responsive UI design

---

## 🧱 Tech Stack

### Frontend

* React.js / Next.js
* TailwindCSS

### Backend (Supabase)

* PostgreSQL Database
* Authentication
* Storage
* Realtime subscriptions
* Email services

---

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

```


## ⚙️ Architecture Analysis

The choice of using **Vercel + Supabase** instead of a traditional server infrastructure is mainly justified by the difference between **CAPEX** and **OPEX** models.

In a traditional infrastructure, deploying an application requires a significant upfront investment in physical hardware such as servers, storage systems, and networking equipment. This type of cost is referred to as **CAPEX (Capital Expenditure)**. Additionally, there are recurring operational challenges, including maintenance, electricity consumption, cooling systems, and hardware upgrades.

In contrast, Vercel and Supabase operate under an **OPEX (Operational Expenditure)** model, where costs are based on actual usage. This “pay-as-you-go” approach eliminates the need for large initial investments and makes the solution more financially accessible, especially for startups or academic projects. It allows rapid deployment while minimizing financial risk.

Regarding scalability, **Vercel** leverages a **serverless architecture** and a globally distributed Content Delivery Network (CDN). This means that when traffic increases, the platform automatically scales without requiring manual intervention. Unlike a physical data center, there is no need to purchase additional servers, install rack infrastructure, or manage cooling systems. This significantly reduces complexity while ensuring high performance and availability.

Finally, in this application, we distinguish between structured and unstructured data:

- **Structured Data** is managed using Supabase’s PostgreSQL database. This includes tables such as `profiles`, `jobs`, and `applications`, where data is organized into schemas with defined relationships.

- **Unstructured Data** consists of files such as CVs, images, and company logos stored in Supabase Storage (`public/`). These files do not follow a tabular schema and are handled separately from the relational database.

## 📦 Getting Started

### 1. Clone the repository

git clone https://github.com/your-repo/talentdz.git
cd talentdz

### 2. Install dependencies

npm install

### 3. Configure environment variables

Create a .env.local file and add your Supabase credentials:

NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key

### 4. Run the development server

npm run dev

---

## 🚀 Deployment

* Production repository: (this repo)
* Vercel deployment repo:
  https://github.com/miroubnd/talent27dz

---
