/**
 * セッションJWTの有効期限（秒）
 * @description JWTはこの期間後に期限切れとなり、セッションテーブルへの再検証が必要になります
 */
export const SESSION_JWT_AGE = 600

/**
 * セッションCookieの有効期限（秒）
 * @description SESSION_COOKIE_AGE > SESSION_JWT_AGE とすることで、JWTを短期ローテーションできます
 */
export const SESSION_COOKIE_AGE = 6000
