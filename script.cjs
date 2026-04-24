const fs = require('fs');
const files = [
  'src/pages/jobs/JobDetails.jsx',
  'src/pages/dashboard/EmployerDashboard.jsx',
  'src/pages/dashboard/CandidateDashboard.jsx',
  'src/pages/auth/Register.jsx',
  'supabase/schema.sql'
];

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/'cvs'/g, "'cv_uploads'");
  fs.writeFileSync(file, content);
}
console.log('Reverted cvs to cv_uploads');
