import bcrypt from "bcryptjs";

const BCRYPT_SALT_ROUNDS = 12;

export async function hashPassword(plainPassword: string): Promise<string> {
  return bcrypt.hash(plainPassword, BCRYPT_SALT_ROUNDS);
}

export async function verifyPassword(hash: string, plainPassword: string): Promise<boolean> {
  try {
    return await bcrypt.compare(plainPassword, hash);
  } catch {
    return false;
  }
}
