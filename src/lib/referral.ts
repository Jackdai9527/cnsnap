export function generateReferralCode(email: string) {
  const prefix = email
    .split("@")[0]
    .replace(/[^a-zA-Z0-9]/g, "")
    .slice(0, 6)
    .toUpperCase()
    .padEnd(3, "U");
  return `${prefix}${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}
