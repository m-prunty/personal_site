/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Image assets are imported as URL strings (via Vite's default asset handling,
// or from /public with an absolute path like `import Logo from "/logo.svg"`).
declare module "*.svg" {
  const src: string;
  export default src;
}

declare module "*.jpg" {
  const src: string;
  export default src;
}

declare module "*.jpeg" {
  const src: string;
  export default src;
}

declare module "*.png" {
  const src: string;
  export default src;
}

declare module "*.webp" {
  const src: string;
  export default src;
}

// .md files are pulled in as raw text via `assetsInclude` in vite.config.ts
declare module "*.md" {
  const src: string;
  export default src;
}
