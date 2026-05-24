import { Request } from 'express'

const STATE_CHANGING_METHODS = ['POST', 'PUT', 'DELETE', 'PATCH']

const readBooleanEnv = (name: string): boolean => {
  const value = process.env[name]
  return value === '1' || value === 'true' || value === 'yes'
}

const normalizeOrigin = (origin: string): string => {
  try {
    return new URL(origin).origin
  } catch {
    return origin
  }
}

export const DEFAULT_CLIENT_ORIGIN = normalizeOrigin('http://localhost:3000')

const readConfiguredOrigins = (name: string): string[] => {
  return (process.env[name] || '')
    .split(',')
    .map(origin => origin.trim())
    .filter(Boolean)
    .map(normalizeOrigin)
}

export const allowedOrigins = (() => {
  const origins = readConfiguredOrigins('CORS_ORIGIN')
  return origins.length > 0 ? origins : [DEFAULT_CLIENT_ORIGIN]
})()

export const corsOrigin = allowedOrigins.length === 1 ? allowedOrigins[0] : allowedOrigins

const readSingleHeader = (value: string | string[] | undefined): string | undefined => {
  if (!value || Array.isArray(value)) {
    return undefined
  }

  return value
}

const originFromReferer = (referer: string): string | undefined => {
  try {
    return new URL(referer).origin
  } catch {
    return undefined
  }
}

export const isAllowedOrigin = (origin: string | undefined): boolean => {
  if (!origin) return false
  return allowedOrigins.includes(origin)
}

const getRequestOrigin = (req: Request): string | undefined => {
  const origin = readSingleHeader(req.headers.origin)

  if (origin) {
    return origin
  }

  const referer = readSingleHeader(req.headers.referer)
  return referer ? originFromReferer(referer) : undefined
}

const isMissingOriginAllowed = (): boolean => {
  return process.env.NODE_ENV !== 'production' && readBooleanEnv('ALLOW_MISSING_ORIGIN_IN_DEV')
}

const isFetchMetadataCrossSiteAllowed = (origin: string | undefined): boolean => {
  if (!origin) return false

  const whitelist = readConfiguredOrigins('FETCH_METADATA_CROSS_SITE_ALLOW_ORIGINS')
  return whitelist.includes(origin)
}

export const validateStateChangingRequestOrigin = (req: Request): string | undefined => {
  if (
    Array.isArray(req.headers.origin) ||
    Array.isArray(req.headers.referer) ||
    Array.isArray(req.headers['sec-fetch-site'])
  ) {
    return 'invalid security header'
  }

  const secFetchSite = readSingleHeader(req.headers['sec-fetch-site'])
  const method = req.method.toUpperCase()
  const requestOrigin = getRequestOrigin(req)

  if (
    secFetchSite === 'cross-site' &&
    STATE_CHANGING_METHODS.includes(method) &&
    !isFetchMetadataCrossSiteAllowed(requestOrigin)
  ) {
    return 'cross-site requests are not allowed'
  }

  const origin = readSingleHeader(req.headers.origin)
  const referer = readSingleHeader(req.headers.referer)

  if (origin) {
    return isAllowedOrigin(origin) ? undefined : 'origin is not allowed'
  }

  if (referer) {
    const refererOrigin = originFromReferer(referer)
    return isAllowedOrigin(refererOrigin) ? undefined : 'referer is not allowed'
  }

  return isMissingOriginAllowed() ? undefined : 'origin or referer is required'
}
