// ═══════════════════════════════════════════════════════════════
// MOBILE OTP SERVICE
// 6-digit OTP via Twilio/MSG91
// ═══════════════════════════════════════════════════════════════

import { getRedis } from '@/lib/redis/client';
import twilio from 'twilio';

let _twilioClient: ReturnType<typeof twilio> | null = null;
function getTwilioClient() {
  if (_twilioClient === null) {
    _twilioClient = process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN
      ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
      : (undefined as any);
  }
  return _twilioClient;
}

/**
 * Generate 6-digit OTP
 */
function generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Send OTP via SMS
 */
export async function sendOTP(phone: string): Promise<{
    success: boolean;
    message: string;
    expiresIn: number;
}> {
    // Normalize phone number
    const normalizedPhone = phone.replace(/\D/g, '');

    // Check rate limit (1 OTP per minute per phone)
    const rateLimitKey = `otp:ratelimit:${normalizedPhone}`;
    const redis = getRedis();

    if (!redis) {
        // If Redis not available, allow OTP in dev mode
        if (process.env.NODE_ENV === 'development') {
            const otp = generateOTP();
            if (process.env.NODE_ENV === 'development' && process.env.DEBUG_OTP) {
                console.debug(`[DEV] OTP for ${phone}: ${otp}`);
            }
            return { success: true, message: 'OTP logged to console (dev mode)', expiresIn: 600 };
        }
        return { success: false, message: 'Service unavailable', expiresIn: 0 };
    }

    const rateLimitExists = await redis.exists(rateLimitKey);

    if (rateLimitExists) {
        const ttl = await redis.ttl(rateLimitKey);
        return {
            success: false,
            message: `Please wait ${ttl} seconds before requesting another OTP`,
            expiresIn: ttl
        };
    }

    // Generate OTP
    const otp = generateOTP();
    const otpKey = `otp:${normalizedPhone}`;

    // Store OTP in Redis (expires in 10 minutes)
    await redis.setex(otpKey, 600, otp);

    // Set rate limit (1 minute)
    await redis.setex(rateLimitKey, 60, '1');

    // Send SMS based on provider
    const provider = process.env.SMS_PROVIDER || 'twilio';

    try {
        const twilioClient = getTwilioClient();
        if (provider === 'twilio' && twilioClient) {
            await twilioClient.messages.create({
                body: `Your UPSC CSE Master OTP is: ${otp}. Valid for 10 minutes.`,
                from: process.env.TWILIO_PHONE_NUMBER,
                to: `+91${normalizedPhone}`
            });
        } else {
            // For development, log OTP only when DEBUG_OTP is set
            if (process.env.NODE_ENV === 'development' && process.env.DEBUG_OTP) {
                console.debug(`[DEV] OTP for ${phone}: ${otp}`);
            }
        }

        return {
            success: true,
            message: 'OTP sent successfully',
            expiresIn: 600
        };

    } catch (error) {
        console.error('SMS sending error:', error);

        // Still return success in dev mode
        if (process.env.NODE_ENV === 'development') {
            if (process.env.DEBUG_OTP) {
                console.debug(`[DEV] OTP for ${phone}: ${otp}`);
            }
            return {
                success: true,
                message: 'OTP logged to console (dev mode)',
                expiresIn: 600
            };
        }

        return {
            success: false,
            message: 'Failed to send OTP',
            expiresIn: 0
        };
    }
}

/**
 * Verify OTP
 */
export async function verifyOTP(phone: string, enteredOTP: string): Promise<boolean> {
    const normalizedPhone = phone.replace(/\D/g, '');
    const otpKey = `otp:${normalizedPhone}`;

    const redis = getRedis();
    if (!redis) return false;

    const storedOTP = await redis.get(otpKey);

    if (!storedOTP) {
        return false; // OTP expired or doesn't exist
    }

    if (storedOTP === enteredOTP) {
        // OTP verified, delete it
        await redis.del(otpKey);
        return true;
    }

    return false;
}

/**
 * Resend OTP (with rate limiting)
 */
export async function resendOTP(phone: string) {
    return sendOTP(phone);
}

/**
 * Check remaining OTP attempts
 */
export async function getOTPStatus(phone: string): Promise<{
    exists: boolean;
    expiresIn: number;
    canResend: boolean;
}> {
    const normalizedPhone = phone.replace(/\D/g, '');
    const otpKey = `otp:${normalizedPhone}`;
    const rateLimitKey = `otp:ratelimit:${normalizedPhone}`;

    const redis = getRedis();
    if (!redis) {
        return { exists: false, expiresIn: 0, canResend: true };
    }

    const otpTTL = await redis.ttl(otpKey);
    const rateLimitTTL = await redis.ttl(rateLimitKey);

    return {
        exists: otpTTL > 0,
        expiresIn: Math.max(0, otpTTL),
        canResend: rateLimitTTL <= 0
    };
}
