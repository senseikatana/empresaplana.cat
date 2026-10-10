import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

export function hashPasskey(passkey: string): string {
	const salt = randomBytes(16).toString("hex");
	const hash = scryptSync(passkey, salt, 32).toString("hex");
	return `${salt}:${hash}`;
}

/**
 * Verify a passkey against a stored hash.
 * Supports two formats:
 *   - "salt:hash" (current scrypt format)
 *   - plain text (legacy fallback — compare as-is, constant-time)
 */
export function verifyPasskey(passkey: string, stored: string): boolean {
	const [salt, hash] = stored.split(":");
	if (!salt || !hash) {
		// Legacy plain-text passkey: compare via timingSafeEqual
		const a = new TextEncoder().encode(passkey);
		const b = new TextEncoder().encode(stored);
		if (a.length !== b.length) return false;
		return timingSafeEqual(a, b);
	}
	const candidate = scryptSync(passkey, salt, 32);
	const expected = Buffer.from(hash, "hex");
	return (
		candidate.length === expected.length && timingSafeEqual(candidate, expected)
	);
}
