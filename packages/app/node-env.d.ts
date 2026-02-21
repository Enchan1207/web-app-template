declare namespace NodeJS {
  interface ProcessEnv {
    readonly CLOUDFLARE_ACCOUNT_ID: string
    readonly CLOUDFLARE_API_TOKEN: string
  }
}
