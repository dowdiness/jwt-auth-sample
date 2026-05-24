import { BaseEntity, Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm'

@Entity('refresh_token_sessions')
@Index(['userId'])
@Index(['tokenFamilyId'])
export class RefreshTokenSession extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column('int')
  userId: number

  @Column('text', { unique: true })
  jti: string

  @Column('text', { unique: true })
  tokenHash: string

  @Column('text')
  tokenFamilyId: string

  @Column('timestamp with time zone', { nullable: true })
  revokedAt: Date | null

  @Column('uuid', { nullable: true })
  replacedByTokenId: string | null

  @Column('timestamp with time zone')
  expiresAt: Date

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date
}
