import { sendMail } from './email.js';

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch (err) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON' }) };
  }

  const { to, fullName, program, resumeUrl } = body;
  if (!to || !resumeUrl) {
    return { statusCode: 400, body: JSON.stringify({ error: 'to and resumeUrl required' }) };
  }

  const name = fullName || 'Applicant';
  const prog = program || 'your program';
  const subject = 'Complete your CGTIA application payment';
  const text =
    `Hi ${name},\n\n` +
    `We received your application for ${prog}.\n\n` +
    `To secure your seat, complete payment using this private link:\n${resumeUrl}\n\n` +
    `If you already paid, you can ignore this email.\n\n` +
    `— CGTIA Admissions`;

  const html =
    `<p>Hi ${name},</p>` +
    `<p>We received your application for <strong>${prog}</strong>.</p>` +
    `<p>To secure your seat, complete payment using this private link:</p>` +
    `<p><a href="${resumeUrl}">${resumeUrl}</a></p>` +
    `<p>If you already paid, you can ignore this email.</p>` +
    `<p>— CGTIA Admissions</p>`;

  try {
    await sendMail({ to, subject, text, html });
    // Also notify staff if configured
    const staff = process.env.ADMIN_EMAIL;
    if (staff) {
      try {
        await sendMail({
          to: staff,
          subject: `New application: ${name}`,
          text: `Name: ${name}\nEmail: ${to}\nProgram: ${prog}\nResume: ${resumeUrl}`
        });
      } catch (e) {}
    }
    return { statusCode: 200, body: JSON.stringify({ success: true }) };
  } catch (err) {
    console.error('send-applicant-email', err);
    return { statusCode: 200, body: JSON.stringify({ success: false, error: err.message }) };
  }
};
