import type { Context } from 'hono'
import { deleteCookie, getCookie, setCookie } from 'hono/cookie'

import type { Dayjs } from './date'

const secureCookiePrefix = '__Host-Http'

const commonCookieParams: Parameters<typeof setCookie>[3] = {
  secure: true,
  httpOnly: true,
  path: '/',
  sameSite: 'Lax',
}

export const setSecureCookie = (
  c: Context,
  props: {
    name: string
    value: string
    now: Dayjs
    maxAge: number
  },
) => {
  const cookieName = `${secureCookiePrefix}-${props.name}`

  setCookie(c, cookieName, props.value, {
    ...commonCookieParams,
    expires: props.now.add(props.maxAge, 'second').toDate(),
    maxAge: props.maxAge,
  })
}

export const deleteSecureCookie = (
  c: Context,
  name: string,
): string | undefined => {
  const cookieName = `${secureCookiePrefix}-${name}`

  return deleteCookie(c, cookieName, commonCookieParams)
}

export const getSecureCookie = (c: Context, name: string) => {
  const cookieName = `${secureCookiePrefix}-${name}`

  return getCookie(c, cookieName)
}
