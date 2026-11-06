import { sendMail } from './email.js';

// Emails the admin (the ADMIN_EMAIL setting). Never stops the person's submission if email fails.
export async function emailAdmin(subject, lines) {
  const to = process.env.ADMIN_EMAIL;
  if (!to) return;
  try {
    await sendMail({ to, subject, text: (lines || []).join('\n') });
  } catch (err) {
    console.error('admin email failed', err);
  }
}
