import { createHash, randomBytes } from 'crypto'
import { EntityManager, getManager } from 'typeorm'
import { createRefreshToken, REFRESH_TOKEN_EXPIRES_IN_MS, verifyRefreshToken } from './auth'
import { RefreshTokenSession } from './entity/RefreshTokenSession'
import { User } from './entity/User'

export interface IssuedRefreshToken {
  token: string
  session: RefreshTokenSession
}

export interface RotatedRefreshToken extends IssuedRefreshToken {
  user: User
}

const createOpaqueId = () => randomBytes(32).toString('hex')

export const hashRefreshToken = (token: string) => {
  return createHash('sha256').update(token).digest('hex')
}

const createExpiresAt = () => new Date(Date.now() + REFRESH_TOKEN_EXPIRES_IN_MS)

const createStoredRefreshToken = async (
  manager: EntityManager,
  user: User,
  tokenFamilyId = createOpaqueId()
): Promise<IssuedRefreshToken> => {
  const jti = createOpaqueId()
  const token = createRefreshToken(user, jti)
  const session = manager.create(RefreshTokenSession, {
    userId: user.id,
    jti,
    tokenHash: hashRefreshToken(token),
    tokenFamilyId,
    revokedAt: null,
    replacedByTokenId: null,
    expiresAt: createExpiresAt()
  })

  await manager.save(session)

  return { token, session }
}

export const issueRefreshTokenSession = async (user: User): Promise<IssuedRefreshToken> => {
  return getManager().transaction(manager => createStoredRefreshToken(manager, user))
}

const revokeTokenFamily = async (manager: EntityManager, tokenFamilyId: string) => {
  await manager
    .createQueryBuilder()
    .update(RefreshTokenSession)
    .set({ revokedAt: new Date() })
    .where('"tokenFamilyId" = :tokenFamilyId', { tokenFamilyId })
    .andWhere('"revokedAt" IS NULL')
    .execute()
}

export const revokeAllRefreshTokenSessionsForUser = async (userId: number) => {
  await getManager()
    .createQueryBuilder()
    .update(RefreshTokenSession)
    .set({ revokedAt: new Date() })
    .where('"userId" = :userId', { userId })
    .andWhere('"revokedAt" IS NULL')
    .execute()
}

export const revokeRefreshTokenFamilyForToken = async (token: string) => {
  try {
    const payload = verifyRefreshToken(token)

    await getManager().transaction(async manager => {
      const session = await manager.findOne(RefreshTokenSession, { where: { jti: payload.jti } })

      if (session) {
        await revokeTokenFamily(manager, session.tokenFamilyId)
      }
    })
  } catch {
    // Invalid or expired tokens have no trusted family to revoke. The cookie will still be cleared.
  }
}

export const rotateRefreshToken = async (token: string): Promise<RotatedRefreshToken | null> => {
  const payload = verifyRefreshToken(token)
  const tokenHash = hashRefreshToken(token)

  return getManager().transaction(async manager => {
    const session = await manager.findOne(RefreshTokenSession, {
      where: { jti: payload.jti },
      lock: { mode: 'pessimistic_write' }
    })

    if (!session) {
      return null
    }

    if (session.revokedAt) {
      await revokeTokenFamily(manager, session.tokenFamilyId)
      return null
    }

    if (session.tokenHash !== tokenHash || session.userId !== payload.userId || session.expiresAt <= new Date()) {
      await revokeTokenFamily(manager, session.tokenFamilyId)
      return null
    }

    const user = await manager.findOne(User, payload.userId)

    if (!user || user.tokenVersion !== payload.tokenVersion) {
      await revokeTokenFamily(manager, session.tokenFamilyId)
      return null
    }

    const replacement = await createStoredRefreshToken(manager, user, session.tokenFamilyId)
    session.revokedAt = new Date()
    session.replacedByTokenId = replacement.session.id
    await manager.save(session)

    return {
      token: replacement.token,
      session: replacement.session,
      user
    }
  })
}
