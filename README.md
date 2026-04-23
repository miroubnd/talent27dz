# TalentDZ — Vibe Coding Project

TalentDZ is a high-performance web platform designed to seamlessly connect elite talent with top companies bridging the professional Algerian tech-hub ecosystem. Built completely with a robust Serverless Architecture and React-based frontend.

## Theme & Database Mapping

The database schema directly maps the primary domain components into a structured format handled by Supabase Postgres:

- **Table A (`profiles`)**: Acts as a comprehensive hub linking Candidates and Employers via Supabase Authentication bounds, persisting individual properties (names, locations), roles, and contact metrics beyond base Auth metadata.
- **Table B (`jobs`)**: The core artifact representing the "Job Offers" dynamically posted by validated Employers. Includes job descriptions, required sector criteria, and location data.
- **Table C (`applications`)**: The interconnecting "Candidature" entity directly linking Table A (Candidate profile) to Table B (Job Offer). Designed meticulously with `cv_url`, `cover_letter`, `status`, and `created_at` parameters to streamline tracking workflows.
- **File Assets**: CV files in PDF format, alongside profile Avatars and company Logos, are stored directly in high-tier Supabase Storage utilizing the `cvs`, `avatars`, and `logos` buckets respectively.

---

## Technical Architecture Analysis

**Why is Vercel + Supabase financially smarter than a physical server?**
In traditional IT architecture, deploying a system like TalentDZ would require the procurement of physical servers and associated data center infrastructure, fundamentally categorized as a heavy **CAPEX** (Capital Expenditure). This requires substantial, rigid upfront financial commitments before writing a single line of business value. By migrating to a Serverless model utilizing Vercel and Supabase, the deployment model shifts entirely to an **OPEX** (Operational Expenditure) paradigm. Instead of massive initial investments, TalentDZ merely pays for the precise compute time, bandwidth, and gigabytes consumed exactly when they are used. This "pay-as-you-go" strategy prevents budget overallocation and allows the platform to scale its operational costs strictly linearly alongside its revenue and traffic.

**How does Vercel handle scalability vs a local physical data center?**
When scaling a local physical data center to accommodate spikes in traffic (e.g., thousands of unexpected candidates rushing to apply), engineers must manually deploy additional rack servers, integrate sophisticated tier-3 cooling systems to prevent thermal meltdowns, restructure local networking, and tackle compounding upfront hardware costs. In sharp contrast, Vercel leverages high-throughput Edge Networks to handle scalability automatically on-the-fly. Utilizing aggressive CDN caching, automated build pipelines, and decentralized serverless edge-nodes, Vercel absorbs instantaneous traffic spikes gracefully over the globe. There are no sudden hardware constraints or cooling meltdowns; Vercel merely spins up thousands of concurrent micro-instances to process requests precisely when needed.

**Structured Data vs Unstructured Data in TalentDZ**
- **Structured Data**: This refers to rigidly schema-enforced, easily queryable information within the relational database. In TalentDZ, examples include the `jobs` table configurations (e.g., strict enumerations for `job_type`, textual references to `location`, constrained `auth.uid` referencing values in `profiles`), and the binary state of the `is_read` column globally tracking notifications.
- **Unstructured Data**: This entails raw, schema-less information devoid of inherently parsable querying semantics natively. In TalentDZ, concrete examples include the uploaded high-resolution Candidate Avatars (`.jpg` / `.png`), the unstructured raw text within the optional Candidate Cover Letters, and the dense content encoded securely within the PDF Resumes stored directly inside the `cvs` Storage Bucket.
