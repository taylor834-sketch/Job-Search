import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import { generateExcelFile } from './excelExport.js';

dotenv.config();

const escapeHtml = (str) =>
  String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

export const sendJobAlertEmail = async (recipientEmail, jobs, searchCriteria) => {
  try {
    const adminEmail = process.env.ADMIN_EMAIL || 'Taylor@realsimplerevops.com';

    // Always include admin email
    const recipients = [adminEmail];
    if (recipientEmail && recipientEmail !== adminEmail) {
      recipients.push(recipientEmail);
    }

    // Generate Excel file attachment
    const excelBuffer = await generateExcelFile(jobs);
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    const jobsHtml = jobs.map((job, index) => `
      <div style="border: 1px solid #ddd; padding: 15px; margin-bottom: 15px; border-radius: 8px;">
        <h3 style="margin: 0 0 10px 0; color: #667eea;">${index + 1}. ${escapeHtml(job.title)}</h3>
        <p style="margin: 5px 0;"><strong>Company:</strong> ${escapeHtml(job.company)}</p>
        <p style="margin: 5px 0;"><strong>Location:</strong> ${escapeHtml(job.location)}</p>
        ${job.salary && job.salary !== 'Not specified' ? `<p style="margin: 5px 0;"><strong>Salary:</strong> ${escapeHtml(job.salary)}</p>` : ''}
        ${job.postingDate ? `<p style="margin: 5px 0;"><strong>Posted:</strong> ${escapeHtml(job.postingDate)}</p>` : ''}
        <p style="margin: 5px 0;"><strong>Source:</strong> ${escapeHtml(job.source)}</p>
        ${job.description ? `<p style="margin: 10px 0; color: #666;">${escapeHtml(job.description.substring(0, 200))}...</p>` : ''}
        <a href="${escapeHtml(job.link)}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-top: 10px;">View Job</a>
      </div>
    `).join('');

    // Support both old (jobTitle) and new (jobTitles) format for display
    let jobTitlesDisplay = 'Any';
    if (searchCriteria.jobTitles && Array.isArray(searchCriteria.jobTitles) && searchCriteria.jobTitles.length > 0) {
      jobTitlesDisplay = searchCriteria.jobTitles.join(', ');
    } else if (searchCriteria.jobTitle) {
      jobTitlesDisplay = searchCriteria.jobTitle;
    }

    const criteriaHtml = `
      <p><strong>Job Title${searchCriteria.jobTitles?.length > 1 ? 's' : ''}:</strong> ${escapeHtml(jobTitlesDisplay)}</p>
      ${searchCriteria.locationType?.length ? `<p><strong>Location Type:</strong> ${escapeHtml(searchCriteria.locationType.join(', '))}</p>` : ''}
      ${searchCriteria.employmentType && searchCriteria.employmentType !== 'all' ? `<p><strong>Employment Type:</strong> ${escapeHtml(searchCriteria.employmentType)}</p>` : ''}
      ${searchCriteria.minSalary || searchCriteria.maxSalary ? `<p><strong>Salary Range:</strong> $${Number(searchCriteria.minSalary || 0).toLocaleString()} - $${searchCriteria.maxSalary ? Number(searchCriteria.maxSalary).toLocaleString() : '∞'}</p>` : ''}
      ${searchCriteria.datePosted && searchCriteria.datePosted !== 'all' ? `<p><strong>Date Posted:</strong> ${escapeHtml(searchCriteria.datePosted)}</p>` : ''}
    `;

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: recipients.join(', '),
      subject: `Job Alert: ${jobs.length} New Job${jobs.length !== 1 ? 's' : ''} Found`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="margin: 0;">Job Search Alert</h1>
            <p style="margin: 10px 0 0 0;">We found ${jobs.length} new job${jobs.length !== 1 ? 's' : ''} matching your criteria!</p>
          </div>

          <div style="padding: 20px; background: #e8f5e9; border-left: 4px solid #4CAF50;">
            <p style="margin: 0; font-size: 14px;">
              <strong>📎 Excel file attached!</strong> Open the attachment to see all ${jobs.length} jobs in a spreadsheet for easy filtering and tracking.
            </p>
          </div>

          <div style="padding: 20px; background: #f9f9f9;">
            <h2 style="color: #333;">Search Criteria</h2>
            ${criteriaHtml}
          </div>

          <div style="padding: 20px;">
            <h2 style="color: #333;">Job Listings</h2>
            ${jobsHtml}
          </div>

          <div style="background: #f0f0f0; padding: 20px; text-align: center; border-radius: 0 0 10px 10px;">
            <p style="margin: 0; color: #666;">This is an automated job alert from Jobinator 3000</p>
          </div>
        </div>
      `,
      attachments: [
        {
          filename: `job-search-results-${today}.xlsx`,
          content: excelBuffer,
          contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        }
      ]
    };

    await transporter.sendMail(mailOptions);
    console.log(`Email sent to: ${recipients.join(', ')} with Excel attachment`);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};

export const sendTestEmail = async (recipientEmail) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: recipientEmail,
      subject: 'Job Search Aggregator - Test Email',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h1>Email Configuration Successful!</h1>
          <p>Your job search alerts are now configured and ready to go.</p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Error sending test email:', error);
    throw error;
  }
};
