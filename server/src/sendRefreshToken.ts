import { Response } from 'express'

const REFRESH_TOKEN_COOKIE_NAME = 'jid'
const REFRESH_TOKEN_COOKIE_PATH = '/refresh_token'
const REFRESH_TOKEN_MAX_AGE = 7 * 24 * 60 * 60 * 1000

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
