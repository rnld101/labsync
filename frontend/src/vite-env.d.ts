/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APPOINTMENT_API?: string;
  readonly VITE_REPORT_API?: string;
  readonly VITE_COGNITO_USER_POOL_ID?: string;
  readonly VITE_COGNITO_APP_CLIENT_ID?: string;
  readonly VITE_COGNITO_DOMAIN?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
