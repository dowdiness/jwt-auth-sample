import 'dotenv/config'
import 'reflect-metadata'
import express from 'express'
import { ApolloServer } from 'apollo-server-express'
import { buildSchema } from 'type-graphql'
import { UserResolver } from './UserResolver'
import { createConnection } from 'typeorm'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import { createAccessToken } from './auth'
import { clearRefreshToken, REFRESH_TOKEN_COOKIE_NAME, sendRefreshToken } from './sendRefreshToken'
import { rotateRefreshToken } from './refreshTokenSession'
import { corsOrigin, validateStateChangingRequestOrigin } from './requestSecurity'
import { sendCsrfToken } from './csrf'
import { logSanitizedError } from './logger'

(async () => {
  const app = express()
  app.use(cors({
    origin: corsOrigin,
    credentials: true,
    exposedHeaders: ['X-CSRF-Token']
  }))
  app.use(cookieParser())
  app.get('/', (_req, res) => res.send('hello'))
  app.post('/refresh_token', async (req, res) => {
    const requestOriginError = validateStateChangingRequestOrigin(req)

    if (requestOriginError) {
      return res.status(403).send({ ok: false, accessToken: '' })
    }

    const token = req.cookies[REFRESH_TOKEN_COOKIE_NAME]
    if (!token) {
      return res.send({ ok: false, accessToken: '' })
    }

    try {
      const rotatedToken = await rotateRefreshToken(token)

      if (!rotatedToken) {
        clearRefreshToken(res)
        return res.status(401).send({ ok: false, accessToken: '' })
      }

      sendRefreshToken(res, rotatedToken.token)
      sendCsrfToken(res)
      return res.send({ ok: true, accessToken: createAccessToken(rotatedToken.user) })
    } catch (err) {
      logSanitizedError('refresh token rotation failed', err)
      clearRefreshToken(res)
      return res.status(401).send({ ok: false, accessToken: '' })
    }
  })
  await createConnection()

  const apolloServer = new ApolloServer({
    schema: await buildSchema({
      resolvers: [UserResolver]
    }),
    context: ({ req, res }) => ({ req, res })
  })
  apolloServer.applyMiddleware({ app, cors: false })
  app.listen(4000, () => {
    console.log('express server started')
  })
})()
