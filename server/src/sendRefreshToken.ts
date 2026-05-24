import { Response } from 'express'

export const REFRESH_TOKEN_COOKIE_NAME = '__Host-jid'
export const REFRESH_TOKEN_COOKIE_PATH = '/'
export const REFRESH_TOKEN_MAX_AGE = 7 * 24 * 60 * 60 * 1000

const refreshTokenCookieBaseOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: REFRESH_TOKEN_COOKIE_PATH
} as const

const refreshTokenCookieOptions = {
  ...refreshTokenCookieBaseOptions,
  maxAge: REFRESH_TOKEN_MAX_AGE
}

export const sendRefreshToken = (res: Response, token: string) => {
  res.cookie(REFRESH_TOKEN_COOKIE_NAME, token, refreshTokenCookieOptions)
}

export const clearRefreshToken = (res: Response) => {
  res.clearCookie(REFRESH_TOKEN_COOKIE_NAME, refreshTokenCookieBaseOptions)
}
