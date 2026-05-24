import { User } from './entity/User'
import { sign, verify } from 'jsonwebtoken'

export const JWT_ISSUER = 'jwt-auth-sample'
export const ACCESS_TOKEN_AUDIENCE = 'jwt-auth-sample-access'
export const REFRESH_TOKEN_AUDIENCE = 'jwt-auth-sample-refresh'
export const JWT_ALGORITHM = 'HS256'
export const REFRESH_TOKEN_EXPIRES_IN_MS = 7 * 24 * 60 * 60 * 1000

export interface AccessTokenPayload {
  userId: number
}

export interface RefreshTokenPayload extends AccessTokenPayload {
  tokenVersion: number
  jti: string
}

const isObjectPayload = (payload: unknown): payload is Record<string, unknown> => {
  return typeof payload === 'object' && payload !== null && !Array.isArray(payload)
}

const verifyTokenPayload = (token: string, secret: string, audience: string) => {
  const payload = verify(token, secret, {
    issuer: JWT_ISSUER,
    audience,
    algorithms: [JWT_ALGORITHM]
  })

  if (!isObjectPayload(payload)) {
    throw new Error('invalid token payload')
  }

  return payload
}

const readUserId = (payload: Record<string, unknown>) => {
  const userId = payload.userId

  if (typeof userId !== 'number') {
    throw new Error('invalid token payload')
  }

  return userId
}

export const createAccessToken = (user: User) => {
  return sign({ userId: user.id }, process.env.ACCESS_TOKEN_SECRET!, {
    expiresIn: '15m',
    issuer: JWT_ISSUER,
    audience: ACCESS_TOKEN_AUDIENCE,
    algorithm: JWT_ALGORITHM
  })
}

export const createRefreshToken = (user: User, jti: string) => {
  return sign(
    { userId: user.id, tokenVersion: user.tokenVersion, jti }, process.env.REFRESH_TOKEN_SECRET!, {
      expiresIn: '7d',
      issuer: JWT_ISSUER,
      audience: REFRESH_TOKEN_AUDIENCE,
      algorithm: JWT_ALGORITHM
    })
}

export const verifyAccessToken = (token: string): AccessTokenPayload => {
  const payload = verifyTokenPayload(token, process.env.ACCESS_TOKEN_SECRET!, ACCESS_TOKEN_AUDIENCE)

  return {
    userId: readUserId(payload)
  }
}

export const verifyRefreshToken = (token: string): RefreshTokenPayload => {
  const payload = verifyTokenPayload(token, process.env.REFRESH_TOKEN_SECRET!, REFRESH_TOKEN_AUDIENCE)
  const tokenVersion = payload.tokenVersion
  const jti = payload.jti

  if (typeof tokenVersion !== 'number' || typeof jti !== 'string') {
    throw new Error('invalid token payload')
  }

  return {
    userId: readUserId(payload),
    tokenVersion,
    jti
  }
}
