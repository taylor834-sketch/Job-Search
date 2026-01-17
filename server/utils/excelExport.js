import ExcelJS from 'exceljs';

export const generateExcelFile = async (jobs) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Job Listings');

  // Define columns
  worksheet.columns = [
    { header: 'Posting Date', key: 'postingDate', width: 15 },
    { header: 'Date Pulled', key: 'datePulled', width: 20 },
    { header: 'Job Title', key: 'title', width: 30 },
    { header: 'Company', key: 'company', width: 25 },
    { header: 'Company Size', key: 'companySize', width: 15 },
    { header: 'Industry', key: 'industry', width: 20 },
    { header: 'Location', key: 'location', width: 20 },
    { header: 'Salary', key: 'salary', width: 20 },
    { header: 'Source', key: 'source', width: 15 },
    { header: 'Job Link', key: 'link', width: 50 },
    { header: 'Description', key: 'description', width: 60 }
  ];

  // Style the header row
  worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF667eea' }
  };

  // Add data rows
  jobs.forEach(job => {
    worksheet.addRow({
      postingDate: job.postingDate || 'Not specified',
      datePulled: job.datePulled,
      title: job.title,
      company: job.company,
      companySize: job.companySize || 'Not specified',
      industry: job.industry || 'Not specified',
      location: job.location,
      salary: job.salary || 'Not specified',
      source: job.source,
      link: job.link,
      description: job.description || ''
    });
  });

  // Auto-fit columns (approximate)
  worksheet.columns.forEach(column => {
    if (column.key === 'link') {
      column.width = 50;
    }
  });

  // Generate buffer
  const buffer = await workbook.xlsx.writeBuffer();
  return buffer;
};
