import { client } from '@frontend/lib/client'
import type { InferResponseType } from 'hono/client'

export type AuthenticatedUser = InferResponseType<
  typeof client.users.me.$get,
  200
>

export const getAuthenticatedUser = async (): Promise<
  AuthenticatedUser | undefined
> => {
  const response = await client.users.me.$get()

  if (!response.ok) {
    return
  }

  const user = await response.json()
  return user
}

const fetchCurrentUser = async (): Promise<AuthenticatedUser | null> => {
  const user = await getAuthenticatedUser()
  return user ?? null
}

export const currentUserQueryOptions = () => ({
  queryKey: ['current-user'] as const,
  queryFn: fetchCurrentUser,
  retry: false,
  staleTime: 5 * 60 * 1000,
})
