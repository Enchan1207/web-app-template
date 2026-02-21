// NOTE: プラグイン等の設定を引き継ぐため、dayjsを直接importしない (-> @/logic/dayjs.ts)

import 'dayjs/locale/ja'

// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import dayjs from 'dayjs'
import isLeapYear from 'dayjs/plugin/isLeapYear'
import relativeTime from 'dayjs/plugin/relativeTime'
import timezone from 'dayjs/plugin/timezone'
import utc from 'dayjs/plugin/utc'
import z from 'zod'

export const TimestampSchema = z
  .number()
  .int()
  .min(0)
  .max(253402268399999) // 9999-12-31T23:59:59.999Z
  .brand('timestamp')
export type Timestamp = z.infer<typeof TimestampSchema>

declare module 'dayjs' {
  interface Dayjs {
    timestamp(): Timestamp
  }
}

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(isLeapYear)
dayjs.extend(relativeTime)

// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
dayjs.prototype.timestamp = function () {
  return (this as dayjs.Dayjs).valueOf() as Timestamp
}

export default dayjs

// alias
export type Dayjs = dayjs.Dayjs
