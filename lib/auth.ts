import bcrypt from "bcryptjs"
import crypto from "crypto"

export function hashPassword(password: string): string {
  const saltRounds = 10
  const salt = bcrypt.genSaltSync(saltRounds)
  return bcrypt.hashSync(password, salt)
}

export function verifyPassword(password: string, hash: string): boolean {
  try {
    return bcrypt.compareSync(password, hash)
  } catch {
    return false
  }
}

export function generateSessionToken(): string {
  return crypto.randomBytes(32).toString("hex")
}
