import { redis } from "../config/redis";

const OTP_TTL_SECONDS = 600; // 10 minutes
const OTP_LENGTH = 6;
const MAX_ATTEMPTS = 5;

export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function storeOTP(email: string, otp: string): Promise<void> {
  const key = `otp:${email.toLowerCase()}`;
  await redis.set(key, otp, "EX", OTP_TTL_SECONDS);
  await redis.set(`${key}:attempts`, "0", "EX", OTP_TTL_SECONDS);
}

export async function verifyOTP(email: string, otp: string): Promise<{ valid: boolean; reason?: string }> {
  const key = `otp:${email.toLowerCase()}`;
  const attemptsKey = `${key}:attempts`;

  const attempts = await redis.get(attemptsKey);
  if (attempts && parseInt(attempts, 10) >= MAX_ATTEMPTS) {
    await redis.del(key, attemptsKey);
    return { valid: false, reason: "Too many attempts. Request a new code." };
  }

  const storedOTP = await redis.get(key);
  if (!storedOTP) {
    return { valid: false, reason: "Code expired or not found. Request a new one." };
  }

  if (storedOTP !== otp) {
    await redis.incr(attemptsKey);
    const remaining = MAX_ATTEMPTS - parseInt(await redis.get(attemptsKey) || "0", 10);
    return { valid: false, reason: `Invalid code. ${remaining} attempts remaining.` };
  }

  await redis.del(key, attemptsKey);
  return { valid: true };
}
