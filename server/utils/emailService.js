import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

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

    const jobsHtml = jobs.map((job, index) => `
      <div style="border: 1px solid #ddd; padding: 15px; margin-bottom: 15px; border-radius: 8px;">
        <h3 style="margin: 0 0 10px 0; color: #667eea;">${index + 1}. ${job.title}</h3>
        <p style="margin: 5px 0;"><strong>Company:</strong> ${job.company}</p>
        <p style="margin: 5px 0;"><strong>Location:</strong> ${job.location}</p>
        ${job.salary && job.salary !== 'Not specified' ? `<p style="margin: 5px 0;"><strong>Salary:</strong> ${job.salary}</p>` : ''}
        ${job.postingDate ? `<p style="margin: 5px 0;"><strong>Posted:</strong> ${job.postingDate}</p>` : ''}
        <p style="margin: 5px 0;"><strong>Source:</strong> ${job.source}</p>
        ${job.description ? `<p style="margin: 10px 0; color: #666;">${job.description.substring(0, 200)}...</p>` : ''}
        <a href="${job.link}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-top: 10px;">View Job</a>
      </div>
    `).join('');

    const criteriaHtml = `
      <p><strong>Job Title:</strong> ${searchCriteria.jobTitle || 'Any'}</p>
      ${searchCriteria.locationType?.length ? `<p><strong>Location Type:</strong> ${searchCriteria.locationType.join(', ')}</p>` : ''}
      ${searchCriteria.companySizes?.length ? `<p><strong>Company Size:</strong> ${searchCriteria.companySizes.join(', ')}</p>` : ''}
      ${searchCriteria.industries?.length ? `<p><strong>Industries:</strong> ${searchCriteria.industries.join(', ')}</p>` : ''}
      ${searchCriteria.minSalary || searchCriteria.maxSalary ? `<p><strong>Salary Range:</strong> $${searchCriteria.minSalary || 0} - $${searchCriteria.maxSalary || '∞'}</p>` : ''}
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

          <div style="padding: 20px; background: #f9f9f9;">
            <h2 style="color: #333;">Search Criteria</h2>
            ${criteriaHtml}
          </div>

          <div style="padding: 20px;">
            <h2 style="color: #333;">Job Listings</h2>
            ${jobsHtml}
          </div>

          <div style="background: #f0f0f0; padding: 20px; text-align: center; border-radius: 0 0 10px 10px;">
            <p style="margin: 0; color: #666;">This is an automated job alert from your Job Search Aggregator</p>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`Email sent to: ${recipients.join(', ')}`);
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
