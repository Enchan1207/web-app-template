import type { Brand } from '@backend/lib/brand'
import { ulid } from 'ulid'

export type UserId = Brand<string, 'user_id'>

export type User = {
  id: UserId
  email: string
  idpIssuer: string
  idpSubject: string
}

export const createUser = (props: Omit<User, 'id'>): User => ({
  id: ulid() as UserId,
  email: props.email,
  idpIssuer: props.idpIssuer,
  idpSubject: props.idpSubject,
})
