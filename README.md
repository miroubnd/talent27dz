# TalentDZ — Premium Algerian Job Marketplace

TalentDZ is a high-performance, role-based job recruitment platform designed specifically for the Algerian professional ecosystem. Built with a modern tech stack centered on scalability and visual excellence.

## 🛠 Tech Stack
- **Frontend**: React.js (Vite) + Tailwind CSS
- **Backend**: Supabase (Auth, PostgreSQL, Storage, Real-time)
- **Deployment**: Vercel
- **Design System**: Navy & Gold Corporate Light Mode

## 🗺 Theme Mapping
- **Table A (profiles)**: Managed via Supabase Auth. Stores Candidates, Employers, and Admins.
- **Table B (jobs)**: Job listings created by Employers, moderated by Admins.
- **Table C (applications)**: Links Candidates to Jobs. Stores cover letters and application status.
- **Storage**: 
  - `cvs` (Private): Candidate Resume PDFs.
  - `avatars` (Public): Candidate profile photos.
  - `logos` (Public): Employer company logos.

---

## 🏛 Architecture Analysis

### 1. OPEX vs CAPEX: Why Vercel + Supabase is Financially Smarter
Switching from a traditional physical server environment to a Serverless/SaaS model (Vercel + Supabase) represents a strategic shift from **CAPEX (Capital Expenditure)** to **OPEX (Operating Expenditure)**. 

In a traditional setup, a company must invest heavily upfront (CAPEX) in physical hardware, networking racks, and uninterruptible power supplies (UPS). These assets depreciate over time and require ongoing maintenance regardless of usage. Conversely, the TalentDZ stack utilizes an OPEX model where costs are primarily utility-based. We pay for the compute and storage we actually consume. This eliminates the need for large initial investments, making it significantly more accessible for startups and reducing the financial risk associated with hardware failure or obsolescence.

### 2. Scalability: Vercel vs Local Physical Data Centers
Vercel handles scalability through a global Edge Network that traditional physical data centers struggle to match without massive investment. In a local data center, scaling requires manual intervention: buying more **rack servers**, upgrading **cooling systems** to handle increased thermal load, and managing load balancers. 

Vercel employs **Automatic Scaling** and **Serverless Functions**. When TalentDZ experiences a traffic surge (e.g., during a major hiring seasonal peak), the infrastructure automatically provisions more resources across multiple global regions. This ensures low latency and high availability without the overhead of physical infrastructure management. Scalability becomes a software configuration rather than a hardware logistics challenge.

### 3. Structured vs Unstructured Data in TalentDZ
TalentDZ handles two primary types of data:

- **Structured Data**: This is organized data that fits neatly into the relational PostgreSQL tables in Supabase. Examples include:
  - **Job Titles & Salaries**: Fixed fields in the `jobs` table.
  - **Application Status**: Enumerated values (Pending, Accepted, Rejected) in the `applications` table.
  - **User Roles**: Defined roles in the `profiles` table.
  
- **Unstructured Data**: This refers to information that does not have a predefined data model or is not organized in a pre-defined manner. Examples include:
  - **CV PDFs**: Documents stored in the Supabase "cvs" bucket. The database stores the *link*, but the content of the PDF is unstructured.
  - **Company Logos & Avatars**: Binary image data stored in storage buckets.
  - **Job Descriptions & Bios**: While stored in text fields, these are long-form, free-text blobs that require full-text search or NLP to process meaningfully, rather than simple relational queries.

---

## 🚀 Getting Started

1. **Clone the repo**
2. **Install dependencies**: `npm install`
3. **Setup Environment**: Create a `.env` file with:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```
4. **Run locally**: `npm run dev`
