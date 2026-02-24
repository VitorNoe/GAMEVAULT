/**
 * Email Service
 *
 * In development mode, emails are logged to the console instead of being sent.
 * In production, integrate a real email provider (e.g. SendGrid, Mailgun, AWS SES).
 */

import config from '../config/app';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

const isDev = !config.isProduction;

/**
 * Send an email. In dev mode, logs to console instead of sending.
 */
export const sendEmail = async (options: EmailOptions): Promise<void> => {
  if (isDev) {
    console.log('\n' + '='.repeat(60));
    console.log('📧 [DEV EMAIL] Would send email:');
    console.log(`   To:      ${options.to}`);
    console.log(`   Subject: ${options.subject}`);
    console.log('   Body:');
    console.log(options.text || options.html);
    console.log('='.repeat(60) + '\n');
    return;
  }

  // TODO: Integrate real email provider for production
  // Example with nodemailer / SendGrid / AWS SES:
  // await transporter.sendMail({ from: 'noreply@gamevault.com', ...options });
  console.warn('[Email] Production email sending not configured.');
};

/**
 * Send email verification message.
 */
export const sendVerificationEmail = async (
  email: string,
  name: string,
  token: string
): Promise<void> => {
  const verifyUrl = `${process.env.APP_URL || 'http://localhost:3000'}/api/auth/verify-email?token=${token}`;

  await sendEmail({
    to: email,
    subject: 'GameVault - Verify your email address',
    html: `
      <h2>Welcome to GameVault, ${name}!</h2>
      <p>Please verify your email address by clicking the link below:</p>
      <p><a href="${verifyUrl}">${verifyUrl}</a></p>
      <p>This link will expire in 24 hours.</p>
      <p>If you did not create an account, please ignore this email.</p>
    `,
    text: `Welcome to GameVault, ${name}!\n\nPlease verify your email by visiting:\n${verifyUrl}\n\nThis link will expire in 24 hours.\nIf you did not create an account, please ignore this email.`,
  });
};

/**
 * Send password reset email.
 */
export const sendPasswordResetEmail = async (
  email: string,
  name: string,
  token: string
): Promise<void> => {
  const resetUrl = `${process.env.APP_URL || 'http://localhost:3000'}/api/auth/reset-password?token=${token}`;

  await sendEmail({
    to: email,
    subject: 'GameVault - Reset your password',
    html: `
      <h2>Password Reset Request</h2>
      <p>Hello ${name},</p>
      <p>You requested a password reset. Click the link below to set a new password:</p>
      <p><a href="${resetUrl}">${resetUrl}</a></p>
      <p>This link will expire in 1 hour.</p>
      <p>If you did not request a password reset, please ignore this email. Your password will remain unchanged.</p>
    `,
    text: `Hello ${name},\n\nYou requested a password reset. Visit:\n${resetUrl}\n\nThis link will expire in 1 hour.\nIf you did not request this, please ignore this email.`,
  });
};

// ─── Event-driven notification emails ────────────────────────────────

/** Map of notification_type → human-readable subject prefix */
const subjectPrefixes: Record<string, string> = {
  release: '🎮 New Release',
  rerelease: '🔄 Re-Release',
  update: '🆕 Game Update',
  goty: '🏆 Game of the Year',
  review_like: '👍 Review Activity',
  status_change: '📋 Status Update',
  milestone: '🎯 Milestone',
};

/**
 * Send a notification email for any in-app event.
 * Used by the notification queue worker.
 */
export const sendNotificationEmail = async (
  email: string,
  name: string,
  title: string,
  message: string,
  notificationType: string,
): Promise<void> => {
  const prefix = subjectPrefixes[notificationType] || '🔔 Notification';
  const appUrl = process.env.APP_URL || 'http://localhost:3001';

  await sendEmail({
    to: email,
    subject: `GameVault — ${prefix}: ${title}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #6366f1;">${prefix}</h2>
        <h3>${title}</h3>
        <p>${message}</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
        <p style="color: #6b7280; font-size: 14px;">
          You received this email because you have email notifications enabled for
          <strong>${notificationType}</strong> events.
          <a href="${appUrl}/settings/notifications">Manage preferences</a>
        </p>
      </div>
    `,
    text: `${prefix}: ${title}\n\n${message}\n\nManage your notification preferences at ${appUrl}/settings/notifications`,
  });
};

/**
 * Send a wishlist release notification email.
 */
export const sendWishlistReleaseEmail = async (
  email: string,
  name: string,
  gameTitle: string,
): Promise<void> => {
  await sendNotificationEmail(
    email,
    name,
    `${gameTitle} is now available!`,
    `Great news, ${name}! A game from your wishlist — <strong>${gameTitle}</strong> — has just been released. Check it out now!`,
    'release',
  );
};
