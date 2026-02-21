import { currentUserQueryOptions } from '@frontend/repositories/user'
import { useQuery } from '@tanstack/react-query'

export const useUser = () => useQuery(currentUserQueryOptions())
