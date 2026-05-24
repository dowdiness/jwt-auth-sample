import { strict as assert } from 'assert'
import { IncomingHttpHeaders } from 'http'

process.env.CORS_ORIGIN = 'http://localhost:3000,https://app.example.com'
process.env.NODE_ENV = 'production'
delete process.env.ALLOW_MISSING_ORIGIN_IN_DEV
delete process.env.FETCH_METADATA_CROSS_SITE_ALLOW_ORIGINS

const {
  isAllowedOrigin,
  validateStateChangingRequestOrigin
} = require('../src/requestSecurity') as typeof import('../src/requestSecurity')

const request = (headers: IncomingHttpHeaders, method = 'POST') => ({
  method,
  headers
})

assert.equal(isAllowedOrigin('http://localhost:3000'), true)
assert.equal(isAllowedOrigin('https://app.example.com'), true)
assert.equal(isAllowedOrigin('https://evil.example.com'), false)

assert.equal(
  validateStateChangingRequestOrigin(request({ origin: 'http://localhost:3000' })),
  undefined
)

assert.equal(
  validateStateChangingRequestOrigin(request({ referer: 'https://app.example.com/account' })),
  undefined
)

assert.equal(
  validateStateChangingRequestOrigin(request({ origin: 'https://evil.example.com' })),
  'origin is not allowed'
)

assert.equal(
  validateStateChangingRequestOrigin(request({ referer: 'not a url' })),
  'referer is not allowed'
)

assert.equal(
  validateStateChangingRequestOrigin(request({})),
  'origin or referer is required'
)

process.env.NODE_ENV = 'development'
process.env.ALLOW_MISSING_ORIGIN_IN_DEV = 'true'

assert.equal(
  validateStateChangingRequestOrigin(request({})),
  undefined
)

process.env.NODE_ENV = 'production'
process.env.ALLOW_MISSING_ORIGIN_IN_DEV = 'true'

assert.equal(
  validateStateChangingRequestOrigin(request({})),
  'origin or referer is required'
)

assert.equal(
  validateStateChangingRequestOrigin(request({
    origin: 'http://localhost:3000',
    'sec-fetch-site': 'cross-site'
  })),
  'cross-site requests are not allowed'
)

process.env.FETCH_METADATA_CROSS_SITE_ALLOW_ORIGINS = 'http://localhost:3000'

assert.equal(
  validateStateChangingRequestOrigin(request({
    origin: 'http://localhost:3000',
    'sec-fetch-site': 'cross-site'
  })),
  undefined
)

assert.equal(
  validateStateChangingRequestOrigin(request({
    origin: ['http://localhost:3000'] as unknown as string
  })),
  'invalid security header'
)

console.log('requestSecurity tests passed')
