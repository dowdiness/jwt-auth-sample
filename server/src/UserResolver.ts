import { Resolver, Query, Mutation, Arg, ObjectType, Field, Ctx, UseMiddleware } from 'type-graphql'
import { isAuth } from './isAuthMiddleware'
import { createAccessToken, verifyAccessToken } from './auth'
import { MyContext } from './MyContext'

import { hash, compare } from 'bcryptjs'
import { User } from './entity/User'
import { sendRefreshToken, clearRefreshToken, REFRESH_TOKEN_COOKIE_NAME } from './sendRefreshToken'
import { getConnection } from 'typeorm'
import { clearCsrfToken, sendCsrfToken } from './csrf'
import { logSanitizedError } from './logger'
import {
  issueRefreshTokenSession,
  revokeAllRefreshTokenSessionsForUser,
  revokeRefreshTokenFamilyForToken
} from './refreshTokenSession'

@ObjectType()
class LoginResponse {
  @Field()
  accessToken: string;

  @Field()
  user: User;
}

@Resolver()
export class UserResolver {
  @Query(() => String)
  hello () {
    return 'hi!'
  }

  @Query(() => String)
  @UseMiddleware(isAuth)
  bye (
    @Ctx() { payload }: MyContext
  ) {
    return `your user id is: ${payload?.userId}`
  }

  @Query(() => [User])
  @UseMiddleware(isAuth)
  users () {
    return User.find()
  }

  @Query(() => User, { nullable: true })
  me (
    @Ctx() context: MyContext
  ) {
    const authorization = context.req.headers.authorization

    if (!authorization) {
      return null
    }

    try {
      const token = authorization.split(' ')[1]
      const payload = verifyAccessToken(token)
      return User.findOne(payload.userId)
    } catch (err) {
      logSanitizedError('me query authentication failed', err)
      return null
    }
  }

  @Mutation(() => Boolean)
  async logout (
    @Ctx() { req, res }: MyContext
  ) {
    const token = req.cookies[REFRESH_TOKEN_COOKIE_NAME]

    if (token) {
      await revokeRefreshTokenFamilyForToken(token)
    }

    clearRefreshToken(res)
    clearCsrfToken(res)

    return true
  }

  @Mutation(() => Boolean)
  @UseMiddleware(isAuth)
  async revokeMyRefreshTokens (
    @Ctx() { payload }: MyContext
  ) {
    if (!payload?.userId) {
      throw new Error('not authenticated')
    }

    await getConnection().getRepository(User).increment({ id: payload.userId }, 'tokenVersion', 1)
    await revokeAllRefreshTokenSessionsForUser(payload.userId)

    return true
  }

  @Mutation(() => LoginResponse)
  async login (
    @Arg('email') email: string,
    @Arg('password') password: string,
    @Ctx() { res }: MyContext
  ): Promise<LoginResponse> {
    const user = await User.findOne({ where: { email } })

    if (!user) {
      throw new Error('could not find user')
    }

    const valid = await compare(password, user.password)

    if (!valid) {
      throw new Error('bad password')
    }

    const refreshToken = await issueRefreshTokenSession(user)

    sendRefreshToken(res, refreshToken.token)
    sendCsrfToken(res)

    return {
      accessToken: createAccessToken(user),
      user
    }
  }

  @Mutation(() => Boolean)
  async resister (@Arg('email') email: string, @Arg('password') password: string) {
    const hashedPassword = await hash(password, 12)

    try {
      await User.insert({
        email,
        password: hashedPassword
      })
    } catch (err) {
      logSanitizedError('register failed', err)
      return false
    }

    return true
  }
}
