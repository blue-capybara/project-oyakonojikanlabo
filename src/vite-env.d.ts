/// <reference types="vite/client" />

declare module '*.csv?raw' {
  const content: string;
  export default content;
}

interface ImportMetaEnv {
  readonly VITE_FEATURE_SHOW_COLLAB_SIGNUP?: string;
  readonly VITE_FEATURE_SHOW_PICO_SERVICES?: string;
  readonly VITE_FEATURE_SHOW_MEMBERSHIP?: string;
  readonly VITE_FEATURE_SHOW_HOME_GENERAL_EVENTS?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
