// ═══════════════════════════════════════════════════════════════
// EMAIL SERVICE
// Transactional emails via Resend/SendGrid
// ═══════════════════════════════════════════════════════════════

import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY
    ? new Resend(process.env.RESEND_API_KEY)
    : null;

const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@upsc-master.com';
const APP_NAME = 'UPSC CSE Master';

// ═══════════════════════════════════════════════════════════════
// EMAIL TEMPLATES
// ═══════════════════════════════════════════════════════════════

const templates = {
    welcome: (name: string, trialHours: number = 24) => ({
        subject: `🎉 Welcome to ${APP_NAME} - Your ${trialHours}h Trial Starts Now!`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h1 style="color: #6366f1;">Welcome, ${name}! 🎓</h1>
                <p>Your <strong>${trialHours}-hour free trial</strong> has started!</p>
                <p>Here's what you can do:</p>
                <ul>
                    <li>✅ Generate unlimited AI-powered notes</li>
                    <li>✅ Take practice quizzes</li>
                    <li>✅ Watch 3-hour video lectures</li>
                    <li>✅ Access current affairs analysis</li>
                </ul>
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" 
                   style="display: inline-block; background: #6366f1; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin: 20px 0;">
                    Start Learning Now →
                </a>
                <p style="color: #666; font-size: 14px;">
                    Your trial ends in ${trialHours} hours. Upgrade anytime to continue access!
                </p>
            </div>
        `
    }),

    trialExpiring: (name: string, hoursLeft: number) => ({
        subject: `⏰ Only ${hoursLeft}h left in your trial - Don't lose access!`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h1 style="color: #f59e0b;">⏰ Your Trial is Expiring Soon</h1>
                <p>Hi ${name},</p>
                <p>You only have <strong>${hoursLeft} hours</strong> left in your trial!</p>
                <p>Don't lose access to:</p>
                <ul>
                    <li>📚 Your generated notes</li>
                    <li>📊 Your quiz progress</li>
                    <li>🎥 Video lectures</li>
                </ul>
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/pricing" 
                   style="display: inline-block; background: #6366f1; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin: 20px 0;">
                    Upgrade Now - From ₹599/month
                </a>
            </div>
        `
    }),

    trialExpired: (name: string) => ({
        subject: `😢 Your trial has ended - But wait!`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h1 style="color: #ef4444;">Your Trial Has Ended</h1>
                <p>Hi ${name},</p>
                <p>Your free trial has ended, but your UPSC preparation doesn't have to stop!</p>
                <p><strong>Special Offer:</strong> Use code <code>COMEBACK20</code> for 20% off your first month!</p>
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/pricing?code=COMEBACK20" 
                   style="display: inline-block; background: #6366f1; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin: 20px 0;">
                    Claim 20% Off →
                </a>
            </div>
        `
    }),

    paymentSuccess: (name: string, planName: string, amount: number, invoiceUrl?: string) => ({
        subject: `✅ Payment Confirmed - Welcome to ${planName}!`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h1 style="color: #22c55e;">Payment Successful! ✅</h1>
                <p>Hi ${name},</p>
                <p>Thank you for subscribing to <strong>${planName}</strong>!</p>
                <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <p><strong>Amount Paid:</strong> ₹${amount.toLocaleString()}</p>
                    <p><strong>Plan:</strong> ${planName}</p>
                </div>
                ${invoiceUrl ? `<p><a href="${invoiceUrl}">Download Invoice (PDF)</a></p>` : ''}
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" 
                   style="display: inline-block; background: #6366f1; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin: 20px 0;">
                    Start Learning →
                </a>
            </div>
        `
    }),

    referralInvite: (referrerName: string, referralCode: string) => ({
        subject: `${referrerName} invited you to UPSC CSE Master - Get 7 extra days free!`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h1 style="color: #6366f1;">You're Invited! 🎁</h1>
                <p>${referrerName} thinks you'd love ${APP_NAME}!</p>
                <p>Sign up with their referral code and get:</p>
                <ul>
                    <li>🎁 <strong>31 hours free trial</strong> (instead of 24h)</li>
                    <li>📚 Full access to all features</li>
                </ul>
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/register?ref=${referralCode}" 
                   style="display: inline-block; background: #6366f1; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin: 20px 0;">
                    Claim Your Free Trial →
                </a>
            </div>
        `
    })
};

// ═══════════════════════════════════════════════════════════════
// SEND EMAIL FUNCTIONS
// ═══════════════════════════════════════════════════════════════

export async function sendEmail(
    to: string,
    subject: string,
    html: string
): Promise<boolean> {
    if (!resend) {
        console.log(`[DEV EMAIL] To: ${to}, Subject: ${subject}`);
        return true;
    }

    try {
        await resend.emails.send({
            from: FROM_EMAIL,
            to,
            subject,
            html
        });
        return true;
    } catch (error) {
        console.error('Email send error:', error);
        return false;
    }
}

export async function sendWelcomeEmail(email: string, name: string) {
    const template = templates.welcome(name);
    return sendEmail(email, template.subject, template.html);
}

export async function sendTrialExpiringEmail(email: string, name: string, hoursLeft: number) {
    const template = templates.trialExpiring(name, hoursLeft);
    return sendEmail(email, template.subject, template.html);
}

export async function sendTrialExpiredEmail(email: string, name: string) {
    const template = templates.trialExpired(name);
    return sendEmail(email, template.subject, template.html);
}

export async function sendPaymentSuccessEmail(
    email: string,
    name: string,
    planName: string,
    amount: number,
    invoiceUrl?: string
) {
    const template = templates.paymentSuccess(name, planName, amount, invoiceUrl);
    return sendEmail(email, template.subject, template.html);
}

export async function sendReferralInvite(
    email: string,
    referrerName: string,
    referralCode: string
) {
    const template = templates.referralInvite(referrerName, referralCode);
    return sendEmail(email, template.subject, template.html);
}
