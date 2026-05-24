import 'dotenv/config'
import 'reflect-metadata'
import express from 'express'
import { ApolloServer } from 'apollo-server-express'
import { buildSchema } from 'type-graphql'
import { UserResolver } from './UserResolver'
import { createConnection } from 'typeorm'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import fetch from 'node-fetch'
import { sendRefreshToken } from './sendRefreshToken'

const DEFAULT_CLIENT_ORIGIN = 'http://localhost:3000'
const configuredOrigins = (process.env.CORS_ORIGIN || DEFAULT_CLIENT_ORIGIN)
  .split(',')
  .map(origin => origin.trim())
  .filter(Boolean)
const allowedOrigins = configuredOrigins.length > 0 ? configuredOrigins : [DEFAULT_CLIENT_ORIGIN]
const corsOrigin = allowedOrigins.length === 1 ? allowedOrigins[0] : allowedOrigins

const isAllowedOrigin = (origin: string | string[] | undefined): boolean => {
  if (!origin) return true
  if (Array.isArray(origin)) return false
  return allowedOrigins.includes(origin)
}

(async () => {
  const app = express()
  app.use(cors({
    origin: corsOrigin,
    credentials: true
  }))
  app.use(cookieParser())
  app.get('/', (_req, res) => res.send('hello'))
  app.post('/refresh_token', async (req, res) => {
    if (!isAllowedOrigin(req.headers.origin)) {
      return res.status(403).send({ ok: false, accessToken: '' })
    }

    const token = req.cookies.jid
    if (!token) {
      return res.send({ ok: false, accessToken: '' })
    }

    try {
      // refresh tokenでaccess tokenを更新する
      const response = await fetch('http://localhost:8000/api/refresh_token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', refreshToken: token }
      })

      if (response.status !== 200) {
        // Keep the response body shape stable for existing TokenRefreshLink/client handling.
        return res.status(401).send({ ok: false, accessToken: '' })
      }

      const json = await response.json()

      if (!json.access_token || !json.refresh_token) {
        return res.status(401).send({ ok: false, accessToken: '' })
      }

      sendRefreshToken(res, json.refresh_token)
      return res.send({ ok: true, accessToken: json.access_token })
    } catch {
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
