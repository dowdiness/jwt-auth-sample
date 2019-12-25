import { isAuth } from './isAuthMiddleware'
import { createRefreshToken, createAccessToken } from './auth'
import { MyContext } from './MyContext'
import { Resolver, Query, Mutation, Arg, ObjectType, Field, Ctx, UseMiddleware } from 'type-graphql'
import { hash, compare } from 'bcryptjs'
import { User } from './entity/User'
import { sendRefreshToken } from './sendRefreshToken'

@ObjectType()
class LoginResponse {
  @Field()
  accessToken: string;
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
    console.log(payload)
    return `your user id is: ${payload?.userId}`
  }

  @Query(() => [User])
  users () {
    return User.find()
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

    sendRefreshToken(res, createRefreshToken(user))

    return {
      accessToken: createAccessToken(user)
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
      console.error(err)
      return false
    }

    return true
  }
}
