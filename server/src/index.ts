// import { User } from './entity/User'
// import { verify } from 'jsonwebtoken'
import 'dotenv/config'
import 'reflect-metadata'
import express from 'express'
import { ApolloServer } from 'apollo-server-express'
import { buildSchema } from 'type-graphql'
import { UserResolver } from './UserResolver'
import { createConnection } from 'typeorm'
import cookieParser from 'cookie-parser'
// import { createAccessToken, createRefreshToken } from './auth'
// import { sendRefreshToken } from './sendRefreshToken'
import cors from 'cors'
import fetch from 'node-fetch';

(async () => {
  const app = express()
  app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true
  }))
  app.use(cookieParser())
  app.get('/', (_req, res) => res.send('hello'))
  app.post('/refresh_token', async (req, res) => {
    const token = req.cookies.jid
    if (!token) {
      console.log('token is not found')
      return res.send({ ok: false, accessToken: '' })
    }
    // refresh tokenでaccess tokenを更新する
    try {
      // headersにrefresh_tokenを入れてエンドポイントにリクエストを送る。
      const response = await fetch('http://localhost:8000/api/refresh_token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', refreshToken: token }
      })

      const json = await response.json()
      if (response.status !== 200) throw new Error('response error')

      console.log('access_token: ', json.access_token)
      console.log('refresh_token: ', json.refresh_token)

      res.cookie('jid', json.refresh_token, {
        httpOnly: true
        // domain: '.a-yo.jp'
        // path: '/refresh_token'
      })
      return res.send({ ok: true, accessToken: json.access_token })
    } catch (error) {
      return res.send({ ok: false, accessToken: '' })
    }

    // let payload: any = null
    // try {
    //   payload = verify(token, process.env.REFRESH_TOKEN_SECRET!)
    // } catch (err) {
    //   console.error(err)
    //   return res.send({ ok: false, accessToken: '' })
    // }
    // const user = await User.findOne({ id: payload.userId })

    // if (!user) {
    //   console.log('user is not found')
    //   return res.send({ ok: false, accessToken: '' })
    // }

    // if (user.tokenVersion !== payload.tokenVersion) {
    //   console.log('tokenVersion is invalid')
    //   return res.send({ ok: false, accessToken: '' })
    // }

    // sendRefreshToken(res, createRefreshToken(user))
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
