import { MyContext } from './MyContext'
import { MiddlewareFn } from 'type-graphql'
import { verifyAccessToken } from './auth'
import { logSanitizedError } from './logger'

export const isAuth: MiddlewareFn<MyContext> = ({ context }, next) => {
  const authorization = context.req.headers.authorization

  if (!authorization) {
    throw new Error('not authenticated')
  }

  try {
    const token = authorization.split(' ')[1]
    context.payload = verifyAccessToken(token)
  } catch (err) {
    logSanitizedError('access token verification failed', err)
    throw new Error('not authenticated')
  }

  return next()
}
