interface EnvironmentVariables {
  readonly NEXT_PUBLIC_APP_ENV: 'production' | 'development'
  readonly NEXT_PUBLIC_APP_NAME: string
  readonly NEXT_PUBLIC_APP_URL: string
  readonly NEXT_PUBLIC_PRIVATE_KEY: `0x${string}`

  //service account đọc / ghi Google Sheets + Docs cho /economy (server only)
  readonly GOOGLE_SERVICE_ACCOUNT_EMAIL: string
  readonly GOOGLE_PRIVATE_KEY: string
  readonly GOOGLE_ECONOMY_SHEET_ID: string
  readonly GOOGLE_ECONOMY_DOC_ID: string
}

declare namespace NodeJS {
  interface ProcessEnv extends EnvironmentVariables {}
}
