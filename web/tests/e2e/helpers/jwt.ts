import jwt from 'jsonwebtoken'

const JWT_SECRET = 'test-jwt-secret-e2e'

export function createTestToken(userId: number): string {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' })
}
