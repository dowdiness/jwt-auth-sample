import { NextFunction, Request, Response } from 'express'
import { randomBytes } from 'crypto'

export const CSRF_COOKIE_NAME = '__Host-csrf'
export const CSRF_HEADER_NAME = 'x-csrf-token'
const CSRF_TOKEN_MAX_AGE = 7 * 24 * 60 * 60 * 1000

const csrfCookieBaseOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/'
} as const

const csrfCookieOptions = {
  ...csrfCookieBaseOptions,
  maxAge: CSRF_TOKEN_MAX_AGE
}

export const createCsrfToken = () => randomBytes(32).toString('hex')

export const sendCsrfToken = (res: Response, token = createCsrfToken()) => {
  res.cookie(CSRF_COOKIE_NAME, token, csrfCookieOptions)
  res.setHeader('X-CSRF-Token', token)
  return token
}

export const clearCsrfToken = (res: Response) => {
  res.clearCookie(CSRF_COOKIE_NAME, csrfCookieBaseOptions)
}

const readHeader = (req: Request): string | undefined => {
  const header = req.headers[CSRF_HEADER_NAME]

  if (!header || Array.isArray(header)) {
    return undefined
  }

  return header
}

export const csrfProtection = (req: Request, res: Response, next: NextFunction) => {
  const cookieToken = req.cookies[CSRF_COOKIE_NAME]
  const headerToken = readHeader(req)

  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    return res.status(403).send({ ok: false })
  }

  return next()
}
