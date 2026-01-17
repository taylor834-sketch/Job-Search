export const deduplicateJobs = (jobs) => {
  const uniqueJobs = new Map();

  jobs.forEach(job => {
    const normalizedTitle = job.title.toLowerCase().trim();
    const normalizedCompany = job.company.toLowerCase().trim();

    const key = `${normalizedTitle}|${normalizedCompany}`;

    if (!uniqueJobs.has(key)) {
      uniqueJobs.set(key, job);
    } else {
      const existing = uniqueJobs.get(key);

      if (job.description && job.description.length > (existing.description?.length || 0)) {
        uniqueJobs.set(key, { ...existing, description: job.description });
      }

      if (job.salary && job.salary !== 'Not specified' && existing.salary === 'Not specified') {
        uniqueJobs.set(key, { ...existing, salary: job.salary });
      }
    }
  });

  return Array.from(uniqueJobs.values());
};

export const normalizeCompanySize = (sizeString) => {
  const normalized = sizeString?.toLowerCase() || '';

  if (normalized.includes('1-10') || normalized.includes('startup')) return '1-10';
  if (normalized.includes('11-50') || normalized.includes('small')) return '11-50';
  if (normalized.includes('51-200')) return '51-200';
  if (normalized.includes('201-500')) return '201-500';
  if (normalized.includes('501-1000')) return '501-1000';
  if (normalized.includes('1001') || normalized.includes('enterprise')) return '1001+';

  return 'Not specified';
};

export const normalizeSalary = (salaryString) => {
  if (!salaryString || salaryString === 'Not specified') return null;

  const numbers = salaryString.match(/\d+/g);
  if (!numbers || numbers.length === 0) return null;

  const minSalary = parseInt(numbers[0]) * (salaryString.includes('k') ? 1000 : 1);
  const maxSalary = numbers.length > 1
    ? parseInt(numbers[1]) * (salaryString.includes('k') ? 1000 : 1)
    : minSalary;

  return { min: minSalary, max: maxSalary };
};
