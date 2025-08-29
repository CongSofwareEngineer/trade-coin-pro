interface EnvironmentVariables {
  readonly NEXT_PUBLIC_APP_ENV: 'production' | 'development'
  readonly NEXT_PUBLIC_APP_NAME: string
  readonly NEXT_PUBLIC_APP_URL: string
  readonly NEXT_PUBLIC_PRIVATE_KEY: `0x${string}`
}

declare namespace NodeJS {
  interface ProcessEnv extends EnvironmentVariables {}
}
